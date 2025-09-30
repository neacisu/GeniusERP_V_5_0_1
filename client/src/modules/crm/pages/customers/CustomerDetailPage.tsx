/**
 * Customer Detail Page
 * 
 * Displays detailed information about a specific customer including
 * contact information, activity history, deals, and related data.
 */

import React, { useState } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { CRMModuleLayout } from '../../components/common/CRMModuleLayout';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  FileText,
  BarChart3,
  Users,
  Calendar,
  ClipboardList,
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  MoreHorizontal,
  User,
  CalendarClock,
  FileCheck,
  MessageSquare,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCompanyById } from '../../hooks/useCompanies';
import CompanyFormDialog from '../../components/company/CompanyFormDialog';

// Sample contacts data
const contacts = [
  {
    id: '1',
    customerId: '1',
    firstName: 'Ion',
    lastName: 'Ionescu',
    email: 'ion.ionescu@acme.ro',
    phone: '0721 234 567',
    title: 'Director General',
    department: 'Management',
    decisionMaker: true,
    influenceLevel: 10,
    notes: 'Contact principal pentru decizii strategice.'
  },
  {
    id: '2',
    customerId: '1',
    firstName: 'Maria',
    lastName: 'Popescu',
    email: 'maria.popescu@acme.ro',
    phone: '0722 345 678',
    title: 'Director Financiar',
    department: 'Financiar',
    decisionMaker: true,
    influenceLevel: 9,
    notes: 'Responsabilă cu aprobările bugetare și detaliile contractuale.'
  },
  {
    id: '3',
    customerId: '1',
    firstName: 'Mihai',
    lastName: 'Stanescu',
    email: 'mihai.stanescu@acme.ro',
    phone: '0723 456 789',
    title: 'Manager IT',
    department: 'IT',
    decisionMaker: false,
    influenceLevel: 7,
    notes: 'Responsabil tehnic pentru implementare și integrare.'
  }
];

// Sample deals data
const deals = [
  {
    id: '1',
    customerId: '1',
    title: 'Licențe ERP Enterprise',
    amount: 250000,
    stage: 'Negociere',
    probability: 75,
    expectedCloseDate: '2025-05-15',
    createdAt: '2025-03-20'
  },
  {
    id: '2',
    customerId: '1',
    title: 'Servicii Implementare',
    amount: 120000,
    stage: 'Propunere',
    probability: 60,
    expectedCloseDate: '2025-06-01',
    createdAt: '2025-03-25'
  },
  {
    id: '3',
    customerId: '1',
    title: 'Mentenanță Anuală',
    amount: 75000,
    stage: 'Câștigat',
    probability: 100,
    expectedCloseDate: '2025-04-05',
    createdAt: '2025-02-15',
    actualCloseDate: '2025-04-01'
  }
];

// Sample activities data
const activities = [
  {
    id: '1',
    customerId: '1',
    title: 'Apel introductiv',
    type: 'call',
    description: 'Discuție inițială despre nevoile companiei și posibile soluții.',
    status: 'completed',
    startTime: '2025-03-10T10:00:00',
    endTime: '2025-03-10T10:30:00',
    contactId: '1',
    assignedTo: 'Alexandru Popa'
  },
  {
    id: '2',
    customerId: '1',
    title: 'Întâlnire prezentare soluții',
    type: 'meeting',
    description: 'Prezentarea detaliată a soluțiilor pentru management și operațiuni.',
    status: 'completed',
    startTime: '2025-03-17T14:00:00',
    endTime: '2025-03-17T15:30:00',
    contactId: '1',
    assignedTo: 'Alexandru Popa'
  },
  {
    id: '3',
    customerId: '1',
    title: 'Trimitere ofertă preliminară',
    type: 'email',
    description: 'Ofertă pentru licențe ERP și servicii asociate de implementare.',
    status: 'completed',
    startTime: '2025-03-20T09:15:00',
    contactId: '2',
    assignedTo: 'Maria Dinu'
  },
  {
    id: '4',
    customerId: '1',
    title: 'Întâlnire tehnică',
    type: 'meeting',
    description: 'Discuție tehnică despre arhitectură și integrare cu sistemele existente.',
    status: 'completed',
    startTime: '2025-03-25T11:00:00',
    endTime: '2025-03-25T12:30:00',
    contactId: '3',
    assignedTo: 'Andrei Vasilescu'
  },
  {
    id: '5',
    customerId: '1',
    title: 'Negociere contract',
    type: 'meeting',
    description: 'Negocierea termenilor contractuali și detaliilor financiare.',
    status: 'upcoming',
    startTime: '2025-04-15T14:00:00',
    endTime: '2025-04-15T16:00:00',
    contactId: '2',
    assignedTo: 'Alexandru Popa'
  }
];

