/**
 * BPM Process Detail Page
 * 
 * Pagina pentru detalii și istoricul unui proces
 */

import React, { useState } from 'react';
import { BPMModuleLayout } from '../../components/common/BPMModuleLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  GitBranch,
  ArrowLeft,
  Clock,
  Play,
  Pencil,
  History,
  List,
  BarChart,
  Settings,
  Users,
  AlignJustify,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

export default function ProcessDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Process ID
  const processId = params?.id;
  
  // Mock process data
  const process = {
    id: processId,
    name: 'Invoice Processing',
    description: 'A process for reviewing and approving customer invoices before they are sent out. This includes validation against purchase orders, approval workflows, and payment terms verification.',
    type: 'standard',
    status: 'active',
    version: '1.2',
    owner: 'Admin User',
    createdAt: '2025-03-15T12:00:00Z',
    updatedAt: '2025-04-10T09:30:00Z',
    lastRun: '2025-04-11T08:45:00Z',
    successRate: 95,
    averageDuration: '1h 23m',
    runCount: 42,
    collaborators: [
      { id: '1', name: 'Maria Popescu', email: 'maria@example.com', role: 'editor' },
      { id: '2', name: 'Ion Ionescu', email: 'ion@example.com', role: 'viewer' },
    ],
  };
  
  // Mock execution history
  const executionHistory = [
    {
      id: '1',
      startTime: '2025-04-11T08:45:00Z',
      endTime: '2025-04-11T09:35:00Z',
      status: 'completed',
      duration: '50m',
      initiatedBy: 'System',
      businessKey: 'INV-2025-0047',
    },
    {
      id: '2',
      startTime: '2025-04-10T14:30:00Z',
      endTime: '2025-04-10T15:45:00Z',
      status: 'completed',
      duration: '1h 15m',
      initiatedBy: 'Maria Popescu',
      businessKey: 'INV-2025-0046',
    },
    {
      id: '3',
      startTime: '2025-04-09T11:20:00Z',
      endTime: '2025-04-09T13:05:00Z',
      status: 'completed',
      duration: '1h 45m',
      initiatedBy: 'Daily Trigger',
      businessKey: 'INV-2025-0045',
    },
    {
      id: '4',
      startTime: '2025-04-08T09:15:00Z',
      endTime: '2025-04-08T09:45:00Z',
      status: 'failed',
      duration: '30m',
      initiatedBy: 'System',
      businessKey: 'INV-2025-0044',
      error: 'Missing approval signature',
    },
    {
      id: '5',
      startTime: '2025-04-07T10:00:00Z',
      endTime: '2025-04-07T11:10:00Z',
      status: 'completed',
      duration: '1h 10m',
      initiatedBy: 'Ion Ionescu',
      businessKey: 'INV-2025-0043',
    },
  ];
  
  // Handler for editing process
  const handleEditProcess = () => {
    navigate(`/bpm/designer/${processId}`);
  };
  
  // Handler for starting process
  const handleStartProcess = () => {
    toast({
      title: 'Proces inițiat',
      description: 'Procesul a fost inițiat cu succes.',
    });
  };
  
  // Handler for viewing execution details
  const handleViewExecution = (executionId: string) => {
    toast({
      title: 'Detalii execuție',
      description: 'Funcționalitatea de vizualizare detaliată a execuțiilor va fi disponibilă în curând.',
    });
  };
  
  // Handler for back to processes list
  const handleBack = () => {
    navigate('/bpm/processes');
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
  };
  
  // Get badge for execution status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-500 hover:bg-green-500 text-white border-0">Completat</Badge>;
      case 'running':
        return <Badge variant="outline" className="bg-blue-500 hover:bg-blue-500 text-white border-0">În execuție</Badge>;
      case 'failed':
        return <Badge variant="destructive">Eșuat</Badge>;
      case 'waiting':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">În așteptare</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <BPMModuleLayout activeTab="processes">
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold flex items-center">
              <GitBranch className="h-6 w-6 mr-2 text-primary" />
              {process.name}
            </h2>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditProcess}>
              <Pencil className="h-4 w-4 mr-2" />
              Editează
            </Button>
            <Button onClick={handleStartProcess}>
              <Play className="h-4 w-4 mr-2" />
              Rulează
            </Button>
          </div>
        </div>
        
        {/* Process Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Detalii Proces</CardTitle>
            <CardDescription>Informații generale despre proces</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Descriere</h3>
                  <p className="text-sm mt-1">{process.description}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Statistici</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Total execuții</p>
                      <p className="text-lg font-medium">{process.runCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Durată medie</p>
                      <p className="text-lg font-medium">{process.averageDuration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rată succes</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-medium">{process.successRate}%</p>
                        <Progress 
                          value={process.successRate} 
                          className="h-2 w-16"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ultima rulare</p>
                      <p className="text-sm">{formatDate(process.lastRun)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 md:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div className="mt-1">
                      <Badge variant="outline" className="bg-green-500 hover:bg-green-500 text-white border-0">
                        Activ
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Tip</h3>
                    <div className="mt-1">
                      <Badge variant="outline" className="border-blue-500 text-blue-500">
                        Standard
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Versiune</h3>
                    <p className="text-sm mt-1">{process.version}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Proprietar</h3>
                    <p className="text-sm mt-1">{process.owner}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Data creării</h3>
                    <p className="text-sm mt-1">{formatDate(process.createdAt)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Ultima modificare</h3>
                    <p className="text-sm mt-1">{formatDate(process.updatedAt)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Colaboratori</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {process.collaborators.map((collaborator) => (
                      <div key={collaborator.id} className="flex items-center">
                        <Avatar className="h-8 w-8 border border-muted">
                          <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                    ))}
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs for different views */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              <span>Istoric execuții</span>
            </TabsTrigger>
            <TabsTrigger value="definition" className="flex items-center gap-1">
              <AlignJustify className="h-4 w-4" />
              <span>Definiție</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <BarChart className="h-4 w-4" />
              <span>Analiză</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span>Configurare</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Execution History Tab */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Istoric Execuții</CardTitle>
                <CardDescription>Ultimele execuții ale procesului</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-480px)]">
                  <div className="p-1">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead>ID Execuție</TableHead>
                          <TableHead>Start</TableHead>
                          <TableHead>Sfârșit</TableHead>
                          <TableHead>Durată</TableHead>
                          <TableHead>Inițiator</TableHead>
                          <TableHead>Cheie Business</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Acțiuni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {executionHistory.map((execution) => (
                          <TableRow key={execution.id}>
                            <TableCell className="font-medium">#{execution.id}</TableCell>
                            <TableCell>{formatDate(execution.startTime)}</TableCell>
                            <TableCell>{formatDate(execution.endTime)}</TableCell>
                            <TableCell>{execution.duration}</TableCell>
                            <TableCell>{execution.initiatedBy}</TableCell>
                            <TableCell>{execution.businessKey}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(execution.status)}
                                {execution.error && (
                                  <div className="tooltip" data-tip={execution.error}>
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewExecution(execution.id)}
                              >
                                <Activity className="h-4 w-4 mr-2" />
                                Detalii
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Afișare 1-{executionHistory.length} din {executionHistory.length} execuții
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Exportă istoric
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Process Definition Tab */}
          <TabsContent value="definition" className="mt-6">
            <Card className="h-[calc(100vh-480px)]">
              <CardHeader className="pb-2">
                <CardTitle>Definiție Proces</CardTitle>
                <CardDescription>Structura grafică a procesului</CardDescription>
              </CardHeader>
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <GitBranch className="h-12 w-12 mb-4 mx-auto text-muted-foreground" />
                  <h3 className="text-xl font-medium">Vizualizare Process</h3>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    Vizualizarea grafică a procesului și a tuturor componentelor sale va fi disponibilă în curând.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={handleEditProcess}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Deschide în Designer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <Card className="h-[calc(100vh-480px)]">
              <CardHeader className="pb-2">
                <CardTitle>Analiză</CardTitle>
                <CardDescription>Statistici și metrici de performanță</CardDescription>
              </CardHeader>
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <BarChart className="h-12 w-12 mb-4 mx-auto text-muted-foreground" />
                  <h3 className="text-xl font-medium">Vizualizare Metrici</h3>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    Funcționalitatea de analiză detaliată a performanței procesului va fi disponibilă în curând.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Configuration Tab */}
          <TabsContent value="config" className="mt-6">
            <Card className="h-[calc(100vh-480px)]">
              <CardHeader className="pb-2">
                <CardTitle>Configurare</CardTitle>
                <CardDescription>Setări avansate pentru proces</CardDescription>
              </CardHeader>
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Settings className="h-12 w-12 mb-4 mx-auto text-muted-foreground" />
                  <h3 className="text-xl font-medium">Configurare Avansată</h3>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    Funcționalitatea de configurare avansată a procesului va fi disponibilă în curând.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BPMModuleLayout>
  );
}