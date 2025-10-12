/**
 * Note Contabil Routes
 * 
 * These routes handle the generation and management of Romanian accounting notes (Notă Contabilă).
 */

import express from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { UserRole } from '../../auth/types';
import NoteContabilService from '../services/note-contabil.service';
import { DocumentType } from '../services/validate-document';
import AuditService, { AuditAction } from '../../audit/services/audit.service';

const router = express.Router();
const noteContabilService = new NoteContabilService();

/**
 * Generate a Note Contabil for a document
 * POST /api/accounting/note-contabil/generate
 */
router.post(
  '/generate',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ADMIN, UserRole.ACCOUNTANT]),
  async (req, res) => {
    try {
      const { documentType, documentId, companyId } = req.body;
      
      if (!documentType || !documentId || !companyId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: documentType, documentId, companyId'
        });
      }
      
      // Check if document type is valid
      if (!Object.values(DocumentType).includes(documentType as DocumentType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid document type. Valid types are: ${Object.values(DocumentType).join(', ')}`
        });
      }
      
      // Check if user has access to this company
      if (req.user && req.user.companyId !== companyId && 
          !req.user.roles!.includes(UserRole.ADMIN) && 
          !req.user.roles!.some(role => role === UserRole.ADMIN)) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to access this company data'
        });
      }
      
      // Generate Note Contabil
      const result = await noteContabilService.generateNoteContabil(
        documentType as DocumentType,
        documentId,
        companyId,
        req.user!.id
      );
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          errors: result.errors
        });
      }
      
      // Log audit event for successful generation
      await AuditService.log({
        userId: req.user!.id,
        companyId,
        action: AuditAction.CREATE,
        entity: 'note_contabil',
        entityId: result.data?.id || documentId,
        details: {
          documentType,
          documentId,
          noteContabilData: result.data
        }
      });
      
      return res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('[NoteContabilRoute] Error generating Note Contabil:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Reverse a Note Contabil
 * POST /api/accounting/note-contabil/:id/reverse
 */
router.post(
  '/:id/reverse',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ADMIN, UserRole.ACCOUNTANT]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { companyId } = req.body;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: companyId'
        });
      }
      
      // Check if user has access to this company
      if (req.user && req.user.companyId !== companyId && 
          !req.user.roles!.includes(UserRole.ADMIN) &&
          !req.user.roles!.some(role => role === UserRole.ADMIN)) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to access this company data'
        });
      }
      
      // Get Note Contabil to verify it exists
      const noteContabil = await noteContabilService.getNoteContabilById(id, companyId);
      if (!noteContabil) {
        return res.status(404).json({
          success: false,
          error: 'Note Contabil not found'
        });
      }
      
      // Reverse Note Contabil
      const success = await noteContabilService.reverseNoteContabil(id, req.user!.id);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          error: 'Failed to reverse Note Contabil'
        });
      }
      
      // Log audit event for successful reversal
      await AuditService.log({
        userId: req.user!.id,
        companyId,
        action: 'DEVALIDATE',
        entity: 'note_contabil',
        entityId: id,
        details: {
          documentType: noteContabil.documentType,
          documentId: noteContabil.documentId,
          noteContabilNumber: noteContabil.number
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Note Contabil reversed successfully'
      });
    } catch (error) {
      console.error('[NoteContabilRoute] Error reversing Note Contabil:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Get Note Contabil by ID
 * GET /api/accounting/note-contabil/:id
 */
router.get(
  '/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { companyId } = req.query;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required query parameter: companyId'
        });
      }
      
      // Check if user has access to this company
      if (req.user && req.user.companyId !== companyId && 
          !req.user.roles!.includes(UserRole.ADMIN) &&
          !req.user.roles!.some(role => role === UserRole.ADMIN)) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to access this company data'
        });
      }
      
      // Get Note Contabil
      const noteContabil = await noteContabilService.getNoteContabilById(id, companyId as string);
      
      if (!noteContabil) {
        return res.status(404).json({
          success: false,
          error: 'Note Contabil not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        noteContabil
      });
    } catch (error) {
      console.error('[NoteContabilRoute] Error fetching Note Contabil:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Get Note Contabil PDF
 * GET /api/accounting/note-contabil/:id/pdf
 */
router.get(
  '/:id/pdf',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { companyId } = req.query;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required query parameter: companyId'
        });
      }
      
      // Check if user has access to this company
      if (req.user && req.user.companyId !== companyId && 
          !req.user.roles!.includes(UserRole.ADMIN) &&
          !req.user.roles!.some(role => role === UserRole.ADMIN)) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to access this company data'
        });
      }
      
      // Get Note Contabil to verify it exists
      const noteContabil = await noteContabilService.getNoteContabilById(id, companyId as string);
      
      if (!noteContabil) {
        return res.status(404).json({
          success: false,
          error: 'Note Contabil not found'
        });
      }
      
      // Generate PDF
      const pdfBuffer = await noteContabilService.generateNoteContabilPdf(id, companyId as string);
      
      if (!pdfBuffer) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate PDF'
        });
      }
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="note_contabil_${noteContabil.number}.pdf"`);
      
      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error('[NoteContabilRoute] Error generating Note Contabil PDF:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

export default router;