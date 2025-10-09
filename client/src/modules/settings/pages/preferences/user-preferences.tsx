/**
 * User Preferences Settings Page
 * 
 * Manages user-specific settings and preferences
 */

import React, { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import PageHeader from "../../components/common/PageHeader";
import TabsNav, { TabItem } from "../../components/common/TabsNav";
import SettingCard from "../../components/cards/SettingCard";
import SettingForm from "../../components/forms/SettingForm";
import FormSection from "../../components/forms/FormSection";
import CustomFormField from "../../components/forms/FormField";
import { useSettingsApi, type UserPreference } from "../../hooks/useSettingsApi";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Settings,
  Bell,
  Palette,
  Laptop,
  Loader2,
  Mail,
} from "lucide-react";

// Define tabs for user preferences
const userTabs: TabItem[] = [
  { id: "interface", label: "Interfață", icon: Laptop },
  { id: "notifications", label: "Notificări", icon: Bell },
  { id: "appearance", label: "Aspect", icon: Palette },
  { id: "account", label: "Cont", icon: User },
];

// Schema for interface preferences
const interfaceSchema = z.object({
  default_landing_page: z.string().default("dashboard"),
  rows_per_page: z.coerce.number().int().min(5).max(100).default(10),
  compact_tables: z.boolean().default(false),
  confirm_actions: z.boolean().default(true),
  show_help_tooltips: z.boolean().default(true),
  auto_refresh_interval: z.coerce.number().int().min(0).max(300).default(0),
});

type InterfaceFormValues = z.infer<typeof interfaceSchema>;

// Schema for notification preferences
const notificationsSchema = z.object({
  email_notifications: z.boolean().default(true),
  browser_notifications: z.boolean().default(true),
  notification_sound: z.boolean().default(true),
  daily_summary_email: z.boolean().default(false),
  notify_on_assignments: z.boolean().default(true),
  notify_on_mentions: z.boolean().default(true),
  notify_on_due_dates: z.boolean().default(true),
});

type NotificationsFormValues = z.infer<typeof notificationsSchema>;

// Helper to convert preferences array to form values
const preferencesToFormValues = (
  preferences: UserPreference[] | undefined,
  defaultValues: any
) => {
  if (!preferences || preferences.length === 0) return defaultValues;

  const formValues: any = { ...defaultValues };

  preferences.forEach((preference) => {
    formValues[preference.key] = preference.value;
  });

  return formValues;
};

