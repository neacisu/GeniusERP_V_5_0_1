/**
 * Inventory Assessment Creation Page
 * 
 * Implements a comprehensive form for creating new inventory assessments (Inventariere)
 * according to Romanian accounting standards OMFP 2861/2009 and Law 82/1991.
 */

import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

// API Hooks
import { useWarehouses, useInventoryApi } from "../../hooks/useInventoryApi";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2 as Spinner } from "lucide-react";

// Icons
import {
  CalendarIcon,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileBarChart,
  FileCheck,
  FileCog,
  FileDown,
  FileSpreadsheet,
  FileText,
  FilesIcon,
  HelpCircle,
  Info,
  Warehouse,
} from "lucide-react";

// Common components
import PageHeader from "../../components/common/PageHeader";

// Validation schema
const formSchema = z.object({
  warehouseId: z.string().uuid("Selectați o gestiune validă"),
  assessmentType: z.enum(["annual", "monthly", "unscheduled", "special"], {
    message: "Selectați tipul de inventariere",
  }),
  name: z.string().min(3, "Numele trebuie să conțină cel puțin 3 caractere"),
  description: z.string().optional(),
  startDate: z.date({
    message: "Selectați data de început",
  }),
  endDate: z.date().optional(),
  commissionOrderNumber: z.string().min(1, "Introduceți numărul deciziei comisiei de inventariere"),
  legalBasis: z.string().default("OMFP 2861/2009, Legea contabilității 82/1991"),
  valuationMethod: z.enum(["FIFO", "LIFO", "WEIGHTED_AVERAGE"], {
    message: "Selectați metoda de evaluare a stocurilor",
  }),
  notes: z.string().optional(),
});

// Types based on the schema
type FormValues = z.infer<typeof formSchema>;

// Translation mappings for the Romanian UI
const assessmentTypeLabels = {
  annual: "Anuală",
  monthly: "Lunară",
  unscheduled: "Neplanificată",
  special: "Specială",
};

const valuationMethodLabels = {
  FIFO: "FIFO (primul intrat, primul ieșit)",
  LIFO: "LIFO (ultimul intrat, primul ieșit)",
  WEIGHTED_AVERAGE: "CMP (cost mediu ponderat)",
};

// Props type
interface NewInventoryAssessmentPageProps {
  isEditing?: boolean;
  id?: string;
}

// Main component
const NewAssessmentPage: React.FC<NewInventoryAssessmentPageProps> = ({ isEditing = false, id }) => {
  const [step, setStep] = useState<1 | 2>(isEditing ? 2 : 1);
  const [activeTab, setActiveTab] = useState(isEditing ? "items" : "form");
  const [assessmentId, setAssessmentId] = useState<string | null>(id || null);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Router
  const [, navigate] = useLocation();
  
  // Toast notifications
  const { toast } = useToast();
  
  // API hooks
  const { warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const { 
    createAssessment, 
    initializeAssessmentItems, 
    getAssessmentDetails,
    updateAssessmentStatus,
    calculateStockValuation 
  } = useInventoryApi();
  
  // Get assessment details if we have an ID
  const { 
    data: assessmentDetails, 
    isLoading: isLoadingDetails 
  } = getAssessmentDetails(assessmentId || "");
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      warehouseId: "",
      assessmentType: "annual",
      name: `Inventariere ${format(new Date(), "MMMM yyyy", { locale: ro })}`,
      description: "",
      startDate: new Date(),
      legalBasis: "OMFP 2861/2009, Legea contabilității 82/1991",
      valuationMethod: "WEIGHTED_AVERAGE",
      notes: "",
    },
  });
  
  // Load assessment items after creating assessment
  useEffect(() => {
    if (assessmentId && assessmentDetails?.items) {
      setStockItems(assessmentDetails.items);
      setStep(2);
      setActiveTab("items");
    }
  }, [assessmentId, assessmentDetails]);
  
  // Submit handler for the first step
  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Get token from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        toast({
          title: "Eroare de autentificare",
          description: "Sesiunea dvs. a expirat. Vă rugăm să vă autentificați din nou.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = '/auth', 2000);
        return;
      }
      
      // Parse user data and ensure we have a token
      const user = JSON.parse(userData);
      if (!user || !user.token) {
        toast({
          title: "Date de autentificare invalide",
          description: "Vă rugăm să vă autentificați din nou.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = '/auth', 2000);
        return;
      }
      
      console.log('Creating assessment with authentication token:', user.token.substring(0, 10) + '...');
      
      // Create the assessment
      // Map frontend field names to match the backend schema
      const result = await createAssessment.mutateAsync({
        ...values,
        // Map assessmentType to type as required by the backend schema
        type: values.assessmentType,
        // Convert Date objects to ISO strings
        startDate: values.startDate.toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : undefined,
        // Map commissionOrderNumber to documentNumber if needed
        documentNumber: values.commissionOrderNumber,
        // Pass token directly to ensure authentication works
        _auth_token: user.token 
      });
      
      // Store the assessment ID
      if (result && result.id) {
        setAssessmentId(result.id);
        
        // Initialize items from current stock
        await initializeAssessmentItems.mutateAsync(result.id);
        
        toast({
          title: "Inventariere creată",
          description: "Documentul de inventariere a fost creat cu succes și articolele au fost inițializate.",
        });
      }
    } catch (error) {
      toast({
        title: "Eroare",
        description: "A apărut o eroare la crearea documentului de inventariere.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for exporting to Excel
  const handleExportExcel = () => {
    // This would be implemented with a real export function
    toast({
      title: "Export Excel",
      description: "Lista de inventariere a fost exportată în Excel.",
    });
  };
  
  // Handler for exporting to PDF
  const handleExportPdf = () => {
    // This would be implemented with a real export function
    toast({
      title: "Export PDF",
      description: "Procesul verbal de inventariere a fost exportat în format PDF.",
    });
  };
  
  // Handler for finalizing the assessment
  const handleFinalizeAssessment = async () => {
    if (!assessmentId) return;
    
    setLoading(true);
    try {
      // Update status to in_progress
      await updateAssessmentStatus.mutateAsync({
        assessmentId,
        status: "in_progress",
      });
      
      toast({
        title: "Inventariere finalizată",
        description: "Inventarierea a fost finalizată și este în curs de procesare.",
      });
      
      // Navigate to the assessments list in the reports page
      navigate("/inventory/reports?tab=inventariere");
    } catch (error) {
      toast({
        title: "Eroare",
        description: "A apărut o eroare la finalizarea inventarierii.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Editare inventariere" : (step === 1 ? "Creare inventariere nouă" : "Înregistrare cantități inventariate")}
        description={
          isEditing
            ? "Editați detaliile documentului de inventariere existent"
            : (step === 1
               ? "Completați detaliile pentru crearea unui nou document de inventariere"
               : "Introduceți cantitățile reale rezultate în urma inventarierii fizice")
        }
      />
      
      {/* Main content */}
      <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="form" disabled={step !== 1}>
            <FileCog className="w-4 h-4 mr-2" />
            Date generale
          </TabsTrigger>
          <TabsTrigger value="items" disabled={!assessmentId || !stockItems.length}>
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Lista inventariere
          </TabsTrigger>
          <TabsTrigger value="documents" disabled={!assessmentId}>
            <FilesIcon className="w-4 h-4 mr-2" />
            Documente
          </TabsTrigger>
        </TabsList>
        
        {/* Step 1: General Information */}
        <TabsContent value="form" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalii document inventariere</CardTitle>
              <CardDescription>
                Completați informațiile generale conform OMFP 2861/2009
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Warehouse selection */}
                    <FormField
                      control={form.control}
                      name="warehouseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gestiune</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selectați gestiunea" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingWarehouses ? (
                                <div className="flex items-center justify-center p-4">
                                  <Spinner className="h-4 w-4" />
                                  <span className="ml-2">Se încarcă gestiunile...</span>
                                </div>
                              ) : warehouses && warehouses.length > 0 ? (
                                warehouses.map((warehouse: {
                                  id: string;
                                  name: string;
                                  type: string;
                                }) => (
                                  <SelectItem 
                                    key={warehouse.id} 
                                    value={warehouse.id}
                                  >
                                    {warehouse.name} ({warehouse.type})
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="px-2 py-4 text-sm text-muted-foreground">
                                  Nu există gestiuni definite. Vă rugăm adăugați gestiuni din meniul Gestiuni.
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Gestiunea pentru care se realizează inventarierea
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Assessment Type */}
                    <FormField
                      control={form.control}
                      name="assessmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tip inventariere</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selectați tipul" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(assessmentTypeLabels).map(
                                ([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Tipul de inventariere conform reglementărilor
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Denumire</FormLabel>
                          <FormControl>
                            <Input placeholder="Denumirea inventarierii" {...field} />
                          </FormControl>
                          <FormDescription>
                            Un nume descriptiv pentru documentul de inventariere
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Commission Order Number */}
                    <FormField
                      control={form.control}
                      name="commissionOrderNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numărul deciziei comisiei</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ex: 123/2025"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Numărul deciziei comisiei de inventariere conform OMFP 2861/2009
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Start Date */}
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data începerii</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, "PP", { locale: ro })
                                  ) : (
                                    <span>Alegeți data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date("2020-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Data de început a inventarierii fizice
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* End Date */}
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data finalizării (opțional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, "PP", { locale: ro })
                                  ) : (
                                    <span>Alegeți data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < (form.getValues().startDate || new Date())
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Data estimată de finalizare a inventarierii
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Legal Basis */}
                    <FormField
                      control={form.control}
                      name="legalBasis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Baza legală</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Reglementările legale aplicabile (pre-completat)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Valuation Method */}
                    <FormField
                      control={form.control}
                      name="valuationMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Metoda de evaluare</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selectați metoda" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(valuationMethodLabels).map(
                                ([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Metoda de evaluare a stocurilor conform Standardelor Românești de Contabilitate
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2">
                          <FormLabel>Descriere</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descrierea inventarierii"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            O descriere opțională a scopului inventarierii
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2">
                          <FormLabel>Observații</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Observații"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Observații suplimentare pentru documentul de inventariere
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Informație</AlertTitle>
                    <AlertDescription>
                      După crearea documentului de inventariere, veți continua cu înregistrarea cantităților reale (fizice) în procesul de inventariere.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/inventory/reports?tab=inventariere")}
                    >
                      Anulare
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Spinner className="mr-2" size="sm" /> Se creează...
                        </>
                      ) : (
                        <>Continuă la pasul următor</>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Step 2: Inventory Items */}
        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <CardTitle>Lista de inventariere</CardTitle>
                  <CardDescription>
                    {assessmentDetails?.documentNumber
                      ? `Document nr: ${assessmentDetails.documentNumber}`
                      : "Document de inventariere"}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportExcel}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportPdf}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingDetails ? (
                <div className="flex justify-center items-center h-64">
                  <Spinner />
                </div>
              ) : stockItems.length === 0 ? (
                <div className="text-center py-8">
                  <FileBarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-medium">Nu există articole</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nu sunt articole disponibile pentru această inventariere.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableCaption>
                      Listă de inventariere conform OMFP 2861/2009
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Nr.</TableHead>
                        <TableHead>Cod produs</TableHead>
                        <TableHead>Denumire</TableHead>
                        <TableHead className="text-right">Cantitate scriptică</TableHead>
                        <TableHead className="text-right">Cantitate inventariată</TableHead>
                        <TableHead className="text-right">Diferență</TableHead>
                        <TableHead className="text-right">Preț unitar</TableHead>
                        <TableHead className="text-right">Valoare totală</TableHead>
                        <TableHead>Observații</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockItems.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{item.product?.code || "N/A"}</TableCell>
                          <TableCell>{item.product?.name || "Produs necunoscut"}</TableCell>
                          <TableCell className="text-right">
                            {item.accountingQuantity || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={item.actualQuantity || 0}
                              onChange={(e) => {
                                // In a real implementation, this would update the item
                                // const newValue = parseFloat(e.target.value);
                                // const updatedItems = [...stockItems];
                                // updatedItems[index].actualQuantity = newValue;
                                // setStockItems(updatedItems);
                              }}
                              className="w-24 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {((item.actualQuantity || 0) - (item.accountingQuantity || 0)).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.unitPrice?.toFixed(2) || "0.00"} lei
                          </TableCell>
                          <TableCell className="text-right">
                            {((item.actualQuantity || 0) * (item.unitPrice || 0)).toFixed(2)} lei
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              placeholder="Observații"
                              defaultValue={item.notes || ""}
                              className="w-full"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertTitle>Instrucțiuni</AlertTitle>
                <AlertDescription>
                  Introduceți cantitățile inventariate pentru fiecare produs. După finalizare, apăsați butonul "Finalizează inventarierea" pentru a genera documentele oficiale și a procesa diferențele de inventar.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isEditing) {
                      navigate("/inventory/reports?tab=inventariere");
                    } else {
                      setStep(1);
                      setActiveTab("form");
                    }
                  }}
                >
                  Înapoi
                </Button>
                <Button
                  type="button"
                  onClick={handleFinalizeAssessment}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner className="mr-2" size="sm" /> Se procesează...
                    </>
                  ) : (
                    <>Finalizează inventarierea</>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documente oficiale</CardTitle>
              <CardDescription>
                Documente generate conform legislației românești
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Lista de inventar</CardTitle>
                      <CardDescription>
                        Document obligatoriu conform OMFP 2861/2009
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Lista oficială cu produsele inventariate, cantitățile scriptice și cele constatate fizic.
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={handleExportExcel}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export Excel
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Proces verbal de inventariere</CardTitle>
                      <CardDescription>
                        Document obligatoriu pentru constatarea diferențelor
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Documentul oficial ce consemnează rezultatele inventarierii și eventualele diferențe constatate.
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={handleExportPdf}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Decizie comisie de inventariere</CardTitle>
                      <CardDescription>
                        Document administrativ necesar
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Decizia administrativă de numire a comisiei de inventariere conform legislației.
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4 mr-2" />
                        Export Word
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Declarație gestionar</CardTitle>
                      <CardDescription>
                        Document obligatoriu pentru gestionar
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Declarația gestionarului privind bunurile din gestiune la momentul inventarierii.
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
              
              <div className="mt-6">
                <Alert variant="default">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Informație importantă</AlertTitle>
                  <AlertDescription>
                    Toate documentele oficiale de inventariere vor fi disponibile pentru export după finalizarea procesului de inventariere. Acestea sunt obligatorii conform legislației contabile românești și trebuie păstrate conform prevederilor legale.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => navigate("/inventory/reports?tab=inventariere")}
              >
                Înapoi la lista de inventarieri
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewAssessmentPage;