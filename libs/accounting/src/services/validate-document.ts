/**
 * Validate Document Service
 * 
 * Generic document validation service that generates accounting notes (Note Contabil)
 * for different document types based on Romanian accounting standards.
 */

import { AuditService, AuditAction } from '@geniuserp/audit';
import { JournalService, LedgerEntryType } from './journal.service';
import { SalesJournalService } from './sales-journal.service';
import { DrizzleService } from "@common/drizzle";
import { eq } from 'drizzle-orm';

/**
 * Document types that can be validated
 */
export enum DocumentType {
  INVOICE = 'invoice',
  PURCHASE_INVOICE = 'purchase_invoice',
  BANK_STATEMENT = 'bank_statement',
  CASH_RECEIPT = 'cash_receipt',
  EXPENSE_REPORT = 'expense_report',
  CREDIT_NOTE = 'credit_note',
  DEBIT_NOTE = 'debit_note',
  PAYROLL = 'payroll'
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  success: boolean;
  message: string;
  ledgerEntryId?: string;
  errors?: string[];
}

/**
 * Service for validating documents and generating accounting notes
 */
export class ValidateDocumentService {
  private journalService: JournalService;
  private salesJournalService: SalesJournalService;
  
  /**
   * Constructor
   */
  constructor() {
    this.journalService = new JournalService();
    this.salesJournalService = new SalesJournalService();
  }
  
