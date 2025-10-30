/**
 * Export Data Modal Component
 * 
 * Reusable modal component for exporting data in various formats
 * with customizable settings and callback handling.
 */

import React, { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

interface ExportDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: ExportFormat, includeAll: boolean) => Promise<void> | void;
  title?: string;
  description?: string;
  supportedFormats?: ExportFormat[];
  isExporting?: boolean;
  entityType?: string;
}

const ExportDataModal: React.FC<ExportDataModalProps> = ({
  open,
  onOpenChange,
  onExport,
  title = "Exportă date",
  description = "Exportați datele în formatul dorit.",
  supportedFormats = ['csv', 'xlsx', 'pdf'],
  isExporting = false,
  entityType = "date"
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('xlsx');
  const [includeAllData, setIncludeAllData] = useState<boolean>(false);
  
  const handleExport = async () => {
    await onExport(selectedFormat, includeAllData);
    if (!isExporting) {
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Format export</Label>
            <RadioGroup 
              value={selectedFormat}
              onValueChange={(value) => setSelectedFormat(value as ExportFormat)}
            >
              {supportedFormats.includes('csv') && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv">CSV (Comma Separated Values)</Label>
                </div>
              )}
              {supportedFormats.includes('xlsx') && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="xlsx" id="xlsx" />
                  <Label htmlFor="xlsx">Excel (.xlsx)</Label>
                </div>
              )}
              {supportedFormats.includes('pdf') && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf">PDF</Label>
                </div>
              )}
            </RadioGroup>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeAll" 
              checked={includeAllData}
              onCheckedChange={(checked) => setIncludeAllData(!!checked)}
            />
            <Label htmlFor="includeAll">Exportă toate {entityType}, nu doar pagina curentă</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Anulează
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? `Se exportă...` : `Exportă ${entityType}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDataModal;