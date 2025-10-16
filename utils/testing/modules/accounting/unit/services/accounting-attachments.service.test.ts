/**
 * Unit Tests: AccountingAttachmentsService
 * 
 * Testează serviciul pentru gestionarea atașamentelor la notele contabile
 * - Upload atașamente (cu validări)
 * - Download atașamente
 * - Delete atașamente (soft delete)
 * - Validări: dimensiune, tip MIME, extensii permise
 * - Audit logging
 */

import fs from 'fs';
import path from 'path';
import AccountingAttachmentsService from '../../../../../../server/modules/accounting/services/accounting-attachments.service';
import { AuditLogService } from '../../../../../../server/modules/accounting/services/audit-log.service';

// Mock fs
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    writeFile: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn()
  },
  existsSync: jest.fn(),
  mkdirSync: jest.fn()
}));

// Mock AuditLogService
jest.mock('../../../../../../server/modules/accounting/services/audit-log.service');

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123')
}));

describe('AccountingAttachmentsService', () => {
  let service: AccountingAttachmentsService;
  let mockAuditService: jest.Mocked<AuditLogService>;

  const mockFile = {
    buffer: Buffer.from('mock file content'),
    originalname: 'test-invoice.pdf',
    mimetype: 'application/pdf',
    size: 1024 * 100 // 100KB
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);

    mockAuditService = new AuditLogService() as jest.Mocked<AuditLogService>;
    mockAuditService.log = jest.fn().mockResolvedValue(undefined);

    service = new AccountingAttachmentsService();
    (service as any).auditService = mockAuditService;
  });

  describe('uploadAttachment', () => {
    it('should successfully upload a valid PDF attachment', async () => {
      const request = {
        ledgerEntryId: 'ledger-1',
        companyId: 'company-1',
        file: mockFile,
        description: 'Factura justificativă',
        attachmentType: 'supporting_document' as const,
        userId: 'user-1'
      };

      const result = await service.uploadAttachment(request);

      expect(result).toMatchObject({
        id: 'mock-uuid-123',
        ledgerEntryId: 'ledger-1',
        companyId: 'company-1',
        originalFileName: 'test-invoice.pdf',
        fileSize: mockFile.size,
        mimeType: 'application/pdf',
        description: 'Factura justificativă',
        attachmentType: 'supporting_document',
        uploadedBy: 'user-1',
        isActive: true
      });

      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('mock-uuid-123.pdf'),
        mockFile.buffer
      );

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'company-1',
          userId: 'user-1',
          action: 'ATTACHMENT_UPLOADED',
          entityType: 'accounting_attachments',
          entityId: 'mock-uuid-123'
        })
      );
    });

    it('should reject file that exceeds max size', async () => {
      const largeFile = {
        ...mockFile,
        size: 11 * 1024 * 1024 // 11MB (exceeds 10MB limit)
      };

      const request = {
        ledgerEntryId: 'ledger-1',
        companyId: 'company-1',
        file: largeFile,
        attachmentType: 'supporting_document' as const,
        userId: 'user-1'
      };

      await expect(service.uploadAttachment(request)).rejects.toThrow(
        'Fișierul este prea mare'
      );

      expect(fs.promises.writeFile).not.toHaveBeenCalled();
    });

    it('should reject file with invalid MIME type', async () => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'application/x-executable',
        originalname: 'virus.exe'
      };

      const request = {
        ledgerEntryId: 'ledger-1',
        companyId: 'company-1',
        file: invalidFile,
        attachmentType: 'supporting_document' as const,
        userId: 'user-1'
      };

      await expect(service.uploadAttachment(request)).rejects.toThrow(
        'nu este permis'
      );

      expect(fs.promises.writeFile).not.toHaveBeenCalled();
    });

    it('should reject file with invalid extension', async () => {
      const invalidFile = {
        ...mockFile,
        originalname: 'script.sh',
        mimetype: 'text/plain'
      };

      const request = {
        ledgerEntryId: 'ledger-1',
        companyId: 'company-1',
        file: invalidFile,
        attachmentType: 'supporting_document' as const,
        userId: 'user-1'
      };

      await expect(service.uploadAttachment(request)).rejects.toThrow(
        'nu este permisă'
      );

      expect(fs.promises.writeFile).not.toHaveBeenCalled();
    });

    it('should reject file with dangerous characters in name', async () => {
      const dangerousFile = {
        ...mockFile,
        originalname: '../../../etc/passwd.txt'
      };

      const request = {
        ledgerEntryId: 'ledger-1',
        companyId: 'company-1',
        file: dangerousFile,
        attachmentType: 'supporting_document' as const,
        userId: 'user-1'
      };

      await expect(service.uploadAttachment(request)).rejects.toThrow(
        'caractere interzise'
      );

      expect(fs.promises.writeFile).not.toHaveBeenCalled();
    });

    it('should clean up file if database save fails', async () => {
      (fs.promises.writeFile as jest.Mock).mockRejectedValue(
        new Error('Disk full')
      );

      const request = {
        ledgerEntryId: 'ledger-1',
        companyId: 'company-1',
        file: mockFile,
        attachmentType: 'supporting_document' as const,
        userId: 'user-1'
      };

      await expect(service.uploadAttachment(request)).rejects.toThrow(
        'Nu s-a putut încărca atașamentul'
      );

      expect(fs.promises.unlink).toHaveBeenCalled();
    });

    it('should accept all allowed file types', async () => {
      const allowedFiles = [
        { name: 'doc.pdf', mime: 'application/pdf' },
        { name: 'image.jpg', mime: 'image/jpeg' },
        { name: 'photo.png', mime: 'image/png' },
        { name: 'doc.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
        { name: 'sheet.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        { name: 'text.txt', mime: 'text/plain' }
      ];

      for (const file of allowedFiles) {
        jest.clearAllMocks();

        const request = {
          ledgerEntryId: 'ledger-1',
          companyId: 'company-1',
          file: {
            ...mockFile,
            originalname: file.name,
            mimetype: file.mime
          },
          attachmentType: 'supporting_document' as const,
          userId: 'user-1'
        };

        await expect(service.uploadAttachment(request)).resolves.toBeDefined();
        expect(fs.promises.writeFile).toHaveBeenCalled();
      }
    });
  });

  describe('getAttachmentsForEntry', () => {
    it('should return attachments for a ledger entry', async () => {
      const result = await service.getAttachmentsForEntry('ledger-1', 'company-1');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toMatchObject({
        ledgerEntryId: 'ledger-1',
        companyId: 'company-1',
        isActive: true
      });
    });
  });

  describe('downloadAttachment', () => {
    it('should download an existing attachment', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.downloadAttachment(
        'att-1',
        'company-1',
        'user-1'
      );

      expect(result).toMatchObject({
        filePath: expect.any(String),
        fileName: expect.any(String),
        mimeType: 'application/pdf'
      });

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ATTACHMENT_DOWNLOADED',
          entityType: 'accounting_attachments',
          entityId: 'att-1'
        })
      );
    });

    it('should throw error if file does not exist on disk', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        service.downloadAttachment('att-1', 'company-1', 'user-1')
      ).rejects.toThrow('nu a fost găsit pe disc');

      expect(mockAuditService.log).not.toHaveBeenCalled();
    });
  });

  describe('deleteAttachment', () => {
    it('should delete an attachment with audit trail', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await service.deleteAttachment(
        'att-1',
        'company-1',
        'user-1',
        'Document incorect'
      );

      expect(fs.promises.unlink).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ATTACHMENT_DELETED',
          severity: 'WARNING',
          entityType: 'accounting_attachments',
          entityId: 'att-1',
          description: expect.stringContaining('Document incorect')
        })
      );
    });

    it('should handle errors during deletion', async () => {
      (fs.promises.unlink as jest.Mock).mockRejectedValue(
        new Error('Permission denied')
      );

      await expect(
        service.deleteAttachment('att-1', 'company-1', 'user-1', 'Test')
      ).rejects.toThrow('Nu s-a putut șterge atașamentul');
    });

    it('should not throw if file already deleted from disk', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        service.deleteAttachment('att-1', 'company-1', 'user-1', 'Already deleted')
      ).resolves.not.toThrow();

      expect(fs.promises.unlink).not.toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });

  describe('getAttachmentsSummary', () => {
    it('should return summary statistics', async () => {
      const result = await service.getAttachmentsSummary('company-1');

      expect(result).toMatchObject({
        totalAttachments: expect.any(Number),
        totalSize: expect.any(Number),
        byType: {
          supporting_document: expect.any(Number),
          calculation_note: expect.any(Number),
          approval_document: expect.any(Number),
          correction_note: expect.any(Number),
          other: expect.any(Number)
        }
      });
    });
  });

  describe('cleanupOrphanedFiles', () => {
    it('should clean up orphaned files', async () => {
      (fs.promises.readdir as jest.Mock).mockResolvedValue([
        'file1.pdf',
        'file2.jpg',
        'file3.docx'
      ]);

      const result = await service.cleanupOrphanedFiles();

      expect(fs.promises.readdir).toHaveBeenCalled();
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should handle errors during cleanup', async () => {
      (fs.promises.readdir as jest.Mock).mockRejectedValue(
        new Error('Directory not accessible')
      );

      const result = await service.cleanupOrphanedFiles();

      expect(result).toBe(0);
    });
  });

  describe('Directory Initialization', () => {
    it('should create upload directory if it does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Re-initialize service
      const newService = new AccountingAttachmentsService();

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('accounting-attachments'),
        { recursive: true }
      );
    });

    it('should not create directory if it already exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      jest.clearAllMocks();

      // Re-initialize service
      const newService = new AccountingAttachmentsService();

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('File Validation Edge Cases', () => {
    it('should validate empty file names', async () => {
      const request = {
        ledgerEntryId: 'ledger-1',
        companyId: 'company-1',
        file: {
          ...mockFile,
          originalname: '',
          size: 1024
        },
        attachmentType: 'supporting_document' as const,
        userId: 'user-1'
      };

      await expect(service.uploadAttachment(request)).rejects.toThrow();
    });

    it('should handle zero-byte files', async () => {
      const request = {
        ledgerEntryId: 'ledger-1',
        companyId: 'company-1',
        file: {
          ...mockFile,
          size: 0
        },
        attachmentType: 'supporting_document' as const,
        userId: 'user-1'
      };

      // Zero-byte files should be allowed (no size validation for minimum)
      await expect(service.uploadAttachment(request)).resolves.toBeDefined();
    });
  });

  describe('Attachment Types', () => {
    it('should accept all valid attachment types', async () => {
      const types: Array<'supporting_document' | 'calculation_note' | 'approval_document' | 'correction_note' | 'other'> = [
        'supporting_document',
        'calculation_note',
        'approval_document',
        'correction_note',
        'other'
      ];

      for (const type of types) {
        jest.clearAllMocks();

        const request = {
          ledgerEntryId: 'ledger-1',
          companyId: 'company-1',
          file: mockFile,
          attachmentType: type,
          userId: 'user-1'
        };

        const result = await service.uploadAttachment(request);
        expect(result.attachmentType).toBe(type);
      }
    });
  });
});

