/**
 * Page Header Component
 * 
 * Renders a consistent page header with title, description, breadcrumbs, and optional actions.
 */

import React from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";

export interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  breadcrumbs = [], 
  actions 
}) => {
  const hasBreads = breadcrumbs && breadcrumbs.length > 0;
  
  return (
    <div className="flex flex-col space-y-2">
      {hasBreads && (
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">
                  <Home className="h-4 w-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/settings">
                  Setări
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            {breadcrumbs.map((crumb, index) => [
              <BreadcrumbSeparator key={`sep-${index}`}>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>,
              <BreadcrumbItem key={`item-${index}`}>
                {crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>
                      {crumb.title}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="text-muted-foreground">{crumb.title}</span>
                )}
              </BreadcrumbItem>
            ])}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;