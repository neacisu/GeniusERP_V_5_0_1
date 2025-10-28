import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Filter,
  LucideIcon,
  BarChart3,
  Clock,
  PieChart,
  Download as DownloadIcon,
  Printer,
  Eye,
  RefreshCw,
  FileText,
  TrendingUp,
  LineChart,
  ArrowUpCircle,
  ArrowDownCircle,
  Building2
} from "lucide-react";
import { Link } from "wouter";

// Type definitions
type ReportType = 'trial-balance' | 'balance-sheet' | 'income-statement' | 'cash-flow' | 'vat-statement';

type ReportPeriod = 'current-month' | 'previous-month' | 'current-quarter' | 'previous-quarter' | 'current-year' | 'previous-year' | 'custom';

type Report = {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  period: ReportPeriod;
  dateFrom?: string;
  dateTo?: string;
  generatedAt: string;
  generatedBy: string;
  status: 'generated' | 'generating' | 'failed';
  fileUrl?: string;
};

type FinancialIndicator = {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  changePercent?: number;
  status: 'positive' | 'neutral' | 'negative';
  description: string;
};

interface ReportTypeInfo {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('trial-balance');
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('current-month');
  const [dateRange, setDateRange] = useState({ 
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const { toast } = useToast();

  // Fetch reports by type and period
  const { data: reports, isLoading: isLoadingReports, refetch: refetchReports } = useQuery<Report[]>({
    queryKey: ['/api/accounting/financial-reports/financial-reports', activeTab, selectedPeriod, dateRange],
    // This is just for structure - we'll use actual API data in production
    placeholderData: [
      { 
        id: '1', 
        name: 'Balanță de verificare - Aprilie 2025', 
        description: 'Balanță de verificare pentru perioada curentă',
        type: 'trial-balance',
        period: 'current-month',
        dateFrom: '2025-04-01',
        dateTo: '2025-04-30',
        generatedAt: '2025-04-10T08:45:00Z',
        generatedBy: 'Alexandru Popescu',
        status: 'generated',
        fileUrl: '/reports/trial-balance-apr-2025.pdf'
      },
      { 
        id: '2', 
        name: 'Balanță de verificare - Martie 2025', 
        description: 'Balanță de verificare pentru luna precedentă',
        type: 'trial-balance',
        period: 'previous-month',
        dateFrom: '2025-03-01',
        dateTo: '2025-03-31',
        generatedAt: '2025-04-02T10:15:00Z',
        generatedBy: 'Alexandru Popescu',
        status: 'generated',
        fileUrl: '/reports/trial-balance-mar-2025.pdf'
      },
      { 
        id: '3', 
        name: 'Bilanț - Q1 2025', 
        description: 'Bilanț pentru trimestrul curent',
        type: 'balance-sheet',
        period: 'current-quarter',
        dateFrom: '2025-01-01',
        dateTo: '2025-03-31',
        generatedAt: '2025-04-05T14:30:00Z',
        generatedBy: 'Maria Ionescu',
        status: 'generated',
        fileUrl: '/reports/balance-sheet-q1-2025.pdf'
      },
      { 
        id: '4', 
        name: 'Cont de profit și pierdere - Aprilie 2025', 
        description: 'CPP pentru perioada curentă',
        type: 'income-statement',
        period: 'current-month',
        dateFrom: '2025-04-01',
        dateTo: '2025-04-30',
        generatedAt: '2025-04-10T09:20:00Z',
        generatedBy: 'Alexandru Popescu',
        status: 'generated',
        fileUrl: '/reports/income-statement-apr-2025.pdf'
      },
      { 
        id: '5', 
        name: 'Cont de profit și pierdere - Q1 2025', 
        description: 'CPP pentru trimestrul curent',
        type: 'income-statement',
        period: 'current-quarter',
        dateFrom: '2025-01-01',
        dateTo: '2025-03-31',
        generatedAt: '2025-04-05T14:45:00Z',
        generatedBy: 'Maria Ionescu',
        status: 'generated',
        fileUrl: '/reports/income-statement-q1-2025.pdf'
      },
      { 
        id: '6', 
        name: 'Flux de numerar - Aprilie 2025', 
        description: 'Flux de numerar pentru perioada curentă',
        type: 'cash-flow',
        period: 'current-month',
        dateFrom: '2025-04-01',
        dateTo: '2025-04-30',
        generatedAt: '2025-04-10T09:40:00Z',
        generatedBy: 'Alexandru Popescu',
        status: 'generated',
        fileUrl: '/reports/cash-flow-apr-2025.pdf'
      },
      { 
        id: '7', 
        name: 'Decont TVA - Martie 2025', 
        description: 'Decont TVA pentru luna precedentă',
        type: 'vat-statement',
        period: 'previous-month',
        dateFrom: '2025-03-01',
        dateTo: '2025-03-31',
        generatedAt: '2025-04-02T11:30:00Z',
        generatedBy: 'Maria Ionescu',
        status: 'generated',
        fileUrl: '/reports/vat-statement-mar-2025.pdf'
      },
    ]
  });

  // Fetch financial indicators (returns object, not array)
  const { data: indicatorsData, isLoading: isLoadingIndicators } = useQuery<any>({
    queryKey: ['/api/accounting/financial-reports/financial-indicators'],
    // This is just for structure - we'll use actual API data in production
    placeholderData: [
      { 
        id: '1', 
        name: 'Lichiditate Curentă', 
        value: 1.8,
        previousValue: 1.65,
        changePercent: 9.09,
        status: 'positive',
        description: 'Active Circulante / Datorii Curente'
      },
      { 
        id: '2', 
        name: 'Lichiditate Rapidă', 
        value: 1.2,
        previousValue: 1.15,
        changePercent: 4.35,
        status: 'positive',
        description: '(Active Circulante - Stocuri) / Datorii Curente'
      },
      { 
        id: '3', 
        name: 'Grad de Îndatorare', 
        value: 0.45,
        previousValue: 0.5,
        changePercent: -10,
        status: 'positive',
        description: 'Datorii Totale / Active Totale'
      },
      { 
        id: '4', 
        name: 'Rentabilitatea Capitalului', 
        value: 0.12,
        previousValue: 0.11,
        changePercent: 9.09,
        status: 'positive',
        description: 'Profit Net / Capital Propriu'
      },
      { 
        id: '5', 
        name: 'Marja Profitului Net', 
        value: 0.08,
        previousValue: 0.07,
        changePercent: 14.29,
        status: 'positive',
        description: 'Profit Net / Venituri Totale'
      },
      { 
        id: '6', 
        name: 'Rotația Activelor', 
        value: 1.2,
        previousValue: 1.1,
        changePercent: 9.09,
        status: 'positive',
        description: 'Venituri Totale / Active Totale'
      },
    ]
  });

  // Transform indicators object to array
  const indicators = indicatorsData ? [
    { id: '1', name: 'Total Venituri', value: indicatorsData.totalRevenue || 0, previousValue: 0, changePercent: 0, status: 'positive', description: 'Venituri totale din vânzări' },
    { id: '2', name: 'Total Cheltuieli', value: indicatorsData.totalExpenses || 0, previousValue: 0, changePercent: 0, status: 'negative', description: 'Cheltuieli totale achiziții' },
    { id: '3', name: 'Profit', value: indicatorsData.profit || 0, previousValue: 0, changePercent: 0, status: indicatorsData.profit > 0 ? 'positive' : 'negative', description: 'Profit = Venituri - Cheltuieli' },
    { id: '4', name: 'Sold Casă', value: indicatorsData.cashBalance || 0, previousValue: 0, changePercent: 0, status: 'neutral', description: 'Sold curent casa în lei' },
    { id: '5', name: 'Sold Bancă', value: indicatorsData.bankBalance || 0, previousValue: 0, changePercent: 0, status: 'neutral', description: 'Sold curent conturi bancare' }
  ] : [];

  // Report type information
  const reportTypes: Record<ReportType, ReportTypeInfo> = {
    'trial-balance': {
      title: 'Balanță de Verificare',
      description: 'Afișează soldurile tuturor conturilor contabile într-o perioadă specifică',
      icon: BarChart3
    },
    'balance-sheet': {
      title: 'Bilanț',
      description: 'Prezintă activele, datoriile și capitalul propriu al companiei',
      icon: PieChart
    },
    'income-statement': {
      title: 'Cont de Profit și Pierdere',
      description: 'Prezintă veniturile, cheltuielile și profitul sau pierderea într-o perioadă specifică',
      icon: TrendingUp
    },
    'cash-flow': {
      title: 'Flux de Numerar',
      description: 'Prezintă intrările și ieșirile de numerar din activități operaționale, de investiții și de finanțare',
      icon: LineChart
    },
    'vat-statement': {
      title: 'Decont TVA',
      description: 'Prezintă TVA colectată, TVA deductibilă și sumele de plată sau de recuperat',
      icon: FileText
    }
  };

  // Filter reports based on active tab and period
  const filteredReports = reports?.filter(report => 
    report.type === activeTab && 
    (selectedPeriod === 'custom' ? true : report.period === selectedPeriod)
  ) || [];

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO');
  };

  // Format timestamp
  const formatTimestamp = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('ro-RO');
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Generate a new report
  const generateReport = () => {
    setIsGenerating(true);
    
    // Simulate report generation (in a real app, this would be an API call)
    setTimeout(() => {
      setIsGenerating(false);
      
      toast({
        title: `${reportTypes[activeTab].title} generat cu succes`,
        description: `Raportul a fost generat și este disponibil pentru vizualizare.`,
      });
      
      refetchReports();
    }, 2000);
  };

  // Handle viewing a report
  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setIsViewDialogOpen(true);
  };

