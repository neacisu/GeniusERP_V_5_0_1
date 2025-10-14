import { Express, Router, Response } from "express";
import { setupAccountingRoutes } from "./routes/accounting.routes";
import { setupLedgerRoutes } from "./routes/ledger.routes";
// Note Contabil routes are now handled by routes/index.ts (note-contabil.route.ts)
import accountingSubRoutes from "./routes/index";
import { setupBankJournalRoutes } from "./routes/bank-journal.routes";
import { setupCashRegisterRoutes } from "./routes/cash-register.routes";
import { setupSalesJournalRoutes } from "./routes/sales-journal.routes";
import { setupPurchaseJournalRoutes } from "./routes/purchase-journal.routes";
import { setupFinancialReportsRoutes } from "./routes/financial-reports.routes";
import { setupAccountingSettingsRoutes } from "./routes/accounting-settings.routes";
import { setupOnboardingRoutes } from "./routes/onboarding.routes";
import { AccountingService } from "./services/accounting.service";
import { storage } from "../../storage";
import { AuthGuard } from "../auth/guards/auth.guard";
import { JwtAuthMode } from "../auth/constants/auth-mode.enum";
import { AuthenticatedRequest } from "../../common/middleware/auth-types";
import { Services } from "../../common/services";
import {
  JournalService,
  SalesJournalService,
  PurchaseJournalService,
  BankJournalService,
  CashRegisterService,
  NoteContabilService,
  ValidateDocumentService
} from "./services";

// Import controllers
import { AccountingController } from "./controllers/accounting.controller";
import { JournalController } from "./controllers/journal.controller";
import { NoteContabilController } from "./controllers/note-contabil.controller";
import { BankJournalController } from "./controllers/bank-journal.controller";
import { CashRegisterController } from "./controllers/cash-register.controller";
import { SalesJournalController } from "./controllers/sales-journal.controller";
import { PurchaseJournalController } from "./controllers/purchase-journal.controller";

/**
 * Initialize the accounting module
 * This function sets up routes and registers services in the global registry
 * 
 * @param app Express application instance
 * @returns Router instance
 */
export function initAccountingModule(app: Express) {
  // Setup global /api/accounts route (for forms and dropdowns)
  const globalAccountsRouter = Router();
  globalAccountsRouter.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
  globalAccountsRouter.get("/", async (req, res) => {
    await accountingController.getAllAccounts(req as AuthenticatedRequest, res as Response);
  });
  app.use("/api/accounts", globalAccountsRouter);
  
  // Setup primary accounting routes
  const accountingRoutes = setupAccountingRoutes();
  app.use("/api/accounting", accountingRoutes);
  
  // Setup ledger routes - these will be available at /api/accounting/ledger
  const ledgerRoutes = setupLedgerRoutes();
  app.use("/api/accounting/ledger", ledgerRoutes);
  
  // Mount Note Contabil routes (/api/accounting/note-contabil and /api/accounting/fiscal-closure)
  app.use("/api/accounting", accountingSubRoutes);
  
  // Setup specialized journal routes
  const bankJournalRoutes = setupBankJournalRoutes();
  app.use("/api/accounting", bankJournalRoutes); // Direct sub /api/accounting pentru /bank-accounts și /bank-transactions
  
  const cashRegisterRoutes = setupCashRegisterRoutes();
  app.use("/api/accounting", cashRegisterRoutes); // Direct sub /api/accounting pentru /cash-registers și /cash-transactions
  
  const salesJournalRoutes = setupSalesJournalRoutes();
  app.use("/api/accounting/sales", salesJournalRoutes); // Changed from sales-journal to sales
  
  const purchaseJournalRoutes = setupPurchaseJournalRoutes();
  app.use("/api/accounting/purchases", purchaseJournalRoutes); // Changed from purchase-journal to purchases
  
  const financialReportsRoutes = setupFinancialReportsRoutes();
  app.use("/api/accounting", financialReportsRoutes); // Financial reports și indicators
  
  // Setup accounting settings routes
  const accountingSettingsRoutes = setupAccountingSettingsRoutes();
  app.use("/api/accounting/settings", accountingSettingsRoutes);
  
  // Setup onboarding routes
  const onboardingRoutes = setupOnboardingRoutes();
  app.use("/api/accounting/onboarding", onboardingRoutes);
  
  // Register legacy accounting service in global registry
  // Note: Specialized journal services are registered in registry.init.ts
  registerLegacyAccountingService();
  
  console.log('[Accounting Module] Registered accounting routes');
  
  return accountingRoutes;
}

/**
 * Register legacy accounting service in the global service registry
 * Note: New journal services are registered in registry.init.ts
 * This makes the service accessible from anywhere in the application
 */
function registerLegacyAccountingService() {
  // Add accounting service to the Services registry if it's available
  if (Services) {
    // Register existing legacy service
    (Services as any).accounting = accountingService;
    console.log('[Accounting Module] Registered legacy accounting service in global registry');
  }
}

// Create service instances
export const accountingService = new AccountingService(storage);
export const journalService = new JournalService();
export const salesJournalService = new SalesJournalService();
export const purchaseJournalService = new PurchaseJournalService();
export const bankJournalService = new BankJournalService();
export const cashRegisterService = new CashRegisterService();
export const noteContabilService = new NoteContabilService();
export const validateDocumentService = new ValidateDocumentService();

// Create controller instances
export const accountingController = new AccountingController(accountingService);
export const journalController = new JournalController(journalService);
export const noteContabilController = new NoteContabilController(noteContabilService);
export const bankJournalController = new BankJournalController(bankJournalService);
export const cashRegisterController = new CashRegisterController(cashRegisterService);
export const salesJournalController = new SalesJournalController(salesJournalService);
export const purchaseJournalController = new PurchaseJournalController(purchaseJournalService);

// Group services in a namespace for easy access
export const AccountingServices = {
  accountingService,
  journalService,
  salesJournalService,
  purchaseJournalService,
  bankJournalService,
  cashRegisterService,
  noteContabilService,
  validateDocumentService
};

// Group controllers in a namespace for easy access
export const AccountingControllers = {
  accountingController,
  journalController,
  noteContabilController,
  bankJournalController,
  cashRegisterController,
  salesJournalController,
  purchaseJournalController
};