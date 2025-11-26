/**
 * Production-Safe Logging Utility with Better Stack Integration
 *
 * - Sends logs to Better Stack in production
 * - Falls back to console in development
 * - Structured logging for debugging
 */

import { Logtail } from '@logtail/node';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

// Singleton Logtail instance
let logtailInstance: Logtail | null = null;

const getLogtail = (): Logtail | null => {
  if (logtailInstance) return logtailInstance;

  const sourceToken = process.env.BETTER_STACK_SOURCE_TOKEN;
  if (sourceToken) {
    logtailInstance = new Logtail(sourceToken);
  }
  return logtailInstance;
};

class Logger {
  private isDev = process.env.NODE_ENV === 'development';

  info(message: string, context?: LogContext) {
    const logtail = getLogtail();
    if (logtail) {
      logtail.info(message, context);
    }
    if (this.isDev) {
      console.log(`[INFO]`, message, context || '');
    }
  }

  warn(message: string, context?: LogContext) {
    const logtail = getLogtail();
    if (logtail) {
      logtail.warn(message, context);
    }
    console.warn(`[WARN]`, message, context || '');
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : String(error),
    };

    const logtail = getLogtail();
    if (logtail) {
      logtail.error(message, errorContext);
    }
    console.error(`[ERROR]`, message, errorContext);
  }

  debug(message: string, context?: LogContext) {
    const logtail = getLogtail();
    if (logtail) {
      logtail.debug(message, context);
    }
    if (this.isDev) {
      console.debug(`[DEBUG]`, message, context || '');
    }
  }

  /**
   * Flush logs to Better Stack - call before serverless function ends
   */
  async flush() {
    const logtail = getLogtail();
    if (logtail) {
      await logtail.flush();
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience exports
export const log = {
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error | unknown, context?: LogContext) =>
    logger.error(message, error, context),
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  flush: () => logger.flush(),
};

/**
 * Capture an exception - similar to Sentry API for easy migration
 */
export function captureException(error: Error | unknown, context?: LogContext) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error(message, error, context);
}

/**
 * Capture a message - similar to Sentry API for easy migration
 */
export function captureMessage(message: string, level: LogLevel = 'info', context?: LogContext) {
  logger[level](message, context);
}

/**
 * Check if logging is properly configured for production
 */
export function isLoggingConfigured(): boolean {
  return !!process.env.BETTER_STACK_SOURCE_TOKEN;
}

export default logger;
