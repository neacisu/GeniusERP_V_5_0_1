/**
 * Document Registry Page
 * 
 * Manages the official incoming and outgoing document registry
 * with automatic numbering and classification.
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import DocumentsModuleLayout from '../../components/common/DocumentsModuleLayout';
import DocumentFilters, { FilterParams } from '../../components/common/DocumentFilters';
import { DocumentCard, DocumentType, DocumentStatus } from '../../components/common/DocumentCard';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  SearchX, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileText, 
  Plus, 
  Calendar, 
  Download,
  Eye,
  FileSearch,
  BarChart
} from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

// Sample registry entries
const registryEntries = [
  {
    id: 'reg-1001',
    number: 'IN-2025-0134',
    date: '2025-03-15T10:30:00Z',
    subject: 'Contract de colaborare Firma ABC',
    type: 'contract',
    sender: 'Firma ABC SRL',
    recipient: 'Departament Juridic',
    flow: 'incoming' as const,
    status: 'registered' as const,
    refNumber: 'ABC-2025-056',
    documentId: 'doc-001',
    notes: 'Contract important pentru proiectul X',
    documentType: 'pdf' as DocumentType,
    documentSize: 3245678,
  },
  {
    id: 'reg-1002',
    number: 'IN-2025-0133',
    date: '2025-03-10T09:20:00Z',
    subject: 'Factură furnizor XYZ SRL',
    type: 'invoice',
    sender: 'XYZ SRL',
    recipient: 'Departament Contabilitate',
    flow: 'incoming' as const,
    status: 'registered' as const,
    refNumber: 'XYZ-F-4501',
    documentId: 'doc-002',
    notes: 'Factură pentru servicii IT luna februarie',
    documentType: 'invoice' as DocumentType,
    documentSize: 1245678,
  },
  {
    id: 'reg-1003',
    number: 'OUT-2025-0089',
    date: '2025-02-24T10:15:00Z',
    subject: 'Adresă către Ministerul Finanțelor',
    type: 'letter',
    sender: 'Departament Contabilitate',
    recipient: 'Ministerul Finanțelor',
    flow: 'outgoing' as const,
    status: 'registered' as const,
    refNumber: '',
    documentId: 'doc-007',
    documentType: 'pdf' as DocumentType,
    documentSize: 745678,
  },
  {
    id: 'reg-1004',
    number: 'IN-2025-0132',
    date: '2025-03-05T11:45:00Z',
    subject: 'Decizie ANAF pentru rambursare TVA',
    type: 'decision',
    sender: 'ANAF',
    recipient: 'Departament Contabilitate',
    flow: 'incoming' as const,
    status: 'registered' as const,
    refNumber: 'ANAF-TVA-25689',
    documentId: null,
    notes: 'Decizie favorabilă pentru rambursare TVA',
    documentType: 'pdf' as DocumentType,
    documentSize: 945678,
  },
  {
    id: 'reg-1005',
    number: 'OUT-2025-0088',
    date: '2025-02-20T14:30:00Z',
    subject: 'Ofertă colaborare pentru client Acme Inc',
    type: 'offer',
    sender: 'Departament Vânzări',
    recipient: 'Acme Inc',
    flow: 'outgoing' as const,
    status: 'registered' as const,
    refNumber: 'OF-2025-032',
    documentId: null,
    documentType: 'word' as DocumentType,
    documentSize: 1845678,
  },
];

// Registry stats
const registryStats = {
  incoming: {
    total: 134,
    byType: [
      { type: 'invoice', count: 56 },
      { type: 'contract', count: 23 },
      { type: 'letter', count: 18 },
      { type: 'decision', count: 12 },
      { type: 'other', count: 25 },
    ],
    byMonth: [
      { month: 'Ian', count: 28 },
      { month: 'Feb', count: 45 },
      { month: 'Mar', count: 61 },
    ]
  },
  outgoing: {
    total: 89,
    byType: [
      { type: 'letter', count: 34 },
      { type: 'offer', count: 21 },
      { type: 'contract', count: 19 },
      { type: 'other', count: 15 },
    ],
    byMonth: [
      { month: 'Ian', count: 21 },
      { month: 'Feb', count: 29 },
      { month: 'Mar', count: 39 },
    ]
  }
};

/**
 * Document Registry Page Component
 */
