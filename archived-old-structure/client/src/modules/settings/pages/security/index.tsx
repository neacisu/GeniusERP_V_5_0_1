/**
 * Security Main Page
 * 
 * Main security settings overview page
 */

import React from "react";
import { Link } from "wouter";
import { Shield, KeyRound, Users, UserCog, History, Lock } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import SettingCategoryCard from "../../components/cards/SettingCategoryCard";
import SettingCard from "../../components/cards/SettingCard";
import { Button } from "@/components/ui/button";

export default function SecurityMainPage() {
  // Define security categories
  const securityCategories = [
    {
      title: "Utilizatori", 
      description: "Gestionați conturile de utilizator și accesul la sistem.",
      icon: Users,
      href: "/admin/users"
    },
    {
      title: "Roluri și Permisiuni", 
      description: "Configurați rolurile și permisiunile utilizatorilor.",
      icon: UserCog,
      href: "/admin/roles"
    },
    {
      title: "Chei API", 
      description: "Gestionați cheile API pentru integrări și acces programatic.",
      icon: KeyRound,
      href: "/settings/integrations/api-keys"
    },
    {
      title: "Setări Securitate", 
      description: "Configurați politicile de securitate și autentificare.",
      icon: Lock,
      href: "/settings/security/settings"
    },
    {
      title: "Jurnal Autentificări", 
      description: "Vizualizați istoricul de autentificări și activitate.",
      icon: History,
      href: "/admin/audit-logs"
    }
  ];

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Securitate"
        description="Gestionați toate aspectele de securitate și control al accesului."
        breadcrumbs={[
          { title: "Setări", href: "/settings" },
          { title: "Securitate" }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {securityCategories.map((category, index) => (
          <SettingCategoryCard 
            key={index}
            title={category.title}
            description={category.description}
            icon={category.icon}
            href={category.href}
          />
        ))}
      </div>

      <SettingCard
        title="Recomandări Securitate"
        description="Recomandări pentru creșterea nivelului de securitate"
      >
        <div className="space-y-4">
          <div className="rounded-lg border bg-amber-50 p-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5 mr-3" />
              <div>
                <h4 className="font-medium text-amber-800">Activați autentificarea în doi pași</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Activarea autentificării în doi pași crește considerabil securitatea conturilor de utilizator.
                </p>
                <Button size="sm" variant="outline" className="mt-2">
                  Configurează
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SettingCard>
    </div>
  );
}