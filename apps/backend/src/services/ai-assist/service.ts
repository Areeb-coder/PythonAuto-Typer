import { createHash } from 'node:crypto';
import type { Server } from 'socket.io';
import { getPrisma } from '../../database.js';
import { typingService } from '../typing.js';
import { engineClient } from '../engine-client.js';
import { logError, logInfo } from '../../logger.js';
import { ocrService } from './ocr-providers.js';
import { aiService, type AIMode } from './ai-providers.js';
import { aiSecretStore } from './secret-store.js';
import { aiProcessingQueue } from './processing-queue.js';

export type AssistPipelineInput = {
  imageBase64: string;
  source?: 'region' | 'window' | 'monitor';
  ocrProvider?: 'paddle' | 'huggingface';
  preprocessingQuality?: 'fast' | 'balanced' | 'high';
  mode?: AIMode;
  deviceId?: string;
};

export class AIAssistService {
  private prisma = getPrisma() as any;

  async setGeminiKey(apiKey: string): Promise<void> {
    await aiSecretStore.setGeminiKey(apiKey);
  }

  async getGeminiKeyHint(): Promise<string | null> {
    return aiSecretStore.getGeminiKeyHint();
  }

  async process(io: Server, payload: AssistPipelineInput) {
    const key = createHash('sha1').update(payload.imageBase64).digest('hex');

    return aiProcessingQueue.enqueue(key, async () => {
      const captureSession = await this.prisma.captureSession.create({
        data: {
          deviceId: payload.deviceId,
          source: payload.source || 'region',
          captureMetadata: JSON.stringify({
            preprocessingQuality: payload.preprocessingQuality || 'balanced',
          }),
          status: 'captured',
        },
      });

      io.emit('capture-start', { captureSessionId: captureSession.id });
      io.emit('capture-complete', { captureSessionId: captureSession.id });

      io.emit('ocr-start', { captureSessionId: captureSession.id });
      const ocrStart = Date.now();
      const ocrRun = await ocrService.process(
        {
          imageBase64: payload.imageBase64,
          preprocessingQuality: payload.preprocessingQuality || 'balanced',
        },
        payload.ocrProvider || 'paddle'
      );
      const ocrLatency = Date.now() - ocrStart;

      const ocrJob = await this.prisma.oCRJob.create({
        data: {
          captureSessionId: captureSession.id,
          provider: ocrRun.provider,
          status: 'completed',
          inputHash: key,
          resultJson: JSON.stringify(ocrRun.result),
          confidenceAvg:
            ocrRun.result.confidence.length > 0
              ? ocrRun.result.confidence.reduce((a, b) => a + b, 0) / ocrRun.result.confidence.length
              : 0,
          latencyMs: ocrLatency,
          completedAt: new Date(),
        },
      });

      await this.prisma.processingLog.create({
        data: {
          stage: 'ocr',
          status: 'info',
          message: 'OCR complete',
          metadata: JSON.stringify({ ocrJobId: ocrJob.id, latencyMs: ocrLatency }),
        },
      });

      io.emit('ocr-complete', { captureSessionId: captureSession.id, ocrJobId: ocrJob.id });

      io.emit('ai-start', { captureSessionId: captureSession.id });
      const aiInput = ocrRun.result.paragraphs.join('\n\n') || ocrRun.result.lines.join('\n');

      const aiStart = Date.now();
      const aiRun = await aiService.run(payload.mode || 'solve', aiInput);
      const aiLatency = Date.now() - aiStart;

      const aiRequest = await this.prisma.aIRequest.create({
        data: {
          captureSessionId: captureSession.id,
          mode: payload.mode || 'solve',
          inputText: aiInput,
          outputText: aiRun.output,
          status: 'completed',
          latencyMs: aiLatency,
          completedAt: new Date(),
        },
      });

      await this.prisma.processingLog.create({
        data: {
          stage: 'ai',
          status: 'info',
          message: 'AI complete',
          metadata: JSON.stringify({ aiRequestId: aiRequest.id, latencyMs: aiLatency }),
        },
      });

      io.emit('ai-complete', { captureSessionId: captureSession.id, aiRequestId: aiRequest.id });
      io.emit('review-ready', { captureSessionId: captureSession.id, aiRequestId: aiRequest.id });

      return {
        captureSessionId: captureSession.id,
        ocr: ocrRun.result,
        ocrProvider: ocrRun.provider,
        aiProvider: aiRun.provider,
        aiOutput: aiRun.output,
        ocrLatency,
        aiLatency,
      };
    });
  }

  async approveTyping(io: Server, payload: { text: string; speed?: number; deviceId: string }) {
    const queueId = await typingService.queueText(payload.text, payload.speed || 60, payload.deviceId);
    const queued = await engineClient.queueText(queueId, payload.text, payload.speed || 60);
    if (!queued.success) {
      throw new Error(queued.error || 'Typing enqueue failed');
    }

    io.emit('typing-approved', { queueId, charCount: payload.text.length });
    await this.prisma.processingLog.create({
      data: {
        stage: 'typing',
        status: 'info',
        message: 'Typing approved and queued',
        metadata: JSON.stringify({ queueId, charCount: payload.text.length }),
      },
    });

    logInfo('AI assist typing approved', { queueId, charCount: payload.text.length });

    return { queueId };
  }

  async getRecent(limit = 10) {
    try {
      return await this.prisma.captureSession.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          ocrJobs: { take: 1, orderBy: { createdAt: 'desc' } },
          aiRequests: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      });
    } catch (error) {
      logError('Failed to load AI assist sessions', error as Error);
      return [];
    }
  }
}

export const aiAssistService = new AIAssistService();
