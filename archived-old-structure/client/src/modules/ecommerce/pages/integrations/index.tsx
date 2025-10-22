/**
 * E-commerce Integrations Hub
 * 
 * This page provides a central location for managing all e-commerce integrations
 * with third-party platforms and services.
 */

import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { EcommerceModuleLayout } from '../../components/common/EcommerceModuleLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Store, ArrowRight, ExternalLink } from "lucide-react";

export default function IntegrationsIndexPage() {
  const [location, setLocation] = useLocation();
  
  // If we're at the root integrations page, redirect to Shopify integration
  useEffect(() => {
    if (location === '/ecommerce/integrations') {
      setLocation('/ecommerce/integrations/shopify');
    }
  }, [location, setLocation]);
  
  return (
    <EcommerceModuleLayout activeTab="integrations">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Integrări E-commerce</h1>
            <p className="text-muted-foreground">Conectați magazinul dvs. online cu platforme externe populare</p>
          </div>
        </div>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Store className="h-5 w-5 mr-2 text-blue-500" />
                  Shopify
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/ecommerce/integrations/shopify">
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <CardDescription>Sincronizați produse, comenzi și clienți cu magazinul Shopify</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Integrarea permite sincronizarea bidirecțională a datelor între ERPify și platforma Shopify.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/ecommerce/integrations/shopify">
                  Configurare Shopify
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <ExternalLink className="h-5 w-5 mr-2 text-purple-500" />
                  WooCommerce
                </CardTitle>
                <Button variant="ghost" size="sm" disabled>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Integrare cu plugin-ul WooCommerce WordPress</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                În curând - Conectați magazinul WooCommerce cu ERPify pentru sincronizare bidirecțională.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm" className="w-full" disabled>
                În curând
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <ExternalLink className="h-5 w-5 mr-2 text-orange-500" />
                  Marketplace
                </CardTitle>
                <Button variant="ghost" size="sm" disabled>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Integrare cu alte platforme de tip marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                În curând - Conectați-vă la diverse marketplace-uri precum eMAG, Amazon sau alte platforme.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm" className="w-full" disabled>
                În curând
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </EcommerceModuleLayout>
  );
}