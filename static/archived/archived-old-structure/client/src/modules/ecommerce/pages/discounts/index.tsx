/**
 * E-commerce Discounts/Promotions Page
 * 
 * This page allows managing discounts, coupons, promotional campaigns, and special offers
 * for the online store. It includes features for creating, editing, and tracking promotions.
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  MoreHorizontal, 
  PlusCircle,
  Edit,
  Copy,
  Trash,
  Calendar,
  Tag,
  PercentCircle,
  Ticket,
  ShoppingCart,
  BarChart2,
  Users,
  Archive,
  RefreshCw,
  Clock,
  Clock3,
  Eye
} from 'lucide-react';

export default function DiscountsPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('active');
  
  // Placeholder data - in a real implementation, this would come from an API
  const discounts = [
    {
      id: 'PROMO-001',
      name: 'Reducere de Vară 25%',
      code: 'VARA25',
      type: 'percentage',
      value: '25%',
      minPurchase: '200 RON',
      startDate: '01 Apr 2025',
      endDate: '30 Jun 2025',
      status: 'active',
      usedCount: 126,
      totalLimit: 500,
      categories: ['Îmbrăcăminte', 'Încălțăminte'],
      description: 'Reducere de vară pentru toate produsele de îmbrăcăminte și încălțăminte'
    },
    {
      id: 'PROMO-002',
      name: 'Transport Gratuit',
      code: 'LIVRARE0',
      type: 'free_shipping',
      value: 'Transport gratuit',
      minPurchase: '300 RON',
      startDate: '01 Mar 2025',
      endDate: '31 May 2025',
      status: 'active',
      usedCount: 238,
      totalLimit: 1000,
      categories: ['Toate'],
      description: 'Transport gratuit pentru comenzi peste 300 RON'
    },
    {
      id: 'PROMO-003',
      name: 'Reducere Electronice',
      code: 'TECH15',
      type: 'percentage',
      value: '15%',
      minPurchase: '500 RON',
      startDate: '15 Mar 2025',
      endDate: '15 Apr 2025',
      status: 'active',
      usedCount: 67,
      totalLimit: 200,
      categories: ['Electronice'],
      description: 'Reducere pentru produsele electronice'
    },
    {
      id: 'PROMO-004',
      name: 'Reducere Primă Comandă',
      code: 'BINE10',
      type: 'percentage',
      value: '10%',
      minPurchase: '0 RON',
      startDate: '01 Jan 2025',
      endDate: '31 Dec 2025',
      status: 'active',
      usedCount: 342,
      totalLimit: 9999,
      categories: ['Toate'],
      description: 'Reducere pentru prima comandă'
    },
    {
      id: 'PROMO-005',
      name: 'Reducere Black Friday',
      code: 'BLACK50',
      type: 'percentage',
      value: '50%',
      minPurchase: '0 RON',
      startDate: '15 Nov 2024',
      endDate: '17 Nov 2024',
      status: 'expired',
      usedCount: 1520,
      totalLimit: 2000,
      categories: ['Toate'],
      description: 'Reducere Black Friday'
    },
    {
      id: 'PROMO-006',
      name: 'Voucher 100 RON',
      code: 'VOUCHER100',
      type: 'fixed_amount',
      value: '100 RON',
      minPurchase: '300 RON',
      startDate: '01 Apr 2025',
      endDate: '30 Apr 2025',
      status: 'active',
      usedCount: 28,
      totalLimit: 100,
      categories: ['Toate'],
      description: 'Voucher de 100 RON la comenzi peste 300 RON'
    },
    {
      id: 'PROMO-007',
      name: 'Discount Mobila',
      code: 'MOBILA20',
      type: 'percentage',
      value: '20%',
      minPurchase: '1000 RON',
      startDate: '01 May 2025',
      endDate: '31 May 2025',
      status: 'scheduled',
      usedCount: 0,
      totalLimit: 50,
      categories: ['Mobilă', 'Decorațiuni'],
      description: 'Reducere pentru mobilă și decorațiuni'
    },
    {
      id: 'PROMO-008',
      name: 'Cadou la Cumpărături',
      code: 'CADOU',
      type: 'gift',
      value: 'Cadou',
      minPurchase: '500 RON',
      startDate: '01 Apr 2025',
      endDate: '15 Apr 2025',
      status: 'active',
      usedCount: 42,
      totalLimit: 100,
      categories: ['Toate'],
      description: 'Primește un cadou la comenzi peste 500 RON'
    }
  ];
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Activă</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Expirată</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Programată</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Suspendată</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };
  
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Procentuală</Badge>;
      case 'fixed_amount':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Sumă Fixă</Badge>;
      case 'free_shipping':
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">Transport Gratuit</Badge>;
      case 'gift':
        return <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200">Cadou</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{type}</Badge>;
    }
  };
  
  const handleEditDiscount = (discountId: string) => {
    setLocation(`/ecommerce/discounts/${discountId}/edit`);
  };
  
  // Overview stats
  const activeDiscounts = discounts.filter(d => d.status === 'active').length;
  const scheduledDiscounts = discounts.filter(d => d.status === 'scheduled').length;
  const expiredDiscounts = discounts.filter(d => d.status === 'expired').length;
  const totalUsedCount = discounts.reduce((sum, d) => sum + d.usedCount, 0);
  
  // Filter discounts based on search, status, type, and active tab
  const filteredDiscounts = discounts.filter(discount => {
    // Apply search filter
    const searchMatch = 
      searchTerm === '' || 
      discount.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discount.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discount.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    const statusMatch = statusFilter === 'all' || discount.status === statusFilter;
    
    // Apply type filter
    const typeMatch = typeFilter === 'all' || discount.type === typeFilter;
    
    // Apply tab filter
    const tabMatch = 
      (activeTab === 'active' && discount.status === 'active') ||
      (activeTab === 'scheduled' && discount.status === 'scheduled') ||
      (activeTab === 'expired' && discount.status === 'expired') ||
      (activeTab === 'all');
    
    return searchMatch && statusMatch && typeMatch && tabMatch;
  });
  
  return (
    <EcommerceModuleLayout activeTab="discounts">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Promoții</h1>
            <p className="text-muted-foreground">Gestionează reducerile și campaniile promoționale</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reîmprospătează
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adaugă Promoție Nouă
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Adaugă Promoție Nouă</DialogTitle>
                  <DialogDescription>
                    Creează o nouă promoție sau reducere pentru magazinul online.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="promo-name" className="text-right text-sm font-medium">
                      Nume
                    </label>
                    <Input id="promo-name" placeholder="Numele promoției" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="promo-code" className="text-right text-sm font-medium">
                      Cod
                    </label>
                    <Input id="promo-code" placeholder="Cod de reducere" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="promo-type" className="text-right text-sm font-medium">
                      Tip
                    </label>
                    <Select>
                      <SelectTrigger id="promo-type" className="col-span-3">
                        <SelectValue placeholder="Selectează tipul promoției" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Procentuală</SelectItem>
                        <SelectItem value="fixed_amount">Sumă Fixă</SelectItem>
                        <SelectItem value="free_shipping">Transport Gratuit</SelectItem>
                        <SelectItem value="gift">Cadou</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="promo-value" className="text-right text-sm font-medium">
                      Valoare
                    </label>
                    <Input id="promo-value" placeholder="Valoarea reducerii" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="promo-min" className="text-right text-sm font-medium">
                      Valoare minimă
                    </label>
                    <Input id="promo-min" placeholder="Valoarea minimă pentru aplicare" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="promo-start" className="text-right text-sm font-medium">
                      Data început
                    </label>
                    <Input id="promo-start" type="date" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="promo-end" className="text-right text-sm font-medium">
                      Data sfârșit
                    </label>
                    <Input id="promo-end" type="date" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="promo-limit" className="text-right text-sm font-medium">
                      Limită utilizări
                    </label>
                    <Input id="promo-limit" type="number" placeholder="Limită utilizări" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <label htmlFor="promo-desc" className="text-right text-sm font-medium pt-2">
                      Descriere
                    </label>
                    <Input id="promo-desc" placeholder="Descriere promoție" className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Salvează Promoția</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Promoții Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeDiscounts}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <Tag className="h-3 w-3 mr-1" />
                Din totalul de {discounts.length} promoții
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Utilizări Promoții</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsedCount}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <ShoppingCart className="h-3 w-3 mr-1" />
                Utilizări totale ale promoțiilor
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Promoții Viitoare</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduledDiscounts}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Programate pentru activare ulterioară
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Promoții Expirate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiredDiscounts}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <Archive className="h-3 w-3 mr-1" />
                Promoții care nu mai sunt valabile
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Gestionare Promoții</CardTitle>
            <CardDescription>
              Managementul campaniilor promoționale și reducerilor aplicabile în magazin.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-4">
                <TabsList className="bg-transparent border-b-0">
                  <TabsTrigger value="active" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none">
                    Active
                  </TabsTrigger>
                  <TabsTrigger value="scheduled" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none">
                    Programate
                  </TabsTrigger>
                  <TabsTrigger value="expired" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none">
                    Expirate
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
                          placeholder="Caută după nume, cod sau descriere..."
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
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="scheduled">Programate</SelectItem>
                            <SelectItem value="expired">Expirate</SelectItem>
                            <SelectItem value="paused">Suspendate</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Tip" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toate tipurile</SelectItem>
                            <SelectItem value="percentage">Procentuale</SelectItem>
                            <SelectItem value="fixed_amount">Sume Fixe</SelectItem>
                            <SelectItem value="free_shipping">Transport Gratuit</SelectItem>
                            <SelectItem value="gift">Cadouri</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nume & Cod</TableHead>
                        <TableHead>Tip & Valoare</TableHead>
                        <TableHead>Perioada</TableHead>
                        <TableHead>Utilizate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDiscounts.map((discount) => (
                        <TableRow key={discount.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{discount.name}</span>
                              <span className="text-xs bg-muted px-2 py-0.5 rounded inline-block w-fit mt-1 font-mono">
                                {discount.code}
                              </span>
                              <span className="text-xs text-muted-foreground mt-1">
                                Min: {discount.minPurchase}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              {getTypeBadge(discount.type)}
                              <span className="text-sm mt-1 font-semibold">{discount.value}</span>
                              <span className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{discount.categories.join(', ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                                <span className="text-sm">Început: {discount.startDate}</span>
                              </div>
                              <div className="flex items-center mt-1">
                                <Clock3 className="h-3 w-3 mr-1 text-muted-foreground" />
                                <span className="text-sm">Sfârșit: {discount.endDate}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>{discount.usedCount} din {discount.totalLimit}</span>
                                <span>{Math.round(discount.usedCount / discount.totalLimit * 100)}%</span>
                              </div>
                              <Progress value={discount.usedCount / discount.totalLimit * 100} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(discount.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Deschide meniu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEditDiscount(discount.id)}>
                                  <Edit className="mr-2 h-4 w-4" /> Editează
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="mr-2 h-4 w-4" /> Duplică
                                </DropdownMenuItem>
                                {discount.status === 'active' && (
                                  <DropdownMenuItem>
                                    <Archive className="mr-2 h-4 w-4" /> Suspendă
                                  </DropdownMenuItem>
                                )}
                                {discount.status === 'paused' && (
                                  <DropdownMenuItem>
                                    <Tag className="mr-2 h-4 w-4" /> Reactivează
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <BarChart2 className="mr-2 h-4 w-4" /> Raport Utilizare
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash className="mr-2 h-4 w-4" /> Șterge
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredDiscounts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Nicio promoție găsită cu criteriile selectate.
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
                <PercentCircle className="h-5 w-5 mr-2" /> 
                Promoții populare
              </CardTitle>
              <CardDescription>
                Cele mai utilizate promoții în ultima lună
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-4">
                {discounts.filter(d => d.status === 'active').sort((a, b) => b.usedCount - a.usedCount).slice(0, 5).map((discount) => (
                  <div key={discount.id} className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-medium">{discount.name}</span>
                      <span className="text-xs text-muted-foreground">Cod: {discount.code}</span>
                    </div>
                    <Badge variant="outline" className="ml-auto">{discount.usedCount} utilizări</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" /> 
                Activitate promoțională
              </CardTitle>
              <CardDescription>
                Cele mai recente utilizări ale promoțiilor
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => {
                  // Mimicking recent activities with random discounts
                  const discount = discounts[Math.floor(Math.random() * discounts.length)];
                  return (
                    <div key={i} className="flex items-center">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                        <Ticket className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm">Promoție <span className="font-medium">{discount.code}</span> utilizată</span>
                        <span className="text-xs text-muted-foreground">Acum {5 - i} {i === 4 ? 'minut' : 'minute'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" /> 
                Promoții care expiră curând
              </CardTitle>
              <CardDescription>
                Promoții active care se apropie de data de expirare
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-4">
                {discounts.filter(d => d.status === 'active').slice(0, 5).map((discount) => (
                  <div key={discount.id} className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-medium">{discount.name}</span>
                      <span className="text-xs text-muted-foreground">Expiră: {discount.endDate}</span>
                    </div>
                    <Badge variant="outline" className="ml-auto">{discount.usedCount}/{discount.totalLimit}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="w-full">
                <Eye className="mr-2 h-4 w-4" />
                Vezi toate promoțiile care expiră
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </EcommerceModuleLayout>
  );
}