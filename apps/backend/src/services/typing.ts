import { getPrisma } from '../database.js';
import { logDebug, logInfo, logError } from '../logger.js';

interface QueuedType {
  id: string;
  text: string;
  speed?: number;
  createdAt: Date;
}

export class TypingService {
  private prisma = getPrisma();
  private queue: QueuedType[] = [];
  private isTyping = false;

  async queueText(text: string, speed: number | undefined, deviceId: string): Promise<string> {
    try {
      const typingHistory = await this.prisma.typingHistory.create({
        data: {
          deviceId,
          text,
          charCount: text.length,
          speed: speed || 60,
          status: 'pending',
        },
      });

      const queueHistory = await this.prisma.queueHistory.create({
        data: {
          text,
          status: 'pending',
          speed: speed || 60,
          estimatedTime: Math.ceil(text.length / (speed || 60)),
        },
      });

      logDebug('Text queued', { 
        queueId: queueHistory.id, 
        charCount: text.length 
      });

      return queueHistory.id;
    } catch (error) {
      logError('Failed to queue text', error as Error);
      throw error;
    }
  }

  async getQueueLength(): Promise<number> {
    try {
      return await this.prisma.queueHistory.count({
        where: { status: 'pending' },
      });
    } catch (error) {
      logError('Failed to get queue length', error as Error);
      return 0;
    }
  }

  async getQueue() {
    try {
      return await this.prisma.queueHistory.findMany({
        where: { status: { in: ['pending', 'typing'] } },
        orderBy: { queuedAt: 'asc' },
        take: 20,
      });
    } catch (error) {
      logError('Failed to get queue', error as Error);
      return [];
    }
  }

  async updateQueueItemStatus(
    queueId: string,
    status: 'pending' | 'typing' | 'completed' | 'error',
    data?: { error?: string; actualTime?: number }
  ): Promise<void> {
    try {
      await this.prisma.queueHistory.update({
        where: { id: queueId },
        data: {
          status,
          startedAt: status === 'typing' ? new Date() : undefined,
          completedAt: status === 'completed' ? new Date() : undefined,
          error: data?.error,
          actualTime: data?.actualTime,
        },
      });

      logDebug('Queue item updated', { queueId, status });
    } catch (error) {
      logError('Failed to update queue item', error as Error, { queueId });
    }
  }

  async clearQueue(): Promise<void> {
    try {
      await this.prisma.queueHistory.updateMany({
        where: { status: 'pending' },
        data: { status: 'error', error: 'Cleared by user' },
      });
      logInfo('Queue cleared');
    } catch (error) {
      logError('Failed to clear queue', error as Error);
    }
  }

  getIsTyping(): boolean {
    return this.isTyping;
  }

  setIsTyping(value: boolean): void {
    this.isTyping = value;
  }

  async recordTyping(
    deviceId: string,
    text: string,
    duration: number,
    speed: number
  ): Promise<void> {
    try {
      await this.prisma.typingHistory.create({
        data: {
          deviceId,
          text,
          charCount: text.length,
          status: 'completed',
          speed,
          duration,
          startedAt: new Date(Date.now() - duration),
          completedAt: new Date(),
        },
      });

      logDebug('Typing recorded', { 
        deviceId, 
        charCount: text.length,
        duration,
      });
    } catch (error) {
      logError('Failed to record typing', error as Error);
    }
  }
}

export const typingService = new TypingService();
