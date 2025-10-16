/**
 * Journal Export Service
 * 
 * TASK 687: Export Registru Jurnal în PDF și Excel
 * Generează rapoarte complete pentru toate notele contabile
 * Enhanced cu Redis caching (TTL: 15min pentru exports)
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { getDrizzle } from '../../../common/drizzle';
import { and, eq, gte, lte, asc } from 'drizzle-orm';
import { RedisService } from '../../../services/redis.service';

// Dynamic import pentru xlsx (evităm erori de tip)
let XLSX: any;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.warn('XLSX not available, Excel export will be disabled');
}

export class JournalExportService {
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
   * Generează Registru Jurnal PDF
   */
  public async generateJournalPDF(
    companyId: string,
    startDate: Date,
    endDate: Date,
    journalType?: string
  ): Promise<string> {
    await this.ensureRedisConnection();
    
    // Check cache first
    const dateStr = `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`;
    const typeStr = journalType || 'all';
    const cacheKey = `acc:journal-export-pdf:${companyId}:${dateStr}:${typeStr}`;
    
    if (this.redisService.isConnected()) {
      const cachedPath = await this.redisService.getCached<string>(cacheKey);
      if (cachedPath && fs.existsSync(cachedPath)) {
        return cachedPath;
      }
    }
    
    const db = getDrizzle();
    
    // Fetch ledger entries cu liniile aferente
    let query = `
      SELECT 
        le.id, le.type, le.reference_number, le.amount, le.description, 
        le.created_at, le.entry_date,
        ll.account_id, ll.debit_amount, ll.credit_amount, ll.description as line_desc
      FROM ledger_entries le
      LEFT JOIN ledger_lines ll ON le.id = ll.ledger_entry_id
      WHERE le.company_id = $1
      AND le.entry_date >= $2
      AND le.entry_date <= $3
    `;
    
    const params: any[] = [companyId, startDate, endDate];
    
    if (journalType) {
      query += ` AND le.type = $4`;
      params.push(journalType);
    }
    
    query += ` ORDER BY le.entry_date ASC, le.created_at ASC, ll.debit_amount DESC`;
    
    const entries = await db.$client.unsafe(query, params);
    
    // Grupează liniile per entry
    const groupedEntries = this.groupEntriesByLedger(entries);
    
    // Generează PDF
    const reportsDir = path.join(process.cwd(), 'reports', 'journals');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const fileName = `registru-jurnal-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4',
          margins: { top: 40, bottom: 40, left: 40, right: 40 } 
        });
        
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        
        // ANTET
        doc.fontSize(16).font('Helvetica-Bold').text('REGISTRU JURNAL', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(`Perioadă: ${startDate.toLocaleDateString('ro-RO')} - ${endDate.toLocaleDateString('ro-RO')}`, { align: 'center' });
        doc.moveDown(1);
        
        // TABEL
        let currentY = doc.y;
        const pageHeight = 550;
        
        // Header
        doc.font('Helvetica-Bold').fontSize(8);
        doc.text('Nr.', 45, currentY, { width: 30 });
        doc.text('Data', 75, currentY, { width: 60 });
        doc.text('Tip', 135, currentY, { width: 50 });
        doc.text('Ref', 185, currentY, { width: 70 });
        doc.text('Descriere', 255, currentY, { width: 180 });
        doc.text('Cont', 435, currentY, { width: 50 });
        doc.text('Debit', 485, currentY, { width: 80, align: 'right' });
        doc.text('Credit', 565, currentY, { width: 80, align: 'right' });
        currentY += 15;
        
        doc.moveTo(40, currentY).lineTo(800, currentY).stroke();
        currentY += 5;
        
        // Entries
        doc.font('Helvetica').fontSize(7);
        groupedEntries.forEach((entry, index) => {
          if (currentY > pageHeight) {
            doc.addPage();
            currentY = 40;
          }
          
          // Entry header
          doc.font('Helvetica-Bold');
          doc.text((index + 1).toString(), 45, currentY, { width: 30 });
          doc.text(new Date(entry.entry_date).toLocaleDateString('ro-RO'), 75, currentY, { width: 60 });
          doc.text(entry.type, 135, currentY, { width: 50 });
          doc.text(entry.reference_number || '-', 185, currentY, { width: 70 });
          doc.text(entry.description.substring(0, 40), 255, currentY, { width: 180 });
          currentY += 12;
          
          // Lines
          doc.font('Helvetica');
          entry.lines.forEach((line: any) => {
            doc.text(line.account_id, 435, currentY, { width: 50 });
            doc.text(Number(line.debit_amount) > 0 ? Number(line.debit_amount).toFixed(2) : '', 485, currentY, { width: 80, align: 'right' });
            doc.text(Number(line.credit_amount) > 0 ? Number(line.credit_amount).toFixed(2) : '', 565, currentY, { width: 80, align: 'right' });
            currentY += 10;
          });
          
          currentY += 5;
        });
        
        doc.end();
        
        stream.on('finish', async () => {
          // Cache the file path for 15 minutes
          if (this.redisService.isConnected()) {
            await this.redisService.setCached(cacheKey, filePath, 900); // 15min TTL
          }
          resolve(filePath);
        });
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Generează Excel pentru Registru Jurnal
   */
  public async generateJournalExcel(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    if (!XLSX) {
      throw new Error('XLSX library not available. Please install: npm install xlsx');
    }
    
    await this.ensureRedisConnection();
    
    // Check cache first
    const dateStr = `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`;
    const cacheKey = `acc:journal-export-excel:${companyId}:${dateStr}`;
    
    if (this.redisService.isConnected()) {
      const cachedPath = await this.redisService.getCached<string>(cacheKey);
      if (cachedPath && fs.existsSync(cachedPath)) {
        return cachedPath;
      }
    }
    
    const db = getDrizzle();
    
    const query = `
      SELECT 
        le.type as jurnal,
        le.entry_date as data,
        le.reference_number as referinta,
        le.description as explicatie,
        ll.account_id as cont,
        ll.debit_amount as debit,
        ll.credit_amount as credit
      FROM ledger_entries le
      LEFT JOIN ledger_lines ll ON le.id = ll.ledger_entry_id
      WHERE le.company_id = $1
      AND le.entry_date >= $2
      AND le.entry_date <= $3
      ORDER BY le.entry_date ASC, le.created_at ASC
    `;
    
    const data = await db.$client.unsafe(query, [companyId, startDate, endDate]);
    
    // Creează Excel
    const ws = XLSX.utils.json_to_sheet(data.map((row: any) => ({
      'Jurnal': row.jurnal,
      'Data': new Date(row.data).toLocaleDateString('ro-RO'),
      'Referință': row.referinta || '',
      'Explicație': row.explicatie,
      'Cont': row.cont,
      'Debit': Number(row.debit || 0).toFixed(2),
      'Credit': Number(row.credit || 0).toFixed(2)
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registru Jurnal');
    
    const reportsDir = path.join(process.cwd(), 'reports', 'journals');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const fileName = `registru-jurnal-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(reportsDir, fileName);
    
    XLSX.writeFile(wb, filePath);
    
    return filePath;
  }
  
  /**
   * Grupează linii pe entry
   */
  private groupEntriesByLedger(rows: any[]): any[] {
    const entriesMap = new Map();
    
    rows.forEach((row: any) => {
      if (!entriesMap.has(row.id)) {
        entriesMap.set(row.id, {
          id: row.id,
          type: row.type,
          reference_number: row.reference_number,
          amount: row.amount,
          description: row.description,
          entry_date: row.entry_date || row.created_at,
          lines: []
        });
      }
      
      if (row.account_id) {
        entriesMap.get(row.id).lines.push({
          account_id: row.account_id,
          debit_amount: row.debit_amount,
          credit_amount: row.credit_amount,
          description: row.line_desc
        });
      }
    });
    
    return Array.from(entriesMap.values());
  }
}

export default JournalExportService;
