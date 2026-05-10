import { aiSecretStore } from './secret-store.js';

export type AIMode = 'solve' | 'explain' | 'simplify' | 'rewrite' | 'answer-only';

export abstract class BaseAIProvider {
  abstract name: string;
  abstract complete(input: { mode: AIMode; text: string }): Promise<string>;
}

function modeInstruction(mode: AIMode): string {
  switch (mode) {
    case 'explain':
      return 'Explain clearly with steps and concise reasoning.';
    case 'simplify':
      return 'Simplify the content into easy language while preserving meaning.';
    case 'rewrite':
      return 'Rewrite cleanly and professionally.';
    case 'answer-only':
      return 'Return only the final answer with no explanation.';
    default:
      return 'Solve carefully and provide the most accurate result.';
  }
}

export class GeminiProvider extends BaseAIProvider {
  name = 'gemini';

  async complete(input: { mode: AIMode; text: string }): Promise<string> {
    const key = await aiSecretStore.getGeminiKey();
    if (!key) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = `${modeInstruction(input.mode)}\n\nInput:\n${input.text}`;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed (${response.status})`);
    }

    const data = await response.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || typeof text !== 'string') {
      throw new Error('Gemini returned an empty response');
    }
    return text;
  }
}

export class AIService {
  private gemini = new GeminiProvider();

  async run(mode: AIMode, text: string): Promise<{ provider: string; output: string }> {
    const output = await this.gemini.complete({ mode, text });
    return {
      provider: this.gemini.name,
      output,
    };
  }
}

export const aiService = new AIService();
