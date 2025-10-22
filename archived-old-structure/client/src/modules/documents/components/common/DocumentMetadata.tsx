import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CalendarDays,
  User,
  FileText,
  Tag,
  Pencil,
  Lock,
  Globe
} from 'lucide-react';

export interface DocumentMetadataProps {
  id?: string;
  title?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  author?: string;
  status?: 'draft' | 'published' | 'archived' | 'pending';
  category?: string;
  tags?: string[];
  version?: string;
  isPublic?: boolean;
}

/**
 * Document Metadata Component
 * 
 * Displays key metadata about a document in a consistent format
 */
const DocumentMetadata: React.FC<DocumentMetadataProps> = ({
  id,
  title,
  type,
  createdAt,
  updatedAt,
  author,
  status = 'draft',
  category,
  tags = [],
  version = '1.0',
  isPublic = false
}) => {
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status badge variant
  const getStatusVariant = () => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };
  
  // Get status label
  const getStatusLabel = () => {
    switch (status) {
      case 'published':
        return 'Publicat';
      case 'draft':
        return 'Ciornă';
      case 'archived':
        return 'Arhivat';
      case 'pending':
        return 'În așteptare';
      default:
        return 'Ciornă';
    }
  };
  
  return (
    <Card className="border">
      <CardContent className="p-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {id && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">ID Document</p>
                  <p className="text-sm font-mono">{id}</p>
                </div>
              </div>
            )}
            
            {author && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Autor</p>
                  <p className="text-sm">{author}</p>
                </div>
              </div>
            )}
            
            {type && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Tip Document</p>
                  <p className="text-sm">{type}</p>
                </div>
              </div>
            )}
            
            {category && (
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Categorie</p>
                  <p className="text-sm">{category}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {createdAt && (
              <div className="flex items-start gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Data Creării</p>
                  <p className="text-sm">{formatDate(createdAt)}</p>
                </div>
              </div>
            )}
            
            {updatedAt && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Ultima Modificare</p>
                  <p className="text-sm">{formatDate(updatedAt)}</p>
                </div>
              </div>
            )}
            
            {version && (
              <div className="flex items-start gap-2">
                <Pencil className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Versiune</p>
                  <p className="text-sm">{version}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-2">
              {isPublic ? (
                <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
              )}
              <div>
                <p className="text-xs text-muted-foreground">Vizibilitate</p>
                <p className="text-sm">{isPublic ? 'Public' : 'Privat'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant={getStatusVariant() as any}>
            {getStatusLabel()}
          </Badge>
          
          {tags.map(tag => (
            <Badge variant="outline" key={tag}>
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentMetadata;