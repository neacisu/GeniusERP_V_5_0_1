/**
 * Analytics Layout
 * 
 * Layout principal pentru toate paginile din modulul Analytics.
 * Include header, tabs pentru navigare între submeniuri și conținut.
 */

import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  BarChart4, 
  PieChart, 
  Bell, 
  Settings2 
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/components/layout/AppLayout';
import CollabIntegration from '../../../collab/components/CollabIntegration';

interface AnalyticsLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

export const AnalyticsLayout = ({ 
  children, 
  activeTab = 'dashboard'
}: AnalyticsLayoutProps) => {
  const [location, navigate] = useLocation();

  // Handler for tab changes
  const handleTabChange = (value: string) => {
    switch(value) {
      case 'dashboard':
        navigate('/analytics');
        break;
      case 'reports':
        navigate('/analytics/reports');
        break;
      case 'metrics':
        navigate('/analytics/metrics');
        break;
      case 'alerts':
        navigate('/analytics/alerts');
        break;
      default:
        navigate('/analytics');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header și Navigare module */}
        <div className="border-b bg-white pb-4">
          <div className="flex flex-col gap-1 mb-4">
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Vizualizează și analizează datele privind performanța afacerii
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full max-w-2xl h-11 justify-start gap-0.5 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="dashboard"
                className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-11 px-4 text-sm"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-11 px-4 text-sm"
              >
                <BarChart4 className="h-4 w-4" />
                <span>Rapoarte</span>
              </TabsTrigger>
              <TabsTrigger
                value="metrics"
                className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-11 px-4 text-sm"
              >
                <PieChart className="h-4 w-4" />
                <span>Metrici</span>
              </TabsTrigger>
              <TabsTrigger
                value="alerts"
                className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-11 px-4 text-sm"
              >
                <Bell className="h-4 w-4" />
                <span>Alerte</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Main Content */}
        {children}
      </div>
      
      {/* Integrare cu modulul de colaborare */}
      <CollabIntegration moduleContext="Analytics" enableTasks={true} enableCommunity={true} />
    </AppLayout>
  );
};

// Pentru compatibilitate cu importurile existente
export default AnalyticsLayout;