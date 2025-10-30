/**
 * New Invoice Page
 * 
 * Allows creating a new invoice.
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '../../../components/common/PageHeader';
import { InvoiceForm } from '../../../components/forms/InvoiceForm';
import { NewInvoiceData, PaymentMethod } from '../../../types';
import { useInvoices } from '../../../hooks/useInvoiceApi';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function NewInvoicePage() {
  const [_, navigate] = useLocation();
  const { createInvoice } = useInvoices();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
        invoiceId: '',
        productName: 'Produs/Serviciu',
        productCode: '',
        quantity: 1,
        unitPrice: 0,
        netAmount: 0,
        vatRate: 19,
        vatAmount: 0,
        grossAmount: 0,
        discount: 0,
        sequence: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  };

  // State to track form errors
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

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
      
      // If successful, navigate back to invoices list
      navigate('/facturare/invoices');
      
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Factură nouă"
          description="Creează o factură nouă pentru un client"
        />
        <Link href="/facturare/invoices">
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Înapoi la facturi
          </Button>
        </Link>
      </div>

      <Separator />
      
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
      
      <Card>
        <CardContent className="pt-6">
          <InvoiceForm 
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting || createInvoice.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}