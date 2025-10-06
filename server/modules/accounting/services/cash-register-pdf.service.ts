/**
 * Cash Register PDF Generator Service
 * 
 * Generează rapoarte PDF pentru Registrul de Casă conform OMFP 2634/2015
 * Format: Registru zilnic cu toate coloanele obligatorii
 */

import type { CashRegister, CashTransaction } from '../../../../shared/schema/cash-register.schema';

/**
 * PAS 6: Serviciu de generare PDF pentru Registrul de Casă
 * 
 * Generează un raport zilnic conform formularului 14-4-7 OMFP 2634/2015
 */
export class CashRegisterPDFService {
  /**
   * Generează PDF pentru registrul zilnic de casă
   */
  public async generateDailyRegisterPDF(
    cashRegister: CashRegister,
    date: Date,
    transactions: CashTransaction[],
    companyName: string
  ): Promise<string> {
    // TODO: Implementare completă cu librărie PDF (pdfkit, puppeteer, etc.)
    // 
    // Structura raportului ar trebui să includă:
    // 
    // ANTET:
    // - Denumirea companiei
    // - "REGISTRU DE CASĂ" (cod 14-4-7)
    // - Denumirea casieriei și codul
    // - Data: DD.MM.YYYY
    // - Moneda: RON/EUR/USD
    // 
    // TABEL:
    // | Nr. | Document | Data/Ora | Explicație | Încasări | Plăți | Sold |
    // |-----|----------|----------|------------|----------|-------|------|
    // |  -  | Sold reportat din ziua precedentă | | | | Sold inițial |
    // | 1   | CH/2025/000001 | 10:30 | Încasare client ... | 1,000.00 | | 51,000.00 |
    // | 2   | DP/2025/000123 | 11:45 | Plată furnizor ... | | 500.00 | 50,500.00 |
    // |-----|----------|----------|------------|----------|-------|------|
    // | TOTAL | | | | 1,000.00 | 500.00 | 50,500.00 |
    // 
    // SUBSEMNAȚI:
    // Casier: _________________ Data: _________
    // Compartiment financiar-contabil: _________________ Data: _________
    // 
    // IMPLEMENTARE SIMPLIFICATĂ:
    // Pentru moment, returnăm calea unde ar trebui salvat PDF-ul
    // Implementarea completă necesită integrarea unei librării PDF
    
    const fileName = `registru-casa-${cashRegister.code}-${date.toISOString().split('T')[0]}.pdf`;
    const filePath = `/reports/cash-registers/${fileName}`;
    
    // În implementarea reală:
    // 1. Creează document PDF
    // 2. Adaugă antet cu logo și date companie
    // 3. Generează tabel cu tranzacții
    // 4. Calculează totaluri
    // 5. Adaugă subsemnații
    // 6. Salvează PDF la filePath
    
    console.log(`PDF-ul ar trebui generat la: ${filePath}`);
    console.log(`Companie: ${companyName}`);
    console.log(`Casierie: ${cashRegister.name} (${cashRegister.code})`);
    console.log(`Data: ${date.toLocaleDateString('ro-RO')}`);
    console.log(`Tranzacții: ${transactions.length}`);
    
    return filePath;
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
