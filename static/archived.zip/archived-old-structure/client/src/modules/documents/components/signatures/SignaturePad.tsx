import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pen, Save, Undo2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SignaturePadProps {
  onSave?: (signatureDataUrl: string) => void;
  width?: number;
  height?: number;
  penColor?: string;
}

/**
 * SignaturePad Component
 * 
 * A digital signature pad component for hand-drawn signatures
 */
const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  width = 400,
  height = 200,
  penColor = '#000000'
}) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  
  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set canvas properties
    context.lineWidth = 2.5;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.strokeStyle = penColor;
    
    setCtx(context);
    
    // Clear canvas initially
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, [penColor]);
  
  // Start drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!ctx) return;
    
    setIsDrawing(true);
    
    // Get mouse/touch position
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  
  // Draw
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx) return;
    
    // Get mouse/touch position
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling on touch devices
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setHasSignature(true);
  };
  
  // Stop drawing
  const stopDrawing = () => {
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };
  
  // Clear canvas
  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    setHasSignature(false);
    
    toast({
      title: "Semnătură ștearsă",
      description: "Semnătura a fost ștearsă cu succes",
    });
  };
  
  // Save signature
  const saveSignature = () => {
    if (!canvasRef.current || !hasSignature) return;
    
    const dataUrl = canvasRef.current.toDataURL('image/png');
    
    if (onSave) {
      onSave(dataUrl);
    }
    
    toast({
      title: "Semnătură salvată",
      description: "Semnătura a fost salvată cu succes",
    });
  };
  
  // Download signature
  const downloadSignature = () => {
    if (!canvasRef.current || !hasSignature) return;
    
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'semnatura.png';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Semnătură descărcată",
      description: "Semnătura a fost descărcată cu succes",
    });
  };
  
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="border rounded-md overflow-hidden">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="bg-white cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        
        <div className="flex justify-between">
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              disabled={!hasSignature}
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Șterge
            </Button>
            
            <Button
              variant="outline" 
              size="sm"
              onClick={downloadSignature}
              disabled={!hasSignature}
            >
              <Download className="h-4 w-4 mr-2" />
              Descarcă
            </Button>
          </div>
          
          <Button
            size="sm"
            onClick={saveSignature}
            disabled={!hasSignature}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvează
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignaturePad;