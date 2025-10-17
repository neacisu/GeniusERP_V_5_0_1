/**
 * New Template Page
 * 
 * Form for creating a new marketing content template.
 */

import React from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  Share2, 
  BellRing, 
  Save, 
  ExternalLink
} from "lucide-react";
import { CampaignType } from "../../types";
import { useTemplates } from "../../hooks/useMarketingApi";
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
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";

// Form schema
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Numele șablonului trebuie să aibă cel puțin 3 caractere.",
  }),
  type: z.nativeEnum(CampaignType),
  description: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const NewTemplatePage: React.FC = () => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { createTemplate } = useTemplates();
  
  // Form definition
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: CampaignType.EMAIL,
      description: "",
      subject: "",
      content: "",
      category: "",
      isActive: true
    }
  });
  
  // Watch type to conditionally show some fields
  const watchType = form.watch("type");
  
  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    try {
      // Create the template
      const response = await createTemplate.mutateAsync(values);
      
      toast({
        title: "Șablon creat",
        description: "Șablonul a fost creat cu succes.",
      });
      
      // Redirect to the template details page
      navigate(`/marketing/templates/${response.id}`);
    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la crearea șablonului.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex-1 space-y-4 p-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/marketing">Marketing</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/marketing/templates">Șabloane</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Șablon nou</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => navigate("/marketing/templates")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Înapoi</span>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Șablon nou</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate("/marketing/templates")}>
            Anulează
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)}>
            <Save className="mr-2 h-4 w-4" />
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
                Configurați detaliile de bază ale șablonului.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume Șablon</FormLabel>
                    <FormControl>
                      <Input placeholder="Nume șablon" {...field} />
                    </FormControl>
                    <FormDescription>
                      Numele șablonului va fi utilizat pentru identificare.
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
                        placeholder="Descrieți șablonul"
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      O scurtă descriere a scopului și conținutului șablonului.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tip Șablon</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-4">
                          <FormControl>
                            <RadioGroupItem value={CampaignType.EMAIL} />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center">
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Email</span>
                          </FormLabel>
                        </FormItem>
                        
                        <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-4">
                          <FormControl>
                            <RadioGroupItem value={CampaignType.SMS} />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>SMS</span>
                          </FormLabel>
                        </FormItem>
                        
                        <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-4">
                          <FormControl>
                            <RadioGroupItem value={CampaignType.SOCIAL} />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center">
                            <Share2 className="mr-2 h-4 w-4" />
                            <span>Social Media</span>
                          </FormLabel>
                        </FormItem>
                        
                        <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-4">
                          <FormControl>
                            <RadioGroupItem value={CampaignType.PUSH} />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center">
                            <BellRing className="mr-2 h-4 w-4" />
                            <span>Push Notificare</span>
                          </FormLabel>
                        </FormItem>
                        
                        <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-4">
                          <FormControl>
                            <RadioGroupItem value={CampaignType.WHATSAPP} />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>WhatsApp</span>
                          </FormLabel>
                        </FormItem>
                        
                        <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-4">
                          <FormControl>
                            <RadioGroupItem value={CampaignType.MULTI_CHANNEL} />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            <span>Multi-canal</span>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Tipul de șablon determină canalul prin care va fi distribuit.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorie</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează o categorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                        <SelectItem value="promotional">Promoțional</SelectItem>
                        <SelectItem value="transactional">Tranzacțional</SelectItem>
                        <SelectItem value="announcement">Anunț</SelectItem>
                        <SelectItem value="event">Eveniment</SelectItem>
                        <SelectItem value="welcome">Bun venit</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="confirmation">Confirmare</SelectItem>
                        <SelectItem value="other">Altă categorie</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Categorizați șablonul pentru o organizare mai bună.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-4 h-4"
                        />
                        <span>Activ</span>
                      </div>
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormDescription>
                        Dacă este activ, acest șablon poate fi utilizat în campaniile de marketing.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Conținut</CardTitle>
              <CardDescription>
                Definiți conținutul șablonului.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(watchType === CampaignType.EMAIL || watchType === CampaignType.MULTI_CHANNEL) && (
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subiect Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduceți subiectul" {...field} />
                      </FormControl>
                      <FormDescription>
                        Subiectul email-ului creat cu acest șablon.
                      </FormDescription>
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
                        placeholder="Introduceți conținutul șablonului"
                        className="min-h-[300px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Puteți folosi variabile precum {'{nume}'}, {'{prenume}'} pentru personalizare.
                      {watchType === CampaignType.SMS || watchType === CampaignType.WHATSAPP ? 
                        " Pentru mesaje SMS, limitați conținutul la 160 de caractere pentru a evita costuri suplimentare." : ""}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Submit buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => navigate("/marketing/templates")}>
              Anulează
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Salvează șablonul
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewTemplatePage;