import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Copy, Download, Save, Check, FileText, Images } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OcrResultsViewerProps {
  text: string;
  confidence: number;
  originalImage?: string;
}

/**
 * OCR Results Viewer Component
 * 
 * Displays the extracted text from OCR with options to copy, save, and download
 */
const OcrResultsViewer: React.FC<OcrResultsViewerProps> = ({ 
  text,
  confidence,
  originalImage
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('text');
  const [copied, setCopied] = useState(false);
  
  // Copy text to clipboard
  const handleCopyText = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        title: "Text copiat",
        description: "Textul a fost copiat în clipboard",
      });
      
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  // Handle text save
  const handleSaveText = () => {
    toast({
      title: "Text salvat",
      description: "Textul a fost salvat ca document nou",
    });
  };
  
  // Handle text download
  const handleDownloadText = () => {
    const element = document.createElement('a');
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'ocr-rezultat.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Text descărcat",
      description: "Fișierul text a fost descărcat",
    });
  };
  
  // Get confidence level color
  const getConfidenceColor = () => {
    if (confidence >= 0.9) return "bg-green-500";
    if (confidence >= 0.75) return "bg-amber-500";
    return "bg-red-500";
  };
  
  return (
    <Card className="border">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Rezultat OCR</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              Acuratețe: {Math.round(confidence * 100)}%
            </Badge>
            <div className={`h-2 w-2 rounded-full ${getConfidenceColor()}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">
              <FileText className="h-4 w-4 mr-2" />
              Text
            </TabsTrigger>
            <TabsTrigger value="original">
              <Images className="h-4 w-4 mr-2" />
              Original
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="border rounded-md p-4 bg-muted/10 min-h-[200px] max-h-[400px] overflow-y-auto whitespace-pre-wrap font-mono text-sm">
                  {text || 'Nu există text extras'}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="original" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="border rounded-md flex items-center justify-center p-4 bg-muted/10">
                  {originalImage ? (
                    <img 
                      src={originalImage} 
                      alt="Original" 
                      className="max-h-[300px] mx-auto" 
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Images className="h-10 w-10 mx-auto mb-2" />
                      <p>Imaginea originală nu este disponibilă</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={handleCopyText}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copiat' : 'Copiază'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadText}>
            <Download className="h-4 w-4 mr-2" />
            Descarcă
          </Button>
          <Button size="sm" onClick={handleSaveText}>
            <Save className="h-4 w-4 mr-2" />
            Salvează ca document
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OcrResultsViewer;