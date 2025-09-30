/**
 * Preferences Main Page
 * 
 * Main entry point for user preferences and application settings
 */

import React from "react";
import { Link } from "wouter";
import { 
  User, BellRing, Globe, Palette, 
  MessageSquare, ArrowUpDown 
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import SettingCategoryCard from "../../components/cards/SettingCategoryCard";

export default function PreferencesPage() {
  // Define preference categories
  const preferenceCategories = [
    {
      title: "Preferințe Utilizator",
      description: "Personalizați experiența utilizatorului și opțiunile implicite.",
      icon: User,
      href: "/settings/preferences/user-preferences"
    },
    {
      title: "Teme Interfață",
      description: "Personalizați aspectul vizual al interfeței aplicației.",
      icon: Palette,
      href: "/settings/preferences/ui-themes"
    },
    {
      title: "Notificări",
      description: "Configurați tipurile și frecvența notificărilor primite.",
      icon: BellRing,
      href: "/settings/preferences/notifications"
    },
    {
      title: "Localizare",
      description: "Setări de limbă, format dată și fus orar.",
      icon: Globe,
      href: "/settings/preferences/localization"
    }
  ];

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Preferințe"
        description="Personalizați experiența utilizatorului și comportamentul aplicației."
        breadcrumbs={[
          { title: "Setări", href: "/settings" },
          { title: "Preferințe" }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {preferenceCategories.map((category, index) => (
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