/**
 * Serviciul principal ANAF Queue
 * Gestionează cererile către API-ul ANAF folosind BullMQ pentru a evita
 * depășirea limitelor de rate (1 request/secundă, maximum 100 CUI-uri per cerere).
 * Implementează caching, batch processing și rate limiting.
 */

import { Queue, Worker, ConnectionOptions, Job } from 'bullmq';
import Redis from 'ioredis';
import { AnafCacheService } from './cache.service';
import { AnafDatabaseService } from './database.service';
import { AnafBatchService } from './batch.service';
import { AnafBatchRequest, AnafDataSource, AnafQueueConfig, AnafRequestResult, createDefaultConfig } from './types';
import { AnafCompanyData } from '../anaf.service';
import { anafService } from '../anaf.service';
import { v4 as uuidv4 } from 'uuid';
import { getRedisConfig } from '../../../../config/redis';
import * as dotenv from 'dotenv';
import { RedisService } from '../../../../services/redis.service';

export class AnafQueueService {
  private queue: Queue;
  private worker: Worker;
  private cacheService: AnafCacheService;
  private databaseService: AnafDatabaseService;
  private batchService: AnafBatchService;
  private config: AnafQueueConfig;
  private callbacks: Map<string, (result: AnafRequestResult) => void> = new Map();
  private initializeAttempts = 0;
  private maxInitializeAttempts = 5;
  private redisConnected = false;

  /**
   * Constructor pentru serviciul ANAF Queue
   * @param config Configurația pentru ANAF Queue
   */
  constructor(config?: Partial<AnafQueueConfig>) {
    this.config = createDefaultConfig(config);
    // Inițializăm serviciile asincron, fără a aștepta finalizarea
    this.initializeServices().catch(err => {
      console.error('[AnafQueueService] Eroare la inițializarea asincronă:', err);
    });
  }

  /**
   * Inițializează serviciile și conexiunile
   */
  private async initializeServices() {
    try {
      // Creăm o conexiune Redis direct cu opțiunile cerute de BullMQ
      console.log('[AnafQueueService] Inițializare cu conexiune Redis pentru BullMQ...');
      
      // Construim URL-ul complet Redis pentru a asigura autentificarea corectă
      const host = process.env.REDIS_HOST || 'localhost';
      const port = parseInt(process.env.REDIS_PORT || '6379', 10);
      const username = process.env.REDIS_USERNAME || '';
      const password = process.env.REDIS_PASSWORD || '';
      
      // Pentru depanare, afișăm informații despre conexiune (fără parola)
      console.log(`[AnafQueueService] Conectare la Redis: ${host}:${port}, utilizator: ${username || '[none]'}, parolă: ${password ? '[hidden]' : '[none]'}`);
      
      // Determina dacă utilizăm Redis Cloud
      const isRedisCloud = host.includes('redis-cloud') || 
                          host.includes('cloud.redislabs.com') || 
                          host.includes('upstash.io') ||
                          host.includes('redis.cache.windows.net');
      
      // Nu folosim URL-uri pentru Redis pentru a evita probleme SSL
      // În schimb, folosim opțiuni directe
      console.log(`[AnafQueueService] Configurare Redis directă pentru: ${host}:${port}`);
      
      // BullMQ necesită maxRetriesPerRequest = null
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
      
      // Nu activăm TLS pentru a evita problemele SSL
      // Redis Cloud lucrează și fără TLS pe porturile standard
      console.log(`[AnafQueueService] Opțiuni Redis: ${JSON.stringify({
        ...redisOptions,
        password: redisOptions.password ? '[hidden]' : undefined
      })}`);
      
      const redisClient = new Redis(redisOptions);
      
      redisClient.on('error', (err) => {
        console.error('[AnafQueueService] Eroare Redis:', err.message);
      });
      
      // Opțiuni pentru conexiunea BullMQ
      const connectionOptions: ConnectionOptions = {
        connection: redisClient
      };

      // Creăm instanța Queue pentru procesarea batch-urilor
      this.queue = new Queue(this.config.queueName, connectionOptions);
      
      // Adăugăm handler pentru erori la coadă
      this.queue.on('error', (error) => {
        console.error(`[AnafQueueService] Eroare coadă: ${error.message}`);
      });
      
      // Creăm instanțele pentru serviciile componente
      this.cacheService = new AnafCacheService(this.config);
      this.databaseService = new AnafDatabaseService();
      this.batchService = new AnafBatchService(this.cacheService, this.databaseService);
      
      // Creăm worker-ul pentru procesarea batch-urilor
      this.worker = new Worker(this.config.queueName, 
        async (job) => await this.processBatch(job),
        connectionOptions
      );

      // Asigurăm-ne că avem acces la date chiar dacă worker-ul întâmpină erori
      this.worker.on('failed', (job, error) => {
        console.error(`[AnafQueueService] Eroare la procesarea job-ului ${job?.id}:`, error);
        
        // Recuperăm erorile și notificăm callback-urile
        if (job?.data) {
          const batchData = job.data as AnafBatchRequest;
          
          // Notificăm toate callback-urile că a apărut o eroare
          for (const cui of batchData.cuiList) {
            const requestId = `${cui}_${batchData.requesterId}`;
            this.notifyRequestComplete(requestId, {
              company: null,
              error: new Error(`Eroare la procesarea cererii batch: ${error.message}`)
            });
          }
        }
      });
      
      this.redisConnected = true;
      console.log(`[AnafQueueService] Serviciu inițializat cu succes. Redis conectat.`);
    } catch (error) {
      console.error('[AnafQueueService] Eroare la inițializarea serviciilor:', error);
      this.redisConnected = false;
      
      // În caz de eroare, încercăm din nou doar de câteva ori
      if (this.initializeAttempts < this.maxInitializeAttempts) {
        this.initializeAttempts++;
        console.log(`[AnafQueueService] Reîncercare conectare (${this.initializeAttempts}/${this.maxInitializeAttempts})...`);
        setTimeout(() => this.initializeServices(), 5000);
      }
    }
  }

