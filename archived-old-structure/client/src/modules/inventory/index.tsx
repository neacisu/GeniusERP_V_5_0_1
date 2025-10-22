/**
 * Inventory Module
 * 
 * Main module for inventory management (Gestiune Stocuri)
 * Provides routing and navigation for all inventory-related pages.
 */

import React from "react";
import { Route, Switch } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import CollabIntegration from "../collab/components/CollabIntegration";

// Import page components
import InventoryDashboard from "./pages/dashboard/index";
import ProductsPage from "./pages/products/index";
import CategoriesPage from "./pages/categories/index";
import WarehousesPage from "./pages/warehouses/index";
import StockLevelsPage from "./pages/stock-levels/index";
import NirPage from "./pages/nir/index";
import TransfersPage from "./pages/transfers/index";
import ReportsPage from "./pages/reports/index";
// Removed import for standalone AssessmentsPage - now integrated in reports
import NewAssessmentPage from "./pages/assessments/new";

/**
 * Inventory Module with routing for all inventory-related pages
 */
function InventoryModule() {
  return (
    <AppLayout>
      <div className="container mx-auto py-4">
        <Switch>
          <Route path="/inventory/assessments/new">
            <NewAssessmentPage />
          </Route>
          <Route path="/inventory/assessments/edit/:id">
            {(params) => <NewAssessmentPage isEditing={true} id={params.id} />}
          </Route>
          {/* Removed standalone assessments page as requested - now integrated in /inventory/reports */}
          <Route path="/inventory/products">
            <ProductsPage />
          </Route>
          <Route path="/inventory/categories">
            <CategoriesPage />
          </Route>
          <Route path="/inventory/warehouses">
            <WarehousesPage />
          </Route>
          <Route path="/inventory/stock-levels">
            <StockLevelsPage />
          </Route>
          <Route path="/inventory/nir">
            <NirPage />
          </Route>
          <Route path="/inventory/transfers">
            <TransfersPage />
          </Route>
          <Route path="/inventory/reports">
            <ReportsPage />
          </Route>
          <Route path="/inventory">
            <InventoryDashboard />
          </Route>
        </Switch>
        
        {/* Integrare cu modulul de colaborare */}
        <CollabIntegration 
          moduleContext="Inventory" 
          enableTasks={true} 
          enableCommunity={true} 
        />
      </div>
    </AppLayout>
  );
};

export default InventoryModule;