import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildMenuContext,
  buildSystemPrompt,
  sendChatMessage,
} from '../services/chat-service';
import { mockCategories } from './fixtures/menu.fixtures';

// ─── Mock the analytics singleton ────────────────────────────────
vi.mock('../services/analytics', () => ({
  analytics: {
    track: vi.fn(),
  },
}));

// ─── Mock @google/generative-ai ───────────────────────────────────
const mockGenerateContent = vi.fn();
vi.mock('@google/generative-ai', () => {
  const mockFn = vi.fn();
  class GoogleGenerativeAI {
    getGenerativeModel() {
      return { generateContent: mockFn };
    }
  }
  return { GoogleGenerativeAI, _mockGenerateContent: mockFn };
});

// ─── Tests ────────────────────────────────────────────────────────

describe('chat-service', () => {
  describe('buildMenuContext()', () => {
    it('formatea categorías e ítems correctamente con ARS', () => {
      const visibleCats = mockCategories
        .filter((c) => c.is_visible)
        .map((c) => ({ name: c.name, items: c.items }));

      const context = buildMenuContext(visibleCats);

      expect(context).toContain('📂 Entradas');
      expect(context).toContain('Empanadas x6');
      expect(context).toContain('$2400');
      expect(context).toContain('📂 Parrilla');
      expect(context).toContain('Bife de Chorizo 400g');
      expect(context).toContain('$8500');
    });

    it('usa el símbolo correcto para USD', () => {
      const context = buildMenuContext([
        {
          name: 'Importados',
          items: [{ name: 'Whisky', price: 15, currency: 'USD', tags: [] }],
        },
      ]);
      expect(context).toContain('US$15');
    });

    it('usa el símbolo correcto para EUR', () => {
      const context = buildMenuContext([
        {
          name: 'Europeos',
          items: [{ name: 'Vino', price: 12, currency: 'EUR', tags: [] }],
        },
      ]);
      expect(context).toContain('€12');
    });

    it('incluye tags cuando el ítem los tiene', () => {
      const context = buildMenuContext([
        {
          name: 'Veganos',
          items: [
            {
              name: 'Ensalada',
              price: 1800,
              currency: 'ARS',
              tags: ['vegano', 'sin-tacc'],
            },
          ],
        },
      ]);
      expect(context).toContain('[vegano, sin-tacc]');
    });

    it('no incluye brackets vacíos cuando el ítem no tiene tags', () => {
      const context = buildMenuContext([
        {
          name: 'Carnes',
          items: [{ name: 'Bife', price: 8500, currency: 'ARS', tags: [] }],
        },
      ]);
      expect(context).not.toContain('[]');
    });

    it('incluye descripción cuando existe', () => {
      const context = buildMenuContext([
        {
          name: 'Entradas',
          items: [
            {
              name: 'Empanadas',
              description: 'Rellenas de carne',
              price: 2400,
              currency: 'ARS',
              tags: [],
            },
          ],
        },
      ]);
      expect(context).toContain('— Rellenas de carne');
    });

    it('maneja categorías sin ítems sin crashear', () => {
      const context = buildMenuContext([{ name: 'Vacía', items: [] }]);
      expect(context).toContain('📂 Vacía');
    });
  });

  describe('sendChatMessage()', () => {
    beforeEach(async () => {
      // Get the actual mockGenerateContent from the mocked module
      const mod = await import('@google/generative-ai');
      const mockFn = (mod as any)._mockGenerateContent;
      mockFn.mockReset();
      mockFn.mockResolvedValue({
        response: { text: () => '¡Te recomiendo el Bife de Chorizo!' },
      });
    });

    it('retorna la respuesta del modelo de AI', async () => {
      const { analytics } = await import('../services/analytics');

      const response = await sendChatMessage(
        'la-parrilla-del-centro',
        'La Parrilla del Centro',
        '📂 Parrilla\n  • Bife de Chorizo: $8500',
        [],
        '¿Qué me recomendás?',
      );

      expect(response).toBe('¡Te recomiendo el Bife de Chorizo!');
    });

    it('trackea el evento chat_message_sent con los datos correctos', async () => {
      const { analytics } = await import('../services/analytics');
      vi.mocked(analytics.track).mockClear();

      await sendChatMessage(
        'la-parrilla-del-centro',
        'La Parrilla del Centro',
        '📂 Parrilla\n  • Bife de Chorizo: $8500',
        [], // history vacío → message_position = 1
        '¿Tienen opciones veganas?',
      );

      expect(analytics.track).toHaveBeenCalledWith('chat_message_sent', {
        slug: 'la-parrilla-del-centro',
        venue_name: 'La Parrilla del Centro',
        message_length: '¿Tienen opciones veganas?'.length,
        message_position: 1,
      });
    });

    it('message_position incrementa con el historial', async () => {
      const { analytics } = await import('../services/analytics');
      vi.mocked(analytics.track).mockClear();

      const history = [
        {
          role: 'user' as const,
          content: '¿Hola?',
          timestamp: '2024-01-01T00:00:00Z',
        },
        {
          role: 'assistant' as const,
          content: '¡Hola!',
          timestamp: '2024-01-01T00:00:01Z',
        },
        {
          role: 'user' as const,
          content: '¿Tienen bife?',
          timestamp: '2024-01-01T00:00:02Z',
        },
      ];

      await sendChatMessage(
        'mi-slug',
        'Mi Restaurant',
        'context',
        history,
        '¿Y entradas?',
      );

      expect(analytics.track).toHaveBeenCalledWith(
        'chat_message_sent',
        expect.objectContaining({ message_position: 4 }),
      );
    });

    it('llama a generateContent con el system prompt que incluye el nombre del venue', async () => {
      const genMod = await import('@google/generative-ai');
      const mockFn = (genMod as any)._mockGenerateContent;
      mockFn.mockReset();
      mockFn.mockResolvedValue({
        response: { text: () => 'ok' },
      });

      await sendChatMessage(
        'test-slug',
        'Mi Restaurante Especial',
        'menu context',
        [],
        'pregunta',
      );

      const callArgs = mockFn.mock.calls[0][0];
      const systemPromptContent = callArgs.contents[0].parts[0].text;
      expect(systemPromptContent).toContain('Mi Restaurante Especial');
    });

    it('instruye al asistente a recomendar sin tomar rol de camarero', async () => {
      const genMod = await import('@google/generative-ai');
      const mockFn = (genMod as any)._mockGenerateContent;
      mockFn.mockReset();
      mockFn.mockResolvedValue({
        response: { text: () => 'ok' },
      });

      await sendChatMessage(
        'test-slug',
        'Mi Restaurante',
        'menu context',
        [],
        'Algo para compartir',
      );

      const systemPromptContent = mockFn.mock.calls[0][0].contents[0].parts[0].text;
      expect(systemPromptContent).toContain('No actúes como camarero');
      expect(systemPromptContent).toContain('proponé una combinación concreta');
      expect(systemPromptContent).toContain('agregá vos el acompañamiento ideal');
    });

    it('inyecta el locutor configurado en el system prompt', async () => {
      const genMod = await import('@google/generative-ai');
      const mockFn = (genMod as any)._mockGenerateContent;
      mockFn.mockReset();
      mockFn.mockResolvedValue({
        response: { text: () => 'ok' },
      });

      await sendChatMessage(
        'test-slug',
        'Mi Restaurante',
        'menu context',
        [],
        'Qué va con el bife?',
        { id: 'premium' },
      );

      const systemPromptContent = mockFn.mock.calls[0][0].contents[0].parts[0].text;
      expect(systemPromptContent).toContain('Locutor activo: Elegante.');
      expect(systemPromptContent).toContain('Tono elegante, sobrio y cuidado.');
      expect(systemPromptContent).toContain('No uses cierres tipo "¿Te pinta?"');
    });
  });

  describe('buildSystemPrompt()', () => {
    it('usa el locutor por defecto cuando no hay configuración', () => {
      const prompt = buildSystemPrompt('Mi Restaurante', 'menu context');

      expect(prompt).toContain('Locutor activo: Curador cálido.');
      expect(prompt).toContain('Evitá slang exagerado');
    });
  });
});
