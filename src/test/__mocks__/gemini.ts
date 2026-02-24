import { vi } from 'vitest';

/** Mock response builder for Gemini SDK */
const createModelMock = (
  responseText = '¡Claro! Te recomiendo el Bife de Chorizo a $8500.',
) => ({
  generateContent: vi.fn().mockResolvedValue({
    response: { text: () => responseText },
  }),
  getGenerativeModel: vi.fn(),
});

export const mockGeminiModel = createModelMock();

export const mockGoogleGenerativeAI = vi.fn().mockImplementation(() => ({
  getGenerativeModel: vi.fn().mockReturnValue(mockGeminiModel),
}));

/** Reset the model mock between tests */
export function resetGeminiMock(responseText?: string) {
  mockGeminiModel.generateContent.mockReset();
  mockGeminiModel.generateContent.mockResolvedValue({
    response: {
      text: () =>
        responseText ?? '¡Claro! Te recomiendo el Bife de Chorizo a $8500.',
    },
  });
}
