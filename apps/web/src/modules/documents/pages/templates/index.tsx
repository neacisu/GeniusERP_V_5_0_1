/**
 * Document Templates Page
 * 
 * Manages document templates for various business processes,
 * allowing users to create, edit, and generate documents.
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import DocumentsModuleLayout from '../../components/common/DocumentsModuleLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Search, 
  Plus, 
  Settings, 
  Copy, 
  Edit, 
  Trash2, 
  FileOutput, 
  MoreHorizontal, 
  Clock,
  User,
  Pencil,
  Code,
  FilePlus2
} from 'lucide-react';

// Template types
export type TemplateType = 'contract' | 'invoice' | 'letter' | 'certificate' | 'report' | 'form' | 'other';

// Sample templates data
const templates = [
  {
    id: 'tpl-1001',
    name: 'Contract de Prestări Servicii',
    description: 'Contract standard pentru servicii profesionale',
    type: 'contract' as TemplateType,
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-02-18T14:45:00Z',
    createdBy: 'Alexandru Popescu',
    variables: ['client', 'serviciu', 'pret', 'dataStart', 'dataFinal'],
    lastUsed: '2025-03-18T14:45:00Z',
    usageCount: 24,
    category: 'legal',
  },
  {
    id: 'tpl-1002',
    name: 'Factură Fiscală',
    description: 'Factură standard conformă cu legislația din România',
    type: 'invoice' as TemplateType,
    createdAt: '2025-01-10T09:20:00Z',
    updatedAt: '2025-02-25T11:15:00Z',
    createdBy: 'Maria Ionescu',
    variables: ['client', 'cif', 'adresa', 'produse', 'valoare', 'tva', 'total'],
    lastUsed: '2025-03-25T11:15:00Z',
    usageCount: 137,
    category: 'accounting',
  },
  {
    id: 'tpl-1003',
    name: 'Adresă Oficială',
    description: 'Șablon pentru adrese și comunicări oficiale',
    type: 'letter' as TemplateType,
    createdAt: '2025-01-05T15:45:00Z',
    updatedAt: '2025-01-28T10:15:00Z',
    createdBy: 'Alexandru Popescu',
    variables: ['destinatar', 'subiect', 'continut', 'semnatar'],
    lastUsed: '2025-03-28T10:15:00Z',
    usageCount: 56,
    category: 'correspondence',
  },
  {
    id: 'tpl-1004',
    name: 'Proces Verbal de Recepție',
    description: 'Document pentru recepția mărfurilor sau serviciilor',
    type: 'form' as TemplateType,
    createdAt: '2025-01-20T11:30:00Z',
    updatedAt: '2025-02-05T13:45:00Z',
    createdBy: 'Elena Dumitrescu',
    variables: ['furnizor', 'produse', 'cantitate', 'data', 'responsabil'],
    lastUsed: '2025-03-15T13:45:00Z',
    usageCount: 42,
    category: 'operations',
  },
  {
    id: 'tpl-1005',
    name: 'Raport Activitate',
    description: 'Șablon pentru rapoarte lunare de activitate',
    type: 'report' as TemplateType,
    createdAt: '2025-01-25T14:20:00Z',
    updatedAt: '2025-02-10T09:10:00Z',
    createdBy: 'Andrei Vasilescu',
    variables: ['angajat', 'luna', 'activitati', 'rezultate', 'concluzii'],
    lastUsed: '2025-03-10T09:10:00Z',
    usageCount: 18,
    category: 'hr',
  },
  {
    id: 'tpl-1006',
    name: 'Contract de Muncă',
    description: 'Contract individual de muncă conform legislației',
    type: 'contract' as TemplateType,
    createdAt: '2025-01-30T16:45:00Z',
    updatedAt: '2025-02-12T14:30:00Z',
    createdBy: 'Cristina Popa',
    variables: ['angajat', 'functie', 'salariu', 'dataAngajare', 'perioadaProba'],
    lastUsed: '2025-03-22T14:30:00Z',
    usageCount: 15,
    category: 'hr',
  },
  {
    id: 'tpl-1007',
    name: 'Certificat de Garanție',
    description: 'Certificat de garanție pentru produse',
    type: 'certificate' as TemplateType,
    createdAt: '2025-02-05T10:15:00Z',
    updatedAt: '2025-02-15T11:30:00Z',
    createdBy: 'Mihai Ionescu',
    variables: ['client', 'produs', 'serieProodus', 'dataAchizitie', 'perioadaGarantie'],
    lastUsed: '2025-03-16T11:30:00Z',
    usageCount: 31,
    category: 'sales',
  },
];

// Template categories
const templateCategories = [
  { id: 'all', name: 'Toate categoriile' },
  { id: 'legal', name: 'Juridic' },
  { id: 'accounting', name: 'Contabilitate' },
  { id: 'correspondence', name: 'Corespondență' },
  { id: 'operations', name: 'Operațional' },
  { id: 'hr', name: 'Resurse Umane' },
  { id: 'sales', name: 'Vânzări' },
];

/**
 * Document Templates Page Component
 */
