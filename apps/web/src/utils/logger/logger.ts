/**
 * Client-side logging system
 * 
 * This module provides a comprehensive client-side logging system with
 * multiple log levels, context tracking, performance timing, and structured output.
 * 
 * It's designed to be used throughout the application with minimal overhead,
 * while providing rich debugging information when needed.
 */

import { maskSensitiveData } from '@/lib/utils/security-logger';

// Log levels in order of increasing severity
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Additional context information for logs
export interface LogContext {
  [key: string]: any;
}

// Timer data for performance tracking
interface TimerData {
  startTime: number;
  label: string;
}

// Configuration for the logger
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  includeTimestamp: boolean;
  context?: LogContext;
}

/**
 * Client-side logger with support for multiple log levels,
 * context tracking, and performance timing
 */
class Logger {
  private module: string;
  private config: LoggerConfig;
  private timers: Map<string, TimerData>;
  
  // Log level priority map for filtering
  private static LOG_LEVELS: { [key in LogLevel]: number } = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(module: string, config?: Partial<LoggerConfig>) {
    this.module = module;
    this.timers = new Map();
    
    // Default configuration
    // Folosește import.meta.env pentru Vite (browser), nu process.env
    this.config = {
      minLevel: import.meta.env.PROD ? 'warn' : 'debug',
      enableConsole: true,
      includeTimestamp: true,
      ...config
    };
  }

  /**
   * Add context to all future log messages
   */
  public setContext(context: LogContext): void {
    this.config.context = { ...this.config.context, ...context };
  }

  /**
   * Clear all context data
   */
  public clearContext(): void {
    this.config.context = undefined;
  }

  /**
   * Log a debug message
   */
  public debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log an info message
   */
  public info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   */
  public error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  /**
   * Internal log method that handles all log levels
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    // Check if we should log this message based on level
    if (Logger.LOG_LEVELS[level] < Logger.LOG_LEVELS[this.config.minLevel]) {
      return;
    }

    // Create the log entry with timestamp, module, and merged context
    const timestamp = this.config.includeTimestamp ? new Date().toISOString() : undefined;
    const mergedContext = context || this.config.context ? {
      ...this.config.context,
      ...context
    } : undefined;
    
    const entry = {
      timestamp,
      level,
      module: this.module,
      message,
      context: mergedContext
    };

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.consoleOutput(level, entry);
    }
  }

  /**
   * Format and output log entry to console
   * Obfuscă automat date sensibile din context
   */
  private consoleOutput(level: LogLevel, entry: any): void {
    const { timestamp, module, message, context } = entry;
    
    // Format the prefix with timestamp and module name
    let prefix = `[${module}]`;
    if (timestamp) {
      prefix = `[${timestamp.split('T')[1].replace('Z', '')}] ${prefix}`;
    }
    
    // Select appropriate console method based on level
    let consoleMethod: (...data: any[]) => void;
    switch (level) {
      case 'debug':
        consoleMethod = console.debug;
        break;
      case 'info':
        consoleMethod = console.info;
        break;
      case 'warn':
        consoleMethod = console.warn;
        break;
      case 'error':
        consoleMethod = console.error;
        break;
      default:
        consoleMethod = console.log;
    }
    
    // Obfuscă date sensibile din context
    const maskedContext = context ? maskSensitiveData(context) : context;
    
    // Output the log entry
    if (maskedContext && Object.keys(maskedContext).length > 0) {
      consoleMethod(`${prefix} ${message}`, maskedContext);
    } else {
      consoleMethod(`${prefix} ${message}`);
    }
  }

  /**
   * Start a timer for performance tracking
   */
  public startTimer(label: string): void {
    this.timers.set(label, {
      startTime: performance.now(),
      label
    });
    this.debug(`Timer started: ${label}`);
  }

  /**
   * End a timer and log the duration
   */
  public endTimer(label: string): number | null {
    const timer = this.timers.get(label);
    if (!timer) {
      this.warn(`Timer not found: ${label}`);
      return null;
    }
    
    const endTime = performance.now();
    const duration = endTime - timer.startTime;
    
    this.timers.delete(label);
    this.debug(`Timer ended: ${label} (${duration.toFixed(2)}ms)`);
    
    return duration;
  }
}

/**
 * Factory function to create loggers for different modules
 */
export function createLogger(module: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger(module, config);
}

// Export types and constants for use elsewhere
export const LogLevels = Logger['LOG_LEVELS'];