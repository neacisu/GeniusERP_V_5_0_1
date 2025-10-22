/**
 * Sales Opportunities Page
 * 
 * Main view for managing sales opportunities with filtering,
 * sorting, and management capabilities using reusable components.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Plus } from 'lucide-react';

// Import reusable components
import SalesModuleLayout from '../../components/common/SalesModuleLayout';
import OpportunitiesTable from '../../components/tables/OpportunitiesTable';
import FilterBar from '../../components/forms/FilterBar';
import PaginationControls from '../../components/common/PaginationControls';
import EmptyState from '../../components/common/EmptyState';
import ExportDataModal from '../../components/modals/ExportDataModal';

// Import utilities and hooks
import { useSalesApi } from '../../hooks/useSalesApi';
import { OpportunityStage, DealPriority, OpportunityQueryOptions } from '../../types';

const OpportunitiesPage: React.FC = () => {
  // State for filters and pagination
  const [activeView, setActiveView] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({
    stage: '',
    priority: ''
  });
  
  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  const pageSize = 10;
  const { getOpportunities } = useSalesApi();
  
  // Build query options based on filters
  const getQueryOptions = (): OpportunityQueryOptions => {
    const options: OpportunityQueryOptions = {
      page: currentPage,
      limit: pageSize,
      sortBy,
      sortOrder
    };
    
    if (searchTerm) {
      options.search = searchTerm;
    }
    
    if (selectedFilters.stage) {
      options.stage = selectedFilters.stage as OpportunityStage;
    }
    
    if (selectedFilters.priority) {
      options.priority = selectedFilters.priority as DealPriority;
    }
    
    // Handle different views
    switch (activeView) {
      case 'active':
        options.stage = [
          OpportunityStage.PROSPECTING,
          OpportunityStage.QUALIFICATION,
          OpportunityStage.NEEDS_ANALYSIS,
          OpportunityStage.VALUE_PROPOSITION,
          OpportunityStage.DECISION_MAKERS,
          OpportunityStage.PROPOSAL,
          OpportunityStage.NEGOTIATION
        ];
        break;
      case 'won':
        options.stage = OpportunityStage.CLOSED_WON;
        break;
      case 'lost':
        options.stage = OpportunityStage.CLOSED_LOST;
        break;
      // 'all' view doesn't need any filter
    }
    
    return options;
  };
  
  // Query for opportunities
  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['/api/sales/opportunities', activeView, currentPage, searchTerm, sortBy, sortOrder, selectedFilters],
    queryFn: async () => {
      const queryOptions = getQueryOptions();
      const response = await getOpportunities(queryOptions);
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
      stage: '',
      priority: ''
    });
    setSearchTerm('');
  };
  
  // Handle export
  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf', includeAll: boolean) => {
    try {
      setIsExporting(true);
      console.log(`Exporting opportunities as ${format}, includeAll: ${includeAll}`);
      // In a real implementation, this would call the export API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setIsExporting(false);
      setExportModalOpen(false);
    } catch (error) {
      setIsExporting(false);
      console.error('Error exporting opportunities:', error);
    }
  };
  
  // Calculate total pages
  const totalPages = opportunities && 'totalPages' in opportunities ? opportunities.totalPages : 1;
  
  // Define filter options
  const filterOptions = [
    {
      key: 'stage',
      label: 'Stadiu',
      options: [
        { value: OpportunityStage.PROSPECTING, label: 'Prospectare' },
        { value: OpportunityStage.QUALIFICATION, label: 'Calificare' },
        { value: OpportunityStage.NEEDS_ANALYSIS, label: 'Analiză Nevoi' },
        { value: OpportunityStage.VALUE_PROPOSITION, label: 'Propunere Valoare' },
        { value: OpportunityStage.DECISION_MAKERS, label: 'Factori Decizie' },
        { value: OpportunityStage.PROPOSAL, label: 'Propunere' },
        { value: OpportunityStage.NEGOTIATION, label: 'Negociere' },
        { value: OpportunityStage.CLOSED_WON, label: 'Câștigat' },
        { value: OpportunityStage.CLOSED_LOST, label: 'Pierdut' }
      ]
    },
    {
      key: 'priority',
      label: 'Prioritate',
      options: [
        { value: DealPriority.LOW, label: 'Scăzută' },
        { value: DealPriority.MEDIUM, label: 'Medie' },
        { value: DealPriority.HIGH, label: 'Ridicată' },
        { value: DealPriority.URGENT, label: 'Urgentă' }
      ]
    }
  ];
  
  // Define empty state content
  const emptyStateContent = (
    <EmptyState
      icon={<TrendingUp className="h-10 w-10" />}
      title="Nicio oportunitate găsită"
      description={
        searchTerm || selectedFilters.stage || selectedFilters.priority
          ? 'Încearcă să ajustezi filtrele de căutare'
          : 'Adaugă prima oportunitate pentru a începe să-ți crești vânzările'
      }
      actionLabel="Oportunitate Nouă"
      actionHref="/sales/opportunities/new"
      actionIcon={<Plus className="mr-2 h-4 w-4" />}
      filterActive={!!(searchTerm || selectedFilters.stage || selectedFilters.priority)}
    />
  );
  
  return (
    <SalesModuleLayout 
      title="Oportunități" 
      description="Gestionează oportunități de vânzări și potențiali clienți"
    >
      <div className="space-y-4">
        {/* Tabs for different views */}
        <Tabs defaultValue="all" value={activeView} onValueChange={setActiveView}>
          <TabsList>
            <TabsTrigger value="all">Toate</TabsTrigger>
            <TabsTrigger value="active">În Progres</TabsTrigger>
            <TabsTrigger value="won">Câștigate</TabsTrigger>
            <TabsTrigger value="lost">Pierdute</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Filters and Actions Row */}
        <FilterBar
          searchPlaceholder="Caută oportunități..."
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filterOptions}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onResetFilters={resetFilters}
          actionButton={{
            label: "Oportunitate Nouă",
            icon: <Plus className="mr-2 h-4 w-4" />,
            href: "/sales/opportunities/new"
          }}
          exportButton={true}
          onExport={() => setExportModalOpen(true)}
        />
        
        {/* Opportunities Table */}
        <OpportunitiesTable
          opportunities={opportunities}
          isLoading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyState={emptyStateContent}
        />
        
        {/* Pagination */}
        {!isLoading && opportunities && 'totalPages' in opportunities && opportunities.totalPages > 1 && (
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
          title="Exportă Oportunități"
          description="Exportă lista de oportunități în formatul dorit."
          supportedFormats={['csv', 'xlsx', 'pdf']}
          isExporting={isExporting}
          entityType="oportunități"
        />
      </div>
    </SalesModuleLayout>
  );
};

export default OpportunitiesPage;