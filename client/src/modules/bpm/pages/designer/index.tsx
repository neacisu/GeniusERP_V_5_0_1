/**
 * BPM Process Designer Page
 * 
 * Pagina pentru designul vizual al proceselor
 */

import React, { useState } from 'react';
import { BPMModuleLayout } from '../../components/common/BPMModuleLayout';
import { ProcessDesigner } from '../../components/designer/ProcessDesigner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Save, 
  Play, 
  ArrowLeft,
  Download,
  Settings,
  Check,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
  LayoutGrid,
  GitBranch
} from 'lucide-react';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function DesignerPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showPropertiesDialog, setShowPropertiesDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  
  // Process ID from URL
  const processId = params?.id;
  
  // Content for validation tab
  const validationErrors = [
    { type: 'warning', message: 'No error handling for task "Validate Invoice"' },
    { type: 'info', message: 'Consider adding timeout handling for approval tasks' },
  ];
  
  // Handle save process
  const handleSaveProcess = () => {
    toast({
      title: 'Proces salvat',
      description: 'Procesul a fost salvat cu succes.',
    });
  };
  
  // Handle validate process
  const handleValidateProcess = () => {
    setShowValidationDialog(true);
  };
  
  // Handle deploy process
  const handleDeployProcess = () => {
    toast({
      title: 'Proces publicat',
      description: 'Procesul a fost publicat cu succes și este acum disponibil pentru execuție.',
    });
  };
  
  // Handle back to processes list
  const handleBack = () => {
    navigate('/bpm/processes');
  };
  
  // Handle start process
  const handleStartProcess = () => {
    toast({
      title: 'Proces inițiat',
      description: 'Procesul a fost inițiat cu succes.',
    });
  };
  
  // Handle zoom in
  const handleZoomIn = () => {
    // Implementation for zooming in would go here
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    // Implementation for zooming out would go here
  };
  
  // Handle fit to screen
  const handleFitToScreen = () => {
    // Implementation for fitting to screen would go here
  };
  
  // Handle toggle grid
  const handleToggleGrid = () => {
    // Implementation for toggling grid would go here
  };
  
  // Handle undo
  const handleUndo = () => {
    // Implementation for undo would go here
  };
  
  // Handle redo
  const handleRedo = () => {
    // Implementation for redo would go here
  };
  
  // Handle process properties
  const handleProcessProperties = () => {
    setShowPropertiesDialog(true);
  };
  
  // Toggle between edit and preview mode
  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };
  
  return (
    <BPMModuleLayout activeTab="processes" className="p-0">
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Designer Toolbar */}
        <div className="flex justify-between items-center border-b p-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-medium flex items-center">
                <GitBranch className="h-5 w-5 mr-1.5 text-primary" />
                {processId ? 'Editare proces' : 'Creare proces nou'}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="mr-6">
              <Button 
                variant={isEditMode ? "default" : "outline"} 
                onClick={handleToggleEditMode}
                className="mr-2"
                size="sm"
              >
                {isEditMode ? "Mod editare" : "Mod previzualizare"}
              </Button>
            </div>
            
            <div className="border-r mr-4 pr-4">
              <Button
                variant="outline"
                size="icon"
                className="mr-1"
                onClick={handleUndo}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="mr-1"
                onClick={handleRedo}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="mr-1"
                onClick={handleZoomIn}
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="mr-1"
                onClick={handleZoomOut}
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="mr-1"
                onClick={handleFitToScreen}
                title="Fit to screen"
              >
                <Maximize className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleGrid}
                title="Toggle grid"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleProcessProperties}
              >
                <Settings className="h-4 w-4 mr-2" />
                Proprietăți
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleValidateProcess}
              >
                <Check className="h-4 w-4 mr-2" />
                Validează
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveProcess}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvează
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleDeployProcess}
              >
                <Download className="h-4 w-4 mr-2" />
                Publică
              </Button>
              {processId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartProcess}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Rulează
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Process Designer */}
        <div className="flex-1 overflow-hidden">
          <ProcessDesigner />
        </div>
      </div>
      
      {/* Validation Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Validare Proces</DialogTitle>
            <DialogDescription>
              Verificare pentru probleme potențiale în designul procesului.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Tabs defaultValue="issues">
              <TabsList className="mb-4">
                <TabsTrigger value="issues">Probleme</TabsTrigger>
                <TabsTrigger value="statistics">Statistici</TabsTrigger>
              </TabsList>
              <TabsContent value="issues">
                {validationErrors.length === 0 ? (
                  <div className="p-4 border rounded-md bg-green-50 dark:bg-green-950">
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-600 mr-2" />
                      <p className="text-green-700 dark:text-green-400">Procesul este valid și poate fi publicat.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {validationErrors.map((error, index) => (
                      <div key={index} className={`p-3 border rounded-md ${
                        error.type === 'error' ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900' : 
                        error.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900' : 
                        'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900'
                      }`}>
                        <p className={`text-sm ${
                          error.type === 'error' ? 'text-red-700 dark:text-red-400' : 
                          error.type === 'warning' ? 'text-amber-700 dark:text-amber-400' : 
                          'text-blue-700 dark:text-blue-400'
                        }`}>
                          {error.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="statistics">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border rounded-md p-3">
                      <p className="text-sm text-muted-foreground">Total noduri</p>
                      <p className="text-lg font-medium">12</p>
                    </div>
                    <div className="border rounded-md p-3">
                      <p className="text-sm text-muted-foreground">Total conexiuni</p>
                      <p className="text-lg font-medium">14</p>
                    </div>
                    <div className="border rounded-md p-3">
                      <p className="text-sm text-muted-foreground">Complexitate</p>
                      <p className="text-lg font-medium">Medie</p>
                    </div>
                  </div>
                  <div className="border rounded-md p-3">
                    <p className="text-sm text-muted-foreground">Distribuție noduri</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Activități</span>
                        <span className="text-xs font-medium">6</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Decizii</span>
                        <span className="text-xs font-medium">3</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Evenimente</span>
                        <span className="text-xs font-medium">2</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Gateway-uri</span>
                        <span className="text-xs font-medium">1</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidationDialog(false)}>
              Închide
            </Button>
            <Button onClick={() => setShowValidationDialog(false)}>
              Rezolvă probleme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Process Properties Dialog */}
      <Dialog open={showPropertiesDialog} onOpenChange={setShowPropertiesDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Proprietăți Proces</DialogTitle>
            <DialogDescription>
              Configurați proprietățile generale ale procesului.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nume</Label>
              <Input id="name" defaultValue="Invoice Processing" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                rows={3}
                defaultValue="Process for reviewing and approving customer invoices before they are sent out."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="version">Versiune</Label>
                <Input id="version" defaultValue="1.0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Input id="status" defaultValue="Draft" disabled />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner">Proprietar</Label>
              <Input id="owner" defaultValue="Admin User" />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPropertiesDialog(false)}>
              Anulează
            </Button>
            <Button onClick={() => setShowPropertiesDialog(false)}>
              Salvează proprietăți
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BPMModuleLayout>
  );
}