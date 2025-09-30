import { Express, Router } from "express";
import { setupAccountingRoutes } from "./routes/accounting.routes";
import { AccountingService } from "./services/accounting.service";
import { storage } from "../../storage";
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

/**
 * Initialize the accounting module
 * This function sets up routes and registers services in the global registry
 * 
 * @param app Express application instance
 * @returns Router instance
 */
export function initAccountingModule(app: Express) {
  // Setup API routes
  const accountingRoutes = setupAccountingRoutes();
  app.use("/api/accounting", accountingRoutes);
  
  // Register legacy accounting service in global registry
  // Note: Specialized journal services are registered in registry.init.ts
  registerLegacyAccountingService();
  
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