/**
 * E-commerce Module Layout
 * 
 * This component provides a consistent layout for all e-commerce pages,
 * including tabs navigation and common UI elements.
 */

import React from 'react';
import { useLocation } from 'wouter';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  ShoppingCart,
  Package,
  BarChart2,
  Settings,
  Store,
  Users,
  Tag,
  Truck,
  Link
} from 'lucide-react';
import CollabIntegration from '../../../collab/components/CollabIntegration';

interface EcommerceModuleLayoutProps {
  children: React.ReactNode;
  activeTab: string;
}

export function EcommerceModuleLayout({ children, activeTab }: EcommerceModuleLayoutProps) {
  const [, setLocation] = useLocation();
  
  const handleTabChange = (value: string) => {
    switch (value) {
      case 'dashboard':
        setLocation('/ecommerce');
        break;
      case 'orders':
        setLocation('/ecommerce/orders');
        break;
      case 'products':
        setLocation('/ecommerce/products');
        break;
      case 'shop':
        setLocation('/ecommerce/shop');
        break;
      case 'customers':
        setLocation('/ecommerce/customers');
        break;
      case 'discounts':
        setLocation('/ecommerce/discounts');
        break;
      case 'analytics':
        setLocation('/ecommerce/analytics');
        break;
      case 'fulfillment':
        setLocation('/ecommerce/fulfillment');
        break;
      case 'integrations':
        setLocation('/ecommerce/integrations/shopify');
        break;
      case 'settings':
        setLocation('/ecommerce/settings');
        break;
      default:
        setLocation('/ecommerce');
    }
  };
  
  return (
    <div className="container py-6 space-y-6">
      <Card>
        <CardContent className="p-0">
          <Tabs
            defaultValue={activeTab}
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 md:grid-cols-10 lg:grid-cols-10 w-full bg-muted/50 p-1 h-auto">
              <TabsTrigger
                value="dashboard"
                className="flex items-center data-[state=active]:bg-background rounded-sm px-3 py-2"
              >
                <BarChart2 className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="flex items-center data-[state=active]:bg-background rounded-sm px-3 py-2"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Comenzi</span>
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="flex items-center data-[state=active]:bg-background rounded-sm px-3 py-2"
              >
                <Package className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Produse</span>
              </TabsTrigger>
              <TabsTrigger
                value="shop"
                className="flex items-center data-[state=active]:bg-background rounded-sm px-3 py-2"
              >
                <Store className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Magazin</span>
              </TabsTrigger>
              <TabsTrigger
                value="customers"
                className="flex items-center data-[state=active]:bg-background rounded-sm px-3 py-2"
              >
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Clienți</span>
              </TabsTrigger>
              <TabsTrigger
                value="discounts"
                className="flex items-center data-[state=active]:bg-background rounded-sm px-3 py-2"
              >
                <Tag className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Promoții</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex items-center data-[state=active]:bg-background rounded-sm px-3 py-2"
              >
                <BarChart2 className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Analiză</span>
              </TabsTrigger>
              <TabsTrigger
                value="fulfillment"
                className="flex items-center data-[state=active]:bg-background rounded-sm px-3 py-2"
              >
                <Truck className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Livrare</span>
              </TabsTrigger>
              <TabsTrigger
                value="integrations"
                className="flex items-center data-[state=active]:bg-background rounded-sm px-3 py-2"
              >
                <Link className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Integrări</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center data-[state=active]:bg-background rounded-sm px-3 py-2"
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Setări</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>
      
      <div>
        {children}
        
        {/* Integrare cu modulul de colaborare */}
        <CollabIntegration 
          moduleContext="Ecommerce" 
          enableTasks={true} 
          enableCommunity={true} 
        />
      </div>
    </div>
  );
}