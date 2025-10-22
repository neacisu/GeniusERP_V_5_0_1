/**
 * VAT Settings Section
 * 
 * Component for managing VAT settings
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import SettingCard from "@/modules/settings/components/cards/SettingCard";
import FormSection from "@/modules/settings/components/forms/FormSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

interface VatSettings {
  id: string;
  companyId: string;
  vatPayer: boolean;
  useCashVat: boolean;
  cashVatThreshold: string;
  standardVatRate: number;
  reducedVatRate1: number;
  reducedVatRate2: number;
  vatCollectedAccount: string;
  vatDeductibleAccount: string;
  vatPayableAccount: string;
  vatReceivableAccount: string;
  declarationFrequency: string;
  enableVatValidation: boolean;
}

interface VatSettingsSectionProps {
  companyId: string;
  onChange?: () => void;
}

export default function VatSettingsSection({ companyId, onChange }: VatSettingsSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state for form
  const [formData, setFormData] = useState<Partial<VatSettings>>({});

  // Fetch VAT settings
  const { data: settings, isLoading } = useQuery<VatSettings>({
    queryKey: [`/api/accounting/settings/${companyId}/vat`],
  });

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Update VAT settings mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<VatSettings>) => {
      return await apiRequest(`/api/accounting/settings/${companyId}/vat`, {
        method: 'PUT',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accounting/settings/${companyId}/vat`] });
      toast({ title: "Succes", description: "Setările TVA au fost actualizate" });
      onChange?.();
    },
    onError: (error: Error) => {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Exclude read-only audit fields before sending to backend
    const { id, companyId: _, createdAt, updatedAt, ...dataToSend } = formData as any;
    updateMutation.mutate(dataToSend);
  };

  const handleChange = (field: keyof VatSettings, value: any) => {
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
        title="Setări TVA"
        description="Configurați regimul TVA și conturile asociate"
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
          title="Regim TVA" 
          description="Configurare generală regim TVA"
          columns={2}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="vatPayer">Plătitor de TVA</Label>
                <p className="text-sm text-muted-foreground">
                  Compania este plătitoare de TVA
                </p>
              </div>
              <Switch
                id="vatPayer"
                checked={formData.vatPayer || false}
                onCheckedChange={(checked) => handleChange('vatPayer', checked)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="useCashVat">TVA la Încasare</Label>
                <p className="text-sm text-muted-foreground">
                  Regim TVA la încasare (Legea 227/2015)
                </p>
              </div>
              <Switch
                id="useCashVat"
                checked={formData.useCashVat || false}
                onCheckedChange={(checked) => handleChange('useCashVat', checked)}
                disabled={!formData.vatPayer}
              />
            </div>
          </div>

          {formData.useCashVat && (
            <div className="space-y-2 col-span-2">
              <Label htmlFor="cashVatThreshold">Prag TVA la Încasare (RON)</Label>
              <Input
                id="cashVatThreshold"
                type="number"
                value={formData.cashVatThreshold || "2250000.00"}
                onChange={(e) => handleChange('cashVatThreshold', e.target.value)}
                step="0.01"
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Pragul legal pentru TVA la încasare: 2.250.000 RON
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="declarationFrequency">Frecvență Declarație D406</Label>
            <Select
              value={formData.declarationFrequency || "monthly"}
              onValueChange={(value) => handleChange('declarationFrequency', value)}
            >
              <SelectTrigger id="declarationFrequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Lunară</SelectItem>
                <SelectItem value="quarterly">Trimestrială</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableVatValidation">Validare CUI ANAF</Label>
                <p className="text-sm text-muted-foreground">
                  Validare automată status TVA parteneri
                </p>
              </div>
              <Switch
                id="enableVatValidation"
                checked={formData.enableVatValidation || false}
                onCheckedChange={(checked) => handleChange('enableVatValidation', checked)}
              />
            </div>
          </div>
        </FormSection>

        <FormSection 
          title="Cote TVA" 
          description="Cotele de TVA aplicabile în România"
          columns={3}
        >
          <div className="space-y-2">
            <Label htmlFor="standardVatRate">Cotă Standard (%)</Label>
            <Input
              id="standardVatRate"
              type="number"
              value={formData.standardVatRate || 19}
              onChange={(e) => handleChange('standardVatRate', parseInt(e.target.value, 10))}
              min="0"
              max="100"
            />
            <p className="text-xs text-muted-foreground">Cota standard: 19%</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reducedVatRate1">Cotă Redusă 1 (%)</Label>
            <Input
              id="reducedVatRate1"
              type="number"
              value={formData.reducedVatRate1 || 9}
              onChange={(e) => handleChange('reducedVatRate1', parseInt(e.target.value, 10))}
              min="0"
              max="100"
            />
            <p className="text-xs text-muted-foreground">Cotă redusă 1: 9%</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reducedVatRate2">Cotă Redusă 2 (%)</Label>
            <Input
              id="reducedVatRate2"
              type="number"
              value={formData.reducedVatRate2 || 5}
              onChange={(e) => handleChange('reducedVatRate2', parseInt(e.target.value, 10))}
              min="0"
              max="100"
            />
            <p className="text-xs text-muted-foreground">Cotă redusă 2: 5%</p>
          </div>
        </FormSection>

        <FormSection 
          title="Conturi TVA" 
          description="Conturi contabile pentru TVA"
          columns={2}
        >
          <div className="space-y-2">
            <Label htmlFor="vatCollectedAccount">TVA Colectată (4427)</Label>
            <Input
              id="vatCollectedAccount"
              value={formData.vatCollectedAccount || "4427"}
              onChange={(e) => handleChange('vatCollectedAccount', e.target.value)}
              placeholder="4427"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatDeductibleAccount">TVA Deductibilă (4426)</Label>
            <Input
              id="vatDeductibleAccount"
              value={formData.vatDeductibleAccount || "4426"}
              onChange={(e) => handleChange('vatDeductibleAccount', e.target.value)}
              placeholder="4426"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatPayableAccount">TVA de Plată (4423)</Label>
            <Input
              id="vatPayableAccount"
              value={formData.vatPayableAccount || "4423"}
              onChange={(e) => handleChange('vatPayableAccount', e.target.value)}
              placeholder="4423"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatReceivableAccount">TVA de Recuperat (4424)</Label>
            <Input
              id="vatReceivableAccount"
              value={formData.vatReceivableAccount || "4424"}
              onChange={(e) => handleChange('vatReceivableAccount', e.target.value)}
              placeholder="4424"
            />
          </div>
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
              <h4 className="text-sm font-semibold text-blue-900">Informații TVA</h4>
              <ul className="mt-2 text-sm text-blue-800 space-y-1">
                <li>• Cotele de TVA trebuie actualizate conform legislației în vigoare</li>
                <li>• TVA la încasare se aplică pentru companii sub 2.250.000 RON cifră de afaceri</li>
                <li>• Validarea CUI verifică automat statusul TVA al partenerilor la ANAF</li>
              </ul>
            </div>
          </div>
        </div>
      </SettingCard>
    </form>
  );
}

