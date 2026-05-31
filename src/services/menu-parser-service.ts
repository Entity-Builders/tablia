import { GoogleGenerativeAI } from '@google/generative-ai';
import { TABLIA_GEMINI_MODEL } from './gemini-config';
import type { ParsedMenu } from '../types';
import { normalizeParsedMenu } from './parsed-menu-normalizer';

const SYSTEM_PROMPT = `Eres un experto en gastronomía y procesamiento de menús de restaurantes. Tu trabajo es analizar texto de un menú y convertirlo en datos estructurados.

REGLAS:
- Responde SIEMPRE en formato JSON válido (sin markdown, sin backticks)
- Identifica TODAS las categorías/secciones del menú (Entradas, Platos principales, Pastas, Carnes, Bebidas, Postres, etc.)
- Para cada plato extrae: nombre, descripción (si existe), precio, moneda y tags
- Los tags pueden ser: vegano, vegetariano, sin-tacc, sin-gluten, picante, para-compartir, sin-lactosa, apto-celíaco, orgánico, casero
- Si hay un precio ambiguo o inexistente, usa 0 y marca confianza baja
- Detecta la moneda del contexto (ARS para pesos argentinos, USD para dólares, EUR para euros). Si no es claro, usa ARS
- Si un plato tiene variantes (tamaños, sabores, preparaciones), crea un item por variante pero el name debe ser único e incluir la variante entre paréntesis. Ejemplo: "Provoleta (morrones y rúcula)" y "Provoleta (cebolla y panceta)".
- No devuelvas dos items con el mismo name dentro de una misma categoría. Si parecen repetidos exactos, conservá uno solo. Si tienen distinto precio o descripción, son variantes y debés diferenciarlos en el name.
- Mantén el idioma original del menú
- No asignes tags por default. Usá tags solo cuando el menú lo indique o sea una inferencia gastronómica muy segura; si no hay evidencia, devolvé [].
- Si detectás el nombre del restaurante o tipo de cocina, incluyelo en metadata
- Extraé también el ADN visual del menú original en visual_style:
  - template: heritage, modern, botanical, night o minimal
  - Colores principales en HEX de 6 dígitos (#7a1830). Usá solo colores observados o muy cercanos al PDF/imagen.
  - heading_style: serif, sans, display o condensed
  - density: compact, comfortable o spacious
  - decorative_style: none, linework, ribbon, bordered o minimal
  - price_style: right-aligned, inline o badge
  - source_notes: breve explicación del estilo detectado
- Extraé cargos adicionales y notas de pie:
  - Servicio de mesa, cubierto, cargo de envío, mínimo por persona u otros cargos obligatorios van en additional_charges.
  - Textos legales, teléfonos, derechos reservados o notas generales del pie van en legal_notes.
- IMPORTANTE: Buscá también información de contacto en el menú (header, footer, márgenes, marcas de agua):
  - Teléfono, WhatsApp, dirección física
  - Redes sociales (Instagram, Facebook, TikTok)
  - Website, email
  - Nombre y clave de Wi-Fi (algunos restaurantes lo incluyen en la carta)
  - Si no encontrás alguno de estos datos, dejá el campo como null

FORMATO DE RESPUESTA (JSON):
{
  "categories": [
    {
      "name": "Nombre de la sección",
      "description": "Descripción opcional",
      "items": [
        {
          "name": "Nombre del plato",
          "description": "Descripción del plato si existe",
          "price": 1500,
          "currency": "ARS",
          "tags": ["vegetariano", "sin-tacc"]
        }
      ]
    }
  ],
  "metadata": {
    "restaurant_name": "Nombre si se detecta",
    "cuisine_type": "Tipo de cocina si se infiere",
    "confidence": 0.95
  },
  "contact_info": {
    "phone": "+5491112345678 o null",
    "address": "Dirección física o null",
    "instagram": "@handle sin URL completa o null",
    "facebook": "nombre de página o null",
    "tiktok": "@handle o null",
    "website": "URL completa o null",
    "wifi_name": "Nombre de la red o null",
    "wifi_password": "Clave del wifi o null",
    "whatsapp": "Número de WhatsApp o null"
  },
  "visual_style": {
    "template": "heritage",
    "primary_color": "#7a1830",
    "secondary_color": "#d9d2c4",
    "accent_color": "#9a203d",
    "background_color": "#fffdf8",
    "text_color": "#201915",
    "heading_style": "display",
    "density": "compact",
    "decorative_style": "ribbon",
    "price_style": "right-aligned",
    "source_notes": "Cabecera bordó, secciones en cintas y precios alineados a la derecha."
  },
  "additional_charges": [
    {
      "label": "Servicio de mesa",
      "price": 2400,
      "currency": "ARS",
      "description": null
    }
  ],
  "legal_notes": [
    "Todos los derechos reservados | La Boque de Palermo - Soler 5101 | Tel: 112873-0030"
  ]
}`;

const CATEGORIES_PROMPT = `Analiza este menú y devolvé SOLAMENTE la lista de secciones/categorías que encontrás, con su descripción si existe. También devolvé metadata y visual_style del menú original.

Responde SOLO con este formato JSON:
{
  "categories": [
    { "name": "Entradas", "description": null },
    { "name": "Platos Principales", "description": "Los platos incluyen guarnición" }
  ],
  "metadata": {
    "restaurant_name": "Nombre si se detecta",
    "cuisine_type": "Tipo de cocina",
    "confidence": 0.95
  },
  "visual_style": {
    "template": "heritage",
    "primary_color": "#7a1830",
    "secondary_color": "#d9d2c4",
    "accent_color": "#9a203d",
    "background_color": "#fffdf8",
    "text_color": "#201915",
    "heading_style": "display",
    "density": "compact",
    "decorative_style": "ribbon",
    "price_style": "right-aligned",
    "source_notes": "Breve explicación del estilo detectado"
  },
  "additional_charges": [
    { "label": "Servicio de mesa", "price": 2400, "currency": "ARS", "description": null }
  ],
  "legal_notes": [
    "Texto de pie o nota legal si existe"
  ]
}`;

function buildItemsPrompt(categoryNames: string[]): string {
  const list = categoryNames.map((n) => `"${n}"`).join(', ');
  return `Ahora extraé TODOS los platos/items de las siguientes secciones: ${list}

Para cada item extraé: name, description (null si no tiene), price (número), currency, tags (array de strings).
Si una sección tiene variantes con el mismo nombre base, cada name debe incluir la variante entre paréntesis. No repitas names idénticos.
No agregues tags por default; si no hay evidencia clara, usá [].

Responde SOLO con este formato JSON:
{
  "categories": [
    {
      "name": "Nombre de la sección",
      "items": [
        { "name": "Plato", "description": "desc o null", "price": 1500, "currency": "ARS", "tags": [] }
      ]
    }
  ]
}`;
}

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

/** MIME types Gemini accepts as inlineData for menu parsing. */
export const SUPPORTED_FILE_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'Imagen JPG',
  'image/png': 'Imagen PNG',
  'image/webp': 'Imagen WebP',
};

/** Max file size in bytes (10 MB). */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Items-per-batch when chunking large menus. */
const CATEGORY_BATCH_SIZE = 5;

/** Clean Gemini response and parse as JSON. */
function parseJsonResponse<T>(raw: string): T {
  // Strategy 1: Strip markdown fences and try parsing
  const cleaned = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Strategy 2: Extract the first JSON object {...} from the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        // fall through
      }
    }

    console.error('Failed to parse Gemini response:', raw.substring(0, 500));
    throw new Error(
      'No se pudo interpretar el menú. Intentá de nuevo o verificá el formato.',
    );
  }
}

function getModel() {
  return genAI.getGenerativeModel({
    model: TABLIA_GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  });
}

// ─── Single-shot parse (small menus) ────────────────────────────

async function parseSingleShot(
  contentParts: Parameters<
    ReturnType<typeof genAI.getGenerativeModel>['generateContent']
  >[0],
): Promise<ParsedMenu> {
  const model = getModel();
  const result = await model.generateContent(contentParts);

  // Check for truncation
  const candidate = result.response.candidates?.[0];
  if (candidate?.finishReason === 'MAX_TOKENS') {
    return null as unknown as ParsedMenu; // signal to use chunked approach
  }

  return normalizeParsedMenu(parseJsonResponse<ParsedMenu>(result.response.text()));
}

// ─── Chunked parse (large menus) ────────────────────────────────

interface CategorySkeleton {
  categories: { name: string; description?: string | null }[];
  metadata?: ParsedMenu['metadata'];
  visual_style?: ParsedMenu['visual_style'];
  additional_charges?: ParsedMenu['additional_charges'];
  legal_notes?: ParsedMenu['legal_notes'];
}

async function parseChunked(chatParts: any[]): Promise<ParsedMenu> {
  const model = getModel();

  // Phase 1: Extract category names only (small response)
  const chat = model.startChat();
  const catResult = await chat.sendMessage([
    ...chatParts,
    { text: CATEGORIES_PROMPT },
  ]);
  const skeleton = parseJsonResponse<CategorySkeleton>(
    catResult.response.text(),
  );
  const categoryNames = skeleton.categories.map((c) => c.name);

  console.log(
    `[menu-parser] Chunked parse: ${categoryNames.length} categories found. Fetching items in batches of ${CATEGORY_BATCH_SIZE}...`,
  );

  // Phase 2: Extract items in batches (using same chat so image stays in context)
  const allCategories: ParsedMenu['categories'] = [];

  for (let i = 0; i < categoryNames.length; i += CATEGORY_BATCH_SIZE) {
    const batch = categoryNames.slice(i, i + CATEGORY_BATCH_SIZE);
    const prompt = buildItemsPrompt(batch);

    const itemsResult = await chat.sendMessage(prompt);
    const parsed = parseJsonResponse<{ categories: ParsedMenu['categories'] }>(
      itemsResult.response.text(),
    );

    // Merge descriptions from skeleton
    for (const cat of parsed.categories) {
      const skeletonCat = skeleton.categories.find((s) => s.name === cat.name);
      if (skeletonCat?.description) {
        cat.description = skeletonCat.description;
      }
      allCategories.push(cat);
    }

    console.log(
      `[menu-parser] Batch ${Math.floor(i / CATEGORY_BATCH_SIZE) + 1}: extracted ${parsed.categories.length} categories`,
    );
  }

  return normalizeParsedMenu({
    categories: allCategories,
    metadata: skeleton.metadata,
    visual_style: skeleton.visual_style,
    additional_charges: skeleton.additional_charges,
    legal_notes: skeleton.legal_notes,
  });
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Parse raw menu text into structured categories + items using Gemini AI.
 * Automatically falls back to chunked parsing if the menu is too large.
 */
export async function parseMenuFromText(text: string): Promise<ParsedMenu> {
  const contentParts = [
    { text: SYSTEM_PROMPT },
    {
      text: `Analiza el siguiente menú y devuelve JSON estructurado:\n\n${text}`,
    },
  ];

  // Try single-shot first
  const result = await parseSingleShot(contentParts);
  if (result) return result;

  // Fallback to chunked
  console.log(
    '[menu-parser] Text menu too large, switching to chunked parsing...',
  );
  return parseChunked([
    { text: `${SYSTEM_PROMPT}\n\nMenú a analizar:\n\n${text}` },
  ]);
}

/**
 * Parse a menu file (PDF or image) into structured data using Gemini multimodal.
 * Uses chunked parsing via chat to handle large menus without hitting token limits.
 */
export async function parseMenuFromFile(file: File): Promise<ParsedMenu> {
  // Validate MIME type
  if (!SUPPORTED_FILE_TYPES[file.type]) {
    const supported = Object.values(SUPPORTED_FILE_TYPES).join(', ');
    throw new Error(`Formato no soportado. Formatos válidos: ${supported}`);
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `El archivo es demasiado grande (máx ${MAX_FILE_SIZE / 1024 / 1024} MB).`,
    );
  }

  // Read file as base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      '',
    ),
  );

  const inlineData = { mimeType: file.type, data: base64 };

  // Try single-shot first
  const contentParts = [
    { text: SYSTEM_PROMPT },
    {
      text: 'Analiza el siguiente menú (archivo adjunto) y devuelve JSON estructurado:',
    },
    { inlineData },
  ];

  const result = await parseSingleShot(contentParts);
  if (result) return result;

  // Fallback to chunked (file is too large for single response)
  console.log(
    '[menu-parser] File menu too large, switching to chunked parsing...',
  );
  return parseChunked([
    { text: SYSTEM_PROMPT },
    { text: 'Este es un menú para analizar:' },
    { inlineData },
  ]);
}
