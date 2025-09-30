/**
 * Documents Integrations Page
 * 
 * Manages integrations with document management services like PandaDoc, etc.
 */

import React from "react";
import { FileText, Upload, Download, Signature, FileSearch, History, Settings, BarChart, CheckCircle2, XCircle, ClipboardCheck, Clock, Fingerprint } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import PageHeader from "../../../components/common/PageHeader";
import SettingCard from "../../../components/cards/SettingCard";
import IntegrationCard from "../../../components/cards/IntegrationCard";
import ConfigureIntegrationModal from "../../../components/modals/ConfigureIntegrationModal";
import { IntegrationProvider, IntegrationStatus } from "../../../hooks/integrations/useIntegrations";

export default function DocumentsPage() {
  const [configureModalOpen, setConfigureModalOpen] = React.useState(false);
  const [selectedIntegration, setSelectedIntegration] = React.useState<{
    provider: IntegrationProvider;
    title: string;
    description: string;
    config?: Record<string, any>;
  } | null>(null);

  // Mock data for document integrations
  const documentIntegrations = [
    {
      provider: IntegrationProvider.PANDADOC,
      title: "PandaDoc",
      description: "Creați, trimiteți și semnați documente electronic cu PandaDoc.",
      icon: FileText,
      status: IntegrationStatus.INACTIVE
    },
    {
      provider: IntegrationProvider.MICROSOFT_GRAPH,
      title: "Microsoft 365",
      description: "Integrare cu Microsoft 365 pentru documente și fișiere.",
      icon: FileText,
      status: IntegrationStatus.INACTIVE
    }
  ];

  // Mock data for recent documents
  const recentDocuments = [
    { id: "doc-001", name: "Contract servicii.pdf", type: "contract", status: "completed", sentTo: "Client SRL", date: "2025-04-10" },
    { id: "doc-002", name: "Acord colaborare.pdf", type: "agreement", status: "sent", sentTo: "Partener Ltd.", date: "2025-04-11" },
    { id: "doc-003", name: "Ofertă comercială.pdf", type: "quote", status: "draft", sentTo: "-", date: "2025-04-12" }
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

  // Format document status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">Semnat</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">Trimis</Badge>;
      case 'draft':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200">Ciornă</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">Expirat</Badge>;
      case 'declined':
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200">Refuzat</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get status icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Integrări Documente"
        description="Conectați servicii pentru gestionarea și semnarea documentelor electronice."
        breadcrumbs={[
          { title: "Setări", href: "/settings" },
          { title: "Integrări", href: "/settings/integrations" },
          { title: "Documente" }
        ]}
      />

      <Tabs defaultValue="providers">
        <TabsList className="mb-6">
          <TabsTrigger value="providers">Furnizori</TabsTrigger>
          <TabsTrigger value="documents">Documente</TabsTrigger>
          <TabsTrigger value="templates">Șabloane</TabsTrigger>
          <TabsTrigger value="settings">Setări</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {documentIntegrations.map((integration, index) => (
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
            title="Beneficii integrare documente"
            description="Conectați un furnizor de servicii de documente pentru a beneficia de:"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <Signature className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Semnătură digitală</h3>
                  <p className="text-sm text-muted-foreground">Semnați electronic documente cu valoare legală.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Șabloane documente</h3>
                  <p className="text-sm text-muted-foreground">Utilizați șabloane predefinite pentru documentele frecvente.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <FileSearch className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Management documente</h3>
                  <p className="text-sm text-muted-foreground">Organizați și urmăriți toate documentele în sisteme integrate.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <Fingerprint className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Conformitate legală</h3>
                  <p className="text-sm text-muted-foreground">Respectați cerințele legale pentru documentele electronice.</p>
                </div>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <SettingCard
            title="Documente recente"
            description="Documente procesate prin integrările configurate."
          >
            <div className="space-y-4">
              <div className="flex justify-between">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Document nou
                </Button>
                <div className="flex space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtru status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate statusurile</SelectItem>
                      <SelectItem value="completed">Semnate</SelectItem>
                      <SelectItem value="sent">Trimise</SelectItem>
                      <SelectItem value="draft">Ciorne</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <FileSearch className="h-4 w-4" />
                    <span className="sr-only">Căutare</span>
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nume document</TableHead>
                      <TableHead>Destinatar</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDocuments.length > 0 ? (
                      recentDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            {getStatusIcon(doc.status)}
                          </TableCell>
                          <TableCell className="font-medium">{doc.name}</TableCell>
                          <TableCell>{doc.sentTo}</TableCell>
                          <TableCell>{formatDate(doc.date)}</TableCell>
                          <TableCell>{getStatusBadge(doc.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Detalii</span>
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Nu există documente.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </SettingCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total documente</CardTitle>
                <CardDescription>Toată perioada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Rata semnare</CardTitle>
                <CardDescription>% documente semnate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">33%</div>
                <Progress value={33} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Timp mediu semnare</CardTitle>
                <CardDescription>De la trimitere la semnare</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2 zile</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <SettingCard
            title="Șabloane documente"
            description="Gestionați șabloane pentru documente utilizate frecvent."
          >
            <div className="space-y-4">
              <div className="flex justify-between">
                <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  Șablon nou
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Importă șabloane
                </Button>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/10 hover:bg-muted/20">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Contract prestări servicii</h3>
                      <p className="text-xs text-muted-foreground">Contract standard pentru servicii</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Signature className="h-4 w-4" />
                      <span className="sr-only">Semnează</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">Editează</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/10 hover:bg-muted/20">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Ofertă comercială</h3>
                      <p className="text-xs text-muted-foreground">Șablon ofertă pentru clienți</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Signature className="h-4 w-4" />
                      <span className="sr-only">Semnează</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">Editează</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/10 hover:bg-muted/20">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">NDA (Acord de confidențialitate)</h3>
                      <p className="text-xs text-muted-foreground">Document standard de confidențialitate</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Signature className="h-4 w-4" />
                      <span className="sr-only">Semnează</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">Editează</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title="Câmpuri dinamice"
            description="Configurați câmpuri de date care pot fi completate automat în documente."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-medium">Câmpuri companie</h3>
                  <p className="text-sm text-muted-foreground">Date despre compania proprie</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Automat</Badge>
              </div>

              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-medium">Câmpuri client</h3>
                  <p className="text-sm text-muted-foreground">Date despre client din CRM</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Automat</Badge>
              </div>

              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-medium">Câmpuri ofertă/contract</h3>
                  <p className="text-sm text-muted-foreground">Date specifice ofertelor/contractelor</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Automat</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Câmpuri personalizate</h3>
                  <p className="text-sm text-muted-foreground">Câmpuri definite de utilizator</p>
                </div>
                <Button variant="outline" size="sm">
                  Configurează
                </Button>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingCard
            title="Setări generale documente"
            description="Configurați opțiuni generale pentru documentele electronice."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Expirare automată</h3>
                  <p className="text-sm text-muted-foreground">Documente expiră automat după o perioadă</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked />
                  <Select defaultValue="30">
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Zile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 zile</SelectItem>
                      <SelectItem value="14">14 zile</SelectItem>
                      <SelectItem value="30">30 zile</SelectItem>
                      <SelectItem value="60">60 zile</SelectItem>
                      <SelectItem value="90">90 zile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Notificări reminder</h3>
                  <p className="text-sm text-muted-foreground">Trimite remindere pentru documente nesemnate</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Semnături multiple</h3>
                  <p className="text-sm text-muted-foreground">Permite semnarea de către mai multe persoane</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Arhivare automată</h3>
                  <p className="text-sm text-muted-foreground">Arhivează automat documentele semnate</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Verificare semnături</h3>
                  <p className="text-sm text-muted-foreground">Verifică validitatea semnăturilor digitale</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title="Branding documente"
            description="Configurați aspectul vizual al documentelor generate."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Logo în documente</h3>
                  <p className="text-sm text-muted-foreground">Include logo companie în documentele generate</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Culori personalizate</h3>
                  <p className="text-sm text-muted-foreground">Folosește culorile companiei în documente</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Font personalizat</h3>
                  <p className="text-sm text-muted-foreground">Folosește fontul companiei în documente</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between border-t pt-3 mt-2">
                <div>
                  <h3 className="font-medium">Previzualizare</h3>
                  <p className="text-sm text-muted-foreground">Previzualizează documentele înainte de trimitere</p>
                </div>
                <Button variant="outline">
                  <FileSearch className="mr-2 h-4 w-4" />
                  Previzualizează
                </Button>
              </div>
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