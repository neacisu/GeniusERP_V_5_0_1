import { Router } from "express";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { JwtAuthMode } from "../../auth/constants/auth-mode.enum";
import { AuthenticatedRequest } from "../../../common/middleware/auth-types";
import { Response } from "express";
import { NoteContabilController } from "../controllers/note-contabil.controller";
import NoteContabilService from "../services/note-contabil.service";

/**
 * Setup note-contabil routes
 */
export function setupNoteContabilRoutes() {
  const router = Router();
  const noteContabilService = new NoteContabilService();
  const noteContabilController = new NoteContabilController(noteContabilService);
  
  // Apply authentication middleware to all routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
  
  /**
   * Create a new accounting note
   * POST /api/accounting/note-contabil
   */
  router.post("/", (req: AuthenticatedRequest, res: Response) => {
    noteContabilController.createNote(req, res);
  });
  
  /**
   * Get all accounting notes for a company
   * GET /api/accounting/note-contabil
   */
  router.get("/", (req: AuthenticatedRequest, res: Response) => {
    noteContabilController.getNotes(req, res);
  });
  
  /**
   * Get an accounting note by ID
   * GET /api/accounting/note-contabil/:id
   */
  router.get("/:id", (req: AuthenticatedRequest, res: Response) => {
    noteContabilController.getNoteById(req, res);
  });
  
  /**
   * Generate accounting note from validated document
   * POST /api/accounting/note-contabil/generate
   */
  router.post("/generate", (req: AuthenticatedRequest, res: Response) => {
    noteContabilController.generateNote(req, res);
  });
  
  /**
   * Approve an accounting note
   * POST /api/accounting/note-contabil/:id/approve
   */
  router.post("/:id/approve", (req: AuthenticatedRequest, res: Response) => {
    noteContabilController.approveNote(req, res);
  });
  
  return router;
}