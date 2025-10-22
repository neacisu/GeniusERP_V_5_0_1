/**
 * Invoicing Dashboard Page
 * 
 * Provides a comprehensive overview of invoicing activity and metrics.
 */

import React, { useState } from "react";
import { Link } from "wouter";
import { useInvoices, useInvoiceStatistics } from "../../hooks/useInvoiceApi";
import { InvoiceStatus } from "../../types";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Lucide icons
import {
  ReceiptText,
  FileText,
  ClipboardCheck,
  BanknoteIcon,
  Clock,
  AlertCircle,
  PieChart,
  BarChart3,
  Search,
  Printer,
  FileDown,
  ArrowUpDown,
  Filter,
  Plus,
  Loader2,
  Calendar,
  CircleDollarSign,
  ArrowDownUp,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2, 
  ArrowRightLeft,
  RefreshCw,
  BarChart4
} from "lucide-react";

// Custom components
import PageHeader from "../../components/common/PageHeader";
import { StatusBadge } from "../../components/common/StatusBadge";
import StatsCard from "../../components/common/StatsCard";
import TabsNav, { TabItem } from "../../components/common/TabsNav";

const InvoicingDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("current-month");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { invoices, isLoading: isLoadingInvoices } = useInvoices({
    limit: 5,
    sortBy: "issueDate",
    sortDir: "desc"
  });
  
  const { stats, isLoading: isLoadingStats } = useInvoiceStatistics();
  
  // Tab items definition
  const tabItems: TabItem[] = [
    { id: "overview", label: "Sumar", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "invoices", label: "Facturi", icon: <FileText className="h-4 w-4" /> },
    { id: "payments", label: "Încasări", icon: <BanknoteIcon className="h-4 w-4" /> },
    { id: "analytics", label: "Analiză", icon: <PieChart className="h-4 w-4" /> }
  ];
  
  // Date range options
  const dateRangeOptions = [
    { label: "Luna curentă", value: "current-month" },
    { label: "Trimestrul curent", value: "current-quarter" },
    { label: "Anul curent", value: "current-year" },
    { label: "Ultimele 30 zile", value: "last-30-days" },
    { label: "Ultimele 90 zile", value: "last-90-days" },
    { label: "Ultimul an", value: "last-365-days" }
  ];
  
  // Handle creation of new invoice
  const handleCreateInvoice = () => {
    // Navigate to invoice creation page
    window.location.href = "/invoicing/invoices/new";
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Facturare" 
        description="Gestionare facturi și încasări"
        onAddNew={handleCreateInvoice}
        addNewLabel="Factură nouă"
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" className="flex items-center">
              <Printer className="mr-2 h-4 w-4" />
              Tiparire
            </Button>
            <Button variant="outline" className="flex items-center">
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        }
      />
      
      {/* Date range filter */}
      <div className="flex justify-end">
        <Select 
          value={dateRange} 
          onValueChange={setDateRange}
        >
          <SelectTrigger className="w-[240px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dateRangeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Facturi" 
          value={stats.totalInvoices}
          icon={<ReceiptText className="text-blue-500" />}
          trend={{
            value: 12,
            label: "vs. luna anterioară",
            isPositive: true
          }}
        />
        <StatsCard 
          title="Facturi emise" 
          value={stats.totalValidated}
          icon={<ClipboardCheck className="text-green-500" />}
          trend={{
            value: 5,
            label: "vs. luna anterioară",
            isPositive: true
          }}
        />
        <StatsCard 
          title="Facturi Neîncasate" 
          value={stats.totalPending}
          icon={<Clock className="text-yellow-500" />}
          trend={{
            value: 2,
            label: "vs. luna anterioară",
            isPositive: false
          }}
        />
        <StatsCard 
          title="Facturi Restante" 
          value={stats.totalOverdue}
          icon={<AlertCircle className="text-red-500" />}
          trend={{
            value: 15,
            label: "vs. luna anterioară",
            isPositive: false
          }}
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Încasat" 
          value={stats.totalAmount - stats.pendingAmount}
          valuePrefix="RON "
          icon={<BanknoteIcon className="text-green-500" />}
          trend={{
            value: 8,
            label: "vs. luna anterioară",
            isPositive: true
          }}
        />
        <StatsCard 
          title="De Încasat" 
          value={stats.pendingAmount}
          valuePrefix="RON "
          icon={<CircleDollarSign className="text-blue-500" />}
          trend={{
            value: 3,
            label: "vs. luna anterioară",
            isPositive: false
          }}
        />
        <StatsCard 
          title="Restanțe" 
          value={stats.overdueAmount}
          valuePrefix="RON "
          icon={<TrendingDown className="text-red-500" />}
          trend={{
            value: 18,
            label: "vs. luna anterioară",
            isPositive: false
          }}
        />
        <StatsCard 
          title="TVA colectat" 
          value={stats.totalVat}
          valuePrefix="RON "
          icon={<BarChart4 className="text-purple-500" />}
          trend={{
            value: 7,
            label: "vs. luna anterioară",
            isPositive: true
          }}
        />
      </div>
      
      {/* Tabs navigation */}
      <Card>
        <CardHeader className="pb-3">
          <TabsNav 
            tabs={tabItems} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
        </CardHeader>
        
        <CardContent>
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Facturi Recente</h3>
                <Button variant="link" asChild>
                  <Link href="/invoicing/invoices">
                    Vezi toate
                  </Link>
                </Button>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nr. Factură</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Scadență</TableHead>
                      <TableHead className="text-right">Valoare</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingInvoices ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          Nu există facturi recente.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice: any) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            <Link href={`/invoicing/invoices/${invoice.id}`} className="text-blue-600 hover:underline">
                              {invoice.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell>{invoice.customerName || "Client necunoscut"}</TableCell>
                          <TableCell>{new Date(invoice.issueDate).toLocaleDateString("ro-RO")}</TableCell>
                          <TableCell>{new Date(invoice.dueDate).toLocaleDateString("ro-RO")}</TableCell>
                          <TableCell className="text-right">
                            {invoice.grossTotal.toLocaleString("ro-RO")} {invoice.currency}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={invoice.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Balance summary */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Balanță clienți</CardTitle>
                    <CardDescription>Top 5 clienți după sold</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Client SRL</span>
                        <span className="font-medium">12,500 RON</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Companie Distribut</span>
                        <span className="font-medium">8,750 RON</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Firma Transport</span>
                        <span className="font-medium">5,320 RON</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Business Group</span>
                        <span className="font-medium">3,800 RON</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Retail Shop</span>
                        <span className="font-medium">2,150 RON</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Facturi în așteptare</CardTitle>
                    <CardDescription>Facturi care urmează să fie plătite</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Astăzi</span>
                        <span className="font-medium text-red-500">3,200 RON</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>1-7 zile</span>
                        <span className="font-medium text-orange-500">7,500 RON</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>8-14 zile</span>
                        <span className="font-medium">12,300 RON</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>15-30 zile</span>
                        <span className="font-medium">8,750 RON</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Peste 30 zile</span>
                        <span className="font-medium">5,400 RON</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Vânzări pe categorii</CardTitle>
                    <CardDescription>Distribuția vânzărilor pe categorii</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Produse</span>
                        <span className="font-medium">45%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Servicii</span>
                        <span className="font-medium">32%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Abonamente</span>
                        <span className="font-medium">15%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Livrări</span>
                        <span className="font-medium">5%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Altele</span>
                        <span className="font-medium">3%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {activeTab === "invoices" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Caută facturi..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <Button variant="outline" className="flex items-center whitespace-nowrap">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtrare
                  </Button>
                  <Button variant="outline" className="flex items-center whitespace-nowrap">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sortare
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Card className="overflow-hidden">
                  <CardHeader className="bg-blue-50 p-4">
                    <CardTitle className="text-center text-blue-700">Facturi în așteptare</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold mb-2">{stats.totalPending}</div>
                    <p className="text-lg text-muted-foreground mb-4">facturi</p>
                    <p className="text-xl font-semibold mb-2">{stats.pendingAmount.toLocaleString()} RON</p>
                    <p className="text-sm text-muted-foreground">valoare totală</p>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden">
                  <CardHeader className="bg-red-50 p-4">
                    <CardTitle className="text-center text-red-700">Facturi restante</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold mb-2">{stats.totalOverdue}</div>
                    <p className="text-lg text-muted-foreground mb-4">facturi</p>
                    <p className="text-xl font-semibold mb-2">{stats.overdueAmount.toLocaleString()} RON</p>
                    <p className="text-sm text-muted-foreground">valoare totală</p>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden">
                  <CardHeader className="bg-green-50 p-4">
                    <CardTitle className="text-center text-green-700">Facturi plătite</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold mb-2">{stats.totalPaid}</div>
                    <p className="text-lg text-muted-foreground mb-4">facturi</p>
                    <p className="text-xl font-semibold mb-2">{(stats.totalAmount - stats.pendingAmount - stats.overdueAmount).toLocaleString()} RON</p>
                    <p className="text-sm text-muted-foreground">valoare totală</p>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gray-50 p-4">
                    <CardTitle className="text-center text-gray-700">Medie pe factură</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold mb-2">
                      {stats.totalInvoices > 0 
                        ? (stats.totalAmount / stats.totalInvoices).toLocaleString(undefined, { maximumFractionDigits: 2 }) 
                        : 0}
                    </div>
                    <p className="text-lg text-muted-foreground mb-4">RON</p>
                    <p className="text-xl font-semibold mb-2">{stats.avgPaymentDelay}</p>
                    <p className="text-sm text-muted-foreground">zile până la plată</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-center">
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/invoicing/invoices">
                    <span>Vezi toate facturile</span>
                    <ArrowRightLeft className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
          
          {activeTab === "payments" && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <RefreshCw className="h-12 w-12 text-muted-foreground animate-spin" />
              <h3 className="text-lg font-medium">Încărcare date încasări...</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Datele despre încasări sunt în curs de încărcare. Vă rugăm să așteptați un moment.
              </p>
            </div>
          )}
          
          {activeTab === "analytics" && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <BarChart3 className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Analiză facturare</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Datele analitice sunt disponibile doar în versiunea completă a modulului de facturare.
              </p>
              <Button>Activează analiza avansată</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicingDashboardPage;