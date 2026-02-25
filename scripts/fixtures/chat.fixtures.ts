/**
 * Chat conversation fixtures for seeds.
 * Realistic conversations of guests asking about the menu.
 */
import type { ChatMessage } from '../../src/types.ts';

// Helper: timestamps going backwards from `minutesAgo` minutes
const ts = (minutesAgo: number) =>
  new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();

// ─────────────────────────────────────────────────
// 1. First-time guest exploring the full menu
// ─────────────────────────────────────────────────
export const CONVERSATION_CURIOUS: ChatMessage[] = [
  {
    role: 'user',
    content: '¿Qué me recomendás para arrancar?',
    timestamp: ts(120),
  },
  {
    role: 'assistant',
    content:
      '¡Hola! Para arrancar bien, te recomiendo la **Provoleta** 🧀 — con orégano y tomate cherry, es perfecta para compartir mientras esperan la parrilla. También las **Empanadas de carne x6** son un clásico de la casa, muy jugosas. ¿Vienen en grupo o son para dos?',
    timestamp: ts(119),
  },
  {
    role: 'user',
    content: 'Somos 4. ¿Con qué acompañamos el bife?',
    timestamp: ts(117),
  },
  {
    role: 'assistant',
    content:
      'Para 4 personas les recomiendo el **Bife de Chorizo 400g** para los carnívoros y el **Vacío a la parrilla** que rinde mucho más. Para tomar, van muy bien con una copa de **Malbec** 🍷 — tenemos de Mendoza cosecha 2022. ¿Tienen alguna preferencia de punto de cocción?',
    timestamp: ts(116),
  },
  {
    role: 'user',
    content: 'Jugoso por favor. ¿Y de postre hay algo?',
    timestamp: ts(114),
  },
  {
    role: 'assistant',
    content:
      '¡Perfecto, jugoso queda espectacular! Para postre tenemos **flan casero con dulce de leche** y **mousse de chocolate** 🍮. Son ideales para compartir entre dos si ya comieron bien. ¿Los reservo para después?',
    timestamp: ts(113),
  },
];

// ─────────────────────────────────────────────────
// 2. Short veggie-focused conversation
// ─────────────────────────────────────────────────
export const CONVERSATION_VEGGIE: ChatMessage[] = [
  {
    role: 'user',
    content: 'Hay opciones vegetarianas?',
    timestamp: ts(95),
  },
  {
    role: 'assistant',
    content:
      'Tenemos la **Provoleta** 🧀 (queso a la parrilla) en entradas y podemos hacer tabla de quesos y fiambres. La parrilla es principalmente carnes, pero si querés algo más sustancioso podemos consultarle al chef por opciones del día. ¿Preferís que te avise si hay especial vegetariano hoy?',
    timestamp: ts(94),
  },
];

// ─────────────────────────────────────────────────
// 3. Allergy / gluten-free check
// ─────────────────────────────────────────────────
export const CONVERSATION_ALLERGY: ChatMessage[] = [
  {
    role: 'user',
    content: 'tenés algo sin gluten?',
    timestamp: ts(80),
  },
  {
    role: 'assistant',
    content:
      'Sí, la mayoría de nuestras carnes a la parrilla son naturalmente sin TACC 🥩. El **Bife de Chorizo**, el **Vacío** y el **Costillar de cerdo** no llevan marinadas con gluten. Las ensaladas y la provoleta también están bien. Lo que hay que tener cuidado son las empanadas (llevan masa). ¿Necesitás que consultemos con la cocina para confirmarlo?',
    timestamp: ts(79),
  },
  {
    role: 'user',
    content: 'Perfecto, gracias! Voy con el bife',
    timestamp: ts(78),
  },
  {
    role: 'assistant',
    content:
      '¡Excelente elección! 🔥 El **Bife de Chorizo 400g** es nuestra estrella. ¿A qué punto lo querés?',
    timestamp: ts(77),
  },
];

// ─────────────────────────────────────────────────
// 4. Price inquiry — budget-conscious customer
// ─────────────────────────────────────────────────
export const CONVERSATION_PRICES: ChatMessage[] = [
  {
    role: 'user',
    content: '¿Cuánto sale comer para 2 personas más o menos?',
    timestamp: ts(60),
  },
  {
    role: 'assistant',
    content:
      'Para dos personas con una entrada, plato principal y bebida estimá entre **$22.000 y $28.000 ARS** dependiendo de los cortes que elijan. Un combo popular es: **Empanadas x6** ($2.400) + **Bife de Chorizo** ($8.500) + **Vacío** ($7.200) + dos copas de vino ($2.400) = ~$20.500. ¿Querés armar un menú personalizado?',
    timestamp: ts(59),
  },
  {
    role: 'user',
    content: '¿Hay algún plato del día o promoción?',
    timestamp: ts(57),
  },
  {
    role: 'assistant',
    content:
      'Hoy el chef recomienda el **Costillar de cerdo** con glaseado de miel y mostaza 🍖 — es el especial de la semana. Si pedís entrada + costillar + postre, preguntale al mozo por el menú ejecutivo que algunos días tiene precio especial. ¿Algo más que pueda ayudarte?',
    timestamp: ts(56),
  },
];

// ─────────────────────────────────────────────────
// 5. Delivery / takeaway inquiry
// ─────────────────────────────────────────────────
export const CONVERSATION_DELIVERY: ChatMessage[] = [
  {
    role: 'user',
    content: 'Hacen delivery?',
    timestamp: ts(45),
  },
  {
    role: 'assistant',
    content:
      'Por el momento nuestro servicio es solo en el salón 🏠. Podés hacer una reserva para que te guardemos la mejor mesa. ¿Para cuántas personas sería?',
    timestamp: ts(44),
  },
  {
    role: 'user',
    content: 'Somos 6, ¿tienen mesas grandes?',
    timestamp: ts(43),
  },
  {
    role: 'assistant',
    content:
      'Sí, tenemos mesas para grupos. Para 6 personas te recomendamos reservar con al menos 2 horas de anticipación, especialmente los fines de semana. ¿Para qué día estás pensando?',
    timestamp: ts(42),
  },
];

// ─────────────────────────────────────────────────
// 6. Quick wine pairing question
// ─────────────────────────────────────────────────
export const CONVERSATION_WINE: ChatMessage[] = [
  {
    role: 'user',
    content: 'Qué vino me recomendás con el costillar?',
    timestamp: ts(30),
  },
  {
    role: 'assistant',
    content:
      'El **Costillar de cerdo** con glaseado dulce pide vino con buena fruta. Nuestro **Malbec de Mendoza 2022** 🍷 funciona muy bien — su carácter frutado equilibra el glaseado de miel. Si preferís algo más fresco, tenemos varietales blancos para consultar con el sommelier. ¿Lo preferís en copa o botella?',
    timestamp: ts(29),
  },
  {
    role: 'user',
    content: 'En copa está bien. ¿Y para la provoleta?',
    timestamp: ts(28),
  },
  {
    role: 'assistant',
    content:
      'Para la **Provoleta** te va perfecto un blanco seco o un torrontés — tiene la acidez para cortar el queso graso. También funciona con un malbec joven. ¿Querés que te arme una selección de vinos para toda la mesa?',
    timestamp: ts(27),
  },
];

// ─────────────────────────────────────────────────
// 7. Kids menu inquiry
// ─────────────────────────────────────────────────
export const CONVERSATION_KIDS: ChatMessage[] = [
  {
    role: 'user',
    content: 'Tienen menú para chicos?',
    timestamp: ts(15),
  },
  {
    role: 'assistant',
    content:
      '¡Claro! Para los más chicos podemos armar una porción reducida de **milanesa** o **hamburguesa** que no están en la carta digital pero las prepara la cocina. También las **Empanadas** son ideales para ellos. Consultá con el mozo al llegar y te van a dar todas las opciones. ¿Cuántos chicos vienen?',
    timestamp: ts(14),
  },
];

// ─────────────────────────────────────────────────
// 9. Comparing cuts — which steak is better?
// ─────────────────────────────────────────────────
export const CONVERSATION_CUTS: ChatMessage[] = [
  {
    role: 'user',
    content: '¿Qué diferencia hay entre el bife de chorizo y la entraña?',
    timestamp: ts(170),
  },
  {
    role: 'assistant',
    content:
      'Buena pregunta 🥩 Son muy distintos. El **Bife de Chorizo** es un corte de lomo ancho, más compacto y con una capita de grasa que le da mucho sabor. La **Entraña fina** es un corte más fino y fibroso, con sabor intenso pero solo se sirve jugosa o a punto — si la pedís muy cocida pierde todo. ¿Cuál es tu preferencia de punto?',
    timestamp: ts(169),
  },
  {
    role: 'user',
    content: 'Me gusta a punto. ¿Cuál me recomendás entonces?',
    timestamp: ts(167),
  },
  {
    role: 'assistant',
    content:
      'Para punto te va mejor el **Bife de Chorizo** 💯 Aguanta bien la cocción sin perder jugosidad gracias a la grasa lateral. La entraña a punto puede quedar un poco seca. El bife también lleva chimichurri de la casa que queda espectacular.',
    timestamp: ts(166),
  },
];

