import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import TransactionDialog from "@/components/accounting/TransactionDialog";
import CollabIntegration from "../../collab/components/CollabIntegration";
import type { AccountingMetrics, RecentTransaction } from "@shared/types/accounting-metrics";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  FileText, 
  CreditCard, 
  ReceiptText, 
  TrendingUp, 
  Building2, 
  PlusCircle,
  PieChart,
  BarChart3,
  BookOpen,
  ArrowRight,
  ShoppingCart,
  Wallet,
  Receipt,
  Building as BankIcon,
  Settings
} from "lucide-react";
import { Link } from "wouter";

export default function AccountingPage() {
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const { user } = useAuth();

  // Fetch financial metrics from real API
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery<AccountingMetrics>({
    queryKey: ['/api/accounting/metrics'],
  });

  // Fetch recent transactions from real API
  const { data: recentTransactions, isLoading: isLoadingTransactions } = useQuery<RecentTransaction[]>({
    queryKey: ['/api/accounting/recent-transactions'],
  });

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Get icon for transaction type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale': return <Receipt className="h-8 w-8 text-success-500" />;
      case 'purchase': return <ShoppingCart className="h-8 w-8 text-blue-500" />;
      case 'expense': return <ArrowDownCircle className="h-8 w-8 text-danger-500" />;
      case 'income': return <ArrowUpCircle className="h-8 w-8 text-success-500" />;
      default: return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  // Define quick access tiles
  const quickAccessTiles = [
    { 
      title: "Plan de Conturi", 
      description: "Vizualizați și gestionați planul de conturi", 
      icon: <BookOpen className="h-10 w-10 text-primary" />,
      link: "/accounting/chart-of-accounts",
      color: "bg-primary/10"
    },
    { 
      title: "Notă Contabilă", 
      description: "Înregistrați operațiuni contabile", 
      icon: <FileText className="h-10 w-10 text-indigo-500" />,
      link: "/accounting/note-contabil",
      color: "bg-indigo-500/10"
    },
    { 
      title: "Jurnal Vânzări", 
      description: "Gestionați facturile de vânzare", 
      icon: <ReceiptText className="h-10 w-10 text-sky-500" />,
      link: "/accounting/sales-journal",
      color: "bg-sky-500/10"
    },
    { 
      title: "Jurnal Cumpărări", 
      description: "Gestionați facturile de achiziții", 
      icon: <ShoppingCart className="h-10 w-10 text-amber-500" />,
      link: "/accounting/purchase-journal",
      color: "bg-amber-500/10"
    },
    { 
      title: "Registru Casă", 
      description: "Operațiuni de casă și numerar", 
      icon: <Wallet className="h-10 w-10 text-green-500" />,
      link: "/accounting/cash-register",
      color: "bg-green-500/10"
    },
    { 
      title: "Extrase Bancare", 
      description: "Procesați operațiunile bancare", 
      icon: <BankIcon className="h-10 w-10 text-blue-500" />,
      link: "/accounting/bank-journal",
      color: "bg-blue-500/10"
    },
    ...(user?.companyId ? [{
      title: "Setări Contabilitate", 
      description: "Configurați modulul de contabilitate", 
      icon: <Settings className="h-10 w-10 text-gray-500" />,
      link: `/accounting/settings/${user.companyId}`,
      color: "bg-gray-500/10"
    }] : []),
  ];

  // Define financial report cards
  const financialReports = [
    { 
      title: "Balanță de verificare", 
      description: "Verificați soldurile conturilor", 
      icon: <BarChart3 className="h-7 w-7 text-purple-500" />,
      link: "/accounting/financial-reports/trial-balance",
    },
    { 
      title: "Bilanț", 
      description: "Activ = Pasiv", 
      icon: <PieChart className="h-7 w-7 text-emerald-500" />,
      link: "/accounting/financial-reports/balance-sheet",
    },
    { 
      title: "Cont de profit și pierdere", 
      description: "Venituri și cheltuieli", 
      icon: <TrendingUp className="h-7 w-7 text-blue-500" />,
      link: "/accounting/financial-reports/income-statement",
    },
    { 
      title: "Registru Jurnal", 
      description: "Toate operațiunile contabile", 
      icon: <BookOpen className="h-7 w-7 text-amber-500" />,
      link: "/accounting/journal-entries",
    },
  ];

  return (
    <AppLayout>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contabilitate</h1>
          <p className="text-sm text-gray-500">Gestionați operațiunile contabile și finanțele companiei</p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            className="flex items-center" 
            onClick={() => setIsTransactionDialogOpen(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            <span>Înregistrează Tranzacție</span>
          </Button>
        </div>
      </div>
      
      {/* Financial overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Situație Financiară</CardTitle>
          <CardDescription>Privire de ansamblu asupra performanței financiare</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Assets */}
            <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Active</p>
                  <h3 className="text-2xl font-bold mt-1 text-gray-900">
                    {isLoadingMetrics ? (
                      <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      formatCurrency(metrics?.totalAssets || 0)
                    )}
                  </h3>
                </div>
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <Building2 className="h-6 w-6 text-indigo-500" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs font-medium text-green-600">
                <ArrowUpCircle className="h-3 w-3 mr-1" />
                <span>2.5% față de luna trecută</span>
              </div>
            </div>
            
            {/* Total Liabilities */}
            <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Datorii</p>
                  <h3 className="text-2xl font-bold mt-1 text-gray-900">
                    {isLoadingMetrics ? (
                      <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      formatCurrency(metrics?.totalLiabilities || 0)
                    )}
                  </h3>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <CreditCard className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs font-medium text-red-500">
                <ArrowDownCircle className="h-3 w-3 mr-1" />
                <span>1.8% față de luna trecută</span>
              </div>
            </div>
            
            {/* Revenue */}
            <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Venituri Totale</p>
                  <h3 className="text-2xl font-bold mt-1 text-gray-900">
                    {isLoadingMetrics ? (
                      <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      formatCurrency(metrics?.totalRevenue || 0)
                    )}
                  </h3>
                </div>
                <div className="bg-green-50 p-2 rounded-lg">
                  <ArrowUpCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs font-medium text-green-600">
                <ArrowUpCircle className="h-3 w-3 mr-1" />
                <span>5.2% față de luna trecută</span>
              </div>
            </div>
            
            {/* Expenses */}
            <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Cheltuieli Totale</p>
                  <h3 className="text-2xl font-bold mt-1 text-gray-900">
                    {isLoadingMetrics ? (
                      <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      formatCurrency(metrics?.totalExpenses || 0)
                    )}
                  </h3>
                </div>
                <div className="bg-red-50 p-2 rounded-lg">
                  <ArrowDownCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs font-medium text-red-500">
                <ArrowUpCircle className="h-3 w-3 mr-1" />
                <span>3.7% față de luna trecută</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Access and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Quick Access Tiles */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Acces Rapid</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickAccessTiles.map((tile, index) => (
              <Link key={index} href={tile.link}>
                <div className={`p-5 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all cursor-pointer ${tile.color}`}>
                  <div className="flex items-center mb-3">
                    {tile.icon}
                  </div>
                  <h3 className="font-medium text-gray-900">{tile.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{tile.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Recent Transactions */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tranzacții Recente</h2>
            <Link href="/accounting/journal-entries" className="text-sm text-primary flex items-center hover:underline">
              <span>Vezi toate</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {isLoadingTransactions ? (
                <div className="divide-y">
                  {Array(5).fill(null).map((_, index) => (
                    <div key={index} className="flex items-center p-4 space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded"></div>
                        <div className="h-3 w-1/2 bg-gray-200 animate-pulse rounded"></div>
                      </div>
                      <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  ))}
                </div>
              ) : recentTransactions && recentTransactions.length > 0 ? (
                <div className="divide-y">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString('ro-RO')}</p>
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${
                        transaction.type === 'income' || transaction.type === 'sale' 
                          ? 'text-green-600' 
                          : 'text-red-500'
                      }`}>
                        {transaction.type === 'income' || transaction.type === 'sale' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <FileText className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nicio tranzacție</h3>
                  <p className="text-sm text-gray-500 text-center mb-4">
                    Nu există tranzacții înregistrate în sistem.
                  </p>
                  <Button 
                    onClick={() => setIsTransactionDialogOpen(true)}
                    className="flex items-center"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Înregistrează prima tranzacție
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="px-4 py-3 border-t bg-gray-50 text-center">
              <Link href="/accounting/journal-entries" className="text-sm text-primary hover:underline w-full">
                Vizualizează registrul jurnal complet
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Financial Reports */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Rapoarte Financiare</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {financialReports.map((report, index) => (
            <Link key={index} href={report.link}>
              <div className="bg-white p-5 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{report.title}</h3>
                  {report.icon}
                </div>
                <p className="text-sm text-gray-500">{report.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Accounting ratios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Indicatori Financiari</CardTitle>
          <CardDescription>Analiză financiară și indicatori de performanță</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Current Ratio */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Lichiditate Curentă</h3>
                <div className={`px-2 py-1 rounded text-xs font-medium 
                  ${metrics?.currentRatio && metrics.currentRatio >= 1.5 
                    ? 'bg-green-100 text-green-800' 
                    : metrics?.currentRatio && metrics.currentRatio >= 1 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                  {metrics?.currentRatio && metrics.currentRatio >= 1.5 
                    ? 'Optim' 
                    : metrics?.currentRatio && metrics.currentRatio >= 1 
                      ? 'Suficient'
                      : 'Risc'
                  }
                </div>
              </div>
              <div className="text-2xl font-bold">
                {isLoadingMetrics ? (
                  <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  metrics?.currentRatio.toFixed(2)
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Raportul dintre active circulante și datorii curente
              </p>
            </div>
            
            {/* Quick Ratio */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Lichiditate Rapidă</h3>
                <div className={`px-2 py-1 rounded text-xs font-medium 
                  ${metrics?.quickRatio && metrics.quickRatio >= 1 
                    ? 'bg-green-100 text-green-800' 
                    : metrics?.quickRatio && metrics.quickRatio >= 0.7 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                  {metrics?.quickRatio && metrics.quickRatio >= 1 
                    ? 'Optim' 
                    : metrics?.quickRatio && metrics.quickRatio >= 0.7 
                      ? 'Suficient'
                      : 'Risc'
                  }
                </div>
              </div>
              <div className="text-2xl font-bold">
                {isLoadingMetrics ? (
                  <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  metrics?.quickRatio.toFixed(2)
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                (Active circulante - Stocuri) / Datorii curente
              </p>
            </div>
            
            {/* Debt to Equity */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Datorii / Capital Propriu</h3>
                <div className={`px-2 py-1 rounded text-xs font-medium 
                  ${metrics?.debtToEquityRatio && metrics.debtToEquityRatio <= 1.5 
                    ? 'bg-green-100 text-green-800' 
                    : metrics?.debtToEquityRatio && metrics.debtToEquityRatio <= 2.5 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                  {metrics?.debtToEquityRatio && metrics.debtToEquityRatio <= 1.5 
                    ? 'Optim' 
                    : metrics?.debtToEquityRatio && metrics.debtToEquityRatio <= 2.5 
                      ? 'Suficient'
                      : 'Risc'
                  }
                </div>
              </div>
              <div className="text-2xl font-bold">
                {isLoadingMetrics ? (
                  <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  metrics?.debtToEquityRatio.toFixed(2)
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Raportul dintre datorii totale și capitalul propriu
              </p>
            </div>
            
            {/* Profit Margin */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Marjă de Profit</h3>
                <div className={`px-2 py-1 rounded text-xs font-medium 
                  ${metrics?.profitMargin && metrics.profitMargin >= 0.1 
                    ? 'bg-green-100 text-green-800' 
                    : metrics?.profitMargin && metrics.profitMargin >= 0.03 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                  {metrics?.profitMargin && metrics.profitMargin >= 0.1 
                    ? 'Optim' 
                    : metrics?.profitMargin && metrics.profitMargin >= 0.03 
                      ? 'Suficient'
                      : 'Risc'
                  }
                </div>
              </div>
              <div className="text-2xl font-bold">
                {isLoadingMetrics ? (
                  <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  `${((metrics?.profitMargin ?? 0) * 100).toFixed(1)}%`
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Profit net / Venituri totale
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction dialog */}
      <TransactionDialog 
        isOpen={isTransactionDialogOpen} 
        onClose={() => setIsTransactionDialogOpen(false)} 
      />
      
      {/* Integrare cu modulul de colaborare */}
      <CollabIntegration 
        moduleContext="Accounting" 
        enableTasks={true} 
        enableCommunity={true} 
      />
    </AppLayout>
  );
}
