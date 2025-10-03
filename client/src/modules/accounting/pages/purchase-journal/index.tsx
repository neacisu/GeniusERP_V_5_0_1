import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  PlusCircle,
  FileText,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  Eye,
  Download,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  UserCircle,
  Building,
  ShoppingCart,
  Send,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";

// Type definitions
type PurchaseInvoice = {
  id: string;
  number: string;
  supplierNumber: string;
  date: string;
  dueDate: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  status: 'draft' | 'registered' | 'paid' | 'canceled' | 'overdue';
  posted: boolean;
  createdBy: string;
  createdAt: string;
};

type InvoiceItem = {
  id: string;
  invoiceId: string;
  productCode: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  amount: number;
  vatAmount: number;
  totalAmount: number;
};

type InvoiceJournalEntry = {
  id: string;
  journalEntryId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
};

type Supplier = {
  id: string;
  name: string;
  fiscalCode: string;
  registrationNumber: string;
  address: string;
  contactName?: string;
  email?: string;
  phone?: string;
};

export default function PurchaseJournalPage() {
  const { toast } = useToast();
  
  // Main section selector  
  const [mainSection, setMainSection] = useState<'invoices' | 'journal-report'>('invoices');
  
  // Invoices section
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isJournalDialogOpen, setIsJournalDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage] = useState(10);
  const [dateRange, setDateRange] = useState({ 
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  });
  
  // Journal Report section (NOU!)
  const [reportPeriodStart, setReportPeriodStart] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [reportPeriodEnd, setReportPeriodEnd] = useState<Date>(new Date());
  
  // Fetch Purchase Journal Report
  const { data: journalReport, isLoading: isLoadingReport, refetch: refetchReport } = useQuery({
    queryKey: ['purchase-journal-report', reportPeriodStart, reportPeriodEnd],
    queryFn: async () => {
      const params = new URLSearchParams({
        periodStart: format(reportPeriodStart, 'yyyy-MM-dd'),
        periodEnd: format(reportPeriodEnd, 'yyyy-MM-dd')
      });
      const response = await apiRequest(`/api/accounting/purchases/journal?${params}`);
      return response.data || response;
    },
    enabled: mainSection === 'journal-report' && !!reportPeriodStart && !!reportPeriodEnd
  });

  // Fetch purchase invoices
  const { data: invoicesResponse, isLoading: isLoadingInvoices } = useQuery<{ data: PurchaseInvoice[]; total: number; page: number; limit: number }>({
    queryKey: ['/api/accounting/purchases/invoices', dateRange],
    // This is just for structure - we'll use actual API data in production
    placeholderData: { data: [
      { 
        id: '1', 
        number: 'ACH-2025-0001', 
        supplierNumber: 'F-12345', 
        date: '2025-04-10', 
        dueDate: '2025-05-10',
        supplierId: '1',
        supplierName: 'SC Tech Supply SRL',
        amount: 4200.00,
        vatAmount: 798.00,
        totalAmount: 4998.00,
        status: 'registered',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-10T10:15:00Z'
      },
      { 
        id: '2', 
        number: 'ACH-2025-0002', 
        supplierNumber: 'F-23456', 
        date: '2025-04-09', 
        dueDate: '2025-05-09',
        supplierId: '2',
        supplierName: 'SC Office Supplies SRL',
        amount: 1850.00,
        vatAmount: 351.50,
        totalAmount: 2201.50,
        status: 'paid',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-09T14:35:00Z'
      },
      { 
        id: '3', 
        number: 'ACH-2025-0003', 
        supplierNumber: 'F-7890', 
        date: '2025-04-09', 
        dueDate: '2025-05-09',
        supplierId: '3',
        supplierName: 'SC Transport Solutions SA',
        amount: 3600.00,
        vatAmount: 684.00,
        totalAmount: 4284.00,
        status: 'overdue',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-09T09:15:00Z'
      },
      { 
        id: '4', 
        number: 'ACH-2025-0004', 
        supplierNumber: 'F-4567', 
        date: '2025-04-08', 
        dueDate: '2025-05-08',
        supplierId: '4',
        supplierName: 'SC Utility Provider SA',
        amount: 2450.00,
        vatAmount: 465.50,
        totalAmount: 2915.50,
        status: 'registered',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-08T16:45:00Z'
      },
      { 
        id: '5', 
        number: 'ACH-2025-0005', 
        supplierNumber: 'F-5522', 
        date: '2025-04-08', 
        dueDate: '2025-05-08',
        supplierId: '5',
        supplierName: 'SC Cleaning Services SRL',
        amount: 1240.00,
        vatAmount: 235.60,
        totalAmount: 1475.60,
        status: 'paid',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-08T10:25:00Z'
      },
      { 
        id: '6', 
        number: 'ACH-2025-0006', 
        supplierNumber: 'F-6789', 
        date: '2025-04-07', 
        dueDate: '2025-05-07',
        supplierId: '1',
        supplierName: 'SC Tech Supply SRL',
        amount: 7850.00,
        vatAmount: 1491.50,
        totalAmount: 9341.50,
        status: 'registered',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-07T11:30:00Z'
      },
      { 
        id: '7', 
        number: 'ACH-2025-0007', 
        supplierNumber: 'F-7788', 
        date: '2025-04-07', 
        dueDate: '2025-05-07',
        supplierId: '6',
        supplierName: 'SC Marketing Agency SRL',
        amount: 5320.00,
        vatAmount: 1010.80,
        totalAmount: 6330.80,
        status: 'registered',
        posted: false,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-07T14:45:00Z'
      },
      { 
        id: '8', 
        number: 'ACH-2025-0008', 
        supplierNumber: 'F-8877', 
        date: '2025-04-06', 
        dueDate: '2025-05-06',
        supplierId: '6',
        supplierName: 'SC Marketing Agency SRL',
        amount: 1540.00,
        vatAmount: 292.60,
        totalAmount: 1832.60,
        status: 'draft',
        posted: false,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-06T09:55:00Z'
      },
      { 
        id: '9', 
        number: 'ACH-2025-0009', 
        supplierNumber: 'F-9900', 
        date: '2025-04-05', 
        dueDate: '2025-05-05',
        supplierId: '3',
        supplierName: 'SC Transport Solutions SA',
        amount: 2150.00,
        vatAmount: 408.50,
        totalAmount: 2558.50,
        status: 'canceled',
        posted: false,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-05T15:20:00Z'
      },
      { 
        id: '10', 
        number: 'ACH-2025-0010', 
        supplierNumber: 'F-1010', 
        date: '2025-04-05', 
        dueDate: '2025-05-05',
        supplierId: '4',
        supplierName: 'SC Utility Provider SA',
        amount: 3650.00,
        vatAmount: 693.50,
        totalAmount: 4343.50,
        status: 'registered',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-05T11:10:00Z'
      },
    ], total: 10, page: 1, limit: 10 }
  });

  // Extract invoices array from response and map DB fields to UI
  const invoices = (invoicesResponse?.data || []).map((inv: any) => ({
    ...inv,
    supplierName: inv.customerName || inv.supplierName, // DB folosește customer_name pentru purchase
    supplierNumber: inv.invoiceNumber || inv.supplierNumber, // DB folosește invoice_number
    number: String(inv.number || inv.series || ''), // Conversie safe la string
  }));

  // Fetch invoice details when viewing an invoice
  const { data: invoiceItems, isLoading: isLoadingItems } = useQuery<InvoiceItem[]>({
    queryKey: ['/api/accounting/purchases/invoices', selectedInvoice?.id, 'items'],
    enabled: !!selectedInvoice && isViewDialogOpen,
    // This is just for structure - we'll use actual API data in production
    placeholderData: [
      { 
        id: '1',
        invoiceId: '1',
        productCode: 'PROD-001',
        productName: 'Laptop Dell Latitude 5520',
        description: 'Laptop pentru departamentul de vânzări',
        quantity: 2,
        unitPrice: 2100.00,
        vatRate: 19,
        amount: 4200.00,
        vatAmount: 798.00,
        totalAmount: 4998.00
      }
    ]
  });

  // Fetch invoice journal entry
  const { data: journalEntry, isLoading: isLoadingJournal } = useQuery<InvoiceJournalEntry[]>({
    queryKey: ['/api/accounting/purchases/invoices', selectedInvoice?.id, 'journal'],
    enabled: !!selectedInvoice && isJournalDialogOpen && selectedInvoice.posted,
    // This is just for structure - we'll use actual API data in production
    placeholderData: [
      {
        id: '1',
        journalEntryId: 'JE-2025-001',
        accountCode: '213',
        accountName: 'Echipamente tehnologice',
        description: 'Factură achiziție ACH-2025-0001',
        debit: 4200.00,
        credit: 0
      },
      {
        id: '2',
        journalEntryId: 'JE-2025-001',
        accountCode: '4426',
        accountName: 'TVA deductibilă',
        description: 'Factură achiziție ACH-2025-0001',
        debit: 798.00,
        credit: 0
      },
      {
        id: '3',
        journalEntryId: 'JE-2025-001',
        accountCode: '401',
        accountName: 'Furnizori',
        description: 'Factură achiziție ACH-2025-0001',
        debit: 0,
        credit: 4998.00
      }
    ]
  });

  // Fetch supplier details when viewing an invoice
  const { data: supplier, isLoading: isLoadingSupplier } = useQuery<Supplier>({
    queryKey: ['/api/accounting/suppliers', selectedInvoice?.supplierId],
    enabled: !!selectedInvoice && isViewDialogOpen,
    // This is just for structure - we'll use actual API data in production
    placeholderData: { 
      id: '1',
      name: 'SC Tech Supply SRL',
      fiscalCode: 'RO12345678',
      registrationNumber: 'J40/123/2020',
      address: 'Str. Tehnologiei nr. 123, București, Sector 1',
      contactName: 'Mihai Popescu',
      email: 'contact@techsupply.ro',
      phone: '+40722234567'
    }
  });

  // Filter invoices based on search term and active tab
  const filteredInvoices = invoices?.filter((invoice: any) => {
    // Filter by search term
    const matchesSearch = 
      String(invoice.number || invoice.series || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (invoice.supplierNumber || invoice.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.supplierName || invoice.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab (status)
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'draft' && invoice.status === 'draft') ||
      (activeTab === 'registered' && invoice.status === 'registered') ||
      (activeTab === 'paid' && invoice.status === 'paid') ||
      (activeTab === 'overdue' && invoice.status === 'overdue') ||
      (activeTab === 'canceled' && invoice.status === 'canceled');
    
    return matchesSearch && matchesTab;
  }) || [];

  // Pagination logic
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  // Format date strings
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO');
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      minimumFractionDigits: 2
    }).format(value);
  };

  // Handle opening the view dialog
  const handleViewInvoice = (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  // Handle opening the journal entries dialog
  const handleViewJournal = (invoice: PurchaseInvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInvoice(invoice);
    setIsJournalDialogOpen(true);
  };

  // Get status badge with improved colors and icons
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Ciornă
            </span>
          </div>
        );
      case 'issued':
      case 'registered':
        return (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Înregistrată
            </span>
          </div>
        );
      case 'sent':
        return (
          <div className="flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              Trimisă
            </span>
          </div>
        );
      case 'paid':
        return (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
              Plătită
            </span>
          </div>
        );
      case 'overdue':
        return (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
              Restantă
            </span>
          </div>
        );
      case 'canceled':
        return (
          <div className="flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-300">
              Anulată
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-300">
              {status}
            </span>
          </div>
        );
    }
  };

  return (
    <AppLayout>
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/accounting">Contabilitate</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Jurnal Cumpărări</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jurnal Cumpărări</h1>
          <p className="text-sm text-gray-500">Gestionați facturile de achiziție și urmăriți plățile</p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                <span>Export</span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Jurnal Cumpărări</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span>Export PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Export Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Export CSV</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            <span>Factură Nouă</span>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-4">
            {/* First row - search and filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Caută după număr sau furnizor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="dateFrom" className="text-sm whitespace-nowrap">De la:</Label>
                  <Input 
                    id="dateFrom" 
                    type="date" 
                    value={dateRange.from}
                    onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                    className="w-auto"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="dateTo" className="text-sm whitespace-nowrap">Până la:</Label>
                  <Input 
                    id="dateTo" 
                    type="date" 
                    value={dateRange.to}
                    onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                    className="w-auto"
                  />
                </div>
                
                <Button variant="outline" size="sm" className="ml-2">
                  <Filter className="h-4 w-4 mr-2" />
                  <span>Filtrează</span>
                </Button>
              </div>
            </div>
            
            {/* Second row - tabs for status filter */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full sm:w-auto overflow-auto">
                <TabsTrigger value="all">Toate</TabsTrigger>
                <TabsTrigger value="draft">Ciorne</TabsTrigger>
                <TabsTrigger value="registered">Înregistrate</TabsTrigger>
                <TabsTrigger value="paid">Plătite</TabsTrigger>
                <TabsTrigger value="overdue">Restante</TabsTrigger>
                <TabsTrigger value="canceled">Anulate</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="border-b">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="w-32">Număr intern</TableHead>
                  <TableHead className="w-32">Număr furnizor</TableHead>
                  <TableHead className="w-24">Dată</TableHead>
                  <TableHead className="w-32">Scadență</TableHead>
                  <TableHead>Furnizor</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="text-right w-28">Valoare</TableHead>
                  <TableHead className="text-right w-24">TVA</TableHead>
                  <TableHead className="text-right w-28">Total</TableHead>
                  <TableHead className="text-right w-24">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingInvoices ? (
                  Array(5).fill(null).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={10} className="h-16">
                        <div className="h-8 w-full bg-gray-100 animate-pulse rounded"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : currentInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-gray-500">
                      {searchTerm || activeTab !== 'all' ? (
                        <>
                          <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>Nu s-au găsit facturi care să corespundă filtrelor.</p>
                          <Button variant="link" onClick={() => { setSearchTerm(''); setActiveTab('all'); }}>
                            Resetează filtrele
                          </Button>
                        </>
                      ) : (
                        <>
                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>Nu există facturi de achiziție pentru perioada selectată.</p>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentInvoices.map((invoice) => (
                    <TableRow 
                      key={invoice.id} 
                      className={`cursor-pointer hover:bg-gray-50 ${invoice.status === 'canceled' ? 'opacity-60' : ''}`}
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      <TableCell className="font-medium">{invoice.number}</TableCell>
                      <TableCell>{invoice.supplierNumber}</TableCell>
                      <TableCell>{formatDate(invoice.date)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {invoice.supplierName}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(invoice.vatAmount)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right p-0 pr-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewInvoice(invoice);
                            }}
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </Button>
                          
                          {invoice.posted && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => handleViewJournal(invoice, e)}
                            >
                              <FileText className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between p-4">
            <div className="text-sm text-gray-500">
              Afișare {indexOfFirstInvoice + 1}-{Math.min(indexOfLastInvoice, filteredInvoices.length)} din {filteredInvoices.length} facturi
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Anterioara
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Următoarea
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Detalii Factură Achiziție</DialogTitle>
            <DialogDescription>
              Vizualizați informațiile și articolele facturii
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="py-4 overflow-y-auto flex-1 pr-2">
              {/* Invoice header */}
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">Factură {selectedInvoice.number}</h3>
                    <p className="text-sm text-gray-500 mt-1">Nr. furnizor: {selectedInvoice.supplierNumber}</p>
                    <p className="text-sm text-gray-500">Data: {formatDate(selectedInvoice.date)}</p>
                    <p className="text-sm text-gray-500">Scadență: {formatDate(selectedInvoice.dueDate)}</p>
                  </div>
                  <div>
                    {getStatusBadge(selectedInvoice.status)}
                    {selectedInvoice.posted && (
                      <span className="inline-block ml-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                        Contabilizată
                      </span>
                    )}
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Supplier info */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm font-medium text-gray-500">
                      <Building className="h-4 w-4 mr-2" />
                      <span>Informații Furnizor</span>
                    </div>
                    
                    {isLoadingSupplier ? (
                      <div className="space-y-2">
                        <div className="h-5 w-48 bg-gray-200 animate-pulse rounded"></div>
                        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                        <div className="h-4 w-52 bg-gray-200 animate-pulse rounded"></div>
                      </div>
                    ) : supplier ? (
                      <div className="space-y-1">
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm">CUI: {supplier.fiscalCode}</p>
                        <p className="text-sm">Reg. Com.: {supplier.registrationNumber}</p>
                        <p className="text-sm">{supplier.address}</p>
                        {supplier.contactName && (
                          <div className="flex items-center mt-2 text-sm">
                            <UserCircle className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                            <span>{supplier.contactName}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Furnizor: {selectedInvoice.supplierName}</p>
                    )}
                  </div>
                  
                  {/* Invoice summary */}
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-500">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      <span>Sumar Factură</span>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">Valoare netă:</span>
                        <span className="font-medium">{formatCurrency(selectedInvoice.amount)} RON</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">TVA (19%):</span>
                        <span className="font-medium">{formatCurrency(selectedInvoice.vatAmount)} RON</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span className="font-medium">Total factură:</span>
                        <span className="font-bold">{formatCurrency(selectedInvoice.totalAmount)} RON</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-1 text-sm text-gray-500">
                      <p>Înregistrată de: {selectedInvoice.createdBy}</p>
                      <p>Data înregistrării: {new Date(selectedInvoice.createdAt).toLocaleString('ro-RO')}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Invoice items */}
              <h3 className="text-base font-medium mb-3">Articole Factură</h3>
              
              {isLoadingItems ? (
                <div className="flex justify-center items-center p-8">
                  <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2">Se încarcă detaliile...</span>
                </div>
              ) : invoiceItems && invoiceItems.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-28">Cod Produs</TableHead>
                        <TableHead>Denumire</TableHead>
                        <TableHead className="w-20 text-right">Cant.</TableHead>
                        <TableHead className="text-right">Preț Unit.</TableHead>
                        <TableHead className="text-right">Valoare</TableHead>
                        <TableHead className="w-20 text-right">TVA (%)</TableHead>
                        <TableHead className="text-right">TVA</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.productCode}</TableCell>
                          <TableCell>
                            <div>
                              <p>{item.productName}</p>
                              {item.description && (
                                <p className="text-xs text-gray-500">{item.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {item.vatRate}%
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(item.vatAmount)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatCurrency(item.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <tfoot>
                      <tr className="bg-gray-50 font-medium">
                        <td colSpan={4} className="px-4 py-2 text-right">
                          Total:
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatCurrency(invoiceItems.reduce((sum, item) => sum + item.amount, 0))} RON
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatCurrency(invoiceItems.reduce((sum, item) => sum + item.vatAmount, 0))} RON
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatCurrency(invoiceItems.reduce((sum, item) => sum + item.totalAmount, 0))} RON
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">Nu există articole pentru această factură.</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <div className="flex justify-between w-full">
              <div>
                {selectedInvoice?.posted && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      setIsJournalDialogOpen(true);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    <span>Vezi nota contabilă</span>
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Închide
                </Button>
                
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Printează
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Journal Entry Dialog */}
      <Dialog open={isJournalDialogOpen} onOpenChange={setIsJournalDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Notă Contabilă Factură</DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <>Înregistrarea contabilă pentru factura {selectedInvoice.number}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="py-4 overflow-y-auto flex-1 pr-2">
              {/* Invoice reference */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <ShoppingCart className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">
                      Factură achiziție {selectedInvoice.number}
                    </h3>
                    <p className="text-sm text-blue-700">
                      Furnizor: {selectedInvoice.supplierName} | Data: {formatDate(selectedInvoice.date)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Journal entry lines */}
              {isLoadingJournal ? (
                <div className="flex justify-center items-center p-8">
                  <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2">Se încarcă înregistrările contabile...</span>
                </div>
              ) : journalEntry && journalEntry.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-24">Cont</TableHead>
                        <TableHead>Denumire Cont</TableHead>
                        <TableHead>Descriere</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {journalEntry.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-medium">{line.accountCode}</TableCell>
                          <TableCell>{line.accountName}</TableCell>
                          <TableCell>{line.description}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {line.debit > 0 ? formatCurrency(line.debit) : ""}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {line.credit > 0 ? formatCurrency(line.credit) : ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <tfoot>
                      <tr className="bg-gray-50 font-medium">
                        <td colSpan={3} className="px-4 py-2 text-right">
                          Total:
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatCurrency(journalEntry.reduce((sum, line) => sum + line.debit, 0))} RON
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatCurrency(journalEntry.reduce((sum, line) => sum + line.credit, 0))} RON
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">
                    {selectedInvoice.posted 
                      ? "Nu există înregistrări contabile pentru această factură." 
                      : "Factura nu a fost contabilizată încă."
                    }
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button variant="outline" onClick={() => setIsJournalDialogOpen(false)}>
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}