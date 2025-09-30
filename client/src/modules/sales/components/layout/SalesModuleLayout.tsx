/**
 * Sales Module Layout Component
 * 
 * Provides a consistent layout for all pages in the Sales module with
 * horizontal tab navigation and built-in collaboration integration.
 */

import React from 'react';
import { useLocation, Link } from 'wouter';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, RefreshCw } from 'lucide-react';
import CollabIntegration from '@/modules/collab/components/CollabIntegration';

interface SalesModuleLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const SalesModuleLayout: React.FC<SalesModuleLayoutProps> = ({ 
  children, 
  title = "Vânzări", 
  description = "Module de gestionare a vânzărilor și relațiilor cu clienții" 
}) => {
  const [location] = useLocation();
  
  // Define tabs for the Sales module
  const tabs = [
    { 
      value: 'dashboard', 
      label: 'Tablou general', 
      path: '/sales',
      isActive: location === '/sales' || location === '/sales/'
    },
    { 
      value: 'customers', 
      label: 'Clienți', 
      path: '/sales/customers',
      isActive: location.startsWith('/sales/customers') 
    },
    { 
      value: 'deals', 
      label: 'Contracte', 
      path: '/sales/deals',
      isActive: location.startsWith('/sales/deals') 
    },
    { 
      value: 'pipeline', 
      label: 'Pipeline', 
      path: '/sales/pipeline',
      isActive: location.startsWith('/sales/pipeline') 
    },
    { 
      value: 'opportunities', 
      label: 'Oportunități', 
      path: '/sales/opportunities',
      isActive: location.startsWith('/sales/opportunities')
    },
    { 
      value: 'quotes', 
      label: 'Oferte', 
      path: '/sales/quotes',
      isActive: location.startsWith('/sales/quotes')
    },
    { 
      value: 'analytics', 
      label: 'Analiză', 
      path: '/sales/analytics',
      isActive: location.startsWith('/sales/analytics')
    }
  ];

  // Find the active tab value
  const activeTab = tabs.find(tab => tab.isActive)?.value || 'dashboard';

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reîmprospătează
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adaugă nou
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} className="mt-2">
          <TabsList className="grid w-full auto-cols-fr grid-flow-col">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                asChild
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Link href={tab.path}>{tab.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Card className="p-6 relative overflow-visible">
        {/* Context-aware collaboration sidebar integration */}
        <div className="absolute right-0 top-0 z-10 -mr-14 mt-6">
          <CollabIntegration
            moduleContext="sales"
            enableNotifications={true}
            enableCommunity={true}
            enableTasks={true}
          />
        </div>
        {children}
      </Card>
    </div>
  );
};

export default SalesModuleLayout;