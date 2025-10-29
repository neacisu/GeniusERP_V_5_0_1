/**
 * Sales Module Routes
 * 
 * Defines all routes for the sales module including overview, crm_deals, opportunities, quotes,
 * customers, pipeline, and products with integration to the existing invoicing module.
 */

import React from 'react';
import { Switch, Route } from 'wouter';
import { ProtectedRoute } from '@/lib/protected-route';
import AppLayout from '@/components/layout/AppLayout';

// Import sales pages
import SalesOverviewPage from './pages/overview';
import DealsPage from './pages/deals/index';
import OpportunitiesPage from './pages/opportunities/index';
import QuotesPage from './pages/quotes/index';
import PipelinePage from './pages/pipeline/index';
import CustomersPage from './pages/customers/index';
import ProductsPage from './pages/products/index';
import NotFound from '@/modules/shared/pages/not-found';

const SalesModule: React.FC = () => {
  return (
    <AppLayout>
      <Switch>
        {/* First, handle all detail and form routes with parameters because they should take precedence */}
        {/* Deal detail/form routes */}
        <Route path="/sales/deals/new">
          <div>Deal form coming soon</div>
        </Route>
        <Route path="/sales/deals/:id/edit">
          <div>Deal edit form coming soon</div>
        </Route>
        <Route path="/sales/deals/:id">
          <div>Deal details coming soon</div>
        </Route>
        
        {/* Opportunity detail/form routes */}
        <Route path="/sales/opportunities/new">
          <div>Opportunity form coming soon</div>
        </Route>
        <Route path="/sales/opportunities/:id/edit">
          <div>Opportunity edit form coming soon</div>
        </Route>
        <Route path="/sales/opportunities/:id/convert">
          <div>Opportunity conversion form coming soon</div>
        </Route>
        <Route path="/sales/opportunities/:id">
          <div>Opportunity details coming soon</div>
        </Route>
        
        {/* Quote detail/form routes */}
        <Route path="/sales/quotes/new">
          <div>Quote form coming soon</div>
        </Route>
        <Route path="/sales/quotes/:id/edit">
          <div>Quote edit form coming soon</div>
        </Route>
        <Route path="/sales/quotes/:id/convert">
          <div>Quote conversion form coming soon</div>
        </Route>
        <Route path="/sales/quotes/:id">
          <div>Quote details coming soon</div>
        </Route>
        
        {/* Customer detail/form routes */}
        <Route path="/sales/customers/new">
          <div>Customer form coming soon</div>
        </Route>
        <Route path="/sales/customers/:id/edit">
          <div>Customer edit form coming soon</div>
        </Route>
        <Route path="/sales/customers/:id">
          <div>Customer details coming soon</div>
        </Route>
        
        {/* Product detail/form routes */}
        <Route path="/sales/products/new">
          <div>Product form coming soon</div>
        </Route>
        <Route path="/sales/products/:id/edit">
          <div>Product edit form coming soon</div>
        </Route>
        <Route path="/sales/products/:id">
          <div>Product details coming soon</div>
        </Route>
        
        {/* Then handle the main pages without parameters */}
        <Route path="/sales/overview">
          <SalesOverviewPage />
        </Route>
        <Route path="/sales/deals">
          <DealsPage />
        </Route>
        <Route path="/sales/opportunities">
          <OpportunitiesPage />
        </Route>
        <Route path="/sales/quotes">
          <QuotesPage />
        </Route>
        <Route path="/sales/pipeline">
          <PipelinePage />
        </Route>
        <Route path="/sales/customers">
          <CustomersPage />
        </Route>
        <Route path="/sales/products">
          <ProductsPage />
        </Route>
        
        {/* Root sales route - redirect to overview */}
        <Route path="/sales">
          <SalesOverviewPage />
        </Route>
        
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </AppLayout>
  );
};

export default SalesModule;