import { PrismaClient } from '@prisma/client';
import { logDebug, logInfo, logError } from './logger.js';

let prisma: PrismaClient;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info'] : ['error'],
    });
  }
  return prisma;
}

export async function initializeDatabase(): Promise<void> {
  try {
    logInfo('Initializing database...');
    const db = getPrisma();
    
    // Test connection
    await db.$queryRaw`SELECT 1`;
    
    logInfo('Database connected successfully');
    
    // Ensure default settings exist
    const existingSettings = await db.settings.findFirst();
    if (!existingSettings) {
      await db.settings.create({
        data: {
          typingSpeed: 60,
          reconnectBehavior: 'automatic',
          backendIp: 'localhost',
          websocketUrl: 'ws://localhost:4000',
          theme: 'dark',
          typingDelay: 0,
          emergencyStopKey: 'Escape',
          autoReconnect: true,
          reconnectInterval: 1000,
          maxReconnectAttempts: -1,
        },
      });
      logInfo('Default settings created');
    }
  } catch (error) {
    logError('Database initialization failed', error as Error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    logInfo('Database disconnected');
  }
}
