/**
 * Document Templates Settings Page
 * 
 * Manages templates for generating PDF documents
 */

import React, { useState } from "react";
import { useUser } from "@/hooks/use-user";

import PageHeader from "../../components/common/PageHeader";
import TabsNav, { TabItem } from "../../components/common/TabsNav";
import SettingCard from "../../components/cards/SettingCard";
import FormSection from "../../components/forms/FormSection";
import { useSettingsApi } from "../../hooks/useSettingsApi";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash,
  Copy,
  Eye,
  Download,
  CheckCircle2,
  Loader2,
  Code,
  FileCode,
  Settings,
} from "lucide-react";

// Sample document templates
const documentTemplates = [
  {
    id: "1",
    name: "Factură Standard",
    type: "invoice",
    description: "Șablon standard pentru facturi fiscale",
    isDefault: true,
    createdAt: "2025-03-15",
    updatedAt: "2025-04-01",
  },
  {
    id: "2",
    name: "Factură Detaliată",
    type: "invoice",
    description: "Șablon detaliat cu mai multe informații despre produse",
    isDefault: false,
    createdAt: "2025-03-20",
    updatedAt: "2025-03-20",
  },
  {
    id: "3",
    name: "Proformă Standard",
    type: "proforma",
    description: "Șablon standard pentru facturi proforma",
    isDefault: true,
    createdAt: "2025-03-10",
    updatedAt: "2025-03-25",
  },
  {
    id: "4",
    name: "Chitanță Standard",
    type: "receipt",
    description: "Șablon standard pentru chitanțe",
    isDefault: true,
    createdAt: "2025-03-05",
    updatedAt: "2025-03-05",
  },
  {
    id: "5",
    name: "Aviz de Expediție",
    type: "shipping",
    description: "Șablon pentru avize de expediție",
    isDefault: true,
    createdAt: "2025-03-18",
    updatedAt: "2025-03-28",
  },
  {
    id: "6",
    name: "Ofertă Comercială",
    type: "offer",
    description: "Șablon pentru oferte comerciale",
    isDefault: true,
    createdAt: "2025-03-22",
    updatedAt: "2025-03-22",
  },
];

// Template types
const templateTypes = [
  { id: "invoice", name: "Factură Fiscală" },
  { id: "proforma", name: "Factură Proformă" },
  { id: "receipt", name: "Chitanță" },
  { id: "shipping", name: "Aviz de Expediție" },
  { id: "offer", name: "Ofertă Comercială" },
  { id: "contract", name: "Contract" },
];

// Define tabs for document templates settings
const documentTemplatesTabs: TabItem[] = [
  { id: "templates", label: "Șabloane", icon: FileText },
  { id: "variables", label: "Variabile", icon: Code },
  { id: "settings", label: "Setări", icon: Settings },
];

export default function DocumentTemplatesPage() {
  const [activeTab, setActiveTab] = useState("templates");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { user } = useUser();
  const companyId = user?.companyId;

  // Filter templates based on type and search term
  const filteredTemplates = documentTemplates.filter(
    (template) =>
      (selectedType === null || template.type === selectedType) &&
      (template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Open edit dialog
  const openEditDialog = (template: any) => {
    setSelectedTemplate(template);
    setIsDialogOpen(true);
  };

  // Open new template dialog
  const openNewDialog = () => {
    setSelectedTemplate(null);
    setIsDialogOpen(true);
  };

  // Open preview dialog
  const openPreviewDialog = (template: any) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  // Render templates list tab
  const renderTemplatesTab = () => (
    <SettingCard
      title="Șabloane Disponibile"
      description="Gestionați șabloanele utilizate pentru generarea de documente."
    >
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Căutare șabloane..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={selectedType || "all"}
            onValueChange={(value) =>
              setSelectedType(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toate tipurile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate tipurile</SelectItem>
              {templateTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nume Șablon</TableHead>
              <TableHead>Tip Document</TableHead>
              <TableHead>Descriere</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    {template.name}
                  </TableCell>
                  <TableCell>
                    {
                      templateTypes.find((t) => t.id === template.type)
                        ?.name
                    }
                  </TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>
                    {template.isDefault && (
                      <Badge variant="secondary">Implicit</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPreviewDialog(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      {!template.isDefault && (
                        <Button variant="ghost" size="sm">
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {searchTerm
                    ? "Nu au fost găsite șabloane care să corespundă căutării."
                    : "Nu există șabloane pentru acest tip de document."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </SettingCard>
  );

  // Render variables list tab
  const renderVariablesTab = () => (
    <SettingCard
      title="Variabile Disponibile"
      description="Utilizați aceste variabile în șabloanele dvs. pentru a insera informații dinamice."
    >
      <FormSection 
        title="Variabile de Date" 
        description="Variabile pentru datele primare ale companiei și clientului"
        columns={2}
      >
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Variabile Companie</h3>
          <div className="rounded-md border p-3">
            <div className="text-xs font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div>{"{{company.name}}"}</div>
                <div className="text-muted-foreground">
                  Numele companiei
                </div>
                <div>{"{{company.fiscalCode}}"}</div>
                <div className="text-muted-foreground">
                  Codul fiscal (CUI)
                </div>
                <div>{"{{company.registrationNumber}}"}</div>
                <div className="text-muted-foreground">
                  Număr de înregistrare
                </div>
                <div>{"{{company.address}}"}</div>
                <div className="text-muted-foreground">
                  Adresa completă
                </div>
                <div>{"{{company.bankAccount}}"}</div>
                <div className="text-muted-foreground">
                  Contul bancar
                </div>
                <div>{"{{company.bankName}}"}</div>
                <div className="text-muted-foreground">
                  Numele băncii
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Variabile Client</h3>
          <div className="rounded-md border p-3">
            <div className="text-xs font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div>{"{{client.name}}"}</div>
                <div className="text-muted-foreground">
                  Numele clientului
                </div>
                <div>{"{{client.fiscalCode}}"}</div>
                <div className="text-muted-foreground">
                  Codul fiscal client
                </div>
                <div>{"{{client.registrationNumber}}"}</div>
                <div className="text-muted-foreground">
                  Număr înregistrare client
                </div>
                <div>{"{{client.address}}"}</div>
                <div className="text-muted-foreground">
                  Adresa completă client
                </div>
                <div>{"{{client.contactPerson}}"}</div>
                <div className="text-muted-foreground">
                  Persoana de contact
                </div>
                <div>{"{{client.email}}"}</div>
                <div className="text-muted-foreground">
                  Email-ul clientului
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection 
        title="Variabile Document" 
        description="Variabile pentru informațiile specifice documentului"
        columns={2}
      >
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Variabile Document</h3>
          <div className="rounded-md border p-3">
            <div className="text-xs font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div>{"{{document.number}}"}</div>
                <div className="text-muted-foreground">
                  Numărul documentului
                </div>
                <div>{"{{document.date}}"}</div>
                <div className="text-muted-foreground">
                  Data documentului
                </div>
                <div>{"{{document.dueDate}}"}</div>
                <div className="text-muted-foreground">
                  Data scadenței
                </div>
                <div>{"{{document.totalWithoutVat}}"}</div>
                <div className="text-muted-foreground">
                  Total fără TVA
                </div>
                <div>{"{{document.vatAmount}}"}</div>
                <div className="text-muted-foreground">
                  Valoare TVA
                </div>
                <div>{"{{document.totalWithVat}}"}</div>
                <div className="text-muted-foreground">
                  Total cu TVA
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Variabile Items</h3>
          <div className="rounded-md border p-3">
            <div className="text-xs font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div>{"{{#each items}}"}</div>
                <div className="text-muted-foreground">
                  Început buclă produse
                </div>
                <div>{"{{this.name}}"}</div>
                <div className="text-muted-foreground">
                  Numele produsului
                </div>
                <div>{"{{this.quantity}}"}</div>
                <div className="text-muted-foreground">
                  Cantitatea produsului
                </div>
                <div>{"{{this.unitPrice}}"}</div>
                <div className="text-muted-foreground">
                  Preț unitar fără TVA
                </div>
                <div>{"{{this.totalPrice}}"}</div>
                <div className="text-muted-foreground">
                  Preț total fără TVA
                </div>
                <div>{"{{/each}}"}</div>
                <div className="text-muted-foreground">
                  Sfârșit buclă produse
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection 
        title="Exemple de Utilizare" 
        description="Exemple de utilizare a variabilelor în șabloane"
        columns={1}
      >
        <div className="rounded-md border bg-slate-50 p-4">
          <h3 className="text-sm font-medium mb-2">Exemplu Header Factură</h3>
          <pre className="text-xs font-mono whitespace-pre-wrap bg-white p-3 rounded border">
{`<div class="header">
  <div class="company">
    <h2>{{company.name}}</h2>
    <p>CUI: {{company.fiscalCode}}</p>
    <p>Reg. Com.: {{company.registrationNumber}}</p>
    <p>{{company.address}}</p>
  </div>
  <div class="document-info">
    <h1>FACTURĂ FISCALĂ</h1>
    <p>Seria și numărul: {{document.number}}</p>
    <p>Data: {{document.date}}</p>
    <p>Data scadentă: {{document.dueDate}}</p>
  </div>
  <div class="client">
    <h3>Client: {{client.name}}</h3>
    <p>CUI: {{client.fiscalCode}}</p>
    <p>Reg. Com.: {{client.registrationNumber}}</p>
    <p>{{client.address}}</p>
  </div>
</div>`}
          </pre>
        </div>
      </FormSection>
    </SettingCard>
  );

  // Render settings tab
  const renderSettingsTab = () => (
    <SettingCard
      title="Setări Șabloane"
      description="Configurați comportamentul implicit pentru șabloanele de documente."
    >
      <FormSection 
        title="Opțiuni Generale" 
        description="Setări generale pentru toate șabloanele"
        columns={2}
      >
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <h3 className="font-medium">Generare Automată PDF</h3>
            <p className="text-sm text-muted-foreground">
              Generează automat documente PDF la crearea unei facturi
            </p>
          </div>
          <div>
            <Select defaultValue="enabled">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Activat</SelectItem>
                <SelectItem value="disabled">Dezactivat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <h3 className="font-medium">Format Date</h3>
            <p className="text-sm text-muted-foreground">
              Formatul implicit pentru date în documente
            </p>
          </div>
          <div>
            <Select defaultValue="dd.mm.yyyy">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd.mm.yyyy">DD.MM.YYYY</SelectItem>
                <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <h3 className="font-medium">Format Numere</h3>
            <p className="text-sm text-muted-foreground">
              Formatul implicit pentru numere în documente
            </p>
          </div>
          <div>
            <Select defaultValue="ro">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ro">1.234,56</SelectItem>
                <SelectItem value="en">1,234.56</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <h3 className="font-medium">Format Implicit PDF</h3>
            <p className="text-sm text-muted-foreground">
              Formatul implicit pentru documentele PDF generate
            </p>
          </div>
          <div>
            <Select defaultValue="a4">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4</SelectItem>
                <SelectItem value="letter">Letter</SelectItem>
                <SelectItem value="a5">A5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormSection>

      <FormSection 
        title="Personalizare" 
        description="Opțiuni de personalizare a șabloanelor"
        columns={1}
      >
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <h3 className="font-medium">Semnătură Digitală</h3>
            <p className="text-sm text-muted-foreground">
              Includeți automat semnătura digitală în documentele generate
            </p>
          </div>
          <div>
            <Select defaultValue="enabled">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Activat</SelectItem>
                <SelectItem value="disabled">Dezactivat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <h3 className="font-medium">Includere Logo Companie</h3>
            <p className="text-sm text-muted-foreground">
              Includeți automat logo-ul companiei în documentele generate
            </p>
          </div>
          <div>
            <Select defaultValue="enabled">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Activat</SelectItem>
                <SelectItem value="disabled">Dezactivat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormSection>

      <div className="flex justify-end mt-6 space-x-2">
        <Button variant="outline">
          Resetare Setări
        </Button>
        <Button>
          Salvare Setări
        </Button>
      </div>
    </SettingCard>
  );

  // Render active tab content
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "templates":
        return renderTemplatesTab();
      case "variables":
        return renderVariablesTab();
      case "settings":
        return renderSettingsTab();
      default:
        return null;
    }
  };

  // Template Edit Dialog
  const templateDialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {selectedTemplate ? "Editare Șablon" : "Șablon Nou"}
          </DialogTitle>
          <DialogDescription>
            {selectedTemplate
              ? "Modificați șablonul existent"
              : "Creați un nou șablon pentru documentele generate"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nume Șablon
              </label>
              <Input
                id="name"
                placeholder="ex: Factură Standard"
                defaultValue={selectedTemplate?.name}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Tip Document
              </label>
              <Select defaultValue={selectedTemplate?.type || "invoice"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descriere
            </label>
            <Input
              id="description"
              placeholder="Descriere șablon"
              defaultValue={selectedTemplate?.description}
            />
          </div>
          <Tabs defaultValue="code" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="code">Cod HTML</TabsTrigger>
              <TabsTrigger value="preview">Previzualizare</TabsTrigger>
            </TabsList>
            <TabsContent value="code" className="space-y-4">
              <div className="relative">
                <Textarea
                  className="min-h-[300px] font-mono"
                  placeholder="<html>...</html>"
                  defaultValue={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{document.type}} - {{document.number}}</title>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { display: flex; justify-content: space-between; }
    .company { width: 33%; }
    .document-info { width: 33%; text-align: center; }
    .client { width: 33%; text-align: right; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    th { background-color: #f2f2f2; }
    .total { text-align: right; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <h2>{{company.name}}</h2>
      <p>CUI: {{company.fiscalCode}}</p>
      <p>Reg. Com.: {{company.registrationNumber}}</p>
      <p>{{company.address}}</p>
    </div>
    <div class="document-info">
      <h1>FACTURĂ FISCALĂ</h1>
      <p>Seria și numărul: {{document.number}}</p>
      <p>Data: {{document.date}}</p>
      <p>Data scadentă: {{document.dueDate}}</p>
    </div>
    <div class="client">
      <h3>Client: {{client.name}}</h3>
      <p>CUI: {{client.fiscalCode}}</p>
      <p>Reg. Com.: {{client.registrationNumber}}</p>
      <p>{{client.address}}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Nr.</th>
        <th>Denumire Produs/Serviciu</th>
        <th>UM</th>
        <th>Cant.</th>
        <th>Preț unitar</th>
        <th>Valoare</th>
        <th>TVA</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{@index}}</td>
        <td>{{this.name}}</td>
        <td>{{this.unit}}</td>
        <td>{{this.quantity}}</td>
        <td>{{this.unitPrice}} Lei</td>
        <td>{{this.totalPrice}} Lei</td>
        <td>{{this.vatAmount}} Lei</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <div class="total">
    <p>Total fără TVA: {{document.totalWithoutVat}} Lei</p>
    <p>Total TVA: {{document.vatAmount}} Lei</p>
    <h3>Total de plată: {{document.totalWithVat}} Lei</h3>
  </div>
</body>
</html>`}
                />
              </div>
            </TabsContent>
            <TabsContent value="preview">
              <div className="border rounded-md h-[300px] p-4 overflow-auto bg-white">
                <div className="flex justify-between mb-4 text-sm">
                  <div>
                    <div className="font-bold">DEMO COMPANY SRL</div>
                    <div>CUI: RO12345678</div>
                    <div>Reg. Com.: J40/123/2023</div>
                    <div>Strada Exemplu, Nr. 123, București</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">FACTURĂ FISCALĂ</div>
                    <div>Seria și numărul: DEMO-001</div>
                    <div>Data: 12.04.2025</div>
                    <div>Data scadentă: 12.05.2025</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">Client: Client Demo SRL</div>
                    <div>CUI: RO87654321</div>
                    <div>Reg. Com.: J40/987/2023</div>
                    <div>Strada Client, Nr. 456, București</div>
                  </div>
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-1 text-left">Nr.</th>
                      <th className="border p-1 text-left">Denumire Produs/Serviciu</th>
                      <th className="border p-1 text-left">UM</th>
                      <th className="border p-1 text-left">Cant.</th>
                      <th className="border p-1 text-left">Preț unitar</th>
                      <th className="border p-1 text-left">Valoare</th>
                      <th className="border p-1 text-left">TVA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-1">1</td>
                      <td className="border p-1">Produs Demo 1</td>
                      <td className="border p-1">buc</td>
                      <td className="border p-1">2</td>
                      <td className="border p-1">100,00 Lei</td>
                      <td className="border p-1">200,00 Lei</td>
                      <td className="border p-1">38,00 Lei</td>
                    </tr>
                    <tr>
                      <td className="border p-1">2</td>
                      <td className="border p-1">Serviciu Demo 1</td>
                      <td className="border p-1">ore</td>
                      <td className="border p-1">5</td>
                      <td className="border p-1">50,00 Lei</td>
                      <td className="border p-1">250,00 Lei</td>
                      <td className="border p-1">47,50 Lei</td>
                    </tr>
                  </tbody>
                </table>
                <div className="text-right mt-4 text-sm">
                  <div>Total fără TVA: 450,00 Lei</div>
                  <div>Total TVA: 85,50 Lei</div>
                  <div className="font-bold">Total de plată: 535,50 Lei</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="isDefault" defaultChecked={selectedTemplate?.isDefault} />
            <label htmlFor="isDefault" className="text-sm">
              Setează ca șablon implicit pentru acest tip de document
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Anulează
          </Button>
          <Button type="submit" onClick={() => setIsDialogOpen(false)}>
            {selectedTemplate ? "Actualizează" : "Creează"} Șablon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Preview dialog
  const previewDialog = (
    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <DialogContent className="max-w-4xl max-h-screen overflow-auto">
        <DialogHeader>
          <DialogTitle>Previzualizare: {selectedTemplate?.name}</DialogTitle>
          <DialogDescription>
            Previzualizare șablon cu date de test
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 bg-white border rounded-md h-[600px] overflow-auto">
          <div className="flex justify-between mb-4">
            <div>
              <div className="font-bold">DEMO COMPANY SRL</div>
              <div>CUI: RO12345678</div>
              <div>Reg. Com.: J40/123/2023</div>
              <div>Strada Exemplu, Nr. 123, București</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl">FACTURĂ FISCALĂ</div>
              <div>Seria și numărul: DEMO-001</div>
              <div>Data: 12.04.2025</div>
              <div>Data scadentă: 12.05.2025</div>
            </div>
            <div className="text-right">
              <div className="font-bold">Client: Client Demo SRL</div>
              <div>CUI: RO87654321</div>
              <div>Reg. Com.: J40/987/2023</div>
              <div>Strada Client, Nr. 456, București</div>
            </div>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Nr.</th>
                <th className="border p-2 text-left">Denumire Produs/Serviciu</th>
                <th className="border p-2 text-left">UM</th>
                <th className="border p-2 text-left">Cant.</th>
                <th className="border p-2 text-left">Preț unitar</th>
                <th className="border p-2 text-left">Valoare</th>
                <th className="border p-2 text-left">TVA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">1</td>
                <td className="border p-2">Produs Demo 1</td>
                <td className="border p-2">buc</td>
                <td className="border p-2">2</td>
                <td className="border p-2">100,00 Lei</td>
                <td className="border p-2">200,00 Lei</td>
                <td className="border p-2">38,00 Lei</td>
              </tr>
              <tr>
                <td className="border p-2">2</td>
                <td className="border p-2">Serviciu Demo 1</td>
                <td className="border p-2">ore</td>
                <td className="border p-2">5</td>
                <td className="border p-2">50,00 Lei</td>
                <td className="border p-2">250,00 Lei</td>
                <td className="border p-2">47,50 Lei</td>
              </tr>
              <tr>
                <td className="border p-2">3</td>
                <td className="border p-2">Produs Demo 2</td>
                <td className="border p-2">buc</td>
                <td className="border p-2">3</td>
                <td className="border p-2">75,00 Lei</td>
                <td className="border p-2">225,00 Lei</td>
                <td className="border p-2">42,75 Lei</td>
              </tr>
            </tbody>
          </table>
          <div className="text-right mt-4">
            <div>Total fără TVA: 675,00 Lei</div>
            <div>Total TVA: 128,25 Lei</div>
            <div className="font-bold text-lg">Total de plată: 803,25 Lei</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
            Închide
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Șabloane Documente"
        description="Gestionați șabloanele pentru documentele generate în aplicație."
        breadcrumbs={[{ title: "Șabloane Documente" }]}
        actions={
          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Șablon Nou
          </Button>
        }
      />

      <TabsNav
        tabs={documentTemplatesTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {renderActiveTabContent()}
      {templateDialog}
      {previewDialog}
    </div>
  );
}