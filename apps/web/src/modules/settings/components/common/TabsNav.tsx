/**
 * Tabs Navigation Component
 * 
 * Renders a tabbed navigation with icons for settings pages.
 */

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface TabsNavProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (value: string) => void;
}

const TabsNav: React.FC<TabsNavProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <Tabs value={activeTab} onValueChange={onChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default TabsNav;