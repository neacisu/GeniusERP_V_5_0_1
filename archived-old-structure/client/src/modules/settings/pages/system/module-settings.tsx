/**
 * Module Settings Page
 * 
 * Manages settings for individual modules in the application
 */

import React, { useState } from "react";
import { useUser } from "@/hooks/use-user";

import PageHeader from "../../components/common/PageHeader";
import SettingCard from "../../components/cards/SettingCard";
import FormSection from "../../components/forms/FormSection";
import { useSettingsApi, GlobalSetting } from "../../hooks/useSettingsApi";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LayoutGrid,
  Settings,
  FileText,
  ShoppingCart,
  LineChart,
  Database,
  Users,
  MessageSquare,
  BarChart2,
  Truck,
  Receipt,
  Bell,
  File,
  Search,
  Plus,
  Edit,
  Loader2,
} from "lucide-react";

// Available modules
const modules = [
  {
    id: "inventory",
    name: "Gestiune Stocuri",
    icon: Truck,
    description: "Gestionarea produselor, stocurilor și a depozitelor.",
    settings: [
      { key: "default_warehouse", label: "Depozit Implicit", type: "string" },
      { key: "low_stock_threshold", label: "Prag Stoc Minim", type: "number" },
      { key: "enable_barcode_scanning", label: "Scanare Coduri de Bare", type: "boolean" },
      { key: "enable_expiry_tracking", label: "Urmărire Dată Expirare", type: "boolean" },
    ],
  },
  {
    id: "invoicing",
    name: "Facturare",
    icon: Receipt,
    description: "Setări pentru facturi, proforma și încasări.",
    settings: [
      { key: "invoice_prefix", label: "Prefix Factură", type: "string" },
      { key: "default_due_days", label: "Zile Scadență Implicite", type: "number" },
      { key: "show_bank_details", label: "Afișare Detalii Bancare", type: "boolean" },
      { key: "auto_send_payment_reminder", label: "Trimitere Automată Reminder Plată", type: "boolean" },
    ],
  },
  {
    id: "crm",
    name: "CRM",
    icon: Users,
    description: "Gestionarea clienților, lead-urilor și a oportunităților.",
    settings: [
      { key: "enable_lead_scoring", label: "Scor Lead-uri", type: "boolean" },
      { key: "lead_assignment_method", label: "Metodă Atribuire Lead-uri", type: "string" },
      { key: "show_activity_timeline", label: "Afișare Cronologie Activități", type: "boolean" },
      { key: "auto_follow_up_days", label: "Zile Follow-up Automat", type: "number" },
    ],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    icon: ShoppingCart,
    description: "Setări pentru magazinul online și integrări.",
    settings: [
      { key: "show_out_of_stock", label: "Afișare Produse fără Stoc", type: "boolean" },
      { key: "enable_guest_checkout", label: "Permiteți Checkout ca Vizitator", type: "boolean" },
      { key: "default_currency", label: "Monedă Implicită", type: "string" },
      { key: "abandoned_cart_reminder", label: "Reminder Coș Abandonat", type: "boolean" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: BarChart2,
    description: "Setări pentru campaniile de marketing și comunicare.",
    settings: [
      { key: "email_daily_limit", label: "Limită Zilnică Email-uri", type: "number" },
      { key: "enable_campaign_analytics", label: "Analiză Campanii", type: "boolean" },
      { key: "default_email_template", label: "Șablon Email Implicit", type: "string" },
      { key: "enable_a_b_testing", label: "Permiteți A/B Testing", type: "boolean" },
    ],
  },
  {
    id: "accounting",
    name: "Contabilitate",
    icon: FileText,
    description: "Setări pentru contabilitate și raportare financiară.",
    settings: [
      { key: "fiscal_year_start_month", label: "Luna Început An Fiscal", type: "number" },
      { key: "default_vat_rate", label: "Rată TVA Implicită", type: "number" },
      { key: "auto_generate_reports", label: "Generare Automată Rapoarte", type: "boolean" },
      { key: "show_financial_kpis", label: "Afișare KPI-uri Financiare", type: "boolean" },
    ],
  },
  {
    id: "analytics",
    name: "Analytics",
    icon: LineChart,
    description: "Setări pentru analiză de date și rapoarte.",
    settings: [
      { key: "default_date_range", label: "Interval Dată Implicit", type: "string" },
      { key: "enable_real_time_analytics", label: "Analiză în Timp Real", type: "boolean" },
      { key: "report_export_formats", label: "Formate Export Rapoarte", type: "string" },
      { key: "enable_prediction_models", label: "Activare Modele Predicție", type: "boolean" },
    ],
  },
  {
    id: "communications",
    name: "Comunicare",
    icon: MessageSquare,
    description: "Setări pentru comunicare internă și externă.",
    settings: [
      { key: "enable_chat", label: "Activare Chat", type: "boolean" },
      { key: "enable_video_calls", label: "Activare Apeluri Video", type: "boolean" },
      { key: "notification_frequency", label: "Frecvență Notificări", type: "string" },
      { key: "auto_archive_messages", label: "Arhivare Automată Mesaje", type: "boolean" },
    ],
  },
  {
    id: "documents",
    name: "Documente",
    icon: File,
    description: "Setări pentru gestionarea documentelor.",
    settings: [
      { key: "default_document_template", label: "Șablon Document Implicit", type: "string" },
      { key: "enable_document_versioning", label: "Versionare Documente", type: "boolean" },
      { key: "enable_document_signing", label: "Semnare Electronică", type: "boolean" },
      { key: "auto_archive_documents", label: "Arhivare Automată Documente", type: "boolean" },
    ],
  },
];

function ModuleSettingsPageContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<typeof modules[0] | null>(null);

  const { user } = useUser();
  const companyId = user?.companyId;

  const { useModuleSettings, useCreateGlobalSetting, useUpdateGlobalSetting } =
    useSettingsApi();

  // Fetch module settings (example for a selected module)
  const { data: moduleSettings, isLoading } = useModuleSettings(
    selectedModule?.id || "inventory",
    companyId
  );

  // Filter modules based on search term
  const filteredModules = modules.filter(
    (module) =>
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle expanding a module
  const handleExpandModule = (moduleId: string) => {
    if (expandedModule === moduleId) {
      setExpandedModule(null);
    } else {
      setExpandedModule(moduleId);
      const module = modules.find(m => m.id === moduleId);
      setSelectedModule(module || null);
    }
  };

  // Format setting value for display
  const formatSettingValue = (value: any, type: string) => {
    if (type === "boolean") {
      return value ? "Da" : "Nu";
    }
    return value?.toString() || "-";
  };

  // Get actual setting value from stored settings
  const getSettingValue = (key: string, defaultValue: any = null) => {
    if (!moduleSettings) return defaultValue;
    const setting = moduleSettings.find((s: GlobalSetting) => s.key === key);
    return setting?.value ?? defaultValue;
  };

  // Render module settings accordion
  const renderModuleSettings = () => (
    <SettingCard
      title="Module Disponibile"
      description="Selectați un modul pentru a configura setările specifice."
    >
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Căutare module..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Accordion
        type="single"
        collapsible
        value={expandedModule || ""}
        onValueChange={setExpandedModule}
        className="w-full"
      >
        {filteredModules.map((module) => (
          <AccordionItem key={module.id} value={module.id}>
            <AccordionTrigger onClick={() => handleExpandModule(module.id)}>
              <div className="flex items-center gap-2">
                <module.icon className="h-5 w-5 text-muted-foreground" />
                <span>{module.name}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  {module.description}
                </p>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Setare</TableHead>
                        <TableHead>Valoare</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {module.settings.map((setting) => (
                        <TableRow key={setting.key}>
                          <TableCell className="font-medium">
                            {setting.label}
                          </TableCell>
                          <TableCell>
                            {formatSettingValue(
                              getSettingValue(setting.key, 
                                setting.type === "boolean" ? false :
                                setting.type === "number" ? 0 : ""),
                              setting.type
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm">
                    Resetare la Valorile Implicite
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {filteredModules.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          Nu au fost găsite module care să corespundă căutării.
        </div>
      )}
    </SettingCard>
  );

  // Render module information cards
  const renderModuleInfo = () => (
    <SettingCard
      title="Informații Module"
      description="Starea curentă și versiunile modulelor instalate."
    >
      <FormSection
        title="Stare Module"
        description="Modulele disponibile și starea lor curentă"
        columns={3}
      >
        {modules.map((module) => (
          <div
            key={module.id}
            className="flex items-start space-x-4 rounded-md border p-4"
          >
            <module.icon className="mt-1 h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium">{module.name}</h3>
              <p className="text-sm text-muted-foreground">
                Versiune 1.0
              </p>
              <Badge variant="outline" className="mt-2">
                Activ
              </Badge>
            </div>
          </div>
        ))}
      </FormSection>
    </SettingCard>
  );

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Module Sistem"
        description="Configurați setările specifice fiecărui modul din aplicație."
        breadcrumbs={[{ title: "Module Sistem" }]}
      />

      {renderModuleSettings()}
      {renderModuleInfo()}
    </div>
  );
}

// Export the main component directly
export default function ModuleSettingsPage() {
  return <ModuleSettingsPageContent />;
}