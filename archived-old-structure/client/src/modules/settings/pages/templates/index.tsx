/**
 * Templates Main Page
 * 
 * Main entry point for document templates and email templates settings
 */

import React from "react";
import { Link } from "wouter";
import { 
  FileText, Mail, PenLine, LayoutTemplate,
  Receipt, Award, Files
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import SettingCategoryCard from "../../components/cards/SettingCategoryCard";

export default function TemplatesPage() {
  // Define template categories
  const templateCategories = [
    {
      title: "Șabloane Documente",
      description: "Personalizați șabloanele pentru documente generate în aplicație.",
      icon: FileText,
      href: "/settings/templates/document-templates"
    },
    {
      title: "Șabloane Email",
      description: "Configurați șabloanele pentru emailurile trimise automat.",
      icon: Mail,
      href: "/settings/templates/email-templates"
    },
    {
      title: "Șabloane Facturi",
      description: "Personalizați aspectul și conținutul facturilor.",
      icon: Receipt,
      href: "/settings/templates/invoice-templates"
    },
    {
      title: "Șabloane Certificate",
      description: "Configurați aspectul certificatelor și diplomelor generate.",
      icon: Award,
      href: "/settings/templates/certificate-templates"
    },
    {
      title: "Șabloane Rapoarte",
      description: "Personalizați formatul rapoartelor generate.",
      icon: Files,
      href: "/settings/templates/report-templates"
    }
  ];

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Șabloane"
        description="Personalizați șabloanele pentru diverse tipuri de documente și emailuri."
        breadcrumbs={[
          { title: "Setări", href: "/settings" },
          { title: "Șabloane" }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templateCategories.map((category, index) => (
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