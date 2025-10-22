/**
 * Notifications Main Page
 * 
 * Main entry point for notification settings
 */

import React from "react";
import { Link } from "wouter";
import { 
  Bell, Mail, MessageSquare, Phone, Calendar, Settings,
  AlertTriangle 
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import SettingCategoryCard from "../../components/cards/SettingCategoryCard";

export default function NotificationsPage() {
  // Define notification categories
  const notificationCategories = [
    {
      title: "Setări Generale Notificări",
      description: "Configurați preferințele generale pentru notificări.",
      icon: Settings,
      href: "/settings/notifications/settings"
    },
    {
      title: "Canale de Notificare",
      description: "Configurați metodele prin care primiți notificări.",
      icon: Mail,
      href: "/settings/notifications/channels"
    },
    {
      title: "Notificări Sistem",
      description: "Configurați notificările pentru evenimente de sistem.",
      icon: Bell,
      href: "/settings/notifications/system"
    },
    {
      title: "Modele de Notificări",
      description: "Personalizați aspectul și conținutul notificărilor.",
      icon: MessageSquare,
      href: "/settings/notifications/templates"
    },
    {
      title: "Reguli și Alerte",
      description: "Configurați reguli pentru generarea alertelor.",
      icon: AlertTriangle,
      href: "/settings/notifications/alerts"
    }
  ];

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Notificări"
        description="Gestionați setările de notificări și preferințele pentru toate canalele."
        breadcrumbs={[
          { title: "Setări", href: "/settings" },
          { title: "Notificări" }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notificationCategories.map((category, index) => (
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