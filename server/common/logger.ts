/**
 * Logger module for consistent logging across the application
 */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

/**
 * Default log level
 */
export const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LogLevel.INFO 
  : LogLevel.DEBUG;

/**
 * Log level priority (higher number = higher priority)
 */
const LOG_LEVEL_PRIORITY = {
  [LogLevel.ERROR]: 40,
  [LogLevel.WARN]: 30,
  [LogLevel.INFO]: 20,
  [LogLevel.DEBUG]: 10
};

/**
 * ANSI color codes for different log levels
 */
const LOG_LEVEL_COLORS = {
  [LogLevel.ERROR]: '\x1b[31m', // red
  [LogLevel.WARN]: '\x1b[33m',  // yellow
  [LogLevel.INFO]: '\x1b[36m',  // cyan
  [LogLevel.DEBUG]: '\x1b[90m'  // gray
};

/**
 * Reset ANSI color code
 */
const RESET_COLOR = '\x1b[0m';

/**
 * Logger class for consistent logging across the application
 */
export class Logger {
  private serviceName: string;
  private logLevel: LogLevel;

  /**
   * Create a new logger instance
   * @param serviceName Name of the service using this logger
   * @param logLevel Minimum log level to display
   */
  constructor(serviceName: string, logLevel: LogLevel = DEFAULT_LOG_LEVEL) {
    this.serviceName = serviceName;
    this.logLevel = logLevel;
  }

  /**
   * Format a log message with timestamp and service prefix
   * @param level Log level
   * @param message Log message
   * @returns Formatted message
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const color = LOG_LEVEL_COLORS[level];
    return `${color}[${timestamp}] [${level}] [${this.serviceName}]${RESET_COLOR} ${message}`;
  }

  /**
   * Check if a log level should be displayed
   * @param level Log level to check
   * @returns Boolean indicating if log should be displayed
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.logLevel];
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param error Optional error object
   */
  error(message: string, error?: unknown): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message));
      if (error) {
        if (error instanceof Error) {
          console.error(error.stack || error.message);
        } else {
          console.error(error);
        }
      }
    }
  }

  /**
   * Log a warning message
   * @param message Message to log
   */
  warn(message: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message));
    }
  }

  /**
   * Log an info message
   * @param message Message to log
   */
  info(message: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message));
    }
  }

  /**
   * Log a debug message
   * @param message Message to log
   */
  debug(message: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message));
    }
  }

  /**
   * Set the log level
   * @param level New log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}