/**
 * Production-Safe Logging Utility
 *
 * - Removes console.logs in production
 * - Sends errors to monitoring service
 * - Structured logging for debugging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';
  private isProd = process.env.NODE_ENV === 'production';

  info(message: string, context?: LogContext) {
    if (this.isDev) {
      console.log(`ℹ️ [INFO]`, message, context || '');
    }
  }

  warn(message: string, context?: LogContext) {
    console.warn(`⚠️  [WARN]`, message, context || '');

    // In production, you might want to send to monitoring
    if (this.isProd) {
      this.sendToMonitoring('warn', message, context);
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    console.error(`❌ [ERROR]`, message, error, context || '');

    // Always send errors to monitoring in production
    if (this.isProd) {
      this.sendToMonitoring('error', message, {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : String(error),
      });
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDev) {
      console.debug(`🔍 [DEBUG]`, message, context || '');
    }
  }

  /**
   * Send logs to external monitoring service
   * TODO: Replace with Sentry, LogRocket, or your preferred service
   */
  private async sendToMonitoring(
    level: LogLevel,
    message: string,
    context?: LogContext
  ) {
    try {
      // Example: Send to a logging endpoint
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          message,
          context,
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        }),
      }).catch(() => {
        // Don't throw if logging fails
      });
    } catch (error) {
      // Silently fail - logging should never break the app
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
};
