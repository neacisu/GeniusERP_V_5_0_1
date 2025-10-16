/**
 * General Journal Excel Export Service
 * 
 * Generează rapoarte Excel pentru Registrul Jurnal compatible cu pivot tables
 * Implementează export-ul în format Excel conform OMFP 2634/2015
 * Enhanced cu Redis caching pentru query-uri grele (TTL: 10min)
 */

import fs from 'fs';
import path from 'path';
import { getClient } from '../../../common/drizzle';
import { RedisService } from '../../../services/redis.service';

// Dynamic import pentru XLSX (pattern existent în proiect)
let XLSX: any;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.warn('XLSX not available, Excel export will be disabled');
}

/**
 * Interface pentru opțiunile de export Excel
 */
interface ExcelExportOptions {
  companyId: string;
  companyName: string;
  startDate: Date;
  endDate: Date;
  journalTypes?: string[];
  includeReversals?: boolean;
  responsiblePersonName?: string;
  includeMetadata?: boolean; // Include foi suplimentare cu metadata
}

/**
 * Interface pentru datele de export
 */
interface ExcelJournalEntry {
  rowNumber: number;
  journalNumber: string;
  entryDate: string;
  documentDate: string;
  documentType: string;
  documentNumber: string;
  description: string;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  amount: number;
  journalType: string;
  entryId: string;
}

/**
 * Serviciu pentru export Excel al Registrului Jurnal
 */
