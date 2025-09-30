import { Router } from "express";
import { JournalService } from "../services/journal.service";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { JwtAuthMode } from "../../auth/constants/auth-mode.enum";
import { AuthenticatedRequest } from "../../../common/middleware/auth-types";
import { Response } from "express";
import { JournalController } from "../controllers/journal.controller";

/**
 * Setup ledger routes for direct transaction recording and management
 */
export function setupLedgerRoutes() {
  const router = Router();
  const journalService = new JournalService();
  const journalController = new JournalController(journalService);
  
  // Apply authentication middleware to all ledger routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
  
  /**
   * Record a new transaction
   * POST /api/accounting/ledger/transactions
   */
  router.post("/transactions", (req: AuthenticatedRequest, res: Response) => {
    journalController.recordTransaction(req, res);
  });
  
  /**
   * Get transaction details
   * GET /api/accounting/ledger/transactions/:id
   */
  router.get("/transactions/:id", (req: AuthenticatedRequest, res: Response) => {
    journalController.getTransaction(req, res);
  });
  
  /**
   * Get all ledger entries (with optional filtering)
   * GET /api/accounting/ledger/entries
   */
  router.get("/entries", (req: AuthenticatedRequest, res: Response) => {
    // Simple response for now - will be implemented fully later
    res.json([]);
  });
  
  /**
   * Create a ledger entry
   * POST /api/accounting/ledger/entry
   */
  router.post("/entry", (req: AuthenticatedRequest, res: Response) => {
    journalController.createLedgerEntry(req, res);
  });
  
  /**
   * Alias for creating ledger entry (to maintain backward compatibility)
   * POST /api/accounting/ledger/entries
   */
  router.post("/entries", (req: AuthenticatedRequest, res: Response) => {
    journalController.createLedgerEntry(req, res);
  });
  
  /**
   * Reverse a ledger entry
   * POST /api/accounting/ledger/entries/:id/reverse
   */
  router.post("/entries/:id/reverse", (req: AuthenticatedRequest, res: Response) => {
    journalController.reverseLedgerEntry(req, res);
  });
  
  return router;
}