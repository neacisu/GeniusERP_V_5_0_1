/**
 * BPM Processes List Page
 * 
 * Pagina pentru gestiunea proceselor
 */

import React, { useState } from 'react';
import { BPMModuleLayout } from '../../components/common/BPMModuleLayout';
import BPMEmptyState from '../../components/common/BPMEmptyState';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  GitBranch,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Play,
  FileText,
  Edit,
  Copy,
  Trash2,
  Eye,
  CheckCircle,
  Workflow
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

// Form schema for creating a new process
const processFormSchema = z.object({
  name: z.string().min(3, {
    message: 'Numele trebuie să conțină cel puțin 3 caractere.',
  }),
  description: z.string().optional(),
  type: z.enum(['standard', 'approval', 'document', 'custom']),
  isActive: z.boolean(),
});

export default function ProcessesPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showNewProcessDialog, setShowNewProcessDialog] = useState(false);
  
  // Form for creating a new process
  const form = useForm<z.infer<typeof processFormSchema>>({
    resolver: zodResolver(processFormSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'standard',
      isActive: true,
    },
  });
  
  // Handler for submitting the form
  function onSubmit(values: z.infer<typeof processFormSchema>) {
    toast({
      title: 'Proces creat',
      description: `Procesul "${values.name}" a fost creat cu succes.`,
    });
    
    setShowNewProcessDialog(false);
    form.reset();
    
    // Navigate to the designer to start building the process
    navigate('/bpm/designer');
  }
  
  // Mock data for processes
  const processes = [
    {
      id: '1',
      name: 'Invoice Processing',
      description: 'Process for reviewing and approving customer invoices before they are sent out.',
      type: 'standard',
      status: 'active',
      lastRun: '2025-04-11T08:45:00Z',
      createdAt: '2025-03-15T12:00:00Z',
      updatedAt: '2025-04-10T09:30:00Z',
      runCount: 42,
      successRate: 95,
      owner: 'Admin User',
      category: 'Finance',
    },
    {
      id: '2',
      name: 'New Employee Onboarding',
      description: 'Streamlined process for onboarding new employees, including document collection, system access, and training schedules.',
      type: 'document',
      status: 'active',
      lastRun: '2025-04-09T14:20:00Z',
      createdAt: '2025-02-01T10:15:00Z',
      updatedAt: '2025-03-20T11:45:00Z',
      runCount: 18,
      successRate: 100,
      owner: 'HR Manager',
      category: 'HR',
    },
    {
      id: '3',
      name: 'Purchase Order Approval',
      description: 'Multi-level approval workflow for purchase orders based on amount thresholds.',
      type: 'approval',
      status: 'active',
      lastRun: '2025-04-10T11:30:00Z',
      createdAt: '2025-03-05T09:20:00Z',
      updatedAt: '2025-04-05T16:40:00Z',
      runCount: 67,
      successRate: 88,
      owner: 'Procurement Manager',
      category: 'Procurement',
    },
    {
      id: '4',
      name: 'Customer Support Escalation',
      description: 'Process for handling and escalating customer support tickets based on priority and SLA requirements.',
      type: 'custom',
      status: 'inactive',
      lastRun: '2025-03-28T15:30:00Z',
      createdAt: '2025-01-20T11:10:00Z',
      updatedAt: '2025-03-25T14:20:00Z',
      runCount: 129,
      successRate: 78,
      owner: 'Support Lead',
      category: 'Customer Service',
    },
    {
      id: '5',
      name: 'Monthly Financial Reporting',
      description: 'End-of-month process for collecting, validating, and publishing financial reports.',
      type: 'standard',
      status: 'active',
      lastRun: '2025-04-01T09:15:00Z',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-03-31T16:45:00Z',
      runCount: 3,
      successRate: 100,
      owner: 'Finance Director',
      category: 'Finance',
    },
  ];
  
  // Filtering processes based on criteria
  const filteredProcesses = processes.filter(process => {
    const matchesSearch = !searchQuery || 
      process.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      process.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || process.type === selectedType;
    
    return matchesSearch && matchesType;
  });
  
  // Badge for process type
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'standard':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Standard</Badge>;
      case 'approval':
        return <Badge variant="outline" className="border-green-500 text-green-500">Aprobare</Badge>;
      case 'document':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Document</Badge>;
      case 'custom':
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Personalizat</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };
  
  // Badge for process status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-500 hover:bg-green-500 text-white border-0">Activ</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-400 hover:bg-gray-400 text-white border-0">Inactiv</Badge>;
      case 'draft':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Ciornă</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
  };
  
  // Handler for viewing a process
  const handleViewProcess = (id: string) => {
    navigate(`/bpm/processes/${id}`);
  };
  
  // Handler for editing a process
  const handleEditProcess = (id: string) => {
    navigate(`/bpm/designer/${id}`);
  };
  
  // Handler for duplicating a process
  const handleDuplicateProcess = (_id: string) => {
    toast({
      title: 'Proces duplicat',
      description: 'Procesul a fost duplicat cu succes.',
    });
  };

  // Handler for deleting a process
  const handleDeleteProcess = (_id: string) => {
    toast({
      title: 'Proces șters',
      description: 'Procesul a fost șters cu succes.',
    });
  };

  // Handler for running a process instance
  const handleRunProcess = (_id: string) => {
    toast({
      title: 'Proces inițiat',
      description: 'Procesul a fost inițiat cu succes.',
    });
  };
  
  return (
    <BPMModuleLayout activeTab="processes">
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Procese</h2>
            <p className="text-muted-foreground">
              Gestionați procesele de business și fluxurile de lucru
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setShowNewProcessDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Proces nou
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Caută procese..." 
                    className="pl-9" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Toate tipurile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate tipurile</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="approval">Aprobare</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="custom">Personalizat</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Toate</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="recent">Recent modificate</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Processes List */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Procese</CardTitle>
            <CardDescription>Toate procesele configurate în sistem</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredProcesses.length === 0 ? (
              <div className="p-8">
                <BPMEmptyState 
                  title="Nu există procese" 
                  description="Nu s-au găsit procese care să corespundă criteriilor de căutare. Începeți prin a crea un nou proces."
                  icon={<GitBranch className="h-10 w-10" />}
                  action={{
                    label: "Creează proces",
                    onClick: () => setShowNewProcessDialog(true),
                  }}
                  variant="card"
                />
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="relative w-full overflow-auto p-1">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead className="w-[250px]">Nume Proces</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Categorie</TableHead>
                        <TableHead className="hidden md:table-cell">Ultima execuție</TableHead>
                        <TableHead className="hidden md:table-cell">Rată Succes</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProcesses.map((process) => (
                        <TableRow key={process.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-medium hover:text-primary hover:cursor-pointer" onClick={() => handleViewProcess(process.id)}>
                                {process.name}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {process.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(process.type)}</TableCell>
                          <TableCell>{getStatusBadge(process.status)}</TableCell>
                          <TableCell>
                            <span className="text-sm">{process.category}</span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatDate(process.lastRun)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    process.successRate >= 90 ? 'bg-green-500' : 
                                    process.successRate >= 75 ? 'bg-amber-500' : 
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${process.successRate}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium">{process.successRate}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRunProcess(process.id)}
                                title="Execută proces"
                              >
                                <Play className="h-4 w-4 text-primary" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewProcess(process.id)}
                                title="Vizualizează detalii"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewProcess(process.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Vizualizează
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRunProcess(process.id)}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Rulează
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditProcess(process.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editează
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicateProcess(process.id)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplică
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleDeleteProcess(process.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Șterge
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Afișare {filteredProcesses.length} din {processes.length} procese
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Dialog for creating a new process */}
      <Dialog open={showNewProcessDialog} onOpenChange={setShowNewProcessDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Creare Proces Nou</DialogTitle>
            <DialogDescription>
              Configurați detaliile pentru noul proces de business.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume proces</FormLabel>
                    <FormControl>
                      <Input placeholder="Introduceți un nume descriptiv..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descriere</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrieți scopul acestui proces..." 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tip proces</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați tipul..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">
                          <div className="flex items-center">
                            <Workflow className="h-4 w-4 mr-2 text-blue-500" />
                            <span>Standard</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="approval">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            <span>Aprobare</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="document">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-amber-500" />
                            <span>Document</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="custom">
                          <div className="flex items-center">
                            <GitBranch className="h-4 w-4 mr-2 text-purple-500" />
                            <span>Personalizat</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Tipul de proces determină funcționalitatea și comportamentul implicit.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status</FormLabel>
                      <FormDescription>
                        Activați sau dezactivați procesul după creare.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewProcessDialog(false)}>
                  Anulează
                </Button>
                <Button type="submit">Creează și deschide designer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </BPMModuleLayout>
  );
}