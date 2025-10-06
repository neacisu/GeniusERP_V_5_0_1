import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Download, Lock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cashRegisterId: string;
  date: Date;
}

export function DailyClosingDialog({ isOpen, onClose, cashRegisterId, date }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch daily report preview
  const { data: reportData, isLoading: isLoadingReport } = useQuery({
    queryKey: ['/api/accounting/cash-registers', cashRegisterId, 'daily-report', date.toISOString().split('T')[0]],
    enabled: isOpen && !!cashRegisterId,
    placeholderData: {
      openingBalance: 0,
      totalReceipts: 0,
      totalPayments: 0,
      closingBalance: 0,
      transactionCount: 0
    }
  });
  
  // Get register info
  const { data: registerInfo } = useQuery({
    queryKey: ['/api/accounting/cash-registers', cashRegisterId],
    enabled: isOpen && !!cashRegisterId
  });
  
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/accounting/cash-registers/${cashRegisterId}/close-daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date: date.toISOString(),
          companyId: registerInfo?.companyId || 'current-company-id'
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/cash-transactions'] });
      
      toast({
        title: '🔒 Ziua a fost închisă cu succes!',
        description: (
          <div className="space-y-1">
            <p>Sold de închidere: <strong>{data.closingBalance?.toFixed(2)} Lei</strong></p>
            <p className="text-xs">Tranzacțiile din această zi nu mai pot fi modificate.</p>
          </div>
        ),
      });
      
      // Download PDF if available
      if (data.pdfPath) {
        window.open(data.pdfPath, '_blank');
      }
      
      // Refresh automat pagina pentru a actualiza starea
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: '❌ Eroare la închidere',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 2
    }).format(value || 0);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-500" />
            🔒 Închidere Zilnică Registru de Casă
          </DialogTitle>
          <DialogDescription>
            {registerInfo?.name || 'Registrul de casă'} - {date.toLocaleDateString('ro-RO', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              <strong>ATENȚIE:</strong> După închidere, nu veți mai putea modifica sau șterge tranzacțiile din această zi.
              <br />
              <span className="text-xs">Orice corecții ulterioare se vor face prin tranzacții de ajustare în zile viitoare.</span>
            </AlertDescription>
          </Alert>
          
          {isLoadingReport ? (
            <div className="flex justify-center items-center p-8">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2">Se încarcă raportul...</span>
            </div>
          ) : reportData ? (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4 text-blue-900">
                  📊 Situația Zilei - Preview
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Sold Inițial</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(reportData.openingBalance)}
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Nr. Tranzacții</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.transactionCount || 0}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 mb-1">💰 Total Încasări</p>
                    <p className="text-2xl font-bold text-green-600">
                      +{formatCurrency(reportData.totalReceipts)}
                    </p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 mb-1">💸 Total Plăți</p>
                    <p className="text-2xl font-bold text-red-600">
                      -{formatCurrency(reportData.totalPayments)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 bg-blue-100 p-4 rounded-lg border-2 border-blue-300">
                  <p className="text-sm text-blue-700 mb-1">🏆 Sold Final Zi</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {formatCurrency(reportData.closingBalance)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                Nu există tranzacții pentru această zi sau datele nu pot fi încărcate.
              </AlertDescription>
            </Alert>
          )}
          
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <strong>Se va genera automat:</strong>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                <li>Registru de Casă PDF conform OMFP 2634/2015</li>
                <li>Format oficial cu toate coloanele obligatorii</li>
                <li>Semnături pentru Casier și Compartiment Financiar</li>
                <li>Document tipărit gata pentru arhivare</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Anulează
          </Button>
          <Button 
            onClick={() => mutation.mutate()} 
            disabled={mutation.isPending || !reportData || reportData.transactionCount === 0}
            className="bg-red-600 hover:bg-red-700"
          >
            {mutation.isPending ? (
              <>Se închide...</>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                <Download className="h-4 w-4 mr-2" />
                Închide Ziua și Generează PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
