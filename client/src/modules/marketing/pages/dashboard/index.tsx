/**
 * Marketing Dashboard Page
 * 
 * Main dashboard for the marketing module displaying key metrics,
 * campaign status, and recent activities.
 */

import React, { useState } from "react";
import { useMarketingStatistics } from "../../hooks/useMarketingApi";
import { Link } from "wouter";
import { 
  BarChart,
  PieChart,
  LineChart,
  SendIcon,
  MailIcon,
  UsersIcon,
  Calendar,
  TrendingUpIcon,
  BarChart2Icon,
  CheckCircle,
  Clock,
  Play,
  Pause
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

// Import our custom components
import MarketingStatusBadge from "../../components/common/StatusBadge";
import MarketingStatsCard from "../../components/cards/StatsCard";
import TabsNav from "../../components/common/TabsNav";
import { formatDate, formatNumber } from "../../utils/marketingUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart as RechartsLineChart,
  Line,
  Legend
} from "recharts";

// Status component redefinition is no longer needed - we're using the imported StatusBadge component

// Custom stat card is no longer needed - using the imported StatsCard component

const MarketingDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { stats, isLoading } = useMarketingStatistics();

  // Pie chart data for campaigns status
  const campaignStatusData = [
    { name: 'Active', value: stats.activeCampaigns, color: '#22c55e' },
    { name: 'Programate', value: stats.scheduledCampaigns, color: '#3b82f6' },
    { name: 'Finalizate', value: stats.completedCampaigns, color: '#8b5cf6' },
    { name: 'Ciorne', value: stats.draftsCount, color: '#94a3b8' }
  ];

  // Dummy data for engagement chart - should be replaced with real data when available
  const engagementData = [
    { name: 'Trimise', Rata: Math.round(stats.deliveryRate * 100) },
    { name: 'Deschise', Rata: Math.round(stats.openRate * 100) },
    { name: 'Click-uri', Rata: Math.round(stats.clickRate * 100) },
  ];

  const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#94a3b8'];

  return (
    <div className="flex-1 space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/marketing/campaigns/new">
              <SendIcon className="mr-2 h-4 w-4" />
              Campanie nouă
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/marketing/segments">
              <UsersIcon className="mr-2 h-4 w-4" />
              Segmente
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Prezentare generală</TabsTrigger>
          <TabsTrigger value="campaigns">Campanii</TabsTrigger>
          <TabsTrigger value="performance">Performanță</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-[100px]" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-[60px]" />
                    <Skeleton className="h-3 w-[120px] mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-[100px]" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-[60px]" />
                    <Skeleton className="h-3 w-[120px] mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-[100px]" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-[60px]" />
                    <Skeleton className="h-3 w-[120px] mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-[100px]" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-[60px]" />
                    <Skeleton className="h-3 w-[120px] mt-2" />
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <MarketingStatsCard
                  title="Total Campanii"
                  value={stats.totalCampaigns}
                  description="Campanii de marketing"
                  icon={<SendIcon className="h-4 w-4" />}
                />
                <MarketingStatsCard
                  title="Campanii Active"
                  value={stats.activeCampaigns}
                  description="Campanii în desfășurare"
                  icon={<Play className="h-4 w-4" />}
                  trend="up"
                  trendValue="+12.5% față de luna trecută"
                />
                <MarketingStatsCard
                  title="Audiență Totală"
                  value={stats.totalAudience.toLocaleString()}
                  description="Contacte în toate segmentele"
                  icon={<UsersIcon className="h-4 w-4" />}
                />
                <MarketingStatsCard
                  title="Rată Deschidere"
                  value={`${Math.round(stats.openRate * 100)}%`}
                  description="Media ratei de deschidere"
                  icon={<MailIcon className="h-4 w-4" />}
                  trend={stats.openRate > 0.2 ? "up" : "down"}
                  trendValue={stats.openRate > 0.2 ? "Performanță bună" : "Sub medie"}
                />
              </>
            )}
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Campaign Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Stare Campanii</CardTitle>
                <CardDescription>Distribuția campaniilor după status</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={campaignStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {campaignStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engagement Metrics Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Metrici de Performanță</CardTitle>
                <CardDescription>Ratele de livrare, deschidere și click</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={engagementData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis unit="%" />
                        <Tooltip formatter={(value) => [`${value}%`, 'Rata']} />
                        <Bar dataKey="Rata" fill="#8884d8" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Campaigns and Top Performing */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Recent Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Campanii Recente</CardTitle>
                <CardDescription>Ultimele campanii create</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : stats.recentCampaigns.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentCampaigns.map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <Link href={`/marketing/campaigns/${campaign.id}`}>
                            <h3 className="text-sm font-medium hover:underline cursor-pointer">{campaign.name}</h3>
                          </Link>
                          <div className="flex items-center mt-1 space-x-2">
                            <MarketingStatusBadge status={campaign.status} />
                            <p className="text-xs text-muted-foreground">
                              {new Date(campaign.createdAt).toLocaleDateString('ro-RO')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{campaign.sent.toLocaleString()} trimise</p>
                          <p className="text-xs text-muted-foreground">{campaign.opened.toLocaleString()} deschise</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nu există campanii recente.
                    <Link href="/marketing/campaigns/new">
                      <span className="ml-1 text-primary font-medium hover:underline cursor-pointer">Creați o campanie</span>
                    </Link>
                  </p>
                )}
              </CardContent>
              <CardFooter className="border-t bg-muted/50 p-2">
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/marketing/campaigns">
                    Vezi toate campaniile
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Top Performing Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Campanii Performante</CardTitle>
                <CardDescription>Campanii cu cele mai bune rezultate</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : stats.topPerformingCampaigns.length > 0 ? (
                  <div className="space-y-4">
                    {stats.topPerformingCampaigns.map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <Link href={`/marketing/campaigns/${campaign.id}`}>
                            <h3 className="text-sm font-medium hover:underline cursor-pointer">{campaign.name}</h3>
                          </Link>
                          <div className="flex items-center mt-1">
                            <Badge className="bg-blue-100 text-blue-800" variant="outline">
                              {campaign.type === 'email' ? 'Email' : 
                               campaign.type === 'sms' ? 'SMS' : 
                               campaign.type === 'social' ? 'Social Media' : 
                               campaign.type === 'push' ? 'Push Notification' : 
                               campaign.type === 'whatsapp' ? 'WhatsApp' : 
                               'Multi-canal'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{Math.round(campaign.openRate * 100)}% deschidere</p>
                          <p className="text-xs text-muted-foreground">{Math.round(campaign.clickRate * 100)}% click</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nu există date suficiente pentru performanța campaniilor.
                  </p>
                )}
              </CardContent>
              <CardFooter className="border-t bg-muted/50 p-2">
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/marketing/analytics">
                    Vezi toate analizele
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Campanii</h2>
            <Button asChild>
              <Link href="/marketing/campaigns/new">
                <SendIcon className="mr-2 h-4 w-4" />
                Campanie nouă
              </Link>
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Active Campaigns */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Play className="h-4 w-4 text-green-500" />
                      <CardTitle className="text-lg">Active</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : (
                      <p className="text-3xl font-bold">{stats.activeCampaigns}</p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/marketing/campaigns?status=active">
                        Vezi campaniile active
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>

                {/* Scheduled Campaigns */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-lg">Programate</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : (
                      <p className="text-3xl font-bold">{stats.scheduledCampaigns}</p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/marketing/campaigns?status=scheduled">
                        Vezi campaniile programate
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>

                {/* Draft Campaigns */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <CardTitle className="text-lg">Ciorne</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : (
                      <p className="text-3xl font-bold">{stats.draftsCount}</p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/marketing/campaigns?status=draft">
                        Vezi ciornele
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
            <CardFooter className="border-t p-6">
              <Button className="w-full" asChild>
                <Link href="/marketing/campaigns">
                  Vezi toate campaniile
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Performanță</h2>
            <Button variant="outline" asChild>
              <Link href="/marketing/analytics">
                <BarChart2Icon className="mr-2 h-4 w-4" />
                Analiză detaliată
              </Link>
            </Button>
          </div>

          {/* Performance Metrics */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <MarketingStatsCard
              title="Rată Livrare"
              value={`${Math.round(stats.deliveryRate * 100)}%`}
              description="Mesaje livrate cu succes"
              icon={<CheckCircle className="h-4 w-4" />}
            />
            <MarketingStatsCard
              title="Rată Deschidere"
              value={`${Math.round(stats.openRate * 100)}%`}
              description="Mesaje deschise din cele livrate"
              icon={<MailIcon className="h-4 w-4" />}
            />
            <MarketingStatsCard
              title="Rată Click"
              value={`${Math.round(stats.clickRate * 100)}%`}
              description="Utilizatori care au dat click pe link-uri"
              icon={<TrendingUpIcon className="h-4 w-4" />}
            />
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tendințe de Performanță</CardTitle>
              <CardDescription>Evoluția ratelor de deschidere și click în timp</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={[
                        { name: 'Ian', openRate: 28, clickRate: 15 },
                        { name: 'Feb', openRate: 31, clickRate: 17 },
                        { name: 'Mar', openRate: 36, clickRate: 20 },
                        { name: 'Apr', openRate: 39, clickRate: 22 },
                        { name: 'Mai', openRate: 37, clickRate: 21 },
                        { name: 'Iun', openRate: 35, clickRate: 19 },
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
                      <YAxis unit="%" />
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                      <Legend />
                      <Line type="monotone" dataKey="openRate" stroke="#8884d8" name="Rată Deschidere" strokeWidth={2} />
                      <Line type="monotone" dataKey="clickRate" stroke="#82ca9d" name="Rată Click" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t p-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/marketing/reports">
                  Generează raport detaliat
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingDashboardPage;