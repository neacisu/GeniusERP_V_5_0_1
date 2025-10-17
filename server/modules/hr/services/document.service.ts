/**
 * HR Document Service
 * 
 * This service handles document management operations for HR module:
 * - Document upload and storage
 * - Employee document association
 * - Document generation for compliance
 * - Temporary draft storage
 */

import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '../../audit/services/audit.service';
import { AuditAction, AuditResourceType } from '../../../common/enums/audit.enum';
import { eq, sql } from 'drizzle-orm';
import { Logger } from '../../../common/logger';
import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import * as fs from 'fs';
import * as path from 'path';
import { hrDocuments, hrEmployeeDrafts } from '../schema/documents.schema';

export class HrDocumentService {
  private drizzle: DrizzleService;
  private auditService: AuditService;
  private logger = new Logger('HrDocumentService');

  constructor() {
    this.drizzle = new DrizzleService();
    this.auditService = new AuditService();
  }

  /**
   * Save employee draft
   * 
   * @param companyId Company ID
   * @param userData Employee draft data
   * @param userId User ID performing the action
   * @param draftId Optional existing draft ID
   * @returns Saved draft data
   */
  async saveEmployeeDraft(
    companyId: string,
    userData: Record<string, any>,
    userId: string,
    draftId?: string
  ): Promise<Record<string, any>> {
    try {
      this.logger.debug(`Saving employee draft for company ${companyId} by user ${userId}`);
      
      // First check if draft exists if ID provided
      if (draftId) {
        const existingDraft = await this.drizzle.db.select()
          .from(hrEmployeeDrafts)
          .where(eq(hrEmployeeDrafts.id, draftId))
          .limit(1);
        
        if (existingDraft.length > 0) {
          // Update existing draft
          const updated = await this.drizzle.db.update(hrEmployeeDrafts)
            .set({
              userData,
              updatedBy: userId,
              updatedAt: new Date()
            })
            .where(eq(hrEmployeeDrafts.id, draftId))
            .returning();
          
          await this.auditService.logAction({
            action: AuditAction.UPDATE,
            resourceType: AuditResourceType.EMPLOYEE,
            resourceId: draftId,
            details: {
              operation: 'update_draft',
              draftId
            },
            userId
          });
          
          return updated[0];
        }
      }
      
      // If no draft exists or no ID provided, create new draft
      const newDraft = await this.drizzle.db.insert(hrEmployeeDrafts)
        .values({
          id: draftId || uuidv4(),
          companyId,
          userData,
          createdBy: userId,
          updatedBy: userId,
          status: 'draft'
        })
        .returning();
      
      await this.auditService.logAction({
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.EMPLOYEE,
        resourceId: newDraft[0].id,
        details: {
          operation: 'create_draft'
        },
        userId
      });
      
      return newDraft[0];
    } catch (error: any) {
      this.logger.error(`Error saving employee draft: ${(error as Error).message}`, error);
      throw error;
    }
  }
  
  /**
   * Generate compliance documents based on employee data
   * 
   * @param companyId Company ID
   * @param employeeData Employee data for document generation
   * @param userId User ID performing the action
   * @returns Generated documents information
   */
  async generateComplianceDocuments(
    companyId: string,
    employeeData: Record<string, any>,
    userId: string
  ): Promise<Array<{name: string, url: string, type: string}>> {
    try {
      this.logger.debug(`Generating compliance documents for company ${companyId} by user ${userId}`);
      
      // Create documents directory if it doesn't exist
      const documentsDir = './uploads/hr_documents';
      if (!fs.existsSync(documentsDir)) {
        fs.mkdirSync(documentsDir, { recursive: true });
      }

      // List of documents to generate
      const docTypes = [
        { 
          name: 'Fișă GDPR', 
          type: 'gdpr_consent',
          filename: `gdpr_consent_${Date.now()}.txt` 
        },
        { 
          name: 'Fișă protecția muncii', 
          type: 'work_safety',
          filename: `work_safety_${Date.now()}.txt` 
        },
        { 
          name: 'Informare confidențialitate', 
          type: 'confidentiality',
          filename: `confidentiality_${Date.now()}.txt` 
        }
      ];
      
      // Generate document files
      const generatedDocs = await Promise.all(docTypes.map(async doc => {
        const filePath = path.join(documentsDir, doc.filename);
        
        // Write simple content as example
        const content = `Document: ${doc.name}
Angajat: ${employeeData.firstName || ''} ${employeeData.lastName || ''}
CNP: ${employeeData.cnp || ''}
Data: ${new Date().toISOString()}

Acesta este un document generat automat conform cerințelor legale.
Documentul este valabil doar cu semnătură și ștampilă.`;

        fs.writeFileSync(filePath, content);
        
        // Save document metadata in database
        const documentUrl = `/uploads/hr_documents/${doc.filename}`;
        const employeeId = employeeData.id || null;
        
        const savedDoc = await this.drizzle.db.insert(hrDocuments)
          .values({
            companyId,
            employeeId,
            documentType: doc.type,
            documentUrl,
            originalName: doc.filename,
            uploadedBy: userId,
            status: 'active',
            metadata: {
              generated: true,
              documentName: doc.name
            }
          })
          .returning();
        
        return {
          id: savedDoc[0].id,
          name: doc.name,
          type: doc.type,
          url: documentUrl
        };
      }));

      // Log the action
      await this.auditService.logAction({
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.DOCUMENT,
        resourceId: companyId,
        details: {
          operation: 'generate_compliance_documents',
          documentCount: generatedDocs.length
        },
        userId
      });

      return generatedDocs;
    } catch (error: any) {
      this.logger.error(`Error generating compliance documents: ${(error as Error).message}`, error);
      throw error;
    }
  }
  
  /**
   * Save employee document
   * 
   * @param companyId Company ID
   * @param employeeId Employee ID (optional, can be null for drafts)
   * @param documentType Document type
   * @param documentUrl URL to the uploaded document
   * @param originalName Original file name
   * @param userId User ID performing the action
   * @returns Uploaded document information
   */
  async saveEmployeeDocument(
    companyId: string,
    employeeId: string | null,
    documentType: string,
    documentUrl: string,
    originalName: string,
    userId: string
  ): Promise<Record<string, any>> {
    try {
      this.logger.debug(`Saving employee document for company ${companyId}, employee ${employeeId || 'draft'} by user ${userId}`);
      
      // Save document metadata in database
      const savedDoc = await this.drizzle.db.insert(hrDocuments)
        .values({
          companyId,
          employeeId,
          documentType,
          documentUrl,
          originalName,
          uploadedBy: userId,
          status: 'active'
        })
        .returning();

      // Log the action
      await this.auditService.logAction({
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.DOCUMENT,
        resourceId: savedDoc[0].id,
        details: {
          operation: 'upload_document',
          documentType,
          employeeId
        },
        userId
      });

      return savedDoc[0];
    } catch (error: any) {
      this.logger.error(`Error saving employee document: ${(error as Error).message}`, error);
      throw error;
    }
  }
  
  /**
   * Get employee documents
   * 
   * @param employeeId Employee ID
   * @returns List of employee documents
   */
  async getEmployeeDocuments(employeeId: string) {
    try {
      this.logger.debug(`Getting documents for employee ${employeeId}`);
      
      const documents = await this.drizzle.db.select()
        .from(hrDocuments)
        .where(eq(hrDocuments.employeeId, employeeId))
        .orderBy(hrDocuments.uploadedAt);
      
      return documents;
    } catch (error: any) {
      this.logger.error(`Error getting employee documents: ${(error as Error).message}`, error);
      throw error;
    }
  }
}