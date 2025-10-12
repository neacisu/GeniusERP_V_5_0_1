import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { CalendarIcon, Save, Edit3, Check, Search } from 'lucide-react';
import { useHrApi } from '../../hooks/useHrApi';
import { useToast } from '@/hooks/use-toast';

// Simple debounce implementation
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
};

// Define form validation schema
const contractSchema = z.object({
  // REVISAL Secțiune I: Informații Generale Contract
  employeeId: z.string().min(1, { message: 'Selectați un angajat' }),
  contractNumber: z.string().min(1, { message: 'Numărul contractului este obligatoriu' }),
  revisalId: z.string().optional(),
  registrationNumber: z.string().optional(),

  // REVISAL Secțiune II: Perioada și Tipul Contractului
  startDate: z.date({
    message: "Data de început este obligatorie",
  }),
  endDate: z.date().optional(),
  contractType: z.string().min(1, { message: 'Tipul contractului este obligatoriu' }),
  durationType: z.string().min(1, { message: 'Durata contractului este obligatorie' }),
  contractTypeSpecial: z.string().optional(), // stagiar, ucenicie, etc.
  retirementStatus: z.string().optional(), // pensionar
  
  // REVISAL Secțiune III: Informații Ocupație
  // Funcția oficială conform contractului și COR - obligatorii pentru Revisal
  position: z.string().min(1, { message: 'Funcția oficială este obligatorie pentru contract și Revisal' }),
  corCode: z.string().min(1, { message: 'Codul COR este obligatoriu pentru raportare în Revisal' }),
  corOccupationName: z.string().min(1, { message: 'Denumirea oficială a ocupației conform COR este obligatorie' }),
  
  // REVISAL Secțiune IV: Program de Lucru
  workHours: z.number().int().positive(),
  workingDaysPerWeek: z.number().int().min(1).max(7),
  workNorm: z.string(), // normă întreagă/parțială
  workScheduleType: z.string(), // fix/inegal

  // REVISAL Secțiune V: Salarizare
  grossSalary: z.number().positive({ message: 'Salariul trebuie să fie pozitiv' }),
  currency: z.string(),
  bonusesBenefits: z.string().optional(),
  
  // REVISAL Secțiune VI: Alte date
  status: z.string(),
  isApprenticeshipContract: z.boolean(),
  isInternshipContract: z.boolean(),
  isTelemuncaContract: z.boolean(), // muncă la distanță
  suspensionReason: z.string().optional(),
  suspensionStartDate: z.date().optional(),
  suspensionEndDate: z.date().optional(),
  terminationDate: z.date().optional(),
  terminationReason: z.string().optional(),
  terminationNoticeDate: z.date().optional(),
  
  // Date adiționale
  notes: z.string().optional(),
})
.refine(
  (data) => !data.endDate || (data.endDate && data.startDate && data.endDate > data.startDate), 
  {
    message: "Data de sfârșit trebuie să fie după data de început",
    path: ["endDate"],
  }
)
.refine(
  (data) => !data.suspensionEndDate || (data.suspensionEndDate && data.suspensionStartDate && data.suspensionEndDate > data.suspensionStartDate), 
  {
    message: "Data de sfârșit a suspendării trebuie să fie după data de început",
    path: ["suspensionEndDate"],
  }
);

