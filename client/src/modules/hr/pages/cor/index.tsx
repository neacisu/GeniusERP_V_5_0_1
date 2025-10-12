import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Search, 
  BookOpen,
  Filter,
  Download,
  FileText
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useHrApi } from '../../hooks/useHrApi';
import HrLayout from '../../components/layout/HrLayout';

/**
 * COR (Classification of Occupations in Romania) Page Component
 */
const CorPage: React.FC = () => {
  const [_, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [groupFilter, setGroupFilter] = useState('all');
  const itemsPerPage = 10;
  
  // Use API hooks
  const { useCorOccupations, useCorGroups } = useHrApi();
  
  // Get COR data with search, filtering, and pagination
  const { 
    data: corResponse, 
    isLoading, 
    isError 
  } = useCorOccupations({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    group: groupFilter === 'all' ? '' : groupFilter
  });
  
  // Get COR groups for filter dropdown
  const { data: groupsResponse } = useCorGroups();
  const groups = groupsResponse?.data || [];
  const occupations = corResponse?.data?.items || [];
  const total = corResponse?.data?.total || 0;
  
  // Calculate pagination
  const totalPages = Math.ceil(total / itemsPerPage);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        />
      </PaginationItem>
    );
    
    // Calculate visible page range
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page and ellipsis
    if (startPage > 1) {
      items.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      
      if (startPage > 2) {
        items.push(
          <PaginationItem key="start-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="end-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext 
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        />
      </PaginationItem>
    );
    
    return items;
  };
  
  return (
    <HrLayout 
      activeTab="cor" 
      title="Clasificarea Ocupațiilor din România (COR)" 
      subtitle="Consultă și caută ocupații conform nomenclatorului COR"
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Căutare ocupații COR</CardTitle>
            <CardDescription>
              Caută după cod COR sau denumire ocupație
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Caută după cod sau denumire..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="w-full md:w-auto min-w-[200px]">
                <label className="block text-sm font-medium mb-2">
                  Filtrează după grupă
                </label>
                <Select 
                  value={groupFilter} 
                  onValueChange={setGroupFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toate grupele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate grupele</SelectItem>
                    {groups.map((group: any) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.code} - {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" />
                <span>Filtre avansate</span>
              </Button>
              
              <Button variant="outline" className="flex gap-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* COR Occupations Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Ocupații COR</CardTitle>
                <CardDescription>
                  {total} ocupații disponibile
                </CardDescription>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Nomenclator complet COR 2023/2024</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <p className="text-muted-foreground">Se încarcă datele...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-8 text-destructive">
                <p>A apărut o eroare la încărcarea datelor.</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="mt-4"
                >
                  Reîncarcă
                </Button>
              </div>
            ) : occupations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nu au fost găsite ocupații conform criteriilor de căutare.</p>
                <p className="text-sm mt-2">Încercați o căutare diferită sau resetați filtrele.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setGroupFilter('all');
                  }}
                  className="mt-4"
                >
                  Resetează filtrele
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Cod COR</TableHead>
                      <TableHead>Denumire ocupație</TableHead>
                      <TableHead className="w-[180px]">Grupa</TableHead>
                      <TableHead className="w-[100px] text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {occupations.map((occupation: any) => (
                      <TableRow key={occupation.id}>
                        <TableCell className="font-medium">{occupation.code}</TableCell>
                        <TableCell>{occupation.name}</TableCell>
                        <TableCell>{occupation.groupName}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/hr/cor/${occupation.id}`)}
                          >
                            Detalii
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Afișare <strong>{occupations.length}</strong> din <strong>{total}</strong> ocupații
                  </div>
                  
                  <Pagination>
                    <PaginationContent>
                      {generatePaginationItems()}
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* About COR Card */}
        <Card>
          <CardHeader>
            <CardTitle>Despre clasificarea COR</CardTitle>
            <CardDescription>
              Informații despre nomenclatorul clasificării ocupațiilor din România
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p>
                Clasificarea Ocupațiilor din România (COR) reprezintă sistemul de identificare, 
                ierarhizare și codificare a ocupațiilor din economia națională. 
              </p>
              <p>
                COR este utilizat pentru completarea documentelor oficiale, aplicarea politicilor 
                în domeniul forței de muncă, pentru sistemele de evidență și prelucrarea 
                statisitică a datelor privind ocupațiile.
              </p>
              <p>
                Structura COR este compatibilă cu Clasificarea Internațională Standard a Ocupațiilor 
                (ISCO-08) elaborată de Organizația Internațională a Muncii (OIM).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </HrLayout>
  );
};

export default CorPage;