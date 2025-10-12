import { createModuleLogger as createLokiLogger } from '../common/logger/loki-logger';

/**
 * Simple logger utility for consistent logging throughout the application
 * Integrates with Loki for centralized logging and Sentry for error tracking
 */
export class Logger {
  private context: string;
  private lokiLogger: ReturnType<typeof createLokiLogger>;

  constructor(context: string) {
    this.context = context;
    this.lokiLogger = createLokiLogger(context);
  }

  info(message: string): void {
    this.lokiLogger.info(message);
  }

  warn(message: string): void {
    this.lokiLogger.warn(message);
  }

  error(message: string, error?: any): void {
    // Use Loki logger which automatically integrates with Sentry
    this.lokiLogger.error(message, error);
  }

  debug(message: string): void {
    this.lokiLogger.debug(message);
  }
}