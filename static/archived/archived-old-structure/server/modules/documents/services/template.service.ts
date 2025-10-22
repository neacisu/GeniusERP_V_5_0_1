/**
 * Template Service
 * 
 * Provides capabilities for managing document templates used for
 * generating various ERP documents like invoices, contracts, orders, etc.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc, and, asc, sql, like } from 'drizzle-orm';
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import * as schema from '../../../../shared/schema';
import { documents, documentVersions } from '../../../../shared/schema';
import { documentService } from './document.service';

/**
 * Template types supported by the system
 */
export enum TemplateType {
  INVOICE = 'INVOICE_TEMPLATE',
  CONTRACT = 'CONTRACT_TEMPLATE',
  ORDER = 'ORDER_TEMPLATE',
  REPORT = 'REPORT_TEMPLATE',
  RECEIPT = 'RECEIPT_TEMPLATE',
  CUSTOM = 'CUSTOM_TEMPLATE',
}

/**
 * Template Service for document template management
 */
export class TemplateService {
  private db: ReturnType<typeof drizzle>;
  private queryClient: ReturnType<typeof postgres>;

  constructor() {
    const connectionString = process.env.DATABASE_URL as string;
    
    if (!connectionString) {
      console.error('[TemplateService] 🚨 Missing DATABASE_URL in environment');
      throw new Error('Database connection string is missing');
    }

    this.queryClient = postgres(connectionString);
    this.db = drizzle(this.queryClient, { schema });
    
    console.log('[TemplateService] 📑 Template service initialized');
  }

  /**
   * Create a new document template
   */
  async createTemplate(params: {
    name: string;
    type: TemplateType;
    content: string;
    companyId: string;
  }) {
    const { name, type, content, companyId } = params;
    
    try {
      console.log(`[TemplateService] 📝 Creating new ${type} template: ${name}`);
      
      // Use the document service to create a document with versioning
      const { document, version } = await documentService.createDocument(
        {
          companyId,
          filePath: `/templates/${type.toLowerCase()}/${name.toLowerCase().replace(/\s+/g, '-')}.html`,
          type,
          ocrText: `Template: ${name} - ${type}`
        },
        content
      );
      
      console.log(`[TemplateService] ✅ Created template document: ${document.id}`);
      
      return {
        id: document.id,
        name,
        type,
        filePath: document.filePath,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        version: version.version
      };
    } catch (error: any) {
      console.error(`[TemplateService] ❌ Failed to create template: ${error.message}`);
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }
  
  /**
   * Update an existing template (creates a new version)
   */
  async updateTemplate(id: string, content: string) {
    try {
      console.log(`[TemplateService] 📝 Updating template ${id}`);
      
      // Add a new version to the document
      const newVersion = await documentService.addDocumentVersion(id, content);
      
      // Update the document's updatedAt timestamp
      await this.db.update(documents)
        .set({
          updatedAt: new Date()
        })
        .where(eq(documents.id, id));
      
      console.log(`[TemplateService] ✅ Template updated with version ${newVersion.version}`);
      
      return newVersion;
    } catch (error: any) {
      console.error(`[TemplateService] ❌ Failed to update template: ${error.message}`);
      throw new Error(`Failed to update template: ${error.message}`);
    }
  }
  
  /**
   * Get a template by ID
   */
  async getTemplate(id: string) {
    try {
      console.log(`[TemplateService] 🔍 Getting template ${id}`);
      
      // Use the document service to get the document with its latest version
      const document = await documentService.getDocumentById(id);
      
      return document;
    } catch (error: any) {
      console.error(`[TemplateService] ❌ Failed to get template: ${error.message}`);
      throw new Error(`Failed to get template: ${error.message}`);
    }
  }
  
  /**
   * List templates by type for a company
   */
  async listTemplates(companyId: string, type?: TemplateType) {
    try {
      console.log(`[TemplateService] 📋 Listing templates for company ${companyId}`);
      
      // Build conditions for the query
      const conditions = [eq(documents.companyId, companyId)];
      
      // Add type filter if specified
      if (type) {
        conditions.push(eq(documents.type, type));
      } else {
        // If no specific type, only get documents that are templates
        conditions.push(sql`${documents.type} LIKE '%TEMPLATE'`);
      }
      
      // Execute the query with all conditions
      const templates = await this.db.select({
        id: documents.id,
        type: documents.type,
        filePath: documents.filePath,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt
      })
      .from(documents)
      .where(and(...conditions))
      .orderBy(desc(documents.updatedAt));
      
      console.log(`[TemplateService] ✅ Found ${templates.length} templates`);
      
      return templates;
    } catch (error: any) {
      console.error(`[TemplateService] ❌ Failed to list templates: ${error.message}`);
      throw new Error(`Failed to list templates: ${error.message}`);
    }
  }
  
  /**
   * Generate a document from a template
   */
  async generateFromTemplate(params: {
    templateId: string;
    data: Record<string, any>;
    outputType: string;
    companyId: string;
  }) {
    const { templateId, data, outputType, companyId } = params;
    
    try {
      console.log(`[TemplateService] 🔄 Generating document from template ${templateId}`);
      
      // Get the template content
      const template = await this.getTemplate(templateId);
      
      if (!template.versions || template.versions.length === 0) {
        throw new Error('Template has no content versions');
      }
      
      // Get the latest version
      const latestVersion = template.versions[0];
      let content = latestVersion.content;
      
      // Simple variable substitution (in a real system, we would use a template engine)
      Object.entries(data).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value));
      });
      
      // Create a new document with the generated content
      const { document, version } = await documentService.createDocument(
        {
          companyId,
          filePath: `/generated/${outputType.toLowerCase()}/${uuidv4()}.html`,
          type: outputType,
          ocrText: `Generated from template: ${template.id}`
        },
        content
      );
      
      console.log(`[TemplateService] ✅ Generated document ${document.id} from template`);
      
      return {
        id: document.id,
        type: document.type,
        filePath: document.filePath,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        version: version.version,
        fromTemplate: templateId
      };
    } catch (error: any) {
      console.error(`[TemplateService] ❌ Failed to generate from template: ${error.message}`);
      throw new Error(`Failed to generate from template: ${error.message}`);
    }
  }
}

// Export singleton instance
export const templateService = new TemplateService();