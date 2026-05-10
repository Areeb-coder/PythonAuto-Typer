import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export function logInfo(msg: string, data?: Record<string, any>) {
  logger.info({ ...data }, msg);
}

export function logError(msg: string, error?: Error, data?: Record<string, any>) {
  logger.error({ ...data, err: error }, msg);
}

export function logWarn(msg: string, data?: Record<string, any>) {
  logger.warn({ ...data }, msg);
}

export function logDebug(msg: string, data?: Record<string, any>) {
  logger.debug({ ...data }, msg);
}
