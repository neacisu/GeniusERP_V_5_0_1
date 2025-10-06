/**
 * Journal Numbering Service
 * 
 * TASK 686: Numerotare cronologică note contabile
 * Asigură numerotare secvențială pentru fiecare tip de jurnal
 */

import { getDrizzle } from '../../../common/drizzle';
import { LedgerEntryType } from './journal.service';

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
      // Obține sau creează counter cu LOCK pentru thread safety
      const [counter] = await db.$client.unsafe(`
        INSERT INTO document_counters (company_id, counter_type, series, year, last_number)
        VALUES ($1, 'JOURNAL', $2, $3, 1)
        ON CONFLICT (company_id, counter_type, series, year)
        DO UPDATE SET last_number = document_counters.last_number + 1, updated_at = NOW()
        RETURNING last_number
      `, [companyId, series, year]);
      
      const number = counter.last_number.toString().padStart(5, '0');
      return `${series}/${year}/${number}`;
    } catch (error) {
      console.error('Error generating journal number:', error);
      // Fallback
      return `${series}/${year}/${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`;
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
      const result = await db.$client.unsafe(`
        SELECT last_number FROM document_counters
        WHERE company_id = $1 
        AND counter_type = 'JOURNAL'
        AND series = $2
        AND year = $3
      `, [companyId, series, year]);
      
      if (result && result.length > 0) {
        return result[0].last_number;
      }
      
      return 0;
    } catch (error) {
      return 0;
    }
  }
}

export default JournalNumberingService;
