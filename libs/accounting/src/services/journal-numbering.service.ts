/**
 * Journal Numbering Service
 * 
 * TASK 686: Numerotare cronologică note contabile
 * Asigură numerotare secvențială pentru fiecare tip de jurnal
 */

import { getDrizzle } from "@common/drizzle";
import { LedgerEntryType } from './journal.service';
import { documentCounters } from '@geniuserp/shared';
import { eq, and, sql } from 'drizzle-orm';
import { createModuleLogger } from "@common/logger/loki-logger";

const logger = createModuleLogger('journal-numbering');

export class JournalNumberingService {
  /**
   * Generează număr secvențial pentru notă contabilă
   * Format: SALES/2025/00001, PURCHASE/2025/00045, etc.
   */
  public async generateJournalNumber(
    companyId: string,
    journalType: LedgerEntryType,
    date: Date
  ): Promise<string> {
    const db = getDrizzle();
    const year = date.getFullYear();
    const series = this.getJournalSeries(journalType);
    
    try {
      // Strategie: INSERT cu ON CONFLICT pentru thread-safe increment
      // Drizzle ORM nu suportă direct ON CONFLICT DO UPDATE cu RETURNING,
      // deci folosim sql template pentru această operație atomică
      const result = await db.execute<{ last_number: number | string }>(sql`
        INSERT INTO ${documentCounters} (company_id, counter_type, series, year, last_number)
        VALUES (${companyId}, 'JOURNAL', ${series}, ${year}, 1)
        ON CONFLICT (company_id, counter_type, series, year)
        DO UPDATE SET 
          last_number = ${documentCounters.lastNumber} + 1,
          updated_at = NOW()
        RETURNING last_number
      `);
      
      const rows = result as unknown as Array<{ last_number: number | string }>;
      const lastNumber = typeof rows[0].last_number === 'string' 
        ? parseInt(rows[0].last_number, 10) 
        : rows[0].last_number;
      
      const number = lastNumber.toString().padStart(5, '0');
      
      logger.info('Journal number generated', {
        context: { companyId, journalType, series, year, number }
      });
      
      return `${series}/${year}/${number}`;
    } catch (error) {
      logger.error('Error generating journal number', { 
        error, 
        context: { companyId, journalType, series, year } 
      });
      
      // Fallback: număr aleator (nu ideal, dar prevent crash)
      const fallbackNumber = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
      return `${series}/${year}/${fallbackNumber}`;
    }
  }
  
  /**
   * Mapare tip jurnal la serie
   */
  private getJournalSeries(type: LedgerEntryType): string {
    const seriesMap: Record<LedgerEntryType, string> = {
      [LedgerEntryType.SALES]: 'JV',        // Journal Vânzări
      [LedgerEntryType.PURCHASE]: 'JC',     // Journal Cumpărări
      [LedgerEntryType.CASH]: 'JCS',        // Journal Casă
      [LedgerEntryType.BANK]: 'JB',         // Journal Bancă
      [LedgerEntryType.GENERAL]: 'JG',      // Journal General
      [LedgerEntryType.ADJUSTMENT]: 'JA',   // Journal Ajustări
      [LedgerEntryType.REVERSAL]: 'JR'      // Journal Stornări
    };
    
    return seriesMap[type] || 'JG';
  }
  
  /**
   * Obține ultimul număr folosit
   */
  public async getLastJournalNumber(
    companyId: string,
    journalType: LedgerEntryType,
    year: number
  ): Promise<number> {
    const db = getDrizzle();
    const series = this.getJournalSeries(journalType);
    
    try {
      const result = await db
        .select({ lastNumber: documentCounters.lastNumber })
        .from(documentCounters)
        .where(
          and(
            eq(documentCounters.companyId, companyId),
            eq(documentCounters.counterType, 'JOURNAL'),
            eq(documentCounters.series, series),
            eq(documentCounters.year, year.toString())
          )
        )
        .limit(1);
      
      if (result && result.length > 0) {
        const lastNumber = result[0].lastNumber;
        return typeof lastNumber === 'string' ? parseInt(lastNumber, 10) : Number(lastNumber);
      }
      
      return 0;
    } catch (_error) {
      logger.error('Error retrieving last journal number', {
        error: _error,
        context: { companyId, journalType, series, year }
      });
      return 0;
    }
  }
}

export default JournalNumberingService;
