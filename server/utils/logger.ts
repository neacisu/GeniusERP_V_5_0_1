/**
 * Simple logger utility for consistent logging throughout the application
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string): void {
    console.log(`[${new Date().toISOString()}] [INFO] [${this.context}] ${message}`);
  }

  warn(message: string): void {
    console.log(`[${new Date().toISOString()}] [WARN] [${this.context}] ${message}`);
  }

  error(message: string, error?: any): void {
    console.error(`[${new Date().toISOString()}] [ERROR] [${this.context}] ${message}`, error || '');
  }

  debug(message: string): void {
    console.log(`[${new Date().toISOString()}] [DEBUG] [${this.context}] ${message}`);
  }
}