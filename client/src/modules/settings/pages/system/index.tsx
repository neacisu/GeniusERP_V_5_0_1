/**
 * General Settings Page
 * 
 * Provides overview and quick access to the most common settings
 */

import React from "react";
import {
  Building,
  FileText,
  Users,
  Database,
  Palette,
  LayoutGrid,
  CreditCard,
  Globe,
  AlertTriangle
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import SettingCategoryCard from "../../components/cards/SettingCategoryCard";
import InfoCard from "../../components/cards/InfoCard";

function SystemIndexPageContent() {
  // Define setting categories
  const settingCategories = [
    {
      title: "Date Companie", 
      description: "Configurați informațiile despre firmă, adresa și datele fiscale.",
      icon: Building,
      href: "/settings/company-profile"
    },
    {
      title: "Gestionare Utilizatori", 
      description: "Administrați conturile de utilizator și rolurile acestora.",
      icon: Users,
      href: "/settings/user-preferences"
    },
    {
      title: "Aspect & Teme", 
      description: "Personalizați aspectul aplicației și setările de afișare.",
      icon: Palette,
      href: "/settings/ui-themes"
    },
    {
      title: "Module Sistem", 
      description: "Gestionați funcționalitățile și modulele disponibile.",
      icon: LayoutGrid,
      href: "/settings/module-settings"
    },
    {
      title: "Integrări", 
      description: "Configurați conexiunile cu servicii și aplicații externe.",
      icon: Globe,
      href: "/settings/integrations"
    },
    {
      title: "Sistem", 
      description: "Configurări avansate și parametri de sistem.",
      icon: Database,
      href: "/settings/system"
    }
  ];

  // Initial setup items
  const initialSetupItems = [
    {
      title: "Date fiscale companie",
      description: "Configurați datele fiscale pentru facturi și documente",
      actionHref: "/settings/company-profile?tab=fiscal",
      actionLabel: "Configurează"
    },
    {
      title: "Metode de plată",
      description: "Configurați metodele de plată acceptate",
      actionHref: "/settings/system?tab=payment",
      actionLabel: "Configurează"
    },
    {
      title: "Șabloane documente",
      description: "Configurați șabloanele pentru documentele generate",
      actionHref: "/settings/document-templates",
      actionLabel: "Configurează"
    }
  ];

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Setări Generale"
        description="Configurați datele și preferințele generale ale aplicației."
        breadcrumbs={[{ title: "General" }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingCategories.map((category, index) => (
          <SettingCategoryCard 
            key={index}
            title={category.title}
            description={category.description}
            icon={category.icon}
            href={category.href}
          />
        ))}
      </div>

      <InfoCard
        items={initialSetupItems}
        title="Configurare Inițială"
        description="Asigurați-vă că ați configurat setările esențiale pentru funcționarea corectă a aplicației."
        icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
        variant="warning"
        className="mt-8"
      />
    </div>
  );
}

// Export the main component directly
export default function SystemIndexPage() {
  return <SystemIndexPageContent />;
}