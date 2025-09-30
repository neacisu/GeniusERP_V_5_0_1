/**
 * BPM Triggers Page
 * 
 * Pagina pentru configurarea triggerelor ce declanșează procese
 */

import React, { useState } from 'react';
import { BPMModuleLayout } from '../../components/common/BPMModuleLayout';
import BPMEmptyState from '../../components/common/BPMEmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Bolt,
  Plus,
  Search,
  Filter,
  MoreVertical,
  ArrowRight,
  Clock,
  Mail,
  Database,
  FileText,
  Calendar,
  RefreshCw,
  Play,
  Edit,
  Trash2,
  AlertTriangle,
  Check,
  X,
  List
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

// Formular pentru un trigger nou
const triggerFormSchema = z.object({
  name: z.string().min(3, {
    message: 'Numele trebuie să conțină cel puțin 3 caractere.',
  }),
  description: z.string().optional(),
  type: z.enum(['schedule', 'webhook', 'data', 'email', 'manual']),
  processId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function TriggersPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showNewTriggerDialog, setShowNewTriggerDialog] = useState(false);
  
  // Formular pentru crearea unui trigger nou
  const form = useForm<z.infer<typeof triggerFormSchema>>({
    resolver: zodResolver(triggerFormSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'manual',
      isActive: true,
    },
  });
  
  // Handler pentru submiterea formularului
  function onSubmit(values: z.infer<typeof triggerFormSchema>) {
    toast({
      title: 'Trigger creat',
      description: `Trigger-ul "${values.name}" a fost creat cu succes.`,
    });
    
    setShowNewTriggerDialog(false);
    form.reset();
  }
  
  // Date mockup pentru triggere
  const triggers = [
    {
      id: '1',
      name: 'Daily Invoice Processing',
      description: 'Automatically process invoices every morning',
      type: 'schedule',
      processId: '1',
      processName: 'Invoice Processing',
      cronExpression: '0 9 * * 1-5',
      schedule: 'La 9:00 în fiecare zi lucrătoare',
      isActive: true,
      lastTriggered: '2025-04-11T09:00:00Z',
      createdAt: '2025-03-01T10:30:00Z',
      triggerCount: 29,
    },
    {
      id: '2',
      name: 'New Customer Webhook',
      description: 'Trigger onboarding process when a new customer is created',
      type: 'webhook',
      processId: '2',
      processName: 'Customer Onboarding',
      endpoint: '/api/webhooks/new-customer',
      isActive: true,
      lastTriggered: '2025-04-10T15:45:00Z',
      createdAt: '2025-02-15T14:00:00Z',
      triggerCount: 42,
    },
    {
      id: '3',
      name: 'Low Inventory Alert',
      description: 'Trigger inventory replenishment when stock is low',
      type: 'data',
      processId: '3',
      processName: 'Inventory Replenishment',
      condition: 'quantity < threshold',
      isActive: true,
      lastTriggered: '2025-04-09T11:20:00Z',
      createdAt: '2025-03-10T09:15:00Z',
      triggerCount: 18,
    },
    {
      id: '4',
      name: 'Support Email Processor',
      description: 'Process new support emails and create tickets',
      type: 'email',
      processId: '4',
      processName: 'Support Ticket Handling',
      emailFilter: 'to:support@company.com',
      isActive: false,
      lastTriggered: '2025-04-05T08:30:00Z',
      createdAt: '2025-02-20T16:45:00Z',
      triggerCount: 87,
    },
    {
      id: '5',
      name: 'Monthly Reports Generator',
      description: 'Generate financial reports at the end of each month',
      type: 'schedule',
      processId: '5',
      processName: 'Financial Reporting Template',
      cronExpression: '0 0 1 * *',
      schedule: 'La 00:00 în prima zi a fiecărei luni',
      isActive: true,
      lastTriggered: '2025-04-01T00:00:00Z',
      createdAt: '2025-01-15T11:30:00Z',
      triggerCount: 3,
    },
  ];
  
  // Filtrarea triggerelor în funcție de criterii
  const filteredTriggers = triggers.filter(trigger => {
    const matchesSearch = !searchQuery || 
      trigger.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trigger.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || trigger.type === selectedType;
    
    return matchesSearch && matchesType;
  });
  
  // Badge pentru tipul trigger-ului
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'schedule':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Programat</Badge>;
      case 'webhook':
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Webhook</Badge>;
      case 'data':
        return <Badge variant="outline" className="border-green-500 text-green-500">Date</Badge>;
      case 'email':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Email</Badge>;
      case 'manual':
        return <Badge variant="outline" className="border-gray-500 text-gray-500">Manual</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };
  
  // Iconiță pentru tipul trigger-ului
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'schedule':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'webhook':
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      case 'data':
        return <Database className="h-4 w-4 text-green-500" />;
      case 'email':
        return <Mail className="h-4 w-4 text-amber-500" />;
      case 'manual':
        return <Play className="h-4 w-4 text-gray-500" />;
      default:
        return <Bolt className="h-4 w-4" />;
    }
  };
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
  };
  
  // Handler pentru editarea unui trigger
  const handleEditTrigger = (id: string) => {
    toast({
      title: 'Editare trigger',
      description: 'Funcționalitatea de editare va fi disponibilă în curând.',
    });
  };
  
  // Handler pentru activarea/dezactivarea unui trigger
  const handleToggleTrigger = (id: string, currentState: boolean) => {
    toast({
      title: currentState ? 'Trigger dezactivat' : 'Trigger activat',
      description: `Trigger-ul a fost ${currentState ? 'dezactivat' : 'activat'} cu succes.`,
    });
  };
  
  // Handler pentru ștergerea unui trigger
  const handleDeleteTrigger = (id: string) => {
    toast({
      title: 'Trigger șters',
      description: 'Trigger-ul a fost șters cu succes.',
    });
  };
  
  // Handler pentru executarea manuală a unui trigger
  const handleRunTrigger = (id: string) => {
    toast({
      title: 'Trigger executat',
      description: 'Trigger-ul a fost executat manual cu succes.',
    });
  };
  
  return (
    <BPMModuleLayout activeTab="triggers">
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Triggere</h2>
            <p className="text-muted-foreground">
              Gestionați mecanismele care declanșează automat procesele
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setShowNewTriggerDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Trigger nou
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
                    placeholder="Caută triggere..." 
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
                    <SelectItem value="schedule">Programate</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="data">Date</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="manual">Manuale</SelectItem>
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
            <TabsTrigger value="schedule">Programate</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Triggers List */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Triggere</CardTitle>
            <CardDescription>Toate mecanismele configurate pentru declanșarea proceselor</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredTriggers.length === 0 ? (
              <div className="p-8">
                <BPMEmptyState 
                  title="Nu există triggere" 
                  description="Nu s-au găsit triggere care să corespundă criteriilor de căutare. Începeți prin a crea un nou trigger."
                  icon={<Bolt className="h-10 w-10" />}
                  action={{
                    label: "Creează trigger",
                    onClick: () => setShowNewTriggerDialog(true),
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
                        <TableHead className="w-[250px]">Nume Trigger</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Proces</TableHead>
                        <TableHead className="hidden md:table-cell">Ultima execuție</TableHead>
                        <TableHead className="hidden md:table-cell">Total execuții</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTriggers.map((trigger) => (
                        <TableRow key={trigger.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {getTypeIcon(trigger.type)}
                                {trigger.name}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {trigger.description}
                              </div>
                              {trigger.type === 'schedule' && (
                                <div className="text-xs text-blue-500 mt-1 flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {trigger.schedule}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(trigger.type)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{trigger.processName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatDate(trigger.lastTriggered)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {trigger.triggerCount}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={trigger.isActive} 
                                onCheckedChange={() => handleToggleTrigger(trigger.id, trigger.isActive)}
                              />
                              <span className={`text-xs ${trigger.isActive 
                                ? 'text-green-500' 
                                : 'text-muted-foreground'}`}>
                                {trigger.isActive ? 'Activ' : 'Inactiv'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRunTrigger(trigger.id)}
                                title="Execută manual"
                              >
                                <Play className="h-4 w-4 text-primary" />
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleRunTrigger(trigger.id)}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Execută manual
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditTrigger(trigger.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editează
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleTrigger(trigger.id, trigger.isActive)}>
                                    {trigger.isActive ? (
                                      <>
                                        <X className="h-4 w-4 mr-2" />
                                        Dezactivează
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Activează
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleDeleteTrigger(trigger.id)}
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
        </Card>
      </div>
      
      {/* Dialog pentru crearea unui nou trigger */}
      <Dialog open={showNewTriggerDialog} onOpenChange={setShowNewTriggerDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Creare Trigger Nou</DialogTitle>
            <DialogDescription>
              Configurați detaliile pentru un nou mecanism de declanșare a proceselor.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume trigger</FormLabel>
                    <FormControl>
                      <Input placeholder="Introduceți un nume..." {...field} />
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
                        placeholder="Descrieți scopul acestui trigger..." 
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
                    <FormLabel>Tip trigger</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați tipul..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="schedule">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-blue-500" />
                            <span>Programat</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="webhook">
                          <div className="flex items-center">
                            <RefreshCw className="h-4 w-4 mr-2 text-purple-500" />
                            <span>Webhook</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="data">
                          <div className="flex items-center">
                            <Database className="h-4 w-4 mr-2 text-green-500" />
                            <span>Date</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="email">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-amber-500" />
                            <span>Email</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="manual">
                          <div className="flex items-center">
                            <Play className="h-4 w-4 mr-2 text-gray-500" />
                            <span>Manual</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Tipul de eveniment care va declanșa procesul.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="processId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proces asociat</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați procesul..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Invoice Processing</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="2">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Customer Onboarding</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="3">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Inventory Replenishment</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="4">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Support Ticket Handling</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Procesul care va fi executat când trigger-ul este declanșat.
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
                        Activați sau dezactivați trigger-ul după creare.
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
                <Button variant="outline" onClick={() => setShowNewTriggerDialog(false)}>
                  Anulează
                </Button>
                <Button type="submit">Creează trigger</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </BPMModuleLayout>
  );
}