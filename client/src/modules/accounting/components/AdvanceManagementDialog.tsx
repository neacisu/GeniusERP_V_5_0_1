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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmployeeSelectorDialog } from './EmployeeSelectorDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cashRegisterId: string;
  type: 'give' | 'settle'; // give = acordare avans, settle = decontare avans
  existingAdvanceId?: string; // Pentru decontare
}

export function AdvanceManagementDialog({ 
  isOpen, 
  onClose, 
  cashRegisterId, 
  type,
  existingAdvanceId 
}: Props) {
  const [isEmployeeSelectorOpen, setIsEmployeeSelectorOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch advance details if settling
  const { data: advanceData } = useQuery({
    queryKey: ['/api/accounting/advances', existingAdvanceId],
    enabled: type === 'settle' && !!existingAdvanceId
  });
  
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = type === 'give'
        ? '/api/accounting/cash-registers/give-advance'
        : '/api/accounting/cash-registers/settle-advance';
      
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
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/cash-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/advances'] });
      
      toast({
        title: type === 'give' ? '✅ Avans acordat!' : '✅ Avans decontat!',
        description: type === 'give'
          ? `Avans de ${amount} Lei acordat lui ${selectedEmployee?.fullName}`
          : `Decontare finalizată. ${data.remainingAmount > 0 ? `Rest de plată: ${data.remainingAmount} Lei` : 'Avans închis complet.'}`,
      });
      
      setSelectedEmployee(null);
      setAmount('');
      setDescription('');
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: '❌ Eroare',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === 'give' && !selectedEmployee) {
      toast({
        title: '⚠️ Selectați angajatul',
        description: 'Trebuie să selectați angajatul pentru acordarea avansului.',
        variant: 'destructive'
      });
      return;
    }
    
    mutation.mutate({
      cashRegisterId,
      employeeId: selectedEmployee?.id,
      employeeName: selectedEmployee?.fullName,
      employeeCNP: selectedEmployee?.cnp,
      amount: Number(amount),
      description: description || (type === 'give' ? 'Avans de trezorerie' : 'Decontare avans'),
      purpose: type === 'give' ? 'advance_to_employee' : 'advance_settlement',
      advanceId: existingAdvanceId
    });
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {type === 'give' ? '💰 Acordare Avans de Trezorerie' : '📝 Decontare Avans'}
            </DialogTitle>
            <DialogDescription>
              {type === 'give' 
                ? 'Completați datele pentru acordarea avansului către angajat'
                : 'Completați decontarea avansului cu documente justificative'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'give' && (
              <div className="space-y-2">
                <Label>Angajat</Label>
                <div className="flex gap-2">
                  <Input
                    value={selectedEmployee?.fullName || ''}
                    placeholder="Selectați angajatul..."
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEmployeeSelectorOpen(true)}
                  >
                    Selectează
                  </Button>
                </div>
                {selectedEmployee && (
                  <p className="text-xs text-gray-500">
                    CNP: {selectedEmployee.cnp} | {selectedEmployee.department}
                  </p>
                )}
              </div>
            )}
            
            {type === 'settle' && advanceData && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription>
                  <strong>Avans existent:</strong> {advanceData.amount} Lei
                  <br />
                  Angajat: {advanceData.employeeName}
                  <br />
                  Acordat la: {new Date(advanceData.createdAt).toLocaleDateString('ro-RO')}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="amount">
                {type === 'give' ? 'Sumă Avans (Lei)' : 'Sumă Cheltuită (Lei)'}
              </Label>
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">
                {type === 'give' ? 'Scop Avans' : 'Detalii Cheltuieli'}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'give' 
                  ? 'Ex: Deplasare în interes de serviciu' 
                  : 'Ex: Transport 250 Lei, Cazare 300 Lei, Masă 150 Lei'}
                rows={3}
              />
            </div>
            
            {type === 'settle' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={documentsUploaded}
                    onChange={(e) => setDocumentsUploaded(e.target.checked)}
                    className="rounded"
                  />
                  <span>Am atașat documentele justificative (bonuri, facturi)</span>
                </Label>
                <p className="text-xs text-gray-500">
                  Documentele justificative trebuie păstrate conform legislației
                </p>
              </div>
            )}
            
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                {type === 'give' 
                  ? 'Se va genera dispoziție de plată și se va înregistra pe contul 425 (Avansuri de trezorerie)'
                  : 'Se va închide avansul și se va calcula automat diferența (rest de plată sau încasare)'}
              </AlertDescription>
            </Alert>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                Anulează
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending || (type === 'settle' && !documentsUploaded)}
              >
                {mutation.isPending ? 'Se procesează...' : type === 'give' ? '💰 Acordă Avans' : '📝 Decontează'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog nested - trebuie închis dialogul părinte când se deschide acesta */}
      {!isOpen && (
        <EmployeeSelectorDialog
          isOpen={isEmployeeSelectorOpen}
          onClose={() => setIsEmployeeSelectorOpen(false)}
          onSelect={setSelectedEmployee}
          type="advance"
        />
      )}
    </>
  );
}
