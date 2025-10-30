/**
 * Sales Module Layout Component
 * 
 * Common layout for all sales module pages with consistent header and structure.
 */

import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from '@/components/ui/button';
import {
  FileText,
  FileSpreadsheet,
  FileCheck,
  TrendingUp,
  BarChart,
  Users,
  Settings,
  Building,
  ShoppingBag
} from 'lucide-react';

interface SalesModuleLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

const SalesModuleLayout: React.FC<SalesModuleLayoutProps> = ({
  children,
  title,
  description
}) => {
  const [location] = useLocation();
  
  // Helper to check if a link is active
  const isActive = (path: string) => {
    const currentPath = location.split('/').slice(0, 3).join('/');
    const linkPath = path.split('/').slice(0, 3).join('/');
    return currentPath === linkPath;
  };
  
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      <div className="border-b pb-2">
        <NavigationMenu>
          <NavigationMenuList className="space-x-2">
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={`${navigationMenuTriggerStyle()} ${isActive('/sales/overview') ? 'bg-secondary' : ''}`}
                onClick={() => window.location.href = '/sales/overview'}
              >
                <BarChart className="h-4 w-4 mr-2" />
                Sumar
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={`${navigationMenuTriggerStyle()} ${isActive('/sales/deals') ? 'bg-secondary' : ''}`}
                onClick={() => window.location.href = '/sales/deals'}
              >
                <FileText className="h-4 w-4 mr-2" />
                Contracte
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={`${navigationMenuTriggerStyle()} ${isActive('/sales/opportunities') ? 'bg-secondary' : ''}`}
                onClick={() => window.location.href = '/sales/opportunities'}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Oportunități
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={`${navigationMenuTriggerStyle()} ${isActive('/sales/quotes') ? 'bg-secondary' : ''}`}
                onClick={() => window.location.href = '/sales/quotes'}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Oferte
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={`${navigationMenuTriggerStyle()} ${isActive('/sales/customers') ? 'bg-secondary' : ''}`}
                onClick={() => window.location.href = '/sales/customers'}
              >
                <Users className="h-4 w-4 mr-2" />
                Clienți
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={`${navigationMenuTriggerStyle()} ${isActive('/sales/pipeline') ? 'bg-secondary' : ''}`}
                onClick={() => window.location.href = '/sales/pipeline'}
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Pipeline
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={`${navigationMenuTriggerStyle()} ${isActive('/sales/products') ? 'bg-secondary' : ''}`}
                onClick={() => window.location.href = '/sales/products'}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Produse
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default SalesModuleLayout;