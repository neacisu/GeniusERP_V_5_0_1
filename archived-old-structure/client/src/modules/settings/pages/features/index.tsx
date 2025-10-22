/**
 * Features Main Page
 * 
 * Main entry point for feature toggles and feature management
 */

import React from "react";
import { Link } from "wouter";
import { 
  ToggleLeft, Lightbulb, Flag, Zap, FlaskConical,
  SlidersHorizontal 
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import SettingCategoryCard from "../../components/cards/SettingCategoryCard";

export default function FeaturesPage() {
  // Define feature categories
  const featureCategories = [
    {
      title: "Activare Funcționalități",
      description: "Activați sau dezactivați funcționalități ale aplicației.",
      icon: ToggleLeft,
      href: "/settings/features/feature-toggles"
    },
    {
      title: "Funcționalități Beta",
      description: "Activați funcționalități în curs de dezvoltare.",
      icon: FlaskConical,
      href: "/settings/features/beta-features"
    },
    {
      title: "Funcționalități Avansate",
      description: "Configurați opțiuni avansate ale aplicației.",
      icon: SlidersHorizontal,
      href: "/settings/features/advanced-features"
    }
  ];

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Funcționalități"
        description="Gestionați funcționalitățile și opțiunile aplicației."
        breadcrumbs={[
          { title: "Setări", href: "/settings" },
          { title: "Funcționalități" }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featureCategories.map((category, index) => (
          <SettingCategoryCard 
            key={index}
            title={category.title}
            description={category.description}
            icon={category.icon}
            href={category.href}
          />
        ))}
      </div>
    </div>
  );
}