// Contract interface
interface ContractType {
  id?: string;
  employeeId: string;
  employeeName?: string;
  contractNumber: string;
  revisalId?: string;
  registrationNumber?: string;
  startDate: string | Date;
  endDate?: string | Date;
  contractType: string;
  durationType?: string;
  contractTypeSpecial?: string;
  retirementStatus?: string;
  position: string;
  corCode?: string;
  corOccupationName?: string;
  workHours: number;
  workingDaysPerWeek: number;
  workNorm?: string;
  workScheduleType?: string;
  grossSalary: number;
  currency?: string;
  bonusesBenefits?: string;
  status: string;
  isApprenticeshipContract?: boolean;
  isInternshipContract?: boolean;
  isTelemuncaContract?: boolean;
  suspensionReason?: string;
  suspensionStartDate?: string | Date;
  suspensionEndDate?: string | Date;
  terminationDate?: string | Date;
  terminationReason?: string;
  terminationNoticeDate?: string | Date;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ContractFormProps {
  onSubmit: (data: z.infer<typeof contractSchema>) => void;
  initialData?: ContractType;
  initialEmployeeId?: string;
  isSubmitting?: boolean;
}

/**
 * Contract Form Component
 * Form for creating or editing an employment contract
 * Compatibil cu cerințele REVISAL - conform legislației muncii din România
 */
const ContractForm: React.FC<ContractFormProps> = ({
  onSubmit,
  initialData,
  initialEmployeeId,
  isSubmitting = false,
}) => {
  // State pentru căutarea COR
  const [corSearchTerm, setCorSearchTerm] = useState<string>('');
  const [selectedCorCode, setSelectedCorCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('general');
  
  // State pentru validarea completă a fiecărui tab
  const [tabValidation, setTabValidation] = useState({
    general: initialData ? !!initialData.employeeId && !!initialData.contractNumber && !!initialData.startDate : false,
    details: initialData ? !!initialData.position && !!initialData.corCode && !!initialData.corOccupationName && 
              initialData.workHours > 0 && initialData.workingDaysPerWeek > 0 : false,
    salary: initialData ? initialData.grossSalary > 0 : false,
    status: initialData ? !!initialData.status : false
  });
  
  // State pentru a face track la salvările intermediare de taburi
  const [isSavingTab, setIsSavingTab] = useState(false);
  
  const { toast } = useToast();

  // Use HR API
  const { useEmployees, useCorOccupations } = useHrApi();
  
  // Funcția pentru salvarea datelor din tab-ul curent
  const handleSaveTab = () => {
    setIsSavingTab(true);
    
    // Verificăm validitatea câmpurilor din tab-ul curent
    let isValid = false;
    
    switch(activeTab) {
      case 'general':
        isValid = !!form.getValues('employeeId') && 
                  !!form.getValues('contractNumber') && 
                  !!form.getValues('startDate');
        break;
      case 'occupation':
        isValid = !!form.getValues('position') && 
                  !!form.getValues('corCode') && 
                  !!form.getValues('corOccupationName');
        break;
      case 'schedule':
        isValid = form.getValues('workHours') > 0 && 
                 form.getValues('workingDaysPerWeek') > 0;
        break;
      case 'compensation':
        isValid = form.getValues('grossSalary') > 0;
        break;
      case 'status':
        isValid = !!form.getValues('status');
        break;
    }
    
    if (isValid) {
      // Actualizăm state-ul de validare pentru tab-ul curent
      switch(activeTab) {
        case 'general':
          setTabValidation(prev => ({ ...prev, general: true }));
          break;
        case 'occupation':
        case 'schedule':
          setTabValidation(prev => ({ ...prev, details: true }));
          break;
        case 'compensation':
          setTabValidation(prev => ({ ...prev, salary: true }));
          break;
        case 'status':
          setTabValidation(prev => ({ ...prev, status: true }));
          break;
      }
      
      toast({
        title: "Informații salvate",
        description: `Informațiile din tab-ul curent au fost salvate.`
      });
    } else {
      toast({
        title: "Eroare",
        description: "Completați toate câmpurile obligatorii pentru a salva.",
        variant: "destructive"
      });
    }
    
    setIsSavingTab(false);
  };
  
  // Fetch employees for dropdown
  const { data: employeesResponse } = useEmployees();
  const employees = employeesResponse?.data?.items || [];

  // Fetch COR codes based on search term
  const { 
    data: corResponse, 
    isLoading: isLoadingCor 
  } = useCorOccupations({ search: corSearchTerm });
  const corOccupations = corResponse?.data || [];

  // Debounced search pentru cod COR
  const debouncedCorSearch = debounce((value: string) => {
    if (value.length >= 3) {
      setCorSearchTerm(value);
    }
  }, 300);
  

  
  // Funcția simplă pentru a verifica dacă toate tab-urile sunt valide și complete
  const areAllTabsValid = () => {
    return tabValidation.general && 
           tabValidation.details && 
           tabValidation.salary && 
           tabValidation.status;
  };

  // Initialize form with data or defaults
  const form = useForm<z.infer<typeof contractSchema>>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      employeeId: initialData?.employeeId || initialEmployeeId || '',
      contractNumber: initialData?.contractNumber || '',
      revisalId: initialData?.revisalId || '',
      registrationNumber: initialData?.registrationNumber || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
      endDate: initialData?.endDate ? new Date(initialData.endDate) : undefined,
      contractType: initialData?.contractType || 'full_time',
      durationType: initialData?.durationType || 'indefinite',
      contractTypeSpecial: initialData?.contractTypeSpecial || '',
      retirementStatus: initialData?.retirementStatus || '',
      position: initialData?.position || '',
      corCode: initialData?.corCode || '',
      corOccupationName: initialData?.corOccupationName || '',
      workHours: initialData?.workHours || 8,
      workingDaysPerWeek: initialData?.workingDaysPerWeek || 5,
      workNorm: initialData?.workNorm || 'full_time',
      workScheduleType: initialData?.workScheduleType || 'fixed',
      grossSalary: initialData?.grossSalary || 0,
      currency: initialData?.currency || 'RON',
      bonusesBenefits: initialData?.bonusesBenefits || '',
      status: initialData?.status || 'draft',
      isApprenticeshipContract: initialData?.isApprenticeshipContract || false,
      isInternshipContract: initialData?.isInternshipContract || false,
      isTelemuncaContract: initialData?.isTelemuncaContract || false,
      suspensionReason: initialData?.suspensionReason || '',
      suspensionStartDate: initialData?.suspensionStartDate ? new Date(initialData.suspensionStartDate) : undefined,
      suspensionEndDate: initialData?.suspensionEndDate ? new Date(initialData.suspensionEndDate) : undefined,
      terminationDate: initialData?.terminationDate ? new Date(initialData.terminationDate) : undefined,
      terminationReason: initialData?.terminationReason || '',
      terminationNoticeDate: initialData?.terminationNoticeDate ? new Date(initialData.terminationNoticeDate) : undefined,
      notes: initialData?.notes || '',
    }
  });

  // Efect pentru validarea dinamică a taburilor
  useEffect(() => {
    const currentValues = form.getValues();
    
    // Validează tab-ul General
    const isGeneralValid = !!currentValues.employeeId && 
                          !!currentValues.contractNumber && 
                          !!currentValues.startDate;
    
    // Validează tab-ul Funcție și COR și Program de lucru (amândouă se mapează la 'details')
    const isOccupationValid = !!currentValues.position && 
                             !!currentValues.corCode && 
                             !!currentValues.corOccupationName;
    
    const isScheduleValid = currentValues.workHours > 0 && 
                           currentValues.workingDaysPerWeek > 0;
    
    // Validează tab-ul Salariu
    const isSalaryValid = currentValues.grossSalary > 0;
    
    // Validează tab-ul Status
    const isStatusValid = !!currentValues.status;
    
    setTabValidation({
      general: isGeneralValid,
      details: isOccupationValid && isScheduleValid,
      salary: isSalaryValid,
      status: isStatusValid
    });
  }, [form, form.watch("employeeId"), form.watch("contractNumber"), form.watch("startDate"), 
     form.watch("position"), form.watch("corCode"), form.watch("corOccupationName"),
     form.watch("workHours"), form.watch("workingDaysPerWeek"), 
     form.watch("grossSalary"), form.watch("status")]);
  
  // Selected contract type values
  const contractType = form.watch('contractType');
  const durationType = form.watch('durationType');
  const workNorm = form.watch('workNorm');
  
  // Handle form submission
  const handleSubmit = (values: z.infer<typeof contractSchema>) => {
    onSubmit(values);
  };
  
  // Determină dacă tipul de contract necesită date suplimentare
  const requiresEndDate = ['temporary', 'seasonal', 'internship'].includes(contractType) || durationType === 'fixed';
  
  // Selectarea unui cod COR
  const handleSelectCorOccupation = (corCode: string, occupationName: string) => {
    form.setValue('corCode', corCode);
    form.setValue('corOccupationName', occupationName);
    setSelectedCorCode(corCode);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs 
          defaultValue="general" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full mb-4">
            <TabsTrigger value="general" className="flex items-center gap-1.5">
              Informații generale {tabValidation.general && <Check className="h-4 w-4 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="occupation" className="flex items-center gap-1.5">
              Funcție și COR {tabValidation.details && <Check className="h-4 w-4 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-1.5">
              Program de lucru {tabValidation.details && <Check className="h-4 w-4 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="compensation" className="flex items-center gap-1.5">
              Salarizare {tabValidation.salary && <Check className="h-4 w-4 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-1.5">
              Status contract {tabValidation.status && <Check className="h-4 w-4 text-green-500" />}
            </TabsTrigger>
          </TabsList>
          
{/* Butonul din partea de sus a fost eliminat conform cerințelor */}
          
          {/* Tab: Informații generale contract */}
          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Angajat</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!!initialEmployeeId || !!initialData}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează angajatul" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.lastName} {employee.firstName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contractNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Număr contract</FormLabel>
                    <FormControl>
                      <Input placeholder="Număr contract" {...field} />
                    </FormControl>
                    <FormDescription>
                      Numărul contractului conform registrului intern
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="revisalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID REVISAL</FormLabel>
                    <FormControl>
                      <Input placeholder="ID înregistrare REVISAL" {...field} />
                    </FormControl>
                    <FormDescription>
                      ID-ul de înregistrare din sistemul REVISAL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Număr înregistrare ITM</FormLabel>
                    <FormControl>
                      <Input placeholder="Număr înregistrare la ITM" {...field} />
                    </FormControl>
                    <FormDescription>
                      Numărul de înregistrare în registrul general de evidență
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data început</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, 'P', { locale: ro })
                            ) : (
                              <span className="text-muted-foreground">Selectează data</span>
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
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Data de începere a contractului
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="durationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durata contractului</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează durata" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="indefinite">Nedeterminată</SelectItem>
                        <SelectItem value="fixed">Determinată</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Durata contractului conform legislației
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {durationType === 'fixed' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Data sfârșit
                        {requiresEndDate && <span className="text-red-500 ml-1">*</span>}
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, 'P', { locale: ro })
                              ) : (
                                <span className="text-muted-foreground">
                                  {requiresEndDate ? 'Selectează data' : 'Nedeterminat'}
                                </span>
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
                            initialFocus
                            disabled={(date) => {
                              const startDate = form.getValues('startDate');
                              return startDate ? date < startDate : false;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      {requiresEndDate && !field.value && (
                        <p className="text-sm text-red-500 mt-1">
                          Data de sfârșit este obligatorie pentru contractele pe perioadă determinată
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contractType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tip contract</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează tipul de contract" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full_time">Normă întreagă</SelectItem>
                          <SelectItem value="part_time">Timp parțial</SelectItem>
                          <SelectItem value="temporary">Perioadă determinată</SelectItem>
                          <SelectItem value="seasonal">Sezonier</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Tipul contractului conform legislației muncii
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="isApprenticeshipContract"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Contract de ucenicie
                      </FormLabel>
                      <FormDescription>
                        Contractul este de tip ucenicie
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isInternshipContract"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Contract de stagiu
                      </FormLabel>
                      <FormDescription>
                        Contractul este de tip stagiu
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isTelemuncaContract"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Telemuncă
                      </FormLabel>
                      <FormDescription>
                        Contract cu muncă la distanță
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          {/* Tab: Funcție și Cod COR */}
          <TabsContent value="occupation" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funcție oficială <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Funcția oficială conform contractului de muncă" {...field} />
                    </FormControl>
                    <FormDescription>
                      Titlul oficial al funcției folosit în contractul individual de muncă și Revisal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="corCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cod COR oficial <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Cod COR necesar pentru Revisal" 
                          {...field}
                          readOnly={!!selectedCorCode}
                        />
                      </FormControl>
                      <FormDescription>
                        Codul COR conform Clasificării Ocupațiilor din România, obligatoriu pentru raportare Revisal
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="corOccupationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Denumire ocupație oficială <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Denumirea oficială a ocupației conform nomenclatorului COR" 
                          {...field}
                          readOnly={!!selectedCorCode}
                        />
                      </FormControl>
                      <FormDescription>
                        Denumirea oficială a ocupației conform nomenclatorului COR, obligatorie pentru raportarea Revisal
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="mt-4 p-4 border border-gray-200 rounded-md">
              <h3 className="mb-2 text-lg font-medium">Căutare cod COR obligatoriu pentru Revisal</h3>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Caută denumire sau cod ocupație conform COR..." 
                    className="pl-8"
                    onChange={(e) => debouncedCorSearch(e.target.value)}
                  />
                  <FormDescription className="mt-1 text-xs">
                    Introdu minim 3 caractere pentru a începe căutarea în nomenclatorul național COR
                  </FormDescription>
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {isLoadingCor ? (
                  <div className="p-4 text-center">Se încarcă...</div>
                ) : corOccupations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {corSearchTerm.length >= 3 
                      ? "Nu au fost găsite ocupații" 
                      : "Introduceți minim 3 caractere pentru a căuta"}
                  </div>
                ) : (
                  <div className="divide-y">
                    {corOccupations.map((occupation: any) => (
                      <div
                        key={occupation.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                        onClick={() => handleSelectCorOccupation(occupation.code, occupation.name)}
                      >
                        <div>
                          <div className="font-medium">{occupation.name}</div>
                          <div className="text-sm text-muted-foreground">Cod COR: {occupation.code}</div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Selectează
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Tab: Program de lucru */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="workNorm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Norma de lucru</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează norma de lucru" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full_time">Normă întreagă</SelectItem>
                        <SelectItem value="part_time">Normă parțială</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Tipul normei de lucru conform contractului
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="workScheduleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tip program de lucru</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează tipul programului" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Program fix</SelectItem>
                        <SelectItem value="flexible">Program flexibil</SelectItem>
                        <SelectItem value="uneven">Repartizare inegală</SelectItem>
                        <SelectItem value="shifts">Program în ture</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Tipul programului de lucru
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="workHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ore pe zi</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="24" 
                        step="1" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Numărul de ore de lucru pe zi
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="workingDaysPerWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zile lucrătoare pe săptămână</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează zilele" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 zi</SelectItem>
                        <SelectItem value="2">2 zile</SelectItem>
                        <SelectItem value="3">3 zile</SelectItem>
                        <SelectItem value="4">4 zile</SelectItem>
                        <SelectItem value="5">5 zile</SelectItem>
                        <SelectItem value="6">6 zile</SelectItem>
                        <SelectItem value="7">7 zile</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Numărul de zile lucrătoare pe săptămână
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          {/* Tab: Salarizare */}
          <TabsContent value="compensation" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="grossSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salariu brut</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Salariul brut lunar în moneda selectată
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monedă</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="RON">RON (Lei)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        <SelectItem value="USD">USD (Dolari)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Moneda în care este exprimat salariul
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="bonusesBenefits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bonusuri și beneficii</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrieți bonusurile, primele și alte beneficii prevăzute în contract"
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Orice bonusuri, prime sau alte beneficii menţionate în contract
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          {/* Tab: Status contract */}
          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status contract</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează statusul" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Ciornă</SelectItem>
                        <SelectItem value="pending">În așteptare</SelectItem>
                        <SelectItem value="active">Activ</SelectItem>
                        <SelectItem value="suspended">Suspendat</SelectItem>
                        <SelectItem value="expired">Expirat</SelectItem>
                        <SelectItem value="terminated">Încetat</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Statusul actual al contractului
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {form.watch('status') === 'suspended' && (
              <div className="border p-4 rounded-md space-y-4">
                <h3 className="text-lg font-medium">Detalii suspendare</h3>
                
                <FormField
                  control={form.control}
                  name="suspensionReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motiv suspendare</FormLabel>
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează motivul suspendării" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="medical_leave">Concediu medical</SelectItem>
                          <SelectItem value="parental_leave">Concediu creștere copil</SelectItem>
                          <SelectItem value="unpaid_leave">Concediu fără plată</SelectItem>
                          <SelectItem value="technical_unemployment">Șomaj tehnic</SelectItem>
                          <SelectItem value="force_majeure">Forță majoră</SelectItem>
                          <SelectItem value="other">Alt motiv</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="suspensionStartDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data început suspendare</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, 'P', { locale: ro })
                                ) : (
                                  <span className="text-muted-foreground">Selectează data</span>
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
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="suspensionEndDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data sfârșit suspendare</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, 'P', { locale: ro })
                                ) : (
                                  <span className="text-muted-foreground">Selectează data</span>
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
                              initialFocus
                              disabled={(date) => {
                                const startDate = form.getValues('suspensionStartDate');
                                return startDate ? date < startDate : false;
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            {form.watch('status') === 'terminated' && (
              <div className="border p-4 rounded-md space-y-4">
                <h3 className="text-lg font-medium">Detalii încetare contract</h3>
                
                <FormField
                  control={form.control}
                  name="terminationReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motiv încetare</FormLabel>
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează motivul încetării" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="agreement">Acordul părților</SelectItem>
                          <SelectItem value="employee_initiative">Demisie</SelectItem>
                          <SelectItem value="employer_initiative">Concediere</SelectItem>
                          <SelectItem value="disciplinary">Disciplinar</SelectItem>
                          <SelectItem value="retirement">Pensionare</SelectItem>
                          <SelectItem value="death">Deces</SelectItem>
                          <SelectItem value="expiration">Expirare perioadă determinată</SelectItem>
                          <SelectItem value="other">Alt motiv</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="terminationDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data încetare contract</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, 'P', { locale: ro })
                                ) : (
                                  <span className="text-muted-foreground">Selectează data</span>
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
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="terminationNoticeDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data notificare încetare</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, 'P', { locale: ro })
                                ) : (
                                  <span className="text-muted-foreground">Selectează data</span>
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
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note și clauze adiționale</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note, clauze sau observații privind contractul"
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Clauze speciale, observații sau note adiționale despre contract
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isSubmitting}
          >
            Anulează
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-1.5"
            onClick={handleSaveTab}
            disabled={isSavingTab}
          >
            {isSavingTab ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvează...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvează informații
              </>
            )}
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !areAllTabsValid()}
            title={!areAllTabsValid() ? "Completați toate taburile pentru a putea salva contractul" : ""}>
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Se salvează...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {initialData ? 'Actualizează contract' : 'Salvează contract'}
              </div>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ContractForm;