import type { ChatPersona, ChatPersonaId } from '../types';

export interface ChatPersonaOption {
  id: ChatPersonaId;
  label: string;
  description: string;
  prompt: string[];
}

export const DEFAULT_CHAT_PERSONA_ID: ChatPersonaId = 'curator';

export const CHAT_PERSONAS: ChatPersonaOption[] = [
  {
    id: 'curator',
    label: 'Curador cálido',
    description: 'Recomienda con claridad, sin sonar a mozo ni a venta.',
    prompt: [
      'Tono claro, cálido y gastronómico, con voseo suave.',
      'Elegí con criterio y cerrá con una recomendación concreta.',
      'Evitá slang exagerado como "es una bomba", "tremendo" o "¿te pinta?".',
    ],
  },
  {
    id: 'friendly',
    label: 'Cercano',
    description: 'Más informal y barrial, pero sin muletillas invasivas.',
    prompt: [
      'Tono cercano, amable y rioplatense natural.',
      'Podés usar frases simples y humanas, sin exagerar entusiasmo.',
      'No cierres con preguntas abiertas de pedido; sugerí el próximo paso.',
    ],
  },
  {
    id: 'sommelier',
    label: 'Experto gastronómico',
    description: 'Habla de sabores, maridajes y combinaciones.',
    prompt: [
      'Tono experto, sensorial y accesible, sin ponerse técnico de más.',
      'Cuando recomiendes, explicá textura, intensidad o contraste de sabores.',
      'Priorizá maridajes y acompañamientos reales del menú.',
    ],
  },
  {
    id: 'concise',
    label: 'Directo',
    description: 'Respuestas cortas para decidir rápido.',
    prompt: [
      'Tono directo, útil y sobrio.',
      'Respondé en 1 o 2 oraciones salvo que pidan detalle.',
      'Dá una recomendación principal y una alternativa, sin rodeos.',
    ],
  },
  {
    id: 'premium',
    label: 'Elegante',
    description: 'Más formal, cuidado y sereno para propuestas premium.',
    prompt: [
      'Tono elegante, sobrio y cuidado.',
      'Usá lenguaje más refinado y evitá modismos demasiado informales.',
      'Recomendá con seguridad, destacando equilibrio y experiencia.',
    ],
  },
];

const PERSONA_BY_ID = new Map(CHAT_PERSONAS.map((persona) => [persona.id, persona]));

export function isChatPersonaId(value: unknown): value is ChatPersonaId {
  return typeof value === 'string' && PERSONA_BY_ID.has(value as ChatPersonaId);
}

export function normalizeChatPersona(value: unknown): ChatPersona {
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    if (isChatPersonaId(id)) return { id };
  }

  if (isChatPersonaId(value)) return { id: value };

  return { id: DEFAULT_CHAT_PERSONA_ID };
}

export function getChatPersonaOption(value: unknown): ChatPersonaOption {
  const persona = normalizeChatPersona(value);
  return PERSONA_BY_ID.get(persona.id) ?? CHAT_PERSONAS[0];
}

export function getChatPersonaPrompt(value: unknown): string {
  const persona = getChatPersonaOption(value);
  return [
    `Locutor activo: ${persona.label}.`,
    ...persona.prompt.map((line) => `- ${line}`),
  ].join('\n');
}
