import type { ChatMessage } from '../types';

// Lazy-load Gemini SDK — only downloaded when user actually sends a chat message
let genAI: any = null;
async function getGenAI() {
  if (!genAI) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
  }
  return genAI;
}

/**
 * Build the system prompt with full menu context.
 */
function buildSystemPrompt(venueName: string, menuContext: string): string {
  return `Eres el asistente virtual del restaurante "${venueName}" integrado en su menú digital.

TU PERSONALIDAD:
- Sos amigable, cálido y gastronómico. Hablás en español rioplatense informal (vos, usás, tenés).
- Conocés TODO el menú del restaurante. Tus respuestas se basan EXCLUSIVAMENTE en los datos del menú.
- Sos conciso: 2-3 oraciones por respuesta. No hagas listas largas a menos que te pidan.
- Cuando recomendás, mencioná el precio. Cuando hablás de alergenos/tags, sé preciso.
- Si te preguntan algo que no sabés (horarios, dirección, delivery), decí amablemente que no tenés esa info.
- NUNCA inventés platos que no estén en el menú.

MENÚ ACTUAL DEL RESTAURANTE:
${menuContext}

INSTRUCCIONES ADICIONALES:
- Si preguntan por opciones veganas/vegetarianas/sin-tacc, filtrá por los tags del menú.
- Si preguntan "¿qué me recomendás?", elegí 2-3 platos variados.
- Podés sugerir combinaciones (entrada + plato + postre).
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
  venueName: string,
  menuContext: string,
  history: ChatMessage[],
  userMessage: string,
): Promise<string> {
  const ai = await getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const systemPrompt = buildSystemPrompt(venueName, menuContext);

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

  const result = await model.generateContent({ contents });
  return result.response.text();
}
