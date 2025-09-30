/**
 * BPM Dashboard Page
 * 
 * Pagina principală a modulului BPM cu prezentare generală a proceselor și automatizărilor
 */

import React from 'react';
import { BPMModuleLayout } from '../../components/common/BPMModuleLayout';
import BPMOverviewCard from '../../components/common/BPMOverviewCard';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  GitBranch,
  Zap,
  Activity,
  Workflow,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Calendar,
  BarChart3,
  BarChart2,
  ArrowRight,
  Plus,
  PlayCircle
} from 'lucide-react';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Mock data for statistics
  const stats = {
    totalProcesses: 5,
    activeProcesses: 4,
    completedInstances: 259,
    failedInstances: 18,
    successRate: 93.5,
    activeTriggers: 6,
    activeTasks: 12,
    scheduledTasks: 8,
  };
  
  // Mock data for recent processes
  const recentProcesses = [
    {
      id: '1',
      name: 'Invoice Processing',
      status: 'completed',
      startTime: '2025-04-11T08:45:00Z',
      endTime: '2025-04-11T09:35:00Z',
      duration: '50m',
      initiatedBy: 'System',
    },
    {
      id: '2',
      name: 'Purchase Order Approval',
      status: 'completed',
      startTime: '2025-04-10T14:30:00Z',
      endTime: '2025-04-10T15:45:00Z',
      duration: '1h 15m',
      initiatedBy: 'Maria Popescu',
    },
    {
      id: '3',
      name: 'New Employee Onboarding',
      status: 'completed',
      startTime: '2025-04-09T11:20:00Z',
      endTime: '2025-04-09T13:05:00Z',
      duration: '1h 45m',
      initiatedBy: 'Daily Trigger',
    },
    {
      id: '4',
      name: 'Customer Support Escalation',
      status: 'failed',
      startTime: '2025-04-08T09:15:00Z',
      endTime: '2025-04-08T09:45:00Z',
      duration: '30m',
      initiatedBy: 'System',
      error: 'Missing approval signature',
    },
    {
      id: '5',
      name: 'Monthly Financial Reporting',
      status: 'running',
      startTime: '2025-04-11T10:00:00Z',
      endTime: null,
      duration: '-',
      initiatedBy: 'Scheduled Trigger',
    },
  ];
  
  // Mock data for upcoming scheduled tasks
  const upcomingTasks = [
    {
      id: '1',
      name: 'Monthly Financial Reporting',
      scheduledFor: '2025-05-01T08:00:00Z',
      processName: 'Financial Reports',
      recurrence: 'Monthly',
    },
    {
      id: '2',
      name: 'Weekly Sales Analysis',
      scheduledFor: '2025-04-12T09:00:00Z',
      processName: 'Sales Analytics',
      recurrence: 'Weekly',
    },
    {
      id: '3',
      name: 'Inventory Check',
      scheduledFor: '2025-04-14T10:00:00Z',
      processName: 'Inventory Management',
      recurrence: 'Weekly',
    },
  ];
  
  // Navigation handlers
  const navigateToProcesses = () => navigate('/bpm/processes');
  const navigateToTriggers = () => navigate('/bpm/triggers');
  const navigateToScheduler = () => navigate('/bpm/scheduler');
  const navigateToMonitoring = () => navigate('/bpm/monitoring');
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
  };
  
  // Handler for running a process
  const handleRunProcess = (processName: string) => {
    toast({
      title: 'Proces inițiat',
      description: `Procesul "${processName}" a fost inițiat cu succes.`,
    });
  };
  
  // Badge for process status
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
    <BPMModuleLayout activeTab="dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Dashboard BPM</h2>
          <p className="text-muted-foreground">
            Vizualizare generală a proceselor și automatizărilor
          </p>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BPMOverviewCard
            title="Procese Active"
            value={`${stats.activeProcesses}`}
            icon={<GitBranch className="h-5 w-5" />}
            variant="info"
            action={{
              label: "Vezi toate procesele",
              onClick: navigateToProcesses,
            }}
          />
          
          <BPMOverviewCard
            title="Instanțe Completate"
            value={`${stats.completedInstances}`}
            icon={<CheckCircle className="h-5 w-5" />}
            variant="success"
            action={{
              label: "Vezi monitorizare",
              onClick: navigateToMonitoring,
            }}
          />
          
          <BPMOverviewCard
            title="Triggere Active"
            value={`${stats.activeTriggers}`}
            icon={<Zap className="h-5 w-5" />}
            variant="warning"
            action={{
              label: "Configurează",
              onClick: navigateToTriggers,
            }}
          />
          
          <BPMOverviewCard
            title="Operațiuni Planificate"
            value={`${stats.scheduledTasks}`}
            icon={<Calendar className="h-5 w-5" />}
            variant="default"
            action={{
              label: "Vezi planificare",
              onClick: navigateToScheduler,
            }}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Success Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Rată de Succes Procese
              </CardTitle>
              <CardDescription>
                Procentul de instanțe de proces finalizate cu succes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold">{stats.successRate}%</span>
                  <Badge variant="outline" className="bg-green-500 text-white border-0">
                    {stats.completedInstances} completate
                  </Badge>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Progres</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.completedInstances} / {stats.completedInstances + stats.failedInstances}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${stats.successRate}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={navigateToMonitoring} className="w-full">
                    <BarChart2 className="h-4 w-4 mr-2" />
                    Vezi rapoarte detaliate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Process Executions */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Execuții Recente
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={navigateToMonitoring}>
                  Vezi toate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Ultimele instanțe de proces executate
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="p-1">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Proces</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Început</TableHead>
                        <TableHead>Durată</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentProcesses.map((process) => (
                        <TableRow key={process.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{process.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {process.initiatedBy}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(process.status)}</TableCell>
                          <TableCell>{formatDate(process.startTime)}</TableCell>
                          <TableCell>{process.duration}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleRunProcess(process.name)}
                            >
                              <PlayCircle className="h-4 w-4" />
                              <span className="sr-only">Execută din nou</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scheduled Tasks */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Operațiuni Planificate
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={navigateToScheduler}>
                  Vezi toate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Următoarele operațiuni programate
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[240px]">
                <div className="p-1">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Operațiune</TableHead>
                        <TableHead>Proces</TableHead>
                        <TableHead>Programat pentru</TableHead>
                        <TableHead>Recurență</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div className="font-medium">{task.name}</div>
                          </TableCell>
                          <TableCell>{task.processName}</TableCell>
                          <TableCell>{formatDate(task.scheduledFor)}</TableCell>
                          <TableCell>{task.recurrence}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <Button onClick={navigateToScheduler} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă operațiune planificată
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Workflow className="h-5 w-5 text-primary" />
                Acțiuni Rapide
              </CardTitle>
              <CardDescription>
                Comenzi frecvente pentru a gestiona procesele
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    className="justify-start" 
                    onClick={() => navigate('/bpm/processes')}
                  >
                    <GitBranch className="mr-2 h-4 w-4" />
                    Creare Proces Nou
                  </Button>
                  
                  <Button 
                    className="justify-start" 
                    onClick={() => navigate('/bpm/triggers')}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Configurare Triggere
                  </Button>
                  
                  <Button 
                    className="justify-start" 
                    onClick={() => navigate('/bpm/automations')}
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Adăugare Automatizare
                  </Button>
                  
                  <Button 
                    className="justify-start" 
                    onClick={() => navigate('/bpm/scheduler')}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Programare Task
                  </Button>
                </div>
                
                <Card className="bg-primary/5 border-primary/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <ExternalLink className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Integrări Disponibile</h3>
                        <p className="text-sm text-muted-foreground">
                          Conectați-vă la servicii externe pentru a extinde funcționalitatea
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => navigate('/bpm/integrations')}
                      >
                        Explorează Integrări
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BPMModuleLayout>
  );
}