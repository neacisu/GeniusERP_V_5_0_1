import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from 'lucide-react';
import { addDays, format, startOfDay, isBefore, isWeekend, differenceInBusinessDays } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Absence } from '../../types';
import { useHrApi } from '../../hooks/useHrApi';

// Define form validation schema
const absenceFormSchema = z.object({
  employeeId: z.string().min(1, { message: 'Selectați un angajat' }),
  absenceType: z.string().min(1, { message: 'Selectați tipul de absență' }),
  startDate: z.date({
    message: "Data de început este obligatorie",
  }),
  endDate: z.date({
    message: "Data de sfârșit este obligatorie",
  }),
  notes: z.string().optional(),
  medicalCertificateNumber: z.string().optional(),
  medicalCertificateDate: z.date().optional(),
  medicalCertificateIssuedBy: z.string().optional(),
})
.refine(
  (data) => !isBefore(data.endDate, data.startDate), 
  {
    message: "Data de sfârșit trebuie să fie după data de început",
    path: ["endDate"],
  }
);

interface AbsenceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: z.infer<typeof absenceFormSchema>) => void;
  initialEmployeeId?: string;
  isSubmitting?: boolean;
  absence?: Absence;
}

/**
 * Modal for creating or editing an absence record
 */
const AbsenceFormModal: React.FC<AbsenceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialEmployeeId,
  isSubmitting = false,
  absence
}) => {
  // Use HR API to fetch employees
  const { useEmployees } = useHrApi();
  
  // Fetch employees for dropdown
  const { data: employeesResponse } = useEmployees({ page: 1, limit: 100 });
  const employees = employeesResponse?.data?.items || [];
  
  // Track selected dates for business days calculation
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    absence?.startDate ? new Date(absence.startDate) : undefined
  );
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    absence?.endDate ? new Date(absence.endDate) : undefined
  );
  
  // Track selected absence type for conditional fields
  const [absenceType, setAbsenceType] = React.useState<string>(
    absence?.absenceType || ''
  );
  
  // Calculate working days between dates
  const calculateWorkingDays = () => {
    if (!startDate || !endDate) return 0;
    if (isBefore(endDate, startDate)) return 0;
    
    // Use differenceInBusinessDays to exclude weekends
    return differenceInBusinessDays(endDate, startDate) + 1;
  };
  
  // Initialize form with absence data or defaults
  const form = useForm<z.infer<typeof absenceFormSchema>>({
    resolver: zodResolver(absenceFormSchema),
    defaultValues: {
      employeeId: absence?.employeeId || initialEmployeeId || '',
      absenceType: absence?.absenceType || '',
      startDate: absence?.startDate ? new Date(absence.startDate) : undefined,
      endDate: absence?.endDate ? new Date(absence.endDate) : undefined,
      notes: absence?.notes || '',
      medicalCertificateNumber: absence?.medicalCertificateNumber || '',
      medicalCertificateDate: absence?.medicalCertificateDate ? new Date(absence.medicalCertificateDate) : undefined,
      medicalCertificateIssuedBy: absence?.medicalCertificateIssuedBy || '',
    }
  });
  
  // Update tracked dates when form values change
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'startDate') {
        setStartDate(value.startDate);
      }
      if (name === 'endDate') {
        setEndDate(value.endDate);
      }
      if (name === 'absenceType') {
        setAbsenceType(value.absenceType as string);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);
  
  // Handle form submission
  const handleSubmit = (values: z.infer<typeof absenceFormSchema>) => {
    // Add calculated working days to the form data
    const formData = {
      ...values,
      workingDays: calculateWorkingDays()
    };
    
    onSubmit(formData);
  };
  
  // Whether to show medical certificate fields
  const showMedicalFields = absenceType === 'medical_leave';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {absence ? 'Editează absență' : 'Înregistrează absență nouă'}
          </DialogTitle>
          <DialogDescription>
            {absence ? 'Modifică detaliile absenței' : 'Completați detaliile pentru noua absență'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Employee Selection */}
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Angajat</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!initialEmployeeId || !!absence}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează angajatul" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Absence Type */}
            <FormField
              control={form.control}
              name="absenceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tip absență</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează tipul de absență" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="annual_leave">Concediu de odihnă</SelectItem>
                      <SelectItem value="medical_leave">Concediu medical</SelectItem>
                      <SelectItem value="unpaid_leave">Concediu fără plată</SelectItem>
                      <SelectItem value="study_leave">Concediu de studii</SelectItem>
                      <SelectItem value="maternity_leave">Concediu de maternitate</SelectItem>
                      <SelectItem value="paternity_leave">Concediu de paternitate</SelectItem>
                      <SelectItem value="child_care_leave">Concediu pentru îngrijire copil</SelectItem>
                      <SelectItem value="special_leave">Concediu special</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Tipul de absență determină modul de procesare și plată
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data sfârșit</FormLabel>
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
                          disabled={(date) => startDate ? isBefore(date, startDate) : false}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Working Days Display */}
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm">
                <span className="font-medium">Zile lucrătoare:</span> {calculateWorkingDays()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Zilele de weekend sunt excluse automat
              </p>
            </div>
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observații</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalii suplimentare despre absență"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Medical Certificate Fields (conditionally shown) */}
            {showMedicalFields && (
              <div className="space-y-4 border rounded-md p-4">
                <h3 className="text-sm font-medium">Date concediu medical</h3>
                
                <FormField
                  control={form.control}
                  name="medicalCertificateNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Număr certificat medical</FormLabel>
                      <FormControl>
                        <Input placeholder="Număr certificat" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="medicalCertificateDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data certificat</FormLabel>
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
                    name="medicalCertificateIssuedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eliberat de</FormLabel>
                        <FormControl>
                          <Input placeholder="Medic/Unitate medicală" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Anulează
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Se salvează...' : absence ? 'Actualizează' : 'Salvează absență'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AbsenceFormModal;