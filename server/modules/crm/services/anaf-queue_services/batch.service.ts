/**
 * Serviciu pentru gestionarea batch-urilor către API-ul ANAF
 * 
 * Responsabil pentru:
 * - Adăugarea cererilor la un batch curent
 * - Verificarea dacă un batch este pregătit pentru procesare
 * - Gestionarea stării batch-urilor în curs
 */

import { v4 as uuidv4 } from 'uuid';
import { AnafBatchRequest, AnafQueueItem } from './types';
import { AnafCacheService } from './cache.service';
import { AnafDatabaseService } from './database.service';

export class AnafBatchService {
  private pendingItems: AnafQueueItem[] = [];
  private lastBatchTime: number = 0;
  private cacheService: AnafCacheService;
  private databaseService: AnafDatabaseService;
  private batchSize: number = 10;
  private batchTimeoutMs: number = 5000;

  /**
   * Constructor pentru AnafBatchService
   * 
   * @param cacheService Serviciul de cache
   * @param databaseService Serviciul de bază de date
   * @param batchSize Dimensiunea maximă a unui batch
   * @param batchTimeoutMs Timeout-ul pentru trimiterea unui batch (ms)
   */
  constructor(
    cacheService: AnafCacheService,
    databaseService: AnafDatabaseService,
    batchSize?: number,
    batchTimeoutMs?: number
  ) {
    this.cacheService = cacheService;
    this.databaseService = databaseService;
    
    if (batchSize) {
      this.batchSize = batchSize;
    }
    
    if (batchTimeoutMs) {
      this.batchTimeoutMs = batchTimeoutMs;
    }
  }

  /**
   * Adaugă o cerere la batch-ul curent
   * 
   * @param item Datele pentru cerere
   */
  async addToBatch(item: AnafQueueItem): Promise<void> {
    // Adăugăm timestamp-ul curent
    const queueItem = {
      ...item,
      timestamp: Date.now()
    };
    
    // Verificăm dacă CUI-ul există deja în batch
    const existingIndex = this.pendingItems.findIndex(i => i.cui === item.cui);
    
    if (existingIndex >= 0) {
      // Actualizăm datele pentru CUI-ul existent
      this.pendingItems[existingIndex] = queueItem;
    } else {
      // Adăugăm un nou item
      this.pendingItems.push(queueItem);
    }
  }

  /**
   * Verifică dacă batch-ul este gata pentru procesare
   * @returns Batch-ul pregătit sau null dacă nu e gata
   */
  async getBatchIfReady(): Promise<AnafBatchRequest | null> {
    const now = Date.now();
    const timeSinceLastBatch = now - this.lastBatchTime;
    
    // Verificăm dacă avem suficiente cereri sau a trecut suficient timp
    if (this.pendingItems.length >= this.batchSize || 
        (this.pendingItems.length > 0 && timeSinceLastBatch >= this.batchTimeoutMs)) {
      
      // Creăm un nou batch cu itemele curente
      const itemsToProcess = [...this.pendingItems];
      
      // Golim lista de cereri în așteptare
      this.pendingItems = [];
      
      // Actualizăm timestamp-ul ultimului batch
      this.lastBatchTime = now;
      
      // Construim și returnăm batch-ul
      const batch: AnafBatchRequest = {
        batchId: uuidv4(),
        cuiList: itemsToProcess.map(item => item.cui),
        requesterId: itemsToProcess[0].requesterId,
        requesterCompanyId: itemsToProcess[0].requesterCompanyId
      };
      
      return batch;
    }
    
    return null;
  }
}