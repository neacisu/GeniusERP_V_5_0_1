/**
 * Period Lock Service
 * 
 * TASK 685: Blocare perioade contabile închise
 * Previne postarea de note contabile în perioade fiscale închise
 */

import { getDrizzle } from '../../../common/drizzle';
import { eq, and, gte, lte } from 'drizzle-orm';

export class PeriodLockService {
  /**
   * Verifică dacă o perioadă este închisă
   */
  public async isPeriodClosed(companyId: string, date: Date): Promise<boolean> {
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
      
      if (result && result.length > 0) {
        return result[0].is_closed === true || result[0].status === 'closed';
      }
      
      // Dacă nu există fiscal_periods, nu blocăm
      return false;
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
      
      console.log(`✅ Perioadă redeschisă: ${startDate.toLocaleDateString('ro-RO')} - ${endDate.toLocaleDateString('ro-RO')}`);
    } catch (error) {
      console.error('❌ Error reopening period:', error);
      throw error;
    }
  }
}

export default PeriodLockService;
