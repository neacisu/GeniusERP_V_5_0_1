import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CashRegister, BankAccount } from '@shared/schema';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'deposit' | 'withdrawal'; // deposit = cash→bank, withdrawal = bank→cash
}

export function CashBankTransferDialog({ isOpen, onClose, type }: Props) {
  const [cashRegisterId, setCashRegisterId] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: cashRegisters, isLoading: isLoadingCash } = useQuery<{ data: CashRegister[]; total: number }>({
    queryKey: ['/api/accounting/cash-registers'],
    enabled: isOpen
  });
  
  const { data: bankAccounts, isLoading: isLoadingBank } = useQuery<{ data: BankAccount[]; total: number }>({
    queryKey: ['/api/accounting/bank-accounts'],
    enabled: isOpen
  });
  
  // Get selected cash register for validation
  const selectedRegister = cashRegisters?.data?.find((r: any) => r.id === cashRegisterId);
  
  // Validations
  const amountNum = Number(amount);
  const maxTransaction = Number(selectedRegister?.maxTransactionAmount || 5000);
  const dailyLimit = Number(selectedRegister?.dailyLimit || 50000);
  const currentBalance = Number(selectedRegister?.currentBalance || 0);
  
  const showMaxTransactionError = selectedRegister && amountNum > maxTransaction;
  
  const showDailyLimitWarning = selectedRegister && 
    type === 'withdrawal' && 
    (currentBalance + amountNum) > dailyLimit;
  
  const showInsufficientFundsError = selectedRegister &&
    type === 'deposit' &&
    currentBalance < amountNum;
  
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = type === 'deposit' 
        ? '/api/accounting/cash-registers/deposit-to-bank'
        : '/api/accounting/cash-registers/withdraw-from-bank';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/cash-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/bank-transactions'] });
      
      toast({
        title: '✅ Transfer realizat cu succes!',
        description: (
          <div className="space-y-1 text-sm">
            <p>Tranzacție cash: {data.cashTransactionId}</p>
            <p>Tranzacție bancă: {data.bankTransactionId}</p>
            <p className="font-medium">Ambele tranzacții au fost create și contabilizate automat!</p>
          </div>
        ),
      });
      
      // Reset form complet
      setCashRegisterId('');
      setBankAccountId('');
      setAmount('');
      setDescription('');
      
      // Refresh pagina - forțează re-render
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: '❌ Eroare la transfer',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showMaxTransactionError) {
      toast({
        title: '⚠️ Suma depășește plafonul legal',
        description: `Conform Legii 70/2015, plafonul maxim este ${maxTransaction} Lei per tranzacție.`,
        variant: 'destructive'
      });
      return;
    }
    
    if (showInsufficientFundsError) {
      toast({
        title: '⚠️ Sold insuficient',
        description: `Soldul curent al casieriei este ${currentBalance.toFixed(2)} Lei.`,
        variant: 'destructive'
      });
      return;
    }
    
    mutation.mutate({
      cashRegisterId,
      bankAccountId,
      amount: amountNum,
      description: description || `${type === 'deposit' ? 'Depunere' : 'Ridicare'} numerar`,
      companyId: selectedRegister?.companyId,
      currency: selectedRegister?.currency || 'RON',
      cashRegisterName: selectedRegister?.name,
      bankAccountName: bankAccounts?.data?.find((a: any) => a.id === bankAccountId)?.accountName
    });
  };
  
  const formatCurrency = (value: number, currency: string = 'RON') => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(value);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'deposit' ? (
              <>
                <ArrowDown className="h-5 w-5 text-blue-500" />
                💰 Depunere Numerar la Bancă
              </>
            ) : (
              <>
                <ArrowUp className="h-5 w-5 text-green-500" />
                🏦 Ridicare Numerar din Bancă
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {type === 'deposit' 
              ? 'Transferați numerar din casierie în contul bancar. Se vor crea automat 2 tranzacții sincronizate.'
              : 'Ridicați numerar din bancă în casierie. Se vor crea automat 2 tranzacții sincronizate.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cashRegister">
              Casierie {type === 'deposit' ? '(Sursă)' : '(Destinație)'}
            </Label>
            <Select value={cashRegisterId} onValueChange={setCashRegisterId} required>
              <SelectTrigger id="cashRegister">
                <SelectValue placeholder="Selectează casierie..." />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCash ? (
                  <SelectItem value="loading" disabled>Se încarcă...</SelectItem>
                ) : (
                  cashRegisters?.data
                    ?.filter((r: any) => r.isActive)
                    .map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} - Sold: {formatCurrency(Number(r.currentBalance), r.currency)}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bankAccount">
              Cont Bancar {type === 'deposit' ? '(Destinație)' : '(Sursă)'}
            </Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId} required>
              <SelectTrigger id="bankAccount">
                <SelectValue placeholder="Selectează cont bancar..." />
              </SelectTrigger>
              <SelectContent>
                {isLoadingBank ? (
                  <SelectItem value="loading" disabled>Se încarcă...</SelectItem>
                ) : (
                  bankAccounts?.data
                    ?.filter((a: any) => a.isActive)
                    .map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.accountName || a.name} - {a.bankName}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Sumă (Lei)</Label>
            <Input 
              id="amount"
              type="number" 
              step="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0.01"
              placeholder="0.00"
            />
            {selectedRegister && (
              <p className="text-xs text-gray-500">
                Sold curent casierie: {formatCurrency(currentBalance, selectedRegister.currency)}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descriere (opțional)</Label>
            <Input 
              id="description"
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Ex: ${type === 'deposit' ? 'Depunere excedent casierie' : 'Alimentare casierie pentru salarii'}`}
            />
          </div>
          
          {/* Warnings and Errors */}
          {showMaxTransactionError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>EROARE:</strong> Suma de {amountNum.toFixed(2)} Lei depășește plafonul maxim de {maxTransaction} Lei per tranzacție!
                <br />
                <span className="text-xs">Conform Legii 70/2015, fragmentați sau folosiți un transfer bancar.</span>
              </AlertDescription>
            </Alert>
          )}
          
          {showInsufficientFundsError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>EROARE:</strong> Sold insuficient în casierie! Soldul actual este {currentBalance.toFixed(2)} Lei.
              </AlertDescription>
            </Alert>
          )}
          
          {showDailyLimitWarning && !showMaxTransactionError && (
            <Alert className="border-orange-500 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <strong>ATENȚIE:</strong> După această operațiune, soldul casieriei va fi {(currentBalance + amountNum).toFixed(2)} Lei, 
                depășind plafonul zilnic de {dailyLimit} Lei!
                <br />
                <span className="text-xs">Conform Legii 70/2015, excedentul trebuie depus la bancă în max 2 zile.</span>
              </AlertDescription>
            </Alert>
          )}
          
          {!showMaxTransactionError && !showInsufficientFundsError && amount && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                Se vor crea <strong>automat 2 tranzacții</strong>: una în registrul de casă și una în jurnalul de bancă.
                Ambele vor fi contabilizate automat!
              </AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Anulează
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending || showMaxTransactionError || showInsufficientFundsError}
            >
              {mutation.isPending ? (
                <>Se procesează...</>
              ) : (
                <>
                  {type === 'deposit' ? '💰 Depune' : '🏦 Ridică'} Numerar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
