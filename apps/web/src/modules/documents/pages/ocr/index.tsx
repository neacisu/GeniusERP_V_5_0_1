/**
 * Document OCR Page
 * 
 * Optical Character Recognition functionality for extracting text from documents
 * with automatic field detection and data extraction.
 */

import React, { useState } from 'react';
import DocumentsModuleLayout from '../../components/common/DocumentsModuleLayout';
import OcrUploader from '../../components/ocr/OcrUploader';
import OcrResultsViewer from '../../components/ocr/OcrResultsViewer';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  FileText,
  Image,
  ScanText,
  LayoutGrid,
  CheckCircle,
  Info,
  AlertCircle
} from 'lucide-react';

/**
 * Document OCR Page Component
 */
const OCRPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // In a real application, this would handle file uploads
    toast({
      title: "Fișier încărcat",
      description: "Fișierul a fost încărcat cu succes și este gata pentru procesare OCR",
    });
  };
  
  const startOCRProcessing = () => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    // Simulate OCR processing
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          
          toast({
            title: "Procesare OCR completă",
            description: "Textul a fost extras cu succes din document",
          });
          
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };
  
  return (
    <DocumentsModuleLayout activeTab="ocr">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mx-4 mt-4">
          <div>
            <h2 className="text-2xl font-bold">OCR Documente</h2>
            <p className="text-sm text-muted-foreground">
              Scanați documente și extrageți automat informații structurate
            </p>
          </div>
          
          <Button onClick={startOCRProcessing} disabled={isProcessing}>
            <ScanText className="h-4 w-4 mr-2" />
            Procesare OCR
          </Button>
        </div>
        
        {/* Main content */}
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Încărcare</TabsTrigger>
              <TabsTrigger value="process">Procesare</TabsTrigger>
              <TabsTrigger value="results">Rezultate</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Încărcare Document</CardTitle>
                  <CardDescription>
                    Încărcați un document pentru recunoaștere text și extragere de date
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <OcrUploader 
                    onResultsReceived={(text, confidence) => {
                      toast({
                        title: "OCR finalizat",
                        description: `Textul a fost extras cu o acuratețe de ${Math.round(confidence * 100)}%`,
                      });
                      setActiveTab('results');
                    }}
                  />
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card className="p-4 flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div className="flex-1">
                        <h4 className="font-medium">Facturi și documente financiare</h4>
                        <p className="text-sm text-muted-foreground">Extragere automată a câmpurilor relevante</p>
                      </div>
                    </Card>
                    
                    <Card className="p-4 flex items-center gap-3">
                      <Image className="h-8 w-8 text-purple-500" />
                      <div className="flex-1">
                        <h4 className="font-medium">Documente scanate</h4>
                        <p className="text-sm text-muted-foreground">Recunoaștere text din documente scanate</p>
                      </div>
                    </Card>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setActiveTab('process')}
                  >
                    Continuă
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="process" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Procesare OCR</CardTitle>
                  <CardDescription>
                    Recunoaștere optică de caractere și extragere structurată de date
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Progres procesare</span>
                      <span className="text-sm">{processingProgress}%</span>
                    </div>
                    <Progress value={processingProgress} />
                  </div>
                  
                  {isProcessing ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-amber-500">
                        <Info className="h-5 w-5" />
                        <span>Procesarea poate dura câteva momente, în funcție de complexitatea documentului</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Detectare pagini</span>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>
                          <Progress value={100} />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Preprocesare imagini</span>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>
                          <Progress value={100} />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Recunoaștere text</span>
                            {processingProgress > 60 ? 
                              <CheckCircle className="h-4 w-4 text-green-500" /> : 
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            }
                          </div>
                          <Progress value={processingProgress > 60 ? 100 : (processingProgress * 1.6)} />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Extragere date structurate</span>
                            {processingProgress > 80 ? 
                              <CheckCircle className="h-4 w-4 text-green-500" /> : 
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            }
                          </div>
                          <Progress value={processingProgress > 80 ? 100 : (processingProgress * 1.25)} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <ScanText className="h-16 w-16 mx-auto text-primary mb-4" />
                      <h3 className="text-lg font-medium mb-2">Gata de procesare OCR</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                        Documentul dvs. este pregătit pentru procesare. Apăsați butonul de mai jos pentru a începe extragerea textului și datelor.
                      </p>
                      <Button onClick={startOCRProcessing}>
                        Începe procesarea
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('upload')}
                  >
                    Înapoi
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab('results')}
                    disabled={processingProgress < 100}
                  >
                    Vezi rezultatele
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="results" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rezultate OCR</CardTitle>
                  <CardDescription>
                    Text extras și date structurate din document
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="text">
                    <TabsList>
                      <TabsTrigger value="text">Text extrasă</TabsTrigger>
                      <TabsTrigger value="structured">Date structurate</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="text" className="mt-4">
                      <OcrResultsViewer
                        text={`FACTURĂ FISCALĂ
Seria F-2025 Număr 0043
Data: 04.03.2025

FURNIZOR: ABC Tech Solutions SRL
Adresa: Str. Virtuală, nr. 123, București
CIF: RO12345678
Reg. Com.: J40/1234/2020
Cont: RO12BTRL12345678901234567
Banca: Banca Transilvania

CUMPĂRĂTOR: Firma Exemplu SRL
Adresa: Str. Exemplu, nr. 456, București
CIF: RO87654321
Reg. Com.: J40/5678/2019

Nr. | Denumire produs/serviciu | UM | Cant. | Preț unitar | Valoare | TVA
----|---------------------------|----|----- -|-------------|---------|-----
1 | Servicii consultanță IT | ore | 25 | 50.00 | 1,250.00 | 237.50

Total fără TVA: 1,250.00 RON
Total TVA (19%): 237.50 RON
TOTAL: 1,487.50 RON

Semnătura și ștampila furnizorului,
[semnătură]`}
                        confidence={0.94}
                      />
                    </TabsContent>
                    
                    <TabsContent value="structured" className="mt-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Câmpuri detectate</h3>
                          <Button variant="outline" size="sm">
                            <LayoutGrid className="h-4 w-4 mr-2" />
                            Editare șablon
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Tipul documentului</Label>
                            <Input value="Factură" readOnly />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Număr document</Label>
                            <Input value="F-2025-0043" readOnly />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Dată emitere</Label>
                            <Input value="04.03.2025" readOnly />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Furnizor</Label>
                            <Input value="ABC Tech Solutions SRL" readOnly />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>CIF/CUI</Label>
                            <Input value="RO12345678" readOnly />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Valoare totală</Label>
                            <Input value="1,250.00 RON" readOnly />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>TVA</Label>
                            <Input value="237.50 RON (19%)" readOnly />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('process')}
                  >
                    Înapoi
                  </Button>
                  
                  <div className="space-x-2">
                    <Button variant="outline">
                      Salvează date
                    </Button>
                    <Button>
                      Înregistrează document
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DocumentsModuleLayout>
  );
};

export default OCRPage;