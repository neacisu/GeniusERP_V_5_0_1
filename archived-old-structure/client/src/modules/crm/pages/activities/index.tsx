/**
 * CRM Activities Page
 * 
 * Manages and displays all activities like calls, meetings, emails, and tasks
 * with calendar and list views.
 */

import React, { useState } from 'react';
import { CRMModuleLayout } from '../../components/common/CRMModuleLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Check, 
  FileCheck, 
  Filter, 
  List, 
  Mail, 
  MessageSquare, 
  MoreHorizontal, 
  Phone, 
  Plus, 
  RefreshCw, 
  User, 
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Sample activities data
const activities = [
  {
    id: '1',
    title: 'Apel introductiv',
    type: 'call',
    description: 'Discuție inițială despre nevoile companiei și soluțiile noastre.',
    status: 'completed',
    startTime: '2025-04-10T10:00:00',
    endTime: '2025-04-10T10:30:00',
    customerName: 'Acme SRL',
    customerId: '1',
    contactName: 'Ion Ionescu',
    contactId: '1',
    assignedTo: 'Alexandru Popa',
    assignedToId: 'u1',
    completedAt: '2025-04-10T10:28:00',
    outcome: 'Interes ridicat pentru soluția ERP. Programată demonstrație pentru săptămâna viitoare.'
  },
  {
    id: '2',
    title: 'Email follow-up demo',
    type: 'email',
    description: 'Email cu detalii și resurse după demonstrația produsului.',
    status: 'completed',
    startTime: '2025-04-10T14:00:00',
    customerName: 'Acme SRL',
    customerId: '1',
    contactName: 'Maria Popescu',
    contactId: '2',
    assignedTo: 'Alexandru Popa',
    assignedToId: 'u1',
    completedAt: '2025-04-10T14:35:00',
    outcome: 'Email trimis cu materiale și link-uri către resurse suplimentare.'
  },
  {
    id: '3',
    title: 'Întâlnire prezentare soluții',
    type: 'meeting',
    description: 'Demonstrație detaliată a funcționalităților produsului.',
    status: 'completed',
    startTime: '2025-04-09T11:00:00',
    endTime: '2025-04-09T12:30:00',
    customerName: 'TechSoft Solutions',
    customerId: '2',
    contactName: 'George Popa',
    contactId: '3',
    assignedTo: 'Maria Dinu',
    assignedToId: 'u2',
    completedAt: '2025-04-09T12:45:00',
    outcome: 'Feedback pozitiv, cu interes specific pentru modulul financiar.'
  },
  {
    id: '4',
    title: 'Preparare ofertă',
    type: 'task',
    description: 'Pregătire ofertă personalizată după cerințele discutate.',
    status: 'completed',
    startTime: '2025-04-08T09:00:00',
    endTime: '2025-04-08T16:00:00',
    customerName: 'TechSoft Solutions',
    customerId: '2',
    assignedTo: 'Maria Dinu',
    assignedToId: 'u2',
    completedAt: '2025-04-08T15:20:00',
    outcome: 'Ofertă completată și trimisă spre revizuire internă.'
  },
  {
    id: '5',
    title: 'Apel feedback ofertă',
    type: 'call',
    description: 'Discuție despre oferta trimisă și clarificarea întrebărilor.',
    status: 'scheduled',
    startTime: '2025-04-12T14:00:00',
    endTime: '2025-04-12T14:30:00',
    customerName: 'TechSoft Solutions',
    customerId: '2',
    contactName: 'George Popa',
    contactId: '3',
    assignedTo: 'Alexandru Popa',
    assignedToId: 'u1'
  },
  {
    id: '6',
    title: 'Întâlnire de negociere',
    type: 'meeting',
    description: 'Negocierea termenilor contractuali și detaliilor tehnice.',
    status: 'scheduled',
    startTime: '2025-04-15T10:00:00',
    endTime: '2025-04-15T11:30:00',
    customerName: 'Acme SRL',
    customerId: '1',
    contactName: 'Ion Ionescu',
    contactId: '1',
    assignedTo: 'Alexandru Popa',
    assignedToId: 'u1'
  },
  {
    id: '7',
    title: 'Întâlnire internă de pregătire',
    type: 'meeting',
    description: 'Pregătire internă pentru întâlnirea de negociere.',
    status: 'scheduled',
    startTime: '2025-04-14T15:00:00',
    endTime: '2025-04-14T16:00:00',
    assignedTo: 'Alexandru Popa',
    assignedToId: 'u1'
  },
  {
    id: '8',
    title: 'Configurare demo personalizat',
    type: 'task',
    description: 'Configurare instanță demo cu date specifice clientului.',
    status: 'scheduled',
    startTime: '2025-04-13T09:00:00',
    endTime: '2025-04-13T17:00:00',
    customerName: 'MediCare Plus',
    customerId: '3',
    assignedTo: 'Andrei Vasilescu',
    assignedToId: 'u3'
  }
];

