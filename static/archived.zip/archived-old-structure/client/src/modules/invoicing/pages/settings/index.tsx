/**
 * Invoice Settings Page
 * 
 * Configure invoicing module settings including numbering, defaults, and fiscal settings.
 */

import React, { useState } from "react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Lucide icons
import { Save, RefreshCw } from "lucide-react";

// Custom components
import PageHeader from "../../components/common/PageHeader";
import { InvoiceNumberingSettings } from "../../components/settings/InvoiceNumberingSettings";

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("general");

  const handleSaveSettings = () => {
    // Save settings implementation
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Setări facturare" 
        description="Configurează modulul de facturare"
      />

      <Tabs 
        defaultValue="general" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-5"
      >
        <TabsList className="grid grid-cols-4 sm:grid-cols-5 max-w-4xl">
          <TabsTrigger value="general">Generale</TabsTrigger>
          <TabsTrigger value="numbering">Numerotare</TabsTrigger>
          <TabsTrigger value="taxes">Fiscale</TabsTrigger>
          <TabsTrigger value="templates">Șabloane</TabsTrigger>
          <TabsTrigger value="notifications" className="hidden sm:block">Notificări</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Setări generale</CardTitle>
              <CardDescription>
                Configurări generale pentru modulul de facturare
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-send" className="font-medium">Trimite facturi automat</Label>
                    <p className="text-sm text-muted-foreground">
                      Trimite automat facturile prin email după creare
                    </p>
                  </div>
                  <Switch id="auto-send" />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-remind" className="font-medium">Trimite reamintiri automate</Label>
                    <p className="text-sm text-muted-foreground">
                      Trimite reamintiri automate pentru facturile restante
                    </p>
                  </div>
                  <Switch id="auto-remind" />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-archive" className="font-medium">Arhivare automată</Label>
                    <p className="text-sm text-muted-foreground">
                      Arhivează automat facturile plătite după 30 de zile
                    </p>
                  </div>
                  <Switch id="auto-archive" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Informații companie</CardTitle>
              <CardDescription>
                Informațiile companiei care vor apărea pe facturi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nume companie</Label>
                  <Input id="company-name" placeholder="Nume companie" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-cui">CUI / CIF</Label>
                  <Input id="company-cui" placeholder="CUI / CIF" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-reg">Nr. Registrul Comerțului</Label>
                  <Input id="company-reg" placeholder="J12/123/2020" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Adresă</Label>
                  <Input id="company-address" placeholder="Adresa companiei" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="numbering">
          <InvoiceNumberingSettings />
        </TabsContent>
        
        <TabsContent value="taxes">
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Pagină în dezvoltare</h3>
            <p className="text-muted-foreground">
              Această secțiune va fi disponibilă în curând.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="templates">
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Pagină în dezvoltare</h3>
            <p className="text-muted-foreground">
              Această secțiune va fi disponibilă în curând.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications">
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Pagină în dezvoltare</h3>
            <p className="text-muted-foreground">
              Această secțiune va fi disponibilă în curând.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end space-x-4">
        <Button variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Resetează
        </Button>
        <Button onClick={handleSaveSettings} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Salvează setări
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;