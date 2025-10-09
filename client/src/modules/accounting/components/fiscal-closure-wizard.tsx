/**
 * Fiscal Closure Wizard
 * 
 * Wizard pentru închiderea fiscală lunară și anuală
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

type ClosureType = 'month' | 'year';

interface FiscalClosureWizardProps {
  open: boolean;
  onClose: () => void;
  type: ClosureType;
  year: number;
  month?: number; // Pentru închidere lunară
  onSuccess?: () => void;
}

interface ClosureStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  result?: any;
  error?: string;
}

export function FiscalClosureWizard({
  open,
  onClose,
  type,
  year,
  month,
  onSuccess
}: FiscalClosureWizardProps) {
  const [step, setStep] = useState<'config' | 'processing' | 'result'>('config');
  const [loading, setLoading] = useState(false);
  
  // Configurare închidere lună
  const [skipDepreciation, setSkipDepreciation] = useState(false);
  const [skipFXRevaluation, setSkipFXRevaluation] = useState(false);
  const [skipVAT, setSkipVAT] = useState(false);
  const [dryRun, setDryRun] = useState(false);

  // Configurare închidere an
  const [nonDeductibleExpenses, setNonDeductibleExpenses] = useState('0');
  const [nonTaxableIncome, setNonTaxableIncome] = useState('0');
  const [legalReserve, setLegalReserve] = useState('0');
  const [dividends, setDividends] = useState('0');

  // Rezultate
  const [steps, setSteps] = useState<ClosureStep[]>([]);
  const [result, setResult] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleCloseMonth = async () => {
    setLoading(true);
    setStep('processing');
    
    const processingSteps: ClosureStep[] = [
      { id: 'depreciation', label: 'Calcul amortizare', status: 'pending' },
      { id: 'fx', label: 'Reevaluare valutară', status: 'pending' },
      { id: 'vat', label: 'Închidere TVA', status: 'pending' },
      { id: 'lock', label: 'Blocare perioadă', status: 'pending' }
    ];
    setSteps(processingSteps);

    try {
      const response = await apiClient.post('/api/accounting/fiscal-closure/month', {
        year,
        month,
        skipDepreciation,
        skipFXRevaluation,
        skipVAT,
        dryRun
      });

      setResult(response.data);

      if (response.data.success) {
        // Actualizează statusul pașilor bazat pe rezultat
        const updatedSteps = processingSteps.map(s => {
          if (s.id === 'depreciation' && skipDepreciation) return { ...s, status: 'skipped' as const };
          if (s.id === 'fx' && skipFXRevaluation) return { ...s, status: 'skipped' as const };
          if (s.id === 'vat' && skipVAT) return { ...s, status: 'skipped' as const };
          return { ...s, status: 'success' as const };
        });
        setSteps(updatedSteps);
        setWarnings(response.data.data.warnings || []);
        if (onSuccess) onSuccess();
      } else {
        setErrors(response.data.errors || ['Eroare necunoscută']);
        const updatedSteps = processingSteps.map(s => ({ ...s, status: 'error' as const }));
        setSteps(updatedSteps);
      }

      setStep('result');
    } catch (error: any) {
      setErrors([error.response?.data?.details || error.message || 'Eroare la închiderea lunii']);
      setStep('result');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseYear = async () => {
    setLoading(true);
    setStep('processing');

    const processingSteps: ClosureStep[] = [
      { id: 'pl', label: 'Închidere P&L', status: 'pending' },
      { id: 'tax', label: 'Calcul impozit profit', status: 'pending' },
      { id: 'dist', label: 'Repartizare profit', status: 'pending' },
      { id: 'lock', label: 'Blocare an fiscal', status: 'pending' }
    ];
    setSteps(processingSteps);

    try {
      const response = await apiClient.post('/api/accounting/fiscal-closure/year', {
        fiscalYear: year,
        taxAdjustments: {
          nonDeductibleExpenses: parseFloat(nonDeductibleExpenses) || 0,
          nonTaxableIncome: parseFloat(nonTaxableIncome) || 0,
          taxLossCarryforward: 0,
          otherAdjustments: 0
        },
        profitDistribution: {
          legalReserve: parseFloat(legalReserve) || 0,
          statutoryReserves: 0,
          otherReserves: 0,
          dividends: parseFloat(dividends) || 0,
          retainedEarnings: 0 // Calculat automat
        },
        dryRun
      });

      setResult(response.data);

      if (response.data.success) {
        const updatedSteps = processingSteps.map(s => ({ ...s, status: 'success' as const }));
        setSteps(updatedSteps);
        setWarnings(response.data.data.warnings || []);
        if (onSuccess) onSuccess();
      } else {
        setErrors(response.data.errors || ['Eroare necunoscută']);
        const updatedSteps = processingSteps.map(s => ({ ...s, status: 'error' as const }));
        setSteps(updatedSteps);
      }

      setStep('result');
    } catch (error: any) {
      setErrors([error.response?.data?.details || error.message || 'Eroare la închiderea anului']);
      setStep('result');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (type === 'month') {
      handleCloseMonth();
    } else {
      handleCloseYear();
    }
  };

  const handleReset = () => {
    setStep('config');
    setSteps([]);
    setResult(null);
    setErrors([]);
    setWarnings([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === 'month' 
              ? `Închidere Lună ${month}/${year}` 
              : `Închidere An Fiscal ${year}`}
          </DialogTitle>
          <DialogDescription>
            {type === 'month'
              ? 'Procedura de închidere lunară include: amortizare, reevaluare valutară, închidere TVA și blocare perioadă.'
              : 'Procedura de închidere anuală include: închidere P&L, calcul impozit profit, repartizare profit și blocare an fiscal.'}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: CONFIGURARE */}
        {step === 'config' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dryRun"
                checked={dryRun}
                onCheckedChange={(checked) => setDryRun(checked === true)}
              />
              <Label htmlFor="dryRun" className="text-sm font-medium">
                Simulare (fără a posta înregistrări contabile)
              </Label>
            </div>

            {type === 'month' && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skipDepreciation"
                    checked={skipDepreciation}
                    onCheckedChange={(checked) => setSkipDepreciation(checked === true)}
                  />
                  <Label htmlFor="skipDepreciation">
                    Omite calculul amortizării
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skipFX"
                    checked={skipFXRevaluation}
                    onCheckedChange={(checked) => setSkipFXRevaluation(checked === true)}
                  />
                  <Label htmlFor="skipFX">
                    Omite reevaluarea valutară
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skipVAT"
                    checked={skipVAT}
                    onCheckedChange={(checked) => setSkipVAT(checked === true)}
                  />
                  <Label htmlFor="skipVAT">
                    Omite închiderea TVA
                  </Label>
                </div>
              </>
            )}

            {type === 'year' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nonDeductible">
                    Cheltuieli nedeductibile (RON)
                  </Label>
                  <Input
                    id="nonDeductible"
                    type="number"
                    value={nonDeductibleExpenses}
                    onChange={(e) => setNonDeductibleExpenses(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nonTaxable">
                    Venituri neimpozabile (RON)
                  </Label>
                  <Input
                    id="nonTaxable"
                    type="number"
                    value={nonTaxableIncome}
                    onChange={(e) => setNonTaxableIncome(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legalReserve">
                    Rezerve legale (RON)
                  </Label>
                  <Input
                    id="legalReserve"
                    type="number"
                    value={legalReserve}
                    onChange={(e) => setLegalReserve(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dividends">
                    Dividende de distribuit (RON)
                  </Label>
                  <Input
                    id="dividends"
                    type="number"
                    value={dividends}
                    onChange={(e) => setDividends(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 2: PROCESARE */}
        {step === 'processing' && (
          <div className="space-y-3 py-4">
            {steps.map((s) => (
              <div key={s.id} className="flex items-center space-x-3">
                {s.status === 'running' && <Loader2 className="h-4 w-4 animate-spin" />}
                {s.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {s.status === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                {s.status === 'skipped' && <span className="h-4 w-4 text-gray-400">⊘</span>}
                {s.status === 'pending' && <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />}
                <span className={s.status === 'error' ? 'text-red-600' : ''}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* STEP 3: REZULTAT */}
        {step === 'result' && (
          <div className="space-y-4 py-4">
            {errors.length > 0 ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erori</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Succes!</AlertTitle>
                <AlertDescription>
                  {type === 'month'
                    ? `Luna ${month}/${year} a fost închisă cu succes.`
                    : `Anul fiscal ${year} a fost închis cu succes.`}
                </AlertDescription>
              </Alert>
            )}

            {warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle>Avertismente</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {result?.data?.yearEndResult && (
              <div className="border rounded p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Venituri totale:</span>
                  <span className="font-medium">{result.data.yearEndResult.totalRevenue} RON</span>
                </div>
                <div className="flex justify-between">
                  <span>Cheltuieli totale:</span>
                  <span className="font-medium">{result.data.yearEndResult.totalExpenses} RON</span>
                </div>
                <div className="flex justify-between">
                  <span>Profit contabil:</span>
                  <span className="font-medium">{result.data.yearEndResult.accountingProfit} RON</span>
                </div>
                <div className="flex justify-between">
                  <span>Impozit profit (16%):</span>
                  <span className="font-medium">{result.data.yearEndResult.profitTaxAmount} RON</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-bold">Profit net:</span>
                  <span className="font-bold">{result.data.yearEndResult.netProfit} RON</span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'config' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Anulează
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {dryRun ? 'Simulează' : 'Execută'} Închiderea
              </Button>
            </>
          )}

          {step === 'processing' && (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Se procesează...</span>
            </div>
          )}

          {step === 'result' && (
            <>
              {errors.length === 0 && (
                <Button variant="outline" onClick={handleReset}>
                  Închide Altă Perioadă
                </Button>
              )}
              {errors.length > 0 && (
                <Button variant="outline" onClick={handleReset}>
                  Încearcă Din Nou
                </Button>
              )}
              <Button onClick={onClose}>
                Închide
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