  /**
   * Cere date despre o companie folosind CUI-ul
   * Implementează strategia de caching și batching
   * 
   * @param cui CUI-ul companiei
   * @param userId ID-ul utilizatorului care face cererea
   * @param companyId ID-ul companiei utilizatorului
   * @returns Promise cu datele companiei sau null dacă nu s-au găsit
   */
  async queueCompanyRequest(cui: string, userId: string, companyId: string): Promise<AnafCompanyData | null> {
    return new Promise<AnafCompanyData | null>(async (resolve, reject) => {
      try {
        // Verificare autentificare
        if (!userId || userId === 'anonymous' || userId === 'unknown') {
          console.error(`[AnafQueueService] ❌ Utilizator neautentificat (${userId}) pentru CUI ${cui}. Nu se poate continua.`);
          return reject(new Error('Nu sunteți autentificat. Vă rugăm să vă autentificați și să încercați din nou.'));
        }
        
        // Validăm CUI-ul
        if (!cui || typeof cui !== 'string' || cui.trim() === '') {
          console.error(`[AnafQueueService] ❌ CUI invalid sau gol: "${cui}"`);
          return reject(new Error('CUI invalid sau gol'));
        }
        
        // Curățăm CUI-ul de prefixul RO și spații
        const cleanCui = cui.replace(/^RO/i, '').trim();
        
        console.log(`[AnafQueueService] 🔍 Cerere ANAF pentru CUI ${cleanCui} de la utilizator ${userId}, companie ${companyId}`);
        
        // Verificăm mai întâi în cache
        const cachedData = await this.cacheService.get(cleanCui);
        if (cachedData) {
          console.log(`[AnafQueueService] ✅ Date găsite în cache pentru CUI ${cleanCui}`);
          console.log('[AnafQueueService] Date în cache: ', JSON.stringify(cachedData).substring(0, 200) + '...');
          
          // Verificăm dacă datele există și în baza de date
          const dbDataExists = await this.databaseService.getCompanyData(cleanCui);
          if (!dbDataExists) {
            // Dacă datele nu există în baza de date, le salvăm
            console.log(`[AnafQueueService] 🔄 Sincronizare date cache -> DB pentru CUI ${cleanCui}`);
            const savedToDB = await this.databaseService.saveCompanyData(cleanCui, cachedData);
            if (savedToDB) {
              console.log(`[AnafQueueService] ✅ Date salvate cu succes în DB din cache pentru CUI ${cleanCui}`);
            } else {
              console.error(`[AnafQueueService] ❌ Eroare la salvarea datelor din cache în DB pentru CUI ${cleanCui}`);
            }
          } else {
            console.log(`[AnafQueueService] ℹ️ Date existente în DB pentru CUI ${cleanCui}`);
          }
          
          return resolve(cachedData);
        }
        
        // Verificăm apoi în baza de date
        const dbData = await this.databaseService.getCompanyData(cleanCui);
        if (dbData) {
          console.log(`[AnafQueueService] ✅ Date găsite în baza de date pentru CUI ${cleanCui}`);
          
          // Salvăm în cache pentru acces rapid ulterior
          await this.cacheService.set(cleanCui, dbData);
          
          return resolve(dbData);
        }
        
        // Dacă nu avem date, facem o cerere nouă către API-ul ANAF
        console.log(`[AnafQueueService] Cerere nouă pentru CUI ${cui}`);
        
        // Generăm un ID unic pentru această cerere
        const requestId = `${cui}_${userId}`;
        
        // Înregistrăm un callback pentru a fi notificați când cererea este completă
        this.callbacks.set(requestId, (result: AnafRequestResult) => {
          if (result.error) {
            reject(result.error);
          } else {
            resolve(result.company);
          }
        });
        
        // Adăugăm cererea la batch pentru procesare
        await this.batchService.addToBatch({
          cui,
          requesterId: userId,
          requesterCompanyId: companyId
        });
        
        // Verificăm dacă batch-ul este gata de procesare
        const batch = await this.batchService.getBatchIfReady();
        
        if (batch) {
          // Dacă batch-ul este gata, îl trimitem pentru procesare
          await this.queue.add('processBatch', batch, {
            removeOnComplete: true,
            removeOnFail: 5000,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000
            }
          });
        }
      } catch (error) {
        console.error(`[AnafQueueService] Eroare la procesarea cererii pentru CUI ${cui}:`, error);
        reject(error);
      }
    });
  }

  /**
   * Procesează un batch de cereri către API-ul ANAF
   * @param job Job-ul BullMQ
   */
  private async processBatch(job: Job): Promise<void> {
    const batchData = job.data as AnafBatchRequest;
    console.log(`[AnafQueueService] Procesare batch ${batchData.batchId} cu ${batchData.cuiList.length} CUI-uri`);
    
    try {
      // Apelăm API-ul ANAF folosind serviciul ANAF
      const response = await anafService.queryAnaf(batchData.cuiList);
      
      // Procesăm răspunsul și salvăm datele
      if (response && response.found && Array.isArray(response.found)) {
        // Pentru fiecare companie găsită, actualizăm cache-ul și baza de date
        for (const company of response.found) {
          // Obținem CUI-ul companiei din obiectul date_generale
          const cui = company.date_generale?.cui || '';
          console.log(`[AnafQueueService] Procesare date pentru CUI ${cui} din API`);
          console.log('[AnafQueueService] Date primite: ', JSON.stringify(company).substring(0, 200) + '...');
          
          // Salvăm în cache
          await this.cacheService.set(cui, company);
          
          // Salvăm în baza de date și verificăm rezultatul
          const savedToDB = await this.databaseService.saveCompanyData(cui, company);
          if (savedToDB) {
            console.log(`[AnafQueueService] ✅ Date salvate cu succes în DB pentru CUI ${cui}`);
          } else {
            console.error(`[AnafQueueService] ❌ Eroare la salvarea datelor în DB pentru CUI ${cui}`);
          }
          
          // Notificăm callback-ul că datele sunt disponibile
          const requestId = `${cui}_${batchData.requesterId}`;
          this.notifyRequestComplete(requestId, { 
            company, 
            source: AnafDataSource.API 
          });
        }
      }
      
      // Pentru CUI-urile care nu au fost găsite, notificăm callback-urile
      if (response && response.notFound && Array.isArray(response.notFound)) {
        for (const cui of response.notFound) {
          const requestId = `${cui}_${batchData.requesterId}`;
          this.notifyRequestComplete(requestId, { 
            company: null,
            source: AnafDataSource.API
          });
        }
      }
    } catch (error) {
      console.error(`[AnafQueueService] Eroare la procesarea batch-ului ${batchData.batchId}:`, error);
      
      // În caz de eroare, notificăm toate callback-urile
      for (const cui of batchData.cuiList) {
        const requestId = `${cui}_${batchData.requesterId}`;
        this.notifyRequestComplete(requestId, {
          company: null,
          error: error instanceof Error ? error : new Error('Eroare necunoscută la procesarea batch-ului')
        });
      }
    }
  }

  /**
   * Notifică callback-urile că o cerere a fost completată
   * @param cui CUI-ul companiei
   * @param result Rezultatul cererii
   */
  private notifyRequestComplete(requestId: string, result: AnafRequestResult): void {
    // Găsim callback-ul pentru acest CUI și îl apelăm
    const callback = this.callbacks.get(requestId);
    if (callback) {
      callback(result);
      this.callbacks.delete(requestId);
    }
  }

  /**
   * Închide conexiunile și eliberează resursele
   */
  async close(): Promise<void> {
    try {
      console.log('[AnafQueueService] Închidere serviciu...');
      
      // Închidem componentele în ordine
      if (this.worker) {
        await this.worker.close();
      }
      
      if (this.queue) {
        await this.queue.close();
      }
      
      await this.cacheService.close();
      
      console.log('[AnafQueueService] Serviciu închis cu succes');
    } catch (error) {
      console.error('[AnafQueueService] Eroare la închiderea serviciului:', error);
    }
  }
}

// Creăm și exportăm o singură instanță a serviciului
const anafQueueService = new AnafQueueService();
export { anafQueueService };