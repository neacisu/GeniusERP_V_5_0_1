/**
 * Purchase Journal Export Service
 * Enhanced cu Redis caching (TTL: 15min pentru exports)
 */

import { PurchaseJournalReport } from '../types/purchase-journal-types';
import { RedisService } from '../../../services/redis.service';

export class PurchaseJournalExportService {
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
   * Export jurnal în format Excel (CSV) COMPLET
   * TOATE coloanele conform OMFP 2634/2015
   */
  public async exportToExcel(report: PurchaseJournalReport): Promise<Buffer> {
    await this.ensureRedisConnection();
    
    const periodKey = `${new Date(report.periodStart).toISOString().split('T')[0]}_${new Date(report.periodEnd).toISOString().split('T')[0]}`;
    const cacheKey = `acc:purchase-journal-excel:${report.companyId}:${periodKey}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<string>(cacheKey);
      if (cached) {
        return Buffer.from(cached, 'base64');
      }
    }
    
    const csvLines: string[] = [];
    csvLines.push(`JURNAL DE CUMPĂRĂRI - ${report.periodLabel}`);
    csvLines.push(`Companie: ${report.companyName}`);
    csvLines.push(`CUI: ${report.companyFiscalCode}`);
    csvLines.push(`Perioada: ${new Date(report.periodStart).toLocaleDateString('ro-RO')} - ${new Date(report.periodEnd).toLocaleDateString('ro-RO')}`);
    csvLines.push('');
    
    // TOATE coloanele OMFP 2634/2015
    const headers = [
      'Nr. Crt', 'Data', 'Nr. Document', 'Furnizor', 'CUI Furnizor', 'Total Document',
      'Bază 19%', 'TVA 19%', 'Bază 9%', 'TVA 9%', 'Bază 5%', 'TVA 5%',
      'Achiziții IC', 'Import', 'Taxare Inversă', 'Neimpozabil',
      'TVA Neexigibil', 'TVA Deductibil', 'Tip Cheltuială', 'Observații'
    ];
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
        row.base9.toFixed(2),
        row.vat9.toFixed(2),
        row.base5.toFixed(2),
        row.vat5.toFixed(2),
        row.intraCommunity.toFixed(2),
        row.import.toFixed(2),
        row.reverseCharge.toFixed(2),
        row.notSubject.toFixed(2),
        row.vatDeferred.toFixed(2),
        row.vatDeductible.toFixed(2),
        row.expenseType || '',
        `"${(row.notes || '').replace(/"/g, '""')}"`
      ];
      csvLines.push(rowData.join(';'));
    }
    
    // TOTAL row
    csvLines.push('');
    const totalRow = [
      '', '', '', '', 'TOTAL:',
      report.totals.totalAmount.toFixed(2),
      report.totals.totalBase19.toFixed(2),
      report.totals.totalVAT19.toFixed(2),
      report.totals.totalBase9.toFixed(2),
      report.totals.totalVAT9.toFixed(2),
      report.totals.totalBase5.toFixed(2),
      report.totals.totalVAT5.toFixed(2),
      report.totals.totalIntraCommunity.toFixed(2),
      report.totals.totalImport.toFixed(2),
      report.totals.totalReverseCharge.toFixed(2),
      report.totals.totalNotSubject.toFixed(2),
      report.totals.totalVATDeferred.toFixed(2),
      report.totals.totalVATDeductible.toFixed(2),
      '', ''
    ];
    csvLines.push(totalRow.join(';'));
    
    // Verificări contabile
    if (report.accountingValidation) {
      csvLines.push('');
      csvLines.push('VERIFICĂRI CONTABILE:');
      csvLines.push(`Cont 4426 (TVA deductibilă): ${report.accountingValidation.account4426Balance.toFixed(2)} RON`);
      csvLines.push(`Cont 4428 (TVA neexigibilă): ${report.accountingValidation.account4428Balance.toFixed(2)} RON`);
      csvLines.push(`Cont 401 (Furnizori): ${report.accountingValidation.account401Balance.toFixed(2)} RON`);
      csvLines.push(`Statut: ${report.accountingValidation.isBalanced ? 'BALANSAT ✓' : 'DISCREPANȚE ✗'}`);
      
      if (report.accountingValidation.discrepancies) {
        csvLines.push('');
        csvLines.push('DISCREPANȚE:');
        report.accountingValidation.discrepancies.forEach(disc => csvLines.push(disc));
      }
    }
    
    const buffer = Buffer.from('\ufeff' + csvLines.join('\n'), 'utf-8');
    
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, buffer.toString('base64'), 900); // 15min TTL
    }
    
    return buffer;
  }
  
  public async exportToPDF(report: PurchaseJournalReport): Promise<Buffer> {
    await this.ensureRedisConnection();
    
    const periodKey = `${new Date(report.periodStart).toISOString().split('T')[0]}_${new Date(report.periodEnd).toISOString().split('T')[0]}`;
    const cacheKey = `acc:purchase-journal-pdf:${report.companyId}:${periodKey}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<string>(cacheKey);
      if (cached) {
        return Buffer.from(cached, 'base64');
      }
    }
    
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Jurnal Cumpărări</title></head>
<body><h1>JURNAL DE CUMPĂRĂRI - ${report.periodLabel}</h1>
<p>${report.companyName} (CUI: ${report.companyFiscalCode})</p>
<table border="1"><tr><th>Nr</th><th>Data</th><th>Document</th><th>Furnizor</th><th>CUI</th><th>Total</th></tr>
${report.rows.map(r => `<tr><td>${r.rowNumber}</td><td>${new Date(r.date).toLocaleDateString('ro-RO')}</td><td>${r.documentNumber}</td><td>${r.supplierName}</td><td>${r.supplierFiscalCode}</td><td>${r.totalAmount.toFixed(2)}</td></tr>`).join('')}
</table></body></html>`;
    const buffer = Buffer.from(html, 'utf-8');
    
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, buffer.toString('base64'), 900); // 15min TTL
    }
    
    return buffer;
  }
}

export default PurchaseJournalExportService;

