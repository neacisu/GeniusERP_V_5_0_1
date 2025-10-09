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
   * Get a specific ledger entry with full details
   * GET /api/accounting/ledger/entries/:id
   */
  router.get("/entries/:id", (req, res) => {
    journalController.getLedgerEntry(req as AuthenticatedRequest, res);
  });

  /**
   * Post a ledger entry (mark as final/posted)
   * POST /api/accounting/ledger/entries/:id/post
   * Requires: accountant or admin role
   */
  router.post("/entries/:id/post", 
    AuthGuard.roleGuard(["accountant", "admin"]),
    (req, res) => {
      journalController.postLedgerEntry(req as AuthenticatedRequest, res);
    }
  );

  /**
   * Unpost a ledger entry (revert to draft)
   * POST /api/accounting/ledger/entries/:id/unpost
   * Requires: accountant or admin role
   * Use with caution - should only be allowed in specific scenarios
   */
  router.post("/entries/:id/unpost", 
    AuthGuard.roleGuard(["accountant", "admin"]),
    (req, res) => {
      journalController.unpostLedgerEntry(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Reverse a ledger entry (create stornare)
   * POST /api/accounting/ledger/entries/:id/reverse
   * Requires: accountant or admin role
   * Only posted entries can be reversed
   */
  router.post("/entries/:id/reverse", 
    AuthGuard.roleGuard(["accountant", "admin"]),
    (req, res) => {
      journalController.reverseLedgerEntry(req as AuthenticatedRequest, res);
    }
  );
  
  return router;
}