/**
 * Note Contabil Service
 * 
 * This service handles the generation and management of Romanian accounting notes
 * (Note Contabile) that are the core document for recording financial transactions
 * in the Romanian accounting system. Each note is a double-entry accounting document
 * that must balance (total debits = total credits).
 */

import { v4 as uuidv4 } from 'uuid';
import { DrizzleService } from '../../../common/drizzle';
import { AuditService } from '../../audit/services/audit.service';
import { Service } from '../../../../shared/types';

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
  constructor(
    private drizzleService: DrizzleService,
    private auditService: AuditService
  ) {}

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
   * 
   * @param noteId Note ID
   * @param companyId Company ID
   * @param userId User ID requesting the note
   * @returns The accounting note
   */
  async getNoteById(noteId: string, companyId: string, userId: string): Promise<any> {
    try {
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
    } catch (error) {
      console.error('Error getting accounting note:', error);
      throw error;
    }
  }

  /**
   * Get all accounting notes for a company
   * 
   * @param companyId Company ID
   * @returns Array of accounting notes
   */
  async getNotesByCompany(companyId: string): Promise<any[]> {
    try {
      // In a real implementation, we would fetch all notes from the database
      // For now, we return an empty array since the database tables don't exist yet
      
      // This would be the actual implementation:
      // return await this.drizzleService.executeQuery(async (db) => {
      //   return await db.select().from(accountingNotes)
      //     .where(eq(accountingNotes.companyId, companyId))
      //     .orderBy(desc(accountingNotes.date));
      // });
      
      return [];
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
}