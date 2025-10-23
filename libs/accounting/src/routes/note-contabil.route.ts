/**
 * Note Contabil Routes
 * 
 * These routes handle the generation and management of Romanian accounting notes (Notă Contabilă).
 * All routes have proper rate limiting applied
 * Migrated to BullMQ for heavy operations with Redis caching
 */

import express from 'express';
import { AuthGuard } from '../../../auth/src/guards/auth.guard';
import { JwtAuthMode } from '../../../auth/src/constants/auth-mode.enum';
import { UserRole } from '../../../auth/src/types';
import NoteContabilService from '../services/note-contabil.service';
import { DocumentType } from '../services/validate-document';
import AuditService, { AuditAction } from '../../../audit/src/services/audit.service';
import { 
  accountingReadRateLimiter,
  exportRateLimiter,
  accountingHeavyRateLimiter
} from '../../../../apps/api/src/middlewares/rate-limit.middleware';
import { accountingQueueService } from '../services/accounting-queue.service';

const router = express.Router();
const noteContabilService = new NoteContabilService();

/**
 * Get all Note Contabil for a company
 * GET /api/accounting/note-contabil
 */
router.get(
  '/',
  accountingReadRateLimiter,
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
    try {
      // Use companyId from authenticated user (from JWT token)
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'User does not have an associated company'
        });
      }
      
      // Get all Note Contabil for user's company
      const notes = await noteContabilService.getNotesByCompany(companyId);
      
      return res.status(200).json({
        success: true,
        data: notes
      });
    } catch (error) {
      console.error('[NoteContabilRoute] Error fetching Note Contabil list:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);
/**
 * Generate a Note Contabil ASYNC (via BullMQ)
 * POST /api/accounting/note-contabil/generate/async
 * Returns job ID for status tracking
 */
router.post(
  '/generate/async',
  accountingHeavyRateLimiter,
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
          !req.user.roles!.includes(UserRole.ADMIN)) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to access this company data'
        });
      }
      
      // Queue job
      const job = await accountingQueueService.queueGenerateNoteContabil({
        companyId,
        documentType,
        documentId,
        userId: req.user!.id
      });
      
      // Log audit event
      await AuditService.log({
        userId: req.user!.id,
        companyId,
        action: AuditAction.CREATE,
        entity: 'note_contabil_job',
        entityId: job.id,
        details: {
          jobId: job.id,
          documentType,
          documentId
        }
      });
      
      return res.status(202).json({
        success: true,
        jobId: job.id,
        message: 'Note Contabil generation queued. Use jobId to check status.',
        statusUrl: `/api/accounting/jobs/${job.id}/status`
      });
    } catch (error) {
      console.error('[NoteContabilRoute] Error queuing Note Contabil generation:', error instanceof Error ? error.message : String(error));
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
      // Only ADMIN can access other companies' data
      if (req.user && req.user.companyId !== companyId && 
          !req.user.roles!.includes(UserRole.ADMIN)) {
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
  accountingReadRateLimiter,
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
      // Only ADMIN can access other companies' data
      if (req.user && req.user.companyId !== companyId && 
          !req.user.roles!.includes(UserRole.ADMIN)) {
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
 * Generate Note Contabil PDF ASYNC (via BullMQ)
 * GET /api/accounting/note-contabil/:id/pdf/async
 * Returns job ID for status tracking
 */
router.get(
  '/:id/pdf/async',
  exportRateLimiter,
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
          !req.user.roles!.includes(UserRole.ADMIN)) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to access this company data'
        });
      }
      
      // Check cache first
      const { RedisService } = await import('../../../services/redis.service');
      const redisService = new RedisService();
      await redisService.connect();
      
      const cacheKey = `acc:note-pdf:${id}`;
      if (redisService.isConnected()) {
        const cachedPdf = await redisService.getCached<string>(cacheKey);
        if (cachedPdf) {
          // Return cached PDF
          const pdfBuffer = Buffer.from(cachedPdf, 'base64');
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="note_contabil_${id}.pdf"`);
          return res.send(pdfBuffer);
        }
      }
      
      // Queue job for PDF generation
      const job = await accountingQueueService.queueGenerateNotePdf({
        companyId: companyId as string,
        noteId: id,
        userId: req.user!.id
      });
      
      // Log audit event
      await AuditService.log({
        userId: req.user!.id,
        companyId: companyId as string,
        action: AuditAction.CREATE,
        entity: 'note_pdf_job',
        entityId: job.id,
        details: {
          jobId: job.id,
          noteId: id
        }
      });
      
      return res.status(202).json({
        success: true,
        jobId: job.id,
        message: 'PDF generation queued. Use jobId to check status.',
        statusUrl: `/api/accounting/jobs/${job.id}/status`
      });
    } catch (error) {
      console.error('[NoteContabilRoute] Error queuing PDF generation:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

export default router;