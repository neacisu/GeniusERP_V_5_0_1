/**
 * Campaign Detail Page
 * 
 * Displays details about a specific marketing campaign.
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Mail, 
  MessageSquare, 
  Share2, 
  BellRing, 
  Play,
  Pause,
  StopCircle,
  Copy,
  BarChart2,
  FileText,
  Users,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { useCampaign } from "../../hooks/useMarketingApi";
import { CampaignStatus, CampaignType, AudienceType } from "../../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";

// Status badge component
const StatusBadge = ({ status }: { status: CampaignStatus }) => {
  const getStatusDetails = () => {
    switch (status) {
      case CampaignStatus.DRAFT:
        return { label: 'Ciornă', color: 'bg-gray-200 text-gray-800', icon: <FileText className="mr-2 h-4 w-4" /> };
      case CampaignStatus.SCHEDULED:
        return { label: 'Programată', color: 'bg-blue-100 text-blue-800', icon: <Calendar className="mr-2 h-4 w-4" /> };
      case CampaignStatus.ACTIVE:
        return { label: 'Activă', color: 'bg-green-100 text-green-800', icon: <Play className="mr-2 h-4 w-4" /> };
      case CampaignStatus.PAUSED:
        return { label: 'Pausată', color: 'bg-yellow-100 text-yellow-800', icon: <Pause className="mr-2 h-4 w-4" /> };
      case CampaignStatus.COMPLETED:
        return { label: 'Finalizată', color: 'bg-purple-100 text-purple-800', icon: <CheckCircle className="mr-2 h-4 w-4" /> };
      case CampaignStatus.CANCELLED:
        return { label: 'Anulată', color: 'bg-red-100 text-red-800', icon: <XCircle className="mr-2 h-4 w-4" /> };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: null };
    }
  };

  const { label, color, icon } = getStatusDetails();
  return (
    <Badge className={`${color} flex items-center`} variant="outline">
      {icon}
      {label}
    </Badge>
  );
};

// Campaign type component
const CampaignTypeLabel = ({ type }: { type: CampaignType }) => {
  switch (type) {
    case CampaignType.EMAIL:
      return <div className="flex items-center"><Mail className="mr-2 h-4 w-4" /> Email</div>;
    case CampaignType.SMS:
      return <div className="flex items-center"><MessageSquare className="mr-2 h-4 w-4" /> SMS</div>;
    case CampaignType.SOCIAL:
      return <div className="flex items-center"><Share2 className="mr-2 h-4 w-4" /> Social Media</div>;
    case CampaignType.PUSH:
      return <div className="flex items-center"><BellRing className="mr-2 h-4 w-4" /> Push Notificare</div>;
    case CampaignType.WHATSAPP:
      return <div className="flex items-center"><MessageSquare className="mr-2 h-4 w-4" /> WhatsApp</div>;
    case CampaignType.MULTI_CHANNEL:
      return <div className="flex items-center"><Share2 className="mr-2 h-4 w-4" /> Multi-canal</div>;
    default:
      return <div>{type}</div>;
  }
};

// Audience type component
const AudienceTypeLabel = ({ type }: { type: AudienceType }) => {
  switch (type) {
    case AudienceType.ALL_CUSTOMERS:
      return <div className="flex items-center"><Users className="mr-2 h-4 w-4" /> Toți Clienții</div>;
    case AudienceType.SEGMENT:
      return <div className="flex items-center"><Users className="mr-2 h-4 w-4" /> Segment</div>;
    case AudienceType.LIST:
      return <div className="flex items-center"><FileText className="mr-2 h-4 w-4" /> Listă</div>;
    case AudienceType.CUSTOM:
      return <div className="flex items-center"><Users className="mr-2 h-4 w-4" /> Audiență Personalizată</div>;
    case AudienceType.FILTERED:
      return <div className="flex items-center"><Users className="mr-2 h-4 w-4" /> Audiență Filtrată</div>;
    default:
      return <div>{type}</div>;
  }
};

// Format date function
const formatDate = (date: string | Date | undefined) => {
  if (!date) return "-";
  return format(new Date(date), "PPP 'la' HH:mm", { locale: ro });
};

interface CampaignDetailPageProps {
  id: string;
}

const CampaignDetailPage: React.FC<CampaignDetailPageProps> = ({ id }) => {
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [alertAction, setAlertAction] = useState<"cancel" | "delete" | null>(null);
  
  const { campaign, performance, isLoading, isLoadingPerformance } = useCampaign(id);
  
  // Placeholder metrics data for the UI
  const metricData = React.useMemo(() => [
    { date: '2025-04-05', sent: 450, delivered: 432, opened: 198, clicked: 86 },
    { date: '2025-04-06', sent: 50, delivered: 48, opened: 23, clicked: 10 },
    { date: '2025-04-07', sent: 0, delivered: 0, opened: 12, clicked: 5 },
    { date: '2025-04-08', sent: 0, delivered: 0, opened: 8, clicked: 4 },
    { date: '2025-04-09', sent: 0, delivered: 0, opened: 5, clicked: 2 },
    { date: '2025-04-10', sent: 0, delivered: 0, opened: 3, clicked: 1 },
    { date: '2025-04-11', sent: 0, delivered: 0, opened: 2, clicked: 0 },
  ], []);
  
  // Calculate campaign duration
  const calculateDuration = () => {
    if (!campaign) return "-";
    
    if (campaign.status === CampaignStatus.DRAFT || campaign.status === CampaignStatus.SCHEDULED) {
      return "Nu a început încă";
    }
    
    const startDate = campaign.startedAt ? new Date(campaign.startedAt) : null;
    const endDate = campaign.completedAt ? new Date(campaign.completedAt) : null;
    
    if (!startDate) return "-";
    
    if (campaign.status === CampaignStatus.ACTIVE || campaign.status === CampaignStatus.PAUSED) {
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays < 1) {
        const diffInHours = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60));
        return `${diffInHours} ore`;
      }
      
      return `${diffInDays} zile`;
    }
    
    if (endDate) {
      const diffInDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays < 1) {
        const diffInHours = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
        return `${diffInHours} ore`;
      }
      
      return `${diffInDays} zile`;
    }
    
    return "-";
  };
  
  // Create pie chart data for open/click rates
  const getPieData = () => {
    if (!campaign || !performance) return [];
    
    const openRate = performance.openRate || 0;
    const clickRate = performance.clickRate || 0;
    
    return [
      { name: 'Deschideri', value: Math.round(openRate * 100), color: '#3b82f6' },
      { name: 'Click-uri', value: Math.round(clickRate * 100), color: '#10b981' },
      { name: 'Conversii', value: Math.round(clickRate * 25), color: '#f59e0b' }, // Estimated conversion rate
    ];
  };
  
  const handleAction = (action: "edit" | "cancel" | "delete") => {
    if (action === "edit") {
      setLocation(`/marketing/campaigns/edit/${id}`);
    } else if (action === "cancel" || action === "delete") {
      setAlertAction(action);
      setIsAlertDialogOpen(true);
    }
  };
  
  const confirmAction = () => {
    // Implementation would connect to the API
    setIsAlertDialogOpen(false);
    if (alertAction === "delete") {
      setLocation("/marketing/campaigns");
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton className="h-9 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!campaign) {
    return (
      <div className="flex-1 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2"
              onClick={() => setLocation("/marketing/campaigns")}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Înapoi</span>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Campanie</h1>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-medium">Campanie negăsită</h2>
            <p className="text-muted-foreground">
              Campania cu ID-ul specificat nu a fost găsită. Este posibil să fi fost ștearsă sau să nu aveți acces la ea.
            </p>
            <Button onClick={() => setLocation("/marketing/campaigns")}>
              Înapoi la Campanii
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex-1 space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => setLocation("/marketing/campaigns")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Înapoi</span>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => handleAction("edit")}>
            <Edit className="mr-2 h-4 w-4" />
            Editează
          </Button>
          {campaign.status === CampaignStatus.ACTIVE && (
            <Button variant="outline" onClick={() => handleAction("cancel")}>
              <Pause className="mr-2 h-4 w-4" />
              Pausează
            </Button>
          )}
          {campaign.status === CampaignStatus.PAUSED && (
            <Button variant="outline">
              <Play className="mr-2 h-4 w-4" />
              Reia
            </Button>
          )}
          {(campaign.status === CampaignStatus.DRAFT || campaign.status === CampaignStatus.SCHEDULED) && (
            <Button variant="outline" onClick={() => handleAction("cancel")}>
              <StopCircle className="mr-2 h-4 w-4" />
              Anulează
            </Button>
          )}
          <Button variant="outline">
            <Copy className="mr-2 h-4 w-4" />
            Duplică
          </Button>
        </div>
      </div>
      
      {/* Campaign status badge */}
      <div className="flex items-center space-x-2">
        <StatusBadge status={campaign.status} />
        <span className="text-sm text-muted-foreground">
          {campaign.status === CampaignStatus.SCHEDULED ? (
            <>Programată pentru {formatDate(campaign.scheduledAt)}</>
          ) : campaign.status === CampaignStatus.ACTIVE ? (
            <>Activă din {formatDate(campaign.startedAt)}</>
          ) : campaign.status === CampaignStatus.COMPLETED ? (
            <>Finalizată la {formatDate(campaign.completedAt)}</>
          ) : campaign.status === CampaignStatus.PAUSED ? (
            <>Pausată</>
          ) : null}
        </span>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Prezentare generală</TabsTrigger>
          <TabsTrigger value="performance">Performanță</TabsTrigger>
          <TabsTrigger value="audience">Audiență</TabsTrigger>
          <TabsTrigger value="content">Conținut</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Expediat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaign.sentCount?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {campaign.deliveredCount ? `${campaign.deliveredCount.toLocaleString()} livrate` : "0 livrate"}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Deschise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaign.openCount?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {campaign.deliveredCount ? 
                    `${Math.round((campaign.openCount || 0) / (campaign.deliveredCount || 1) * 100)}% rată deschidere` : 
                    "0% rată deschidere"}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Click-uri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaign.clickCount?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {campaign.openCount ? 
                    `${Math.round((campaign.clickCount || 0) / (campaign.openCount || 1) * 100)}% rată click` : 
                    "0% rată click"}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Campaign Info */}
          <Card>
            <CardHeader>
              <CardTitle>Detalii Campanie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Tip Campanie</h3>
                    <p className="font-medium"><CampaignTypeLabel type={campaign.type} /></p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Audiență</h3>
                    <p className="font-medium"><AudienceTypeLabel type={campaign.audienceType} /></p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Canale</h3>
                    <div className="flex flex-wrap gap-2">
                      {campaign.channels && campaign.channels.map((channel, idx) => (
                        <Badge key={idx} variant="secondary">
                          {channel === CampaignType.EMAIL ? (
                            <>
                              <Mail className="mr-1 h-3 w-3" />
                              Email
                            </>
                          ) : channel === CampaignType.SMS ? (
                            <>
                              <MessageSquare className="mr-1 h-3 w-3" />
                              SMS
                            </>
                          ) : channel === CampaignType.SOCIAL ? (
                            <>
                              <Share2 className="mr-1 h-3 w-3" />
                              Social
                            </>
                          ) : channel === CampaignType.PUSH ? (
                            <>
                              <BellRing className="mr-1 h-3 w-3" />
                              Push
                            </>
                          ) : channel === CampaignType.WHATSAPP ? (
                            <>
                              <MessageSquare className="mr-1 h-3 w-3" />
                              WhatsApp
                            </>
                          ) : channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Creat la</h3>
                    <p className="font-medium">{formatDate(campaign.createdAt)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Durată Campanie</h3>
                    <p className="font-medium">{calculateDuration()}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Audiență Estimată</h3>
                    <p className="font-medium">{campaign.estimatedReach?.toLocaleString() || "Necunoscută"}</p>
                  </div>
                </div>
              </div>
              
              {campaign.description && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Descriere</h3>
                  <p className="font-medium">{campaign.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Evoluție Performanță</CardTitle>
              <CardDescription>
                Evoluția metricilor campaniei în timp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoadingPerformance ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={metricData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [value, name === 'sent' ? 'Trimise' : 
                                                         name === 'delivered' ? 'Livrate' : 
                                                         name === 'opened' ? 'Deschise' : 
                                                         'Click-uri']}
                        labelFormatter={(value) => new Date(value).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })}
                      />
                      <Legend formatter={(value) => value === 'sent' ? 'Trimise' : 
                                                   value === 'delivered' ? 'Livrate' : 
                                                   value === 'opened' ? 'Deschise' : 
                                                   'Click-uri'} />
                      <Line type="monotone" dataKey="sent" stroke="#94a3b8" strokeWidth={2} />
                      <Line type="monotone" dataKey="delivered" stroke="#64748b" strokeWidth={2} />
                      <Line type="monotone" dataKey="opened" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="clicked" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setActiveTab("performance")}>
                Vezi toate metricile de performanță
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Metrici de Performanță</CardTitle>
              <CardDescription>
                Rezultatele campaniei
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Expediat</h3>
                  <p className="text-2xl font-bold">{campaign.sentCount?.toLocaleString() || "0"}</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Livrat</h3>
                  <p className="text-2xl font-bold">{campaign.deliveredCount?.toLocaleString() || "0"}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.sentCount 
                      ? `${Math.round((campaign.deliveredCount || 0) / (campaign.sentCount || 1) * 100)}% rată livrare` 
                      : "0% rată livrare"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Deschideri</h3>
                  <p className="text-2xl font-bold">{campaign.openCount?.toLocaleString() || "0"}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.deliveredCount
                      ? `${Math.round((campaign.openCount || 0) / (campaign.deliveredCount || 1) * 100)}% rată deschidere`
                      : "0% rată deschidere"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Click-uri</h3>
                  <p className="text-2xl font-bold">{campaign.clickCount?.toLocaleString() || "0"}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.openCount
                      ? `${Math.round((campaign.clickCount || 0) / (campaign.openCount || 1) * 100)}% rată click`
                      : "0% rată click"}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Respins</h3>
                  <p className="text-2xl font-bold">{campaign.bounceCount?.toLocaleString() || "0"}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.sentCount
                      ? `${Math.round((campaign.bounceCount || 0) / (campaign.sentCount || 1) * 100)}% rată respingere`
                      : "0% rată respingere"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Răspunsuri</h3>
                  <p className="text-2xl font-bold">{campaign.responseCount?.toLocaleString() || "0"}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.deliveredCount
                      ? `${Math.round((campaign.responseCount || 0) / (campaign.deliveredCount || 1) * 100)}% rată răspuns`
                      : "0% rată răspuns"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Conversii Estimate</h3>
                  <p className="text-2xl font-bold">{Math.round((campaign.clickCount || 0) * 0.25)}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.clickCount
                      ? `${Math.round(Math.round((campaign.clickCount || 0) * 0.25) / (campaign.clickCount || 1) * 100)}% rată conversie`
                      : "0% rată conversie"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">ROI Estimat</h3>
                  <p className="text-2xl font-bold">
                    {isLoadingPerformance ? "-" : "284%"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bazat pe conversii și valoare medie
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Performance Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Rate de Performanță</CardTitle>
                <CardDescription>
                  Raportul dintre deschideri, click-uri și conversii
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoadingPerformance ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="h-[300px] w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPieData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performanță pe Canale</CardTitle>
                <CardDescription>
                  Comparație între diferitele canale utilizate
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaign.channels && campaign.channels.length > 1 ? (
                  <div className="h-[300px]">
                    {isLoadingPerformance ? (
                      <div className="flex items-center justify-center h-full">
                        <Skeleton className="h-[300px] w-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            {
                              name: 'Email',
                              sent: 500,
                              delivered: 480,
                              opened: 220,
                              clicked: 95
                            },
                            {
                              name: 'SMS',
                              sent: 300,
                              delivered: 295,
                              opened: 0,
                              clicked: 45
                            }
                          ]}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="delivered" name="Livrate" fill="#64748b" />
                          <Bar dataKey="opened" name="Deschise" fill="#3b82f6" />
                          <Bar dataKey="clicked" name="Click-uri" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-center text-muted-foreground">
                      Datele pentru comparația între canale vor fi disponibile pentru campaniile multi-canal.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informații Audiență</CardTitle>
              <CardDescription>
                Detalii despre audiența campaniei
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Tip Audiență</h3>
                    <p className="font-medium"><AudienceTypeLabel type={campaign.audienceType} /></p>
                  </div>
                  
                  {campaign.audienceType === AudienceType.SEGMENT && campaign.audienceId && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Segment</h3>
                      <p className="font-medium">
                        <Button variant="link" className="p-0 h-auto" asChild>
                          <a href={`/marketing/segments/${campaign.audienceId}`}>
                            Vezi segmentul
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </a>
                        </Button>
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Mărime Audiență</h3>
                    <p className="font-medium">{campaign.estimatedReach?.toLocaleString() || "Necunoscută"}</p>
                  </div>
                </div>
                
                <div>
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-sm">Analiză Audiență</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Analiza detaliată a audienței va fi disponibilă curând. Aceasta va include date demografice, locație și alte informații relevante.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conținut Campanie</CardTitle>
              <CardDescription>
                Mesajul și detaliile de conținut
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {campaign.subject && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Subiect</h3>
                  <p className="font-medium">{campaign.subject}</p>
                </div>
              )}
              
              {campaign.templateId && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Șablon</h3>
                  <p className="font-medium">
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <a href={`/marketing/templates/${campaign.templateId}`}>
                        Vezi șablonul
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </a>
                    </Button>
                  </p>
                </div>
              )}
              
              {campaign.content && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Conținut</h3>
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <p className="whitespace-pre-wrap">{campaign.content}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {campaign.contentHtml && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Previzualizare</h3>
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div 
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: campaign.contentHtml }}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Alert Dialog for confirmations */}
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {alertAction === "cancel" ? "Anulare campanie" : "Ștergere campanie"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertAction === "cancel"
                ? "Sunteți sigur că doriți să anulați această campanie? Acțiunea nu poate fi inversată."
                : "Sunteți sigur că doriți să ștergeți această campanie? Toate datele asociate vor fi șterse permanent."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction 
              className={alertAction === "delete" ? "bg-red-500 hover:bg-red-600" : ""}
              onClick={confirmAction}
            >
              {alertAction === "cancel" ? "Anulează campania" : "Șterge campania"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CampaignDetailPage;