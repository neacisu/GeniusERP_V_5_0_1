/**
 * Sales Journal Export Service
 * Serviciu pentru export Jurnal de Vânzări în Excel și PDF
 */

import { SalesJournalReport } from '../types/sales-journal-types';

export class SalesJournalExportService {
  
  public async exportToExcel(report: SalesJournalReport): Promise<Buffer> {
    try {
      const csvLines: string[] = [];
      
      csvLines.push(`JURNAL DE VÂNZĂRI - ${report.periodLabel}`);
      csvLines.push(`Companie: ${report.companyName}`);
      csvLines.push(`CUI: ${report.companyFiscalCode}`);
      csvLines.push('');
      
      const headers = ['Nr. Crt', 'Data', 'Document', 'Client', 'CUI', 'Total', 'Bază 19%', 'TVA 19%'];
      csvLines.push(headers.join(';'));
      
      for (const row of report.rows) {
        const rowData = [
          row.rowNumber,
          new Date(row.date).toLocaleDateString('ro-RO'),
          row.documentNumber,
          `"${row.clientName.replace(/"/g, '""')}"`,
          row.clientFiscalCode,
          row.totalAmount.toFixed(2),
          row.base19.toFixed(2),
          row.vat19.toFixed(2)
        ];
        csvLines.push(rowData.join(';'));
      }
      
      csvLines.push('');
      csvLines.push(['', '', '', '', 'TOTAL:', report.totals.totalAmount.toFixed(2)].join(';'));
      
      const csvContent = csvLines.join('\n');
      return Buffer.from('\ufeff' + csvContent, 'utf-8');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export to Excel');
    }
  }
  
  public async exportToPDF(report: SalesJournalReport): Promise<Buffer> {
    try {
      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Jurnal Vânzări</title></head>
<body><h1>JURNAL DE VÂNZĂRI - ${report.periodLabel}</h1>
<p>${report.companyName} (CUI: ${report.companyFiscalCode})</p>
<table border="1"><tr><th>Nr</th><th>Data</th><th>Document</th><th>Client</th><th>Total</th></tr>
${report.rows.map(r => `<tr><td>${r.rowNumber}</td><td>${new Date(r.date).toLocaleDateString('ro-RO')}</td><td>${r.documentNumber}</td><td>${r.clientName}</td><td>${r.totalAmount.toFixed(2)}</td></tr>`).join('')}
</table></body></html>`;
      
      return Buffer.from(html, 'utf-8');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export to PDF');
    }
  }
}

export default SalesJournalExportService;

