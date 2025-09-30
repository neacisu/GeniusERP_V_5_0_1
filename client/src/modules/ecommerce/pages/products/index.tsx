/**
 * E-commerce Products Page
 * 
 * This page displays the product catalog with filtering, sorting, and search capabilities.
 * It allows for adding new products, editing existing ones, and syncing with Shopify.
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { EcommerceModuleLayout } from '../../components/common/EcommerceModuleLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { 
  Search, 
  MoreHorizontal, 
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Copy,
  Tag,
  Eye,
  ArrowUpDown,
  ChevronsUpDown,
  Cloud,
  LayoutGrid,
  List
} from 'lucide-react';

export default function ProductsPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Placeholder data - in a real implementation, this would come from an API
  const products = [
    {
      id: '1',
      name: 'Tricou Essential',
      sku: 'TSH-001',
      price: '89.99 RON',
      comparePrice: '129.99 RON',
      category: 'Îmbrăcăminte',
      stock: 25,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      shopifySync: true,
    },
    {
      id: '2',
      name: 'Pantaloni Casual',
      sku: 'PNT-002',
      price: '149.99 RON',
      comparePrice: '199.99 RON',
      category: 'Îmbrăcăminte',
      stock: 15,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      shopifySync: true,
    },
    {
      id: '3',
      name: 'Căști Wireless',
      sku: 'ELEC-001',
      price: '299.99 RON',
      comparePrice: '349.99 RON',
      category: 'Electronice',
      stock: 8,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      shopifySync: true,
    },
    {
      id: '4',
      name: 'Smartwatch',
      sku: 'ELEC-002',
      price: '399.99 RON',
      comparePrice: null,
      category: 'Electronice',
      stock: 5,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      shopifySync: true,
    },
    {
      id: '5',
      name: 'Set Lumânări Parfumate',
      sku: 'HOME-001',
      price: '79.99 RON',
      comparePrice: '99.99 RON',
      category: 'Casă & Grădină',
      stock: 20,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1528822855841-e8bf3134cdc9?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      shopifySync: false,
    },
    {
      id: '6',
      name: 'Vază Decorativă',
      sku: 'HOME-002',
      price: '129.99 RON',
      comparePrice: null,
      category: 'Casă & Grădină',
      stock: 12,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1602760566883-4934984ce3ff?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      shopifySync: false,
    },
    {
      id: '7',
      name: 'Set Tacâmuri',
      sku: 'HOME-003',
      price: '199.99 RON',
      comparePrice: '249.99 RON',
      category: 'Casă & Grădină',
      stock: 10,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1566454825481-a2f0c9a86bb9?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      shopifySync: true,
    },
    {
      id: '8',
      name: 'Geantă de Laptop',
      sku: 'ACC-001',
      price: '159.99 RON',
      comparePrice: null,
      category: 'Accesorii',
      stock: 0,
      status: 'out_of_stock',
      image: 'https://images.unsplash.com/photo-1628149455678-16f4a3038f5c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      shopifySync: true,
    },
    {
      id: '9',
      name: 'Rucsac Urban',
      sku: 'ACC-002',
      price: '179.99 RON',
      comparePrice: '229.99 RON',
      category: 'Accesorii',
      stock: 7,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      shopifySync: true,
    },
    {
      id: '10',
      name: 'Ochelari de Soare',
      sku: 'ACC-003',
      price: '149.99 RON',
      comparePrice: null,
      category: 'Accesorii',
      stock: 9,
      status: 'draft',
      image: 'https://images.unsplash.com/photo-1618891973493-5e48381e151e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      shopifySync: false,
    },
    {
      id: '11',
      name: 'Set Îngrijire Față',
      sku: 'BEAUTY-001',
      price: '199.99 RON',
      comparePrice: '249.99 RON',
      category: 'Beauty',
      stock: 15,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      shopifySync: true,
    },
    {
      id: '12',
      name: 'Încălțăminte Sport',
      sku: 'FOOT-001',
      price: '249.99 RON',
      comparePrice: '299.99 RON',
      category: 'Încălțăminte',
      stock: 6,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      shopifySync: true,
    },
  ];
  
  // Filter products based on search term and filters
  const filteredProducts = products.filter(product => {
    // Apply search filter
    const searchMatch = 
      searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply category filter
    const categoryMatch = categoryFilter === 'all' || product.category === categoryFilter;
    
    // Apply stock filter
    let stockMatch = true;
    if (stockFilter === 'in_stock') {
      stockMatch = product.stock > 0;
    } else if (stockFilter === 'out_of_stock') {
      stockMatch = product.stock === 0;
    } else if (stockFilter === 'low_stock') {
      stockMatch = product.stock > 0 && product.stock <= 5;
    }
    
    return searchMatch && categoryMatch && stockMatch;
  });
  
  // Pagination
  const itemsPerPage = viewMode === 'grid' ? 12 : 10;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Activ</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Ciornă</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Stoc epuizat</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };
  
  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Stoc epuizat</Badge>;
    } else if (stock <= 5) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Stoc redus ({stock})</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">În stoc ({stock})</Badge>;
    }
  };
  
  const handleEditProduct = (productId: string) => {
    // In a real application, navigate to the edit product page
    console.log('Edit product', productId);
  };
  
  const getSyncStatusBadge = (synced: boolean) => {
    if (synced) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Sincronizat</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Nesincronizat</Badge>;
    }
  };
  
  // Get unique categories for filter
  const categories = ['all', ...new Set(products.map(product => product.category))];
  
  return (
    <EcommerceModuleLayout activeTab="products">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Produse</h1>
            <p className="text-muted-foreground">Gestionează catalogul de produse din magazinul online</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reîmprospătează
            </Button>
            <Button variant="outline" size="sm">
              <Cloud className="mr-2 h-4 w-4" />
              Sincronizează cu Shopify
            </Button>
            <Button variant="default" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Produs Nou
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-1 items-center space-x-2">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Caută produse..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-row space-x-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Toate categoriile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate categoriile</SelectItem>
                  {categories.filter(cat => cat !== 'all').map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Stoc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate produsele</SelectItem>
                  <SelectItem value="in_stock">În stoc</SelectItem>
                  <SelectItem value="out_of_stock">Stoc epuizat</SelectItem>
                  <SelectItem value="low_stock">Stoc redus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center rounded-md border p-1 text-muted-foreground">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="sr-only">Grid view</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
                <span className="sr-only">List view</span>
              </Button>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="mb-1">
          <TabsList>
            <TabsTrigger value="all">Toate Produsele ({products.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({products.filter(p => p.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="shopify">Sincronizate ({products.filter(p => p.shopifySync).length})</TabsTrigger>
            <TabsTrigger value="draft">Ciorne ({products.filter(p => p.status === 'draft').length})</TabsTrigger>
            <TabsTrigger value="out_of_stock">Stoc Epuizat ({products.filter(p => p.stock === 0).length})</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="object-cover w-full h-full transition-all hover:scale-105"
                  />
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8 bg-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem onClick={() => handleEditProduct(product.id)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editează
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" /> Previzualizare
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" /> Duplică
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Șterge
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{product.category}</Badge>
                    {getStatusBadge(product.status)}
                  </div>
                  <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
                  <div className="flex items-center mt-1 space-x-1">
                    <div className="font-medium">{product.price}</div>
                    {product.comparePrice && (
                      <div className="text-sm text-muted-foreground line-through">{product.comparePrice}</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                    {getStockBadge(product.stock)}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`sync-${product.id}`} className="text-sm">Shopify</Label>
                    <Switch
                      id={`sync-${product.id}`}
                      checked={product.shopifySync}
                      onCheckedChange={() => {}}
                    />
                  </div>
                  {getSyncStatusBadge(product.shopifySync)}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[700px]">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="h-10 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Produs</span>
                          <ChevronsUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-10 px-4 text-left font-medium">SKU</th>
                      <th className="h-10 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Preț</span>
                          <ChevronsUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-10 px-4 text-left font-medium">Categorie</th>
                      <th className="h-10 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Stoc</span>
                          <ChevronsUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-10 px-4 text-left font-medium">Status</th>
                      <th className="h-10 px-4 text-left font-medium">Shopify</th>
                      <th className="h-10 px-4 text-right font-medium">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 rounded-md overflow-hidden">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">{product.sku}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{product.price}</div>
                          {product.comparePrice && (
                            <div className="text-xs text-muted-foreground line-through">
                              {product.comparePrice}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{product.category}</Badge>
                        </td>
                        <td className="p-4">
                          {getStockBadge(product.stock)}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(product.status)}
                        </td>
                        <td className="p-4">
                          {getSyncStatusBadge(product.shopifySync)}
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditProduct(product.id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editează
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Previzualizare
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplică
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Șterge
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
        
        {filteredProducts.length > 0 && totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </EcommerceModuleLayout>
  );
}