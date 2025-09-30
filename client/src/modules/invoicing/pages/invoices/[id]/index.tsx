/**
 * Invoice Detail Page
 * 
 * Displays the details of a specific invoice.
 */
import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  PrinterIcon, 
  SendIcon, 
  FileEditIcon, 
  CreditCardIcon, 
  FileCheckIcon, 
  FileX2Icon, 
  FileIcon, 
  DownloadIcon 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '../../../components/common/PageHeader';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { InvoiceStatus, Invoice, InvoiceItem } from '../../../types';
import { PaymentModal } from '../../../components/modals/PaymentModal';
import { formatCurrency, formatDate } from '../../../utils/invoiceCalculations';

export default function InvoiceDetailPage() {
  const [_, params] = useRoute('/facturare/invoices/:id');
  const invoiceId = params?.id || '';
  const [__, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch invoice details
  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ['/api/invoicing/invoices', invoiceId],
    select: (data) => data as Invoice,
    enabled: !!invoiceId,
  });

  // Fetch invoice items
  const { data: invoiceItems, isLoading: isLoadingItems } = useQuery({
    queryKey: ['/api/invoicing/invoice-items', invoiceId],
    select: (data) => data as InvoiceItem[],
    enabled: !!invoiceId,
  });

  // Validate invoice mutation
  const validateInvoiceMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/invoicing/invoices/${invoiceId}/validate`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Succes!',
        description: 'Factura a fost validată cu succes.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoicing/invoices', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoicing/statistics'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Eroare',
        description: `Nu s-a putut valida factura: ${error.message || 'Eroare necunoscută'}`,
        variant: 'destructive',
      });
    },
  });

  // Cancel invoice mutation
  const cancelInvoiceMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/invoicing/invoices/${invoiceId}/cancel`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Succes!',
        description: 'Factura a fost anulată cu succes.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoicing/invoices', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoicing/statistics'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Eroare',
        description: `Nu s-a putut anula factura: ${error.message || 'Eroare necunoscută'}`,
        variant: 'destructive',
      });
    },
  });

  // Mark invoice as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return apiRequest(`/api/invoicing/invoices/${invoiceId}/pay`, {
        method: 'POST',
        data: paymentData,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Succes!',
        description: 'Plata a fost înregistrată cu succes.',
      });
      setShowPaymentModal(false);
      queryClient.invalidateQueries({ queryKey: ['/api/invoicing/invoices', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoicing/statistics'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Eroare',
        description: `Nu s-a putut înregistra plata: ${error.message || 'Eroare necunoscută'}`,
        variant: 'destructive',
      });
    },
  });

  // Download PDF mutation
  const downloadPdfMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/invoicing/invoices/${invoiceId}/pdf`, {
        method: 'GET',
        responseType: 'blob',
      });
    },
    onSuccess: (response) => {
      // Create a blob from the response data
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura_${invoice?.invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Succes!',
        description: 'Factura a fost descărcată ca PDF.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Eroare',
        description: `Nu s-a putut descărca PDF-ul: ${error.message || 'Eroare necunoscută'}`,
        variant: 'destructive',
      });
    },
  });

  // Send invoice by email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/invoicing/invoices/${invoiceId}/send-email`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Succes!',
        description: 'Factura a fost trimisă pe email cu succes.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Eroare',
        description: `Nu s-a putut trimite factura pe email: ${error.message || 'Eroare necunoscută'}`,
        variant: 'destructive',
      });
    },
  });

  // Payment handling
  const handlePaymentSubmit = (paymentData: any) => {
    markAsPaidMutation.mutate(paymentData);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <PageHeader
            title="Se încarcă factura..."
            description="Se încarcă datele facturii"
          />
          <Button
            variant="outline"
            onClick={() => setLocation('/facturare/invoices')}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Înapoi la facturi
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            Se încarcă...
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError || !invoice) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <PageHeader
            title="Eroare"
            description="Nu s-a putut încărca factura"
          />
          <Button
            variant="outline"
            onClick={() => setLocation('/facturare/invoices')}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Înapoi la facturi
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-red-500 mb-4">A apărut o eroare la încărcarea facturii.</p>
            <Button onClick={() => window.location.reload()}>Reîncarcă</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine which action buttons to show based on invoice status
  const showValidateButton = invoice.status === InvoiceStatus.DRAFT;
  const showPayButton = [InvoiceStatus.VALIDATED, InvoiceStatus.PENDING, InvoiceStatus.OVERDUE].includes(invoice.status as InvoiceStatus);
  const showCancelButton = ![InvoiceStatus.PAID, InvoiceStatus.CANCELED].includes(invoice.status as InvoiceStatus);

  return (
    <div className="space-y-6">
      {/* Header with title and actions */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex-1">
          <PageHeader
            title={`Factura ${invoice.invoiceNumber}`}
            description={`Emisă pe ${formatDate(new Date(invoice.issueDate))}`}
          />
          <div className="mt-2">
            <StatusBadge status={invoice.status as InvoiceStatus} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setLocation('/facturare/invoices')}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Înapoi
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => downloadPdfMutation.mutate()}
            disabled={downloadPdfMutation.isPending}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            PDF
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => sendEmailMutation.mutate()}
            disabled={sendEmailMutation.isPending}
          >
            <SendIcon className="mr-2 h-4 w-4" />
            Email
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setLocation(`/facturare/invoices/edit/${invoice.id}`)}
          >
            <FileEditIcon className="mr-2 h-4 w-4" />
            Editează
          </Button>
          
          {showValidateButton && (
            <Button
              variant="default"
              onClick={() => validateInvoiceMutation.mutate()}
              disabled={validateInvoiceMutation.isPending}
            >
              <FileCheckIcon className="mr-2 h-4 w-4" />
              Validează
            </Button>
          )}
          
          {showPayButton && (
            <Button
              variant="default"
              onClick={() => setShowPaymentModal(true)}
              disabled={markAsPaidMutation.isPending}
            >
              <CreditCardIcon className="mr-2 h-4 w-4" />
              Înregistrează plata
            </Button>
          )}
          
          {showCancelButton && (
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => cancelInvoiceMutation.mutate()}
              disabled={cancelInvoiceMutation.isPending}
            >
              <FileX2Icon className="mr-2 h-4 w-4" />
              Anulează
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Detalii factură</TabsTrigger>
          <TabsTrigger value="items">Produse și servicii</TabsTrigger>
          <TabsTrigger value="accounting">Contabilitate</TabsTrigger>
          <TabsTrigger value="history">Istoric</TabsTrigger>
        </TabsList>
        
        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Information */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Informații client</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">Denumire</div>
                    <div className="text-sm font-medium text-right">{invoice.customerName}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">Cod fiscal</div>
                    <div className="text-sm font-medium text-right">RO12345678</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">Nr. Reg. Com.</div>
                    <div className="text-sm font-medium text-right">J40/123/2023</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">Adresă</div>
                    <div className="text-sm font-medium text-right">Str. Exemplului nr. 123, București</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Information */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Informații factură</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">Număr factură</div>
                    <div className="text-sm font-medium text-right">{invoice.invoiceNumber}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">Data emiterii</div>
                    <div className="text-sm font-medium text-right">{formatDate(new Date(invoice.issueDate))}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">Data scadenței</div>
                    <div className="text-sm font-medium text-right">{formatDate(new Date(invoice.dueDate))}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">Metoda de plată</div>
                    <div className="text-sm font-medium text-right">
                      {invoice.paymentMethod === 'bank_transfer' 
                        ? 'Transfer bancar' 
                        : invoice.paymentMethod === 'cash' 
                          ? 'Numerar' 
                          : invoice.paymentMethod === 'card' 
                            ? 'Card' 
                            : invoice.paymentMethod === 'check' 
                              ? 'CEC' 
                              : invoice.paymentMethod === 'credit' 
                                ? 'Credit' 
                                : invoice.paymentMethod}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Informații plată</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="text-right">
                      <StatusBadge status={invoice.status as InvoiceStatus} />
                    </div>
                  </div>
                  {invoice.status === InvoiceStatus.PAID && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-muted-foreground">Data plății</div>
                        <div className="text-sm font-medium text-right">
                          {invoice.paymentDate ? formatDate(new Date(invoice.paymentDate)) : '-'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-muted-foreground">Referință plată</div>
                        <div className="text-sm font-medium text-right">
                          {invoice.paymentReference || '-'}
                        </div>
                      </div>
                    </>
                  )}
                  {invoice.status === InvoiceStatus.OVERDUE && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Zile întârziere</div>
                      <div className="text-sm font-medium text-right text-red-600">
                        {Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))} zile
                      </div>
                    </div>
                  )}
                  {invoice.status === InvoiceStatus.PENDING && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Zile până la scadență</div>
                      <div className="text-sm font-medium text-right text-amber-600">
                        {Math.max(0, Math.floor((new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} zile
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Totals Card */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Totaluri</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">Subtotal</div>
                    <div className="text-sm font-medium text-right">{formatCurrency(invoice.netTotal)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">TVA ({invoice.vatRate}%)</div>
                    <div className="text-sm font-medium text-right">{formatCurrency(invoice.vatTotal)}</div>
                  </div>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-medium">Total</div>
                    <div className="font-bold text-right">{formatCurrency(invoice.grossTotal)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Note</h3>
                <div className="text-sm">
                  {invoice.notes}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Items Tab */}
        <TabsContent value="items">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Produse și servicii</h3>
              
              {isLoadingItems ? (
                <div className="text-center py-10">Se încarcă produsele...</div>
              ) : !invoiceItems?.length ? (
                <div className="text-center py-10 text-muted-foreground">
                  Nu există produse pentru această factură.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left">Nr.</th>
                        <th className="px-4 py-2 text-left">Produs/Serviciu</th>
                        <th className="px-4 py-2 text-right">Cantitate</th>
                        <th className="px-4 py-2 text-right">Preț unitar</th>
                        <th className="px-4 py-2 text-right">TVA (%)</th>
                        <th className="px-4 py-2 text-right">Valoare netă</th>
                        <th className="px-4 py-2 text-right">Valoare TVA</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((item, index) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-4 py-2">{index + 1}</td>
                          <td className="px-4 py-2">
                            <div>{item.productName}</div>
                            {item.productCode && (
                              <div className="text-xs text-muted-foreground">Cod: {item.productCode}</div>
                            )}
                            {item.notes && (
                              <div className="text-xs text-muted-foreground">{item.notes}</div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-2 text-right">{item.vatRate}%</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(item.netAmount)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(item.vatAmount)}</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.grossAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td colSpan={5} className="px-4 py-2 text-right font-medium">Total:</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(invoice.netTotal)}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(invoice.vatTotal)}</td>
                        <td className="px-4 py-2 text-right font-bold">{formatCurrency(invoice.grossTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Accounting Tab */}
        <TabsContent value="accounting">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Înregistrări contabile</h3>
              
              {invoice.status !== InvoiceStatus.VALIDATED && invoice.status !== InvoiceStatus.PAID ? (
                <div className="text-center py-10 text-muted-foreground">
                  Înregistrările contabile vor fi disponibile după validarea facturii.
                </div>
              ) : !invoice.ledgerEntryId ? (
                <div className="text-center py-10 text-muted-foreground">
                  Nu există înregistrări contabile pentru această factură.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left">Cont</th>
                        <th className="px-4 py-2 text-left">Denumire</th>
                        <th className="px-4 py-2 text-right">Debit</th>
                        <th className="px-4 py-2 text-right">Credit</th>
                        <th className="px-4 py-2 text-left">Explicație</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="px-4 py-2">4111</td>
                        <td className="px-4 py-2">Clienți</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(invoice.grossTotal)}</td>
                        <td className="px-4 py-2 text-right">-</td>
                        <td className="px-4 py-2">Factura nr. {invoice.invoiceNumber}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-2">707</td>
                        <td className="px-4 py-2">Venituri din vânzarea mărfurilor</td>
                        <td className="px-4 py-2 text-right">-</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(invoice.netTotal)}</td>
                        <td className="px-4 py-2">Factura nr. {invoice.invoiceNumber}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-2">4427</td>
                        <td className="px-4 py-2">TVA colectată</td>
                        <td className="px-4 py-2 text-right">-</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(invoice.vatTotal)}</td>
                        <td className="px-4 py-2">Factura nr. {invoice.invoiceNumber}</td>
                      </tr>
                      {invoice.status === InvoiceStatus.PAID && (
                        <>
                          <tr className="border-b">
                            <td className="px-4 py-2">5121</td>
                            <td className="px-4 py-2">Conturi la bănci în lei</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(invoice.grossTotal)}</td>
                            <td className="px-4 py-2 text-right">-</td>
                            <td className="px-4 py-2">Încasare factura nr. {invoice.invoiceNumber}</td>
                          </tr>
                          <tr className="border-b">
                            <td className="px-4 py-2">4111</td>
                            <td className="px-4 py-2">Clienți</td>
                            <td className="px-4 py-2 text-right">-</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(invoice.grossTotal)}</td>
                            <td className="px-4 py-2">Încasare factura nr. {invoice.invoiceNumber}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Istoric</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-blue-100 p-2 rounded-full text-blue-700">
                    <FileIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Factură creată</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(new Date(invoice.createdAt))} de către {invoice.createdBy || 'System'}
                    </p>
                  </div>
                </div>
                
                {invoice.status !== InvoiceStatus.DRAFT && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-green-100 p-2 rounded-full text-green-700">
                      <FileCheckIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Factură validată</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.validatedAt ? formatDate(new Date(invoice.validatedAt)) : '-'} de către {invoice.validatedBy || 'System'}
                      </p>
                    </div>
                  </div>
                )}
                
                {invoice.status === InvoiceStatus.PAID && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-green-100 p-2 rounded-full text-green-700">
                      <CreditCardIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Plată înregistrată</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.paymentDate ? formatDate(new Date(invoice.paymentDate)) : '-'}
                      </p>
                      {invoice.paymentReference && (
                        <p className="text-sm text-muted-foreground">
                          Referință: {invoice.paymentReference}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {invoice.status === InvoiceStatus.CANCELED && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-red-100 p-2 rounded-full text-red-700">
                      <FileX2Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Factură anulată</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.canceledAt ? formatDate(new Date(invoice.canceledAt)) : '-'} de către {invoice.canceledBy || 'System'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Payment Modal */}
      <PaymentModal
        invoice={invoice}
        isOpen={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onPaymentSubmit={handlePaymentSubmit}
        isSubmitting={markAsPaidMutation.isPending}
      />
    </div>
  );
}