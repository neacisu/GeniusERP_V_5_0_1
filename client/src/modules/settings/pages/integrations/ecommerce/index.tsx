/**
 * E-commerce Integrations Page
 * 
 * Manages integrations with e-commerce platforms like Shopify, WooCommerce, etc.
 */

import React from "react";
import { ShoppingCart, Link, ExternalLink, Truck, ShoppingBag, BarChart, Settings, Package, Store, RefreshCw, CheckCircle2, AlertCircle, FileQuestion, FileWarning, Upload, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

import PageHeader from "../../../components/common/PageHeader";
import SettingCard from "../../../components/cards/SettingCard";
import IntegrationCard from "../../../components/cards/IntegrationCard";
import ConfigureIntegrationModal from "../../../components/modals/ConfigureIntegrationModal";
import { IntegrationProvider, IntegrationStatus } from "../../../hooks/integrations/useIntegrations";

export default function EcommercePage() {
  const [configureModalOpen, setConfigureModalOpen] = React.useState(false);
  const [selectedIntegration, setSelectedIntegration] = React.useState<{
    provider: IntegrationProvider;
    title: string;
    description: string;
    config?: Record<string, any>;
  } | null>(null);

  // Mock data for e-commerce integrations
  const ecommerceIntegrations = [
    {
      provider: IntegrationProvider.SHOPIFY as IntegrationProvider,
      title: "Shopify",
      description: "Conectați magazinul Shopify pentru sincronizarea produselor, comenzilor și inventarului.",
      icon: ShoppingBag,
      status: IntegrationStatus.INACTIVE
    },
    {
      provider: IntegrationProvider.WOOCOMMERCE as IntegrationProvider,
      title: "WooCommerce",
      description: "Integrare cu platforma WooCommerce pentru magazine pe WordPress.",
      icon: Store,
      status: IntegrationStatus.INACTIVE
    },
    {
      provider: IntegrationProvider.CUSTOM_ECOMMERCE as IntegrationProvider,
      title: "Magazin personalizat",
      description: "Conectați un magazin personalizat prin API pentru sincronizare bidirectională.",
      icon: ShoppingCart,
      status: IntegrationStatus.INACTIVE
    }
  ];

  // Mock data for recent products
  const recentProducts = [
    { id: "P001", name: "Laptop Dell Inspiron", sku: "DELL-INS-15", price: "3299.99 RON", stock: 12, synced: true, lastSynced: "2025-04-10" },
    { id: "P002", name: "Monitor LG UltraWide", sku: "LG-UW-34", price: "1799.00 RON", stock: 5, synced: true, lastSynced: "2025-04-10" },
    { id: "P003", name: "Tastatură mecanică Logitech", sku: "LOG-KB-M", price: "499.50 RON", stock: 20, synced: false, lastSynced: "2025-04-05" }
  ];

  // Mock data for recent orders
  const recentOrders = [
    { id: "ORD-2025-001", customer: "Alexandru Popescu", date: "2025-04-11", total: "4599.99 RON", status: "completed", platform: "shopify" },
    { id: "ORD-2025-002", customer: "Maria Ionescu", date: "2025-04-10", total: "2299.00 RON", status: "processing", platform: "woocommerce" },
    { id: "ORD-2025-003", customer: "Ioan Dumitrescu", date: "2025-04-09", total: "899.50 RON", status: "pending", platform: "shopify" }
  ];

  const handleConfigureIntegration = (integration: typeof selectedIntegration) => {
    setSelectedIntegration(integration);
    setConfigureModalOpen(true);
  };

  const handleSaveConfiguration = (config: Record<string, any>) => {
    console.log('Saving configuration:', config);
    // Here you would call a mutation to save the integration
    setConfigureModalOpen(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Format order status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">Finalizată</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">În procesare</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">În așteptare</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200">Anulată</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get platform badge
  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'shopify':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">Shopify</Badge>;
      case 'woocommerce':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200">WooCommerce</Badge>;
      default:
        return <Badge variant="outline">{platform}</Badge>;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Integrări E-commerce"
        description="Conectați platforme de e-commerce pentru sincronizarea produselor, comenzilor și inventarului."
        breadcrumbs={[
          { title: "Setări", href: "/settings" },
          { title: "Integrări", href: "/settings/integrations" },
          { title: "E-commerce" }
        ]}
      />

      <Tabs defaultValue="providers">
        <TabsList className="mb-6">
          <TabsTrigger value="providers">Platforme</TabsTrigger>
          <TabsTrigger value="products">Produse</TabsTrigger>
          <TabsTrigger value="orders">Comenzi</TabsTrigger>
          <TabsTrigger value="sync">Sincronizare</TabsTrigger>
          <TabsTrigger value="settings">Setări</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ecommerceIntegrations.map((integration, index) => (
              <IntegrationCard
                key={index}
                title={integration.title}
                description={integration.description}
                icon={integration.icon}
                status={integration.status}
                onConfigure={() => handleConfigureIntegration(integration)}
              />
            ))}
          </div>

          <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Informație</AlertTitle>
            <AlertDescription>
              Integrarea cu platforme de e-commerce vă permite să gestionați produsele, comenzile și stocul în mod centralizat.
              Verificați documentația fiecărei platforme pentru informații despre API și permisiuni necesare.
            </AlertDescription>
          </Alert>

          <SettingCard
            title="Beneficii integrare E-commerce"
            description="Avantajele conectării platformelor de e-commerce cu sistemul."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <RefreshCw className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Sincronizare automată</h3>
                  <p className="text-sm text-muted-foreground">Actualizări automate de produse, stoc și comenzi.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Gestionare centralizată</h3>
                  <p className="text-sm text-muted-foreground">Administrați toate magazinele din aceeași interfață.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <Truck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Urmărire livrări</h3>
                  <p className="text-sm text-muted-foreground">Monitorizați statusul livrărilor și tracking.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <BarChart className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Rapoarte unificate</h3>
                  <p className="text-sm text-muted-foreground">Statistici și analize din toate platformele.</p>
                </div>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <SettingCard
            title="Produse sincronizate"
            description="Produse importate din magazinele online conectate."
          >
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Sincronizează produse
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportă listă
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtru sincronizare" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate produsele</SelectItem>
                      <SelectItem value="synced">Sincronizate</SelectItem>
                      <SelectItem value="not_synced">Nesincronizate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Produs</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Preț</TableHead>
                      <TableHead>Stoc</TableHead>
                      <TableHead>Ultima sincronizare</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentProducts.length > 0 ? (
                      recentProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.synced 
                              ? <CheckCircle2 className="h-4 w-4 text-green-500" /> 
                              : <FileWarning className="h-4 w-4 text-amber-500" />}
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.sku}</TableCell>
                          <TableCell>{product.price}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>{product.synced ? formatDate(product.lastSynced) : "Niciodată"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Editează</span>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nu există produse sincronizate.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </SettingCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total produse</CardTitle>
                <CardDescription>În toate magazinele</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Produse sincronizate</CardTitle>
                <CardDescription>% din total produse</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">67%</div>
                <Progress value={67} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Erori sincronizare</CardTitle>
                <CardDescription>Produse cu erori</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <SettingCard
            title="Comenzi sincronizate"
            description="Comenzi importate din magazinele online conectate."
          >
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Importă comenzi
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportă comenzi
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtru status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate statusurile</SelectItem>
                      <SelectItem value="completed">Finalizate</SelectItem>
                      <SelectItem value="processing">În procesare</SelectItem>
                      <SelectItem value="pending">În așteptare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Comandă</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Platformă</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{order.customer}</TableCell>
                          <TableCell>{formatDate(order.date)}</TableCell>
                          <TableCell>{order.total}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>{getPlatformBadge(order.platform)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Detalii</span>
                              <FileQuestion className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nu există comenzi sincronizate.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </SettingCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total comenzi</CardTitle>
                <CardDescription>Ultimele 30 zile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Valoare comenzi</CardTitle>
                <CardDescription>Ultimele 30 zile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7.798,49 RON</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Comenzi în așteptare</CardTitle>
                <CardDescription>Necesită procesare</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <SettingCard
            title="Configurare sincronizare"
            description="Configurați modul de sincronizare între platformele de e-commerce și sistem."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Sincronizare automată</h3>
                  <p className="text-sm text-muted-foreground">Actualizează automat datele între sisteme</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Interval sincronizare</h3>
                  <p className="text-sm text-muted-foreground">Cât de des se sincronizează datele</p>
                </div>
                <Select defaultValue="15">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Selectează interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minute</SelectItem>
                    <SelectItem value="15">15 minute</SelectItem>
                    <SelectItem value="30">30 minute</SelectItem>
                    <SelectItem value="60">60 minute</SelectItem>
                    <SelectItem value="120">2 ore</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Notificări erori</h3>
                  <p className="text-sm text-muted-foreground">Notifică despre problemele de sincronizare</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Webhook pentru comenzi noi</h3>
                  <p className="text-sm text-muted-foreground">Actualizează imediat la comandă nouă</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Sincronizare bidirecțională</h3>
                  <p className="text-sm text-muted-foreground">Permite modificări în ambele direcții</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="pt-4 border-t mt-2">
                <div className="flex justify-between">
                  <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sincronizare manuală
                  </Button>
                  <Button variant="outline">
                    Jurnal sincronizare
                  </Button>
                </div>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title="Ultimele sincronizări"
            description="Istoricul sincronizărilor recente între sisteme."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/10">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Sincronizare produse reușită</p>
                    <p className="text-xs text-muted-foreground">{formatDate("2025-04-12")}, 09:30</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Shopify</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/10">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Sincronizare comenzi reușită</p>
                    <p className="text-xs text-muted-foreground">{formatDate("2025-04-12")}, 09:15</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Shopify</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/10">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">Avertisment: 1 produs cu date incomplete</p>
                    <p className="text-xs text-muted-foreground">{formatDate("2025-04-11")}, 14:22</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">WooCommerce</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/10">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Sincronizare produse reușită</p>
                    <p className="text-xs text-muted-foreground">{formatDate("2025-04-11")}, 09:30</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">WooCommerce</Badge>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingCard
            title="Setări generale E-commerce"
            description="Configurați comportamentul general al integrărilor de e-commerce."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Transformare comenzi în facturi</h3>
                  <p className="text-sm text-muted-foreground">Generează automat facturi pentru comenzi</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Preluare automată stoc</h3>
                  <p className="text-sm text-muted-foreground">Actualizează stocul în magazin din ERP</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Actualizare prețuri</h3>
                  <p className="text-sm text-muted-foreground">Actualizează prețurile în magazin din ERP</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Sincronizare clienți</h3>
                  <p className="text-sm text-muted-foreground">Importă clienții în CRM</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="border-t pt-3 mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Monedă implicită</h3>
                    <p className="text-sm text-muted-foreground">Moneda folosită pentru produse și comenzi</p>
                  </div>
                  <Select defaultValue="RON">
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Selectează moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RON">RON</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">TVA implicit</h3>
                  <p className="text-sm text-muted-foreground">Valoarea implicită TVA pentru produse noi</p>
                </div>
                <Select defaultValue="19">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Selectează TVA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="9">9%</SelectItem>
                    <SelectItem value="19">19%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title="Categorizare produse"
            description="Gestionați modul de sincronizare a categoriilor de produse."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Sincronizare categorii</h3>
                  <p className="text-sm text-muted-foreground">Importă și exportă categorii de produse</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Mapare personalizată categorii</h3>
                  <p className="text-sm text-muted-foreground">Definește relații între categorii în sisteme diferite</p>
                </div>
                <Button variant="outline" size="sm">
                  Configurare
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Actualizare categorii</h3>
                  <p className="text-sm text-muted-foreground">Frecvența actualizării categoriilor</p>
                </div>
                <Select defaultValue="daily">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Selectează frecvența" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">La fiecare oră</SelectItem>
                    <SelectItem value="daily">Zilnic</SelectItem>
                    <SelectItem value="weekly">Săptămânal</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SettingCard>
        </TabsContent>
      </Tabs>

      {/* Configure Integration Modal */}
      {selectedIntegration && (
        <ConfigureIntegrationModal
          open={configureModalOpen}
          onClose={() => setConfigureModalOpen(false)}
          onSave={handleSaveConfiguration}
          provider={selectedIntegration.provider}
          title={`Configurare ${selectedIntegration.title}`}
          description={`Configurați integrarea cu ${selectedIntegration.title}.`}
          currentConfig={selectedIntegration.config}
        />
      )}
    </div>
  );
}