import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import NoteContabilService from '../services/note-contabil.service';
import { AuthenticatedRequest } from '../../../common/middleware/auth-types';

/**
 * NoteContabilController
 * 
 * Handles Romanian Accounting Note (Notă Contabilă) operations
 */
export class NoteContabilController extends BaseController {
  constructor(private readonly noteContabilService: NoteContabilService) {
    super();
  }
  
  /**
   * Create a new accounting note
   * POST /api/accounting/note-contabil
   */
  async createNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { note, lines } = req.body;
      
      // Add company and user info
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      note.companyId = companyId;
      note.createdBy = userId;
      
      const result = await this.noteContabilService.createNote(note, lines);
      
      return {
        success: true,
        data: result
      };
    });
  }
  
  /**
   * Get accounting notes for a company
   * GET /api/accounting/note-contabil
   */
  async getNotes(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const result = await this.noteContabilService.getNotesByCompany(companyId);
      
      return {
        success: true,
        data: result
      };
    });
  }
  
  /**
   * Get accounting note by ID
   * GET /api/accounting/note-contabil/:id
   */
  async getNoteById(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { id } = req.params;
      const companyId = this.getCompanyId(req);
      
      const note = await this.noteContabilService.getNoteById(id, companyId);
      
      if (!note) {
        throw {
          statusCode: 404,
          message: "Accounting note not found"
        };
      }
      
      return {
        success: true,
        data: note
      };
    });
  }
  
  /**
   * Generate accounting note from a validated document
   * POST /api/accounting/note-contabil/generate
   */
  async generateNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { documentId, documentType } = req.body;
      
      if (!documentId || !documentType) {
        throw {
          statusCode: 400,
          message: "Document ID and document type are required"
        };
      }
      
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      const note = await this.noteContabilService.generateNoteFromDocument(
        documentId,
        documentType,
        companyId,
        userId
      );
      
      return {
        success: true,
        data: note
      };
    });
  }
  
  /**
   * Approve an accounting note
   * POST /api/accounting/note-contabil/:id/approve
   */
  async approveNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { id } = req.params;
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      const note = await this.noteContabilService.approveNote(id, companyId, userId);
      
      return {
        success: true,
        data: note
      };
    });
  }
}