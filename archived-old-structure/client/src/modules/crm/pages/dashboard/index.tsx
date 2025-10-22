/**
 * CRM Dashboard Page
 * 
 * Provides a comprehensive overview of CRM metrics, recent activities,
 * deal pipeline distribution, and quick access to key CRM functions.
 */

import React from 'react';
import { CRMModuleLayout } from '../../components/common/CRMModuleLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  Briefcase, 
  Calendar, 
  TrendingUp, 
  ChevronUp, 
  ChevronDown, 
  ArrowRight,
  Bell,
  Phone,
  Mail,
  CalendarClock,
  FileCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

const DashboardPage: React.FC = () => {
  const { toast } = useToast();
  
  const handleAction = (action: string) => {
    toast({
      title: "Acțiune",
      description: `Ai selectat acțiunea: ${action}`,
    });
  };
  
  // Sample data for the dashboard
  const metrics = {
    totalCustomers: 187,
    newCustomers: 24,
    newCustomersGrowth: 18.5,
    activeDeals: 47,
    activeDealsGrowth: 12.3,
    dealValue: 2543000,
    dealValueGrowth: -5.2,
    winRate: 68,
    winRateGrowth: 4.1,
    activities: 156,
    activitiesGrowth: 23.7,
    totalContacts: 312,
    contactsGrowth: 9.8,
  };
  
  // Sample data for pipeline distribution
  const pipelineData = [
    { stage: 'Calificare', count: 12, value: 540000, color: '#99D126' },
    { stage: 'Demonstrație', count: 8, value: 720000, color: '#88C506' },
    { stage: 'Propunere', count: 15, value: 1250000, color: '#F7AE2B' },
    { stage: 'Negociere', count: 7, value: 830000, color: '#F69008' },
    { stage: 'Câștigate', count: 5, value: 420000, color: '#0CA437' },
  ];
  
  // Calculate pipeline totals
  const totalPipelineDeals = pipelineData.reduce((sum, item) => sum + item.count, 0);
  const totalPipelineValue = pipelineData.reduce((sum, item) => sum + item.value, 0);
  
  // Sample recent activities
  const recentActivities = [
    { 
      id: 1, 
      type: 'call', 
      title: 'Apel cu Maria Popescu', 
      company: 'TechSoft Solutions',
      date: '11 Apr, 14:30',
      status: 'completed'
    },
    { 
      id: 2, 
      type: 'email', 
      title: 'Email trimis către Ion Ionescu', 
      company: 'Acme SRL',
      date: '11 Apr, 13:15',
      status: 'completed'
    },
    { 
      id: 3, 
      type: 'meeting', 
      title: 'Întâlnire cu echipa MediCare', 
      company: 'MediCare Plus',
      date: '11 Apr, 16:00',
      status: 'upcoming'
    },
    { 
      id: 4, 
      type: 'task', 
      title: 'Pregătire ofertă pentru Mihai Stanescu', 
      company: 'Acme SRL',
      date: '12 Apr, 10:00',
      status: 'upcoming'
    },
  ];
  
  // Sample upcoming deadlines
  const upcomingDeadlines = [
    { 
      id: 1, 
      title: 'Propunere TechSoft', 
      company: 'TechSoft Solutions',
      date: '12 Apr',
      value: 125000,
      probability: 75
    },
    { 
      id: 2, 
      title: 'Reînnoire contract Acme', 
      company: 'Acme SRL',
      date: '15 Apr',
      value: 80000,
      probability: 90
    },
    { 
      id: 3, 
      title: 'Proiect implementare MediCare', 
      company: 'MediCare Plus',
      date: '18 Apr',
      value: 250000,
      probability: 60
    }
  ];
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format percentage with + or - sign
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };
  
  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <CalendarClock className="h-4 w-4" />;
      case 'task':
        return <FileCheck className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  return (
    <CRMModuleLayout activeTab="dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">CRM Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={() => handleAction('export')} variant="outline">
              Export Date
            </Button>
            <Button onClick={() => handleAction('refresh')}>
              Actualizează
            </Button>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Customers Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Companii
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">{metrics.totalCustomers}</div>
                <Users className="h-6 w-6 text-primary opacity-75" />
              </div>
              <div className="flex items-center mt-1 text-xs">
                <div className={`flex items-center ${metrics.newCustomersGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.newCustomersGrowth > 0 ? (
                    <ChevronUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  )}
                  {formatPercentage(metrics.newCustomersGrowth)}
                </div>
                <span className="text-muted-foreground ml-1.5">vs. luna trecută</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Deals Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Oportunități Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">{metrics.activeDeals}</div>
                <Briefcase className="h-6 w-6 text-primary opacity-75" />
              </div>
              <div className="flex items-center mt-1 text-xs">
                <div className={`flex items-center ${metrics.activeDealsGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.activeDealsGrowth > 0 ? (
                    <ChevronUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  )}
                  {formatPercentage(metrics.activeDealsGrowth)}
                </div>
                <span className="text-muted-foreground ml-1.5">vs. luna trecută</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Deal Value Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valoare Oportunități
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">{formatCurrency(metrics.dealValue).replace(' RON', '')}</div>
                <TrendingUp className="h-6 w-6 text-primary opacity-75" />
              </div>
              <div className="flex items-center mt-1 text-xs">
                <div className={`flex items-center ${metrics.dealValueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.dealValueGrowth > 0 ? (
                    <ChevronUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  )}
                  {formatPercentage(metrics.dealValueGrowth)}
                </div>
                <span className="text-muted-foreground ml-1.5">vs. luna trecută</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Win Rate Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rată de Câștig
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">{metrics.winRate}%</div>
                <BarChart3 className="h-6 w-6 text-primary opacity-75" />
              </div>
              <div className="flex items-center mt-1 text-xs">
                <div className={`flex items-center ${metrics.winRateGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.winRateGrowth > 0 ? (
                    <ChevronUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  )}
                  {formatPercentage(metrics.winRateGrowth)}
                </div>
                <span className="text-muted-foreground ml-1.5">vs. luna trecută</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Distribution */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Distribuție Pipeline</CardTitle>
                <CardDescription>
                  {totalPipelineDeals} oportunități • Valoare totală: {formatCurrency(totalPipelineValue)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pipelineData.map((stage) => (
                    <div key={stage.stage} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="font-medium">{stage.stage}</div>
                        <div className="text-muted-foreground">{stage.count} oportunități</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(stage.value / totalPipelineValue) * 100} 
                          className="h-2"
                          style={{ 
                            backgroundColor: `${stage.color}20`,
                            "--progress-background": stage.color,
                          } as React.CSSProperties}
                        />
                        <span className="text-sm text-muted-foreground min-w-[70px] text-right">
                          {formatCurrency(stage.value).replace(' RON', '')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <Link to="/crm/pipelines">
                    <Button variant="outline" className="w-full">
                      <span>Vezi toate pipeline-urile</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activities & Upcoming Deadlines */}
          <div>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <Tabs defaultValue="activities">
                  <div className="flex items-center justify-between">
                    <CardTitle>Activitate Recentă</CardTitle>
                    <TabsList>
                      <TabsTrigger value="activities">Activități</TabsTrigger>
                      <TabsTrigger value="deadlines">Termene</TabsTrigger>
                    </TabsList>
                  </div>
                </Tabs>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="activities">
                  <TabsContent value="activities" className="m-0">
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-2">
                          <div className={`rounded-full p-1.5 ${
                            activity.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.company}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{activity.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4">
                      <Link to="/crm/activities">
                        <Button variant="outline" className="w-full">
                          <span>Vezi toate activitățile</span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="deadlines" className="m-0">
                    <div className="space-y-4">
                      {upcomingDeadlines.map((deadline) => (
                        <div key={deadline.id} className="flex items-start gap-2">
                          <div className="rounded-full p-1.5 bg-amber-100 text-amber-700">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{deadline.title}</p>
                            <p className="text-xs text-muted-foreground">{deadline.company}</p>
                            <div className="flex justify-between mt-1">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {deadline.date}
                              </span>
                              <span className="text-xs font-medium">
                                {formatCurrency(deadline.value).replace(' RON', '')}
                              </span>
                            </div>
                            <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1.5">
                              <div 
                                className="bg-primary h-1.5 rounded-full" 
                                style={{ width: `${deadline.probability}%` }}
                              />
                            </div>
                            <p className="text-xs text-right mt-0.5 text-muted-foreground">
                              {deadline.probability}% probabilitate
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4">
                      <Link to="/crm/deals">
                        <Button variant="outline" className="w-full">
                          <span>Vezi toate oportunitățile</span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CRMModuleLayout>
  );
};

export default DashboardPage;