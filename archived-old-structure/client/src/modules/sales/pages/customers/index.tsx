/**
 * Sales Customers Page
 * 
 * Main view for managing sales customers with filtering,
 * sorting, and management capabilities using reusable components.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, UserPlus, Building, User } from 'lucide-react';
import { Link } from 'wouter';

// Import reusable components
import SalesModuleLayout from '../../components/common/SalesModuleLayout';
import FilterBar from '../../components/forms/FilterBar';
import PaginationControls from '../../components/common/PaginationControls';
import EmptyState from '../../components/common/EmptyState';
import ExportDataModal from '../../components/modals/ExportDataModal';

// Import UI components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, FileText, Edit, Eye, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

// Import utilities and hooks
import { useSalesApi } from '../../hooks/useSalesApi';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Customer, CustomerQueryOptions } from '../../types';

// Customer types - moved to types/index.ts but defined here for local use
enum CustomerType {
  COMPANY = 'company',
  INDIVIDUAL = 'individual'
}

enum CustomerCategory {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  VIP = 'vip'
}

const CustomersPage: React.FC = () => {
  // State for filters and pagination
  const [activeView, setActiveView] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({
    type: '',
    category: ''
  });
  
  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  const pageSize = 10;
  const { getCustomers } = useSalesApi();
  
  // Build query options based on filters
  const getQueryOptions = (): CustomerQueryOptions => {
    const options: CustomerQueryOptions = {
      page: currentPage,
      limit: pageSize,
      sortBy,
      sortOrder
    };
    
    if (searchTerm) {
      options.search = searchTerm;
    }
    
    if (selectedFilters.type) {
      options.type = selectedFilters.type;
    }
    
    if (selectedFilters.category) {
      options.category = selectedFilters.category;
    }
    
    // Handle different views
    switch (activeView) {
      case 'active':
        options.active = true;
        break;
      case 'inactive':
        options.active = false;
        break;
      // 'all' view doesn't need any filter
    }
    
    return options;
  };
  
  // Query for customers
  const { data: customers, isLoading } = useQuery({
    queryKey: ['/api/sales/customers', activeView, currentPage, searchTerm, sortBy, sortOrder, selectedFilters],
    queryFn: async () => {
      const queryOptions = getQueryOptions();
      const response = await getCustomers(queryOptions);
      return response;
    }
  });
  
  // Handle sort column click
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedFilters({
      type: '',
      category: ''
    });
    setSearchTerm('');
  };
  
  // Handle export
  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf', includeAll: boolean) => {
    try {
      setIsExporting(true);
      console.log(`Exporting customers as ${format}, includeAll: ${includeAll}`);
      // In a real implementation, this would call the export API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setIsExporting(false);
      setExportModalOpen(false);
    } catch (error) {
      setIsExporting(false);
      console.error('Error exporting customers:', error);
    }
  };
  
  // Calculate total pages
  const totalPages = customers && 'totalPages' in customers ? customers.totalPages : 1;
  
  // Define filter options
  const filterOptions = [
    {
      key: 'type',
      label: 'Tip Client',
      options: [
        { value: CustomerType.COMPANY, label: 'Companie' },
        { value: CustomerType.INDIVIDUAL, label: 'Persoană Fizică' }
      ]
    },
    {
      key: 'category',
      label: 'Categorie',
      options: [
        { value: CustomerCategory.STANDARD, label: 'Standard' },
        { value: CustomerCategory.PREMIUM, label: 'Premium' },
        { value: CustomerCategory.VIP, label: 'VIP' }
      ]
    }
  ];
  
  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };
  
  // Get category color
  const getCategoryColor = (category: CustomerCategory): string => {
    switch (category) {
      case CustomerCategory.STANDARD:
        return 'bg-gray-100 text-gray-800';
      case CustomerCategory.PREMIUM:
        return 'bg-blue-100 text-blue-800';
      case CustomerCategory.VIP:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get customer initials for avatar
  const getCustomerInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Get customer icon based on type
  const getCustomerTypeIcon = (type: CustomerType) => {
    return type === CustomerType.COMPANY ? 
      <Building className="h-4 w-4 mr-1" /> : 
      <User className="h-4 w-4 mr-1" />;
  };
  
  // Define empty state content
  const emptyStateContent = (
    <EmptyState
      icon={<Users className="h-10 w-10" />}
      title="Niciun client găsit"
      description={
        searchTerm || selectedFilters.type || selectedFilters.category
          ? 'Încearcă să ajustezi filtrele de căutare'
          : 'Adaugă primul client pentru a începe să gestionezi relațiile cu clienții'
      }
      actionLabel="Client Nou"
      actionHref="/sales/customers/new"
      actionIcon={<UserPlus className="mr-2 h-4 w-4" />}
      filterActive={!!(searchTerm || selectedFilters.type || selectedFilters.category)}
    />
  );
  
  // Render loading skeletons
  const renderSkeletons = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-10" /></TableCell>
      </TableRow>
    ));
  };
  
  // Check if customers are empty
  const hasNoCustomers = !customers || 
    ('count' in customers && customers.count === 0) || 
    ('data' in customers && customers.data.length === 0);
  
  return (
    <SalesModuleLayout 
      title="Clienți" 
      description="Gestionează baza de clienți și contactele de vânzări"
    >
      <div className="space-y-4">
        {/* Tabs for different views */}
        <Tabs defaultValue="all" value={activeView} onValueChange={setActiveView}>
          <TabsList>
            <TabsTrigger value="all">Toți</TabsTrigger>
            <TabsTrigger value="active">Activi</TabsTrigger>
            <TabsTrigger value="inactive">Inactivi</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Filters and Actions Row */}
        <FilterBar
          searchPlaceholder="Caută clienți..."
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filterOptions}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onResetFilters={resetFilters}
          actionButton={{
            label: "Client Nou",
            icon: <UserPlus className="mr-2 h-4 w-4" />,
            href: "/sales/customers/new"
          }}
          exportButton={true}
          onExport={() => setExportModalOpen(true)}
        />
        
        {/* Customers Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div 
                    className="flex cursor-pointer items-center"
                    onClick={() => handleSort('name')}
                  >
                    Client {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <div 
                    className="flex cursor-pointer items-center"
                    onClick={() => handleSort('type')}
                  >
                    Tip {getSortIcon('type')}
                  </div>
                </TableHead>
                <TableHead className="hidden lg:table-cell">Contact</TableHead>
                <TableHead>
                  <div 
                    className="flex cursor-pointer items-center"
                    onClick={() => handleSort('category')}
                  >
                    Categorie {getSortIcon('category')}
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell text-right">
                  <div 
                    className="flex cursor-pointer items-center justify-end"
                    onClick={() => handleSort('totalSpent')}
                  >
                    Total Vânzări {getSortIcon('totalSpent')}
                  </div>
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <div 
                    className="flex cursor-pointer items-center"
                    onClick={() => handleSort('lastPurchaseDate')}
                  >
                    Ultima Achiziție {getSortIcon('lastPurchaseDate')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                renderSkeletons()
              ) : hasNoCustomers ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    {emptyStateContent}
                  </TableCell>
                </TableRow>
              ) : (
                'data' in customers && customers.data.map((customer: Customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={customer.type === CustomerType.COMPANY ? 'bg-blue-100' : 'bg-green-100'}>
                            {getCustomerInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            <Link href={`/sales/customers/${customer.id}`} className="hover:text-primary hover:underline">
                              {customer.name}
                            </Link>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {customer.active ? 'Activ' : 'Inactiv'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center">
                        {getCustomerTypeIcon(customer.type as any)}
                        {customer.type === 'company' ? 'Companie' : 'Persoană Fizică'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">
                        <div>{customer.email}</div>
                        <div>{customer.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getCategoryColor(customer.category as any)}>
                        {customer.category || 'Standard'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      {formatCurrency(customer.totalSpent || 0, customer.currency || 'RON')}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(customer.lastPurchaseDate, 'Niciodată')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/sales/customers/${customer.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Vezi detalii
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/sales/customers/${customer.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editează
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/sales/customers/${customer.id}/deals`}>
                              <FileText className="mr-2 h-4 w-4" />
                              Vezi contracte
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Șterge
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {!isLoading && customers && 'totalPages' in customers && customers.totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-4"
          />
        )}
        
        {/* Export Modal */}
        <ExportDataModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          onExport={handleExport}
          title="Exportă Clienți"
          description="Exportă lista de clienți în formatul dorit."
          supportedFormats={['csv', 'xlsx', 'pdf']}
          isExporting={isExporting}
          entityType="clienți"
        />
      </div>
    </SalesModuleLayout>
  );
};

export default CustomersPage;