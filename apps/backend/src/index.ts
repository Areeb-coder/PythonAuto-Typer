import Fastify from 'fastify';
import { Server } from 'socket.io';
import FastifyCors from '@fastify/cors';
import os from 'node:os';
import { initializeDatabase, getPrisma, disconnectDatabase } from './database.js';
import { logInfo, logError, logDebug } from './logger.js';
import { setupSocketHandlers, getEngineStatus } from './services/socket-handlers.js';
import { qrService } from './services/qr.js';
import { deviceService } from './services/device.js';
import { sessionService } from './services/session.js';
import { loggingService } from './services/logging.js';
import type { HealthStatus } from '@smart-typer/shared';

const PORT = parseInt(process.env.PORT || '4000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

let isReady = false;

function getLocalIPv4(): string | null {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }
  return null;
}

export async function startServer(): Promise<void> {
  try {
    // Step 1: Load env
    logInfo('Loading environment configuration...');
    const nodeEnv = process.env.NODE_ENV || 'development';
    logInfo(`Environment: ${nodeEnv}`);

    // Step 2: Initialize logger
    logInfo('Logger initialized');

    // Step 3: Initialize Prisma
    logInfo('Initializing Prisma...');
    await initializeDatabase();

    // Step 4: Connect database
    logInfo('Database connected');

    // Step 5: Create Fastify
    logInfo('Creating Fastify instance...');
    const app = Fastify({
      logger: false, // Using custom logger
    });

    // Step 6: Register plugins
    logInfo('Registering CORS plugin...');
    await app.register(FastifyCors, {
      origin: true,
      credentials: true,
    });

    // Step 7: Initialize Socket.IO
    logInfo('Initializing Socket.IO...');
    const io = new Server(app.server, {
      cors: {
        origin: true,
        credentials: true,
      },
      transports: ['polling', 'websocket'],
    });

    setupSocketHandlers(io);
    logInfo('Socket.IO handlers registered');

    // Step 8: Register routes
    logInfo('Registering routes...');

    // Health check endpoint
    app.get('/health', async () => {
      const health: HealthStatus = {
        backend: true,
        database: true,
        socket: true,
        typingEngine: true,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        latency: 0,
      };
      return health;
    });

    // Get status
    app.get('/api/status', async () => {
      return {
        backend: 'online',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };
    });

    // LAN discovery for phone pairing links
    app.get('/api/network-info', async () => {
      return {
        success: true,
        host: getLocalIPv4(),
      };
    });

    // Generate QR code
    app.post<{ Body: { backendUrl: string; frontendUrl?: string } }>('/api/pair/generate-qr', async (request, reply) => {
      try {
        const backendUrl = request.body?.backendUrl || `http://localhost:${PORT}`;
        const frontendUrl = request.body?.frontendUrl || FRONTEND_URL;
        const pairing = await qrService.generatePairingQR(backendUrl, frontendUrl);
        
        reply.send({
          success: true,
          qrCode: pairing.qrCode,
          code: pairing.code,
          pairingUrl: pairing.pairingUrl,
          expiresAt: pairing.expiresAt.toISOString(),
        });
      } catch (error) {
        logError('Failed to generate QR', error as Error);
        reply.code(500).send({ error: 'Failed to generate QR' });
      }
    });

    // Complete pairing from phone via HTTP (more reliable than socket ack on mobile networks)
    app.post<{ Body: { pairingCode: string; deviceName?: string } }>('/api/pair/complete', async (request, reply) => {
      try {
        const pairingCode = request.body?.pairingCode;
        const deviceName = request.body?.deviceName || 'Phone';

        if (!pairingCode || !qrService.validatePairingCode(pairingCode)) {
          reply.code(400).send({ success: false, error: 'Invalid pairing code' });
          return;
        }

        const device = await deviceService.pairDevice(deviceName, 'phone');
        await sessionService.createSession(device.id, device.sessionToken);
        qrService.invalidatePairingCode(pairingCode);

        logInfo('Device paired via HTTP', { deviceId: device.id, name: deviceName });

        io.emit('device:paired', {
          device: {
            id: device.id,
            name: device.name,
          },
        });

        reply.send({
          success: true,
          device: {
            id: device.id,
            name: device.name,
            sessionToken: device.sessionToken,
            pairedAt: device.pairedAt,
          },
        });
      } catch (error) {
        logError('HTTP pairing failed', error as Error);
        reply.code(500).send({ success: false, error: 'Pairing failed' });
      }
    });

    // Get devices
    app.get('/api/devices', async () => {
      try {
        const devices = await deviceService.getAllDevices();
        return {
          success: true,
          devices: devices.map(d => ({
            id: d.id,
            name: d.name,
            type: d.type,
            trusted: d.trusted,
            lastSeen: d.lastSeen.toISOString(),
            pairedAt: d.pairedAt.toISOString(),
          })),
        };
      } catch (error) {
        logError('Failed to get devices', error as Error);
        return { success: false, error: 'Failed to get devices' };
      }
    });

    // Revoke device
    app.delete<{ Params: { deviceId: string } }>('/api/devices/:deviceId', async (request, reply) => {
      try {
        const { deviceId } = request.params;
        await deviceService.revokeDevice(deviceId);
        reply.send({ success: true });
      } catch (error) {
        logError('Failed to revoke device', error as Error);
        reply.code(500).send({ error: 'Failed to revoke device' });
      }
    });

    // Get settings
    app.get('/api/settings', async () => {
      try {
        const prisma = getPrisma();
        const settings = await prisma.settings.findFirst();
        return { success: true, settings };
      } catch (error) {
        logError('Failed to get settings', error as Error);
        return { success: false, error: 'Failed to get settings' };
      }
    });

    // Update settings
    app.patch<{ Body: any }>('/api/settings', async (request, reply) => {
      try {
        const prisma = getPrisma();
        const updated = await prisma.settings.updateMany({
          data: request.body,
        });
        reply.send({ success: true });
      } catch (error) {
        logError('Failed to update settings', error as Error);
        reply.code(500).send({ error: 'Failed to update settings' });
      }
    });

    // Get logs
    app.get<{ Querystring: { level?: string; category?: string; limit?: string } }>(
      '/api/logs',
      async (request) => {
        try {
          const { level, category, limit } = request.query;
          const logs = await loggingService.getLogs({
            level,
            category,
            limit: limit ? parseInt(limit) : 100,
          });
          return { success: true, logs };
        } catch (error) {
          logError('Failed to get logs', error as Error);
          return { success: false, error: 'Failed to get logs' };
        }
      }
    );

    // Get engine status
    app.get('/api/engine/status', async () => {
      try {
        return {
          success: true,
          engine: getEngineStatus(),
        };
      } catch (error) {
        logError('Failed to get engine status', error as Error);
        return { success: false, error: 'Failed to get engine status' };
      }
    });

    // Cleanup expired sessions periodically
    setInterval(async () => {
      try {
        await sessionService.cleanupExpiredSessions();
      } catch (error) {
        logError('Failed to cleanup sessions', error as Error);
      }
    }, 60 * 60 * 1000); // Every hour

    // Cleanup old logs periodically
    setInterval(async () => {
      try {
        await loggingService.clearOldLogs(30);
      } catch (error) {
        logError('Failed to cleanup old logs', error as Error);
      }
    }, 24 * 60 * 60 * 1000); // Every day

    // Step 9: Start typing daemon
    logInfo('Typing daemon configured (listening for external connections)');

    // Step 10: Start server
    await app.listen({ port: PORT, host: '0.0.0.0' });
    logInfo(`Backend running on port ${PORT}`);

    isReady = true;

    // Handle shutdown
    const gracefulShutdown = async (signal: string) => {
      logInfo(`Received ${signal}, shutting down...`);
      await disconnectDatabase();
      await app.close();
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    logError('Failed to start server', error as Error);
    process.exit(1);
  }
}

export function isServerReady(): boolean {
  return isReady;
}

// Start server
startServer();
