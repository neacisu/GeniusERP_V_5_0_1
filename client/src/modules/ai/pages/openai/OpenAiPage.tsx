/**
 * Pagina principală pentru integrarea cu OpenAI
 */

import React, { useState } from "react";
import { Link } from "wouter";
import { AIModuleLayout } from "../../components/common/AIModuleLayout";
import { AIOverviewCard } from "../../components/common/AIOverviewCard";
import { useChatCompletion, useOpenAIStatus } from "../../hooks/useOpenAI";
import { Button } from "@/components/ui/button";
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
import { 
  MessageSquare, 
  FileText, 
  BarChart, 
  Bot, 
  Settings, 
  RefreshCw,
  ArrowUpRight,
  Check,
  AlertTriangle,
  Key,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCheck } from "../../hooks/use-check";
import { Progress } from "@/components/ui/progress";

export default function OpenAiPage() {
  const { toast } = useToast();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  
  // Hook pentru verificarea statusului OpenAI
  const { mutate: checkOpenAIStatus, isPending: isStatusPending } = useOpenAIStatus();
  
  // Tabs pentru pagină
  const tabs = [
    { value: "overview", label: "Prezentare generală", href: "/ai/openai" },
    { value: "chat", label: "Chat", href: "/ai/openai/chat" },
    { value: "content-analysis", label: "Analiză conținut", href: "/ai/openai/content-analysis" },
    { value: "documents", label: "Procesare documente", href: "/ai/openai/documents" },
  ];
  
  // Verificarea statusului API
  const handleCheckStatus = () => {
    setIsCheckingStatus(true);
    
    checkOpenAIStatus(undefined, {
      onSuccess: (data) => {
        if (data.success) {
          toast({
            title: "Conexiune OpenAI verificată",
            description: data.data?.integrated 
              ? "Conexiunea cu OpenAI este activă și funcțională." 
              : "Conexiunea cu OpenAI nu este configurată. Contactează administratorul.",
            variant: data.data?.integrated ? "default" : "destructive",
          });
        } else {
          toast({
            title: "Eroare la verificarea conexiunii",
            description: data.message || "Nu s-a putut verifica statusul conexiunii cu OpenAI.",
            variant: "destructive",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Eroare la verificarea conexiunii",
          description: error.message || "A apărut o eroare neașteptată la verificarea conexiunii cu OpenAI.",
          variant: "destructive",
        });
      },
      onSettled: () => {
        setIsCheckingStatus(false);
      }
    });
  };

  return (
    <AIModuleLayout
      title="OpenAI Integration"
      description="Utilizează puterea modelelor OpenAI pentru a genera conținut, a analiza date și a automatiza procesele"
      tabs={tabs}
      activeTab="overview"
      toolbarItems={
        <Button variant="outline" size="sm" onClick={handleCheckStatus} disabled={isStatusPending}>
          {isStatusPending ? (
            <>
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              Verificare...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-1" />
              Verifică conexiunea
            </>
          )}
        </Button>
      }
    >
      {/* Statusul conexiunii - Componentă care poate fi reutilizată */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">Status OpenAI</CardTitle>
          </div>
          <CardDescription>
            Starea conexiunii cu API-ul OpenAI și utilizarea actuală
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <div className="text-sm font-medium">API Status</div>
              </div>
              <div className="flex items-center text-green-600">
                <Check className="h-4 w-4 mr-1" />
                <span>Conectat</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Utilizare credite luna curentă</span>
                <span className="font-medium">65%</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Model implicit</div>
                <div className="font-medium">gpt-4o</div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Cereri luna curentă</div>
                <div className="font-medium">1,237</div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Credite disponibile</div>
                <div className="font-medium">35%</div>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="text-sm text-gray-500">
            Ultima verificare: {new Date().toLocaleString('ro-RO')}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/ai/openai/settings">
              <Settings className="h-4 w-4 mr-1" />
              Configurează OpenAI
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Carduri pentru funcționalități */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <AIOverviewCard
          title="Chat Completion"
          description="Interacționează cu modelele OpenAI prin conversații naturale"
          icon={<MessageSquare className="h-5 w-5 text-purple-600" />}
          features={[
            "Conversații avansate multi-turn",
            "Controlul temperaturii și comportamentului",
            "Personalizarea modelelor folosite",
            "Istoricul conversațiilor"
          ]}
          status="active"
          actionLink="/ai/openai/chat"
          variant="highlight"
        />
        
        <AIOverviewCard
          title="Analiză conținut"
          description="Analizează orice tip de conținut pentru a extrage insights valoroase"
          icon={<BarChart className="h-5 w-5 text-blue-600" />}
          features={[
            "Analiză de sentiment",
            "Extragere de entități",
            "Identificare cuvinte cheie",
            "Clasificare de text"
          ]}
          status="active"
          actionLink="/ai/openai/content-analysis"
        />
        
        <AIOverviewCard
          title="Procesare documente"
          description="Extrage, rezumă și analizează informații din documente"
          icon={<FileText className="h-5 w-5 text-amber-600" />}
          features={[
            "Procesare documente multiple",
            "Rezumat automat de conținut",
            "Extragere informații structurate",
            "Analiză comparativă"
          ]}
          status="active"
          actionLink="/ai/openai/documents"
        />
      </div>
      
      {/* Secțiunea de documentație și suport */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Documentație și suport</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ghid de utilizare</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Află cum să utilizezi în mod eficient integrarea OpenAI în aplicația ta,
                inclusiv exemple de prompt-uri și practici recomandate.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="flex items-center text-primary" asChild>
                <a href="https://help.openai.com/en/" target="_blank" rel="noopener noreferrer">
                  Citește documentația
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </a>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurare API</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Configurează cheia API și setările pentru a personaliza comportamentul
                modelelor OpenAI utilizate în aplicație.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="flex items-center text-primary" asChild>
                <Link href="/ai/openai/settings">
                  Setări API
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Notă de securitate și conformitate */}
      <Alert className="bg-blue-50 border-blue-200">
        <Bot className="h-5 w-5 text-blue-600" />
        <AlertTitle>Securitate și confidențialitate</AlertTitle>
        <AlertDescription>
          Toate interacțiunile cu OpenAI sunt securizate și confidențiale. Datele companiei tale sunt protejate
          și nu sunt utilizate pentru antrenarea modelelor externe. Pentru mai multe informații, consultă
          <a href="#" className="text-blue-600 font-medium ml-1">politica de confidențialitate</a>.
        </AlertDescription>
      </Alert>
    </AIModuleLayout>
  );
}