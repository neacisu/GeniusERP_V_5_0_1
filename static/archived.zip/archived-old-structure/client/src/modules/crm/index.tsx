/**
 * CRM Module - Main Entry Point
 * 
 * This is the main entry point for the CRM module which provides routes
 * for all CRM functionality including dashboard, customers, contacts,
 * deals, pipelines, activities, and settings.
 */

import React, { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { Loader2 } from 'lucide-react';

// Lazy load all pages for better performance
const DashboardPage = lazy(() => import('./pages/dashboard'));
const CustomersPage = lazy(() => import('./pages/customers'));
const CustomerDetailPage = lazy(() => import('./pages/customers/CustomerDetailPage'));
const ContactsPage = lazy(() => import('./pages/contacts'));
const DealsPage = lazy(() => import('./pages/deals'));
const PipelinesPage = lazy(() => import('./pages/pipelines'));
const ActivitiesPage = lazy(() => import('./pages/activities'));
const ForecastingPage = lazy(() => import('./pages/forecasting'));
const SettingsPage = lazy(() => import('./pages/settings'));

// Loading Fallback Component
const LoadingFallback = () => (
  <div className="w-full h-screen flex items-center justify-center">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);

function CRMModule() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        {/* Dashboard */}
        <Route path="/crm">
          <DashboardPage />
        </Route>
        <Route path="/crm/dashboard">
          <DashboardPage />
        </Route>
        
        {/* Customers */}
        <Route path="/crm/customers">
          <CustomersPage />
        </Route>
        <Route path="/crm/customers/:id">
          <CustomerDetailPage />
        </Route>
        
        {/* Contacts */}
        <Route path="/crm/contacts">
          <ContactsPage />
        </Route>
        
        {/* Deals */}
        <Route path="/crm/deals">
          <DealsPage />
        </Route>
        
        {/* Pipelines */}
        <Route path="/crm/pipelines">
          <PipelinesPage />
        </Route>
        
        {/* Activities */}
        <Route path="/crm/activities">
          <ActivitiesPage />
        </Route>
        
        {/* Forecasting */}
        <Route path="/crm/forecasting">
          <ForecastingPage />
        </Route>
        
        {/* Settings */}
        <Route path="/crm/settings">
          <SettingsPage />
        </Route>
        
        {/* Fallback route redirects to dashboard */}
        <Route>
          {() => {
            window.location.href = '/crm/dashboard';
            return null;
          }}
        </Route>
      </Switch>
    </Suspense>
  );
};

export default CRMModule;