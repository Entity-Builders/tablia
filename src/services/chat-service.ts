import type { ChatMessage, ChatPersona, ChatSession } from '../types';
import type { GoogleGenerativeAI as GoogleGenerativeAIClient } from '@google/generative-ai';
import { analytics } from './analytics';
import { getChatPersonaPrompt } from './chat-persona';
import { TABLIA_GEMINI_MODEL } from './gemini-config';
import { throwIfSupabaseError } from './supabase-errors';

/**
 * Fetch all chat sessions for a venue, ordered by most recent.
 * Used by the Dashboard to show real conversation history.
 */
export async function getChatSessions(venueId: string): Promise<ChatSession[]> {
  const { supabase } = await import('../lib/supabase');
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false })
    .limit(20);

  throwIfSupabaseError(error, 'No se pudieron cargar las conversaciones.');
  return (data || []) as ChatSession[];
}

/**
 * Save or update a chat session in the database.
 * Call this after each AI response to persist the conversation.
 */
export async function saveChatSession(
  sessionId: string | null,
  menuId: string,
  venueId: string,
  messages: ChatMessage[],
  customerEmail?: string,
): Promise<string> {
  const { supabase } = await import('../lib/supabase');

  if (sessionId) {
    // Update existing session
    const { error } = await supabase
      .from('chat_sessions')
      .update({ messages, updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    throwIfSupabaseError(error, 'No se pudo guardar la conversación.');
    return sessionId;
  }

  // Create new session
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      menu_id: menuId,
      venue_id: venueId,
      messages,
      customer_email: customerEmail || null,
    })
    .select('id')
    .single();

  throwIfSupabaseError(error, 'No se pudo crear la conversación.');
  if (!data) throw new Error('No se pudo crear la conversación.');
  return data.id;
}

// Lazy-load Gemini SDK — only downloaded when user actually sends a chat message
let genAI: GoogleGenerativeAIClient | null = null;
async function getGenAI(): Promise<GoogleGenerativeAIClient> {
  if (!genAI) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
  }
  return genAI;
}

/**
 * Build the system prompt with full menu context.
 */
export function buildSystemPrompt(
  venueName: string,
  menuContext: string,
  chatPersona?: ChatPersona,
): string {
  return `Eres el asistente virtual del restaurante "${venueName}" integrado en su menú digital.

TU PERSONALIDAD:
- Tu forma de hablar se define por el locutor configurado por el restaurante.
- Conocés TODO el menú del restaurante. Tus respuestas se basan EXCLUSIVAMENTE en los datos del menú.
- Sos conciso: 2-3 oraciones por respuesta. No hagas listas largas a menos que te pidan.
- Cuando recomendás, mencioná el precio. Cuando hablás de alergenos/tags, sé preciso.
- Si te preguntan algo que no sabés (horarios, dirección, delivery), decí amablemente que no tenés esa info.
- NUNCA inventés platos que no estén en el menú.
- No actúes como camarero tomando pedido. No preguntes "¿con qué lo acompañás?", "¿qué querés pedir?" ni cierres devolviendo una decisión abierta al comensal.
- Tu rol es curar y recomendar: ante pedidos como "algo para compartir", "qué me recomendás" o "qué va con esto", proponé una combinación concreta y explicá por qué.

LOCUTOR DEL ASISTENTE:
${getChatPersonaPrompt(chatPersona)}

MENÚ ACTUAL DEL RESTAURANTE:
${menuContext}

INSTRUCCIONES ADICIONALES:
- Si preguntan por opciones veganas/vegetarianas/sin-tacc, filtrá por los tags del menú.
- Si preguntan "¿qué me recomendás?", elegí 2-3 platos variados y armá una mini ruta: entrada, principal y/o postre.
- Si preguntan por compartir, sugerí una opción principal y una alternativa más liviana o más contundente.
- Si sugerís un plato, agregá vos el acompañamiento ideal usando items reales del menú. Si no hay acompañamiento claro, decí "lo dejaría solo" o sugerí otra opción del menú.
- Hacé preguntas de seguimiento solo si son imprescindibles por alergias, presupuesto o cantidad de personas. Preferí frases como "si son 2 iría por..." en vez de preguntar.
- No uses cierres tipo "¿Te pinta?", "¿con qué lo acompañás?" o "decime qué querés pedir". Cerrá con una sugerencia concreta.
- Respondé SIEMPRE en español.`;
}

/**
 * Format menu data into a readable text context for Gemini.
 */
export function buildMenuContext(
  categories: {
    name: string;
    items: {
      name: string;
      description?: string | null;
      price: number;
      currency: string;
      tags: string[];
    }[];
  }[],
): string {
  return categories
    .map((cat) => {
      const items = cat.items
        .map((item) => {
          const desc = item.description ? ` — ${item.description}` : '';
          const tags = item.tags.length > 0 ? ` [${item.tags.join(', ')}]` : '';
          const symbol =
            item.currency === 'USD'
              ? 'US$'
              : item.currency === 'EUR'
                ? '€'
                : '$';
          return `  • ${item.name}${desc}: ${symbol}${item.price}${tags}`;
        })
        .join('\n');
      return `📂 ${cat.name}\n${items}`;
    })
    .join('\n\n');
}

/**
 * Send a message to the AI chat assistant and get a response.
 * Includes full conversation history for multi-turn context.
 */
export async function sendChatMessage(
  venueSlug: string,
  venueName: string,
  menuContext: string,
  history: ChatMessage[],
  userMessage: string,
  chatPersona?: ChatPersona,
): Promise<string> {
  const ai = await getGenAI();
  const model = ai.getGenerativeModel({ model: TABLIA_GEMINI_MODEL });

  const systemPrompt = buildSystemPrompt(venueName, menuContext, chatPersona);

  // Build conversation parts: system + history + new message
  const contents = [
    { role: 'user' as const, parts: [{ text: systemPrompt }] },
    {
      role: 'model' as const,
      parts: [
        {
          text: `¡Hola! 👋 Soy el asistente de ${venueName}. Preguntame lo que quieras sobre nuestro menú — alergenos, recomendaciones, precios, combinaciones... ¡estoy para ayudarte!`,
        },
      ],
    },
  ];

  // Add conversation history
  for (const msg of history) {
    contents.push({
      role: msg.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: msg.content }],
    });
  }

  // Add the new user message
  contents.push({
    role: 'user' as const,
    parts: [{ text: userMessage }],
  });

  // Track user question for aggregate insights (top questions, chat usage)
  analytics.track('chat_message_sent', {
    slug: venueSlug,
    venue_name: venueName,
    message_length: userMessage.trim().length,
    message_position: history.length + 1, // 1st msg, 2nd msg, etc.
  });

  const result = await model.generateContent({ contents });
  return result.response.text();
}
