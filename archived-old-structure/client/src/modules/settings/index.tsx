/**
 * Settings Module
 * 
 * Main entry point for the Settings module with vertical navigation
 * and module configuration.
 */

import React from "react";
import { Route, Switch, useLocation, Link } from "wouter";
import {
  Settings,
  UserCog,
  Globe,
  Database,
  Building,
  Building2,
  Bell,
  Lock,
  Palette,
  LayoutGrid,
  PlugZap,
  FileText,
  Key,
  Server,
  UserCircle,
  Shield,
  Mail
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import CollabIntegration from "../collab/components/CollabIntegration";

// Import pages
import SettingsIndexPage from "./pages/index";
import CompanyProfilePage from "./pages/company/index";
import UserPreferencesPage from "./pages/preferences/user-preferences";
import SystemGeneralPage from "./pages/system/general";
import SystemIndexPage from "./pages/system/index";
import ModuleSettingsPage from "./pages/system/module-settings";
import DocumentTemplatesPage from "./pages/templates/document-templates";
import NotificationsSettingsPage from "./pages/notifications/settings";
import NotificationsPage from "./pages/notifications/index";
import NotificationChannelsPage from "./pages/notifications/channels";
import IntegrationsPageImpl from "./pages/integrations/index";
import ApiKeysPageImpl from "./pages/integrations/api-keys/index";
import AnafPageImpl from "./pages/integrations/anaf/index";
import EcommercePageImpl from "./pages/integrations/ecommerce/index";
import PaymentsPageImpl from "./pages/integrations/payments/index";
import DocumentsPageImpl from "./pages/integrations/documents/index";
import CommunicationPageImpl from "./pages/integrations/communication/index";

// Use placeholder components for pages that are still in development
const SecuritySettingsPage = () => (
  <div className="text-center py-8">
    <h2 className="text-xl font-semibold mb-4">Securitate</h2>
    <p className="text-muted-foreground">Această pagină va fi disponibilă în curând.</p>
  </div>
);

// Update to use the actual implementation
const ApiKeysPage = ApiKeysPageImpl;

// Update to use the actual implementation
const IntegrationsPage = IntegrationsPageImpl;

const EmailTemplatesPage = () => (
  <div className="text-center py-8">
    <h2 className="text-xl font-semibold mb-4">Șabloane Email</h2>
    <p className="text-muted-foreground">Această pagină va fi disponibilă în curând.</p>
  </div>
);

const UsersPage = () => (
  <div className="text-center py-8">
    <h2 className="text-xl font-semibold mb-4">Utilizatori</h2>
    <p className="text-muted-foreground">Această pagină va fi disponibilă în curând.</p>
  </div>
);

// Navigation items for the settings module with subsections
const navItems = [
  {
    title: "General",
    href: "/settings",
    icon: Settings,
    exact: true
  },
  {
    title: "Date Companie",
    href: "/settings/company",
    icon: Building2
  },

  {
    title: "Sistem",
    icon: Server,
    items: [
      {
        title: "Setări Generale",
        href: "/settings/system/general"
      },
      {
        title: "Module Sistem",
        href: "/settings/system/module-settings"
      },
      {
        title: "Funcționalități",
        href: "/settings/features/feature-toggles"
      }
    ]
  },

  {
    title: "Preferințe",
    icon: UserCog,
    items: [
      {
        title: "Preferințe Utilizator",
        href: "/settings/preferences/user-preferences"
      },
      {
        title: "Notificări",
        href: "/settings/notifications"
      },
      {
        title: "Tema Interfață",
        href: "/settings/preferences/ui-themes"
      }
    ]
  },
  {
    title: "Șabloane",
    icon: FileText,
    items: [
      {
        title: "Șabloane Documente",
        href: "/settings/templates/document-templates"
      },
      {
        title: "Șabloane Email", 
        href: "/settings/templates/email-templates"
      }
    ]
  },
  {
    title: "Integrări",
    icon: PlugZap,
    items: [
      {
        title: "Dashboard Integrări",
        href: "/settings/integrations"
      },
      {
        title: "E-commerce",
        href: "/settings/integrations/ecommerce"
      },
      {
        title: "Plăți",
        href: "/settings/integrations/payments"
      },
      {
        title: "Comunicare",
        href: "/settings/integrations/communication"
      },
      {
        title: "ANAF & e-Factura",
        href: "/settings/integrations/anaf"
      },
      {
        title: "Documente",
        href: "/settings/integrations/documents"
      },
      {
        title: "Chei API",
        href: "/settings/security/api-keys"
      }
    ]
  }
];

export default function SettingsModule() {
  const [location] = useLocation();

  // Helper function to determine if a route is active
  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return location === path;
    }
    return location.startsWith(path);
  };
  
  console.log("Current location in settings module:", location);
  
  // Extract the current path segments for determining which component to render
  const basePath = "/settings/";
  let relativePath = "";
  if (location.startsWith(basePath)) {
    relativePath = location.substring(basePath.length);
  }
  console.log("Relative path for active page:", relativePath);
  
  // Define a function to render the appropriate component based on the current path
  const renderContent = () => {
    // Root settings path
    if (location === "/settings" || !relativePath) {
      console.log("Rendering settings index page");
      return <SettingsIndexPage />;
    }
    
    // Company settings
    else if (relativePath === "company") {
      console.log("Rendering company profile page");
      return <CompanyProfilePage />;
    }
    
    // System routes
    else if (relativePath === "system/general") {
      console.log("Rendering system general page");
      return <SystemGeneralPage />;
    }
    else if (relativePath === "system/module-settings") {
      console.log("Rendering module settings page");
      return <ModuleSettingsPage />;
    }
    else if (relativePath === "system") {
      console.log("Rendering system index page");
      return <SystemIndexPage />;
    }
    
    // Feature toggles
    else if (relativePath === "features/feature-toggles") {
      console.log("Rendering feature toggles page");
      const FeatureTogglesPage = React.lazy(() => import('./pages/features/feature-toggles'));
      return (
        <React.Suspense fallback={<div className="flex items-center justify-center p-8">Se încarcă...</div>}>
          <FeatureTogglesPage />
        </React.Suspense>
      );
    }
    
    // Security routes
    else if (relativePath === "security/settings") {
      return <SecuritySettingsPage />;
    }
    else if (relativePath === "security/roles") {
      console.log("Rendering security roles page");
      // We redirect to admin/roles since that module already exists
      setTimeout(() => window.location.href = "/admin/roles", 0);
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Se redirecționează...</h2>
          <p className="text-muted-foreground">Vă rugăm așteptați, veți fi redirecționat către pagina de administrare roluri.</p>
        </div>
      );
    }
    else if (relativePath === "security/users") {
      // Redirect to Admin Users Page
      setTimeout(() => window.location.href = "/admin/users", 0);
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Se redirecționează...</h2>
          <p className="text-muted-foreground">Vă rugăm așteptați, veți fi redirecționat către pagina de administrare utilizatori.</p>
        </div>
      );
    }
    else if (relativePath === "security/api-keys") {
      return <ApiKeysPage />;
    }
    
    // Preferences routes
    else if (relativePath === "preferences/user-preferences") {
      return <UserPreferencesPage />;
    }
    else if (relativePath === "notifications/settings") {
      return <NotificationsSettingsPage />;
    }
    else if (relativePath === "notifications/channels") {
      return <NotificationChannelsPage />;
    }
    else if (relativePath === "notifications") {
      return <NotificationsPage />;
    }
    else if (relativePath === "preferences/ui-themes") {
      return (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-4">Tema Interfață</h2>
          <p className="text-muted-foreground">Această pagină va fi disponibilă în curând.</p>
        </div>
      );
    }
    
    // Templates routes
    else if (relativePath === "templates/document-templates") {
      return <DocumentTemplatesPage />;
    }
    else if (relativePath === "templates/email-templates") {
      return <EmailTemplatesPage />;
    }
    
    // Integrations routes
    else if (relativePath === "integrations") {
      return <IntegrationsPage />;
    }
    else if (relativePath === "integrations/ecommerce") {
      return <EcommercePageImpl />;
    }
    else if (relativePath === "integrations/payments") {
      return <PaymentsPageImpl />;
    }
    else if (relativePath === "integrations/communication") {
      console.log("Loading communication integrations page");
      return <CommunicationPageImpl />;
    }
    else if (relativePath === "integrations/anaf") {
      return <AnafPageImpl />;
    }
    else if (relativePath === "integrations/documents") {
      return <DocumentsPageImpl />;
    }
    
    // Fallback
    else {
      console.log("No matching route found for path:", relativePath);
      return <SettingsIndexPage />;
    }
  };

  // Render nested navigation items
  const renderNavItem = (item: any) => {
    // Item with sub-items (dropdown)
    if (item.items) {
      const active = item.items.some((subItem: any) => isActive(subItem.href));
      return (
        <li key={item.title} className="mb-1">
          <div className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
            active ? "bg-muted/80 text-primary" : "text-muted-foreground"
          )}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </div>
          <ul className="pl-7 mt-1 space-y-1">
            {item.items.map((subItem: any) => (
              <li key={subItem.href}>
                <Link 
                  href={subItem.href}
                  className={cn(
                    "flex rounded-md px-3 py-1.5 text-sm font-medium",
                    isActive(subItem.href)
                      ? "bg-muted text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-primary"
                  )}
                >
                  <span>{subItem.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </li>
      );
    }

    // Regular item without subitems
    
    // Pentru toate celelalte rute
    return (
      <li key={item.href}>
        <Link 
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
            isActive(item.href, item.exact)
              ? "bg-muted text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-primary"
          )}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </Link>
      </li>
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left sidebar navigation */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-primary p-4">
                <h2 className="text-lg font-semibold text-primary-foreground">Setări</h2>
              </div>
              <nav className="p-2">
                <ul className="space-y-1">
                  {navItems.map(renderNavItem)}
                </ul>
              </nav>
            </div>
          </aside>

          {/* Main content area */}
          <div className="flex-1">
            {/* Render content based on the current path */}
            {renderContent()}
            
            {/* Integrare cu modulul de colaborare */}
            <CollabIntegration 
              moduleContext="Settings" 
              enableTasks={true} 
              enableCommunity={true} 
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}