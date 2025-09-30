/**
 * Analytics Module
 * 
 * Modul principal pentru funcționalitățile de analiză și raportare
 */

import React from 'react';
import { Switch, Route, useLocation } from 'wouter';

// Paginile modulului Analytics
import DashboardPage from './pages/dashboard';
import ReportsPage from './pages/reports';
import ReportDetailPage from './pages/reports/ReportDetailPage';
import MetricsPage from './pages/metrics';
import AlertsPage from './pages/alerts';

export default function AnalyticsModule() {
  return (
    <Switch>
      <Route path="/analytics" component={DashboardPage} />
      <Route path="/analytics/dashboard" component={DashboardPage} />
      <Route path="/analytics/reports/:id" component={ReportDetailPage} />
      <Route path="/analytics/reports" component={ReportsPage} />
      <Route path="/analytics/metrics" component={MetricsPage} />
      <Route path="/analytics/alerts" component={AlertsPage} />
      <Route>
        <div className="p-4">
          <h2 className="text-xl font-bold">Pagină negăsită</h2>
          <p className="text-muted-foreground">Pagina solicitată nu există în modulul Analytics.</p>
        </div>
      </Route>
    </Switch>
  );
}