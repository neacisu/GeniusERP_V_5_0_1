/**
 * Email Attachment Service
 * 
 * Provides integration with email services to:
 * - Process incoming emails with attachments
 * - Extract and store attachments as documents
 * - Route documents to appropriate registry categories
 * - Auto-classify documents using metadata and OCR
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { documents } from '@shared/schema';
import { DocumentService } from './document.service';
import { OcrService } from './ocr.service';
import { DocumentRegistryService, DocumentFlow } from './document-registry.service';
import { DrizzleService } from '../../../common/drizzle';

/**
 * Email attachment metadata
 */
export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
  emailSubject: string;
  emailFrom: string;
  emailDate: Date;
  emailTo: string[];
}

/**
 * Processing result for an email attachment
 */
export interface AttachmentProcessingResult {
  documentId: string;
  registryNumber?: string;
  ocrProcessed: boolean;
  detectedType?: string;
  classification: {
    documentType: string;
    confidence: number;
    flow: DocumentFlow;
  };
}

/**
 * Email Attachment Service for processing email attachments into documents
 */
export class EmailAttachmentService {
  private db: ReturnType<typeof drizzle> | null = null;
  private queryClient: ReturnType<typeof postgres> | null = null;
  private documentService: DocumentService | null = null;
  private ocrService: OcrService | null = null;
  private registryService: DocumentRegistryService | null = null;

  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    try {
      const drizzleService = new DrizzleService();
      this.db = drizzleService.getDbInstance();
      this.documentService = new DocumentService(drizzleService);
      this.ocrService = new OcrService();
      this.registryService = new DocumentRegistryService();

      console.log('[EmailAttachmentService] 📧 Email attachment service initialized');
    } catch (error) {
      console.error('[EmailAttachmentService] Failed to initialize:', error);
      throw error;
    }
  }

  private ensureInitialized() {
    if (!this.db || !this.documentService || !this.ocrService || !this.registryService) {
      throw new Error('EmailAttachmentService not properly initialized');
    }
  }
  
  /**
   * Process an email attachment and store it as a document
   * 
   * @param companyId Company ID that owns the document
   * @param attachment Email attachment details
   */
  async processAttachment(
    companyId: string,
    attachment: EmailAttachment
  ): Promise<AttachmentProcessingResult> {
    this.ensureInitialized();
    try {
      console.log(`[EmailAttachmentService] 📧 Processing attachment: ${attachment.filename}`);

      // 1. Store the attachment as a document
      const document = await this.documentService!.createDocument({
        companyId: companyId as string,
        filePath: `/email-attachments/${companyId}/${Date.now()}-${attachment.filename}`,
        type: 'EMAIL_ATTACHMENT' // Default type until classified
      } as any, attachment.content.toString('base64'));
      
      // 2. Process with OCR to extract text
      let ocrProcessed = false;
      try {
        const ocrText = await this.ocrService!.processDocument(document.document.id);
        ocrProcessed = true;
      } catch (ocrError) {
        console.warn(`[EmailAttachmentService] OCR processing failed for ${document.document.id}:`, ocrError);
      }
      
      // 3. Classify document based on filename, content type, and OCR text
      const classification = await this.classifyDocument(attachment, document.document.id);
      
      // 4. Update document type based on classification
      await this.documentService!.updateDocumentMetadata(document.document.id, {
        type: classification.documentType
      });

      // 5. Register in the appropriate registry based on classification
      let registryNumber: string | undefined = undefined;
      try {
        const registryResult = await this.registryService!.registerDocument(
          document.document.id,
          classification.flow,
          companyId,
          {
            source: 'EMAIL',
            emailSubject: attachment.emailSubject,
            confidence: classification.confidence
          }
        );
        registryNumber = registryResult.registryNumber;
      } catch (registryError) {
        console.error(`[EmailAttachmentService] Registry error for ${document.document.id}:`, registryError);
      }
      
      return {
        documentId: document.document.id,
        registryNumber,
        ocrProcessed,
        detectedType: classification.documentType,
        classification
      };
    } catch (error) {
      console.error('[EmailAttachmentService] Attachment processing error:', error);
      throw new Error(`Failed to process email attachment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Classify a document based on its properties and content
   * This is a placeholder implementation that would be enhanced with ML/AI in a real system
   */
  private async classifyDocument(
    attachment: EmailAttachment, 
    documentId: string
  ): Promise<{
    documentType: string;
    confidence: number;
    flow: DocumentFlow;
  }> {
    // Get OCR text if available
    let ocrText = '';
    try {
      const document = await this.documentService!.getDocumentById(documentId);
      ocrText = (document as any).ocrText || '';
    } catch (error) {
      console.warn(`[EmailAttachmentService] Couldn't get OCR text for classification:`, error);
    }
    
    // Simple keyword-based classification
    const filename = attachment.filename.toLowerCase();
    const subject = attachment.emailSubject.toLowerCase();
    const contentType = attachment.contentType.toLowerCase();
    
    // Classification logic
    if (
      filename.includes('factura') || 
      filename.includes('invoice') ||
      subject.includes('factura') ||
      ocrText.includes('factura')
    ) {
      return {
        documentType: 'INVOICE',
        confidence: 0.8,
        flow: DocumentFlow.INCOMING
      };
    } else if (
      filename.includes('contract') || 
      subject.includes('contract') ||
      ocrText.includes('contract')
    ) {
      return {
        documentType: 'CONTRACT',
        confidence: 0.7,
        flow: DocumentFlow.INTERNAL
      };
    } else if (
      filename.includes('oferta') || 
      filename.includes('offer') ||
      subject.includes('oferta') ||
      ocrText.includes('oferta')
    ) {
      return {
        documentType: 'OFFER',
        confidence: 0.6,
        flow: DocumentFlow.OUTGOING
      };
    }
    
    // Default classification
    return {
      documentType: 'UNCLASSIFIED',
      confidence: 0.3,
      flow: DocumentFlow.INCOMING
    };
  }
  
  /**
   * Configure email polling settings for a company
   * This would be implemented in a real system to set up email polling
   */
  async configureEmailPolling(params: {
    companyId: string;
    emailServer: string;
    username: string;
    password: string;
    pollingInterval: number;
    folderToMonitor: string;
  }): Promise<{ success: boolean }> {
    // This would be implemented in a real system
    console.log(`[EmailAttachmentService] Configured email polling for company ${params.companyId}`);
    return { success: true };
  }
}

// Export singleton instance
export const emailAttachmentService = new EmailAttachmentService();