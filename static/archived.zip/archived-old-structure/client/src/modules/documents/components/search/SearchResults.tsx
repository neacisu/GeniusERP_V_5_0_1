/**
 * Search Results Component
 * 
 * Displays document search results with highlighting and filtering options.
 */

import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Download, 
  FileText, 
  Clock, 
  FileSearch 
} from 'lucide-react';
import { DocumentType, DocumentStatus } from '../../components/common/DocumentCard';

interface SearchResult {
  id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  matchedContent: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  relevanceScore: number;
  matchCount: number;
  registryNumber?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  searchTerm: string;
  onViewDocument: (id: string) => void;
  onDownloadDocument: (id: string) => void;
  onViewContext: (id: string) => void;
  isLoading?: boolean;
}

export function SearchResults({
  results,
  searchTerm,
  onViewDocument,
  onDownloadDocument,
  onViewContext,
  isLoading = false
}: SearchResultsProps) {
  // Highlight matching text in search results
  const highlightMatches = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index} className="bg-yellow-200">{part}</mark> : part
    );
  };
  
  // Get document type readable name
  const getDocumentTypeName = (type: DocumentType) => {
    switch (type) {
      case 'pdf': return 'PDF';
      case 'word': return 'Word';
      case 'excel': return 'Excel';
      case 'image': return 'Imagine';
      case 'contract': return 'Contract';
      case 'invoice': return 'Factură';
      default: return 'Document';
    }
  };
  
  // Get document status readable name
  const getStatusName = (status: DocumentStatus) => {
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
  
  // Get status badge variant
  const getStatusBadgeVariant = (status: DocumentStatus): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'draft': return 'outline';
      case 'active': return 'default';
      case 'archived': return 'secondary';
      case 'deleted': return 'destructive';
      case 'pending': return 'secondary';
      case 'signed': return 'default';
      default: return 'outline';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      return 'Dată necunoscută';
    }
  };
  
  if (isLoading) {
    return (
      <div className="py-10 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-3"></div>
          <p className="text-muted-foreground">Căutare în curs...</p>
        </div>
      </div>
    );
  }
  
  if (results.length === 0) {
    return (
      <div className="py-10 flex justify-center">
        <div className="text-center space-y-3">
          <FileSearch className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-medium">Nu au fost găsite documente</h3>
          <p className="text-sm text-muted-foreground">
            Încercați să modificați termenii de căutare sau filtrele aplicate
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50%]">Document</TableHead>
            <TableHead>Tip</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.id} className="group">
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">
                    {highlightMatches(result.title, searchTerm)}
                    {result.registryNumber && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({result.registryNumber})
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {highlightMatches(result.matchedContent, searchTerm)}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDate(result.createdAt)} • {result.matchCount} potriviri • 
                      De: {result.createdBy}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <FileText className={`h-4 w-4 ${
                    result.type === 'pdf' ? 'text-red-500' :
                    result.type === 'word' ? 'text-blue-500' :
                    result.type === 'excel' ? 'text-green-500' :
                    result.type === 'contract' ? 'text-yellow-500' :
                    result.type === 'invoice' ? 'text-orange-500' :
                    'text-gray-500'
                  }`} />
                  <span className="text-sm">
                    {getDocumentTypeName(result.type)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {formatDate(result.updatedAt)}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(result.status)}>
                  {getStatusName(result.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onViewDocument(result.id)}
                    title="Vizualizează documentul"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onViewContext(result.id)}
                    title="Arată contextul"
                  >
                    <FileSearch className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onDownloadDocument(result.id)}
                    title="Descarcă documentul"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default SearchResults;