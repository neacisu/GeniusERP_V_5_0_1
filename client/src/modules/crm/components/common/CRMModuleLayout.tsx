/**
 * CRM Module Layout
 * 
 * This component provides the consistent layout for all CRM module pages,
 * including the tab navigation system and proper module context.
 */

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation, Link } from 'wouter';
import AppLayout from '@/components/layout/AppLayout';
import { Users, Building2, Phone, LucideBarChart2, PieChart, Calendar, Settings } from 'lucide-react';
import CollabIntegration from '../../../collab/components/CollabIntegration';

interface CRMModuleLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

export const CRMModuleLayout: React.FC<CRMModuleLayoutProps> = ({ 
  children,
  activeTab = 'dashboard'
}) => {
  const [location] = useLocation();
  
  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="border-b">
          <div className="container mx-auto py-2">
            <Tabs value={activeTab} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto mb-0 pb-0">
                <TabsTrigger value="dashboard" asChild>
                  <Link to="/crm/dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <PieChart className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="customers" asChild>
                  <Link to="/crm/customers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Building2 className="h-4 w-4 mr-2" />
                    Companii
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="contacts" asChild>
                  <Link to="/crm/contacts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    Contacte
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="deals" asChild>
                  <Link to="/crm/deals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <LucideBarChart2 className="h-4 w-4 mr-2" />
                    Oportunități
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="pipelines" asChild>
                  <Link to="/crm/pipelines" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <LucideBarChart2 className="h-4 w-4 mr-2" />
                    Pipeline-uri
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="activities" asChild>
                  <Link to="/crm/activities" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    Activități
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="forecasting" asChild>
                  <Link to="/crm/forecasting" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <LucideBarChart2 className="h-4 w-4 mr-2" />
                    Prognoze
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="settings" asChild>
                  <Link to="/crm/settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Settings className="h-4 w-4 mr-2" />
                    Setări
                  </Link>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="container mx-auto max-w-7xl">
            {children}
            
            {/* Integrare cu modulul de colaborare */}
            <CollabIntegration 
              moduleContext="CRM" 
              enableTasks={true} 
              enableCommunity={true} 
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CRMModuleLayout;