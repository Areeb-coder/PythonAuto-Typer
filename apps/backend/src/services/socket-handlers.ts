import type { Server } from 'socket.io';
import { logDebug, logError, logInfo } from '../logger.js';
import { deviceService } from './device.js';
import { typingService } from './typing.js';
import { engineClient } from './engine-client.js';
import { sessionService } from './session.js';
import { qrService } from './qr.js';
import { loggingService } from './logging.js';
import type { HealthStatus, EngineStatus, TypingStatus } from '@smart-typer/shared';

let engineStatus: EngineStatus = {
  running: false,
  queueLength: 0,
  lastActivity: new Date().toISOString(),
  uptime: 0,
  speed: 60,
  typedTotal: 0,
};

const startTime = Date.now();

export function setupSocketHandlers(io: Server): void {
  io.on('connection', async (socket) => {
    logInfo('Client connected', { socketId: socket.id });

    let authenticatedDeviceId: string | null = null;
    let sessionToken: string | null = null;

    // Authentication middleware
    socket.on('authenticate', async (data: { sessionToken: string }, callback) => {
      try {
        const session = await sessionService.getSession(data.sessionToken);
        
        if (!session || !session.isActive) {
          logError('Authentication failed', new Error('Invalid session'), { socketId: socket.id });
          callback({ success: false, error: 'Invalid session token' });
          return;
        }

        authenticatedDeviceId = session.deviceId;
        sessionToken = data.sessionToken;

        await deviceService.updateLastSeen(session.deviceId);
        logInfo('Client authenticated', { 
          socketId: socket.id, 
          deviceId: authenticatedDeviceId,
        });

        callback({ success: true });
      } catch (error) {
        logError('Authentication error', error as Error);
        callback({ success: false, error: 'Authentication failed' });
      }
    });

    // Type text
    socket.on('type:send', async (data: { text: string; speed?: number }, callback) => {
      if (!authenticatedDeviceId) {
        callback({ success: false, error: 'Not authenticated' });
        return;
      }

      try {
        const queueId = await typingService.queueText(data.text, data.speed, authenticatedDeviceId);
        const engine = await engineClient.queueText(queueId, data.text, data.speed);
        if (!engine.success) {
          await typingService.updateQueueItemStatus(queueId, 'error', {
            error: engine.error || 'Typing engine failed to queue task',
          });
          callback({ success: false, error: engine.error || 'Typing engine error' });
          return;
        }

        const queueLength = await typingService.getQueueLength();
        
        engineStatus.queueLength = queueLength;
        engineStatus.lastActivity = new Date().toISOString();

        // Broadcast queue update
        io.emit('type:queue-updated', { 
          queueLength,
          newQueueId: queueId,
        });

        logDebug('Text sent to queue', { 
          deviceId: authenticatedDeviceId,
          charCount: data.text.length,
          queueId,
        });

        callback({ 
          success: true, 
          queueId,
          queueLength,
        });
      } catch (error) {
        logError('Failed to queue text', error as Error);
        callback({ success: false, error: 'Failed to queue text' });
      }
    });

    // Stop typing
    socket.on('type:stop', async (_, callback) => {
      if (!authenticatedDeviceId) {
        callback({ success: false, error: 'Not authenticated' });
        return;
      }

      try {
        await typingService.clearQueue();
        await engineClient.stop();
        typingService.setIsTyping(false);

        io.emit('type:stopped');
        logInfo('Typing stopped', { deviceId: authenticatedDeviceId });

        callback({ success: true });
      } catch (error) {
        logError('Failed to stop typing', error as Error);
        callback({ success: false, error: 'Failed to stop typing' });
      }
    });

    // Get status
    socket.on('status:request', async (_, callback) => {
      try {
        const engine = await engineClient.status();
        const queueLength = await typingService.getQueueLength();
        const queue = await typingService.getQueue();

        const typingStatus: TypingStatus = {
          state: engine.status?.is_typing ? 'typing' : 'idle',
          queueLength,
          charsTyped: engine.status?.total_characters || engineStatus.typedTotal,
          estimatedTimeRemaining: Math.ceil(queueLength / (engineStatus.speed || 60)),
          speed: engineStatus.speed,
          progress: 0,
        };

        callback({ 
          success: true,
          typing: typingStatus,
          queue: queue.map(q => ({
            id: q.id,
            text: q.text,
            status: q.status,
            createdAt: q.queuedAt.toISOString(),
          })),
        });
      } catch (error) {
        logError('Failed to get status', error as Error);
        callback({ success: false, error: 'Failed to get status' });
      }
    });

    // Get health
    socket.on('health:request', async (_, callback) => {
      try {
        const engine = await engineClient.status();
        const health: HealthStatus = {
          backend: true,
          database: true,
          socket: true,
          typingEngine: Boolean(engine.success && engine.status?.running),
          uptime: Math.floor((Date.now() - startTime) / 1000),
          timestamp: new Date().toISOString(),
          latency: Math.random() * 50, // Placeholder
        };

        callback({ success: true, health });
      } catch (error) {
        logError('Failed to get health', error as Error);
        callback({ success: false, error: 'Failed to get health' });
      }
    });

    // Device pairing request
    socket.on('pair:request', async (data: { deviceName: string; pairingCode: string }, callback) => {
      try {
        if (!qrService.validatePairingCode(data.pairingCode)) {
          callback({ success: false, error: 'Invalid pairing code' });
          return;
        }

        const device = await deviceService.pairDevice(data.deviceName, 'phone');
        const session = await sessionService.createSession(device.id, device.sessionToken);

        qrService.invalidatePairingCode(data.pairingCode);

        logInfo('Device pair request accepted', { 
          deviceId: device.id,
          name: data.deviceName,
        });

        callback({
          success: true,
          device: {
            id: device.id,
            name: device.name,
            sessionToken: device.sessionToken,
            pairedAt: device.pairedAt,
          },
        });

        io.emit('device:paired', { 
          device: {
            id: device.id,
            name: device.name,
          },
        });
      } catch (error) {
        logError('Device pairing failed', error as Error);
        callback({ success: false, error: 'Pairing failed' });
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      if (authenticatedDeviceId) {
        await deviceService.updateLastSeen(authenticatedDeviceId);
        logInfo('Client disconnected', { 
          socketId: socket.id,
          deviceId: authenticatedDeviceId,
        });
      } else {
        logDebug('Unauthenticated client disconnected', { socketId: socket.id });
      }
    });
  });
}

export function getEngineStatus(): EngineStatus {
  return {
    ...engineStatus,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };
}

export function updateEngineStatus(updates: Partial<EngineStatus>): void {
  engineStatus = { ...engineStatus, ...updates };
}
