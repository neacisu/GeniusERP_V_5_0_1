/**
 * E-commerce Module
 * 
 * This module provides e-commerce functionality for the ERP application,
 * including product management, orders, crm_customers, and Shopify integration.
 */

import React from 'react';
import { Switch, Route, useLocation } from 'wouter';
import AppLayout from '@/components/layout/AppLayout';
import DashboardPage from './pages/dashboard';
import OrdersPage from './pages/orders';
import ProductsPage from './pages/products';
import ShopPage from './pages/shop';
import CustomersPage from './pages/customers';
import DiscountsPage from './pages/discounts';
import AnalyticsPage from './pages/analytics';
import FulfillmentPage from './pages/fulfillment';
import IntegrationsPage from './pages/integrations';
import ShopifyIntegrationPage from './pages/integrations/shopify';
import SettingsPage from './pages/settings';

// Main module component
function EcommerceModule() {
  const [location] = useLocation();
  
  return (
    <AppLayout>
      <Switch>
        <Route path="/ecommerce/orders">
          <OrdersPage />
        </Route>
        <Route path="/ecommerce/products">
          <ProductsPage />
        </Route>
        <Route path="/ecommerce/shop">
          <ShopPage />
        </Route>
        <Route path="/ecommerce/customers">
          <CustomersPage />
        </Route>
        <Route path="/ecommerce/discounts">
          <DiscountsPage />
        </Route>
        <Route path="/ecommerce/analytics">
          <AnalyticsPage />
        </Route>
        <Route path="/ecommerce/fulfillment">
          <FulfillmentPage />
        </Route>
        <Route path="/ecommerce/integrations/shopify">
          <ShopifyIntegrationPage />
        </Route>
        <Route path="/ecommerce/integrations">
          <IntegrationsPage />
        </Route>
        <Route path="/ecommerce/settings">
          <SettingsPage />
        </Route>
        {/* Default route redirects to dashboard */}
        <Route path="/ecommerce">
          <DashboardPage />
        </Route>
      </Switch>
    </AppLayout>
  );
};

export default EcommerceModule;