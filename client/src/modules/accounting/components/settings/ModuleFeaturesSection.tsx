/**
 * Module Features Section
 * 
 * Component for enabling/disabling accounting module features
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import SettingCard from "@/modules/settings/components/cards/SettingCard";
import FormSection from "@/modules/settings/components/forms/FormSection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

interface AccountingSettings {
  id: string;
  companyId: string;
  enableAnalyticAccounting: boolean;
  enableMultiCurrency: boolean;
  enableFixedAssets: boolean;
  enableCostCenters: boolean;
  enableProjects: boolean;
  enableSaftExport: boolean;
  enableAnafEfactura: boolean;
  anafApiKey?: string;
}

interface ModuleFeaturesSectionProps {
  companyId: string;
  onChange?: () => void;
}

export default function ModuleFeaturesSection({ companyId, onChange }: ModuleFeaturesSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state for form
  const [formData, setFormData] = useState<Partial<AccountingSettings>>({});

  // Fetch settings
  const { data: settings, isLoading } = useQuery<AccountingSettings>({
    queryKey: [`/api/accounting/settings/${companyId}`],
    select: (data: any) => data.generalSettings,
  });

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<AccountingSettings>) => {
      return await apiRequest(`/api/accounting/settings/${companyId}/general`, {
        method: 'PUT',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accounting/settings/${companyId}`] });
      toast({ title: "Succes", description: "Funcționalitățile au fost actualizate" });
      onChange?.();
    },
    onError: (error: Error) => {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof AccountingSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <SettingCard
        title="Funcționalități Modul"
        description="Activați sau dezactivați funcționalități avansate ale modulului de contabilitate"
        footerContent={
          <Button 
            type="submit" 
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Salvează Modificările
          </Button>
        }
      >
        <FormSection 
          title="Funcționalități Avansate" 
          description="Module suplimentare de contabilitate"
          columns={1}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="enableAnalyticAccounting" className="text-base">
                  Contabilitate Analitică
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permite gestionarea conturilor analitice pentru detalii suplimentare
                </p>
              </div>
              <Switch
                id="enableAnalyticAccounting"
                checked={formData.enableAnalyticAccounting || false}
                onCheckedChange={(checked) => handleChange('enableAnalyticAccounting', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="enableMultiCurrency" className="text-base">
                  Contabilitate Multivalută
                </Label>
                <p className="text-sm text-muted-foreground">
                  Gestionarea tranzacțiilor în multiple valute cu conversie automată
                </p>
              </div>
              <Switch
                id="enableMultiCurrency"
                checked={formData.enableMultiCurrency || false}
                onCheckedChange={(checked) => handleChange('enableMultiCurrency', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="enableFixedAssets" className="text-base">
                  Mijloace Fixe
                </Label>
                <p className="text-sm text-muted-foreground">
                  Gestionarea mijloacelor fixe și calculul amortizării automate
                </p>
              </div>
              <Switch
                id="enableFixedAssets"
                checked={formData.enableFixedAssets || false}
                onCheckedChange={(checked) => handleChange('enableFixedAssets', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="enableCostCenters" className="text-base">
                  Centre de Cost
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alocarea cheltuielilor pe centre de cost pentru analiză desfășurată
                </p>
              </div>
              <Switch
                id="enableCostCenters"
                checked={formData.enableCostCenters || false}
                onCheckedChange={(checked) => handleChange('enableCostCenters', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="enableProjects" className="text-base">
                  Contabilitate pe Proiecte
                </Label>
                <p className="text-sm text-muted-foreground">
                  Urmărirea veniturilor și cheltuielilor pe proiecte individuale
                </p>
              </div>
              <Switch
                id="enableProjects"
                checked={formData.enableProjects || false}
                onCheckedChange={(checked) => handleChange('enableProjects', checked)}
              />
            </div>
          </div>
        </FormSection>

        <FormSection 
          title="Integrări Externe" 
          description="Configurare integrări cu sisteme externe"
          columns={1}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="enableSaftExport" className="text-base">
                  Export SAF-T
                </Label>
                <p className="text-sm text-muted-foreground">
                  Activează exportul în format SAF-T (Standard Audit File for Tax)
                </p>
              </div>
              <Switch
                id="enableSaftExport"
                checked={formData.enableSaftExport || false}
                onCheckedChange={(checked) => handleChange('enableSaftExport', checked)}
              />
            </div>

            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="enableAnafEfactura" className="text-base">
                    ANAF e-Factura
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Integrare cu sistemul RO e-Factura al ANAF
                  </p>
                </div>
                <Switch
                  id="enableAnafEfactura"
                  checked={formData.enableAnafEfactura || false}
                  onCheckedChange={(checked) => handleChange('enableAnafEfactura', checked)}
                />
              </div>

              {formData.enableAnafEfactura && (
                <div className="mt-4 pt-4 border-t">
                  <Label htmlFor="anafApiKey">API Key ANAF</Label>
                  <Input
                    id="anafApiKey"
                    type="password"
                    value={formData.anafApiKey || ""}
                    onChange={(e) => handleChange('anafApiKey', e.target.value)}
                    placeholder="Introduceți cheia API ANAF"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Cheia API poate fi obținută din SPV (Spațiul Privat Virtual)
                  </p>
                </div>
              )}
            </div>
          </div>
        </FormSection>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900">Atenție!</h4>
              <ul className="mt-2 text-sm text-amber-800 space-y-1">
                <li>• Activarea funcționalităților avansate poate afecta performanța</li>
                <li>• Unele funcționalități necesită configurare suplimentară</li>
                <li>• Integrarea cu ANAF necesită autorizare și certificat digital</li>
              </ul>
            </div>
          </div>
        </div>
      </SettingCard>
    </form>
  );
}

