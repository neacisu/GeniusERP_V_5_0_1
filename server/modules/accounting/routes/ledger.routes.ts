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
  router.post("/transactions", (req, res) => {
    journalController.recordTransaction(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get transaction details
   * GET /api/accounting/ledger/transactions/:id
   */
  router.get("/transactions/:id", (req, res) => {
    journalController.getTransaction(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get all ledger entries (with optional filtering)
   * GET /api/accounting/ledger/entries
   */
  router.get("/entries", (req, res) => {
    journalController.getLedgerEntries(req as AuthenticatedRequest, res);
  });
  
  /**
   * Create a ledger entry
   * POST /api/accounting/ledger/entry
   */
  router.post("/entry", (req, res) => {
    journalController.createLedgerEntry(req as AuthenticatedRequest, res);
  });
  
  /**
   * Alias for creating ledger entry (to maintain backward compatibility)
   * POST /api/accounting/ledger/entries
   */
  router.post("/entries", (req, res) => {
    journalController.createLedgerEntry(req as AuthenticatedRequest, res);
  });
  
  /**
   * Reverse a ledger entry
   * POST /api/accounting/ledger/entries/:id/reverse
   */
  router.post("/entries/:id/reverse", (req, res) => {
    journalController.reverseLedgerEntry(req as AuthenticatedRequest, res);
  });
  
  return router;
}