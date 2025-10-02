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
  FileSpreadsheet,
  CreditCard,
  Upload
} from "lucide-react";
import { Link } from "wouter";

// Type definitions
type BankAccount = {
  id: string;
  number?: string; // Legacy
  accountNumber?: string; // DB field
  name?: string; // Legacy
  accountName?: string; // DB field
  bankName: string;
  currency: string;
  balance?: number; // Legacy
  currentBalance?: number; // DB field
  isActive: boolean;
};

type BankTransaction = {
  id: string;
  date?: string; // Legacy
  transactionDate?: string; // DB field (timestamp)
  documentNumber?: string; // Legacy
  referenceNumber?: string; // DB field
  description: string;
  partnerName?: string; // Legacy
  payerName?: string; // DB field (for incoming)
  payeeName?: string; // DB field (for outgoing)
  reference?: string;
  type?: 'incoming' | 'outgoing' | 'transfer' | 'fee'; // Legacy
  transactionType?: string; // DB field
  amount: number;
  bankAccountId: string;
  posted?: boolean;
  isPosted?: boolean; // DB field
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

export default function BankJournalPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isJournalDialogOpen, setIsJournalDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState({ 
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  });
  const { toast } = useToast();

  // Fetch bank accounts
  const { data: bankAccountsResponse, isLoading: isLoadingAccounts } = useQuery<{ data: BankAccount[]; total: number }>({
    queryKey: ['/api/accounting/bank-accounts'],
    // This is just for structure - we'll use actual API data in production
    placeholderData: { data: [
      { 
        id: '1', 
        number: 'RO82BTRL123456789012345', 
        name: 'Cont principal RON', 
        bankName: 'Banca Transilvania', 
        currency: 'RON',
        balance: 45678.25,
        isActive: true
      },
      { 
        id: '2', 
        number: 'RO49RZBR123456789012345', 
        name: 'Cont operațional RON', 
        bankName: 'Raiffeisen Bank', 
        currency: 'RON',
        balance: 12540.75,
        isActive: true
      },
      { 
        id: '3', 
        number: 'RO15BTRL123456789012345', 
        name: 'Cont EUR', 
        bankName: 'Banca Transilvania', 
        currency: 'EUR',
        balance: 5680.50,
        isActive: true
      },
      { 
        id: '4', 
        number: 'RO31RZBR123456789012345', 
        name: 'Cont USD', 
        bankName: 'Raiffeisen Bank', 
        currency: 'USD',
        balance: 3450.00,
        isActive: true
      },
      { 
        id: '5', 
        number: 'RO75BRD123456789012345', 
        name: 'Cont card business', 
        bankName: 'BRD', 
        currency: 'RON',
        balance: 3250.80,
        isActive: true
      },
    ], total: 5 }
  });

  // Map DB fields to UI fields for bank accounts
  const bankAccounts = (bankAccountsResponse?.data || []).map((acc: any) => ({
    ...acc,
    name: acc.accountName || acc.name,
    number: acc.accountNumber || acc.number,
    balance: Number(acc.currentBalance || acc.balance || 0)
  }));

  // Fetch bank transactions
  const { data: transactionsResponse, isLoading: isLoadingTransactions } = useQuery<{ data: BankTransaction[]; total: number; page: number; limit: number }>({
    queryKey: ['/api/accounting/bank-transactions', selectedAccount, dateRange],
    // This is just for structure - we'll use actual API data in production
    placeholderData: { data: [
      { 
        id: '1', 
        date: '2025-04-10', 
        documentNumber: 'OP-2025-0001', 
        description: 'Plată factură furnizor IT Supplies SRL',
        partnerName: 'SC IT Supplies SRL',
        reference: 'F-12345/2025',
        type: 'outgoing',
        amount: 4850.75,
        bankAccountId: '1',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-10T10:15:00Z'
      },
      { 
        id: '2', 
        date: '2025-04-10', 
        documentNumber: 'OP-2025-0002', 
        description: 'Plată salariu Ionescu Maria',
        partnerName: 'Ionescu Maria',
        reference: 'SAL-202504',
        type: 'outgoing',
        amount: 5200.00,
        bankAccountId: '1',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-10T10:25:00Z'
      },
      { 
        id: '3', 
        date: '2025-04-09', 
        documentNumber: 'OI-2025-0001', 
        description: 'Încasare factură client ABC SRL',
        partnerName: 'SC ABC SRL',
        reference: 'F-123/2025',
        type: 'incoming',
        amount: 8540.50,
        bankAccountId: '1',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-09T14:35:00Z'
      },
      { 
        id: '4', 
        date: '2025-04-09', 
        documentNumber: 'OI-2025-0002', 
        description: 'Încasare factură client XYZ SA',
        partnerName: 'SC XYZ SA',
        reference: 'F-456/2025',
        type: 'incoming',
        amount: 12750.25,
        bankAccountId: '1',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-09T15:40:00Z'
      },
      { 
        id: '5', 
        date: '2025-04-08', 
        documentNumber: 'BNK-FEE-0001', 
        description: 'Comision bancar lunar',
        type: 'fee',
        amount: 50.00,
        bankAccountId: '1',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-08T09:15:00Z'
      },
      { 
        id: '6', 
        date: '2025-04-08', 
        documentNumber: 'TRF-2025-0001', 
        description: 'Transfer între conturi',
        reference: 'Transfer intern',
        type: 'transfer',
        amount: 5000.00,
        bankAccountId: '1',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-08T10:30:00Z'
      },
      { 
        id: '7', 
        date: '2025-04-08', 
        documentNumber: 'TRF-2025-0002', 
        description: 'Transfer între conturi',
        reference: 'Transfer intern',
        type: 'transfer',
        amount: 5000.00,
        bankAccountId: '2',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-08T10:30:00Z'
      },
      { 
        id: '8', 
        date: '2025-04-07', 
        documentNumber: 'OP-2025-0003', 
        description: 'Plată factură utilități',
        partnerName: 'SC Electrica Furnizare SA',
        reference: 'F-87654/2025',
        type: 'outgoing',
        amount: 1875.50,
        bankAccountId: '1',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-07T14:25:00Z'
      },
      { 
        id: '9', 
        date: '2025-04-07', 
        documentNumber: 'OP-2025-0004', 
        description: 'Plată factură internet și telefonie',
        partnerName: 'SC Telecom SRL',
        reference: 'F-54321/2025',
        type: 'outgoing',
        amount: 450.25,
        bankAccountId: '1',
        posted: true,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-07T14:35:00Z'
      },
      { 
        id: '10', 
        date: '2025-04-06', 
        documentNumber: 'OP-2025-0005', 
        description: 'Plată rate leasing auto',
        partnerName: 'SC Leasing Auto SRL',
        reference: 'CTR-123/2023',
        type: 'outgoing',
        amount: 2450.75,
        bankAccountId: '1',
        posted: true,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-06T10:15:00Z'
      },
    ], total: 10, page: 1, limit: 20 }
  });

  // Map DB fields to UI fields for transactions
  const transactions = (transactionsResponse?.data || []).map((txn: any) => ({
    ...txn,
    date: txn.transactionDate || txn.date,
    documentNumber: txn.referenceNumber || txn.documentNumber,
    partnerName: txn.payerName || txn.payeeName || txn.partnerName,
    type: txn.transactionType === 'incoming_payment' ? 'incoming' :
          txn.transactionType === 'outgoing_payment' ? 'outgoing' :
          txn.transactionType === 'bank_fee' ? 'fee' :
          txn.transactionType === 'transfer_between_accounts' ? 'transfer' : 'incoming',
    posted: txn.isPosted || txn.posted || false
  }));

  // Fetch transaction journal entry
  const { data: journalEntry, isLoading: isLoadingJournal } = useQuery<TransactionJournalEntry[]>({
    queryKey: ['/api/accounting/bank-transactions', selectedTransaction?.id, 'journal'],
    enabled: !!selectedTransaction && isJournalDialogOpen && selectedTransaction.posted,
    // This is just for structure - we'll use actual API data in production
    placeholderData: [
      {
        id: '1',
        journalEntryId: 'JE-2025-001',
        accountCode: '401',
        accountName: 'Furnizori',
        description: 'Plată factură furnizor IT Supplies SRL',
        debit: 4850.75,
        credit: 0
      },
      {
        id: '2',
        journalEntryId: 'JE-2025-001',
        accountCode: '5121',
        accountName: 'Conturi la bănci în lei',
        description: 'Plată factură furnizor IT Supplies SRL',
        debit: 0,
        credit: 4850.75
      }
    ]
  });

  // Filter transactions based on search term, account and type
  const filteredTransactions = transactions?.filter((transaction: any) => {
    // Filter by search term
    const matchesSearch = 
      (transaction.documentNumber || transaction.referenceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (transaction.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.partnerName || transaction.payerName || transaction.payeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.reference || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by account
    const matchesAccount = 
      selectedAccount === 'all' || 
      transaction.bankAccountId === selectedAccount;
    
    // Filter by type (tab)
    const matchesType = 
      activeTab === 'all' || 
      (activeTab === 'incoming' && transaction.type === 'incoming') ||
      (activeTab === 'outgoing' && transaction.type === 'outgoing') ||
      (activeTab === 'transfer' && transaction.type === 'transfer') ||
      (activeTab === 'fee' && transaction.type === 'fee');
    
    return matchesSearch && matchesAccount && matchesType;
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
  const handleViewTransaction = (transaction: BankTransaction) => {
    setSelectedTransaction(transaction);
    setIsViewDialogOpen(true);
  };

  // Handle opening the journal entries dialog
  const handleViewJournal = (transaction: BankTransaction, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTransaction(transaction);
    setIsJournalDialogOpen(true);
  };

  // Get transaction type badge
  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'incoming':
        return (
          <div className="flex items-center gap-1.5">
            <ArrowUp className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              Încasare
            </span>
          </div>
        );
      case 'outgoing':
        return (
          <div className="flex items-center gap-1.5">
            <ArrowDown className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
              Plată
            </span>
          </div>
        );
      case 'transfer':
        return (
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              Transfer
            </span>
          </div>
        );
      case 'fee':
        return (
          <div className="flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded-full">
              Comision
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
              <BreadcrumbPage>Extrase Bancare</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Extrase Bancare</h1>
          <p className="text-sm text-gray-500">Gestionați tranzacțiile bancare și reconciliați extrasele de cont</p>
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
              <DropdownMenuLabel>Export Tranzacții</DropdownMenuLabel>
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
              <DropdownMenuItem>
                <ArrowUp className="h-4 w-4 mr-2 text-green-500" />
                <span>Încasare</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ArrowDown className="h-4 w-4 mr-2 text-red-500" />
                <span>Plată</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                <span>Transfer</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                <span>Importă Extras Bancar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Account summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoadingAccounts ? (
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
          bankAccounts?.slice(0, 4).map((account) => (
            <Card key={account.id} className={`${selectedAccount === account.id ? 'border-primary' : ''}`} onClick={() => setSelectedAccount(account.id)}>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-500">{account.name}</p>
                <p className="text-xl font-bold mt-1 tabular-nums">{formatCurrency(account.balance, account.currency)}</p>
                <p className="text-xs text-gray-500 truncate mt-1">{account.bankName}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
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
            
            {/* Second row - account select and tabs for type filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Selectează cont bancar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate conturile</SelectItem>
                  {bankAccounts?.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {account.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="w-full sm:w-auto overflow-auto">
                  <TabsTrigger value="all">Toate</TabsTrigger>
                  <TabsTrigger value="incoming">Încasări</TabsTrigger>
                  <TabsTrigger value="outgoing">Plăți</TabsTrigger>
                  <TabsTrigger value="transfer">Transferuri</TabsTrigger>
                  <TabsTrigger value="fee">Comisioane</TabsTrigger>
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
                      {searchTerm || activeTab !== 'all' || selectedAccount !== 'all' ? (
                        <>
                          <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>Nu s-au găsit tranzacții care să corespundă filtrelor.</p>
                          <Button 
                            variant="link" 
                            onClick={() => { 
                              setSearchTerm(''); 
                              setActiveTab('all'); 
                              setSelectedAccount('all'); 
                            }}
                          >
                            Resetează filtrele
                          </Button>
                        </>
                      ) : (
                        <>
                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>Nu există tranzacții bancare pentru perioada selectată.</p>
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
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell className="font-medium">{transaction.documentNumber}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell>{transaction.partnerName || "-"}</TableCell>
                      <TableCell>{transaction.reference || "-"}</TableCell>
                      <TableCell>
                        {getTransactionTypeBadge(transaction.type)}
                      </TableCell>
                      <TableCell className={`text-right font-medium tabular-nums ${
                        transaction.type === 'incoming' 
                          ? 'text-green-600' 
                          : transaction.type === 'outgoing' || transaction.type === 'fee'
                            ? 'text-red-500'
                            : ''
                      }`}>
                        {transaction.type === 'incoming' ? '+' : transaction.type === 'outgoing' || transaction.type === 'fee' ? '-' : ''}
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
            <DialogTitle>Detalii Tranzacție Bancară</DialogTitle>
            <DialogDescription>
              Vizualizați informațiile tranzacției bancare
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="py-4">
              {/* Transaction header */}
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">Tranzacție {selectedTransaction.documentNumber}</h3>
                      {getTransactionTypeBadge(selectedTransaction.type || 'incoming')}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Data: {formatDate(selectedTransaction.date || '')}</p>
                  </div>
                  <div className={`text-xl font-bold tabular-nums ${
                    selectedTransaction.type === 'incoming' 
                      ? 'text-green-600' 
                      : selectedTransaction.type === 'outgoing' || selectedTransaction.type === 'fee'
                        ? 'text-red-500'
                        : ''
                  }`}>
                    {selectedTransaction.type === 'incoming' ? '+' : selectedTransaction.type === 'outgoing' || selectedTransaction.type === 'fee' ? '-' : ''}
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
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cont Bancar</p>
                    <p className="font-medium">
                      {bankAccounts?.find(acc => acc.id === selectedTransaction.bankAccountId)?.name || selectedTransaction.bankAccountId}
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
              
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Închide
              </Button>
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
                <>Înregistrarea contabilă pentru tranzacția {selectedTransaction.documentNumber}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="py-4">
              {/* Transaction reference */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    {selectedTransaction.type === 'incoming' ? (
                      <ArrowUp className="h-5 w-5 text-blue-700" />
                    ) : selectedTransaction.type === 'outgoing' ? (
                      <ArrowDown className="h-5 w-5 text-blue-700" />
                    ) : selectedTransaction.type === 'transfer' ? (
                      <CreditCard className="h-5 w-5 text-blue-700" />
                    ) : (
                      <Building className="h-5 w-5 text-blue-700" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">
                      {selectedTransaction.type === 'incoming' ? 'Încasare' : 
                       selectedTransaction.type === 'outgoing' ? 'Plată' :
                       selectedTransaction.type === 'transfer' ? 'Transfer' : 'Comision'} {selectedTransaction.documentNumber}
                    </h3>
                    <p className="text-sm text-blue-700">
                      Data: {formatDate(selectedTransaction.date || '')} | Sumă: {formatCurrency(selectedTransaction.amount, 'RON')}
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

      {/* Import Statement Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Importă Extras Bancar</DialogTitle>
            <DialogDescription>
              Selectați contul bancar și fișierul cu extrasul de cont pentru import
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-account">Cont Bancar</Label>
              <Select>
                <SelectTrigger id="import-account">
                  <SelectValue placeholder="Selectează cont bancar" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts?.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {account.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="import-format">Format Fișier</Label>
              <Select defaultValue="csv">
                <SelectTrigger id="import-format">
                  <SelectValue placeholder="Selectează format fișier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="mt940">MT940</SelectItem>
                  <SelectItem value="ofx">OFX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="import-file">Fișier Extras</Label>
              <Input id="import-file" type="file" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <Label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span>Contabilizează automat tranzacțiile</span>
                </Label>
              </div>
              <p className="text-xs text-gray-500">
                Sistemul va încerca să potrivească automat tranzacțiile cu regulile definite și partenerii existenți.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Anulează
            </Button>
            <Button type="submit">
              <Upload className="h-4 w-4 mr-2" />
              Importă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}