const TemplatesPage: React.FC = () => {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState({
    name: '',
    description: '',
    type: 'letter' as TemplateType,
    category: 'correspondence',
  });
  
  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Filter templates
  const filteredTemplates = templates.filter(template => {
    // Apply category filter
    if (selectedCategory !== 'all' && template.category !== selectedCategory) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Handle template edit
  const handleEditTemplate = (id: string) => {
    toast({
      title: "Editare șablon",
      description: `Se deschide editorul pentru șablonul cu ID: ${id}`,
    });
    // In a real app, this would navigate to the editor page
  };
  
  // Handle template duplicate
  const handleDuplicateTemplate = (id: string) => {
    toast({
      title: "Duplicare șablon",
      description: `Șablonul cu ID: ${id} a fost duplicat cu succes`,
    });
    // In a real app, this would duplicate the template
  };
  
  // Handle template delete
  const handleDeleteTemplate = (id: string) => {
    toast({
      title: "Ștergere șablon",
      description: `Șablonul cu ID: ${id} a fost șters cu succes`,
      variant: "destructive",
    });
    // In a real app, this would delete the template
  };
  
  // Handle template create
  const handleCreateTemplate = () => {
    toast({
      title: "Creare șablon",
      description: "Șablonul a fost creat cu succes",
    });
    
    setIsNewTemplateDialogOpen(false);
    setNewTemplateData({
      name: '',
      description: '',
      type: 'letter',
      category: 'correspondence',
    });
    
    // In a real app, this would create a new template
  };
  
  // Handle template generate
  const handleGenerateDocument = (id: string) => {
    toast({
      title: "Generare document",
      description: `Se generează un document nou din șablonul cu ID: ${id}`,
    });
    // In a real app, this would navigate to the document generation page
  };
  
  // Get template type readable name
  const getTemplateTypeName = (type: TemplateType) => {
    switch (type) {
      case 'contract': return 'Contract';
      case 'invoice': return 'Factură';
      case 'letter': return 'Adresă';
      case 'certificate': return 'Certificat';
      case 'report': return 'Raport';
      case 'form': return 'Formular';
      case 'other': return 'Altele';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO');
  };
  
  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = templateCategories.find(c => c.id === categoryId);
    return category ? category.name : 'Necunoscut';
  };
  
  return (
    <DocumentsModuleLayout activeTab="templates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mx-4 mt-4">
          <div>
            <h2 className="text-2xl font-bold">Șabloane Documente</h2>
            <p className="text-sm text-muted-foreground">
              Creați și gestionați șabloane pentru diverse tipuri de documente
            </p>
          </div>
          
          <Dialog open={isNewTemplateDialogOpen} onOpenChange={setIsNewTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Șablon Nou
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Creare Șablon Nou</DialogTitle>
                <DialogDescription>
                  Completați informațiile de bază pentru noul șablon de document.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="template-name" className="text-right">
                    Nume șablon
                  </Label>
                  <Input
                    id="template-name"
                    placeholder="Numele șablonului"
                    className="col-span-3"
                    value={newTemplateData.name}
                    onChange={(e) => setNewTemplateData({ ...newTemplateData, name: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="template-description" className="text-right">
                    Descriere
                  </Label>
                  <Input
                    id="template-description"
                    placeholder="Descriere scurtă a șablonului"
                    className="col-span-3"
                    value={newTemplateData.description}
                    onChange={(e) => setNewTemplateData({ ...newTemplateData, description: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="template-type" className="text-right">
                    Tip document
                  </Label>
                  <Select 
                    value={newTemplateData.type} 
                    onValueChange={(value: TemplateType) => setNewTemplateData({ ...newTemplateData, type: value })}
                  >
                    <SelectTrigger id="template-type" className="col-span-3">
                      <SelectValue placeholder="Selectați tipul documentului" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="letter">Adresă/Scrisoare</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="invoice">Factură</SelectItem>
                      <SelectItem value="certificate">Certificat</SelectItem>
                      <SelectItem value="report">Raport</SelectItem>
                      <SelectItem value="form">Formular</SelectItem>
                      <SelectItem value="other">Alt tip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="template-category" className="text-right">
                    Categorie
                  </Label>
                  <Select 
                    value={newTemplateData.category} 
                    onValueChange={(value) => setNewTemplateData({ ...newTemplateData, category: value })}
                  >
                    <SelectTrigger id="template-category" className="col-span-3">
                      <SelectValue placeholder="Selectați categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {templateCategories.filter(c => c.id !== 'all').map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-4 flex justify-start pl-[30%]">
                  <div className="flex gap-2 items-center text-sm text-muted-foreground">
                    <Code className="h-4 w-4" />
                    <span>După creare, veți putea defini conținutul și variabilele șablonului în editor.</span>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewTemplateDialogOpen(false)}
                >
                  Anulează
                </Button>
                <Button type="submit" onClick={handleCreateTemplate}>
                  Creează Șablon
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Search & Filter */}
        <div className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută șabloane..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="w-full md:w-[200px]">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                {templateCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Template Types Tabs */}
        <div className="px-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full max-w-[600px] mb-4">
              <TabsTrigger value="all">Toate</TabsTrigger>
              <TabsTrigger value="contract">Contracte</TabsTrigger>
              <TabsTrigger value="invoice">Facturi</TabsTrigger>
              <TabsTrigger value="letter">Adrese</TabsTrigger>
              <TabsTrigger value="report">Rapoarte</TabsTrigger>
              <TabsTrigger value="form">Formulare</TabsTrigger>
            </TabsList>
            
            {/* All templates */}
            <TabsContent value="all" className="mt-0 space-y-6">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex justify-between items-center">
                    <span>Toate Șabloanele</span>
                    <div className="text-sm font-normal text-muted-foreground">
                      {filteredTemplates.length} șabloane găsite
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nume Șablon</TableHead>
                          <TableHead>Tip</TableHead>
                          <TableHead className="hidden md:table-cell">Categorie</TableHead>
                          <TableHead className="hidden md:table-cell">Utilizări</TableHead>
                          <TableHead className="hidden lg:table-cell">Modificat</TableHead>
                          <TableHead className="text-right">Acțiuni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTemplates.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  Nu au fost găsite șabloane care să corespundă criteriilor.
                                </p>
                                <Button
                                  variant="link"
                                  onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('all');
                                  }}
                                  className="mt-2"
                                >
                                  Resetează filtrele
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTemplates.map((template) => (
                            <TableRow key={template.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary" />
                                  <div>
                                    <div className="font-medium">{template.name}</div>
                                    <div className="text-xs text-muted-foreground">{template.description}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {getTemplateTypeName(template.type)}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {getCategoryName(template.category)}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex items-center">
                                  <div className="mr-2">{template.usageCount}</div>
                                  <div className="text-xs text-muted-foreground flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>Ultima: {formatDate(template.lastUsed)}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <span className="mr-1">{formatDate(template.updatedAt)}</span>
                                  <span>de</span>
                                  <User className="h-3 w-3 mx-1" />
                                  <span>{template.createdBy}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-8"
                                    onClick={() => handleGenerateDocument(template.id)}
                                  >
                                    <FilePlus2 className="h-4 w-4 mr-1" />
                                    <span>Generează</span>
                                  </Button>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Opțiuni Șablon</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleEditTemplate(template.id)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Editează</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDuplicateTemplate(template.id)}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        <span>Duplică</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteTemplate(template.id)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Șterge</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              
              {/* Template Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templateCategories.filter(c => c.id !== 'all').map(category => {
                  const categoryTemplates = templates.filter(t => t.category === category.id);
                  return (
                    <Card key={category.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription>
                          {categoryTemplates.length} șabloane disponibile
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-2">
                          {categoryTemplates.slice(0, 3).map(template => (
                            <div key={template.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="font-medium">{template.name}</span>
                              </div>
                              <Badge variant="outline">{getTemplateTypeName(template.type)}</Badge>
                            </div>
                          ))}
                          {categoryTemplates.length > 3 && (
                            <div className="text-center text-sm text-muted-foreground pt-1">
                              + {categoryTemplates.length - 3} mai multe șabloane
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <span>Vizualizare categorie</span>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
            
            {/* Type-specific tabs */}
            {['contract', 'invoice', 'letter', 'report', 'form'].map(templateType => (
              <TabsContent key={templateType} value={templateType} className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{getTemplateTypeName(templateType as TemplateType)}e</CardTitle>
                    <CardDescription>
                      Șabloane de tip {getTemplateTypeName(templateType as TemplateType).toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nume Șablon</TableHead>
                            <TableHead className="hidden md:table-cell">Categorie</TableHead>
                            <TableHead className="hidden md:table-cell">Utilizări</TableHead>
                            <TableHead className="hidden lg:table-cell">Modificat</TableHead>
                            <TableHead className="text-right">Acțiuni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTemplates
                            .filter(t => t.type === templateType)
                            .map((template) => (
                              <TableRow key={template.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <div>
                                      <div className="font-medium">{template.name}</div>
                                      <div className="text-xs text-muted-foreground">{template.description}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {getCategoryName(template.category)}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <div className="flex items-center">
                                    <div className="mr-2">{template.usageCount}</div>
                                    <div className="text-xs text-muted-foreground flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      <span>Ultima: {formatDate(template.lastUsed)}</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <span className="mr-1">{formatDate(template.updatedAt)}</span>
                                    <span>de</span>
                                    <User className="h-3 w-3 mx-1" />
                                    <span>{template.createdBy}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end gap-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="h-8"
                                      onClick={() => handleGenerateDocument(template.id)}
                                    >
                                      <FilePlus2 className="h-4 w-4 mr-1" />
                                      <span>Generează</span>
                                    </Button>
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Opțiuni Șablon</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleEditTemplate(template.id)}>
                                          <Edit className="mr-2 h-4 w-4" />
                                          <span>Editează</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDuplicateTemplate(template.id)}>
                                          <Copy className="mr-2 h-4 w-4" />
                                          <span>Duplică</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteTemplate(template.id)}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          <span>Șterge</span>
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
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </DocumentsModuleLayout>
  );
};

export default TemplatesPage;