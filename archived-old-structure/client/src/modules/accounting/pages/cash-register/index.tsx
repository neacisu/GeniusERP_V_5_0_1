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
  ArrowDown,
  ArrowUp,
  Building,
  CheckCircle2,
  Wallet,
  User,
  Lock,
  AlertTriangle,
  Users,
  Banknote
} from "lucide-react";
import { Link } from "wouter";
import { InvoiceSelectorDialog } from "../../components/InvoiceSelectorDialog";
import { CashBankTransferDialog } from "../../components/CashBankTransferDialog";
import { DailyClosingDialog } from "../../components/DailyClosingDialog";
import { EmployeeSelectorDialog } from "../../components/EmployeeSelectorDialog";
import { AdvanceManagementDialog } from "../../components/AdvanceManagementDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useDialogCleanup } from "@/hooks/use-dialog-cleanup";

// Type definitions
type CashRegister = {
  id: string;
  name: string;
  code: string;
  currency: string;
  balance?: number; // Legacy field name
  currentBalance?: number; // DB field (from Drizzle mapping)
  responsible?: string;
  responsiblePersonName?: string; // DB field
  location?: string;
  isActive: boolean;
};

type CashTransaction = {
  id: string;
  registerCode?: string;
  cashRegisterId?: string; // DB field
  date?: string; // Legacy
  transactionDate?: string; // DB field (timestamp)
  documentNumber: string;
  transactionType?: string; // DB field: 'cash_receipt', 'cash_payment'
  documentType?: 'receipt' | 'payment'; // Legacy
  description: string;
  partnerName?: string; // Legacy
  personName?: string; // DB field
  reference?: string;
  amount: number;
  fiscalReceiptNumber?: string;
  purpose?: string;
  posted: boolean;
  createdBy: string;
  createdAt: string;
};

type TransactionJournalEntry = {
  id: string;
  journalEntryId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
};

