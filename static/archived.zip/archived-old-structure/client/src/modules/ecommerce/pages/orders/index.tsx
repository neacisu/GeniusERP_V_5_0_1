/**
 * E-commerce Orders Page
 * 
 * This page displays a list of orders with filtering, sorting, and search capabilities.
 * It allows users to view order details, update order status, and export orders.
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
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  MoreHorizontal, 
  Download,
  ChevronDown,
  RefreshCw,
  Eye,
  Printer,
  FileText,
  CheckCircle,
  XCircle,
  Send,
  ShoppingBag
} from 'lucide-react';

export default function OrdersPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Placeholder data - in a real implementation, this would come from an API
  const orders = [
    { 
      id: 'ORD-8945', 
      orderNumber: '#8945',
      customerName: 'Alexandru Popescu', 
      customerEmail: 'alex.popescu@example.com',
      date: '11 Apr 2025', 
      total: '299.99 RON', 
      status: 'completed',
      paymentStatus: 'paid',
      shippingMethod: 'Fan Courier',
      items: 3
    },
    { 
      id: 'ORD-8944', 
      orderNumber: '#8944',
      customerName: 'Maria Ionescu', 
      customerEmail: 'maria.ionescu@example.com',
      date: '10 Apr 2025', 
      total: '129.50 RON', 
      status: 'processing',
      paymentStatus: 'paid',
      shippingMethod: 'Cargus',
      items: 1
    },
    { 
      id: 'ORD-8943', 
      orderNumber: '#8943',
      customerName: 'Andrei Mihai', 
      customerEmail: 'andrei.mihai@example.com',
      date: '10 Apr 2025', 
      total: '89.99 RON', 
      status: 'completed',
      paymentStatus: 'paid',
      shippingMethod: 'Fan Courier',
      items: 2
    },
    { 
      id: 'ORD-8942', 
      orderNumber: '#8942',
      customerName: 'Elena Vasilescu', 
      customerEmail: 'elena.vasilescu@example.com',
      date: '09 Apr 2025', 
      total: '599.99 RON', 
      status: 'pending',
      paymentStatus: 'pending',
      shippingMethod: 'Poșta Română',
      items: 4
    },
    { 
      id: 'ORD-8941', 
      orderName: '#8941',
      customerName: 'Cristian Popa', 
      customerEmail: 'cristian.popa@example.com',
      date: '09 Apr 2025', 
      total: '49.99 RON', 
      status: 'completed',
      paymentStatus: 'paid',
      shippingMethod: 'Fan Courier',
      items: 1
    },
    { 
      id: 'ORD-8940', 
      orderNumber: '#8940',
      customerName: 'Ana Dumitrescu', 
      customerEmail: 'ana.dumitrescu@example.com',
      date: '08 Apr 2025', 
      total: '149.99 RON', 
      status: 'cancelled',
      paymentStatus: 'refunded',
      shippingMethod: 'Cargus',
      items: 2
    },
    { 
      id: 'ORD-8939', 
      orderNumber: '#8939',
      customerName: 'Mihai Stoica', 
      customerEmail: 'mihai.stoica@example.com',
      date: '08 Apr 2025', 
      total: '249.99 RON', 
      status: 'completed',
      paymentStatus: 'paid',
      shippingMethod: 'Fan Courier',
      items: 3
    },
    { 
      id: 'ORD-8938', 
      orderNumber: '#8938',
      customerName: 'Ioana Munteanu', 
      customerEmail: 'ioana.munteanu@example.com',
      date: '07 Apr 2025', 
      total: '399.99 RON', 
      status: 'processing',
      paymentStatus: 'paid',
      shippingMethod: 'DHL',
      items: 2
    },
  ];
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Finalizată</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">În procesare</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">În așteptare</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Anulată</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };
  
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Plătit</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">În așteptare</Badge>;
      case 'refunded':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Rambursat</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };
  
  const handleViewOrder = (orderId: string) => {
    setLocation(`/ecommerce/orders/${orderId}`);
  };
  
  // Filter orders based on search term and filters
  const filteredOrders = orders.filter(order => {
    // Apply search filter
    const searchMatch = 
      searchTerm === '' || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    
    // Apply date filter (simplified for demo)
    let dateMatch = true;
    if (dateFilter === 'today') {
      dateMatch = order.date === '11 Apr 2025';
    } else if (dateFilter === 'yesterday') {
      dateMatch = order.date === '10 Apr 2025';
    } else if (dateFilter === 'thisWeek') {
      dateMatch = ['11 Apr 2025', '10 Apr 2025', '09 Apr 2025', '08 Apr 2025', '07 Apr 2025'].includes(order.date);
    }
    
    return searchMatch && statusMatch && dateMatch;
  });
  
  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  
  return (
    <EcommerceModuleLayout activeTab="orders">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Comenzi</h1>
            <p className="text-muted-foreground">Gestionează și procesează comenzile din magazinul online</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reîmprospătează
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="default" size="sm">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Comandă Nouă
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Toate Comenzile</CardTitle>
            <CardDescription>
              Au fost găsite {filteredOrders.length} comenzi în sistem.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6 py-3 border-b flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex flex-1 items-center space-x-2">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Caută după nume, email sau ID..."
                    className="w-full pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-row space-x-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Toate statusurile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate statusurile</SelectItem>
                      <SelectItem value="pending">În așteptare</SelectItem>
                      <SelectItem value="processing">În procesare</SelectItem>
                      <SelectItem value="completed">Finalizate</SelectItem>
                      <SelectItem value="cancelled">Anulate</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Toate datele" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate datele</SelectItem>
                      <SelectItem value="today">Astăzi</SelectItem>
                      <SelectItem value="yesterday">Ieri</SelectItem>
                      <SelectItem value="thisWeek">Această săptămână</SelectItem>
                      <SelectItem value="thisMonth">Această lună</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comandă</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plată</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => (
                    <TableRow key={order.id} onClick={() => handleViewOrder(order.id)} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{order.orderNumber || order.id}</TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{order.customerName}</span>
                          <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>{order.total}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
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
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewOrder(order.id); }}>
                              <Eye className="mr-2 h-4 w-4" /> Vizualizare
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Printer className="mr-2 h-4 w-4" /> Printează
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <FileText className="mr-2 h-4 w-4" /> Generează factură
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Send className="mr-2 h-4 w-4" /> Trimite email
                            </DropdownMenuItem>
                            {order.status !== 'completed' && (
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Marchează ca finalizat
                              </DropdownMenuItem>
                            )}
                            {order.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-red-600">
                                <XCircle className="mr-2 h-4 w-4" /> Anulează comandă
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Nicio comandă găsită.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
            
            {filteredOrders.length > 0 && totalPages > 1 && (
              <div className="py-4 border-t">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(prev => Math.max(prev - 1, 1));
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(prev => Math.min(prev + 1, totalPages));
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EcommerceModuleLayout>
  );
}