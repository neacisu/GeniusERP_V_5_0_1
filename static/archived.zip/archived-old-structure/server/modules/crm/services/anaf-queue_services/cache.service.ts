/**
 * ANAF Cache Service
 * 
 * Serviciu pentru gestionarea cache-ului Redis pentru datele ANAF.
 * Implementează operațiuni de citire și scriere cu TTL și tratare erori.
 */

import Redis from 'ioredis';
import { AnafCompanyData } from '../anaf.service';
import { AnafQueueConfig } from './types';

export class AnafCacheService {
  private redis: Redis;
  private cacheTime: number;
  private prefix: string;

  /**
   * Constructor pentru AnafCacheService
   * 
   * @param config Configurația pentru cache
   * @param redisInstance O instanță Redis opțională (dacă nu este furnizată, se va crea una)
   */
  constructor(config: AnafQueueConfig, redisInstance?: Redis) {
    if (redisInstance) {
      // Utilizăm instanța Redis existentă dacă e furnizată
      this.redis = redisInstance;
      console.log('[AnafCacheService] Utilizare instanță Redis partajată');
    } else {
      // Creăm propria instanță Redis cu aceleași credențiale
      console.log('[AnafCacheService] Creăm o nouă instanță Redis pentru cache');
      
      // Obținem datele de conectare
      const host = process.env.REDIS_HOST || 'localhost';
      const port = parseInt(process.env.REDIS_PORT || '6379', 10);
      const username = process.env.REDIS_USERNAME || '';
      const password = process.env.REDIS_PASSWORD || '';
      
      // Opțiunile de conectare
      const redisOptions = {
        host: host,
        port: port,
        username: username || undefined,
        password: password || undefined,
        maxRetriesPerRequest: null, // Obligatoriu pentru BullMQ
        enableReadyCheck: false,    // Dezactivează verificări care pot cauza probleme
        retryStrategy: (times: number) => {
          if (times > 3) return null; // Oprim reîncercarea după 3 încercări
          return Math.min(times * 500, 3000); // Întârziere exponențială
        },
      };
      
      console.log(`[AnafCacheService] Conectare la Redis: ${host}:${port}`);
      this.redis = new Redis(redisOptions);
      
      this.redis.on('error', (err) => {
        console.error('[AnafCacheService] Eroare Redis:', err.message);
      });
    }
    
    this.cacheTime = config.cacheTimeoutSec;
    this.prefix = 'anaf:company:';
  }

  /**
   * Obține o înregistrare din cache
   * 
   * @param cui CUI-ul companiei
   * @returns Date despre companie sau null dacă nu există
   */
  async get(cui: string): Promise<AnafCompanyData | null> {
    try {
      const key = this.getKey(cui);
      const data = await this.redis.get(key);
      
      if (!data) {
        return null;
      }
      
      return JSON.parse(data) as AnafCompanyData;
    } catch (error) {
      console.error(`[AnafCacheService] Eroare la obținerea datelor din cache pentru CUI ${cui}:`, error);
      return null;
    }
  }

  /**
   * Salvează o înregistrare în cache
   * 
   * @param cui CUI-ul companiei 
   * @param data Datele companiei
   * @returns true dacă operațiunea a reușit, false altfel
   */
  async set(cui: string, data: AnafCompanyData): Promise<boolean> {
    try {
      const key = this.getKey(cui);
      const serializedData = JSON.stringify(data);
      
      // Stabilim TTL (time-to-live) pentru cache
      const setResult = await this.redis.set(key, serializedData, 'EX', this.cacheTime);
      
      return setResult === 'OK';
    } catch (error) {
      console.error(`[AnafCacheService] Eroare la salvarea datelor în cache pentru CUI ${cui}:`, error);
      return false;
    }
  }

  /**
   * Șterge o înregistrare din cache
   * 
   * @param cui CUI-ul companiei
   * @returns true dacă operațiunea a reușit, false altfel
   */
  async delete(cui: string): Promise<boolean> {
    try {
      const key = this.getKey(cui);
      const delResult = await this.redis.del(key);
      
      return delResult > 0;
    } catch (error) {
      console.error(`[AnafCacheService] Eroare la ștergerea datelor din cache pentru CUI ${cui}:`, error);
      return false;
    }
  }

  /**
   * Obține cheia pentru cache
   * 
   * @param cui CUI-ul companiei
   * @returns Cheia pentru Redis
   */
  private getKey(cui: string): string {
    return `${this.prefix}${cui}`;
  }

  /**
   * Închide conexiunea Redis
   */
  async close(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      console.error('[AnafCacheService] Eroare la închiderea conexiunii Redis:', error);
    }
  }
}