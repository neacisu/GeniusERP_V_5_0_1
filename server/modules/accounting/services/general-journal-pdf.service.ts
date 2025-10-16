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
import { getClient } from '../../../common/drizzle';
import { RedisService } from '../../../services/redis.service';

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
          console.log(`✅ Registru Jurnal PDF generat: ${filePath}`);
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
    
    const sql = getClient();

    // Construiește query-ul în funcție de opțiuni
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
        e.id,
        e.journal_number,
        e.entry_date,
        e.document_date,
        e.reference_number as document_number,
        e.type as document_type,
        e.description,
        e.amount,
        e.type,
        json_agg(
          json_build_object(
            'accountCode', l.account_id,
            'accountName', COALESCE(coa.name, l.account_id),
            'debitAmount', l.debit_amount::numeric,
            'creditAmount', l.credit_amount::numeric,
            'description', l.description
          ) ORDER BY l.created_at
        ) as lines
      FROM ledger_entries e
      LEFT JOIN ledger_lines l ON l.ledger_entry_id = e.id
      LEFT JOIN chart_of_accounts coa ON coa.code = l.account_id AND coa.company_id = e.company_id
      ${whereClause}
      GROUP BY e.id, e.journal_number, e.entry_date, e.document_date, e.reference_number, 
               e.type, e.description, e.amount
      ORDER BY e.entry_date, e.journal_number
    `;

    const result = await sql.unsafe(query, params);

    const entries = result.map(row => ({
      id: row.id,
      journalNumber: row.journal_number || 'N/A',
      entryDate: new Date(row.entry_date),
      documentDate: new Date(row.document_date || row.entry_date),
      documentType: this.getDocumentTypeLabel(row.document_type),
      documentNumber: row.document_number || '',
      description: row.description,
      amount: parseFloat(row.amount),
      type: row.type,
      lines: row.lines || []
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
    const pageWidth = 842 - 60; // A4 landscape minus margins
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
  private drawTableHeader(doc: PDFKit.PDFDocument, y: number, colWidths: any): void {
    doc.font('Helvetica-Bold').fontSize(8);
    
    let x = 30;
    const headers = [
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
  private drawTableRow(doc: PDFKit.PDFDocument, y: number, colWidths: any, data: any): void {
    doc.font('Helvetica').fontSize(7);
    
    let x = 30;
    const values = [
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
        align: value.align as any,
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
  public async generateGeneralJournalExcel(options: GeneralJournalReportOptions): Promise<string> {
    // TODO: Implementare export Excel cu ExcelJS
    // Similar cu structura PDF dar în format Excel pentru pivot tables
    throw new Error('Excel export not implemented yet');
  }
}

export default GeneralJournalPDFService;
