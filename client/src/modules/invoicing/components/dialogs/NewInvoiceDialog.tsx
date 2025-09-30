/**
 * New Invoice Dialog Component
 * 
 * Dialog for creating a new invoice using the InvoiceForm component.
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { InvoiceForm } from '../forms/InvoiceForm';
import { NewInvoiceData, PaymentMethod } from '../../types';
import { useInvoices } from '../../hooks/useInvoiceApi';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';

interface NewInvoiceDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function NewInvoiceDialog({ onSuccess, trigger }: NewInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const { createInvoice } = useInvoices();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  // Set default values for the form
  const defaultValues: Partial<NewInvoiceData> = {
    customerId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0], // 30 days from now
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    currency: 'RON',
    notes: '',
    items: [
      {
        id: nanoid(),
        productName: 'Produs/Serviciu',
        productCode: '',
        quantity: 1,
        unitPrice: 0,
        vatRate: 19,
        discount: 0,
        unit: 'buc'
      }
    ]
  };
  
  // Submit handler for form
  const handleSubmit = async (data: NewInvoiceData) => {
    console.log('New Invoice - Form submitted with data:', data);
    setError(null);
    setDebugInfo({});
    
    try {
      setIsSubmitting(true);
      
      // Log all the form data for debugging
      setDebugInfo({
        formData: data,
        paymentMethodType: typeof data.paymentMethod,
        paymentMethodValue: data.paymentMethod,
        itemsCount: data.items?.length || 0
      });
      
      console.log('Creating invoice with data:', JSON.stringify(data, null, 2));
      
      // Handle form submission
      const result = await createInvoice.mutateAsync(data);
      
      console.log('Create invoice result:', result);
      
      // Show success toast
      toast({
        title: "Succes",
        description: "Factura a fost creată cu succes",
        variant: "default",
      });
      
      // Close dialog and call onSuccess callback if provided
      setOpen(false);
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      // Set error message to display to user
      setError(error?.message || 'A apărut o eroare la crearea facturii');
      
      // Log detailed error information
      console.error('Error creating invoice:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        response: error?.response?.data
      });
      
      // Show error toast
      toast({
        title: "Eroare",
        description: `Nu s-a putut crea factura: ${error?.message || 'Eroare necunoscută'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            Factură nouă
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Factură nouă</DialogTitle>
        </DialogHeader>
        
        {/* Display errors if they exist */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Eroare la crearea facturii</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Debug information - only in development mode */}
        {Object.keys(debugInfo).length > 0 && (
          <Alert>
            <AlertTitle>Informații de depanare</AlertTitle>
            <AlertDescription>
              <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 text-xs text-white overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </AlertDescription>
          </Alert>
        )}
        
        <InvoiceForm 
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting || createInvoice.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}