/**
 * BPM Module Index
 * 
 * Acest fișier definește rutele pentru modulul de automatizare a proceselor de business
 */

import React from 'react';
import { Switch, Route } from 'wouter';

// Import pages
import DashboardPage from './pages/dashboard';
import ProcessesPage from './pages/processes';
import ProcessDetailPage from './pages/processes/ProcessDetailPage';
import DesignerPage from './pages/designer';
import TriggersPage from './pages/triggers';
import AutomationsPage from './pages/automations';
import IntegrationsPage from './pages/integrations';
import MonitoringPage from './pages/monitoring';
import SchedulerPage from './pages/scheduler';

export default function BPMModule() {
  return (
    <Switch>
      <Route path="/bpm">
        <DashboardPage />
      </Route>
      <Route path="/bpm/processes">
        <ProcessesPage />
      </Route>
      <Route path="/bpm/processes/:id">
        <ProcessDetailPage />
      </Route>
      <Route path="/bpm/designer">
        <DesignerPage />
      </Route>
      <Route path="/bpm/designer/:id">
        <DesignerPage />
      </Route>
      <Route path="/bpm/triggers">
        <TriggersPage />
      </Route>
      <Route path="/bpm/automations">
        <AutomationsPage />
      </Route>
      <Route path="/bpm/integrations">
        <IntegrationsPage />
      </Route>
      <Route path="/bpm/monitoring">
        <MonitoringPage />
      </Route>
      <Route path="/bpm/scheduler">
        <SchedulerPage />
      </Route>
    </Switch>
  );
}