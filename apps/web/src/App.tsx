import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/modules/shared/pages/not-found";
import DashboardPage from "@/modules/dashboard/pages/dashboard-page";
import AuthPage from "@/modules/auth/pages/auth-page";
import InventoryModule from "@/modules/inventory";
// Import accounting module pages directly
import AccountingPage from "@/modules/accounting/pages/accounting-page";
import ChartOfAccountsPage from "@/modules/accounting/pages/chart-of-accounts";
import NoteContabilPage from "@/modules/accounting/pages/note-contabil";
import JournalEntriesPage from "@/modules/accounting/pages/journal-entries";
import SalesJournalPage from "@/modules/accounting/pages/sales-journal";
import PurchaseJournalPage from "@/modules/accounting/pages/purchase-journal";
import BankJournalPage from "@/modules/accounting/pages/bank-journal";
import CashRegisterPage from "@/modules/accounting/pages/cash-register";
import FinancialReportsPage from "@/modules/accounting/pages/financial-reports";
import AccountingSettingsPage from "@/modules/accounting/pages/accounting-settings";
// Import Admin Pages
import AdminUsersPage from "@/pages/admin/UsersPage";
import AdminNewUserPage from "@/pages/admin/NewUserPage";
// Import from modules structure for better routing
import AdminEditUserPage from "@/modules/admin/pages/EditUserPage";
// Import Module components
import AIModule from "@/modules/ai";
import AnalyticsModule from "@/modules/analytics";
import BPMModule from "@/modules/bpm";
import CRMModule from "@/modules/crm";
import { DocumentsRoutes } from "@/modules/documents";
import EcommerceModule from "@/modules/ecommerce";
import InvoicingModule from "@/modules/invoicing";
import MarketingModule from "@/modules/marketing";
import SettingsModule from "@/modules/settings";
import SalesModule from "@/modules/sales";
import CollabModule from "@/modules/collab";
import HRModule from "@/modules/hr";
import NewRolePage from "@/modules/admin/pages/NewRolePage";
import EditRolePage from "@/modules/admin/pages/EditRolePage";
import RolesPage from "@/modules/admin/pages/RolesPage";
import PermissionsPage from "@/modules/admin/pages/PermissionsPage";
// Import Settings Module pages directly
// SystemGeneralPage, SystemIndexPage, ModuleSettingsPage - unused, removed
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { createLogger } from "@/utils/logger/logger";
import { createAuditLogger } from "@/utils/audit/audit-logger";
import TestSentryPage from "@/pages/test-sentry";

// Initialize app loggers
const logger = createLogger("app");
const auditLogger = createAuditLogger("application");

// Log application startup
logger.info("Application initializing", {
  context: {
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'],
  },
});

// Record audit log for application start
auditLogger.log({
  action: "create",
  entityType: "session",
  entityId: "app-session",
  details: { startTime: new Date().toISOString() },
  metadata: { method: "application-start" },
});

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />

      {/* Accounting Module Routes */}
      <ProtectedRoute path="/accounting" component={AccountingPage} />
      <ProtectedRoute
        path="/accounting/chart-of-accounts"
        component={ChartOfAccountsPage}
      />
      <ProtectedRoute
        path="/accounting/note-contabil"
        component={NoteContabilPage}
      />
      <ProtectedRoute
        path="/accounting/journal-entries"
        component={JournalEntriesPage}
      />
      <ProtectedRoute
        path="/accounting/sales-journal"
        component={SalesJournalPage}
      />
      <ProtectedRoute
        path="/accounting/purchase-journal"
        component={PurchaseJournalPage}
      />
      <ProtectedRoute
        path="/accounting/bank-journal"
        component={BankJournalPage}
      />
      <ProtectedRoute
        path="/accounting/cash-register"
        component={CashRegisterPage}
      />
      <ProtectedRoute
        path="/accounting/financial-reports"
        component={FinancialReportsPage}
      />
      <ProtectedRoute
        path="/accounting/settings/:companyId"
        component={AccountingSettingsPage}
      />

      {/* Admin Module Routes - Protected (direct components) */}
      {/* IMPORTANT: Order matters in wouter! Specific routes first, then more general ones */}
      <ProtectedRoute path="/admin/users/new" component={AdminNewUserPage} />
      <ProtectedRoute
        path="/admin/users/:id/edit"
        component={AdminEditUserPage}
      />
      <ProtectedRoute path="/admin/users" component={AdminUsersPage} />
      {/* Folosim protected route cu componente direct importate - ORDINEA CONTEAZĂ! */}
      {/* Prima trebuie să fie ruta cea mai specifică */}
      <ProtectedRoute path="/admin/roles/new" component={NewRolePage} />
      <ProtectedRoute path="/admin/roles/:id/edit" component={EditRolePage} />
      <ProtectedRoute path="/admin/roles" component={RolesPage} />
      <ProtectedRoute path="/admin/permissions" component={PermissionsPage} />
      <ProtectedRoute path="/admin" component={AdminUsersPage} />

      <ProtectedRoute path="/inventory/*" component={InventoryModule} />
      <ProtectedRoute path="/inventory" component={InventoryModule} />

      {/* AI Module Routes */}
      <ProtectedRoute path="/ai/:path*" component={AIModule} />
      <ProtectedRoute path="/ai" component={AIModule} />

      {/* Analytics Module Routes */}
      <ProtectedRoute path="/analytics/:path*" component={AnalyticsModule} />
      <ProtectedRoute path="/analytics" component={AnalyticsModule} />

      {/* BPM Module Routes */}
      <ProtectedRoute path="/bpm/:path*" component={BPMModule} />
      <ProtectedRoute path="/bpm" component={BPMModule} />

      {/* HR Module Routes - Import direct pentru încărcare rapidă */}
      <ProtectedRoute path="/hr/*" component={() => <HRModule />} />
      <ProtectedRoute path="/hr" component={() => <HRModule />} />
      {/* CRM Module Routes */}
      <ProtectedRoute path="/crm/*" component={CRMModule} />
      <ProtectedRoute path="/crm" component={CRMModule} />

      {/* Collaboration Module Routes - Import direct pentru încărcare rapidă */}
      <ProtectedRoute path="/collab/*" component={CollabModule} />
      <ProtectedRoute path="/collab" component={CollabModule} />

      {/* E-commerce Module Routes */}
      <ProtectedRoute path="/ecommerce/*" component={EcommerceModule} />
      <ProtectedRoute path="/ecommerce" component={EcommerceModule} />
      {/* Sales Module Routes */}
      <Route path="/sales/:path*">
        <SalesModule />
      </Route>
      <Route path="/sales">
        <SalesModule />
      </Route>
      {/* Marketing Module Routes */}
      <ProtectedRoute path="/marketing/:path*" component={MarketingModule as any} />
      <ProtectedRoute path="/marketing" component={MarketingModule as any} />
      {/* No direct page needed anymore as we fixed the module-level page */}

      {/* Invoicing Module Routes */}
      <ProtectedRoute path="/invoicing/:path*" component={InvoicingModule as any} />
      <ProtectedRoute path="/invoicing" component={InvoicingModule as any} />
      <ProtectedRoute path="/facturare/:path*" component={InvoicingModule as any} />
      <ProtectedRoute path="/facturare" component={InvoicingModule as any} />
      {/* Documents Module Routes */}
      <ProtectedRoute path="/documents/:path*" component={DocumentsRoutes as any} />
      <ProtectedRoute path="/documents" component={DocumentsRoutes as any} />
      {/* Settings Module Routes */}
      <ProtectedRoute path="/settings/company" component={SettingsModule} />
      <ProtectedRoute
        path="/settings/system/module-settings"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/system/general"
        component={SettingsModule}
      />
      <ProtectedRoute path="/settings/system" component={SettingsModule} />
      <ProtectedRoute
        path="/settings/features/feature-toggles"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/security/settings"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/security/roles"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/security/api-keys"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/security/users"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/preferences/user-preferences"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/notifications/settings"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/notifications/channels"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/notifications"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/preferences/ui-themes"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/templates/document-templates"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/templates/email-templates"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/integrations/ecommerce"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/integrations/payments"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/integrations/anaf"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/integrations/documents"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/integrations/communication"
        component={SettingsModule}
      />
      <ProtectedRoute
        path="/settings/integrations"
        component={SettingsModule}
      />
      <ProtectedRoute path="/settings/:path*" component={SettingsModule} />
      <ProtectedRoute path="/settings" component={SettingsModule} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={AuthPage} />
      
      {/* Sentry Test Page (DOAR în development) */}
      {import.meta.env.DEV && <Route path="/test-sentry" component={TestSentryPage} />}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Log application render
  React.useEffect(() => {
    logger.debug("App component mounted");

    return () => {
      logger.debug("App component unmounted");
    };
  }, []);

  return (
    <ErrorBoundary moduleName="app-root">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
