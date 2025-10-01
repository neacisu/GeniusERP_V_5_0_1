import { useState } from "react";
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
} from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast";
import { 
  PlusCircle,
  FileEdit,
  Trash2,
  Search,
  ChevronDown,
  Calendar,
  Filter,
  FilePlus,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  ClockIcon,
  Eye,
  Loader2,
  Save,
  ArrowUpDown
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
import { Link } from "wouter";

// Type definitions
type AccountingNote = {
  id: string;
  number: string;
  date: string;
  description: string;
  totalAmount: number;
  status: 'draft' | 'approved' | 'posted';
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  source?: string;
  documentType?: string;
  documentId?: string;
};

type AccountingNoteLine = {
  id: string;
  noteId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
};

type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
  balance?: number;
};

export default function NoteContabilPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedNote, setSelectedNote] = useState<AccountingNote | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [notesPerPage] = useState(10);
  const [formLines, setFormLines] = useState<Array<{accountId: string, description: string, debit: string, credit: string}>>([
    { accountId: "", description: "", debit: "0", credit: "0" }
  ]);
  const { toast } = useToast();

  // Fetch accounting notes
  const { data: notes, isLoading: isLoadingNotes } = useQuery<AccountingNote[]>({
    queryKey: ['/api/accounting/note-contabil'],
    select: (response: any) => response?.data || [],
    // This is just for structure - we'll use actual API data in production
    placeholderData: [
      { 
        id: '1', 
        number: 'NC-2025-001', 
        date: '2025-04-10', 
        description: 'Înregistrare amortizare lunară',
        totalAmount: 5680.00, 
        status: 'approved',
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-10T10:15:00Z',
        approvedBy: 'Maria Ionescu',
        approvedAt: '2025-04-10T14:30:00Z'
      },
      { 
        id: '2', 
        number: 'NC-2025-002', 
        date: '2025-04-10', 
        description: 'Înregistrare TVA deductibilă',
        totalAmount: 1235.50, 
        status: 'posted',
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-10T10:25:00Z',
        approvedBy: 'Maria Ionescu',
        approvedAt: '2025-04-10T14:35:00Z'
      },
      { 
        id: '3', 
        number: 'NC-2025-003', 
        date: '2025-04-09', 
        description: 'Înregistrare închidere venituri și cheltuieli',
        totalAmount: 18750.00, 
        status: 'draft',
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-09T16:45:00Z'
      },
      { 
        id: '4', 
        number: 'NC-2025-004', 
        date: '2025-04-09', 
        description: 'Înregistrare diferențe de curs valutar',
        totalAmount: 875.25, 
        status: 'approved',
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-09T14:15:00Z',
        approvedBy: 'Maria Ionescu',
        approvedAt: '2025-04-09T16:30:00Z'
      },
      { 
        id: '5', 
        number: 'NC-2025-005', 
        date: '2025-04-08', 
        description: 'Înregistrare cheltuieli cu utilitățile',
        totalAmount: 2345.80, 
        status: 'posted',
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-08T11:25:00Z',
        approvedBy: 'Maria Ionescu',
        approvedAt: '2025-04-08T14:10:00Z'
      },
      { 
        id: '6', 
        number: 'NC-2025-006', 
        date: '2025-04-08', 
        description: 'Înregistrare salarii',
        totalAmount: 42680.00, 
        status: 'posted',
        createdBy: 'Alexandru Popescu',
        createdAt: '2025-04-08T09:35:00Z',
        approvedBy: 'Maria Ionescu',
        approvedAt: '2025-04-08T13:45:00Z'
      },
    ]
  });

  // Fetch note details when viewing a note
  const { data: noteDetails, isLoading: isLoadingNoteDetails } = useQuery<AccountingNoteLine[]>({
    queryKey: ['/api/accounting/note-contabil', selectedNote?.id, 'details'],
    enabled: !!selectedNote,
    // This is just for structure - we'll use actual API data in production
    placeholderData: [
      { 
        id: '1',
        noteId: '1',
        accountCode: '6811',
        accountName: 'Cheltuieli cu amortizarea imobilizărilor',
        description: 'Amortizare echipamente IT',
        debit: 3500.00,
        credit: 0
      },
      { 
        id: '2',
        noteId: '1',
        accountCode: '6812',
        accountName: 'Cheltuieli cu amortizarea altor imobilizări',
        description: 'Amortizare mobilier',
        debit: 2180.00,
        credit: 0
      },
      { 
        id: '3',
        noteId: '1',
        accountCode: '2813',
        accountName: 'Amortizarea instalațiilor și mijloacelor de transport',
        description: 'Amortizare cumulată',
        debit: 0,
        credit: 3500.00
      },
      { 
        id: '4',
        noteId: '1',
        accountCode: '2814',
        accountName: 'Amortizarea altor imobilizări corporale',
        description: 'Amortizare cumulată',
        debit: 0,
        credit: 2180.00
      }
    ]
  });

  // Fetch accounts for the note creation form
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
    select: (response: any) => Array.isArray(response) ? response : (response?.data || []),
    // This is just for structure - we'll use actual API data in production
    placeholderData: [
      { id: '1', code: '101', name: 'Capital social', type: 'P' },
      { id: '2', code: '121', name: 'Profit sau pierdere', type: 'B' },
      { id: '3', code: '212', name: 'Construcții', type: 'A' },
      { id: '4', code: '214', name: 'Mobilier și echipamente', type: 'A' },
      { id: '5', code: '281', name: 'Amortizări privind imobilizările corporale', type: 'P' },
      { id: '6', code: '301', name: 'Materii prime', type: 'A' },
      { id: '7', code: '371', name: 'Mărfuri', type: 'A' },
      { id: '8', code: '401', name: 'Furnizori', type: 'P' },
      { id: '9', code: '411', name: 'Clienți', type: 'A' },
      { id: '10', code: '5121', name: 'Conturi la bănci în lei', type: 'A' },
      { id: '11', code: '5311', name: 'Casa în lei', type: 'A' },
      { id: '12', code: '601', name: 'Cheltuieli cu materiile prime', type: 'A' },
      { id: '13', code: '602', name: 'Cheltuieli cu materiale consumabile', type: 'A' },
      { id: '14', code: '607', name: 'Cheltuieli privind mărfurile', type: 'A' },
      { id: '15', code: '627', name: 'Cheltuieli cu serviciile bancare', type: 'A' },
      { id: '16', code: '635', name: 'Cheltuieli cu alte impozite și taxe', type: 'A' },
      { id: '17', code: '641', name: 'Cheltuieli cu salariile personalului', type: 'A' },
      { id: '18', code: '6811', name: 'Cheltuieli cu amortizarea imobilizărilor', type: 'A' },
      { id: '19', code: '701', name: 'Venituri din vânzarea produselor finite', type: 'P' },
      { id: '20', code: '707', name: 'Venituri din vânzarea mărfurilor', type: 'P' },
      { id: '21', code: '4111', name: 'Clienți', type: 'A' },
      { id: '22', code: '4426', name: 'TVA deductibilă', type: 'A' },
      { id: '23', code: '4427', name: 'TVA colectată', type: 'P' },
      { id: '24', code: '473', name: 'Decontări din operații în curs de clarificare', type: 'B' }
    ]
  });

  // Filter notes based on search term and active tab
  const filteredNotes = notes?.filter(note => {
    // Filter by search term
    const matchesSearch = 
      note.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
      note.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'draft' && note.status === 'draft') ||
      (activeTab === 'approved' && note.status === 'approved') ||
      (activeTab === 'posted' && note.status === 'posted');
    
    return matchesSearch && matchesTab;
  }) || [];

  // Pagination logic
  const indexOfLastNote = currentPage * notesPerPage;
  const indexOfFirstNote = indexOfLastNote - notesPerPage;
  const currentNotes = filteredNotes.slice(indexOfFirstNote, indexOfLastNote);
  const totalPages = Math.ceil(filteredNotes.length / notesPerPage);

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
  const handleViewNote = (note: AccountingNote) => {
    setSelectedNote(note);
    setIsViewDialogOpen(true);
  };

  // Add a new line to the form
  const addFormLine = () => {
    setFormLines([...formLines, { accountId: "", description: "", debit: "0", credit: "0" }]);
  };

  // Remove a line from the form
  const removeFormLine = (index: number) => {
    if (formLines.length > 1) {
      const newLines = [...formLines];
      newLines.splice(index, 1);
      setFormLines(newLines);
    }
  };

  // Calculate line totals
  const calculateLineTotals = () => {
    const totalDebit = formLines.reduce((sum, line) => sum + parseFloat(line.debit || "0"), 0);
    const totalCredit = formLines.reduce((sum, line) => sum + parseFloat(line.credit || "0"), 0);
    
    return {
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
    };
  };

  const { totalDebit, totalCredit, isBalanced } = calculateLineTotals();

  // Handle form submission
  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isBalanced) {
      toast({
        title: "Eroare de echilibru",
        description: "Suma debitelor trebuie să fie egală cu suma creditelor.",
        variant: "destructive"
      });
      return;
    }
    
    // Here we would submit the form data to the API
    toast({
      title: "Notă contabilă creată",
      description: "Nota contabilă a fost creată cu succes.",
    });
    
    setIsCreateDialogOpen(false);
    setFormLines([{ accountId: "", description: "", debit: "0", credit: "0" }]);
  };

  // Get status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <div className="flex items-center gap-1.5">
            <ClockIcon className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
              Ciornă
            </span>
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              Aprobată
            </span>
          </div>
        );
      case 'posted':
        return (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              Contabilizată
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded-full">
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
              <BreadcrumbPage>Note Contabile</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Note Contabile</h1>
          <p className="text-sm text-gray-500">Gestionați înregistrările contabile și operațiunile financiare</p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <span>Filtrare</span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrare Note Contabile</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="filter-today" />
                  <Label htmlFor="filter-today">Doar astăzi</Label>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox id="filter-week" />
                  <Label htmlFor="filter-week">Ultimele 7 zile</Label>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox id="filter-month" />
                  <Label htmlFor="filter-month">Luna curentă</Label>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Calendar className="h-4 w-4 mr-2" />
                <span>Filtrare avansată...</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            <span>Notă Contabilă Nouă</span>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Caută după număr sau descriere..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Toate</TabsTrigger>
                <TabsTrigger value="draft">Ciorne</TabsTrigger>
                <TabsTrigger value="approved">Aprobate</TabsTrigger>
                <TabsTrigger value="posted">Contabilizate</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="border-b">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-36">Număr</TableHead>
                  <TableHead className="w-32">Dată</TableHead>
                  <TableHead>Descriere</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right w-32">Sumă</TableHead>
                  <TableHead className="text-right w-36">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingNotes ? (
                  Array(5).fill(null).map((_, index) => (
                    <TableRow key={index} className="h-16">
                      <TableCell colSpan={6}>
                        <div className="flex items-center space-x-4">
                          <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : currentNotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-gray-500">
                      {searchTerm || activeTab !== 'all' ? (
                        <>
                          <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>Nu s-au găsit note contabile care să corespundă filtrelor.</p>
                          <Button variant="link" onClick={() => { setSearchTerm(''); setActiveTab('all'); }}>
                            Resetează filtrele
                          </Button>
                        </>
                      ) : (
                        <>
                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>Nu există note contabile. Creați prima notă contabilă.</p>
                          <Button 
                            variant="link" 
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="text-primary hover:text-primary-dark"
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Adaugă Notă Contabilă
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentNotes.map((note) => (
                    <TableRow key={note.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleViewNote(note)}>
                      <TableCell className="font-medium">{note.number}</TableCell>
                      <TableCell>{formatDate(note.date)}</TableCell>
                      <TableCell className="max-w-md truncate">{note.description}</TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(note.status)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(note.totalAmount)} RON
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewNote(note);
                            }}
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </Button>
                          
                          {note.status === 'draft' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle edit logic here
                              }}
                            >
                              <FileEdit className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                          
                          {note.status === 'draft' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle delete logic here
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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
              Afișare {indexOfFirstNote + 1}-{Math.min(indexOfLastNote, filteredNotes.length)} din {filteredNotes.length} note contabile
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

      {/* Create Note Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Notă Contabilă Nouă</DialogTitle>
            <DialogDescription>
              Creați o nouă notă contabilă cu detaliile operațiunii și înregistrările contabile
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateNote}>
            {/* Note details */}
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="number">Număr Document</Label>
                  <Input 
                    id="number" 
                    placeholder="Ex: NC-2025-001" 
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="date">Dată Document</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descriere</Label>
                <Input 
                  id="description" 
                  placeholder="Descrierea operațiunii contabile..." 
                  className="mt-1"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Linii Contabile</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addFormLine}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    <span>Adaugă Linie</span>
                  </Button>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-36">Cont</TableHead>
                        <TableHead>Descriere</TableHead>
                        <TableHead className="text-right w-28">Debit</TableHead>
                        <TableHead className="text-right w-28">Credit</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formLines.map((line, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select 
                              value={line.accountId}
                              onValueChange={(value) => {
                                const newLines = [...formLines];
                                newLines[index].accountId = value;
                                setFormLines(newLines);
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selectați cont" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts?.map(account => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.code} - {account.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="Descriere linie..." 
                              value={line.description}
                              onChange={(e) => {
                                const newLines = [...formLines];
                                newLines[index].description = e.target.value;
                                setFormLines(newLines);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              className="text-right"
                              value={line.debit}
                              onChange={(e) => {
                                const newLines = [...formLines];
                                newLines[index].debit = e.target.value;
                                newLines[index].credit = "0"; // Reset credit when debit is entered
                                setFormLines(newLines);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              className="text-right"
                              value={line.credit}
                              onChange={(e) => {
                                const newLines = [...formLines];
                                newLines[index].credit = e.target.value;
                                newLines[index].debit = "0"; // Reset debit when credit is entered
                                setFormLines(newLines);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => removeFormLine(index)}
                              disabled={formLines.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <tfoot>
                      <tr className="bg-gray-50 font-medium">
                        <td colSpan={2} className="px-4 py-2 text-right">
                          Total:
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(totalDebit)} RON
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(totalCredit)} RON
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
                
                <div className={`mt-3 flex items-center text-sm ${isBalanced ? 'text-green-600' : 'text-red-500'}`}>
                  {isBalanced ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      <span>Nota contabilă este echilibrată (Debit = Credit)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span>Diferență: {formatCurrency(Math.abs(totalDebit - totalCredit))} RON. Suma debitelor trebuie să fie egală cu suma creditelor.</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setFormLines([{ accountId: "", description: "", debit: "0", credit: "0" }]);
                }}
              >
                Anulează
              </Button>
              <Button type="submit" disabled={!isBalanced}>
                <Save className="h-4 w-4 mr-2" />
                Salvează Nota Contabilă
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Note Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Detalii Notă Contabilă</DialogTitle>
            <DialogDescription>
              Vizualizați informațiile și înregistrările contabile
            </DialogDescription>
          </DialogHeader>
          
          {selectedNote && (
            <div className="py-4">
              {/* Note header */}
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Număr Document</p>
                    <p className="font-medium">{selectedNote.number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dată Document</p>
                    <p className="font-medium">{formatDate(selectedNote.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedNote.status)}</div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <p className="text-sm text-gray-500">Descriere</p>
                  <p className="font-medium">{selectedNote.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Creat de</p>
                    <p className="font-medium">{selectedNote.createdBy}</p>
                    <p className="text-xs text-gray-400">{new Date(selectedNote.createdAt).toLocaleString('ro-RO')}</p>
                  </div>
                  {selectedNote.approvedBy && (
                    <div>
                      <p className="text-sm text-gray-500">Aprobat de</p>
                      <p className="font-medium">{selectedNote.approvedBy}</p>
                      <p className="text-xs text-gray-400">{selectedNote.approvedAt && new Date(selectedNote.approvedAt).toLocaleString('ro-RO')}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Note lines */}
              <h3 className="text-base font-medium mb-3">Înregistrări Contabile</h3>
              
              {isLoadingNoteDetails ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  <span className="ml-2">Se încarcă detaliile...</span>
                </div>
              ) : noteDetails && noteDetails.length > 0 ? (
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
                      {noteDetails.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-medium">{line.accountCode}</TableCell>
                          <TableCell>{line.accountName}</TableCell>
                          <TableCell>{line.description}</TableCell>
                          <TableCell className="text-right">
                            {line.debit > 0 ? formatCurrency(line.debit) : ""}
                          </TableCell>
                          <TableCell className="text-right">
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
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(noteDetails.reduce((sum, line) => sum + line.debit, 0))} RON
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(noteDetails.reduce((sum, line) => sum + line.credit, 0))} RON
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">Nu există înregistrări contabile pentru această notă.</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            {selectedNote && selectedNote.status === 'draft' && (
              <Button variant="outline" className="mr-auto">
                <FileEdit className="h-4 w-4 mr-2" />
                Editează
              </Button>
            )}
            
            {selectedNote && selectedNote.status === 'draft' && (
              <Button variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Aprobă
              </Button>
            )}
            
            {selectedNote && selectedNote.status === 'approved' && (
              <Button variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Contabilizează
              </Button>
            )}
            
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