/**
 * Central Logger Export
 * Use this throughout the application instead of console.log
 */

export { 
  log, 
  createModuleLogger, 
  logOperation, 
  logHttpRequest,
  type LogContext 
} from './loki-logger';

export { default as logger } from './loki-logger';
