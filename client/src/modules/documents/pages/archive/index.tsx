/**
 * Document Archive Page
 * 
 * Displays a comprehensive view of the document archive with filtering,
 * pagination, and document actions.
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import DocumentsModuleLayout from '../../components/common/DocumentsModuleLayout';
import DocumentCard, { DocumentType, DocumentStatus } from '../../components/common/DocumentCard';
import DocumentFilters, { FilterParams } from '../../components/common/DocumentFilters';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  FileUp, 
  Plus, 
  Layers, 
  RefreshCw, 
  Grid2X2, 
  List 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Sample document data (in a real app, this would come from an API)
const mockDocuments = [
  {
    id: 'doc-001',
    title: 'Contract de colaborare Firma ABC',
    type: 'contract' as DocumentType,
    status: 'active' as DocumentStatus,
    version: 2,
    createdAt: '2025-03-15T10:30:00Z',
    updatedAt: '2025-03-18T14:45:00Z',
    createdBy: 'Alexandru Popescu',
    fileSize: 3245678,
    registryNumber: 'IN-2025-0134',
    registryDate: '2025-03-15T10:30:00Z',
  },
  {
    id: 'doc-002',
    title: 'Factură furnizor XYZ SRL',
    type: 'invoice' as DocumentType,
    status: 'archived' as DocumentStatus,
    version: 1,
    createdAt: '2025-03-10T09:20:00Z',
    updatedAt: '2025-03-10T09:20:00Z',
    createdBy: 'Maria Ionescu',
    fileSize: 1245678,
    registryNumber: 'IN-2025-0133',
    registryDate: '2025-03-10T09:20:00Z',
    flowType: 'incoming' as 'incoming',
  },
  {
    id: 'doc-003',
    title: 'Proces verbal ședință consiliu',
    type: 'pdf' as DocumentType,
    status: 'signed' as DocumentStatus,
    version: 3,
    createdAt: '2025-03-05T15:45:00Z',
    updatedAt: '2025-03-08T10:15:00Z',
    createdBy: 'Alexandru Popescu',
    fileSize: 2145678,
    flowType: 'internal' as 'internal',
  },
  {
    id: 'doc-004',
    title: 'Cerere de concediu - Departament HR',
    type: 'pdf' as DocumentType,
    status: 'pending' as DocumentStatus,
    version: 1,
    createdAt: '2025-03-01T11:30:00Z',
    updatedAt: '2025-03-01T11:30:00Z',
    createdBy: 'Elena Dumitrescu',
    fileSize: 545678,
    flowType: 'internal' as 'internal',
  },
  {
    id: 'doc-005',
    title: 'Raport financiar Trimestrul 1',
    type: 'excel' as DocumentType,
    status: 'active' as DocumentStatus,
    version: 4,
    createdAt: '2025-02-28T14:20:00Z',
    updatedAt: '2025-03-20T09:10:00Z',
    createdBy: 'Andrei Vasilescu',
    fileSize: 3645678,
    flowType: 'internal' as 'internal',
  },
  {
    id: 'doc-006',
    title: 'Proiect rebranding companie',
    type: 'word' as DocumentType,
    status: 'draft' as DocumentStatus,
    version: 1,
    createdAt: '2025-02-26T16:45:00Z',
    updatedAt: '2025-02-26T16:45:00Z',
    createdBy: 'Cristina Popa',
    fileSize: 1845678,
  },
  {
    id: 'doc-007',
    title: 'Adresă către Ministerul Finanțelor',
    type: 'pdf' as DocumentType,
    status: 'signed' as DocumentStatus,
    version: 2,
    createdAt: '2025-02-24T10:15:00Z',
    updatedAt: '2025-02-25T14:30:00Z',
    createdBy: 'Mihai Ionescu',
    fileSize: 745678,
    registryNumber: 'OUT-2025-0089',
    registryDate: '2025-02-24T10:15:00Z',
    flowType: 'outgoing' as 'outgoing',
  },
  {
    id: 'doc-008',
    title: 'Situație stocuri Ianuarie 2025',
    type: 'excel' as DocumentType,
    status: 'archived' as DocumentStatus,
    version: 1,
    createdAt: '2025-01-31T15:40:00Z',
    updatedAt: '2025-01-31T15:40:00Z',
    createdBy: 'Andrei Vasilescu',
    fileSize: 2945678,
  },
];

// Storage stats data
const storageStats = {
  total: 50 * 1024 * 1024 * 1024, // 50 GB in bytes
  used: 12.7 * 1024 * 1024 * 1024, // 12.7 GB in bytes
  breakdown: [
    { type: 'pdf', size: 5.4 * 1024 * 1024 * 1024, count: 143 },
    { type: 'word', size: 3.2 * 1024 * 1024 * 1024, count: 87 },
    { type: 'excel', size: 2.8 * 1024 * 1024 * 1024, count: 65 },
    { type: 'image', size: 0.8 * 1024 * 1024 * 1024, count: 24 },
    { type: 'other', size: 0.5 * 1024 * 1024 * 1024, count: 12 },
  ]
};

/**
 * Document Archive Page Component
 */
