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
  invoiceNumberingRoutes
} from '../../../../libs/invoicing/src/index';

// Import other module routes - these need to be checked
import { setupInventoryRoutes } from '../../../../libs/inventory/src/index';
import { setupUserRoutes } from '../../../../libs/users/src/index';
import { setupCrmRoutes } from '../../../../libs/crm/src/index';
import { setupAnalyticsRoutes, setupPredictiveAnalyticsRoutes } from '../../../../libs/analytics/src/index';
import { setupCompanyRoutes } from '../../../../libs/company/src/index';

export async function initializeModules(app: Express): Promise<void> {
  console.log('Initializing modules from NX libraries...');
  
  // Setup session store (using MemoryStore for development)
  // TODO: Use Redis in production
  const sessionStore = new session.MemoryStore();
  
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
  app.use('/api/invoices/numbering', invoiceNumberingRoutes);
  console.log('✅ Invoicing routes registered at /api/invoices');
  
  // ===== USER ROUTES =====
  app.use('/api/users', setupUserRoutes());
  console.log('✅ User routes registered at /api/users');
  
  // ===== CRM ROUTES =====
  app.use('/api/crm', setupCrmRoutes());
  console.log('✅ CRM routes registered at /api/crm');
  
  // ===== ANALYTICS ROUTES =====
  app.use('/api/analytics', setupAnalyticsRoutes());
  app.use('/api/analytics/predictive', setupPredictiveAnalyticsRoutes());
  console.log('✅ Analytics routes registered at /api/analytics');
  
  // ===== AI ROUTES =====
  app.use('/api/ai', aiRouter);
  app.use('/api/ai/reports', aiReportsRouter);
  app.use('/api/ai/inbox', inboxAiRouter);
  app.use('/api/ai/openai', openaiRouter);
  app.use('/api/ai/product-qa', productQaRouter);
  app.use('/api/ai/sales', salesAiRouter);
  console.log('✅ AI routes registered at /api/ai');
  
  // ===== COMPANY ROUTES =====
  app.use('/api/companies', setupCompanyRoutes());
  console.log('✅ Company routes registered at /api/companies');
  
  // ===== INTEGRATIONS ROUTES =====
  app.use('/api/integrations', integrationsRouter);
  console.log('✅ Integrations routes registered at /api/integrations');
  
  // ===== SETTINGS ROUTES =====
  app.use('/api/settings', settingsRouter);
  console.log('✅ Settings routes registered at /api/settings');
  
  console.log('🎉 All modules initialized successfully');
}