// Sample contacts data for references
const contacts = [
  { id: '1', firstName: 'Ion', lastName: 'Ionescu' },
  { id: '2', firstName: 'Maria', lastName: 'Popescu' },
  { id: '3', firstName: 'George', lastName: 'Popa' }
];

// Sort activities by date, scheduled first
const sortedActivities = [...activities].sort((a, b) => {
  // First sort by status (scheduled first)
  if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
  if (a.status !== 'scheduled' && b.status === 'scheduled') return 1;
  
  // Then sort by date (newest first for scheduled, oldest first for completed)
  if (a.status === 'scheduled') {
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
  } else {
    return new Date(b.completedAt || b.startTime).getTime() - new Date(a.completedAt || a.startTime).getTime();
  }
});

const ActivitiesPage: React.FC = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  
  // Get unique assignees for filter
  const assignees = [...new Set(activities.map(a => a.assignedTo))];
  
  // Filter activities based on filters
  const filteredActivities = sortedActivities.filter(activity => {
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    const matchesAssignee = assigneeFilter === 'all' || activity.assignedTo === assigneeFilter;
    
    return matchesType && matchesStatus && matchesAssignee;
  });
  
  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get just time part
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'task':
        return <FileCheck className="h-4 w-4" />;
      case 'note':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };
  
  // Handle adding a new activity
  const handleAddActivity = (type: string) => {
    toast({
      title: `Adaugă ${type}`,
      description: "Funcționalitate în curând disponibilă.",
    });
  };
  
  // Handle activity actions
  const handleActivityAction = (action: string, activityId: string) => {
    toast({
      title: `Acțiune: ${action}`,
      description: `Pentru activitatea cu ID: ${activityId}`,
    });
  };
  
  // Reset all filters
  const resetFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setAssigneeFilter('all');
  };
  
  return (
    <CRMModuleLayout activeTab="activities">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Activități</h1>
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă Activitate
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAddActivity('call')}>
                  <Phone className="h-4 w-4 mr-2" />
                  Înregistrează apel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddActivity('meeting')}>
                  <Users className="h-4 w-4 mr-2" />
                  Programează întâlnire
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddActivity('email')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Trimite email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddActivity('task')}>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Crează sarcină
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddActivity('note')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Adaugă notă
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline" 
              onClick={() => handleAddActivity('refresh')}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizează
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate tipurile</SelectItem>
                <SelectItem value="call">Apeluri</SelectItem>
                <SelectItem value="meeting">Întâlniri</SelectItem>
                <SelectItem value="email">Email-uri</SelectItem>
                <SelectItem value="task">Sarcini</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate statusurile</SelectItem>
                <SelectItem value="scheduled">Programate</SelectItem>
                <SelectItem value="completed">Completate</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Atribuit către" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toți utilizatorii</SelectItem>
                {assignees.map(assignee => (
                  <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={resetFilters} 
              className="h-10 w-10 p-2"
            >
              <Filter className="h-4 w-4" />
              <span className="sr-only">Resetează filtre</span>
            </Button>
          </div>
          
          <Tabs 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as 'list' | 'calendar')}
            className="w-auto"
          >
            <TabsList className="grid w-[180px] grid-cols-2">
              <TabsTrigger value="list" className="flex items-center gap-1">
                <List className="h-4 w-4" />
                <span>Listă</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>Calendar</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Filter Pills - Show active filters */}
        {(typeFilter !== 'all' || statusFilter !== 'all' || assigneeFilter !== 'all') && (
          <div className="flex flex-wrap gap-2 pb-2">
            {typeFilter !== 'all' && (
              <div className="bg-primary/10 text-primary text-xs py-1 px-2.5 rounded-full flex items-center">
                Tip: {typeFilter === 'call' ? 'Apeluri' : 
                     typeFilter === 'meeting' ? 'Întâlniri' : 
                     typeFilter === 'email' ? 'Email-uri' : 
                     typeFilter === 'task' ? 'Sarcini' : 'Note'}
                <button 
                  className="ml-1.5 text-primary/80 hover:text-primary" 
                  onClick={() => setTypeFilter('all')}
                >
                  ✕
                </button>
              </div>
            )}
            
            {statusFilter !== 'all' && (
              <div className="bg-primary/10 text-primary text-xs py-1 px-2.5 rounded-full flex items-center">
                Status: {statusFilter === 'scheduled' ? 'Programate' : 'Completate'}
                <button 
                  className="ml-1.5 text-primary/80 hover:text-primary" 
                  onClick={() => setStatusFilter('all')}
                >
                  ✕
                </button>
              </div>
            )}
            
            {assigneeFilter !== 'all' && (
              <div className="bg-primary/10 text-primary text-xs py-1 px-2.5 rounded-full flex items-center">
                Atribuit către: {assigneeFilter}
                <button 
                  className="ml-1.5 text-primary/80 hover:text-primary" 
                  onClick={() => setAssigneeFilter('all')}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Results Count */}
        <div className="text-sm text-gray-500 mb-4">
          {filteredActivities.length} {filteredActivities.length === 1 ? 'activitate găsită' : 'activități găsite'}
        </div>
        
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'calendar')}>
          <TabsContent value="list" className="mt-0 p-0">
            <div className="space-y-4">
              {filteredActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
                  <CalendarIcon className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-xl font-medium mb-2">Nicio activitate găsită</p>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm text-center">
                    Ajustează filtrele sau adaugă o activitate nouă pentru a începe.
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Adaugă Activitate
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleAddActivity('call')}>
                        <Phone className="h-4 w-4 mr-2" />
                        Înregistrează apel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAddActivity('meeting')}>
                        <Users className="h-4 w-4 mr-2" />
                        Programează întâlnire
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAddActivity('email')}>
                        <Mail className="h-4 w-4 mr-2" />
                        Trimite email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAddActivity('task')}>
                        <FileCheck className="h-4 w-4 mr-2" />
                        Crează sarcină
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                filteredActivities.map(activity => (
                  <Card key={activity.id} className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`rounded-full p-2 ${
                          activity.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h3 className="text-lg font-medium">{activity.title}</h3>
                              <p className="text-sm text-gray-500">
                                {formatDateTime(activity.startTime)}
                                {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                              </p>
                            </div>
                            
                            <Badge 
                              className={
                                activity.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                  : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                              }
                            >
                              {activity.status === 'completed' ? 'Completat' : 'Programat'}
                            </Badge>
                          </div>
                          
                          {activity.contactId && (
                            <div className="flex items-center mt-2">
                              <User className="h-4 w-4 mr-2 text-gray-500" />
                              <span className="text-sm">
                                {contacts.find(c => c.id === activity.contactId)?.firstName} {contacts.find(c => c.id === activity.contactId)?.lastName}
                              </span>
                            </div>
                          )}
                          
                          {activity.description && (
                            <p className="mt-3 text-sm">
                              {activity.description}
                            </p>
                          )}
                          
                          <div className="flex justify-between items-center mt-4 pt-3 border-t">
                            <div className="text-sm text-gray-500">
                              Asignat către: {activity.assignedTo}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleActivityAction('view', activity.id)}>
                                Vezi detalii
                              </Button>
                              {activity.status !== 'completed' && (
                                <Button variant="outline" size="sm" onClick={() => handleActivityAction('complete', activity.id)}>
                                  Marchează ca completat
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-0 p-0">
            <Card>
              <CardHeader>
                <CardTitle>Vizualizare Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border p-4 rounded-md h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Vizualizarea calendar va fi disponibilă în curând</p>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm">
                      Lucrăm la implementarea unei vizualizări complete de calendar pentru activitățile CRM.
                    </p>
                    <Button onClick={() => setViewMode('list')}>
                      Revino la vizualizarea listă
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CRMModuleLayout>
  );
};

export default ActivitiesPage;