const RegistryPage: React.FC = () => {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [filters, setFilters] = useState<FilterParams>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [registryFlow, setRegistryFlow] = useState<'incoming' | 'outgoing'>('incoming');
  const [isNewEntryDialogOpen, setIsNewEntryDialogOpen] = useState(false);
  const [newEntryData, setNewEntryData] = useState({
    subject: '',
    type: 'letter',
    sender: '',
    recipient: '',
    refNumber: '',
    notes: '',
    documentId: '',
  });
  
  // Filter registry entries
  const filteredEntries = registryEntries.filter(entry => {
    // Filter by flow
    if (entry.flow !== registryFlow) return false;
    
    // Apply search filter
    if (filters.search && !entry.subject.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Apply date range filter
    if (filters.startDate && new Date(entry.date) < filters.startDate) {
      return false;
    }
    
    if (filters.endDate) {
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (new Date(entry.date) > endOfDay) {
        return false;
      }
    }
    
    return true;
  });
  
  // Handle filter changes
  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
    setCurrentPage(1);
    // In a real app, this would trigger an API call
  };
  
  // Handle document view
  const handleViewDocument = (documentId: string | null) => {
    if (!documentId) {
      toast({
        title: "Document indisponibil",
        description: "Documentul nu este disponibil în format electronic.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would open a document viewer
    toast({
      title: "Vizualizare document",
      description: `Se deschide documentul cu ID: ${documentId}`,
    });
  };
  
  // Handle document download
  const handleDownloadDocument = (documentId: string | null) => {
    if (!documentId) {
      toast({
        title: "Document indisponibil",
        description: "Documentul nu este disponibil în format electronic.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Descărcare document",
      description: `Se descarcă documentul cu ID: ${documentId}`,
    });
  };
  
  // Handle document OCR
  const handleOcrDocument = (documentId: string | null) => {
    if (!documentId) {
      toast({
        title: "Document indisponibil",
        description: "Documentul nu este disponibil în format electronic.",
        variant: "destructive",
      });
      return;
    }
    
    setLocation(`/documents/ocr?id=${documentId}`);
  };
  
  // Handle registry entry creation
  const handleCreateRegistryEntry = () => {
    toast({
      title: "Înregistrare document",
      description: `Document înregistrat cu succes în registrul ${registryFlow === 'incoming' ? 'de intrare' : 'de ieșire'}`,
    });
    
    setIsNewEntryDialogOpen(false);
    setNewEntryData({
      subject: '',
      type: 'letter',
      sender: '',
      recipient: '',
      refNumber: '',
      notes: '',
      documentId: '',
    });
    
    // In a real app, this would create a new entry and refresh the list
  };
  
  // Calculate registry statistics
  const currentStats = registryFlow === 'incoming' ? registryStats.incoming : registryStats.outgoing;
  
  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Get document type icon
  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'contract': return <FileText className="text-yellow-500" />;
      case 'invoice': return <FileText className="text-orange-500" />;
      case 'letter': return <FileText className="text-blue-500" />;
      case 'decision': return <FileText className="text-purple-500" />;
      case 'offer': return <FileText className="text-green-500" />;
      default: return <FileText className="text-gray-500" />;
    }
  };
  
  return (
    <DocumentsModuleLayout activeTab="registry">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mx-4 mt-4">
          <div>
            <h2 className="text-2xl font-bold">Registru Documente</h2>
            <p className="text-sm text-muted-foreground">
              Gestionați registrul de intrări și ieșiri al documentelor
            </p>
          </div>
          
          <Dialog open={isNewEntryDialogOpen} onOpenChange={setIsNewEntryDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Înregistrare Nouă
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Înregistrare Document</DialogTitle>
                <DialogDescription>
                  Adăugați o nouă înregistrare în registrul de {registryFlow === 'incoming' ? 'intrare' : 'ieșire'}.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="register-type" className="text-right">
                    Tip registru
                  </Label>
                  <Select 
                    value={registryFlow} 
                    onValueChange={(value: 'incoming' | 'outgoing') => setRegistryFlow(value)}
                  >
                    <SelectTrigger id="register-type" className="col-span-3">
                      <SelectValue placeholder="Selectați tipul de registru" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incoming">Registru Intrări</SelectItem>
                      <SelectItem value="outgoing">Registru Ieșiri</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subject" className="text-right">
                    Subiect
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Subiectul documentului"
                    className="col-span-3"
                    value={newEntryData.subject}
                    onChange={(e) => setNewEntryData({ ...newEntryData, subject: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="doc-type" className="text-right">
                    Tip document
                  </Label>
                  <Select 
                    value={newEntryData.type} 
                    onValueChange={(value) => setNewEntryData({ ...newEntryData, type: value })}
                  >
                    <SelectTrigger id="doc-type" className="col-span-3">
                      <SelectValue placeholder="Selectați tipul documentului" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="letter">Adresă/Scrisoare</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="invoice">Factură</SelectItem>
                      <SelectItem value="decision">Decizie</SelectItem>
                      <SelectItem value="offer">Ofertă</SelectItem>
                      <SelectItem value="other">Altele</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sender" className="text-right">
                    {registryFlow === 'incoming' ? 'Expeditor' : 'Emitent'}
                  </Label>
                  <Input
                    id="sender"
                    placeholder={registryFlow === 'incoming' ? "Denumire expeditor" : "Departament emitent"}
                    className="col-span-3"
                    value={newEntryData.sender}
                    onChange={(e) => setNewEntryData({ ...newEntryData, sender: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="recipient" className="text-right">
                    {registryFlow === 'incoming' ? 'Destinatar' : 'Destinatar'}
                  </Label>
                  <Input
                    id="recipient"
                    placeholder={registryFlow === 'incoming' ? "Departament destinatar" : "Denumire destinatar"}
                    className="col-span-3"
                    value={newEntryData.recipient}
                    onChange={(e) => setNewEntryData({ ...newEntryData, recipient: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ref-number" className="text-right">
                    Nr. referință
                  </Label>
                  <Input
                    id="ref-number"
                    placeholder="Număr de referință extern (opțional)"
                    className="col-span-3"
                    value={newEntryData.refNumber}
                    onChange={(e) => setNewEntryData({ ...newEntryData, refNumber: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="document-id" className="text-right">
                    Document
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    <Input
                      id="document-id"
                      placeholder="ID document (opțional)"
                      className="flex-grow"
                      value={newEntryData.documentId}
                      onChange={(e) => setNewEntryData({ ...newEntryData, documentId: e.target.value })}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        toast({
                          title: "Selectare document",
                          description: "Funcționalitate de selectare document în curând disponibilă",
                        });
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Selectare
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="notes" className="text-right pt-2">
                    Observații
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Observații sau notițe (opțional)"
                    className="col-span-3"
                    rows={3}
                    value={newEntryData.notes}
                    onChange={(e) => setNewEntryData({ ...newEntryData, notes: e.target.value })}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewEntryDialogOpen(false)}
                >
                  Anulează
                </Button>
                <Button type="submit" onClick={handleCreateRegistryEntry}>
                  Înregistrează
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Registry Tabs */}
        <div className="p-4">
          <Tabs 
            defaultValue="incoming" 
            value={registryFlow} 
            onValueChange={(value: string) => setRegistryFlow(value as 'incoming' | 'outgoing')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="incoming" className="flex items-center gap-1">
                <ArrowDownLeft className="h-4 w-4 mr-1" />
                <span>Registru Intrări</span>
                <Badge variant="secondary" className="ml-2">{registryStats.incoming.total}</Badge>
              </TabsTrigger>
              <TabsTrigger value="outgoing" className="flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>Registru Ieșiri</span>
                <Badge variant="secondary" className="ml-2">{registryStats.outgoing.total}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Statistics Card */}
        <Card className="mx-4">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Statistici Registru {registryFlow === 'incoming' ? 'Intrări' : 'Ieșiri'}</CardTitle>
                <CardDescription>
                  Anul curent: {currentStats.total} înregistrări
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                toast({
                  title: "Rapoarte detaliate",
                  description: "Vizualizare rapoarte detaliate în curând disponibilă",
                });
              }}>
                <BarChart className="h-4 w-4 mr-2" />
                Rapoarte
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Distribution by type */}
              <div>
                <h4 className="text-sm font-medium mb-3">Distribuție după tip</h4>
                <div className="space-y-2">
                  {currentStats.byType.map((item, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-24 truncate font-medium text-sm">
                        {item.type === 'contract' && 'Contracte'}
                        {item.type === 'invoice' && 'Facturi'}
                        {item.type === 'letter' && 'Adrese'}
                        {item.type === 'decision' && 'Decizii'}
                        {item.type === 'offer' && 'Oferte'}
                        {item.type === 'other' && 'Altele'}
                      </div>
                      <div className="flex-1 mx-2">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${(item.count / currentStats.total) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-10 text-sm text-right">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Distribution by month */}
              <div>
                <h4 className="text-sm font-medium mb-3">Evoluție lunară 2025</h4>
                <div className="flex items-end h-[120px] gap-3 pt-2">
                  {currentStats.byMonth.map((item, i) => (
                    <div key={i} className="flex flex-col items-center flex-1">
                      <div 
                        className="w-full bg-primary rounded-t"
                        style={{ 
                          height: `${(item.count / Math.max(...currentStats.byMonth.map(m => m.count))) * 100}px`,
                        }}
                      />
                      <div className="text-xs mt-1">{item.month}</div>
                      <div className="text-xs font-medium">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Filters */}
        <div className="p-4">
          <DocumentFilters 
            onFilterChange={handleFilterChange} 
            initialValues={filters}
          />
        </div>
        
        {/* Registry Entries Table */}
        <div className="px-4 pb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Registru {registryFlow === 'incoming' ? 'Intrări' : 'Ieșiri'}</CardTitle>
              <CardDescription>
                Toate documentele {registryFlow === 'incoming' ? 'primite' : 'emise'} cu numere unice de înregistrare
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px]">
                  <SearchX className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nicio înregistrare găsită</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajustați filtrele sau adăugați înregistrări noi
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsNewEntryDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adaugă Înregistrare
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Număr</TableHead>
                        <TableHead className="w-[120px]">Dată</TableHead>
                        <TableHead>Subiect</TableHead>
                        <TableHead className="w-[100px]">Tip</TableHead>
                        <TableHead className="hidden lg:table-cell">
                          {registryFlow === 'incoming' ? 'Expeditor' : 'Emitent'}
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                          {registryFlow === 'incoming' ? 'Destinatar' : 'Destinatar'}
                        </TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.number}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                              {new Date(entry.date).toLocaleDateString('ro-RO')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {getDocumentTypeIcon(entry.type)}
                              <span className="ml-2 truncate">{entry.subject}</span>
                            </div>
                            {entry.refNumber && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Ref: {entry.refNumber}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {entry.type === 'contract' && 'Contract'}
                              {entry.type === 'invoice' && 'Factură'}
                              {entry.type === 'letter' && 'Adresă'}
                              {entry.type === 'decision' && 'Decizie'}
                              {entry.type === 'offer' && 'Ofertă'}
                              {entry.type === 'other' && 'Altele'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {entry.sender}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {entry.recipient}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewDocument(entry.documentId)}
                                disabled={!entry.documentId}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleDownloadDocument(entry.documentId)}
                                disabled={!entry.documentId}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleOcrDocument(entry.documentId)}
                                disabled={!entry.documentId}
                              >
                                <FileSearch className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Afișare {Math.min(filteredEntries.length, 10)} din {filteredEntries.length} înregistrări
              </div>
              
              {filteredEntries.length > 10 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }} />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink 
                        href="#" 
                        isActive={currentPage === 1}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(1);
                        }}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink 
                        href="#" 
                        isActive={currentPage === 2}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(2);
                        }}
                      >
                        2
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < 2) setCurrentPage(currentPage + 1);
                      }} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </DocumentsModuleLayout>
  );
};

export default RegistryPage;