/**
 * CRM Settings Page
 * 
 * Provides configuration options for the CRM module including
 * fields customization, pipeline settings, and general preferences.
 */

import React from 'react';
import { CRMModuleLayout } from '../../components/common/CRMModuleLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BadgePlus, 
  Contact, 
  DatabaseZap, 
  Download,
  FileCode, 
  Globe, 
  Lock, 
  Mail, 
  MessageSquare, 
  Save, 
  ScrollText, 
  Settings as SettingsIcon, 
  Tag, 
  User 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  
  // Handle save settings
  const handleSaveSettings = () => {
    toast({
      title: "Setări salvate",
      description: "Setările au fost actualizate cu succes.",
    });
  };
  
  // Handle import/export
  const handleImportExport = (action: string) => {
    toast({
      title: `${action} date`,
      description: "Funcționalitate în curând disponibilă.",
    });
  };
  
  // Handle field action
  const handleFieldAction = (action: string, fieldName: string) => {
    toast({
      title: `${action} câmp`,
      description: `Acțiune pentru câmpul: ${fieldName}`,
    });
  };
  
  // Sample field types
  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Text lung' },
    { value: 'number', label: 'Număr' },
    { value: 'currency', label: 'Valută' },
    { value: 'date', label: 'Dată' },
    { value: 'datetime', label: 'Dată și oră' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Telefon' },
    { value: 'url', label: 'URL' },
    { value: 'select', label: 'Selecție' },
    { value: 'multiselect', label: 'Selecție multiplă' },
    { value: 'checkbox', label: 'Bifă' },
    { value: 'user', label: 'Utilizator' },
    { value: 'company', label: 'Companie' },
    { value: 'contact', label: 'Contact' }
  ];
  
  // Sample custom fields for companies
  const companyCustomFields = [
    { 
      id: 'cf1', 
      name: 'Industrie',
      type: 'select',
      required: true,
      options: 'IT, Manufacturing, Retail, Healthcare, Financial Services',
      defaultValue: '',
      displayOrder: 1
    },
    { 
      id: 'cf2', 
      name: 'Număr Angajați',
      type: 'number',
      required: false,
      options: '',
      defaultValue: '',
      displayOrder: 2
    },
    { 
      id: 'cf3', 
      name: 'Website',
      type: 'url',
      required: false,
      options: '',
      defaultValue: '',
      displayOrder: 3
    },
    { 
      id: 'cf4', 
      name: 'Relație Partener',
      type: 'select',
      required: false,
      options: 'Client, Prospect, Partener, Furnizor',
      defaultValue: 'Prospect',
      displayOrder: 4
    }
  ];
  
  // Sample contact fields
  const contactCustomFields = [
    { 
      id: 'cf5', 
      name: 'Poziție',
      type: 'text',
      required: true,
      options: '',
      defaultValue: '',
      displayOrder: 1
    },
    { 
      id: 'cf6', 
      name: 'Departament',
      type: 'select',
      required: false,
      options: 'Management, Financiar, IT, Marketing, Vânzări, HR, Operațiuni',
      defaultValue: '',
      displayOrder: 2
    },
    { 
      id: 'cf7', 
      name: 'Limba preferată',
      type: 'select',
      required: false,
      options: 'Română, Engleză, Franceză, Germană',
      defaultValue: 'Română',
      displayOrder: 3
    }
  ];
  
  // Sample deal fields
  const dealCustomFields = [
    { 
      id: 'cf8', 
      name: 'Sursă',
      type: 'select',
      required: true,
      options: 'Website, Referral, Cold Call, Event, Social Media',
      defaultValue: '',
      displayOrder: 1
    },
    { 
      id: 'cf9', 
      name: 'Prioritate',
      type: 'select',
      required: false,
      options: 'Scăzută, Medie, Ridicată',
      defaultValue: 'Medie',
      displayOrder: 2
    },
    { 
      id: 'cf10', 
      name: 'Competitori',
      type: 'textarea',
      required: false,
      options: '',
      defaultValue: '',
      displayOrder: 3
    }
  ];
  
  return (
    <CRMModuleLayout activeTab="settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Setări CRM</h1>
          </div>
          
          <Button onClick={handleSaveSettings} className="bg-primary hover:bg-primary/90">
            <Save className="h-4 w-4 mr-2" />
            Salvează Setări
          </Button>
        </div>
        
        <Tabs defaultValue="fields" className="w-full">
          <TabsList className="w-full justify-start mb-4 overflow-x-auto">
            <TabsTrigger value="fields" className="gap-1">
              <DatabaseZap className="h-4 w-4" />
              <span>Personalizare Câmpuri</span>
            </TabsTrigger>
            <TabsTrigger value="pipelines" className="gap-1">
              <ScrollText className="h-4 w-4" />
              <span>Pipeline-uri</span>
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-1">
              <Tag className="h-4 w-4" />
              <span>Etichete</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-1">
              <Mail className="h-4 w-4" />
              <span>Email Templates</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-1">
              <FileCode className="h-4 w-4" />
              <span>Automatizări</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-1">
              <Globe className="h-4 w-4" />
              <span>Integrări</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1">
              <Lock className="h-4 w-4" />
              <span>Securitate</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-1">
              <DatabaseZap className="h-4 w-4" />
              <span>Import/Export</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Fields Customization Tab */}
          <TabsContent value="fields" className="p-0 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Personalizare Câmpuri CRM</CardTitle>
                <CardDescription>
                  Configurează câmpurile pentru companii, contacte și oportunități.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="companies">
                  <TabsList className="mb-4">
                    <TabsTrigger value="companies" className="gap-1">
                      <Building className="h-4 w-4" />
                      <span>Companii</span>
                    </TabsTrigger>
                    <TabsTrigger value="contacts" className="gap-1">
                      <Contact className="h-4 w-4" />
                      <span>Contacte</span>
                    </TabsTrigger>
                    <TabsTrigger value="deals" className="gap-1">
                      <ScrollText className="h-4 w-4" />
                      <span>Oportunități</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Companies Fields */}
                  <TabsContent value="companies" className="p-0 m-0">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Câmpuri Personalizate pentru Companii</h3>
                      <Button onClick={() => handleFieldAction('add', 'company')}>
                        <BadgePlus className="h-4 w-4 mr-2" />
                        Adaugă Câmp
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-[380px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nume Câmp</TableHead>
                            <TableHead>Tip</TableHead>
                            <TableHead>Obligatoriu</TableHead>
                            <TableHead>Valori Posibile</TableHead>
                            <TableHead>Valoare Implicită</TableHead>
                            <TableHead>Ordine</TableHead>
                            <TableHead className="text-right">Acțiuni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {companyCustomFields.map(field => (
                            <TableRow key={field.id}>
                              <TableCell className="font-medium">{field.name}</TableCell>
                              <TableCell>
                                {fieldTypes.find(t => t.value === field.type)?.label || field.type}
                              </TableCell>
                              <TableCell>
                                {field.required ? 'Da' : 'Nu'}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {field.options}
                              </TableCell>
                              <TableCell>{field.defaultValue || '-'}</TableCell>
                              <TableCell>{field.displayOrder}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleFieldAction('edit', field.name)}
                                  className="h-8 px-2 mr-1"
                                >
                                  Editează
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleFieldAction('delete', field.name)}
                                  className="h-8 px-2 text-red-600 hover:text-red-700"
                                >
                                  Șterge
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                  
                  {/* Contacts Fields */}
                  <TabsContent value="contacts" className="p-0 m-0">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Câmpuri Personalizate pentru Contacte</h3>
                      <Button onClick={() => handleFieldAction('add', 'contact')}>
                        <BadgePlus className="h-4 w-4 mr-2" />
                        Adaugă Câmp
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-[380px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nume Câmp</TableHead>
                            <TableHead>Tip</TableHead>
                            <TableHead>Obligatoriu</TableHead>
                            <TableHead>Valori Posibile</TableHead>
                            <TableHead>Valoare Implicită</TableHead>
                            <TableHead>Ordine</TableHead>
                            <TableHead className="text-right">Acțiuni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contactCustomFields.map(field => (
                            <TableRow key={field.id}>
                              <TableCell className="font-medium">{field.name}</TableCell>
                              <TableCell>
                                {fieldTypes.find(t => t.value === field.type)?.label || field.type}
                              </TableCell>
                              <TableCell>
                                {field.required ? 'Da' : 'Nu'}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {field.options}
                              </TableCell>
                              <TableCell>{field.defaultValue || '-'}</TableCell>
                              <TableCell>{field.displayOrder}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleFieldAction('edit', field.name)}
                                  className="h-8 px-2 mr-1"
                                >
                                  Editează
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleFieldAction('delete', field.name)}
                                  className="h-8 px-2 text-red-600 hover:text-red-700"
                                >
                                  Șterge
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                  
                  {/* Deals Fields */}
                  <TabsContent value="deals" className="p-0 m-0">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Câmpuri Personalizate pentru Oportunități</h3>
                      <Button onClick={() => handleFieldAction('add', 'deal')}>
                        <BadgePlus className="h-4 w-4 mr-2" />
                        Adaugă Câmp
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-[380px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nume Câmp</TableHead>
                            <TableHead>Tip</TableHead>
                            <TableHead>Obligatoriu</TableHead>
                            <TableHead>Valori Posibile</TableHead>
                            <TableHead>Valoare Implicită</TableHead>
                            <TableHead>Ordine</TableHead>
                            <TableHead className="text-right">Acțiuni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dealCustomFields.map(field => (
                            <TableRow key={field.id}>
                              <TableCell className="font-medium">{field.name}</TableCell>
                              <TableCell>
                                {fieldTypes.find(t => t.value === field.type)?.label || field.type}
                              </TableCell>
                              <TableCell>
                                {field.required ? 'Da' : 'Nu'}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {field.options}
                              </TableCell>
                              <TableCell>{field.defaultValue || '-'}</TableCell>
                              <TableCell>{field.displayOrder}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleFieldAction('edit', field.name)}
                                  className="h-8 px-2 mr-1"
                                >
                                  Editează
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleFieldAction('delete', field.name)}
                                  className="h-8 px-2 text-red-600 hover:text-red-700"
                                >
                                  Șterge
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Pipelines Tab */}
          <TabsContent value="pipelines" className="p-0 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Configurare Pipeline-uri</CardTitle>
                <CardDescription>
                  Gestionează pipeline-urile și etapele disponibile pentru echipa ta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ScrollText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Configurare pipeline-uri disponibilă în pagina dedicată
                  </p>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                    Pentru a configura pipeline-urile și etapele, accesează pagina dedicată Pipeline-uri din meniul CRM.
                  </p>
                  <Button onClick={() => window.location.href = '/crm/pipelines'}>
                    Accesează Pipeline-uri
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tags Tab */}
          <TabsContent value="tags" className="p-0 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Etichete CRM</CardTitle>
                <CardDescription>
                  Configurează etichetele pentru organizarea companiilor, contactelor și oportunităților.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Etichete Existente</h3>
                      <Button onClick={() => handleFieldAction('add', 'tag')}>
                        <Tag className="h-4 w-4 mr-2" />
                        Adaugă Etichetă
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-[400px] border rounded-md p-4">
                      <div className="space-y-2">
                        <div className="p-2 border rounded-md flex justify-between items-center bg-primary/5">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                            <span>Client Important</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <SettingsIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="p-2 border rounded-md flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                            <span>Proiect Strategic</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <SettingsIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="p-2 border rounded-md flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-amber-500 mr-3"></div>
                            <span>Oportunitate Mare</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <SettingsIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="p-2 border rounded-md flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-purple-500 mr-3"></div>
                            <span>Contact Nou</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <SettingsIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="p-2 border rounded-md flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                            <span>Follow-up Urgent</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <SettingsIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Utilizare Etichete</h3>
                    
                    <div className="space-y-4 border rounded-md p-4">
                      <p className="text-sm text-gray-500">
                        Poți utiliza etichete pentru a categoriza și filtra ușor:
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">Companii</span>
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">Contacte</span>
                        </div>
                        <div className="flex items-center">
                          <ScrollText className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">Oportunități</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <p className="text-sm">
                        Etichetele pot fi adăugate direct din pagina de detalii a fiecărui element sau din listele generale.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Email Templates Tab */}
          <TabsContent value="email" className="p-0 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Template-uri de Email</CardTitle>
                <CardDescription>
                  Configurează template-uri pentru comunicare eficientă cu clienții.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Funcționalitate în curând disponibilă
                  </p>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                    Lucrăm la implementarea template-urilor de email pentru a facilita comunicarea cu clienții și prospecții.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Automation Tab */}
          <TabsContent value="automation" className="p-0 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Automatizări</CardTitle>
                <CardDescription>
                  Configurează automatizări și fluxuri de lucru pentru eficientizarea proceselor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileCode className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Funcționalitate în curând disponibilă
                  </p>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                    Lucrăm la implementarea automatizărilor pentru a facilita gestionarea proceselor repetitive din CRM.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Integrations Tab */}
          <TabsContent value="integrations" className="p-0 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Integrări</CardTitle>
                <CardDescription>
                  Conectează CRM-ul cu alte sisteme și aplicații.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Funcționalitate în curând disponibilă
                  </p>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                    Lucrăm la implementarea integrărilor cu alte sisteme și aplicații.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security" className="p-0 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Securitate și Permisiuni</CardTitle>
                <CardDescription>
                  Configurează securitatea și permisiunile pentru modulul CRM.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Setări Generale</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Înregistrare activitate utilizatori</Label>
                          <p className="text-sm text-muted-foreground">
                            Monitorizează toate modificările și acțiunile în CRM
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Restricționează accesul la datele sensibile</Label>
                          <p className="text-sm text-muted-foreground">
                            Limitează accesul la date financiare și contractuale
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Permisiuni de ștergere limitate</Label>
                          <p className="text-sm text-muted-foreground">
                            Doar administratorii pot șterge înregistrări
                          </p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Permisiuni pentru Roluri</h3>
                    <p className="text-sm text-gray-500">
                      Permisiunile și rolurile CRM sunt configurate în modulul de administrare.
                    </p>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/admin/roles'}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Configurează Roluri și Permisiuni
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Import/Export Tab */}
          <TabsContent value="data" className="p-0 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Import/Export Date</CardTitle>
                <CardDescription>
                  Importă și exportă date CRM pentru backup sau migrare.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Import Date</CardTitle>
                        <CardDescription>
                          Importă date din fișiere CSV sau Excel
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Tip Date</Label>
                            <Select defaultValue="companies">
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează tip date" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="companies">Companii</SelectItem>
                                <SelectItem value="contacts">Contacte</SelectItem>
                                <SelectItem value="deals">Oportunități</SelectItem>
                                <SelectItem value="activities">Activități</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Format Fișier</Label>
                            <Select defaultValue="csv">
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează format" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="csv">CSV</SelectItem>
                                <SelectItem value="excel">Excel</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <Button 
                            className="w-full" 
                            onClick={() => handleImportExport('import')}
                          >
                            Importă Date
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Export Date</CardTitle>
                        <CardDescription>
                          Exportă date în formate utilizabile
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Tip Date</Label>
                            <Select defaultValue="companies">
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează tip date" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="companies">Companii</SelectItem>
                                <SelectItem value="contacts">Contacte</SelectItem>
                                <SelectItem value="deals">Oportunități</SelectItem>
                                <SelectItem value="activities">Activități</SelectItem>
                                <SelectItem value="all">Toate datele</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Format Export</Label>
                            <Select defaultValue="csv">
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează format" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="csv">CSV</SelectItem>
                                <SelectItem value="excel">Excel</SelectItem>
                                <SelectItem value="json">JSON</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <Button 
                            className="w-full" 
                            onClick={() => handleImportExport('export')}
                          >
                            Exportă Date
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="pt-4">
                    <h3 className="text-lg font-medium mb-4">Backup & Restaurare</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" onClick={() => handleImportExport('backup')}>
                        <Download className="h-4 w-4 mr-2" />
                        Creează Backup Complet
                      </Button>
                      
                      <Button variant="outline" onClick={() => handleImportExport('restore')}>
                        <DatabaseZap className="h-4 w-4 mr-2" />
                        Restaurează din Backup
                      </Button>
                    </div>
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

// Define Building icon since it's missing from imported icons
const Building = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
);

export default SettingsPage;