import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText, Images, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OcrUploaderProps {
  onResultsReceived?: (text: string, confidence: number) => void;
}

/**
 * OCR Uploader Component
 * 
 * Allows users to upload images for OCR text extraction
 */
const OcrUploader: React.FC<OcrUploaderProps> = ({ onResultsReceived }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Check if file is an image
    if (!selectedFile.type.startsWith('image/')) {
      toast({
        title: "Fișier invalid",
        description: "Vă rugăm să încărcați o imagine (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    // Set selected file and create preview
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };
  
  // Handle OCR processing
  const handleProcessOcr = () => {
    if (!file) {
      toast({
        title: "Lipsă fișier",
        description: "Vă rugăm să încărcați o imagine pentru a fi procesată",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate OCR processing with a timeout
    setTimeout(() => {
      const sampleText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. In hac habitasse platea dictumst. Sed euismod, urna eu tincidunt consectetur, neque nunc tincidunt nisi, euismod.";
      const sampleConfidence = 0.93;
      
      setIsProcessing(false);
      
      toast({
        title: "OCR finalizat",
        description: "Textul a fost extras cu succes din imagine",
      });
      
      if (onResultsReceived) {
        onResultsReceived(sampleText, sampleConfidence);
      }
    }, 2500);
  };
  
  // Reset the uploader
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setIsProcessing(false);
  };
  
  return (
    <Card className="border">
      <CardContent className="p-4 space-y-4">
        {!file ? (
          <div className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
               onClick={() => document.getElementById('ocr-file-input')?.click()}>
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">Faceți clic pentru a încărca o imagine</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, TIFF, BMP (max. 10MB)</p>
            <input
              id="ocr-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-md p-4 bg-muted/20">
              {preview && (
                <div className="relative">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="max-h-[300px] mx-auto rounded-sm" 
                  />
                  <div className="absolute top-2 right-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-background/80 backdrop-blur-sm" 
                      onClick={handleReset}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={handleProcessOcr} 
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesare...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Extrage text
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OcrUploader;