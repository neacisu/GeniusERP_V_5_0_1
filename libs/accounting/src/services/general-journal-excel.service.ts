/**
 * General Journal Excel Export Service
 * 
 * Generează rapoarte Excel pentru Registrul Jurnal compatible cu pivot tables
 * Implementează export-ul în format Excel conform OMFP 2634/2015
 * Enhanced cu Redis caching pentru query-uri grele (TTL: 10min)
 */

import fs from 'fs';
import path from 'path';
import { getDrizzle } from "@common/drizzle";
import { eq, and, gte, lte, inArray, ne, sql as drizzleSql } from 'drizzle-orm';
import { ledgerEntries, ledgerLines, chartOfAccounts } from '../schema/accounting.schema';
import { RedisService } from '../../../services/redis.service';
import { createModuleLogger } from "@common/logger/loki-logger";
import type {
  ExcelExportOptions,
  ExcelJournalEntry,
  XLSXLibrary,
  XLSXWorkbook,
  JournalTypeSummary,
  AccountSummary
} from '../types/general-journal-excel-types';

const logger = createModuleLogger('general-journal-excel');

// Dynamic import pentru XLSX cu type safety
let XLSX: XLSXLibrary | null = null;
try {
  XLSX = require('xlsx') as XLSXLibrary;
} catch (_e) {
  logger.warn('XLSX not available, Excel export will be disabled');
}

/**
 * Interface pentru rezultatul query-ului Drizzle
 */
interface JournalQueryResult {
  entry_id: string;
  journal_number: string | null;
  entry_date: Date | null;
  document_date: Date | null;
  document_number: string | null;
  journal_type: string;
  entry_description: string;
  entry_amount: string;
  account_id: string;
  account_name: string | null;
  debit_amount: string;
  credit_amount: string;
  line_description: string | null;
  row_number: number;
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

    // Referință non-null pentru metodele private (XLSX verificat mai sus)
    const xlsx = XLSX;

