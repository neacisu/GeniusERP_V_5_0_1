/**
 * General Journal PDF Generator Service
 * 
 * Generează rapoarte PDF pentru Registrul Jurnal (General Journal) conform OMFP 2634/2015
 * Format: Registru cronologic cu toate coloanele obligatorii conform standardelor contabile
 * Enhanced cu Redis caching pentru query-uri grele (TTL: 10min)
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { getDrizzle } from '../../../common/drizzle';
import { eq, and, gte, lte, inArray, ne, sql as drizzleSql } from 'drizzle-orm';
import { ledgerEntries, ledgerLines, chartOfAccounts } from '../schema/accounting.schema';
import { RedisService } from '../../../services/redis.service';
import { createModuleLogger } from '../../../common/logger/loki-logger';
import type { ColumnWidths, TableRowData, TableHeader, TableValue } from '../types/general-journal-pdf-types';

const logger = createModuleLogger('general-journal-pdf');

/**
 * Interface pentru înregistrările din Registrul Jurnal
 */
interface JournalEntry {
  id: string;
  journalNumber: string;
  entryDate: Date;
  documentDate: Date;
  documentType: string;
  documentNumber: string;
  description: string;
  amount: number;
  type: string; // SALES, PURCHASE, CASH, BANK, GENERAL
  lines: JournalLine[];
}

interface JournalLine {
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

/**
 * Interface pentru rezultatele query-ului Drizzle ORM
 * Mapează rezultatul din baza de date cu structura așteptată
 */
interface JournalQueryResult {
  entry_id: string;
  journal_number: string | null;
  entry_date: Date | null;
  document_date: Date | null;
  document_number: string | null;
  document_type: string;
  entry_description: string;
  entry_amount: string;
  entry_type: string;
  lines: Array<{
    accountCode: string;
    accountName: string | null;
    debitAmount: string;
    creditAmount: string;
    description: string | null;
  }>;
}

/**
 * Opțiuni pentru generarea raportului
 */
interface GeneralJournalReportOptions {
  companyId: string;
  companyName: string;
  startDate: Date;
  endDate: Date;
  journalTypes?: string[]; // Filtrare după tip jurnal (SALES, PURCHASE, etc.)
  detailLevel: 'summary' | 'detailed'; // Detaliat sau sumarizat pe jurnale auxiliare
  includeReversals?: boolean; // Include înregistrările storno
  responsiblePersonName?: string; // Contabil șef
  responsiblePersonTitle?: string; // Funcția
}

/**
 * Serviciu pentru generarea PDF-ului Registrului Jurnal conform OMFP 2634/2015
 */
export class GeneralJournalPDFService {
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
   * Generează PDF pentru Registrul Jurnal conform OMFP 2634/2015
   * Cod formular 14-1-1 - Registrul-jurnal
   */
  public async generateGeneralJournalPDF(options: GeneralJournalReportOptions): Promise<string> {
    const reportsDir = path.join(process.cwd(), 'reports', 'general-journals');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `registru-jurnal-${options.startDate.toISOString().split('T')[0]}-${options.endDate.toISOString().split('T')[0]}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    // Obține datele din baza de date
    const entries = await this.getJournalEntries(options);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          layout: 'landscape', // Format landscape pentru mai multe coloane
          margins: { top: 40, bottom: 40, left: 30, right: 30 },
          info: {
            Title: `Registrul Jurnal - ${options.companyName}`,
            Author: options.companyName,
            Subject: `Cod formular 14-1-1 OMFP 2634/2015`,
            Creator: 'GeniusERP v5',
            Keywords: 'registru jurnal, contabilitate, OMFP'
          }
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Generează header-ul și conținutul
        this.generatePDFHeader(doc, options);
        this.generatePDFTable(doc, entries, options);
        this.generatePDFFooter(doc, options, entries.length);

        doc.end();

        stream.on('finish', () => {
          logger.info('Registru Jurnal PDF generat cu succes', {
            context: {
              filePath,
              companyId: options.companyId,
              companyName: options.companyName,
              entriesCount: entries.length,
              dateRange: `${options.startDate.toISOString().split('T')[0]} - ${options.endDate.toISOString().split('T')[0]}`
            }
          });
          resolve(filePath);
        });

        stream.on('error', (error) => {
          console.error('❌ Eroare generare PDF:', error);
          reject(error);
        });

      } catch (error) {
        console.error('❌ Eroare în generarea PDF-ului:', error);
        reject(error);
      }
    });
  }

  /**
   * Obține înregistrările din jurnal pentru perioada specificată
   */
  private async getJournalEntries(options: GeneralJournalReportOptions): Promise<JournalEntry[]> {
    await this.ensureRedisConnection();
    
    // Create cache key
    const dateStr = `${options.startDate.toISOString().split('T')[0]}_${options.endDate.toISOString().split('T')[0]}`;
    const typesStr = options.journalTypes?.join('_') || 'all';
    const cacheKey = `acc:general-journal:${options.companyId}:${dateStr}:${typesStr}:${options.detailLevel}`;
    
    // Check cache first (TTL: 10 minutes)
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<JournalEntry[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const db = getDrizzle();

    // Construiește conditions pentru query
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

    // Query folosind Drizzle ORM cu agregare pentru lines
    const results = await db
      .select({
        entry_id: ledgerEntries.id,
        journal_number: ledgerEntries.journalNumber,
        entry_date: ledgerEntries.entryDate,
        document_date: ledgerEntries.documentDate,
        document_number: ledgerEntries.referenceNumber,
        document_type: ledgerEntries.type,
        entry_description: ledgerEntries.description,
        entry_amount: drizzleSql<string>`${ledgerEntries.amount}::numeric`,
        entry_type: ledgerEntries.type,
        // Agregare JSON pentru lines
        lines: drizzleSql<Array<{
          accountCode: string;
          accountName: string | null;
          debitAmount: string;
          creditAmount: string;
          description: string | null;
        }>>`json_agg(
          json_build_object(
            'accountCode', ${ledgerLines.accountId},
            'accountName', COALESCE(${chartOfAccounts.name}, ${ledgerLines.accountId}),
            'debitAmount', ${ledgerLines.debitAmount}::numeric,
            'creditAmount', ${ledgerLines.creditAmount}::numeric,
            'description', ${ledgerLines.description}
          ) ORDER BY ${ledgerLines.createdAt}
        )`
      })
      .from(ledgerEntries)
      .leftJoin(ledgerLines, eq(ledgerLines.ledgerEntryId, ledgerEntries.id))
      .leftJoin(chartOfAccounts, and(
        eq(chartOfAccounts.code, ledgerLines.accountId),
        eq(chartOfAccounts.companyId, ledgerEntries.companyId)
      ))
      .where(and(...conditions))
      .groupBy(
        ledgerEntries.id,
        ledgerEntries.journalNumber,
        ledgerEntries.entryDate,
        ledgerEntries.documentDate,
        ledgerEntries.referenceNumber,
        ledgerEntries.type,
        ledgerEntries.description,
        ledgerEntries.amount
      )
      .orderBy(ledgerEntries.entryDate, ledgerEntries.journalNumber);

    // Mapare rezultate la JournalEntry cu bracket notation pentru strict mode
    const entries: JournalEntry[] = results.map((row: JournalQueryResult) => ({
      id: row['entry_id'],
      journalNumber: row['journal_number'] || 'N/A',
      entryDate: row['entry_date'] ? new Date(row['entry_date']) : new Date(),
      documentDate: new Date(row['document_date'] || row['entry_date'] || new Date()),
      documentType: this.getDocumentTypeLabel(row['document_type']),
      documentNumber: row['document_number'] || '',
      description: row['entry_description'],
      amount: parseFloat(row['entry_amount']),
      type: row['entry_type'],
      lines: (row['lines'] || []).map(line => ({
        accountCode: line.accountCode,
        accountName: line.accountName || line.accountCode,
        debitAmount: parseFloat(line.debitAmount) || 0,
        creditAmount: parseFloat(line.creditAmount) || 0,
        description: line.description || ''
      }))
    }));
    
    // Cache for 10 minutes
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, entries, 600);
    }
    
    return entries;
  }

  /**
   * Generează header-ul PDF-ului
   */
  private generatePDFHeader(doc: PDFKit.PDFDocument, options: GeneralJournalReportOptions): void {
    // Antet companie
    doc.fontSize(16).font('Helvetica-Bold').text(options.companyName, { align: 'center' });
    doc.moveDown(0.3);
    
    // Titlu raport
    doc.fontSize(14).text('REGISTRU-JURNAL', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Cod formular 14-1-1 (OMFP 2634/2015)', { align: 'center' });
    doc.moveDown(0.5);

    // Perioada și informații
    doc.fontSize(10).font('Helvetica-Bold');
    const periodText = `Perioada: ${options.startDate.toLocaleDateString('ro-RO')} - ${options.endDate.toLocaleDateString('ro-RO')}`;
    doc.text(periodText, { align: 'center' });
    
    if (options.journalTypes && options.journalTypes.length > 0) {
      doc.text(`Jurnale: ${options.journalTypes.join(', ')}`, { align: 'center' });
    }
    
    doc.moveDown(1);
  }

  /**
   * Generează tabelul cu înregistrările
   */
  private generatePDFTable(doc: PDFKit.PDFDocument, entries: JournalEntry[], options: GeneralJournalReportOptions): void {
    // A4 landscape: 842pt width, minus margins (30 left + 30 right = 60)
    // const pageWidth = 842 - 60; // Not currently used but kept for future enhancements
    const tableTop = doc.y;

    // Lățimi coloane conform OMFP 2634/2015
    const colWidths = {
      nr: 30,        // Nr. crt.
      data: 70,      // Data înregistrării
      docType: 50,   // Fel document
      docNo: 70,     // Nr. document
      docDate: 70,   // Data document
      explanations: 200, // Explicații operațiune
      accountDr: 60, // Cont debit
      accountCr: 60, // Cont credit  
      amount: 80     // Suma
    };

    let currentY = tableTop;

    // Header tabel
    this.drawTableHeader(doc, currentY, colWidths);
    currentY += 30;

    // Înregistrări
    let entryNumber = 1;
    let totalAmount = 0;

    for (const entry of entries) {
      // Verifică dacă mai încape pe pagină
      if (currentY > 500) { // Apropiat de sfârșitul paginii
        doc.addPage();
        currentY = 50;
        this.drawTableHeader(doc, currentY, colWidths);
        currentY += 30;
      }

      if (options.detailLevel === 'detailed') {
        // Mod detaliat - afișează fiecare linie contabilă
        for (let i = 0; i < entry.lines.length; i++) {
          const line = entry.lines[i];
          this.drawTableRow(doc, currentY, colWidths, {
            nr: i === 0 ? entryNumber.toString() : '',
            data: i === 0 ? entry.entryDate.toLocaleDateString('ro-RO') : '',
            docType: i === 0 ? entry.documentType : '',
            docNo: i === 0 ? entry.documentNumber : '',
            docDate: i === 0 ? entry.documentDate.toLocaleDateString('ro-RO') : '',
            explanations: line.description || entry.description,
            accountDr: line.debitAmount > 0 ? line.accountCode : '',
            accountCr: line.creditAmount > 0 ? line.accountCode : '',
            amount: Math.max(line.debitAmount, line.creditAmount).toFixed(2)
          });
          currentY += 20;
        }
      } else {
        // Mod sumarizat - o linie per înregistrare
        this.drawTableRow(doc, currentY, colWidths, {
          nr: entryNumber.toString(),
          data: entry.entryDate.toLocaleDateString('ro-RO'),
          docType: entry.documentType,
          docNo: entry.documentNumber,
          docDate: entry.documentDate.toLocaleDateString('ro-RO'),
          explanations: entry.description,
          accountDr: entry.lines.filter(l => l.debitAmount > 0).map(l => l.accountCode).join(', '),
          accountCr: entry.lines.filter(l => l.creditAmount > 0).map(l => l.accountCode).join(', '),
          amount: entry.amount.toFixed(2)
        });
        currentY += 20;
      }

      totalAmount += entry.amount;
      entryNumber++;
    }

    // Linie totalizare
    currentY += 10;
    doc.font('Helvetica-Bold');
    this.drawTableRow(doc, currentY, colWidths, {
      nr: '',
      data: '',
      docType: '',
      docNo: '',
      docDate: '',
      explanations: 'TOTAL GENERAL',
      accountDr: '',
      accountCr: '',
      amount: totalAmount.toFixed(2)
    });
  }

  /**
   * Desenează header-ul tabelului
   */
  private drawTableHeader(doc: PDFKit.PDFDocument, y: number, colWidths: ColumnWidths): void {
    doc.font('Helvetica-Bold').fontSize(8);
    
    let x = 30;
    const headers: TableHeader[] = [
      { text: 'Nr.\ncrt.', width: colWidths.nr },
      { text: 'Data\nînregistrării', width: colWidths.data },
      { text: 'Felul\ndocumentului', width: colWidths.docType },
      { text: 'Numărul\ndocumentului', width: colWidths.docNo },
      { text: 'Data\ndocumentului', width: colWidths.docDate },
      { text: 'Explicația operațiunii', width: colWidths.explanations },
      { text: 'Cont\ndebit', width: colWidths.accountDr },
      { text: 'Cont\ncredit', width: colWidths.accountCr },
      { text: 'Suma\n(lei)', width: colWidths.amount }
    ];

    headers.forEach(header => {
      doc.rect(x, y, header.width, 25).stroke();
      doc.text(header.text, x + 2, y + 5, { 
        width: header.width - 4, 
        align: 'center',
        lineGap: 1
      });
      x += header.width;
    });
  }

  /**
   * Desenează o linie în tabel
   */
  private drawTableRow(doc: PDFKit.PDFDocument, y: number, colWidths: ColumnWidths, data: TableRowData): void {
    doc.font('Helvetica').fontSize(7);
    
    let x = 30;
    const values: TableValue[] = [
      { text: data.nr, width: colWidths.nr, align: 'center' },
      { text: data.data, width: colWidths.data, align: 'center' },
      { text: data.docType, width: colWidths.docType, align: 'center' },
      { text: data.docNo, width: colWidths.docNo, align: 'center' },
      { text: data.docDate, width: colWidths.docDate, align: 'center' },
      { text: data.explanations, width: colWidths.explanations, align: 'left' },
      { text: data.accountDr, width: colWidths.accountDr, align: 'center' },
      { text: data.accountCr, width: colWidths.accountCr, align: 'center' },
      { text: data.amount, width: colWidths.amount, align: 'right' }
    ];

    values.forEach(value => {
      doc.rect(x, y, value.width, 15).stroke();
      doc.text(value.text || '', x + 2, y + 4, { 
        width: value.width - 4, 
        align: value.align,
        ellipsis: true
      });
      x += value.width;
    });
  }

  /**
   * Generează footer-ul cu semnături
   */
  private generatePDFFooter(doc: PDFKit.PDFDocument, options: GeneralJournalReportOptions, totalEntries: number): void {
    doc.moveDown(2);
    
    // Statistici
    doc.font('Helvetica').fontSize(10);
    doc.text(`Total înregistrări: ${totalEntries}`);
    doc.text(`Generat la: ${new Date().toLocaleString('ro-RO')}`);
    doc.moveDown(1);

    // Semnături conform OMFP
    doc.font('Helvetica-Bold').fontSize(10);
    const signaturesY = doc.y;
    
    // Stânga - Contabil
    doc.text('Întocmit,', 50, signaturesY);
    doc.font('Helvetica').fontSize(9);
    doc.text('Contabil:', 50, signaturesY + 20);
    if (options.responsiblePersonName) {
      doc.text(options.responsiblePersonName, 50, signaturesY + 35);
    }
    doc.text('_________________', 50, signaturesY + 50);
    doc.text('(semnătura)', 50, signaturesY + 65);

    // Dreapta - Administrator
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Aprobat,', 500, signaturesY);
    doc.font('Helvetica').fontSize(9);
    doc.text('Administrator:', 500, signaturesY + 20);
    doc.text('_________________', 500, signaturesY + 50);
    doc.text('(semnătura)', 500, signaturesY + 65);

    // Notă legală
    doc.moveDown(3);
    doc.font('Helvetica').fontSize(8);
    doc.text(
      'Document generat conform OMFP 2634/2015 - Registrul-jurnal (cod 14-1-1). ' +
      'Registrul se ține ordonat, fără ștersături, permițând oricând identificarea și controlul operațiunilor.',
      { align: 'justify', width: 750 }
    );
  }

  /**
   * Convertește tipul de jurnal în etichetă citibilă
   */
  private getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'SALES': 'Factură V',
      'PURCHASE': 'Factură C', 
      'CASH': 'Doc. Casă',
      'BANK': 'Doc. Bancă',
      'GENERAL': 'Notă Cont.',
      'ADJUSTMENT': 'Ajustare',
      'REVERSAL': 'Storno'
    };
    return labels[type] || type;
  }

  /**
   * Generează raport Excel pentru Registrul Jurnal
   */
  public async generateGeneralJournalExcel(_options: GeneralJournalReportOptions): Promise<string> {
    // TODO: Implementare export Excel cu ExcelJS
    // Similar cu structura PDF dar în format Excel pentru pivot tables
    throw new Error('Excel export not implemented yet');
  }
}

export default GeneralJournalPDFService;
