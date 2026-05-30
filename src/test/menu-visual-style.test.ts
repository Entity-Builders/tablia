import { describe, expect, it } from 'vitest';
import {
  normalizeMenuVisualStyle,
  resolveMenuVisualTheme,
} from '../services/menu-visual-style';

describe('menu-visual-style', () => {
  it('infers heritage template for parrilla menus', () => {
    expect(normalizeMenuVisualStyle(undefined, 'Parrilla').template).toBe(
      'heritage',
    );
  });

  it('sanitizes AI-provided colors before they reach CSS variables', () => {
    const style = normalizeMenuVisualStyle({
      template: 'heritage',
      primary_color: '#7A1830',
      accent_color: 'url(javascript:alert(1))',
      background_color: '#fffdf8',
    });

    expect(style.primary_color).toBe('#7a1830');
    expect(style.accent_color).toBeUndefined();
    expect(style.background_color).toBe('#fffdf8');
  });

  it('resolves AI overrides on top of a template default', () => {
    const theme = resolveMenuVisualTheme({
      template: 'night',
      primary_color: '#e0b25d',
      density: 'compact',
    });

    expect(theme.template).toBe('night');
    expect(theme.primaryColor).toBe('#e0b25d');
    expect(theme.density).toBe('compact');
    expect(theme.backgroundColor).toBe('#121112');
  });
});