export class GeneralJournalExcelService {
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
   * Generează fișier Excel pentru Registrul Jurnal
   * Format compatibil cu pivot tables și analiză avansată
   */
  public async generateGeneralJournalExcel(options: ExcelExportOptions): Promise<string> {
    if (!XLSX) {
      throw new Error('XLSX nu este disponibil. Excel export este dezactivat.');
    }

    const reportsDir = path.join(process.cwd(), 'reports', 'general-journals-excel');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `registru-jurnal-${options.startDate.toISOString().split('T')[0]}-${options.endDate.toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    // Obține datele
    const entries = await this.getJournalEntriesForExcel(options);

    // Creează workbook cu XLSX
    const workbook = XLSX.utils.book_new();

    // Creează foaia principală
    this.createMainSheetXLSX(workbook, entries, options);

    // Creează foi suplimentare dacă este cerut
    if (options.includeMetadata) {
      this.createSummarySheetXLSX(workbook, entries, options);
      this.createAccountsSheetXLSX(workbook, entries, options);
    }

    // Salvează fișierul
    XLSX.writeFile(workbook, filePath);

    console.log(`✅ Registru Jurnal Excel generat: ${filePath}`);
    return filePath;
  }

  /**
   * Obține datele pentru export Excel (format plat pentru pivot tables)
   */
  private async getJournalEntriesForExcel(options: ExcelExportOptions): Promise<ExcelJournalEntry[]> {
    await this.ensureRedisConnection();
    
    // Create cache key
    const dateStr = `${options.startDate.toISOString().split('T')[0]}_${options.endDate.toISOString().split('T')[0]}`;
    const typesStr = options.journalTypes?.join('_') || 'all';
    const cacheKey = `acc:general-journal-excel:${options.companyId}:${dateStr}:${typesStr}`;
    
    // Check cache first (TTL: 10 minutes)
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<ExcelJournalEntry[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const sql = getClient();

    let whereClause = `
      WHERE e.company_id = $1 
      AND e.entry_date >= $2 
      AND e.entry_date <= $3
    `;
    
    const params: any[] = [options.companyId, options.startDate, options.endDate];

    if (options.journalTypes && options.journalTypes.length > 0) {
      whereClause += ` AND e.type = ANY($${params.length + 1})`;
      params.push(options.journalTypes);
    }

    if (!options.includeReversals) {
      whereClause += ` AND e.type != 'REVERSAL'`;
    }

    const query = `
      SELECT 
        e.id as entry_id,
        e.journal_number,
        e.entry_date,
        e.document_date,
        e.reference_number as document_number,
        e.type as journal_type,
        e.description as entry_description,
        e.amount as entry_amount,
        l.account_id,
        COALESCE(coa.name, l.account_id) as account_name,
        l.debit_amount::numeric as debit_amount,
        l.credit_amount::numeric as credit_amount,
        l.description as line_description,
        ROW_NUMBER() OVER (ORDER BY e.entry_date, e.journal_number, l.created_at) as row_number
      FROM ledger_entries e
      INNER JOIN ledger_lines l ON l.ledger_entry_id = e.id
      LEFT JOIN chart_of_accounts coa ON coa.code = l.account_id AND coa.company_id = e.company_id
      ${whereClause}
      ORDER BY e.entry_date, e.journal_number, l.created_at
    `;

    const result = await sql.unsafe(query, params);

    const entries = result.map(row => ({
      rowNumber: row.row_number,
      journalNumber: row.journal_number || 'N/A',
      entryDate: new Date(row.entry_date).toLocaleDateString('ro-RO'),
      documentDate: new Date(row.document_date || row.entry_date).toLocaleDateString('ro-RO'),
      documentType: this.getDocumentTypeLabel(row.journal_type),
      documentNumber: row.document_number || '',
      description: row.line_description || row.entry_description,
      accountCode: row.account_id,
      accountName: row.account_name,
      debitAmount: parseFloat(row.debit_amount) || 0,
      creditAmount: parseFloat(row.credit_amount) || 0,
      amount: Math.max(parseFloat(row.debit_amount) || 0, parseFloat(row.credit_amount) || 0),
      journalType: row.journal_type,
      entryId: row.entry_id
    }));
    
    // Cache for 10 minutes
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, entries, 600);
    }
    
    return entries;
  }

  /**
   * Creează foaia principală cu toate datele (XLSX)
   */
  private createMainSheetXLSX(workbook: any, entries: ExcelJournalEntry[], options: ExcelExportOptions): void {
    // Pregătește datele pentru XLSX (array de obiecte)
    const worksheetData = [
      // Header informații
      [`REGISTRU JURNAL - ${options.companyName}`],
      [`Perioada: ${options.startDate.toLocaleDateString('ro-RO')} - ${options.endDate.toLocaleDateString('ro-RO')}`],
      [], // Rând gol
      
      // Header tabel
      [
        'Nr. crt.',
        'Nr. jurnal', 
        'Data înregistrării',
        'Data document',
        'Tip document',
        'Nr. document',
        'Explicații',
        'Cod cont',
        'Nume cont',
        'Debit (lei)',
        'Credit (lei)',
        'Tip jurnal',
        'ID înregistrare'
      ],
      
      // Datele de înregistrări
      ...entries.map(entry => [
        entry.rowNumber,
        entry.journalNumber,
        entry.entryDate,
        entry.documentDate,
        entry.documentType,
        entry.documentNumber,
        entry.description,
        entry.accountCode,
        entry.accountName,
        entry.debitAmount,
        entry.creditAmount,
        entry.journalType,
        entry.entryId
      ]),
      
      [], // Rând gol
      
      // Totalizare
      [
        '', '', '', '', '', '', 'TOTAL GENERAL', '',
        '',
        entries.reduce((sum, entry) => sum + entry.debitAmount, 0),
        entries.reduce((sum, entry) => sum + entry.creditAmount, 0),
        '', ''
      ],
      
      [], // Rând gol
      
      // Footer
      [`Total înregistrări: ${entries.length}`],
      [`Generat la: ${new Date().toLocaleString('ro-RO')}`]
    ];

    if (options.responsiblePersonName) {
      worksheetData.push(
        [], // Rând gol
        [`Întocmit: ${options.responsiblePersonName}`],
        ['Semnătura: _______________']
      );
    }

    // Creează worksheet din date
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Setează lățimi coloane (aproximativ)
    worksheet['!cols'] = [
      { width: 8 },   // Nr. crt
      { width: 15 },  // Nr. jurnal
      { width: 18 },  // Data înregistrării
      { width: 16 },  // Data document
      { width: 12 },  // Tip document
      { width: 15 },  // Nr. document
      { width: 40 },  // Explicații
      { width: 12 },  // Cod cont
      { width: 30 },  // Nume cont
      { width: 15 },  // Debit
      { width: 15 },  // Credit
      { width: 12 },  // Tip jurnal
      { width: 36 }   // ID
    ];

    // Adaugă la workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registru Jurnal');
  }

  /**
   * Creează foaia cu sumarul pe tipuri de jurnal (XLSX)
   */
  private createSummarySheetXLSX(workbook: any, entries: ExcelJournalEntry[], options: ExcelExportOptions): void {
    // Calculează sumarul
    const summary = entries.reduce((acc, entry) => {
      if (!acc[entry.journalType]) {
        acc[entry.journalType] = {
          count: 0,
          totalDebit: 0,
          totalCredit: 0
        };
      }
      acc[entry.journalType].count++;
      acc[entry.journalType].totalDebit += entry.debitAmount;
      acc[entry.journalType].totalCredit += entry.creditAmount;
      return acc;
    }, {} as Record<string, any>);

    // Pregătește datele pentru XLSX
    const summaryData = [
      [`SUMAR PE TIPURI DE JURNAL - ${options.companyName}`],
      [], // Rând gol
      ['Tip Jurnal', 'Descriere', 'Nr. înregistrări', 'Total Debit', 'Total Credit'],
      
      ...Object.entries(summary).map(([type, data]) => [
        type,
        this.getDocumentTypeLabel(type),
        data.count,
        data.totalDebit,
        data.totalCredit
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Setează lățimi coloane
    worksheet['!cols'] = [
      { width: 15 },
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sumar pe Jurnale');
  }

  /**
   * Creează foaia cu planul de conturi utilizat (XLSX)
   */
  private createAccountsSheetXLSX(workbook: any, entries: ExcelJournalEntry[], options: ExcelExportOptions): void {
    // Calculează utilizarea conturilor
    const accounts = entries.reduce((acc, entry) => {
      if (!acc[entry.accountCode]) {
        acc[entry.accountCode] = {
          name: entry.accountName,
          usageCount: 0,
          totalDebit: 0,
          totalCredit: 0
        };
      }
      acc[entry.accountCode].usageCount++;
      acc[entry.accountCode].totalDebit += entry.debitAmount;
      acc[entry.accountCode].totalCredit += entry.creditAmount;
      return acc;
    }, {} as Record<string, any>);

    // Pregătește datele pentru XLSX
    const accountsData = [
      [`PLAN DE CONTURI UTILIZAT - ${options.companyName}`],
      [], // Rând gol
      ['Cod Cont', 'Nume Cont', 'Nr. utilizări', 'Total Debit', 'Total Credit'],
      
      // Date conturi (sortate după cod)
      ...Object.entries(accounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([code, data]) => [
          code,
          data.name,
          data.usageCount,
          data.totalDebit,
          data.totalCredit
        ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(accountsData);
    
    // Setează lățimi coloane
    worksheet['!cols'] = [
      { width: 12 },
      { width: 35 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plan de Conturi');
  }

  // Nu mai e nevoie de createJournalTypesSheet - informația e în main sheet

  /**
   * Convertește tipul de jurnal în etichetă citibilă
   */
  private getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'SALES': 'Factură Vânzare',
      'PURCHASE': 'Factură Cumpărare', 
      'CASH': 'Document Casă',
      'BANK': 'Document Bancă',
      'GENERAL': 'Notă Contabilă',
      'ADJUSTMENT': 'Ajustare',
      'REVERSAL': 'Stornare'
    };
    return labels[type] || type;
  }
}

export default GeneralJournalExcelService;
