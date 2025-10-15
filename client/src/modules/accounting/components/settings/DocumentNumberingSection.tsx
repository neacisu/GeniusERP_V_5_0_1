/**
 * Document Numbering Section
 * 
 * Component for managing document numbering and series
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import SettingCard from "@/modules/settings/components/cards/SettingCard";
import FormSection from "@/modules/settings/components/forms/FormSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

interface DocumentCounter {
  id: string;
  counterType: string;
  series: string;
  year: string;
  lastNumber: string;
}

interface DocumentNumberingSectionProps {
  companyId: string;
  onChange?: () => void;
}

const COUNTER_LABELS: Record<string, string> = {
  JV: "Jurnal General",
  SA: "Jurnal Vânzări",
  PU: "Jurnal Achiziții",
  CA: "Jurnal Casa",
  BA: "Jurnal Bancă",
  INV: "Facturi",
  REC: "Chitanțe",
  NOTE: "Note Contabile",
};

export default function DocumentNumberingSection({ companyId, onChange }: DocumentNumberingSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  // Fetch document counters
  const { data: counters = [], isLoading } = useQuery<DocumentCounter[]>({
    queryKey: [`/api/accounting/settings/${companyId}/document-counters`],
  });

  // Update counter series mutation
  const updateCounterMutation = useMutation({
    mutationFn: async ({ counterType, series, year }: { counterType: string; series: string; year: number }) => {
      return await apiRequest(`/api/accounting/settings/${companyId}/document-counters/${counterType}`, {
        method: 'PUT',
        body: { series, year },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accounting/settings/${companyId}/document-counters`] });
      toast({ title: "Succes", description: "Seria documentului a fost actualizată" });
      onChange?.();
    },
    onError: (error: Error) => {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    },
  });

  const getCounterBySeries = (counterType: string) => {
    return counters.find((c) => c.counterType === counterType && c.year === currentYear.toString());
  };

  const formatPreview = (series: string, year: number, number: string) => {
    return `${series}/${year}/${number.padStart(5, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <SettingCard
      title="Numerotare Documente"
      description="Configurați seriile și formatul numerotării pentru documente contabile"
    >
      <FormSection 
        title="Serii Jurnale" 
        description="Seriile pentru jurnale contabile"
        columns={2}
      >
        {Object.entries(COUNTER_LABELS).map(([counterType, label]) => {
          const counter = getCounterBySeries(counterType);
          return (
            <Card key={counterType} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">{label}</Label>
                  <Badge variant="outline">{counterType}</Badge>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Serie</Label>
                  <Input
                    value={counter?.series || counterType}
                    disabled
                    className="font-mono"
                  />
                </div>

                <div className="bg-muted p-3 rounded-md space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Format Preview:</p>
                  <p className="text-sm font-mono font-semibold">
                    {formatPreview(
                      counter?.series || counterType,
                      currentYear,
                      counter?.lastNumber || "1"
                    )}
                  </p>
                </div>

                {counter && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Ultim număr alocat:</span>
                      <span className="font-mono font-semibold">{counter.lastNumber.padStart(5, '0')}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>An fiscal:</span>
                      <span className="font-semibold">{counter.year}</span>
                    </div>
                  </div>
                )}

                {!counter && (
                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => updateCounterMutation.mutate({
                        counterType,
                        series: counterType,
                        year: currentYear,
                      })}
                      disabled={updateCounterMutation.isPending}
                    >
                      {updateCounterMutation.isPending && (
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      )}
                      Inițializează Serie
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </FormSection>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900">Informații despre numerotare</h4>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li>• Seriile se resetează automat la începutul anului fiscal</li>
              <li>• Numerotarea este secvențială și nu poate fi modificată manual</li>
              <li>• Formatul: SERIE/AN/NUMĂR (ex: JV/2025/00001)</li>
            </ul>
          </div>
        </div>
      </div>
    </SettingCard>
  );
}

