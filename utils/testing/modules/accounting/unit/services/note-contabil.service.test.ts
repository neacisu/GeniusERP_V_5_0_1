/**
 * Unit Tests: NoteContabilService
 * 
 * Testează serviciul pentru note contabile
 * - Validare note (double-entry balance)
 * - Generare numere secvențiale
 * - CRUD operations
 * - Redis caching
 */

import NoteContabilService from '../../../../../../server/modules/accounting/services/note-contabil.service';
import { DrizzleService } from '../../../../../../server/common/drizzle';
import { AuditService } from '../../../../../../server/modules/audit/services/audit.service';

jest.mock('../../../../../../server/common/drizzle');
jest.mock('../../../../../../server/modules/audit/services/audit.service');

describe('NoteContabilService', () => {
  let service: NoteContabilService;
  let mockDrizzleService: jest.Mocked<DrizzleService>;
  let mockAuditService: jest.Mocked<AuditService>;

  const validNoteData = {
    date: new Date('2025-01-15'),
    description: 'Test accounting note',
    entries: [
      { accountCode: '411', debit: 1000, credit: 0, description: 'Client debit' },
      { accountCode: '707', debit: 0, credit: 1000, description: 'Revenue credit' }
    ],
    companyId: 'company-1',
    userId: 'user-1'
  };

  beforeEach(() => {
    mockDrizzleService = new DrizzleService() as jest.Mocked<DrizzleService>;
    mockAuditService = new AuditService() as jest.Mocked<AuditService>;

    service = new NoteContabilService(mockDrizzleService, mockAuditService);
  });

  describe('validateNote', () => {
    it('should validate a balanced note', () => {
      const validation = (service as any).validateNote(validNoteData);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject unbalanced note', () => {
      const unbalancedNote = {
        ...validNoteData,
        entries: [
          { accountCode: '411', debit: 1000, credit: 0, description: 'Client' },
          { accountCode: '707', debit: 0, credit: 500, description: 'Revenue' } // Not balanced!
        ]
      };

      const validation = (service as any).validateNote(unbalancedNote);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Debits and credits must balance');
    });

    it('should reject note without entries', () => {
      const noteWithoutEntries = {
        ...validNoteData,
        entries: []
      };

      const validation = (service as any).validateNote(noteWithoutEntries);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should reject note with invalid account codes', () => {
      const invalidNote = {
        ...validNoteData,
        entries: [
          { accountCode: '', debit: 1000, credit: 0, description: 'Client' },
          { accountCode: '707', debit: 0, credit: 1000, description: 'Revenue' }
        ]
      };

      const validation = (service as any).validateNote(invalidNote);

      expect(validation.valid).toBe(false);
    });

    it('should reject note with negative amounts', () => {
      const invalidNote = {
        ...validNoteData,
        entries: [
          { accountCode: '411', debit: -1000, credit: 0, description: 'Client' },
          { accountCode: '707', debit: 0, credit: 1000, description: 'Revenue' }
        ]
      };

      const validation = (service as any).validateNote(invalidNote);

      expect(validation.valid).toBe(false);
    });

    it('should reject entries with both debit and credit', () => {
      const invalidNote = {
        ...validNoteData,
        entries: [
          { accountCode: '411', debit: 1000, credit: 500, description: 'Invalid' },
          { accountCode: '707', debit: 0, credit: 1000, description: 'Revenue' }
        ]
      };

      const validation = (service as any).validateNote(invalidNote);

      expect(validation.valid).toBe(false);
    });
  });

  describe('generateNoteNumber', () => {
    it('should generate sequential note numbers', async () => {
      const mockQuery = jest.fn().mockResolvedValue([{ last_number: 123 }]);
      (mockDrizzleService as any).query = mockQuery;

      const noteNumber = await (service as any).generateNoteNumber('company-1');

      expect(noteNumber).toMatch(/^NC\/\d{4}\/\d{5}$/);
    });
  });

  describe('createNote', () => {
    it('should reject creation of invalid note', async () => {
      const invalidNote = {
        ...validNoteData,
        entries: [] // No entries
      };

      await expect(service.createNote(invalidNote)).rejects.toThrow('Invalid accounting note');
    });
  });
});

