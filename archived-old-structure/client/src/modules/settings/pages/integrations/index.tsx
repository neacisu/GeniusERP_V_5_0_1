/**
 * Integrations Main Page
 * 
 * Displays and manages system integrations with external services
 */

import React from "react";
import { ShoppingCart, FileText, CreditCard, MessageSquare, BarChart4, Link as LinkIcon, FileWarning, ScanEye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PageHeader from "../../components/common/PageHeader";
import SettingCategoryCard from "../../components/cards/SettingCategoryCard";
import IntegrationCard from "../../components/cards/IntegrationCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useIntegrations, IntegrationStatus, IntegrationProvider } from "../../hooks/integrations/useIntegrations";
import ConfigureIntegrationModal from "../../components/modals/ConfigureIntegrationModal";

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = React.useState("overview");
  const [configureModalOpen, setConfigureModalOpen] = React.useState(false);
  const [selectedIntegration, setSelectedIntegration] = React.useState<{ 
    provider: IntegrationProvider;
    title: string;
    description: string;
    config?: Record<string, any>;
  } | null>(null);

  // Fetch integrations
  const { data: integrations, isLoading } = useIntegrations();

  // Define integration categories
  const integrationCategories = [
    {
      title: "E-commerce", 
      description: "Integrări cu platforme de e-commerce precum Shopify, WooCommerce.",
      icon: ShoppingCart,
      href: "/settings/integrations/ecommerce"
    },
    {
      title: "Plăți", 
      description: "Integrări cu procesatori de plăți precum Stripe, PayPal.",
      icon: CreditCard,
      href: "/settings/integrations/payments"
    },
    {
      title: "Comunicare", 
      description: "Integrări cu servicii de comunicare precum Mailchimp, Twilio.",
      icon: MessageSquare,
      href: "/settings/integrations/communication"
    },
    {
      title: "ANAF & e-Factura", 
      description: "Integrare cu serviciile ANAF și e-Factura pentru raportare electronică.",
      icon: FileWarning,
      href: "/settings/integrations/anaf"
    },
    {
      title: "Documente", 
      description: "Integrări cu servicii de documente precum PandaDoc, DocuSign.",
      icon: FileText,
      href: "/settings/integrations/documents"
    },
    {
      title: "Chei API", 
      description: "Configurare și gestionare chei API pentru integrări.",
      icon: LinkIcon,
      href: "/settings/security/api-keys"
    }
  ];

  // Featured integrations for the dashboard
  const featuredIntegrations = [
    {
      provider: IntegrationProvider.SHOPIFY_ADMIN,
      title: "Shopify",
      description: "Sincronizare magazin online, produse, comenzi și clienți.",
      icon: ShoppingCart,
      status: IntegrationStatus.INACTIVE,
      lastSynced: undefined as string | undefined
    },
    {
      provider: IntegrationProvider.STRIPE,
      title: "Stripe",
      description: "Procesare plăți și abonamente online cu Stripe.",
      icon: CreditCard,
      status: IntegrationStatus.INACTIVE,
      lastSynced: undefined as string | undefined
    },
    {
      provider: IntegrationProvider.ANAF,
      title: "ANAF & e-Factura",
      description: "Raportare e-Factura și integrare cu serviciile ANAF.",
      icon: FileWarning,
      status: IntegrationStatus.INACTIVE,
      lastSynced: undefined as string | undefined
    },
    {
      provider: IntegrationProvider.PANDADOC,
      title: "PandaDoc",
      description: "Documente electronice și semnături digitale.",
      icon: FileText,
      status: IntegrationStatus.INACTIVE,
      lastSynced: undefined as string | undefined
    }
  ];

  // Get real statuses from the API response
  const getFeaturedIntegrationsWithRealStatus = () => {
    if (!integrations) return featuredIntegrations;

    return featuredIntegrations.map(featuredIntegration => {
      const matchingIntegration = integrations.find(i => i.provider === featuredIntegration.provider);
      
      if (matchingIntegration) {
        return {
          ...featuredIntegration,
          status: matchingIntegration.status,
          lastSynced: matchingIntegration.lastSyncedAt,
          config: matchingIntegration.config
        };
      }
      
      return featuredIntegration;
    });
  };

  const handleConfigureIntegration = (integration: typeof selectedIntegration) => {
    setSelectedIntegration(integration);
    setConfigureModalOpen(true);
  };

  const handleSaveConfiguration = (config: Record<string, any>) => {
    console.log('Saving configuration:', config);
    // Here you would call a mutation to save the integration
    setConfigureModalOpen(false);
  };

  // Calculate integration status for the progress bar
  const getIntegrationStats = () => {
    if (!integrations) {
      return { active: 0, inactive: 0, pending: 0, error: 0, total: 0, percent: 0 };
    }

    const active = integrations.filter(i => i.status === IntegrationStatus.ACTIVE).length;
    const total = integrations.length;
    const percent = total > 0 ? Math.round((active / total) * 100) : 0;

    return {
      active,
      inactive: integrations.filter(i => i.status === IntegrationStatus.INACTIVE).length,
      pending: integrations.filter(i => i.status === IntegrationStatus.PENDING).length,
      error: integrations.filter(i => i.status === IntegrationStatus.ERROR).length,
      total,
      percent
    };
  };

  const stats = getIntegrationStats();

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Dashboard Integrări"
        description="Vizualizați și gestionați conexiunile cu servicii și aplicații externe."
        breadcrumbs={[
          { title: "Setări", href: "/settings" },
          { title: "Integrări" }
        ]}
      />

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Sumar</TabsTrigger>
          <TabsTrigger value="all">Toate integrările</TabsTrigger>
          <TabsTrigger value="active">Integrări active</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Integration Status Card */}
          <Card className="p-6">
            <div className="flex flex-col space-y-2">
              <h3 className="text-lg font-medium">Status Integrări</h3>
              <p className="text-sm text-muted-foreground">
                {stats.active} din {stats.total} integrări active ({stats.percent}% completat)
              </p>
              <div className="pt-2">
                <Progress value={stats.percent} className="h-2" />
              </div>
              <div className="flex justify-between pt-4 text-sm">
                <div>
                  <span className="font-medium text-green-600">{stats.active}</span> Active
                </div>
                <div>
                  <span className="font-medium text-amber-600">{stats.pending}</span> În așteptare
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">{stats.inactive}</span> Inactive
                </div>
                <div>
                  <span className="font-medium text-destructive">{stats.error}</span> Erori
                </div>
              </div>
            </div>
          </Card>

          {/* Featured Integrations */}
          <div>
            <h3 className="text-lg font-medium mb-4">Integrări recomandate</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getFeaturedIntegrationsWithRealStatus().map((integration, index) => (
                <IntegrationCard
                  key={index}
                  title={integration.title}
                  description={integration.description}
                  icon={integration.icon}
                  status={integration.status}
                  lastSynced={integration.lastSynced}
                  onConfigure={() => handleConfigureIntegration(integration)}
                />
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-medium mb-4">Categorii de integrări</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrationCategories.map((category, index) => (
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
        </TabsContent>

        <TabsContent value="all">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Toate integrările</h3>
              <Button variant="outline">
                <ScanEye className="w-4 h-4 mr-2" />
                Scanare Disponibilitate
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-8">
                <p>Se încarcă integrările...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFeaturedIntegrationsWithRealStatus().map((integration, index) => (
                  <IntegrationCard
                    key={index}
                    title={integration.title}
                    description={integration.description}
                    icon={integration.icon}
                    status={integration.status}
                    lastSynced={integration.lastSynced}
                    onConfigure={() => handleConfigureIntegration(integration)}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="active">
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Integrări active</h3>
            
            {isLoading ? (
              <div className="flex justify-center p-8">
                <p>Se încarcă integrările...</p>
              </div>
            ) : (
              stats.active > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFeaturedIntegrationsWithRealStatus()
                    .filter(i => i.status === IntegrationStatus.ACTIVE)
                    .map((integration, index) => (
                      <IntegrationCard
                        key={index}
                        title={integration.title}
                        description={integration.description}
                        icon={integration.icon}
                        status={integration.status}
                        lastSynced={integration.lastSynced}
                        onConfigure={() => handleConfigureIntegration(integration)}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                  <h3 className="text-lg font-medium mb-2">Nu există integrări active</h3>
                  <p className="text-muted-foreground mb-4">
                    Nu există integrări active în prezent. Configurați integrările din secțiunea Sumar.
                  </p>
                  <Button onClick={() => setActiveTab("overview")}>
                    Configurare integrări
                  </Button>
                </div>
              )
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Configure Integration Modal */}
      {selectedIntegration && (
        <ConfigureIntegrationModal
          open={configureModalOpen}
          onClose={() => setConfigureModalOpen(false)}
          onSave={handleSaveConfiguration}
          provider={selectedIntegration.provider}
          title={`Configurare ${selectedIntegration.title}`}
          description={`Configurați integrarea cu ${selectedIntegration.title}.`}
          currentConfig={selectedIntegration.config}
        />
      )}
    </div>
  );
}