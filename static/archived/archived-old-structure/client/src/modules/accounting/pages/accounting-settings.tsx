/**
 * Accounting Settings Page
 * 
 * Complete settings page for accounting module with tab navigation
 */

import { useState } from "react";
import { useParams } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Calculator, FileText, Calendar, ReceiptText, Link2, Layers, Upload } from "lucide-react";

// Import all settings sections
import GeneralSettingsSection from "../components/settings/GeneralSettingsSection";
import VatSettingsSection from "../components/settings/VatSettingsSection";
import AccountMappingsSection from "../components/settings/AccountMappingsSection";
import DocumentNumberingSection from "../components/settings/DocumentNumberingSection";
import FiscalPeriodsSection from "../components/settings/FiscalPeriodsSection";
import ModuleFeaturesSection from "../components/settings/ModuleFeaturesSection";
import OnboardingSection from "../components/settings/OnboardingSection";

export default function AccountingSettingsPage() {
  const { companyId } = useParams<{ companyId?: string }>();
  const [activeTab, setActiveTab] = useState("general");

  if (!companyId) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p className="text-red-600">Eroare: Company ID necesar</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="h-8 w-8 text-gray-700" />
            <h1 className="text-3xl font-bold text-gray-900">Setări Contabilitate</h1>
          </div>
          <p className="text-gray-600">
            Configurare completă a modulului de contabilitate
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-2">
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Generale</span>
            </TabsTrigger>

            <TabsTrigger value="vat" className="flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">TVA</span>
            </TabsTrigger>

            <TabsTrigger value="mappings" className="flex items-center space-x-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Conturi</span>
            </TabsTrigger>

            <TabsTrigger value="numbering" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Numerotare</span>
            </TabsTrigger>

            <TabsTrigger value="periods" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Perioade</span>
            </TabsTrigger>

            <TabsTrigger value="features" className="flex items-center space-x-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Funcții</span>
            </TabsTrigger>

            <TabsTrigger value="onboarding" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Onboarding</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Setări Generale</h2>
              <p className="text-gray-600 mt-1">
                Configurați setările de bază ale modulului de contabilitate
              </p>
            </div>
            <GeneralSettingsSection companyId={companyId} />
          </TabsContent>

          {/* VAT Settings Tab */}
          <TabsContent value="vat" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Setări TVA</h2>
              <p className="text-gray-600 mt-1">
                Configurați regimul TVA și conturile asociate
              </p>
            </div>
            <VatSettingsSection companyId={companyId} />
          </TabsContent>

          {/* Account Mappings Tab */}
          <TabsContent value="mappings" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Conturi Implicite</h2>
              <p className="text-gray-600 mt-1">
                Configurați conturile contabile pentru operațiuni automate
              </p>
            </div>
            <AccountMappingsSection companyId={companyId} />
          </TabsContent>

          {/* Document Numbering Tab */}
          <TabsContent value="numbering" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Numerotare Documente</h2>
              <p className="text-gray-600 mt-1">
                Configurați seriile și formatul numerotării pentru documente
              </p>
            </div>
            <DocumentNumberingSection companyId={companyId} />
          </TabsContent>

          {/* Fiscal Periods Tab */}
          <TabsContent value="periods" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Perioade Fiscale</h2>
              <p className="text-gray-600 mt-1">
                Gestionați perioadele fiscale și statusul acestora
              </p>
            </div>
            <FiscalPeriodsSection companyId={companyId} />
          </TabsContent>

          {/* Module Features Tab */}
          <TabsContent value="features" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Funcționalități Modul</h2>
              <p className="text-gray-600 mt-1">
                Activați sau dezactivați funcționalități avansate
              </p>
            </div>
            <ModuleFeaturesSection companyId={companyId} />
          </TabsContent>

          {/* Onboarding Tab */}
          <TabsContent value="onboarding" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Onboarding Istoric Contabil</h2>
              <p className="text-gray-600 mt-1">
                Configurați compania cu istoric contabil existent
              </p>
            </div>
            <OnboardingSection companyId={companyId} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

