import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Printer, Download } from 'lucide-react';
import GdprConsentTemplate from './GdprConsentTemplate';
import AccountTermsTemplate from './AccountTermsTemplate';

// Definim interfața pentru employee bazată pe structura tabelei employees din schema HR
interface Employee {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  cnp?: string;
  idSeriesNumber?: string;
  address?: string;
  city?: string;
  county?: string;
  phone?: string;
  position?: string;
}

interface DocumentPreviewProps {
  type: 'gdpr' | 'account-terms';
  employee: Partial<Employee>;
  companyName?: string;
  trigger?: React.ReactNode;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ 
  type, 
  employee, 
  companyName = "Compania Dumneavoastră SRL",
  trigger 
}) => {
  const [open, setOpen] = useState(false);
  
  const handlePrint = () => {
    const printContent = document.getElementById('document-print-content');
    const originalContents = document.body.innerHTML;
    
    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      
      // Reapply event listeners
      setTimeout(() => {
        setOpen(true);
      }, 100);
    }
  };
  
  const handleDownload = () => {
    const printContent = document.getElementById('document-print-content');
    
    if (printContent && window && 'html2pdf' in window) {
      // @ts-ignore - html2pdf library is loaded globally
      window.html2pdf()
        .from(printContent)
        .save(`${type === 'gdpr' ? 'consimtamant-gdpr' : 'acord-utilizare-cont'}-${employee.lastName}-${employee.firstName}.pdf`);
    } else {
      console.warn('html2pdf library not loaded. Document cannot be downloaded as PDF.');
    }
  };
  
  const documentTitle = type === 'gdpr' 
    ? 'Consimțământ GDPR' 
    : 'Acord utilizare cont și sisteme informatice';
  
  const renderDocument = () => {
    switch (type) {
      case 'gdpr':
        return <GdprConsentTemplate employee={employee} companyName={companyName} />;
      case 'account-terms':
        return <AccountTermsTemplate employee={employee} companyName={companyName} />;
      default:
        return <div>Tip de document necunoscut</div>;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <FileText size={16} />
            Previzualizare document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{documentTitle}</DialogTitle>
          <div className="flex justify-end gap-2 py-2">
            <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
              <Printer size={16} />
              Printează
            </Button>
            <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
              <Download size={16} />
              Descarcă PDF
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          <div id="document-print-content">
            {renderDocument()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreview;