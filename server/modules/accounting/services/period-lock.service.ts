/**
 * Period Lock Service
 * 
 * TASK 685: Blocare perioade contabile închise
 * Previne postarea de note contabile în perioade fiscale închise
 * Enhanced cu Redis caching (TTL: 1h pentru period status checks - apelat la FIECARE entry!)
 */

import { getDrizzle } from '../../../common/drizzle';
import { eq, and, gte, lte } from 'drizzle-orm';
import { RedisService } from '../../../services/redis.service';
import { fiscalPeriods } from '../schema/accounting.schema';
import { createModuleLogger } from '../../../common/logger/loki-logger';

const logger = createModuleLogger('period-lock');

export class PeriodLockService {
  private redisService: RedisService;

  constructor() {
    this.redisService = new RedisService();
  }

  private async ensureRedisConnection(): Promise<void> {
    if (!this.redisService.isConnected()) {
      await this.redisService.connect();
    }
  }
  /**
   * Verifică dacă o perioadă este închisă
   * Redis cache: 1h TTL (apelat la FIECARE entry contabil!)
   */
  public async isPeriodClosed(companyId: string, date: Date): Promise<boolean> {
    await this.ensureRedisConnection();
    
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const cacheKey = `acc:period-lock:${companyId}:${dateKey}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<boolean>(cacheKey);
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    }

    const db = getDrizzle();
    
    try {
      // Verifică în tabelul fiscal_periods cu Drizzle ORM
      const result = await db
        .select({
          status: fiscalPeriods.status,
          isClosed: fiscalPeriods.isClosed
        })
        .from(fiscalPeriods)
        .where(
          and(
            eq(fiscalPeriods.companyId, companyId),
            lte(fiscalPeriods.startDate, date),
            gte(fiscalPeriods.endDate, date)
          )
        )
        .limit(1);
      
      let isClosed = false;
      if (result && result.length > 0) {
        isClosed = result[0].isClosed === true || result[0].status === 'closed';
      }
      
      // Cache result for 1 hour (periods don't change often, but need fresh data)
      if (this.redisService.isConnected()) {
        await this.redisService.setCached(cacheKey, isClosed, 3600);
      }
      
      return isClosed;
    } catch (error) {
      console.error('Error checking period lock:', error);
      // Dacă tabelul nu există, nu blocăm
      return false;
    }
  }
  
  /**
   * Validează că data poate fi folosită (perioada nu e închisă)
   */
  public async validatePeriodOpen(companyId: string, date: Date): Promise<void> {
    const isClosed = await this.isPeriodClosed(companyId, date);
    
    if (isClosed) {
      throw new Error(
        `Perioada contabilă pentru data ${date.toLocaleDateString('ro-RO')} este închisă. ` +
        `Nu puteți adăuga sau modifica înregistrări contabile. ` +
        `Contactați administratorul pentru deschiderea perioadei.`
      );
    }
  }
  
  /**
   * Închide o perioadă fiscală
   */
  public async closePeriod(
    companyId: string,
    startDate: Date,
    endDate: Date,
    userId: string
  ): Promise<void> {
    const db = getDrizzle();
    
    try {
      await db
        .update(fiscalPeriods)
        .set({
          isClosed: true,
          status: 'closed',
          closedBy: userId,
          closedAt: new Date(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(fiscalPeriods.companyId, companyId),
            eq(fiscalPeriods.startDate, startDate),
            eq(fiscalPeriods.endDate, endDate)
          )
        );
      
      // Invalidate cache for this period (all dates in range)
      await this.ensureRedisConnection();
      if (this.redisService.isConnected()) {
        await this.redisService.invalidatePattern(`acc:period-lock:${companyId}:*`);
      }
      
      logger.info('Perioadă închisă cu succes', {
        context: { companyId, startDate, endDate, userId }
      });
    } catch (error) {
      logger.error('Error closing period', { error, context: { companyId, startDate, endDate } });
      throw error;
    }
  }
  
  /**
   * Deschide o perioadă (doar pentru admin)
   */
  public async reopenPeriod(
    companyId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
    reason: string
  ): Promise<void> {
    const db = getDrizzle();
    
    try {
      await db
        .update(fiscalPeriods)
        .set({
          isClosed: false,
          status: 'open',
          reopenedBy: userId,
          reopenedAt: new Date(),
          reopeningReason: reason,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(fiscalPeriods.companyId, companyId),
            eq(fiscalPeriods.startDate, startDate),
            eq(fiscalPeriods.endDate, endDate)
          )
        );
      
      // Invalidate cache for this period (all dates in range)
      await this.ensureRedisConnection();
      if (this.redisService.isConnected()) {
        await this.redisService.invalidatePattern(`acc:period-lock:${companyId}:*`);
      }
      
      logger.info('Perioadă redeschisă cu succes', {
        context: { companyId, startDate, endDate, userId, reason }
      });
    } catch (error) {
      logger.error('Error reopening period', { error, context: { companyId, startDate, endDate } });
      throw error;
    }
  }
}

export default PeriodLockService;
