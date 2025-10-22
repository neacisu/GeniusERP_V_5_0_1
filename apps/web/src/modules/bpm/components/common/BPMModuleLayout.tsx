/**
 * BPM Module Layout Component
 * 
 * Componenta de layout comună pentru toate paginile din modulul BPM
 */

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import {
  GitBranch,
  Zap,
  Activity,
  Network,
  MonitorDot,
  Calendar,
  LayoutDashboard,
} from 'lucide-react';
import CollabIntegration from '../../../collab/components/CollabIntegration';

export interface BPMModuleLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  className?: string;
}

export function BPMModuleLayout({ children, activeTab, className = "" }: BPMModuleLayoutProps) {
  const [, navigate] = useLocation();
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4 mr-2" />, path: '/bpm' },
    { id: 'processes', label: 'Procese', icon: <GitBranch className="h-4 w-4 mr-2" />, path: '/bpm/processes' },
    { id: 'triggers', label: 'Triggere', icon: <Zap className="h-4 w-4 mr-2" />, path: '/bpm/triggers' },
    { id: 'automations', label: 'Automatizări', icon: <Activity className="h-4 w-4 mr-2" />, path: '/bpm/automations' },
    { id: 'integrations', label: 'Integrări', icon: <Network className="h-4 w-4 mr-2" />, path: '/bpm/integrations' },
    { id: 'monitoring', label: 'Monitorizare', icon: <MonitorDot className="h-4 w-4 mr-2" />, path: '/bpm/monitoring' },
    { id: 'scheduler', label: 'Programator', icon: <Calendar className="h-4 w-4 mr-2" />, path: '/bpm/scheduler' },
  ];
  
  const handleTabChange = (value: string) => {
    const tab = tabs.find(t => t.id === value);
    if (tab) {
      navigate(tab.path);
    }
  };
  
  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-3 md:grid-cols-7 h-auto">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                {tab.icon}
                <span className="hidden md:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <div className={className}>
          {children}
        </div>
        
        {/* Integrare cu modulul de colaborare */}
        <CollabIntegration moduleContext="BPM" enableTasks={true} enableCommunity={true} />
      </div>
    </AppLayout>
  );
}