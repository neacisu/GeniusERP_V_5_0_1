/**
 * Pagina de detalii pentru un raport AI specific
 */

import React, { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { AIModuleLayout } from "../../components/common/AIModuleLayout";
import { useAIReport } from "../../hooks/useAIReports";
import { AIEmptyState } from "../../components/common/AIEmptyState";
import { useToast } from "@/hooks/use-toast";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  LineChart,
  Clock,
  Download,
  Share2,
  ChevronLeft,
  Printer,
  TrendingUp,
  FileText,
  File,
  FileBarChart,
  RefreshCcw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function ReportDetailPage() {
  // Obținem ID-ul raportului din URL
  const [, params] = useRoute<{ id: string }>("/ai/reports/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const reportId = params?.id || null;

  // Încărcăm datele raportului
  const { data: reportResponse, isLoading, error, refetch } = useAIReport(reportId);
  const report = reportResponse?.data;
  
  // Starea tab-ului activ
  const [activeTab, setActiveTab] = useState("report");
  
  // Formatare dată
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Funcție pentru renderarea conținutului raportului cu formatare
  const renderReportContent = (content: string) => {
    // Împărțim conținutul în paragrafe
    const paragraphs = content.split('\n\n');
    
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => {
          // Verificăm dacă este un titlu de secțiune
          if (paragraph.startsWith('# ')) {
            return (
              <h2 key={index} className="text-2xl font-bold mt-6 mb-3">
                {paragraph.substring(2)}
              </h2>
            );
          } else if (paragraph.startsWith('## ')) {
            return (
              <h3 key={index} className="text-xl font-semibold mt-5 mb-2">
                {paragraph.substring(3)}
              </h3>
            );
          } else if (paragraph.startsWith('### ')) {
            return (
              <h4 key={index} className="text-lg font-medium mt-4 mb-2">
                {paragraph.substring(4)}
              </h4>
            );
          } else if (paragraph.startsWith('- ')) {
            // Este o listă
            const items = paragraph.split('\n');
            return (
              <ul key={index} className="list-disc pl-5 space-y-1">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item.substring(2)}</li>
                ))}
              </ul>
            );
          } else if (paragraph.startsWith('1. ')) {
            // Este o listă numerotată
            const items = paragraph.split('\n');
            return (
              <ol key={index} className="list-decimal pl-5 space-y-1">
                {items.map((item, itemIndex) => {
                  const numericPrefix = item.match(/^\d+\.\s/);
                  return numericPrefix ? (
                    <li key={itemIndex}>{item.substring(numericPrefix[0].length)}</li>
                  ) : (
                    <li key={itemIndex}>{item}</li>
                  );
                })}
              </ol>
            );
          } else {
            // Paragraf normal
            return <p key={index}>{paragraph}</p>;
          }
        })}
      </div>
    );
  };
  
  // Funcție pentru a genera un rezumat al raportului
  const generateReportSummary = (content: string) => {
    const maxLength = 200;
    return content.length > maxLength 
      ? `${content.substring(0, maxLength)}...` 
      : content;
  };
  
  // Funcție pentru a descărca raportul ca PDF
  const downloadAsPDF = () => {
    toast({
      title: "Descărcare inițiată",
      description: "Raportul se descarcă în format PDF.",
    });
    // Logica reală de descărcare ar fi implementată aici
  };
  
  // Funcție pentru tipărirea raportului
  const printReport = () => {
    window.print();
  };
  
  // Funcție pentru partajarea raportului
  const shareReport = () => {
    // Copiem link-ul în clipboard
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        toast({
          title: "Link copiat",
          description: "Link-ul către raport a fost copiat în clipboard.",
        });
      },
      () => {
        toast({
          title: "Eroare",
          description: "Nu s-a putut copia link-ul.",
          variant: "destructive",
        });
      }
    );
  };
  
  // Mapping pentru iconițe bazate pe tipul raportului
  const getReportIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      financial_summary: <FileBarChart className="h-6 w-6 text-green-600" />,
      sales_performance: <FileBarChart className="h-6 w-6 text-blue-600" />,
      inventory_analysis: <FileBarChart className="h-6 w-6 text-amber-600" />,
      customer_insights: <FileBarChart className="h-6 w-6 text-purple-600" />,
      market_trends: <FileBarChart className="h-6 w-6 text-indigo-600" />
    };
    
    return iconMap[type] || <FileText className="h-6 w-6 text-gray-600" />;
  };
  
  // Mapping pentru badge-uri bazate pe tipul raportului
  const getReportBadge = (type: string) => {
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

  return (
    <AIModuleLayout
      title={isLoading ? "Încărcare raport..." : (report?.name || "Raport necunoscut")}
      description={isLoading ? "" : (report?.description || "Raport generat cu AI")}
      toolbarItems={
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/ai/reports")}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Înapoi la rapoarte
          </Button>
        </div>
      }
    >
      {/* Starea de încărcare */}
      {isLoading && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Eroare */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Eroare la încărcarea raportului</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Eroare necunoscută'}
          </AlertDescription>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCcw className="h-4 w-4 mr-1" />
              Reîncearcă
            </Button>
          </div>
        </Alert>
      )}
      
      {/* Raportul negăsit */}
      {!isLoading && !error && !report && (
        <AIEmptyState
          title="Raport negăsit"
          description="Raportul căutat nu a putut fi găsit sau nu mai este disponibil."
          icon={<File className="h-10 w-10 text-gray-400" />}
          primaryAction={{
            label: "Înapoi la rapoarte",
            href: "/ai/reports"
          }}
          variant="centered"
        />
      )}
      
      {/* Detalii raport */}
      {!isLoading && !error && report && (
        <div className="space-y-6">
          {/* Header cu informații generale */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  {getReportIcon(report.type)}
                  <CardTitle className="ml-2 text-2xl">{report.name}</CardTitle>
                </div>
                {getReportBadge(report.type)}
              </div>
              <CardDescription className="flex items-center mt-2">
                <Clock className="h-4 w-4 mr-1" />
                <span>Generat pe {formatDate(report.createdAt)}</span>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-3">
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" size="sm" onClick={downloadAsPDF}>
                  <Download className="h-4 w-4 mr-1" />
                  Descarcă PDF
                </Button>
                
                <Button variant="outline" size="sm" onClick={printReport}>
                  <Printer className="h-4 w-4 mr-1" />
                  Tipărește
                </Button>
                
                <Button variant="outline" size="sm" onClick={shareReport}>
                  <Share2 className="h-4 w-4 mr-1" />
                  Distribuie
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Conținut raport cu tab-uri */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="report">Raport complet</TabsTrigger>
              <TabsTrigger value="charts">Grafice</TabsTrigger>
              <TabsTrigger value="summary">Rezumat</TabsTrigger>
            </TabsList>
            
            <TabsContent value="report" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Raport complet</CardTitle>
                  <CardDescription>
                    Raport generat pe baza datelor furnizate prin inteligență artificială
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="prose max-w-none">
                    {renderReportContent(report.content)}
                  </div>
                </CardContent>
                
                <CardFooter className="border-t pt-6 flex justify-between text-sm text-gray-500">
                  <div>Raport generat cu AI Genius</div>
                  <div>ID: {report.id}</div>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="charts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vizualizări grafice</CardTitle>
                  <CardDescription>
                    Reprezentări vizuale ale datelor din raport
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="text-center py-12 px-4">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                      <BarChart className="h-10 w-10 text-gray-500" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium">Grafice indisponibile</h3>
                    <p className="mt-2 text-gray-500">
                      Această versiune a raportului nu include reprezentări grafice.
                      <br/>În viitoarele actualizări, aici vor fi disponibile grafice generate automat.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rezumat executiv</CardTitle>
                  <CardDescription>
                    O privire de ansamblu asupra celor mai importante informații
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="prose">
                    <div className="bg-slate-50 p-4 rounded-lg border mb-6">
                      <h3 className="text-lg font-medium mb-2">Puncte principale</h3>
                      <p>{generateReportSummary(report.content)}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border">
                        <h4 className="font-medium mb-2 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Concluzii cheie
                        </h4>
                        <p className="text-sm text-gray-600">
                          Concluziile principale extrase din raport vor fi disponibile aici.
                        </p>
                      </div>
                      
                      <div className="p-4 rounded-lg border">
                        <h4 className="font-medium mb-2 flex items-center">
                          <LineChart className="h-4 w-4 mr-1" />
                          Tendințe identificate
                        </h4>
                        <p className="text-sm text-gray-600">
                          Tendințele majore identificate în analiză vor fi afișate aici.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </AIModuleLayout>
  );
}