import { nanoid } from 'nanoid';
import { getPrisma } from '../database.js';
import { logDebug, logInfo, logError } from '../logger.js';

export class DeviceService {
  private prisma = getPrisma();

  async pairDevice(
    deviceName: string,
    deviceType: 'phone' | 'tablet' | 'desktop' = 'phone'
  ) {
    try {
      const sessionToken = nanoid(32);
      
      const device = await this.prisma.device.create({
        data: {
          name: deviceName,
          type: deviceType,
          sessionToken,
          trusted: false,
        },
      });

      logInfo('Device paired', { deviceId: device.id, name: deviceName });

      return {
        id: device.id,
        sessionToken,
        name: device.name,
        pairedAt: device.pairedAt.toISOString(),
      };
    } catch (error) {
      logError('Device pairing failed', error as Error, { deviceName });
      throw error;
    }
  }

  async trustDevice(deviceId: string): Promise<void> {
    try {
      await this.prisma.device.update({
        where: { id: deviceId },
        data: { trusted: true },
      });
      logInfo('Device trusted', { deviceId });
    } catch (error) {
      logError('Failed to trust device', error as Error, { deviceId });
      throw error;
    }
  }

  async getDevice(deviceId: string) {
    return this.prisma.device.findUnique({
      where: { id: deviceId },
    });
  }

  async getDeviceBySessionToken(sessionToken: string) {
    return this.prisma.device.findUnique({
      where: { sessionToken },
    });
  }

  async updateLastSeen(deviceId: string): Promise<void> {
    try {
      await this.prisma.device.update({
        where: { id: deviceId },
        data: { lastSeen: new Date() },
      });
    } catch (error) {
      logDebug('Failed to update last seen', { deviceId });
    }
  }

  async getAllDevices() {
    return this.prisma.device.findMany({
      orderBy: { lastSeen: 'desc' },
    });
  }

  async revokeDevice(deviceId: string): Promise<void> {
    try {
      // Delete associated sessions
      await this.prisma.session.deleteMany({
        where: { deviceId },
      });

      // Delete device
      await this.prisma.device.delete({
        where: { id: deviceId },
      });

      logInfo('Device revoked', { deviceId });
    } catch (error) {
      logError('Failed to revoke device', error as Error, { deviceId });
      throw error;
    }
  }
}

export const deviceService = new DeviceService();
