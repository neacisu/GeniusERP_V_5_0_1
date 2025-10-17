/**
 * Devalidate Invoice Service
 * 
 * This service handles invoice devalidation and reversal of accounting notes.
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { invoices } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { JournalService } from '../../accounting/services/journal.service';
import { AuditService, AuditAction } from '../../audit/services/audit.service';

/**
 * Devalidation result interface
 */
export interface DevalidationResult {
  invoiceId: string;
  devalidatedAt: string;
  devalidatedBy: string;
  reason: string;
}

/**
 * Service for devalidating invoices and reverting accounting notes
 */
export class DevalidateInvoiceService {
  private static drizzle = new DrizzleService();

  /**
   * Devalidate an invoice and revert the accounting note
   * @param invoiceId Invoice ID
   * @param userId User ID performing the devalidation
   * @param reason Reason for devalidation
   * @returns Devalidation result
   */
  static async devalidateInvoice(
    invoiceId: string, 
    userId: string, 
    reason: string
  ): Promise<DevalidationResult> {
    if (!invoiceId) {
      throw new Error('Invoice ID is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!reason || reason.trim() === '') {
      throw new Error('Devalidation reason is required');
    }
    
    // Get invoice data using base query method
    const query = `
      SELECT * FROM invoices 
      WHERE id = $1 AND is_validated = true
      LIMIT 1
    `;
    const results = await this.drizzle.base.executeQuery(query, [invoiceId]);
    
    if (!results || results.length === 0) {
      throw new Error(`Invoice with ID ${invoiceId} not found or not validated`);
    }
    
    const invoiceData = results[0] as any;
    
    if (!invoiceData) {
      throw new Error(`Invoice with ID ${invoiceId} not found`);
    }
    
    // Check if invoice is validated
    if (!invoiceData.isValidated) {
      throw new Error(`Invoice with ID ${invoiceId} is not validated`);
    }
    
    // Check if there's a ledger entry to revert
    if (!invoiceData.ledgerEntryId) {
      throw new Error(`Invoice with ID ${invoiceId} does not have a linked ledger entry`);
    }
    
    try {
      // Revert the ledger entry
      const journalService = new JournalService();
      
      await journalService.reverseLedgerEntry(
        invoiceData.ledgerEntryId,
        userId,
        `Reversed due to invoice devalidation: ${reason}`
      );
      
      // Update invoice validation status using raw SQL
      const now = new Date();
      
      const updateQuery = `
        UPDATE invoices
        SET is_validated = false,
            validated_at = NULL,
            validated_by = NULL,
            ledger_entry_id = NULL,
            updated_at = NOW()
        WHERE id = $1
      `;
      await this.drizzle.base.executeQuery(updateQuery, [invoiceId]);
      
      // Log audit event
      await AuditService.log({
        userId,
        companyId: invoiceData.companyId,
        franchiseId: invoiceData.franchiseId,
        action: AuditAction.DEVALIDATE,
        entity: 'invoice',
        entityId: invoiceId,
        details: {
          invoiceNumber: invoiceData.invoiceNumber,
          reason,
          reversedLedgerEntryId: invoiceData.ledgerEntryId
        }
      });
      
      // Return devalidation result
      return {
        invoiceId,
        devalidatedAt: now.toISOString(),
        devalidatedBy: userId,
        reason
      };
    } catch (error) {
      console.error('[DevalidateInvoiceService] Error:', error instanceof Error ? error.message : String(error));
      
      throw new Error(`Failed to devalidate invoice: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default DevalidateInvoiceService;