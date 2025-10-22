/**
 * Deal Form Component
 * 
 * Reusable form component for creating and editing deals
 * with validation and error handling.
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Deal, DealStatus, DealPriority } from '../../types';

// Define the form schema using zod
const dealFormSchema = z.object({
  title: z.string().min(3, 'Titlul trebuie să conțină cel puțin 3 caractere'),
  customerId: z.string().min(1, 'Selectați un client'),
  customerName: z.string().min(1, 'Introduceți numele clientului'),
  value: z.coerce.number().min(0, 'Valoarea trebuie să fie pozitivă'),
  currency: z.string().default('RON'),
  status: z.enum([
    DealStatus.NEW,
    DealStatus.NEGOTIATION,
    DealStatus.PROPOSAL,
    DealStatus.WON,
    DealStatus.LOST,
    DealStatus.CANCELED
  ]),
  priority: z.enum([
    DealPriority.LOW,
    DealPriority.MEDIUM,
    DealPriority.HIGH,
    DealPriority.URGENT
  ]),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  probability: z.coerce.number().min(0).max(100).optional(),
});

export type DealFormValues = z.infer<typeof dealFormSchema>;

interface DealFormProps {
  initialData?: Partial<Deal>;
  onSubmit: (data: DealFormValues) => Promise<void>;
  isSubmitting?: boolean;
  customers?: { id: string; name: string }[];
}

const DealForm: React.FC<DealFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  customers = []
}) => {
  // Initialize the form with react-hook-form
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema) as any,
    defaultValues: {
      title: initialData?.title || '',
      customerId: initialData?.customerId || '',
      customerName: initialData?.customerName || '',
      value: initialData?.value || 0,
      currency: initialData?.currency || 'RON',
      status: initialData?.status || DealStatus.NEW,
      priority: initialData?.priority || DealPriority.MEDIUM,
      description: initialData?.description || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate) : undefined,
      endDate: initialData?.endDate ? new Date(initialData.endDate) : undefined,
      probability: initialData?.probability || 50,
    }
  });
  
  // Handle form submission
  const handleSubmit = async (values: DealFormValues) => {
    await onSubmit(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Title field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titlu Contract</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Introduceți titlul contractului" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Customer field */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select 
                  value={field.value} 
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Auto-fill customer name when selecting from dropdown
                    if (value) {
                      const selectedCustomer = customers.find(c => c.id === value);
                      if (selectedCustomer) {
                        form.setValue('customerName', selectedCustomer.name);
                      }
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectați un client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selectați un client existent sau introduceți manual numele
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nume Client</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Introduceți numele clientului" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Value and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valoare Contract</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    onChange={e => field.onChange(Number(e.target.value))} 
                  />
                </FormControl>
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
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectați moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="RON">RON</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Status and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectați statusul" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={DealStatus.NEW}>Nou</SelectItem>
                    <SelectItem value={DealStatus.NEGOTIATION}>Negociere</SelectItem>
                    <SelectItem value={DealStatus.PROPOSAL}>Propunere</SelectItem>
                    <SelectItem value={DealStatus.WON}>Câștigat</SelectItem>
                    <SelectItem value={DealStatus.LOST}>Pierdut</SelectItem>
                    <SelectItem value={DealStatus.CANCELED}>Anulat</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioritate</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectați prioritatea" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={DealPriority.LOW}>Scăzută</SelectItem>
                    <SelectItem value={DealPriority.MEDIUM}>Medie</SelectItem>
                    <SelectItem value={DealPriority.HIGH}>Ridicată</SelectItem>
                    <SelectItem value={DealPriority.URGENT}>Urgentă</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Date fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Dată Start</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, 'dd.MM.yyyy')
                        ) : (
                          <span className="text-muted-foreground">Selectați data</span>
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
                <FormLabel>Dată Finalizare</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, 'dd.MM.yyyy')
                        ) : (
                          <span className="text-muted-foreground">Selectați data</span>
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
        
        {/* Probability field */}
        <FormField
          control={form.control}
          name="probability"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Probabilitate de Câștig (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  {...field} 
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Estimați șansele de câștig pentru acest contract (0-100%)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Description field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descriere</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Introduceți detalii despre contract..." 
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Form actions */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button">
            Anulează
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Se salvează...' : initialData ? 'Actualizează' : 'Creează'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DealForm;