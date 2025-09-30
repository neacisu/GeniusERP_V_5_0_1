/**
 * Pagina pentru crearea unui nou raport AI
 */

import React from "react";
import { useLocation } from "wouter";
import { AIModuleLayout } from "../../components/common/AIModuleLayout";
import { useGenerateReport } from "../../hooks/useAIReports";
import { ReportType } from "../../types";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  FileBarChart,
  FileText,
  CalendarIcon,
  ChevronLeft,
  BarChart,
  LineChart,
  PieChart,
  TrendingUp,
  ListChecks,
  LayoutGrid,
  Sparkles
} from "lucide-react";

// Schema de validare pentru formularul de raport
const reportSchema = z.object({
  name: z.string().min(3, {
    message: "Numele raportului trebuie să aibă minim 3 caractere"
  }),
  type: z.enum(["financial_summary", "sales_performance", "inventory_analysis", "customer_insights", "market_trends"] as const, {
    required_error: "Selectează tipul raportului"
  }),
  description: z.string().optional(),
  parameters: z.object({
    period: z.string().optional(),
    focusAreas: z.array(z.string()).optional(),
    metrics: z.array(z.string()).optional(),
    compareWith: z.string().optional()
  }).optional()
});

// Tipul pentru datele din formular
type ReportFormValues = z.infer<typeof reportSchema>;

export default function CreateReportPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { mutate: generateReport, isPending } = useGenerateReport();
  
  // Definim datele inițiale ale formularului
  const defaultValues: Partial<ReportFormValues> = {
    description: "",
    parameters: {
      period: "last_30_days",
      focusAreas: [],
      metrics: [],
      compareWith: ""
    }
  };
  
  // Inițializăm formularul
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues,
  });
  
  // Handler pentru submit-ul formularului
  function onSubmit(values: ReportFormValues) {
    generateReport(values, {
      onSuccess: (data) => {
        if (data.success && data.data) {
          toast({
            title: "Raport generat cu succes",
            description: "Raportul tău a fost creat și este disponibil pentru vizualizare.",
            variant: "default",
          });
          navigate(`/ai/reports/${data.data.id}`);
        } else {
          toast({
            title: "Eroare la generarea raportului",
            description: data.message || "A apărut o eroare neașteptată. Încearcă din nou.",
            variant: "destructive",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Eroare la generarea raportului",
          description: error.message || "A apărut o eroare neașteptată. Încearcă din nou.",
          variant: "destructive",
        });
      }
    });
  }
  
  // Funcție pentru a obține descrierea tipului de raport
  const getReportTypeDescription = (type: ReportType | null) => {
    const descriptions: Record<ReportType, string> = {
      financial_summary: "Analiză financiară detaliată cu metrici cheie, tendințe și recomandări acționabile.",
      sales_performance: "Raport complet despre performanța vânzărilor, cei mai buni vânzători și predicții de venituri.",
      inventory_analysis: "Analiză comprehensivă a stocurilor, rate de rotație și recomandări de optimizare.",
      customer_insights: "Analiză clienți cu segmentare, comportamente și strategii de retenție.",
      market_trends: "Analiză piață cu dezvoltări industriale, concurență și oportunități emergente."
    };
    
    return type ? descriptions[type] : "";
  };

  return (
    <AIModuleLayout
      title="Generează un raport nou"
      description="Creează un raport personalizat generat de inteligență artificială pentru business-ul tău"
      toolbarItems={
        <Button variant="outline" size="sm" onClick={() => navigate("/ai/reports")}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Înapoi la rapoarte
        </Button>
      }
    >
      <div className="max-w-3xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Detalii raport</CardTitle>
                <CardDescription>
                  Completează informațiile de bază pentru raportul tău
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Numele raportului */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nume raport</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Analiză financiară Q2 2025" {...field} />
                      </FormControl>
                      <FormDescription>
                        Titlul raportului care va fi afișat în listă
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Tipul raportului */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tip raport</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează tipul raportului" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="financial_summary" className="flex items-center">
                              <div className="flex items-center">
                                <BarChart className="h-4 w-4 mr-2 text-green-600" />
                                <span>Raport financiar</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="sales_performance">
                              <div className="flex items-center">
                                <LineChart className="h-4 w-4 mr-2 text-blue-600" />
                                <span>Performanță vânzări</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="inventory_analysis">
                              <div className="flex items-center">
                                <PieChart className="h-4 w-4 mr-2 text-amber-600" />
                                <span>Analiză inventar</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="customer_insights">
                              <div className="flex items-center">
                                <LayoutGrid className="h-4 w-4 mr-2 text-purple-600" />
                                <span>Insights clienți</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="market_trends">
                              <div className="flex items-center">
                                <TrendingUp className="h-4 w-4 mr-2 text-indigo-600" />
                                <span>Tendințe piață</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        {form.watch("type") 
                          ? getReportTypeDescription(form.watch("type")) 
                          : "Selectează tipul de raport pe care dorești să-l generezi"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Descriere raport */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descriere (opțional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrie în câteva cuvinte ce ar trebui să conțină acest raport..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        O scurtă descriere a raportului și a scopului său
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Perioadă */}
                <FormField
                  control={form.control}
                  name="parameters.period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perioadă</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează perioada" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="last_7_days">Ultimele 7 zile</SelectItem>
                            <SelectItem value="last_30_days">Ultimele 30 zile</SelectItem>
                            <SelectItem value="last_90_days">Ultimele 90 zile</SelectItem>
                            <SelectItem value="last_year">Ultimul an</SelectItem>
                            <SelectItem value="current_quarter">Trimestrul curent</SelectItem>
                            <SelectItem value="previous_quarter">Trimestrul precedent</SelectItem>
                            <SelectItem value="ytd">De la începutul anului</SelectItem>
                            <SelectItem value="all_time">Tot istoricul</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Perioada pentru care se va genera raportul
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/ai/reports")}
              >
                Anulează
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                className="flex items-center"
              >
                {isPending ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                    Se generează...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generează raport
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AIModuleLayout>
  );
}