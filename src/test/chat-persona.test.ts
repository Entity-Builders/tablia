import { describe, expect, it } from 'vitest';
import {
  CHAT_PERSONAS,
  getChatPersonaOption,
  getChatPersonaPrompt,
  normalizeChatPersona,
} from '../services/chat-persona';

describe('chat-persona', () => {
  it('normaliza valores vacíos al locutor por defecto', () => {
    expect(normalizeChatPersona(null)).toEqual({ id: 'curator' });
    expect(normalizeChatPersona({})).toEqual({ id: 'curator' });
  });

  it('acepta ids válidos como string u objeto', () => {
    expect(normalizeChatPersona('premium')).toEqual({ id: 'premium' });
    expect(normalizeChatPersona({ id: 'sommelier' })).toEqual({
      id: 'sommelier',
    });
  });

  it('rechaza ids desconocidos y vuelve al default', () => {
    expect(normalizeChatPersona({ id: 'payaso' })).toEqual({
      id: 'curator',
    });
  });

  it('expone todas las opciones esperadas para el admin', () => {
    expect(CHAT_PERSONAS.map((persona) => persona.id)).toEqual([
      'curator',
      'friendly',
      'sommelier',
      'concise',
      'premium',
    ]);
  });

  it('construye instrucciones específicas para el prompt', () => {
    const option = getChatPersonaOption({ id: 'concise' });
    const prompt = getChatPersonaPrompt(option);

    expect(prompt).toContain('Locutor activo: Directo.');
    expect(prompt).toContain('Respondé en 1 o 2 oraciones');
  });
});
