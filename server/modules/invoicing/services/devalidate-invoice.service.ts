/**
 * Devalidate Invoice Service
 * 
 * This service handles invoice devalidation and reversal of accounting notes.
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { invoices } from '../schema/invoice.schema';
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
    
    // Get invoice data
    const invoiceData = await this.drizzle.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
      with: {
        company: true
      }
    });
    
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
        `Reversed due to invoice devalidation: ${reason}`
      );
      
      // Update invoice validation status
      const now = new Date();
      
      await this.drizzle.update(invoices)
        .set({
          isValidated: false,
          validatedAt: null,
          validatedBy: null,
          ledgerEntryId: null,
          updatedAt: now
        })
        .where(eq(invoices.id, invoiceId));
      
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