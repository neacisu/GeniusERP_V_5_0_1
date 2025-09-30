import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, User, RotateCcw } from 'lucide-react';

interface HistoryEntry {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  details?: string;
}

interface DocumentHistoryProps {
  entries: HistoryEntry[];
  onViewVersion?: (entryId: string) => void;
  onRestoreVersion?: (entryId: string) => void;
}

/**
 * Document History Component
 * 
 * Displays the version history of a document with options to view or restore previous versions
 */
const DocumentHistory: React.FC<DocumentHistoryProps> = ({ 
  entries = [],
  onViewVersion,
  onRestoreVersion
}) => {
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
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0]?.toUpperCase() || '')
      .slice(0, 2)
      .join('');
  };
  
  return (
    <Card className="border">
      <CardContent className="p-4">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
            <p>Nu există istoric pentru acest document</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div 
                key={entry.id}
                className="flex items-start p-3 rounded-md hover:bg-muted"
              >
                <div className="flex-shrink-0 mr-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">{getInitials(entry.user)}</span>
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{entry.user}</p>
                      <p className="text-sm text-muted-foreground">{entry.action}</p>
                      {entry.details && (
                        <p className="text-xs text-muted-foreground mt-1">{entry.details}</p>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDate(entry.timestamp)}</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {onViewVersion && (
                      <Button variant="outline" size="sm" onClick={() => onViewVersion(entry.id)}>
                        Vizualizare
                      </Button>
                    )}
                    {onRestoreVersion && (
                      <Button variant="outline" size="sm" onClick={() => onRestoreVersion(entry.id)}>
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restaurare
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentHistory;