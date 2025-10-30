/**
 * Settings Module Main Page
 * 
 * Acts as the entry point for the settings module with links to all setting areas
 */

import React from "react";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";

import PageHeader from "../components/common/PageHeader";
import SettingCard from "../components/cards/SettingCard";

import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Bell,
  Shield,
  Settings,
  FileText,
  Palette,
  ToggleLeft,
  ServerCog,
  User,
  ChevronRight,
  Globe,
  Mail,
} from "lucide-react";

// Define settings categories
const settingsCategories = [
  {
    id: "company",
    title: "Informații Companie",
    description: "Configurați informațiile de bază ale companiei utilizate în documente și rapoarte.",
    icon: Building2,
    links: [
      { id: "company-profile", title: "Profil Companie", href: "/settings/company" },
    ],
  },
  {
    id: "system",
    title: "Setări Sistem",
    description: "Configurați parametrii de sistem, modulele și alte setări generale.",
    icon: ServerCog,
    links: [
      { id: "system-overview", title: "Prezentare Generală", href: "/settings/system" },
      { id: "general-settings", title: "Setări Generale", href: "/settings/system/general" },
      { id: "module-settings", title: "Module Sistem", href: "/settings/system/module-settings" },
    ],
  },
  {
    id: "security",
    title: "Utilizatori și Securitate",
    description: "Gestionați utilizatorii, rolurile și setările de securitate.",
    icon: Shield,
    links: [
      { id: "users", title: "Utilizatori", href: "/admin/users" },
      { id: "roles", title: "Roluri și Permisiuni", href: "/admin/roles" },
      { id: "security", title: "Setări Securitate", href: "/settings/security" },
      { id: "api-keys", title: "Chei API", href: "/settings/integrations/api-keys" },
    ],
  },
  {
    id: "templates",
    title: "Șabloane și Documente",
    description: "Personalizați șabloanele pentru diverse tipuri de documente.",
    icon: FileText,
    links: [
      { id: "document-templates", title: "Șabloane Documente", href: "/settings/templates/document-templates" },
      { id: "email-templates", title: "Șabloane Email", href: "/settings/templates/email-templates" },
    ],
  },
  {
    id: "preferences",
    title: "Preferințe și Notificări",
    description: "Configurați preferințele și notificările aplicației.",
    icon: User,
    links: [
      { id: "user-preferences", title: "Preferințe Utilizator", href: "/settings/preferences/user-preferences" },
      { id: "ui-themes", title: "Teme Interfață", href: "/settings/preferences/ui-themes" },
      { id: "notification-settings", title: "Setări Notificări", href: "/settings/notifications" },
      { id: "localization", title: "Localizare", href: "/settings/preferences/localization" },
    ],
  },
  {
    id: "integrations",
    title: "Integrări",
    description: "Configurați conectările cu servicii externe și API-uri.",
    icon: Globe,
    links: [
      { id: "integrations", title: "Integrări", href: "/settings/integrations" },
      { id: "api-keys", title: "Chei API", href: "/settings/integrations/api-keys" },
    ],
  },
  {
    id: "features",
    title: "Funcționalități",
    description: "Activați sau dezactivați funcționalități specifice ale aplicației.",
    icon: ToggleLeft,
    links: [
      { id: "feature-toggles", title: "Activare Funcționalități", href: "/settings/features/feature-toggles" },
    ],
  },
];

function SettingsIndexPageContent() {
  const { user } = useUser();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Setări"
        description="Configurați și personalizați funcționalitățile aplicației."
        breadcrumbs={[{ title: "Setări" }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCategories.map((category) => (
          <div
            key={category.id}
            className="relative overflow-hidden rounded-lg border bg-background p-2"
          >
            <div className="flex h-full flex-col justify-between">
              <div className="p-4 pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <category.icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold">{category.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <div className="flex flex-col">
                {category.links.map((link) => (
                  <Link key={link.id} href={link.href}>
                    <Button
                      variant="ghost"
                      className="justify-start w-full text-left px-4 py-2 hover:bg-muted"
                    >
                      <span>{link.title}</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <SettingCard
        title="Informații Sistem"
        description="Informații despre versiunea și starea sistemului"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <h3 className="font-medium">Versiune</h3>
              <p className="text-sm text-muted-foreground">
                2.5.0
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <h3 className="font-medium">Data Lansării</h3>
              <p className="text-sm text-muted-foreground">
                12 Aprilie 2025
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <h3 className="font-medium">Status</h3>
              <p className="text-sm text-green-600 font-medium">
                Operațional
              </p>
            </div>
          </div>
        </div>
      </SettingCard>
    </div>
  );
}

// Export the main component directly
export default function SettingsIndexPage() {
  return <SettingsIndexPageContent />;
}