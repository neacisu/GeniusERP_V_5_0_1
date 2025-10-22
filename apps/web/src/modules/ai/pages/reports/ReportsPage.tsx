/**
 * Pagina de listare a rapoartelor AI
 * 
 * Această pagină afișează toate rapoartele generate cu AI
 * și permite filtrarea, căutarea și crearea de noi rapoarte.
 */

import React, { useState } from "react";
import { Link } from "wouter";
import { AIModuleLayout } from "../../components/common/AIModuleLayout";
import { AIEmptyState } from "../../components/common/AIEmptyState";
import { useAIReports } from "../../hooks/useAIReports";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileBarChart, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  ChevronRight,
  Trash2,
  Copy,
  Clock,
  ArrowUpDown
} from "lucide-react";

export default function ReportsPage() {
  const { toast } = useToast();
  const { data: reportsResponse, isLoading } = useAIReports();
  const reports = reportsResponse?.data?.reports || [];
  
  // Stările pentru filtrare și căutare
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  
  // Funcție pentru formatarea datei
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };
  
  // Funcție pentru obținerea badge-ului în funcție de tipul raportului
  const getReportTypeBadge = (type: string) => {
    const badgeMap: Record<string, { label: string, className: string }> = {
      financial_summary: { label: "Financiar", className: "bg-green-100 text-green-800 hover:bg-green-200" },
      sales_performance: { label: "Vânzări", className: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
      inventory_analysis: { label: "Inventar", className: "bg-amber-100 text-amber-800 hover:bg-amber-200" },
      customer_insights: { label: "Clienți", className: "bg-purple-100 text-purple-800 hover:bg-purple-200" },
      market_trends: { label: "Piață", className: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200" }
    };
    
    const badge = badgeMap[type] || { label: "Altele", className: "bg-gray-100 text-gray-800 hover:bg-gray-200" };
    
    return (
      <Badge className={badge.className}>
        {badge.label}
      </Badge>
    );
  };
  
  // Filtrăm rapoartele în funcție de criteriile active
  const filteredReports = reports.filter(report => {
    // Filtrare după text
    const matchesSearch = searchQuery === "" || 
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.description && report.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filtrare după tip
    const matchesFilter = activeFilter === "all" || report.type === activeFilter;
    
    return matchesSearch && matchesFilter;
  });
  
  // Golim lista de rapoarte
  const isEmptyState = !isLoading && (!reports.length || !filteredReports.length);
  
  return (
    <AIModuleLayout
      title="Rapoarte Inteligente"
      description="Rapoarte generate cu AI pe baza datelor companiei tale"
      toolbarItems={
        <Button asChild>
          <Link href="/ai/reports/create">
            <Plus className="mr-2 h-4 w-4" />
            Raport nou
          </Link>
        </Button>
      }
    >
      {/* Bara de filtrare */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Caută rapoarte..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveFilter("all")}>
                Toate rapoartele
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter("financial_summary")}>
                Rapoarte financiare
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter("sales_performance")}>
                Performanță vânzări
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter("inventory_analysis")}>
                Analiză inventar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter("customer_insights")}>
                Insights clienți
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter("market_trends")}>
                Tendințe piață
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {activeFilter !== "all" && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveFilter("all")}
              className="text-xs flex items-center h-10"
            >
              <span>Șterge filtrul</span>
              <Trash2 className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="grid" className="w-[160px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grid">Card</TabsTrigger>
            <TabsTrigger value="list">Listă</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Starea de încărcare */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-1/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-5/6 h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-4/6 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between opacity-70">
                <div className="w-1/3 h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-1/4 h-3 bg-gray-200 rounded animate-pulse"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Starea goală */}
      {isEmptyState && (
        <AIEmptyState
          title={searchQuery || activeFilter !== "all" 
            ? "Nu am găsit rapoarte care să corespundă criteriilor"
            : "Niciun raport generat încă"
          }
          description={searchQuery || activeFilter !== "all"
            ? "Încearcă să modifici criteriile de căutare sau de filtrare pentru a găsi rapoartele tale."
            : "Rapoartele inteligente te ajută să vizualizezi datele companiei tale într-un mod clar și acționabil."
          }
          icon={<FileBarChart className="h-12 w-12 text-gray-400" />}
          primaryAction={{
            label: "Generează primul raport",
            href: "/ai/reports/create"
          }}
          variant="centered"
        />
      )}
      
      {/* Lista de rapoarte */}
      {!isLoading && filteredReports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <Card key={report.id} className="overflow-hidden hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Link href={`/ai/reports/${report.id}`}>
                    <CardTitle className="text-lg hover:text-primary transition-colors cursor-pointer">
                      {report.name}
                    </CardTitle>
                  </Link>
                  {getReportTypeBadge(report.type)}
                </div>
                <CardDescription className="line-clamp-2">
                  {report.description || "Raport generat cu AI"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ScrollArea className="h-24 w-full">
                  <p className="text-sm text-gray-500 line-clamp-4">
                    {report.summary || (report.content && report.content.substring(0, 120) + "...")}
                  </p>
                </ScrollArea>
              </CardContent>
              
              <CardFooter className="border-t pt-4 flex justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatDate(report.createdAt)}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/ai/reports/${report.id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/ai/reports/${report.id}`}>
                          Vizualizează
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        <span>Duplică</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Descarcă PDF</span>
                      </DropdownMenuItem>
                      <Separator className="my-1" />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Șterge</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </AIModuleLayout>
  );
}