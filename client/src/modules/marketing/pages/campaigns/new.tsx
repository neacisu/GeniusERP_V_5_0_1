/**
 * New Campaign Page
 * 
 * Form for creating a new marketing campaign.
 */

import React from "react";
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
  Send, 
  Users,
  FileText,
  ChevronRight
} from "lucide-react";
import { CampaignType, CampaignStatus, AudienceType } from "../../types";
import { useCampaigns, useSegments, useTemplates } from "../../hooks/useMarketingApi";
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
import { Separator } from "@/components/ui/separator";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Form schema
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Numele campaniei trebuie să aibă cel puțin 3 caractere.",
  }),
  description: z.string().optional(),
  type: z.nativeEnum(CampaignType, {
    errorMap: () => ({ message: "Selectați tipul campaniei." }),
  }),
  audienceType: z.nativeEnum(AudienceType, {
    errorMap: () => ({ message: "Selectați tipul de audiență." }),
  }),
  audienceId: z.string().optional(),
  templateId: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  schedulingMode: z.enum(["now", "scheduled"]),
  scheduledAt: z.date().optional(),
  channels: z.array(z.string()).min(1, {
    message: "Selectați cel puțin un canal de comunicare.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const NewCampaignPage: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { createCampaign } = useCampaigns();
  const { segments } = useSegments();
  const { templates } = useTemplates();
  
  // Get template ID from query params if provided
  const params = new URLSearchParams(window.location.search);
  const templateIdParam = params.get('templateId');
  const segmentIdParam = params.get('segmentId');
  
  // Default form values
  const defaultValues: Partial<FormValues> = {
    type: CampaignType.EMAIL,
    audienceType: AudienceType.ALL_CUSTOMERS,
    schedulingMode: "now",
    channels: [CampaignType.EMAIL],
    templateId: templateIdParam || undefined,
    audienceId: segmentIdParam || undefined,
  };
  
  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  const selectedType = form.watch("type");
  const audienceType = form.watch("audienceType");
  const schedulingMode = form.watch("schedulingMode");
  
  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    try {
      // Prepare data for submission
      const campaignData = {
        name: values.name,
        description: values.description,
        type: values.type,
        audienceType: values.audienceType,
        audienceId: values.audienceId,
        templateId: values.templateId,
        subject: values.subject,
        content: values.content,
        scheduledAt: values.schedulingMode === "scheduled" ? values.scheduledAt : undefined,
        status: values.schedulingMode === "now" ? CampaignStatus.ACTIVE : CampaignStatus.SCHEDULED,
        channels: values.channels,
      };
      
      await createCampaign.mutateAsync(campaignData);
      setLocation("/marketing/campaigns");
    } catch (error) {
      console.error("Error creating campaign:", error);
    }
  };
  
  return (
    <div className="flex-1 space-y-4 p-6">
      {/* Header */}
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
          <h1 className="text-3xl font-bold tracking-tight">Campanie Nouă</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => form.reset(defaultValues)}>
            Resetează
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)}>
            <Send className="mr-2 h-4 w-4" />
            Salvează
          </Button>
        </div>
      </div>
      
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
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tip Campanie</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați tipul campaniei" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CampaignType.EMAIL}>
                            <div className="flex items-center">
                              <Mail className="mr-2 h-4 w-4" />
                              <span>Email</span>
                            </div>
                          </SelectItem>
                          <SelectItem value={CampaignType.SMS}>
                            <div className="flex items-center">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              <span>SMS</span>
                            </div>
                          </SelectItem>
                          <SelectItem value={CampaignType.SOCIAL}>
                            <div className="flex items-center">
                              <Share2 className="mr-2 h-4 w-4" />
                              <span>Social Media</span>
                            </div>
                          </SelectItem>
                          <SelectItem value={CampaignType.PUSH}>
                            <div className="flex items-center">
                              <BellRing className="mr-2 h-4 w-4" />
                              <span>Push Notificare</span>
                            </div>
                          </SelectItem>
                          <SelectItem value={CampaignType.WHATSAPP}>
                            <div className="flex items-center">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              <span>WhatsApp</span>
                            </div>
                          </SelectItem>
                          <SelectItem value={CampaignType.MULTI_CHANNEL}>
                            <div className="flex items-center">
                              <Share2 className="mr-2 h-4 w-4" />
                              <span>Multi-canal</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Selectați tipul principal al campaniei. Aceasta determină formatul și caracteristicile disponibile.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Audience settings */}
          <Card>
            <CardHeader>
              <CardTitle>Audiență</CardTitle>
              <CardDescription>
                Configurați cine va primi mesajele campaniei.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="audienceType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tip Audiență</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={AudienceType.ALL_CUSTOMERS} id="all" />
                          <Label htmlFor="all">Toți Clienții</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={AudienceType.SEGMENT} id="segment" />
                          <Label htmlFor="segment">Segment</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={AudienceType.CUSTOM} id="custom" />
                          <Label htmlFor="custom">Audiență personalizată</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {audienceType === AudienceType.SEGMENT && (
                <FormField
                  control={form.control}
                  name="audienceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Segment</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați segmentul" />
                          </SelectTrigger>
                          <SelectContent>
                            {segments.map((segment) => (
                              <SelectItem key={segment.id} value={segment.id}>
                                {segment.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        <Button variant="link" className="p-0 h-auto" asChild>
                          <a href="/marketing/segments/new" target="_blank" rel="noopener noreferrer">
                            Creați un segment nou
                          </a>
                        </Button>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {audienceType === AudienceType.CUSTOM && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <p className="text-amber-800 text-sm">
                    Configurarea audienței personalizate va fi disponibilă în curând.
                    Între timp, vă recomandăm să folosiți segmente predefinite.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Conținut</CardTitle>
              <CardDescription>
                Configurați conținutul campaniei.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="template" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="template">
                    <FileText className="mr-2 h-4 w-4" />
                    Șablon
                  </TabsTrigger>
                  <TabsTrigger value="custom">
                    <FileText className="mr-2 h-4 w-4" />
                    Conținut personalizat
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="template" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="templateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Șablon</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selectați un șablon" />
                            </SelectTrigger>
                            <SelectContent>
                              {templates
                                .filter(template => template.type === selectedType || selectedType === CampaignType.MULTI_CHANNEL)
                                .map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          <Button variant="link" className="p-0 h-auto" asChild>
                            <a href="/marketing/templates/new" target="_blank" rel="noopener noreferrer">
                              Creați un șablon nou
                            </a>
                          </Button>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="custom" className="space-y-4">
                  {(selectedType === CampaignType.EMAIL || selectedType === CampaignType.MULTI_CHANNEL) && (
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
                </TabsContent>
              </Tabs>
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
          
          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle>Programare</CardTitle>
              <CardDescription>
                Când doriți să trimiteți campania.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="schedulingMode"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="now" id="now" />
                          <Label htmlFor="now">Trimite imediat</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="scheduled" id="scheduled" />
                          <Label htmlFor="scheduled">Programează pentru mai târziu</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {schedulingMode === "scheduled" && (
                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col mt-4">
                      <FormLabel>Data programată</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP HH:mm", { locale: ro })
                              ) : (
                                <span>Selectați data și ora</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            locale={ro}
                          />
                          <div className="p-3 border-t">
                            <div className="flex items-center space-x-2">
                              <Label>Ora:</Label>
                              <Select
                                value={field.value ? format(field.value, "HH:mm") : undefined}
                                onValueChange={(value) => {
                                  const [hours, minutes] = value.split(":").map(Number);
                                  const date = field.value || new Date();
                                  date.setHours(hours);
                                  date.setMinutes(minutes);
                                  field.onChange(date);
                                }}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue placeholder="Selectați ora" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }).map((_, hour) => (
                                    <React.Fragment key={hour}>
                                      <SelectItem value={`${hour.toString().padStart(2, '0')}:00`}>
                                        {hour.toString().padStart(2, '0')}:00
                                      </SelectItem>
                                      <SelectItem value={`${hour.toString().padStart(2, '0')}:30`}>
                                        {hour.toString().padStart(2, '0')}:30
                                      </SelectItem>
                                    </React.Fragment>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Campania va fi trimisă la data și ora selectată.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
          
          {/* Submit buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => setLocation("/marketing/campaigns")}>
              Anulează
            </Button>
            <Button type="submit">
              <Send className="mr-2 h-4 w-4" />
              {schedulingMode === "now" ? "Trimite Campanie" : "Programează Campanie"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewCampaignPage;