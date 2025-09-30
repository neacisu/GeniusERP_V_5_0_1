/**
 * Invoicing Module Routes
 * 
 * Main routing component for the invoicing module.
 * Integrates with the collaboration module for task management and communication.
 */

import React, { useEffect, useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import CollabIntegration from "../collab/components/CollabIntegration";
import { hasAuthToken } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

// Import pages
import InvoicingDashboardPage from "./pages/dashboard";
import InvoicesPage from "./pages/invoices";

// Lazily loaded pages with error boundaries
const CustomersPage = React.lazy(() => import("./pages/customers"));
const TemplatesPage = React.lazy(() => import("./pages/templates"));
const RecurringPage = React.lazy(() => import("./pages/recurring"));
const ReportsPage = React.lazy(() => import("./pages/reports"));
const SettingsPage = React.lazy(() => import("./pages/settings"));

// Import page components for invoices
const NewInvoicePage = React.lazy(() => import("./pages/invoices/new"));
const EditInvoicePage = React.lazy(() => import("./pages/invoices/edit"));
const InvoiceDetailPage = React.lazy(() => import("./pages/invoices/[id]"));

// Loading component with skeleton
const LoadingComponent = () => (
  <Card>
    <CardContent className="py-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Protected route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [_, navigate] = useLocation();

  // Check authentication status
  useEffect(() => {
    // Short delay to ensure localStorage is available
    const timer = setTimeout(() => {
      const authenticated = hasAuthToken();
      setIsAuthenticated(authenticated);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  // Still checking
  if (isAuthenticated === null) {
    return <LoadingComponent />;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Eroare de autentificare</AlertTitle>
          <AlertDescription>
            Sesiunea dumneavoastră a expirat. Vă rugăm să vă autentificați pentru a accesa această pagină.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={() => navigate("/login")}>
            Mergi la pagina de autentificare
          </Button>
        </div>
      </div>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
};

/**
 * Invoicing module with integration of the collaboration features
 * Routes for all invoicing-related pages with collab integration
 */
const InvoicingModule: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto py-4">
        <Switch>
          <Route path="/invoicing">
            <ProtectedRoute>
              <InvoicingDashboardPage />
            </ProtectedRoute>
          </Route>
          
          {/* Adăugăm ruta pentru crearea facturilor noi */}
          <Route path="/invoicing/invoices/new">
            <ProtectedRoute>
              <React.Suspense fallback={<LoadingComponent />}>
                <NewInvoicePage />
              </React.Suspense>
            </ProtectedRoute>
          </Route>
          
          <Route path="/invoicing/invoices/edit/:id">
            {(params) => (
              <ProtectedRoute>
                <React.Suspense fallback={<LoadingComponent />}>
                  <EditInvoicePage id={params.id} />
                </React.Suspense>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/invoicing/invoices/:id">
            <ProtectedRoute>
              <React.Suspense fallback={<LoadingComponent />}>
                <InvoiceDetailPage />
              </React.Suspense>
            </ProtectedRoute>
          </Route>
          
          <Route path="/invoicing/invoices">
            <ProtectedRoute>
              <InvoicesPage />
            </ProtectedRoute>
          </Route>
          
          <Route path="/facturare/invoices">
            <ProtectedRoute>
              <InvoicesPage />
            </ProtectedRoute>
          </Route>
          
          <Route path="/invoicing/customers">
            <ProtectedRoute>
              <React.Suspense fallback={<LoadingComponent />}>
                <CustomersPage />
              </React.Suspense>
            </ProtectedRoute>
          </Route>
          
          <Route path="/invoicing/templates">
            <ProtectedRoute>
              <React.Suspense fallback={<LoadingComponent />}>
                <TemplatesPage />
              </React.Suspense>
            </ProtectedRoute>
          </Route>
          
          <Route path="/invoicing/recurring">
            <ProtectedRoute>
              <React.Suspense fallback={<LoadingComponent />}>
                <RecurringPage />
              </React.Suspense>
            </ProtectedRoute>
          </Route>
          
          <Route path="/invoicing/reports">
            <ProtectedRoute>
              <React.Suspense fallback={<LoadingComponent />}>
                <ReportsPage />
              </React.Suspense>
            </ProtectedRoute>
          </Route>
          
          <Route path="/invoicing/settings">
            <ProtectedRoute>
              <React.Suspense fallback={<LoadingComponent />}>
                <SettingsPage />
              </React.Suspense>
            </ProtectedRoute>
          </Route>
        </Switch>
        
        {/* Integrare cu modulul de colaborare */}
        <CollabIntegration 
          moduleContext="Invoicing" 
          enableTasks={true} 
          enableCommunity={true} 
        />
      </div>
    </AppLayout>
  );
};

export default InvoicingModule;