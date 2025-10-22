/**
 * Analytics Dashboard
 * 
 * Pagina principală a modulului Analytics, prezentând o perspectivă
 * de ansamblu asupra performanței afacerii
 */

import React from 'react';
import { 
  BarChart4, 
  Bell,
  LineChart, 
  LayoutDashboard,
  PieChart, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Wallet, 
  Clock, 
  FileText,
  Plus, 
  ChevronRight
} from 'lucide-react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalyticsMetrics } from '../../hooks/useAnalyticsMetrics';
import { useAnalyticsReports } from '../../hooks/useAnalyticsReports';
import { AnalyticsOverviewCard } from '../../components/common/AnalyticsOverviewCard';
import { AnalyticsLayout } from '../../components/common/AnalyticsLayout';
import { Link } from 'wouter';

// Componenta pentru grafic liniar simplu
const SimpleLineChart = ({ className }: { className?: string }) => (
  <div className={`h-[80px] w-full ${className}`}>
    <svg className="h-full w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
      <path
        d="M0,35 L5,30 L10,32 L15,25 L20,28 L25,20 L30,22 L35,15 L40,19 L45,10 L50,12 L55,8 L60,5 L65,9 L70,5 L75,3 L80,8 L85,10 L90,7 L95,5 L100,0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-primary"
      />
      <path
        d="M0,35 L5,30 L10,32 L15,25 L20,28 L25,20 L30,22 L35,15 L40,19 L45,10 L50,12 L55,8 L60,5 L65,9 L70,5 L75,3 L80,8 L85,10 L90,7 L95,5 L100,0 L100,40 L0,40 Z"
        fill="currentColor"
        className="text-primary/10"
      />
    </svg>
  </div>
);

