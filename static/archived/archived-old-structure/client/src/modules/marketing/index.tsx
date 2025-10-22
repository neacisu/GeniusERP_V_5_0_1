/**
 * Marketing Module Routes
 * 
 * Main routing component for the marketing module.
 */

import React from "react";
import { Route, Switch } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import CollabIntegration from "../collab/components/CollabIntegration";

// Import pages
import MarketingDashboardPage from "./pages/dashboard";

// Lazy-loaded pages for better performance
const CampaignsPage = React.lazy(() => import("./pages/campaigns"));
const SegmentsPage = React.lazy(() => import("./pages/segments"));
const TemplatesPage = React.lazy(() => import("./pages/templates"));
const ReportsPage = React.lazy(() => import("./pages/reports"));
const AnalyticsPage = React.lazy(() => import("./pages/analytics"));

// Add lazily loaded campaign pages
const NewCampaignPage = React.lazy(() => import("./pages/campaigns/new"));
const EditCampaignPage = React.lazy(() => import("./pages/campaigns/edit"));
const CampaignDetailPage = React.lazy(() => import("./pages/campaigns/[id]"));

// Add lazily loaded template pages
const NewTemplatePage = React.lazy(() => import("./pages/templates/new"));
const EditTemplatePage = React.lazy(() => import("./pages/templates/edit"));
const TemplateDetailPage = React.lazy(() => import("./pages/templates/[id]"));

const MarketingModule: React.FC = () => {
  return (
    <AppLayout>
      <>
        <Switch>
          <Route path="/marketing" component={MarketingDashboardPage} />
          
          {/* Campaign routes */}
          <Route path="/marketing/campaigns/new">
            {() => (
              <React.Suspense fallback={<div>Se încarcă...</div>}>
                <NewCampaignPage />
              </React.Suspense>
            )}
          </Route>
          <Route path="/marketing/campaigns/edit/:id">
            {(params) => (
              <React.Suspense fallback={<div>Se încarcă...</div>}>
                <EditCampaignPage id={params.id} />
              </React.Suspense>
            )}
          </Route>
          <Route path="/marketing/campaigns/:id">
            {(params) => (
              <React.Suspense fallback={<div>Se încarcă...</div>}>
                <CampaignDetailPage id={params.id} />
              </React.Suspense>
            )}
          </Route>
          <Route path="/marketing/campaigns">
            {() => (
              <React.Suspense fallback={<div>Se încarcă...</div>}>
                <CampaignsPage />
              </React.Suspense>
            )}
          </Route>
          
          {/* Template routes */}
          <Route path="/marketing/templates/new">
            {() => (
              <React.Suspense fallback={<div>Se încarcă...</div>}>
                <NewTemplatePage />
              </React.Suspense>
            )}
          </Route>
          <Route path="/marketing/templates/edit/:id">
            {(params) => (
              <React.Suspense fallback={<div>Se încarcă...</div>}>
                <EditTemplatePage id={params.id} />
              </React.Suspense>
            )}
          </Route>
          <Route path="/marketing/templates/:id">
            {(params) => (
              <React.Suspense fallback={<div>Se încarcă...</div>}>
                <TemplateDetailPage id={params.id} />
              </React.Suspense>
            )}
          </Route>
          <Route path="/marketing/templates">
            {() => (
              <React.Suspense fallback={<div>Se încarcă...</div>}>
                <TemplatesPage />
              </React.Suspense>
            )}
          </Route>
          
          {/* Other section routes */}
          <Route path="/marketing/segments">
            {() => (
              <React.Suspense fallback={<div>Se încarcă...</div>}>
                <SegmentsPage />
              </React.Suspense>
            )}
          </Route>
          <Route path="/marketing/reports">
            {() => (
              <React.Suspense fallback={<div>Se încarcă...</div>}>
                <ReportsPage />
              </React.Suspense>
            )}
          </Route>
          <Route path="/marketing/analytics">
            {() => (
              <React.Suspense fallback={<div>Se încarcă...</div>}>
                <AnalyticsPage />
              </React.Suspense>
            )}
          </Route>
        </Switch>
        
        {/* Integrare cu modulul de colaborare */}
        <CollabIntegration moduleContext="Marketing" enableTasks={true} enableCommunity={true} />
      </>
    </AppLayout>
  );
};

export default MarketingModule;