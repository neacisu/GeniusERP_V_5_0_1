/**
 * Pagina principală Product QA
 * 
 * Această pagină afișează funcționalitățile de AI pentru Q&A
 * despre produse, generarea de descrieri și analiza compatibilității.
 */

import React, { useState } from "react";
import { useProductQuestions, useGenerateProductAnswer } from "../../hooks/useProductQA";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  HelpCircle, 
  Search, 
  Filter, 
  PenTool, 
  MessageSquare, 
  Clock, 
  BarChart, 
  ArrowRight,
  CheckCircle2,
  HelpingHand,
  FileQuestion,
  Store,
  Tag,
  Book,
  Plus,
  Edit,
  RefreshCw,
  MessageCircle,
  SparkleIcon,
  Lightbulb
} from "lucide-react";

export default function ProductQAPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [filterProduct, setFilterProduct] = useState<string | null>(null);
  
  const { data: questionsResponse, isLoading } = useProductQuestions();
  const questions = questionsResponse?.data?.questions || [];
  const generateAnswer = useGenerateProductAnswer();
  
  // Filtrare după tab activ, produs și query
  const filteredQuestions = questions.filter(question => {
    // Filtrare după tab
    if (activeTab === "pending" && question.status !== "pending") return false;
    if (activeTab === "answered" && question.status !== "answered") return false;
    
    // Filtrare după produs
    if (filterProduct && question.productId !== filterProduct) return false;
    
    // Filtrare după text
    const searchLower = searchQuery.toLowerCase();
    return (
      question.question.toLowerCase().includes(searchLower) ||
      question.productName.toLowerCase().includes(searchLower)
    );
  });
  
  // Găsim întrebarea selectată
  const selectedQuestion = selectedQuestionId 
    ? questions.find(q => q.id === selectedQuestionId) 
    : null;
  
  // Formatare dată
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };
  
  // Obține culoarea badge-ului pentru categorie
  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'specifications':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case 'compatibility':
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
      case 'usage':
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case 'pricing':
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case 'other':
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  // Obține numele pentru categorie
  const getCategoryName = (category: string) => {
    switch(category) {
      case 'specifications':
        return "Specificații";
      case 'compatibility':
        return "Compatibilitate";
      case 'usage':
        return "Utilizare";
      case 'pricing':
        return "Prețuri";
      case 'other':
      default:
        return "Altele";
    }
  };
  
  // Obține icon pentru sursă
  const getSourceIcon = (source: string) => {
    switch(source) {
      case 'customer':
        return <HelpingHand className="h-4 w-4 text-blue-600" />;
      case 'internal':
        return <Store className="h-4 w-4 text-purple-600" />;
      case 'ai_generated':
        return <SparkleIcon className="h-4 w-4 text-amber-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-600" />;
    }
  };
  
  // Obține numele pentru sursă
  const getSourceName = (source: string) => {
    switch(source) {
      case 'customer':
        return "Client";
      case 'internal':
        return "Intern";
      case 'ai_generated':
        return "Generat de AI";
      default:
        return "Necunoscut";
    }
  };
  
  // Funcție pentru generarea unui răspuns pentru o întrebare
  const handleGenerateAnswer = (questionId: string, productId: string, question: string) => {
    generateAnswer.mutate(
      { questionId, productId, question },
      {
        onSuccess: () => {
          toast({
            title: "Răspuns generat cu succes",
            description: "AI-ul a generat un răspuns pentru această întrebare",
          });
        },
        onError: () => {
          toast({
            title: "Eroare la generarea răspunsului",
            description: "A apărut o eroare la generarea răspunsului",
            variant: "destructive",
          });
        }
      }
    );
  };
  
  // Lista unică de produse pentru filtru
  const productOptions = [...new Set(questions.map(q => q.productId))].map(
    productId => {
      const product = questions.find(q => q.productId === productId);
      return {
        id: productId,
        name: product?.productName || productId
      };
    }
  );
  
  return (
    <AIModuleLayout
      title="Product Q&A"
      description="Generează și gestionează răspunsuri la întrebări despre produse"
      toolbarItems={
        <Button asChild>
          <div className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Adaugă întrebare
          </div>
        </Button>
      }
    >
      <div className="flex flex-col lg:flex-row h-[calc(100vh-14rem)] gap-6">
        {/* Panou stânga - Lista de întrebări */}
        <div className="lg:w-2/5 h-full flex flex-col">
          <div className="mb-4 flex items-center gap-4">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="all">Toate</TabsTrigger>
                <TabsTrigger value="pending">Noi</TabsTrigger>
                <TabsTrigger value="answered">Răspunse</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Caută întrebări..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={filterProduct || "all"} onValueChange={setFilterProduct}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="Toate produsele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate produsele</SelectItem>
                {productOptions.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {filteredQuestions.length === 0 ? (
                  <div className="p-8 flex flex-col items-center justify-center h-full">
                    <FileQuestion className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-center mb-2">
                      Nu există întrebări care să corespundă criteriilor
                    </h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Încearcă să modifici criteriile de căutare sau de filtrare.
                    </p>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredQuestions.map(question => (
                      <div 
                        key={question.id}
                        className={`p-3 border rounded-md mb-2 cursor-pointer transition-colors ${
                          selectedQuestionId === question.id ? 'bg-slate-50 border-slate-300' : 
                          question.status === 'pending' ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedQuestionId(question.id)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium truncate flex-1">
                            {question.status === 'pending' && (
                              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                            )}
                            {question.productName}
                          </div>
                          <Badge className={getCategoryColor(question.category)}>
                            {getCategoryName(question.category)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm mb-2">
                          {question.question}
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <div className="flex items-center">
                            {getSourceIcon(question.source)}
                            <span className="ml-1">{getSourceName(question.source)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            <span>{formatDate(question.createdAt)}</span>
                          </div>
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
                <span>{filteredQuestions.length} întrebări afișate</span>
              )}
            </div>
            
            <div className="flex gap-4">
              <div className="flex items-center">
                <HelpCircle className="h-3 w-3 text-blue-600 mr-1" />
                <span>{questionsResponse?.data?.pendingCount || 0} în așteptare</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 mr-1" />
                <span>{questionsResponse?.data?.answeredCount || 0} răspunse</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Panou dreapta - Detalii întrebare */}
        <div className="lg:w-3/5 h-full">
          {selectedQuestion ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-1">
                  <CardTitle>{selectedQuestion.productName}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getCategoryColor(selectedQuestion.category)}>
                      {getCategoryName(selectedQuestion.category)}
                    </Badge>
                    <Badge variant="outline">
                      {selectedQuestion.status === 'pending' && 'În așteptare'}
                      {selectedQuestion.status === 'answered' && 'Răspuns'}
                      {selectedQuestion.status === 'reviewed' && 'Verificat'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex justify-between items-start">
                  <CardDescription>
                    <div className="flex items-center text-sm text-foreground mb-1">
                      <Tag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      {selectedQuestion.productId}
                    </div>
                    <div className="flex items-center text-sm">
                      {getSourceIcon(selectedQuestion.source)}
                      <span className="ml-1.5">{getSourceName(selectedQuestion.source)}</span>
                      <span className="mx-2">•</span>
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      <span>{formatDate(selectedQuestion.createdAt)}</span>
                    </div>
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="pb-0">
                <div className="space-y-6">
                  {/* Întrebare */}
                  <div className="border rounded-md p-4 bg-slate-50">
                    <div className="flex items-center mb-2">
                      <HelpCircle className="h-4 w-4 text-primary mr-2" />
                      <h3 className="font-semibold text-sm">Întrebare</h3>
                    </div>
                    <p className="text-sm">{selectedQuestion.question}</p>
                  </div>
                  
                  {/* Răspuns */}
                  {selectedQuestion.answer ? (
                    <div className="border rounded-md p-4 bg-primary/5">
                      <div className="flex items-center mb-2">
                        <MessageSquare className="h-4 w-4 text-primary mr-2" />
                        <h3 className="font-semibold text-sm">Răspuns</h3>
                        {selectedQuestion.confidence && (
                          <div className="ml-auto">
                            <Badge variant="outline">
                              Încredere: {Math.round(selectedQuestion.confidence * 100)}%
                            </Badge>
                          </div>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-line">{selectedQuestion.answer}</p>
                      
                      <div className="flex justify-end mt-4">
                        <Button variant="outline" size="sm" className="mr-2">
                          <Edit className="h-3.5 w-3.5 mr-1.5" />
                          <span>Editează</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => 
                          handleGenerateAnswer(
                            selectedQuestion.id, 
                            selectedQuestion.productId, 
                            selectedQuestion.question
                          )
                        }>
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                          <span>Regenerează</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                      <Lightbulb className="h-10 w-10 text-amber-400 mb-3" />
                      <h3 className="text-base font-medium mb-1">Niciun răspuns generat încă</h3>
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        Generează un răspuns automat folosind AI sau adaugă un răspuns manual.
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => 
                            handleGenerateAnswer(
                              selectedQuestion.id, 
                              selectedQuestion.productId, 
                              selectedQuestion.question
                            )
                          }
                          disabled={generateAnswer.isPending}
                        >
                          {generateAnswer.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              <span>Generare...</span>
                            </>
                          ) : (
                            <>
                              <SparkleIcon className="h-4 w-4 mr-2" />
                              <span>Generează răspuns cu AI</span>
                            </>
                          )}
                        </Button>
                        <Button variant="outline">
                          <PenTool className="h-4 w-4 mr-2" />
                          <span>Răspunde manual</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t py-3 mt-auto">
                <div className="w-full flex justify-between">
                  <Button variant="outline" className="gap-1" asChild>
                    <div>
                      <Book className="h-4 w-4" />
                      <span>Vizualizează documentația produsului</span>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="gap-1" asChild>
                    <div>
                      <BarChart className="h-4 w-4" />
                      <span>Verifică compatibilitatea</span>
                    </div>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <AIEmptyState
              title="Selectează o întrebare pentru a vedea detaliile"
              description="Alege o întrebare din lista din stânga pentru a vedea detaliile și a genera un răspuns folosind AI."
              icon={<HelpCircle className="h-12 w-12 text-gray-400" />}
              variant="centered"
            />
          )}
        </div>
      </div>
    </AIModuleLayout>
  );
}