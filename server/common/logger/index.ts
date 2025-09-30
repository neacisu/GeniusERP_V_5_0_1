/**
 * Logger Service
 * 
 * Simple logger service for application-wide logging.
 */

// Simple console-based Logger
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, ...optionalParams: any[]) {
    console.log(`[${new Date().toISOString()}] [INFO] [${this.context}] ${message}`, ...optionalParams);
  }

  warn(message: string, ...optionalParams: any[]) {
    console.warn(`[${new Date().toISOString()}] [WARN] [${this.context}] ${message}`, ...optionalParams);
  }

  error(message: string, error?: any) {
    console.error(`[${new Date().toISOString()}] [ERROR] [${this.context}] ${message}`, error || '');
  }

  debug(message: string, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] [${this.context}] ${message}`, ...optionalParams);
    }
  }
}

// Export singleton logger for global usage
export default Logger;