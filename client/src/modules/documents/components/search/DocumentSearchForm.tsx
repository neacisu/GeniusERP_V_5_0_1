import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { Search, CalendarDays, FileText, User, Tag, Filter, X } from 'lucide-react';

export interface DocumentSearchFilters {
  query: string;
  type?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  author?: string;
  tags?: string[];
  includeArchived?: boolean;
  includeDeleted?: boolean;
}

interface DocumentSearchFormProps {
  onSearch: (filters: DocumentSearchFilters) => void;
  initialFilters?: Partial<DocumentSearchFilters>;
}

/**
 * Document Search Form Component
 * 
 * Advanced search form for documents with multiple filters
 */
const DocumentSearchForm: React.FC<DocumentSearchFormProps> = ({
  onSearch,
  initialFilters = {}
}) => {
  // State for search filters
  const [filters, setFilters] = useState<DocumentSearchFilters>({
    query: initialFilters.query || '',
    type: initialFilters.type,
    category: initialFilters.category,
    dateFrom: initialFilters.dateFrom,
    dateTo: initialFilters.dateTo,
    author: initialFilters.author,
    tags: initialFilters.tags || [],
    includeArchived: initialFilters.includeArchived || false,
    includeDeleted: initialFilters.includeDeleted || false
  });
  
  // Handle input change
  const handleInputChange = (field: keyof DocumentSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };
  
  // Reset all filters
  const handleReset = () => {
    setFilters({
      query: '',
      type: undefined,
      category: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      author: undefined,
      tags: [],
      includeArchived: false,
      includeDeleted: false
    });
  };
  
  return (
    <Card className="border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Search className="h-5 w-5 mr-2" />
          Căutare avansată documente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Caută după titlu, conținut sau ID document..."
                  className="pl-9"
                  value={filters.query}
                  onChange={(e) => handleInputChange('query', e.target.value)}
                />
              </div>
            </div>
            
            <Accordion type="single" collapsible className="border rounded-md">
              <AccordionItem value="filters">
                <AccordionTrigger className="px-4">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtre avansate
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tip document</Label>
                      <Select
                        value={filters.type}
                        onValueChange={(value) => handleInputChange('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toate tipurile" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="invoice">Factură</SelectItem>
                          <SelectItem value="report">Raport</SelectItem>
                          <SelectItem value="letter">Scrisoare</SelectItem>
                          <SelectItem value="certificate">Certificat</SelectItem>
                          <SelectItem value="other">Altele</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Categorie</Label>
                      <Select
                        value={filters.category}
                        onValueChange={(value) => handleInputChange('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toate categoriile" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="official">Oficial</SelectItem>
                          <SelectItem value="internal">Intern</SelectItem>
                          <SelectItem value="financial">Financiar</SelectItem>
                          <SelectItem value="legal">Juridic</SelectItem>
                          <SelectItem value="hr">Resurse Umane</SelectItem>
                          <SelectItem value="other">Altele</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        De la data
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Selectează data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.dateFrom}
                            onSelect={(date: Date | undefined) => handleInputChange('dateFrom', date)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Până la data
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {filters.dateTo ? format(filters.dateTo, "PPP") : "Selectează data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.dateTo}
                            onSelect={(date: Date | undefined) => handleInputChange('dateTo', date)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Autor
                    </Label>
                    <Input
                      placeholder="Numele autorului..."
                      value={filters.author || ''}
                      onChange={(e) => handleInputChange('author', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      Etichete (separate prin virgulă)
                    </Label>
                    <Input
                      placeholder="important, urgent, etc..."
                      value={filters.tags?.join(', ') || ''}
                      onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-archived"
                        checked={filters.includeArchived}
                        onCheckedChange={(checked) => handleInputChange('includeArchived', checked)}
                      />
                      <Label htmlFor="include-archived">Include documente arhivate</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-deleted"
                        checked={filters.includeDeleted}
                        onCheckedChange={(checked) => handleInputChange('includeDeleted', checked)}
                      />
                      <Label htmlFor="include-deleted">Include documente șterse</Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
              >
                <X className="h-4 w-4 mr-2" />
                Resetează
              </Button>
              
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Caută
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DocumentSearchForm;