import React, { useState } from 'react';
import {
  Save,
  HelpCircle,
  Settings,
  Globe,
  Users,
  FileText,
  Mail,
  BellRing,
  Key,
  Database,
  Shield,
  Check,
  Info,
  Loader2
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import HrLayout from '../../components/layout/HrLayout';
import { useHrApi } from '../../hooks/useHrApi';
import { useToast } from "@/hooks/use-toast";

/**
 * HR Settings Page Component
 */
const HrSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  
  // Use HR API hooks
  const { useHrSettings, useUpdateHrSettings } = useHrApi();
  
  // Fetch HR settings
  const { data: settingsResponse, isLoading, isError } = useHrSettings();
  const settings = settingsResponse?.data || {};
  
  // Update settings mutation
  const { mutate: updateSettings, isPending: isUpdating } = useUpdateHrSettings();
  
  // General settings form schema
  const generalFormSchema = z.object({
    companyName: z.string().min(2, "Numele companiei trebuie să aibă cel puțin 2 caractere"),
    companyRegistrationNumber: z.string(),
    fiscalCode: z.string(),
    address: z.string(),
    city: z.string(),
    county: z.string(),
    postalCode: z.string(),
    country: z.string(),
    phone: z.string(),
    email: z.string().email("Adresa de email trebuie să fie validă"),
    website: z.string().url("Website-ul trebuie să fie o adresă URL validă").optional().or(z.literal("")),
    contactPerson: z.string(),
    contactEmail: z.string().email("Adresa de email trebuie să fie validă"),
    contactPhone: z.string()
  });
  
  // HR specific settings schema
  const hrFormSchema = z.object({
    defaultProbationPeriod: z.number().min(0, "Perioada de probă trebuie să fie un număr pozitiv"),
    defaultWorkingHours: z.number().min(0, "Orele de lucru trebuie să fie un număr pozitiv"),
    defaultVacationDays: z.number().min(0, "Zilele de concediu trebuie să fie un număr pozitiv"),
    defaultSickDays: z.number().min(0, "Zilele medicale trebuie să fie un număr pozitiv"),
    defaultNoticePeriod: z.number().min(0, "Perioada de preaviz trebuie să fie un număr pozitiv"),
    enableAutoCalculateVacationDays: z.boolean(),
    enableAutoCalculateSeniority: z.boolean(),
    enableContractNotifications: z.boolean(),
    enableBirthdayNotifications: z.boolean()
  });
  
  // Integration settings schema
  const integrationFormSchema = z.object({
    anafIntegrationEnabled: z.boolean(),
    anafApiKey: z.string().optional(),
    anafUsername: z.string().optional(),
    anafPassword: z.string().optional(),
    revisalIntegrationEnabled: z.boolean(),
    revisalApiKey: z.string().optional(),
    sendgridEnabled: z.boolean(),
    sendgridApiKey: z.string().optional(),
    stripeEnabled: z.boolean(),
    stripeApiKey: z.string().optional()
  });

  // Initialize the general form
  const generalForm = useForm<z.infer<typeof generalFormSchema>>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: {
      companyName: settings.companyName || "",
      companyRegistrationNumber: settings.companyRegistrationNumber || "",
      fiscalCode: settings.fiscalCode || "",
      address: settings.address || "",
      city: settings.city || "",
      county: settings.county || "",
      postalCode: settings.postalCode || "",
      country: settings.country || "România",
      phone: settings.phone || "",
      email: settings.email || "",
      website: settings.website || "",
      contactPerson: settings.contactPerson || "",
      contactEmail: settings.contactEmail || "",
      contactPhone: settings.contactPhone || ""
    }
  });
  
  // Initialize the HR form
  const hrForm = useForm<z.infer<typeof hrFormSchema>>({
    resolver: zodResolver(hrFormSchema),
    defaultValues: {
      defaultProbationPeriod: settings.defaultProbationPeriod || 90,
      defaultWorkingHours: settings.defaultWorkingHours || 40,
      defaultVacationDays: settings.defaultVacationDays || 21,
      defaultSickDays: settings.defaultSickDays || 5,
      defaultNoticePeriod: settings.defaultNoticePeriod || 30,
      enableAutoCalculateVacationDays: settings.enableAutoCalculateVacationDays || false,
      enableAutoCalculateSeniority: settings.enableAutoCalculateSeniority || true,
      enableContractNotifications: settings.enableContractNotifications || true,
      enableBirthdayNotifications: settings.enableBirthdayNotifications || true
    }
  });
  
  // Initialize the integration form
  const integrationForm = useForm<z.infer<typeof integrationFormSchema>>({
    resolver: zodResolver(integrationFormSchema),
    defaultValues: {
      anafIntegrationEnabled: settings.anafIntegrationEnabled || false,
      anafApiKey: settings.anafApiKey || "",
      anafUsername: settings.anafUsername || "",
      anafPassword: settings.anafPassword || "",
      revisalIntegrationEnabled: settings.revisalIntegrationEnabled || false,
      revisalApiKey: settings.revisalApiKey || "",
      sendgridEnabled: settings.sendgridEnabled || false,
      sendgridApiKey: settings.sendgridApiKey || "",
      stripeEnabled: settings.stripeEnabled || false,
      stripeApiKey: settings.stripeApiKey || ""
    }
  });
  
  // Handle general form submission
  const onGeneralSubmit = (values: z.infer<typeof generalFormSchema>) => {
    updateSettings({
      id: 'general',
      data: values
    }, {
      onSuccess: () => {
        toast({
          title: "Setări actualizate",
          description: "Setările generale au fost actualizate cu succes",
          variant: "default"
        });
      },
      onError: (error) => {
        toast({
          title: "Eroare",
          description: "A apărut o eroare la actualizarea setărilor",
          variant: "destructive"
        });
      }
    });
  };
  
  // Handle HR form submission
  const onHrSubmit = (values: z.infer<typeof hrFormSchema>) => {
    updateSettings({
      id: 'hr',
      data: values
    }, {
      onSuccess: () => {
        toast({
          title: "Setări actualizate",
          description: "Setările HR au fost actualizate cu succes",
          variant: "default"
        });
      },
      onError: (error) => {
        toast({
          title: "Eroare",
          description: "A apărut o eroare la actualizarea setărilor",
          variant: "destructive"
        });
      }
    });
  };
  
  // Handle integration form submission
  const onIntegrationSubmit = (values: z.infer<typeof integrationFormSchema>) => {
    updateSettings({
      id: 'integrations',
      data: values
    }, {
      onSuccess: () => {
        toast({
          title: "Setări actualizate",
          description: "Setările de integrare au fost actualizate cu succes",
          variant: "default"
        });
      },
      onError: (error) => {
        toast({
          title: "Eroare",
          description: "A apărut o eroare la actualizarea setărilor",
          variant: "destructive"
        });
      }
    });
  };
  
  if (isLoading) {
    return (
      <HrLayout 
        activeTab="settings" 
        title="Setări HR" 
        subtitle="Se încarcă..."
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
          <p className="text-muted-foreground ml-2">Se încarcă setările...</p>
        </div>
      </HrLayout>
    );
  }
  
  if (isError) {
    return (
      <HrLayout 
        activeTab="settings" 
        title="Eroare" 
        subtitle="Nu s-au putut încărca setările"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">
                A apărut o eroare la încărcarea setărilor
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Reîncarcă
              </Button>
            </div>
          </CardContent>
        </Card>
      </HrLayout>
    );
  }

  return (
    <HrLayout 
      activeTab="settings" 
      title="Setări HR" 
      subtitle="Configurare și personalizare modul HR"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personalizare HR</CardTitle>
            <CardDescription>
              Personalizează setările modulului HR pentru a se potrivi nevoilor companiei tale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">
                  <Globe className="h-4 w-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger value="hr">
                  <Users className="h-4 w-4 mr-2" />
                  HR
                </TabsTrigger>
                <TabsTrigger value="integrations">
                  <Settings className="h-4 w-4 mr-2" />
                  Integrări
                </TabsTrigger>
              </TabsList>
              
              {/* General Settings */}
              <TabsContent value="general" className="py-4">
                <Form {...generalForm}>
                  <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Informații companie</h3>
                        
                        <FormField
                          control={generalForm.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Denumire companie</FormLabel>
                              <FormControl>
                                <Input placeholder="Denumirea companiei" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={generalForm.control}
                            name="companyRegistrationNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Număr de înregistrare</FormLabel>
                                <FormControl>
                                  <Input placeholder="J40/1234/2020" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={generalForm.control}
                            name="fiscalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cod fiscal</FormLabel>
                                <FormControl>
                                  <Input placeholder="RO12345678" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={generalForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresă</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Adresa companiei" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={generalForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Oraș</FormLabel>
                                <FormControl>
                                  <Input placeholder="București" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={generalForm.control}
                            name="county"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Județ</FormLabel>
                                <FormControl>
                                  <Input placeholder="București" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={generalForm.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cod poștal</FormLabel>
                                <FormControl>
                                  <Input placeholder="010123" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={generalForm.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Țară</FormLabel>
                                <FormControl>
                                  <Input placeholder="România" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Informații contact</h3>
                        
                        <FormField
                          control={generalForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon</FormLabel>
                              <FormControl>
                                <Input placeholder="+4021 123 4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={generalForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="office@companie.ro" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={generalForm.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://www.companie.ro" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Separator className="my-4" />
                        
                        <h3 className="text-lg font-medium">Persoană de contact</h3>
                        
                        <FormField
                          control={generalForm.control}
                          name="contactPerson"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nume persoană de contact</FormLabel>
                              <FormControl>
                                <Input placeholder="Ionescu Ion" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={generalForm.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email persoană de contact</FormLabel>
                              <FormControl>
                                <Input placeholder="ion.ionescu@companie.ro" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={generalForm.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon persoană de contact</FormLabel>
                              <FormControl>
                                <Input placeholder="+40722 123 456" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isUpdating}
                      >
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvează setările generale
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              {/* HR Settings */}
              <TabsContent value="hr" className="py-4">
                <Form {...hrForm}>
                  <form onSubmit={hrForm.handleSubmit(onHrSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Setări contracte</h3>
                        
                        <FormField
                          control={hrForm.control}
                          name="defaultProbationPeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Perioadă de probă implicită (zile)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Perioada implicită de probă pentru noii angajați
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={hrForm.control}
                          name="defaultWorkingHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ore de lucru implicite (săptămânal)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Orele de lucru implicite pe săptămână pentru contractele noi
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={hrForm.control}
                          name="defaultVacationDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zile de concediu implicite (anual)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Zilele de concediu implicite anuale pentru contractele noi
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={hrForm.control}
                          name="defaultSickDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zile medicale implicite (anual)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Zilele medicale implicite anuale pentru contractele noi
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={hrForm.control}
                          name="defaultNoticePeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Perioadă de preaviz implicită (zile)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Perioada de preaviz implicită pentru contractele noi
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Automatizări</h3>
                        
                        <FormField
                          control={hrForm.control}
                          name="enableAutoCalculateVacationDays"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Calculare automată zile de concediu
                                </FormLabel>
                                <FormDescription>
                                  Calculează automat zilele de concediu în funcție de vechime
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={hrForm.control}
                          name="enableAutoCalculateSeniority"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Calculare automată vechime
                                </FormLabel>
                                <FormDescription>
                                  Calculează automat vechimea în muncă a angajaților
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <h3 className="text-lg font-medium mt-6">Notificări</h3>
                        
                        <FormField
                          control={hrForm.control}
                          name="enableContractNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Notificări contract
                                </FormLabel>
                                <FormDescription>
                                  Trimite notificări pentru contracte care expiră
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={hrForm.control}
                          name="enableBirthdayNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Notificări aniversări
                                </FormLabel>
                                <FormDescription>
                                  Trimite notificări pentru zilele de naștere ale angajaților
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isUpdating}
                      >
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvează setările HR
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Integration Settings */}
              <TabsContent value="integrations" className="py-4">
                <Form {...integrationForm}>
                  <form onSubmit={integrationForm.handleSubmit(onIntegrationSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">ANAF</h3>
                        
                        <FormField
                          control={integrationForm.control}
                          name="anafIntegrationEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Integrare ANAF
                                </FormLabel>
                                <FormDescription>
                                  Activează integrarea cu sistemul ANAF
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        {integrationForm.watch("anafIntegrationEnabled") && (
                          <>
                            <FormField
                              control={integrationForm.control}
                              name="anafApiKey"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cheie API ANAF</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={integrationForm.control}
                              name="anafUsername"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Utilizator ANAF</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={integrationForm.control}
                              name="anafPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Parolă ANAF</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                        
                        <Separator className="my-4" />
                        
                        <h3 className="text-lg font-medium">Revisal</h3>
                        
                        <FormField
                          control={integrationForm.control}
                          name="revisalIntegrationEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Integrare Revisal
                                </FormLabel>
                                <FormDescription>
                                  Activează integrarea cu sistemul Revisal
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        {integrationForm.watch("revisalIntegrationEnabled") && (
                          <FormField
                            control={integrationForm.control}
                            name="revisalApiKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cheie API Revisal</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">SendGrid</h3>
                        
                        <FormField
                          control={integrationForm.control}
                          name="sendgridEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Integrare SendGrid
                                </FormLabel>
                                <FormDescription>
                                  Activează integrarea cu SendGrid pentru email
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        {integrationForm.watch("sendgridEnabled") && (
                          <FormField
                            control={integrationForm.control}
                            name="sendgridApiKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cheie API SendGrid</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <Separator className="my-4" />
                        
                        <h3 className="text-lg font-medium">Stripe</h3>
                        
                        <FormField
                          control={integrationForm.control}
                          name="stripeEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Integrare Stripe
                                </FormLabel>
                                <FormDescription>
                                  Activează integrarea cu Stripe pentru plăți
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        {integrationForm.watch("stripeEnabled") && (
                          <FormField
                            control={integrationForm.control}
                            name="stripeApiKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cheie API Stripe</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isUpdating}
                      >
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvează setările de integrare
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </HrLayout>
  );
};

export default HrSettingsPage;