const ArchivePage: React.FC = () => {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [filters, setFilters] = useState<FilterParams>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('all');
  
  // Handle filter changes
  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
    setCurrentPage(1);
    // In a real app, this would trigger an API call
  };
  
  // Handle document view
  const handleViewDocument = (id: string) => {
    // In a real app, this would open a document viewer
    toast({
      title: "Vizualizare document",
      description: `Se deschide documentul cu ID: ${id}`,
    });
  };
  
  // Handle document edit
  const handleEditDocument = (id: string) => {
    setLocation(`/documents/editor?id=${id}`);
  };
  
  // Handle document download
  const handleDownloadDocument = (id: string) => {
    toast({
      title: "Descărcare document",
      description: `Se descarcă documentul cu ID: ${id}`,
    });
  };
  
  // Handle document delete
  const handleDeleteDocument = (id: string) => {
    toast({
      title: "Ștergere document",
      description: `Se șterge documentul cu ID: ${id}`,
      variant: "destructive",
    });
  };
  
  // Handle document history
  const handleDocumentHistory = (id: string) => {
    toast({
      title: "Istoric document",
      description: `Se încarcă istoricul documentului cu ID: ${id}`,
    });
  };
  
  // Handle document sign
  const handleSignDocument = (id: string) => {
    setLocation(`/documents/signatures?id=${id}`);
  };
  
  // Handle document share
  const handleShareDocument = (id: string) => {
    toast({
      title: "Partajare document",
      description: `Se generează link-ul de partajare pentru documentul cu ID: ${id}`,
    });
  };
  
  // Handle document OCR
  const handleOcrDocument = (id: string) => {
    setLocation(`/documents/ocr?id=${id}`);
  };
  
  // Filter documents based on current filters and tab
  const filteredDocuments = mockDocuments.filter(doc => {
    // Apply tab filters
    if (activeTab === 'active' && doc.status !== 'active') return false;
    if (activeTab === 'archived' && doc.status !== 'archived') return false;
    if (activeTab === 'drafts' && doc.status !== 'draft') return false;
    if (activeTab === 'signed' && doc.status !== 'signed') return false;
    
    // Apply search filter
    if (filters.search && !doc.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Apply type filter
    if (filters.types && filters.types.length > 0 && !filters.types.includes(doc.type)) {
      return false;
    }
    
    // Apply status filter
    if (filters.status && filters.status.length > 0 && !filters.status.includes(doc.status)) {
      return false;
    }
    
    // Apply date range filter for createdAt
    if (filters.startDate && new Date(doc.createdAt) < filters.startDate) {
      return false;
    }
    
    if (filters.endDate) {
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (new Date(doc.createdAt) > endOfDay) {
        return false;
      }
    }
    
    // Apply creator filter
    if (filters.creator && !doc.createdBy?.toLowerCase().includes(filters.creator.toLowerCase())) {
      return false;
    }
    
    // Apply flow type filter
    if (filters.flowTypes && filters.flowTypes.length > 0) {
      if (!doc.flowType || !filters.flowTypes.includes(doc.flowType)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Format bytes to human-readable size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };
  
  // Calculate storage usage
  const storageUsedPercent = (storageStats.used / storageStats.total) * 100;
  
  return (
    <DocumentsModuleLayout activeTab="archive">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center mx-4 mt-4">
          <div>
            <h2 className="text-2xl font-bold">Arhivă Documente</h2>
            <p className="text-sm text-muted-foreground">
              Gestionați și organizați toate documentele companiei
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              toast({
                title: "Reîmprospătare",
                description: "Lista de documente a fost actualizată",
              });
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reîmprospătează
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Adaugă document</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/documents/editor')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Document nou
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  toast({
                    title: "Încărcare",
                    description: "Funcționalitate de încărcare document în curând disponibilă",
                  });
                }}>
                  <FileUp className="h-4 w-4 mr-2" />
                  Încarcă fișier
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Storage Overview Card */}
        <Card className="mx-4">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Stocare Documente</CardTitle>
                <CardDescription>
                  Spațiu utilizat: {formatSize(storageStats.used)} din {formatSize(storageStats.total)}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                toast({
                  title: "Mai multe detalii",
                  description: "Vizualizare detaliată a utilizării spațiului în curând disponibilă",
                });
              }}>
                <Layers className="h-4 w-4 mr-2" />
                Detalii
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={storageUsedPercent} className="h-2" />
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                {storageStats.breakdown.map((item, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="text-lg font-semibold">{item.count}</div>
                    <div className="uppercase text-xs text-muted-foreground">{item.type}</div>
                    <div className="text-xs">{formatSize(item.size)}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Filters */}
        <div className="p-4">
          <DocumentFilters 
            onFilterChange={handleFilterChange} 
            initialValues={filters}
            showFlowTypeFilter={true}
          />
        </div>
        
        {/* Tab Navigation */}
        <div className="px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="all">Toate</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="archived">Arhivate</TabsTrigger>
                <TabsTrigger value="drafts">Ciorne</TabsTrigger>
                <TabsTrigger value="signed">Semnate</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {filteredDocuments.length} documente
                </span>
                <div className="flex border rounded-md">
                  <Button 
                    variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === 'list' ? 'default' : 'ghost'} 
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* All documents content */}
            <TabsContent value="all" className="mt-4 space-y-6">
              {filteredDocuments.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-[300px]">
                    <Layers className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Niciun document găsit</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ajustați filtrele sau adăugați documente noi
                    </p>
                    <Button className="mt-4" onClick={() => setLocation('/documents/editor')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adaugă document
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                  {filteredDocuments.map(doc => (
                    <DocumentCard 
                      key={doc.id}
                      {...doc}
                      onView={handleViewDocument}
                      onEdit={handleEditDocument}
                      onDownload={handleDownloadDocument}
                      onDelete={handleDeleteDocument}
                      onHistory={handleDocumentHistory}
                      onSign={handleSignDocument}
                      onShare={handleShareDocument}
                      onOcr={handleOcrDocument}
                      compact={viewMode === 'list'}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Other tab contents (these would have the same logic but filtered by status) */}
            <TabsContent value="active" className="mt-4 space-y-6">
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                {filteredDocuments.map(doc => (
                  <DocumentCard 
                    key={doc.id}
                    {...doc}
                    onView={handleViewDocument}
                    onEdit={handleEditDocument}
                    onDownload={handleDownloadDocument}
                    onDelete={handleDeleteDocument}
                    onHistory={handleDocumentHistory}
                    onSign={handleSignDocument}
                    onShare={handleShareDocument}
                    onOcr={handleOcrDocument}
                    compact={viewMode === 'list'}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="archived" className="mt-4 space-y-6">
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                {filteredDocuments.map(doc => (
                  <DocumentCard 
                    key={doc.id}
                    {...doc}
                    onView={handleViewDocument}
                    onEdit={handleEditDocument}
                    onDownload={handleDownloadDocument}
                    onDelete={handleDeleteDocument}
                    onHistory={handleDocumentHistory}
                    onShare={handleShareDocument}
                    onOcr={handleOcrDocument}
                    compact={viewMode === 'list'}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="drafts" className="mt-4 space-y-6">
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                {filteredDocuments.map(doc => (
                  <DocumentCard 
                    key={doc.id}
                    {...doc}
                    onView={handleViewDocument}
                    onEdit={handleEditDocument}
                    onDownload={handleDownloadDocument}
                    onDelete={handleDeleteDocument}
                    onHistory={handleDocumentHistory}
                    onSign={handleSignDocument}
                    onShare={handleShareDocument}
                    onOcr={handleOcrDocument}
                    compact={viewMode === 'list'}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="signed" className="mt-4 space-y-6">
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                {filteredDocuments.map(doc => (
                  <DocumentCard 
                    key={doc.id}
                    {...doc}
                    onView={handleViewDocument}
                    onEdit={handleEditDocument}
                    onDownload={handleDownloadDocument}
                    onDelete={handleDeleteDocument}
                    onHistory={handleDocumentHistory}
                    onSign={handleSignDocument}
                    onShare={handleShareDocument}
                    onOcr={handleOcrDocument}
                    compact={viewMode === 'list'}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Pagination */}
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }} />
              </PaginationItem>
              
              {[1, 2, 3].map(page => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              
              <PaginationItem>
                <PaginationNext href="#" onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(currentPage + 1);
                }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </DocumentsModuleLayout>
  );
};

export default ArchivePage;