// Module initialization - imports from NX libs
import type { Express } from 'express';
import session from 'express-session';
import { setupAuthRoutes } from '../../../../libs/auth/src/index';

// Import accounting routes
import accountingRouter, {
  setupAccountingRoutes,
  setupOnboardingRoutes,
  setupAccountingSettingsRoutes,
  setupSalesJournalRoutes,
  setupPurchaseJournalRoutes,
  setupBankJournalRoutes,
  setupCashRegisterRoutes,
  setupLedgerRoutes,
  setupFinancialReportsRoutes
} from '../../../../libs/accounting/src/index';

// Import HR routes
import { hrRouter } from '../../../../libs/hr/src/index';

// Import Settings routes
import { settingsRouter } from '../../../../libs/settings/src/index';

// Import Integrations routes
import integrationsRouter from '../../../../libs/integrations/src/index';

// Import Collaboration module
import { CollabModule } from '../../../../libs/collab/src/index';

// Import Sales module
import { salesRouter } from '../../../../libs/sales/src/index';

// Import AI routes (individual routers)
import {
  aiRouter,
  aiReportsRouter,
  inboxAiRouter,
  openaiRouter,
  productQaRouter,
  salesAiRouter
} from '../../../../libs/ai/src/index';

// Import Invoicing routes
import {
  invoiceRouter,
  createInvoiceRouter,
  validateInvoiceRouter,
  devalidateInvoiceRouter,
  customerRoutes,
  createInvoiceNumberingRoutes
} from '../../../../libs/invoicing/src/index';

// Import other module routes - these need to be checked
import { setupInventoryRoutes } from '../../../../libs/inventory/src/index';
import { setupUserRoutes } from '../../../../libs/users/src/index';
import { setupCrmRoutes } from '../../../../libs/crm/src/index';
import { setupAnalyticsRoutes, setupPredictiveAnalyticsRoutes, initAnalyticsModule } from '../../../../libs/analytics/src/index';
import { createCompanyRouter } from '../../../../libs/company/src/index';
import { CompanyController } from '../../../../libs/company/src/controllers/company.controller';
import { CompanyService } from '../../../../libs/company/src/services/company.service';
import { DrizzleService } from '@common/drizzle/drizzle.service';

// Import Admin module
import { initAdminModule } from '../../../../libs/admin/src/index';

export async function initializeModules(app: Express): Promise<void> {
  console.log('Initializing modules from NX libraries...');
  
  // Setup session store (using MemoryStore for development)
  // TODO: Use Redis in production
  const sessionStore = new session.MemoryStore();
  
  // Initialize DrizzleService once for all services
  const drizzleService = new DrizzleService();
  
  // ===== AUTH ROUTES =====
  const authRouter = setupAuthRoutes(app, sessionStore);
  app.use('/api/auth', authRouter);
  console.log('✅ Auth routes registered at /api/auth');
  
  // ===== ACCOUNTING ROUTES =====
  // Main accounting routes from index.ts (note-contabil, fiscal-closure)
  app.use('/api/accounting', accountingRouter);
  console.log('✅ Accounting routes registered at /api/accounting');
  
  // Additional accounting sub-routes with setup functions
  app.use('/api/accounting', setupAccountingRoutes());
  app.use('/api/accounting/onboarding', setupOnboardingRoutes());
  app.use('/api/accounting/settings', setupAccountingSettingsRoutes());
  app.use('/api/accounting/sales-journal', setupSalesJournalRoutes());
  app.use('/api/accounting/purchase-journal', setupPurchaseJournalRoutes());
  app.use('/api/accounting/bank-journal', setupBankJournalRoutes());
  app.use('/api/accounting/cash-register', setupCashRegisterRoutes());
  app.use('/api/accounting/ledger', setupLedgerRoutes());
  app.use('/api/accounting/financial-reports', setupFinancialReportsRoutes());
  console.log('✅ Accounting sub-routes registered');
  
  // ===== HR ROUTES =====
  app.use('/api/hr', hrRouter);
  console.log('✅ HR routes registered at /api/hr');
  
  // ===== INVENTORY ROUTES =====
  app.use('/api/inventory', setupInventoryRoutes());
  console.log('✅ Inventory routes registered at /api/inventory');
  
  // ===== INVOICING ROUTES =====
  app.use('/api/invoices', invoiceRouter);
  app.use('/api/invoices/create', createInvoiceRouter);
  app.use('/api/invoices/validate', validateInvoiceRouter);
  app.use('/api/invoices/devalidate', devalidateInvoiceRouter);
  app.use('/api/invoices/customers', customerRoutes);
  app.use('/api/invoicing/numbering-settings', createInvoiceNumberingRoutes());
  console.log('✅ Invoicing routes registered at /api/invoices and /api/invoicing');
  
  // ===== USER ROUTES =====
  app.use('/api/users', setupUserRoutes());
  console.log('✅ User routes registered at /api/users');
  
  // ===== ADMIN ROUTES =====
  // Initialize and register the Admin module
  initAdminModule(app);
  console.log('✅ Admin module initialized and routes registered at /api/admin');
  
  // ===== CRM ROUTES =====
  app.use('/api/crm', setupCrmRoutes());
  console.log('✅ CRM routes registered at /api/crm');
  
  // ===== SALES ROUTES =====
  app.use('/api/sales', salesRouter);
  console.log('✅ Sales routes registered at /api/sales');
  
  // ===== ANALYTICS ROUTES =====
  // Initialize analytics module to setup req.services middleware
  initAnalyticsModule(app, drizzleService);
  app.use('/api/analytics', setupAnalyticsRoutes());
  app.use('/api/analytics/predictive', setupPredictiveAnalyticsRoutes());
  console.log('✅ Analytics module initialized and routes registered at /api/analytics');
  
  // ===== AI ROUTES =====
  app.use('/api/ai', aiRouter);
  app.use('/api/ai/reports', aiReportsRouter);
  app.use('/api/ai/inbox', inboxAiRouter);
  app.use('/api/ai/openai', openaiRouter);
  app.use('/api/ai/product-qa', productQaRouter);
  app.use('/api/ai/sales', salesAiRouter);
  console.log('✅ AI routes registered at /api/ai');
  
  // ===== COMPANY ROUTES =====
  const companyService = new CompanyService(drizzleService);
  const companyController = new CompanyController(companyService);
  app.use('/api/companies', createCompanyRouter(companyController));
  console.log('✅ Company routes registered at /api/companies');
  
  // ===== INTEGRATIONS ROUTES =====
  app.use('/api/integrations', integrationsRouter);
  console.log('✅ Integrations routes registered at /api/integrations');
  
  // ===== SETTINGS ROUTES =====
  app.use('/api/settings', settingsRouter);
  console.log('✅ Settings routes registered at /api/settings');
  
  // ===== COLLABORATION ROUTES =====
  // Initialize and register the Collaboration module
  const collabModule = CollabModule.getInstance();
  collabModule.initialize();
  collabModule.registerRoutes(app);
  collabModule.start();
  console.log('✅ Collaboration routes registered at /api/collaboration');
  
  console.log('🎉 All modules initialized successfully');
}

