/**
 * E-commerce Fulfillment/Shipping Page
 * 
 * This page manages order fulfillment, shipping arrangements, tracking, 
 * and delivery status for the online store orders.
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { EcommerceModuleLayout } from '../../components/common/EcommerceModuleLayout';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { 
  Search, 
  MoreHorizontal, 
  FilterX,
  Truck,
  PackageOpen,
  Printer,
  BarChart2,
  Box,
  MapPin,
  Calendar,
  Clock,
  RefreshCw,
  Clipboard,
  ClipboardCheck,
  PackageCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Tag,
  Settings,
  FileText,
  TrendingDown,
  Eye
} from 'lucide-react';

export default function FulfillmentPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courierFilter, setCourierFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('pending');
  
  // Placeholder data - in a real implementation, this would come from an API
  const shipments = [
    { 
      id: 'SHIP-8945', 
      orderId: 'ORD-8945',
      customer: 'Alexandru Popescu', 
      address: 'Strada Victoriei 25, București',
      courier: 'Fan Courier',
      trackingNumber: 'FC1234567890',
      status: 'pending',
      createdAt: '11 Apr 2025',
      scheduledDate: '13 Apr 2025',
      weight: '2.5 kg',
      items: 3,
      notes: ''
    },
    { 
      id: 'SHIP-8944', 
      orderId: 'ORD-8944',
      customer: 'Maria Ionescu', 
      address: 'Strada Republicii 42, Cluj-Napoca',
      courier: 'Cargus',
      trackingNumber: 'CG0987654321',
      status: 'processing',
      createdAt: '10 Apr 2025',
      scheduledDate: '12 Apr 2025',
      weight: '1.8 kg',
      items: 2,
      notes: 'Sunat clientul pentru confirmare'
    },
    { 
      id: 'SHIP-8943', 
      orderId: 'ORD-8943',
      customer: 'Andrei Mihai', 
      address: 'Bulevardul Unirii 15, Iași',
      courier: 'DHL',
      trackingNumber: 'DH2468101214',
      status: 'shipped',
      createdAt: '09 Apr 2025',
      scheduledDate: '11 Apr 2025',
      weight: '1.2 kg',
      items: 1,
      notes: ''
    },
    { 
      id: 'SHIP-8942', 
      orderId: 'ORD-8942',
      customer: 'Elena Vasilescu', 
      address: 'Strada Avram Iancu 8, Brașov',
      courier: 'Fan Courier',
      trackingNumber: 'FC2345678901',
      status: 'delivered',
      createdAt: '07 Apr 2025',
      scheduledDate: '09 Apr 2025',
      weight: '3.7 kg',
      items: 4,
      notes: ''
    },
    { 
      id: 'SHIP-8941', 
      orderId: 'ORD-8941',
      customer: 'Cristian Popa', 
      address: 'Bulevardul 1 Decembrie 1918, Timișoara',
      courier: 'Sameday',
      trackingNumber: 'SD1357913579',
      status: 'shipped',
      createdAt: '08 Apr 2025',
      scheduledDate: '10 Apr 2025',
      weight: '1.0 kg',
      items: 1,
      notes: ''
    },
    { 
      id: 'SHIP-8940', 
      orderId: 'ORD-8940',
      customer: 'Ana Dumitrescu', 
      address: 'Strada Mihai Viteazu 28, Constanța',
      courier: 'Urgent Cargus',
      trackingNumber: 'UC1122334455',
      status: 'cancelled',
      createdAt: '06 Apr 2025',
      scheduledDate: '08 Apr 2025',
      weight: '2.2 kg',
      items: 2,
      notes: 'Anulat la cererea clientului'
    },
    { 
      id: 'SHIP-8939', 
      orderId: 'ORD-8939',
      customer: 'Mihai Stoica', 
      address: 'Calea Dorobanți 10, București',
      courier: 'Fan Courier',
      trackingNumber: 'FC3456789012',
      status: 'delivered',
      createdAt: '05 Apr 2025',
      scheduledDate: '07 Apr 2025',
      weight: '1.5 kg',
      items: 1,
      notes: ''
    },
    { 
      id: 'SHIP-8938', 
      orderId: 'ORD-8938',
      customer: 'Ioana Munteanu', 
      address: 'Strada Gheorghe Doja 5, Oradea',
      courier: 'DPD',
      trackingNumber: 'DP9876543210',
      status: 'pending',
      createdAt: '11 Apr 2025',
      scheduledDate: '13 Apr 2025',
      weight: '4.3 kg',
      items: 5,
      notes: 'Pachet voluminos'
    }
  ];
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">În așteptare</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">În procesare</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Expediat</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Livrat</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Anulat</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };
  
  const getCourierBadge = (courier: string) => {
    switch (courier) {
      case 'Fan Courier':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Fan Courier</Badge>;
      case 'Cargus':
      case 'Urgent Cargus':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{courier}</Badge>;
      case 'DHL':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">DHL</Badge>;
      case 'Sameday':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Sameday</Badge>;
      case 'DPD':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">DPD</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{courier}</Badge>;
    }
  };
  
  const handleViewShipment = (shipmentId: string) => {
    setLocation(`/ecommerce/fulfillment/${shipmentId}`);
  };
  
  // Stats for metrics
  const pendingShipments = shipments.filter(s => s.status === 'pending').length;
  const processingShipments = shipments.filter(s => s.status === 'processing').length;
  const shippedShipments = shipments.filter(s => s.status === 'shipped').length;
  const deliveredShipments = shipments.filter(s => s.status === 'delivered').length;
  
  // Filter shipments based on search, status, courier and active tab
  const filteredShipments = shipments.filter(shipment => {
    // Apply search filter
    const searchMatch = 
      searchTerm === '' || 
      shipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    const statusMatch = statusFilter === 'all' || shipment.status === statusFilter;
    
    // Apply courier filter
    const courierMatch = courierFilter === 'all' || shipment.courier === courierFilter;
    
    // Apply tab filter
    const tabMatch = 
      (activeTab === 'pending' && (shipment.status === 'pending' || shipment.status === 'processing')) ||
      (activeTab === 'shipped' && shipment.status === 'shipped') ||
      (activeTab === 'delivered' && shipment.status === 'delivered') ||
      (activeTab === 'cancelled' && shipment.status === 'cancelled') ||
      (activeTab === 'all');
    
    return searchMatch && statusMatch && courierMatch && tabMatch;
  });
  
  const courierOptions = ['Fan Courier', 'Cargus', 'Urgent Cargus', 'DHL', 'Sameday', 'DPD'];
  
  return (
    <EcommerceModuleLayout activeTab="fulfillment">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Livrare</h1>
            <p className="text-muted-foreground">Managementul expedierilor și livrărilor</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reîmprospătează
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Truck className="mr-2 h-4 w-4" />
                  Expediere Nouă
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Creare Expediere Nouă</DialogTitle>
                  <DialogDescription>
                    Adaugă o nouă expediere pentru o comandă existentă.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="order-id" className="text-right text-sm font-medium">
                      Comandă
                    </label>
                    <Select>
                      <SelectTrigger id="order-id" className="col-span-3">
                        <SelectValue placeholder="Selectează comanda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ord-8945">ORD-8945</SelectItem>
                        <SelectItem value="ord-8944">ORD-8944</SelectItem>
                        <SelectItem value="ord-8943">ORD-8943</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="courier" className="text-right text-sm font-medium">
                      Curier
                    </label>
                    <Select>
                      <SelectTrigger id="courier" className="col-span-3">
                        <SelectValue placeholder="Selectează curierul" />
                      </SelectTrigger>
                      <SelectContent>
                        {courierOptions.map(option => (
                          <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '-')}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="scheduled-date" className="text-right text-sm font-medium">
                      Data programată
                    </label>
                    <Input id="scheduled-date" type="date" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="weight" className="text-right text-sm font-medium">
                      Greutate
                    </label>
                    <Input id="weight" placeholder="Greutate în kg" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <label htmlFor="notes" className="text-right text-sm font-medium pt-2">
                      Note
                    </label>
                    <Input id="notes" placeholder="Note despre expediere" className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Creează Expediere</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">În Așteptare</CardTitle>
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingShipments + processingShipments}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <PackageOpen className="h-3 w-3 mr-1" />
                Necesită procesare
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">În Tranzit</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Truck className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shippedShipments}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                În drum spre destinație
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Livrate</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveredShipments}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                În ultima săptămână
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Timp Mediu Livrare</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3 zile</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
                -0.5 zile față de luna trecută
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Managementul Expedierilor</CardTitle>
            <CardDescription>
              Organizează și gestionează expedierile pentru comenzile online.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-4">
                <TabsList className="bg-transparent border-b-0">
                  <TabsTrigger value="pending" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none">
                    În Așteptare
                  </TabsTrigger>
                  <TabsTrigger value="shipped" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none">
                    În Tranzit
                  </TabsTrigger>
                  <TabsTrigger value="delivered" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none">
                    Livrate
                  </TabsTrigger>
                  <TabsTrigger value="cancelled" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none">
                    Anulate
                  </TabsTrigger>
                  <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none">
                    Toate
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value={activeTab} className="m-0">
                <div className="border-b">
                  <div className="flex flex-col space-y-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div className="flex flex-1 items-center space-x-2">
                      <div className="relative w-full md:w-80">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Caută după ID, comandă, client sau AWB..."
                          className="w-full pl-8"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-row space-x-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toate statusurile</SelectItem>
                            <SelectItem value="pending">În așteptare</SelectItem>
                            <SelectItem value="processing">În procesare</SelectItem>
                            <SelectItem value="shipped">Expediate</SelectItem>
                            <SelectItem value="delivered">Livrate</SelectItem>
                            <SelectItem value="cancelled">Anulate</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={courierFilter} onValueChange={setCourierFilter}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Curier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toți curierii</SelectItem>
                            {courierOptions.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setCourierFilter('all');
                      }}>
                        <FilterX className="mr-2 h-4 w-4" />
                        Resetează filtre
                      </Button>
                      <Button variant="outline" size="sm">
                        <Printer className="mr-2 h-4 w-4" />
                        Printează AWB-uri
                      </Button>
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expediere / Comandă</TableHead>
                        <TableHead>Client & Adresă</TableHead>
                        <TableHead>Curier & AWB</TableHead>
                        <TableHead>Data Programată</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredShipments.map((shipment) => (
                        <TableRow key={shipment.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewShipment(shipment.id)}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{shipment.id}</span>
                              <span className="text-xs text-muted-foreground">{shipment.orderId}</span>
                              <span className="text-xs mt-1">{shipment.items} produse, {shipment.weight}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{shipment.customer}</span>
                              <span className="text-xs text-muted-foreground line-clamp-2">{shipment.address}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              {getCourierBadge(shipment.courier)}
                              <span className="text-xs mt-1 font-mono">{shipment.trackingNumber}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{shipment.scheduledDate}</span>
                              <span className="text-xs text-muted-foreground">Creat: {shipment.createdAt}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Deschide meniu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewShipment(shipment.id); }}>
                                  <Eye className="mr-2 h-4 w-4" /> Vizualizează detalii
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                  <Printer className="mr-2 h-4 w-4" /> Printează AWB
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                  <FileText className="mr-2 h-4 w-4" /> Printează factură
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {(shipment.status === 'pending' || shipment.status === 'processing') && (
                                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                    <PackageCheck className="mr-2 h-4 w-4" /> Marchează ca expediat
                                  </DropdownMenuItem>
                                )}
                                {shipment.status === 'shipped' && (
                                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Marchează ca livrat
                                  </DropdownMenuItem>
                                )}
                                {shipment.status !== 'cancelled' && shipment.status !== 'delivered' && (
                                  <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-red-600">
                                    <XCircle className="mr-2 h-4 w-4" /> Anulează expedierea
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredShipments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Nicio expediere găsită cu criteriile selectate.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="h-5 w-5 mr-2" /> 
                Performanța Curierilor
              </CardTitle>
              <CardDescription>
                Rata de livrare și timpul mediu de livrare
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-4">
                {[
                  {name: 'Fan Courier', deliveryRate: 98, avgTime: '1.8 zile'},
                  {name: 'Cargus', deliveryRate: 96, avgTime: '2.2 zile'},
                  {name: 'DHL', deliveryRate: 99, avgTime: '1.5 zile'},
                  {name: 'Sameday', deliveryRate: 97, avgTime: '2.0 zile'},
                  {name: 'DPD', deliveryRate: 95, avgTime: '2.5 zile'},
                ].map((courier, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{courier.name}</span>
                      <span className="text-xs text-muted-foreground">{courier.avgTime}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Rată livrare la timp</span>
                      <span>{courier.deliveryRate}%</span>
                    </div>
                    <Progress value={courier.deliveryRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" /> 
                Probleme de Livrare Recente
              </CardTitle>
              <CardDescription>
                Expedieri care necesită atenție
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-4">
                {[
                  {id: 'SHIP-8936', issue: 'Adresă incompletă', priority: 'high'},
                  {id: 'SHIP-8932', issue: 'Imposibilitate de contactare client', priority: 'medium'},
                  {id: 'SHIP-8925', issue: 'Întârziere curier', priority: 'medium'},
                  {id: 'SHIP-8921', issue: 'Colet deteriorat', priority: 'high'},
                ].map((issue, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="font-medium">{issue.id}</span>
                      <span className="text-xs text-muted-foreground">{issue.issue}</span>
                    </div>
                    <Badge className={issue.priority === 'high' ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                      {issue.priority === 'high' ? 'Urgent' : 'Normal'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="w-full">
                <Eye className="mr-2 h-4 w-4" />
                Vezi toate problemele
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" /> 
                Setări Expedieri
              </CardTitle>
              <CardDescription>
                Configurări și opțiuni de livrare
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-4">
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-medium mb-1">Contracte Curieri Active</h3>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">Fan Courier</Badge>
                    <Badge variant="outline">Cargus</Badge>
                    <Badge variant="outline">DHL</Badge>
                    <Badge variant="outline">Sameday</Badge>
                    <Badge variant="outline">DPD</Badge>
                  </div>
                </div>
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-medium mb-1">Opțiuni Livrare</h3>
                  <div className="flex flex-col space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Livrare gratuită peste:</span>
                      <span className="font-medium">300 RON</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost livrare standard:</span>
                      <span className="font-medium">15 RON</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timp estimat livrare:</span>
                      <span className="font-medium">24-48h</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Configurează opțiuni
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </EcommerceModuleLayout>
  );
}