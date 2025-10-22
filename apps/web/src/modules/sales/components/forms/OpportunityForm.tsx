/**
 * Opportunity Form Component
 * 
 * Reusable form component for creating and editing sales opportunities
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

import { Opportunity, OpportunityStage, DealPriority } from '../../types';

// Define the form schema using zod
const opportunityFormSchema = z.object({
  title: z.string().min(3, 'Titlul trebuie să conțină cel puțin 3 caractere'),
  customerId: z.string().min(1, 'Selectați un client'),
  customerName: z.string().min(1, 'Introduceți numele clientului'),
  potentialValue: z.coerce.number().min(0, 'Valoarea potențială trebuie să fie pozitivă'),
  currency: z.string().default('RON'),
  stage: z.enum([
    OpportunityStage.PROSPECTING,
    OpportunityStage.QUALIFICATION,
    OpportunityStage.NEEDS_ANALYSIS,
    OpportunityStage.VALUE_PROPOSITION,
    OpportunityStage.DECISION_MAKERS,
    OpportunityStage.PROPOSAL,
    OpportunityStage.NEGOTIATION,
    OpportunityStage.CLOSED_WON,
    OpportunityStage.CLOSED_LOST
  ]),
  priority: z.enum([
    DealPriority.LOW,
    DealPriority.MEDIUM,
    DealPriority.HIGH,
    DealPriority.URGENT
  ]),
  description: z.string().optional(),
  expectedCloseDate: z.date().optional(),
  probability: z.coerce.number().min(0).max(100).optional(),
  source: z.string().optional(),
  nextAction: z.string().optional(),
});

export type OpportunityFormValues = z.infer<typeof opportunityFormSchema>;

interface OpportunityFormProps {
  initialData?: Partial<Opportunity>;
  onSubmit: (data: OpportunityFormValues) => Promise<void>;
  isSubmitting?: boolean;
  customers?: { id: string; name: string }[];
}

const OpportunityForm: React.FC<OpportunityFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  customers = []
}) => {
  // Initialize the form with react-hook-form
  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunityFormSchema) as any,
    defaultValues: {
      title: initialData?.title || '',
      customerId: initialData?.customerId || '',
      customerName: initialData?.customerName || '',
      potentialValue: initialData?.potentialValue || 0,
      currency: initialData?.currency || 'RON',
      stage: initialData?.stage || OpportunityStage.PROSPECTING,
      priority: initialData?.priority || DealPriority.MEDIUM,
      description: initialData?.description || '',
      expectedCloseDate: initialData?.expectedCloseDate ? new Date(initialData.expectedCloseDate) : undefined,
      probability: initialData?.probability || 20,
      source: initialData?.source || '',
      nextAction: initialData?.nextAction || '',
    }
  });
  
  // Handle form submission
  const handleSubmit = async (values: OpportunityFormValues) => {
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
              <FormLabel>Titlu Oportunitate</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Introduceți titlul oportunității" />
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
            name="potentialValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valoare Potențială</FormLabel>
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
        
        {/* Stage and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stadiu</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectați stadiul" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={OpportunityStage.PROSPECTING}>Prospectare</SelectItem>
                    <SelectItem value={OpportunityStage.QUALIFICATION}>Calificare</SelectItem>
                    <SelectItem value={OpportunityStage.NEEDS_ANALYSIS}>Analiză Nevoi</SelectItem>
                    <SelectItem value={OpportunityStage.VALUE_PROPOSITION}>Propunere Valoare</SelectItem>
                    <SelectItem value={OpportunityStage.DECISION_MAKERS}>Factori Decizie</SelectItem>
                    <SelectItem value={OpportunityStage.PROPOSAL}>Propunere</SelectItem>
                    <SelectItem value={OpportunityStage.NEGOTIATION}>Negociere</SelectItem>
                    <SelectItem value={OpportunityStage.CLOSED_WON}>Câștigat</SelectItem>
                    <SelectItem value={OpportunityStage.CLOSED_LOST}>Pierdut</SelectItem>
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
        
        {/* Expected close date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expectedCloseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Dată Estimată Finalizare</FormLabel>
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
                  Estimați șansele de câștig pentru această oportunitate (0-100%)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Source and Next Action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sursă</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Cum a fost identificată această oportunitate?" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="nextAction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Următoarea Acțiune</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Care este următorul pas?" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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
                  placeholder="Introduceți detalii despre oportunitate..." 
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

export default OpportunityForm;