export default function CashRegisterPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRegister, setSelectedRegister] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isJournalDialogOpen, setIsJournalDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTransactionType, setNewTransactionType] = useState<'receipt' | 'payment'>('receipt');
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState({ 
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  });
  const { toast } = useToast();
  
  // NEW: State-uri pentru dialoguri noi - TOATE cu handlers de cleanup
  const [isInvoiceSelectorOpen, setIsInvoiceSelectorOpen] = useState(false);
  const [isEmployeeSelectorOpen, setIsEmployeeSelectorOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isClosingDialogOpen, setIsClosingDialogOpen] = useState(false);
  const [isAdvanceDialogOpen, setIsAdvanceDialogOpen] = useState(false);
  const [transferType, setTransferType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [advanceType, setAdvanceType] = useState<'give' | 'settle'>('give');
  const [selectedEmployeeForAdvance, setSelectedEmployeeForAdvance] = useState<any>(null);
  const [isSelectingEmployeeForAdvance, setIsSelectingEmployeeForAdvance] = useState(false);
  
  // HOOK pentru cleanup forțat dialoguri
  useDialogCleanup(!isTransferDialogOpen && !isClosingDialogOpen && !isAdvanceDialogOpen && !isEmployeeSelectorOpen && !isInvoiceSelectorOpen && !isCreateDialogOpen);
  
  // NEW: Form state pentru creare tranzacție
  const [formData, setFormData] = useState({
    cashRegisterId: '',
    amount: '',
    personName: '',
    personId: '',
    personIdNumber: '',
    description: '',
    invoiceNumber: '',
    invoiceId: '',
    purpose: ''
  });

  // Fetch cash registers
  const { data: cashRegistersResponse, isLoading: isLoadingRegisters } = useQuery<{ data: CashRegister[]; total: number }>({
    queryKey: ['/api/accounting/cash-registers'],
    // This is just for structure - we'll use actual API data in production
    placeholderData: { data: [
      { 
        id: '1', 
        name: 'Casierie Centrală', 
        code: 'CASA-01', 
        currency: 'RON',
        balance: 5320.75,
        responsible: 'Maria Ionescu',
        location: 'Sediu Central',
        isActive: true
      },
      { 
        id: '2', 
        name: 'Casierie Secundară', 
        code: 'CASA-02', 
        currency: 'RON',
        balance: 2450.30,
        responsible: 'Alexandru Popescu',
        location: 'Punct de Lucru 1',
        isActive: true
      },
      { 
        id: '3', 
        name: 'Casierie Valută EUR', 
        code: 'CASA-EUR', 
        currency: 'EUR',
        balance: 1250.00,
        responsible: 'Maria Ionescu',
        location: 'Sediu Central',
        isActive: true
      },
      { 
        id: '4', 
        name: 'Casierie Valută USD', 
        code: 'CASA-USD', 
        currency: 'USD',
        balance: 850.00,
        responsible: 'Alexandru Popescu',
        location: 'Sediu Central',
        isActive: true
      },
    ], total: 4 }
  });

  // Extract cashRegisters array from response
  const cashRegisters = cashRegistersResponse?.data || [];

  // Fetch cash transactions
  const { data: transactionsResponse, isLoading: isLoadingTransactions } = useQuery<{ data: CashTransaction[]; total: number; page: number; limit: number }>({
    queryKey: ['/api/accounting/cash-transactions', selectedRegister, dateRange],
    // This is just for structure - we'll use actual API data in production
    placeholderData: { data: [
      { 
        id: '1', 
        registerCode: 'CASA-01',
        date: '2025-04-10', 
        documentNumber: 'DP-2025-0001', 
        documentType: 'payment',
        description: 'Plată diurnă delegație - Ionescu Maria',
        partnerName: 'Ionescu Maria',
        reference: 'DEL-001/2025',
        amount: 450.00,
        fiscalReceiptNumber: '',
        purpose: 'Deplasare',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-10T10:15:00Z'
      },
      { 
        id: '2', 
        registerCode: 'CASA-01',
        date: '2025-04-10', 
        documentNumber: 'DP-2025-0002', 
        documentType: 'payment',
        description: 'Avans decontare - Popescu Alexandru',
        partnerName: 'Popescu Alexandru',
        reference: 'DEC-002/2025',
        amount: 850.00,
        fiscalReceiptNumber: '',
        purpose: 'Achiziții diverse',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-10T11:25:00Z'
      },
      { 
        id: '3', 
        registerCode: 'CASA-01',
        date: '2025-04-09', 
        documentNumber: 'DI-2025-0001', 
        documentType: 'receipt',
        description: 'Încasare client - SC Client SRL',
        partnerName: 'SC Client SRL',
        reference: 'F-123/2025',
        amount: 2450.50,
        fiscalReceiptNumber: 'BON-001234',
        purpose: 'Încasare factură',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-09T14:35:00Z'
      },
      { 
        id: '4', 
        registerCode: 'CASA-01',
        date: '2025-04-09', 
        documentNumber: 'DI-2025-0002', 
        documentType: 'receipt',
        description: 'Încasare avans client - SC Nou Client SRL',
        partnerName: 'SC Nou Client SRL',
        reference: 'AVA-004/2025',
        amount: 5000.00,
        fiscalReceiptNumber: 'BON-001235',
        purpose: 'Avans servicii',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-09T15:40:00Z'
      },
      { 
        id: '5', 
        registerCode: 'CASA-01',
        date: '2025-04-08', 
        documentNumber: 'DP-2025-0003', 
        documentType: 'payment',
        description: 'Plată factură utilități',
        partnerName: 'SC Utilități SRL',
        reference: 'F-4567/2025',
        amount: 350.25,
        fiscalReceiptNumber: '',
        purpose: 'Plată utilități',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-08T09:15:00Z'
      },
      { 
        id: '6', 
        registerCode: 'CASA-01',
        date: '2025-04-08', 
        documentNumber: 'DP-2025-0004', 
        documentType: 'payment',
        description: 'Avans salarii',
        partnerName: 'Diverse persoane',
        reference: 'SAL-AVA-042025',
        amount: 4500.00,
        fiscalReceiptNumber: '',
        purpose: 'Avans salarii',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-08T10:30:00Z'
      },
      { 
        id: '7', 
        registerCode: 'CASA-02',
        date: '2025-04-08', 
        documentNumber: 'DI-2025-0003', 
        documentType: 'receipt',
        description: 'Încasare vânzare cu amănuntul',
        partnerName: '',
        reference: 'VAM-08042025',
        amount: 1250.75,
        fiscalReceiptNumber: 'BON-005678',
        purpose: 'Vânzare cu amănuntul',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-08T16:30:00Z'
      },
      { 
        id: '8', 
        registerCode: 'CASA-02',
        date: '2025-04-07', 
        documentNumber: 'DI-2025-0004', 
        documentType: 'receipt',
        description: 'Încasare vânzare cu amănuntul',
        partnerName: '',
        reference: 'VAM-07042025',
        amount: 980.50,
        fiscalReceiptNumber: 'BON-005679',
        purpose: 'Vânzare cu amănuntul',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-07T17:25:00Z'
      },
      { 
        id: '9', 
        registerCode: 'CASA-01',
        date: '2025-04-07', 
        documentNumber: 'DP-2025-0005', 
        documentType: 'payment',
        description: 'Decontare deplasare - Popescu Alexandru',
        partnerName: 'Popescu Alexandru',
        reference: 'DEC-003/2025',
        amount: 325.50,
        fiscalReceiptNumber: '',
        purpose: 'Decontare deplasare',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-07T14:35:00Z'
      },
      { 
        id: '10', 
        registerCode: 'CASA-01',
        date: '2025-04-06', 
        documentNumber: 'DP-2025-0006', 
        documentType: 'payment',
        description: 'Ridicare numerar din bancă',
        partnerName: '',
        reference: 'BNK-06042025',
        amount: 10000.00,
        fiscalReceiptNumber: '',
        purpose: 'Alimentare casierie',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-06T10:15:00Z'
      },
    ], total: 10, page: 1, limit: 20 }
  });

  // Extract transactions array from response and map DB fields to UI fields
  const transactions = (transactionsResponse?.data || []).map((txn: any) => ({
    ...txn,
    documentType: txn.transactionType === 'cash_receipt' ? 'receipt' : 'payment',
    date: txn.transactionDate || txn.date,
    partnerName: txn.personName || txn.partnerName,
    reference: txn.invoiceNumber || txn.contractNumber || txn.reference // Referință la factură/contract
  }));

  // Fetch transaction journal entry
  const { data: journalEntry, isLoading: isLoadingJournal } = useQuery<TransactionJournalEntry[]>({
    queryKey: ['/api/accounting/cash-transactions', selectedTransaction?.id, 'journal'],
    enabled: !!selectedTransaction && isJournalDialogOpen && selectedTransaction.posted,
    // This is just for structure - we'll use actual API data in production
    placeholderData: [
      {
        id: '1',
        journalEntryId: 'JE-2025-001',
        accountCode: '542',
        accountName: 'Avansuri de trezorerie',
        description: 'Avans decontare - Popescu Alexandru',
        debit: 850.00,
        credit: 0
      },
      {
        id: '2',
        journalEntryId: 'JE-2025-001',
        accountCode: '5311',
        accountName: 'Casa în lei',
        description: 'Avans decontare - Popescu Alexandru',
        debit: 0,
        credit: 850.00
      }
    ]
  });

  // Filter transactions based on search term, register and type
  const filteredTransactions = transactions?.filter((transaction: any) => {
    // Filter by search term
    const matchesSearch = 
      transaction.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.partnerName && transaction.partnerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by register
    const matchesRegister = 
      selectedRegister === 'all' || 
      transaction.registerCode === cashRegisters?.find(reg => reg.id === selectedRegister)?.code;
    
    // Filter by type (tab)
    const matchesType = 
      activeTab === 'all' || 
      (activeTab === 'receipt' && transaction.documentType === 'receipt') ||
      (activeTab === 'payment' && transaction.documentType === 'payment');
    
    return matchesSearch && matchesRegister && matchesType;
  }) || [];

  // Pagination logic
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  // Format date strings
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO');
  };

  // Format currency values
  const formatCurrency = (value: number, currency: string = 'RON') => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(value);
  };

  // Handle opening the view dialog
  const handleViewTransaction = (transaction: CashTransaction) => {
    setSelectedTransaction(transaction);
    setIsViewDialogOpen(true);
  };

  // Handle opening the journal entries dialog
  const handleViewJournal = (transaction: CashTransaction, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTransaction(transaction);
    setIsJournalDialogOpen(true);
  };

  // Open create dialog with specified type
  const handleCreateTransaction = (type: 'receipt' | 'payment') => {
    setNewTransactionType(type);
    setIsCreateDialogOpen(true);
  };

  // Get transaction type badge
  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'receipt':
        return (
          <div className="flex items-center gap-1.5">
            <ArrowUp className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              Încasare
            </span>
          </div>
        );
      case 'payment':
        return (
          <div className="flex items-center gap-1.5">
            <ArrowDown className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
              Plată
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded-full">
              {type}
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
              <BreadcrumbPage>Registru de Casă</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registru de Casă</h1>
          <p className="text-sm text-gray-500">Gestionați încasările și plățile în numerar</p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {/* NEW: Buton Închidere Zilnică */}
          <Button 
            variant="outline"
            onClick={() => setIsClosingDialogOpen(true)}
            disabled={!selectedRegister || selectedRegister === 'all'}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <Lock className="h-4 w-4 mr-2" />
            Închide Ziua
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                <span>Export</span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Registru de Casă</DropdownMenuLabel>
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center">
                <PlusCircle className="h-4 w-4 mr-2" />
                <span>Adaugă</span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Adaugă Tranzacție</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleCreateTransaction('receipt')}>
                <ArrowUp className="h-4 w-4 mr-2 text-green-500" />
                <span>Dispoziție Încasare</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateTransaction('payment')}>
                <ArrowDown className="h-4 w-4 mr-2 text-red-500" />
                <span>Dispoziție Plată</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setTransferType('deposit'); setIsTransferDialogOpen(true); }}>
                <Banknote className="h-4 w-4 mr-2 text-blue-500" />
                <span>Depunere la Bancă</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setTransferType('withdrawal'); setIsTransferDialogOpen(true); }}>
                <Wallet className="h-4 w-4 mr-2 text-green-500" />
                <span>Ridicare de la Bancă</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setAdvanceType('give'); setIsAdvanceDialogOpen(true); }}>
                <Users className="h-4 w-4 mr-2 text-purple-500" />
                <span>Acordare Avans Angajat</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setAdvanceType('settle'); setIsAdvanceDialogOpen(true); }}>
                <FileText className="h-4 w-4 mr-2 text-purple-500" />
                <span>Decontare Avans</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Cash register summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoadingRegisters ? (
          Array(4).fill(null).map((_, index) => (
            <Card key={index} className="h-32">
              <CardContent className="p-4 flex flex-col justify-center h-full">
                <div className="h-5 w-24 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="h-6 w-32 bg-gray-200 animate-pulse rounded mb-1"></div>
                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          cashRegisters?.map((register) => (
            <Card 
              key={register.id} 
              className={`${selectedRegister === register.id ? 'border-primary' : ''} cursor-pointer`} 
              onClick={() => setSelectedRegister(register.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{register.name}</p>
                    <p className="text-xl font-bold mt-1 tabular-nums">
                      {formatCurrency(Number(register.currentBalance || register.balance || 0), register.currency)}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-1">{register.code}</p>
                  </div>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      register.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                    }`}>
                      {register.isActive ? 'Activ' : 'Inactiv'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  <span>{register.responsible}</span>
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Sumar Casa - Sold inițial + Mișcări + Sold final */}
      {selectedRegister && transactions.length > 0 && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Situație Casă - Perioada Selectată</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Sold Inițial Perioadă</p>
                <p className="text-lg font-bold tabular-nums">
                  {formatCurrency(
                    transactions.length > 0 
                      ? Number(transactions[transactions.length - 1]?.balanceBefore || 0)
                      : 0,
                    'RON'
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Încasări</p>
                <p className="text-lg font-bold text-green-600 tabular-nums">
                  +{formatCurrency(
                    transactions
                      .filter((t: any) => t.documentType === 'receipt')
                      .reduce((sum: number, t: any) => sum + Number(t.amount), 0),
                    'RON'
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Plăți</p>
                <p className="text-lg font-bold text-red-600 tabular-nums">
                  -{formatCurrency(
                    transactions
                      .filter((t: any) => t.documentType === 'payment')
                      .reduce((sum: number, t: any) => sum + Number(t.amount), 0),
                    'RON'
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Sold Final Perioadă</p>
                <p className="text-lg font-bold text-blue-700 tabular-nums">
                  {formatCurrency(
                    transactions.length > 0
                      ? Number(transactions[0]?.balanceAfter || 0)
                      : 0,
                    'RON'
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-4">
            {/* First row - search and filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Caută după număr, descriere sau partener..."
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
            
            {/* Second row - register select and tabs for type filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Select value={selectedRegister} onValueChange={setSelectedRegister}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Selectează registru de casă" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate registrele</SelectItem>
                  {cashRegisters?.map(register => (
                    <SelectItem key={register.id} value={register.id}>
                      {register.name} ({register.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="w-full sm:w-auto overflow-auto">
                  <TabsTrigger value="all">Toate</TabsTrigger>
                  <TabsTrigger value="receipt">Încasări</TabsTrigger>
                  <TabsTrigger value="payment">Plăți</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="border-b">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="w-28">Data</TableHead>
                  <TableHead className="w-32">Document</TableHead>
                  <TableHead>Descriere</TableHead>
                  <TableHead className="w-40">Partener</TableHead>
                  <TableHead className="w-28">Referință</TableHead>
                  <TableHead className="w-28">Tip</TableHead>
                  <TableHead className="text-right w-32">Sumă</TableHead>
                  <TableHead className="text-right w-20">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTransactions ? (
                  Array(5).fill(null).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={8} className="h-16">
                        <div className="h-8 w-full bg-gray-100 animate-pulse rounded"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : currentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-gray-500">
                      {searchTerm || activeTab !== 'all' || selectedRegister !== 'all' ? (
                        <>
                          <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>Nu s-au găsit tranzacții care să corespundă filtrelor.</p>
                          <Button 
                            variant="link" 
                            onClick={() => { 
                              setSearchTerm(''); 
                              setActiveTab('all'); 
                              setSelectedRegister('all'); 
                            }}
                          >
                            Resetează filtrele
                          </Button>
                        </>
                      ) : (
                        <>
                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>Nu există tranzacții de casă pentru perioada selectată.</p>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentTransactions.map((transaction) => (
                    <TableRow 
                      key={transaction.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewTransaction(transaction)}
                    >
                      <TableCell>{formatDate(transaction.transactionDate || transaction.date)}</TableCell>
                      <TableCell className="font-medium">{transaction.documentNumber}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell>{transaction.personName || transaction.partnerName || "-"}</TableCell>
                      <TableCell>{transaction.reference || "-"}</TableCell>
                      <TableCell>
                        {getTransactionTypeBadge(transaction.documentType)}
                      </TableCell>
                      <TableCell className={`text-right font-medium tabular-nums ${
                        transaction.documentType === 'receipt' 
                          ? 'text-green-600' 
                          : 'text-red-500'
                      }`}>
                        {transaction.documentType === 'receipt' ? '+' : '-'}
                        {formatCurrency(transaction.amount, 'RON')}
                      </TableCell>
                      <TableCell className="text-right p-0 pr-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewTransaction(transaction);
                            }}
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </Button>
                          
                          {transaction.posted && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => handleViewJournal(transaction, e)}
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
              Afișare {indexOfFirstTransaction + 1}-{Math.min(indexOfLastTransaction, filteredTransactions.length)} din {filteredTransactions.length} tranzacții
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

      {/* View Transaction Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalii Tranzacție Casă</DialogTitle>
            <DialogDescription>
              Vizualizați informațiile tranzacției de casă
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="py-4">
              {/* Transaction header */}
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {selectedTransaction.documentType === 'receipt' ? 'Dispoziție de Încasare' : 'Dispoziție de Plată'} {selectedTransaction.documentNumber}
                      </h3>
                      {getTransactionTypeBadge(selectedTransaction.documentType || 'receipt')}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Data: {formatDate(selectedTransaction.date || selectedTransaction.transactionDate || '')}</p>
                  </div>
                  <div className={`text-xl font-bold tabular-nums ${
                    selectedTransaction.documentType === 'receipt' 
                      ? 'text-green-600' 
                      : 'text-red-500'
                  }`}>
                    {selectedTransaction.documentType === 'receipt' ? '+' : '-'}
                    {formatCurrency(selectedTransaction.amount, 'RON')}
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Descriere</p>
                    <p className="font-medium">{selectedTransaction.description}</p>
                  </div>
                  
                  {selectedTransaction.partnerName && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Partener</p>
                      <p className="font-medium">{selectedTransaction.partnerName}</p>
                    </div>
                  )}
                  
                  {selectedTransaction.reference && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Referință</p>
                      <p className="font-medium">{selectedTransaction.reference}</p>
                    </div>
                  )}
                  
                  {selectedTransaction.fiscalReceiptNumber && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Bon Fiscal</p>
                      <p className="font-medium">{selectedTransaction.fiscalReceiptNumber}</p>
                    </div>
                  )}
                  
                  {selectedTransaction.purpose && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Scop</p>
                      <p className="font-medium">{selectedTransaction.purpose}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Registru de Casă</p>
                    <p className="font-medium">
                      {cashRegisters?.find(reg => reg.code === selectedTransaction.registerCode)?.name || selectedTransaction.registerCode}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status Contabilizare</p>
                    <p className="font-medium flex items-center gap-1.5">
                      {selectedTransaction.posted ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-green-700">Contabilizată</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                          </svg>
                          <span className="text-gray-700">Necontabilizată</span>
                        </>
                      )}
                    </p>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <p>Înregistrată de: {selectedTransaction.createdBy}</p>
                    <p>Data înregistrării: {new Date(selectedTransaction.createdAt).toLocaleString('ro-RO')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              <div>
                {selectedTransaction?.posted && (
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
                  <Download className="h-4 w-4 mr-2" />
                  Printează
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Journal Entry Dialog */}
      <Dialog open={isJournalDialogOpen} onOpenChange={setIsJournalDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Notă Contabilă Tranzacție</DialogTitle>
            <DialogDescription>
              {selectedTransaction && (
                <>Înregistrarea contabilă pentru {selectedTransaction.documentType === 'receipt' ? 'dispoziția de încasare' : 'dispoziția de plată'} {selectedTransaction.documentNumber}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="py-4">
              {/* Transaction reference */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    {selectedTransaction.documentType === 'receipt' ? (
                      <ArrowUp className="h-5 w-5 text-blue-700" />
                    ) : (
                      <ArrowDown className="h-5 w-5 text-blue-700" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">
                      {selectedTransaction.documentType === 'receipt' ? 'Dispoziție de Încasare' : 'Dispoziție de Plată'} {selectedTransaction.documentNumber}
                    </h3>
                    <p className="text-sm text-blue-700">
                      Data: {formatDate(selectedTransaction.date || selectedTransaction.transactionDate || '')} | Sumă: {formatCurrency(selectedTransaction.amount, 'RON')}
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
                    {selectedTransaction.posted 
                      ? "Nu există înregistrări contabile pentru această tranzacție." 
                      : "Tranzacția nu a fost contabilizată încă."
                    }
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJournalDialogOpen(false)}>
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Transaction Dialog - ENHANCED */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {newTransactionType === 'receipt' ? '💰 Dispoziție de Încasare Nouă' : '💸 Dispoziție de Plată Nouă'}
            </DialogTitle>
            <DialogDescription>
              Completați detaliile pentru a crea o nouă tranzacție de casă. Se va contabiliza automat.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-register">Registru de Casă</Label>
              <Select value={formData.cashRegisterId} onValueChange={(val) => setFormData({...formData, cashRegisterId: val})}>
                <SelectTrigger id="transaction-register">
                  <SelectValue placeholder="Selectează registru de casă" />
                </SelectTrigger>
                <SelectContent>
                  {cashRegisters?.filter(reg => reg.isActive).map(register => (
                    <SelectItem key={register.id} value={register.id}>
                      {register.name} ({register.code}) - {formatCurrency(Number(register.currentBalance || register.balance || 0), register.currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transaction-date">Data</Label>
              <Input 
                id="transaction-date" 
                type="date" 
                defaultValue={new Date().toISOString().split('T')[0]} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transaction-amount">Sumă</Label>
              <Input 
                id="transaction-amount" 
                type="number" 
                step="0.01" 
                min="0" 
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
              
              {/* NEW: Warnings pentru plafoane */}
              {formData.amount && Number(formData.amount) > 5000 && newTransactionType === 'payment' && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>⚠️ ATENȚIE:</strong> Suma de {Number(formData.amount).toFixed(2)} Lei depășește plafonul legal de 5,000 Lei!
                    <br />
                    <span className="text-xs">Conform Legii 70/2015, fragmentați tranzacția sau folosiți banca.</span>
                  </AlertDescription>
                </Alert>
              )}
              
              {formData.amount && Number(formData.amount) > 10000 && (
                <Alert className="mt-2 border-orange-500 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-900">
                    <strong>CNP obligatoriu</strong> pentru plăți peste 10,000 Lei (Legea 70/2015)
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transaction-partner">Partener</Label>
              <div className="flex gap-2">
                <Input 
                  id="transaction-partner" 
                  placeholder={newTransactionType === 'receipt' ? "Numele clientului" : "Numele furnizorului/beneficiarului"}
                  value={formData.personName}
                  onChange={(e) => setFormData({...formData, personName: e.target.value})}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInvoiceSelectorOpen(true)}
                  title="Selectează din facturi"
                >
                  <FileText className="h-4 w-4" />
                </Button>
                {newTransactionType === 'payment' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEmployeeSelectorOpen(true)}
                    title="Selectează angajat"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* NEW: CNP dacă e necesar */}
            {Number(formData.amount) > 10000 && (
              <div className="space-y-2">
                <Label htmlFor="transaction-cnp">CNP / Serie CI (OBLIGATORIU)</Label>
                <Input 
                  id="transaction-cnp"
                  placeholder="CNP sau Serie/Nr. CI"
                  value={formData.personIdNumber}
                  onChange={(e) => setFormData({...formData, personIdNumber: e.target.value})}
                  required
                  maxLength={13}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="transaction-description">Descriere</Label>
              <Textarea
                id="transaction-description" 
                placeholder="Descriere tranzacție"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transaction-reference">Referință Factură/Document</Label>
              <Input 
                id="transaction-reference" 
                placeholder={newTransactionType === 'receipt' ? "Nr. factură/contract" : "Nr. factură/contract/document"}
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
              />
              <p className="text-xs text-gray-500">
                Se va completa automat dacă selectați o factură din butonul de mai sus
              </p>
            </div>
            
            {newTransactionType === 'receipt' && (
              <div className="space-y-2">
                <Label htmlFor="transaction-receipt">Număr Bon Fiscal</Label>
                <Input 
                  id="transaction-receipt" 
                  placeholder="Număr bon fiscal emis" 
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="transaction-purpose">Scop</Label>
              <Select>
                <SelectTrigger id="transaction-purpose">
                  <SelectValue placeholder="Selectează scopul tranzacției" />
                </SelectTrigger>
                <SelectContent>
                  {newTransactionType === 'receipt' ? (
                    <>
                      <SelectItem value="invoice">Încasare factură</SelectItem>
                      <SelectItem value="advance">Avans de la client</SelectItem>
                      <SelectItem value="retail">Vânzare cu amănuntul</SelectItem>
                      <SelectItem value="bank">Depunere de la bancă</SelectItem>
                      <SelectItem value="loan">Împrumut</SelectItem>
                      <SelectItem value="other">Altele</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="invoice">Plată factură</SelectItem>
                      <SelectItem value="advance">Avans către furnizor</SelectItem>
                      <SelectItem value="salary">Plată salarii</SelectItem>
                      <SelectItem value="bank">Depunere la bancă</SelectItem>
                      <SelectItem value="per-diem">Diurnă</SelectItem>
                      <SelectItem value="expense">Decontare cheltuieli</SelectItem>
                      <SelectItem value="other">Altele</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <Label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" defaultChecked={true} />
                  <span>Contabilizează automat</span>
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Anulează
            </Button>
            <Button type="submit">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* NEW: Componente Adiționale */}
      <InvoiceSelectorDialog
        isOpen={isInvoiceSelectorOpen}
        onClose={() => setIsInvoiceSelectorOpen(false)}
        type={newTransactionType === 'receipt' ? 'customer' : 'supplier'}
        onSelect={(invoice) => {
          setFormData({
            ...formData,
            amount: invoice.remainingAmount.toString(),
            personName: invoice.clientName || invoice.supplierName || '',
            invoiceNumber: invoice.invoiceNumber,
            invoiceId: invoice.id,
            description: `${newTransactionType === 'receipt' ? 'Încasare' : 'Plată'} factură ${invoice.invoiceNumber}`
          });
          setIsInvoiceSelectorOpen(false);
          toast({
            title: '✅ Factură selectată',
            description: `${invoice.invoiceNumber} - Rest: ${invoice.remainingAmount.toFixed(2)} Lei`
          });
        }}
      />
      
      <EmployeeSelectorDialog
        isOpen={isEmployeeSelectorOpen}
        onClose={() => {
          setIsEmployeeSelectorOpen(false);
          // Cleanup
          setTimeout(() => {
            document.body.style.pointerEvents = 'auto';
            document.body.style.overflow = 'auto';
          }, 100);
        }}
        onSelect={(employee) => {
          if (isSelectingEmployeeForAdvance) {
            // Pentru advance dialog
            setSelectedEmployeeForAdvance(employee);
            setIsSelectingEmployeeForAdvance(false);
            setIsEmployeeSelectorOpen(false);
            // Redeschide advance dialog
            setIsAdvanceDialogOpen(true);
          } else {
            // Pentru form normal
            setFormData({
              ...formData,
              personName: employee.fullName,
              personId: employee.id,
              personIdNumber: employee.cnp
            });
            setIsEmployeeSelectorOpen(false);
          }
          
          // Cleanup
          setTimeout(() => {
            document.body.style.pointerEvents = 'auto';
            document.body.style.overflow = 'auto';
          }, 100);
        }}
        type="all"
      />
      
      <CashBankTransferDialog
        isOpen={isTransferDialogOpen}
        onClose={() => {
          setIsTransferDialogOpen(false);
          // Cleanup forțat pentru a preveni freeze
          setTimeout(() => {
            document.body.style.pointerEvents = 'auto';
            document.body.style.overflow = 'auto';
          }, 100);
        }}
        type={transferType}
      />
      
      <DailyClosingDialog
        isOpen={isClosingDialogOpen}
        onClose={() => {
          setIsClosingDialogOpen(false);
          // Cleanup forțat
          setTimeout(() => {
            document.body.style.pointerEvents = 'auto';
            document.body.style.overflow = 'auto';
          }, 100);
        }}
        cashRegisterId={selectedRegister !== 'all' ? selectedRegister : ''}
        date={new Date()}
      />
      
      <AdvanceManagementDialog
        isOpen={isAdvanceDialogOpen}
        onClose={() => {
          setIsAdvanceDialogOpen(false);
          setSelectedEmployeeForAdvance(null);
          // Cleanup forțat
          setTimeout(() => {
            document.body.style.pointerEvents = 'auto';
            document.body.style.overflow = 'auto';
          }, 100);
        }}
        cashRegisterId={selectedRegister !== 'all' ? selectedRegister : cashRegisters?.[0]?.id || ''}
        type={advanceType}
        preSelectedEmployee={selectedEmployeeForAdvance}
        onNeedEmployeeSelection={() => {
          // Închide dialogul curent și deschide selector angajați
          setIsAdvanceDialogOpen(false);
          setIsSelectingEmployeeForAdvance(true);
          setTimeout(() => {
            setIsEmployeeSelectorOpen(true);
          }, 150);
        }}
      />
    </AppLayout>
  );
}