    const reportsDir = path.join(process.cwd(), 'reports', 'general-journals-excel');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `registru-jurnal-${options.startDate.toISOString().split('T')[0]}-${options.endDate.toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    // Obține datele
    const entries = await this.getJournalEntriesForExcel(options);

    // Creează workbook cu XLSX
    const workbook = xlsx.utils.book_new();

    // Creează foaia principală
    this.createMainSheetXLSX(workbook, entries, options, xlsx);

    // Creează foi suplimentare dacă este cerut
    if (options.includeMetadata) {
      this.createSummarySheetXLSX(workbook, entries, options, xlsx);
      this.createAccountsSheetXLSX(workbook, entries, options, xlsx);
    }

    // Salvează fișierul
    xlsx.writeFile(workbook, filePath);

    logger.info('Registru Jurnal Excel generat', { 
      context: { filePath, companyId: options.companyId, entriesCount: entries.length } 
    });
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
    
    const db = getDrizzle();

    // Build WHERE conditions
    const conditions = [
      eq(ledgerEntries.companyId, options.companyId),
      gte(ledgerEntries.entryDate, options.startDate),
      lte(ledgerEntries.entryDate, options.endDate)
    ];

    if (options.journalTypes && options.journalTypes.length > 0) {
      conditions.push(inArray(ledgerEntries.type, options.journalTypes));
    }

    if (!options.includeReversals) {
      conditions.push(ne(ledgerEntries.type, 'REVERSAL'));
    }

    // Execute Drizzle query with proper joins
    const result = await db
      .select({
        entry_id: ledgerEntries.id,
        journal_number: ledgerEntries.journalNumber,
        entry_date: ledgerEntries.entryDate,
        document_date: ledgerEntries.documentDate,
        document_number: ledgerEntries.referenceNumber,
        journal_type: ledgerEntries.type,
        entry_description: ledgerEntries.description,
        entry_amount: ledgerEntries.amount,
        account_id: ledgerLines.accountId,
        account_name: drizzleSql<string>`COALESCE(${chartOfAccounts.name}, ${ledgerLines.accountId})`,
        debit_amount: drizzleSql<string>`${ledgerLines.debitAmount}::numeric`,
        credit_amount: drizzleSql<string>`${ledgerLines.creditAmount}::numeric`,
        line_description: ledgerLines.description,
        row_number: drizzleSql<number>`ROW_NUMBER() OVER (ORDER BY ${ledgerEntries.entryDate}, ${ledgerEntries.journalNumber}, ${ledgerLines.createdAt})`
      })
      .from(ledgerEntries)
      .innerJoin(ledgerLines, eq(ledgerLines.ledgerEntryId, ledgerEntries.id))
      .leftJoin(chartOfAccounts, and(
        eq(chartOfAccounts.code, ledgerLines.accountId),
        eq(chartOfAccounts.companyId, ledgerEntries.companyId)
      ))
      .where(and(...conditions))
      .orderBy(ledgerEntries.entryDate, ledgerEntries.journalNumber, ledgerLines.createdAt);

    const entries: ExcelJournalEntry[] = result.map((row: JournalQueryResult) => ({
      rowNumber: row['row_number'],
      journalNumber: row['journal_number'] || 'N/A',
      entryDate: row['entry_date'] ? new Date(row['entry_date']).toLocaleDateString('ro-RO') : 'N/A',
      documentDate: (row['document_date'] || row['entry_date']) ? new Date(row['document_date'] || row['entry_date'] || new Date()).toLocaleDateString('ro-RO') : 'N/A',
      documentType: this.getDocumentTypeLabel(row['journal_type']),
      documentNumber: row['document_number'] || '',
      description: row['line_description'] || row['entry_description'],
      accountCode: row['account_id'],
      accountName: row['account_name'] || row['account_id'],
      debitAmount: parseFloat(row['debit_amount']) || 0,
      creditAmount: parseFloat(row['credit_amount']) || 0,
      amount: Math.max(parseFloat(row['debit_amount']) || 0, parseFloat(row['credit_amount']) || 0),
      journalType: row['journal_type'],
      entryId: row['entry_id']
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
  private createMainSheetXLSX(
    workbook: XLSXWorkbook, 
    entries: ExcelJournalEntry[], 
    options: ExcelExportOptions,
    xlsx: XLSXLibrary
  ): void {
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
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

    // Setează lățimi coloane (aproximativ)
    worksheet['!cols'] = [
      { wch: 8 },   // Nr. crt
      { wch: 15 },  // Nr. jurnal
      { wch: 18 },  // Data înregistrării
      { wch: 16 },  // Data document
      { wch: 12 },  // Tip document
      { wch: 15 },  // Nr. document
      { wch: 40 },  // Explicații
      { wch: 12 },  // Cod cont
      { wch: 30 },  // Nume cont
      { wch: 15 },  // Debit
      { wch: 15 },  // Credit
      { wch: 12 },  // Tip jurnal
      { wch: 36 }   // ID
    ];

    // Adaugă la workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Registru Jurnal');
  }

  /**
   * Creează foaia cu sumarul pe tipuri de jurnal (XLSX)
   */
  private createSummarySheetXLSX(
    workbook: XLSXWorkbook, 
    entries: ExcelJournalEntry[], 
    options: ExcelExportOptions,
    xlsx: XLSXLibrary
  ): void {
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
    }, {} as Record<string, JournalTypeSummary>);

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

    const worksheet = xlsx.utils.aoa_to_sheet(summaryData);
    
    // Setează lățimi coloane
    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sumar pe Jurnale');
  }

  /**
   * Creează foaia cu planul de conturi utilizat (XLSX)
   */
  private createAccountsSheetXLSX(
    workbook: XLSXWorkbook, 
    entries: ExcelJournalEntry[], 
    options: ExcelExportOptions,
    xlsx: XLSXLibrary
  ): void {
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
    }, {} as Record<string, AccountSummary>);

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

    const worksheet = xlsx.utils.aoa_to_sheet(accountsData);
    
    // Setează lățimi coloane
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Plan de Conturi');
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