// Sample notes data
const notes = [
  {
    id: '1',
    customerId: '1',
    title: 'Notă întâlnire inițială',
    content: 'Client interesat de soluții complete de management. Au exprimat nevoi specifice pentru departamentul financiar și operațiuni. Buget estimat: 300.000-400.000 RON.',
    createdAt: '2025-03-10T11:00:00',
    createdBy: 'Alexandru Popa'
  },
  {
    id: '2',
    customerId: '1',
    title: 'Feedback demo',
    content: 'Feedback pozitiv după demonstrația produsului. Director general impresionat de funcționalitățile de raportare. Directorul financiar are întrebări despre integrarea cu sistemul actual de contabilitate.',
    createdAt: '2025-03-18T16:30:00',
    createdBy: 'Alexandru Popa'
  },
  {
    id: '3',
    customerId: '1',
    title: 'Discuție tehnică',
    content: 'Echipa IT a clientului preferă o abordare graduală pentru implementare, începând cu modulele financiare și apoi extinderea către operațiuni. Vor furniza specificațiile tehnice pentru integrare în următoarele zile.',
    createdAt: '2025-03-26T13:45:00',
    createdBy: 'Andrei Vasilescu'
  }
];

const CustomerDetailPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Fetch real customer data from API
  const { data: customer, isLoading, isError, error, refetch } = useCompanyById(id || '');
  
  // Filtered data related to this customer
  const customerContacts = contacts.filter(c => c.customerId === id);
  const customerDeals = deals.filter(d => d.customerId === id);
  const customerActivities = activities.filter(a => a.customerId === id);
  const customerNotes = notes.filter(n => n.customerId === id);
  
  // Handle successful form submission
  const handleEditFormSubmit = async () => {
    await refetch(); // Refresh the data after editing
    toast({
      title: 'Companie actualizată',
      description: 'Datele companiei au fost actualizate cu succes.',
    });
  };
  
  // Handle actions
  const handleAction = (action: string) => {
    if (action === 'edit') {
      setIsEditDialogOpen(true);
    } else {
      toast({
        title: 'Acțiune',
        description: `Ai selectat acțiunea: ${action}`,
      });
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <CRMModuleLayout activeTab="customers">
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <Loader2 className="h-12 w-12 mb-4 text-primary animate-spin" />
          <h2 className="text-xl font-medium mb-2">Se încarcă datele companiei...</h2>
        </div>
      </CRMModuleLayout>
    );
  }
  
  // Show error state
  if (isError || !customer) {
    return (
      <CRMModuleLayout activeTab="customers">
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <Building2 className="h-16 w-16 mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Companie negăsită</h2>
          <p className="text-gray-500 mb-6">
            {isError && error instanceof Error 
              ? error.message 
              : `Nu am putut găsi compania cu ID-ul ${id}`}
          </p>
          <Button onClick={() => setLocation('/crm/customers')}>
            Înapoi la lista de companii
          </Button>
        </div>
      </CRMModuleLayout>
    );
  }
  
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
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Format date time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <CalendarClock className="h-4 w-4" />;
      case 'task':
        return <FileCheck className="h-4 w-4" />;
      case 'note':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };
  
  // Get avatar initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Get badge style based on type
  const getBadgeVariant = (type: string = 'lead') => {
    switch (type.toLowerCase()) {
      case 'lead':
        return 'outline';
      case 'prospect':
        return 'secondary';
      case 'customer':
        return 'default';
      case 'partner':
        return 'secondary'; // Replaced 'success' with 'secondary' as success is not in the variant types
      default:
        return 'outline';
    }
  };
  
  // Format type for display
  const formatType = (type: string = 'lead') => {
    const typeMap: Record<string, string> = {
      'lead': 'Lead',
      'prospect': 'Prospect',
      'customer': 'Client',
      'partner': 'Partener'
    };
    
    return typeMap[type.toLowerCase()] || type;
  };
  
  return (
    <CRMModuleLayout activeTab="customers">
      <div className="space-y-6">
        {/* Header with back button, title and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/crm/customers')}
              className="mb-2 -ml-4 h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Înapoi la lista de companii
            </Button>
            <div className="flex items-center">
              <Building2 className="h-6 w-6 text-primary mr-2" />
              <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
              {customer.type && (
                <Badge variant={getBadgeVariant(customer.type)} className="ml-3">
                  {formatType(customer.type)}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleAction('export')}>
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAction('edit')}>
              <Edit className="h-4 w-4 mr-1.5" />
              Editează
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAction('addContact')}>
                  <User className="h-4 w-4 mr-2" />
                  Adaugă contact
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('addDeal')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Adaugă oportunitate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('addActivity')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Programează activitate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleAction('delete')}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Șterge companie
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Tabs for company sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b">
            <TabsList className="bg-transparent h-auto p-0 w-full justify-start">
              <TabsTrigger 
                value="overview" 
                className="py-2.5 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Prezentare generală
              </TabsTrigger>
              <TabsTrigger 
                value="contacts" 
                className="py-2.5 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Contacte ({customerContacts.length})
              </TabsTrigger>
              <TabsTrigger 
                value="deals" 
                className="py-2.5 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Oportunități ({customerDeals.length})
              </TabsTrigger>
              <TabsTrigger 
                value="activities" 
                className="py-2.5 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Activități ({customerActivities.length})
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="py-2.5 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Note ({customerNotes.length})
              </TabsTrigger>
              <TabsTrigger 
                value="documents" 
                className="py-2.5 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Documente
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Information Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Informații companie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Domeniu de activitate</p>
                      <p>{customer.industry || 'Nedefinit'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Segment</p>
                      <p>{customer.segment || 'Nedefinit'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">CUI</p>
                      <p>{customer.fiscalCode || 'Nedefinit'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Nr. Înregistrare</p>
                      <p>{customer.registrationNumber || 'Nedefinit'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Plătitor TVA</p>
                      <p>{customer.vatPayer ? 'Da' : 'Nu'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Sursă Lead</p>
                      <p>{(customer.customFields?.source as string) || 'Nedefinit'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Cifră de afaceri anuală</p>
                      <p>{customer.annualRevenue ? formatCurrency(customer.annualRevenue) : 'Nedefinit'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Număr angajați</p>
                      <p>{(customer.customFields?.employeeCount as number) || 'Nedefinit'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Tip relație comercială</p>
                      <div className="flex flex-col gap-1">
                        <p className="flex items-center">
                          {customer.isCustomer ? (
                            <Badge variant="default" className="mr-2">Client</Badge>
                          ) : (
                            <Badge variant="outline" className="mr-2">Nu este client</Badge>
                          )}
                          {customer.analythic_4111 && (
                            <span className="text-sm text-primary-600 ml-1">Cont analitic: {customer.analythic_4111}</span>
                          )}
                        </p>
                        <p className="flex items-center">
                          {customer.isSupplier ? (
                            <Badge variant="secondary" className="mr-2">Furnizor</Badge>
                          ) : (
                            <Badge variant="outline" className="mr-2">Nu este furnizor</Badge>
                          )}
                          {customer.analythic_401 && (
                            <span className="text-sm text-primary-600 ml-1">Cont analitic: {customer.analythic_401}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 space-y-1 mt-2">
                      <p className="text-sm text-gray-500">Adresă</p>
                      <p>
                        {customer.address && <span>{customer.address}, </span>}
                        {customer.city && <span>{customer.city}, </span>}
                        {customer.county && <span>{customer.county}, </span>}
                        {customer.postalCode && <span>{customer.postalCode}, </span>}
                        {customer.country && <span>{customer.country}</span>}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Telefon</p>
                      <p>
                        <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                          {customer.phone || 'Nedefinit'}
                        </a>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Email</p>
                      <p>
                        <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                          {customer.email || 'Nedefinit'}
                        </a>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Website</p>
                      <p>
                        {customer.website ? (
                          <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {customer.website.replace(/^https?:\/\/(www\.)?/i, '')}
                          </a>
                        ) : 'Nedefinit'}
                      </p>
                    </div>
                  </div>
                  
                  {customer.notes && (
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm text-gray-500 mb-2">Note</p>
                      <p className="text-sm">{customer.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Stats & Key Information Card */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Scor & Metrici</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Financial Information */}
                      {(customer.analythic_401 || customer.analythic_4111) && (
                        <div className="space-y-3 pb-4 border-b">
                          <p className="text-sm text-gray-500">Conturi analitice</p>
                          <div className={`grid ${customer.analythic_401 && customer.analythic_4111 ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                            {customer.analythic_4111 && (
                              <div className="bg-green-50 text-green-800 rounded-lg p-3">
                                <p className="text-xs text-green-700">Cont analitic clienți</p>
                                <p className="text-lg font-medium">{customer.analythic_4111}</p>
                              </div>
                            )}
                            {customer.analythic_401 && (
                              <div className="bg-blue-50 text-blue-800 rounded-lg p-3">
                                <p className="text-xs text-blue-700">Cont analitic furnizori</p>
                                <p className="text-lg font-medium">{customer.analythic_401}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Lead Score */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">Scor Lead</p>
                          <span className="text-sm font-medium">{customer.leadScore}/100</span>
                        </div>
                        <Progress value={customer.leadScore} className="h-2" />
                      </div>
                      
                      {/* Deal Stats */}
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500">Statistici Oportunități</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-primary/10 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Active</p>
                            <p className="text-xl font-medium">{customerDeals.filter(d => d.stage !== 'Câștigat' && d.stage !== 'Pierdut').length}</p>
                          </div>
                          <div className="bg-primary/10 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Câștigate</p>
                            <p className="text-xl font-medium">{customerDeals.filter(d => d.stage === 'Câștigat').length}</p>
                          </div>
                        </div>
                        <div className="bg-primary/10 rounded-lg p-3">
                          <div className="flex justify-between items-baseline">
                            <p className="text-xs text-gray-500">Valoare totală</p>
                            <p className="text-xl font-medium">
                              {formatCurrency(customerDeals.reduce((sum, deal) => sum + deal.amount, 0))}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Recent Activity */}
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-500 mb-3">Activitate recentă</p>
                        <div className="space-y-4">
                          {customerActivities.slice(0, 3).map(activity => (
                            <div key={activity.id} className="flex items-start gap-2">
                              <div className={`rounded-full p-1.5 ${
                                activity.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {getActivityIcon(activity.type)}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{activity.title}</p>
                                <p className="text-xs text-gray-500">
                                  {formatDateTime(activity.startTime)}
                                </p>
                              </div>
                            </div>
                          ))}
                          
                          {customerActivities.length === 0 && (
                            <p className="text-sm text-gray-500">Nicio activitate înregistrată</p>
                          )}
                          
                          {customerActivities.length > 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => setActiveTab('activities')}
                            >
                              Vezi toate activitățile
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Add more widgets like Key Contacts here */}
              </div>
            </div>
          </TabsContent>
          
          {/* Contacts Tab */}
          <TabsContent value="contacts" className="pt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => handleAction('addContact')}>
                <User className="h-4 w-4 mr-2" />
                Adaugă contact
              </Button>
            </div>
            
            {customerContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
                <Users className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-xl font-medium mb-2">Niciun contact înregistrat</p>
                <p className="text-sm text-gray-500 mb-6 max-w-sm text-center">
                  Adaugă contacte pentru a gestiona persoanele cheie din această companie.
                </p>
                <Button onClick={() => handleAction('addContact')}>
                  <User className="h-4 w-4 mr-2" />
                  Adaugă primul contact
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerContacts.map(contact => (
                  <Card key={contact.id} className="h-full shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(`${contact.firstName} ${contact.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h3 className="text-lg font-medium">
                            {contact.firstName} {contact.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{contact.title}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {contact.department && (
                          <div className="flex items-center text-sm">
                            <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{contact.department}</span>
                          </div>
                        )}
                        
                        {contact.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-4 w-4 mr-2 text-gray-500" />
                            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                              {contact.email}
                            </a>
                          </div>
                        )}
                        
                        {contact.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                            <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                              {contact.phone}
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        {contact.decisionMaker && (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                            Decident
                          </Badge>
                        )}
                        
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                          Influență: {contact.influenceLevel}/10
                        </Badge>
                      </div>
                      
                      {contact.notes && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm">{contact.notes}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-between mt-4 pt-3 border-t">
                        <Button variant="outline" size="sm" onClick={() => handleAction('callContact')} className="h-8">
                          <Phone className="h-3.5 w-3.5 mr-1.5" />
                          Sună
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleAction('emailContact')} className="h-8">
                          <Mail className="h-3.5 w-3.5 mr-1.5" />
                          Email
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Deals Tab */}
          <TabsContent value="deals" className="pt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => handleAction('addDeal')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Adaugă oportunitate
              </Button>
            </div>
            
            {customerDeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
                <BarChart3 className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-xl font-medium mb-2">Nicio oportunitate înregistrată</p>
                <p className="text-sm text-gray-500 mb-6 max-w-sm text-center">
                  Adaugă oportunități pentru a urmări potențialele afaceri cu această companie.
                </p>
                <Button onClick={() => handleAction('addDeal')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Adaugă prima oportunitate
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {customerDeals.map(deal => (
                  <Card key={deal.id} className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium">{deal.title}</h3>
                          <div className="flex flex-wrap gap-3 mt-2">
                            <Badge 
                              className={
                                deal.stage === 'Câștigat' 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                                  : deal.stage === 'Pierdut'
                                    ? 'bg-red-100 text-red-800 hover:bg-red-100'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                              }
                            >
                              {deal.stage}
                            </Badge>
                            <Badge variant="outline">
                              {deal.probability}% probabilitate
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-sm text-gray-500">Valoare</p>
                              <p className="text-lg font-medium">{formatCurrency(deal.amount)}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500">Data estimată închidere</p>
                              <p>{formatDate(deal.expectedCloseDate)}</p>
                              
                              {deal.actualCloseDate && (
                                <p className="text-sm text-green-600 mt-1">
                                  Închis la: {formatDate(deal.actualCloseDate)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleAction('viewDeal')}>
                            Vezi detalii
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleAction('editDeal')}>
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Editează
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Progres</span>
                          <span className="font-medium">{deal.probability}%</span>
                        </div>
                        <Progress value={deal.probability} className="h-2 mt-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Activities Tab */}
          <TabsContent value="activities" className="pt-6">
            <div className="flex justify-end mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Adaugă activitate
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleAction('addCall')}>
                    <Phone className="h-4 w-4 mr-2" />
                    Înregistrează apel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction('scheduleMeeting')}>
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Programează întâlnire
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction('sendEmail')}>
                    <Mail className="h-4 w-4 mr-2" />
                    Trimite email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction('createTask')}>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Crează sarcină
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {customerActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
                <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-xl font-medium mb-2">Nicio activitate înregistrată</p>
                <p className="text-sm text-gray-500 mb-6 max-w-sm text-center">
                  Înregistrează activități cum ar fi apeluri, întâlniri sau email-uri pentru a urmări interacțiunile cu această companie.
                </p>
                <Button onClick={() => handleAction('addActivity')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Adaugă prima activitate
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {customerActivities.map(activity => (
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
                                {activity.endTime && ` - ${new Date(activity.endTime).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}`}
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
                              <Button variant="outline" size="sm" onClick={() => handleAction('viewActivity')}>
                                Vezi detalii
                              </Button>
                              {activity.status !== 'completed' && (
                                <Button variant="outline" size="sm" onClick={() => handleAction('completeActivity')}>
                                  Marchează ca completat
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Notes Tab */}
          <TabsContent value="notes" className="pt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => handleAction('addNote')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Adaugă notă
              </Button>
            </div>
            
            {customerNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
                <ClipboardList className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-xl font-medium mb-2">Nicio notă înregistrată</p>
                <p className="text-sm text-gray-500 mb-6 max-w-sm text-center">
                  Adaugă note pentru a păstra informații importante despre această companie.
                </p>
                <Button onClick={() => handleAction('addNote')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Adaugă prima notă
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {customerNotes.map(note => (
                  <Card key={note.id} className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium">{note.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDateTime(note.createdAt)} • {note.createdBy}
                          </p>
                          
                          <div className="mt-4">
                            <p className="text-sm whitespace-pre-line">{note.content}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Button variant="ghost" size="sm" onClick={() => handleAction('editNote')}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editează</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Documents Tab */}
          <TabsContent value="documents" className="pt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => handleAction('uploadDocument')}>
                <FileText className="h-4 w-4 mr-2" />
                Încarcă document
              </Button>
            </div>
            
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-xl font-medium mb-2">Niciun document încărcat</p>
              <p className="text-sm text-gray-500 mb-6 max-w-sm text-center">
                Încarcă documente relevante cum ar fi contracte, oferte sau alte materiale.
              </p>
              <Button onClick={() => handleAction('uploadDocument')}>
                <FileText className="h-4 w-4 mr-2" />
                Încarcă primul document
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Componenta de dialog pentru editare */}
        <CompanyFormDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          initialData={customer}
          isEditing={true}
          onSubmit={handleEditFormSubmit}
        />
      </div>
    </CRMModuleLayout>
  );
};

export default CustomerDetailPage;