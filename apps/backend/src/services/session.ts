import { getPrisma } from '../database.js';
import { logError } from '../logger.js';

export class SessionService {
  private prisma = getPrisma();

  async createSession(deviceId: string, sessionToken: string, expiresIn: number = 7 * 24 * 60 * 60 * 1000) {
    try {
      const expiresAt = new Date(Date.now() + expiresIn);

      const session = await this.prisma.session.create({
        data: {
          deviceId,
          sessionToken,
          isActive: true,
          expiresAt,
        },
      });

      return session;
    } catch (error) {
      logError('Failed to create session', error as Error, { deviceId });
      throw error;
    }
  }

  async getSession(sessionToken: string) {
    try {
      return await this.prisma.session.findUnique({
        where: { sessionToken },
        include: { device: true },
      });
    } catch (error) {
      logError('Failed to get session', error as Error);
      return null;
    }
  }

  async validateSession(sessionToken: string): Promise<boolean> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { sessionToken },
      });

      if (!session) return false;
      if (!session.isActive) return false;
      if (new Date() > session.expiresAt) {
        await this.prisma.session.update({
          where: { id: session.id },
          data: { isActive: false },
        });
        return false;
      }

      return true;
    } catch (error) {
      logError('Failed to validate session', error as Error);
      return false;
    }
  }

  async invalidateSession(sessionToken: string): Promise<void> {
    try {
      await this.prisma.session.update({
        where: { sessionToken },
        data: { isActive: false },
      });
    } catch (error) {
      logError('Failed to invalidate session', error as Error);
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      await this.prisma.session.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          isActive: true,
        },
        data: { isActive: false },
      });
    } catch (error) {
      logError('Failed to cleanup expired sessions', error as Error);
    }
  }
}

export const sessionService = new SessionService();
