import type { ParsedMenu, ParsedMenuCharge } from '../types';
import { normalizeMenuVisualStyle } from './menu-visual-style';

type ParsedCategory = ParsedMenu['categories'][number];
type ParsedItem = ParsedCategory['items'][number];

const LEADING_DESCRIPTION_NOISE =
  /^(con|de|del|la|el|las|los|porcion de|porcion|porción de|porción)\s+/i;
const QUANTITY_PREFIX =
  /^\s*(\d+\s*(unidades?|uds?\.?|u\.?)|x\s*\d+|por\s+\d+)\.?\s*/i;

function normalizeKey(value: string | undefined): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function cleanVariantLabel(description: string | undefined): string {
  if (!description) return '';

  const withoutQuantity = description
    .replace(QUANTITY_PREFIX, '')
    .replace(/^\s*\.\s*/, '')
    .trim();

  const firstSentence = withoutQuantity
    .split(/[.;]/)[0]
    .replace(LEADING_DESCRIPTION_NOISE, '')
    .trim();

  return firstSentence.length > 56
    ? `${firstSentence.slice(0, 53).trim()}...`
    : firstSentence;
}

function dedupeExactItems(items: ParsedItem[]): ParsedItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = [
      normalizeKey(item.name),
      normalizeKey(item.description),
      item.price,
      item.currency,
    ].join('|');

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeItemShape(item: ParsedItem): ParsedItem {
  const price = Number(item.price);

  return {
    ...item,
    name: item.name || 'Sin nombre',
    description: item.description || undefined,
    price: Number.isFinite(price) ? price : 0,
    currency: item.currency || 'ARS',
    tags: Array.isArray(item.tags)
      ? item.tags.filter((tag) => typeof tag === 'string' && tag.trim())
      : [],
  };
}

function disambiguateVariantNames(items: ParsedItem[]): ParsedItem[] {
  const nameCounts = new Map<string, number>();
  for (const item of items) {
    const key = normalizeKey(item.name);
    if (!key) continue;
    nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
  }

  const usedNames = new Set<string>();

  return items.map((item, index) => {
    const key = normalizeKey(item.name);
    if (!key || (nameCounts.get(key) || 0) < 2) {
      usedNames.add(normalizeKey(item.name));
      return item;
    }

    const label =
      cleanVariantLabel(item.description) ||
      (item.price > 0 ? `${item.currency} ${item.price}` : `variante ${index + 1}`);
    let candidate = `${item.name} (${label})`;
    let suffix = 2;

    while (usedNames.has(normalizeKey(candidate))) {
      candidate = `${item.name} (${label} ${suffix})`;
      suffix += 1;
    }

    usedNames.add(normalizeKey(candidate));
    return { ...item, name: candidate };
  });
}

function normalizeCategory(category: ParsedCategory): ParsedCategory {
  const items = disambiguateVariantNames(
    dedupeExactItems((category.items || []).map(normalizeItemShape)),
  );
  return { ...category, items };
}

function normalizeCharge(charge: ParsedMenuCharge): ParsedMenuCharge | null {
  const price = Number(charge.price);
  const label = typeof charge.label === 'string' ? charge.label.trim() : '';
  if (!label || !Number.isFinite(price)) return null;

  return {
    label,
    price,
    currency: charge.currency || 'ARS',
    description:
      typeof charge.description === 'string' && charge.description.trim()
        ? charge.description.trim()
        : undefined,
  };
}

export function normalizeParsedMenu(parsedMenu: ParsedMenu): ParsedMenu {
  return {
    ...parsedMenu,
    categories: (parsedMenu.categories || []).map(normalizeCategory),
    visual_style: normalizeMenuVisualStyle(
      parsedMenu.visual_style,
      parsedMenu.metadata?.cuisine_type,
    ),
    additional_charges: Array.isArray(parsedMenu.additional_charges)
      ? parsedMenu.additional_charges
          .map(normalizeCharge)
          .filter((charge): charge is ParsedMenuCharge => Boolean(charge))
      : [],
    legal_notes: Array.isArray(parsedMenu.legal_notes)
      ? parsedMenu.legal_notes
          .filter((note) => typeof note === 'string' && note.trim())
          .map((note) => note.trim().slice(0, 220))
      : [],
  };
}
