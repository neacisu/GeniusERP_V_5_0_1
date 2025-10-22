import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Eye,
  FileText,
  File,
  ArrowUpDown,
  Search,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

export interface RegistryEntry {
  id: string;
  registryNumber: string;
  date: string;
  title: string;
  type: string;
  status: 'registered' | 'pending' | 'processed' | 'archived';
  sender: string;
  recipient: string;
  notes?: string;
}

interface RegistryTableProps {
  entries: RegistryEntry[];
  onView?: (entry: RegistryEntry) => void;
  onDownload?: (entry: RegistryEntry) => void;
  onStatusChange?: (entryId: string, newStatus: RegistryEntry['status']) => void;
  onSearch?: (query: string) => void;
}

/**
 * Registry Table Component
 * 
 * Displays document registry entries in a table with sorting, filtering and pagination
 */
const RegistryTable: React.FC<RegistryTableProps> = ({
  entries = [],
  onView,
  onDownload,
  onStatusChange,
  onSearch
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof RegistryEntry>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };
  
  // Handle sort change
  const handleSort = (column: keyof RegistryEntry) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Handle entry selection
  const handleSelectEntry = (entryId: string, checked: boolean) => {
    if (checked) {
      setSelectedEntries(prev => [...prev, entryId]);
    } else {
      setSelectedEntries(prev => prev.filter(id => id !== entryId));
    }
  };
  
  // Handle select all entries on current page
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageEntryIds = paginatedEntries.map(entry => entry.id);
      setSelectedEntries(pageEntryIds);
    } else {
      setSelectedEntries([]);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Get status badge variant and text
  const getStatusBadge = (status: RegistryEntry['status']) => {
    switch (status) {
      case 'registered':
        return { variant: 'success' as const, text: 'Înregistrat', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> };
      case 'pending':
        return { variant: 'secondary' as const, text: 'În așteptare', icon: <Clock className="h-3 w-3 mr-1" /> };
      case 'processed':
        return { variant: 'default' as const, text: 'Procesat', icon: <UserCheck className="h-3 w-3 mr-1" /> };
      case 'archived':
        return { variant: 'outline' as const, text: 'Arhivat', icon: <FileText className="h-3 w-3 mr-1" /> };
      default:
        return { variant: 'secondary' as const, text: 'Necunoscut', icon: null };
    }
  };
  
  // Get document type icon
  const getDocumentTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <File className="h-4 w-4 text-red-500" />;
      case 'document':
      case 'text':
      default:
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };
  
  // Handle status change for an entry
  const handleStatusChange = (entryId: string, newStatus: RegistryEntry['status']) => {
    if (onStatusChange) {
      onStatusChange(entryId, newStatus);
    }
  };
  
  // Sort and paginate entries
  const sortedEntries = [...entries].sort((a, b) => {
    if (sortColumn === 'date') {
      const dateA = new Date(a[sortColumn]).getTime();
      const dateB = new Date(b[sortColumn]).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      const valueA = String(a[sortColumn]).toLowerCase();
      const valueB = String(b[sortColumn]).toLowerCase();
      return sortDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
  });
  
  const totalPages = Math.ceil(sortedEntries.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedEntries = sortedEntries.slice(startIndex, startIndex + perPage);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Caută după număr, titlu, expeditor..."
              className="pl-9"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <Button type="submit">Caută</Button>
        </form>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Afișează:</span>
          <Select
            value={String(perPage)}
            onValueChange={(value) => setPerPage(Number(value))}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={paginatedEntries.length > 0 && selectedEntries.length === paginatedEntries.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort('registryNumber')}>
                <div className="flex items-center">
                  Nr. Registru
                  {sortColumn === 'registryNumber' && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort('date')}>
                <div className="flex items-center">
                  Dată
                  {sortColumn === 'date' && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
                <div className="flex items-center">
                  Titlu Document
                  {sortColumn === 'title' && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('sender')}>
                <div className="flex items-center">
                  Expeditor
                  {sortColumn === 'sender' && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('recipient')}>
                <div className="flex items-center">
                  Destinatar
                  {sortColumn === 'recipient' && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                <div className="flex items-center">
                  Status
                  {sortColumn === 'status' && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FileText className="h-10 w-10 mb-2" />
                    <p>Nu există înregistrări</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedEntries.map((entry) => {
                const statusInfo = getStatusBadge(entry.status);
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedEntries.includes(entry.id)}
                        onCheckedChange={(checked) => handleSelectEntry(entry.id, !!checked)}
                        aria-label={`Select ${entry.title}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{entry.registryNumber}</TableCell>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDocumentTypeIcon(entry.type)}
                        <span>{entry.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{entry.sender}</TableCell>
                    <TableCell>{entry.recipient}</TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        <div className="flex items-center">
                          {statusInfo.icon}
                          {statusInfo.text}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(entry)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {onDownload && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownload(entry)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {onStatusChange && (
                          <Select
                            value={entry.status}
                            onValueChange={(value) => handleStatusChange(entry.id, value as RegistryEntry['status'])}
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="registered">Înregistrat</SelectItem>
                              <SelectItem value="pending">În așteptare</SelectItem>
                              <SelectItem value="processed">Procesat</SelectItem>
                              <SelectItem value="archived">Arhivat</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {entries.length > 0 ? (
            <>
              Afișare {startIndex + 1}-{Math.min(startIndex + perPage, entries.length)} din {entries.length} înregistrări
            </>
          ) : (
            <>0 înregistrări</>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm px-4">
            Pagina {currentPage} din {totalPages || 1}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegistryTable;