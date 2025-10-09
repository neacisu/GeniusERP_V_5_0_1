/**
 * AI Module Dashboard Page
 * 
 * Pagina principală a modulului AI care prezintă o privire de ansamblu
 * asupra tuturor funcționalităților și statistici relevante.
 */

import React from "react";
import { Link } from "wouter";
import { useAIStats } from "../hooks/useAIStats";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { AIOverviewCard } from "../components/common/AIOverviewCard";
import { AIEmptyState } from "../components/common/AIEmptyState";
import { Button } from "@/components/ui/button";
import {
  FileBarChart,
  FileText,
  LineChart,
  BarChart,
  MessageSquare,
  Sparkles,
  Lightbulb,
  Bot,
  Mail,
  ShoppingBag
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AIModuleLayout } from "../components/common/AIModuleLayout";

export default function DashboardPage() {
  const { data: statsData, isLoading } = useAIStats();
  
  // Statisticile de utilizare a modulului AI
  const moduleStats = [
    { 
      name: "Rapoarte generate", 
      value: statsData?.reports?.count || 0, 
      change: statsData?.reports?.change || 0,
      icon: <FileBarChart className="h-5 w-5 text-purple-600" />,
      color: "bg-purple-100 text-purple-800"
    },
    { 
      name: "Analiză lead-uri", 
      value: statsData?.leads?.count || 0, 
      change: statsData?.leads?.change || 0,
      icon: <LineChart className="h-5 w-5 text-blue-600" />,
      color: "bg-blue-100 text-blue-800"
    },
    { 
      name: "Sugestii email", 
      value: statsData?.emails?.count || 0, 
      change: statsData?.emails?.change || 0,
      icon: <Mail className="h-5 w-5 text-amber-600" />,
      color: "bg-amber-100 text-amber-800"
    },
    { 
      name: "Asistență produse", 
      value: statsData?.products?.count || 0, 
      change: statsData?.products?.change || 0,
      icon: <ShoppingBag className="h-5 w-5 text-green-600" />,
      color: "bg-green-100 text-green-800"
    }
  ];

  return (
    <AIModuleLayout
      title="AI Genius"
      description="Inteligență artificială pentru afacerea ta"
      toolbarItems={
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          Activează funcții noi
        </Button>
      }
    >
      
      {/* Statistici principale */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {moduleStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-md ${stat.color}`}>
                  {stat.icon}
                </div>
                {stat.change !== 0 && (
                  <div className={`text-xs font-medium ${stat.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change > 0 ? '+' : ''}{stat.change}%
                  </div>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-sm text-gray-500">{stat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Acces rapid la module */}
      <h2 className="text-xl font-bold mb-4">Module AI</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <AIOverviewCard
          title="Rapoarte Inteligente"
          description="Generează rapoarte complexe folosind AI din toate datele companiei tale"
          icon={<FileText className="h-5 w-5 text-purple-600" />}
          features={[
            "Analiză performanță vânzări",
            "Rapoarte financiare detaliate",
            "Analiză stocuri și produse",
            "Insights clienți și piață"
          ]}
          status="active"
          actionLink="/ai/reports"
          variant="highlight"
        />
        
        <AIOverviewCard
          title="Asistență Vânzări"
          description="Maximizează rezultatele echipei de vânzări cu sugestii inteligente"
          icon={<BarChart className="h-5 w-5 text-blue-600" />}
          features={[
            "Scoring lead-uri",
            "Recomandări upsell/cross-sell",
            "Analiză pipeline vânzări",
            "Predicții de închidere"
          ]}
          status="active"
          actionLink="#"
        />
        
        <AIOverviewCard
          title="Inbox Inteligent"
          description="Gestionează comunicarea cu sugestii și analiză automatizată"
          icon={<MessageSquare className="h-5 w-5 text-amber-600" />}
          features={[
            "Sugestii de răspunsuri",
            "Prioritizare automată",
            "Analiză sentimente clienți",
            "Extragere informații cheie"
          ]}
          status="active" 
          actionLink="#"
        />
        
        <AIOverviewCard
          title="Asistent Produse"
          description="Obține răspunsuri și comparații rapide despre produse"
          icon={<Lightbulb className="h-5 w-5 text-green-600" />}
          features={[
            "Răspunsuri despre produse",
            "Recomandări personalizate",
            "Comparații produse similare",
            "Căutare documentație"
          ]}
          status="active"
          actionLink="#"
        />
        
        <AIOverviewCard
          title="Integrare OpenAI"
          description="Conectează-te direct cu modelele OpenAI pentru diverse aplicații"
          icon={<Bot className="h-5 w-5 text-indigo-600" />}
          features={[
            "Chat completion & asistență",
            "Analiză text și documente",
            "Procesare conținut personalizat",
            "Integrare cu alte module"
          ]}
          status="active"
          actionLink="/ai/openai"
        />
      </div>
      
      {/* Secțiuni utile */}
      <Tabs defaultValue="recent" className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Activitate recentă</h2>
          <TabsList>
            <TabsTrigger value="recent">Recente</TabsTrigger>
            <TabsTrigger value="reports">Rapoarte</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="recent">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex justify-between animate-pulse">
                      <div className="w-1/3 h-5 bg-gray-200 rounded"></div>
                      <div className="w-1/4 h-5 bg-gray-200 rounded"></div>
                    </div>
                    <div className="mt-3 w-2/3 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : statsData?.recentActivity?.length ? (
            <div className="space-y-4">
              {statsData.recentActivity.map((activity: { type: string; title: string; description: string }, index: number) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-md mr-3 ${
                          activity.type === 'report' ? 'bg-purple-100' : 
                          activity.type === 'lead' ? 'bg-blue-100' : 
                          activity.type === 'email' ? 'bg-amber-100' : 'bg-green-100'
                        }`}>
                          {activity.type === 'report' ? <FileBarChart className="h-4 w-4 text-purple-600" /> : 
                           activity.type === 'lead' ? <LineChart className="h-4 w-4 text-blue-600" /> : 
                           activity.type === 'email' ? <Mail className="h-4 w-4 text-amber-600" /> : 
                           <Lightbulb className="h-4 w-4 text-green-600" />}
                        </div>
                        <div>
                          <h3 className="font-medium">{activity.title}</h3>
                          <p className="text-sm text-gray-500">{activity.description}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString('ro-RO')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <AIEmptyState 
              title="Nicio activitate recentă"
              description="Activitățile tale recente vor apărea aici. Începe prin generarea unui raport sau folosește oricare dintre funcționalitățile AI."
              primaryAction={{
                label: "Generează primul raport",
                href: "/ai/reports/create"
              }}
              secondaryAction={{
                label: "Explorează module",
                onClick: () => document.getElementById("ai-modules")?.scrollIntoView({ behavior: "smooth" })
              }}
            />
          )}
        </TabsContent>
        
        <TabsContent value="reports">
          <AIEmptyState 
            title="Niciun raport generat încă"
            description="Rapoartele tale generate cu AI vor apărea aici. Creează primul tău raport inteligent acum."
            primaryAction={{
              label: "Creează raport",
              href: "/ai/reports/create"
            }}
            icon={<FileBarChart className="h-12 w-12 text-gray-400" />}
          />
        </TabsContent>
        
        <TabsContent value="insights">
          <AIEmptyState 
            title="Nicio recomandare disponibilă"
            description="Recomandările și insights-urile personalizate vor apărea aici pe măsură ce folosești modulele AI."
            primaryAction={{
              label: "Explorează module AI",
              href: "#"
            }}
            icon={<Sparkles className="h-12 w-12 text-gray-400" />}
          />
        </TabsContent>
      </Tabs>
      
      {/* Resurse */}
      <h2 className="text-xl font-bold mb-4">Resurse și Suport</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ghid de utilizare</CardTitle>
            <CardDescription>
              Învață cum să folosești funcționalitățile AI pentru maximum de eficiență
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="#">
                Vezi ghidul
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Centre de excelență</CardTitle>
            <CardDescription>
              Exemple de implementări și strategii de utilizare AI pentru diverse industrii
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="#">
                Explorează cazuri de utilizare
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configurare avansată</CardTitle>
            <CardDescription>
              Personalizează parametrii modelelor AI pentru nevoile specifice ale afacerii tale
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="#">
                Configurează AI
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AIModuleLayout>
  );
}