/**
 * Commission Form Component
 * 
 * Form component for creating and editing commissions with support for
 * different commission types and calculation methods as defined in
 * commission.service.ts.
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Save } from 'lucide-react';
import CurrencyInput, { formatCurrency } from '@/modules/hr/components/common/CurrencyInput';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

// Commission types
enum CommissionType {
  FIXED = 'fixed',                   // Fixed amount per sale
  PERCENTAGE = 'percentage',         // Percentage of sale value
  TIERED_PERCENTAGE = 'tiered_percentage', // Tiered percentages based on sale value
  PROGRESSIVE = 'progressive',       // Progressive rate based on total sales
  TEAM = 'team',                     // Team-based commission
  MIXED = 'mixed'                    // Combination of different commission types
}

// Commission status
enum CommissionStatus {
  CALCULATED = 'calculated',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

// Form schema
const commissionFormSchema = z.object({
  name: z.string().min(3, {
    message: "Numele comisionului trebuie să aibă cel puțin 3 caractere",
  }),
  description: z.string().optional(),
  employeeId: z.string({
    required_error: "Vă rugăm să selectați un angajat",
  }),
  type: z.nativeEnum(CommissionType, {
    required_error: "Vă rugăm să selectați un tip de comision",
  }),
  saleAmount: z.number({
    required_error: "Vă rugăm să introduceți suma vânzării",
  }).min(0.01, {
    message: "Suma vânzării trebuie să fie mai mare de 0",
  }),
  commissionAmount: z.number().optional(),
  commissionRate: z.number().optional(),
  status: z.nativeEnum(CommissionStatus).default(CommissionStatus.CALCULATED),
  referenceNumber: z.string().optional(),
  referenceDate: z.string().optional(),
  notes: z.string().optional(),
  isPaid: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.string().optional(),
  applyTaxes: z.boolean().default(true),
});

// Type definition based on form schema
type CommissionFormData = z.infer<typeof commissionFormSchema>;

// Props interface
interface CommissionFormProps {
  defaultValues?: Partial<CommissionFormData>;
  commissionId?: string;
  onSuccess?: (data: any) => void;
  rules?: any;
}

// Romanian labels for commission types
const commissionTypeLabels = {
  [CommissionType.FIXED]: "Sumă fixă",
  [CommissionType.PERCENTAGE]: "Procent din vânzare",
  [CommissionType.TIERED_PERCENTAGE]: "Procent progresiv pe nivele",
  [CommissionType.PROGRESSIVE]: "Rată progresivă în funcție de volum",
  [CommissionType.TEAM]: "Comision de echipă",
  [CommissionType.MIXED]: "Comision mixt"
};

// Romanian labels for status
const statusLabels = {
  [CommissionStatus.CALCULATED]: "Calculat",
  [CommissionStatus.APPROVED]: "Aprobat",
  [CommissionStatus.PAID]: "Plătit",
  [CommissionStatus.CANCELLED]: "Anulat"
};

export const CommissionForm: React.FC<CommissionFormProps> = ({
  defaultValues,
  commissionId,
  onSuccess,
  rules
}) => {
  const { toast } = useToast();
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);

  // Get employees by role (for sales agents)
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['/api/hr/employees/by-role', 'sales'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/hr/employees/by-role?role=sales');
      return await res.json();
    },
  });

  // Initialize form with default values
  const form = useForm<CommissionFormData>({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: defaultValues || {
      name: '',
      description: '',
      employeeId: '',
      type: CommissionType.PERCENTAGE,
      saleAmount: 0,
      commissionAmount: 0,
      commissionRate: 0,
      status: CommissionStatus.CALCULATED,
      referenceNumber: '',
      referenceDate: new Date().toISOString().split('T')[0],
      notes: '',
      isPaid: false,
      isRecurring: false,
      recurringFrequency: 'monthly',
      applyTaxes: true,
    },
  });

  // If commission ID is provided, fetch existing commission data
  useEffect(() => {
    if (commissionId) {
      const fetchCommissionData = async () => {
        try {
          const res = await apiRequest('GET', `/api/hr/commissions/${commissionId}`);
          const data = await res.json();
          
          if (data) {
            // Transform backend data to form format if needed
            form.reset({
              ...data,
              referenceDate: data.referenceDate ? new Date(data.referenceDate).toISOString().split('T')[0] : undefined,
            });
            
            if (data.commissionAmount) {
              setCalculatedAmount(data.commissionAmount);
            }
          }
        } catch (error) {
          console.error('Error fetching commission data:', error);
          toast({
            title: 'Eroare',
            description: 'Nu s-a putut încărca comisionul. Încercați din nou.',
            variant: 'destructive',
          });
        }
      };
      
      fetchCommissionData();
    }
  }, [commissionId, form, toast]);

  // Create/update commission mutation
  const mutation = useMutation({
    mutationFn: async (data: CommissionFormData) => {
      // If commission exists, update it
      if (commissionId) {
        const res = await apiRequest('PATCH', `/api/hr/commissions/${commissionId}`, data);
        return await res.json();
      } 
      // Otherwise create a new commission
      else {
        const res = await apiRequest('POST', '/api/hr/commissions', data);
        return await res.json();
      }
    },
    onSuccess: (data) => {
      toast({
        title: commissionId ? 'Comision actualizat' : 'Comision creat',
        description: commissionId 
          ? 'Comisionul a fost actualizat cu succes.' 
          : 'Comisionul a fost creat cu succes.',
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/hr/commissions'] });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Eroare',
        description: `Nu s-a putut ${commissionId ? 'actualiza' : 'crea'} comisionul. ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Auto-calculate commission amount when type is percentage
  useEffect(() => {
    const calculateCommission = () => {
      const type = form.watch('type');
      const saleAmount = form.watch('saleAmount');
      const rate = form.watch('commissionRate');
      
      if (type === CommissionType.PERCENTAGE && saleAmount && rate) {
        const calculated = (saleAmount * rate) / 100;
        setCalculatedAmount(calculated);
        form.setValue('commissionAmount', calculated);
      } else if (type === CommissionType.FIXED) {
        setCalculatedAmount(form.watch('commissionAmount') || 0);
      }
    };
    
    calculateCommission();
    
    // Watch for changes to recalculate
    const subscription = form.watch((value, { name }) => {
      if (['type', 'saleAmount', 'commissionRate'].includes(name as string)) {
        calculateCommission();
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Handle form submission
  const onSubmit = (data: CommissionFormData) => {
    mutation.mutate(data);
  };

  // Get selected employee name
  const getSelectedEmployeeName = () => {
    const employeeId = form.watch('employeeId');
    if (!employees || !employeeId) return '';
    
    const employee = employees.find((emp: any) => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : '';
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Basic information */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informații de bază</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Denumire comision</FormLabel>
                    <FormControl>
                      <Input placeholder="Denumire comision" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent vânzări</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați agentul de vânzări" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingEmployees ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Se încarcă...</span>
                          </div>
                        ) : employees && employees.length > 0 ? (
                          employees.map((employee: any) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.firstName} {employee.lastName}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-muted-foreground">
                            Nu există agenți disponibili
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descriere (opțional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrierea comisionului"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Middle column - Commission details */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Detalii comision</h3>
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tip comision</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați tipul de comision" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(commissionTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
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
                name="saleAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valoare vânzare</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch('type') === CommissionType.PERCENTAGE && (
                <FormField
                  control={form.control}
                  name="commissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procent comision (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            className="pr-8"
                          />
                          <div className="absolute inset-y-0 right-3 flex items-center">
                            %
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {form.watch('type') === CommissionType.FIXED && (
                <FormField
                  control={form.control}
                  name="commissionAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sumă comision</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value || 0}
                          onValueChange={(value) => field.onChange(value)}
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {calculatedAmount !== null && form.watch('type') === CommissionType.PERCENTAGE && (
                <div className="bg-muted p-3 rounded-md">
                  <span className="text-sm font-medium">Comision calculat:</span>
                  <span className="text-lg font-bold ml-2">
                    {new Intl.NumberFormat('ro-RO', {
                      style: 'currency',
                      currency: 'RON'
                    }).format(calculatedAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Right column - Options and settings */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Opțiuni și setări</h3>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați statusul" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
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
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Număr de referință (opțional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. REF-2025-0001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="referenceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de referință</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="applyTaxes"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Aplică taxe</FormLabel>
                      <FormDescription>
                        Dacă este bifat, se vor aplica taxele standard pe comisioane
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <Separator className="my-6" />
        
        {/* Additional information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Informații suplimentare</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (opțional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note și observații legate de acest comision"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Comision recurent</FormLabel>
                      <FormDescription>
                        Dacă este bifat, comisionul va fi aplicat recurent
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch('isRecurring') && (
                <FormField
                  control={form.control}
                  name="recurringFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frecvență</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați frecvența" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Săptămânal</SelectItem>
                          <SelectItem value="monthly">Lunar</SelectItem>
                          <SelectItem value="quarterly">Trimestrial</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Comision plătit</FormLabel>
                      <FormDescription>
                        Bifați dacă comisionul a fost deja plătit
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Anulează
          </Button>
          
          <Button 
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se salvează...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {commissionId ? 'Actualizează comision' : 'Salvează comision'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CommissionForm;