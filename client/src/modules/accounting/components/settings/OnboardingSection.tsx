/**
 * Onboarding Section
 * 
 * Component for onboarding companies with accounting history
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import SettingCard from "@/modules/settings/components/cards/SettingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";

interface OnboardingStatus {
  started: boolean;
  startDate: Date | null;
  chartOfAccountsImported: boolean;
  chartAccountsCount: number;
  openingBalancesImported: boolean;
  openingBalancesCount: number;
  openingBalancesValidated: boolean;
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
  completed: boolean;
}

interface OnboardingSectionProps {
  companyId: string;
}

export default function OnboardingSection({ companyId }: OnboardingSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fiscalYear, setFiscalYear] = useState<number>(currentYear);
  const [csvData, setCsvData] = useState<string>("");

  // Fetch onboarding status
  const { data: status, isLoading } = useQuery<OnboardingStatus>({
    queryKey: [`/api/accounting/onboarding/status/${companyId}?fiscalYear=${fiscalYear}`],
  });

  // Start onboarding mutation
  const startMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/accounting/onboarding/start', {
        method: 'POST',
        body: JSON.stringify({ companyId, startDate, fiscalYear }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accounting/onboarding/status/${companyId}`] });
      toast({ title: "Succes", description: "Procesul de onboarding a fost inițiat" });
    },
    onError: (error: Error) => {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    },
  });

  // Import balances mutation
  const importBalancesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/accounting/onboarding/import-balances', {
        method: 'POST',
        body: JSON.stringify({ companyId, csvData, fiscalYear, importSource: 'CSV' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accounting/onboarding/status/${companyId}`] });
      toast({ title: "Succes", description: "Soldurile inițiale au fost importate" });
      setCsvData("");
    },
    onError: (error: Error) => {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    },
  });

  // Finalize onboarding mutation
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/accounting/onboarding/finalize', {
        method: 'POST',
        body: JSON.stringify({ companyId, fiscalYear }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accounting/onboarding/status/${companyId}`] });
      toast({ title: "Succes", description: "Procesul de onboarding a fost finalizat" });
    },
    onError: (error: Error) => {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    },
  });

  const getProgressPercentage = () => {
    if (!status) return 0;
    let progress = 0;
    if (status.started) progress += 25;
    if (status.openingBalancesImported) progress += 50;
    if (status.openingBalancesValidated && status.isBalanced) progress += 25;
    return progress;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (status?.completed) {
    return (
      <SettingCard
        title="Onboarding Complet"
        description="Procesul de onboarding a fost finalizat cu succes"
      >
        <div className="p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Onboarding Finalizat</h3>
          <p className="mt-2 text-sm text-gray-600">
            Compania a fost configurată cu succes cu istoric contabil.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Plan de conturi</p>
              <p className="text-lg font-semibold">{status.chartAccountsCount} conturi</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Solduri inițiale</p>
              <p className="text-lg font-semibold">{status.openingBalancesCount} înregistrări</p>
            </div>
          </div>
        </div>
      </SettingCard>
    );
  }

  return (
    <SettingCard
      title="Onboarding Istoric Contabil"
      description="Configurați compania cu istoric contabil existent"
    >
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Progres onboarding</p>
          <p className="text-sm text-gray-500">{getProgressPercentage()}%</p>
        </div>
        <Progress value={getProgressPercentage()} className="h-2" />
      </div>

      {/* Step 1: Start Onboarding */}
      {!status?.started && (
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Inițiere Onboarding</h4>
              <p className="text-sm text-gray-600 mt-1">
                Începeți procesul de onboarding pentru companie cu istoric contabil
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="startDate">Data de start contabilitate</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="fiscalYear">An fiscal</Label>
                  <Input
                    id="fiscalYear"
                    type="number"
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(parseInt(e.target.value, 10))}
                    min={2000}
                    max={2100}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending}
                  className="w-full"
                >
                  {startMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Inițiază Onboarding
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Import Opening Balances */}
      {status?.started && !status?.openingBalancesImported && (
        <div className="space-y-4 p-4 border rounded-lg border-blue-500 bg-blue-50">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">2</span>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Import Solduri Inițiale</h4>
              <p className="text-sm text-gray-600 mt-1">
                Importați soldurile inițiale în format CSV
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="csvData">Date CSV</Label>
                  <Textarea
                    id="csvData"
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    placeholder="cod_cont,denumire,debit,credit&#10;1012,Capital social,0,100000&#10;5121,Banca,50000,0"
                    rows={6}
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: cod_cont,denumire,debit,credit (fără antet)
                  </p>
                </div>

                <Button
                  onClick={() => importBalancesMutation.mutate()}
                  disabled={importBalancesMutation.isPending || !csvData.trim()}
                  className="w-full"
                >
                  {importBalancesMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Upload className="h-4 w-4 mr-2" />
                  Importă Solduri
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Validation Status */}
      {status?.openingBalancesImported && (
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">3</span>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Validare Solduri</h4>

              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Total Debit</p>
                    <p className="text-lg font-semibold">{status.totalDebit.toFixed(2)} RON</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Total Credit</p>
                    <p className="text-lg font-semibold">{status.totalCredit.toFixed(2)} RON</p>
                  </div>
                </div>

                {status.isBalanced ? (
                  <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Balanța este echilibrată
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">
                        Diferență: {status.difference.toFixed(2)} RON
                      </p>
                      <p className="text-xs text-red-700">
                        Corecțați soldurile pentru a continua
                      </p>
                    </div>
                  </div>
                )}

                {status.isBalanced && !status.openingBalancesValidated && (
                  <Button
                    onClick={() => finalizeMutation.mutate()}
                    disabled={finalizeMutation.isPending}
                    className="w-full"
                  >
                    {finalizeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Finalizează Onboarding
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </SettingCard>
  );
}

