/**
 * Document Search Page
 * 
 * Advanced document search functionality with full-text search,
 * filtering, and document preview.
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import DocumentsModuleLayout from '../../components/common/DocumentsModuleLayout';
import SearchResults from '../../components/search/SearchResults';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Calendar, 
  SlidersHorizontal, 
  FileText, 
  FileSearch,
  Download,
  Eye,
  RotateCcw
} from 'lucide-react';
import { DocumentType, DocumentStatus } from '../../components/common/DocumentCard';

// Sample search results
const sampleSearchResults = [
  {
    id: 'doc-001',
    title: 'Contract de colaborare Firma ABC',
    type: 'contract' as DocumentType,
    status: 'active' as DocumentStatus,
    matchedContent: 'Articolul 5.3: Colaborarea dintre părți se va desfășura pe o perioadă inițială de 12 luni, cu posibilitatea de prelungire automată pentru perioade similare, dacă niciuna dintre părți nu notifică în scris...',
    createdAt: '2025-03-15T10:30:00Z',
    updatedAt: '2025-03-18T14:45:00Z',
    createdBy: 'Alexandru Popescu',
    relevanceScore: 0.95,
    matchCount: 5,
    registryNumber: 'IN-2025-0134',
  },
  {
    id: 'doc-007',
    title: 'Adresă către Ministerul Finanțelor',
    type: 'pdf' as DocumentType,
    status: 'signed' as DocumentStatus,
    matchedContent: 'Prin prezenta, vă solicităm colaborarea în vederea clarificării aspectelor fiscale menționate în adresa anterioară. Colaborarea eficientă între instituțiile statului este esențială pentru...',
    createdAt: '2025-02-24T10:15:00Z',
    updatedAt: '2025-02-25T14:30:00Z',
    createdBy: 'Mihai Ionescu',
    relevanceScore: 0.82,
    matchCount: 2,
    registryNumber: 'OUT-2025-0089',
  },
  {
    id: 'doc-012',
    title: 'Contract de servicii IT',
    type: 'contract' as DocumentType,
    status: 'active' as DocumentStatus,
    matchedContent: '8.2 Modalități de colaborare: Părțile vor stabili un cadru de colaborare bazat pe principii de transparență și eficiență. Furnizorul va desemna un reprezentant pentru gestionarea colaborării cu Beneficiarul.',
    createdAt: '2025-01-10T09:45:00Z',
    updatedAt: '2025-01-15T11:30:00Z',
    createdBy: 'Elena Dumitrescu',
    relevanceScore: 0.78,
    matchCount: 3,
  },
];

/**
 * Document Search Page Component
 */
const SearchPage: React.FC = () => {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [selectedResultContent, setSelectedResultContent] = useState<string | null>(null);
  
  // Advanced search filters
  const [advancedFilters, setAdvancedFilters] = useState({
    docTypes: [] as DocumentType[],
    docStatuses: [] as DocumentStatus[],
    startDate: null as Date | null,
    endDate: null as Date | null,
    createdBy: '',
    registryNumbers: [] as string[],
    searchInContent: true,
    searchInMetadata: true,
    searchInAttachments: false,
    sortBy: 'relevance' as 'relevance' | 'date' | 'title',
    sortDirection: 'desc' as 'asc' | 'desc',
  });
  
  // Toggle document type filter
  const toggleDocType = (type: DocumentType) => {
    setAdvancedFilters(prev => {
      if (prev.docTypes.includes(type)) {
        return { ...prev, docTypes: prev.docTypes.filter(t => t !== type) };
      } else {
        return { ...prev, docTypes: [...prev.docTypes, type] };
      }
    });
  };
  
  // Toggle document status filter
  const toggleDocStatus = (status: DocumentStatus) => {
    setAdvancedFilters(prev => {
      if (prev.docStatuses.includes(status)) {
        return { ...prev, docStatuses: prev.docStatuses.filter(s => s !== status) };
      } else {
        return { ...prev, docStatuses: [...prev.docStatuses, status] };
      }
    });
  };
  
  // Handle search submission
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Căutare goală",
        description: "Introduceți un termen de căutare",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate API call
    setTimeout(() => {
      setSearchResults(sampleSearchResults);
      setIsSearching(false);
      
      toast({
        title: "Căutare finalizată",
        description: `Au fost găsite ${sampleSearchResults.length} rezultate pentru "${searchQuery}"`,
      });
    }, 1500);
  };
  
  // Reset search and filters
  const resetSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setAdvancedFilters({
      docTypes: [],
      docStatuses: [],
      startDate: null,
      endDate: null,
      createdBy: '',
      registryNumbers: [],
      searchInContent: true,
      searchInMetadata: true,
      searchInAttachments: false,
      sortBy: 'relevance',
      sortDirection: 'desc',
    });
  };
  
  // Handle document view
  const handleViewDocument = (id: string) => {
    // In a real app, this would navigate to document viewer
    toast({
      title: "Vizualizare document",
      description: `Se deschide documentul cu ID: ${id}`,
    });
  };
  
  // Handle document download
  const handleDownloadDocument = (id: string) => {
    toast({
      title: "Descărcare document",
      description: `Se descarcă documentul cu ID: ${id}`,
    });
  };
  
  // Handle view context
  const handleViewContext = (id: string) => {
    setSelectedResult(id);
    
    // In a real app, this would fetch full content from API
    const result = sampleSearchResults.find(r => r.id === id);
    
    if (result) {
      // Simulate fuller content
      setSelectedResultContent(`# ${result.title}

${result.registryNumber ? `Număr registru: ${result.registryNumber}` : ''}
Creat de: ${result.createdBy}
Data: ${new Date(result.createdAt).toLocaleDateString('ro-RO')}

## Conținut Document

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

${result.matchedContent}

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Clauze și Specificații

1. Prima clauză de colaborare
2. A doua clauză importantă
3. Termeni și condiții generale

### Subsecțiune Document

Mai multe detalii despre colaborare și implementare se regăsesc în anexe.`);
    }
  };
  
  return (
    <DocumentsModuleLayout activeTab="search">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mx-4 mt-4">
          <div>
            <h2 className="text-2xl font-bold">Căutare Documente</h2>
            <p className="text-sm text-muted-foreground">
              Căutare avansată în conținutul și metadatele documentelor
            </p>
          </div>
        </div>
        
        {/* Search input */}
        <div className="px-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Căutați în documente..."
                    className="pl-9 pr-4"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                      <span>Căutare...</span>
                    </>
                  ) : (
                    <>
                      <FileSearch className="h-4 w-4 mr-2" />
                      <span>Caută</span>
                    </>
                  )}
                </Button>
                {hasSearched && (
                  <Button variant="outline" onClick={resetSearch}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    <span>Resetare</span>
                  </Button>
                )}
              </div>
              
              <Accordion type="single" collapsible className="mt-3">
                <AccordionItem value="advanced-search">
                  <AccordionTrigger className="text-sm py-2">
                    <div className="flex items-center">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      <span>Căutare avansată</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Tipuri de documente</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="doc-type-contract" 
                                checked={advancedFilters.docTypes.includes('contract')}
                                onCheckedChange={() => toggleDocType('contract')}
                              />
                              <Label htmlFor="doc-type-contract">Contracte</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="doc-type-invoice" 
                                checked={advancedFilters.docTypes.includes('invoice')}
                                onCheckedChange={() => toggleDocType('invoice')}
                              />
                              <Label htmlFor="doc-type-invoice">Facturi</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="doc-type-pdf" 
                                checked={advancedFilters.docTypes.includes('pdf')}
                                onCheckedChange={() => toggleDocType('pdf')}
                              />
                              <Label htmlFor="doc-type-pdf">PDF</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="doc-type-word" 
                                checked={advancedFilters.docTypes.includes('word')}
                                onCheckedChange={() => toggleDocType('word')}
                              />
                              <Label htmlFor="doc-type-word">Word</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="doc-type-excel" 
                                checked={advancedFilters.docTypes.includes('excel')}
                                onCheckedChange={() => toggleDocType('excel')}
                              />
                              <Label htmlFor="doc-type-excel">Excel</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="doc-type-image" 
                                checked={advancedFilters.docTypes.includes('image')}
                                onCheckedChange={() => toggleDocType('image')}
                              />
                              <Label htmlFor="doc-type-image">Imagini</Label>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-2">Status documente</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="doc-status-active" 
                                checked={advancedFilters.docStatuses.includes('active')}
                                onCheckedChange={() => toggleDocStatus('active')}
                              />
                              <Label htmlFor="doc-status-active">Active</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="doc-status-archived" 
                                checked={advancedFilters.docStatuses.includes('archived')}
                                onCheckedChange={() => toggleDocStatus('archived')}
                              />
                              <Label htmlFor="doc-status-archived">Arhivate</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="doc-status-draft" 
                                checked={advancedFilters.docStatuses.includes('draft')}
                                onCheckedChange={() => toggleDocStatus('draft')}
                              />
                              <Label htmlFor="doc-status-draft">Ciorne</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="doc-status-signed" 
                                checked={advancedFilters.docStatuses.includes('signed')}
                                onCheckedChange={() => toggleDocStatus('signed')}
                              />
                              <Label htmlFor="doc-status-signed">Semnate</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Interval de timp</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="start-date">De la</Label>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Input id="start-date" type="date" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="end-date">Până la</Label>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Input id="end-date" type="date" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-2">Sortare rezultate</h3>
                          <Select
                            value={`${advancedFilters.sortBy}-${advancedFilters.sortDirection}`}
                            onValueChange={(value) => {
                              const [sortBy, sortDirection] = value.split('-') as [
                                'relevance' | 'date' | 'title', 
                                'asc' | 'desc'
                              ];
                              setAdvancedFilters(prev => ({
                                ...prev,
                                sortBy,
                                sortDirection,
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sortează după" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="relevance-desc">Relevanță (desc)</SelectItem>
                              <SelectItem value="date-desc">Data (desc)</SelectItem>
                              <SelectItem value="date-asc">Data (asc)</SelectItem>
                              <SelectItem value="title-asc">Titlu (A-Z)</SelectItem>
                              <SelectItem value="title-desc">Titlu (Z-A)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-2">Domenii de căutare</h3>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="search-content" 
                                checked={advancedFilters.searchInContent}
                                onCheckedChange={(checked) => {
                                  setAdvancedFilters(prev => ({
                                    ...prev,
                                    searchInContent: !!checked,
                                  }));
                                }}
                              />
                              <Label htmlFor="search-content">Conținut documente</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="search-metadata" 
                                checked={advancedFilters.searchInMetadata}
                                onCheckedChange={(checked) => {
                                  setAdvancedFilters(prev => ({
                                    ...prev,
                                    searchInMetadata: !!checked,
                                  }));
                                }}
                              />
                              <Label htmlFor="search-metadata">Metadate (titlu, autor)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="search-attachments" 
                                checked={advancedFilters.searchInAttachments}
                                onCheckedChange={(checked) => {
                                  setAdvancedFilters(prev => ({
                                    ...prev,
                                    searchInAttachments: !!checked,
                                  }));
                                }}
                              />
                              <Label htmlFor="search-attachments">Conținut atașamente</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
        
        {/* Search results or selected document */}
        <div className="px-4 pb-6">
          {hasSearched && (
            <Tabs 
              defaultValue={selectedResult ? "preview" : "results"} 
              value={selectedResult ? "preview" : "results"}
              className="w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger 
                    value="results" 
                    onClick={() => setSelectedResult(null)}
                  >
                    Rezultate ({searchResults.length})
                  </TabsTrigger>
                  {selectedResult && (
                    <TabsTrigger value="preview">
                      Previzualizare
                    </TabsTrigger>
                  )}
                </TabsList>
                
                {selectedResult && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewDocument(selectedResult)}>
                      <Eye className="h-4 w-4 mr-1" />
                      <span>Vizualizare completă</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadDocument(selectedResult)}>
                      <Download className="h-4 w-4 mr-1" />
                      <span>Descărcare</span>
                    </Button>
                  </div>
                )}
              </div>
              
              <TabsContent value="results" className="mt-0">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Rezultate căutare</CardTitle>
                    <CardDescription>
                      Rezultate pentru "{searchQuery}" {advancedFilters.docTypes.length > 0 && 
                        `(filtrat după ${advancedFilters.docTypes.length} tipuri)`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SearchResults
                      results={searchResults}
                      searchTerm={searchQuery}
                      onViewDocument={handleViewDocument}
                      onDownloadDocument={handleDownloadDocument}
                      onViewContext={handleViewContext}
                      isLoading={isSearching}
                    />
                  </CardContent>
                  <CardFooter className="justify-between">
                    <div className="text-sm text-muted-foreground">
                      {searchResults.length} rezultate găsite
                    </div>
                    
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
                        {searchResults.length > 10 && (
                          <>
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationNext href="#" onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(currentPage + 1);
                              }} />
                            </PaginationItem>
                          </>
                        )}
                      </PaginationContent>
                    </Pagination>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="preview" className="mt-0">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>
                          {selectedResult && searchResults.find(r => r.id === selectedResult)?.title}
                        </CardTitle>
                        <CardDescription>
                          Previzualizare document cu evidențierea termenilor de căutare
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedResult(null)}
                      >
                        Înapoi la rezultate
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedResultContent && (
                      <div className="rounded-md border p-6 bg-white">
                        <div className="whitespace-pre-line max-w-3xl mx-auto">
                          {selectedResultContent.split('\n').map((line, index) => {
                            if (line.startsWith('# ')) {
                              return <h1 key={index} className="text-2xl font-bold mb-4">{line.substring(2)}</h1>;
                            } else if (line.startsWith('## ')) {
                              return <h2 key={index} className="text-xl font-semibold mt-6 mb-3">{line.substring(3)}</h2>;
                            } else if (line.startsWith('### ')) {
                              return <h3 key={index} className="text-lg font-medium mt-4 mb-2">{line.substring(4)}</h3>;
                            } else if (line.match(/^\d+\. /)) {
                              return <div key={index} className="ml-6 mb-2">{line}</div>;
                            } else if (line.includes(searchQuery)) {
                              const parts = line.split(new RegExp(`(${searchQuery})`, 'gi'));
                              return (
                                <p key={index} className="mb-4">
                                  {parts.map((part, i) => 
                                    part.toLowerCase() === searchQuery.toLowerCase() ? 
                                      <mark key={i} className="bg-yellow-200">{part}</mark> : part
                                  )}
                                </p>
                              );
                            } else {
                              return <p key={index} className="mb-4">{line}</p>;
                            }
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
          
          {!hasSearched && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileSearch className="h-20 w-20 text-muted-foreground mb-6" />
                <h3 className="text-xl font-medium mb-2">Căutare în arhiva de documente</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Introduceți termenii de căutare pentru a găsi rapid documente în întreaga arhivă. 
                  Puteți căuta în titluri, conținut și metadate.
                </p>
                <div className="flex gap-4">
                  <div className="space-y-2 text-center">
                    <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mx-auto">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-sm font-medium">Toate tipurile de documente</div>
                  </div>
                  <div className="space-y-2 text-center">
                    <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mx-auto">
                      <Search className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-sm font-medium">Căutare în conținut</div>
                  </div>
                  <div className="space-y-2 text-center">
                    <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mx-auto">
                      <SlidersHorizontal className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-sm font-medium">Filtre avansate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DocumentsModuleLayout>
  );
};

export default SearchPage;