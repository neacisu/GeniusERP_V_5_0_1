/**
 * Accounting Attachments Service
 * 
 * Serviciu pentru gestionarea atașamentelor la notele contabile
 * Implementează stocarea documentelor justificative conform OMFP 2634/2015
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { AuditLogService } from './audit-log.service';

/**
 * Interface pentru atașament
 */
interface AccountingAttachment {
  id: string;
  ledgerEntryId: string;
  companyId: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  attachmentType: AttachmentType;
  uploadedBy: string;
  uploadedAt: Date;
  isActive: boolean;
}

/**
 * Tipuri de atașamente
 */
type AttachmentType = 
  | 'supporting_document'   // Document justificativ
  | 'calculation_note'     // Notă de calcul
  | 'approval_document'    // Document de aprobare
  | 'correction_note'      // Notă de corecție
  | 'other';              // Altele

/**
 * Request pentru upload atașament
 */
interface UploadAttachmentRequest {
  ledgerEntryId: string;
  companyId: string;
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
  description?: string;
  attachmentType: AttachmentType;
  userId: string;
}

/**
 * Serviciu pentru atașamente note contabile
 */
export class AccountingAttachmentsService extends DrizzleService {
  private auditService: AuditLogService;
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'accounting-attachments');
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain'
  ];

  constructor() {
    super();
    this.auditService = new AuditLogService();
    this.ensureUploadDirectory();
  }

  /**
   * Upload atașament pentru o notă contabilă
   */
  async uploadAttachment(request: UploadAttachmentRequest): Promise<AccountingAttachment> {
    // Validări
    this.validateFile(request.file);

    // Verifică dacă nota contabilă există
    await this.validateLedgerEntry(request.ledgerEntryId, request.companyId);

    // Generează numele unic pentru fișier
    const fileExtension = path.extname(request.file.originalname);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.UPLOAD_DIR, uniqueFileName);

    try {
      // Salvează fișierul pe disc
      await fs.promises.writeFile(filePath, request.file.buffer);

      // Creează înregistrarea în baza de date
      const attachment: AccountingAttachment = {
        id: uuidv4(),
        ledgerEntryId: request.ledgerEntryId,
        companyId: request.companyId,
        fileName: uniqueFileName,
        originalFileName: request.file.originalname,
        filePath,
        fileSize: request.file.size,
        mimeType: request.file.mimetype,
        description: request.description,
        attachmentType: request.attachmentType,
        uploadedBy: request.userId,
        uploadedAt: new Date(),
        isActive: true
      };

      // TODO: Salvează în baza de date când va fi implementat schema
      // Pentru moment doar simulez salvarea
      console.log(`💾 Atașament salvat (simulat): ${attachment.originalFileName}`);

      // Log audit
      await this.auditService.log({
        companyId: request.companyId,
        userId: request.userId,
        action: 'ATTACHMENT_UPLOADED' as any,
        severity: 'INFO' as any,
        entityType: 'accounting_attachments',
        entityId: attachment.id,
        description: `Atașament încărcat: ${request.file.originalname}`,
        metadata: {
          ledgerEntryId: request.ledgerEntryId,
          fileName: request.file.originalname,
          fileSize: request.file.size,
          attachmentType: request.attachmentType
        }
      });

      console.log(`✅ Atașament încărcat cu succes: ${attachment.originalFileName}`);

      return attachment;

    } catch (error) {
      // Șterge fișierul dacă s-a creat dar a eșuat salvarea în BD
      try {
        await fs.promises.unlink(filePath);
      } catch (unlinkError) {
        console.warn('Nu s-a putut șterge fișierul temporar:', unlinkError);
      }

      console.error('❌ Eroare la încărcarea atașamentului:', error);
      throw new Error(`Nu s-a putut încărca atașamentul: ${error}`);
    }
  }

  /**
   * Obține atașamentele pentru o notă contabilă
   */
  async getAttachmentsForEntry(ledgerEntryId: string, companyId: string): Promise<AccountingAttachment[]> {
    // TODO: Implementează query în baza de date
    // Pentru moment returnez date simulate
    
    const simulatedAttachments: AccountingAttachment[] = [
      {
        id: 'att_1',
        ledgerEntryId,
        companyId,
        fileName: 'sample_invoice.pdf',
        originalFileName: 'Factura_furnizor_123.pdf',
        filePath: path.join(this.UPLOAD_DIR, 'sample_invoice.pdf'),
        fileSize: 245760,
        mimeType: 'application/pdf',
        description: 'Factură justificativă pentru cheltuielile înregistrate',
        attachmentType: 'supporting_document',
        uploadedBy: 'user123',
        uploadedAt: new Date(),
        isActive: true
      }
    ];

    return simulatedAttachments;
  }

  /**
   * Descarcă un atașament
   */
  async downloadAttachment(
    attachmentId: string,
    companyId: string,
    userId: string
  ): Promise<{ filePath: string; fileName: string; mimeType: string }> {
    // TODO: Obține atașamentul din baza de date
    // Pentru moment simulez
    
    const attachment = {
      id: attachmentId,
      companyId,
      filePath: path.join(this.UPLOAD_DIR, 'sample_invoice.pdf'),
      originalFileName: 'Factura_furnizor_123.pdf',
      mimeType: 'application/pdf'
    };

    // Verifică dacă fișierul există fizic
    if (!fs.existsSync(attachment.filePath)) {
      throw new Error('Fișierul atașat nu a fost găsit pe disc');
    }

    // Log audit pentru descărcare
    await this.auditService.log({
      companyId,
      userId,
      action: 'ATTACHMENT_DOWNLOADED' as any,
      severity: 'INFO' as any,
      entityType: 'accounting_attachments',
      entityId: attachmentId,
      description: `Atașament descărcat: ${attachment.originalFileName}`,
      metadata: {
        fileName: attachment.originalFileName
      }
    });

    return {
      filePath: attachment.filePath,
      fileName: attachment.originalFileName,
      mimeType: attachment.mimeType
    };
  }

  /**
   * Șterge un atașament
   */
  async deleteAttachment(
    attachmentId: string,
    companyId: string,
    userId: string,
    reason: string
  ): Promise<void> {
    // TODO: Obține atașamentul din baza de date
    const attachment = {
      id: attachmentId,
      companyId,
      filePath: path.join(this.UPLOAD_DIR, 'sample_file.pdf'),
      originalFileName: 'sample_file.pdf'
    };

    try {
      // Marchează ca șters în baza de date (soft delete)
      // TODO: UPDATE accounting_attachments SET is_active = false WHERE id = ...

      // Șterge fișierul fizic (opțional, depinde de politica companiei)
      if (fs.existsSync(attachment.filePath)) {
        await fs.promises.unlink(attachment.filePath);
      }

      // Log audit
      await this.auditService.log({
        companyId,
        userId,
        action: 'ATTACHMENT_DELETED' as any,
        severity: 'WARNING' as any,
        entityType: 'accounting_attachments',
        entityId: attachmentId,
        description: `Atașament șters: ${attachment.originalFileName} - Motiv: ${reason}`,
        metadata: {
          reason,
          fileName: attachment.originalFileName
        }
      });

      console.log(`✅ Atașament șters: ${attachment.originalFileName}`);

    } catch (error) {
      console.error('❌ Eroare la ștergerea atașamentului:', error);
      throw new Error(`Nu s-a putut șterge atașamentul: ${error}`);
    }
  }

  /**
   * Validează fișierul înainte de upload
   */
  private validateFile(file: UploadAttachmentRequest['file']): void {
    // Verifică dimensiunea
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`Fișierul este prea mare. Dimensiunea maximă este ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Verifică tipul MIME
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error(`Tipul de fișier ${file.mimetype} nu este permis`);
    }

    // Verifică extensia fișierului
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`Extensia ${fileExtension} nu este permisă`);
    }

    // Verifică că numele fișierului nu conține caractere periculoase
    if (/[<>:"/\\|?*]/.test(file.originalname)) {
      throw new Error('Numele fișierului conține caractere interzise');
    }
  }

  /**
   * Validează că nota contabilă există și aparține companiei
   */
  private async validateLedgerEntry(ledgerEntryId: string, companyId: string): Promise<void> {
    // TODO: Implementează verificarea în baza de date
    // Pentru moment doar simulez validarea
    
    if (!ledgerEntryId || !companyId) {
      throw new Error('ID-ul notei contabile și al companiei sunt obligatorii');
    }

    // Simulare verificare - în realitate ar trebui să fie query în BD
    console.log(`✓ Validare nota contabilă ${ledgerEntryId} pentru compania ${companyId}`);
  }

  /**
   * Asigură că directorul de upload există
   */
  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
      console.log(`📁 Director creat pentru atașamente: ${this.UPLOAD_DIR}`);
    }
  }

  /**
   * Obține informații sumare despre atașamente
   */
  async getAttachmentsSummary(companyId: string): Promise<{
    totalAttachments: number;
    totalSize: number;
    byType: Record<AttachmentType, number>;
  }> {
    // TODO: Implementează query agregat în baza de date
    
    return {
      totalAttachments: 0,
      totalSize: 0,
      byType: {
        supporting_document: 0,
        calculation_note: 0,
        approval_document: 0,
        correction_note: 0,
        other: 0
      }
    };
  }

  /**
   * Curățare fișiere orfane (fără înregistrări în BD)
   */
  async cleanupOrphanedFiles(): Promise<number> {
    try {
      const files = await fs.promises.readdir(this.UPLOAD_DIR);
      const deletedCount = 0;

      for (const fileName of files) {
        const filePath = path.join(this.UPLOAD_DIR, fileName);
        
        // TODO: Verifică dacă fișierul există în baza de date
        // Pentru moment skip cleanup-ul
        console.log(`🔍 Verificare fișier: ${fileName}`);
      }

      console.log(`🧹 Cleanup completat: ${deletedCount} fișiere șterse`);
      return deletedCount;

    } catch (error) {
      console.error('❌ Eroare la cleanup fișiere:', error);
      return 0;
    }
  }
}

export default AccountingAttachmentsService;