export default function UserPreferencesPage() {
  const [activeTab, setActiveTab] = useState("interface");
  const { user } = useUser();
  const userId = user?.id;
  const companyId = user?.companyId;

  const { useUserPreferences, useCreateUserPreference, useUpdateUserPreference } =
    useSettingsApi();

  // Fetch preferences for different categories
  const { data: interfacePrefs, isLoading: isLoadingInterfacePrefs } =
    useUserPreferences(userId || "", "interface");

  const { data: notificationPrefs, isLoading: isLoadingNotificationPrefs } =
    useUserPreferences(userId || "", "notifications");

  const createPrefMutation = useCreateUserPreference();
  const updatePrefMutation = useUpdateUserPreference();

  // Interface preferences form
  const interfaceForm = useForm<InterfaceFormValues>({
    resolver: zodResolver(interfaceSchema),
    defaultValues: {
      default_landing_page: "dashboard",
      rows_per_page: 10,
      compact_tables: false,
      confirm_actions: true,
      show_help_tooltips: true,
      auto_refresh_interval: 0,
    },
    values: preferencesToFormValues(interfacePrefs, {
      default_landing_page: "dashboard",
      rows_per_page: 10,
      compact_tables: false,
      confirm_actions: true,
      show_help_tooltips: true,
      auto_refresh_interval: 0,
    }),
  });

  // Notification preferences form
  const notificationsForm = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      email_notifications: true,
      browser_notifications: true,
      notification_sound: true,
      daily_summary_email: false,
      notify_on_assignments: true,
      notify_on_mentions: true,
      notify_on_due_dates: true,
    },
    values: preferencesToFormValues(notificationPrefs, {
      email_notifications: true,
      browser_notifications: true,
      notification_sound: true,
      daily_summary_email: false,
      notify_on_assignments: true,
      notify_on_mentions: true,
      notify_on_due_dates: true,
    }),
  });

  // Handle saving interface preferences
  const onSaveInterfacePreferences = async (data: InterfaceFormValues) => {
    if (!userId || !companyId) return;

    const prefsToSave = Object.entries(data).map(([key, value]) => ({
      key,
      value,
      category: "interface",
      userId,
      companyId,
    }));

    // Find existing preferences to update vs create new ones
    for (const pref of prefsToSave) {
      const existingPref = interfacePrefs?.find((p) => p.key === pref.key);

      if (existingPref) {
        await updatePrefMutation.mutateAsync({
          id: existingPref.id,
          data: { value: pref.value },
        });
      } else {
        await createPrefMutation.mutateAsync(pref);
      }
    }
  };

  // Handle saving notification preferences
  const onSaveNotificationPreferences = async (data: NotificationsFormValues) => {
    if (!userId || !companyId) return;

    const prefsToSave = Object.entries(data).map(([key, value]) => ({
      key,
      value,
      category: "notifications",
      userId,
      companyId,
    }));

    // Find existing preferences to update vs create new ones
    for (const pref of prefsToSave) {
      const existingPref = notificationPrefs?.find((p) => p.key === pref.key);

      if (existingPref) {
        await updatePrefMutation.mutateAsync({
          id: existingPref.id,
          data: { value: pref.value },
        });
      } else {
        await createPrefMutation.mutateAsync(pref);
      }
    }
  };

  const isLoading = isLoadingInterfacePrefs || isLoadingNotificationPrefs;
  const isSaving = createPrefMutation.isPending || updatePrefMutation.isPending;

  // Get current tab title and description
  const getTabTitle = () => {
    switch (activeTab) {
      case "interface": return "Preferințe Interfață";
      case "notifications": return "Preferințe Notificări";
      case "appearance": return "Preferințe Aspect";
      case "account": return "Preferințe Cont";
      default: return "";
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case "interface": return "Configurați modul de afișare și interacțiune cu interfața aplicației.";
      case "notifications": return "Gestionați modul în care primiți notificări din aplicație.";
      case "appearance": return "Personalizați aspectul vizual al aplicației.";
      case "account": return "Modificați preferințele legate de contul dvs.";
      default: return "";
    }
  };

  // Render interface preferences form content
  const renderInterfacePreferences = () => (
    <SettingForm
      title={getTabTitle()}
      description={getTabDescription()}
      form={interfaceForm}
      onSubmit={onSaveInterfacePreferences}
      isSubmitting={isSaving}
      submitText="Salvează Preferințele"
    >
      <FormSection title="Opțiuni Afișare" description="Configurați modul de afișare al datelor" columns={2}>
        <CustomFormField 
          name="default_landing_page" 
          label="Pagina Inițială Implicită" 
          description="Pagina care se va deschide la autentificare"
          form={interfaceForm}
        >
          <Select
            value={interfaceForm.getValues("default_landing_page")}
            onValueChange={(value) => interfaceForm.setValue("default_landing_page", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectați pagina inițială" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dashboard">Dashboard</SelectItem>
              <SelectItem value="documents">Documente</SelectItem>
              <SelectItem value="inventory">Inventar</SelectItem>
              <SelectItem value="sales">Vânzări</SelectItem>
              <SelectItem value="accounting">Contabilitate</SelectItem>
            </SelectContent>
          </Select>
        </CustomFormField>

        <CustomFormField 
          name="rows_per_page" 
          label="Rânduri Per Pagină" 
          description="Numărul implicit de rânduri afișate în tabele"
          form={interfaceForm}
        >
          <Select
            value={interfaceForm.getValues("rows_per_page").toString()}
            onValueChange={(value) => interfaceForm.setValue("rows_per_page", parseInt(value, 10))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectați numărul de rânduri" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 rânduri</SelectItem>
              <SelectItem value="10">10 rânduri</SelectItem>
              <SelectItem value="20">20 rânduri</SelectItem>
              <SelectItem value="50">50 rânduri</SelectItem>
              <SelectItem value="100">100 rânduri</SelectItem>
            </SelectContent>
          </Select>
        </CustomFormField>

        <CustomFormField 
          name="auto_refresh_interval" 
          label="Interval Reîmprospătare (sec)" 
          description="Frecvența cu care datele sunt reîmprospătate automat (0 = dezactivat)"
          form={interfaceForm}
        >
          <Select
            value={interfaceForm.getValues("auto_refresh_interval").toString()}
            onValueChange={(value) => interfaceForm.setValue("auto_refresh_interval", parseInt(value, 10))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectați intervalul" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Dezactivat</SelectItem>
              <SelectItem value="30">30 secunde</SelectItem>
              <SelectItem value="60">1 minut</SelectItem>
              <SelectItem value="120">2 minute</SelectItem>
              <SelectItem value="300">5 minute</SelectItem>
            </SelectContent>
          </Select>
        </CustomFormField>
      </FormSection>

      <FormSection title="Preferințe Generale" description="Configurați comportamentul aplicației" columns={2}>
        <FormField
          control={interfaceForm.control}
          name="compact_tables"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Tabele Compacte</FormLabel>
                <FormDescription>
                  Reduce spațierea în tabele pentru a afișa mai multe date
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={interfaceForm.control}
          name="confirm_actions"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Confirmare Acțiuni</FormLabel>
                <FormDescription>
                  Cere confirmare înainte de acțiuni importante (ștergere, etc.)
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={interfaceForm.control}
          name="show_help_tooltips"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Afișare Tooltipuri Ajutor</FormLabel>
                <FormDescription>
                  Afișează tooltipuri de ajutor pentru elementele din interfață
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </FormSection>
    </SettingForm>
  );

  // Render notification preferences form content
  const renderNotificationPreferences = () => (
    <SettingForm
      title={getTabTitle()}
      description={getTabDescription()}
      form={notificationsForm}
      onSubmit={onSaveNotificationPreferences}
      isSubmitting={isSaving}
      submitText="Salvează Preferințele"
    >
      <FormSection title="Canale de Notificare" description="Alegeți cum doriți să primiți notificări" columns={2}>
        <FormField
          control={notificationsForm.control}
          name="email_notifications"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Notificări prin Email</FormLabel>
                <FormDescription>
                  Primiți notificări prin email
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={notificationsForm.control}
          name="browser_notifications"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Notificări în Browser</FormLabel>
                <FormDescription>
                  Primiți notificări push în browser
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={notificationsForm.control}
          name="notification_sound"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Sunet Notificări</FormLabel>
                <FormDescription>
                  Redă un sunet la primirea notificărilor
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={notificationsForm.control}
          name="daily_summary_email"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Email Rezumat Zilnic</FormLabel>
                <FormDescription>
                  Primiți un rezumat zilnic cu toate activitățile
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </FormSection>

      <FormSection title="Tipuri de Notificări" description="Pentru ce evenimente doriți să fiți notificat" columns={2}>
        <FormField
          control={notificationsForm.control}
          name="notify_on_assignments"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Notificări pentru Sarcini Asignate</FormLabel>
                <FormDescription>
                  Primiți notificări când vi se asignează sarcini
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={notificationsForm.control}
          name="notify_on_mentions"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Notificări pentru Mențiuni</FormLabel>
                <FormDescription>
                  Primiți notificări când sunteți menționat(@) în comentarii
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={notificationsForm.control}
          name="notify_on_due_dates"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Notificări pentru Termene Limită</FormLabel>
                <FormDescription>
                  Primiți notificări pentru termene limită apropiate
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </FormSection>
    </SettingForm>
  );

  // Render appearance preferences content
  const renderAppearancePreferences = () => (
    <SettingCard
      title={getTabTitle()}
      description={getTabDescription()}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Teme</h3>
          <p className="text-sm text-muted-foreground">
            Alegeți tema preferată pentru interfața aplicației.
          </p>
          <div className="flex gap-4 mt-4">
            <div className="w-full max-w-xs">
              <Select defaultValue="light">
                <SelectTrigger>
                  <SelectValue placeholder="Selectează tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Temă Luminoasă</SelectItem>
                  <SelectItem value="dark">Temă Întunecată</SelectItem>
                  <SelectItem value="system">Folosește Tema Sistemului</SelectItem>
                  <SelectItem value="custom">Temă Personalizată</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">Personalizează Tema</Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Densitate Conținut</h3>
          <p className="text-sm text-muted-foreground">
            Ajustați densitatea conținutului afișat.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <Button variant="outline" className="justify-start">Compactă</Button>
            <Button variant="default" className="justify-start">Normală</Button>
            <Button variant="outline" className="justify-start">Confortabilă</Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Font</h3>
          <p className="text-sm text-muted-foreground">
            Alegeți fontul utilizat în aplicație.
          </p>
          <div className="w-full max-w-xs mt-4">
            <Select defaultValue="inter">
              <SelectTrigger>
                <SelectValue placeholder="Selectează fontul" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">Inter</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="opensans">Open Sans</SelectItem>
                <SelectItem value="system">Font Sistem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </SettingCard>
  );

  // Render account preferences content
  const renderAccountPreferences = () => (
    <SettingCard
      title={getTabTitle()}
      description={getTabDescription()}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Securitate</h3>
          <p className="text-sm text-muted-foreground">
            Gestionați setările de securitate ale contului.
          </p>
          <div className="flex flex-row items-start space-x-3 mt-4 rounded-md border p-4">
            <Switch id="2fa" />
            <div className="space-y-1 leading-none">
              <label htmlFor="2fa" className="font-medium">Autentificare în doi pași</label>
              <p className="text-sm text-muted-foreground">
                Activați autentificarea în doi pași pentru securitate sporită
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Sesiuni Active</h3>
          <p className="text-sm text-muted-foreground">
            Gestionați sesiunile active de pe dispozitivele dvs.
          </p>
          <div className="mt-4 rounded-md border">
            <div className="p-4 flex justify-between items-center">
              <div>
                <h4 className="font-medium">Acest dispozitiv</h4>
                <p className="text-sm text-muted-foreground">Ultima activitate: Acum</p>
              </div>
              <Button variant="ghost" size="sm">Deconectare</Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Preferințe Limbă</h3>
          <p className="text-sm text-muted-foreground">
            Alegeți limba preferată pentru interfață.
          </p>
          <div className="w-full max-w-xs mt-4">
            <Select defaultValue="ro">
              <SelectTrigger>
                <SelectValue placeholder="Selectează limba" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ro">Română</SelectItem>
                <SelectItem value="en">Engleză</SelectItem>
                <SelectItem value="fr">Franceză</SelectItem>
                <SelectItem value="de">Germană</SelectItem>
                <SelectItem value="es">Spaniolă</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </SettingCard>
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
      case "interface":
        return renderInterfacePreferences();
      case "notifications":
        return renderNotificationPreferences();
      case "appearance":
        return renderAppearancePreferences();
      case "account":
        return renderAccountPreferences();
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Preferințe Utilizator"
        description="Personalizați experiența dumneavoastră în aplicație."
        breadcrumbs={[{ title: "Preferințe Utilizator" }]}
      />

      <TabsNav tabs={userTabs} activeTab={activeTab} onChange={setActiveTab} />
      
      {renderActiveTabContent()}
    </div>
  );
}