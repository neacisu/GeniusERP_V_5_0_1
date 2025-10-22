/**
 * Payments Integrations Page
 * 
 * Manages integrations with payment gateways like Stripe, PayPal, etc.
 */

import React from "react";
import { CreditCard, DollarSign, CreditCardIcon, RefreshCw, ArrowDownUp, CheckCircle2, XCircle, AlertCircle, FileText, BarChart, BanknoteIcon, BadgePercent, HelpCircle, Plus, History, Settings as SettingsIcon, BadgeInfo } from "lucide-react";
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

export default function PaymentsPage() {
  const [configureModalOpen, setConfigureModalOpen] = React.useState(false);
  const [selectedIntegration, setSelectedIntegration] = React.useState<{
    provider: IntegrationProvider;
    title: string;
    description: string;
    config?: Record<string, any>;
  } | null>(null);

  // Mock data for payment integrations
  const paymentIntegrations = [
    {
      provider: IntegrationProvider.STRIPE,
      title: "Stripe",
      description: "Procesare plăți carduri, abonamente și facturare recurentă.",
      icon: CreditCard,
      status: IntegrationStatus.INACTIVE
    },
    {
      provider: IntegrationProvider.PAYPAL,
      title: "PayPal",
      description: "Acceptare plăți PayPal și finalizare checkout.",
      icon: DollarSign,
      status: IntegrationStatus.INACTIVE
    },
    {
      provider: IntegrationProvider.REVOLUT,
      title: "Revolut",
      description: "Integrare cu Revolut Business pentru plăți și transferuri.",
      icon: BanknoteIcon,
      status: IntegrationStatus.INACTIVE
    }
  ];

  // Mock data for payment transactions
  const recentTransactions = [
    { id: "txn_1L2Z4K2eZvKYlo2CJOVgYL9Z", amount: "1299.99 RON", customer: "Alexandru Popescu", date: "2025-04-12", status: "succeeded", method: "card", cardLast4: "4242" },
    { id: "txn_1K9Y3J2eZvKYlo2CGHUfGh8X", amount: "2499.50 RON", customer: "Maria Ionescu", date: "2025-04-11", status: "succeeded", method: "paypal", cardLast4: null },
    { id: "txn_1J8X2I2eZvKYlo2CFGTeF7gW", amount: "899.00 RON", customer: "Ioan Dumitrescu", date: "2025-04-10", status: "failed", method: "card", cardLast4: "1234" }
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

  // Format transaction status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">Reușită</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">În așteptare</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200">Eșuată</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">Rambursată</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format payment method badge
  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'card':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">Card</Badge>;
      case 'paypal':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">PayPal</Badge>;
      case 'revolut':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200">Revolut</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Integrări Plăți"
        description="Configurați procesatori de plăți pentru acceptarea diferitelor metode de plată."
        breadcrumbs={[
          { title: "Setări", href: "/settings" },
          { title: "Integrări", href: "/settings/integrations" },
          { title: "Plăți" }
        ]}
      />

      <Tabs defaultValue="providers">
        <TabsList className="mb-6">
          <TabsTrigger value="providers">Procesatori plăți</TabsTrigger>
          <TabsTrigger value="transactions">Tranzacții</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonamente</TabsTrigger>
          <TabsTrigger value="methods">Metode plată</TabsTrigger>
          <TabsTrigger value="settings">Setări</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paymentIntegrations.map((integration, index) => (
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
            <HelpCircle className="h-4 w-4" />
            <AlertTitle>Informație</AlertTitle>
            <AlertDescription>
              Pentru a configura procesatorii de plăți, veți avea nevoie de chei API și credențiale de la furnizori.
              Consultați documentația fiecărui procesator pentru detalii despre obținerea credențialelor de integrare.
            </AlertDescription>
          </Alert>

          <SettingCard
            title="Beneficii integrare procesatori plăți"
            description="Avantajele configurării procesoarelor de plăți în sistem."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <CreditCardIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Acceptare multiplă</h3>
                  <p className="text-sm text-muted-foreground">Acceptați plăți prin carduri, PayPal și alte metode.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <RefreshCw className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Plăți recurente</h3>
                  <p className="text-sm text-muted-foreground">Configurați plăți automate și abonamente recurente.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <ArrowDownUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Reconciliere automată</h3>
                  <p className="text-sm text-muted-foreground">Potrivire automată între plăți și facturi.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <BadgePercent className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Rate și discount-uri</h3>
                  <p className="text-sm text-muted-foreground">Oferiți opțiuni de plată în rate și discount-uri.</p>
                </div>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <SettingCard
            title="Tranzacții recente"
            description="Istoricul tranzacțiilor procesate prin procesatorii de plăți integrați."
          >
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reîmprospătează
                  </Button>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Exportă raport
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtru status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate statusurile</SelectItem>
                      <SelectItem value="succeeded">Reușite</SelectItem>
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
                      <TableHead>ID Tranzacție</TableHead>
                      <TableHead>Sumă</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Metodă plată</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.length > 0 ? (
                      recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.id}</TableCell>
                          <TableCell>{transaction.amount}</TableCell>
                          <TableCell>{transaction.customer}</TableCell>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell>
                            {getMethodBadge(transaction.method)}
                            {transaction.cardLast4 && <span className="text-xs text-muted-foreground ml-2">•••• {transaction.cardLast4}</span>}
                          </TableCell>
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
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nu există tranzacții.
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
                <CardTitle className="text-base">Total încasări</CardTitle>
                <CardDescription>Ultimele 30 zile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.698,49 RON</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Rata de succes</CardTitle>
                <CardDescription>% tranzacții reușite</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">67%</div>
                <Progress value={67} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Comisioane</CardTitle>
                <CardDescription>Total comisioane</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">122,16 RON</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <SettingCard
            title="Abonamente active"
            description="Gestionați abonamente recurente din toate platformele."
          >
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="rounded-full bg-muted p-4">
                <RefreshCw className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Fără abonamente active</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Nu aveți abonamente configurate. Configurați un procesator de plăți care suportă abonamente precum Stripe pentru a activa această funcționalitate.
                </p>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Creează plan de abonament
              </Button>
            </div>
          </SettingCard>

          <SettingCard
            title="Configurare planuri abonament"
            description="Definiți planuri de abonament pentru vânzarea serviciilor recurente."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Plan Lunar Basic</h3>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">99 RON / lună</span> • Plan de bază cu funcționalități standard
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Configurează
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Plan Lunar Premium</h3>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">199 RON / lună</span> • Plan avansat cu funcționalități premium
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Configurează
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Plan Anual Basic</h3>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">999 RON / an</span> • Plan de bază cu facturare anuală
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Configurează
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Plan Anual Premium</h3>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">1999 RON / an</span> • Plan avansat cu facturare anuală
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Configurează
                </Button>
              </div>

              <div className="border-t pt-4 mt-2">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Adaugă plan nou
                </Button>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="methods" className="space-y-6">
          <SettingCard
            title="Metode de plată disponibile"
            description="Configurați metodele de plată disponibile pentru clienți."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="rounded-md bg-blue-50 p-2.5">
                    <CreditCardIcon className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-medium">Card credit/debit</h3>
                    <p className="text-sm text-muted-foreground">Acceptă plăți cu carduri VISA, Mastercard</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="rounded-md bg-blue-50 p-2.5">
                    <DollarSign className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-medium">PayPal</h3>
                    <p className="text-sm text-muted-foreground">Acceptă plăți prin contul PayPal</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="rounded-md bg-blue-50 p-2.5">
                    <BanknoteIcon className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-medium">Revolut</h3>
                    <p className="text-sm text-muted-foreground">Acceptă plăți via Revolut Business</p>
                  </div>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="rounded-md bg-blue-50 p-2.5">
                    <BadgeInfo className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-medium">Plata în rate</h3>
                    <p className="text-sm text-muted-foreground">Permit opțiunea de plată în rate</p>
                  </div>
                </div>
                <Switch />
              </div>

              <div className="border-t pt-4 mt-2">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Adaugă metodă nouă
                </Button>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title="Securitate plăți"
            description="Configurați setările de securitate pentru procesarea plăților."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">3D Secure / SCA</h3>
                  <p className="text-sm text-muted-foreground">Verificare suplimentară pentru plăți</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Prevenire fraudă</h3>
                  <p className="text-sm text-muted-foreground">Scanare tranzacții suspecte</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Verificare adresă (AVS)</h3>
                  <p className="text-sm text-muted-foreground">Verificare adresă de facturare</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Verificare cod CVV</h3>
                  <p className="text-sm text-muted-foreground">Obligă verificarea codului CVV</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingCard
            title="Setări generale procesare plăți"
            description="Configurați comportamentul general al procesării plăților."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Facturare automată</h3>
                  <p className="text-sm text-muted-foreground">Generează automat facturi pentru plăți</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Notificări plăți</h3>
                  <p className="text-sm text-muted-foreground">Trimite notificări pentru plăți</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Reconciliere automată</h3>
                  <p className="text-sm text-muted-foreground">Potrivește automat plățile cu facturile</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Plată parțială</h3>
                  <p className="text-sm text-muted-foreground">Permite plata parțială a facturilor</p>
                </div>
                <Switch />
              </div>
              
              <div className="border-t pt-3 mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Monedă implicită</h3>
                    <p className="text-sm text-muted-foreground">Moneda implicită pentru procesare plăți</p>
                  </div>
                  <Select defaultValue="RON">
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Selectează moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RON">RON</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Procesor implicit</h3>
                  <p className="text-sm text-muted-foreground">Procesor utilizat implicit pentru plăți</p>
                </div>
                <Select defaultValue="stripe">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Selectează procesor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="revolut">Revolut</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title="Jurnal activități plăți"
            description="Vizualizați istoricul activităților legate de plăți."
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
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Tranzacție reușită</p>
                    <p className="text-xs text-muted-foreground">Plată card acceptată: 1299.99 RON</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate("2025-04-12")}
                  </div>
                </div>

                <div className="flex items-start p-3 border rounded-md hover:bg-muted/20">
                  <div className="mr-3 mt-0.5">
                    <XCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Tranzacție eșuată</p>
                    <p className="text-xs text-muted-foreground">Fonduri insuficiente: 899.00 RON</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate("2025-04-10")}
                  </div>
                </div>

                <div className="flex items-start p-3 border rounded-md hover:bg-muted/20">
                  <div className="mr-3 mt-0.5">
                    <SettingsIcon className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Configurare Stripe</p>
                    <p className="text-xs text-muted-foreground">API key actualizat</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate("2025-04-08")}
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