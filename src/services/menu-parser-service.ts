import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ParsedMenu } from '../types';

const SYSTEM_PROMPT = `Eres un experto en gastronomía y procesamiento de menús de restaurantes. Tu trabajo es analizar texto de un menú y convertirlo en datos estructurados.

REGLAS:
- Responde SIEMPRE en formato JSON válido (sin markdown, sin backticks)
- Identifica TODAS las categorías/secciones del menú (Entradas, Platos principales, Pastas, Carnes, Bebidas, Postres, etc.)
- Para cada plato extrae: nombre, descripción (si existe), precio, moneda y tags
- Los tags pueden ser: vegano, vegetariano, sin-tacc, sin-gluten, picante, para-compartir, sin-lactosa, apto-celíaco, orgánico, casero
- Si hay un precio ambiguo o inexistente, usa 0 y marca confianza baja
- Detecta la moneda del contexto (ARS para pesos argentinos, USD para dólares, EUR para euros). Si no es claro, usa ARS
- Si un plato tiene variantes (tamaños, sabores), crea un item por variante
- Mantén el idioma original del menú
- Si detectás el nombre del restaurante o tipo de cocina, incluyelo en metadata

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
  }
}

EJEMPLO:
Input: "ENTRADAS Empanadas de carne (x3) $2500 Provoleta con orégano $3200 PLATOS PRINCIPALES Bife de chorizo con papas $8500 Milanesa napolitana con fritas $7200 (sin gluten sobre aviso) BEBIDAS Coca-Cola $1500 Cerveza artesanal IPA $3000 Agua mineral $1000"

Output:
{
  "categories": [
    {
      "name": "Entradas",
      "items": [
        { "name": "Empanadas de carne (x3)", "description": null, "price": 2500, "currency": "ARS", "tags": [] },
        { "name": "Provoleta con orégano", "description": null, "price": 3200, "currency": "ARS", "tags": [] }
      ]
    },
    {
      "name": "Platos Principales",
      "items": [
        { "name": "Bife de chorizo con papas", "description": null, "price": 8500, "currency": "ARS", "tags": [] },
        { "name": "Milanesa napolitana con fritas", "description": "Sin gluten sobre aviso", "price": 7200, "currency": "ARS", "tags": ["sin-gluten"] }
      ]
    },
    {
      "name": "Bebidas",
      "items": [
        { "name": "Coca-Cola", "description": null, "price": 1500, "currency": "ARS", "tags": [] },
        { "name": "Cerveza artesanal IPA", "description": null, "price": 3000, "currency": "ARS", "tags": [] },
        { "name": "Agua mineral", "description": null, "price": 1000, "currency": "ARS", "tags": [] }
      ]
    }
  ],
  "metadata": {
    "restaurant_name": null,
    "cuisine_type": "Parrilla/Argentina",
    "confidence": 0.92
  }
}`;

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

/** Clean Gemini response and parse as ParsedMenu JSON. */
function parseGeminiResponse(raw: string): ParsedMenu {
  // Strategy 1: Strip markdown fences and try parsing
  let cleaned = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    return JSON.parse(cleaned) as ParsedMenu;
  } catch {
    // Strategy 2: Extract the first JSON object {...} from the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as ParsedMenu;
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

/**
 * Parse raw menu text into structured categories + items using Gemini AI.
 */
export async function parseMenuFromText(text: string): Promise<ParsedMenu> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 65536,
    },
  });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    {
      text: `Analiza el siguiente menú y devuelve JSON estructurado:\n\n${text}`,
    },
  ]);

  return parseGeminiResponse(result.response.text());
}

/**
 * Parse a menu file (PDF or image) into structured data using Gemini multimodal.
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

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 65536,
    },
  });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    {
      text: 'Analiza el siguiente menú (archivo adjunto) y devuelve JSON estructurado:',
    },
    {
      inlineData: {
        mimeType: file.type,
        data: base64,
      },
    },
  ]);

  return parseGeminiResponse(result.response.text());
}
