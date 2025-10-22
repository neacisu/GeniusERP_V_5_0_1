/**
 * E-commerce Customers Page
 * 
 * This page provides customer management functionality for the online store,
 * including customer profiles, orders history, and analytics.
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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  CreditCard, 
  Heart, 
  DollarSign, 
  User, 
  UserCheck, 
  Filter as FilterIcon,
  RefreshCw,
  FileText,
  Send,
  Tag,
  BarChart2,
  Clock,
  Check
} from 'lucide-react';

export default function CustomersPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerType, setCustomerType] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  
  // Placeholder data - in a real implementation, this would come from an API
  const customers = [
    {
      id: 'CUST-001',
      name: 'Maria Popescu',
      email: 'maria.popescu@example.com',
      phone: '+40 722 123 456',
      location: 'București',
      status: 'active',
      type: 'regular',
      orders: 12,
      totalSpent: '4,250 RON',
      lastOrder: '05 Apr 2025',
      registeredAt: '15 Jan 2024',
      avatar: ''
    },
    {
      id: 'CUST-002',
      name: 'Alexandru Ionescu',
      email: 'alex.ionescu@example.com',
      phone: '+40 733 456 789',
      location: 'Cluj-Napoca',
      status: 'active',
      type: 'vip',
      orders: 28,
      totalSpent: '9,850 RON',
      lastOrder: '10 Apr 2025',
      registeredAt: '03 Mar 2023',
      avatar: ''
    },
    {
      id: 'CUST-003',
      name: 'Elena Dumitrescu',
      email: 'elena.d@example.com',
      phone: '+40 744 789 123',
      location: 'Timișoara',
      status: 'inactive',
      type: 'one-time',
      orders: 1,
      totalSpent: '320 RON',
      lastOrder: '12 Jul 2024',
      registeredAt: '10 Jul 2024',
      avatar: ''
    },
    {
      id: 'CUST-004',
      name: 'Mihai Stoica',
      email: 'mihai.s@example.com',
      phone: '+40 755 321 654',
      location: 'Iași',
      status: 'active',
      type: 'regular',
      orders: 8,
      totalSpent: '2,740 RON',
      lastOrder: '02 Apr 2025',
      registeredAt: '28 May 2024',
      avatar: ''
    },
    {
      id: 'CUST-005',
      name: 'Andreea Vasile',
      email: 'andreea.v@example.com',
      phone: '+40 766 987 654',
      location: 'Brașov',
      status: 'active',
      type: 'vip',
      orders: 22,
      totalSpent: '7,980 RON',
      lastOrder: '08 Apr 2025',
      registeredAt: '15 Jan 2023',
      avatar: ''
    },
    {
      id: 'CUST-006',
      name: 'Cristian Popa',
      email: 'cristi.popa@example.com',
      phone: '+40 777 456 123',
      location: 'Constanța',
      status: 'blocked',
      type: 'regular',
      orders: 3,
      totalSpent: '890 RON',
      lastOrder: '05 Dec 2024',
      registeredAt: '20 Oct 2024',
      avatar: ''
    },
    {
      id: 'CUST-007',
      name: 'Ana Marin',
      email: 'ana.marin@example.com',
      phone: '+40 788 123 456',
      location: 'Oradea',
      status: 'active',
      type: 'regular',
      orders: 6,
      totalSpent: '1,650 RON',
      lastOrder: '28 Mar 2025',
      registeredAt: '03 Jun 2024',
      avatar: ''
    },
    {
      id: 'CUST-008',
      name: 'Victor Stanciu',
      email: 'victor.s@example.com',
      phone: '+40 799 654 321',
      location: 'Sibiu',
      status: 'active',
      type: 'one-time',
      orders: 1,
      totalSpent: '450 RON',
      lastOrder: '15 Feb 2025',
      registeredAt: '15 Feb 2025',
      avatar: ''
    }
  ];
  
  // Stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const newCustomers30Days = 12; // Placeholder - would be calculated from real data
  const totalLifetimeValue = "28,130 RON"; // Placeholder - would be calculated from real data
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Activ</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Inactiv</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Blocat</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };
  
  const getCustomerTypeBadge = (type: string) => {
    switch (type) {
      case 'vip':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">VIP</Badge>;
      case 'regular':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Regulat</Badge>;
      case 'one-time':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Ocazional</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{type}</Badge>;
    }
  };
  
  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  const handleViewCustomer = (customerId: string) => {
    setLocation(`/ecommerce/customers/${customerId}`);
  };
  
  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    // Apply search filter
    const searchMatch = 
      searchTerm === '' || 
      customer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    const statusMatch = statusFilter === 'all' || customer.status === statusFilter;
    
    // Apply type filter
    const typeMatch = customerType === 'all' || customer.type === customerType;
    
    // Apply tab filter
    const tabMatch = 
      (activeTab === 'all') ||
      (activeTab === 'active' && customer.status === 'active') ||
      (activeTab === 'inactive' && customer.status === 'inactive') ||
      (activeTab === 'vip' && customer.type === 'vip');
    
    return searchMatch && statusMatch && typeMatch && tabMatch;
  });
  
  // Top customers by total spent
  const topCustomers = [...customers]
    .sort((a, b) => {
      const aSpent = parseFloat(a.totalSpent.replace(/,/g, '').replace(' RON', ''));
      const bSpent = parseFloat(b.totalSpent.replace(/,/g, '').replace(' RON', ''));
      return bSpent - aSpent;
    })
    .slice(0, 5);
  
  return (
    <EcommerceModuleLayout activeTab="customers">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Clienți</h1>
            <p className="text-muted-foreground">Gestionează clienții din magazinul online</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reîmprospătează
            </Button>
            <Button variant="default" size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Adaugă Client
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clienți</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Clienți înregistrați în magazin
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clienți Activi</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCustomers}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round((activeCustomers / totalCustomers) * 100)}% din total clienți
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clienți Noi (30 zile)</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newCustomers30Days}</div>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">+15%</span> față de perioada anterioară
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valoare Medie Client</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLifetimeValue}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Total venituri generate
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Managementul Clienților</CardTitle>
            <CardDescription>
              Vezi și gestionează baza de clienți a magazinului online
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-4">
                <TabsList className="bg-transparent border-b-0">
                  <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none">
                    Toți Clienții
                  </TabsTrigger>
                  <TabsTrigger value="active" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none">
                    Activi
                  </TabsTrigger>
                  <TabsTrigger value="inactive" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none">
                    Inactivi
                  </TabsTrigger>
                  <TabsTrigger value="vip" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none">
                    VIP
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
                          placeholder="Caută după nume, email sau ID client..."
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
                            <SelectItem value="active">Activi</SelectItem>
                            <SelectItem value="inactive">Inactivi</SelectItem>
                            <SelectItem value="blocked">Blocați</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={customerType} onValueChange={setCustomerType}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Tip Client" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toate tipurile</SelectItem>
                            <SelectItem value="vip">VIP</SelectItem>
                            <SelectItem value="regular">Regulați</SelectItem>
                            <SelectItem value="one-time">Ocazionali</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <FilterIcon className="mr-2 h-4 w-4" />
                        Mai multe Filtre
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Comenzi</TableHead>
                        <TableHead>Valoare</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Înregistrat</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            Niciun client găsit cu criteriile selectate.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewCustomer(customer.id)}>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-9 w-9 mr-3">
                                  <AvatarImage src={customer.avatar} alt={customer.name} />
                                  <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-medium">{customer.name}</span>
                                  <span className="text-xs text-muted-foreground">{customer.id}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-sm">
                                <div className="flex items-center">
                                  <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                  <span>{customer.email}</span>
                                </div>
                                <div className="flex items-center mt-1">
                                  <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                  <span>{customer.phone}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <ShoppingBag className="h-4 w-4 mr-2 text-primary" />
                                <span>{customer.orders}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Ultima: {customer.lastOrder}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{customer.totalSpent}</div>
                              {customer.type === 'vip' && (
                                <Badge variant="outline" className="mt-1">
                                  <Heart className="h-3 w-3 mr-1 text-red-500" />
                                  VIP
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(customer.status)}</TableCell>
                            <TableCell>{customer.registeredAt}</TableCell>
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
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewCustomer(customer.id); }}>
                                    <User className="mr-2 h-4 w-4" /> Vizualizează Profil
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                    <ShoppingBag className="mr-2 h-4 w-4" /> Istoricul Comenzilor
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                    <Send className="mr-2 h-4 w-4" /> Trimite Email
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                    <Tag className="mr-2 h-4 w-4" /> Adaugă Etichetă
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {customer.status === 'active' ? (
                                    <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-red-600">
                                      <User className="mr-2 h-4 w-4" /> Dezactivează
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                      <UserCheck className="mr-2 h-4 w-4" /> Activează
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" /> 
                Top 5 Clienți după Valoare
              </CardTitle>
              <CardDescription>
                Clienții cu cele mai mari valori totale de achiziții
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {topCustomers.map((customer, index) => {
                  // Calculate percentage of progress bar based on highest value
                  const highestValue = parseFloat(topCustomers[0].totalSpent.replace(/,/g, '').replace(' RON', ''));
                  const currentValue = parseFloat(customer.totalSpent.replace(/,/g, '').replace(' RON', ''));
                  const percentage = (currentValue / highestValue) * 100;
                  
                  return (
                    <div key={customer.id} className="space-y-2">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                            <span className="text-primary font-medium">{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-xs text-muted-foreground">{customer.orders} comenzi</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{customer.totalSpent}</div>
                          <div className="text-xs text-muted-foreground">Ultima: {customer.lastOrder}</div>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full">
                <BarChart2 className="mr-2 h-4 w-4" />
                Vezi raport detaliat
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" /> 
                Clienți Recenți
              </CardTitle>
              <CardDescription>
                Cei mai recent înregistrați
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...customers]
                  .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
                  .slice(0, 5)
                  .map((customer) => (
                    <div key={customer.id} className="flex items-center border-b pb-3 last:border-0 last:pb-0">
                      <Avatar className="h-9 w-9 mr-3">
                        <AvatarImage src={customer.avatar} alt={customer.name} />
                        <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-xs text-muted-foreground">{customer.registeredAt}</div>
                      </div>
                      {customer.orders > 0 ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          {customer.orders} comenzi
                        </Badge>
                      ) : (
                        <Badge variant="outline">Fără comenzi</Badge>
                      )}
                    </div>
                  ))
                }
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full">
                <User className="mr-2 h-4 w-4" />
                Vezi toți clienții noi
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </EcommerceModuleLayout>
  );
}