export type OCRPayload = {
  imageBase64: string;
  preprocessingQuality: 'fast' | 'balanced' | 'high';
};

export type OcrResult = {
  lines: string[];
  paragraphs: string[];
  regions: Array<{ text: string; bbox?: [number, number, number, number] }>;
  confidence: number[];
  metadata: Record<string, unknown>;
};

export abstract class BaseOCRProvider {
  abstract name: string;
  abstract run(payload: OCRPayload): Promise<OcrResult>;
}

function normalize(text: string): OcrResult {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return {
    lines,
    paragraphs: lines.length ? [lines.join(' ')] : [],
    regions: lines.map((line) => ({ text: line })),
    confidence: lines.map(() => 0.6),
    metadata: {
      parser: 'heuristic',
    },
  };
}

export class PaddleOCRProvider extends BaseOCRProvider {
  name = 'paddle';

  async run(payload: OCRPayload): Promise<OcrResult> {
    if (!payload.imageBase64) {
      throw new Error('No image payload provided');
    }
    const marker = Buffer.from(payload.imageBase64, 'base64').toString('utf8').slice(0, 2000);
    return normalize(marker);
  }
}

export class HuggingFaceOCRProvider extends BaseOCRProvider {
  name = 'huggingface';

  async run(payload: OCRPayload): Promise<OcrResult> {
    if (!payload.imageBase64) {
      throw new Error('No image payload provided');
    }
    const marker = Buffer.from(payload.imageBase64, 'base64').toString('utf8').slice(0, 1000);
    return normalize(marker);
  }
}

export class OCRService {
  private paddle = new PaddleOCRProvider();
  private huggingFace = new HuggingFaceOCRProvider();

  async process(payload: OCRPayload, preferred: 'paddle' | 'huggingface' = 'paddle') {
    const primary = preferred === 'paddle' ? this.paddle : this.huggingFace;
    const fallback = preferred === 'paddle' ? this.huggingFace : this.paddle;

    try {
      const result = await primary.run(payload);
      return { provider: primary.name, result };
    } catch {
      const result = await fallback.run(payload);
      return { provider: fallback.name, result };
    }
  }
}

export const ocrService = new OCRService();
