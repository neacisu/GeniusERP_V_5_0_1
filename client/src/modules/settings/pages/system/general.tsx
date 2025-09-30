/**
 * System General Settings Page
 * 
 * This component renders and manages the general system settings.
 * It provides functionality for email configuration, document formatting, and general system options.
 */

import React, { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import PageHeader from "../../components/common/PageHeader";
import TabsNav, { TabItem } from "../../components/common/TabsNav";
import SettingForm from "../../components/forms/SettingForm";
import FormSection from "../../components/forms/FormSection";
import CustomFormField from "../../components/forms/FormField";
import { useSettingsApi, GlobalSetting } from "../../hooks/useSettingsApi";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Database, 
  HardDrive, 
  Mail, 
  CreditCard, 
  FileText, 
  Calendar,
  Loader2 
} from "lucide-react";

// Define tabs for system settings
const systemTabs: TabItem[] = [
  { id: "general", label: "General", icon: Database },
  { id: "storage", label: "Stocare", icon: HardDrive },
  { id: "email", label: "Email", icon: Mail },
  { id: "payment", label: "Plăți", icon: CreditCard },
  { id: "documents", label: "Documente", icon: FileText },
  { id: "dates", label: "Date & Timp", icon: Calendar },
];

// Schema for general settings
const generalSettingsSchema = z.object({
  company_name_format: z.string().min(1, "Formatul este obligatoriu"),
  default_language: z.string().min(1, "Limba implicită este obligatorie"),
  default_timezone: z.string().min(1, "Fusul orar este obligatoriu"),
  enable_notifications: z.boolean().default(true),
  maintenance_mode: z.boolean().default(false),
  maintenance_message: z.string().optional(),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;

// Schema for email settings
const emailSettingsSchema = z.object({
  smtp_host: z.string().min(1, "Hostul SMTP este obligatoriu"),
  smtp_port: z.coerce.number().int().min(1, "Portul SMTP este obligatoriu"),
  smtp_user: z.string().min(1, "Utilizatorul SMTP este obligatoriu"),
  smtp_password: z.string().min(1, "Parola SMTP este obligatorie"),
  smtp_secure: z.boolean().default(true),
  email_from: z.string().email("Adresa de email nu este validă"),
  email_reply_to: z.string().email("Adresa de email nu este validă").optional().or(z.literal("")),
});

type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>;

// Schema for document settings
const documentSettingsSchema = z.object({
  invoice_prefix: z.string().min(1, "Prefixul facturii este obligatoriu"),
  invoice_start_number: z.coerce.number().int().min(1, "Numărul de start al facturii este obligatoriu"),
  invoice_number_format: z.string().min(1, "Formatul numărului de factură este obligatoriu"),
  receipt_prefix: z.string().min(1, "Prefixul chitanței este obligatoriu"),
  receipt_start_number: z.coerce.number().int().min(1, "Numărul de start al chitanței este obligatoriu"),
  receipt_number_format: z.string().min(1, "Formatul numărului de chitanță este obligatoriu"),
  default_payment_due_days: z.coerce.number().int().min(0, "Numărul de zile până la scadență trebuie să fie pozitiv"),
});

type DocumentSettingsFormValues = z.infer<typeof documentSettingsSchema>;

// Helper to convert settings array to form values
const settingsToFormValues = (
  settings: GlobalSetting[] | undefined, 
  defaultValues: any
) => {
  if (!settings || settings.length === 0) return defaultValues;
  
  const formValues: any = {...defaultValues};
  
  settings.forEach(setting => {
    formValues[setting.key] = setting.value;
  });
  
  return formValues;
};

function SystemGeneralPageContent() {
  const [activeTab, setActiveTab] = useState("general");
  const { user } = useUser();
  const companyId = user?.companyId;
  
  const { 
    useGlobalSettings, 
    useCreateGlobalSetting,
    useUpdateGlobalSetting
  } = useSettingsApi();
  
  // Content remains unchanged below this line

  // Fetch settings for different categories
  const { data: generalSettings, isLoading: isLoadingGeneralSettings } = 
    useGlobalSettings("system_general", companyId || "default");
  
  const { data: emailSettings, isLoading: isLoadingEmailSettings } = 
    useGlobalSettings("system_email", companyId || "default");
  
  const { data: documentSettings, isLoading: isLoadingDocumentSettings } = 
    useGlobalSettings("system_documents", companyId || "default");

  const createSettingMutation = useCreateGlobalSetting();
  const updateSettingMutation = useUpdateGlobalSetting();

  // General settings form
  const generalSettingsForm = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      company_name_format: "{name}",
      default_language: "ro",
      default_timezone: "Europe/Bucharest",
      enable_notifications: true,
      maintenance_mode: false,
      maintenance_message: "Sistemul este în mentenanță. Vă rugăm reveniți mai târziu.",
    },
    values: settingsToFormValues(generalSettings, {
      company_name_format: "{name}",
      default_language: "ro",
      default_timezone: "Europe/Bucharest",
      enable_notifications: true,
      maintenance_mode: false,
      maintenance_message: "Sistemul este în mentenanță. Vă rugăm reveniți mai târziu.",
    }),
  });

  // Email settings form
  const emailSettingsForm = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtp_host: "",
      smtp_port: 587,
      smtp_user: "",
      smtp_password: "",
      smtp_secure: true,
      email_from: "",
      email_reply_to: "",
    },
    values: settingsToFormValues(emailSettings, {
      smtp_host: "",
      smtp_port: 587,
      smtp_user: "",
      smtp_password: "",
      smtp_secure: true,
      email_from: "",
      email_reply_to: "",
    }),
  });

  // Document settings form
  const documentSettingsForm = useForm<DocumentSettingsFormValues>({
    resolver: zodResolver(documentSettingsSchema),
    defaultValues: {
      invoice_prefix: "FACT",
      invoice_start_number: 1,
      invoice_number_format: "{prefix}{number}",
      receipt_prefix: "CHIT",
      receipt_start_number: 1,
      receipt_number_format: "{prefix}{number}",
      default_payment_due_days: 30,
    },
    values: settingsToFormValues(documentSettings, {
      invoice_prefix: "FACT",
      invoice_start_number: 1,
      invoice_number_format: "{prefix}{number}",
      receipt_prefix: "CHIT",
      receipt_start_number: 1,
      receipt_number_format: "{prefix}{number}",
      default_payment_due_days: 30,
    }),
  });

  // Handle saving general settings
  const onSaveGeneralSettings = async (data: GeneralSettingsFormValues) => {
    if (!companyId) return;
    
    const settingsToSave = Object.entries(data).map(([key, value]) => ({
      key,
      value,
      category: "system_general",
      companyId,
      isSystemWide: false,
    }));
    
    // Find existing settings to update vs create new ones
    for (const setting of settingsToSave) {
      const existingSetting = generalSettings?.find(s => s.key === setting.key);
      
      if (existingSetting) {
        await updateSettingMutation.mutateAsync({
          id: existingSetting.id,
          data: { value: setting.value }
        });
      } else {
        await createSettingMutation.mutateAsync(setting);
      }
    }
  };

  // Handle saving email settings
  const onSaveEmailSettings = async (data: EmailSettingsFormValues) => {
    if (!companyId) return;
    
    const settingsToSave = Object.entries(data).map(([key, value]) => ({
      key,
      value,
      category: "system_email",
      companyId,
      isSystemWide: false,
    }));
    
    // Find existing settings to update vs create new ones
    for (const setting of settingsToSave) {
      const existingSetting = emailSettings?.find(s => s.key === setting.key);
      
      if (existingSetting) {
        await updateSettingMutation.mutateAsync({
          id: existingSetting.id,
          data: { value: setting.value }
        });
      } else {
        await createSettingMutation.mutateAsync(setting);
      }
    }
  };

  // Handle saving document settings
  const onSaveDocumentSettings = async (data: DocumentSettingsFormValues) => {
    if (!companyId) return;
    
    const settingsToSave = Object.entries(data).map(([key, value]) => ({
      key,
      value,
      category: "system_documents",
      companyId,
      isSystemWide: false,
    }));
    
    // Find existing settings to update vs create new ones
    for (const setting of settingsToSave) {
      const existingSetting = documentSettings?.find(s => s.key === setting.key);
      
      if (existingSetting) {
        await updateSettingMutation.mutateAsync({
          id: existingSetting.id,
          data: { value: setting.value }
        });
      } else {
        await createSettingMutation.mutateAsync(setting);
      }
    }
  };

  const isLoading = isLoadingGeneralSettings || isLoadingEmailSettings || isLoadingDocumentSettings;
  const isSaving = createSettingMutation.isPending || updateSettingMutation.isPending;

  // Get current tab title and description
  const getTabTitle = () => {
    switch (activeTab) {
      case "general": return "Setări Generale";
      case "storage": return "Setări Stocare";
      case "email": return "Setări Email";
      case "payment": return "Setări Plăți";
      case "documents": return "Setări Documente";
      case "dates": return "Setări Dată & Timp";
      default: return "";
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case "general": return "Configurați setările generale ale sistemului.";
      case "storage": return "Configurați setările de stocare a fișierelor.";
      case "email": return "Configurați serverul SMTP și setările de email.";
      case "payment": return "Configurați metodele de plată și setările asociate.";
      case "documents": return "Configurați formatul și numerotarea documentelor.";
      case "dates": return "Configurați formatele de dată și timp.";
      default: return "";
    }
  };

  // Render general settings
  const renderGeneralSettings = () => (
    <SettingForm
      title={getTabTitle()}
      description={getTabDescription()}
      form={generalSettingsForm}
      onSubmit={onSaveGeneralSettings}
      isSubmitting={isSaving}
      submitText="Salvează Setările"
    >
      <FormSection title="Setări de Bază" description="Configurați parametrii de bază ai sistemului" columns={2}>
        <CustomFormField
          name="company_name_format"
          label="Format Nume Companie"
          description="Format pentru afișarea numelui companiei. Folosiți {name} pentru numele companiei."
          form={generalSettingsForm}
        >
          <Input />
        </CustomFormField>

        <CustomFormField
          name="default_language"
          label="Limbă Implicită"
          form={generalSettingsForm}
        >
          <Select
            value={generalSettingsForm.getValues("default_language")}
            onValueChange={(value) => generalSettingsForm.setValue("default_language", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectați limba" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ro">Română</SelectItem>
              <SelectItem value="en">Engleză</SelectItem>
              <SelectItem value="de">Germană</SelectItem>
              <SelectItem value="fr">Franceză</SelectItem>
            </SelectContent>
          </Select>
        </CustomFormField>

        <CustomFormField
          name="default_timezone"
          label="Fus Orar Implicit"
          form={generalSettingsForm}
        >
          <Select
            value={generalSettingsForm.getValues("default_timezone")}
            onValueChange={(value) => generalSettingsForm.setValue("default_timezone", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectați fusul orar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Europe/Bucharest">Europa/București (UTC+2/+3)</SelectItem>
              <SelectItem value="Europe/London">Europa/Londra (UTC+0/+1)</SelectItem>
              <SelectItem value="Europe/Paris">Europa/Paris (UTC+1/+2)</SelectItem>
              <SelectItem value="America/New_York">America/New York (UTC-5/-4)</SelectItem>
            </SelectContent>
          </Select>
        </CustomFormField>
      </FormSection>

      <FormSection title="Comportament Sistem" description="Configurați comportamentul sistemului" columns={2}>
        <FormField
          control={generalSettingsForm.control}
          name="enable_notifications"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Activează Notificări</FormLabel>
                <FormDescription>
                  Activează notificările în sistem pentru utilizatori
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={generalSettingsForm.control}
          name="maintenance_mode"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Mod Mentenanță</FormLabel>
                <FormDescription>
                  Activează modul de mentenanță pentru întregul sistem
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="col-span-2">
          <CustomFormField
            name="maintenance_message"
            label="Mesaj Mentenanță"
            description="Mesajul afișat utilizatorilor în timpul mentenanței"
            form={generalSettingsForm}
          >
            <Textarea rows={3} />
          </CustomFormField>
        </div>
      </FormSection>
    </SettingForm>
  );

  // Render email settings
  const renderEmailSettings = () => (
    <SettingForm
      title={getTabTitle()}
      description={getTabDescription()}
      form={emailSettingsForm}
      onSubmit={onSaveEmailSettings}
      isSubmitting={isSaving}
      submitText="Salvează Setările"
    >
      <FormSection title="Configurație Server SMTP" description="Configurați serverul SMTP pentru trimiterea emailurilor" columns={2}>
        <CustomFormField
          name="smtp_host"
          label="Host SMTP"
          description="Adresa serverului SMTP (ex: smtp.gmail.com)"
          form={emailSettingsForm}
        >
          <Input />
        </CustomFormField>

        <CustomFormField
          name="smtp_port"
          label="Port SMTP"
          description="Portul de conectare la serverul SMTP"
          form={emailSettingsForm}
        >
          <Input type="number" />
        </CustomFormField>

        <CustomFormField
          name="smtp_user"
          label="Utilizator SMTP"
          description="Numele de utilizator pentru autentificarea la serverul SMTP"
          form={emailSettingsForm}
        >
          <Input />
        </CustomFormField>

        <CustomFormField
          name="smtp_password"
          label="Parolă SMTP"
          description="Parola pentru autentificarea la serverul SMTP"
          form={emailSettingsForm}
        >
          <Input type="password" />
        </CustomFormField>

        <FormField
          control={emailSettingsForm.control}
          name="smtp_secure"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Conexiune Securizată</FormLabel>
                <FormDescription>
                  Folosește conexiune securizată (SSL/TLS) către serverul SMTP
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </FormSection>

      <FormSection title="Configurație Email" description="Configurați detaliile de trimitere a emailurilor" columns={2}>
        <CustomFormField
          name="email_from"
          label="Adresă de Email Expeditor"
          description="Adresa de email de la care vor fi trimise emailurile"
          form={emailSettingsForm}
        >
          <Input type="email" />
        </CustomFormField>

        <CustomFormField
          name="email_reply_to"
          label="Adresă de Răspuns (Reply-To)"
          description="Adresa de email la care se vor trimite răspunsurile (opțional)"
          form={emailSettingsForm}
        >
          <Input type="email" />
        </CustomFormField>
      </FormSection>
    </SettingForm>
  );

  // Render document settings
  const renderDocumentSettings = () => (
    <SettingForm
      title={getTabTitle()}
      description={getTabDescription()}
      form={documentSettingsForm}
      onSubmit={onSaveDocumentSettings}
      isSubmitting={isSaving}
      submitText="Salvează Setările"
    >
      <FormSection title="Formatare Facturi" description="Configurați formatul și numerotarea facturilor" columns={2}>
        <CustomFormField
          name="invoice_prefix"
          label="Prefix Facturi"
          description="Prefixul adăugat la numărul facturilor (ex: FACT)"
          form={documentSettingsForm}
        >
          <Input />
        </CustomFormField>

        <CustomFormField
          name="invoice_start_number"
          label="Număr Start Facturi"
          description="Numărul de la care începe numerotarea facturilor"
          form={documentSettingsForm}
        >
          <Input type="number" min="1" />
        </CustomFormField>

        <CustomFormField
          name="invoice_number_format"
          label="Format Număr Factură"
          description="Formatul pentru numerotarea facturilor. Folosiți {prefix} pentru prefix, {number} pentru număr, {year} pentru an"
          form={documentSettingsForm}
        >
          <Input />
        </CustomFormField>
      </FormSection>

      <FormSection title="Formatare Chitanțe" description="Configurați formatul și numerotarea chitanțelor" columns={2}>
        <CustomFormField
          name="receipt_prefix"
          label="Prefix Chitanțe"
          description="Prefixul adăugat la numărul chitanțelor (ex: CHIT)"
          form={documentSettingsForm}
        >
          <Input />
        </CustomFormField>

        <CustomFormField
          name="receipt_start_number"
          label="Număr Start Chitanțe"
          description="Numărul de la care începe numerotarea chitanțelor"
          form={documentSettingsForm}
        >
          <Input type="number" min="1" />
        </CustomFormField>

        <CustomFormField
          name="receipt_number_format"
          label="Format Număr Chitanță"
          description="Formatul pentru numerotarea chitanțelor. Folosiți {prefix} pentru prefix, {number} pentru număr, {year} pentru an"
          form={documentSettingsForm}
        >
          <Input />
        </CustomFormField>
      </FormSection>

      <FormSection title="Setări Plăți" description="Configurați setările implicite pentru plăți" columns={2}>
        <CustomFormField
          name="default_payment_due_days"
          label="Zile Scadență Implicite"
          description="Numărul implicit de zile până la scadența plății"
          form={documentSettingsForm}
        >
          <Input type="number" min="0" />
        </CustomFormField>
      </FormSection>
    </SettingForm>
  );

  // Render the active tab content
  const renderActiveTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    switch (activeTab) {
      case "general":
        return renderGeneralSettings();
      case "email":
        return renderEmailSettings();
      case "documents":
        return renderDocumentSettings();
      case "storage":
      case "payment":
      case "dates":
        return (
          <div className="mt-6 text-center p-12 border rounded-lg bg-slate-50">
            <h3 className="text-lg font-medium text-slate-700 mb-2">Modul în Dezvoltare</h3>
            <p className="text-slate-600">
              Această secțiune este în curs de dezvoltare și va fi disponibilă în curând.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Setări Sistem"
        description="Configurați parametrii de funcționare ai sistemului."
        breadcrumbs={[{ title: "Sistem" }]}
      />

      <TabsNav
        tabs={systemTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      
      {renderActiveTabContent()}
    </div>
  );
}

// Export the main component directly
export default function SystemGeneralPage() {
  return <SystemGeneralPageContent />;
}