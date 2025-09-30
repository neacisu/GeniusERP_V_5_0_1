/**
 * Edit Campaign Page
 * 
 * Form for editing an existing marketing campaign.
 */

import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  ArrowLeft, 
  Calendar, 
  Mail, 
  MessageSquare, 
  Share2, 
  BellRing, 
  Save, 
  Users,
  FileText,
  AlertTriangle
} from "lucide-react";
import { CampaignType, CampaignStatus, AudienceType } from "../../types";
import { useCampaign, useCampaigns, useSegments, useTemplates } from "../../hooks/useMarketingApi";
import MarketingFormActions from "../../components/forms/MarketingFormActions";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";
import { 
  RadioGroup, 
  RadioGroupItem 
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Form schema
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Numele campaniei trebuie să aibă cel puțin 3 caractere.",
  }),
  description: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  channels: z.array(z.string()).min(1, {
    message: "Selectați cel puțin un canal de comunicare.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface EditCampaignPageProps {
  id: string;
}

const EditCampaignPage: React.FC<EditCampaignPageProps> = ({ id }) => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { campaign, isLoading } = useCampaign(id);
  const { updateCampaign } = useCampaigns();
  
  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      subject: "",
      content: "",
      channels: []
    }
  });
  
  // Update form when campaign data is loaded
  useEffect(() => {
    if (campaign) {
      form.reset({
        name: campaign.name,
        description: campaign.description || "",
        subject: campaign.subject || "",
        content: campaign.content || "",
        channels: campaign.channels || []
      });
    }
  }, [campaign, form]);
  
  // Check if campaign is editable
  const isEditable = campaign && (
    campaign.status === CampaignStatus.DRAFT || 
    campaign.status === CampaignStatus.SCHEDULED ||
    campaign.status === CampaignStatus.PAUSED
  );
  
  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    if (!campaign) return;
    
    try {
      // Prepare data for submission
      const campaignData = {
        name: values.name,
        description: values.description,
        subject: values.subject,
        content: values.content,
        channels: values.channels,
      };
      
      await updateCampaign.mutateAsync({
        id: campaign.id,
        data: campaignData
      });
      
      toast({
        title: "Campanie actualizată",
        description: "Campania a fost actualizată cu succes.",
      });
      
      setLocation(`/marketing/campaigns/${campaign.id}`);
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la actualizarea campaniei.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton className="h-9 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-8">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!campaign) {
    return (
      <div className="flex-1 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2"
              onClick={() => setLocation("/marketing/campaigns")}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Înapoi</span>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Editare Campanie</h1>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4 py-10">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-medium">Campanie negăsită</h2>
            <p className="text-muted-foreground text-center">
              Campania cu ID-ul specificat nu a fost găsită. Este posibil să fi fost ștearsă sau să nu aveți acces la ea.
            </p>
            <Button onClick={() => setLocation("/marketing/campaigns")}>
              Înapoi la Campanii
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If campaign is not editable, show error message
  if (!isEditable) {
    return (
      <div className="flex-1 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2"
              onClick={() => setLocation(`/marketing/campaigns/${campaign.id}`)}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Înapoi</span>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Editare Campanie</h1>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4 py-10">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-medium">Campanie needitabilă</h2>
            <p className="text-muted-foreground text-center">
              Această campanie nu poate fi editată deoarece este în starea <Badge className="ml-1">{campaign.status}</Badge>
            </p>
            <p className="text-muted-foreground text-center">
              Doar campaniile în stările DRAFT, SCHEDULED sau PAUSED pot fi editate.
            </p>
            <Button onClick={() => setLocation(`/marketing/campaigns/${campaign.id}`)}>
              Înapoi la Detalii Campanie
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex-1 space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => setLocation(`/marketing/campaigns/${campaign.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Înapoi</span>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Editare Campanie</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setLocation(`/marketing/campaigns/${campaign.id}`)}>
            Anulează
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)}>
            <Save className="mr-2 h-4 w-4" />
            Salvează
          </Button>
        </div>
      </div>
      
      {/* Campaign Status */}
      <div className="flex items-center">
        <Badge 
          className={
            campaign.status === CampaignStatus.DRAFT 
              ? "bg-gray-200 text-gray-800" 
              : campaign.status === CampaignStatus.SCHEDULED 
                ? "bg-blue-100 text-blue-800"
                : campaign.status === CampaignStatus.PAUSED
                  ? "bg-yellow-100 text-yellow-800"
                  : ""
          }
          variant="outline"
        >
          {campaign.status === CampaignStatus.DRAFT 
            ? "Ciornă" 
            : campaign.status === CampaignStatus.SCHEDULED 
              ? "Programată" 
              : campaign.status === CampaignStatus.PAUSED
                ? "Pausată"
                : campaign.status}
        </Badge>
        
        {campaign.status === CampaignStatus.SCHEDULED && campaign.scheduledAt && (
          <span className="ml-2 text-sm text-muted-foreground">
            Programată pentru {new Date(campaign.scheduledAt).toLocaleDateString('ro-RO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        )}
      </div>
      
      {/* Edit Warning */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-medium">Limitări de editare</p>
              <p className="text-amber-700 text-sm mt-1">
                În această etapă, puteți edita doar numele, descrierea, subiectul, conținutul și canalele campaniei.
                Tipul campaniei, tipul audienței și programarea nu pot fi modificate. Pentru modificări majore, 
                vă recomandăm să creați o nouă campanie.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Main settings */}
          <Card>
            <CardHeader>
              <CardTitle>Informații Generale</CardTitle>
              <CardDescription>
                Configurați detaliile de bază ale campaniei.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume Campanie</FormLabel>
                    <FormControl>
                      <Input placeholder="Nume campanie" {...field} />
                    </FormControl>
                    <FormDescription>
                      Numele campaniei va fi utilizat pentru identificare și analiză.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descriere</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrieți campania"
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      O scurtă descriere a scopului campaniei.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Display read-only campaign type */}
              <div className="space-y-2">
                <Label>Tip Campanie (read-only)</Label>
                <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted/50">
                  {campaign.type === CampaignType.EMAIL ? (
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Email</span>
                    </div>
                  ) : campaign.type === CampaignType.SMS ? (
                    <div className="flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>SMS</span>
                    </div>
                  ) : campaign.type === CampaignType.SOCIAL ? (
                    <div className="flex items-center">
                      <Share2 className="mr-2 h-4 w-4" />
                      <span>Social Media</span>
                    </div>
                  ) : campaign.type === CampaignType.PUSH ? (
                    <div className="flex items-center">
                      <BellRing className="mr-2 h-4 w-4" />
                      <span>Push Notificare</span>
                    </div>
                  ) : campaign.type === CampaignType.WHATSAPP ? (
                    <div className="flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>WhatsApp</span>
                    </div>
                  ) : campaign.type === CampaignType.MULTI_CHANNEL ? (
                    <div className="flex items-center">
                      <Share2 className="mr-2 h-4 w-4" />
                      <span>Multi-canal</span>
                    </div>
                  ) : (
                    campaign.type
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Tipul campaniei nu poate fi modificat. Pentru a schimba tipul, creați o nouă campanie.
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Conținut</CardTitle>
              <CardDescription>
                Editați conținutul campaniei.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(campaign.type === CampaignType.EMAIL || campaign.type === CampaignType.MULTI_CHANNEL) && (
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subiect Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduceți subiectul" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conținut</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Introduceți conținutul mesajului"
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Puteți folosi variabile precum {'{nume}'}, {'{prenume}'} pentru personalizare.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Channels */}
          <Card>
            <CardHeader>
              <CardTitle>Canale</CardTitle>
              <CardDescription>
                Selectați canalele prin care se va distribui campania.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="channels"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Canale de distribuție</FormLabel>
                      <FormDescription>
                        Selectați unul sau mai multe canale prin care să trimiteți campania.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(CampaignType.EMAIL)}
                            onCheckedChange={(checked) => {
                              const currentValues = [...(field.value || [])];
                              if (checked) {
                                if (!currentValues.includes(CampaignType.EMAIL)) {
                                  field.onChange([...currentValues, CampaignType.EMAIL]);
                                }
                              } else {
                                field.onChange(currentValues.filter(value => value !== CampaignType.EMAIL));
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center">
                            <Mail className="mr-2 h-4 w-4" />
                            Email
                          </FormLabel>
                          <FormDescription>
                            Trimite prin email
                          </FormDescription>
                        </div>
                      </FormItem>
                      
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(CampaignType.SMS)}
                            onCheckedChange={(checked) => {
                              const currentValues = [...(field.value || [])];
                              if (checked) {
                                if (!currentValues.includes(CampaignType.SMS)) {
                                  field.onChange([...currentValues, CampaignType.SMS]);
                                }
                              } else {
                                field.onChange(currentValues.filter(value => value !== CampaignType.SMS));
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            SMS
                          </FormLabel>
                          <FormDescription>
                            Trimite prin SMS
                          </FormDescription>
                        </div>
                      </FormItem>
                      
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(CampaignType.PUSH)}
                            onCheckedChange={(checked) => {
                              const currentValues = [...(field.value || [])];
                              if (checked) {
                                if (!currentValues.includes(CampaignType.PUSH)) {
                                  field.onChange([...currentValues, CampaignType.PUSH]);
                                }
                              } else {
                                field.onChange(currentValues.filter(value => value !== CampaignType.PUSH));
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center">
                            <BellRing className="mr-2 h-4 w-4" />
                            Push
                          </FormLabel>
                          <FormDescription>
                            Trimite notificări push
                          </FormDescription>
                        </div>
                      </FormItem>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Submit buttons */}
          <MarketingFormActions
            cancelHref={`/marketing/campaigns/${campaign.id}`}
            cancelLabel="Anulează"
            submitLabel="Salvează modificările"
            isSubmitting={updateCampaign.isPending}
            isDirty={form.formState.isDirty}
            resetForm={() => form.reset()}
          />
        </form>
      </Form>
    </div>
  );
};

export default EditCampaignPage;