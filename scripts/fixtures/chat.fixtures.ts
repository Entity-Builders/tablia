/**
 * Chat conversation fixtures for seeds.
 * Realistic conversations of guests asking about the menu.
 */
import type { ChatMessage } from '../../src/types.ts';

// A realistic 4-turn conversation from a first-time guest
export const CONVERSATION_CURIOUS: ChatMessage[] = [
  {
    role: 'user',
    content: '¿Qué me recomendás para arrancar?',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    role: 'assistant',
    content:
      '¡Hola! Para arrancar bien, te recomiendo la **Provoleta** 🧀 — con orégano y tomate cherry, es perfecta para compartir mientras esperan la parrilla. También las **Empanadas de carne x6** son un clásico de la casa, muy jugosas. ¿Vienen en grupo o son para dos?',
    timestamp: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
  },
  {
    role: 'user',
    content: 'Somos 4. ¿Con qué acompañamos el bife?',
    timestamp: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
  },
  {
    role: 'assistant',
    content:
      'Para 4 personas les recomiendo el **Bife de Chorizo 400g** para los carnívoros y el **Vacío a la parrilla** que rinde mucho más. Para tomar, van muy bien con una copa de **Malbec** 🍷 — tenemos de Mendoza cosecha 2022. ¿Tienen alguna preferencia de punto de cocción?',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
];

// A short veggie-focused conversation
export const CONVERSATION_VEGGIE: ChatMessage[] = [
  {
    role: 'user',
    content: 'Hay opciones vegetarianas?',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    role: 'assistant',
    content:
      'Tenemos la **Provoleta** 🧀 (queso a la parrilla) en entradas y podemos hacer tabla de quesos y fiambres. La parrilla es principalmente carnes, pero si querés algo más sustancioso podemos consultarle al chef por opciones del día. ¿Preferís que te avise si hay especial vegetariano hoy?',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
];

// A quick allergy check conversation
export const CONVERSATION_ALLERGY: ChatMessage[] = [
  {
    role: 'user',
    content: 'tenés algo sin gluten?',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    role: 'assistant',
    content:
      'Sí, la mayoría de nuestras carnes a la parrilla son naturalmente sin TACC 🥩. El **Bife de Chorizo**, el **Vacío** y el **Costillar de cerdo** no llevan marinadas con gluten. Las ensaladas y la provoleta también están bien. Lo que hay que tener cuidado son las empanadas (llevan masa). ¿Necesitás que consultemos con la cocina para confirmarlo?',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    role: 'user',
    content: 'Perfecto, gracias! Voy con el bife',
    timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
  },
  {
    role: 'assistant',
    content:
      '¡Excelente elección! 🔥 El **Bife de Chorizo 400g** es nuestra estrella. ¿A qué punto lo querés?',
    timestamp: new Date(Date.now() - 30 * 1000).toISOString(),
  },
];
