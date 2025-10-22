/**
 * Pagina principală Inbox AI
 * 
 * Această pagină afișează funcționalitățile de AI pentru inbox,
 * inclusiv analiza sentimentelor, sugestii de răspunsuri și prioritizare.
 */

import React, { useState } from "react";
import { useEmailAnalysis, useSentimentAnalysis } from "../../hooks/useInboxAI";
import { AIModuleLayout } from "../../components/common/AIModuleLayout";
import { AIEmptyState } from "../../components/common/AIEmptyState";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Inbox, 
  MessageSquare, 
  Search, 
  Filter, 
  Mail, 
  AlertTriangle, 
  MailCheck, 
  Clock, 
  Tag, 
  ArrowRight, 
  Reply, 
  MailPlus,
  CheckCircle2,
  CircleDot,
  AlertCircle
} from "lucide-react";

export default function InboxAIPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  
  const { data: emailsResponse, isLoading } = useEmailAnalysis();
  const messages = emailsResponse?.data?.messages || [];
  
  // Filtrare după tab activ și query
  const filteredMessages = messages.filter(message => {
    // Filtrare după tab
    if (activeTab === "unread" && message.isRead) return false;
    if (activeTab === "high_priority" && message.priority !== "high") return false;
    
    // Filtrare după text
    const searchLower = searchQuery.toLowerCase();
    return (
      message.subject.toLowerCase().includes(searchLower) ||
      message.sender.toLowerCase().includes(searchLower) ||
      message.content.toLowerCase().includes(searchLower)
    );
  });
  
  // Găsim mesajul selectat
  const selectedMessage = selectedMessageId 
    ? messages.find(m => m.id === selectedMessageId) 
    : null;
  
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
  
  // Obține culoarea badge-ului pentru sentiment
  const getSentimentColor = (sentiment: string) => {
    switch(sentiment) {
      case 'positive':
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
      case 'neutral':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case 'negative':
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case 'urgent':
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  // Obține culoarea badge-ului pentru categorie
  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'inquiry':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case 'complaint':
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case 'feedback':
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case 'request':
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case 'other':
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  // Obține icon pentru sentiment
  const getSentimentIcon = (sentiment: string) => {
    switch(sentiment) {
      case 'positive':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'neutral':
        return <CircleDot className="h-4 w-4 text-blue-600" />;
      case 'negative':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return <CircleDot className="h-4 w-4 text-gray-600" />;
    }
  };
  
  // Obține numele pentru sentiment
  const getSentimentName = (sentiment: string) => {
    switch(sentiment) {
      case 'positive':
        return "Pozitiv";
      case 'neutral':
        return "Neutru";
      case 'negative':
        return "Negativ";
      case 'urgent':
        return "Urgent";
      default:
        return "Necunoscut";
    }
  };
  
  // Obține numele pentru categorie
  const getCategoryName = (category: string) => {
    switch(category) {
      case 'inquiry':
        return "Solicitare informații";
      case 'complaint':
        return "Plângere";
      case 'feedback':
        return "Feedback";
      case 'request':
        return "Cerere";
      case 'other':
      default:
        return "Altele";
    }
  };
  
  return (
    <AIModuleLayout
      title="Inbox AI"
      description="Analiză inteligentă și răspunsuri automate pentru email-uri"
    >
      <div className="flex flex-col lg:flex-row h-[calc(100vh-14rem)] gap-6">
        {/* Panou stânga - Lista de email-uri */}
        <div className="lg:w-2/5 h-full flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="all">Toate</TabsTrigger>
                <TabsTrigger value="unread">Necitite</TabsTrigger>
                <TabsTrigger value="high_priority">Prioritare</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Caută în mesaje..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1 border rounded-md">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-3 border rounded-md space-y-2">
                    <div className="flex justify-between">
                      <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-1/5 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-full h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {filteredMessages.length === 0 ? (
                  <div className="p-8 flex flex-col items-center justify-center h-full">
                    <Mail className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-center mb-2">
                      Nu am găsit mesaje care să corespundă criteriilor
                    </h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Încearcă să modifici criteriile de căutare sau de filtrare.
                    </p>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredMessages.map(message => (
                      <div 
                        key={message.id}
                        className={`p-3 border rounded-md mb-2 cursor-pointer transition-colors ${
                          selectedMessageId === message.id ? 'bg-slate-50 border-slate-300' : 
                          !message.isRead ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedMessageId(message.id)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium truncate flex-1">
                            {!message.isRead && (
                              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                            )}
                            {message.subject}
                          </div>
                          <Badge className={getSentimentColor(message.sentiment)}>
                            {getSentimentName(message.sentiment)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-1 flex justify-between">
                          <span className="truncate flex-1">{message.sender}</span>
                          <span className="text-xs whitespace-nowrap">{formatDate(message.receivedAt)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground truncate">{message.content.substring(0, 80)}...</p>
                          <Badge variant="outline" className="ml-2 whitespace-nowrap">
                            {getCategoryName(message.category)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </ScrollArea>
          
          <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
            <div>
              {isLoading ? (
                <span>Încărcare...</span>
              ) : (
                <span>{filteredMessages.length} mesaje afișate</span>
              )}
            </div>
            
            <div className="flex gap-4">
              <div className="flex items-center">
                <CircleDot className="h-3 w-3 text-blue-600 mr-1" />
                <span>{emailsResponse?.data?.unreadCount || 0} necitite</span>
              </div>
              <div className="flex items-center">
                <AlertTriangle className="h-3 w-3 text-amber-600 mr-1" />
                <span>{emailsResponse?.data?.priorityCount?.high || 0} prioritare</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Panou dreapta - Detalii email */}
        <div className="lg:w-3/5 h-full">
          {selectedMessage ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-1">
                  <CardTitle>{selectedMessage.subject}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getSentimentColor(selectedMessage.sentiment)}>
                      {getSentimentName(selectedMessage.sentiment)}
                    </Badge>
                    <Badge className={getCategoryColor(selectedMessage.category)}>
                      {getCategoryName(selectedMessage.category)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <CardDescription>
                    <span className="block">De la: <span className="text-foreground">{selectedMessage.sender}</span></span>
                    <span className="block">Către: <span className="text-foreground">{selectedMessage.recipients.join(', ')}</span></span>
                  </CardDescription>
                  <span className="text-xs text-muted-foreground">{formatDate(selectedMessage.receivedAt)}</span>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-auto pb-0">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6">
                    <div className="border rounded-md p-4 bg-slate-50">
                      <div className="flex items-center mb-2">
                        <MessageSquare className="h-4 w-4 text-primary mr-2" />
                        <h3 className="font-semibold text-sm">Conținut Email</h3>
                      </div>
                      <p className="text-sm whitespace-pre-line">{selectedMessage.content}</p>
                    </div>
                    
                    {/* Analiză AI */}
                    <div>
                      <div className="flex items-center mb-2">
                        <Tag className="h-4 w-4 text-primary mr-2" />
                        <h3 className="font-semibold text-sm">Analiză AI</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="border rounded-md p-3">
                          <h4 className="text-xs font-medium mb-1 text-muted-foreground">Sentiment detectat</h4>
                          <div className="flex items-center">
                            {getSentimentIcon(selectedMessage.sentiment)}
                            <span className="text-sm ml-1.5">{getSentimentName(selectedMessage.sentiment)}</span>
                          </div>
                        </div>
                        
                        <div className="border rounded-md p-3">
                          <h4 className="text-xs font-medium mb-1 text-muted-foreground">Categorie</h4>
                          <span className="text-sm">{getCategoryName(selectedMessage.category)}</span>
                        </div>
                        
                        <div className="border rounded-md p-3">
                          <h4 className="text-xs font-medium mb-1 text-muted-foreground">Prioritate</h4>
                          <span className="text-sm">
                            {selectedMessage.priority === 'high' && 'Ridicată'}
                            {selectedMessage.priority === 'medium' && 'Medie'}
                            {selectedMessage.priority === 'low' && 'Scăzută'}
                          </span>
                        </div>
                        
                        <div className="border rounded-md p-3">
                          <h4 className="text-xs font-medium mb-1 text-muted-foreground">Status</h4>
                          <span className="text-sm">{selectedMessage.isRead ? 'Citit' : 'Necitit'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Răspuns sugerat */}
                    {selectedMessage.suggestedResponse && (
                      <div>
                        <div className="flex items-center mb-2">
                          <MailCheck className="h-4 w-4 text-primary mr-2" />
                          <h3 className="font-semibold text-sm">Răspuns sugerat de AI</h3>
                        </div>
                        
                        <div className="border rounded-md p-4 bg-primary/5">
                          <p className="text-sm whitespace-pre-line">{selectedMessage.suggestedResponse}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              
              <CardFooter className="border-t py-3 mt-4">
                <div className="flex justify-between w-full">
                  {!selectedMessage.suggestedResponse ? (
                    <Button variant="outline" className="gap-1">
                      <MailPlus className="h-4 w-4" />
                      <span>Generează răspuns</span>
                    </Button>
                  ) : (
                    <Button variant="outline" className="gap-1">
                      <MailPlus className="h-4 w-4" />
                      <span>Generează alt răspuns</span>
                    </Button>
                  )}
                  
                  {selectedMessage.suggestedResponse && (
                    <Button className="gap-1">
                      <Reply className="h-4 w-4" />
                      <span>Utilizează răspunsul sugerat</span>
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ) : (
            <AIEmptyState
              title="Selectează un mesaj pentru a vedea detaliile"
              description="Alege un mesaj din lista de email-uri pentru a vedea analiza detaliată și sugestiile de răspuns generate de AI."
              icon={<Inbox className="h-12 w-12 text-gray-400" />}
              variant="centered"
            />
          )}
        </div>
      </div>
    </AIModuleLayout>
  );
}