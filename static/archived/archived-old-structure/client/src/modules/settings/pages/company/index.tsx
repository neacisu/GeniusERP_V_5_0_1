/**
 * Company Profile Settings Page
 * 
 * Manages company information, fiscal details, and contact information
 */

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building, FileText, Phone, Globe, CreditCard } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import TabsNav, { TabItem } from "../../components/common/TabsNav";
import SettingForm from "../../components/forms/SettingForm";
import FormSection from "../../components/forms/FormSection";
import CustomFormField from "../../components/forms/FormField";
import { Company } from "@shared/schema";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

// Company settings schema
const companySchema = z.object({
  name: z.string().min(3, "Numele companiei trebuie să aibă minim 3 caractere"),
  fiscalCode: z.string().min(2, "Codul fiscal este obligatoriu"),
  registrationNumber: z.string().min(2, "Numărul de înregistrare este obligatoriu"),
  address: z.string().min(5, "Adresa trebuie să aibă minim 5 caractere"),
  city: z.string().min(2, "Orașul este obligatoriu"),
  county: z.string().min(2, "Județul este obligatoriu"),
  country: z.string().min(2, "Țara este obligatorie"),
  vatPayer: z.boolean(),
  vatRate: z.number().min(0).max(100),
  phone: z.string().optional(),
  email: z.string().email("Adresa de email nu este validă").optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

// Define tabs for company settings
const companyTabs: TabItem[] = [
  { id: "general", label: "Informații Generale", icon: Building },
  { id: "fiscal", label: "Date Fiscale", icon: FileText },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "online", label: "Prezență Online", icon: Globe },
  { id: "banking", label: "Date Bancare", icon: CreditCard },
];

function CompanyProfilePageContent() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch company settings
  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ['/api/settings/company'],
  });

  // Company form
  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      fiscalCode: "",
      registrationNumber: "",
      address: "",
      city: "",
      county: "",
      country: "Romania",
      phone: "",
      email: "",
      website: "",
      bankAccount: "",
      bankName: "",
      vatPayer: true,
      vatRate: 19,
    },
  });

  // Set form values when company data is loaded
  useEffect(() => {
    if (company) {
      companyForm.reset({
        name: company.name,
        fiscalCode: company.fiscalCode,
        registrationNumber: company.registrationNumber,
        address: company.address,
        city: company.city,
        county: company.county,
        country: company.country,
        phone: company.phone || "",
        email: company.email || "",
        website: company.website || "",
        bankAccount: company.bankAccount || "",
        bankName: company.bankName || "",
        vatPayer: company.vatPayer === null ? undefined : company.vatPayer,
        vatRate: company.vatRate === null ? undefined : company.vatRate,
      });
    }
  }, [company]);

  // Handle company settings update
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const endpoint = company 
        ? `/api/settings/company/${company.id}` 
        : '/api/settings/company';
      const method = company ? "PATCH" : "POST";
      return await apiRequest(endpoint, {
        method,
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/company'] });
      toast({
        title: "Setări actualizate",
        description: "Setările companiei au fost actualizate cu succes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: `Nu s-au putut actualiza setările: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const onSubmitCompany = (data: CompanyFormData) => {
    updateCompanyMutation.mutate(data);
  };

  // Get the current tab's title and description
  const getTabTitle = () => {
    switch (activeTab) {
      case "general": return "Informații Generale";
      case "fiscal": return "Date Fiscale";
      case "contact": return "Informații de Contact";
      case "online": return "Prezență Online";
      case "banking": return "Date Bancare";
      default: return "";
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case "general": return "Informații de bază despre companie";
      case "fiscal": return "Date fiscale și de identificare";
      case "contact": return "Informații de contact ale companiei";
      case "online": return "Informații despre prezența online";
      case "banking": return "Detalii bancare pentru tranzacții";
      default: return "";
    }
  };

  // Tab content based on the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <FormSection title="Informații generale" description="Date de bază despre companie" columns={2}>
            <CustomFormField name="name" label="Denumire Companie" form={companyForm}>
              <Input placeholder="S.C. EXEMPLU S.R.L." />
            </CustomFormField>
            <CustomFormField name="address" label="Adresă" form={companyForm}>
              <Input placeholder="Str. Exemplu, Nr. 123" />
            </CustomFormField>
            <CustomFormField name="city" label="Oraș" form={companyForm}>
              <Input placeholder="București" />
            </CustomFormField>
            <CustomFormField name="county" label="Județ" form={companyForm}>
              <Input placeholder="Sector 1" />
            </CustomFormField>
            <CustomFormField name="country" label="Țară" form={companyForm}>
              <Input />
            </CustomFormField>
          </FormSection>
        );
      case "fiscal":
        return (
          <FormSection title="Informații fiscale" description="Date fiscale pentru facturi și documente" columns={2}>
            <CustomFormField name="fiscalCode" label="Cod Fiscal" form={companyForm}>
              <Input placeholder="RO12345678" />
            </CustomFormField>
            <CustomFormField name="registrationNumber" label="Număr Înregistrare" form={companyForm}>
              <Input placeholder="J40/123/2023" />
            </CustomFormField>
            <FormField
              control={companyForm.control}
              name="vatPayer"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Plătitor de TVA</FormLabel>
                    <FormDescription>
                      Compania este înregistrată în scopuri de TVA
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <CustomFormField name="vatRate" label="Cotă TVA Standard (%)" form={companyForm}>
              <Input 
                type="number" 
                min="0" 
                max="100"
                onChange={(e) => companyForm.setValue("vatRate", Number(e.target.value))}
              />
            </CustomFormField>
          </FormSection>
        );
      case "contact":
        return (
          <FormSection title="Date de contact" description="Informații de contact ale companiei" columns={2}>
            <CustomFormField name="phone" label="Telefon" form={companyForm}>
              <Input placeholder="+40700000000" />
            </CustomFormField>
            <CustomFormField name="email" label="Email" form={companyForm}>
              <Input placeholder="office@exemplu.ro" type="email" />
            </CustomFormField>
          </FormSection>
        );
      case "online":
        return (
          <FormSection title="Prezență online" description="Informații despre prezența online a companiei" columns={2}>
            <CustomFormField name="website" label="Website" form={companyForm}>
              <Input placeholder="https://www.exemplu.ro" />
            </CustomFormField>
          </FormSection>
        );
      case "banking":
        return (
          <FormSection title="Informații bancare" description="Detalii bancare pentru tranzacții" columns={2}>
            <CustomFormField name="bankAccount" label="Cont Bancar" form={companyForm}>
              <Input placeholder="RO49AAAA1B31007593840000" />
            </CustomFormField>
            <CustomFormField name="bankName" label="Bancă" form={companyForm}>
              <Input placeholder="Banca Exemplu" />
            </CustomFormField>
          </FormSection>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Date Companie"
        description="Gestionați informațiile despre companie care vor fi folosite în documente oficiale."
        breadcrumbs={[{ title: "Date Companie" }]}
      />

      <TabsNav
        tabs={companyTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <SettingForm
          title={getTabTitle()}
          description={getTabDescription()}
          form={companyForm}
          onSubmit={onSubmitCompany}
          isSubmitting={updateCompanyMutation.isPending}
          submitText="Salvează Setările"
        >
          {renderTabContent()}
        </SettingForm>
      )}
    </div>
  );
}

// Export the main component directly
export default function CompanyProfilePage() {
  return <CompanyProfilePageContent />;
}