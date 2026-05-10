import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ParsedContactInfo } from '../types';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

const ENRICHMENT_PROMPT = `Eres un asistente que busca información de contacto de restaurantes.

Dado el nombre de un restaurante (y opcionalmente su dirección o ciudad), buscá en internet y devolvé la información de contacto que encuentres.

REGLAS:
- Buscá SOLO información del restaurante específico, no de otros con nombre similar
- Si encontrás múltiples resultados para el mismo nombre, priorizá el que coincida con la dirección/ciudad
- Para Instagram y TikTok devolvé SOLO el @handle (sin URL completa)
- Para teléfono devolvé en formato internacional si es posible (+54...)
- Si no estás seguro de un dato, devolvé null para ese campo
- NO inventes datos — solo devolvé lo que encontrés con certeza

FORMATO DE RESPUESTA (JSON):
{
  "phone": "+5491112345678 o null",
  "address": "Dirección completa o null",
  "instagram": "@handle o null",
  "facebook": "nombre de página o null",
  "tiktok": "@handle o null",
  "website": "URL completa o null",
  "whatsapp": "Número o null"
}`;

/** Timeout wrapper — resolves with null if the promise takes too long. */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/**
 * Enrich venue contact info using Gemini with Google Search grounding.
 * Fills gaps in whatever the PDF parser already extracted.
 *
 * Has a 5-second timeout — never blocks the import flow.
 * Returns merged result where PDF data takes priority.
 */
export async function enrichVenueFromWeb(
  restaurantName: string,
  existingInfo?: ParsedContactInfo,
): Promise<ParsedContactInfo> {
  const existing = existingInfo ?? {};

  // If we already have most fields, skip enrichment
  const filledFields = Object.values(existing).filter(
    (v) => v !== undefined && v !== null && v !== '',
  ).length;
  if (filledFields >= 5) {
    console.log(
      '[venue-enrichment] Already have 5+ fields, skipping web search.',
    );
    return existing;
  }

  try {
    const result = await withTimeout(searchAndEnrich(restaurantName, existing), 5000);

    if (!result) {
      console.log('[venue-enrichment] Timed out after 5s, using PDF-only data.');
      return existing;
    }

    // Merge: PDF data takes priority over web data
    return {
      phone: existing.phone || result.phone || undefined,
      address: existing.address || result.address || undefined,
      instagram: existing.instagram || result.instagram || undefined,
      facebook: existing.facebook || result.facebook || undefined,
      tiktok: existing.tiktok || result.tiktok || undefined,
      website: existing.website || result.website || undefined,
      whatsapp: existing.whatsapp || result.whatsapp || undefined,
      // Wi-Fi never comes from web search — only from PDF
      wifi_name: existing.wifi_name,
      wifi_password: existing.wifi_password,
    };
  } catch (err) {
    console.warn('[venue-enrichment] Failed:', err);
    return existing;
  }
}

async function searchAndEnrich(
  restaurantName: string,
  existing: ParsedContactInfo,
): Promise<ParsedContactInfo> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
    tools: [{ googleSearch: {} } as any],
  });

  const addressHint = existing.address ? ` en ${existing.address}` : '';
  const prompt = `${ENRICHMENT_PROMPT}\n\nBuscá información del restaurante: "${restaurantName}"${addressHint}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  // Parse response
  const cleaned = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Record<string, string | null>;

    // Clean null strings → undefined
    const clean = (val: string | null | undefined): string | undefined => {
      if (!val || val === 'null' || val === 'undefined') return undefined;
      return val.trim();
    };

    return {
      phone: clean(parsed.phone),
      address: clean(parsed.address),
      instagram: clean(parsed.instagram),
      facebook: clean(parsed.facebook),
      tiktok: clean(parsed.tiktok),
      website: clean(parsed.website),
      whatsapp: clean(parsed.whatsapp),
    };
  } catch {
    console.warn('[venue-enrichment] Failed to parse response:', raw.substring(0, 300));
    return {};
  }
}
