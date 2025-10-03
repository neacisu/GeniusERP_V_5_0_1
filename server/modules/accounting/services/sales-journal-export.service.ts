/**
 * Sales Journal Export Service
 * 
 * Serviciu pentru export Jurnal de Vânzări în Excel și PDF
 * conform modelului ANAF (OMFP 2634/2015)
 */

import { SalesJournalReport } from '../types/sales-journal-types';

/**
 * Service pentru export rapoarte jurnal vânzări
 */
export class SalesJournalExportService {
  
  /**
   * Export jurnal în format Excel
   * Generează fișier .xlsx conform modelului ANAF
   */
  public async exportToExcel(report: SalesJournalReport): Promise<Buffer> {
    try {
      // NOTE: Acest export generează un CSV pentru moment
      // Pentru Excel real (.xlsx) trebuie instalat: npm install xlsx
      // Placeholder implementation - returnează CSV
      
      const csvLines: string[] = [];
      
      // Header rând 1 - Informații companie
      csvLines.push(`JURNAL DE VÂNZĂRI - ${report.periodLabel}`);
      csvLines.push(`Companie: ${report.companyName}`);
      csvLines.push(`CUI: ${report.companyFiscalCode}`);
      csvLines.push(`Perioada: ${new Date(report.periodStart).toLocaleDateString('ro-RO')} - ${new Date(report.periodEnd).toLocaleDateString('ro-RO')}`);
      csvLines.push(''); // Rând gol
      
      // Header tabel - coloanele conform OMFP 2634/2015
      const headers = [
        'Nr. Crt',
        'Data',
        'Număr Document',
        'Client',
        'CUI Client',
        'Total Document',
        'Bază 19%',
        'TVA 19%',
        'Bază 9%',
        'TVA 9%',
        'Bază 5%',
        'TVA 5%',
        'Livrări IC',
        'Export',
        'Scutit cu drept',
        'Scutit fără drept',
        'Taxare inversă',
        'TVA Neexigibil',
        'TVA Exigibil',
        'Observații'
      ];
      
      csvLines.push(headers.join(';'));
      
      // Date rows
      for (const row of report.rows) {
        const rowData = [
          row.rowNumber,
          new Date(row.date).toLocaleDateString('ro-RO'),
          row.documentNumber,
          `"${row.clientName.replace(/"/g, '""')}"`, // Escape quotes
          row.clientFiscalCode,
          row.totalAmount.toFixed(2),
          row.base19.toFixed(2),
          row.vat19.toFixed(2),
          row.base9.toFixed(2),
          row.vat9.toFixed(2),
          row.base5.toFixed(2),
          row.vat5.toFixed(2),
          row.intraCommunity.toFixed(2),
          row.export.toFixed(2),
          row.exemptWithCredit.toFixed(2),
          row.exemptNoCredit.toFixed(2),
          row.reverseCharge.toFixed(2),
          row.vatDeferred.toFixed(2),
          row.vatCollected.toFixed(2),
          `"${(row.notes || '').replace(/"/g, '""')}"`
        ];
        
        csvLines.push(rowData.join(';'));
      }
      
      // Total row
      csvLines.push(''); // Rând gol
      const totalRow = [
        '',
        '',
        '',
        '',
        'TOTAL:',
        report.totals.totalAmount.toFixed(2),
        report.totals.totalBase19.toFixed(2),
        report.totals.totalVAT19.toFixed(2),
        report.totals.totalBase9.toFixed(2),
        report.totals.totalVAT9.toFixed(2),
        report.totals.totalBase5.toFixed(2),
        report.totals.totalVAT5.toFixed(2),
        report.totals.totalIntraCommunity.toFixed(2),
        report.totals.totalExport.toFixed(2),
        report.totals.totalExemptWithCredit.toFixed(2),
        report.totals.totalExemptNoCredit.toFixed(2),
        report.totals.totalReverseCharge.toFixed(2),
        report.totals.totalVATDeferred.toFixed(2),
        report.totals.totalVATCollected.toFixed(2),
        ''
      ];
      
      csvLines.push(totalRow.join(';'));
      
      // Verificări contabile
      if (report.accountingValidation) {
        csvLines.push('');
        csvLines.push('VERIFICĂRI CONTABILE:');
        csvLines.push(`Cont 4427 (TVA colectată): ${report.accountingValidation.account4427Balance.toFixed(2)} RON`);
        csvLines.push(`Cont 4428 (TVA neexigibilă): ${report.accountingValidation.account4428Balance.toFixed(2)} RON`);
        csvLines.push(`Cont 707 (Venituri): ${report.accountingValidation.account707Balance.toFixed(2)} RON`);
        csvLines.push(`Statut: ${report.accountingValidation.isBalanced ? 'BALANSAT ✓' : 'DISCREPANȚE ✗'}`);
        
        if (report.accountingValidation.discrepancies) {
          csvLines.push('');
          csvLines.push('DISCREPANȚE:');
          report.accountingValidation.discrepancies.forEach((disc: string) => {
            csvLines.push(disc);
          });
        }
      }
      
      const csvContent = csvLines.join('\n');
      return Buffer.from('\ufeff' + csvContent, 'utf-8'); // BOM pentru Excel românesc
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export to Excel');
    }
  }
  
  /**
   * Export jurnal în format PDF
   * Generează fișier PDF conform modelului ANAF
   */
  public async exportToPDF(report: SalesJournalReport): Promise<Buffer> {
    try {
      // NOTE: Pentru PDF real trebuie instalat: npm install pdfkit
      // Placeholder implementation - returnează HTML
      
      const html = this.generateHTMLReport(report);
      
      // Returnează HTML ca buffer pentru moment
      // În versiune completă ar folosi pdfkit sau puppeteer pentru PDF real
      return Buffer.from(html, 'utf-8');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export to PDF');
    }
  }
  
  /**
   * Generează HTML pentru raport (folosit și pentru print)
   */
  private generateHTMLReport(report: SalesJournalReport): string {
    const formatNumber = (num: number) => num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('ro-RO');
    
    let html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Jurnal de Vânzări - ${report.periodLabel}</title>
  <style>
    @page { size: A4 landscape; margin: 1cm; }
    body { font-family: Arial, sans-serif; font-size: 10px; }
    h1 { text-align: center; font-size: 14px; margin-bottom: 5px; }
    .header-info { text-align: center; margin-bottom: 20px; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th { background: #f0f0f0; border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; }
    td { border: 1px solid #ccc; padding: 3px; }
    .text-right { text-align: right; }
    .total-row { background: #e0e0e0; font-weight: bold; }
    .storno { background: #ffe0e0; }
    .payment { background: #e0ffe0; font-style: italic; }
  </style>
</head>
<body>
  <h1>JURNAL DE VÂNZĂRI</h1>
  <div class="header-info">
    <strong>${report.companyName}</strong><br>
    CUI: ${report.companyFiscalCode}<br>
    Perioada: ${formatDate(String(report.periodStart))} - ${formatDate(String(report.periodEnd))}
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Nr.</th>
        <th>Data</th>
        <th>Document</th>
        <th>Client</th>
        <th>CUI</th>
        <th>Total</th>
        <th colspan="2">TVA 19%</th>
        <th colspan="2">TVA 9%</th>
        <th colspan="2">TVA 5%</th>
        <th>IC</th>
        <th>Export</th>
        <th>TVA Neex.</th>
        <th>TVA Exig.</th>
      </tr>
      <tr>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th>Bază</th>
        <th>TVA</th>
        <th>Bază</th>
        <th>TVA</th>
        <th>Bază</th>
        <th>TVA</th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
      </tr>
    </thead>
    <tbody>
`;
    
    // Data rows
    for (const row of report.rows) {
      const rowClass = row.documentType === 'CREDIT_NOTE' ? 'storno' : (row.documentType === 'PAYMENT' ? 'payment' : '');
      html += `
      <tr class="${rowClass}">
        <td>${row.rowNumber}</td>
        <td>${formatDate(String(row.date))}</td>
        <td>${row.documentNumber}</td>
        <td>${row.clientName}</td>
        <td>${row.clientFiscalCode}</td>
        <td class="text-right">${formatNumber(row.totalAmount)}</td>
        <td class="text-right">${row.base19 !== 0 ? formatNumber(row.base19) : ''}</td>
        <td class="text-right">${row.vat19 !== 0 ? formatNumber(row.vat19) : ''}</td>
        <td class="text-right">${row.base9 !== 0 ? formatNumber(row.base9) : ''}</td>
        <td class="text-right">${row.vat9 !== 0 ? formatNumber(row.vat9) : ''}</td>
        <td class="text-right">${row.base5 !== 0 ? formatNumber(row.base5) : ''}</td>
        <td class="text-right">${row.vat5 !== 0 ? formatNumber(row.vat5) : ''}</td>
        <td class="text-right">${row.intraCommunity !== 0 ? formatNumber(row.intraCommunity) : ''}</td>
        <td class="text-right">${row.export !== 0 ? formatNumber(row.export) : ''}</td>
        <td class="text-right">${row.vatDeferred !== 0 ? formatNumber(row.vatDeferred) : ''}</td>
        <td class="text-right">${row.vatCollected !== 0 ? formatNumber(row.vatCollected) : ''}</td>
      </tr>
`;
    }
    
    // Total row
    html += `
      <tr class="total-row">
        <td colspan="5">TOTAL:</td>
        <td class="text-right">${formatNumber(report.totals.totalAmount)}</td>
        <td class="text-right">${formatNumber(report.totals.totalBase19)}</td>
        <td class="text-right">${formatNumber(report.totals.totalVAT19)}</td>
        <td class="text-right">${formatNumber(report.totals.totalBase9)}</td>
        <td class="text-right">${formatNumber(report.totals.totalVAT9)}</td>
        <td class="text-right">${formatNumber(report.totals.totalBase5)}</td>
        <td class="text-right">${formatNumber(report.totals.totalVAT5)}</td>
        <td class="text-right">${formatNumber(report.totals.totalIntraCommunity)}</td>
        <td class="text-right">${formatNumber(report.totals.totalExport)}</td>
        <td class="text-right">${formatNumber(report.totals.totalVATDeferred)}</td>
        <td class="text-right">${formatNumber(report.totals.totalVATCollected)}</td>
      </tr>
    </tbody>
  </table>
  
  <div style="margin-top: 20px; padding: 10px; background: #f9f9f9; border: 1px solid #ddd;">
    <strong>Verificări Contabile:</strong><br>
    ${report.accountingValidation ? `
      Cont 4427 (TVA colectată): ${formatNumber(report.accountingValidation.account4427Balance)} RON<br>
      Cont 4428 (TVA neexigibilă): ${formatNumber(report.accountingValidation.account4428Balance)} RON<br>
      Cont 707 (Venituri): ${formatNumber(report.accountingValidation.account707Balance)} RON<br>
      <strong>Statut: ${report.accountingValidation.isBalanced ? '✓ BALANSAT' : '✗ DISCREPANȚE'}</strong>
      ${report.accountingValidation.discrepancies ? '<br><br>Discrepanțe:<br>' + report.accountingValidation.discrepancies.join('<br>') : ''}
    ` : 'Nu s-au verificat soldurile'}
  </div>
  
  <div style="margin-top: 30px; text-align: right; font-size: 10px;">
    <p>Întocmit: ${new Date(report.generatedAt).toLocaleString('ro-RO')}</p>
    <p style="margin-top: 40px;">___________________________</p>
    <p>Semnătura și ștampila</p>
  </div>
</body>
</html>
    `;
    
      return Buffer.from(html, 'utf-8');
    } catch (error) {
      console.error('Error generating HTML report:', error);
      throw new Error('Failed to generate report');
    }
  }
}

export default SalesJournalExportService;
