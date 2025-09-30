/**
 * Products Management Page
 * 
 * Comprehensive interface for managing product catalog in the inventory system.
 * Includes product CRUD operations, filtering, categorization, and detail views.
 */

import React, { useState, useEffect } from "react";
import { useProducts, useCategories, useUnits } from "../../hooks/useInventoryApi";
import { 
  Product, 
  ProductCategory, 
  ProductUnit, 
  ProductFormValues, 
  SelectedProducts, 
  BulkEditFormValues 
} from "../../types";

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Lucide icons
import { 
  Clipboard, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  PackageCheck,
  Package,
  Barcode,
  Tag,
  CircleDollarSign,
  Percent,
  Loader2,
  MoreHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  FileBarChart,
  History,
  Save,
  Upload,
  FileUp,
  FileJson,
  FileSpreadsheet,
  Table as TableIcon,
  X
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Form validation
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Custom components
import PageHeader from "../../components/common/PageHeader";
import TabsNav from "../../components/common/TabsNav";
import { SheetTrigger, Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

// Validare form
const productSchema = z.object({
  name: z.string().min(2, {
    message: "Numele produsului trebuie să conțină cel puțin 2 caractere.",
  }),
  sku: z.string().min(2, {
    message: "Codul SKU trebuie să conțină cel puțin 2 caractere.",
  }),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
  purchasePrice: z.coerce.number().nonnegative().optional(),
  sellingPrice: z.coerce.number().nonnegative().optional(),
  vatRate: z.coerce.number().nonnegative().default(19),
  stockAlert: z.coerce.number().nonnegative().optional(),
  isActive: z.boolean().default(true),
  priceIncludesVat: z.boolean().default(false)
});

// Schema pentru editare bulk
const bulkEditSchema = z.object({
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
  vatRate: z.coerce.number().nonnegative().optional(),
  purchasePrice: z.coerce.number().nonnegative().optional(),
  sellingPrice: z.coerce.number().nonnegative().optional(),
  stockAlert: z.coerce.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
  priceIncludesVat: z.boolean().optional()
});

export default function ProductsPage() {
  // State pentru produsul selectat pentru detalii
  const [productDetailId, setProductDetailId] = useState<string | null>(null);
  
  // State pentru filtrare
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // State pentru dialoguri
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // State pentru import
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<"csv" | "excel" | "json">("csv");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  // Dialog pentru număr personalizat de produse pe pagină
  const [isCustomPageSizeDialogOpen, setIsCustomPageSizeDialogOpen] = useState(false);
  const [customPageSize, setCustomPageSize] = useState<number>(10);
  const [uploadOption, setUploadOption] = useState<"new" | "update">("new");
  const [matchBy, setMatchBy] = useState<"sku" | "name">("sku");
  
  // State pentru tab-uri
  const [activeTab, setActiveTab] = useState("all");
  
  // State pentru selecție multiplă de produse
  const [selectedProducts, setSelectedProducts] = useState<SelectedProducts>({});
  
  // State pentru editare în masă
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  
  // Toast
  const { toast } = useToast();

  // Extragem datele și funcționalitățile din hook-urile personalizate
  const { 
    products, 
    isLoading: isLoadingProducts, 
    isError: isErrorProducts, 
    createProduct, 
    updateProduct, 
    deactivateProduct,
    filters,
    setFilters,
    bulkUpdateProducts,
    validateImport,
    importProducts,
    pagination,
    changePage,
    changePageSize
  } = useProducts();

  const {
    categories,
    isLoading: isLoadingCategories,
    isError: isErrorCategories
  } = useCategories();

  const {
    units,
    isLoading: isLoadingUnits,
    isError: isErrorUnits
  } = useUnits();

  // Combinăm stările de încărcare
  const isLoading = isLoadingProducts || isLoadingCategories || isLoadingUnits;
  const isError = isErrorProducts || isErrorCategories || isErrorUnits;

  // Formular pentru creare/editare produs
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      description: "",
      categoryId: undefined,
      unitId: undefined,
      purchasePrice: 0,
      sellingPrice: 0,
      vatRate: 19,
      stockAlert: 0,
      isActive: true,
      priceIncludesVat: false
    },
  });

  // Formular pentru editare în masă
  const bulkEditForm = useForm<z.infer<typeof bulkEditSchema>>({
    resolver: zodResolver(bulkEditSchema),
    defaultValues: {
      categoryId: undefined,
      unitId: undefined,
      vatRate: undefined,
      purchasePrice: undefined,
      sellingPrice: undefined,
      stockAlert: undefined,
      isActive: undefined,
      priceIncludesVat: undefined
    },
  });

  // Resetăm formularul când se deschide/închide dialogul
  useEffect(() => {
    if (!isProductDialogOpen) {
      setEditingProduct(null);
      form.reset();
    }
  }, [isProductDialogOpen, form]);

  // Populăm formularul cu datele produsului de editat
  useEffect(() => {
    if (editingProduct) {
      form.reset({
        name: editingProduct.name,
        sku: editingProduct.sku || "",
        barcode: editingProduct.barcode || "",
        description: editingProduct.description || "",
        categoryId: editingProduct.categoryId || undefined,
        unitId: editingProduct.unitId || undefined,
        purchasePrice: editingProduct.purchasePrice ? Number(editingProduct.purchasePrice) : 0,
        sellingPrice: editingProduct.sellingPrice ? Number(editingProduct.sellingPrice) : 0,
        vatRate: editingProduct.vatRate ? Number(editingProduct.vatRate) : 19,
        stockAlert: editingProduct.stockAlert ? Number(editingProduct.stockAlert) : 0,
        isActive: editingProduct.isActive,
        priceIncludesVat: editingProduct.priceIncludesVat || false
      });
    }
  }, [editingProduct, form]);

  // Handler pentru adăugare produs nou
  const handleAddNew = () => {
    setEditingProduct(null);
    setIsProductDialogOpen(true);
  };

  // Handler pentru editare produs
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsProductDialogOpen(true);
  };

  // Handler pentru submit formular
  const onSubmit = (values: z.infer<typeof productSchema>) => {
    // Verificăm dacă este editare sau creare
    if (editingProduct) {
      // Actualizare produs existent
      updateProduct.mutate({
        ...values,
        id: editingProduct.id,
        purchasePrice: values.purchasePrice as number,
        sellingPrice: values.sellingPrice as number,
        vatRate: values.vatRate as number,
        stockAlert: values.stockAlert as number,
        isActive: values.isActive,
        priceIncludesVat: values.priceIncludesVat
      });
    } else {
      // Creare produs nou
      createProduct.mutate({
        ...values,
        purchasePrice: values.purchasePrice as number,
        sellingPrice: values.sellingPrice as number,
        vatRate: values.vatRate as number,
        stockAlert: values.stockAlert as number,
        isActive: values.isActive,
        priceIncludesVat: values.priceIncludesVat
      });
    }
    
    // Închidem dialogul
    setIsProductDialogOpen(false);
  };

  // Procesare fișier importat
  const processFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          
          if (importType === "json") {
            // Procesare JSON
            const data = JSON.parse(content);
            resolve(Array.isArray(data) ? data : [data]);
          } else {
            // Procesare CSV/Excel
            const lines = content.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            const results = [];
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              const values = line.split(',').map(v => v.trim());
              const entry: any = {};
              
              headers.forEach((header, index) => {
                entry[header] = values[index];
              });
              
              results.push(entry);
            }
            
            resolve(results);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Eroare la citirea fișierului'));
      };
      
      if (importType === "json") {
        reader.readAsText(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  // Handler pentru import
  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "Eroare",
        description: "Selectați un fișier pentru import",
        variant: "destructive"
      });
      return;
    }
    
    setIsImporting(true);
    setImportProgress(0);
    
    try {
      // Setăm progres inițial
      setImportProgress(10);
      
      // Procesăm fișierul localmente pentru a extrage datele
      const data = await processFile(importFile);
      setImportProgress(30);
      
      // Validăm datele prin API
      const validationResult = await validateImport.mutateAsync(data);
      setImportProgress(60);
      
      if (!validationResult.validationReport?.isValid) {
        throw new Error(
          `Datele importate conțin erori: ${validationResult.validationReport?.errors.length} erori găsite`
        );
      }
      
      // Trimitem datele validate pentru import
      const importOptions = {
        mode: uploadOption === 'new' ? 'create' : 'update',
        matchField: matchBy,
        format: importType,
        generateBarcodes: true
      };
      
      await importProducts.mutateAsync({
        data: validationResult.validationReport.validData,
        options: importOptions
      });
      
      setImportProgress(100);
      
      // Resetăm starea după import reușit
      setTimeout(() => {
        setIsImporting(false);
        setIsImportDialogOpen(false);
        setImportFile(null);
        setImportProgress(0);
      }, 500);
      
    } catch (error) {
      setIsImporting(false);
      setImportProgress(0);
      toast({
        title: "Eroare la import",
        description: error instanceof Error ? error.message : "A apărut o eroare la importul produselor",
        variant: "destructive"
      });
    }
  };

  // Produsul selectat pentru detalii
  const selectedProduct = productDetailId 
    ? products.find(p => p.id === productDetailId) 
    : null;
  
  // Filtrăm produsele în funcție de căutare și categorie
  const filteredProducts = React.useMemo(() => {
    let result = [...products];
    
    // Filtrare după tab activ
    if (activeTab === "active") {
      result = result.filter(p => p.isActive);
    } else if (activeTab === "inactive") {
      result = result.filter(p => !p.isActive);
    }
    
    // Filtrare după categorie
    if (selectedCategory !== "all") {
      result = result.filter(p => p.categoryId === selectedCategory);
    }
    
    // Filtrare după căutare
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [products, activeTab, selectedCategory, searchQuery]);
  
  // Obținem doar produsele pentru pagina curentă
  // Default pagination values
  const DEFAULT_PAGE = 1;
  const DEFAULT_PAGE_SIZE = 10;
  
  const paginatedProducts = React.useMemo(() => {
    // If pagination is undefined, use default values
    const page = pagination?.page || DEFAULT_PAGE;
    const pageSize = pagination?.pageSize || DEFAULT_PAGE_SIZE;
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, pagination]);
  
  // Elemente de tab-uri
  const tabItems = [
    { id: "all", label: "Toate" },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" }
  ];
  
  // Funcții helper pentru a obține numele categoriei și unității
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "-";
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "-";
  };
  
  const getUnitName = (unitId?: string) => {
    if (!unitId) return "-";
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.abbreviation : "-";
  };
  
  // Verificăm dacă există produse selectate
  const hasSelectedProducts = Object.values(selectedProducts).some(Boolean);
  const selectedProductsCount = Object.values(selectedProducts).filter(Boolean).length;
  
  // Handler pentru închiderea dialogului de editare în masă
  const handleBulkEditDialogChange = (open: boolean) => {
    setIsBulkEditDialogOpen(open);
    if (!open) {
      bulkEditForm.reset();
    }
  };
  
  // Handler pentru submit-ul formularului de editare în masă
  const onBulkEditSubmit = (values: z.infer<typeof bulkEditSchema>) => {
    // Extragem ID-urile produselor selectate
    const productIds = Object.entries(selectedProducts)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);
    
    // Eliminăm valorile undefined pentru a actualiza doar câmpurile modificate
    const updateData: Partial<BulkEditFormValues> = {};
    
    for (const key in values) {
      const value = values[key as keyof typeof values];
      if (value !== undefined) {
        updateData[key as keyof typeof updateData] = value;
      }
    }
    
    // Apelăm mutația de actualizare în masă
    bulkUpdateProducts.mutate({
      productIds,
      updateData
    }, {
      onSuccess: () => {
        setIsBulkEditDialogOpen(false);
        setSelectedProducts({});
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Produse" 
        description="Catalog de produse și servicii pentru stocuri"
        onAddNew={handleAddNew}
        addNewLabel="Produs Nou"
        actions={
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileUp className="mr-2 h-4 w-4" />
                  Import
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setImportType("excel");
                  setIsImportDialogOpen(true);
                }}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Import CSV pentru Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setImportType("csv");
                  setIsImportDialogOpen(true);
                }}>
                  <TableIcon className="mr-2 h-4 w-4" />
                  Import CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setImportType("json");
                  setIsImportDialogOpen(true);
                }}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Import JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtre
              {showFilters ? 
                <ChevronDown className="ml-2 h-4 w-4" /> : 
                <ChevronDown className="ml-2 h-4 w-4 transform rotate-180" />
              }
            </Button>
          </div>
        }
      />
      
      {/* Filters panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category-filter">Categorie</Label>
                <Select 
                  value={selectedCategory} 
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger id="category-filter">
                    <SelectValue placeholder="Toate categoriile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate categoriile</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price-filter">Limită preț</Label>
                <div className="flex space-x-2">
                  <Input id="price-min" type="number" placeholder="Min" className="w-1/2" />
                  <Input id="price-max" type="number" placeholder="Max" className="w-1/2" />
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <Button className="flex-1" variant="secondary">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aplică filtre
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <CardTitle>Catalog Produse</CardTitle>
                  {hasSelectedProducts && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsBulkEditDialogOpen(true)}
                      className="flex items-center"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editează ({selectedProductsCount}) produse
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Caută produs..."
                    className="pl-8 w-[200px] md:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <CardDescription>
                Catalog complet de produse și bunuri gestionate
              </CardDescription>
              <TabsNav 
                tabs={tabItems} 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                className="mt-2"
              />
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox 
                          checked={filteredProducts.length > 0 && Object.keys(selectedProducts).length === filteredProducts.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Selectează toate produsele
                              const allSelected = filteredProducts.reduce((acc, product) => {
                                acc[product.id] = true;
                                return acc;
                              }, {} as Record<string, boolean>);
                              setSelectedProducts(allSelected);
                            } else {
                              // Deselectează toate produsele
                              setSelectedProducts({});
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Denumire</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>UM</TableHead>
                      <TableHead className="text-right">Preț Achiziție</TableHead>
                      <TableHead className="text-right">Preț Vânzare</TableHead>
                      <TableHead className="text-center">TVA</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                          Nu există produse care să corespundă criteriilor.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedProducts.map((product) => (
                        <TableRow key={product.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Checkbox 
                              checked={selectedProducts[product.id] || false}
                              onCheckedChange={(checked) => {
                                setSelectedProducts(prev => ({
                                  ...prev,
                                  [product.id]: !!checked
                                }));
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell 
                            className="font-medium cursor-pointer"
                            onClick={() => setProductDetailId(product.id)}
                          >
                            {product.sku}
                          </TableCell>
                          <TableCell 
                            className="cursor-pointer"
                            onClick={() => setProductDetailId(product.id)}
                          >
                            <div className="flex items-center">
                              {!product.isActive && (
                                <Badge variant="outline" className="mr-2 bg-gray-100 text-gray-800">
                                  Inactiv
                                </Badge>
                              )}
                              {product.name}
                            </div>
                          </TableCell>
                          <TableCell 
                            className="cursor-pointer"
                            onClick={() => setProductDetailId(product.id)}
                          >
                            {getCategoryName(product.categoryId)}
                          </TableCell>
                          <TableCell 
                            className="cursor-pointer"
                            onClick={() => setProductDetailId(product.id)}
                          >
                            {getUnitName(product.unitId)}
                          </TableCell>
                          <TableCell 
                            className="text-right cursor-pointer"
                            onClick={() => setProductDetailId(product.id)}
                          >
                            {product.purchasePrice ? parseFloat(product.purchasePrice as string).toFixed(2) : '0.00'} RON
                          </TableCell>
                          <TableCell 
                            className="text-right cursor-pointer"
                            onClick={() => setProductDetailId(product.id)}
                          >
                            {product.sellingPrice ? parseFloat(product.sellingPrice as string).toFixed(2) : '0.00'} RON
                            {product.priceIncludesVat && (
                              <Badge variant="outline" className="ml-2">
                                TVA inclus
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell 
                            className="text-center cursor-pointer"
                            onClick={() => setProductDetailId(product.id)}
                          >
                            {product.vatRate || 19}%
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(product);
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editare
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setProductDetailId(product.id);
                                    }}
                                  >
                                    <PackageCheck className="mr-2 h-4 w-4" />
                                    Detalii
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`Sigur doriți să ${product.isActive ? 'dezactivați' : 'activați'} produsul ${product.name}?`)) {
                                        deactivateProduct.mutate(product.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {product.isActive ? 'Dezactivare' : 'Activare'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                {/* Paginare */}
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">{filteredProducts.length}</span> produse în total, afișare <span className="font-medium">{Math.min(pagination?.pageSize || DEFAULT_PAGE_SIZE, paginatedProducts.length)}</span> pe pagină
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Rânduri pe pagină:</span>
                      <Select
                        value={(pagination?.pageSize || DEFAULT_PAGE_SIZE).toString()}
                        onValueChange={(value) => {
                          if (value === "custom") {
                            // Deschidem dialogul pentru valoare personalizată
                            setCustomPageSize(pagination?.pageSize || DEFAULT_PAGE_SIZE);
                            setIsCustomPageSizeDialogOpen(true);
                          } else {
                            // Utilizăm direct funcția din hook
                            changePageSize(parseInt(value, 10));
                          }
                        }}
                      >
                        <SelectTrigger className="w-[80px] h-8">
                          <SelectValue placeholder={(pagination?.pageSize || DEFAULT_PAGE_SIZE).toString()} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="custom">Personalizat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changePage((pagination?.page || DEFAULT_PAGE) - 1)}
                      disabled={(pagination?.page || DEFAULT_PAGE) === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">
                        Pagina {pagination?.page || DEFAULT_PAGE} din {pagination?.totalPages || 1}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changePage((pagination?.page || DEFAULT_PAGE) + 1)}
                      disabled={(pagination?.page || DEFAULT_PAGE) === (pagination?.totalPages || 1)}
                    >
                      Următor
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Detalii Produs</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedProduct ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{selectedProduct.name}</h3>
                      <p className="text-sm text-muted-foreground">SKU: {selectedProduct.sku}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium">SKU</p>
                      <p className="text-sm text-muted-foreground">{selectedProduct.sku || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Cod de bare</p>
                      <p className="text-sm text-muted-foreground">{selectedProduct.barcode || "-"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Descriere</p>
                    <p className="text-sm text-muted-foreground">{selectedProduct.description || "-"}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium">Categorie</p>
                      <p className="text-sm text-muted-foreground">{getCategoryName(selectedProduct.categoryId)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Unitate de măsură</p>
                      <p className="text-sm text-muted-foreground">{getUnitName(selectedProduct.unitId)}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium">Preț de achiziție</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedProduct.purchasePrice ? parseFloat(selectedProduct.purchasePrice as string).toFixed(2) : '0.00'} RON
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Preț de vânzare</p>
                      <div className="flex items-center">
                        <p className="text-sm text-muted-foreground">
                          {selectedProduct.sellingPrice ? parseFloat(selectedProduct.sellingPrice as string).toFixed(2) : '0.00'} RON
                        </p>
                        {selectedProduct.priceIncludesVat && (
                          <Badge variant="outline" className="ml-2 text-xs">TVA inclus</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium">TVA</p>
                      <p className="text-sm text-muted-foreground">{selectedProduct.vatRate || 19}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Alertă stoc</p>
                      <p className="text-sm text-muted-foreground">{selectedProduct.stockAlert || "-"}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedProduct.isActive ? (
                          <Badge variant="default" className="bg-green-500">Activ</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100">Inactiv</Badge>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Data creării</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedProduct.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(selectedProduct)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editare
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
                  <Package className="h-10 w-10 mb-4 text-muted-foreground/40" />
                  <p>Selectați un produs pentru a vedea detaliile</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Dialog pentru creare/editare produs */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editare produs" : "Adăugare produs nou"}</DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? "Modificați detaliile produsului și apăsați Salvează pentru a actualiza." 
                : "Completați detaliile produsului nou și apăsați Adaugă pentru a-l crea."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Denumire produs</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU (Cod intern)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cod de bare</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categorie</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați o categorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unitId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unitate de măsură</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați o unitate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {units.map(unit => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name} ({unit.abbreviation})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descriere</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ""}
                            placeholder="Descriere detaliată a produsului" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preț de achiziție</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preț de vânzare</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vatRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TVA (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="stockAlert"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alertă stoc</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priceIncludesVat"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Preț include TVA</FormLabel>
                        <FormDescription>
                          Prețul de vânzare include TVA
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Activ</FormLabel>
                        <FormDescription>
                          Produsul este disponibil pentru vânzare
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit">
                  {editingProduct ? "Salvează modificările" : "Adaugă produs"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog pentru import produse */}
      {/* Dialog pentru număr personalizat de produse pe pagină */}
      <Dialog open={isCustomPageSizeDialogOpen} onOpenChange={setIsCustomPageSizeDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Număr personalizat de produse</DialogTitle>
            <DialogDescription>
              Introduceți numărul dorit de produse pe pagină (maxim 500).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="custom-page-size">Număr de produse pe pagină</Label>
                <Input
                  id="custom-page-size"
                  type="number"
                  min="1"
                  max="500"
                  value={customPageSize}
                  onChange={(e) => setCustomPageSize(Math.min(Math.max(1, parseInt(e.target.value, 10) || 1), 500))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomPageSizeDialogOpen(false)}>
              Anulează
            </Button>
            <Button onClick={() => {
              if (customPageSize > 0 && customPageSize <= 500) {
                // Utilizăm direct funcția din hook
                changePageSize(customPageSize);
                setIsCustomPageSizeDialogOpen(false);
              }
            }}>
              Aplică
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Import produse</DialogTitle>
            <DialogDescription>
              Încărcați un fișier {importType === "json" ? "JSON" : "CSV"} cu datele produselor pentru import.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid gap-4">
              <Label htmlFor="import-file">Fișier pentru import</Label>
              <Input
                id="import-file"
                type="file"
                accept={importType === "json" ? ".json" : ".csv"}
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground">
                Fișierul trebuie să conțină următoarele câmpuri: nume, sku, preț, categorie
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Opțiune import</Label>
              <RadioGroup defaultValue="new" value={uploadOption} onValueChange={(value) => setUploadOption(value as "new" | "update")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new">Creează produse noi</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="update" id="update" />
                  <Label htmlFor="update">Actualizează produse existente</Label>
                </div>
              </RadioGroup>
            </div>
            
            {uploadOption === "update" && (
              <div className="space-y-2">
                <Label>Identificare după</Label>
                <RadioGroup defaultValue="sku" value={matchBy} onValueChange={(value) => setMatchBy(value as "sku" | "name")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sku" id="match-sku" />
                    <Label htmlFor="match-sku">SKU</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="name" id="match-name" />
                    <Label htmlFor="match-name">Denumire produs</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            
            {isImporting && (
              <div className="space-y-2">
                <Label>Progres import</Label>
                <Progress value={importProgress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">{importProgress}%</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} disabled={isImporting}>
              Anulează
            </Button>
            <Button onClick={handleImport} disabled={!importFile || isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se importă...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importă
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog pentru editare în masă */}
      <Dialog open={isBulkEditDialogOpen} onOpenChange={handleBulkEditDialogChange}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Editare în masă</DialogTitle>
            <DialogDescription>
              Editați proprietăți pentru {selectedProductsCount} produse selectate. 
              Doar câmpurile modificate vor fi actualizate.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...bulkEditForm}>
            <form onSubmit={bulkEditForm.handleSubmit(onBulkEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={bulkEditForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categorie</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Fără modificare" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={bulkEditForm.control}
                  name="unitId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unitate de măsură</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Fără modificare" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {units.map(unit => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name} ({unit.abbreviation})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={bulkEditForm.control}
                  name="vatRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TVA (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Fără modificare" 
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={bulkEditForm.control}
                  name="stockAlert"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alertă stoc</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Fără modificare" 
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={bulkEditForm.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preț de achiziție</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Fără modificare" 
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={bulkEditForm.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preț de vânzare</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Fără modificare" 
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={bulkEditForm.control}
                  name="priceIncludesVat"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Preț include TVA</FormLabel>
                        <FormDescription>
                          Prețul de vânzare include TVA
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={bulkEditForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Activ</FormLabel>
                        <FormDescription>
                          Produsul este disponibil pentru vânzare
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkEditDialogOpen(false)}>
                  Anulează
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Actualizează {selectedProductsCount} produse
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}