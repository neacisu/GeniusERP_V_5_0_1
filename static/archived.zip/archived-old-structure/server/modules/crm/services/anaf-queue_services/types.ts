/**
 * Tipuri pentru serviciul ANAF Queue
 */

/**
 * Sursele de date ANAF
 */
export enum AnafDataSource {
  CACHE = 'cache',
  DATABASE = 'database',
  API = 'api'
}

/**
 * Configurația pentru serviciul ANAF Queue
 */
export interface AnafQueueConfig {
  redisUrl: string;
  queueName: string;
  batchSize: number;
  batchTimeoutMs: number;
  cacheTimeoutSec: number;
  redisPrefix?: string;
}

/**
 * Cererea batch pentru API-ul ANAF
 */
export interface AnafBatchRequest {
  batchId: string;
  cuiList: string[];
  requesterId: string;
  requesterCompanyId: string;
}

/**
 * Item pentru cerere individuală
 */
export interface AnafQueueItem {
  cui: string;
  requesterId: string;
  requesterCompanyId: string;
  timestamp?: number;
}

/**
 * Rezultatul unei cereri ANAF
 */
export interface AnafRequestResult {
  company: any | null;
  source?: AnafDataSource;
  error?: Error;
}

/**
 * Creează configurația implicită pentru serviciul ANAF Queue
 * 
 * @param config Configurația parțială opțională
 * @returns Configurația completă
 */
export function createDefaultConfig(config?: Partial<AnafQueueConfig>): AnafQueueConfig {
  return {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    queueName: 'anaf-queue',
    batchSize: 10,
    batchTimeoutMs: 5000, // 5 secunde
    cacheTimeoutSec: 3600, // 1 oră
    redisPrefix: 'anaf:',
    ...config
  };
}