/**
 * Purchase Journal Export Service
 */

import { PurchaseJournalReport } from '../types/purchase-journal-types';

export class PurchaseJournalExportService {
  
  public async exportToExcel(report: PurchaseJournalReport): Promise<Buffer> {
    const csvLines: string[] = [];
    csvLines.push(`JURNAL DE CUMPĂRĂRI - ${report.periodLabel}`);
    csvLines.push(`Companie: ${report.companyName}`);
    csvLines.push(`CUI: ${report.companyFiscalCode}`);
    csvLines.push('');
    
    const headers = ['Nr', 'Data', 'Document', 'Furnizor', 'CUI', 'Total', 'Bază 19%', 'TVA 19%', 'TVA Deductibil'];
    csvLines.push(headers.join(';'));
    
    for (const row of report.rows) {
      const rowData = [
        row.rowNumber,
        new Date(row.date).toLocaleDateString('ro-RO'),
        row.documentNumber,
        `"${row.supplierName.replace(/"/g, '""')}"`,
        row.supplierFiscalCode,
        row.totalAmount.toFixed(2),
        row.base19.toFixed(2),
        row.vat19.toFixed(2),
        row.vatDeductible.toFixed(2)
      ];
      csvLines.push(rowData.join(';'));
    }
    
    csvLines.push('');
    csvLines.push(['', '', '', '', 'TOTAL:', report.totals.totalAmount.toFixed(2)].join(';'));
    
    return Buffer.from('\ufeff' + csvLines.join('\n'), 'utf-8');
  }
  
  public async exportToPDF(report: PurchaseJournalReport): Promise<Buffer> {
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Jurnal Cumpărări</title></head>
<body><h1>JURNAL DE CUMPĂRĂRI - ${report.periodLabel}</h1>
<p>${report.companyName} (CUI: ${report.companyFiscalCode})</p>
<table border="1"><tr><th>Nr</th><th>Data</th><th>Document</th><th>Furnizor</th><th>CUI</th><th>Total</th></tr>
${report.rows.map(r => `<tr><td>${r.rowNumber}</td><td>${new Date(r.date).toLocaleDateString('ro-RO')}</td><td>${r.documentNumber}</td><td>${r.supplierName}</td><td>${r.supplierFiscalCode}</td><td>${r.totalAmount.toFixed(2)}</td></tr>`).join('')}
</table></body></html>`;
    
    return Buffer.from(html, 'utf-8');
  }
}

export default PurchaseJournalExportService;

