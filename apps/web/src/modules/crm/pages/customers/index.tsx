/**
 * CRM Customers List Page
 * 
 * Displays a list of all customers with filtering and search capabilities.
 * Adaugă suport pentru integrarea ANAF pentru importul datelor companiilor.
 * Utilizează date reale din baza de date.
 */

import React, { useState, useEffect } from 'react';
import { CRMModuleLayout } from '../../components/common/CRMModuleLayout';
import { CustomerCard } from '../../components/customers/CustomerCard';
import CompanyFormDialog from '../../components/company/CompanyFormDialog';
import { CompanyFormValues, Company } from '../../types';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  SlidersHorizontal,
  List,
  LayoutGrid,
  Mail,
  Phone,
  Loader2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useCompanies, invalidateCompaniesCache, CompanyFilters } from '../../hooks/useCompanies';

const CustomersPage: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50); // Higher limit to get more companies at once
  
  // API filters for the companies endpoint
  const filters: CompanyFilters = {
    page,
    limit: pageSize,
    searchTerm: searchQuery || undefined,
    sortBy: 'name',
    sortDirection: 'asc'
  };
  
  // Fetch companies from the API
  const { data: companiesResponse, isLoading, isError, error } = useCompanies(filters);
  
  // Get the companies array from the response
  const companiesData = companiesResponse?.data || [];
  
  console.log('[CustomersPage] Companies data loaded:', companiesData.length, 'companies');
  
  // Get unique industries for filter from real data
  const industries = [...new Set(companiesData
    .map(company => company.industry)
    .filter(Boolean)
  )];
  
  // Get unique segments for filter from real data
  const segments = [...new Set(companiesData
    .map(company => {
      // Using the customFields.segment or the regular segment field
      const segment = company.customFields?.['segment'] || company.segment;
      return segment;
    })
    .filter(Boolean)
  )];
  
  // Filter companies based on in-memory filters
  const filteredCustomers = companiesData.filter(company => {
    // Type filter - check in customFields.type or the type field
    const companyType = company.customFields?.['type'] || company.type || '';
    const matchesType = typeFilter === 'all' || companyType === typeFilter;
    
    // Segment filter - check in customFields.segment or the segment field
    const companySegment = company.customFields?.['segment'] || company.segment || '';
    const matchesSegment = segmentFilter === 'all' || companySegment === segmentFilter;
    
    // Industry filter
    const matchesIndustry = industryFilter === 'all' || company.industry === industryFilter;
    
    // Return true if all filters match (no need to filter by search as it's done by the API)
    return matchesType && matchesSegment && matchesIndustry;
  });
  
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  
  const handleAddCustomer = () => {
    setIsCompanyDialogOpen(true);
  };
  
  const handleCompanySubmit = async (data: CompanyFormValues) => {
    try {
      // Importăm serviciul de companii
      const { saveCompany } = await import('../../services/company.service');
      
      console.log('[CustomersPage] Trimitere date companie pentru salvare:', data);
      
      // Salvăm compania folosind serviciul
      const savedCompany = await saveCompany(data);
      
      console.log('[CustomersPage] Companie salvată cu succes:', savedCompany);
      
      toast({
        title: "Companie adăugată",
        description: `Compania ${data.name} a fost adăugată cu succes în baza de date.`,
      });
      
      // Reîncărcăm lista de companii invalidând cache-ul
      invalidateCompaniesCache();
      
      // Închidem dialogul
      setIsCompanyDialogOpen(false);
    } catch (error) {
      console.error('[CustomersPage] Eroare la salvarea companiei:', error);
      
      toast({
        title: "Eroare la salvarea companiei",
        description: error instanceof Error ? error.message : 'A apărut o eroare necunoscută',
        variant: "destructive"
      });
    }
  };
  
  const resetFilters = () => {
    setTypeFilter('all');
    setSegmentFilter('all');
    setIndustryFilter('all');
  };
  
  return (
    <CRMModuleLayout activeTab="customers">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Companii</h1>
          </div>
          
          <Button onClick={handleAddCustomer} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Adaugă Companie
          </Button>
        </div>
        
        {/* Dialog pentru adăugare companie cu integrare ANAF */}
        <CompanyFormDialog
          isOpen={isCompanyDialogOpen}
          onOpenChange={setIsCompanyDialogOpen}
          onSubmit={handleCompanySubmit}
        />
        
        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-3 pb-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Caută după nume, CUI sau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <Filter className="h-4 w-4 mr-1" />
                  Filtre
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <div className="p-3 space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Tip</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toate tipurile" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate tipurile</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="customer">Client</SelectItem>
                        <SelectItem value="partner">Partener</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Segment</label>
                    <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toate segmentele" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate segmentele</SelectItem>
                        {segments.map(segment => (
                          segment ? <SelectItem key={segment} value={segment}>{segment}</SelectItem> : null
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Industrie</label>
                    <Select value={industryFilter} onValueChange={setIndustryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toate industriile" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate industriile</SelectItem>
                        {industries.map(industry => (
                          industry ? <SelectItem key={industry} value={industry}>{industry}</SelectItem> : null
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={resetFilters}
                  >
                    Resetează filtre
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="border rounded-md">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
                <TabsList>
                  <TabsTrigger value="grid" className="px-2 py-1" aria-label="Vizualizare grid">
                    <LayoutGrid className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list" className="px-2 py-1" aria-label="Vizualizare listă">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
        
        {/* Filter Pills - display active filters */}
        {(typeFilter !== 'all' || segmentFilter !== 'all' || industryFilter !== 'all') && (
          <div className="flex flex-wrap gap-2 pb-2">
            {typeFilter !== 'all' && (
              <div className="bg-primary/10 text-primary text-xs py-1 px-2.5 rounded-full flex items-center">
                Tip: {typeFilter === 'customer' ? 'Client' : 
                     typeFilter === 'lead' ? 'Lead' : 
                     typeFilter === 'prospect' ? 'Prospect' : 'Partener'}
                <button 
                  className="ml-1.5 text-primary/80 hover:text-primary" 
                  onClick={() => setTypeFilter('all')}
                >
                  ✕
                </button>
              </div>
            )}
            
            {segmentFilter !== 'all' && (
              <div className="bg-primary/10 text-primary text-xs py-1 px-2.5 rounded-full flex items-center">
                Segment: {segmentFilter}
                <button 
                  className="ml-1.5 text-primary/80 hover:text-primary" 
                  onClick={() => setSegmentFilter('all')}
                >
                  ✕
                </button>
              </div>
            )}
            
            {industryFilter !== 'all' && (
              <div className="bg-primary/10 text-primary text-xs py-1 px-2.5 rounded-full flex items-center">
                Industrie: {industryFilter}
                <button 
                  className="ml-1.5 text-primary/80 hover:text-primary" 
                  onClick={() => setIndustryFilter('all')}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Results Count */}
        <div className="text-sm text-gray-500">
          {isLoading 
            ? 'Se încarcă companiile...' 
            : `${filteredCustomers.length} ${filteredCustomers.length === 1 ? 'companie' : 'companii'} găsite`
          }
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-lg">Se încarcă companiile...</p>
          </div>
        )}
        
        {/* Error state */}
        {isError && (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="text-red-500 text-lg mb-4">
              A apărut o eroare la încărcarea companiilor
            </div>
            <p className="text-gray-600">
              {error instanceof Error ? error.message : 'Eroare necunoscută'}
            </p>
            <Button 
              className="mt-4" 
              onClick={() => invalidateCompaniesCache()}
            >
              Încearcă din nou
            </Button>
          </div>
        )}
        
        {/* Customers Grid/List - shown when not loading or error */}
        {!isLoading && !isError && viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((company) => (
              <CustomerCard key={company.id} customer={company} />
            ))}
            
            {filteredCustomers.length === 0 && (
              <div className="col-span-full py-10 text-center">
                <Building2 className="h-10 w-10 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">Nicio companie găsită</h3>
                <p className="mt-1 text-gray-500">Ajustează filtrele sau adaugă o companie nouă.</p>
              </div>
            )}
          </div>
        ) : !isLoading && !isError ? (
          <div className="border rounded-md divide-y">
            {filteredCustomers.map((company) => (
              <div key={company.id} className="flex items-center p-4 hover:bg-gray-50">
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="text-base font-medium">{company.name}</h3>
                  <div className="flex flex-wrap gap-x-4 text-sm text-gray-500 mt-1">
                    {company.industry && <span>{company.industry}</span>}
                    {company.city && <span>{company.city}</span>}
                    {company.cui && <span>CUI: {company.cui}</span>}
                    {!company.cui && company.fiscalCode && <span>CUI: {company.fiscalCode}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {company.phone && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`tel:${company.phone}`}>
                        <Phone className="h-3.5 w-3.5 mr-1" />
                        Sună
                      </a>
                    </Button>
                  )}
                  {company.email && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`mailto:${company.email}`}>
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        Email
                      </a>
                    </Button>
                  )}
                  <Button size="sm" asChild>
                    <a href={`/crm/customers/${company.id}`}>
                      Detalii
                    </a>
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredCustomers.length === 0 && (
              <div className="py-10 text-center">
                <Building2 className="h-10 w-10 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">Nicio companie găsită</h3>
                <p className="mt-1 text-gray-500">Ajustează filtrele sau adaugă o companie nouă.</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </CRMModuleLayout>
  );
};

export default CustomersPage;