  // Get change indicator component based on status
  const getChangeIndicator = (status: string, changePercent?: number) => {
    if (!changePercent) return null;
    
    switch (status) {
      case 'positive':
        return (
          <div className="flex items-center text-green-600">
            <ArrowUpCircle className="h-3.5 w-3.5 mr-1" />
            <span>{formatPercent(changePercent)}</span>
          </div>
        );
      case 'negative':
        return (
          <div className="flex items-center text-red-600">
            <ArrowDownCircle className="h-3.5 w-3.5 mr-1" />
            <span>{formatPercent(changePercent)}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-600">
            <span>{formatPercent(changePercent)}</span>
          </div>
        );
    }
  };

  return (
    <AppLayout>
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/accounting">Contabilitate</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Rapoarte Financiare</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapoarte Financiare</h1>
          <p className="text-sm text-gray-500">Generați și vizualizați rapoarte financiare pentru activitatea companiei</p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button variant="outline" onClick={() => refetchReports()} className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            <span>Actualizează</span>
          </Button>
          
          <Button 
            onClick={generateReport} 
            disabled={isGenerating}
            className="flex items-center"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                <span>Generare...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                <span>Generează Raport</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Financial indicators */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Indicatori Financiari</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoadingIndicators ? (
            Array(6).fill(null).map((_, index) => (
              <Card key={index} className="h-28">
                <CardContent className="p-4 flex flex-col justify-center h-full">
                  <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="h-7 w-24 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            indicators?.map((indicator) => (
              <Card key={indicator.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{indicator.name}</p>
                      <p className="text-xl font-bold mt-1">{indicator.value.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-1">{indicator.description}</p>
                    </div>
                    {getChangeIndicator(indicator.status, indicator.changePercent)}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      {/* Reports section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Rapoarte Disponibile</CardTitle>
          <CardDescription>
            Selectați tipul de raport și perioada dorită
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Report type tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportType)}>
            <TabsList className="w-full grid grid-cols-2 md:grid-cols-5 mb-2">
              <TabsTrigger value="trial-balance" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden md:inline">Balanță</span>
                <span className="md:hidden">Balanță</span>
              </TabsTrigger>
              <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                <span className="hidden md:inline">Bilanț</span>
                <span className="md:hidden">Bilanț</span>
              </TabsTrigger>
              <TabsTrigger value="income-statement" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden md:inline">Profit/Pierdere</span>
                <span className="md:hidden">CPP</span>
              </TabsTrigger>
              <TabsTrigger value="cash-flow" className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                <span className="hidden md:inline">Flux Numerar</span>
                <span className="md:hidden">Cash Flow</span>
              </TabsTrigger>
              <TabsTrigger value="vat-statement" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden md:inline">Decont TVA</span>
                <span className="md:hidden">TVA</span>
              </TabsTrigger>
            </TabsList>
            
            {Object.entries(reportTypes).map(([type, info]) => (
              <TabsContent key={type} value={type} className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <info.icon className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900">{info.title}</h3>
                      <p className="text-sm text-blue-700">{info.description}</p>
                    </div>
                  </div>
                </div>
                
                {/* Period selector and date range */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-full sm:w-64">
                    <Label htmlFor="period-select" className="sr-only">Perioada</Label>
                    <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as ReportPeriod)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectați perioada" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current-month">Luna curentă</SelectItem>
                        <SelectItem value="previous-month">Luna precedentă</SelectItem>
                        <SelectItem value="current-quarter">Trimestrul curent</SelectItem>
                        <SelectItem value="previous-quarter">Trimestrul precedent</SelectItem>
                        <SelectItem value="current-year">Anul curent</SelectItem>
                        <SelectItem value="previous-year">Anul precedent</SelectItem>
                        <SelectItem value="custom">Perioadă personalizată</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedPeriod === 'custom' && (
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <Label htmlFor="dateFrom" className="text-sm whitespace-nowrap">De la:</Label>
                        <Input 
                          id="dateFrom" 
                          type="date" 
                          value={dateRange.from}
                          onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                          className="w-auto"
                        />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <Label htmlFor="dateTo" className="text-sm whitespace-nowrap">Până la:</Label>
                        <Input 
                          id="dateTo" 
                          type="date" 
                          value={dateRange.to}
                          onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                          className="w-auto"
                        />
                      </div>
                      
                      <Button variant="outline" size="sm" className="ml-2">
                        <Filter className="h-4 w-4 mr-2" />
                        <span>Aplică</span>
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Reports list */}
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Nume Raport</TableHead>
                        <TableHead>Perioadă</TableHead>
                        <TableHead>Generat la</TableHead>
                        <TableHead>Generat de</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingReports ? (
                        Array(3).fill(null).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell colSpan={5} className="h-16">
                              <div className="h-8 w-full bg-gray-100 animate-pulse rounded"></div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : filteredReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p>Nu există rapoarte generate pentru această perioadă.</p>
                            <Button 
                              variant="link" 
                              onClick={generateReport} 
                              className="mt-2"
                              disabled={isGenerating}
                            >
                              {isGenerating ? 'Generare...' : 'Generează primul raport'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredReports.map((report) => (
                          <TableRow 
                            key={report.id} 
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleViewReport(report)}
                          >
                            <TableCell className="font-medium">{report.name}</TableCell>
                            <TableCell>
                              {report.dateFrom && report.dateTo ? (
                                <span>{formatDate(report.dateFrom)} - {formatDate(report.dateTo)}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>{formatTimestamp(report.generatedAt)}</TableCell>
                            <TableCell>{report.generatedBy}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewReport(report);
                                  }}
                                >
                                  <Eye className="h-4 w-4 text-gray-500" />
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Download logic would go here
                                    toast({
                                      title: "Descărcare începută",
                                      description: `Se descarcă raportul ${report.name}`,
                                    });
                                  }}
                                >
                                  <DownloadIcon className="h-4 w-4 text-blue-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* View Report Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Vizualizare Raport</DialogTitle>
            <DialogDescription>
              {selectedReport?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="py-4">
              {/* Report header */}
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    {(() => {
                      const IconComponent = reportTypes[selectedReport.type].icon;
                      return <IconComponent className="h-5 w-5 text-blue-700" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">{selectedReport.name}</h3>
                    <p className="text-sm text-blue-700">{selectedReport.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Perioada raportului</p>
                    {selectedReport.dateFrom && selectedReport.dateTo ? (
                      <p className="font-medium">{formatDate(selectedReport.dateFrom)} - {formatDate(selectedReport.dateTo)}</p>
                    ) : (
                      <p className="text-gray-400">Nu este specificată</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Generat de</p>
                    <p className="font-medium">{selectedReport.generatedBy}</p>
                    <p className="text-xs text-gray-400">{formatTimestamp(selectedReport.generatedAt)}</p>
                  </div>
                </div>
              </div>
              
              {/* Report preview - this would be an iframe or embedded PDF in production */}
              <div className="border border-gray-200 rounded-md overflow-hidden p-8 bg-gray-50 text-center">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Previzualizare Raport</h3>
                <p className="text-gray-500 mb-4">Raportul ar fi afișat aici într-o aplicație completă. În mod obișnuit, aceasta ar fi o previzualizare a documentului PDF sau a raportului financiar.</p>
                
                <div className="flex justify-center gap-3 mt-4">
                  <Button variant="outline" className="flex items-center">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    <span>Descarcă PDF</span>
                  </Button>
                  
                  <Button variant="outline" className="flex items-center">
                    <Printer className="h-4 w-4 mr-2" />
                    <span>Printează</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}