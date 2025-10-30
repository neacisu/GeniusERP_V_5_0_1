/**
 * Layout pentru paginile modulului AI
 * 
 * Acest component oferă un layout consistent pentru toate paginile
 * din modulul AI, incluzând header, toolbar și container pentru conținut.
 */

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/layout/AppLayout";
import { Link } from "wouter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CollabIntegration from "../../../collab/components/CollabIntegration";

interface AIModuleLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  toolbarItems?: ReactNode;
  className?: string;
  tabs?: Array<{ value: string; label: string; href: string }>;
  activeTab?: string;
}

export function AIModuleLayout({
  title,
  description,
  children,
  toolbarItems,
  className,
  tabs,
  activeTab,
}: AIModuleLayoutProps) {
  return (
    <AppLayout>
      <div className={cn("space-y-6", className)}>
        <div className="flex flex-col space-y-2 xl:flex-row xl:items-center xl:justify-between xl:space-y-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            {description && (
              <p className="text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          
          {toolbarItems && (
            <div className="flex items-center space-x-2">
              {toolbarItems}
            </div>
          )}
        </div>
        
        {tabs && tabs.length > 0 && (
          <Tabs value={activeTab} className="w-full">
            <TabsList className="w-full md:w-auto">
              {tabs.map((tab) => (
                <Link key={tab.value} href={tab.href}>
                  <TabsTrigger value={tab.value}>{tab.label}</TabsTrigger>
                </Link>
              ))}
            </TabsList>
          </Tabs>
        )}
        
        <div>
          {children}
        </div>
      </div>
      
      {/* Integrare cu modulul de colaborare */}
      <CollabIntegration moduleContext="AI" enableTasks={true} enableCommunity={true} />
    </AppLayout>
  );
}