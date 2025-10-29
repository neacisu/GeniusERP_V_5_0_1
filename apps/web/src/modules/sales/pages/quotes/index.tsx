/**
 * Sales Quotes Page
 * 
 * Main view for managing sales quotes/offers with filtering,
 * sorting, and management capabilities using reusable components.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, Plus } from 'lucide-react';

// Import reusable components
import SalesModuleLayout from '../../components/common/SalesModuleLayout';
import QuotesTable from '../../components/tables/QuotesTable';
import FilterBar from '../../components/forms/FilterBar';
import PaginationControls from '../../components/common/PaginationControls';
import EmptyState from '../../components/common/EmptyState';
import ExportDataModal from '../../components/modals/ExportDataModal';

// Import utilities and hooks
import { useSalesApi } from '../../hooks/useSalesApi';
import { QuoteStatus, QuoteQueryOptions } from '../../types';

const QuotesPage: React.FC = () => {
  // State for filters and pagination
  const [activeView, setActiveView] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('issueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({
    status: ''
  });
  
  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  const pageSize = 10;
  const { getQuotes } = useSalesApi();
  
  // Build query options based on filters
  const getQueryOptions = (): QuoteQueryOptions => {
    const options: QuoteQueryOptions = {
      page: currentPage,
      limit: pageSize,
      sortBy,
      sortOrder
    };
    
    if (searchTerm) {
      options.search = searchTerm;
    }
    
    if (selectedFilters['status']) {
      options.status = selectedFilters['status'] as QuoteStatus;
    }
    
    // Handle different views
    switch (activeView) {
      case 'draft':
        options.status = QuoteStatus.DRAFT;
        break;
      case 'sent':
        options.status = [QuoteStatus.SENT, QuoteStatus.VIEWED];
        break;
      case 'accepted':
        options.status = QuoteStatus.ACCEPTED;
        break;
      case 'rejected':
        options.status = [QuoteStatus.REJECTED, QuoteStatus.EXPIRED];
        break;
      // 'all' view doesn't need any filter
    }
    
    return options;
  };
  
  // Query for quotes
  const { data: quotes, isLoading } = useQuery({
    queryKey: ['/api/sales/quotes', activeView, currentPage, searchTerm, sortBy, sortOrder, selectedFilters],
    queryFn: async () => {
      const queryOptions = getQueryOptions();
      const response = await getQuotes(queryOptions);
      return response;
    }
  });
  
  // Handle sort column click
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedFilters({
      status: ''
    });
    setSearchTerm('');
  };
  
  // Handle export
  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf', includeAll: boolean) => {
    try {
      setIsExporting(true);
      console.log(`Exporting quotes as ${format}, includeAll: ${includeAll}`);
      // In a real implementation, this would call the export API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setIsExporting(false);
      setExportModalOpen(false);
    } catch (error) {
      setIsExporting(false);
      console.error('Error exporting quotes:', error);
    }
  };
  
  // Calculate total pages
  const totalPages = quotes && 'totalPages' in quotes ? quotes.totalPages : 1;
  
  // Define filter options
  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: QuoteStatus.DRAFT, label: 'Schiță' },
        { value: QuoteStatus.SENT, label: 'Trimisă' },
        { value: QuoteStatus.VIEWED, label: 'Vizualizată' },
        { value: QuoteStatus.ACCEPTED, label: 'Acceptată' },
        { value: QuoteStatus.REJECTED, label: 'Respinsă' },
        { value: QuoteStatus.EXPIRED, label: 'Expirată' }
      ]
    }
  ];
  
  // Define empty state content
  const emptyStateContent = (
    <EmptyState
      icon={<FileSpreadsheet className="h-10 w-10" />}
      title="Nicio ofertă găsită"
      description={
        searchTerm || selectedFilters['status']
          ? 'Încearcă să ajustezi filtrele de căutare'
          : 'Adaugă prima ofertă pentru a începe să faci propuneri clienților'
      }
      actionLabel="Ofertă Nouă"
      actionHref="/sales/quotes/new"
      actionIcon={<Plus className="mr-2 h-4 w-4" />}
      filterActive={!!(searchTerm || selectedFilters['status'])}
    />
  );
  
  return (
    <SalesModuleLayout 
      title="Oferte" 
      description="Gestionează ofertele și propunerile către clienți"
    >
      <div className="space-y-4">
        {/* Tabs for different views */}
        <Tabs defaultValue="all" value={activeView} onValueChange={setActiveView}>
          <TabsList>
            <TabsTrigger value="all">Toate</TabsTrigger>
            <TabsTrigger value="draft">Schițe</TabsTrigger>
            <TabsTrigger value="sent">Trimise</TabsTrigger>
            <TabsTrigger value="accepted">Acceptate</TabsTrigger>
            <TabsTrigger value="rejected">Respinse/Expirate</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Filters and Actions Row */}
        <FilterBar
          searchPlaceholder="Caută oferte..."
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filterOptions}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onResetFilters={resetFilters}
          actionButton={{
            label: "Ofertă Nouă",
            icon: <Plus className="mr-2 h-4 w-4" />,
            href: "/sales/quotes/new"
          }}
          exportButton={true}
          onExport={() => setExportModalOpen(true)}
        />
        
        {/* Quotes Table */}
        <QuotesTable
          quotes={quotes}
          isLoading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyState={emptyStateContent}
        />
        
        {/* Pagination */}
        {!isLoading && quotes && 'totalPages' in quotes && quotes.totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-4"
          />
        )}
        
        {/* Export Modal */}
        <ExportDataModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          onExport={handleExport}
          title="Exportă Oferte"
          description="Exportă lista de oferte în formatul dorit."
          supportedFormats={['csv', 'xlsx', 'pdf']}
          isExporting={isExporting}
          entityType="oferte"
        />
      </div>
    </SalesModuleLayout>
  );
};

export default QuotesPage;