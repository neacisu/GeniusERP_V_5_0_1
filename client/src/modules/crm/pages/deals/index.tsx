/**
 * CRM Deals Page
 * 
 * Displays deals/opportunities in a pipeline view with kanban board functionality.
 */

import React, { useState } from 'react';
import { CRMModuleLayout } from '../../components/common/CRMModuleLayout';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  Building2, 
  Calendar, 
  ChevronsUpDown, 
  Filter, 
  GripVertical, 
  MoreVertical, 
  Plus, 
  Search,
  PlusCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Sample pipeline data
const pipelines = [
  {
    id: '1',
    name: 'Pipeline Principal',
    isDefault: true,
    stages: [
      { id: 's1', name: 'Calificare', color: '#99D126', order: 1 },
      { id: 's2', name: 'Demonstrație', color: '#88C506', order: 2 },
      { id: 's3', name: 'Propunere', color: '#F7AE2B', order: 3 },
      { id: 's4', name: 'Negociere', color: '#F69008', order: 4 },
      { id: 's5', name: 'Câștigat', color: '#0CA437', order: 5 },
      { id: 's6', name: 'Pierdut', color: '#D80F17', order: 6 }
    ]
  },
  {
    id: '2',
    name: 'Pipeline Enterprise',
    isDefault: false,
    stages: [
      { id: 's7', name: 'Inițial', color: '#99D126', order: 1 },
      { id: 's8', name: 'Analiză Necesități', color: '#88C506', order: 2 },
      { id: 's9', name: 'Workshop Tehnic', color: '#F7AE2B', order: 3 },
      { id: 's10', name: 'Propunere', color: '#F69008', order: 4 },
      { id: 's11', name: 'Revizuire Legală', color: '#C80002', order: 5 },
      { id: 's12', name: 'Negociere', color: '#F69008', order: 6 },
      { id: 's13', name: 'Câștigat', color: '#0CA437', order: 7 },
      { id: 's14', name: 'Pierdut', color: '#D80F17', order: 8 }
    ]
  }
];

// Sample deals data
const deals = [
  {
    id: '1',
    title: 'Licențe ERP Enterprise',
    customerId: '1',
    customerName: 'Acme SRL',
    pipelineId: '1',
    stageId: 's4',
    amount: 250000,
    currency: 'RON',
    probability: 75,
    expectedCloseDate: '2025-05-15',
    createdAt: '2025-03-20',
    ownerId: 'u1',
    ownerName: 'Alexandru Popa'
  },
  {
    id: '2',
    title: 'Servicii Implementare',
    customerId: '1',
    customerName: 'Acme SRL',
    pipelineId: '1',
    stageId: 's3',
    amount: 120000,
    currency: 'RON',
    probability: 60,
    expectedCloseDate: '2025-06-01',
    createdAt: '2025-03-25',
    ownerId: 'u1',
    ownerName: 'Alexandru Popa'
  },
  {
    id: '3',
    title: 'Mentenanță Anuală',
    customerId: '1',
    customerName: 'Acme SRL',
    pipelineId: '1',
    stageId: 's5',
    amount: 75000,
    currency: 'RON',
    probability: 100,
    expectedCloseDate: '2025-04-05',
    createdAt: '2025-02-15',
    actualCloseDate: '2025-04-01',
    ownerId: 'u2',
    ownerName: 'Maria Dinu'
  },
  {
    id: '4',
    title: 'Licențe Software Dezvoltare',
    customerId: '2',
    customerName: 'TechSoft Solutions',
    pipelineId: '1',
    stageId: 's2',
    amount: 85000,
    currency: 'RON',
    probability: 50,
    expectedCloseDate: '2025-05-30',
    createdAt: '2025-03-15',
    ownerId: 'u3',
    ownerName: 'Andrei Vasilescu'
  },
  {
    id: '5',
    title: 'Servicii de Consultanță',
    customerId: '2',
    customerName: 'TechSoft Solutions',
    pipelineId: '1',
    stageId: 's1',
    amount: 45000,
    currency: 'RON',
    probability: 30,
    expectedCloseDate: '2025-06-15',
    createdAt: '2025-04-05',
    ownerId: 'u1',
    ownerName: 'Alexandru Popa'
  },
  {
    id: '6',
    title: 'Soluție Management Medical',
    customerId: '3',
    customerName: 'MediCare Plus',
    pipelineId: '1',
    stageId: 's3',
    amount: 320000,
    currency: 'RON',
    probability: 65,
    expectedCloseDate: '2025-07-10',
    createdAt: '2025-03-01',
    ownerId: 'u2',
    ownerName: 'Maria Dinu'
  },
  {
    id: '7',
    title: 'Proiect ERP Enterprise',
    customerId: '5',
    customerName: 'AgriTech International',
    pipelineId: '2',
    stageId: 's10',
    amount: 450000,
    currency: 'RON',
    probability: 70,
    expectedCloseDate: '2025-08-01',
    createdAt: '2025-02-10',
    ownerId: 'u1',
    ownerName: 'Alexandru Popa'
  },
  {
    id: '8',
    title: 'Implementare CRM Enterprise',
    customerId: '4',
    customerName: 'Construct Expert',
    pipelineId: '2',
    stageId: 's8',
    amount: 180000,
    currency: 'RON',
    probability: 40,
    expectedCloseDate: '2025-07-15',
    createdAt: '2025-03-05',
    ownerId: 'u3',
    ownerName: 'Andrei Vasilescu'
  }
];

