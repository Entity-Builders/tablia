import type { CSSProperties } from 'react';
import type {
  MenuDensity,
  MenuDecorativeStyle,
  MenuHeadingStyle,
  MenuPriceStyle,
  MenuVisualTemplate,
  ParsedMenuVisualStyle,
} from '../types';

export interface ResolvedMenuVisualTheme {
  template: MenuVisualTemplate;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  headingStyle: MenuHeadingStyle;
  density: MenuDensity;
  decorativeStyle: MenuDecorativeStyle;
  priceStyle: MenuPriceStyle;
}

export type MenuVisualStyleProperties = CSSProperties &
  Record<`--${string}`, string>;

const TEMPLATE_DEFAULTS: Record<MenuVisualTemplate, ResolvedMenuVisualTheme> = {
  heritage: {
    template: 'heritage',
    primaryColor: '#7a1830',
    secondaryColor: '#d9d2c4',
    accentColor: '#9a203d',
    backgroundColor: '#fbfaf6',
    surfaceColor: '#fffdf8',
    textColor: '#201915',
    mutedColor: '#6d625b',
    borderColor: '#2b2622',
    headingStyle: 'display',
    density: 'compact',
    decorativeStyle: 'ribbon',
    priceStyle: 'right-aligned',
  },
  modern: {
    template: 'modern',
    primaryColor: '#f06f1f',
    secondaryColor: '#f3f1ed',
    accentColor: '#cc5617',
    backgroundColor: '#fafaf8',
    surfaceColor: '#ffffff',
    textColor: '#1a1a18',
    mutedColor: '#6b6960',
    borderColor: '#e8e5df',
    headingStyle: 'sans',
    density: 'comfortable',
    decorativeStyle: 'minimal',
    priceStyle: 'right-aligned',
  },
  botanical: {
    template: 'botanical',
    primaryColor: '#246b4f',
    secondaryColor: '#e8efe7',
    accentColor: '#b46a38',
    backgroundColor: '#fbfaf6',
    surfaceColor: '#ffffff',
    textColor: '#17211b',
    mutedColor: '#607166',
    borderColor: '#d9e4d8',
    headingStyle: 'serif',
    density: 'comfortable',
    decorativeStyle: 'linework',
    priceStyle: 'right-aligned',
  },
  night: {
    template: 'night',
    primaryColor: '#d9a441',
    secondaryColor: '#242225',
    accentColor: '#e0b25d',
    backgroundColor: '#121112',
    surfaceColor: '#1e1b1f',
    textColor: '#f7f0df',
    mutedColor: '#c4bba8',
    borderColor: '#3a3435',
    headingStyle: 'serif',
    density: 'comfortable',
    decorativeStyle: 'linework',
    priceStyle: 'badge',
  },
  minimal: {
    template: 'minimal',
    primaryColor: '#202020',
    secondaryColor: '#eeeeea',
    accentColor: '#707065',
    backgroundColor: '#f8f8f4',
    surfaceColor: '#ffffff',
    textColor: '#1c1c1a',
    mutedColor: '#6d6d66',
    borderColor: '#dadad2',
    headingStyle: 'sans',
    density: 'spacious',
    decorativeStyle: 'none',
    priceStyle: 'inline',
  },
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const VALID_TEMPLATES = new Set<MenuVisualTemplate>([
  'heritage',
  'modern',
  'botanical',
  'night',
  'minimal',
]);
const VALID_HEADING_STYLES = new Set<MenuHeadingStyle>([
  'serif',
  'sans',
  'display',
  'condensed',
]);
const VALID_DENSITIES = new Set<MenuDensity>([
  'compact',
  'comfortable',
  'spacious',
]);
const VALID_DECORATIVE_STYLES = new Set<MenuDecorativeStyle>([
  'none',
  'linework',
  'ribbon',
  'bordered',
  'minimal',
]);
const VALID_PRICE_STYLES = new Set<MenuPriceStyle>([
  'right-aligned',
  'inline',
  'badge',
]);

function sanitizeColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const color = value.trim();
  return HEX_COLOR.test(color) ? color.toLowerCase() : undefined;
}

function pickEnum<T extends string>(
  value: unknown,
  validValues: Set<T>,
): T | undefined {
  return typeof value === 'string' && validValues.has(value as T)
    ? (value as T)
    : undefined;
}

function inferTemplate(cuisineType?: string | null): MenuVisualTemplate {
  const normalized = (cuisineType || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (/parrilla|asado|bodegon|steak|carne|vino/.test(normalized)) {
    return 'heritage';
  }

  if (/vegano|vegetariano|natural|organico|salud|plant/.test(normalized)) {
    return 'botanical';
  }

  if (/bar|pub|cocktail|tragos|night|club/.test(normalized)) {
    return 'night';
  }

  return 'modern';
}

function hexToRgb(color: string): string {
  const hex = color.replace('#', '');
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return `${red}, ${green}, ${blue}`;
}

export function normalizeMenuVisualStyle(
  visualStyle: ParsedMenuVisualStyle | null | undefined,
  cuisineType?: string | null,
): ParsedMenuVisualStyle {
  const template =
    pickEnum(visualStyle?.template, VALID_TEMPLATES) ||
    inferTemplate(cuisineType);

  return {
    template,
    primary_color: sanitizeColor(visualStyle?.primary_color),
    secondary_color: sanitizeColor(visualStyle?.secondary_color),
    accent_color: sanitizeColor(visualStyle?.accent_color),
    background_color: sanitizeColor(visualStyle?.background_color),
    text_color: sanitizeColor(visualStyle?.text_color),
    heading_style: pickEnum(
      visualStyle?.heading_style,
      VALID_HEADING_STYLES,
    ),
    density: pickEnum(visualStyle?.density, VALID_DENSITIES),
    decorative_style: pickEnum(
      visualStyle?.decorative_style,
      VALID_DECORATIVE_STYLES,
    ),
    price_style: pickEnum(visualStyle?.price_style, VALID_PRICE_STYLES),
    source_notes:
      typeof visualStyle?.source_notes === 'string'
        ? visualStyle.source_notes.slice(0, 180)
        : undefined,
  };
}

export function resolveMenuVisualTheme(
  visualStyle: ParsedMenuVisualStyle | null | undefined,
  cuisineType?: string | null,
): ResolvedMenuVisualTheme {
  const normalized = normalizeMenuVisualStyle(visualStyle, cuisineType);
  const base = TEMPLATE_DEFAULTS[normalized.template || inferTemplate(cuisineType)];

  return {
    ...base,
    primaryColor: normalized.primary_color || base.primaryColor,
    secondaryColor: normalized.secondary_color || base.secondaryColor,
    accentColor: normalized.accent_color || base.accentColor,
    backgroundColor: normalized.background_color || base.backgroundColor,
    textColor: normalized.text_color || base.textColor,
    headingStyle: normalized.heading_style || base.headingStyle,
    density: normalized.density || base.density,
    decorativeStyle: normalized.decorative_style || base.decorativeStyle,
    priceStyle: normalized.price_style || base.priceStyle,
  };
}

export function getMenuVisualStyleProperties(
  theme: ResolvedMenuVisualTheme,
): MenuVisualStyleProperties {
  return {
    '--menu-accent': theme.primaryColor,
    '--menu-accent-rgb': hexToRgb(theme.primaryColor),
    '--menu-secondary': theme.secondaryColor,
    '--menu-price': theme.accentColor,
    '--menu-bg': theme.backgroundColor,
    '--menu-surface': theme.surfaceColor,
    '--menu-text': theme.textColor,
    '--menu-muted': theme.mutedColor,
    '--menu-border': theme.borderColor,
  };
}
