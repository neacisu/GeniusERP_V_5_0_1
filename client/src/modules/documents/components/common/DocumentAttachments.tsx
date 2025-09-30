import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PaperClip,
  File,
  FilePdf,
  FileImage,
  FileText,
  FileSpreadsheet,
  Download,
  Trash2,
  Plus,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface DocumentAttachmentsProps {
  attachments: Attachment[];
  allowUpload?: boolean;
  allowDelete?: boolean;
  onUpload?: (file: File) => void;
  onDelete?: (attachmentId: string) => void;
  onDownload?: (attachment: Attachment) => void;
}

/**
 * Document Attachments Component
 * 
 * Displays and manages document attachments
 */
const DocumentAttachments: React.FC<DocumentAttachmentsProps> = ({
  attachments = [],
  allowUpload = true,
  allowDelete = true,
  onUpload,
  onDelete,
  onDownload
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Get appropriate icon based on file type
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) {
      return <FilePdf className="h-8 w-8 text-red-500" />;
    } else if (type.includes('image')) {
      return <FileImage className="h-8 w-8 text-blue-500" />;
    } else if (type.includes('text') || type.includes('document')) {
      return <FileText className="h-8 w-8 text-amber-500" />;
    } else if (type.includes('sheet') || type.includes('excel')) {
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    } else {
      return <File className="h-8 w-8 text-slate-500" />;
    }
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onUpload) return;
    
    setIsUploading(true);
    
    // Simulate file upload with a timeout
    setTimeout(() => {
      onUpload(files[0]);
      setIsUploading(false);
      
      toast({
        title: "Fișier încărcat",
        description: `${files[0].name} a fost încărcat cu succes`,
      });
      
      // Reset input
      e.target.value = '';
    }, 1500);
  };
  
  // Handle attachment download
  const handleDownload = (attachment: Attachment) => {
    if (onDownload) {
      onDownload(attachment);
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Fișier descărcat",
        description: `${attachment.name} a fost descărcat`,
      });
    }
  };
  
  // Handle attachment deletion
  const handleDelete = (attachmentId: string, name: string) => {
    if (onDelete) {
      onDelete(attachmentId);
      
      toast({
        title: "Fișier șters",
        description: `${name} a fost șters`,
      });
    }
  };
  
  return (
    <Card className="border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <PaperClip className="h-5 w-5 mr-2" />
          Atașamente
          <Badge className="ml-2">{attachments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {attachments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <PaperClip className="h-10 w-10 mx-auto mb-2" />
            <p>Nu există atașamente</p>
            {allowUpload && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adaugă atașament
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-md divide-y">
              {attachments.map((attachment) => (
                <div 
                  key={attachment.id}
                  className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(attachment.type)}
                    <div>
                      <p className="font-medium">{attachment.name}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>{formatFileSize(attachment.size)}</span>
                        <span className="mx-2">•</span>
                        <span>Încărcat de {attachment.uploadedBy}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    {allowDelete && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(attachment.id, attachment.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {allowUpload && (
              <div className="text-center mt-4">
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button 
                  variant="outline" 
                  disabled={isUploading}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {isUploading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Se încarcă...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Încarcă atașament
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Default Badge component for attachment count
const Badge: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary ${className || ''}`}>
      {children}
    </span>
  );
};

// Default Loader component for the loading state
const Loader: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export default DocumentAttachments;