const DealsPage: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPipeline, setSelectedPipeline] = useState(pipelines[0].id);
  const [customerFilter, setCustomerFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  
  const activePipeline = pipelines.find(p => p.id === selectedPipeline) || pipelines[0];
  
  // Get unique customers for filter dropdown
  const customers = [...new Set(deals.map(deal => deal.customerName))];
  
  // Get unique owners for filter dropdown
  const owners = [...new Set(deals.map(deal => deal.ownerName))];
  
  // Filter deals based on search, pipeline and filters
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deal.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPipeline = deal.pipelineId === selectedPipeline;
    const matchesCustomer = customerFilter === 'all' || deal.customerName === customerFilter;
    const matchesOwner = ownerFilter === 'all' || deal.ownerName === ownerFilter;
    
    return matchesSearch && matchesPipeline && matchesCustomer && matchesOwner;
  });
  
  // Group deals by stage
  const dealsByStage = activePipeline.stages.reduce<Record<string, typeof deals>>((acc, stage) => {
    acc[stage.id] = filteredDeals.filter(deal => deal.stageId === stage.id);
    return acc;
  }, {});
  
  // Calculate totals for the pipeline
  const pipelineTotal = filteredDeals.reduce((sum, deal) => sum + deal.amount, 0);
  const dealCount = filteredDeals.length;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  const handleAddDeal = () => {
    toast({
      title: "Adaugă oportunitate",
      description: "Funcționalitate în curând disponibilă.",
    });
  };
  
  const handleDealAction = (action: string, dealId: string) => {
    toast({
      title: `Acțiune: ${action}`,
      description: `Pentru oportunitatea cu ID: ${dealId}`,
    });
  };
  
  const handleStageDrop = (dealId: string, targetStageId: string) => {
    toast({
      title: "Oportunitate mutată",
      description: `Oportunitatea a fost mutată în etapa: ${activePipeline.stages.find(s => s.id === targetStageId)?.name}`,
    });
  };
  
  return (
    <CRMModuleLayout activeTab="deals">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Oportunități</h1>
          </div>
          
          <Button onClick={handleAddDeal} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Adaugă Oportunitate
          </Button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Filters and Search Panel */}
          <div className="w-full lg:w-3/4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Caută după nume sau companie..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Alege pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map(pipeline => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-1">
                    <Filter className="h-4 w-4 mr-1" />
                    Filtre
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[220px]">
                  <DropdownMenuLabel>Filtrează după</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <div className="p-2">
                    <p className="text-sm font-medium mb-1">Companie</p>
                    <Select value={customerFilter} onValueChange={setCustomerFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Toate companiile" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate companiile</SelectItem>
                        {customers.map(customer => (
                          <SelectItem key={customer} value={customer}>{customer}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="p-2 pt-0">
                    <p className="text-sm font-medium mb-1">Proprietar</p>
                    <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Toți proprietarii" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toți proprietarii</SelectItem>
                        {owners.map(owner => (
                          <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setCustomerFilter('all'); setOwnerFilter('all'); }}>
                    Resetează toate filtrele
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Active Filters */}
            {(customerFilter !== 'all' || ownerFilter !== 'all') && (
              <div className="flex flex-wrap gap-2">
                {customerFilter !== 'all' && (
                  <div className="bg-primary/10 text-primary text-xs py-1 px-2.5 rounded-full flex items-center">
                    Companie: {customerFilter}
                    <button 
                      className="ml-1.5 text-primary/80 hover:text-primary" 
                      onClick={() => setCustomerFilter('all')}
                    >
                      ✕
                    </button>
                  </div>
                )}
                {ownerFilter !== 'all' && (
                  <div className="bg-primary/10 text-primary text-xs py-1 px-2.5 rounded-full flex items-center">
                    Proprietar: {ownerFilter}
                    <button 
                      className="ml-1.5 text-primary/80 hover:text-primary" 
                      onClick={() => setOwnerFilter('all')}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Pipeline Stats */}
          <Card className="w-full lg:w-1/4 shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total oportunități</p>
                  <p className="text-2xl font-bold">{dealCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Valoare totală</p>
                  <p className="text-2xl font-bold">{formatCurrency(pipelineTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Pipeline Kanban Board */}
        <div className="flex h-[calc(100vh-280px)] min-h-[500px] overflow-x-auto pb-4">
          {activePipeline.stages.map(stage => {
            const stageDeals = dealsByStage[stage.id] || [];
            const stageTotal = stageDeals.reduce((sum, deal) => sum + deal.amount, 0);
            
            return (
              <div 
                key={stage.id} 
                className="flex-shrink-0 w-[300px] mx-2 first:ml-0 last:mr-0"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const dealId = e.dataTransfer.getData('dealId');
                  handleStageDrop(dealId, stage.id);
                }}
              >
                <div 
                  className="rounded-t-md p-2 font-medium text-sm flex justify-between items-center"
                  style={{ backgroundColor: `${stage.color}20`, color: stage.color }}
                >
                  <span>{stage.name}</span>
                  <div className="flex items-center gap-1">
                    <span>{stageDeals.length}</span>
                    <ChevronsUpDown className="h-3.5 w-3.5" />
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-b-md h-full p-2 border border-t-0">
                  <div className="text-xs text-gray-500 mb-2 flex justify-between">
                    <span>Valoare: {formatCurrency(stageTotal)}</span>
                  </div>
                  
                  <ScrollArea className="h-[calc(100vh-340px)] min-h-[440px] rounded-md">
                    <div className="pr-4 space-y-3">
                      {stageDeals.map(deal => (
                        <Card 
                          key={deal.id}
                          className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('dealId', deal.id);
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-sm">{deal.title}</h3>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                    <span className="sr-only">Acțiuni</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleDealAction('edit', deal.id)}>
                                    Editează
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDealAction('win', deal.id)}>
                                    Marchează câștigat
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDealAction('lose', deal.id)}>
                                    Marchează pierdut
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDealAction('delete', deal.id)}
                                    className="text-red-600"
                                  >
                                    Șterge
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <Building2 className="h-3 w-3 mr-1" />
                              <span>{deal.customerName}</span>
                            </div>
                            
                            <div className="mt-3 flex justify-between items-baseline">
                              <span className="font-medium">{formatCurrency(deal.amount)}</span>
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                              >
                                {deal.probability}%
                              </Badge>
                            </div>
                            
                            <div className="mt-2 text-xs text-gray-500 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>Închidere: {formatDate(deal.expectedCloseDate)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-xs text-gray-500"
                        onClick={() => handleAddDeal()}
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        Adaugă oportunitate în {stage.name}
                      </Button>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CRMModuleLayout>
  );
};

export default DealsPage;