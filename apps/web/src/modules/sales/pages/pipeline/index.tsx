/**
 * Sales Pipeline Page
 * 
 * Visual kanban-style view of sales pipeline with drag-and-drop
 * management of opportunities through sales stages.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileCheck, Plus, TrendingUp, Users, Calendar, ArrowRight } from 'lucide-react';

// Import reusable components
import SalesModuleLayout from '../../components/common/SalesModuleLayout';
import FilterBar from '../../components/forms/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import ExportDataModal from '../../components/modals/ExportDataModal';

// Import UI components
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

// Import utilities and hooks
import { useSalesApi } from '../../hooks/useSalesApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { OpportunityStage, DealPriority } from '../../types';

const PipelinePage: React.FC = () => {
  // State for filters and view
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeView, setActiveView] = useState<string>('pipeline');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({
    priority: ''
  });
  
  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  const { getPipeline } = useSalesApi();
  
  // Query for pipeline data
  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['/api/sales/pipeline', searchTerm, selectedFilters],
    queryFn: async () => {
      const response = await getPipeline();
      return response;
    }
  });
  
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
      priority: ''
    });
    setSearchTerm('');
  };
  
  // Handle export
  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf', includeAll: boolean) => {
    try {
      setIsExporting(true);
      console.log(`Exporting pipeline as ${format}, includeAll: ${includeAll}`);
      // In a real implementation, this would call the export API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setIsExporting(false);
      setExportModalOpen(false);
    } catch (error) {
      setIsExporting(false);
      console.error('Error exporting pipeline:', error);
    }
  };
  
  // Define filter options
  const filterOptions = [
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
  
  // Get opportunity value color by priority
  const getOpportunityPriorityColor = (priority: DealPriority): string => {
    switch (priority) {
      case DealPriority.LOW:
        return 'bg-gray-100 text-gray-800';
      case DealPriority.MEDIUM:
        return 'bg-blue-100 text-blue-800';
      case DealPriority.HIGH:
        return 'bg-amber-100 text-amber-800';
      case DealPriority.URGENT:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get customer initials for avatar
  const getCustomerInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Define empty state content
  const emptyStateContent = (
    <EmptyState
      icon={<FileCheck className="h-10 w-10" />}
      title="Nicio oportunitate în pipeline"
      description={
        searchTerm || selectedFilters['priority']
          ? 'Încearcă să ajustezi filtrele de căutare'
          : 'Adaugă o nouă oportunitate pentru a începe să urmărești procesul de vânzare'
      }
      actionLabel="Oportunitate Nouă"
      actionHref="/sales/opportunities/new"
      actionIcon={<Plus className="mr-2 h-4 w-4" />}
      filterActive={!!(searchTerm || selectedFilters['priority'])}
    />
  );
  
  // Define the pipeline stages
  const pipelineStages = [
    { id: OpportunityStage.PROSPECTING, label: 'Prospectare' },
    { id: OpportunityStage.QUALIFICATION, label: 'Calificare' },
    { id: OpportunityStage.NEEDS_ANALYSIS, label: 'Analiză Nevoi' },
    { id: OpportunityStage.VALUE_PROPOSITION, label: 'Propunere Valoare' },
    { id: OpportunityStage.DECISION_MAKERS, label: 'Factori Decizie' },
    { id: OpportunityStage.PROPOSAL, label: 'Propunere' },
    { id: OpportunityStage.NEGOTIATION, label: 'Negociere' },
    { id: OpportunityStage.CLOSED_WON, label: 'Câștigat' },
    { id: OpportunityStage.CLOSED_LOST, label: 'Pierdut' }
  ];
  
  // Get opportunities for a specific stage
  const getOpportunitiesForStage = (stage: OpportunityStage) => {
    if (!pipeline || !pipeline.stages || !pipeline.stages[stage]) {
      return [];
    }
    return pipeline.stages[stage];
  };
  
  // Render loading skeletons for a stage
  const renderStageSkeletons = () => {
    return Array.from({ length: 3 }).map((_, index) => (
      <Card key={`skeleton-${index}`} className="mb-3">
        <CardHeader className="p-3 pb-0">
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
        <CardFooter className="p-3 pt-0 flex justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </CardFooter>
      </Card>
    ));
  };
  
  // Render opportunity card
  const renderOpportunityCard = (opportunity: any) => (
    <Card key={opportunity.id} className="mb-3 cursor-move hover:shadow-md transition-shadow">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-medium">
          <a href={`/sales/opportunities/${opportunity.id}`} className="hover:text-primary hover:underline">
            {opportunity.title}
          </a>
        </CardTitle>
        <CardDescription className="text-xs flex items-center">
          <Users className="h-3 w-3 mr-1" /> {opportunity.customerName}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">
            {formatCurrency(opportunity.value, opportunity.currency)}
          </span>
          <Badge variant="outline" className={getOpportunityPriorityColor(opportunity.priority)}>
            {opportunity.priority}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground flex items-center">
          <Calendar className="h-3 w-3 mr-1" /> {formatDate(opportunity.expectedCloseDate)}
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        <div className="flex items-center">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {getCustomerInitials(opportunity.ownerName || 'User')}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs ml-1">{opportunity.ownerName}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
  
  return (
    <SalesModuleLayout 
      title="Pipeline Vânzări" 
      description="Vizualizează și gestionează pipeline-ul de vânzări"
    >
      <div className="space-y-4">
        {/* View Tabs */}
        <Tabs defaultValue="pipeline" value={activeView} onValueChange={setActiveView}>
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="funnel">Pâlnie</TabsTrigger>
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
        
        {activeView === 'pipeline' ? (
          /* Pipeline Kanban Board View */
          <div className="mt-6">
            {pipeline && pipeline.stats && pipeline.stats.totalOpportunities === 0 ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                {emptyStateContent}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
                {pipelineStages.map(stage => (
                  <div key={stage.id} className="min-w-[250px]">
                    <div className="bg-muted rounded-t-md p-2 font-medium flex justify-between items-center">
                      <span>{stage.label}</span>
                      {pipeline && pipeline.stats && pipeline.stats.stageCount && (
                        <Badge variant="outline">
                          {pipeline.stats.stageCount[stage.id] || 0}
                        </Badge>
                      )}
                    </div>
                    <div className="bg-background border border-t-0 rounded-b-md p-2 min-h-[300px] max-h-[70vh] overflow-y-auto">
                      {isLoading ? (
                        renderStageSkeletons()
                      ) : (
                        getOpportunitiesForStage(stage.id).map(renderOpportunityCard)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Funnel View */
          <div className="mt-6 flex items-center justify-center min-h-[60vh] border rounded-md p-6">
            <div className="text-center">
              <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mt-4">Vizualizare Pâlnie</h3>
              <p className="text-muted-foreground max-w-md mx-auto mt-2">
                Această vizualizare va prezenta un grafic de tip pâlnie care arată progresul oportunitățiilor prin etapele de vânzare.
              </p>
            </div>
          </div>
        )}
        
        {/* Export Modal */}
        <ExportDataModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          onExport={handleExport}
          title="Exportă Pipeline"
          description="Exportă datele pipeline-ului în formatul dorit."
          supportedFormats={['csv', 'xlsx', 'pdf']}
          isExporting={isExporting}
          entityType="pipeline"
        />
      </div>
    </SalesModuleLayout>
  );
};

export default PipelinePage;