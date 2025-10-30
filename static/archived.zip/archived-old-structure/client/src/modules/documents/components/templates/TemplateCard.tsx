/**
 * Template Card Component
 * 
 * Card component for displaying document template information with actions.
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
  Copy, 
  Edit, 
  Trash2, 
  FilePlus2,
  Clock,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';

export type TemplateType = 
  | 'contract' 
  | 'invoice' 
  | 'letter' 
  | 'certificate' 
  | 'report' 
  | 'form' 
  | 'other';

export interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  type: TemplateType;
  category: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  usageCount: number;
  lastUsed?: string;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onGenerate?: (id: string) => void;
  compact?: boolean;
}

export function TemplateCard({
  id,
  name,
  description,
  type,
  category,
  createdAt,
  updatedAt,
  createdBy,
  usageCount,
  lastUsed,
  onEdit,
  onDuplicate,
  onDelete,
  onGenerate,
  compact = false
}: TemplateCardProps) {
  
  // Get template type name
  const getTemplateTypeName = (type: TemplateType) => {
    switch (type) {
      case 'contract': return 'Contract';
      case 'invoice': return 'Factură';
      case 'letter': return 'Adresă';
      case 'certificate': return 'Certificat';
      case 'report': return 'Raport';
      case 'form': return 'Formular';
      case 'other': return 'Altele';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ro });
    } catch (e) {
      return 'dată necunoscută';
    }
  };
  
  // Get category name
  const getCategoryName = (categoryId: string) => {
    const categories: Record<string, string> = {
      'legal': 'Juridic',
      'accounting': 'Contabilitate',
      'correspondence': 'Corespondență',
      'operations': 'Operațional',
      'hr': 'Resurse Umane',
      'sales': 'Vânzări'
    };
    
    return categories[categoryId] || categoryId;
  };

  if (compact) {
    return (
      <Card className="overflow-hidden">
        <div className="flex items-center p-4">
          <div className="mr-3">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium truncate">{name}</h3>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Badge variant="outline">{getTemplateTypeName(type)}</Badge>
              <span>•</span>
              <span>{usageCount} utilizări</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            {onGenerate && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onGenerate(id)}>
                <FilePlus2 className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(id)}>
                <Edit className="h-4 w-4" />
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
        <CardTitle className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>{name}</span>
          </div>
          <Badge variant="outline">{getTemplateTypeName(type)}</Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Categorie:</span>
            <span className="font-medium">{getCategoryName(category)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Utilizări:</span>
            <span className="font-medium">{usageCount}</span>
          </div>
          
          {lastUsed && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Utilizat ultima dată:</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDate(lastUsed)}</span>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Creat de:</span>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{createdBy}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Actualizat:</span>
            <span>{formatDate(updatedAt)}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between">
        {onGenerate && (
          <Button 
            className="w-full" 
            onClick={() => onGenerate(id)}
          >
            <FilePlus2 className="h-4 w-4 mr-2" />
            Generează document
          </Button>
        )}
        
        <div className="flex space-x-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(id)}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              <span>Editează</span>
            </Button>
          )}
          {onDuplicate && (
            <Button variant="outline" size="sm" onClick={() => onDuplicate(id)}>
              <Copy className="h-3.5 w-3.5 mr-1" />
              <span>Duplică</span>
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              <span>Șterge</span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default TemplateCard;