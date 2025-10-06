/**
 * Bank Journal PDF Generator Service
 * 
 * Generează rapoarte PDF pentru Jurnalul de Bancă
 */

import type { BankAccount, BankTransaction } from '../../../../shared/schema/bank-journal.schema';

/**
 * PAS 7: Serviciu de generare PDF pentru Jurnalul de Bancă
 * 
 * Generează raport periodic (lunar, anual) pentru operațiuni bancare
 */
export class BankJournalPDFService {
  /**
   * Generează PDF pentru jurnalul de bancă
   */
  public async generateBankJournalPDF(
    bankAccount: BankAccount,
    startDate: Date,
    endDate: Date,
    transactions: BankTransaction[],
    companyName: string
  ): Promise<string> {
    const fileName = `jurnal-banca-${bankAccount.accountNumber}-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.pdf`;
    const filePath = `/reports/bank-journals/${fileName}`;
    
    // TODO: Implementare completă cu librărie PDF
    console.log(`PDF jurnal bancă ar trebui generat la: ${filePath}`);
    
    return filePath;
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
