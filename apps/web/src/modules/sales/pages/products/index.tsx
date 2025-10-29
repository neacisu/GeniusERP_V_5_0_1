/**
 * Sales Products Page
 * 
 * Main view for managing sales products/services with filtering,
 * sorting, and management capabilities using reusable components.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Plus, Package, Archive, Layers, Settings, Tag } from 'lucide-react';
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
import { MoreHorizontal, Edit, Eye, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

// Import utilities and hooks
import { useSalesApi } from '../../hooks/useSalesApi';
import { formatCurrency } from '../../utils/formatters';

// Product types
enum ProductType {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
  SERVICE = 'service',
  SUBSCRIPTION = 'subscription'
}

enum ProductStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  ARCHIVED = 'archived'
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  costPrice?: number;
  type: ProductType;
  status: ProductStatus;
  category: string;
  stock?: number;
  description: string;
  createdAt: string;
}

interface ProductQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  type?: ProductType;
  status?: ProductStatus;
  category?: string;
}

const ProductsPage: React.FC = () => {
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
  const { getProducts } = useSalesApi();
  
  // Build query options based on filters
  const getQueryOptions = (): ProductQueryOptions => {
    const options: ProductQueryOptions = {
      page: currentPage,
      limit: pageSize,
      sortBy,
      sortOrder
    };
    
    if (searchTerm) {
      options.search = searchTerm;
    }
    
    if (selectedFilters['type']) {
      options.type = selectedFilters['type'] as ProductType;
    }
    
    if (selectedFilters['category']) {
      options.category = selectedFilters['category'];
    }
    
    // Handle different views
    switch (activeView) {
      case 'active':
        options.status = ProductStatus.ACTIVE;
        break;
      case 'draft':
        options.status = ProductStatus.DRAFT;
        break;
      case 'archived':
        options.status = ProductStatus.ARCHIVED;
        break;
      // 'all' view doesn't need any filter
    }
    
    return options;
  };
  
  // Query for products
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/sales/products', activeView, currentPage, searchTerm, sortBy, sortOrder, selectedFilters],
    queryFn: async () => {
      const queryOptions = getQueryOptions();
      const response = await getProducts(queryOptions);
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
      console.log(`Exporting products as ${format}, includeAll: ${includeAll}`);
      // In a real implementation, this would call the export API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setIsExporting(false);
      setExportModalOpen(false);
    } catch (error) {
      setIsExporting(false);
      console.error('Error exporting products:', error);
    }
  };
  
  // Calculate total pages
  const totalPages = products && 'totalPages' in products ? products.totalPages : 1;
  
  // Get categories (in a real app would be from API)
  const productCategories = [
    'Hardware',
    'Software',
    'Consultanță',
    'Training',
    'Licențe'
  ];
  
  // Define filter options
  const filterOptions = [
    {
      key: 'type',
      label: 'Tip Produs',
      options: [
        { value: ProductType.PHYSICAL, label: 'Fizic' },
        { value: ProductType.DIGITAL, label: 'Digital' },
        { value: ProductType.SERVICE, label: 'Serviciu' },
        { value: ProductType.SUBSCRIPTION, label: 'Abonament' }
      ]
    },
    {
      key: 'category',
      label: 'Categorie',
      options: productCategories.map(category => ({
        value: category,
        label: category
      }))
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
  
  // Get type icon
  const getProductTypeIcon = (type: ProductType) => {
    switch (type) {
      case ProductType.PHYSICAL:
        return <Package className="h-4 w-4 mr-1" />;
      case ProductType.DIGITAL:
        return <Layers className="h-4 w-4 mr-1" />;
      case ProductType.SERVICE:
        return <Settings className="h-4 w-4 mr-1" />;
      case ProductType.SUBSCRIPTION:
        return <Archive className="h-4 w-4 mr-1" />;
      default:
        return <Package className="h-4 w-4 mr-1" />;
    }
  };
  
  // Get product status badge
  const getProductStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case ProductStatus.ACTIVE:
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Activ</Badge>;
      case ProductStatus.DRAFT:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200">Schiță</Badge>;
      case ProductStatus.ARCHIVED:
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Arhivat</Badge>;
      default:
        return <Badge variant="outline">Necunoscut</Badge>;
    }
  };
  
  // Define empty state content
  const emptyStateContent = (
    <EmptyState
      icon={<ShoppingBag className="h-10 w-10" />}
      title="Niciun produs găsit"
      description={
        searchTerm || selectedFilters['type'] || selectedFilters['category']
          ? 'Încearcă să ajustezi filtrele de căutare'
          : 'Adaugă primul produs pentru a începe să-ți gestionezi oferta'
      }
      actionLabel="Produs Nou"
      actionHref="/sales/products/new"
      actionIcon={<Plus className="mr-2 h-4 w-4" />}
      filterActive={!!(searchTerm || selectedFilters['type'] || selectedFilters['category'])}
    />
  );
  
  // Render loading skeletons
  const renderSkeletons = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
        <TableCell><Skeleton className="h-6 w-10" /></TableCell>
      </TableRow>
    ));
  };
  
  // Check if products are empty
  const hasNoProducts = !products || 
    ('count' in products && products.count === 0) || 
    ('data' in products && products.data.length === 0);
  
  return (
    <SalesModuleLayout 
      title="Produse" 
      description="Gestionează catalogul de produse și servicii"
    >
      <div className="space-y-4">
        {/* Tabs for different views */}
        <Tabs defaultValue="all" value={activeView} onValueChange={setActiveView}>
          <TabsList>
            <TabsTrigger value="all">Toate</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Schițe</TabsTrigger>
            <TabsTrigger value="archived">Arhivate</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Filters and Actions Row */}
        <FilterBar
          searchPlaceholder="Caută produse..."
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filterOptions}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onResetFilters={resetFilters}
          actionButton={{
            label: "Produs Nou",
            icon: <Plus className="mr-2 h-4 w-4" />,
            href: "/sales/products/new"
          }}
          exportButton={true}
          onExport={() => setExportModalOpen(true)}
        />
        
        {/* Products Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div 
                    className="flex cursor-pointer items-center"
                    onClick={() => handleSort('name')}
                  >
                    Produs {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <div 
                    className="flex cursor-pointer items-center"
                    onClick={() => handleSort('sku')}
                  >
                    SKU {getSortIcon('sku')}
                  </div>
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <div 
                    className="flex cursor-pointer items-center"
                    onClick={() => handleSort('type')}
                  >
                    Tip {getSortIcon('type')}
                  </div>
                </TableHead>
                <TableHead>
                  <div 
                    className="flex cursor-pointer items-center"
                    onClick={() => handleSort('price')}
                  >
                    Preț {getSortIcon('price')}
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <div 
                    className="flex cursor-pointer items-center"
                    onClick={() => handleSort('category')}
                  >
                    Categorie {getSortIcon('category')}
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                renderSkeletons()
              ) : hasNoProducts ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    {emptyStateContent}
                  </TableCell>
                </TableRow>
              ) : (
                'data' in products && products.data.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">
                        <Link href={`/sales/products/${product.id}`} className="hover:text-primary hover:underline">
                          {product.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{product.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center">
                        {getProductTypeIcon(product.type)}
                        <span>
                          {product.type === ProductType.PHYSICAL && 'Fizic'}
                          {product.type === ProductType.DIGITAL && 'Digital'}
                          {product.type === ProductType.SERVICE && 'Serviciu'}
                          {product.type === ProductType.SUBSCRIPTION && 'Abonament'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(product.price, product.currency)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getProductStatusBadge(product.status)}
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
                            <Link href={`/sales/products/${product.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Vezi detalii
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/sales/products/${product.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editează
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
        {!isLoading && products && 'totalPages' in products && products.totalPages > 1 && (
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
          title="Exportă Produse"
          description="Exportă lista de produse în formatul dorit."
          supportedFormats={['csv', 'xlsx', 'pdf']}
          isExporting={isExporting}
          entityType="produse"
        />
      </div>
    </SalesModuleLayout>
  );
};

export default ProductsPage;