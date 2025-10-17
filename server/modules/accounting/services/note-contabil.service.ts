/**
 * Note Contabil Service
 * 
 * This service handles the generation and management of Romanian accounting notes
 * (Note Contabile) that are the core document for recording financial transactions
 * in the Romanian accounting system. Each note is a double-entry accounting document
 * that must balance (total debits = total credits).
 */

import { v4 as uuidv4 } from 'uuid';
import { DrizzleService, getDrizzle } from '../../../common/drizzle';
import { eq, desc, sum } from 'drizzle-orm';
import { ledgerEntries, ledgerLines } from '../../../../shared/schema';
import { AuditService } from '../../audit/services/audit.service';
import { Service } from '../../../../shared/types';
import { RedisService } from '../../../services/redis.service';

interface AccountEntry {
  accountCode: string;
  debit: number;
  credit: number;
  description: string;
  costCenter?: string;
  projectCode?: string;
}

interface NoteContabilData {
  id?: string;
  number?: string;
  date: Date;
  description: string;
  entries: AccountEntry[];
  documentId?: string;
  documentType?: string;
  companyId: string;
  userId: string;
  currencyCode?: string;
  exchangeRate?: number;
  validated?: boolean;
}

interface ValidationResult {
  valid: boolean;
  message: string;
  errors: string[];
}

@Service()
export default class NoteContabilService {
  private drizzleService?: DrizzleService;
  private auditService?: AuditService;
  
  constructor(drizzleService?: DrizzleService, auditService?: AuditService) {
    this.drizzleService = drizzleService;
    this.auditService = auditService;
  }

  /**
   * Create a new accounting note (Notă Contabilă)
   * 
   * @param noteData Data for the accounting note
   * @returns The created note
   */
  async createNote(noteData: NoteContabilData): Promise<any> {
    try {
      // Validate the note before saving
      const validation = this.validateNote(noteData);
      if (!validation.valid) {
        throw new Error(`Invalid accounting note: ${validation.message}\n${validation.errors.join('\n')}`);
      }

      // Generate a UUID if not provided
      const noteId = noteData.id || uuidv4();
      
      // Generate a sequential number if not provided
      const noteNumber = noteData.number || await this.generateNoteNumber(noteData.companyId);
      
      // Prepare note data
      const note = {
        id: noteId,
        number: noteNumber,
        date: new Date(noteData.date),
        description: noteData.description,
        companyId: noteData.companyId,
        documentId: noteData.documentId || null,
        documentType: noteData.documentType || null,
        currencyCode: noteData.currencyCode || 'RON',
        exchangeRate: noteData.exchangeRate || 1,
        validated: noteData.validated || false,
        createdAt: new Date(),
        createdBy: noteData.userId,
      };

      // Log audit event
      await AuditService.log({
        userId: noteData.userId,
        companyId: noteData.companyId,
        action: 'create',
        entity: 'accounting_note',
        entityId: noteId,
        details: {
          entityType: 'ACCOUNTING_DOCUMENT',
          noteNumber,
          description: noteData.description,
          date: noteData.date,
          entriesCount: noteData.entries.length
        }
      });

      // In a real implementation, we would save the note and its entries to the database
      // For now, we just return the created note object
      return {
        ...note,
        entries: noteData.entries,
      };
    } catch (error) {
      console.error('Error creating accounting note:', error);
      throw error;
    }
  }

  /**
   * Validate an accounting note according to Romanian accounting rules
   * 
   * @param noteData Note data to validate
   * @returns Validation result
   */
  validateNote(noteData: NoteContabilData): ValidationResult {
    const errors: string[] = [];
    
    // Check required fields
    if (!noteData.date) {
      errors.push('Date is required');
    }
    
    if (!noteData.description || noteData.description.trim() === '') {
      errors.push('Description is required');
    }
    
    if (!noteData.entries || noteData.entries.length === 0) {
      errors.push('At least one accounting entry is required');
    }
    
    if (!noteData.companyId) {
      errors.push('Company ID is required');
    }
    
    if (!noteData.userId) {
      errors.push('User ID is required');
    }

    // Check accounting entries
    if (noteData.entries && noteData.entries.length > 0) {
      // Check each entry
      noteData.entries.forEach((entry, index) => {
        if (!entry.accountCode) {
          errors.push(`Entry ${index + 1}: Account code is required`);
        }
        
        if (typeof entry.debit !== 'number' && typeof entry.credit !== 'number') {
          errors.push(`Entry ${index + 1}: Either debit or credit must be specified`);
        }
        
        if (typeof entry.debit === 'number' && typeof entry.credit === 'number' && entry.debit > 0 && entry.credit > 0) {
          errors.push(`Entry ${index + 1}: An entry cannot have both debit and credit values`);
        }
      });
      
      // Calculate totals
      const totalDebit = noteData.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
      const totalCredit = noteData.entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
      
      // Check if debits equal credits (accounting equation must balance)
      if (Math.abs(totalDebit - totalCredit) > 0.001) { // Allow for small floating point differences
        errors.push(`Accounting equation does not balance: total debit (${totalDebit}) ≠ total credit (${totalCredit})`);
      }
    }

    return {
      valid: errors.length === 0,
      message: errors.length > 0 ? 'Validation failed' : 'Note is valid',
      errors
    };
  }