// ─────────────────────────────────────────────────
// 10. Portions — how much food to order
// ─────────────────────────────────────────────────
export const CONVERSATION_PORTIONS: ChatMessage[] = [
  {
    role: 'user',
    content: 'Las empanadas son para uno solo o para compartir?',
    timestamp: ts(155),
  },
  {
    role: 'assistant',
    content:
      'Las **Empanadas x6** son perfectas para compartir entre 2 personas como entrada 🥟 Si vienen solos y tienen buen apetito, también entran como entrada individual antes de un plato principal liviano. ¿Van a pedir principal después?',
    timestamp: ts(154),
  },
  {
    role: 'user',
    content: 'Si, voy con el vacío. ¿Es grande la porción?',
    timestamp: ts(152),
  },
  {
    role: 'assistant',
    content:
      'El **Vacío a la parrilla** es una porción generosa, entre 350-400g de carne neta 🍖 Con las empanadas de entrada ya es bastante comida. Si querés acompañamiento extra como papas, te recomendaría saltear las empanadas o compartirlas.',
    timestamp: ts(151),
  },
  {
    role: 'user',
    content: 'Mejor comparto las empanadas entonces, gracias!',
    timestamp: ts(150),
  },
  {
    role: 'assistant',
    content: '¡Excelente plan! 🙌 Van a quedar muy bien. ¿Querés agregar algo para tomar?',
    timestamp: ts(149),
  },
];

// ─────────────────────────────────────────────────
// 11. Cooking method curiosity
// ─────────────────────────────────────────────────
export const CONVERSATION_COOKING: ChatMessage[] = [
  {
    role: 'user',
    content: '¿La parrilla es a carbón o a gas?',
    timestamp: ts(140),
  },
  {
    role: 'assistant',
    content:
      '100% **a carbón** 🔥 Usamos quebracho colorado, que le da ese sabor ahumado característico. Por eso los cortes tardan un poco más que en parrillas a gas, pero el resultado no tiene comparación. ¿Hay algún corte que te llame la atención?',
    timestamp: ts(139),
  },
  {
    role: 'user',
    content: '¿El costillar cuánto tiempo tarda?',
    timestamp: ts(137),
  },
  {
    role: 'assistant',
    content:
      'El **Costillar de cerdo** va entre 35-45 minutos porque lo hacemos a fuego lento para que quede tierno por dentro y crocante por fuera 🐷 El glaseado de miel y mostaza se aplica en los últimos 10 minutos para que caramelice. Vale la pena esperar!',
    timestamp: ts(136),
  },
];

// ─────────────────────────────────────────────────
// 12. Dessert focused conversation
// ─────────────────────────────────────────────────
export const CONVERSATION_DESSERT: ChatMessage[] = [
  {
    role: 'user',
    content: 'Qué postres tienen?',
    timestamp: ts(50),
  },
  {
    role: 'assistant',
    content:
      '¡Tenemos cuatro opciones! 🍮\n- **Flan casero** con dulce de leche y crema (el más pedido)\n- **Mousse de chocolate** oscuro con coulis de frambuesa\n- **Tabla de quesos** con brie, reggianito y membrillo\n- **Helado artesanal** de dulce de leche, chocolate, crema o frutilla (2 bochas)\n¿Algo en particular te tienta?',
    timestamp: ts(49),
  },
  {
    role: 'user',
    content: 'El flan es casero de verdad o viene enlatado?',
    timestamp: ts(47),
  },
  {
    role: 'assistant',
    content:
      '¡Casero de verdad! 🙋 Lo hace la cocina todos los días. Lleva huevos, leche, azúcar y vainilla natural — sin conservantes. El dulce de leche es repostero, no el de untar. Es de los favoritos de los habitués. ¿Lo pedimos para el final?',
    timestamp: ts(46),
  },
];

