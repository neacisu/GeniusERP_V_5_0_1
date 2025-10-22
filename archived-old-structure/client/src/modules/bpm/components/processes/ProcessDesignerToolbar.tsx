/**
 * Process Designer Toolbar Component
 * 
 * Componenta avansată pentru bara de instrumente a designerului de procese
 * Permite utilizatorilor să adauge, editeze și configureze elemente de proces
 */

import React, { useState } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Circle,
  Square,
  CircleOff,
  Diamond,
  GitBranch,
  Workflow,
  Clock,
  Mail,
  MessageSquare,
  FileText,
  Database,
  Code,
  UserCheck,
  XCircle,
  CheckCircle,
  Settings,
  Edit,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  HelpCircle,
  Search,
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  Copy,
  Trash2,
  Timer
} from 'lucide-react';

export interface ProcessElementType {
  id: string;
  type: string;
  category: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

export interface ProcessDesignerToolbarProps {
  activeElement?: ProcessElementType | null;
  onSelectElement: (element: ProcessElementType) => void;
  onSaveProcess: () => void;
  onTestProcess: () => void;
  onDeleteElement: () => void;
  onCopyElement: () => void;
}

const ProcessDesignerToolbar: React.FC<ProcessDesignerToolbarProps> = ({
  activeElement,
  onSelectElement,
  onSaveProcess,
  onTestProcess,
  onDeleteElement,
  onCopyElement
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('elements');

  // Process element categories
  const elementCategories = [
    {
      id: 'events',
      name: 'Evenimente',
      elements: [
        {
          id: 'start-event',
          type: 'startEvent',
          category: 'events',
          name: 'Eveniment Start',
          description: 'Marchează începutul unui proces',
          icon: <Circle className="h-5 w-5 text-green-500" />
        },
        {
          id: 'end-event',
          type: 'endEvent',
          category: 'events',
          name: 'Eveniment Sfârșit',
          description: 'Marchează sfârșitul unui proces',
          icon: <CircleOff className="h-5 w-5 text-red-500" />
        },
        {
          id: 'timer-event',
          type: 'timerEvent',
          category: 'events',
          name: 'Eveniment Timp',
          description: 'Declanșează un proces la un moment specific',
          icon: <Clock className="h-5 w-5 text-blue-500" />
        },
        {
          id: 'message-event',
          type: 'messageEvent',
          category: 'events',
          name: 'Eveniment Mesaj',
          description: 'Declanșează un proces la primirea unui mesaj',
          icon: <Mail className="h-5 w-5 text-blue-500" />
        },
        {
          id: 'error-event',
          type: 'errorEvent',
          category: 'events',
          name: 'Eveniment Eroare',
          description: 'Gestionează erorile în cadrul procesului',
          icon: <AlertCircle className="h-5 w-5 text-amber-500" />
        }
      ]
    },
    {
      id: 'activities',
      name: 'Activități',
      elements: [
        {
          id: 'task',
          type: 'task',
          category: 'activities',
          name: 'Activitate',
          description: 'Activitate standard care necesită execuție',
          icon: <Square className="h-5 w-5 text-blue-500" />
        },
        {
          id: 'user-task',
          type: 'userTask',
          category: 'activities',
          name: 'Activitate Utilizator',
          description: 'Activitate ce necesită interacțiune umană',
          icon: <UserCheck className="h-5 w-5 text-blue-500" />
        },
        {
          id: 'service-task',
          type: 'serviceTask',
          category: 'activities',
          name: 'Activitate Serviciu',
          description: 'Activitate automată executată de sistem',
          icon: <Code className="h-5 w-5 text-blue-500" />
        },
        {
          id: 'script-task',
          type: 'scriptTask',
          category: 'activities',
          name: 'Activitate Script',
          description: 'Execută un script în cadrul procesului',
          icon: <FileText className="h-5 w-5 text-blue-500" />
        },
        {
          id: 'subprocess',
          type: 'subprocess',
          category: 'activities',
          name: 'Subproces',
          description: 'Încorporează un alt proces în procesul curent',
          icon: <Workflow className="h-5 w-5 text-purple-500" />
        }
      ]
    },
    {
      id: 'gateways',
      name: 'Gateway-uri',
      elements: [
        {
          id: 'exclusive-gateway',
          type: 'exclusiveGateway',
          category: 'gateways',
          name: 'Gateway Exclusiv',
          description: 'Ramifică procesul pe o singură cale',
          icon: <Diamond className="h-5 w-5 text-amber-500" />
        },
        {
          id: 'parallel-gateway',
          type: 'parallelGateway',
          category: 'gateways',
          name: 'Gateway Paralel',
          description: 'Ramifică procesul pe mai multe căi executate în paralel',
          icon: <Diamond className="h-5 w-5 text-amber-500" />
        },
        {
          id: 'inclusive-gateway',
          type: 'inclusiveGateway',
          category: 'gateways',
          name: 'Gateway Inclusiv',
          description: 'Ramifică procesul pe una sau mai multe căi',
          icon: <Diamond className="h-5 w-5 text-amber-500" />
        }
      ]
    },
    {
      id: 'connectors',
      name: 'Conectori',
      elements: [
        {
          id: 'sequence-flow',
          type: 'sequenceFlow',
          category: 'connectors',
          name: 'Flux Secvențial',
          description: 'Conectează elemente și definește fluxul procesului',
          icon: <ArrowRight className="h-5 w-5 text-gray-500" />
        },
        {
          id: 'conditional-flow',
          type: 'conditionalFlow',
          category: 'connectors',
          name: 'Flux Condițional',
          description: 'Conectează elemente cu o condiție pentru execuție',
          icon: <GitBranch className="h-5 w-5 text-gray-500" />
        }
      ]
    },
    {
      id: 'data',
      name: 'Date',
      elements: [
        {
          id: 'data-object',
          type: 'dataObject',
          category: 'data',
          name: 'Obiect Date',
          description: 'Reprezintă date utilizate în proces',
          icon: <FileText className="h-5 w-5 text-gray-500" />
        },
        {
          id: 'data-store',
          type: 'dataStore',
          category: 'data',
          name: 'Depozit Date',
          description: 'Reprezintă un sistem de stocare a datelor',
          icon: <Database className="h-5 w-5 text-gray-500" />
        }
      ]
    }
  ];

  // Filter elements based on search query
  const filteredElements = elementCategories.map(category => ({
    ...category,
    elements: category.elements.filter(element => 
      element.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      element.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.elements.length > 0);

  // Render element item
  const renderElementItem = (element: ProcessElementType) => (
    <div 
      key={element.id}
      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
      onClick={() => onSelectElement(element)}
    >
      <div className="flex-shrink-0">
        {element.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{element.name}</p>
        <p className="text-xs text-muted-foreground truncate">{element.description}</p>
      </div>
    </div>
  );

  // Properties panel for the active element
  const renderPropertiesPanel = () => {
    if (!activeElement) {
      return (
        <div className="flex flex-col items-center justify-center h-[400px] text-center p-6">
          <HelpCircle className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Niciun element selectat</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Selectați un element din diagrama procesului pentru a vizualiza și edita proprietățile acestuia.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 p-4">
        <div>
          <Label htmlFor="element-name">Nume element</Label>
          <Input id="element-name" defaultValue={activeElement.name} className="mt-1" />
        </div>
        
        <div>
          <Label htmlFor="element-description">Descriere</Label>
          <Input id="element-description" defaultValue={activeElement.description} className="mt-1" />
        </div>
        
        <Separator />
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced">
            <AccordionTrigger>Proprietăți avansate</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-async">Execuție asincronă</Label>
                  <Switch id="is-async" />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-retryable">Permite reîncercări</Label>
                  <Switch id="is-retryable" />
                </div>
                
                {activeElement.type === 'timerEvent' && (
                  <div>
                    <Label htmlFor="timer-definition">Definiție temporizator</Label>
                    <div className="flex gap-2 mt-1">
                      <Input id="timer-definition" placeholder="e.g. PT1H" />
                      <Button variant="outline" size="icon">
                        <Timer className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Format ISO 8601 pentru durată (e.g. PT1H = 1 oră)
                    </p>
                  </div>
                )}
                
                {(activeElement.type === 'task' || activeElement.type === 'serviceTask') && (
                  <div>
                    <Label htmlFor="implementation">Implementare</Label>
                    <Input id="implementation" placeholder="numele.functiei" className="mt-1" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Implementarea care va fi executată pentru această activitate
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="documentation">
            <AccordionTrigger>Documentație</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Documentație pentru elementul <strong>{activeElement.name}</strong>.
                </p>
                
                <div>
                  <Badge variant="outline" className="mb-2">{activeElement.type}</Badge>
                  <p className="text-sm">
                    {activeElement.description}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="element-docs">Note de documentație</Label>
                  <Input id="element-docs" placeholder="Adăugați note de documentație" className="mt-1" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onCopyElement} className="flex-1">
            <Copy className="h-4 w-4 mr-2" />
            Duplică
          </Button>
          <Button variant="destructive" size="sm" onClick={onDeleteElement} className="flex-1">
            <Trash2 className="h-4 w-4 mr-2" />
            Șterge
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSaveProcess}>
            <Save className="h-4 w-4 mr-2" />
            Salvează
          </Button>
          <Button variant="outline" size="sm" onClick={onTestProcess}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Testează
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 py-2 border-b">
          <TabsList className="w-full">
            <TabsTrigger value="elements" className="flex-1">Elemente</TabsTrigger>
            <TabsTrigger value="properties" className="flex-1">Proprietăți</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="elements" className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Caută elemente..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4">
              {filteredElements.map(category => (
                <div key={category.id} className="mb-6">
                  <h3 className="text-sm font-medium mb-2">{category.name}</h3>
                  <div className="space-y-1">
                    {category.elements.map(renderElementItem)}
                  </div>
                </div>
              ))}
              
              {filteredElements.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nu s-au găsit elemente care să corespundă criteriilor de căutare.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="properties" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {renderPropertiesPanel()}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProcessDesignerToolbar;