/**
 * Document Sort Options Component
 * 
 * Provides sorting controls for document lists in the Archive page.
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Grid2X2, List } from 'lucide-react';

interface DocumentSortOptionsProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalCount: number;
}

export function DocumentSortOptions({
  sortBy,
  sortOrder,
  viewMode,
  onSortChange,
  onViewModeChange,
  totalCount
}: DocumentSortOptionsProps) {
  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-') as [string, 'asc' | 'desc'];
    onSortChange(newSortBy, newSortOrder);
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        {totalCount} {totalCount === 1 ? 'document' : 'documente'}
      </span>
      
      <div className="flex items-center gap-2">
        <Select
          value={`${sortBy}-${sortOrder}`}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sortează după" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Data (desc)</SelectItem>
            <SelectItem value="date-asc">Data (asc)</SelectItem>
            <SelectItem value="name-asc">Nume (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nume (Z-A)</SelectItem>
            <SelectItem value="type-asc">Tip (A-Z)</SelectItem>
            <SelectItem value="status-asc">Status</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex border rounded-md">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
            size="sm"
            className="rounded-r-none"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="sm"
            className="rounded-l-none"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DocumentSortOptions;