/**
 * Quote Form Component
 * 
 * Reusable form component for creating and editing sales quotes/offers
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
import { format, addDays } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Quote, QuoteStatus } from '../../types';

// Define the form schema using zod
const quoteFormSchema = z.object({
  quoteNumber: z.string().min(1, 'Numărul ofertei este obligatoriu'),
  title: z.string().min(3, 'Titlul trebuie să conțină cel puțin 3 caractere'),
  customerId: z.string().min(1, 'Selectați un client'),
  customerName: z.string().min(1, 'Introduceți numele clientului'),
  value: z.coerce.number().min(0, 'Valoarea trebuie să fie pozitivă'),
  currency: z.string().default('RON'),
  status: z.enum([
    QuoteStatus.DRAFT,
    QuoteStatus.SENT,
    QuoteStatus.VIEWED,
    QuoteStatus.ACCEPTED,
    QuoteStatus.REJECTED,
    QuoteStatus.EXPIRED
  ]),
  issueDate: z.date(),
  validUntil: z.date(),
  description: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    id: z.string().optional(),
    description: z.string().min(1, 'Descrierea este obligatorie'),
    quantity: z.coerce.number().min(1, 'Cantitatea trebuie să fie cel puțin 1'),
    unitPrice: z.coerce.number().min(0, 'Prețul unitar trebuie să fie pozitiv'),
    vatRate: z.coerce.number().min(0, 'Cota TVA trebuie să fie pozitivă'),
    discount: z.coerce.number().min(0).max(100).optional()
  })).min(1, 'Adăugați cel puțin un produs sau serviciu')
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

interface QuoteFormProps {
  initialData?: Partial<Quote>;
  onSubmit: (data: QuoteFormValues) => Promise<void>;
  isSubmitting?: boolean;
  customers?: { id: string; name: string }[];
  generateQuoteNumber?: () => Promise<string>;
}

const QuoteForm: React.FC<QuoteFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  customers = [],
  generateQuoteNumber
}) => {
  // Initialize the form with react-hook-form
  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema) as any,
    defaultValues: {
      quoteNumber: initialData?.quoteNumber || '',
      title: initialData?.title || '',
      customerId: initialData?.customerId || '',
      customerName: initialData?.customerName || '',
      value: initialData?.value || 0,
      currency: initialData?.currency || 'RON',
      status: initialData?.status || QuoteStatus.DRAFT,
      issueDate: initialData?.issueDate ? new Date(initialData.issueDate) : new Date(),
      validUntil: initialData?.validUntil ? new Date(initialData.validUntil) : addDays(new Date(), 30),
      description: initialData?.description || '',
      terms: initialData?.terms || '',
      notes: initialData?.notes || '',
      items: initialData?.items || [
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          vatRate: 19,
          discount: 0
        }
      ]
    }
  });
  
  // Handle form submission
  const handleSubmit = async (values: QuoteFormValues) => {
    // Calculate the total value before submitting
    const totalValue = values.items.reduce((total, item) => {
      const itemTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
      return total + itemTotal;
    }, 0);
    
    await onSubmit({
      ...values,
      value: totalValue
    });
  };
  
  // Handle generating a quote number
  const handleGenerateQuoteNumber = async () => {
    if (generateQuoteNumber) {
      const number = await generateQuoteNumber();
      form.setValue('quoteNumber', number);
    }
  };
  
  // Add a new item to the quote
  const addItem = () => {
    const currentItems = form.getValues('items');
    form.setValue('items', [
      ...currentItems,
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        vatRate: 19,
        discount: 0
      }
    ]);
  };
  
  // Remove an item from the quote
  const removeItem = (index: number) => {
    const currentItems = form.getValues('items');
    if (currentItems.length > 1) {
      form.setValue('items', currentItems.filter((_, i) => i !== index));
    }
  };
  
  // Calculate item total
  const calculateItemTotal = (item: any) => {
    const { quantity, unitPrice, discount = 0 } = item;
    return quantity * unitPrice * (1 - discount / 100);
  };
  
  // Calculate quote total
  const calculateTotal = () => {
    const items = form.getValues('items');
    return items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Quote Number and Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quoteNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Număr Ofertă</FormLabel>
                <div className="flex space-x-2">
                  <FormControl>
                    <Input {...field} placeholder="Introduceți numărul ofertei" />
                  </FormControl>
                  {generateQuoteNumber && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleGenerateQuoteNumber}
                    >
                      Generează
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titlu Ofertă</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Introduceți titlul ofertei" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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
        
        {/* Status and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <SelectItem value={QuoteStatus.DRAFT}>Schiță</SelectItem>
                    <SelectItem value={QuoteStatus.SENT}>Trimisă</SelectItem>
                    <SelectItem value={QuoteStatus.VIEWED}>Vizualizată</SelectItem>
                    <SelectItem value={QuoteStatus.ACCEPTED}>Acceptată</SelectItem>
                    <SelectItem value={QuoteStatus.REJECTED}>Respinsă</SelectItem>
                    <SelectItem value={QuoteStatus.EXPIRED}>Expirată</SelectItem>
                  </SelectContent>
                </Select>
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
        
        {/* Date fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Dată Emitere</FormLabel>
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
            name="validUntil"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Valabilă Până La</FormLabel>
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
                  placeholder="Introduceți detalii despre ofertă..." 
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Line items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Produse și Servicii</h3>
            <Button type="button" variant="outline" onClick={addItem}>
              Adaugă Produs/Serviciu
            </Button>
          </div>
          
          <div className="rounded-md border">
            <div className="bg-slate-50 p-2 grid grid-cols-12 gap-2 font-medium text-sm">
              <div className="col-span-5">Descriere</div>
              <div className="col-span-1 text-center">Cant.</div>
              <div className="col-span-2 text-center">Preț Unitar</div>
              <div className="col-span-1 text-center">TVA %</div>
              <div className="col-span-1 text-center">Disc. %</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            
            {form.getValues('items').map((_, index) => (
              <div key={index} className="p-2 grid grid-cols-12 gap-2 border-t">
                <div className="col-span-5">
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input {...field} placeholder="Descriere produs/serviciu" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            step="1" 
                            {...field} 
                            onChange={e => {
                              field.onChange(Number(e.target.value));
                              form.trigger('value');
                            }} 
                            className="text-center"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            {...field} 
                            onChange={e => {
                              field.onChange(Number(e.target.value));
                              form.trigger('value');
                            }} 
                            className="text-right"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name={`items.${index}.vatRate`}
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            step="1" 
                            {...field} 
                            onChange={e => field.onChange(Number(e.target.value))} 
                            className="text-center"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name={`items.${index}.discount`}
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            step="1" 
                            {...field} 
                            onChange={e => {
                              field.onChange(Number(e.target.value));
                              form.trigger('value');
                            }} 
                            className="text-center"
                            defaultValue={0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1 flex items-center justify-end font-medium">
                  {calculateItemTotal(form.getValues(`items.${index}`)).toLocaleString('ro-RO', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={form.getValues('items').length <= 1}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="p-2 grid grid-cols-12 gap-2 border-t bg-slate-50">
              <div className="col-span-10 text-right font-medium">Total:</div>
              <div className="col-span-2 text-right font-bold">
                {calculateTotal().toLocaleString('ro-RO', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} {form.getValues('currency')}
              </div>
            </div>
          </div>
        </div>
        
        {/* Terms and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Termeni și Condiții</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Termeni și condiții pentru această ofertă..." 
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Note interne sau alte informații..." 
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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

export default QuoteForm;