/**
 * TabsNav Component
 * 
 * A reusable component for in-page tab navigation in the inventory module.
 */

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

interface TabsNavProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

const TabsNav: React.FC<TabsNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className={cn("w-full", className)}
    >
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            className="text-sm"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default TabsNav;