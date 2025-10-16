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
      // Verifică în tabelul fiscal_periods dacă există
      const result = await db.$client.unsafe(`
        SELECT status, is_closed FROM fiscal_periods 
        WHERE company_id = $1 
        AND start_date <= $2 
        AND end_date >= $2
        LIMIT 1
      `, [companyId, date]);
      
      let isClosed = false;
      if (result && result.length > 0) {
        isClosed = result[0].is_closed === true || result[0].status === 'closed';
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
      await db.$client.unsafe(`
        UPDATE fiscal_periods 
        SET is_closed = true, 
            status = 'closed',
            closed_by = $1,
            closed_at = NOW(),
            updated_at = NOW()
        WHERE company_id = $2 
        AND start_date = $3 
        AND end_date = $4
      `, [userId, companyId, startDate, endDate]);
      
      // Invalidate cache for this period (all dates in range)
      await this.ensureRedisConnection();
      if (this.redisService.isConnected()) {
        await this.redisService.invalidatePattern(`acc:period-lock:${companyId}:*`);
      }
      
      console.log(`✅ Perioadă închisă: ${startDate.toLocaleDateString('ro-RO')} - ${endDate.toLocaleDateString('ro-RO')}`);
    } catch (error) {
      console.error('❌ Error closing period:', error);
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
      await db.$client.unsafe(`
        UPDATE fiscal_periods 
        SET is_closed = false, 
            status = 'open',
            reopened_by = $1,
            reopened_at = NOW(),
            reopening_reason = $2,
            updated_at = NOW()
        WHERE company_id = $3 
        AND start_date = $4 
        AND end_date = $5
      `, [userId, reason, companyId, startDate, endDate]);
      
      // Invalidate cache for this period (all dates in range)
      await this.ensureRedisConnection();
      if (this.redisService.isConnected()) {
        await this.redisService.invalidatePattern(`acc:period-lock:${companyId}:*`);
      }
      
      console.log(`✅ Perioadă redeschisă: ${startDate.toLocaleDateString('ro-RO')} - ${endDate.toLocaleDateString('ro-RO')}`);
    } catch (error) {
      console.error('❌ Error reopening period:', error);
      throw error;
    }
  }
}

export default PeriodLockService;
