import { getPrisma } from '../database.js';
import { logError } from '../logger.js';
import type { LogMessage } from '@smart-typer/shared';

export class LoggingService {
  private prisma = getPrisma();

  async createLog(logMessage: Omit<LogMessage, 'id' | 'timestamp'>): Promise<void> {
    try {
      await this.prisma.log.create({
        data: {
          level: logMessage.level,
          category: logMessage.category,
          message: logMessage.message,
          metadata: logMessage.metadata ? JSON.stringify(logMessage.metadata) : null,
        },
      });
    } catch (error) {
      console.error('Failed to create log', error);
    }
  }

  async getLogs(
    options: {
      level?: string;
      category?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    try {
      const { level, category, limit = 100, offset = 0 } = options;

      const where: any = {};
      if (level) where.level = level;
      if (category) where.category = category;

      return await this.prisma.log.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    } catch (error) {
      logError('Failed to get logs', error as Error);
      return [];
    }
  }

  async clearOldLogs(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.log.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });

      return result.count;
    } catch (error) {
      logError('Failed to clear old logs', error as Error);
      return 0;
    }
  }
}

export const loggingService = new LoggingService();
