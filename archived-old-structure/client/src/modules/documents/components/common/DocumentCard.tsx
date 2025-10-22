/**
 * Document Card Component
 * 
 * A versatile card component for displaying document information
 * with various actions and interactive elements.
 */

import React from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye, 
  Pencil, 
  History, 
  Fingerprint, 
  Trash2, 
  Share, 
  FileSearch,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';

export type DocumentType = 'pdf' | 'word' | 'excel' | 'image' | 'contract' | 'invoice' | 'other';
export type DocumentStatus = 'draft' | 'active' | 'archived' | 'deleted' | 'pending' | 'signed';

// Document data interface
export interface DocumentCardProps {
  id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  version?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  fileSize?: number;
  flowType?: 'incoming' | 'outgoing' | 'internal';
  registryNumber?: string;
  registryDate?: string;
  thumbnailUrl?: string;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
  onHistory?: (id: string) => void;
  onSign?: (id: string) => void;
  onShare?: (id: string) => void;
  onOcr?: (id: string) => void;
  compact?: boolean;
}

export function DocumentCard({
  id,
  title,
  type,
  status,
  version = 1,
  createdAt,
  updatedAt,
  createdBy,
  fileSize,
  flowType,
  registryNumber,
  registryDate,
  thumbnailUrl,
  onView,
  onEdit,
  onDownload,
  onDelete,
  onHistory,
  onSign,
  onShare,
  onOcr,
  compact = false
}: DocumentCardProps) {
  const { toast } = useToast();
  
  // Format file size for display
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Get document type icon
  const getDocumentTypeIcon = () => {
    switch (type) {
      case 'pdf': return <FileText className="text-red-500" />;
      case 'word': return <FileText className="text-blue-500" />;
      case 'excel': return <FileText className="text-green-500" />;
      case 'image': return <FileText className="text-purple-500" />;
      case 'contract': return <FileText className="text-yellow-500" />;
      case 'invoice': return <FileText className="text-orange-500" />;
      default: return <FileText className="text-gray-500" />;
    }
  };
  
  // Get document status badge
  const getStatusBadge = () => {
    let variant: "default" | "destructive" | "outline" | "secondary" | undefined;
    
    switch (status) {
      case 'draft': variant = 'outline'; break;
      case 'active': variant = 'default'; break;
      case 'archived': variant = 'secondary'; break;
      case 'deleted': variant = 'destructive'; break;
      case 'pending': variant = 'secondary'; break;
      case 'signed': variant = 'default'; break;
      default: variant = 'outline';
    }
    
    return (
      <Badge variant={variant} className="capitalize">
        {getStatusLabel(status)}
      </Badge>
    );
  };
  
  // Get human-readable status label
  const getStatusLabel = (status: DocumentStatus) => {
    switch (status) {
      case 'draft': return 'Ciornă';
      case 'active': return 'Activ';
      case 'archived': return 'Arhivat';
      case 'deleted': return 'Șters';
      case 'pending': return 'În așteptare';
      case 'signed': return 'Semnat';
      default: return status;
    }
  };
  
  // Get flow type badge
  const getFlowTypeBadge = () => {
    if (!flowType) return null;
    
    let className = 'capitalize';
    
    if (flowType === 'incoming') {
      className += ' bg-green-100 text-green-800 hover:bg-green-200';
    } else if (flowType === 'outgoing') {
      className += ' bg-blue-100 text-blue-800 hover:bg-blue-200';
    } else {
      className += ' bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
    
    const getFlowTypeLabel = () => {
      switch (flowType) {
        case 'incoming': return 'Intrare';
        case 'outgoing': return 'Ieșire';
        case 'internal': return 'Intern';
        default: return flowType;
      }
    };
    
    return (
      <Badge variant="outline" className={className}>
        {getFlowTypeLabel()}
      </Badge>
    );
  };
  
  // Generate a human-readable time ago
  const timeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ro });
    } catch (error) {
      return 'Data necunoscută';
    }
  };
  
  // Handle clipboard copy
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiat în clipboard",
        description: message,
      });
    });
  };

  if (compact) {
    return (
      <Card className="overflow-hidden">
        <div className="flex items-center p-4">
          <div className="mr-3">
            {getDocumentTypeIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium truncate">{title}</h3>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>v{version}</span>
              <span>•</span>
              <Clock className="h-3 w-3" />
              <span>{timeAgo(updatedAt)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            {onView && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onView(id)}>
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onDownload && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onDownload(id)}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <div className="mt-1">{getDocumentTypeIcon()}</div>
            <div className="space-y-1">
              <CardTitle className="text-lg leading-tight">{title}</CardTitle>
              
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>v{version}</span>
                <span>•</span>
                <span>{formatFileSize(fileSize)}</span>
                {createdBy && (
                  <>
                    <span>•</span>
                    <span>{createdBy}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            {getFlowTypeBadge()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex justify-between items-center text-sm">
          <div className="space-y-2 max-w-lg">
            {registryNumber && (
              <div className="flex items-center">
                <span className="text-muted-foreground mr-2">Număr registru:</span>
                <span 
                  className="font-medium cursor-pointer hover:underline" 
                  onClick={() => copyToClipboard(registryNumber, "Număr registru copiat")}
                >
                  {registryNumber}
                </span>
              </div>
            )}
            
            {registryDate && (
              <div className="flex items-center">
                <span className="text-muted-foreground mr-2">Dată înregistrare:</span>
                <span className="font-medium">{new Date(registryDate).toLocaleDateString('ro-RO')}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col space-y-1 items-end text-sm text-muted-foreground">
            <div>Creat: {timeAgo(createdAt)}</div>
            <div>Actualizat: {timeAgo(updatedAt)}</div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-1 flex justify-between">
        <div className="flex flex-wrap gap-1">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(id)}>
              <Eye className="h-4 w-4 mr-1" />
              <span>Vizualizare</span>
            </Button>
          )}
          
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(id)}>
              <Pencil className="h-4 w-4 mr-1" />
              <span>Editare</span>
            </Button>
          )}
          
          {onSign && (
            <Button variant="outline" size="sm" onClick={() => onSign(id)}>
              <Fingerprint className="h-4 w-4 mr-1" />
              <span>Semnare</span>
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1">
          {onHistory && (
            <Button variant="ghost" size="sm" onClick={() => onHistory(id)}>
              <History className="h-4 w-4" />
            </Button>
          )}
          
          {onOcr && (
            <Button variant="ghost" size="sm" onClick={() => onOcr(id)}>
              <FileSearch className="h-4 w-4" />
            </Button>
          )}
          
          {onShare && (
            <Button variant="ghost" size="sm" onClick={() => onShare(id)}>
              <Share className="h-4 w-4" />
            </Button>
          )}
          
          {onDownload && (
            <Button variant="ghost" size="sm" onClick={() => onDownload(id)}>
              <Download className="h-4 w-4" />
            </Button>
          )}
          
          {onDelete && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default DocumentCard;