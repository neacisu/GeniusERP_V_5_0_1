/**
 * Modulul de Inteligență Artificială (AI)
 * 
 * Acest modul include toate funcționalitățile AI ale platformei:
 * - Dashboard pentru monitorizare generală
 * - AI Reports pentru generarea de rapoarte inteligente
 * - Sales AI pentru scoring leads și recomandări de vânzări
 * - Inbox AI pentru analiza și răspunsul automat la email-uri
 * - Product QA pentru răspunsuri la întrebări despre produse
 * - Integrare OpenAI pentru acces la modele avansate
 */

import React from "react";
import { Switch, Route } from "wouter"; 

// Import componente pentru paginile modulului AI
import DashboardPage from "./pages/DashboardPage";
import ReportsPage from "./pages/reports/ReportsPage";
import ReportDetailPage from "./pages/reports/ReportDetailPage";
import CreateReportPage from "./pages/reports/CreateReportPage";
import OpenAiPage from "./pages/openai/OpenAiPage";
import SalesAIPage from "./pages/sales/SalesAIPage";
import InboxAIPage from "./pages/inbox/InboxAIPage";
import ProductQAPage from "./pages/product/ProductQAPage";

export default function AIModule() {
  return (
    <Switch>
      <Route path="/ai" component={DashboardPage} />
      <Route path="/ai/dashboard" component={DashboardPage} />
      
      {/* Rute pentru AI Reports */}
      <Route path="/ai/reports" component={ReportsPage} />
      <Route path="/ai/reports/create" component={CreateReportPage} />
      <Route path="/ai/reports/:id" component={ReportDetailPage} />
      
      {/* Rute pentru submodule */}
      <Route path="/ai/sales" component={SalesAIPage} />
      <Route path="/ai/inbox" component={InboxAIPage} />
      <Route path="/ai/products" component={ProductQAPage} />
      
      {/* Rută pentru setări și integrare OpenAI */}
      <Route path="/ai/openai" component={OpenAiPage} />
    </Switch>
  );
}