/**
 * Cash Register PDF Generator Service
 * 
 * Generează rapoarte PDF pentru Registrul de Casă conform OMFP 2634/2015
 * Format: Registru zilnic cu toate coloanele obligatorii
 * Enhanced cu Redis caching (TTL: 15min pentru PDF)
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import type { CashRegister, CashTransaction } from '@geniuserp/shared/schema/cash-register.schema';
import { RedisService } from '@common/services/redis.service';

/**
 * RECOMANDARE 1: Serviciu COMPLET de generare PDF pentru Registrul de Casă
 * 
 * Generează un raport zilnic conform formularului 14-4-7 OMFP 2634/2015
 */
export class CashRegisterPDFService {
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
   * Generează PDF REAL pentru registrul zilnic de casă
   */
  public async generateDailyRegisterPDF(
    cashRegister: CashRegister,
    date: Date,
    transactions: CashTransaction[],
    companyName: string
  ): Promise<string> {
    await this.ensureRedisConnection();
    
    // Check cache first
    const dateStr = date.toISOString().split('T')[0];
    const cacheKey = `acc:cash-register-pdf:${cashRegister.id}:${dateStr}`;
    
    if (this.redisService.isConnected()) {
      const cachedPath = await this.redisService.getCached<string>(cacheKey);
      if (cachedPath && fs.existsSync(cachedPath)) {
        return cachedPath;
      }
    }
    
    // RECOMANDARE 1: IMPLEMENTARE COMPLETĂ cu PDFKit
    const reportsDir = path.join(process.cwd(), 'reports', 'cash-registers');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const fileName = `registru-casa-${cashRegister.code}-${date.toISOString().split('T')[0]}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          info: {
            Title: `Registru de Casă - ${cashRegister.name}`,
            Author: companyName,
            Subject: `Formular 14-4-7 OMFP 2634/2015`,
            Creator: 'GeniusERP v5'
          }
        });
        
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        
        // ANTET
        doc.fontSize(16).font('Helvetica-Bold').text(companyName, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).text('REGISTRU DE CASĂ', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('Cod formular 14-4-7 (OMFP 2634/2015)', { align: 'center' });
        doc.moveDown(1);
        
        // Informații casierie
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`Casierie: ${cashRegister.name} (Cod: ${cashRegister.code})`);
        doc.text(`Data: ${date.toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
        doc.text(`Moneda: ${cashRegister.currency}`);
        if (cashRegister.responsiblePersonName) {
          doc.text(`Casier responsabil: ${cashRegister.responsiblePersonName}`);
        }
        doc.moveDown(1);
        
        // TABEL
        const startY = doc.y;
        const tableTop = startY;
        const colWidths = { nr: 30, doc: 90, ora: 50, expl: 150, inc: 70, plati: 70, sold: 70 };
        let currentY = tableTop;
        
        // Header tabel
        doc.font('Helvetica-Bold').fontSize(9);
        doc.rect(50, currentY, 495, 20).stroke();
        doc.text('Nr.', 55, currentY + 5, { width: colWidths.nr, align: 'center' });
        doc.text('Document', 85, currentY + 5, { width: colWidths.doc });
        doc.text('Ora', 175, currentY + 5, { width: colWidths.ora });
        doc.text('Explicație', 225, currentY + 5, { width: colWidths.expl });
        doc.text('Încasări', 375, currentY + 5, { width: colWidths.inc, align: 'right' });
        doc.text('Plăți', 445, currentY + 5, { width: colWidths.plati, align: 'right' });
        doc.text('Sold', 515, currentY + 5, { width: colWidths.sold, align: 'right' });
        currentY += 20;
        
        // Sold inițial
        doc.fontSize(8);
        doc.rect(50, currentY, 495, 15).stroke();
        doc.font('Helvetica-Oblique').text('Sold reportat din ziua precedentă', 85, currentY + 3, { width: 320 });
        const soldInitial = transactions.length > 0 ? Number(transactions[0].balanceBefore) : 0;
        doc.font('Helvetica').text(soldInitial.toFixed(2), 515, currentY + 3, { width: colWidths.sold, align: 'right' });
        currentY += 15;
        
        // Tranzacții
        let totalIncasari = 0;
        let totalPlati = 0;
        
        transactions.forEach((txn, index) => {
          const isIncasare = txn.transactionType === 'cash_receipt' || txn.transactionType === 'bank_withdrawal';
          const suma = Number(txn.amount);
          
          if (isIncasare) totalIncasari += suma;
          else totalPlati += suma;
          
          if (currentY > 700) { // Pagină nouă
            doc.addPage();
            currentY = 50;
          }
          
          doc.rect(50, currentY, 495, 15).stroke();
          doc.text((index + 1).toString(), 55, currentY + 3, { width: colWidths.nr, align: 'center' });
          doc.text(txn.documentNumber, 85, currentY + 3, { width: colWidths.doc });
          
          const ora = new Date(txn.transactionDate).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
          doc.text(ora, 175, currentY + 3, { width: colWidths.ora });
          
          const explicatie = `${txn.description.substring(0, 40)} - ${txn.personName}`;
          doc.text(explicatie, 225, currentY + 3, { width: colWidths.expl });
          
          doc.text(isIncasare ? suma.toFixed(2) : '', 375, currentY + 3, { width: colWidths.inc, align: 'right' });
          doc.text(!isIncasare ? suma.toFixed(2) : '', 445, currentY + 3, { width: colWidths.plati, align: 'right' });
          doc.text(Number(txn.balanceAfter).toFixed(2), 515, currentY + 3, { width: colWidths.sold, align: 'right' });
          
          currentY += 15;
        });
        
        // TOTAL
        doc.font('Helvetica-Bold').fontSize(9);
        doc.rect(50, currentY, 495, 20).fillAndStroke('#f0f0f0', '#000');
        doc.fillColor('#000').text('TOTAL', 225, currentY + 5, { width: colWidths.expl });
        doc.text(totalIncasari.toFixed(2), 375, currentY + 5, { width: colWidths.inc, align: 'right' });
        doc.text(totalPlati.toFixed(2), 445, currentY + 5, { width: colWidths.plati, align: 'right' });
        const soldFinal = transactions.length > 0 ? Number(transactions[transactions.length - 1].balanceAfter) : soldInitial;
        doc.text(soldFinal.toFixed(2), 515, currentY + 5, { width: colWidths.sold, align: 'right' });
        currentY += 30;
        
        // SEMNĂTURI
        doc.font('Helvetica').fontSize(10);
        doc.text('Casier:', 50, currentY + 20);
        doc.text('________________________', 50, currentY + 40);
        doc.text('Data: _______________', 50, currentY + 50);
        
        doc.text('Compartiment financiar-contabil:', 300, currentY + 20);
        doc.text('________________________', 300, currentY + 40);
        doc.text('Data: _______________', 300, currentY + 50);
        
        doc.end();
        
        stream.on('finish', async () => {
          console.log(`✅ PDF generat: ${filePath}`);
          
          // Cache the file path for 15 minutes
          if (this.redisService.isConnected()) {
            await this.redisService.setCached(cacheKey, filePath, 900); // 15min TTL
          }
          
          resolve(filePath);
        });
        
        stream.on('error', (err) => {
          console.error('❌ Eroare generare PDF:', err);
          reject(err);
        });
      } catch (error) {
        console.error('❌ Eroare generare PDF:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Generează raport HTML (alternativă la PDF, pentru preview)
   */
  public generateDailyRegisterHTML(
    cashRegister: CashRegister,
    date: Date,
    transactions: CashTransaction[],
    companyName: string
  ): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Registru de Casă - ${cashRegister.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { margin: 5px 0; }
    .info { margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    th { background-color: #f0f0f0; font-weight: bold; }
    .number { text-align: right; }
    .total { font-weight: bold; background-color: #f9f9f9; }
    .signatures { margin-top: 40px; }
    .signature-line { display: inline-block; width: 45%; margin: 10px 2%; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${companyName}</h1>
    <h2>REGISTRU DE CASĂ</h2>
    <p>Cod formular 14-4-7 (OMFP 2634/2015)</p>
  </div>
  
  <div class="info">
    <p><strong>Casierie:</strong> ${cashRegister.name} (Cod: ${cashRegister.code})</p>
    <p><strong>Data:</strong> ${date.toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p><strong>Moneda:</strong> ${cashRegister.currency}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th style="width: 5%;">Nr. crt.</th>
        <th style="width: 15%;">Document</th>
        <th style="width: 10%;">Ora</th>
        <th style="width: 35%;">Explicație</th>
        <th style="width: 10%;" class="number">Încasări</th>
        <th style="width: 10%;" class="number">Plăți</th>
        <th style="width: 15%;" class="number">Sold</th>
      </tr>
    </thead>
    <tbody>
`;
    
    // Sold reportat
    const soldInițial = transactions.length > 0 ? Number(transactions[0].balanceBefore) : 0;
    html += `
      <tr>
        <td></td>
        <td colspan="3"><em>Sold reportat din ziua precedentă</em></td>
        <td class="number"></td>
        <td class="number"></td>
        <td class="number">${soldInițial.toFixed(2)}</td>
      </tr>
`;
    
    // Tranzacții
    let totalÎncasări = 0;
    let totalPlăți = 0;
    
    transactions.forEach((txn, index) => {
      const isIncasare = txn.transactionType === 'cash_receipt' || txn.transactionType === 'bank_withdrawal';
      const sumă = Number(txn.amount);
      
      if (isIncasare) {
        totalÎncasări += sumă;
      } else {
        totalPlăți += sumă;
      }
      
      const ora = new Date(txn.transactionDate).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
      const explicație = `${txn.description} - ${txn.personName}${txn.invoiceNumber ? ` (${txn.invoiceNumber})` : ''}`;
      
      html += `
      <tr>
        <td>${index + 1}</td>
        <td>${txn.documentNumber}</td>
        <td>${ora}</td>
        <td>${explicație}</td>
        <td class="number">${isIncasare ? sumă.toFixed(2) : ''}</td>
        <td class="number">${!isIncasare ? sumă.toFixed(2) : ''}</td>
        <td class="number">${Number(txn.balanceAfter).toFixed(2)}</td>
      </tr>
`;
    });
    
    // Total
    const soldFinal = transactions.length > 0 ? Number(transactions[transactions.length - 1].balanceAfter) : soldInițial;
    html += `
      <tr class="total">
        <td colspan="4"><strong>TOTAL</strong></td>
        <td class="number"><strong>${totalÎncasări.toFixed(2)}</strong></td>
        <td class="number"><strong>${totalPlăți.toFixed(2)}</strong></td>
        <td class="number"><strong>${soldFinal.toFixed(2)}</strong></td>
      </tr>
`;
    
    html += `
    </tbody>
  </table>
  
  <div class="signatures">
    <div class="signature-line">
      <p><strong>Casier:</strong></p>
      <p>________________________</p>
      <p>Data: _______________</p>
    </div>
    <div class="signature-line">
      <p><strong>Compartiment financiar-contabil:</strong></p>
      <p>________________________</p>
      <p>Data: _______________</p>
    </div>
  </div>
</body>
</html>
`;
    
    return html;
  }
}

export default CashRegisterPDFService;
