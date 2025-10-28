/**
 * Shopify Integration Page
 * 
 * This page provides integration and synchronization capabilities
 * between the ERP system and a Shopify online store.
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  Store,
  ArrowRightLeft,
  Settings,
  Key,
  Clock,
  Database,
  ShoppingCart,
  Tags,
  Users,
  BarChart3,
  FileCode,
  Download,
  History,
  InfoIcon,
  HelpCircle,
  ExternalLink,
  FilterX,
  Eye
} from 'lucide-react';

export default function ShopifyIntegrationPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [connectionStatus, setConnectionStatus] = useState('connected'); // connected, error, disconnected
  const [syncInProgress, setSyncInProgress] = useState(false);
  
  // Test connection credentials - in a real app, these would be fetched from the server
  const credentials = {
    shop: 'your-store.myshopify.com',
    apiKey: '••••••••••••••••',
    apiSecret: '••••••••••••••••••••••••••••••••',
    accessToken: '••••••••••••••••••••••••••••••••••••••••••••••••••',
    scopes: 'read_products,write_products,read_orders,write_orders,read_customers,write_customers'
  };
  
  // Sync stats and history
  const syncStats = {
    lastSync: '11 Apr 2025 15:42',
    nextScheduledSync: '11 Apr 2025 18:00',
    syncInterval: '2 hours',
    productsCount: 427,
    ordersCount: 582,
    customersCount: 485
  };
  
  const syncHistory = [
    { id: 'sync-001', date: '11 Apr 2025 15:42', duration: '128s', status: 'success', items: { products: 12, orders: 18, customers: 5 } },
    { id: 'sync-002', date: '11 Apr 2025 13:42', duration: '115s', status: 'success', items: { products: 8, orders: 15, customers: 3 } },
    { id: 'sync-003', date: '11 Apr 2025 11:42', duration: '99s', status: 'success', items: { products: 5, orders: 12, customers: 4 } },
    { id: 'sync-004', date: '11 Apr 2025 09:42', duration: '132s', status: 'error', items: { products: 0, orders: 0, customers: 0 } },
    { id: 'sync-005', date: '11 Apr 2025 07:42', duration: '108s', status: 'success', items: { products: 3, orders: 9, customers: 2 } },
  ];
  
  // Get status badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Reușit</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Eroare</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Avertisment</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">În curs</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };

  // Connection status alert
  const renderConnectionAlert = () => {
    if (connectionStatus === 'connected') {
      return (
        <Alert className="bg-green-50 border-green-200 mb-6">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Conectare reușită!</AlertTitle>
          <AlertDescription className="text-green-700">
            Magazinul Shopify este conectat și funcționează corect.
          </AlertDescription>
        </Alert>
      );
    } else if (connectionStatus === 'error') {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Eroare de conectare</AlertTitle>
          <AlertDescription>
            Nu s-a putut conecta la magazinul Shopify. Verificați credențialele și permisiunile.
          </AlertDescription>
        </Alert>
      );
    } else {
      return (
        <Alert className="bg-yellow-50 border-yellow-200 mb-6">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Neconectat</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Integrarea Shopify nu este configurată. Adăugați credențialele pentru a începe.
          </AlertDescription>
        </Alert>
      );
    }
  };
  
  const handleStartSync = () => {
    setSyncInProgress(true);
    
    // Simulate sync process - in real implementation, this would call the backend API
    setTimeout(() => {
      setSyncInProgress(false);
    }, 5000);
  };
  
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Integrare Shopify</h1>
            <p className="text-muted-foreground">Sincronizarea datelor între magazinul Shopify și ERP</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <HelpCircle className="mr-2 h-4 w-4" />
              Documentație
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleStartSync}
              disabled={syncInProgress || connectionStatus !== 'connected'}
            >
              {syncInProgress ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizare în curs...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Sincronizare Manuală
                </>
              )}
            </Button>
          </div>
        </div>
        
        {renderConnectionAlert()}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="settings">Setări Conectare</TabsTrigger>
            <TabsTrigger value="mapping">Mapare Date</TabsTrigger>
            <TabsTrigger value="logs">Istoric & Logs</TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Store className="h-4 w-4 mr-2" />
                    Magazin Conectat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{credentials.shop}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    Activ și funcțional
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Ultima Sincronizare
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{syncStats.lastSync}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Următoarea sincronizare: {syncStats.nextScheduledSync}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    Elemente Sincronizate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">1,494 total</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {syncStats.productsCount} produse, {syncStats.ordersCount} comenzi, {syncStats.customersCount} clienți
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Activitate Recentă</CardTitle>
                  <CardDescription>
                    Ultimele sincronizări și modificări
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sincronizare</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Elemente Sincronizate</TableHead>
                          <TableHead>Durată</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {syncHistory.map((sync) => (
                          <TableRow key={sync.id}>
                            <TableCell className="font-medium">{sync.id}</TableCell>
                            <TableCell>{sync.date}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs">Produse: {sync.items.products}</span>
                                <span className="text-xs">Comenzi: {sync.items.orders}</span>
                                <span className="text-xs">Clienți: {sync.items.customers}</span>
                              </div>
                            </TableCell>
                            <TableCell>{sync.duration}</TableCell>
                            <TableCell>{getStatusBadge(sync.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full">
                    <History className="mr-2 h-4 w-4" />
                    Vezi tot istoricul
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Stare Integrare</CardTitle>
                  <CardDescription>
                    Starea sincronizării pe tipuri de date
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Tags className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="text-sm font-medium">Produse</span>
                        </div>
                        <Badge variant="outline" className="text-xs">Activ</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Ultima sincronizare acum 18 minute</span>
                        <span className="text-blue-600">427/427</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <ShoppingCart className="h-4 w-4 mr-2 text-green-500" />
                          <span className="text-sm font-medium">Comenzi</span>
                        </div>
                        <Badge variant="outline" className="text-xs">Activ</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Ultima sincronizare acum 18 minute</span>
                        <span className="text-green-600">582/582</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-purple-500" />
                          <span className="text-sm font-medium">Clienți</span>
                        </div>
                        <Badge variant="outline" className="text-xs">Activ</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Ultima sincronizare acum 18 minute</span>
                        <span className="text-purple-600">485/485</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <BarChart3 className="h-4 w-4 mr-2 text-orange-500" />
                          <span className="text-sm font-medium">Statistici</span>
                        </div>
                        <Badge variant="outline" className="text-xs">Activ</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Ultima sincronizare acum 3 ore</span>
                        <span className="text-orange-600">100%</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Informații despre Magazinul Shopify</CardTitle>
                <CardDescription>
                  Detalii despre magazinul conectat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Detalii Magazin</h3>
                    <p className="text-sm">Nume: My Shopify Store</p>
                    <p className="text-sm">URL: {credentials.shop}</p>
                    <p className="text-sm">Plan: Advanced Shopify</p>
                    <p className="text-sm">Versiune API: 2023-07</p>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Statistici</h3>
                    <p className="text-sm">Produse: 427</p>
                    <p className="text-sm">Colecții: 24</p>
                    <p className="text-sm">Comenzi (30 zile): 215</p>
                    <p className="text-sm">Vânzări (30 zile): 68,420 RON</p>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Setări Sincronizare</h3>
                    <p className="text-sm">Frecvență: La fiecare {syncStats.syncInterval}</p>
                    <p className="text-sm">Automatizată: Da</p>
                    <p className="text-sm">Webhook-uri: Active</p>
                    <p className="text-sm">Rate limiter: Activat</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex items-center justify-between w-full">
                  <Button variant="outline" className="text-sm" size="sm">
                    <Store className="h-4 w-4 mr-2" />
                    <span>Deschide Shopify Admin</span>
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                  <Button variant="outline" className="text-sm" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurare avansată
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Setări Conectare Shopify</CardTitle>
                <CardDescription>
                  Configurați credențialele pentru conectarea la magazinul Shopify
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="shop-url" className="text-right">
                      Magazin URL
                    </Label>
                    <Input
                      id="shop-url"
                      defaultValue={credentials.shop}
                      className="col-span-3"
                      placeholder="your-store.myshopify.com"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="api-key" className="text-right">
                      API Key
                    </Label>
                    <Input
                      id="api-key"
                      type="password"
                      defaultValue={credentials.apiKey}
                      className="col-span-3"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="api-secret" className="text-right">
                      API Secret
                    </Label>
                    <Input
                      id="api-secret"
                      type="password"
                      defaultValue={credentials.apiSecret}
                      className="col-span-3"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="access-token" className="text-right">
                      Access Token
                    </Label>
                    <Input
                      id="access-token"
                      type="password"
                      defaultValue={credentials.accessToken}
                      className="col-span-3"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">
                      API Permisiuni
                    </Label>
                    <div className="col-span-3 grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="read-products" defaultChecked />
                        <label
                          htmlFor="read-products"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Citire Produse
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="write-products" defaultChecked />
                        <label
                          htmlFor="write-products"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Scriere Produse
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="read-orders" defaultChecked />
                        <label
                          htmlFor="read-orders"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Citire Comenzi
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="write-orders" defaultChecked />
                        <label
                          htmlFor="write-orders"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Scriere Comenzi
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="read-customers" defaultChecked />
                        <label
                          htmlFor="read-customers"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Citire Clienți
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="write-customers" defaultChecked />
                        <label
                          htmlFor="write-customers"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Scriere Clienți
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <div className="flex justify-between w-full">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setConnectionStatus('connected');
                    }}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Testează Conexiunea
                  </Button>
                  <Button variant="default">
                    Salvează Configurația
                  </Button>
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Setări Sincronizare</CardTitle>
                <CardDescription>
                  Configurați când și cum se sincronizează datele
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sync-interval" className="text-right">
                      Interval Sincronizare
                    </Label>
                    <Select defaultValue="2h">
                      <SelectTrigger id="sync-interval" className="col-span-3">
                        <SelectValue placeholder="Selectează intervalul" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30m">La fiecare 30 minute</SelectItem>
                        <SelectItem value="1h">La fiecare oră</SelectItem>
                        <SelectItem value="2h">La fiecare 2 ore</SelectItem>
                        <SelectItem value="4h">La fiecare 4 ore</SelectItem>
                        <SelectItem value="8h">La fiecare 8 ore</SelectItem>
                        <SelectItem value="12h">La fiecare 12 ore</SelectItem>
                        <SelectItem value="24h">Zilnic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Sincronizare Automată</Label>
                    <div className="flex items-center space-x-2 col-span-3">
                      <Switch id="auto-sync" defaultChecked />
                      <Label htmlFor="auto-sync">Activată</Label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Webhook-uri</Label>
                    <div className="flex items-center space-x-2 col-span-3">
                      <Switch id="webhooks" defaultChecked />
                      <Label htmlFor="webhooks">Activate pentru actualizări în timp real</Label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Tip Modificări</Label>
                    <div className="flex flex-col gap-3 col-span-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="bidirectional" defaultChecked />
                        <label
                          htmlFor="bidirectional"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Sincronizare bidirecțională (modificările se propagă în ambele direcții)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2 ml-6">
                        <Checkbox id="priority-erp" defaultChecked />
                        <label
                          htmlFor="priority-erp"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Prioritate pentru ERP în caz de conflict
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button variant="default">
                  Salvează Setările
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Webhook-uri și Endpoint-uri</CardTitle>
                <CardDescription>
                  Configurare webhook-uri pentru actualizări în timp real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    Webhook-urile permit actualizări în timp real a datelor atunci când sunt modificate în Shopify.
                  </p>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="webhook-products">
                      <AccordionTrigger>
                        <div className="flex items-center">
                          <Tags className="h-4 w-4 mr-2 text-blue-500" />
                          <span>Webhook Produse</span>
                          <Badge className="ml-2 bg-green-100 text-green-800">Activ</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="rounded-md bg-muted p-2 font-mono text-sm">
                          {import.meta.env['VITE_APP_URL'] || window.location.origin}/webhook/shopify/products
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Evenimentele acceptate: product/create, product/update, product/delete
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="webhook-orders">
                      <AccordionTrigger>
                        <div className="flex items-center">
                          <ShoppingCart className="h-4 w-4 mr-2 text-green-500" />
                          <span>Webhook Comenzi</span>
                          <Badge className="ml-2 bg-green-100 text-green-800">Activ</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="rounded-md bg-muted p-2 font-mono text-sm">
                          {import.meta.env['VITE_APP_URL'] || window.location.origin}/webhook/shopify/orders
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Evenimentele acceptate: order/create, order/update, order/cancelled, order/fulfilled
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="webhook-customers">
                      <AccordionTrigger>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-purple-500" />
                          <span>Webhook Clienți</span>
                          <Badge className="ml-2 bg-green-100 text-green-800">Activ</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="rounded-md bg-muted p-2 font-mono text-sm">
                          {import.meta.env['VITE_APP_URL'] || window.location.origin}/webhook/shopify/customers
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Evenimentele acceptate: customer/create, customer/update, customer/delete
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Mapping Tab */}
          <TabsContent value="mapping" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mapare Date</CardTitle>
                <CardDescription>
                  Configurați modul în care sunt mapate datele între ERP și Shopify
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="products" className="w-full">
                  <TabsList className="w-full justify-start mb-4">
                    <TabsTrigger value="products" className="flex items-center">
                      <Tags className="h-4 w-4 mr-2" />
                      Produse
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Comenzi
                    </TabsTrigger>
                    <TabsTrigger value="customers" className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Clienți
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="products" className="space-y-4">
                    <div className="rounded-md border p-4">
                      <h3 className="text-sm font-medium mb-2">Câmpuri Produse</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Câmp ERP</TableHead>
                            <TableHead className="w-[200px]">Câmp Shopify</TableHead>
                            <TableHead>Descriere</TableHead>
                            <TableHead className="w-[100px]">Sincronizare</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { erpField: 'product.name', shopifyField: 'title', description: 'Numele produsului' },
                            { erpField: 'product.description', shopifyField: 'body_html', description: 'Descrierea produsului' },
                            { erpField: 'product.sku', shopifyField: 'variants[0].sku', description: 'Codul de stoc' },
                            { erpField: 'product.price', shopifyField: 'variants[0].price', description: 'Prețul de vânzare' },
                            { erpField: 'product.stock', shopifyField: 'variants[0].inventory_quantity', description: 'Stoc disponibil' },
                            { erpField: 'product.tax_class', shopifyField: 'metafields.tax_class', description: 'Clasa de taxe' },
                            { erpField: 'product.categories', shopifyField: 'collections', description: 'Categorii/Colecții' },
                          ].map((mapping, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-mono text-xs">{mapping.erpField}</TableCell>
                              <TableCell className="font-mono text-xs">{mapping.shopifyField}</TableCell>
                              <TableCell className="text-sm">{mapping.description}</TableCell>
                              <TableCell>
                                <div className="flex justify-center">
                                  <Switch defaultChecked={true} />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Label htmlFor="product-sync-direction">Direcție Sincronizare</Label>
                        <Select defaultValue="bidirectional">
                          <SelectTrigger id="product-sync-direction" className="mt-1">
                            <SelectValue placeholder="Selectează direcția" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="erp-to-shopify">Doar ERP -&gt; Shopify</SelectItem>
                            <SelectItem value="shopify-to-erp">Doar Shopify -&gt; ERP</SelectItem>
                            <SelectItem value="bidirectional">Bidirecțional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex-1">
                        <Label htmlFor="product-conflict-resolution">Rezolvare Conflicte</Label>
                        <Select defaultValue="erp-priority">
                          <SelectTrigger id="product-conflict-resolution" className="mt-1">
                            <SelectValue placeholder="Selectează strategia" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="erp-priority">Prioritate ERP</SelectItem>
                            <SelectItem value="shopify-priority">Prioritate Shopify</SelectItem>
                            <SelectItem value="newest-wins">Cel mai recent câștigă</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="orders" className="space-y-4">
                    <div className="rounded-md border p-4">
                      <h3 className="text-sm font-medium mb-2">Câmpuri Comenzi</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Câmp ERP</TableHead>
                            <TableHead className="w-[200px]">Câmp Shopify</TableHead>
                            <TableHead>Descriere</TableHead>
                            <TableHead className="w-[100px]">Sincronizare</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { erpField: 'order.number', shopifyField: 'order_number', description: 'Numărul comenzii' },
                            { erpField: 'order.date', shopifyField: 'created_at', description: 'Data comenzii' },
                            { erpField: 'order.status', shopifyField: 'financial_status', description: 'Status financiar' },
                            { erpField: 'order.fulfillment_status', shopifyField: 'fulfillment_status', description: 'Status livrare' },
                            { erpField: 'order.total', shopifyField: 'total_price', description: 'Total comandă' },
                            { erpField: 'order.tax', shopifyField: 'total_tax', description: 'Taxe' },
                            { erpField: 'order.shipping', shopifyField: 'shipping_lines[0].price', description: 'Cost livrare' },
                          ].map((mapping, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-mono text-xs">{mapping.erpField}</TableCell>
                              <TableCell className="font-mono text-xs">{mapping.shopifyField}</TableCell>
                              <TableCell className="text-sm">{mapping.description}</TableCell>
                              <TableCell>
                                <div className="flex justify-center">
                                  <Switch defaultChecked={true} />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Label htmlFor="order-sync-direction">Direcție Sincronizare</Label>
                        <Select defaultValue="shopify-to-erp">
                          <SelectTrigger id="order-sync-direction" className="mt-1">
                            <SelectValue placeholder="Selectează direcția" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="erp-to-shopify">Doar ERP -&gt; Shopify</SelectItem>
                            <SelectItem value="shopify-to-erp">Doar Shopify -&gt; ERP</SelectItem>
                            <SelectItem value="bidirectional">Bidirecțional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex-1">
                        <Label htmlFor="order-status-mapping">Mapare Status</Label>
                        <Select defaultValue="standard">
                          <SelectTrigger id="order-status-mapping" className="mt-1">
                            <SelectValue placeholder="Selectează maparea" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="custom">Personalizată</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="customers" className="space-y-4">
                    <div className="rounded-md border p-4">
                      <h3 className="text-sm font-medium mb-2">Câmpuri Clienți</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Câmp ERP</TableHead>
                            <TableHead className="w-[200px]">Câmp Shopify</TableHead>
                            <TableHead>Descriere</TableHead>
                            <TableHead className="w-[100px]">Sincronizare</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { erpField: 'customer.first_name', shopifyField: 'first_name', description: 'Prenume' },
                            { erpField: 'customer.last_name', shopifyField: 'last_name', description: 'Nume' },
                            { erpField: 'customer.email', shopifyField: 'email', description: 'Email' },
                            { erpField: 'customer.phone', shopifyField: 'phone', description: 'Telefon' },
                            { erpField: 'customer.addresses', shopifyField: 'addresses', description: 'Adrese' },
                            { erpField: 'customer.tags', shopifyField: 'tags', description: 'Etichete' },
                            { erpField: 'customer.tax_exempt', shopifyField: 'tax_exempt', description: 'Scutit de taxe' },
                          ].map((mapping, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-mono text-xs">{mapping.erpField}</TableCell>
                              <TableCell className="font-mono text-xs">{mapping.shopifyField}</TableCell>
                              <TableCell className="text-sm">{mapping.description}</TableCell>
                              <TableCell>
                                <div className="flex justify-center">
                                  <Switch defaultChecked={true} />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Label htmlFor="customer-sync-direction">Direcție Sincronizare</Label>
                        <Select defaultValue="bidirectional">
                          <SelectTrigger id="customer-sync-direction" className="mt-1">
                            <SelectValue placeholder="Selectează direcția" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="erp-to-shopify">Doar ERP -&gt; Shopify</SelectItem>
                            <SelectItem value="shopify-to-erp">Doar Shopify -&gt; ERP</SelectItem>
                            <SelectItem value="bidirectional">Bidirecțional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex-1">
                        <Label htmlFor="customer-privacy">Confidențialitate Date</Label>
                        <Select defaultValue="compliant">
                          <SelectTrigger id="customer-privacy" className="mt-1">
                            <SelectValue placeholder="Selectează setarea" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compliant">GDPR Compliant</SelectItem>
                            <SelectItem value="minimal">Date Minimale</SelectItem>
                            <SelectItem value="full">Toate Datele</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button variant="default">
                  Salvează Maparea
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Mapare Avansată</CardTitle>
                <CardDescription>
                  Configurări avansate pentru transformări și reguli personalizate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="custom-transformations">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <FileCode className="h-4 w-4 mr-2 text-blue-500" />
                        <span>Transformări Personalizate</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div className="rounded-md bg-muted p-4">
                          <p className="text-sm mb-2">
                            Definiți transformări personalizate pentru conversia datelor între sisteme.
                          </p>
                          <pre className="text-xs text-muted-foreground font-mono bg-background p-2 rounded border">
{`// Exemplu transformare preț pentru a include TVA
function transformPrice(price, vatRate = 0.19) {
  return (price * (1 + vatRate)).toFixed(2);
}`}
                          </pre>
                        </div>
                        <Button variant="outline" size="sm">
                          <FileCode className="h-4 w-4 mr-2" />
                          Editor Transformări
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="filters">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <FilterX className="h-4 w-4 mr-2 text-purple-500" />
                        <span>Filtre Sincronizare</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div className="rounded-md border p-4">
                          <h3 className="text-sm font-medium mb-2">Filtre Active</h3>
                          <ul className="space-y-2">
                            <li className="text-sm flex justify-between items-center">
                              <div>
                                <span className="font-medium">Produse Draft</span>
                                <p className="text-xs text-muted-foreground">Produsele cu status draft nu sunt sincronizate către Shopify</p>
                              </div>
                              <Switch defaultChecked={true} />
                            </li>
                            <li className="text-sm flex justify-between items-center">
                              <div>
                                <span className="font-medium">Stoc Zero</span>
                                <p className="text-xs text-muted-foreground">Produsele cu stoc zero sunt marcate ca indisponibile în Shopify</p>
                              </div>
                              <Switch defaultChecked={true} />
                            </li>
                            <li className="text-sm flex justify-between items-center">
                              <div>
                                <span className="font-medium">Comenzi Anulate</span>
                                <p className="text-xs text-muted-foreground">Comenzile anulate sunt sincronizate către ERP</p>
                              </div>
                              <Switch defaultChecked={true} />
                            </li>
                          </ul>
                        </div>
                        <Button variant="outline" size="sm">
                          <FilterX className="h-4 w-4 mr-2" />
                          Adaugă Filtru Nou
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Istoric Sincronizări</CardTitle>
                <CardDescription>
                  Istoricul complet al sincronizărilor efectuate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Durată</TableHead>
                        <TableHead>Elemente</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(10)].map((_, i) => {
                        const success = Math.random() > 0.2;
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">sync-{(1000 + i).toString().padStart(3, '0')}</TableCell>
                            <TableCell>{`${11 - Math.floor(i/2)} Apr 2025 ${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`}</TableCell>
                            <TableCell>
                              {Math.random() > 0.7 ? 'Manual' : Math.random() > 0.5 ? 'Programat' : 'Webhook'}
                            </TableCell>
                            <TableCell>{`${Math.floor(Math.random() * 200) + 50}s`}</TableCell>
                            <TableCell>
                              <div className="flex flex-col text-xs">
                                <span>Produse: {Math.floor(Math.random() * 15)}</span>
                                <span>Comenzi: {Math.floor(Math.random() * 20)}</span>
                                <span>Clienți: {Math.floor(Math.random() * 8)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {success ? 
                                <Badge className="bg-green-100 text-green-800">Reușit</Badge> : 
                                <Badge className="bg-red-100 text-red-800">Eroare</Badge>
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4 flex justify-between">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="h-8">
                    <Download className="h-4 w-4 mr-2" />
                    Export Logs
                  </Button>
                  <Button variant="outline" size="sm" className="h-8">
                    <History className="h-4 w-4 mr-2" />
                    Arhivă
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <span>1</span>
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <span>2</span>
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <span>3</span>
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8">
                    <span>Următoarea</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Logs Erori</CardTitle>
                <CardDescription>
                  Erorile întâlnite în timpul sincronizării
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erori Recente</AlertTitle>
                  <AlertDescription>
                    Au fost identificate 3 erori în ultimele sincronizări. Verificați detaliile mai jos.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="rounded-md border p-4">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium mb-1">Error #1278 | 11 Apr 2025 09:42</h3>
                      <Badge variant="outline" className="text-red-500">Nerezolvat</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Eroare de rată API în timpul sincronizării produselor
                    </p>
                    <div className="bg-muted p-2 rounded-md text-xs font-mono">
                      [ERROR] API rate limit exceeded. Try again in 60 seconds. Status: 429 Too Many Requests
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button variant="outline" size="sm">
                        <InfoIcon className="h-4 w-4 mr-2" />
                        Detalii Complete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-md border p-4">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium mb-1">Error #1277 | 10 Apr 2025 22:18</h3>
                      <Badge variant="outline" className="text-green-500">Rezolvat</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Eroare de validare pentru prețul produsului
                    </p>
                    <div className="bg-muted p-2 rounded-md text-xs font-mono">
                      [ERROR] Product validation failed: Price cannot be negative. Value: -15.99
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button variant="outline" size="sm">
                        <InfoIcon className="h-4 w-4 mr-2" />
                        Detalii Complete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-md border p-4">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium mb-1">Error #1276 | 10 Apr 2025 18:42</h3>
                      <Badge variant="outline" className="text-green-500">Rezolvat</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Eroare de autentificare webhook
                    </p>
                    <div className="bg-muted p-2 rounded-md text-xs font-mono">
                      [ERROR] Webhook authentication failed. Invalid HMAC signature.
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button variant="outline" size="sm">
                        <InfoIcon className="h-4 w-4 mr-2" />
                        Detalii Complete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vezi Toate Erorile
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}