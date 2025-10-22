/**
 * Tabs Navigation Component
 * 
 * A reusable tabs navigation component for in-page tabbed interfaces.
 */

import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsNavProps {
  tabs?: TabItem[];
  items?: TabItem[]; // Alias for 'tabs' pentru compatibilitate
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const TabsNav: React.FC<TabsNavProps> = ({
  tabs,
  items,
  activeTab,
  onTabChange,
  className,
}) => {
  // Folosim tabs sau items (items are prioritate dacă ambele sunt furnizate)
  const tabsToRender = items || tabs || [];
  return (
    <div className={cn("flex space-x-1 overflow-x-auto border-b", className)}>
      {tabsToRender.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center whitespace-nowrap px-3 py-2 text-sm font-medium transition-all",
            activeTab === tab.id
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                "ml-2 flex h-5 w-5 items-center justify-center rounded-full text-xs",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default TabsNav;