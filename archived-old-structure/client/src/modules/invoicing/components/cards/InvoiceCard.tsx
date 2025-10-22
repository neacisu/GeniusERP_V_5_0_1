/**
 * Invoice Card Component
 * 
 * Displays invoice details in a card format.
 */
import * as React from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { 
  Calendar, 
  CreditCard, 
  User, 
  Building, 
  FileText, 
  Printer,
  Clock,
  DownloadCloud
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '../common/StatusBadge';
import { Invoice, InvoiceStatus } from '../../types';
import { formatCurrency } from '../../utils/invoiceCalculations';

interface InvoiceCardProps {
  invoice: Invoice;
  onPrint?: () => void;
  onDownload?: () => void;
  onMarkAsPaid?: () => void;
  isMarkingAsPaid?: boolean;
}

export function InvoiceCard({ 
  invoice, 
  onPrint, 
  onDownload,
  onMarkAsPaid,
  isMarkingAsPaid = false
}: InvoiceCardProps) {
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && 
    invoice.status !== InvoiceStatus.PAID &&
    invoice.status !== InvoiceStatus.CANCELED;
  
  const isPaid = invoice.status === InvoiceStatus.PAID;
  const isDraft = invoice.status === InvoiceStatus.DRAFT;
  const canMarkAsPaid = invoice.status === InvoiceStatus.ISSUED || 
    invoice.status === InvoiceStatus.SENT;

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd MMMM yyyy', { locale: ro });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <div>
            <CardTitle className="text-xl font-semibold">
              Factura {invoice.invoiceNumber}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Emisă la {formatDate(invoice.issueDate)}
            </p>
          </div>
          <StatusBadge status={invoice.status} />
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Detalii factură</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <FileText className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Seria/Număr:</span>
                    <p>{invoice.invoiceNumber}</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Calendar className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Data emiterii:</span>
                    <p>{formatDate(invoice.issueDate)}</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Clock className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Data scadentă:</span>
                    <p className={isOverdue ? "text-red-500 font-medium" : ""}>
                      {invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}
                      {isOverdue && " (Restantă)"}
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CreditCard className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Metodă de plată:</span>
                    <p>{invoice.paymentMethod === 'bank_transfer' ? 'Transfer bancar' : 
                       invoice.paymentMethod === 'cash' ? 'Numerar' : 
                       invoice.paymentMethod === 'card' ? 'Card bancar' : 
                       invoice.paymentMethod === 'check' ? 'CEC/BO' : 
                       invoice.paymentMethod || 'Nespecificată'}</p>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Client</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <Building className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Companie:</span>
                    <p>{invoice.customerName}</p>
                  </div>
                </li>
                {invoice.customerVatNumber && (
                  <li className="flex items-start">
                    <FileText className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">CUI/CIF:</span>
                      <p>{invoice.customerVatNumber}</p>
                    </div>
                  </li>
                )}
                {invoice.customerRegNumber && (
                  <li className="flex items-start">
                    <FileText className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">Nr. Reg. Com.:</span>
                      <p>{invoice.customerRegNumber}</p>
                    </div>
                  </li>
                )}
                {invoice.customerAddress && (
                  <li className="flex items-start">
                    <Building className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">Adresă:</span>
                      <p>{invoice.customerAddress}</p>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Furnizor</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <Building className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Companie:</span>
                    <p>{invoice.companyName || "Compania mea"}</p>
                  </div>
                </li>
                {invoice.companyVatNumber && (
                  <li className="flex items-start">
                    <FileText className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">CUI/CIF:</span>
                      <p>{invoice.companyVatNumber}</p>
                    </div>
                  </li>
                )}
                {invoice.companyRegNumber && (
                  <li className="flex items-start">
                    <FileText className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">Nr. Reg. Com.:</span>
                      <p>{invoice.companyRegNumber}</p>
                    </div>
                  </li>
                )}
                {invoice.companyAddress && (
                  <li className="flex items-start">
                    <Building className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">Adresă:</span>
                      <p>{invoice.companyAddress}</p>
                    </div>
                  </li>
                )}
              </ul>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <h3 className="text-sm font-medium mb-3">Sumar facturare</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Valoare netă:</span>
                  <span>{formatCurrency(invoice.netTotal || invoice.netAmount || 0)} {invoice.currency}</span>
                </li>
                <li className="flex justify-between">
                  <span>TVA ({invoice.vatRate || 19}%):</span>
                  <span>{formatCurrency(invoice.vatTotal || invoice.vatAmount || 0)} {invoice.currency}</span>
                </li>
                <Separator className="my-2" />
                <li className="flex justify-between font-medium text-base">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.grossTotal || invoice.amount || invoice.totalAmount || 0)} {invoice.currency}</span>
                </li>
                {isPaid && invoice.paidAmount && (
                  <li className="flex justify-between text-green-600">
                    <span>Plătit:</span>
                    <span>{formatCurrency(invoice.paidAmount)} {invoice.currency}</span>
                  </li>
                )}
                {isPaid && invoice.paidDate && (
                  <li className="flex justify-between text-sm text-muted-foreground">
                    <span>Data plății:</span>
                    <span>{formatDate(invoice.paidDate)}</span>
                  </li>
                )}
                {invoice.remainingAmount !== undefined && invoice.remainingAmount > 0 && (
                  <li className="flex justify-between text-amber-600 font-medium">
                    <span>Rămas de plată:</span>
                    <span>{formatCurrency(invoice.remainingAmount)} {invoice.currency}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 flex-wrap gap-2">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onPrint}
            disabled={isDraft}
          >
            <Printer className="h-4 w-4 mr-2" />
            Printează
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDownload}
            disabled={isDraft}
          >
            <DownloadCloud className="h-4 w-4 mr-2" />
            Descarcă PDF
          </Button>
        </div>
        
        {canMarkAsPaid && onMarkAsPaid && (
          <Button 
            size="sm"
            onClick={onMarkAsPaid}
            disabled={isMarkingAsPaid}
          >
            {isMarkingAsPaid ? "Se procesează..." : "Înregistrează plată"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}