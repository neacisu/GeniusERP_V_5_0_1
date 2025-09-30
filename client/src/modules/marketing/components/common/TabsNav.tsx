/**
 * Marketing Module Tabs Navigation Component
 * 
 * Navigation tabs component for switching between different sections
 * of a marketing page or entity details.
 */

import React from "react";
import { useLocation } from "wouter";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";

export interface TabItem {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
}

interface TabsNavProps {
  tabs: TabItem[];
  items?: TabItem[]; // Alternative property name for better compatibility
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

export const TabsNav: React.FC<TabsNavProps> = ({
  tabs: propTabs,
  items: propItems,
  defaultValue,
  value,
  onChange,
  className = "",
  children,
  fullWidth = true,
}) => {
  const [_, navigate] = useLocation();
  // Use either tabs or items prop
  const tabs = propTabs || propItems || [];
  
  // Create default value from first tab if not provided
  const defaultTab = defaultValue || (tabs.length > 0 ? tabs[0].id : "");
  
  const handleTabChange = (value: string) => {
    const selectedTab = tabs.find(tab => tab.id === value);
    
    if (onChange) {
      onChange(value);
    }
    
    if (selectedTab?.href) {
      navigate(selectedTab.href);
    }
  };
  
  return (
    <Tabs
      defaultValue={defaultTab}
      value={value}
      onValueChange={handleTabChange}
      className={className}
    >
      <TabsList className={fullWidth ? "w-full grid" : ""} 
        style={fullWidth ? { gridTemplateColumns: `repeat(${tabs.length}, 1fr)` } : undefined}
      >
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.id} 
            value={tab.id}
            disabled={tab.disabled}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {/* If children are provided, render them wrapped in TabsContent */}
      {children && (
        <TabsContent value={value || defaultTab} className="mt-4">
          {children}
        </TabsContent>
      )}
    </Tabs>
  );
};

export default TabsNav;