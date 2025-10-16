/**
 * Document Numbering Section
 * 
 * Component for managing multiple document numbering series
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
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";

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

  // State for adding new series
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newSeriesName, setNewSeriesName] = useState("");
  const [newSeriesYear, setNewSeriesYear] = useState(currentYear);

  // Fetch document counters
  const { data: counters = [], isLoading } = useQuery<DocumentCounter[]>({
    queryKey: [`/api/accounting/settings/${companyId}/document-counters`],
  });

  // Create new series mutation
  const createSeriesMutation = useMutation({
    mutationFn: async ({ counterType, series, year }: { counterType: string; series: string; year: number }) => {
      return await apiRequest(`/api/accounting/settings/${companyId}/document-counters`, {
        method: 'POST',
        body: { counterType, series, year },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accounting/settings/${companyId}/document-counters`] });
      toast({ title: "Succes", description: "Seria a fost adăugată" });
      setAddingFor(null);
      setNewSeriesName("");
      setNewSeriesYear(currentYear);
      onChange?.();
    },
    onError: (error: Error) => {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    },
  });

  // Delete series mutation
  const deleteSeriesMutation = useMutation({
    mutationFn: async (counterId: string) => {
      return await apiRequest(`/api/accounting/settings/${companyId}/document-counters/${counterId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accounting/settings/${companyId}/document-counters`] });
      toast({ title: "Succes", description: "Seria a fost ștearsă" });
      onChange?.();
    },
    onError: (error: Error) => {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    },
  });

  // Group counters by type
  const getCountersByType = (counterType: string) => {
    return counters.filter((c) => c.counterType === counterType);
  };

  const formatPreview = (series: string, year: string, number: string) => {
    return `${series}/${year}/${number.padStart(5, '0')}`;
  };

  const handleAddSeries = (counterType: string) => {
    if (!newSeriesName.trim()) {
      toast({ title: "Eroare", description: "Introduceți numele seriei", variant: "destructive" });
      return;
    }

    createSeriesMutation.mutate({
      counterType,
      series: newSeriesName.trim().toUpperCase(),
      year: newSeriesYear
    });
  };

  const handleDeleteSeries = (counter: DocumentCounter) => {
    if (parseInt(counter.lastNumber) > 0) {
      toast({
        title: "Atenție",
        description: "Nu se poate șterge o serie care a fost deja utilizată",
        variant: "destructive"
      });
      return;
    }

    if (window.confirm(`Sunteți sigur că doriți să ștergeți seria ${counter.series}/${counter.year}?`)) {
      deleteSeriesMutation.mutate(counter.id);
    }
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
      description="Configurați seriile și formatul numerotării pentru documente contabile. Puteți avea mai multe serii pentru fiecare tip de document."
    >
      <FormSection 
        title="Serii Jurnale și Documente" 
        description="Gestionați seriile pentru jurnale contabile și documente"
        columns={1}
      >
        <div className="space-y-6">
          {Object.entries(COUNTER_LABELS).map(([counterType, label]) => {
            const typeCounters = getCountersByType(counterType);
            const isAdding = addingFor === counterType;

            return (
              <div key={counterType} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-sm">{label}</h4>
                    <p className="text-xs text-gray-500">Tip: {counterType}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddingFor(isAdding ? null : counterType)}
                    disabled={createSeriesMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adaugă Serie
                  </Button>
                </div>

                {/* Existing Series */}
                {typeCounters.length === 0 && !isAdding && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    <AlertCircle className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                    Nu există serii configurate
                  </div>
                )}

                {typeCounters.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {typeCounters.map((counter) => (
                      <Card key={counter.id} className="p-3 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono">
                                {counter.series}/{counter.year}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Ultimul număr: {counter.lastNumber}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Format: {formatPreview(counter.series, counter.year, (parseInt(counter.lastNumber) + 1).toString())}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSeries(counter)}
                            disabled={
                              deleteSeriesMutation.isPending ||
                              parseInt(counter.lastNumber) > 0
                            }
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Add New Series Form */}
                {isAdding && (
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <h5 className="text-sm font-medium mb-3">Adaugă Serie Nouă</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Nume Serie (ex: FAC-A, JV-2025)</Label>
                        <Input
                          value={newSeriesName}
                          onChange={(e) => setNewSeriesName(e.target.value)}
                          placeholder="Ex: FAC-A"
                          className="mt-1"
                          disabled={createSeriesMutation.isPending}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">An</Label>
                        <Input
                          type="number"
                          value={newSeriesYear}
                          onChange={(e) => setNewSeriesYear(parseInt(e.target.value))}
                          min={2020}
                          max={2050}
                          className="mt-1"
                          disabled={createSeriesMutation.isPending}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleAddSeries(counterType)}
                        disabled={createSeriesMutation.isPending || !newSeriesName.trim()}
                      >
                        {createSeriesMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        Adaugă
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAddingFor(null);
                          setNewSeriesName("");
                          setNewSeriesYear(currentYear);
                        }}
                        disabled={createSeriesMutation.isPending}
                      >
                        Anulează
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </FormSection>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">ℹ️ Informații</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Puteți adăuga mai multe serii pentru același tip de document (ex: FAC-A, FAC-B pentru facturi diferite)</li>
          <li>• Fiecare serie are numerotare independentă</li>
          <li>• Nu puteți șterge o serie care a fost deja utilizată (lastNumber {">"} 0)</li>
          <li>• Formatul documentului va fi: SERIE/AN/NUMĂR (ex: FAC-A/2025/00001)</li>
        </ul>
      </div>
    </SettingCard>
  );
}
