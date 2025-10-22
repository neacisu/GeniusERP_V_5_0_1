/**
 * ANAF & e-Factura Integration Page
 * 
 * Manages integrations with ANAF services and e-Factura for electronic reporting and invoicing.
 */

import React from "react";
import { FileWarning, Upload, Download, FileCheck, Settings, Shield, HelpCircle, AlertCircle, CheckCircle2, FileX, FileClock, Fingerprint, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";

import PageHeader from "../../../components/common/PageHeader";
import SettingCard from "../../../components/cards/SettingCard";
import IntegrationCard from "../../../components/cards/IntegrationCard";
import ConfigureIntegrationModal from "../../../components/modals/ConfigureIntegrationModal";
import { IntegrationProvider, IntegrationStatus } from "../../../hooks/integrations/useIntegrations";

export default function AnafPage() {
  const [configureModalOpen, setConfigureModalOpen] = React.useState(false);
  const [selectedIntegration, setSelectedIntegration] = React.useState<{
    provider: IntegrationProvider;
    title: string;
    description: string;
    config?: Record<string, any>;
  } | null>(null);

  // Mock data for ANAF & e-Factura integrations
  const anafIntegrations = [
    {
      provider: IntegrationProvider.ANAF,
      title: "ANAF API",
      description: "Integrare cu API-ul ANAF pentru verificare CUI, TVA și alte informații fiscale.",
      icon: FileWarning,
      status: IntegrationStatus.INACTIVE
    },
    {
      provider: IntegrationProvider.ANAF,
      title: "e-Factura",
      description: "Sistem de raportare e-Factura către ANAF conform legislației în vigoare.",
      icon: FileCheck,
      status: IntegrationStatus.INACTIVE
    }
  ];

  // Mock data for invoices/reporting
  const recentReports = [
    { id: "INV2025001", date: "2025-04-10", type: "Factură", status: "reported", recipient: "Client SRL", amount: "1299.99 RON" },
    { id: "INV2025002", date: "2025-04-11", type: "Factură", status: "failed", recipient: "Firma Test", amount: "2499.50 RON" },
    { id: "INV2025003", date: "2025-04-12", type: "Factură", status: "pending", recipient: "Companie ABC", amount: "899.00 RON" }
  ];

  const handleConfigureIntegration = (integration: typeof selectedIntegration) => {
    setSelectedIntegration(integration);
    setConfigureModalOpen(true);
  };

  const handleSaveConfiguration = (config: Record<string, any>) => {
    console.log('Saving configuration:', config);
    // Here you would call a mutation to save the integration
    setConfigureModalOpen(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Format report status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reported':
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">Raportat</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">În așteptare</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200">Eșuat</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get status icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reported':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <FileClock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <FileX className="h-4 w-4 text-red-500" />;
      default:
        return <FileCheck className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="ANAF & e-Factura"
        description="Configurați integrarea cu serviciile ANAF și sistemul e-Factura pentru raportare electronică."
        breadcrumbs={[
          { title: "Setări", href: "/settings" },
          { title: "Integrări", href: "/settings/integrations" },
          { title: "ANAF & e-Factura" }
        ]}
      />

      <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Atenție - Conformitate legală</AlertTitle>
        <AlertDescription>
          Raportarea e-Factura este obligatorie conform legii. Asigurați-vă că aveți certificatul digital valid pentru autentificare la ANAF.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Prezentare generală</TabsTrigger>
          <TabsTrigger value="configure">Configurare</TabsTrigger>
          <TabsTrigger value="reports">Raportare</TabsTrigger>
          <TabsTrigger value="history">Istoric</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anafIntegrations.map((integration, index) => (
              <IntegrationCard
                key={index}
                title={integration.title}
                description={integration.description}
                icon={integration.icon}
                status={integration.status}
                onConfigure={() => handleConfigureIntegration(integration)}
              />
            ))}
          </div>

          <SettingCard
            title="Cerințe legale și conformitate"
            description="Informații despre cerințele legale pentru utilizarea sistemului e-Factura."
          >
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Cerințe ANAF pentru e-Factura</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pentru a utiliza sistemul e-Factura aveți nevoie de:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc pl-5">
                    <li>Certificat digital calificat pentru semnarea documentelor</li>
                    <li>Înregistrare în Spațiul Privat Virtual (SPV)</li>
                    <li>Cod de înregistrare fiscală valid (CUI/CIF)</li>
                    <li>Format XML valid conform standardelor UBL/CII</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Resurse utile</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <a href="https://mfinante.gov.ro/ro/web/efactura" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block">
                      Portal oficial e-Factura
                    </a>
                    <a href="https://static.anaf.ro/static/10/Anaf/Informatii_R/e-factura.htm" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block">
                      Ghid oficial ANAF
                    </a>
                    <a href="#" className="text-primary hover:underline block">
                      Documentație tehnică integrare API
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </SettingCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Facturi raportate</CardTitle>
                <CardDescription>Luna curentă</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Facturi în așteptare</CardTitle>
                <CardDescription>Neraportate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Erori raportare</CardTitle>
                <CardDescription>Necesită atenție</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configure" className="space-y-6">
          <SettingCard
            title="Certificat digital"
            description="Configurați certificatul digital pentru autentificare la ANAF."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Status certificat</h3>
                  <p className="text-sm text-muted-foreground">Certificat digital pentru semnare</p>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Neconfigurat
                </Badge>
              </div>

              <div className="pt-2">
                <div className="space-y-2">
                  <p className="text-sm">Pentru a configura certificatul digital, aveți nevoie de:</p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Fișier certificat în format P12/PFX</li>
                    <li>Parola certificatului</li>
                    <li>Data expirării certificatului</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center space-x-4 border-t pt-4">
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Încarcă certificat
                </Button>
                <Button variant="outline" disabled>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Verifică certificat
                </Button>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title="Setări raportare e-Factura"
            description="Configurați modul de raportare a facturilor către sistemul e-Factura."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Raportare automată</h3>
                  <p className="text-sm text-muted-foreground">Raportează automat facturile când sunt emise</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Validare prealabilă</h3>
                  <p className="text-sm text-muted-foreground">Validează facturile înainte de raportare</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Notificări e-Factura</h3>
                  <p className="text-sm text-muted-foreground">Primește notificări despre raportările e-Factura</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Raportare întârziată</h3>
                  <p className="text-sm text-muted-foreground">Permite raportarea întârziată a facturilor</p>
                </div>
                <Switch />
              </div>

              <div className="pt-2 border-t mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Mediu API</h3>
                    <p className="text-sm text-muted-foreground">Selectați mediul de lucru pentru API</p>
                  </div>
                  <Select defaultValue="test">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Selectează mediul" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">Mediu de test</SelectItem>
                      <SelectItem value="production">Producție</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <SettingCard
            title="Raportare manuală e-Factura"
            description="Raportați manual facturi către sistemul e-Factura."
          >
            <div className="space-y-4">
              <div className="flex justify-between">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Raportează facturi
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Descarcă raport
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>ID Factură</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Sumă</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentReports.length > 0 ? (
                      recentReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            {getStatusIcon(report.status)}
                          </TableCell>
                          <TableCell className="font-medium">{report.id}</TableCell>
                          <TableCell>{formatDate(report.date)}</TableCell>
                          <TableCell>{report.recipient}</TableCell>
                          <TableCell>{report.amount}</TableCell>
                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Detalii</span>
                              <FileCheck className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nu există facturi de raportat.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title="Validare CUI/CNP"
            description="Verificați validitatea unui CUI sau CNP în registrul ANAF."
          >
            <div className="flex space-x-2">
              <div className="flex-1">
                <input 
                  type="text" 
                  placeholder="Introduceți CUI/CNP pentru verificare" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Button>Verifică</Button>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <SettingCard
            title="Istoric raportări"
            description="Vizualizați istoricul raportărilor e-Factura."
          >
            <div className="flex justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="period-select">Perioadă:</Label>
                <Select defaultValue="30">
                  <SelectTrigger id="period-select" className="w-40">
                    <SelectValue placeholder="Alege perioada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Ultimele 7 zile</SelectItem>
                    <SelectItem value="30">Ultimele 30 zile</SelectItem>
                    <SelectItem value="90">Ultimele 3 luni</SelectItem>
                    <SelectItem value="365">Ultimul an</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Button variant="outline">
                  <History className="mr-2 h-4 w-4" />
                  Exportă istoric
                </Button>
              </div>
            </div>

            <div className="border rounded-md p-8 flex flex-col items-center justify-center">
              <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nu există date de raportare</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Nu s-au găsit raportări e-Factura pentru perioada selectată. Raportările vor apărea aici după configurarea integrării.
              </p>
            </div>
          </SettingCard>

          <SettingCard
            title="Jurnal de sistem"
            description="Vizualizați jurnalul de operațiuni pentru integrarea ANAF."
          >
            <div className="border rounded-md p-4 bg-muted/20">
              <pre className="text-xs overflow-auto max-h-40 font-mono text-muted-foreground">
                {'[INFO] 2025-04-12 12:00:00 - Inițializare serviciu ANAF\n' +
                 '[INFO] 2025-04-12 12:00:01 - Verificare configurație\n' +
                 '[WARN] 2025-04-12 12:00:01 - Certificat digital nedefinit\n' +
                 '[INFO] 2025-04-12 12:00:02 - Serviciu pornit în mod de testare'}
              </pre>
            </div>
            <div className="mt-2 flex justify-end">
              <Button variant="outline" size="sm">
                Descarcă jurnal complet
              </Button>
            </div>
          </SettingCard>
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