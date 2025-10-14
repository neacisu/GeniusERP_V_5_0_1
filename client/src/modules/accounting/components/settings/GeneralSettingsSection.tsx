/**
 * General Settings Section
 * 
 * Component for general accounting settings
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

interface AccountingSettings {
  id: string;
  companyId: string;
  fiscalYearStartMonth: number;
  requireApproval: boolean;
  autoNumbering: boolean;
  hasAccountingHistory: boolean;
  accountingStartDate?: string;
  openingBalancesImported: boolean;
}

interface GeneralSettingsSectionProps {
  companyId: string;
  onChange?: () => void;
}

const MONTHS = [
  { value: 1, label: "Ianuarie" },
  { value: 2, label: "Februarie" },
  { value: 3, label: "Martie" },
  { value: 4, label: "Aprilie" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Iunie" },
  { value: 7, label: "Iulie" },
  { value: 8, label: "August" },
  { value: 9, label: "Septembrie" },
  { value: 10, label: "Octombrie" },
  { value: 11, label: "Noiembrie" },
  { value: 12, label: "Decembrie" },
];

export default function GeneralSettingsSection({ companyId, onChange }: GeneralSettingsSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state for form
  const [formData, setFormData] = useState<Partial<AccountingSettings>>({});

  // Fetch general settings
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
      const response = await fetch(`/api/accounting/settings/${companyId}/general`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update settings');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accounting/settings/${companyId}`] });
      toast({ title: "Succes", description: "Setările au fost actualizate" });
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
        title="Setări Generale"
        description="Configurări generale pentru modulul de contabilitate"
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
          title="An Fiscal" 
          description="Configurare an fiscal și perioade contabile"
          columns={1}
        >
          <div className="space-y-2">
            <Label htmlFor="fiscalYearStartMonth">Luna de început an fiscal</Label>
            <Select
              value={formData.fiscalYearStartMonth?.toString() || "1"}
              onValueChange={(value) => handleChange('fiscalYearStartMonth', parseInt(value, 10))}
            >
              <SelectTrigger id="fiscalYearStartMonth">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              În România, anul fiscal începe în general cu luna Ianuarie
            </p>
          </div>
        </FormSection>

        <FormSection 
          title="Reguli de Validare" 
          description="Configurați regulile de validare pentru operațiuni contabile"
          columns={1}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="requireApproval" className="text-base">
                  Aprobare obligatorie
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notele contabile necesită aprobare înainte de postare în registrul jurnal
                </p>
              </div>
              <Switch
                id="requireApproval"
                checked={formData.requireApproval || false}
                onCheckedChange={(checked) => handleChange('requireApproval', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="autoNumbering" className="text-base">
                  Numerotare automată
                </Label>
                <p className="text-sm text-muted-foreground">
                  Numerotare automată pentru jurnale și documente contabile
                </p>
              </div>
              <Switch
                id="autoNumbering"
                checked={formData.autoNumbering !== false}
                onCheckedChange={(checked) => handleChange('autoNumbering', checked)}
              />
            </div>
          </div>
        </FormSection>

        <FormSection 
          title="Istoric Contabil" 
          description="Informații despre istoricul contabil al companiei"
          columns={2}
        >
          <div className="space-y-2">
            <Label>Companie cu istoric contabil</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                {formData.hasAccountingHistory ? "Da" : "Nu"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Acest câmp este configurat prin procesul de onboarding
            </p>
          </div>

          {formData.hasAccountingHistory && formData.accountingStartDate && (
            <div className="space-y-2">
              <Label>Data start contabilitate</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  {new Date(formData.accountingStartDate).toLocaleDateString("ro-RO")}
                </p>
              </div>
            </div>
          )}

          {formData.hasAccountingHistory && (
            <div className="space-y-2 col-span-2">
              <Label>Status import solduri inițiale</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  {formData.openingBalancesImported 
                    ? "✓ Solduri inițiale importate" 
                    : "⚠ Solduri inițiale neimportate"}
                </p>
              </div>
            </div>
          )}
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
              <h4 className="text-sm font-semibold text-blue-900">Informații importante</h4>
              <ul className="mt-2 text-sm text-blue-800 space-y-1">
                <li>• Modificarea lunii de început an fiscal afectează perioadele fiscale</li>
                <li>• Aprobarea obligatorie este recomandată pentru control intern</li>
                <li>• Numerotarea automată asigură conformitatea cu legislația</li>
              </ul>
            </div>
          </div>
        </div>
      </SettingCard>
    </form>
  );
}

