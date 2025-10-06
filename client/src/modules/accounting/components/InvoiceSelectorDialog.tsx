import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Search, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName?: string;
  supplierName?: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'customer' | 'supplier';
  onSelect: (invoice: Invoice) => void;
}

export function InvoiceSelectorDialog({ isOpen, onClose, type, onSelect }: Props) {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch partners (customers or suppliers)
  const { data: partners, isLoading: isLoadingPartners } = useQuery({
    queryKey: [type === 'customer' ? '/api/customers' : '/api/suppliers'],
    enabled: isOpen
  });
  
  // Fetch unpaid invoices for selected partner
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: [
      `/api/${type === 'customer' ? 'sales' : 'purchase'}-invoices/unpaid`,
      selectedPartnerId
    ],
    enabled: !!selectedPartnerId
  });
  
  const filteredInvoices = invoices?.filter((inv) =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatCurrency = (value: number, currency: string = 'RON') => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(value);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO');
  };
  
  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === 'customer' 
              ? '📄 Selectează Factură Neîncasată' 
              : '📄 Selectează Factură de Plătit'}
          </DialogTitle>
          <DialogDescription>
            Alegeți {type === 'customer' ? 'clientul' : 'furnizorul'} și apoi factura pentru a completa automat tranzacția
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Partner selector */}
          <div className="space-y-2">
            <Label>{type === 'customer' ? 'Client' : 'Furnizor'}</Label>
            <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
              <SelectTrigger>
                <SelectValue placeholder={`Selectează ${type === 'customer' ? 'client' : 'furnizor'}...`} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingPartners ? (
                  <SelectItem value="loading" disabled>Se încarcă...</SelectItem>
                ) : (
                  partners?.data?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name || p.companyName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Search invoices */}
          {selectedPartnerId && (
            <>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Caută după număr factură..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Invoices table */}
              {isLoadingInvoices ? (
                <div className="flex justify-center items-center p-8">
                  <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2">Se încarcă facturile...</span>
                </div>
              ) : filteredInvoices && filteredInvoices.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Nr. Factură</TableHead>
                        <TableHead>Data Emitere</TableHead>
                        <TableHead>Scadență</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Plătit</TableHead>
                        <TableHead className="text-right">Rest</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Acțiune</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => {
                        const daysOverdue = getDaysOverdue(invoice.dueDate);
                        const isOverdue = daysOverdue > 0;
                        
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">
                              {invoice.invoiceNumber}
                            </TableCell>
                            <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                            <TableCell>
                              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                {formatDate(invoice.dueDate)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(invoice.totalAmount, invoice.currency)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-green-600">
                              {formatCurrency(invoice.paidAmount, invoice.currency)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-bold text-blue-600">
                              {formatCurrency(invoice.remainingAmount, invoice.currency)}
                            </TableCell>
                            <TableCell className="text-center">
                              {isOverdue ? (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Restant {daysOverdue}z
                                </Badge>
                              ) : (
                                <Badge variant="outline">La zi</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  onSelect(invoice);
                                  onClose();
                                }}
                              >
                                Selectează
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    Nu există facturi neîncasate pentru {type === 'customer' ? 'acest client' : 'acest furnizor'}.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
