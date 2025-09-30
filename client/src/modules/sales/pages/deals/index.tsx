/**
 * Sales Deals Page
 * 
 * Main view for managing deals/contracts with filtering,
 * sorting, and management capabilities using reusable components.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus } from 'lucide-react';

// Import reusable components
import SalesModuleLayout from '../../components/common/SalesModuleLayout';
import DealsTable from '../../components/tables/DealsTable';
import FilterBar from '../../components/forms/FilterBar';
import PaginationControls from '../../components/common/PaginationControls';
import EmptyState from '../../components/common/EmptyState';

// Import utilities and hooks
import { useSalesApi } from '../../hooks/useSalesApi';
import { DealStatus, DealPriority, DealQueryOptions } from '../../types';

const DealsPage: React.FC = () => {
  // State for filters and pagination
  const [activeView, setActiveView] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({
    status: '',
    priority: ''
  });
  
  const pageSize = 10;
  const { getDeals } = useSalesApi();
  
  // Build query options based on filters
  const getQueryOptions = (): DealQueryOptions => {
    const options: DealQueryOptions = {
      page: currentPage,
      limit: pageSize,
      sortBy,
      sortOrder
    };
    
    if (searchTerm) {
      options.search = searchTerm;
    }
    
    if (selectedFilters.status) {
      options.status = selectedFilters.status as DealStatus;
    }
    
    if (selectedFilters.priority) {
      options.priority = selectedFilters.priority as DealPriority;
    }
    
    // Handle different views
    switch (activeView) {
      case 'active':
        options.status = [
          DealStatus.NEW, 
          DealStatus.NEGOTIATION, 
          DealStatus.PROPOSAL
        ];
        break;
      case 'won':
        options.status = DealStatus.WON;
        break;
      case 'lost':
        options.status = DealStatus.LOST;
        break;
      // 'all' view doesn't need any filter
    }
    
    return options;
  };
  
  // Query for deals
  const { data: deals, isLoading } = useQuery({
    queryKey: ['/api/sales/deals', activeView, currentPage, searchTerm, sortBy, sortOrder, selectedFilters],
    queryFn: async () => {
      const queryOptions = getQueryOptions();
      const response = await getDeals(queryOptions);
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
      status: '',
      priority: ''
    });
    setSearchTerm('');
  };
  
  // Calculate total pages
  const totalPages = deals && 'totalPages' in deals ? deals.totalPages : 1;
  
  // Define filter options
  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: DealStatus.NEW, label: 'Nou' },
        { value: DealStatus.NEGOTIATION, label: 'Negociere' },
        { value: DealStatus.PROPOSAL, label: 'Propunere' },
        { value: DealStatus.WON, label: 'Câștigat' },
        { value: DealStatus.LOST, label: 'Pierdut' },
        { value: DealStatus.CANCELED, label: 'Anulat' }
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
      icon={<FileText className="h-10 w-10" />}
      title="Niciun contract găsit"
      description={
        searchTerm || selectedFilters.status || selectedFilters.priority
          ? 'Încearcă să ajustezi filtrele de căutare'
          : 'Adaugă primul contract pentru a începe să monitorizezi vânzările'
      }
      actionLabel="Contract Nou"
      actionHref="/sales/deals/new"
      actionIcon={<Plus className="mr-2 h-4 w-4" />}
      filterActive={!!(searchTerm || selectedFilters.status || selectedFilters.priority)}
    />
  );
  
  return (
    <SalesModuleLayout 
      title="Contracte" 
      description="Gestionează contractele și tranzacțiile active"
    >
      <div className="space-y-4">
        {/* Tabs for different views */}
        <Tabs defaultValue="all" value={activeView} onValueChange={setActiveView}>
          <TabsList>
            <TabsTrigger value="all">Toate</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="won">Câștigate</TabsTrigger>
            <TabsTrigger value="lost">Pierdute</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Filters and Actions Row */}
        <FilterBar
          searchPlaceholder="Caută contracte..."
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filterOptions}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onResetFilters={resetFilters}
          actionButton={{
            label: "Contract Nou",
            icon: <Plus className="mr-2 h-4 w-4" />,
            href: "/sales/deals/new"
          }}
          exportButton={true}
          onExport={() => console.log('Export deals')}
        />
        
        {/* Deals Table */}
        <DealsTable
          deals={deals}
          isLoading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyState={emptyStateContent}
        />
        
        {/* Pagination */}
        {!isLoading && deals && 'totalPages' in deals && deals.totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-4"
          />
        )}
      </div>
    </SalesModuleLayout>
  );
};

export default DealsPage;