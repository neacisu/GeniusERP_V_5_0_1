/**
 * CRM Contacts Page
 * 
 * Displays a list of contacts with filtering and search capabilities.
 */

import React, { useState } from 'react';
import { CRMModuleLayout } from '../../components/common/CRMModuleLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Filter, Mail, Phone, Plus, Search, User, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Sample contact data
const contacts = [
  { 
    id: '1', 
    firstName: 'Ion',
    lastName: 'Ionescu', 
    company: 'Acme SRL',
    companyId: '1',
    title: 'Director General', 
    email: 'ion.ionescu@acme.ro', 
    phone: '0721 234 567', 
    type: 'decision-maker',
    department: 'Management',
  },
  { 
    id: '2', 
    firstName: 'Maria',
    lastName: 'Popescu', 
    company: 'TechSoft Solutions',
    companyId: '2',
    title: 'Director Financiar', 
    email: 'maria.popescu@techsoft.ro', 
    phone: '0722 345 678', 
    type: 'decision-maker',
    department: 'Financiar',
  },
  { 
    id: '3', 
    firstName: 'George',
    lastName: 'Popa', 
    company: 'MediCare Plus',
    companyId: '3',
    title: 'Manager Achiziții', 
    email: 'george.popa@medicare.ro', 
    phone: '0723 456 789', 
    type: 'influencer',
    department: 'Achiziții',
  },
  { 
    id: '4', 
    firstName: 'Ana',
    lastName: 'Dumitrescu', 
    company: 'MediCare Plus',
    companyId: '3',
    title: 'Director Marketing', 
    email: 'ana.dumitrescu@medicare.ro', 
    phone: '0724 567 890', 
    type: 'decision-maker',
    department: 'Marketing',
  },
  { 
    id: '5', 
    firstName: 'Mihai',
    lastName: 'Stanescu', 
    company: 'Acme SRL',
    companyId: '1',
    title: 'Manager Vânzări', 
    email: 'mihai.stanescu@acme.ro', 
    phone: '0725 678 901', 
    type: 'influencer',
    department: 'Vânzări',
  },
  {
    id: '6',
    firstName: 'Elena',
    lastName: 'Vasilescu',
    company: 'Construct Expert',
    companyId: '4',
    title: 'Director Operațiuni',
    email: 'elena.vasilescu@constructexpert.ro',
    phone: '0726 789 012',
    type: 'decision-maker',
    department: 'Operațiuni',
  },
  {
    id: '7',
    firstName: 'Alexandru',
    lastName: 'Munteanu',
    company: 'AgriTech International',
    companyId: '5',
    title: 'Director Tehnic',
    email: 'alexandru.munteanu@agritech.ro',
    phone: '0727 890 123',
    type: 'influencer',
    department: 'IT',
  },
];

const ContactsPage: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  // Get unique companies for filter dropdown
  const companies = [...new Set(contacts.map(contact => contact.company))];
  
  // Get unique departments for filter dropdown
  const departments = [...new Set(contacts.map(contact => contact.department))];
  
  // Filter contacts based on search and filters
  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                         (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (contact.title && contact.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCompany = companyFilter === 'all' || contact.company === companyFilter;
    const matchesType = typeFilter === 'all' || contact.type === typeFilter;
    const matchesDepartment = departmentFilter === 'all' || contact.department === departmentFilter;
    
    return matchesSearch && matchesCompany && matchesType && matchesDepartment;
  });
  
  const handleAddContact = () => {
    toast({
      title: "Adaugă contact",
      description: "Funcționalitate în curând disponibilă.",
    });
  };
  
  // Get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  // Reset all filters
  const resetFilters = () => {
    setCompanyFilter('all');
    setTypeFilter('all');
    setDepartmentFilter('all');
  };
  
  return (
    <CRMModuleLayout activeTab="contacts">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Contacte</h1>
          </div>
          <Button onClick={handleAddContact} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Adaugă Contact
          </Button>
        </div>
        
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-3 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Caută după nume, email sau titlu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Companie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate companiile</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate tipurile</SelectItem>
                <SelectItem value="decision-maker">Decident</SelectItem>
                <SelectItem value="influencer">Influencer</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Departament" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate departamentele</SelectItem>
                {departments.map(department => (
                  <SelectItem key={department} value={department}>{department}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={resetFilters} className="h-10">
              <Filter className="h-4 w-4 mr-2" />
              Resetează
            </Button>
          </div>
        </div>
        
        {/* Filter Pills - Show active filters */}
        {(companyFilter !== 'all' || typeFilter !== 'all' || departmentFilter !== 'all') && (
          <div className="flex flex-wrap gap-2 pb-3">
            {companyFilter !== 'all' && (
              <div className="bg-primary/10 text-primary text-xs py-1 px-2.5 rounded-full flex items-center">
                Companie: {companyFilter}
                <button 
                  className="ml-1.5 text-primary/80 hover:text-primary" 
                  onClick={() => setCompanyFilter('all')}
                >
                  ✕
                </button>
              </div>
            )}
            
            {typeFilter !== 'all' && (
              <div className="bg-primary/10 text-primary text-xs py-1 px-2.5 rounded-full flex items-center">
                Tip: {typeFilter === 'decision-maker' ? 'Decident' : 'Influencer'}
                <button 
                  className="ml-1.5 text-primary/80 hover:text-primary" 
                  onClick={() => setTypeFilter('all')}
                >
                  ✕
                </button>
              </div>
            )}
            
            {departmentFilter !== 'all' && (
              <div className="bg-primary/10 text-primary text-xs py-1 px-2.5 rounded-full flex items-center">
                Departament: {departmentFilter}
                <button 
                  className="ml-1.5 text-primary/80 hover:text-primary" 
                  onClick={() => setDepartmentFilter('all')}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Results Count */}
        <div className="text-sm text-gray-500">
          {filteredContacts.length} {filteredContacts.length === 1 ? 'contact găsit' : 'contacte găsite'}
        </div>
        
        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="h-full shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(contact.firstName, contact.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="text-lg font-medium">
                      {contact.firstName} {contact.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{contact.title}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center text-sm">
                    <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                    <a href={`/crm/customers/${contact.companyId}`} className="text-primary hover:underline">
                      {contact.company}
                    </a>
                  </div>
                  
                  <Badge 
                    variant={contact.type === 'decision-maker' ? 'default' : 'outline'}
                    className={
                      contact.type === 'decision-maker' 
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' 
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                    }
                  >
                    {contact.type === 'decision-maker' ? 'Decident' : 'Influencer'}
                  </Badge>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                      {contact.email}
                    </a>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                      {contact.phone}
                    </a>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">Sună</Button>
                  <Button variant="outline" size="sm" className="flex-1">Email</Button>
                  <Button variant="outline" size="sm" className="flex-1">Detalii</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredContacts.length === 0 && (
            <div className="col-span-full py-10 text-center">
              <User className="h-10 w-10 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">Niciun contact găsit</h3>
              <p className="mt-1 text-gray-500">Ajustează filtrele sau adaugă un contact nou.</p>
            </div>
          )}
        </div>
      </div>
    </CRMModuleLayout>
  );
};

export default ContactsPage;