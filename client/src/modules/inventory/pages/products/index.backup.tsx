/**
 * Products Management Page
 * 
 * Comprehensive interface for managing product catalog in the inventory system.
 * Includes product CRUD operations, filtering, categorization, and detail views.
 */

import React, { useState } from "react";
import { useProducts } from "../../hooks/useInventoryApi";
import { Product, ProductCategory, ProductUnit, ProductFormValues, SelectedProducts, BulkEditFormValues } from "../../types";

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
  CheckCircle,
  FileBarChart,
  History,
  Save,
  X,
  Check as CheckIcon,
  FileUp,
  FileSpreadsheet,
  FileJson,
  Download,
  Upload,
  Table as TableIcon,
  ArrowDownToLine
} from "lucide-react";

// Custom components
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import TabsNav, { TabItem } from "../../components/common/TabsNav";

// Form handling
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Form validation schema for bulk edit
const bulkEditFormSchema = z.object({
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
  vatRate: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, { message: "Cota TVA nu poate fi negativă." }).optional()
  ),
  isActive: z.boolean().optional(),
  priceIncludesVat: z.boolean().optional(),
  sellingPrice: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, { message: "Prețul de vânzare nu poate fi negativ." }).optional()
  ),
  purchasePrice: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, { message: "Prețul de achiziție nu poate fi negativ." }).optional()
  ),
  stockAlert: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, { message: "Stoc minim nu poate fi negativ." }).optional()
  ),
});

// Form validation schema for individual products
const productFormSchema = z.object({
  name: z.string().min(3, {
    message: "Numele produsului trebuie să aibă cel puțin 3 caractere.",
  }),
  sku: z.string().min(2, {
    message: "SKU-ul produsului trebuie să aibă cel puțin 2 caractere.",
  }),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
  purchasePrice: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().min(0, { message: "Prețul de achiziție nu poate fi negativ." })
  ),
  sellingPrice: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().min(0, { message: "Prețul de vânzare nu poate fi negativ." })
  ),
  vatRate: z.preprocess(
    (val) => (val === "" ? 19 : Number(val)),
    z.number().min(0, { message: "Cota TVA nu poate fi negativă." })
  ),
  stockAlert: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().min(0, { message: "Stoc minim nu poate fi negativ." })
  ),
  isActive: z.boolean().default(true),
  priceIncludesVat: z.boolean().default(false),
});

const ProductsPage: React.FC = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<"excel" | "csv" | "json">("excel");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<"create" | "update">("create");
  const [updateMatchField, setUpdateMatchField] = useState<"sku" | "name">("sku");
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [productDetailId, setProductDetailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // State pentru selecția multiplă și editarea în masă
  const [selectedProducts, setSelectedProducts] = useState<SelectedProducts>({});
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);

  const { 
    products, 
    categories, 
    units,
    isLoading, 
    isError, 
    createProduct, 
    updateProduct, 
    deactivateProduct,
    filters,
    setFilters
  } = useProducts();
  
  // Form setup
  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      description: "",
      categoryId: "",
      unitId: "",
      purchasePrice: 0,
      sellingPrice: 0,
      vatRate: 19,
      stockAlert: 0,
      isActive: true,
      priceIncludesVat: false,
    },
  });
  
  // Reset form when dialog is closed
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setCurrentProduct(null);
      form.reset();
    }
  };
  
  // Open form dialog for creating
  const handleAddNew = () => {
    setCurrentProduct(null);
    form.reset({
      name: "",
      sku: "",
      barcode: "",
      description: "",
      categoryId: "",
      unitId: "",
      purchasePrice: 0,
      sellingPrice: 0,
      vatRate: 19,
      stockAlert: 0,
      isActive: true,
      priceIncludesVat: false,
    });
    setIsDialogOpen(true);
  };
  
  // Open form dialog for editing
  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    form.reset({
      name: product.name,
      sku: product.sku || "",
      barcode: product.barcode || "",
      description: product.description || "",
      categoryId: product.categoryId || "",
      unitId: product.unitId || "",
      purchasePrice: product.purchasePrice || 0,
      sellingPrice: product.sellingPrice || 0,
      vatRate: product.vatRate || 19,
      stockAlert: product.stockAlert || 0,
      isActive: product.isActive,
      priceIncludesVat: product.priceIncludesVat || false,
    });
    setIsDialogOpen(true);
  };
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof productFormSchema>) => {
    // Convert string values to appropriate types
    const formattedValues = {
      ...values,
      purchasePrice: Number(values.purchasePrice),
      sellingPrice: Number(values.sellingPrice),
      vatRate: Number(values.vatRate),
      stockAlert: Number(values.stockAlert),
    };
    
    if (currentProduct) {
      // Update existing product
      updateProduct.mutate({
        id: currentProduct.id,
        ...formattedValues,
      });
    } else {
      // Create new product
      createProduct.mutate(formattedValues);
    }
    
    setIsDialogOpen(false);
  };
  
  // Filter products based on search, category and active tab
  const filteredProducts = products.filter(product => {
    // Apply search filter
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply category filter
    const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
    
    // Apply tab filter
    if (activeTab === "all") {
      return matchesSearch && matchesCategory;
    } else if (activeTab === "active") {
      return matchesSearch && matchesCategory && product.isActive;
    } else if (activeTab === "inactive") {
      return matchesSearch && matchesCategory && !product.isActive;
    }
    
    return matchesSearch && matchesCategory;
  });
  
  // Tab items definition
  const tabItems: TabItem[] = [
    { id: "all", label: "Toate Produsele" },
    { id: "active", label: "Produse Active" },
    { id: "inactive", label: "Produse Inactive" },
  ];
  
  // Get the selected product for detail view
  const selectedProduct = productDetailId 
    ? products.find(p => p.id === productDetailId) 
    : null;

  // Get category name by id
  const getCategoryName = (categoryId?: string | null) => {
    if (!categoryId) return "-";
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "-";
  };

  // Get unit name by id
  const getUnitName = (unitId?: string | null) => {
    if (!unitId) return "-";
    const unit = units.find(u => u.id === unitId);
    return unit ? `${unit.name} (${unit.abbreviation})` : "-";
  };
  
  // Handle file change in import dialog
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };
  
  // State pentru procesul de import în două etape
  const [importStep, setImportStep] = useState<'validate' | 'import'>('validate');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validatedData, setValidatedData] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  // Procesare fișier pentru a obține datele în format JSON
  const processFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          
          if (importType === 'json') {
            // Pentru JSON, parseăm direct
            resolve(JSON.parse(content));
          } else if (importType === 'csv' || importType === 'excel') {
            // Pentru CSV, separăm liniile și coloanele
            const lines = content.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            const result = [];
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              const values = line.split(',').map(v => v.trim());
              const row = {};
              
              headers.forEach((header, index) => {
                if (index < values.length) {
                  row[header] = values[index];
                }
              });
              
              result.push(row);
            }
            
            resolve(result);
          } else {
            reject(new Error('Format necunoscut'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Eroare la citirea fișierului'));
      };
      
      reader.readAsText(file);
    });
  };
  
  // Etapa 1: Validează datele de import
  const validateImport = async () => {
    if (!importFile) {
      toast({
        title: "Niciun fișier selectat",
        description: "Vă rugăm să selectați un fișier pentru import",
        variant: "destructive",
      });
      return;
    }
    
    // Începe procesul de validare
    setIsImporting(true);
    setImportProgress(10);
    
    toast({
      title: "Validare în curs",
      description: `Fișierul ${importFile.name} este în curs de validare.`,
    });
    
    try {
      // Procesare fișier pentru a obține datele în format JSON
      setImportProgress(30);
      const fileData = await processFile(importFile);
      setImportProgress(50);
      
      // În implementarea reală, am trimite datele către server pentru validare
      // Pentru simulare, facem o validare simplă local
      const validRows = fileData.filter(row => 
        row.name && row.name.length >= 2 && 
        row.sku && row.sku.length >= 2 && 
        row.price && !isNaN(parseFloat(row.price))
      );
      
      const invalidRows = fileData.filter(row => 
        !row.name || row.name.length < 2 || 
        !row.sku || row.sku.length < 2 || 
        !row.price || isNaN(parseFloat(row.price))
      );
      
      setImportProgress(80);
      
      // Simulăm rezultatul validării
      const validationResult = {
        isValid: invalidRows.length === 0,
        totalRows: fileData.length,
        validRows: validRows.length,
        invalidRows: invalidRows.length,
        errors: invalidRows.map((row, index) => ({
          row: index + 1,
          errors: [
            !row.name || row.name.length < 2 ? 'Numele produsului lipsește sau este prea scurt (minim 2 caractere)' : null,
            !row.sku || row.sku.length < 2 ? 'SKU-ul lipsește sau este prea scurt (minim 2 caractere)' : null,
            !row.price || isNaN(parseFloat(row.price)) ? 'Prețul lipsește sau nu este un număr valid' : null
          ].filter(Boolean)
        })),
        validData: validRows
      };
      
      setValidationResult(validationResult);
      setValidatedData(validRows);
      setPreviewData(validRows.slice(0, 5));
      setImportProgress(100);
      
      // Dacă validarea a reușit, treci la pasul 2
      if (validationResult.isValid) {
        setImportStep('import');
        toast({
          title: "Validare reușită",
          description: `Toate cele ${validRows.length} produse au fost validate cu succes.`,
        });
      } else {
        toast({
          title: "Erori de validare",
          description: `Fișierul conține ${invalidRows.length} erori din ${fileData.length} produse. Corectați erorile și încercați din nou.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Eroare la validare:", error);
      toast({
        title: "Eroare la validare",
        description: `A apărut o eroare la procesarea fișierului: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`,
        variant: "destructive",
      });
    } finally {
      setImportProgress(0);
      setIsImporting(false);
    }
  };
  
  // Etapa 2: Importă datele validate
  const handleImport = async () => {
    if (!validatedData || validatedData.length === 0) {
      toast({
        title: "Date invalide",
        description: "Nu există date validate pentru import",
        variant: "destructive",
      });
      return;
    }
    
    // Începe procesul de import
    setIsImporting(true);
    setImportProgress(10);
    
    toast({
      title: "Import în curs",
      description: `Se importă ${validatedData.length} produse validate.`,
    });
    
    try {
      // Configurăm opțiunile de import
      const options = {
        mode: importMode,
        matchField: importMode === 'update' ? updateMatchField : undefined,
        format: importType,
        generateBarcodes: true, // Generăm automat codurile de bare
      };
      
      setImportProgress(30);
      
      // Simulăm procesul de import
      await new Promise(resolve => setTimeout(resolve, 800));
      setImportProgress(60);
      
      // Simulăm un rezultat de import
      const importResult = {
        success: true,
        message: `Import finalizat: ${validatedData.length} produse ${importMode === 'create' ? 'create' : 'actualizate'}, 0 ignorate, 0 erori`,
      };
      
      setImportProgress(100);
      
      // În implementarea reală, am face un apel către API:
      // const response = await fetch('/api/inventory/products/import', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     data: validatedData,
      //     options
      //   })
      // });
      // const importResult = await response.json();
      
      toast({
        title: "Import finalizat cu succes",
        description: importResult.message,
      });
      
      // Resetează stările și închide dialogul
      setIsImportDialogOpen(false);
      setImportFile(null);
      setImportProgress(0);
      setIsImporting(false);
      setImportStep('validate');
      setValidationResult(null);
      setValidatedData([]);
      setPreviewData([]);
      
      // Reîncarcă lista de produse
      refetch();
    } catch (error) {
      console.error("Eroare la import:", error);
      toast({
        title: "Eroare la import",
        description: `A apărut o eroare la importarea produselor: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`,
        variant: "destructive",
      });
      setImportProgress(0);
      setIsImporting(false);
    }
  };
  
  // Get template filename based on import type
  const getTemplateFilename = () => {
    switch (importType) {
      case "excel":
        return "template_produse.xlsx";
      case "csv":
        return "template_produse.csv";
      case "json":
        return "template_produse.json";
      default:
        return "template_produse.xlsx";
    }
  };
  
  // Function for template download
  const handleDownloadTemplate = () => {
    const fileExtension = importType || 'csv';
    let downloadUrl = '';
    
    // Determine the API endpoint based on the selected format
    switch (fileExtension) {
      case 'excel':
        downloadUrl = `/api/inventory/templates/excel/produse`;
        break;
      case 'csv':
        downloadUrl = `/api/inventory/templates/csv/produse`;
        break;
      case 'json':
        downloadUrl = `/api/inventory/templates/json/produse`;
        break;
      default:
        downloadUrl = `/api/inventory/templates/csv/produse`;
    }
    
    // Redirect browser to download URL
    window.location.href = downloadUrl;
    
    toast({
      title: `Șablon ${fileExtension.toUpperCase()} se descarcă`,
      description: "Descărcarea va începe în câteva momente.",
    });
  };
  
  // Setup bulk edit form
  const bulkEditForm = useForm<z.infer<typeof bulkEditFormSchema>>({
    resolver: zodResolver(bulkEditFormSchema),
    defaultValues: {
      categoryId: undefined,
      unitId: undefined,
      vatRate: undefined,
      isActive: undefined,
      priceIncludesVat: undefined,
      sellingPrice: undefined,
      purchasePrice: undefined,
      stockAlert: undefined,
    },
  });
  
  // Handle bulk edit dialog change
  const handleBulkEditDialogChange = (open: boolean) => {
    setIsBulkEditDialogOpen(open);
    if (!open) {
      bulkEditForm.reset();
    }
  };
  
  // Handle bulk edit submit
  const onBulkEditSubmit = (values: z.infer<typeof bulkEditFormSchema>) => {
    // Get selected product IDs
    const productIds = Object.keys(selectedProducts).filter(id => selectedProducts[id]);
    
    if (productIds.length === 0) {
      toast({
        title: "Niciun produs selectat",
        description: "Selectați cel puțin un produs pentru editare în masă",
        variant: "destructive",
      });
      return;
    }
    
    // Remove undefined values
    const updateData: Partial<ProductFormValues> = {};
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key as keyof ProductFormValues] = value;
      }
    });
    
    // Check if we have values to update
    if (Object.keys(updateData).length === 0) {
      toast({
        title: "Nicio modificare",
        description: "Nu ați specificat nicio modificare pentru produsele selectate",
        variant: "destructive",
      });
      return;
    }
    
    // Call bulkUpdateProducts mutation
    bulkUpdateProducts.mutate({
      productIds,
      updateData
    }, {
      onSuccess: () => {
        setIsBulkEditDialogOpen(false);
        setSelectedProducts({});
        bulkEditForm.reset();
      }
    });
  };
  
  // Check if any products are selected
  const hasSelectedProducts = Object.values(selectedProducts).some(Boolean);
  const selectedProductsCount = Object.values(selectedProducts).filter(Boolean).length;
  
  // Extract required properties from the hook
  const { 
    products, 
    categories, 
    units,
    isLoading, 
    isError, 
    createProduct, 
    updateProduct, 
    deactivateProduct,
    filters,
    setFilters,
    bulkUpdateProducts
  } = useProducts();

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
                      filteredProducts.map((product) => (
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
                    <div>
                      <p className="text-sm font-medium">Categorie</p>
                      <p className="text-sm text-muted-foreground">{getCategoryName(selectedProduct.categoryId)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Unitate Măsură</p>
                      <p className="text-sm text-muted-foreground">{getUnitName(selectedProduct.unitId)}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Descriere</p>
                    <p className="text-sm text-muted-foreground">{selectedProduct.description || "Fără descriere"}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium">Preț Achiziție</p>
                      <p className="text-sm text-muted-foreground">{selectedProduct.purchasePrice ? parseFloat(selectedProduct.purchasePrice as string).toFixed(2) : '0.00'} RON</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Preț Vânzare</p>
                      <p className="text-sm text-muted-foreground">{selectedProduct.sellingPrice ? parseFloat(selectedProduct.sellingPrice as string).toFixed(2) : '0.00'} RON</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">TVA</p>
                      <p className="text-sm text-muted-foreground">{selectedProduct.vatRate || 19}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Stoc minim</p>
                      <p className="text-sm text-muted-foreground">{selectedProduct.stockAlert || 0}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Status</p>
                    <StatusBadge status={selectedProduct.isActive ? 'active' : 'inactive'} />
                  </div>
                  
                  <div className="pt-4 flex space-x-3">
                    <Button 
                      className="flex-1" 
                      variant="outline"
                      onClick={() => handleEdit(selectedProduct)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editează
                    </Button>
                    <Button className="flex-1">
                      <PackageCheck className="h-4 w-4 mr-2" />
                      Vezi Stocuri
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium text-lg">Niciun produs selectat</h3>
                  <p className="text-sm text-muted-foreground">
                    Selectați un produs din listă pentru a vedea detaliile
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Product form dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentProduct ? "Editare Produs" : "Adăugare Produs Nou"}</DialogTitle>
            <DialogDescription>
              {currentProduct 
                ? "Modificați detaliile produsului existent" 
                : "Creați un produs nou în catalog"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">

                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Status Activ</FormLabel>
                        <FormDescription>
                          Activare produs
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
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Denumire Produs</FormLabel>
                      <FormControl>
                        <Input placeholder="Nume produs" {...field} />
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
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Fără categorie</SelectItem>
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
                      <FormLabel>Unitate Măsură</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați unitatea" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Fără unitate</SelectItem>
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
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU" {...field} />
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
                        <Input placeholder="EAN/GTIN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preț Achiziție</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Input type="number" step="0.01" {...field} />
                          <div className="bg-muted flex items-center px-3 border border-l-0 rounded-r-md">
                            RON
                          </div>
                        </div>
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
                      <FormLabel>Preț Vânzare</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Input type="number" step="0.01" {...field} />
                          <div className="bg-muted flex items-center px-3 border border-l-0 rounded-r-md">
                            RON
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priceIncludesVat"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Preț cu TVA inclus</FormLabel>
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
                  name="vatRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cotă TVA</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați cota TVA" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="9">9%</SelectItem>
                          <SelectItem value="19">19%</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="stockAlert"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stoc Minim (Alertă)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Valoare la care se va genera o alertă de stoc
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Descriere</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descriere produs" className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                  {(createProduct.isPending || updateProduct.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {currentProduct ? "Salvează Modificările" : "Crează Produs"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Import dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        // Reset all the dialog state when closing
        if (!open) {
          setImportStep('validate');
          setValidationResult(null);
          setValidatedData([]);
          setPreviewData([]);
          setImportFile(null);
        }
        setIsImportDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {importType === "excel" ? "Import CSV pentru Excel" : 
               importType === "csv" ? "Import CSV" : 
               "Import JSON"} 
               {importStep === 'validate' ? " - Validare" : " - Import"}
            </DialogTitle>
            <DialogDescription>
              {importStep === 'validate' ? (
                <>
                  Pasul 1: Validați și analizați datele înainte de a le importa.
                  Asigurați-vă că datele sunt formatate corect.
                </>
              ) : (
                <>
                  Pasul 2: Confirmați și importați datele validate.
                  Verificați previzualizarea și apoi efectuați importul.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {importStep === 'validate' ? (
              <>
                {/* Etapa 1: Validare - Selectarea fișierului și opțiunilor */}
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Mod import</CardTitle>
                    <CardDescription>
                      Selectați modul de procesare a datelor importate
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroup 
                          defaultValue="create" 
                          value={importMode} 
                          onValueChange={(value) => setImportMode(value as "create" | "update")}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <RadioGroupItem value="create" id="create-option" />
                            <Label htmlFor="create-option" className="font-medium cursor-pointer">
                              Import produse noi
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="update" id="update-option" />
                            <Label htmlFor="update-option" className="font-medium cursor-pointer">
                              Actualizare produse existente
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      {importMode === "update" && (
                        <div className="pl-6 pt-2">
                          <Label htmlFor="update-field" className="block mb-2">
                            Identifică produsele după:
                          </Label>
                          <Select
                            value={updateMatchField}
                            onValueChange={(value) => setUpdateMatchField(value as "sku" | "name")}
                            disabled={isImporting}
                          >
                            <SelectTrigger id="update-field" className="w-full">
                              <SelectValue placeholder="Selectați câmp de identificare" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sku">Cod SKU</SelectItem>
                              <SelectItem value="name">Denumire produs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Descarcă șablon</CardTitle>
                    <CardDescription>
                      Folosiți acest șablon pentru a pregăti datele
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleDownloadTemplate}
                      disabled={isImporting}
                    >
                      <ArrowDownToLine className="mr-2 h-4 w-4" />
                      Descarcă șablon {importType.toUpperCase()}
                    </Button>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Câmpuri obligatorii: <strong>nume</strong>, <strong>sku</strong>, <strong>preț</strong></p>
                      <p>Codul de bare va fi generat automat dacă nu este specificat.</p>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid gap-2">
                  <Label htmlFor="import-file">Fișier pentru import</Label>
                  <Input 
                    id="import-file" 
                    type="file" 
                    onChange={handleFileChange}
                    accept={
                      importType === "excel" ? ".csv" : 
                      importType === "csv" ? ".csv" : 
                      ".json"
                    }
                    disabled={isImporting}
                  />
                  <p className="text-sm text-muted-foreground">
                    {importType === "excel" ? "Selectați un fișier CSV (.csv) pentru a importa în Excel" :
                     importType === "csv" ? "Selectați un fișier CSV (.csv)" :
                     "Selectați un fișier JSON (.json)"}
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Etapa 2: Import - Previzualizare și confirmare */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Previzualizare date validate</CardTitle>
                    <CardDescription>
                      Verificați datele înainte de import ({validatedData.length} produse validate)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nume</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Preț</TableHead>
                            <TableHead>UM</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.length > 0 ? (
                            previewData.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.sku}</TableCell>
                                <TableCell>{item.price}</TableCell>
                                <TableCell>{item.unitId || '-'}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                Nu există date de previzualizat
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {previewData.length > 0 && validatedData.length > previewData.length && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Se afișează primele {previewData.length} din {validatedData.length} produse.
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Rezumat import</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Mod import:</dt>
                        <dd className="font-medium">
                          {importMode === 'create' ? 'Produse noi' : 'Actualizare produse'}
                        </dd>
                      </div>
                      {importMode === 'update' && (
                        <div>
                          <dt className="text-muted-foreground">Identificare după:</dt>
                          <dd className="font-medium">
                            {updateMatchField === 'sku' ? 'Cod SKU' : 'Denumire produs'}
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-muted-foreground">Produse validate:</dt>
                        <dd className="font-medium">
                          {validationResult?.validRows || 0} din {validationResult?.totalRows || 0}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Format fișier:</dt>
                        <dd className="font-medium">{importType.toUpperCase()}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Generare coduri de bare:</dt>
                        <dd className="font-medium">Automată</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </>
            )}
            
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Progres {importStep === 'validate' ? 'validare' : 'import'}</Label>
                  <span className="text-sm text-muted-foreground">{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {importStep === 'validate' 
                    ? 'Validarea este în curs, vă rugăm să așteptați...'
                    : 'Importul este în curs, vă rugăm să așteptați...'}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {importStep === 'validate' ? (
              <>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} disabled={isImporting}>
                  Anulează
                </Button>
                <Button onClick={validateImport} disabled={!importFile || isImporting}>
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Se validează...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="mr-2 h-4 w-4" />
                      Validează
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setImportStep('validate')} disabled={isImporting}>
                  Înapoi
                </Button>
                <Button onClick={handleImport} disabled={!validatedData.length || isImporting} variant="default">
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Se importă...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Importă produse
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

      {/* Bulk Edit Dialog */}
      <Dialog open={isBulkEditDialogOpen} onOpenChange={handleBulkEditDialogChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editare în masă</DialogTitle>
            <DialogDescription>
              Actualizați câmpurile dorite pentru {selectedProductsCount} produse selectate. 
              Câmpurile nemodificate vor rămâne neschimbate.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...bulkEditForm}>
            <form onSubmit={bulkEditForm.handleSubmit(onBulkEditSubmit)} className="space-y-4">
              <FormField
                control={bulkEditForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorie produs</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați o categorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Păstrează categoriile existente</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Categoria produselor selectate
                    </FormDescription>
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
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați o unitate de măsură" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Păstrează unitățile existente</SelectItem>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Unitatea de măsură pentru produsele selectate
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={bulkEditForm.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preț achiziție</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Păstrează prețurile existente"
                          type="number"
                          step="0.01"
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          onBlur={field.onBlur}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Prețul de achiziție fără TVA
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={bulkEditForm.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preț vânzare</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Păstrează prețurile existente"
                          type="number"
                          step="0.01"
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          onBlur={field.onBlur}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Prețul de vânzare
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={bulkEditForm.control}
                  name="vatRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cotă TVA (%)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Păstrează cotele existente"
                          type="number"
                          step="1"
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                          onBlur={field.onBlur}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Cota TVA aplicată produselor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={bulkEditForm.control}
                  name="stockAlert"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stoc minim</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Păstrează valorile existente"
                          type="number"
                          step="1"
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                          onBlur={field.onBlur}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Stocul minim pentru alertă
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={bulkEditForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value as boolean}
                          onCheckedChange={field.onChange}
                          tabIndex={0}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Produse active
                        </FormLabel>
                        <FormDescription>
                          Activează/dezactivează toate produsele selectate
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={bulkEditForm.control}
                  name="priceIncludesVat"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value as boolean}
                          onCheckedChange={field.onChange}
                          tabIndex={0}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Prețul include TVA
                        </FormLabel>
                        <FormDescription>
                          Indică dacă prețul de vânzare include TVA
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsBulkEditDialogOpen(false)}>
                  Anulează
                </Button>
                <Button type="submit" disabled={bulkUpdateProducts.isPending}>
                  {bulkUpdateProducts.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Se procesează...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvează modificările
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPage;