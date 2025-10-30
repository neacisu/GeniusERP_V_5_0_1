/**
 * Filter Bar Component
 * 
 * Reusable component for filtering and searching data with action buttons.
 */

import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Search, Download } from 'lucide-react';

// Filter option structure
export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterCategory {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface ActionButton {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: FilterCategory[];
  selectedFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onResetFilters: () => void;
  actionButton?: ActionButton;
  exportButton?: boolean;
  onExport?: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchPlaceholder = 'Caută...',
  searchTerm,
  onSearchChange,
  filters,
  selectedFilters,
  onFilterChange,
  onResetFilters,
  actionButton,
  exportButton = false,
  onExport
}) => {
  const hasFiltersSelected = Object.values(selectedFilters).some(value => value !== '');
  
  const renderActionButton = () => {
    if (!actionButton) return null;
    
    if (actionButton.onClick) {
      return (
        <Button onClick={actionButton.onClick}>
          {actionButton.icon}
          {actionButton.label}
        </Button>
      );
    }
    
    if (actionButton.href) {
      return (
        <Button asChild>
          <Link href={actionButton.href}>
            {actionButton.icon}
            {actionButton.label}
          </Link>
        </Button>
      );
    }
    
    return null;
  };
  
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex w-full md:w-auto space-x-2">
        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[250px]">
            <DropdownMenuLabel>Filtrează după</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {filters.map((filterCategory) => (
              <div key={filterCategory.key} className="p-2">
                <p className="text-sm mb-1">{filterCategory.label}</p>
                <Select 
                  value={selectedFilters[filterCategory.key] || ''}
                  onValueChange={(value) => onFilterChange(filterCategory.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Toate ${filterCategory.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toate</SelectItem>
                    {filterCategory.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            
            {hasFiltersSelected && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onResetFilters}>
                  Resetează filtrele
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {exportButton && onExport && (
          <Button variant="outline" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportă
          </Button>
        )}
      </div>
      
      {renderActionButton()}
    </div>
  );
};

export default FilterBar;