/**
 * Redis Configuration
 * 
 * Configurare pentru serviciul Redis folosit de cozile BullMQ pentru
 * stocarea job-urilor și managementul rate-limiting-ului.
 */
import * as dotenv from 'dotenv';

dotenv.config();

// Configurări implicite pentru Redis
const DEFAULT_REDIS_HOST = 'localhost';
const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_REDIS_PASSWORD = '';
const DEFAULT_REDIS_DB = 0;
const DEFAULT_REDIS_PREFIX = 'anaf:';

/**
 * Returnează configurația pentru conexiunile Redis
 * 
 * @param withPrefix Dacă se dorește includerea unui prefix în configurație (nu pentru BullMQ)
 * @returns Configurația Redis
 */
export function getRedisConfig(withPrefix: boolean = false) {
  // Extrage valorile din variabilele de mediu sau folosește valorile implicite
  const host = process.env['REDIS_HOST'] || DEFAULT_REDIS_HOST;
  const port = parseInt(process.env['REDIS_PORT'] || DEFAULT_REDIS_PORT.toString(), 10);
  const password = process.env['REDIS_PASSWORD'] || DEFAULT_REDIS_PASSWORD;
  const db = parseInt(process.env['REDIS_DB'] || DEFAULT_REDIS_DB.toString(), 10);
  const prefix = process.env['REDIS_PREFIX'] || DEFAULT_REDIS_PREFIX;
  
  // Construiește URL-ul Redis pentru conexiuni cloud (opțional)
  const redisUrl = process.env['REDIS_URL'];
  
  // Configurație de bază
  const baseConfig = {
    host,
    port,
    password: password || undefined,
    db,
    url: redisUrl,
    
    // Opțiuni suplimentare pentru robustețe
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => {
      // Strategie de reîncercare exponențială: 500ms, apoi 1s, 2s, 4s, etc. până la max 30s
      const delay = Math.min(Math.pow(2, times) * 500, 30000);
      return delay;
    },
    enableReadyCheck: true,
    reconnectOnError: (err: Error) => {
      // Reconectare doar pentru anumite tipuri de erori
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    }
  };
  
  // Adaugă prefix doar dacă este cerut
  if (withPrefix) {
    return {
      ...baseConfig,
      keyPrefix: prefix
    };
  }
  
  return baseConfig;
}

/**
 * Obține configurația Redis destinată BullMQ
 * BullMQ nu acceptă prefixarea la nivel de conexiune
 */
export function getBullMQRedisConfig() {
  // Obține configurația Redis fără prefix
  const baseConfig = getRedisConfig(false);
  
  // Obține prefixul pentru a-l folosi în opțiunile BullMQ
  const prefix = process.env['REDIS_PREFIX'] || DEFAULT_REDIS_PREFIX;
  
  return {
    connection: baseConfig,
    // Prefix-ul va fi setat la nivel de Queue în BullMQ
    prefix
  };
}

/**
 * Returnează un URL Redis bazat pe configurație
 */
export function getRedisUrl(): string {
  if (process.env['REDIS_URL']) {
    return process.env['REDIS_URL'];
  }
  
  const config = getRedisConfig();
  const auth = config.password ? `:${config.password}@` : '';
  
  return `redis://${auth}${config.host}:${config.port}/${config.db}`;
}