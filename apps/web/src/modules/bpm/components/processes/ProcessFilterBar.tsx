/**
 * Process Filter Bar Component
 * 
 * Componentă pentru filtrarea proceselor în interfața de listare
 */

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter, DownloadCloud, FilterX, Check } from 'lucide-react';

export interface FilterOptions {
  status?: string;
  type?: string;
  query?: string;
  dateRange?: string;
}

export interface ProcessFilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  onExport?: () => void;
  className?: string;
}

const ProcessFilterBar: React.FC<ProcessFilterBarProps> = ({
  onFilterChange,
  onExport,
  className = ""
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    type: 'all',
    query: '',
    dateRange: 'all'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const newFilters = { ...filters, query: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleStatusChange = (value: string) => {
    const newFilters = { ...filters, status: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleTypeChange = (value: string) => {
    const newFilters = { ...filters, type: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleDateRangeChange = (value: string) => {
    const newFilters = { ...filters, dateRange: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleClearFilters = () => {
    const newFilters = {
      status: 'all',
      type: 'all',
      query: '',
      dateRange: 'all'
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Caută procese..."
            className="pl-8"
            value={filters.query}
            onChange={handleInputChange}
          />
          {filters.query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0"
              onClick={() => {
                const newFilters = { ...filters, query: '' };
                setFilters(newFilters);
                onFilterChange(newFilters);
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Șterge</span>
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            onClick={handleToggleFilters}
            className="min-w-[100px]"
          >
            {showFilters ? (
              <>
                <FilterX className="mr-2 h-4 w-4" />
                <span>Ascunde</span>
              </>
            ) : (
              <>
                <Filter className="mr-2 h-4 w-4" />
                <span>Filtre</span>
              </>
            )}
          </Button>
          
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
            >
              <DownloadCloud className="mr-2 h-4 w-4" />
              <span>Export</span>
            </Button>
          )}
          
          {Object.values(filters).some(val => val !== '' && val !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="min-w-[100px]"
            >
              <X className="mr-2 h-4 w-4" />
              <span>Resetează</span>
            </Button>
          )}
        </div>
      </div>
      
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md bg-background/50">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Toate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="active">Activ</SelectItem>
                <SelectItem value="draft">Ciornă</SelectItem>
                <SelectItem value="running">În execuție</SelectItem>
                <SelectItem value="pending">În așteptare</SelectItem>
                <SelectItem value="completed">Complet</SelectItem>
                <SelectItem value="error">Eroare</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Tip</label>
            <Select value={filters.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Toate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="automated">Automatizat</SelectItem>
                <SelectItem value="approval">Aprobare</SelectItem>
                <SelectItem value="notification">Notificare</SelectItem>
                <SelectItem value="integration">Integrare</SelectItem>
                <SelectItem value="finance">Financiar</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="sales">Vânzări</SelectItem>
                <SelectItem value="procurement">Achiziții</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Perioadă</label>
            <Select value={filters.dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Toate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="today">Astăzi</SelectItem>
                <SelectItem value="last7days">Ultimele 7 zile</SelectItem>
                <SelectItem value="last30days">Ultimele 30 zile</SelectItem>
                <SelectItem value="thisMonth">Luna curentă</SelectItem>
                <SelectItem value="lastMonth">Luna trecută</SelectItem>
                <SelectItem value="thisYear">Anul curent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      {Object.values(filters).some(val => val !== '' && val !== 'all') && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-muted-foreground">Filtre active:</span>
          
          {filters.status && filters.status !== 'all' && (
            <div className="flex items-center bg-muted/50 px-2 py-1 rounded-md">
              <span>Status: {filters.status}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-4 w-4 p-0 ml-1"
                onClick={() => handleStatusChange('all')}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Șterge filtru</span>
              </Button>
            </div>
          )}
          
          {filters.type && filters.type !== 'all' && (
            <div className="flex items-center bg-muted/50 px-2 py-1 rounded-md">
              <span>Tip: {filters.type}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-4 w-4 p-0 ml-1"
                onClick={() => handleTypeChange('all')}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Șterge filtru</span>
              </Button>
            </div>
          )}
          
          {filters.dateRange && filters.dateRange !== 'all' && (
            <div className="flex items-center bg-muted/50 px-2 py-1 rounded-md">
              <span>Perioadă: {filters.dateRange}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-4 w-4 p-0 ml-1"
                onClick={() => handleDateRangeChange('all')}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Șterge filtru</span>
              </Button>
            </div>
          )}
          
          {filters.query && (
            <div className="flex items-center bg-muted/50 px-2 py-1 rounded-md">
              <span>Căutare: {filters.query}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-4 w-4 p-0 ml-1"
                onClick={() => {
                  const newFilters = { ...filters, query: '' };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Șterge filtru</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProcessFilterBar;