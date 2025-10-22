import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, isWeekend, differenceInBusinessDays, addDays, isAfter, isBefore } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
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
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHrApi } from '../../hooks/useHrApi';
import { 
  AlertCircle, 
  CalendarIcon, 
  FileText, 
  FileSymlink, 
  Save, 
  CalendarDays,
  Check,
  User,
  Briefcase,
  FileCheck
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Definim schema de validare pentru absențe
const absenceSchema = z.object({
  employeeId: z.string().min(1, { message: 'Selectați un angajat' }),
  absenceType: z.string().min(1, { message: 'Selectați tipul de absență' }),
  absenceCode: z.string().min(1, { message: 'Selectați codul de absență' }).optional(),
  medicalLeaveCode: z.string().optional(),
  startDate: z.date({
    message: "Data de început este obligatorie",
  }),
  endDate: z.date({
    message: "Data de sfârșit este obligatorie",
  }),
  workingDays: z.number().int().positive({ message: 'Numărul zilelor lucrătoare trebuie să fie pozitiv' }),
  notes: z.string().optional(),
  
  // Câmpuri pentru concediu medical
  medicalCertificateNumber: z.string().optional(),
  medicalCertificateDate: z.date().optional(),
  medicalCertificateIssuedBy: z.string().optional(),
  
  // Câmpuri de aprobare
  status: z.string()
})
.refine(
  (data) => !isBefore(data.endDate, data.startDate), 
  {
    message: "Data de sfârșit trebuie să fie după data de început",
    path: ["endDate"]
  }
)
.refine(
  (data) => {
    // Validare specifică pentru certificate medicale când tipul este concediu medical
    if (data.absenceType === 'medical_leave') {
      return !!data.medicalCertificateNumber && 
             !!data.medicalCertificateDate && 
             !!data.medicalCertificateIssuedBy &&
             !!data.medicalLeaveCode;
    }
    return true;
  },
  {
    message: "Pentru concediul medical, toate detaliile certificatului medical sunt obligatorii",
    path: ["medicalCertificateNumber"]
  }
);

// Definim tipul pentru formularul de absențe (inferred from Zod schema)
type AbsenceFormValues = z.infer<typeof absenceSchema>;

// Interfața pentru datele inițiale ale absenței
interface AbsenceInitialData {
  id?: string;
  employeeId: string;
  absenceType: string;
  absenceCode?: string;
  medicalLeaveCode?: string;
  startDate: Date;
  endDate: Date;
  workingDays: number;
  status: string;
  notes?: string;
  medicalCertificateNumber?: string;
  medicalCertificateDate?: Date;
  medicalCertificateIssuedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Interfața pentru props-urile componentei
interface AbsenceFormProps {
  onSubmit: (data: AbsenceFormValues) => void;
  initialData?: AbsenceInitialData;
  isSubmitting?: boolean;
  defaultEmployeeId?: string;
}

/**
 * Formular pentru crearea și editarea absențelor
 * 
 * Acest formular permite administratorilor HR să creeze și să editeze
 * absențe cu toate detaliile necesare conform standardelor românești.
 */
const AbsenceForm: React.FC<AbsenceFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting = false,
  defaultEmployeeId
}) => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [autoCalculateWorkingDays, setAutoCalculateWorkingDays] = useState<boolean>(true);
  const { toast } = useToast();

  // Preluăm API-urile HR
  const { useEmployees } = useHrApi();
  
  // Obținem angajații
  const { data: employeesResponse, isLoading: isLoadingEmployees } = useEmployees();
  const employees = employeesResponse?.data?.items || [];
  
  // Obținem zilele de sărbătoare legală direct de la API folosind React Query
  const { data: holidaysResponse, isLoading: isLoadingHolidays } = useQuery({
    queryKey: ['/api/hr/holidays'],
    queryFn: async () => {
      const response = await apiRequest('/api/hr/holidays');
      return await response.json();
    },
    staleTime: 24 * 60 * 60 * 1000 // 24 ore
  });
  const holidays = holidaysResponse?.data || [];
  
  // Convertim zilele de sărbătoare în Date
  const holidayDates = useMemo(() => {
    return holidays.map((holiday: { date: string; name: string }) => new Date(holiday.date));
  }, [holidays]);

  // Inițializăm formularul cu datele absenței sau valori implicite
  const form = useForm<AbsenceFormValues>({
    resolver: zodResolver(absenceSchema),
    defaultValues: {
      employeeId: initialData?.employeeId || defaultEmployeeId || '',
      absenceType: initialData?.absenceType || '',
      absenceCode: initialData?.absenceCode || '',
      medicalLeaveCode: initialData?.medicalLeaveCode || '',
      startDate: initialData?.startDate || new Date(),
      endDate: initialData?.endDate || addDays(new Date(), 1),
      workingDays: initialData?.workingDays || 1,
      notes: initialData?.notes || '',
      status: initialData?.status || 'pending',
      medicalCertificateNumber: initialData?.medicalCertificateNumber || '',
      medicalCertificateDate: initialData?.medicalCertificateDate || undefined,
      medicalCertificateIssuedBy: initialData?.medicalCertificateIssuedBy || ''
    }
  });

  // Funcție pentru calculul zilelor lucrătoare, excluzând weekendurile și sărbătorile
  const calculateWorkingDays = (start: Date, end: Date): number => {
    let count = 0;
    let currentDate = new Date(start);
    
    while (currentDate <= end) {
      // Verificăm dacă ziua curentă nu este weekend și nu este sărbătoare
      const isHoliday = holidayDates.some(
        (holiday: Date) => 
          holiday.getDate() === currentDate.getDate() && 
          holiday.getMonth() === currentDate.getMonth() && 
          holiday.getFullYear() === currentDate.getFullYear()
      );
      
      if (!isWeekend(currentDate) && !isHoliday) {
        count++;
      }
      
      currentDate = addDays(currentDate, 1);
    }
    
    return count;
  };

  // Actualizăm zilele lucrătoare când se modifică datele de început și sfârșit
  useEffect(() => {
    if (autoCalculateWorkingDays) {
      const startDate = form.getValues('startDate');
      const endDate = form.getValues('endDate');
      
      if (startDate && endDate && !isBefore(endDate, startDate)) {
        const workDays = calculateWorkingDays(startDate, endDate);
        form.setValue('workingDays', workDays);
      }
    }
  }, [form.watch('startDate'), form.watch('endDate'), autoCalculateWorkingDays]);

  // Când se schimbă tipul de absență, ajustăm formularul
  useEffect(() => {
    const absenceType = form.watch('absenceType');
    
    if (absenceType === 'annual_leave') {
      form.setValue('absenceCode', 'CO');
      form.setValue('medicalLeaveCode', '');
    } else if (absenceType === 'medical_leave') {
      form.setValue('absenceCode', 'CM');
    } else if (absenceType === 'unpaid_leave') {
      form.setValue('absenceCode', 'CFS');
      form.setValue('medicalLeaveCode', '');
    } else if (absenceType === 'study_leave') {
      form.setValue('absenceCode', 'CS');
      form.setValue('medicalLeaveCode', '');
    } else if (absenceType === 'special_leave') {
      form.setValue('absenceCode', 'CE');
      form.setValue('medicalLeaveCode', '');
    }
    
    // Resetăm datele certificatului medical dacă nu este concediu medical
    if (absenceType !== 'medical_leave') {
      form.setValue('medicalCertificateNumber', '');
      form.setValue('medicalCertificateDate', undefined);
      form.setValue('medicalCertificateIssuedBy', '');
      form.setValue('medicalLeaveCode', '');
    }
  }, [form.watch('absenceType')]);

  // Gestionăm trimiterea formularului
  const handleSubmit = (values: AbsenceFormValues) => {
    onSubmit(values);
  };

  // Verificăm dacă absența este de tip medical pentru a afișa câmpurile adecvate
  const isMedicalLeave = form.watch('absenceType') === 'medical_leave';

  // Gestionăm schimbarea stării de calcul automat al zilelor lucrătoare
  const handleAutoCalculateChange = (checked: boolean) => {
    setAutoCalculateWorkingDays(checked);
    
    if (checked) {
      const startDate = form.getValues('startDate');
      const endDate = form.getValues('endDate');
      
      if (startDate && endDate && !isBefore(endDate, startDate)) {
        const workDays = calculateWorkingDays(startDate, endDate);
        form.setValue('workingDays', workDays);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Înregistrare absență</CardTitle>
            <CardDescription>Completați informațiile despre absența angajatului</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Secțiunea 1: Informații generale */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="h-5 w-5" />
                Informații generale
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Angajat</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați angajatul" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingEmployees ? (
                            <SelectItem value="loading" disabled>Se încarcă angajații...</SelectItem>
                          ) : employees.length === 0 ? (
                            <SelectItem value="none" disabled>Nu există angajați</SelectItem>
                          ) : (
                            employees.map((employee: any) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.lastName} {employee.firstName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selectați angajatul pentru care înregistrați absența
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="absenceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tip absență</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați tipul de absență" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="annual_leave">Concediu de odihnă (CO)</SelectItem>
                          <SelectItem value="medical_leave">Concediu medical (CM)</SelectItem>
                          <SelectItem value="unpaid_leave">Concediu fără salariu (CFS)</SelectItem>
                          <SelectItem value="study_leave">Concediu de studii (CS)</SelectItem>
                          <SelectItem value="special_leave">Concediu evenimente speciale (CE)</SelectItem>
                          <SelectItem value="other">Altă absență</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Tipul de absență conform clasificării standard
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {form.watch('absenceType') === 'other' && (
                  <FormField
                    control={form.control}
                    name="absenceCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cod absență</FormLabel>
                        <FormControl>
                          <Input placeholder="Introduceți codul de absență" {...field} />
                        </FormControl>
                        <FormDescription>
                          Codul de absență specific (dacă este cazul)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați statusul" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">În așteptare</SelectItem>
                          <SelectItem value="approved">Aprobat</SelectItem>
                          <SelectItem value="rejected">Respins</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Statusul curent al absenței
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            {/* Secțiunea 2: Perioadă absență */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Perioadă absență
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de început</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ro })
                              ) : (
                                <span>Selectați data de început</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => 
                              isAfter(date, form.getValues('endDate'))
                            }
                            initialFocus
                            locale={ro}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Prima zi de absență
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de sfârșit</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ro })
                              ) : (
                                <span>Selectați data de sfârșit</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => 
                              isBefore(date, form.getValues('startDate'))
                            }
                            initialFocus
                            locale={ro}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Ultima zi de absență
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-calculate"
                    checked={autoCalculateWorkingDays}
                    onCheckedChange={handleAutoCalculateChange}
                  />
                  <Label htmlFor="auto-calculate">Calculează automat zilele lucrătoare</Label>
                </div>
                
                <FormField
                  control={form.control}
                  name="workingDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zile lucrătoare</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.5" 
                          placeholder="0" 
                          {...field}
                          disabled={autoCalculateWorkingDays}
                          onChange={(e) => {
                            const value = e.target.value === '' ? '0' : e.target.value;
                            field.onChange(parseFloat(value));
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Numărul de zile lucrătoare aferente perioadei de absență
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch('startDate') && form.watch('endDate') && (
                  <Alert className="mt-4 bg-primary/5 border border-primary/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Informație</AlertTitle>
                    <AlertDescription>
                      Perioada selectată: {form.watch('startDate') ? format(form.watch('startDate'), "PPP", { locale: ro }) : '-'} -&gt; {form.watch('endDate') ? format(form.watch('endDate'), "PPP", { locale: ro }) : '-'} 
                      <br />
                      Durată totală: {form.watch('startDate') && form.watch('endDate') ? Math.ceil((form.watch('endDate').getTime() - form.watch('startDate').getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0} zile calendaristice
                      <br />
                      Zile lucrătoare: {form.watch('workingDays')} zile
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Secțiunea 3: Certificat medical (doar pentru concediu medical) */}
            {isMedicalLeave && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Certificat medical <Badge variant="outline" className="ml-1">CM</Badge>
                </h3>
                
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Document obligatoriu</AlertTitle>
                  <AlertDescription>
                    Concediul medical trebuie obligatoriu să aibă atașat certificatul medical în original.
                  </AlertDescription>
                </Alert>
                
                <FormField
                  control={form.control}
                  name="medicalLeaveCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cod concediu medical</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați codul de concediu medical" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="01">01 - Boală obișnuită</SelectItem>
                          <SelectItem value="02">02 - Accident în timpul deplasării la/de la locul de muncă</SelectItem>
                          <SelectItem value="03">03 - Accident de muncă</SelectItem>
                          <SelectItem value="04">04 - Boală profesională</SelectItem>
                          <SelectItem value="05">05 - Urgență medico-chirurgicală</SelectItem>
                          <SelectItem value="06">06 - Carantină</SelectItem>
                          <SelectItem value="07">07 - Sarcină și lăuzie</SelectItem>
                          <SelectItem value="08">08 - Îngrijire copil bolnav</SelectItem>
                          <SelectItem value="09">09 - Risc maternal</SelectItem>
                          <SelectItem value="10">10 - Recuperare capacitate de muncă</SelectItem>
                          <SelectItem value="11">11 - Tuberculoză, SIDA</SelectItem>
                          <SelectItem value="12">12 - Afecțiuni cardiovasculare</SelectItem>
                          <SelectItem value="13">13 - Neoplazii, cancer</SelectItem>
                          <SelectItem value="14">14 - Alte boli specifice</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Codul de concediu medical conform standardelor CNAS
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="medicalCertificateNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Număr certificat medical</FormLabel>
                        <FormControl>
                          <Input placeholder="Introduceți numărul certificatului" {...field} />
                        </FormControl>
                        <FormDescription>
                          Numărul oficial al certificatului medical
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="medicalCertificateDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data eliberare certificat</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ro })
                                ) : (
                                  <span>Selectați data eliberării</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="center">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              locale={ro}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Data la care a fost eliberat certificatul medical
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="medicalCertificateIssuedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emitent certificat medical</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduceți numele medicului/unității medicale" {...field} />
                      </FormControl>
                      <FormDescription>
                        Instituția medicală sau medicul care a emis certificatul
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <Separator />
            
            {/* Secțiunea 4: Observații */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Observații și detalii suplimentare
              </h3>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observații</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observații privind absența" 
                        className="resize-none min-h-[150px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Detalii suplimentare despre această absență, motive, sau alte informații relevante
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {initialData && initialData.status === 'rejected' && initialData.rejectionReason && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Absență respinsă</AlertTitle>
                  <AlertDescription>
                    Motiv respingere: {initialData.rejectionReason}
                  </AlertDescription>
                </Alert>
              )}
              
              {initialData && initialData.approvedBy && initialData.approvedAt && (
                <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Absență aprobată</AlertTitle>
                  <AlertDescription>
                    Aprobată la data: {format(new Date(initialData.approvedAt), "PPP", { locale: ro })}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
            >
              Anulează
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Se salvează...
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {initialData ? 'Actualizează absența' : 'Salvează absența'}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default AbsenceForm;