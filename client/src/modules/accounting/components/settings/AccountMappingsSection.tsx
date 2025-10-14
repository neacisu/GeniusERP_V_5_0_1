/**
 * Account Mappings Section
 * 
 * Component for managing default account mappings
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SettingCard from "@/modules/settings/components/cards/SettingCard";
import FormSection from "@/modules/settings/components/forms/FormSection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AccountMapping {
  id: string;
  mappingType: string;
  accountCode: string;
  accountName: string;
}

interface SyntheticAccount {
  id: string;
  code: string;
  name: string;
}

interface AccountMappingsSectionProps {
  companyId: string;
  onChange?: () => void;
}

export default function AccountMappingsSection({ companyId, onChange }: AccountMappingsSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch account mappings
  const { data: mappings = [], isLoading: mappingsLoading } = useQuery<AccountMapping[]>({
    queryKey: [`/api/accounting/settings/${companyId}/account-mappings`],
  });

  // Fetch available accounts for dropdowns
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<SyntheticAccount[]>({
    queryKey: ['/api/accounting/synthetic-accounts'],
  });

  // Update mapping mutation
  const updateMappingMutation = useMutation({
    mutationFn: async ({ mappingType, accountCode }: { mappingType: string; accountCode: string }) => {
      const response = await fetch(`/api/accounting/settings/${companyId}/account-mappings/${mappingType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountCode }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update account mapping');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accounting/settings/${companyId}/account-mappings`] });
      toast({ title: "Succes", description: "Maparea contului a fost actualizată" });
      onChange?.();
    },
    onError: (error: Error) => {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    },
  });

  // Reset mappings mutation
  const resetMappingsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/accounting/settings/${companyId}/account-mappings/reset`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to reset account mappings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accounting/settings/${companyId}/account-mappings`] });
      toast({ title: "Succes", description: "Mapările au fost resetate la valorile implicite" });
      onChange?.();
    },
    onError: (error: Error) => {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    },
  });

  const handleMappingChange = (mappingType: string, accountCode: string) => {
    updateMappingMutation.mutate({ mappingType, accountCode });
  };

  const handleReset = () => {
    if (confirm("Sigur doriți să resetați toate mapările la valorile implicite?")) {
      resetMappingsMutation.mutate();
    }
  };

  const getMappingValue = (mappingType: string) => {
    const mapping = mappings.find((m) => m.mappingType === mappingType);
    return mapping?.accountCode || "";
  };

  if (mappingsLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <SettingCard
      title="Conturi Implicite"
      description="Configurați conturile contabile pentru operațiuni automate"
      footerContent={
        <Button 
          variant="outline" 
          onClick={handleReset}
          disabled={resetMappingsMutation.isPending}
        >
          {resetMappingsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Reset la Default
        </Button>
      }
    >
      <FormSection 
        title="Conturi Casă și Bancă" 
        description="Conturi pentru operațiuni de casă și bancă"
        columns={2}
      >
        <div className="space-y-2">
          <Label>Casă în RON (5311)</Label>
          <Select
            value={getMappingValue("CASH_RON")}
            onValueChange={(value) => handleMappingChange("CASH_RON", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectează cont" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.code.startsWith("531"))
                .map((account) => (
                  <SelectItem key={account.id} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cont Bancar Principal (5121)</Label>
          <Select
            value={getMappingValue("BANK_PRIMARY")}
            onValueChange={(value) => handleMappingChange("BANK_PRIMARY", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectează cont" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.code.startsWith("512"))
                .map((account) => (
                  <SelectItem key={account.id} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Casă Mică</Label>
          <Select
            value={getMappingValue("PETTY_CASH")}
            onValueChange={(value) => handleMappingChange("PETTY_CASH", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectează cont" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.code.startsWith("531"))
                .map((account) => (
                  <SelectItem key={account.id} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cont Bancar Valută</Label>
          <Select
            value={getMappingValue("BANK_CURRENCY")}
            onValueChange={(value) => handleMappingChange("BANK_CURRENCY", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectează cont" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.code.startsWith("512"))
                .map((account) => (
                  <SelectItem key={account.id} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </FormSection>

      <FormSection 
        title="Conturi Terți" 
        description="Conturi pentru clienți, furnizori și angajați"
        columns={2}
      >
        <div className="space-y-2">
          <Label>Clienți (4111)</Label>
          <Select
            value={getMappingValue("CUSTOMERS")}
            onValueChange={(value) => handleMappingChange("CUSTOMERS", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectează cont" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.code.startsWith("411"))
                .map((account) => (
                  <SelectItem key={account.id} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Furnizori (401)</Label>
          <Select
            value={getMappingValue("SUPPLIERS")}
            onValueChange={(value) => handleMappingChange("SUPPLIERS", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectează cont" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.code.startsWith("401"))
                .map((account) => (
                  <SelectItem key={account.id} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Avansuri Angajați (425)</Label>
          <Select
            value={getMappingValue("EMPLOYEE_ADVANCES")}
            onValueChange={(value) => handleMappingChange("EMPLOYEE_ADVANCES", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectează cont" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.code.startsWith("425"))
                .map((account) => (
                  <SelectItem key={account.id} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Salarii de Plată (421)</Label>
          <Select
            value={getMappingValue("EMPLOYEE_PAYROLL")}
            onValueChange={(value) => handleMappingChange("EMPLOYEE_PAYROLL", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectează cont" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.code.startsWith("421"))
                .map((account) => (
                  <SelectItem key={account.id} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </FormSection>

      <FormSection 
        title="Conturi TVA" 
        description="Conturi pentru TVA colectată, deductibilă și de plată"
        columns={2}
      >
        <div className="space-y-2">
          <Label>TVA Colectată (4427)</Label>
          <Select
            value={getMappingValue("VAT_COLLECTED")}
            onValueChange={(value) => handleMappingChange("VAT_COLLECTED", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectează cont" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.code.startsWith("4427"))
                .map((account) => (
                  <SelectItem key={account.id} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>TVA Deductibilă (4426)</Label>
          <Select
            value={getMappingValue("VAT_DEDUCTIBLE")}
            onValueChange={(value) => handleMappingChange("VAT_DEDUCTIBLE", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectează cont" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.code.startsWith("4426"))
                .map((account) => (
                  <SelectItem key={account.id} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>TVA de Plată (4423)</Label>
          <Select
            value={getMappingValue("VAT_PAYABLE")}
            onValueChange={(value) => handleMappingChange("VAT_PAYABLE", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectează cont" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.code.startsWith("4423"))
                .map((account) => (
                  <SelectItem key={account.id} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>TVA de Recuperat (4424)</Label>
          <Select
            value={getMappingValue("VAT_RECEIVABLE")}
            onValueChange={(value) => handleMappingChange("VAT_RECEIVABLE", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectează cont" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.code.startsWith("4424"))
                .map((account) => (
                  <SelectItem key={account.id} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </FormSection>
    </SettingCard>
  );
}

