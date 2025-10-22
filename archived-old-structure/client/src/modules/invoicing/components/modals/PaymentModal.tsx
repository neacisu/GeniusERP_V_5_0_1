/**
 * Payment Modal Component
 * 
 * Modal dialog for recording payments for invoices.
 */
import * as React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreditCard, CalendarIcon, PiggyBank } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '../../utils/invoiceCalculations';
import { Invoice } from '../../types';

// Schema for payment details
const paymentFormSchema = z.object({
  paymentAmount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: 'Suma trebuie să fie un număr pozitiv' }
  ),
  paymentMethod: z.enum(['bank_transfer', 'cash', 'card', 'check', 'credit'], {
    message: 'Selectați metoda de plată',
  }),
  paymentDate: z.string({
    message: 'Selectați data plății',
  }),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

interface PaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSubmit: (data: z.infer<typeof paymentFormSchema>, invoiceId: string) => void;
  isSubmitting?: boolean;
}

export function PaymentModal({ 
  invoice, 
  isOpen, 
  onOpenChange, 
  onPaymentSubmit,
  isSubmitting = false
}: PaymentModalProps) {
  // Initialize form
  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentAmount: invoice?.grossTotal?.toString() || '',
      paymentMethod: 'bank_transfer',
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      paymentReference: '',
      notes: '',
    },
  });

  // Reset form when invoice changes
  // useEffect to update form when invoice changes
  React.useEffect(() => {
    if (invoice) {
      form.reset({
        paymentAmount: invoice.grossTotal?.toString() || '',
        paymentMethod: 'bank_transfer',
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        paymentReference: '',
        notes: '',
      });
    }
  }, [invoice, form]);

  // Handler for form submission
  const onSubmit = (data: z.infer<typeof paymentFormSchema>) => {
    if (invoice) {
      onPaymentSubmit(data, invoice.id);
    }
  };

  // If no invoice, don't render
  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Înregistrare plată</DialogTitle>
          <DialogDescription>
            Completați detaliile de plată pentru factura {invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Invoice Details Summary */}
            <div className="bg-muted rounded-md p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Factură</span>
                <span className="font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">{invoice.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de plată</span>
                <span className="font-medium">{invoice.grossTotal ? formatCurrency(invoice.grossTotal) : 'N/A'}</span>
              </div>
            </div>

            {/* Payment Amount */}
            <FormField
              control={form.control}
              name="paymentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suma plătită</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <PiggyBank className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-8"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Introduceți suma plătită de client
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metodă de plată</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectați metoda de plată" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Transfer bancar</SelectItem>
                      <SelectItem value="cash">Numerar</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="check">CEC / BO</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selectați metoda prin care s-a efectuat plata
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Date */}
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data plății</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="date"
                        className="pl-8"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Data la care s-a efectuat plata
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Reference */}
            <FormField
              control={form.control}
              name="paymentReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referință plată</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Număr OP, referință, etc."
                        className="pl-8"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Referința tranzacției (ex: număr ordin de plată, referință bancară)
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
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Observații referitoare la plată"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Orice informații suplimentare despre plată
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Anulează
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Se salvează...' : 'Înregistrează plata'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}