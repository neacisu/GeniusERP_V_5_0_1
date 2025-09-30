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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  PlusCircle,
  Eye,
  Download,
  Calendar,
  Filter,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ArrowDownUp,
  ArrowUpDown,
  FileText
} from "lucide-react";
import { Link } from "wouter";

// Type definitions
type JournalEntry = {
  id: string;
  number: string;
  date: string;
  description: string;
  source: string;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  documentType?: string;
  documentId?: string;
  referenceNumber?: string;
};

type JournalEntryLine = {
  id: string;
  journalEntryId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
};

export default function JournalEntriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [dateRange, setDateRange] = useState({ 
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  });
  const { toast } = useToast();

  // Fetch journal entries
  const { data: journalEntries, isLoading: isLoadingEntries } = useQuery<JournalEntry[]>({
    queryKey: ['/api/accounting/journal-entries', dateRange],
    // This is just for structure - we'll use actual API data in production
    placeholderData: [
      { 
        id: '1', 
        number: 'JE-2025-001', 
        date: '2025-04-10', 
        description: 'Înregistrare amortizare lunară',
        source: 'Manual',
        totalAmount: 5680.00,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-10T10:15:00Z',
        documentType: 'Note Contabile',
        documentId: 'NC-2025-001'
      },
      { 
        id: '2', 
        number: 'JE-2025-002', 
        date: '2025-04-10', 
        description: 'Înregistrare TVA deductibilă',
        source: 'Note Contabile',
        totalAmount: 1235.50,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-10T11:25:00Z',
        documentType: 'Note Contabile',
        documentId: 'NC-2025-002'
      },
      { 
        id: '3', 
        number: 'JE-2025-003', 
        date: '2025-04-09', 
        description: 'Înregistrare factură de vânzare nr. 12345',
        source: 'Vânzări',
        totalAmount: 4750.00,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-09T14:35:00Z',
        documentType: 'Factură',
        documentId: 'INV-2025-12345',
        referenceNumber: '12345'
      },
      { 
        id: '4', 
        number: 'JE-2025-004', 
        date: '2025-04-09', 
        description: 'Înregistrare factură de achiziție nr. F987',
        source: 'Cumpărări',
        totalAmount: 2890.30,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-09T16:45:00Z',
        documentType: 'Factură',
        documentId: 'PO-2025-987',
        referenceNumber: 'F987'
      },
      { 
        id: '5', 
        number: 'JE-2025-005', 
        date: '2025-04-08', 
        description: 'Plată salarii luna martie 2025',
        source: 'Salarizare',
        totalAmount: 32450.75,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-08T09:15:00Z',
        documentType: 'Stat de plată',
        documentId: 'SAL-2025-03'
      },
      { 
        id: '6', 
        number: 'JE-2025-006', 
        date: '2025-04-08', 
        description: 'Depunere numerar bancă',
        source: 'Bancă',
        totalAmount: 15000.00,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-08T10:25:00Z',
        documentType: 'Extras de cont',
        documentId: 'BNK-2025-0408'
      },
      { 
        id: '7', 
        number: 'JE-2025-007', 
        date: '2025-04-07', 
        description: 'Ridicare numerar din bancă',
        source: 'Casă',
        totalAmount: 5000.00,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-07T14:40:00Z',
        documentType: 'Dispoziție de plată',
        documentId: 'CSH-2025-0407'
      },
      { 
        id: '8', 
        number: 'JE-2025-008', 
        date: '2025-04-07', 
        description: 'Plată utilități',
        source: 'Plăți',
        totalAmount: 1850.25,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-07T15:30:00Z',
        documentType: 'Factură',
        documentId: 'UTL-2025-0407',
        referenceNumber: '87654'
      },
      { 
        id: '9', 
        number: 'JE-2025-009', 
        date: '2025-04-06', 
        description: 'Înregistrare diferențe de curs valutar',
        source: 'Manual',
        totalAmount: 1245.50,
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-06T16:15:00Z'
      },
      { 
        id: '10', 
        number: 'JE-2025-010', 
        date: '2025-04-05', 
        description: 'Avans decontare salariați',
        source: 'Decontări',
        totalAmount: 2500.00,
        createdBy: 'Maria Ionescu',
        createdAt: '2025-04-05T12:10:00Z',
        documentType: 'Dispoziție de plată',
        documentId: 'DEC-2025-0405'
      },
    ]
  });

  // Fetch journal entry details when viewing an entry
  const { data: entryDetails, isLoading: isLoadingEntryDetails } = useQuery<JournalEntryLine[]>({
    queryKey: ['/api/accounting/journal-entries', selectedEntry?.id, 'details'],
    enabled: !!selectedEntry,
    // This is just for structure - we'll use actual API data in production
    placeholderData: [
      { 
        id: '1',
        journalEntryId: '1',
        accountCode: '6811',
        accountName: 'Cheltuieli cu amortizarea imobilizărilor',
        description: 'Amortizare echipamente IT',
        debit: 3500.00,
        credit: 0
      },
      { 
        id: '2',
        journalEntryId: '1',
        accountCode: '6812',
        accountName: 'Cheltuieli cu amortizarea altor imobilizări',
        description: 'Amortizare mobilier',
        debit: 2180.00,
        credit: 0
      },
      { 
        id: '3',
        journalEntryId: '1',
        accountCode: '2813',
        accountName: 'Amortizarea instalațiilor și mijloacelor de transport',
        description: 'Amortizare cumulată',
        debit: 0,
        credit: 3500.00
      },
      { 
        id: '4',
        journalEntryId: '1',
        accountCode: '2814',
        accountName: 'Amortizarea altor imobilizări corporale',
        description: 'Amortizare cumulată',
        debit: 0,
        credit: 2180.00
      }
    ]
  });

  // Filter entries based on search term and active tab
  const filteredEntries = journalEntries?.filter(entry => {
    // Filter by search term
    const matchesSearch = 
      entry.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.referenceNumber && entry.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by tab (source)
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'manual' && entry.source === 'Manual') ||
      (activeTab === 'notes' && entry.source === 'Note Contabile') ||
      (activeTab === 'sales' && entry.source === 'Vânzări') ||
      (activeTab === 'purchases' && entry.source === 'Cumpărări') ||
      (activeTab === 'bank' && entry.source === 'Bancă') ||
      (activeTab === 'cash' && entry.source === 'Casă');
    
    return matchesSearch && matchesTab;
  }) || [];

  // Pagination logic
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredEntries.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);

  // Format date strings
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO');
  };

  // Format time strings
  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString('ro-RO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      minimumFractionDigits: 2
    }).format(value);
  };

  // Handle opening the view dialog
  const handleViewEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsViewDialogOpen(true);
  };

  // Get source badge color
  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'Manual': return 'bg-gray-100 text-gray-800';
      case 'Note Contabile': return 'bg-blue-100 text-blue-800';
      case 'Vânzări': return 'bg-green-100 text-green-800';
      case 'Cumpărări': return 'bg-purple-100 text-purple-800';
      case 'Bancă': return 'bg-indigo-100 text-indigo-800';
      case 'Casă': return 'bg-amber-100 text-amber-800';
      case 'Salarizare': return 'bg-pink-100 text-pink-800';
      case 'Plăți': return 'bg-red-100 text-red-800';
      case 'Decontări': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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
              <BreadcrumbPage>Registru Jurnal</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registru Jurnal</h1>
          <p className="text-sm text-gray-500">Vizualizați înregistrările contabile și urmăriți operațiunile financiare</p>
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
              <DropdownMenuLabel>Export Jurnal</DropdownMenuLabel>
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
          
          <Link href="/accounting/note-contabil">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              <span>Notă Contabilă Nouă</span>
            </Button>
          </Link>
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
                  placeholder="Caută după număr sau descriere..."
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
            
            {/* Second row - tabs for source filter */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full sm:w-auto overflow-auto">
                <TabsTrigger value="all">Toate</TabsTrigger>
                <TabsTrigger value="manual">Manuale</TabsTrigger>
                <TabsTrigger value="notes">Note Contabile</TabsTrigger>
                <TabsTrigger value="sales">Vânzări</TabsTrigger>
                <TabsTrigger value="purchases">Cumpărări</TabsTrigger>
                <TabsTrigger value="bank">Bancă</TabsTrigger>
                <TabsTrigger value="cash">Casă</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="border-b">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="w-28">Număr</TableHead>
                  <TableHead className="w-28">Dată</TableHead>
                  <TableHead>Descriere</TableHead>
                  <TableHead className="w-28">Sursă</TableHead>
                  <TableHead className="w-32">Ref. Document</TableHead>
                  <TableHead className="text-right w-28">Sumă</TableHead>
                  <TableHead className="text-right w-20">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingEntries ? (
                  Array(5).fill(null).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7} className="h-16">
                        <div className="h-8 w-full bg-gray-100 animate-pulse rounded"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : currentEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                      {searchTerm || activeTab !== 'all' ? (
                        <>
                          <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          Nu s-au găsit înregistrări care să corespundă filtrelor.
                          <Button variant="link" onClick={() => { setSearchTerm(''); setActiveTab('all'); }}>
                            Resetează filtrele
                          </Button>
                        </>
                      ) : (
                        <>
                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          Nu există înregistrări în jurnalul contabil pentru perioada selectată.
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentEntries.map((entry) => (
                    <TableRow 
                      key={entry.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewEntry(entry)}
                    >
                      <TableCell className="font-medium">{entry.number}</TableCell>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {entry.description}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceBadgeColor(entry.source)}`}>
                          {entry.source}
                        </span>
                      </TableCell>
                      <TableCell>
                        {entry.documentType && entry.documentId ? (
                          <span className="text-sm">
                            {entry.documentId}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(entry.totalAmount)} RON
                      </TableCell>
                      <TableCell className="text-right p-0 pr-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewEntry(entry);
                          }}
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Button>
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
              Afișare {indexOfFirstEntry + 1}-{Math.min(indexOfLastEntry, filteredEntries.length)} din {filteredEntries.length} înregistrări
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

      {/* View Entry Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Detalii Înregistrare Jurnal</DialogTitle>
            <DialogDescription>
              Vizualizați detaliile înregistrării din jurnalul contabil
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="py-4">
              {/* Entry header */}
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Număr Înregistrare</p>
                    <p className="font-medium">{selectedEntry.number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dată</p>
                    <p className="font-medium">{formatDate(selectedEntry.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sursă</p>
                    <p>
                      <span className={`inline-block px-2 py-1 mt-1 rounded-full text-xs font-medium ${getSourceBadgeColor(selectedEntry.source)}`}>
                        {selectedEntry.source}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-medium tabular-nums">{formatCurrency(selectedEntry.totalAmount)} RON</p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <p className="text-sm text-gray-500">Descriere</p>
                  <p className="font-medium">{selectedEntry.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Document Referință</p>
                    <p className="font-medium">
                      {selectedEntry.documentType && selectedEntry.documentId ? (
                        <>
                          {selectedEntry.documentType}: {selectedEntry.documentId}
                          {selectedEntry.referenceNumber && (
                            <span className="text-gray-500 ml-1">
                              (Ref: {selectedEntry.referenceNumber})
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Creat de</p>
                    <p className="font-medium">{selectedEntry.createdBy}</p>
                    <p className="text-xs text-gray-400">{new Date(selectedEntry.createdAt).toLocaleString('ro-RO')}</p>
                  </div>
                </div>
              </div>
              
              {/* Entry lines */}
              <h3 className="text-base font-medium mb-3">Linii Contabile</h3>
              
              {isLoadingEntryDetails ? (
                <div className="flex justify-center items-center p-8">
                  <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2">Se încarcă detaliile...</span>
                </div>
              ) : entryDetails && entryDetails.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-28">Cont</TableHead>
                        <TableHead>Denumire Cont</TableHead>
                        <TableHead>Descriere</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entryDetails.map((line) => (
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
                          {formatCurrency(entryDetails.reduce((sum, line) => sum + line.debit, 0))} RON
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatCurrency(entryDetails.reduce((sum, line) => sum + line.credit, 0))} RON
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">Nu există linii contabile pentru această înregistrare.</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Închide
            </Button>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}