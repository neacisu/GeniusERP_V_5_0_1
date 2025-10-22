/**
 * Communication Integrations Page
 * 
 * Manages integrations with communication services like Email, SMS, etc.
 */

import React from "react";
import { Mail, MessageSquare, Send, History, Bell, Settings, CheckCircle2, XCircle, Phone, MessageCircle, Smartphone, Megaphone, UploadCloud, FileText, Mail as MailIcon, Calendar, Users, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

import PageHeader from "../../../components/common/PageHeader";
import SettingCard from "../../../components/cards/SettingCard";
import IntegrationCard from "../../../components/cards/IntegrationCard";
import ConfigureIntegrationModal from "../../../components/modals/ConfigureIntegrationModal";
import { IntegrationProvider, IntegrationStatus } from "../../../hooks/integrations/useIntegrations";

export default function CommunicationPage() {
  const [configureModalOpen, setConfigureModalOpen] = React.useState(false);
  const [selectedIntegration, setSelectedIntegration] = React.useState<{
    provider: IntegrationProvider;
    title: string;
    description: string;
    config?: Record<string, any>;
  } | null>(null);

  // Mock data for communication integrations
  const communicationIntegrations = [
    {
      provider: IntegrationProvider.MAILCHIMP,
      title: "Mailchimp",
      description: "Integrare cu platforma Mailchimp pentru email marketing și automatizări.",
      icon: Mail,
      status: IntegrationStatus.INACTIVE
    },
    {
      provider: IntegrationProvider.SENDGRID,
      title: "SendGrid",
      description: "Email transacțional și marketing prin platforma SendGrid.",
      icon: Send,
      status: IntegrationStatus.INACTIVE
    },
    {
      provider: IntegrationProvider.TWILIO,
      title: "Twilio",
      description: "Mesaje SMS și notificări prin platforma Twilio.",
      icon: MessageSquare,
      status: IntegrationStatus.INACTIVE
    }
  ];

  // Mock data for recent messages
  const recentMessages = [
    { id: "msg-001", type: "email", recipient: "client@example.com", subject: "Factură emisă #F2025001", date: "2025-04-11", status: "delivered" },
    { id: "msg-002", type: "sms", recipient: "+40712345678", subject: "Confirmare comandă #C2025002", date: "2025-04-10", status: "delivered" },
    { id: "msg-003", type: "email", recipient: "support@company.ro", subject: "Cerere asistență", date: "2025-04-09", status: "failed" }
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

  // Format message status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">Livrat</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">Trimis</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">În așteptare</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200">Eșuat</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format message type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'email':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">Email</Badge>;
      case 'sms':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200">SMS</Badge>;
      case 'push':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">Push</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Get status icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'sent':
        return <Send className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Bell className="h-4 w-4 text-amber-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Integrări Comunicare"
        description="Configurați platforme de comunicare pentru email, SMS și notificări."
        breadcrumbs={[
          { title: "Setări", href: "/settings" },
          { title: "Integrări", href: "/settings/integrations" },
          { title: "Comunicare" }
        ]}
      />

      <Tabs defaultValue="providers">
        <TabsList className="mb-6">
          <TabsTrigger value="providers">Furnizori servicii</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="templates">Șabloane mesaje</TabsTrigger>
          <TabsTrigger value="settings">Setări</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {communicationIntegrations.map((integration, index) => (
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

          <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800">
            <Bell className="h-4 w-4" />
            <AlertTitle>Informație</AlertTitle>
            <AlertDescription>
              Integrarea cu servicii de comunicare vă permite să trimiteți automat email-uri, SMS-uri și notificări către clienți.
              Fiecare furnizor necesită credențiale specifice pentru configurare.
            </AlertDescription>
          </Alert>

          <SettingCard
            title="Beneficii integrare comunicare"
            description="Avantajele integrării cu platforme de comunicare."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <MailIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Email automat</h3>
                  <p className="text-sm text-muted-foreground">Trimitere email-uri tranzacționale și de marketing.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Notificări SMS</h3>
                  <p className="text-sm text-muted-foreground">Alerte și notificări rapide prin SMS.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Programare mesaje</h3>
                  <p className="text-sm text-muted-foreground">Planificați mesaje pentru trimitere la un moment viitor.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Segmentare clienți</h3>
                  <p className="text-sm text-muted-foreground">Comunicare țintită pentru diferite grupuri de clienți.</p>
                </div>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <SettingCard
            title="Configurare email"
            description="Setări pentru trimiterea de email-uri."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Furnizor email implicit</h3>
                  <p className="text-sm text-muted-foreground">Serviciul utilizat implicit pentru trimitere email-uri</p>
                </div>
                <Select defaultValue="default">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Selectează furnizor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">SMTP Server</SelectItem>
                    <SelectItem value="mailchimp">Mailchimp</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email expeditor implicit</h3>
                  <p className="text-sm text-muted-foreground">Adresa implicită de la care se trimit email-uri</p>
                </div>
                <div className="w-60">
                  <input 
                    type="email" 
                    placeholder="email@companie.ro" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email notificări sistem</h3>
                  <p className="text-sm text-muted-foreground">Adresa pentru notificări sistem automate</p>
                </div>
                <div className="w-60">
                  <input 
                    type="email" 
                    placeholder="notificari@companie.ro" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Urmărire deschidere email</h3>
                  <p className="text-sm text-muted-foreground">Monitorizează când email-urile sunt deschise</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Urmărire click-uri</h3>
                  <p className="text-sm text-muted-foreground">Monitorizează click-urile pe link-uri</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="border-t pt-4 mt-2">
                <Button variant="outline">
                  <Send className="mr-2 h-4 w-4" />
                  Trimite email test
                </Button>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title="Email-uri recente"
            description="Istoricul email-urilor trimise prin platformă."
          >
            <div className="space-y-4">
              <div className="flex justify-between">
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Compune email nou
                </Button>
                <div className="flex space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtru status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate statusurile</SelectItem>
                      <SelectItem value="delivered">Livrate</SelectItem>
                      <SelectItem value="pending">În așteptare</SelectItem>
                      <SelectItem value="failed">Eșuate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Destinatar</TableHead>
                      <TableHead>Subiect</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMessages.filter(m => m.type === 'email').length > 0 ? (
                      recentMessages.filter(m => m.type === 'email').map((message) => (
                        <TableRow key={message.id}>
                          <TableCell>
                            {getStatusIcon(message.status)}
                          </TableCell>
                          <TableCell className="font-medium">{message.recipient}</TableCell>
                          <TableCell>{message.subject}</TableCell>
                          <TableCell>{formatDate(message.date)}</TableCell>
                          <TableCell>{getStatusBadge(message.status)}</TableCell>
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
                          Nu există email-uri recente.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="sms" className="space-y-6">
          <SettingCard
            title="Configurare SMS"
            description="Setări pentru trimiterea de mesaje SMS."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Furnizor SMS implicit</h3>
                  <p className="text-sm text-muted-foreground">Serviciul utilizat implicit pentru trimitere SMS-uri</p>
                </div>
                <Select defaultValue="twilio">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Selectează furnizor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="sms_local">Operator local</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Număr expeditor implicit</h3>
                  <p className="text-sm text-muted-foreground">Numărul de telefon de la care se trimit SMS-uri</p>
                </div>
                <div className="w-60">
                  <input 
                    type="tel" 
                    placeholder="+40712345678" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">ID expeditor</h3>
                  <p className="text-sm text-muted-foreground">Identificator text pentru expeditor (Alpha sender ID)</p>
                </div>
                <div className="w-60">
                  <input 
                    type="text" 
                    placeholder="CompaniaMea" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Activare rapoarte livrare</h3>
                  <p className="text-sm text-muted-foreground">Primire confirmări de livrare SMS</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Limitare lungime mesaj</h3>
                  <p className="text-sm text-muted-foreground">Limitare la un singur mesaj SMS (160 caractere)</p>
                </div>
                <Switch />
              </div>
              
              <div className="border-t pt-4 mt-2">
                <Button variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Trimite SMS test
                </Button>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title="SMS-uri recente"
            description="Istoricul mesajelor SMS trimise prin platformă."
          >
            <div className="space-y-4">
              <div className="flex justify-between">
                <Button variant="outline">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Trimite SMS nou
                </Button>
                <div className="flex space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtru status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate statusurile</SelectItem>
                      <SelectItem value="delivered">Livrate</SelectItem>
                      <SelectItem value="pending">În așteptare</SelectItem>
                      <SelectItem value="failed">Eșuate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Destinatar</TableHead>
                      <TableHead>Conținut</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMessages.filter(m => m.type === 'sms').length > 0 ? (
                      recentMessages.filter(m => m.type === 'sms').map((message) => (
                        <TableRow key={message.id}>
                          <TableCell>
                            {getStatusIcon(message.status)}
                          </TableCell>
                          <TableCell className="font-medium">{message.recipient}</TableCell>
                          <TableCell>{message.subject}</TableCell>
                          <TableCell>{formatDate(message.date)}</TableCell>
                          <TableCell>{getStatusBadge(message.status)}</TableCell>
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
                          Nu există SMS-uri recente.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <SettingCard
            title="Șabloane de mesaje"
            description="Gestionați șabloane pentru email-uri și SMS-uri."
          >
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button>
                    <Mail className="mr-2 h-4 w-4" />
                    Șablon email nou
                  </Button>
                  <Button variant="outline">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Șablon SMS nou
                  </Button>
                </div>
                <Button variant="outline">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Importă șabloane
                </Button>
              </div>

              <div className="pt-4">
                <h3 className="font-medium mb-3">Șabloane email</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/20">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Bun venit client nou</h3>
                        <p className="text-xs text-muted-foreground">Email de bun venit pentru clienții noi</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Mail className="h-4 w-4" />
                        <span className="sr-only">Trimite test</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">Editează</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/20">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Factură emisă</h3>
                        <p className="text-xs text-muted-foreground">Notificare factură nouă emisă</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Mail className="h-4 w-4" />
                        <span className="sr-only">Trimite test</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">Editează</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="font-medium mb-3">Șabloane SMS</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/20">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Confirmare comandă</h3>
                        <p className="text-xs text-muted-foreground">SMS confirmare comandă plasată</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MessageSquare className="h-4 w-4" />
                        <span className="sr-only">Trimite test</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">Editează</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/20">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Livrare programată</h3>
                        <p className="text-xs text-muted-foreground">Notificare livrare comandă programată</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MessageSquare className="h-4 w-4" />
                        <span className="sr-only">Trimite test</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">Editează</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title="Variabile disponibile în șabloane"
            description="Variabile dinamice ce pot fi utilizate în șabloanele de mesaje."
          >
            <div className="space-y-4">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variabilă</TableHead>
                      <TableHead>Descriere</TableHead>
                      <TableHead>Exemplu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-xs">{'{{client.nume}}'}</TableCell>
                      <TableCell>Numele clientului</TableCell>
                      <TableCell>Alexandru Popescu</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">{'{{factura.numar}}'}</TableCell>
                      <TableCell>Numărul facturii</TableCell>
                      <TableCell>F2025001</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">{'{{factura.suma}}'}</TableCell>
                      <TableCell>Suma totală a facturii</TableCell>
                      <TableCell>1299.99 RON</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">{'{{comanda.numar}}'}</TableCell>
                      <TableCell>Numărul comenzii</TableCell>
                      <TableCell>C2025002</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">{'{{data}}'}</TableCell>
                      <TableCell>Data curentă</TableCell>
                      <TableCell>12 aprilie 2025</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="pt-2">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Descarcă documentație completă
                </Button>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingCard
            title="Setări generale comunicare"
            description="Configurați comportamentul general al modulului de comunicare."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email-uri automate pentru facturi</h3>
                  <p className="text-sm text-muted-foreground">Trimite automat email-uri pentru facturile emise</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">SMS-uri automate pentru comenzi</h3>
                  <p className="text-sm text-muted-foreground">Trimite automat SMS-uri pentru confirmarea comenzilor</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email-uri automate pentru plăți</h3>
                  <p className="text-sm text-muted-foreground">Trimite automat email-uri de confirmare plată</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Emailuri de marketing</h3>
                  <p className="text-sm text-muted-foreground">Permite trimiterea de email-uri de marketing</p>
                </div>
                <Switch />
              </div>
              
              <div className="border-t pt-3 mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Limitare zilnică comunicare</h3>
                    <p className="text-sm text-muted-foreground">Număr maxim de mesaje per client pe zi</p>
                  </div>
                  <Select defaultValue="3">
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Selectează" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="unlimited">Nelimitat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Oprire comunicare automată</h3>
                  <p className="text-sm text-muted-foreground">La ora specificată nu se mai trimit mesaje automate</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked />
                  <Select defaultValue="21">
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Ora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18">18:00</SelectItem>
                      <SelectItem value="19">19:00</SelectItem>
                      <SelectItem value="20">20:00</SelectItem>
                      <SelectItem value="21">21:00</SelectItem>
                      <SelectItem value="22">22:00</SelectItem>
                      <SelectItem value="23">23:00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title="Jurnal activități comunicare"
            description="Vizualizați istoricul activităților legate de comunicare."
          >
            <div className="space-y-4">
              <div className="flex justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Perioadă:</span>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Selectează perioada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Ultimele 7 zile</SelectItem>
                      <SelectItem value="30">Ultimele 30 zile</SelectItem>
                      <SelectItem value="90">Ultimele 3 luni</SelectItem>
                      <SelectItem value="365">Ultimul an</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline">
                  <History className="mr-2 h-4 w-4" />
                  Exportă jurnal
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-start p-3 border rounded-md hover:bg-muted/20">
                  <div className="mr-3 mt-0.5">
                    <Mail className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Email trimis</p>
                    <p className="text-xs text-muted-foreground">Factură emisă #F2025001 către client@example.com</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate("2025-04-11")}
                  </div>
                </div>

                <div className="flex items-start p-3 border rounded-md hover:bg-muted/20">
                  <div className="mr-3 mt-0.5">
                    <MessageSquare className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">SMS trimis</p>
                    <p className="text-xs text-muted-foreground">Confirmare comandă #C2025002 către +40712345678</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate("2025-04-10")}
                  </div>
                </div>

                <div className="flex items-start p-3 border rounded-md hover:bg-muted/20">
                  <div className="mr-3 mt-0.5">
                    <Settings className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Configurare actualizată</p>
                    <p className="text-xs text-muted-foreground">Setări SendGrid actualizate</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate("2025-04-09")}
                  </div>
                </div>
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