// ─────────────────────────────────────────────────
// 13. Ingredient inquiry — what's in the chimichurri?
// ─────────────────────────────────────────────────
export const CONVERSATION_CHIMICHURRI: ChatMessage[] = [
  {
    role: 'user',
    content: '¿Qué lleva el chimichurri?',
    timestamp: ts(35),
  },
  {
    role: 'assistant',
    content:
      'El chimichurri de la casa es una receta de los años 80 que guardamos con celo 😄 Básicamente lleva **perejil, orégano, ajo, ají molido, vinagre de manzana y aceite de girasol**. No lleva picante excesivo, es suave y aromático. ¿Sos fan del chimichurri?',
    timestamp: ts(34),
  },
  {
    role: 'user',
    content: 'Sí! Me encanta, lo puedo pedir aparte?',
    timestamp: ts(32),
  },
  {
    role: 'assistant',
    content:
      '¡Por supuesto! 🫙 Pedile al mozo un pocillo extra de chimichurri, te lo traen con gusto. También tenemos **salsa criolla** (tomate, cebolla y morrón en cubitos) si querés probar algo diferente.',
    timestamp: ts(31),
  },
];

// ─────────────────────────────────────────────────
// 14. Molleja curiosity — first timer
// ─────────────────────────────────────────────────
export const CONVERSATION_MOLLEJA: ChatMessage[] = [
  {
    role: 'user',
    content: '¿Qué es la molleja exactamente?',
    timestamp: ts(22),
  },
  {
    role: 'assistant',
    content:
      'La **molleja** es la glándula del timo/páncreas del vacuno — es una casquería muy típica de la parrilla argentina 🥩 Tiene una textura muy particular: crocante por fuera y cremosa por dentro cuando está bien hecha a la parrilla. A quien no la probó nunca le suele sorprender muy bien. ¿Nunca la comiste?',
    timestamp: ts(21),
  },
  {
    role: 'user',
    content: 'No, nunca. ¿Se puede pedir de entrada para probar?',
    timestamp: ts(19),
  },
  {
    role: 'assistant',
    content:
      '¡Claro! Es un excelente formato de entrada para probarlo sin compromiso 🎉 Te recomiendo pedirla **bien doradita** para que la capa exterior quede súper crocante. Va muy bien con unas gotas de limón y el chimichurri de la casa. Si te gusta, después la pedís de parrillada completa.',
    timestamp: ts(18),
  },
];

// ─────────────────────────────────────────────────
// 8. Longer multi-topic conversation (simulates high engagement)
// ─────────────────────────────────────────────────
export const CONVERSATION_ENGAGED: ChatMessage[] = [
  {
    role: 'user',
    content: 'Hola! Primera vez que vengo, ¿qué es lo más pedido?',
    timestamp: ts(200),
  },
  {
    role: 'assistant',
    content:
      '¡Bienvenido! 🎉 Lo más pedido con diferencia es el **Bife de Chorizo 400g** — jugoso, con chimichurri de la casa, es el plato emblema. En entradas, las **Empanadas de carne** vuelan. ¿Ya tenés idea de qué querés tomar?',
    timestamp: ts(199),
  },
  {
    role: 'user',
    content: 'Algo sin alcohol, ¿qué tienen?',
    timestamp: ts(197),
  },
  {
    role: 'assistant',
    content:
      'Tenemos **agua mineral**, **gaseosas** (Coca Cola, Sprite, Fanta) y **limonadas naturales** del día. ¿Querés algo con o sin gas?',
    timestamp: ts(196),
  },
  {
    role: 'user',
    content: 'Con gas está bien. ¿El costillar es muy grande?',
    timestamp: ts(194),
  },
  {
    role: 'assistant',
    content:
      'El **Costillar de cerdo** viene en media plancha, unas 4-5 costillas. Es abundante para una persona sola, pero perfecto para compartir entre dos si ya pidieron entrada. ¿Lo querés como plato personal o para compartir?',
    timestamp: ts(193),
  },
  {
    role: 'user',
    content: 'Para compartir. ¿Cuánto demora?',
    timestamp: ts(191),
  },
  {
    role: 'assistant',
    content:
      'El costillar tarda entre 25-35 minutos porque van a cocción lenta en la parrilla 🔥. Si te parece mucho esperar, podés pedir las entradas primero y así el tiempo pasa volando. ¿Querés empezar con algo?',
    timestamp: ts(190),
  },
  {
    role: 'user',
    content: 'Dale, poneme la provoleta y las empanadas',
    timestamp: ts(188),
  },
  {
    role: 'assistant',
    content:
      '¡Perfecto combo! 🧀🥟 **Provoleta** ($1.800) + **Empanadas x6** ($2.400) mientras esperan el costillar ($9.800). Total aproximado con la bebida: ~$15.800. ¿Algo más?',
    timestamp: ts(187),
  },
];
