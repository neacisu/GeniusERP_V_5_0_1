/**
 * Document Filters Component
 * 
 * A comprehensive filter panel for document listings
 * with advanced search capabilities.
 */

import React, { useState } from 'react';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon,
  Filter,
  X,
  Search,
  Check,
  FileType,
  User
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DocumentType, DocumentStatus } from './DocumentCard';

export interface FilterParams {
  search?: string;
  types?: DocumentType[];
  status?: DocumentStatus[];
  startDate?: Date;
  endDate?: Date;
  creator?: string;
  flowTypes?: ('incoming' | 'outgoing' | 'internal')[];
  sortBy?: 'date' | 'name' | 'type' | 'status';
  sortDirection?: 'asc' | 'desc';
}

interface DocumentFiltersProps {
  onFilterChange: (filters: FilterParams) => void;
  initialValues?: FilterParams;
  showFlowTypeFilter?: boolean;
}

export function DocumentFilters({ 
  onFilterChange, 
  initialValues = {}, 
  showFlowTypeFilter = false 
}: DocumentFiltersProps) {
  const [filters, setFilters] = useState<FilterParams>(initialValues);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  
  // Apply filters
  const applyFilters = () => {
    onFilterChange(filters);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };
  
  // Update a specific filter
  const updateFilter = (key: keyof FilterParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Toggle document type filter
  const toggleTypeFilter = (type: DocumentType) => {
    setFilters(prev => {
      const types = prev.types || [];
      if (types.includes(type)) {
        return { ...prev, types: types.filter(t => t !== type) };
      } else {
        return { ...prev, types: [...types, type] };
      }
    });
  };
  
  // Toggle status filter
  const toggleStatusFilter = (status: DocumentStatus) => {
    setFilters(prev => {
      const statuses = prev.status || [];
      if (statuses.includes(status)) {
        return { ...prev, status: statuses.filter(s => s !== status) };
      } else {
        return { ...prev, status: [...statuses, status] };
      }
    });
  };
  
  // Toggle flow type filter
  const toggleFlowTypeFilter = (flowType: 'incoming' | 'outgoing' | 'internal') => {
    setFilters(prev => {
      const flowTypes = prev.flowTypes || [];
      if (flowTypes.includes(flowType)) {
        return { ...prev, flowTypes: flowTypes.filter(ft => ft !== flowType) };
      } else {
        return { ...prev, flowTypes: [...flowTypes, flowType] };
      }
    });
  };
  
  // Document type options
  const documentTypes: {value: DocumentType, label: string}[] = [
    { value: 'pdf', label: 'PDF' },
    { value: 'word', label: 'Word' },
    { value: 'excel', label: 'Excel' },
    { value: 'image', label: 'Imagine' },
    { value: 'contract', label: 'Contract' },
    { value: 'invoice', label: 'Factură' },
    { value: 'other', label: 'Altele' }
  ];
  
  // Document status options
  const documentStatuses: {value: DocumentStatus, label: string}[] = [
    { value: 'draft', label: 'Ciornă' },
    { value: 'active', label: 'Activ' },
    { value: 'archived', label: 'Arhivat' },
    { value: 'pending', label: 'În așteptare' },
    { value: 'signed', label: 'Semnat' },
    { value: 'deleted', label: 'Șters' }
  ];
  
  // Flow type options
  const flowTypes = [
    { value: 'incoming', label: 'Intrare' },
    { value: 'outgoing', label: 'Ieșire' },
    { value: 'internal', label: 'Intern' }
  ];
  
  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.types && filters.types.length > 0) count++;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.creator) count++;
    if (filters.flowTypes && filters.flowTypes.length > 0) count++;
    return count;
  };
  
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search input */}
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută documente..."
              className="pl-8"
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyFilters();
                }
              }}
            />
          </div>
          
          {/* Filter button for smaller screens */}
          <div className="md:hidden">
            <Button 
              variant="outline" 
              onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              className="w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtre
              {getActiveFilterCount() > 0 && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {getActiveFilterCount()}
                </span>
              )}
            </Button>
          </div>
          
          {/* Sort dropdown */}
          <div className="hidden md:flex w-[180px]">
            <Select
              value={filters.sortBy ? `${filters.sortBy}-${filters.sortDirection || 'desc'}` : 'date-desc'}
              onValueChange={(value) => {
                const [sortBy, sortDirection] = value.split('-') as [
                  'date' | 'name' | 'type' | 'status',
                  'asc' | 'desc'
                ];
                updateFilter('sortBy', sortBy);
                updateFilter('sortDirection', sortDirection);
              }}
            >
              <SelectTrigger>
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
          </div>
          
          {/* Date range filter */}
          <div className="hidden md:block">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate && filters.endDate ? (
                    <>
                      {filters.startDate.toLocaleDateString()} - {filters.endDate.toLocaleDateString()}
                    </>
                  ) : (
                    <span>Selectează perioada</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Interval de date</h4>
                    <p className="text-xs text-muted-foreground">
                      Selectează intervalul de date pentru filtrare
                    </p>
                  </div>
                </div>
                <div className="p-3 flex flex-col space-y-3">
                  <div className="space-y-1">
                    <div className="text-xs font-medium">De la</div>
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => updateFilter('startDate', date)}
                      disabled={(date) => 
                        filters.endDate ? date > filters.endDate : false
                      }
                      initialFocus
                    />
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <div className="text-xs font-medium">Până la</div>
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => updateFilter('endDate', date)}
                      disabled={(date) => 
                        filters.startDate ? date < filters.startDate : false
                      }
                      initialFocus
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateFilter('startDate', undefined);
                        updateFilter('endDate', undefined);
                        setCalendarOpen(false);
                      }}
                    >
                      Resetează
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        applyFilters();
                        setCalendarOpen(false);
                      }}
                    >
                      Aplică
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Advanced filters button */}
          <div className="hidden md:block">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtre avansate
                  {getActiveFilterCount() > 0 && (
                    <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="end">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Filtre avansate</h4>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Resetează
                    </Button>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {/* Document Types */}
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <FileType className="h-4 w-4 mr-2 text-muted-foreground" />
                      <h4 className="text-sm font-medium">Tip document</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {documentTypes.map((type) => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`type-${type.value}`} 
                            checked={(filters.types || []).includes(type.value)}
                            onCheckedChange={() => toggleTypeFilter(type.value)}
                          />
                          <Label htmlFor={`type-${type.value}`} className="text-sm cursor-pointer">
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Status */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Status</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {documentStatuses.map((status) => (
                        <div key={status.value} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`status-${status.value}`} 
                            checked={(filters.status || []).includes(status.value)}
                            onCheckedChange={() => toggleStatusFilter(status.value)}
                          />
                          <Label htmlFor={`status-${status.value}`} className="text-sm cursor-pointer">
                            {status.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {showFlowTypeFilter && (
                    <>
                      <Separator />
                      
                      {/* Flow Type */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Tip flux</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {flowTypes.map((flow) => (
                            <div key={flow.value} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`flow-${flow.value}`} 
                                checked={(filters.flowTypes || []).includes(flow.value as any)}
                                onCheckedChange={() => toggleFlowTypeFilter(flow.value as any)}
                              />
                              <Label htmlFor={`flow-${flow.value}`} className="text-sm cursor-pointer">
                                {flow.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  {/* Creator */}
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <h4 className="text-sm font-medium">Creat de</h4>
                    </div>
                    <Input
                      placeholder="Nume utilizator"
                      value={filters.creator || ''}
                      onChange={(e) => updateFilter('creator', e.target.value)}
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button onClick={() => {
                      applyFilters();
                    }}>
                      <Check className="mr-2 h-4 w-4" />
                      Aplică filtrele
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Action buttons */}
          <Button 
            onClick={applyFilters} 
            className="md:hidden"
          >
            <Search className="mr-2 h-4 w-4" />
            Caută
          </Button>
        </div>
        
        {/* Mobile advanced filters panel */}
        {isAdvancedFiltersOpen && (
          <div className="md:hidden mt-4 border rounded-md p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Filtre avansate</h4>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Resetează
              </Button>
            </div>
            
            <Separator />
            
            {/* Sort dropdown (mobile) */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Sortare</h4>
              <Select
                value={filters.sortBy ? `${filters.sortBy}-${filters.sortDirection || 'desc'}` : 'date-desc'}
                onValueChange={(value) => {
                  const [sortBy, sortDirection] = value.split('-') as [
                    'date' | 'name' | 'type' | 'status',
                    'asc' | 'desc'
                  ];
                  updateFilter('sortBy', sortBy);
                  updateFilter('sortDirection', sortDirection);
                }}
              >
                <SelectTrigger>
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
            </div>
            
            <Separator />
            
            {/* Date range (mobile) */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Interval de date</h4>
              <div className="flex flex-col space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">De la</Label>
                  <Input
                    type="date"
                    value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      updateFilter('startDate', e.target.value ? new Date(e.target.value) : undefined);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Până la</Label>
                  <Input
                    type="date"
                    value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      updateFilter('endDate', e.target.value ? new Date(e.target.value) : undefined);
                    }}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Mobile document types */}
            <div className="space-y-2">
              <div className="flex items-center">
                <FileType className="h-4 w-4 mr-2 text-muted-foreground" />
                <h4 className="text-sm font-medium">Tip document</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {documentTypes.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`mobile-type-${type.value}`} 
                      checked={(filters.types || []).includes(type.value)}
                      onCheckedChange={() => toggleTypeFilter(type.value)}
                    />
                    <Label htmlFor={`mobile-type-${type.value}`} className="text-sm cursor-pointer">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            {/* Mobile status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Status</h4>
              <div className="grid grid-cols-2 gap-2">
                {documentStatuses.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`mobile-status-${status.value}`} 
                      checked={(filters.status || []).includes(status.value)}
                      onCheckedChange={() => toggleStatusFilter(status.value)}
                    />
                    <Label htmlFor={`mobile-status-${status.value}`} className="text-sm cursor-pointer">
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {showFlowTypeFilter && (
              <>
                <Separator />
                
                {/* Mobile flow type */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Tip flux</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {flowTypes.map((flow) => (
                      <div key={flow.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`mobile-flow-${flow.value}`} 
                          checked={(filters.flowTypes || []).includes(flow.value as any)}
                          onCheckedChange={() => toggleFlowTypeFilter(flow.value as any)}
                        />
                        <Label htmlFor={`mobile-flow-${flow.value}`} className="text-sm cursor-pointer">
                          {flow.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <Separator />
            
            {/* Mobile creator */}
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <h4 className="text-sm font-medium">Creat de</h4>
              </div>
              <Input
                placeholder="Nume utilizator"
                value={filters.creator || ''}
                onChange={(e) => updateFilter('creator', e.target.value)}
              />
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={() => {
                  applyFilters();
                  setIsAdvancedFiltersOpen(false);
                }}
                className="w-full"
              >
                <Check className="mr-2 h-4 w-4" />
                Aplică filtrele
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DocumentFilters;