  /**
   * Generate a sequential note number
   * 
   * @param companyId Company ID
   * @returns Generated note number
   */
  async generateNoteNumber(companyId: string): Promise<string> {
    // In a real implementation, we would get the last note number for the company
    // and increment it. For now, we just generate a dummy number.
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    
    // In a real implementation, we would get the last sequential number from the database
    // For demonstration purposes, we use a random number
    const sequentialNumber = Math.floor(Math.random() * 9000) + 1000;
    
    return `NC-${year}${month}-${sequentialNumber}`;
  }

  /**
   * Get an accounting note by ID
   * Enhanced with Redis caching (TTL: 10 minutes)
   * 
   * @param noteId Note ID
   * @param companyId Company ID
   * @param userId User ID requesting the note
   * @returns The accounting note
   */
  async getNoteById(noteId: string, companyId: string, userId: string): Promise<any> {
    try {
      // Check cache first
      const redisService = new RedisService();
      await redisService.connect();
      
      const cacheKey = `acc:note-contabil:${noteId}`;
      
      if (redisService.isConnected()) {
        const cached = await redisService.getCached<any>(cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      // In a real implementation, we would fetch the note from the database
      // For now, we just return a dummy note
      
      // Log audit event
      await AuditService.log({
        userId: userId,
        companyId: companyId,
        action: 'view',
        entity: 'accounting_note',
        entityId: noteId,
        details: {
          entityType: 'ACCOUNTING_DOCUMENT',
          action: 'view',
          noteId
        }
      });
      
      const note = {
        id: noteId,
        number: 'NC-202504-1234',
        date: new Date(),
        description: 'Sample accounting note',
        companyId,
        documentId: null,
        documentType: null,
        currencyCode: 'RON',
        exchangeRate: 1,
        validated: false,
        createdAt: new Date(),
        createdBy: userId,
        entries: [
          {
            accountCode: '411',
            debit: 1000,
            credit: 0,
            description: 'Client invoice'
          },
          {
            accountCode: '4111',
            debit: 0,
            credit: 1000,
            description: 'Client invoice'
          }
        ]
      };
      
      // Cache for 10 minutes
      if (redisService.isConnected()) {
        await redisService.setCached(cacheKey, note, 600);
      }
      
      return note;
    } catch (error) {
      console.error('Error getting accounting note:', error);
      throw error;
    }
  }

  /**
   * Get all accounting notes for a company
   * Uses journal_entries table adapted for Romanian Accounting Standards
   * Enhanced with Redis caching (TTL: 5 minutes)
   * 
   * @param companyId Company ID
   * @returns Array of accounting notes (journal entries)
   */
  async getNotesByCompany(companyId: string): Promise<any[]> {
    try {
      // Check cache first
      const redisService = new RedisService();
      await redisService.connect();
      
      const cacheKey = `acc:note-contabil:company:${companyId}`;
      
      if (redisService.isConnected()) {
        const cached = await redisService.getCached<any[]>(cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      // Query direct din PostgreSQL ledger_entries folosind Drizzle ORM
      const db = getDrizzle();
      
      // Query folosind Drizzle ORM cu relații
      const entries = await db
        .select()
        .from(ledgerEntries)
        .where(eq(ledgerEntries.companyId, companyId))
        .orderBy(desc(ledgerEntries.createdAt));
      
      // Transform to Note Contabilă format
      const notes = entries.map((entry: any) => ({
        id: entry.id,
        number: entry.reference_number || 'N/A',
        date: entry.created_at,
        description: entry.description,
        totalAmount: Number(entry.amount) || Number(entry.total_debit) || 0,
        status: 'approved', // Ledger entries sunt automat aprobate
        createdBy: entry.created_by,
        createdAt: entry.created_at,
        approvedBy: entry.created_by,
        approvedAt: entry.created_at,
        source: entry.type,
        documentType: entry.type,
        documentId: entry.id,
        validated: true,
        currencyCode: 'RON',
        exchangeRate: 1.0,
      }));
      
      // Cache for 5 minutes
      if (redisService.isConnected()) {
        await redisService.setCached(cacheKey, notes, 300);
      }
      
      return notes;
    } catch (error) {
      console.error('Error getting accounting notes:', error);
      throw error;
    }
  }

  /**
   * Validate and mark an accounting note (mark it as validated)
   * 
   * @param noteId Note ID
   * @param companyId Company ID
   * @param userId User ID performing the validation
   * @returns The validated note
   */
  async validateAndMarkNote(noteId: string, companyId: string, userId: string): Promise<any> {
    try {
      // In a real implementation, we would update the note in the database
      // For now, we just return a dummy validated note
      
      // Log audit event
      await AuditService.log({
        userId: userId,
        companyId: companyId,
        action: 'validate',
        entity: 'accounting_note',
        entityId: noteId,
        details: {
          entityType: 'ACCOUNTING_DOCUMENT',
          action: 'validate',
          noteId,
          validatedAt: new Date()
        }
      });
      
      return {
        id: noteId,
        number: 'NC-202504-1234',
        date: new Date(),
        description: 'Sample accounting note',
        companyId,
        documentId: null,
        documentType: null,
        currencyCode: 'RON',
        exchangeRate: 1,
        validated: true,
        validatedAt: new Date(),
        validatedBy: userId,
        createdAt: new Date(),
        createdBy: userId,
        entries: [
          {
            accountCode: '411',
            debit: 1000,
            credit: 0,
            description: 'Client invoice'
          },
          {
            accountCode: '4111',
            debit: 0,
            credit: 1000,
            description: 'Client invoice'
          }
        ]
      };
    } catch (error) {
      console.error('Error validating accounting note:', error);
      throw error;
    }
  }

  /**
   * Generate REAL accounting note from a source document
   * Uses actual business logic from SalesJournalService, PurchaseJournalService, etc.
   * 
   * @param documentId - UUID of the source document
   * @param documentType - Type: 'sales_invoice', 'purchase_invoice', 'nir', 'receipt', etc.
   * @param companyId - Company UUID
   * @param userId - User performing the action
   * @returns Generated ledger entry with accounting lines
   */
  async generateNoteFromDocument(
    documentId: string, 
    documentType: string, 
    companyId: string, 
    userId: string
  ): Promise<any> {
    try {
      // Use DrizzleService to access invoicing queries (same pattern as ValidateInvoiceService)
      const drizzleService = new DrizzleService();
      
      // Import services and helpers dynamically to avoid circular dependencies
      const { SalesJournalService } = await import('./sales-journal.service');
      const { InvoiceService } = await import('../../invoicing/services/invoice.service');
      
      // Generate accounting entries based on document type
      let ledgerEntry;
      
      switch (documentType.toLowerCase()) {
        case 'sales_invoice':
        case 'invoice':
        case 'factura_vanzare':
          // Fetch invoice data from DB using InvoiceService (REAL production code)
          // InvoiceService.getInvoiceById returns any type with dynamic properties
          const invoice: any = await InvoiceService.getInvoiceById(documentId, companyId);
          
          if (!invoice) {
            throw new Error(`Invoice ${documentId} not found in database`);
          }
          
          if (!invoice.lines || invoice.lines.length === 0) {
            throw new Error(`Invoice ${documentId} has no line items`);
          }
          
          // Calculate totals from REAL invoice lines (InvoiceService adds invoice.lines dynamically)
          const totalNet = invoice.lines.reduce((sum: number, line: any) => {
            return sum + Number(line.netAmount || line.net_amount || 0);
          }, 0);
          const totalVat = invoice.lines.reduce((sum: number, line: any) => {
            return sum + Number(line.vatAmount || line.vat_amount || 0);
          }, 0);
          const totalGross = totalNet + totalVat;
          
          // Use REAL SalesJournalService to create accounting entry
          const salesJournal = new SalesJournalService();
          ledgerEntry = await salesJournal.createSalesInvoiceEntry({
            companyId: companyId,
            invoiceNumber: invoice.invoiceNumber || invoice.invoice_number,
            invoiceId: documentId,
            customerId: invoice.customerId || invoice.customer_id,
            customerName: invoice.customer_name || (invoice.details?.partner_name as string) || 'Unknown Customer',
            amount: totalGross,
            netAmount: totalNet,
            vatAmount: totalVat,
            vatRate: Number(invoice.vat_rate || 19),
            currency: invoice.currency || 'RON',
            exchangeRate: Number(invoice.exchangeRate || 1),
            issueDate: invoice.issueDate ? new Date(invoice.issueDate) : new Date(),
            dueDate: invoice.dueDate ? new Date(invoice.dueDate) : new Date(),
            description: `Sales invoice ${invoice.invoiceNumber || invoice.invoice_number} to ${invoice.customer_name || 'customer'}`,
            userId: userId
          });
          break;
          
        case 'purchase_invoice':
        case 'factura_cumparare':
          // TODO: Implement using PurchaseJournalService when available
          throw new Error('Purchase invoice accounting generation not yet implemented. Need to create PurchaseJournalService.');
          
        case 'nir':
        case 'receipt':
          // TODO: Implement using inventory services
          throw new Error('NIR/Receipt accounting generation not yet implemented. Need to integrate with inventory module.');
          
        default:
          throw new Error(`Unsupported document type: ${documentType}. Supported types: sales_invoice, purchase_invoice, nir, receipt.`);
      }
      
      // Log audit event with REAL data
      await AuditService.log({
        userId: userId,
        companyId: companyId,
        action: 'generate_accounting_note',
        entity: 'ledger_entry',
        entityId: ledgerEntry.id,
        details: {
          documentId,
          documentType,
          ledgerEntryId: ledgerEntry.id,
          journalNumber: ledgerEntry.journalNumber,
          amount: ledgerEntry.amount,
          generatedAt: new Date()
        }
      });
      
      return ledgerEntry;
      
    } catch (error) {
      console.error('❌ Error generating REAL accounting note from document:', error);
      throw error;
    }
  }

  /**
   * Approve an accounting note
   * Alias for validateAndMarkNote for better API semantics
   */
  async approveNote(noteId: string, companyId: string, userId: string): Promise<any> {
    return this.validateAndMarkNote(noteId, companyId, userId);
  }

  /**
   * Generate Note Contabil from document
   * Alias for generateNoteFromDocument for API consistency
   */
  async generateNoteContabil(
    documentType: string,
    documentId: string,
    companyId: string,
    userId: string
  ): Promise<{ success: boolean; data?: any; errors?: string[] }> {
    try {
      const result = await this.generateNoteFromDocument(documentId, documentType, companyId, userId);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Error generating Note Contabil:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Get Note Contabil by ID
   * Alias for getNoteById for API consistency
   */
  async getNoteContabilById(noteId: string, companyId: string): Promise<any> {
    return this.getNoteById(noteId, companyId, 'system');
  }

  /**
   * Reverse (storno) an accounting note
   * Creates a reversal entry by swapping debit and credit amounts
   */
  async reverseNoteContabil(noteId: string, userId: string): Promise<boolean> {
    try {
      const { JournalService } = await import('./journal.service');
      const journalService = new JournalService();
      
      // Use JournalService to reverse the ledger entry associated with this note
      // The noteId could be the ledger entry ID or we need to find it
      await journalService.reverseLedgerEntry(
        noteId,
        'Manual reversal via Note Contabil',
        userId
      );
      
      return true;
    } catch (error) {
      console.error('❌ Error reversing Note Contabil:', error);
      return false;
    }
  }

  /**
   * Generate PDF for Note Contabil
   * Creates a formatted PDF document for the accounting note
   */
  async generateNoteContabilPdf(noteId: string, companyId: string): Promise<Buffer | null> {
    try {
      // Import PDFKit dynamically
      const PDFDocument = require('pdfkit');
      
      // Get the note data
      const note = await this.getNoteById(noteId, companyId, 'system');
      if (!note) {
        throw new Error('Note Contabil not found');
      }
      
      // Create PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      
      // Collect PDF data
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      
      // Generate PDF content
      doc.fontSize(20).text('NOTĂ CONTABILĂ', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Nr. ${note.number || note.id}`);
      doc.text(`Data: ${note.date ? new Date(note.date).toLocaleDateString('ro-RO') : 'N/A'}`);
      doc.moveDown();
      doc.text(`Descriere: ${note.description || 'N/A'}`);
      doc.moveDown();
      
      if (note.entries && Array.isArray(note.entries)) {
        doc.fontSize(14).text('Înregistrări contabile:', { underline: true });
        doc.moveDown();
        doc.fontSize(10);
        
        note.entries.forEach((entry: any, index: number) => {
          doc.text(`${index + 1}. Cont: ${entry.accountCode || entry.accountId || 'N/A'}`);
          doc.text(`   Debit: ${Number(entry.debitAmount || 0).toFixed(2)} RON`);
          doc.text(`   Credit: ${Number(entry.creditAmount || 0).toFixed(2)} RON`);
          doc.text(`   Descriere: ${entry.description || 'N/A'}`);
          doc.moveDown(0.5);
        });
      }
      
      // Finalize PDF
      doc.end();
      
      // Return PDF as buffer
      return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
      });
    } catch (error) {
      console.error('❌ Error generating Note Contabil PDF:', error);
      return null;
    }
  }

  /**
   * ========================================================================
   * NIR-SPECIFIC ACCOUNTING METHODS (moved from nota-contabila.service.ts)
   * ========================================================================
   * 
   * These methods handle specialized accounting for NIR (Notă Intrare Recepție)
   * documents, primarily for inventory/warehouse operations.
   */

  /**
   * Create accounting note for NIR type Warehouse/Deposit
   * 
   * Standard accounting entry for NIR Depozit:
   * - Debit: 371.x (Goods) - value without VAT
   * - Debit: 4426.x (Deductible VAT) - VAT value
   * - Credit: 401 (Suppliers) - total value with VAT
   */
  async createNirDepozitNotaContabila(
    nirId: string,
    nirNumber: string,
    companyId: string,
    supplierId: string,
    warehouseId: string,
    valueNoVat: number,
    vatValue: number,
    totalValue: number,
    date: Date,
    currency: string = 'RON',
    exchangeRate: number = 1
  ): Promise<string> {
    try {
      const { getClient } = await import('../../../common/drizzle');
      const sql = getClient();
      
      // Get warehouse account suffix
      const warehouseResult = await sql`SELECT code FROM warehouses WHERE id = ${warehouseId}`;
      if (!warehouseResult || warehouseResult.length === 0) {
        throw new Error(`Warehouse with ID ${warehouseId} not found`);
      }
      
      const warehouseCode = warehouseResult[0].code;
      const warehouseParts = warehouseCode.split('.');
      if (warehouseParts.length !== 2) {
        throw new Error(`Warehouse code ${warehouseCode} does not have expected format (xxx.y)`);
      }
      const warehouseSuffix = warehouseParts[1];
      
      // Get supplier name
      const supplierResult = await sql`SELECT name FROM companies WHERE id = ${supplierId}`;
      const supplierName = supplierResult && supplierResult.length > 0 
        ? supplierResult[0].name 
        : 'Unknown Supplier';
      
      // Create accounting entries using the general createNote method
      const noteData = {
        date,
        description: `Accounting note for NIR ${nirNumber} - goods receipt from ${supplierName}`,
        entries: [
          {
            accountCode: `371.${warehouseSuffix}`,
            debit: valueNoVat,
            credit: 0,
            description: `Goods receipt per NIR ${nirNumber} from ${supplierName}`
          },
          {
            accountCode: `4426.${warehouseSuffix}`,
            debit: vatValue,
            credit: 0,
            description: `VAT for NIR ${nirNumber} from ${supplierName}`
          },
          {
            accountCode: '401',
            debit: 0,
            credit: totalValue,
            description: `Payable to supplier ${supplierName} for NIR ${nirNumber}`
          }
        ],
        documentId: nirId,
        documentType: 'NIR',
        companyId,
        userId: 'system',
        currencyCode: currency,
        exchangeRate
      };
      
      const result = await this.createNote(noteData);
      return result.id;
    } catch (error) {
      console.error('❌ Error creating NIR warehouse accounting note:', error);
      throw error;
    }
  }
}