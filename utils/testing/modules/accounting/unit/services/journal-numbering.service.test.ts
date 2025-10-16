/// <reference types="jest" />
/**
 * Unit Tests: JournalNumberingService
 * 
 * Testează serviciul pentru numerotare cronologică note contabile
 * - Generare numere secvențiale
 * - Format correct (SERIES/YEAR/NUMBER)
 * - Thread safety cu database locks
 * - Mapare tipuri jurnal la serii
 */

import JournalNumberingService from '../../../../../../server/modules/accounting/services/journal-numbering.service';
import { LedgerEntryType } from '../../../../../../server/modules/accounting/services/journal.service';
import { getDrizzle } from '../../../../../../server/common/drizzle';

jest.mock('../../../../../../server/common/drizzle');

describe('JournalNumberingService', () => {
  let service: JournalNumberingService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      $client: {
        unsafe: jest.fn()
      }
    };
    (getDrizzle as jest.Mock).mockReturnValue(mockDb);

    service = new JournalNumberingService();
  });

  describe('generateJournalNumber', () => {
    it('should generate sequential journal number for sales', async () => {
      mockDb.$client.unsafe.mockResolvedValue([{ last_number: 123 }]);

      const result = await service.generateJournalNumber(
        'company-1',
        LedgerEntryType.SALES,
        new Date('2025-01-15')
      );

      expect(result).toBe('JV/2025/00123');
      expect(mockDb.$client.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO document_counters'),
        ['company-1', 'JV', 2025]
      );
    });

    it('should pad numbers correctly', async () => {
      mockDb.$client.unsafe.mockResolvedValue([{ last_number: 5 }]);

      const result = await service.generateJournalNumber(
        'company-1',
        LedgerEntryType.PURCHASE,
        new Date('2025-02-01')
      );

      expect(result).toBe('JC/2025/00005');
    });

    it('should handle different journal types', async () => {
      const testCases = [
        { type: LedgerEntryType.SALES, series: 'JV' },
        { type: LedgerEntryType.PURCHASE, series: 'JC' },
        { type: LedgerEntryType.CASH, series: 'JCS' },
        { type: LedgerEntryType.BANK, series: 'JB' },
        { type: LedgerEntryType.GENERAL, series: 'JG' },
        { type: LedgerEntryType.ADJUSTMENT, series: 'JA' },
        { type: LedgerEntryType.REVERSAL, series: 'JR' }
      ];

      for (const testCase of testCases) {
        mockDb.$client.unsafe.mockResolvedValue([{ last_number: 1 }]);

        const result = await service.generateJournalNumber(
          'company-1',
          testCase.type,
          new Date('2025-01-01')
        );

        expect(result).toContain(testCase.series);
        expect(result).toMatch(/^[A-Z]+\/2025\/\d{5}$/);
      }
    });

    it('should handle database errors gracefully with fallback', async () => {
      mockDb.$client.unsafe.mockRejectedValue(new Error('Database error'));

      const result = await service.generateJournalNumber(
        'company-1',
        LedgerEntryType.SALES,
        new Date('2025-01-15')
      );

      expect(result).toMatch(/^JV\/2025\/\d{5}$/);
      expect(result).not.toContain('undefined');
    });

    it('should use correct year from date', async () => {
      mockDb.$client.unsafe.mockResolvedValue([{ last_number: 100 }]);

      const result = await service.generateJournalNumber(
        'company-1',
        LedgerEntryType.GENERAL,
        new Date('2024-12-31')
      );

      expect(result).toContain('/2024/');
    });

    it('should handle large numbers correctly', async () => {
      mockDb.$client.unsafe.mockResolvedValue([{ last_number: 99999 }]);

      const result = await service.generateJournalNumber(
        'company-1',
        LedgerEntryType.SALES,
        new Date('2025-01-01')
      );

      expect(result).toBe('JV/2025/99999');
    });
  });

  describe('getLastJournalNumber', () => {
    it('should return last used number', async () => {
      mockDb.$client.unsafe.mockResolvedValue([{ last_number: 450 }]);

      const result = await service.getLastJournalNumber(
        'company-1',
        LedgerEntryType.PURCHASE,
        2025
      );

      expect(result).toBe(450);
      expect(mockDb.$client.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT last_number FROM document_counters'),
        ['company-1', 'JC', 2025]
      );
    });

    it('should return 0 if no counter exists', async () => {
      mockDb.$client.unsafe.mockResolvedValue([]);

      const result = await service.getLastJournalNumber(
        'company-1',
        LedgerEntryType.SALES,
        2025
      );

      expect(result).toBe(0);
    });

    it('should return 0 on database error', async () => {
      mockDb.$client.unsafe.mockRejectedValue(new Error('Database error'));

      const result = await service.getLastJournalNumber(
        'company-1',
        LedgerEntryType.BANK,
        2025
      );

      expect(result).toBe(0);
    });

    it('should query with correct series for each type', async () => {
      mockDb.$client.unsafe.mockResolvedValue([{ last_number: 100 }]);

      await service.getLastJournalNumber('company-1', LedgerEntryType.CASH, 2025);

      expect(mockDb.$client.unsafe).toHaveBeenCalledWith(
        expect.any(String),
        ['company-1', 'JCS', 2025]
      );
    });
  });

  describe('Journal Series Mapping', () => {
    it('should map all journal types to correct series', () => {
      const types = [
        LedgerEntryType.SALES,
        LedgerEntryType.PURCHASE,
        LedgerEntryType.CASH,
        LedgerEntryType.BANK,
        LedgerEntryType.GENERAL,
        LedgerEntryType.ADJUSTMENT,
        LedgerEntryType.REVERSAL
      ];

      types.forEach(type => {
        mockDb.$client.unsafe.mockResolvedValue([{ last_number: 1 }]);
        expect(
          service.generateJournalNumber('company-1', type, new Date())
        ).resolves.toMatch(/^[A-Z]+\/\d{4}\/\d{5}$/);
      });
    });
  });

  describe('Thread Safety', () => {
    it('should use INSERT ON CONFLICT for atomic increment', async () => {
      mockDb.$client.unsafe.mockResolvedValue([{ last_number: 1 }]);

      await service.generateJournalNumber(
        'company-1',
        LedgerEntryType.SALES,
        new Date()
      );

      expect(mockDb.$client.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT'),
        expect.any(Array)
      );
      expect(mockDb.$client.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('DO UPDATE SET last_number'),
        expect.any(Array)
      );
    });
  });
});

