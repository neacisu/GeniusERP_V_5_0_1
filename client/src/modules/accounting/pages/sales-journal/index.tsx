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
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  AlertCircle,
  Loader2,
  FileSpreadsheet
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

// Type definitions
type SalesInvoice = {
  id: string;
  number: string;
  series: string;
  date: string;
  dueDate: string;
  customerId: string; // DB field is customer_id
  customerName: string; // DB field is customer_name
  // Legacy field names for backward compatibility
  clientId?: string;
  clientName?: string;
  amount: number;
  netAmount?: number;
  vatAmount: number;
  totalAmount: number;
  status: 'draft' | 'issued' | 'paid' | 'canceled' | 'overdue';
  posted: boolean;
  createdBy: string; // UUID of user
  createdByName?: string; // Full name of user (from API)
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

type Client = {
  id: string;
  name: string;
  fiscalCode: string;
  registrationNumber: string;
  address: string;
  contactName?: string;
  email?: string;
  phone?: string;
};

export default function SalesJournalPage() {
  const { toast } = useToast();
  
  // Main section selector
  const [mainSection, setMainSection] = useState<'invoices' | 'journal-report'>('invoices');
  
  // Invoices section states
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isJournalDialogOpen, setIsJournalDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage] = useState(10);
  const [dateRange, setDateRange] = useState({ 
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  });
  
  // Journal Report section states
  const [reportPeriodStart, setReportPeriodStart] = useState<Date>(startOfMonth(new Date()));
  const [reportPeriodEnd, setReportPeriodEnd] = useState<Date>(endOfMonth(new Date()));
  const [reportType, setReportType] = useState<'DETAILED' | 'SUMMARY'>('DETAILED');
  
  // NEW: State pentru crearea facturii COMPLET
  const [isCreateInvoiceDialogOpen, setIsCreateInvoiceDialogOpen] = useState(false);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    invoiceNumber: '',
    series: 'FV',
    customerId: '',
    customerName: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
    paymentTermDays: 30
  });
  const [newInvoiceItems, setNewInvoiceItems] = useState([{
    id: '1',
    productName: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    vatRate: 19,
    netAmount: 0,
    vatAmount: 0,
    grossAmount: 0
  }]);
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);
  
  // Fetch Sales Journal Report (OMFP 2634/2015)
  const { data: journalReport, isLoading: isLoadingReport, refetch: refetchReport } = useQuery({
    queryKey: ['sales-journal-report', reportPeriodStart, reportPeriodEnd, reportType],
    queryFn: async () => {
      const params = new URLSearchParams({
        periodStart: format(reportPeriodStart, 'yyyy-MM-dd'),
        periodEnd: format(reportPeriodEnd, 'yyyy-MM-dd'),
        reportType
      });
      
      // Folosim apiRequest pentru a include automat token-ul de autentificare
      const response = await apiRequest(`/api/accounting/sales/journal?${params}`);
      return response.data || response;
    },
    enabled: mainSection === 'journal-report' && !!reportPeriodStart && !!reportPeriodEnd
  });

  // Fetch sales invoices
  const { data: invoicesResponse, isLoading: isLoadingInvoices } = useQuery<{ data: SalesInvoice[]; total: number; page: number; limit: number }>({
    queryKey: ['/api/accounting/sales/invoices', dateRange],
    // This is just for structure - we'll use actual API data in production
    placeholderData: { data: [
      { 
        id: '1', 
        number: '0001', 
        series: 'FACT', 
        date: '2025-04-10', 
        dueDate: '2025-05-10',
        customerId: '1',
        customerName: 'SC ABC SRL',
        amount: 4500.00,
        vatAmount: 855.00,
        totalAmount: 5355.00,
        status: 'issued',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-10T10:15:00Z'
      },
      { 
        id: '2', 
        number: '0002', 
        series: 'FACT', 
        date: '2025-04-09', 
        dueDate: '2025-05-09',
        customerId: '2',
        customerName: 'SC Metaltec Industries SRL',
        amount: 12450.00,
        vatAmount: 2365.50,
        totalAmount: 14815.50,
        status: 'paid',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-09T14:35:00Z'
      },
      { 
        id: '3', 
        number: '0003', 
        series: 'FACT', 
        date: '2025-04-09', 
        dueDate: '2025-05-09',
        customerId: '3',
        customerName: 'SC IT Solutions SA',
        amount: 3240.00,
        vatAmount: 615.60,
        totalAmount: 3855.60,
        status: 'overdue',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-09T09:15:00Z'
      },
      { 
        id: '4', 
        number: '0004', 
        series: 'FACT', 
        date: '2025-04-08', 
        dueDate: '2025-05-08',
        customerId: '4',
        customerName: 'SC Construct Group SRL',
        amount: 8750.00,
        vatAmount: 1662.50,
        totalAmount: 10412.50,
        status: 'issued',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-08T16:45:00Z'
      },
      { 
        id: '5', 
        number: '0005', 
        series: 'FACT', 
        date: '2025-04-08', 
        dueDate: '2025-05-08',
        customerId: '5',
        customerName: 'SC Food Delivery SRL',
        amount: 5240.00,
        vatAmount: 995.60,
        totalAmount: 6235.60,
        status: 'paid',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-08T10:25:00Z'
      },
      { 
        id: '6', 
        number: '0006', 
        series: 'FACT', 
        date: '2025-04-07', 
        dueDate: '2025-05-07',
        customerId: '1',
        customerName: 'SC ABC SRL',
        amount: 1850.00,
        vatAmount: 351.50,
        totalAmount: 2201.50,
        status: 'issued',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-07T11:30:00Z'
      },
      { 
        id: '7', 
        number: '0007', 
        series: 'FACT', 
        date: '2025-04-07', 
        dueDate: '2025-05-07',
        customerId: '2',
        customerName: 'SC Metaltec Industries SRL',
        amount: 7320.00,
        vatAmount: 1390.80,
        totalAmount: 8710.80,
        status: 'issued',
        posted: false,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-07T14:45:00Z'
      },
      { 
        id: '8', 
        number: '0008', 
        series: 'FACT', 
        date: '2025-04-06', 
        dueDate: '2025-05-06',
        customerId: '6',
        customerName: 'SC Pharma Distribution SRL',
        amount: 6540.00,
        vatAmount: 1242.60,
        totalAmount: 7782.60,
        status: 'draft',
        posted: false,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-06T09:55:00Z'
      },
      { 
        id: '9', 
        number: '0009', 
        series: 'FACT', 
        date: '2025-04-05', 
        dueDate: '2025-05-05',
        customerId: '3',
        customerName: 'SC IT Solutions SA',
        amount: 4850.00,
        vatAmount: 921.50,
        totalAmount: 5771.50,
        status: 'canceled',
        posted: false,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-05T15:20:00Z'
      },
      { 
        id: '10', 
        number: '0010', 
        series: 'FACT', 
        date: '2025-04-05', 
        dueDate: '2025-05-05',
        customerId: '4',
        customerName: 'SC Construct Group SRL',
        amount: 9650.00,
        vatAmount: 1833.50,
        totalAmount: 11483.50,
        status: 'issued',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-05T11:10:00Z'
      },
    ], total: 10, page: 1, limit: 10 }
  });

  // Extract invoices array from response
  const invoices = invoicesResponse?.data || [];

  // Extract invoice items from selected invoice (already loaded in the invoice data)
  const invoiceItems: any[] = (selectedInvoice as any)?.lines || [];
  const isLoadingItems = false;
  
  // Legacy query kept for reference - not used anymore since lines come with invoice
  const { data: _legacyInvoiceItems } = useQuery<InvoiceItem[]>({
    queryKey: ['/api/accounting/sales/invoices', selectedInvoice?.id, 'items'],
    enabled: false, // Disabled - we use invoice.lines instead
    // This is just for structure - we'll use actual API data in production
    placeholderData: [
      { 
        id: '1',
        invoiceId: '1',
        productCode: 'PROD-001',
        productName: 'Servicii consultanță',
        description: 'Servicii consultanță luna aprilie 2025',
        quantity: 40,
        unitPrice: 100.00,
        vatRate: 19,
        amount: 4000.00,
        vatAmount: 760.00,
        totalAmount: 4760.00
      },
      { 
        id: '2',
        invoiceId: '1',
        productCode: 'PROD-025',
        productName: 'Licență software',
        description: 'Licență anuală software ERP',
        quantity: 1,
        unitPrice: 500.00,
        vatRate: 19,
        amount: 500.00,
        vatAmount: 95.00,
        totalAmount: 595.00
      }
    ]
  });

  // Fetch invoice journal entry
  const { data: journalEntry, isLoading: isLoadingJournal } = useQuery<InvoiceJournalEntry[]>({
    queryKey: ['/api/accounting/sales/invoices', selectedInvoice?.id, 'journal'],
    enabled: !!selectedInvoice && isJournalDialogOpen && selectedInvoice.posted,
    // This is just for structure - we'll use actual API data in production
    placeholderData: [
      {
        id: '1',
        journalEntryId: 'JE-2025-001',
        accountCode: '4111',
        accountName: 'Clienți',
        description: 'Factura vânzare FACT 0001',
        debit: 5355.00,
        credit: 0
      },
      {
        id: '2',
        journalEntryId: 'JE-2025-001',
        accountCode: '707',
        accountName: 'Venituri din vânzarea mărfurilor',
        description: 'Factura vânzare FACT 0001',
        debit: 0,
        credit: 4500.00
      },
      {
        id: '3',
        journalEntryId: 'JE-2025-001',
        accountCode: '4427',
        accountName: 'TVA colectată',
        description: 'Factura vânzare FACT 0001',
        debit: 0,
        credit: 855.00
      }
    ]
  });

  // Fetch client details when viewing an invoice
  const customerId = selectedInvoice?.customerId || selectedInvoice?.clientId;
  const { data: client, isLoading: isLoadingClient } = useQuery<Client>({
    queryKey: [`/api/crm/customers/${customerId}`],
    enabled: !!selectedInvoice && isViewDialogOpen && !!customerId,
    // This is just for structure - we'll use actual API data in production
    placeholderData: { 
      id: '1',
      name: 'SC ABC SRL',
      fiscalCode: 'RO12345678',
      registrationNumber: 'J40/123/2020',
      address: 'Str. Exemplu nr. 123, București, Sector 1',
      contactName: 'Ion Popescu',
      email: 'contact@abc-srl.ro',
      phone: '+40721234567'
    }
  });

  // Filter invoices based on search term and active tab
  const filteredInvoices = invoices?.filter(invoice => {
    // Filter by search term
    const matchesSearch = 
      `${invoice.series}${invoice.number}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (invoice.customerName || invoice.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab (status)
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'draft' && invoice.status === 'draft') ||
      (activeTab === 'issued' && invoice.status === 'issued') ||
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
  const handleViewInvoice = (invoice: SalesInvoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  // Handle opening the journal entries dialog
  const handleViewJournal = (invoice: SalesInvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInvoice(invoice);
    setIsJournalDialogOpen(true);
  };

  // Get status badge
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
        return (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Emisă
            </span>
          </div>
        );
      case 'sent':
        return (
          <div className="flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-indigo-500" />
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
              Încasată
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
              <BreadcrumbPage>Jurnal Vânzări</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jurnal Vânzări</h1>
          <p className="text-sm text-gray-500">Gestionați facturile și generați raportul conform OMFP 2634/2015</p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          {mainSection === 'invoices' && (
            <Button onClick={() => setIsCreateInvoiceDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              <span>Factură Nouă</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Main Tabs - Facturi vs Raport Jurnal */}
      <Tabs value={mainSection} onValueChange={(val: any) => setMainSection(val)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="invoices">📄 Facturi de Vânzare</TabsTrigger>
          <TabsTrigger value="journal-report">📊 Raport Jurnal de Vânzări</TabsTrigger>
        </TabsList>
        
        {/* TAB 1: Facturi de Vânzare (conținut existent) */}
        <TabsContent value="invoices">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-4">
            {/* First row - search and filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Caută după serie, număr sau client..."
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
                <TabsTrigger value="issued">Emise</TabsTrigger>
                <TabsTrigger value="paid">Încasate</TabsTrigger>
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
                  <TableHead className="w-28">Serie/Număr</TableHead>
                  <TableHead className="w-24">Dată</TableHead>
                  <TableHead className="w-32">Scadență</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="text-right w-28">Valoare</TableHead>
                  <TableHead className="text-right w-28">TVA</TableHead>
                  <TableHead className="text-right w-28">Total</TableHead>
                  <TableHead className="text-right w-24">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingInvoices ? (
                  Array(5).fill(null).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={9} className="h-16">
                        <div className="h-8 w-full bg-gray-100 animate-pulse rounded"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : currentInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-gray-500">
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
                          <p>Nu există facturi de vânzare pentru perioada selectată.</p>
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
                      <TableCell className="font-medium">{invoice.series} {invoice.number}</TableCell>
                      <TableCell>{formatDate(invoice.date)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {invoice.customerName || invoice.clientName || '-'}
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
            <DialogTitle>Detalii Factură</DialogTitle>
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
                    <h3 className="text-lg font-semibold">Factură {selectedInvoice.series} {selectedInvoice.number}</h3>
                    <p className="text-sm text-gray-500 mt-1">Data: {formatDate(selectedInvoice.date)}</p>
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
                  {/* Client info */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm font-medium text-gray-500">
                      <Building className="h-4 w-4 mr-2" />
                      <span>Informații Client</span>
                    </div>
                    
                    <div className="space-y-1">
                      {/* Always show customer name from invoice */}
                      <p className="font-medium">{selectedInvoice.customerName || selectedInvoice.clientName || 'Client necunoscut'}</p>
                      
                      {/* Show additional details if available from CRM */}
                      {isLoadingClient ? (
                        <div className="space-y-1">
                          <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                          <div className="h-4 w-40 bg-gray-200 animate-pulse rounded"></div>
                        </div>
                      ) : client ? (
                        <div className="space-y-1">
                          <p className="text-sm">CUI: {client.fiscalCode || '-'}</p>
                          <p className="text-sm">Reg. Com.: {client.registrationNumber || '-'}</p>
                          {client.address && <p className="text-sm">{client.address}</p>}
                          {client.contactName && (
                            <div className="flex items-center mt-2 text-sm">
                              <UserCircle className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                              <span>{client.contactName}</span>
                            </div>
                          )}
                        </div>
                      ) : selectedInvoice.customerId ? (
                        <p className="text-sm text-gray-400">Detalii client indisponibile</p>
                      ) : (
                        <p className="text-sm text-gray-400">Fără informații CRM</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Invoice summary */}
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-500">
                      <Receipt className="h-4 w-4 mr-2" />
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
                      <p>Emisă de: {selectedInvoice.createdByName || selectedInvoice.createdBy || 'Necunoscut'}</p>
                      <p>Data emiterii: {new Date(selectedInvoice.createdAt).toLocaleString('ro-RO')}</p>
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
                      {invoiceItems.map((item: any) => (
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
                          {formatCurrency(invoiceItems.reduce((sum: number, item: any) => sum + (Number(item.netAmount) || Number(item.amount) || 0), 0))} RON
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatCurrency(invoiceItems.reduce((sum: number, item: any) => sum + (Number(item.vatAmount) || 0), 0))} RON
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatCurrency(invoiceItems.reduce((sum: number, item: any) => sum + (Number(item.grossAmount) || Number(item.totalAmount) || 0), 0))} RON
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
                
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
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
                <>Înregistrarea contabilă pentru factura {selectedInvoice.series} {selectedInvoice.number}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="py-4 overflow-y-auto flex-1 pr-2">
              {/* Invoice reference */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <FileText className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">
                      Factură {selectedInvoice.series} {selectedInvoice.number}
                    </h3>
                    <p className="text-sm text-blue-700">
                      Client: {selectedInvoice.customerName || selectedInvoice.clientName || 'N/A'} | Data: {formatDate(selectedInvoice.date)}
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
      </TabsContent>
      
      {/* TAB 2: Raport Jurnal de Vânzări (conform OMFP 2634/2015) */}
      <TabsContent value="journal-report" className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Raport conform OMFP 2634/2015:</strong> Acest raport include toate categoriile fiscale de TVA și tratează corect TVA la încasare.
          </AlertDescription>
        </Alert>
        
        {/* Filtre pentru raport */}
        <Card>
          <CardHeader>
            <CardTitle>Selecție Perioadă</CardTitle>
            <CardDescription>Alegeți perioada pentru generarea jurnalului de vânzări</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Period Start */}
              <div className="space-y-2">
                <Label>Început Perioadă</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left", !reportPeriodStart && "text-muted-foreground")}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {reportPeriodStart ? format(reportPeriodStart, 'dd MMM yyyy', { locale: ro }) : 'Selectează'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={reportPeriodStart}
                      onSelect={(date) => date && setReportPeriodStart(date)}
                      locale={ro}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Period End */}
              <div className="space-y-2">
                <Label>Sfârșit Perioadă</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left", !reportPeriodEnd && "text-muted-foreground")}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {reportPeriodEnd ? format(reportPeriodEnd, 'dd MMM yyyy', { locale: ro }) : 'Selectează'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={reportPeriodEnd}
                      onSelect={(date) => date && setReportPeriodEnd(date)}
                      locale={ro}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Report Type */}
              <div className="space-y-2">
                <Label>Tip Raport</Label>
                <Select value={reportType} onValueChange={(val: any) => setReportType(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DETAILED">Detaliat</SelectItem>
                    <SelectItem value="SUMMARY">Centralizat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Quick period buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const now = new Date();
                setReportPeriodStart(startOfMonth(now));
                setReportPeriodEnd(endOfMonth(now));
              }}>
                Luna curentă
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                setReportPeriodStart(startOfMonth(lastMonth));
                setReportPeriodEnd(endOfMonth(lastMonth));
              }}>
                Luna trecută
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetchReport()}>
                🔄 Actualizează
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Journal Report Results */}
        {isLoadingReport ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
              <span>Se generează jurnalul...</span>
            </CardContent>
          </Card>
        ) : journalReport ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Jurnal de Vânzări - {journalReport.periodLabel}</CardTitle>
                  <CardDescription>
                    {journalReport.companyName} (CUI: {journalReport.companyFiscalCode})
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams({
                        periodStart: format(reportPeriodStart, 'yyyy-MM-dd'),
                        periodEnd: format(reportPeriodEnd, 'yyyy-MM-dd')
                      });
                      window.open(`/api/accounting/sales/journal/export/excel?${params}`, '_blank');
                    }}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams({
                        periodStart: format(reportPeriodStart, 'yyyy-MM-dd'),
                        periodEnd: format(reportPeriodEnd, 'yyyy-MM-dd')
                      });
                      window.open(`/api/accounting/sales/journal/export/pdf?${params}`, '_blank');
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {journalReport.rows && journalReport.rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="sticky left-0 bg-gray-100">Nr.</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>CUI</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right bg-blue-50">Bază 19%</TableHead>
                        <TableHead className="text-right bg-blue-50">TVA 19%</TableHead>
                        <TableHead className="text-right bg-green-50">Bază 9%</TableHead>
                        <TableHead className="text-right bg-green-50">TVA 9%</TableHead>
                        <TableHead className="text-right">IC</TableHead>
                        <TableHead className="text-right">Export</TableHead>
                        <TableHead className="text-right bg-orange-50">TVA Neexig.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {journalReport.rows.map((row: any) => (
                        <TableRow key={row.rowNumber} className={row.documentType === 'CREDIT_NOTE' ? 'bg-red-50' : ''}>
                          <TableCell className="sticky left-0 bg-white">{row.rowNumber}</TableCell>
                          <TableCell>{formatDate(row.date)}</TableCell>
                          <TableCell>
                            {row.documentNumber}
                            {row.documentType === 'CREDIT_NOTE' && (
                              <Badge variant="destructive" className="ml-2 text-xs">Storno</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{row.clientName}</TableCell>
                          <TableCell>{row.clientFiscalCode}</TableCell>
                          <TableCell className={cn("text-right tabular-nums", row.totalAmount < 0 && "text-red-600")}>
                            {formatCurrency(row.totalAmount)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums bg-blue-50">{row.base19 !== 0 && formatCurrency(row.base19)}</TableCell>
                          <TableCell className="text-right tabular-nums bg-blue-50">{row.vat19 !== 0 && formatCurrency(row.vat19)}</TableCell>
                          <TableCell className="text-right tabular-nums bg-green-50">{row.base9 !== 0 && formatCurrency(row.base9)}</TableCell>
                          <TableCell className="text-right tabular-nums bg-green-50">{row.vat9 !== 0 && formatCurrency(row.vat9)}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.intraCommunity !== 0 && formatCurrency(row.intraCommunity)}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.export !== 0 && formatCurrency(row.export)}</TableCell>
                          <TableCell className="text-right tabular-nums bg-orange-50">{row.vatDeferred !== 0 && formatCurrency(row.vatDeferred)}</TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Total Row */}
                      <TableRow className="font-bold bg-gray-200 border-t-2">
                        <TableCell colSpan={5} className="sticky left-0 bg-gray-200">TOTAL:</TableCell>
                        <TableCell className="text-right">{formatCurrency(journalReport.totals.totalAmount)}</TableCell>
                        <TableCell className="text-right bg-blue-100">{formatCurrency(journalReport.totals.totalBase19)}</TableCell>
                        <TableCell className="text-right bg-blue-100">{formatCurrency(journalReport.totals.totalVAT19)}</TableCell>
                        <TableCell className="text-right bg-green-100">{formatCurrency(journalReport.totals.totalBase9)}</TableCell>
                        <TableCell className="text-right bg-green-100">{formatCurrency(journalReport.totals.totalVAT9)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(journalReport.totals.totalIntraCommunity)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(journalReport.totals.totalExport)}</TableCell>
                        <TableCell className="text-right bg-orange-100">{formatCurrency(journalReport.totals.totalVATDeferred)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Nu există facturi în perioada selectată</p>
                </div>
              )}
              
              {/* Summary Info */}
              {journalReport.totals && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-3">Verificări Contabile:</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Total baze impozabile:</span>{' '}
                      {formatCurrency(journalReport.totals.totalNetAmount)} RON
                    </div>
                    <div>
                      <span className="font-medium">Total TVA:</span>{' '}
                      {formatCurrency(journalReport.totals.totalVATAmount)} RON
                    </div>
                    <div className="col-span-2 text-xs text-muted-foreground mt-2">
                      ✅ Verificați că totalurile corespund cu decontul de TVA (D300) și balanța contabilă.
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </TabsContent>
      </Tabs>
      
      {/* NEW: Dialog COMPLET Creare Factură Vânzare */}
      <Dialog open={isCreateInvoiceDialogOpen} onOpenChange={setIsCreateInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📄 Factur Nouă de Vânzare</DialogTitle>
            <DialogDescription>
              Creați factură completă cu linii de produse. Se va contabiliza automat în Jurnalul de Vânzări.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmittingInvoice(true);
            
            try {
              // Calculează totaluri
              const netTotal = newInvoiceItems.reduce((sum, item) => sum + Number(item.netAmount), 0);
              const vatTotal = newInvoiceItems.reduce((sum, item) => sum + Number(item.vatAmount), 0);
              const grossTotal = netTotal + vatTotal;
              
              // API Call
              const response = await fetch('/api/accounting/sales/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  invoiceData: {
                    invoiceNumber: newInvoiceForm.invoiceNumber || `${newInvoiceForm.series}-${Date.now()}`,
                    series: newInvoiceForm.series,
                    issueDate: newInvoiceForm.issueDate,
                    dueDate: newInvoiceForm.dueDate,
                    description: newInvoiceForm.description,
                    currency: 'RON',
                    exchangeRate: 1,
                    vatRate: 19
                  },
                  customer: {
                    id: newInvoiceForm.customerId,
                    name: newInvoiceForm.customerName
                  },
                  items: newInvoiceItems.map(item => ({
                    productName: item.productName,
                    description: item.description,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    netAmount: Number(item.netAmount),
                    vatRate: Number(item.vatRate),
                    vatAmount: Number(item.vatAmount),
                    grossAmount: Number(item.grossAmount)
                  })),
                  taxRates: { default: 19 },
                  paymentTerms: { days: newInvoiceForm.paymentTermDays },
                  notes: newInvoiceForm.description
                })
              });
              
              if (!response.ok) throw new Error(await response.text());
              
              const result = await response.json();
              
              toast({
                title: '✅ Factură creată cu succes!',
                description: `Factura a fost emisă și contabilizată automat în Jurnalul de Vânzări.`
              });
              
              // Reset form
              setNewInvoiceForm({
                invoiceNumber: '',
                series: 'FV',
                customerId: '',
                customerName: '',
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: '',
                paymentTermDays: 30
              });
              setNewInvoiceItems([{
                id: '1',
                productName: '',
                description: '',
                quantity: 1,
                unitPrice: 0,
                vatRate: 19,
                netAmount: 0,
                vatAmount: 0,
                grossAmount: 0
              }]);
              
              setIsCreateInvoiceDialogOpen(false);
              
            } catch (error: any) {
              toast({
                title: '❌ Eroare',
                description: error.message,
                variant: 'destructive'
              });
            } finally {
              setIsSubmittingInvoice(false);
            }
          }} className="space-y-4 py-4">
            
            {/* Date generale */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="series">Serie Factură</Label>
                <Input 
                  id="series"
                  value={newInvoiceForm.series}
                  onChange={(e) => setNewInvoiceForm({...newInvoiceForm, series: e.target.value})}
                  placeholder="FV"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Număr (opțional)</Label>
                <Input 
                  id="invoiceNumber"
                  value={newInvoiceForm.invoiceNumber}
                  onChange={(e) => setNewInvoiceForm({...newInvoiceForm, invoiceNumber: e.target.value})}
                  placeholder="Se generează automat"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="issueDate">Data Emitere *</Label>
                <Input 
                  id="issueDate"
                  type="date"
                  value={newInvoiceForm.issueDate}
                  onChange={(e) => setNewInvoiceForm({...newInvoiceForm, issueDate: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Client *</Label>
                <Input 
                  id="customerName"
                  placeholder="SC Client SRL"
                  value={newInvoiceForm.customerName}
                  onChange={(e) => setNewInvoiceForm({...newInvoiceForm, customerName: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dueDate">Data Scadentă</Label>
                <Input 
                  id="dueDate"
                  type="date"
                  value={newInvoiceForm.dueDate}
                  onChange={(e) => setNewInvoiceForm({...newInvoiceForm, dueDate: e.target.value})}
                />
              </div>
            </div>
            
            <Separator />
            
            {/* Linii factură */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Produse/Servicii</Label>
                <Button 
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setNewInvoiceItems([...newInvoiceItems, {
                    id: Date.now().toString(),
                    productName: '',
                    description: '',
                    quantity: 1,
                    unitPrice: 0,
                    vatRate: 19,
                    netAmount: 0,
                    vatAmount: 0,
                    grossAmount: 0
                  }])}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adaugă Linie
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[200px]">Produs/Serviciu</TableHead>
                      <TableHead className="w-[150px]">Descriere</TableHead>
                      <TableHead className="w-[80px]">Cant.</TableHead>
                      <TableHead className="w-[100px]">Preț Unit.</TableHead>
                      <TableHead className="w-[80px]">TVA %</TableHead>
                      <TableHead className="w-[100px]">Valoare</TableHead>
                      <TableHead className="w-[100px]">TVA</TableHead>
                      <TableHead className="w-[100px]">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newInvoiceItems.map((item, index) => {
                      const updateItem = (field: string, value: any) => {
                        const newItems = [...newInvoiceItems];
                        newItems[index] = { ...newItems[index], [field]: value };
                        
                        // Calculează automat sumele
                        const qty = Number(newItems[index].quantity);
                        const price = Number(newItems[index].unitPrice);
                        const vat = Number(newItems[index].vatRate);
                        
                        newItems[index].netAmount = qty * price;
                        newItems[index].vatAmount = (qty * price * vat) / 100;
                        newItems[index].grossAmount = newItems[index].netAmount + newItems[index].vatAmount;
                        
                        setNewInvoiceItems(newItems);
                      };
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Input 
                              placeholder="Denumire produs"
                              value={item.productName}
                              onChange={(e) => updateItem('productName', e.target.value)}
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="Detalii"
                              value={item.description}
                              onChange={(e) => updateItem('description', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem('quantity', e.target.value)}
                              min="0.01"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItem('unitPrice', e.target.value)}
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Select value={item.vatRate.toString()} onValueChange={(val) => updateItem('vatRate', val)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="5">5%</SelectItem>
                                <SelectItem value="9">9%</SelectItem>
                                <SelectItem value="19">19%</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.netAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.vatAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {item.grossAmount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {newInvoiceItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setNewInvoiceItems(newInvoiceItems.filter(i => i.id !== item.id))}
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* Totaluri */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-blue-700">Valoare (fără TVA)</p>
                  <p className="text-xl font-bold text-blue-900">
                    {newInvoiceItems.reduce((sum, item) => sum + Number(item.netAmount), 0).toFixed(2)} Lei
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">TVA Total</p>
                  <p className="text-xl font-bold text-orange-600">
                    {newInvoiceItems.reduce((sum, item) => sum + Number(item.vatAmount), 0).toFixed(2)} Lei
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Total Factură</p>
                  <p className="text-2xl font-bold text-green-600">
                    {newInvoiceItems.reduce((sum, item) => sum + Number(item.grossAmount), 0).toFixed(2)} Lei
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Linii</p>
                  <p className="text-xl font-bold text-gray-700">
                    {newInvoiceItems.length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Observații</Label>
              <Input 
                id="description"
                placeholder="Observații factură..."
                value={newInvoiceForm.description}
                onChange={(e) => setNewInvoiceForm({...newInvoiceForm, description: e.target.value})}
              />
            </div>
            
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>Se va contabiliza automat:</strong> Debit 4111 Clienți / Credit 707 Venituri + 4427 TVA colectată
              </AlertDescription>
            </Alert>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateInvoiceDialogOpen(false)} disabled={isSubmittingInvoice}>
                Anulează
              </Button>
              <Button type="submit" disabled={isSubmittingInvoice || !newInvoiceForm.customerName || newInvoiceItems.length === 0}>
                {isSubmittingInvoice ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Se emite...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Emite și Contabilizează Factură
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}