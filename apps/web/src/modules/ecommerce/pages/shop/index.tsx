/**
 * E-commerce Shop Page
 * 
 * This page provides tools for managing the online storefront, 
 * including theme customization, navigation setup, and Shopify integration settings.
 */

import React, { useState } from 'react';
import { EcommerceModuleLayout } from '../../components/common/EcommerceModuleLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Store, 
  Settings, 
  Palette, 
  Layout, 
  Menu, 
  Tag, 
  Cloud, 
  Globe, 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  BarChart4, 
  Undo2, 
  RefreshCw,
  Link, 
  ChevronDown, 
  Eye, 
  Save,
  BookOpen,
  Smartphone,
  LaptopIcon,
  ExternalLink,
  ShoppingBag,
  Trash2,
  Plus
} from 'lucide-react';

export default function ShopPage() {
  const [currentTheme, setCurrentTheme] = useState('modern');
  const [shopStatus, setShopStatus] = useState('online');
  const [syncStatus, setSyncStatus] = useState('synced');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const themes = [
    { id: 'modern', name: 'Modern', preview: 'https://images.unsplash.com/photo-1541702467897-41397f7f868b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', active: true },
    { id: 'minimal', name: 'Minimal', preview: 'https://images.unsplash.com/photo-1507065255811-f3b9fe969f1a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', active: false },
    { id: 'bold', name: 'Bold', preview: 'https://images.unsplash.com/photo-1501963917309-56546c33e19d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', active: false },
    { id: 'light', name: 'Light', preview: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', active: false },
  ];
  
  const navigationItems = [
    { id: 1, title: 'Acasă', url: '/', order: 1, visible: true },
    { id: 2, title: 'Produse', url: '/products', order: 2, visible: true },
    { id: 3, title: 'Categorii', url: '/categories', order: 3, visible: true },
    { id: 4, title: 'Oferte', url: '/offers', order: 4, visible: true },
    { id: 5, title: 'Despre noi', url: '/about', order: 5, visible: true },
    { id: 6, title: 'Contact', url: '/contact', order: 6, visible: true },
    { id: 7, title: 'Blog', url: '/blog', order: 7, visible: false },
  ];
  
  const shopifyConnectionDetails = {
    store: 'your-store.myshopify.com',
    apiKey: '••••••••••••••••',
    secretKey: '••••••••••••••••',
    lastSync: '11 Apr 2025, 16:30',
    status: 'connected',
  };
  
  const syncLogs = [
    { id: 1, date: '11 Apr 2025, 16:30', type: 'Products', status: 'success', items: 43, message: 'All products synced successfully' },
    { id: 2, date: '11 Apr 2025, 16:29', type: 'Orders', status: 'success', items: 12, message: 'All orders synced successfully' },
    { id: 3, date: '11 Apr 2025, 14:15', type: 'Products', status: 'warning', items: 41, message: '2 products failed to sync' },
    { id: 4, date: '10 Apr 2025, 18:45', type: 'Customers', status: 'success', items: 68, message: 'All customers synced successfully' },
    { id: 5, date: '10 Apr 2025, 12:30', type: 'Orders', status: 'error', items: 0, message: 'API error: Connection timeout' },
  ];
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Mentenanță</Badge>;
      case 'offline':
        return <Badge className="bg-red-100 text-red-800">Offline</Badge>;
      case 'synced':
        return <Badge className="bg-blue-100 text-blue-800">Sincronizat</Badge>;
      case 'syncing':
        return <Badge className="bg-purple-100 text-purple-800">Sincronizare</Badge>;
      case 'not_synced':
        return <Badge className="bg-orange-100 text-orange-800">Nesincronizat</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Succes</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Avertisment</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Eroare</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <EcommerceModuleLayout activeTab="shop">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Magazin Online</h1>
            <p className="text-muted-foreground">Gestionează magazinul online și sincronizarea cu Shopify</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Status:</span>
              {getStatusBadge(shopStatus)}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Sincronizare:</span>
              {getStatusBadge(syncStatus)}
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Vizitează magazinul
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">
              <BarChart4 className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="design">
              <Palette className="mr-2 h-4 w-4" />
              Design
            </TabsTrigger>
            <TabsTrigger value="navigation">
              <Menu className="mr-2 h-4 w-4" />
              Navigație
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Setări
            </TabsTrigger>
            <TabsTrigger value="sync">
              <Cloud className="mr-2 h-4 w-4" />
              Sincronizare
            </TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vizualizări</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,245</div>
                  <p className="text-xs text-muted-foreground">
                    +15.7% față de săptămâna trecută
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comenzi</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45</div>
                  <p className="text-xs text-muted-foreground">
                    +8.2% față de săptămâna trecută
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversie</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.2%</div>
                  <p className="text-xs text-muted-foreground">
                    +0.5% față de săptămâna trecută
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Coșuri Abandonate</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">
                    -5.3% față de săptămâna trecută
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Alertă de Stoc</CardTitle>
                  <CardDescription>
                    Produse cu stoc redus sau epuizat
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">0</Badge>
                          <span className="font-medium">Geantă de Laptop</span>
                        </div>
                        <Button variant="outline" size="sm">Comandă</Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">3</Badge>
                          <span className="font-medium">Smartwatch</span>
                        </div>
                        <Button variant="outline" size="sm">Comandă</Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">4</Badge>
                          <span className="font-medium">Căști Wireless</span>
                        </div>
                        <Button variant="outline" size="sm">Comandă</Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">5</Badge>
                          <span className="font-medium">Încălțăminte Sport</span>
                        </div>
                        <Button variant="outline" size="sm">Comandă</Button>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button variant="outline" className="w-full">
                    Vezi toate produsele cu stoc redus
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Activitate Recentă</CardTitle>
                  <CardDescription>
                    Ultimele actualizări ale magazinului
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-4">
                      <div className="border-l-2 border-blue-500 pl-4 ml-2">
                        <p className="text-sm font-medium">Sincronizare produse</p>
                        <p className="text-xs text-muted-foreground">Acum 30 de minute</p>
                      </div>
                      <div className="border-l-2 border-green-500 pl-4 ml-2">
                        <p className="text-sm font-medium">Comandă nouă #8945</p>
                        <p className="text-xs text-muted-foreground">Acum 2 ore</p>
                      </div>
                      <div className="border-l-2 border-yellow-500 pl-4 ml-2">
                        <p className="text-sm font-medium">Stoc actualizat: Tricou Essential</p>
                        <p className="text-xs text-muted-foreground">Acum 3 ore</p>
                      </div>
                      <div className="border-l-2 border-purple-500 pl-4 ml-2">
                        <p className="text-sm font-medium">Preț actualizat: Căști Wireless</p>
                        <p className="text-xs text-muted-foreground">Acum 5 ore</p>
                      </div>
                      <div className="border-l-2 border-green-500 pl-4 ml-2">
                        <p className="text-sm font-medium">Comandă nouă #8944</p>
                        <p className="text-xs text-muted-foreground">Acum 8 ore</p>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button variant="outline" className="w-full">
                    Vezi tot istoricul
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          {/* Design Tab */}
          <TabsContent value="design" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Teme disponibile</CardTitle>
                <CardDescription>
                  Alege o temă pentru magazinul tău online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {themes.map((theme) => (
                    <div 
                      key={theme.id} 
                      className={`border rounded-lg overflow-hidden ${currentTheme === theme.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setCurrentTheme(theme.id)}
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img 
                          src={theme.preview} 
                          alt={theme.name} 
                          className="object-cover w-full h-full"
                        />
                        {theme.active && (
                          <div className="absolute top-2 right-2">
                            <Badge>Activ</Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium">{theme.name}</h3>
                        <div className="flex justify-between items-center mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Preview theme
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Previzualizare
                          </Button>
                          {currentTheme === theme.id ? (
                            <Button size="sm" disabled>Activ</Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentTheme(theme.id);
                              }}
                            >
                              Activează
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Personalizare temă</CardTitle>
                <CardDescription>
                  Personalizează aspectul magazinului tău
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="colors">
                  <TabsList className="mb-4">
                    <TabsTrigger value="colors">Culori</TabsTrigger>
                    <TabsTrigger value="typography">Tipografie</TabsTrigger>
                    <TabsTrigger value="layouts">Layout</TabsTrigger>
                    <TabsTrigger value="sections">Secțiuni</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="colors" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Culoare primară</Label>
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 rounded-md bg-primary" />
                          <Input value="#4F46E5" className="w-32" readOnly />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Culoare secundară</Label>
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 rounded-md bg-secondary" />
                          <Input value="#F9FAFB" className="w-32" readOnly />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Culoare accent</Label>
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 rounded-md bg-blue-500" />
                          <Input value="#3B82F6" className="w-32" readOnly />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Culoare text</Label>
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 rounded-md bg-gray-900" />
                          <Input value="#111827" className="w-32" readOnly />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="typography" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Font pentru titluri</Label>
                        <Select defaultValue="inter">
                          <SelectTrigger>
                            <SelectValue placeholder="Alege un font" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inter">Inter</SelectItem>
                            <SelectItem value="roboto">Roboto</SelectItem>
                            <SelectItem value="lato">Lato</SelectItem>
                            <SelectItem value="poppins">Poppins</SelectItem>
                            <SelectItem value="oswald">Oswald</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Font pentru text</Label>
                        <Select defaultValue="roboto">
                          <SelectTrigger>
                            <SelectValue placeholder="Alege un font" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inter">Inter</SelectItem>
                            <SelectItem value="roboto">Roboto</SelectItem>
                            <SelectItem value="lato">Lato</SelectItem>
                            <SelectItem value="poppins">Poppins</SelectItem>
                            <SelectItem value="oswald">Oswald</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Mărime titlu principal</Label>
                        <Select defaultValue="3xl">
                          <SelectTrigger>
                            <SelectValue placeholder="Mărime font" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xl">Extra Large</SelectItem>
                            <SelectItem value="2xl">2X Large</SelectItem>
                            <SelectItem value="3xl">3X Large</SelectItem>
                            <SelectItem value="4xl">4X Large</SelectItem>
                            <SelectItem value="5xl">5X Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Mărime text normal</Label>
                        <Select defaultValue="base">
                          <SelectTrigger>
                            <SelectValue placeholder="Mărime font" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xs">Extra Small</SelectItem>
                            <SelectItem value="sm">Small</SelectItem>
                            <SelectItem value="base">Base</SelectItem>
                            <SelectItem value="lg">Large</SelectItem>
                            <SelectItem value="xl">Extra Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline">
                  <Undo2 className="mr-2 h-4 w-4" />
                  Resetează
                </Button>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Salvează modificările
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Previzualizare</CardTitle>
                <CardDescription>
                  Vezi cum arată magazinul tău pe diferite dispozitive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="desktop">
                  <TabsList>
                    <TabsTrigger value="desktop">
                      <LaptopIcon className="h-4 w-4 mr-2" />
                      Desktop
                    </TabsTrigger>
                    <TabsTrigger value="mobile">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Mobile
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="desktop" className="mt-4">
                    <div className="border rounded-lg p-2 bg-muted/20">
                      <div className="aspect-video bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                        <div className="text-center">
                          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">Previzualizare Desktop</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="mobile" className="mt-4">
                    <div className="border rounded-lg p-2 w-64 mx-auto bg-muted/20">
                      <div className="aspect-[9/16] bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                        <div className="text-center">
                          <BookOpen className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">Previzualizare Mobile</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button className="w-full">Deschide previzualizare completă</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Navigation Tab */}
          <TabsContent value="navigation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meniu navigare</CardTitle>
                <CardDescription>
                  Gestionează structura meniului din magazinul tău
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Ordine</TableHead>
                      <TableHead>Titlu</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Vizibil</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {navigationItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <span>{item.order}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input value={item.title} className="h-8" readOnly />
                        </TableCell>
                        <TableCell>
                          <Input value={item.url} className="h-8" readOnly />
                        </TableCell>
                        <TableCell>
                          <Switch checked={item.visible} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Adaugă element meniu
                </Button>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Salvează modificările
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Setări magazin</CardTitle>
                <CardDescription>
                  Configurează setările generale ale magazinului tău
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label className="text-base">Mod de mentenanță</Label>
                      <p className="text-sm text-muted-foreground">
                        Activează modul de mentenanță pentru a împiedica accesul vizitatorilor
                      </p>
                    </div>
                    <Switch
                      checked={maintenanceMode}
                      onCheckedChange={setMaintenanceMode}
                    />
                  </div>
                  {maintenanceMode && (
                    <div className="rounded-md bg-yellow-50 p-4 mt-2">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">Modul de mentenanță este activat</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>Vizitatorii vor vedea o pagină de mentenanță în loc de magazin. Doar administratorii pot accesa magazinul.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="store-information">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <Store className="h-5 w-5 mr-2" />
                        Informații magazin
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 p-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Numele magazinului</Label>
                          <Input value="Magazin Demo" readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label>Email contact</Label>
                          <Input value="contact@magazindemo.ro" readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefon</Label>
                          <Input value="+40 722 123 456" readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label>Adresă</Label>
                          <Input value="Str. Exemplu 123, București" readOnly />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="payments">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Metode de plată
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 p-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base">Card bancar</Label>
                            <p className="text-sm text-muted-foreground">
                              Acceptă plăți cu carduri Visa, Mastercard
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base">PayPal</Label>
                            <p className="text-sm text-muted-foreground">
                              Acceptă plăți prin PayPal
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base">Plată la livrare</Label>
                            <p className="text-sm text-muted-foreground">
                              Plată în numerar la primirea coletului
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="shipping">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <Truck className="h-5 w-5 mr-2" />
                        Metode de livrare
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 p-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base">Fan Courier</Label>
                            <p className="text-sm text-muted-foreground">
                              Livrare prin Fan Courier
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base">Cargus</Label>
                            <p className="text-sm text-muted-foreground">
                              Livrare prin Cargus
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base">Poșta Română</Label>
                            <p className="text-sm text-muted-foreground">
                              Livrare prin Poșta Română
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button className="ml-auto">
                  <Save className="mr-2 h-4 w-4" />
                  Salvează setările
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Sync Tab */}
          <TabsContent value="sync" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integrare Shopify</CardTitle>
                <CardDescription>
                  Configurează și gestionează sincronizarea cu Shopify
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-md bg-blue-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Conectat la Shopify</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Magazinul tău este conectat la Shopify și sincronizat.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Magazin Shopify</Label>
                    <Input value={shopifyConnectionDetails.store} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-transparent flex items-center">
                      <Badge className="bg-green-100 text-green-800">Conectat</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input value={shopifyConnectionDetails.apiKey} type="password" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <Input value={shopifyConnectionDetails.secretKey} type="password" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Ultima sincronizare</Label>
                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-transparent">
                      {shopifyConnectionDetails.lastSync}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Următoarea sincronizare automată</Label>
                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-transparent">
                      11 Apr 2025, 20:30
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <Button className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sincronizează acum
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurare
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Istoric sincronizare</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Număr elemente</TableHead>
                        <TableHead>Mesaj</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{log.date}</TableCell>
                          <TableCell>{log.type}</TableCell>
                          <TableCell>{getSyncStatusBadge(log.status)}</TableCell>
                          <TableCell>{log.items}</TableCell>
                          <TableCell>{log.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EcommerceModuleLayout>
  );
}