/**
 * Edit Template Page
 * 
 * Form for editing a marketing content template.
 */

import React, { useEffect } from "react";
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
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { CampaignType } from "../../types";
import { useTemplate } from "../../hooks/useMarketingApi";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  description: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditTemplatePageProps {
  id: string;
}

const EditTemplatePage: React.FC<EditTemplatePageProps> = ({ id }) => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { template, isLoading, updateTemplate } = useTemplate(id);
  
  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      subject: "",
      content: "",
      category: "",
      isActive: false
    }
  });
  
  // Update form when template data is loaded
  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        description: template.description || "",
        subject: template.subject || "",
        content: template.content || "",
        category: template.category || "",
        isActive: template.isActive
      });
    }
  }, [template, form]);
  
  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    if (!template) return;
    
    try {
      // Prepare data for submission
      const templateData = {
        name: values.name,
        description: values.description,
        subject: values.subject,
        content: values.content,
        category: values.category,
        isActive: values.isActive
      };
      
      await updateTemplate.mutateAsync({
        id: template.id,
        data: templateData
      });
      
      toast({
        title: "Șablon actualizat",
        description: "Șablonul a fost actualizat cu succes.",
      });
      
      navigate(`/marketing/templates/${template.id}`);
    } catch (error) {
      console.error("Error updating template:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la actualizarea șablonului.",
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
  
  if (!template) {
    return (
      <div className="flex-1 space-y-4 p-6">
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
              <BreadcrumbLink>Eroare</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
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
            <h1 className="text-3xl font-bold tracking-tight">Editare Șablon</h1>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4 py-10">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-medium">Șablon negăsit</h2>
            <p className="text-muted-foreground text-center">
              Șablonul cu ID-ul specificat nu a fost găsit. Este posibil să fi fost șters sau să nu aveți acces la el.
            </p>
            <Button onClick={() => navigate("/marketing/templates")}>
              Înapoi la Șabloane
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
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
            <BreadcrumbLink href={`/marketing/templates/${template.id}`}>{template.name}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Editare</BreadcrumbLink>
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
            onClick={() => navigate(`/marketing/templates/${template.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Înapoi</span>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Editare Șablon</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate(`/marketing/templates/${template.id}`)}>
            Anulează
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)}>
            <Save className="mr-2 h-4 w-4" />
            Salvează
          </Button>
        </div>
      </div>
      
      {/* Template Type Badge */}
      <div className="flex items-center">
        <Badge 
          variant="outline"
          className="px-2 py-1"
        >
          {template.type === CampaignType.EMAIL && (
            <div className="flex items-center">
              <Mail className="mr-2 h-4 w-4" />
              <span>Șablon Email</span>
            </div>
          )}
          {template.type === CampaignType.SMS && (
            <div className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Șablon SMS</span>
            </div>
          )}
          {template.type === CampaignType.SOCIAL && (
            <div className="flex items-center">
              <Share2 className="mr-2 h-4 w-4" />
              <span>Șablon Social Media</span>
            </div>
          )}
          {template.type === CampaignType.PUSH && (
            <div className="flex items-center">
              <BellRing className="mr-2 h-4 w-4" />
              <span>Șablon Push Notificare</span>
            </div>
          )}
          {template.type === CampaignType.WHATSAPP && (
            <div className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Șablon WhatsApp</span>
            </div>
          )}
          {template.type === CampaignType.MULTI_CHANNEL && (
            <div className="flex items-center">
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>Șablon Multi-canal</span>
            </div>
          )}
        </Badge>
        
        <span className="ml-2 text-sm text-muted-foreground">
          Tipul șablonului nu poate fi modificat.
        </span>
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorie</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || ""}
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
                Editați conținutul șablonului.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(template.type === CampaignType.EMAIL || template.type === CampaignType.MULTI_CHANNEL) && (
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
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Preview (read-only for now) */}
          <Card>
            <CardHeader>
              <CardTitle>Previzualizare</CardTitle>
              <CardDescription>
                Vedeți cum va arăta șablonul în mod real.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center border rounded-md p-8 bg-muted/30 text-center">
                <div>
                  <p className="text-muted-foreground mb-2">
                    Previzualizarea în timp real va fi disponibilă în curând.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Puteți vizualiza șablonul complet după salvare.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Submit buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => navigate(`/marketing/templates/${template.id}`)}>
              Anulează
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Salvează modificările
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditTemplatePage;