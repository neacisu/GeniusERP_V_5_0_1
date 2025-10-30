import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import StatCard from "@/components/dashboard/StatCard";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import FinancialChart from "@/components/dashboard/FinancialChart";
import ExchangeRateWidget from "@/modules/dashboard/components/widgets/ExchangeRateWidget";
import { WidgetRegistryProvider } from "@/modules/dashboard/services/WidgetRegistry";
import DashboardWidgetsLayout from "@/modules/dashboard/components/DashboardWidgetsLayout";
import TransactionDialog from "@/components/accounting/TransactionDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { 
  BarChart3, 
  Award, 
  Users, 
  FileText, 
  FileBarChart,
  FileCheck,
  UserPlus,
  Phone,
  PackagePlus,
  CreditCard,
  CalendarPlus,
  LightbulbIcon,
  ReceiptIcon,
  PanelsTopLeft,
  CheckSquare
} from "lucide-react";

export default function DashboardPage() {
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<'finances' | 'collaboration' | 'operations'>('collaboration');

  // Sample financial data for the chart
  const financialData = [
    { name: 'Ian', venituri: 45000, cheltuieli: 32000 },
    { name: 'Feb', venituri: 52000, cheltuieli: 38000 },
    { name: 'Mar', venituri: 49000, cheltuieli: 35000 },
    { name: 'Apr', venituri: 56000, cheltuieli: 40000 },
    { name: 'Mai', venituri: 60000, cheltuieli: 45000 },
    { name: 'Iun', venituri: 70000, cheltuieli: 50000 },
    { name: 'Iul', venituri: 65000, cheltuieli: 48000 },
    { name: 'Aug', venituri: 72000, cheltuieli: 53000 },
    { name: 'Sep', venituri: 68000, cheltuieli: 51000 },
    { name: 'Oct', venituri: 75000, cheltuieli: 56000 },
    { name: 'Noi', venituri: 80000, cheltuieli: 62000 },
    { name: 'Dec', venituri: 90000, cheltuieli: 70000 },
  ];

  // Funcție pentru navigare directă
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Toggle dashboard view between finances, collaboration and operations
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'finances' | 'collaboration' | 'operations');
  };

  return (
    <AppLayout>
      {/* Dashboard header with tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Bine ați venit la GeniusERP v.5, {user?.firstName}!</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          {activeTab === 'finances' && (
            <>
              <Button 
                onClick={() => setIsTransactionDialogOpen(true)}
                className="bg-primary hover:bg-primary-dark"
              >
                <span className="material-icons mr-2 text-sm">add</span>
                <span>Tranzacție Nouă</span>
              </Button>
              
              <Button variant="outline">
                <span className="material-icons mr-2 text-sm">download</span>
                <span>Raport</span>
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Dashboard view tabs */}
      <div className="mb-6">
        <Tabs 
          defaultValue="collaboration" 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="finances" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Financiar</span>
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Colaborare</span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex items-center gap-2">
              <PanelsTopLeft className="h-4 w-4" />
              <span>Operațiuni</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Dashboard content based on selected tab */}
      {activeTab === 'finances' ? (
        <>
          {/* Quick stats row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard 
              title="Venituri Totale" 
              value="145,680 RON" 
              change={{ value: "+12.5%", isPositive: true }}
              icon="account_balance"
              iconColor="primary"
            />
            
            <StatCard 
              title="Cheltuieli Totale" 
              value="98,450 RON" 
              change={{ value: "+8.2%", isPositive: false }}
              icon="trending_down"
              iconColor="error"
            />
            
            <StatCard 
              title="Profit Net" 
              value="47,230 RON" 
              change={{ value: "+23.1%", isPositive: true }}
              icon="trending_up"
              iconColor="success"
            />
            
            <StatCard 
              title="Sold Total" 
              value="231,870 RON" 
              change={{ value: "+4.3%", isPositive: true }}
              icon="account_balance_wallet"
              iconColor="info"
            />
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Area - 2 columns */}
            <div className="lg:col-span-2">
              <FinancialChart data={financialData} />
              
              {/* Exchange Rate Widget */}
              <div className="mt-6">
                <ExchangeRateWidget />
              </div>
            </div>
            
            {/* Recent Transactions Area - 1 column */}
            <div className="lg:col-span-1">
              <RecentTransactions />
            </div>
          </div>

          {/* Transaction dialog */}
          <TransactionDialog 
            isOpen={isTransactionDialogOpen} 
            onClose={() => setIsTransactionDialogOpen(false)} 
          />
        </>
      ) : activeTab === 'operations' ? (
        // Operațiuni dashboard
        <div className="space-y-8">
          {/* Header descriptiv */}
          <div>
            <h2 className="text-2xl font-bold">Operațiuni rapide</h2>
            <p className="text-muted-foreground mt-1">
              Accesați rapid cele mai utilizate operațiuni din sistem
            </p>
          </div>
          
          {/* Secțiunea Documente */}
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              <span>Documente</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow"
                onClick={() => handleNavigate('/invoicing/invoices/new')}
              >
                <FileText className="h-10 w-10 text-primary" />
                <span className="text-sm font-medium">Factură nouă</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow"
                onClick={() => handleNavigate('/invoicing/proforma/new')}
              >
                <FileBarChart className="h-10 w-10 text-amber-500" />
                <span className="text-sm font-medium">Proformă nouă</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow"
                onClick={() => handleNavigate('/invoicing/offers/new')}
              >
                <FileCheck className="h-10 w-10 text-green-500" />
                <span className="text-sm font-medium">Ofertă nouă</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow"
                onClick={() => handleNavigate('/accounting/journal-entries/new')}
              >
                <ReceiptIcon className="h-10 w-10 text-purple-500" />
                <span className="text-sm font-medium">Încasare/plată</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow"
                onClick={() => handleNavigate('/hr/employees/new')}
              >
                <UserPlus className="h-10 w-10 text-blue-500" />
                <span className="text-sm font-medium">Angajat nou</span>
              </Button>
            </div>
          </div>
          
          {/* Secțiunea Clienți și Vânzări */}
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              <span>Clienți și Vânzări</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow"
                onClick={() => handleNavigate('/crm/customers/new')}
              >
                <UserPlus className="h-10 w-10 text-indigo-500" />
                <span className="text-sm font-medium">Client nou</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow"
                onClick={() => handleNavigate('/crm/leads/new')}
              >
                <Phone className="h-10 w-10 text-blue-500" />
                <span className="text-sm font-medium">Lead nou</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow"
                onClick={() => handleNavigate('/sales/opportunities/new')}
              >
                <LightbulbIcon className="h-10 w-10 text-yellow-500" />
                <span className="text-sm font-medium">Oportunitate</span>
              </Button>
            </div>
          </div>
          
          {/* Secțiunea Inventar și Logistică */}
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <PackagePlus className="h-5 w-5 mr-2 text-primary" />
              <span>Inventar și Logistică</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow"
                onClick={() => handleNavigate('/inventory/nir/new')}
              >
                <PackagePlus className="h-10 w-10 text-emerald-500" />
                <span className="text-sm font-medium">NIR nou</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow"
                onClick={() => handleNavigate('/inventory/transfers/new')}
              >
                <CreditCard className="h-10 w-10 text-orange-500" />
                <span className="text-sm font-medium">Transfer stoc</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow"
                onClick={() => handleNavigate('/inventory/products/new')}
              >
                <PackagePlus className="h-10 w-10 text-teal-500" />
                <span className="text-sm font-medium">Produs nou</span>
              </Button>
            </div>
          </div>
          
          {/* Secțiunea Administrare */}
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <CheckSquare className="h-5 w-5 mr-2 text-primary" />
              <span>Administrare</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow"
                onClick={() => handleNavigate('/collab/tasks/new')}
              >
                <CheckSquare className="h-10 w-10 text-teal-500" />
                <span className="text-sm font-medium">Task nou</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow"
                onClick={() => handleNavigate('/collab/community/events')}
              >
                <CalendarPlus className="h-10 w-10 text-red-500" />
                <span className="text-sm font-medium">Eveniment</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow"
                onClick={() => handleNavigate('/collab/notes/new')}
              >
                <FileText className="h-10 w-10 text-blue-500" />
                <span className="text-sm font-medium">Notiță nouă</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Collaboration dashboard
        <WidgetRegistryProvider>
          <DashboardWidgetsLayout />
        </WidgetRegistryProvider>
      )}
    </AppLayout>
  );
}
