import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, RotateCcw, History, Eye } from 'lucide-react';

interface DocumentVersion {
  id: string;
  version: string;
  date: string;
  user: string;
  content: string;
}

interface DocumentVersionComparisonProps {
  currentVersion: DocumentVersion;
  previousVersions: DocumentVersion[];
  onRestoreVersion?: (versionId: string) => void;
}

/**
 * Document Version Comparison Component
 * 
 * Allows comparing different versions of a document and restoring previous versions
 */
const DocumentVersionComparison: React.FC<DocumentVersionComparisonProps> = ({
  currentVersion,
  previousVersions,
  onRestoreVersion
}) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    previousVersions.length > 0 ? previousVersions[0].id : ''
  );
  const [viewMode, setViewMode] = useState<'split' | 'inline'>('split');
  
  // Get selected version object
  const selectedVersion = previousVersions.find(v => v.id === selectedVersionId);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Find text differences and highlight them
  const highlightDifferences = (oldText: string, newText: string) => {
    // In a real implementation, we would use a proper diff algorithm
    // For now, we'll just return the text as-is
    return newText;
  };
  
  // Render split view comparison
  const renderSplitView = () => {
    if (!selectedVersion) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-2 px-4">
            <div className="flex justify-between items-center">
              <div>
                <Badge variant="outline">Versiunea {selectedVersion.version}</Badge>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(selectedVersion.date)}</p>
              </div>
              <Badge variant="secondary">{selectedVersion.user}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="border rounded-md p-3 bg-muted/10 min-h-[300px] text-sm whitespace-pre-wrap">
              {selectedVersion.content}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-2 px-4">
            <div className="flex justify-between items-center">
              <div>
                <Badge variant="outline">Versiunea curentă</Badge>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(currentVersion.date)}</p>
              </div>
              <Badge variant="secondary">{currentVersion.user}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="border rounded-md p-3 bg-muted/10 min-h-[300px] text-sm whitespace-pre-wrap">
              {currentVersion.content}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Render inline differences view
  const renderInlineView = () => {
    if (!selectedVersion) return null;
    
    const diffContent = highlightDifferences(selectedVersion.content, currentVersion.content);
    
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex justify-between items-center">
            <div>
              <Badge variant="outline">Diferențe</Badge>
              <p className="text-xs text-muted-foreground mt-1">
                De la v{selectedVersion.version} la versiunea curentă
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="border rounded-md p-3 bg-muted/10 min-h-[300px] text-sm whitespace-pre-wrap">
            {diffContent}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (previousVersions.length === 0) {
    return (
      <Card className="border">
        <CardContent className="py-8 px-4 text-center">
          <History className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nu există versiuni anterioare pentru comparație</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Comparare versiuni document</h3>
          <p className="text-sm text-muted-foreground">
            Comparați versiunea curentă cu versiunile anterioare
          </p>
        </div>
        
        <div className="flex gap-2">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'split' | 'inline')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="split">Separat</TabsTrigger>
              <TabsTrigger value="inline">Inline</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Selectați versiunea pentru comparație" />
          </SelectTrigger>
          <SelectContent>
            {previousVersions.map((version) => (
              <SelectItem key={version.id} value={version.id}>
                v{version.version} ({formatDate(version.date)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {onRestoreVersion && selectedVersionId && (
          <Button 
            variant="outline" 
            onClick={() => onRestoreVersion(selectedVersionId)}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurare
          </Button>
        )}
      </div>
      
      <div className="mt-4">
        {viewMode === 'split' ? renderSplitView() : renderInlineView()}
      </div>
      
      <div className="flex justify-center mt-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!selectedVersionId}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Versiunea anterioară
          </Button>
          <Button variant="outline" size="sm" disabled={!selectedVersionId}>
            <ChevronRight className="h-4 w-4 mr-2" />
            Versiunea următoare
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentVersionComparison;