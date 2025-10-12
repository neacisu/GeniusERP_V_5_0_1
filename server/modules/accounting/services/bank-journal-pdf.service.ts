/**
 * Bank Journal PDF Generator Service
 * 
 * Generează rapoarte PDF pentru Jurnalul de Bancă
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import type { BankAccount, BankTransaction } from '../../../../shared/schema/bank-journal.schema';

/**
 * RECOMANDARE 1: Serviciu COMPLET de generare PDF pentru Jurnalul de Bancă
 * 
 * Generează raport periodic (lunar, anual) pentru operațiuni bancare
 */
export class BankJournalPDFService {
  /**
   * Generează PDF REAL pentru jurnalul de bancă
   */
  public async generateBankJournalPDF(
    bankAccount: BankAccount,
    startDate: Date,
    endDate: Date,
    transactions: BankTransaction[],
    companyName: string,
    initialBalance: number = 0
  ): Promise<string> {
    // RECOMANDARE 1: IMPLEMENTARE COMPLETĂ cu PDFKit
    const reportsDir = path.join(process.cwd(), 'reports', 'bank-journals');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const fileName = `jurnal-banca-${bankAccount.accountNumber}-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margins: { top: 50, bottom: 50, left: 50, right: 50 } 
        });
        
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        
        // ANTET
        doc.fontSize(16).font('Helvetica-Bold').text(companyName, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).text('JURNAL DE BANCĂ / EXTRAS DE CONT', { align: 'center' });
        doc.moveDown(1);
        
        // Info cont
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`Cont bancar: ${bankAccount.accountName}`);
        doc.text(`IBAN: ${bankAccount.accountNumber}`);
        doc.text(`Bancă: ${bankAccount.bankName}${bankAccount.bankCode ? ` (${bankAccount.bankCode})` : ''}`);
        doc.text(`Perioadă: ${startDate.toLocaleDateString('ro-RO')} - ${endDate.toLocaleDateString('ro-RO')}`);
        doc.text(`Moneda: ${bankAccount.currency}`);
        doc.moveDown(1);
        
        // TABEL
        const colWidths = { nr: 30, data: 60, ref: 80, desc: 150, inc: 70, plati: 70, sold: 70 };
        let currentY = doc.y;
        
        // Header
        doc.font('Helvetica-Bold').fontSize(9);
        doc.rect(50, currentY, 495, 20).stroke();
        doc.text('Nr.', 55, currentY + 5, { width: colWidths.nr, align: 'center' });
        doc.text('Data', 85, currentY + 5, { width: colWidths.data });
        doc.text('Referință', 145, currentY + 5, { width: colWidths.ref });
        doc.text('Descriere', 225, currentY + 5, { width: colWidths.desc });
        doc.text('Încasări', 375, currentY + 5, { width: colWidths.inc, align: 'right' });
        doc.text('Plăți', 445, currentY + 5, { width: colWidths.plati, align: 'right' });
        doc.text('Sold', 515, currentY + 5, { width: colWidths.sold, align: 'right' });
        currentY += 20;
        
        // Sold inițial
        doc.fontSize(8);
        doc.rect(50, currentY, 495, 15).stroke();
        doc.font('Helvetica-Oblique').text('Sold inițial perioadă', 145, currentY + 3, { width: 200 });
        doc.font('Helvetica').text(initialBalance.toFixed(2), 515, currentY + 3, { width: colWidths.sold, align: 'right' });
        currentY += 15;
        
        // Tranzacții
        let totalIncasari = 0;
        let totalPlati = 0;
        
        transactions.forEach((txn, index) => {
          const isIncasare = txn.transactionType === 'incoming_payment' || 
                            txn.transactionType === 'bank_interest' ||
                            txn.transactionType === 'loan_disbursement';
          const suma = Number(txn.amount);
          
          if (isIncasare) totalIncasari += suma;
          else totalPlati += suma;
          
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }
          
          doc.rect(50, currentY, 495, 15).stroke();
          doc.text((index + 1).toString(), 55, currentY + 3, { width: colWidths.nr, align: 'center' });
          doc.text(new Date(txn.transactionDate).toLocaleDateString('ro-RO'), 85, currentY + 3, { width: colWidths.data });
          doc.text(txn.referenceNumber.substring(0, 15), 145, currentY + 3, { width: colWidths.ref });
          doc.text(txn.description.substring(0, 35), 225, currentY + 3, { width: colWidths.desc });
          doc.text(isIncasare ? suma.toFixed(2) : '', 375, currentY + 3, { width: colWidths.inc, align: 'right' });
          doc.text(!isIncasare ? suma.toFixed(2) : '', 445, currentY + 3, { width: colWidths.plati, align: 'right' });
          doc.text(Number(txn.balanceAfter).toFixed(2), 515, currentY + 3, { width: colWidths.sold, align: 'right' });
          
          currentY += 15;
        });
        
        // TOTAL
        doc.font('Helvetica-Bold').fontSize(9);
        doc.rect(50, currentY, 495, 20).fillAndStroke('#f0f0f0', '#000');
        doc.fillColor('#000').text('TOTAL', 225, currentY + 5, { width: colWidths.desc });
        doc.text(totalIncasari.toFixed(2), 375, currentY + 5, { width: colWidths.inc, align: 'right' });
        doc.text(totalPlati.toFixed(2), 445, currentY + 5, { width: colWidths.plati, align: 'right' });
        const soldFinal = transactions.length > 0 ? Number(transactions[transactions.length - 1].balanceAfter) : initialBalance;
        doc.text(soldFinal.toFixed(2), 515, currentY + 5, { width: colWidths.sold, align: 'right' });
        
        // Footer
        doc.moveDown(2);
        doc.font('Helvetica').fontSize(8);
        doc.text(`Raport generat automat de GeniusERP la ${new Date().toLocaleString('ro-RO')}`, { align: 'center' });
        
        doc.end();
        
        stream.on('finish', () => {
          console.log(`✅ PDF jurnal bancă generat: ${filePath}`);
          resolve(filePath);
        });
        
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Generează raport HTML pentru jurnal bancă
   */
  public generateBankJournalHTML(
    bankAccount: BankAccount,
    startDate: Date,
    endDate: Date,
    transactions: BankTransaction[],
    companyName: string,
    initialBalance: number
  ): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Jurnal de Bancă - ${bankAccount.accountName}</title>
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
    .incoming { color: green; }
    .outgoing { color: red; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${companyName}</h1>
    <h2>JURNAL DE BANCĂ / EXTRAS DE CONT</h2>
  </div>
  
  <div class="info">
    <p><strong>Cont bancar:</strong> ${bankAccount.accountName}</p>
    <p><strong>IBAN:</strong> ${bankAccount.accountNumber}</p>
    <p><strong>Bancă:</strong> ${bankAccount.bankName}${bankAccount.bankCode ? ` (${bankAccount.bankCode})` : ''}</p>
    <p><strong>Perioadă:</strong> ${startDate.toLocaleDateString('ro-RO')} - ${endDate.toLocaleDateString('ro-RO')}</p>
    <p><strong>Moneda:</strong> ${bankAccount.currency}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th style="width: 5%;">Nr.</th>
        <th style="width: 10%;">Data</th>
        <th style="width: 15%;">Referință</th>
        <th style="width: 35%;">Descriere</th>
        <th style="width: 10%;" class="number">Încasări</th>
        <th style="width: 10%;" class="number">Plăți</th>
        <th style="width: 15%;" class="number">Sold</th>
      </tr>
    </thead>
    <tbody>
`;
    
    // Sold inițial
    html += `
      <tr>
        <td></td>
        <td colspan="3"><em>Sold inițial perioadă</em></td>
        <td class="number"></td>
        <td class="number"></td>
        <td class="number">${initialBalance.toFixed(2)}</td>
      </tr>
`;
    
    // Tranzacții
    let totalÎncasări = 0;
    let totalPlăți = 0;
    
    transactions.forEach((txn, index) => {
      const isIncasare = txn.transactionType === 'incoming_payment' || 
                        txn.transactionType === 'bank_interest' ||
                        txn.transactionType === 'loan_disbursement';
      const sumă = Number(txn.amount);
      
      if (isIncasare) {
        totalÎncasări += sumă;
      } else {
        totalPlăți += sumă;
      }
      
      const data = new Date(txn.transactionDate).toLocaleDateString('ro-RO');
      const partener = isIncasare ? txn.payerName : txn.payeeName;
      const descriere = `${txn.description}${partener ? ` - ${partener}` : ''}${txn.invoiceNumber ? ` (${txn.invoiceNumber})` : ''}`;
      
      html += `
      <tr>
        <td>${index + 1}</td>
        <td>${data}</td>
        <td>${txn.referenceNumber}</td>
        <td>${descriere}</td>
        <td class="number ${isIncasare ? 'incoming' : ''}">${isIncasare ? sumă.toFixed(2) : ''}</td>
        <td class="number ${!isIncasare ? 'outgoing' : ''}">${!isIncasare ? sumă.toFixed(2) : ''}</td>
        <td class="number">${Number(txn.balanceAfter).toFixed(2)}</td>
      </tr>
`;
    });
    
    // Total
    const soldFinal = transactions.length > 0 ? Number(transactions[transactions.length - 1].balanceAfter) : initialBalance;
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
  
  <div style="margin-top: 40px;">
    <p><strong>Sold inițial:</strong> ${initialBalance.toFixed(2)} ${bankAccount.currency}</p>
    <p><strong>Total încasări:</strong> ${totalÎncasări.toFixed(2)} ${bankAccount.currency}</p>
    <p><strong>Total plăți:</strong> ${totalPlăți.toFixed(2)} ${bankAccount.currency}</p>
    <p><strong>Sold final:</strong> ${soldFinal.toFixed(2)} ${bankAccount.currency}</p>
  </div>
  
  <div style="margin-top: 40px;">
    <p><em>Raport generat automat de GeniusERP la data de ${new Date().toLocaleString('ro-RO')}</em></p>
  </div>
</body>
</html>
`;
    
    return html;
  }
}

export default BankJournalPDFService;
