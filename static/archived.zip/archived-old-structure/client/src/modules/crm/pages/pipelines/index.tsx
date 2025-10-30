/**
 * CRM Pipelines Page
 * 
 * Manage sales pipelines and their stages to customize your sales process.
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
import { 
  BarChart3, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Edit, 
  GripVertical, 
  MoreHorizontal, 
  Plus, 
  Settings, 
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Sample pipelines data
const pipelines = [
  {
    id: '1',
    name: 'Pipeline Principal',
    description: 'Pipeline standard pentru majoritatea oportunităților de vânzări',
    isDefault: true,
    targetCycleTime: 30, // days
    targetConversionRate: 25, // percent
    stages: [
      { id: 's1', name: 'Calificare', color: '#99D126', probability: 10, order: 1 },
      { id: 's2', name: 'Demonstrație', color: '#88C506', probability: 25, order: 2 },
      { id: 's3', name: 'Propunere', color: '#F7AE2B', probability: 50, order: 3 },
      { id: 's4', name: 'Negociere', color: '#F69008', probability: 75, order: 4 },
      { id: 's5', name: 'Câștigat', color: '#0CA437', probability: 100, order: 5 },
      { id: 's6', name: 'Pierdut', color: '#D80F17', probability: 0, order: 6 }
    ]
  },
  {
    id: '2',
    name: 'Pipeline Enterprise',
    description: 'Pipeline complex pentru oportunități Enterprise cu ciclu de vânzare lung',
    isDefault: false,
    targetCycleTime: 90, // days
    targetConversionRate: 15, // percent
    stages: [
      { id: 's7', name: 'Inițial', color: '#99D126', probability: 5, order: 1 },
      { id: 's8', name: 'Analiză Necesități', color: '#88C506', probability: 15, order: 2 },
      { id: 's9', name: 'Workshop Tehnic', color: '#F7AE2B', probability: 30, order: 3 },
      { id: 's10', name: 'Propunere', color: '#F69008', probability: 45, order: 4 },
      { id: 's11', name: 'Revizuire Legală', color: '#C80002', probability: 60, order: 5 },
      { id: 's12', name: 'Negociere', color: '#F69008', probability: 80, order: 6 },
      { id: 's13', name: 'Câștigat', color: '#0CA437', probability: 100, order: 7 },
      { id: 's14', name: 'Pierdut', color: '#D80F17', probability: 0, order: 8 }
    ]
  },
  {
    id: '3',
    name: 'Pipeline Parteneriate',
    description: 'Pipeline pentru dezvoltarea relațiilor cu partenerii strategici',
    isDefault: false,
    targetCycleTime: 120, // days
    targetConversionRate: 35, // percent
    stages: [
      { id: 's15', name: 'Inițiere Contact', color: '#99D126', probability: 10, order: 1 },
      { id: 's16', name: 'Evaluare Compatibilitate', color: '#88C506', probability: 30, order: 2 },
      { id: 's17', name: 'Definire Parteneriat', color: '#F7AE2B', probability: 50, order: 3 },
      { id: 's18', name: 'Negociere Contract', color: '#F69008', probability: 70, order: 4 },
      { id: 's19', name: 'Parteneriat Activ', color: '#0CA437', probability: 100, order: 5 },
      { id: 's20', name: 'Parteneriat Încheiat', color: '#D80F17', probability: 0, order: 6 }
    ]
  }
];

// Sample pipeline stats
const pipelineStats = [
  {
    pipelineId: '1',
    activeDeals: 24,
    totalValue: 2150000,
    avgCycleTime: 28,
    conversionRate: 22
  },
  {
    pipelineId: '2',
    activeDeals: 8,
    totalValue: 3750000,
    avgCycleTime: 95,
    conversionRate: 12
  },
  {
    pipelineId: '3',
    activeDeals: 5,
    totalValue: 1200000,
    avgCycleTime: 110,
    conversionRate: 40
  }
];

const PipelinesPage: React.FC = () => {
  const { toast } = useToast();
  const [activePipeline, setActivePipeline] = useState(pipelines[0]);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Handle pipeline actions
  const handlePipelineAction = (action: string, pipelineId: string) => {
    toast({
      title: `Acțiune: ${action}`,
      description: `Pentru pipeline-ul cu ID: ${pipelineId}`,
    });
  };
  
  // Handle stage actions
  const handleStageAction = (action: string, stageId: string) => {
    toast({
      title: `Acțiune: ${action}`,
      description: `Pentru etapa cu ID: ${stageId}`,
    });
  };
  
  // Get pipeline stats
  const getPipelineStats = (pipelineId: string) => {
    return pipelineStats.find(stats => stats.pipelineId === pipelineId) || {
      activeDeals: 0,
      totalValue: 0,
      avgCycleTime: 0,
      conversionRate: 0
    };
  };
  
  // Handle new pipeline dialog
  const handleAddPipeline = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Pipeline creat",
      description: "Noul pipeline a fost creat cu succes.",
    });
  };
  
  return (
    <CRMModuleLayout activeTab="pipelines">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Pipeline-uri de Vânzări</h1>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Adaugă Pipeline
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Crează un nou pipeline</DialogTitle>
                <DialogDescription>
                  Definește un nou proces de vânzări cu etapele specifice pentru tipul tău de afacere.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddPipeline}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nume pipeline</Label>
                    <Input id="name" placeholder="Ex: Pipeline Standard" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descriere</Label>
                    <Input id="description" placeholder="Descriere scurtă a acestui pipeline" />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="is-default" />
                    <Label htmlFor="is-default">Setează ca pipeline implicit</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Salvează pipeline</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pipelines.map(pipeline => {
            const stats = getPipelineStats(pipeline.id);
            
            return (
              <Card 
                key={pipeline.id} 
                className={`h-full shadow-sm ${pipeline.id === activePipeline.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{pipeline.name}</CardTitle>
                      <CardDescription>{pipeline.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Meniu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePipelineAction('edit', pipeline.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editează pipeline
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePipelineAction('duplicate', pipeline.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Duplică
                        </DropdownMenuItem>
                        {!pipeline.isDefault && (
                          <DropdownMenuItem onClick={() => handlePipelineAction('makeDefault', pipeline.id)}>
                            <Check className="h-4 w-4 mr-2" />
                            Setează implicit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handlePipelineAction('delete', pipeline.id)}
                          className="text-red-600"
                          disabled={pipeline.isDefault}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Șterge pipeline
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pipeline.isDefault && (
                      <Badge className="bg-green-100 text-green-800">Implicit</Badge>
                    )}
                    <Badge variant="outline">
                      {pipeline.stages.length} etape
                    </Badge>
                    <Badge variant="outline">
                      {stats.activeDeals} oportunități active
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Valoare totală</p>
                      <p className="text-lg font-medium">{formatCurrency(stats.totalValue)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Rată conversie</p>
                      <p className="text-lg font-medium">
                        {stats.conversionRate}%
                        <span className="text-sm text-gray-500 ml-1">
                          ({pipeline.targetConversionRate}% țintă)
                        </span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Timp mediu ciclu</p>
                      <p className="text-lg font-medium">
                        {stats.avgCycleTime} zile
                        <span className="text-sm text-gray-500 ml-1">
                          ({pipeline.targetCycleTime} țintă)
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setActivePipeline(pipeline)}
                      className={pipeline.id === activePipeline.id ? 'bg-primary/10' : ''}
                    >
                      {pipeline.id === activePipeline.id ? 'Selectat' : 'Selectează'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handlePipelineAction('view', pipeline.id)}
                    >
                      Vezi oportunități
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-8">
          <Tabs defaultValue="stages" className="w-full">
            <TabsList>
              <TabsTrigger value="stages">Etape Pipeline</TabsTrigger>
              <TabsTrigger value="settings">Setări Pipeline</TabsTrigger>
            </TabsList>
            <TabsContent value="stages" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Etape: {activePipeline.name}</CardTitle>
                  <CardDescription>
                    Configurează etapele pipeline-ului și ordinea lor. Trage etapele pentru a le reordona.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activePipeline.stages.map(stage => (
                      <div 
                        key={stage.id} 
                        className="flex items-center gap-2 rounded-md border p-3"
                      >
                        <div className="flex-none">
                          <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                        </div>
                        
                        <div 
                          className="flex-none w-4 h-12 rounded-sm" 
                          style={{ backgroundColor: stage.color }}
                        />
                        
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{stage.name}</div>
                          <div className="text-sm text-gray-500">
                            Probabilitate: {stage.probability}%
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronUp className="h-4 w-4" />
                            <span className="sr-only">Mută sus</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronDown className="h-4 w-4" />
                            <span className="sr-only">Mută jos</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Meniu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStageAction('edit', stage.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editează etapă
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleStageAction('delete', stage.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Șterge etapă
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handlePipelineAction('addStage', activePipeline.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adaugă etapă nouă
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Setări: {activePipeline.name}</CardTitle>
                  <CardDescription>
                    Configurează parametrii pipeline-ului și obiectivele de performanță.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="target-conversion">Rată de conversie țintă (%)</Label>
                        <Input 
                          id="target-conversion" 
                          type="number" 
                          defaultValue={activePipeline.targetConversionRate} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="target-cycle">Durată ciclu țintă (zile)</Label>
                        <Input 
                          id="target-cycle" 
                          type="number" 
                          defaultValue={activePipeline.targetCycleTime} 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-assign">Atribuire automată</Label>
                        <Switch id="auto-assign" />
                      </div>
                      <p className="text-sm text-gray-500">
                        Atribuie automat noi oportunități către vânzători bazat pe regulile de repartizare.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-advance">Avansare automată</Label>
                        <Switch id="auto-advance" />
                      </div>
                      <p className="text-sm text-gray-500">
                        Avansează automat oportunități în etapele următoare bazat pe reguli de automatizare.
                      </p>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button>Salvează setări</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </CRMModuleLayout>
  );
};

export default PipelinesPage;