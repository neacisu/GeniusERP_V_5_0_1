/**
 * BPM Process Designer Component
 * 
 * Componentă pentru designul vizual al proceselor de business
 */

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronRight, 
  Circle, 
  Square, 
  Diamond, 
  CornerUpRight, 
  Workflow, 
  Scissors,
  PenTool,
  MousePointer,
  Grab,
  ArrowUpRight,
  CircleOff,
  CheckCircle
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export function ProcessDesigner() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<string>('select');
  const [panMode, setPanMode] = useState<boolean>(false);
  
  useEffect(() => {
    // Initialize the designer canvas
    const initCanvas = () => {
      // Canvas initialization code would go here
      // In a real implementation, we'd use a library like react-flow or similar
    };
    
    initCanvas();
  }, []);
  
  // Tool selection
  const handleToolSelect = (selectedTool: string) => {
    setTool(selectedTool);
    setPanMode(false);
  };
  
  // Toggle pan mode
  const togglePanMode = () => {
    setPanMode(!panMode);
    if (!panMode) {
      setTool('');
    } else {
      setTool('select');
    }
  };
  
  return (
    <div className="h-full flex">
      {/* Left Sidebar - Tools */}
      <div className="w-14 border-r flex flex-col p-2 gap-2 bg-muted/10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={tool === 'select' ? "secondary" : "ghost"}
                size="icon"
                className="rounded-md"
                onClick={() => handleToolSelect('select')}
              >
                <MousePointer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Selectare (S)</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={panMode ? "secondary" : "ghost"}
                size="icon"
                className="rounded-md"
                onClick={togglePanMode}
              >
                <Grab className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Panoramare (P)</p>
            </TooltipContent>
          </Tooltip>
          
          <Separator className="my-2" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={tool === 'connection' ? "secondary" : "ghost"}
                size="icon"
                className="rounded-md"
                onClick={() => handleToolSelect('connection')}
              >
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Conexiune (C)</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={tool === 'pen' ? "secondary" : "ghost"}
                size="icon"
                className="rounded-md"
                onClick={() => handleToolSelect('pen')}
              >
                <PenTool className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Creion (D)</p>
            </TooltipContent>
          </Tooltip>
          
          <Separator className="my-2" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={tool === 'startEvent' ? "secondary" : "ghost"}
                size="icon"
                className="rounded-md"
                onClick={() => handleToolSelect('startEvent')}
              >
                <Circle className="h-4 w-4 text-green-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Eveniment Start</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={tool === 'endEvent' ? "secondary" : "ghost"}
                size="icon"
                className="rounded-md"
                onClick={() => handleToolSelect('endEvent')}
              >
                <CircleOff className="h-4 w-4 text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Eveniment Sfârșit</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={tool === 'task' ? "secondary" : "ghost"}
                size="icon"
                className="rounded-md"
                onClick={() => handleToolSelect('task')}
              >
                <Square className="h-4 w-4 text-blue-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Activitate</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={tool === 'gateway' ? "secondary" : "ghost"}
                size="icon"
                className="rounded-md"
                onClick={() => handleToolSelect('gateway')}
              >
                <Diamond className="h-4 w-4 text-amber-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Gateway</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={tool === 'subProcess' ? "secondary" : "ghost"}
                size="icon"
                className="rounded-md"
                onClick={() => handleToolSelect('subProcess')}
              >
                <Workflow className="h-4 w-4 text-purple-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Subproces</p>
            </TooltipContent>
          </Tooltip>
          
          <Separator className="my-2" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-md text-red-500"
                onClick={() => handleToolSelect('delete')}
              >
                <Scissors className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Ștergere (Del)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Main Canvas */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 grid bg-[#f8f9fa] dark:bg-muted/10" style={{ backgroundSize: '40px 40px', backgroundImage: 'radial-gradient(circle, #ccc 1px, transparent 1px)', backgroundPosition: '0 0' }}>
          {/* Canvas content */}
          <div ref={canvasRef} className="w-full h-full cursor-default">
            {/* This is a placeholder for the actual canvas */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center space-y-4 text-muted-foreground opacity-50">
              <div className="border-2 border-dashed border-muted-foreground p-10 rounded-md">
                <Workflow className="h-12 w-12" />
              </div>
              <div>
                <p className="text-base">Selectați elemente din bara laterală</p>
                <p className="text-sm">și amplasați-le aici pentru a construi procesul</p>
              </div>
            </div>
            
            {/* Example process elements that would be dynamically rendered */}
            <div className="absolute left-[15%] top-[30%] w-12 h-12 bg-green-100 dark:bg-green-950/40 border-2 border-green-500 rounded-full flex items-center justify-center">
              <Circle className="h-6 w-6 text-green-500" />
            </div>
            
            <div className="absolute left-[40%] top-[30%] w-32 h-16 bg-blue-100 dark:bg-blue-950/40 border-2 border-blue-500 rounded-md flex items-center justify-center">
              <p className="text-sm text-blue-700 dark:text-blue-300">Validare invoice</p>
            </div>
            
            <div className="absolute left-[65%] top-[30%] w-32 h-16 bg-blue-100 dark:bg-blue-950/40 border-2 border-blue-500 rounded-md flex items-center justify-center">
              <p className="text-sm text-blue-700 dark:text-blue-300">Aprobare manager</p>
            </div>
            
            <div className="absolute left-[65%] top-[60%] w-12 h-12 bg-red-100 dark:bg-red-950/40 border-2 border-red-500 rounded-full flex items-center justify-center">
              <CircleOff className="h-6 w-6 text-red-500" />
            </div>
            
            <div className="absolute left-[40%] top-[50%] w-12 h-12 bg-amber-100 dark:bg-amber-950/40 border-2 border-amber-500 rounded-md rotate-45 flex items-center justify-center">
              <div className="rotate-[-45deg]">
                <Diamond className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            
            {/* Arrows connecting the nodes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                </marker>
              </defs>
              
              <path 
                d="M 120,160 L 170,160" 
                stroke="currentColor" 
                strokeWidth="2" 
                fill="none" 
                markerEnd="url(#arrowhead)" 
              />
              
              <path 
                d="M 280,160 L 330,160" 
                stroke="currentColor" 
                strokeWidth="2" 
                fill="none" 
                markerEnd="url(#arrowhead)" 
              />
              
              <path 
                d="M 470,160 L 500,160 L 500,220 L 230,220 L 230,250" 
                stroke="currentColor" 
                strokeWidth="2" 
                fill="none" 
                markerEnd="url(#arrowhead)" 
              />
              
              <path 
                d="M 270,260 L 330,260 L 330,220 L 390,220 L 390,170" 
                stroke="currentColor" 
                strokeWidth="2" 
                fill="none" 
                markerEnd="url(#arrowhead)" 
              />
              
              <path 
                d="M 230,290 L 230,320 L 450,320 L 450,290" 
                stroke="currentColor" 
                strokeWidth="2" 
                fill="none" 
                markerEnd="url(#arrowhead)" 
              />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Right Sidebar - Properties (could be expanded for real implementation) */}
      <div className="w-0 lg:w-80 border-l bg-background overflow-hidden transition-all">
        <ScrollArea className="h-full p-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Proprietăți element</h3>
              <p className="text-sm text-muted-foreground">Selectați un element pentru a-i vedea proprietățile</p>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}