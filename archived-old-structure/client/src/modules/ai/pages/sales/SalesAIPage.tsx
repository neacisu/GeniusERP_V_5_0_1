/**
 * Pagina principală Sales AI
 * 
 * Această pagină afișează funcționalitățile de AI pentru departamentul
 * de vânzări, inclusiv lead scoring, recomandări și insights.
 */

import React, { useState } from "react";
import { useLeadScoring, useDealRecommendations, useSalesInsights } from "../../hooks/useSalesAI";
import { AIModuleLayout } from "../../components/common/AIModuleLayout";
import { AIEmptyState } from "../../components/common/AIEmptyState";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  UserCheck, 
  LineChart, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  Search,
  ArrowUpRight,
  CircleCheck,
  ArrowRight,
  UserPlus,
  Filter,
  SlidersHorizontal
} from "lucide-react";

export default function SalesAIPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("leads");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: leadResponse, isLoading: isLoadingLeads } = useLeadScoring();
  const leads = leadResponse?.data?.leads || [];
  
  const { data: recommendationsResponse, isLoading: isLoadingRecommendations } = useDealRecommendations();
  const recommendations = recommendationsResponse?.data?.recommendations || [];
  
  const { data: insightsResponse, isLoading: isLoadingInsights } = useSalesInsights();
  const insights = insightsResponse?.data?.insights || [];
  
  // Filtrarea lead-urilor în funcție de query
  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Formatare date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };
  
  // Formatare valoare estimată
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Obține culoarea badge-ului pentru prioritate
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high':
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case 'medium':
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case 'low':
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  // Obține culoarea badge-ului pentru tip insight
  const getInsightTypeColor = (type: string) => {
    switch(type) {
      case 'opportunity':
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
      case 'risk':
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case 'optimization':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  // Obține culoarea badge-ului pentru tip recomandare
  const getRecommendationTypeColor = (type: string) => {
    switch(type) {
      case 'upsell':
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
      case 'cross_sell':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case 'discount':
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case 'timing':
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  // Obține culoarea și iconul pentru status lead
  const getLeadStatusInfo = (status: string) => {
    switch(status) {
      case 'new':
        return { color: "text-blue-500", icon: <UserPlus className="h-4 w-4" /> };
      case 'contacted':
        return { color: "text-amber-500", icon: <UserCheck className="h-4 w-4" /> };
      case 'qualified':
        return { color: "text-emerald-500", icon: <Target className="h-4 w-4" /> };
      case 'proposal':
        return { color: "text-purple-500", icon: <LineChart className="h-4 w-4" /> };
      case 'negotiation':
        return { color: "text-indigo-500", icon: <Sparkles className="h-4 w-4" /> };
      case 'closed_won':
        return { color: "text-green-600", icon: <CircleCheck className="h-4 w-4" /> };
      case 'closed_lost':
        return { color: "text-red-600", icon: <AlertTriangle className="h-4 w-4" /> };
      default:
        return { color: "text-gray-500", icon: <UserCheck className="h-4 w-4" /> };
    }
  };
  
  // Obține inițialele din nume pentru avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <AIModuleLayout
      title="Sales AI"
      description="Inteligență artificială pentru optimizarea vânzărilor"
    >
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <TabsList>
            <TabsTrigger value="leads" className="flex items-center">
              <UserCheck className="mr-2 h-4 w-4" />
              <span>Lead Scoring</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center">
              <Sparkles className="mr-2 h-4 w-4" />
              <span>Recomandări</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center">
              <LineChart className="mr-2 h-4 w-4" />
              <span>Insights</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Caută leads..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="leads" className="mt-0">
          {isLoadingLeads ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="w-1/2 h-5 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-1/4 h-5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <div className="w-1/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-1/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {filteredLeads.length === 0 ? (
                <AIEmptyState
                  title="Nu am găsit leads care să corespundă criteriilor"
                  description="Încearcă să modifici criteriile de căutare sau adaugă noi leads pentru analiză."
                  icon={<UserCheck className="h-12 w-12 text-gray-400" />}
                  primaryAction={{
                    label: "Adaugă leads pentru analiză",
                    href: "/ai/sales/add-leads"
                  }}
                  variant="centered"
                />
              ) : (
                <div className="mb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredLeads.map(lead => {
                      const statusInfo = getLeadStatusInfo(lead.status);
                      
                      return (
                        <Card key={lead.id} className="shadow-sm hover:shadow-md transition-all">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {getInitials(lead.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-base font-medium">{lead.name}</CardTitle>
                                  <CardDescription className="text-xs mt-0.5">{lead.company}</CardDescription>
                                </div>
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={`flex items-center ${statusInfo.color}`}>
                                      {statusInfo.icon}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Status: {lead.status.replace('_', ' ')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </CardHeader>
                          
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">Lead score</span>
                                  <span className="font-medium">{lead.score}/100</span>
                                </div>
                                <Progress value={lead.score} className="h-2" />
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Probabilitate</span>
                                <span className="text-sm font-medium">{Math.round(lead.probability * 100)}%</span>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Valoare estimată</span>
                                <Badge variant="outline">{formatCurrency(lead.estimatedValue)}</Badge>
                              </div>
                            </div>
                          </CardContent>
                          
                          <CardFooter className="flex justify-between border-t pt-3 text-xs text-muted-foreground">
                            <div>
                              <span>Sursă: {lead.source}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                              <span>Detalii</span>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="recommendations" className="mt-0">
          {isLoadingRecommendations ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="w-1/2 h-5 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-1/4 h-5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {recommendations.length === 0 ? (
                <AIEmptyState
                  title="Nu există recomandări disponibile"
                  description="Nu există recomandări generate de AI pentru oportunitățile curente."
                  icon={<Sparkles className="h-12 w-12 text-gray-400" />}
                  primaryAction={{
                    label: "Generează recomandări",
                    href: "/ai/sales/generate-recommendations"
                  }}
                  variant="centered"
                />
              ) : (
                <div className="space-y-4">
                  {recommendations.map(recommendation => (
                    <Card key={recommendation.id} className="shadow-sm hover:shadow-md transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-medium">{recommendation.leadName}</CardTitle>
                          <div className="flex gap-2">
                            <Badge className={getRecommendationTypeColor(recommendation.type)}>
                              {recommendation.type === 'upsell' && 'Upsell'}
                              {recommendation.type === 'cross_sell' && 'Cross-sell'}
                              {recommendation.type === 'discount' && 'Discount'}
                              {recommendation.type === 'timing' && 'Timing'}
                            </Badge>
                            <Badge className={getPriorityColor(recommendation.priority)}>
                              {recommendation.priority === 'high' && 'Prioritate înaltă'}
                              {recommendation.priority === 'medium' && 'Prioritate medie'}
                              {recommendation.priority === 'low' && 'Prioritate scăzută'}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription>{recommendation.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold mb-1">Acțiune sugerată</h4>
                            <p className="text-sm text-muted-foreground">{recommendation.suggestedAction}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold mb-1">Rezultat așteptat</h4>
                            <p className="text-sm text-muted-foreground">{recommendation.expectedOutcome}</p>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Data generării: {formatDate(recommendation.createdAt)}</span>
                            
                            {recommendation.potentialValue !== 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={`flex items-center gap-1 ${recommendation.potentialValue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {recommendation.potentialValue > 0 ? <ArrowUpRight className="h-4 w-4" /> : null}
                                      <span className="font-medium">{formatCurrency(recommendation.potentialValue)}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Valoare potențială</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          
                          <div className="flex justify-end">
                            <Button variant="outline" size="sm" className="mr-2">
                              Marchează ca aplicată
                            </Button>
                            <Button size="sm">
                              Aplică acum
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="insights" className="mt-0">
          {isLoadingInsights ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="w-1/2 h-5 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-1/4 h-5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {insights.length === 0 ? (
                <AIEmptyState
                  title="Nu există insights disponibile"
                  description="Nu există insights generate de AI pentru datele de vânzări curente."
                  icon={<LineChart className="h-12 w-12 text-gray-400" />}
                  primaryAction={{
                    label: "Generează insights",
                    href: "/ai/sales/generate-insights"
                  }}
                  variant="centered"
                />
              ) : (
                <div className="space-y-4">
                  {insights.map(insight => (
                    <Card key={insight.id} className="shadow-sm hover:shadow-md transition-all">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-medium">{insight.title}</CardTitle>
                          <div className="flex gap-2">
                            <Badge className={getInsightTypeColor(insight.type)}>
                              {insight.type === 'opportunity' && 'Oportunitate'}
                              {insight.type === 'risk' && 'Risc'}
                              {insight.type === 'optimization' && 'Optimizare'}
                            </Badge>
                            <Badge className={getPriorityColor(insight.priority)}>
                              {insight.priority === 'high' && 'Prioritate înaltă'}
                              {insight.priority === 'medium' && 'Prioritate medie'}
                              {insight.priority === 'low' && 'Prioritate scăzută'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </CardContent>
                      
                      <CardFooter className="border-t pt-3 flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Generat la: {formatDate(insight.createdAt)}
                        </span>
                        
                        <div>
                          <Button variant="outline" size="sm" className="mr-2 text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            <span>Analizează trendul</span>
                          </Button>
                          <Button size="sm" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            <span>Obține recomandări</span>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </AIModuleLayout>
  );
}