export default function AnalyticsDashboardPage() {
  const { summary, isLoadingSummary, kpis, isLoadingKpis } = useAnalyticsMetrics({ 
    period: 'month' 
  });

  /*
  const { alerts, isLoading: isLoadingAlerts } = useAnalyticsAlerts({
    limit: 5
  });
  */
  
  const { reports, recentReports, isLoadingReports, isLoadingRecentReports } = useAnalyticsReports({
    limit: 5
  });
  
  // Funcție pentru formatarea valorii monetare
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Determinăm valoarea tabului activ
  const [activeTab, setActiveTab] = React.useState<string>('overview');
  
  // Pentru navigarea între submodule
  const [location, navigate] = useLocation();
  
  return (
    <AnalyticsLayout activeTab="dashboard">
      
      {/* Secțiune metrici generale */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsOverviewCard
          title="Vânzări"
          value={formatCurrency(kpis?.sales?.value || 0)}
          description="Total vânzări în această lună"
          icon={<DollarSign className="h-4 w-4" />}
          change={kpis?.sales?.change || 0}
          trend={kpis?.sales?.trend || 'neutral'}
          variant="default"
          data={Array(7).fill(null).map((_, i) => ({ value: 100 + Math.random() * 50 }))}
        />
        
        <AnalyticsOverviewCard
          title="Profit"
          value={formatCurrency(kpis?.profit?.value || 0)}
          description="Profit în această lună"
          icon={<Wallet className="h-4 w-4" />}
          change={kpis?.profit?.change || 0}
          trend={kpis?.profit?.trend || 'neutral'}
          variant="success"
          data={Array(7).fill(null).map((_, i) => ({ value: 100 + Math.random() * 50 }))}
        />
        
        <AnalyticsOverviewCard
          title="Clienți"
          value={kpis?.customers?.value || 0}
          description="Clienți activi"
          icon={<Users className="h-4 w-4" />}
          change={kpis?.customers?.change || 0}
          trend={kpis?.customers?.trend || 'neutral'}
          variant="info"
          data={Array(7).fill(null).map((_, i) => ({ value: 100 + Math.random() * 50 }))}
        />
        
        <AnalyticsOverviewCard
          title="Comenzi"
          value={kpis?.orders?.value || 0}
          description="Comenzi în această lună"
          icon={<ShoppingCart className="h-4 w-4" />}
          change={kpis?.orders?.change || 0}
          trend={kpis?.orders?.trend || 'neutral'}
          variant={kpis?.orders?.trend === 'down' ? 'danger' : 'warning'}
          data={Array(7).fill(null).map((_, i) => ({ value: 100 + Math.random() * 50 }))}
        />
      </div>
      
      {/* Tab-uri pentru vizualizări diferite */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Prezentare generală</TabsTrigger>
          <TabsTrigger value="sales">Vânzări</TabsTrigger>
          <TabsTrigger value="customers">Clienți</TabsTrigger>
          <TabsTrigger value="orders">Comenzi</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Grafic principal */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tendințe vânzări și profit</CardTitle>
              <CardDescription>
                Evoluția vânzărilor și profitului în ultimele 12 luni
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="h-[200px] md:h-[300px] w-full">
                {/* Placeholder pentru grafic */}
                <div className="h-full w-full flex items-center justify-center border rounded-md bg-muted/20">
                  <div className="text-center p-4">
                    <LineChart className="h-12 w-12 mx-auto text-muted-foreground/60" />
                    <div className="mt-2 text-sm font-medium">Grafic tendințe vânzări și profit</div>
                    <div className="text-xs text-muted-foreground">Datele sunt actualizate la 11 Aprilie 2025</div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/analytics/reports">
                  <span>Vezi rapoarte detaliate</span>
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Grid cu carduri secundare */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Card obiective */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Obiective lunare</CardTitle>
                <CardDescription>
                  Progresul obiectivelor pentru luna curentă
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">Vânzări</div>
                    <div className="text-sm text-muted-foreground">75%</div>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">Clienți noi</div>
                    <div className="text-sm text-muted-foreground">62%</div>
                  </div>
                  <Progress value={62} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">Profit</div>
                    <div className="text-sm text-muted-foreground">89%</div>
                  </div>
                  <Progress value={89} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">Produse noi</div>
                    <div className="text-sm text-muted-foreground">35%</div>
                  </div>
                  <Progress value={35} className="h-2" />
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/analytics/metrics">
                    <span>Vezi toate obiectivele</span>
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Card rapoarte recente */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Rapoarte recente</CardTitle>
                <CardDescription>
                  Ultimele rapoarte generate în sistem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentReports.map((report) => (
                  <div key={report.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{report.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {report.lastRun 
                          ? `Rulat la: ${new Date(report.lastRun).toLocaleDateString('ro-RO')}`
                          : 'Nu a fost rulat încă'}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {recentReports.length === 0 && (
                  <div className="text-center py-6">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                    <div className="text-sm text-muted-foreground">
                      Nu există rapoarte recente
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/analytics/reports">
                    <span>Vezi toate rapoartele</span>
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Card distribuție vânzări */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Distribuție vânzări</CardTitle>
                <CardDescription>
                  Distribuția vânzărilor pe categorii
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[150px] w-full flex items-center justify-center">
                  {/* Placeholder pentru grafic */}
                  <div className="text-center p-4">
                    <PieChart className="h-10 w-10 mx-auto text-muted-foreground/60" />
                    <div className="mt-2 text-sm text-muted-foreground">
                      Grafic distribuție vânzări
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-primary"></div>
                    <div className="text-xs">Produse fizice</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-primary/60"></div>
                    <div className="text-xs">Servicii</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-primary/40"></div>
                    <div className="text-xs">Abonamente</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-primary/20"></div>
                    <div className="text-xs">Altele</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/analytics/reports">
                    <span>Vezi raport detaliat</span>
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalii vânzări</CardTitle>
              <CardDescription>
                Analiză detaliată a vânzărilor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md bg-muted/20">
                <BarChart4 className="h-16 w-16 text-muted-foreground/60" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analiză clienți</CardTitle>
              <CardDescription>
                Informații despre clienți și comportamentul acestora
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md bg-muted/20">
                <Users className="h-16 w-16 text-muted-foreground/60" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analiză comenzi</CardTitle>
              <CardDescription>
                Informații despre comenzi și procesul de vânzare
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md bg-muted/20">
                <ShoppingCart className="h-16 w-16 text-muted-foreground/60" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AnalyticsLayout>
  );
}