  /**
   * Validate a document and generate accounting note (Note Contabil)
   * @param documentType Type of document to validate
   * @param documentId Document ID
   * @param userId User ID performing the validation
   * @returns Validation result
   */
  public async validateDocument(
    documentType: DocumentType,
    documentId: string,
    userId: string
  ): Promise<ValidationResult> {
    if (!documentType) {
      return { 
        success: false, 
        message: 'Document type is required'
      };
    }
    
    if (!documentId) {
      return {
        success: false,
        message: 'Document ID is required'
      };
    }
    
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required'
      };
    }
    
    // Get document data from the database based on document type
    const documentData = await this.getDocumentData(documentType, documentId);
    
    if (!documentData) {
      return {
        success: false,
        message: `Document with ID ${documentId} not found`
      };
    }
    
    // Check if document is already validated
    if (documentData.isValidated) {
      return {
        success: false,
        message: `Document is already validated`
      };
    }
    
    // Validate document based on its type
    switch (documentType) {
      case DocumentType.INVOICE:
        return await this.validateSalesInvoice(documentData, userId);
      
      case DocumentType.PURCHASE_INVOICE:
        // TODO: Implement purchase invoice validation
        return {
          success: false,
          message: 'Purchase invoice validation not implemented yet'
        };
      
      case DocumentType.BANK_STATEMENT:
        // TODO: Implement bank statement validation
        return {
          success: false,
          message: 'Bank statement validation not implemented yet'
        };
      
      case DocumentType.CASH_RECEIPT:
        // TODO: Implement cash receipt validation
        return {
          success: false,
          message: 'Cash receipt validation not implemented yet'
        };
      
      case DocumentType.CREDIT_NOTE:
        // TODO: Implement credit note validation
        return {
          success: false,
          message: 'Credit note validation not implemented yet'
        };
      
      default:
        return {
          success: false,
          message: `Validation for document type ${documentType} not implemented`
        };
    }
  }
  
  /**
   * Get document data from the database
   * @param documentType Document type
   * @param documentId Document ID
   * @returns Document data or null if not found
   */
  private async getDocumentData(documentType: DocumentType, documentId: string): Promise<any> {
    const drizzleService = new DrizzleService();
    
    try {
      // Get document data based on type
      switch (documentType) {
        case DocumentType.INVOICE:
          // Get invoice with items, customer, and company
          const invoiceData = await drizzleService.query(async (db: any) => {
            // Assuming the database schema and relations are properly set up
            const invoice = await db.query.invoices.findFirst({
              where: (fields: any, ops: { eq: any }) => ops.eq(fields.id, documentId),
              with: {
                items: true,
                customer: true,
                company: true
              }
            });
            
            return invoice;
          });
          
          return invoiceData;
        
        case DocumentType.PURCHASE_INVOICE:
          // Get purchase invoice data
          // TODO: Implement purchase invoice retrieval
          return null;
        
        // Add more cases for other document types
        
        default:
          return null;
      }
    } catch (error) {
      console.error(`[ValidateDocumentService] Error getting document data:`, error instanceof Error ? error.message : String(error));
      
      return null;
    }
  }
  
  /**
   * Validate a sales invoice
   * @param invoiceData Invoice data
   * @param userId User ID performing the validation
   * @returns Validation result
   */
  private async validateSalesInvoice(invoiceData: any, userId: string): Promise<ValidationResult> {
    // First, validate the invoice structure
    const validation = this.salesJournalService.validateSalesInvoice(invoiceData);
    
    if (!validation.valid) {
      return {
        success: false,
        message: 'Invoice validation failed',
        errors: validation.errors
      };
    }
    
    try {
      // Calculate totals
      const totalNet = invoiceData.items.reduce((sum: number, item: any) => sum + Number(item.netAmount), 0);
      const totalVat = invoiceData.items.reduce((sum: number, item: any) => sum + Number(item.vatAmount), 0);
      const totalGross = invoiceData.items.reduce((sum: number, item: any) => sum + Number(item.grossAmount), 0);
      
      // Create ledger entry through sales journal service
      const ledgerEntryData = await this.salesJournalService.createSalesInvoiceEntry({
        companyId: invoiceData.companyId,
        franchiseId: invoiceData.franchiseId,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceId: invoiceData.id,
        customerId: invoiceData.customerId,
        customerName: invoiceData.customer?.name || 'Unknown Customer',
        amount: Number(totalGross),
        netAmount: Number(totalNet),
        vatAmount: Number(totalVat),
        vatRate: Number(invoiceData.vatRate),
        currency: invoiceData.currency,
        exchangeRate: Number(invoiceData.exchangeRate) || 1,
        issueDate: new Date(invoiceData.issueDate),
        dueDate: new Date(invoiceData.dueDate),
        description: `Sales invoice ${invoiceData.invoiceNumber} to ${invoiceData.customer?.name || 'customer'}`,
        userId
      });
      
      // Update invoice validation status
      const now = new Date();
      const drizzleService = new DrizzleService();
      
      await drizzleService.query(async (db: any) => {
        await db.update(invoiceData.constructor.table) // This assumes the ORM model has a 'table' property
          .set({
            isValidated: true,
            validatedAt: now.toISOString(),
            validatedBy: userId,
            ledgerEntryId: ledgerEntryData.id,
            updatedAt: now.toISOString()
          })
          .where((fields: any, ops: { eq: any }) => ops.eq(fields.id, invoiceData.id));
      });
      
      // Log audit event
      await AuditService.log({
        userId,
        companyId: invoiceData.companyId,
        franchiseId: invoiceData.franchiseId,
        action: AuditAction.VALIDATE,
        entity: 'invoice',
        entityId: invoiceData.id,
        details: {
          invoiceNumber: invoiceData.invoiceNumber,
          ledgerEntryId: ledgerEntryData.id,
          amount: totalGross,
          currency: invoiceData.currency
        }
      });
      
      return {
        success: true,
        message: 'Invoice validated successfully',
        ledgerEntryId: ledgerEntryData.id
      };
    } catch (error) {
      console.error('[ValidateDocumentService] Error validating sales invoice:', error instanceof Error ? error.message : String(error));
      
      return {
        success: false,
        message: `Error validating invoice: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Devalidate a document
   * @param documentType Document type
   * @param documentId Document ID
   * @param userId User ID performing the devalidation
   * @param reason Reason for devalidation
   * @returns Devalidation result
   */
  public async devalidateDocument(
    documentType: DocumentType,
    documentId: string,
    userId: string,
    reason: string
  ): Promise<ValidationResult> {
    if (!documentType) {
      return { 
        success: false, 
        message: 'Document type is required'
      };
    }
    
    if (!documentId) {
      return {
        success: false,
        message: 'Document ID is required'
      };
    }
    
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required'
      };
    }
    
    if (!reason || reason.trim() === '') {
      return {
        success: false,
        message: 'Devalidation reason is required'
      };
    }
    
    // Get document data from the database based on document type
    const documentData = await this.getDocumentData(documentType, documentId);
    
    if (!documentData) {
      return {
        success: false,
        message: `Document with ID ${documentId} not found`
      };
    }
    
    // Check if document is validated
    if (!documentData.isValidated) {
      return {
        success: false,
        message: `Document is not validated`
      };
    }
    
    // Check if there's a ledger entry to revert
    if (!documentData.ledgerEntryId) {
      return {
        success: false,
        message: `Document does not have a linked ledger entry`
      };
    }
    
    try {
      // Reverse the ledger entry
      await this.journalService.reverseLedgerEntry(
        documentData.ledgerEntryId, 
        `Reversed due to document devalidation: ${reason}`,
        userId // Add missing userId parameter
      );
      
      // Update document validation status
      const now = new Date();
      const drizzleService = new DrizzleService();
      
      await drizzleService.query(async (db: any) => {
        await db.update(documentData.constructor.table) // This assumes the ORM model has a 'table' property
          .set({
            isValidated: false,
            validatedAt: null,
            validatedBy: null,
            ledgerEntryId: null,
            updatedAt: now.toISOString()
          })
          .where((fields: any, ops: { eq: any }) => ops.eq(fields.id, documentId));
      });
      
      // Log audit event
      await AuditService.log({
        userId,
        companyId: documentData.companyId,
        franchiseId: documentData.franchiseId,
        action: AuditAction.DEVALIDATE,
        entity: documentType,
        entityId: documentId,
        details: {
          documentNumber: documentData.invoiceNumber || documentData.number || documentData.reference,
          reason,
          reversedLedgerEntryId: documentData.ledgerEntryId
        }
      });
      
      return {
        success: true,
        message: 'Document devalidated successfully'
      };
    } catch (error) {
      console.error('[ValidateDocumentService] Error devalidating document:', error instanceof Error ? error.message : String(error));
      
      return {
        success: false,
        message: `Error devalidating document: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export default ValidateDocumentService;