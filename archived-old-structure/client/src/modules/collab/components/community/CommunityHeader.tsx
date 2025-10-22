import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FilterOption {
  value: string;
  label: string;
}

interface CommunityHeaderProps {
  title: string;
  description: string;
  searchPlaceholder: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  createButtonText: string;
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterOptions: FilterOption[];
}

/**
 * Header component for community pages with search, filter and create button
 */
const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  title,
  description,
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  onCreateClick,
  createButtonText,
  filterValue,
  onFilterChange,
  filterOptions
}) => {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtrează
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {filterOptions.map((option) => (
              <DropdownMenuItem 
                key={option.value}
                onClick={() => onFilterChange(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          {createButtonText}
        </Button>
      </div>
    </>
  );
};

export default CommunityHeader;