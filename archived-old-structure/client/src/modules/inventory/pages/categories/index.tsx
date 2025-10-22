/**
 * Product Categories Management Page
 * 
 * Comprehensive interface for managing product categories in the inventory system.
 * Includes category CRUD operations, hierarchical display, and import functionality.
 */

import React, { useState } from "react";
import { useCategories } from "../../hooks/useCategories";
import { ProductCategory } from "../../types";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Lucide icons
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  ChevronDown,
  CheckCircle,
  X,
  FileUp,
  FileSpreadsheet,
  FileJson,
  Download,
  Upload,
  Table as TableIcon,
  ArrowDownToLine,
  Folders,
  FolderTree,
  FolderPlus,
  FolderInput,
  InfoIcon,
  AlertCircle
} from "lucide-react";

// Custom components
import PageHeader from "../../components/common/PageHeader";
import TabsNav, { TabItem } from "../../components/common/TabsNav";
import { TreeView } from "./tree-view";

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

// Form validation schema
const categoryFormSchema = z.object({
  name: z.string().min(2, {
    message: "Numele categoriei trebuie să aibă cel puțin 2 caractere.",
  }),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

const CategoriesPage: React.FC = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<"excel" | "csv" | "json">("excel");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<"create" | "update">("create");
  const [updateMatchField, setUpdateMatchField] = useState<"name" | "code">("name");
  const [currentCategory, setCurrentCategory] = useState<ProductCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedParentId, setSelectedParentId] = useState<string | null>("all");

  const categoriesData = useCategories();
  const { 
    categories, 
    isLoading, 
    isError, 
    createCategory, 
    updateCategory, 
    deactivateCategory,
    importCategories,
    getChildCategories,
    getParentCategoryName,
    buildCategoryTree,
    getCategoryPath,
    filters,
    setFilters,
    useFallbackData
  } = categoriesData;
  
  // Form setup
  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      parentId: null,
      isActive: true,
    },
  });
  
  // Reset form when dialog is closed
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setCurrentCategory(null);
      form.reset();
    }
  };
  
  // Open form dialog for creating
  const handleAddNew = () => {
    setCurrentCategory(null);
    form.reset({
      name: "",
      description: "",
      parentId: null,
      isActive: true,
    });
    setIsDialogOpen(true);
  };
  
  // Open form dialog for editing
  const handleEdit = (category: ProductCategory) => {
    setCurrentCategory(category);
    form.reset({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId || null,
      isActive: category.isActive,
    });
    setIsDialogOpen(true);
  };
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof categoryFormSchema>) => {
    // Transformă valoarea "null" înapoi în null
    const processedValues = {
      ...values,
      parentId: values.parentId === "null" ? null : values.parentId
    };
    
    if (currentCategory) {
      // Update existing category
      updateCategory.mutate({
        id: currentCategory.id,
        ...processedValues,
      } as ProductCategory);
    } else {
      // Create new category
      createCategory.mutate(processedValues);
    }
    
    setIsDialogOpen(false);
  };
  
  // Filter categories based on search, parent and active tab
  const filteredCategories = categories.filter(category => {
    // Apply search filter
    const matchesSearch = 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply parent filter
    const matchesParent = selectedParentId === "all" || category.parentId === (selectedParentId === "root" ? null : selectedParentId);
    
    // Apply tab filter
    if (activeTab === "all") {
      return matchesSearch && matchesParent;
    } else if (activeTab === "active") {
      return matchesSearch && matchesParent && category.isActive;
    } else if (activeTab === "inactive") {
      return matchesSearch && matchesParent && !category.isActive;
    }
    
    return matchesSearch && matchesParent;
  });
  
  // Tab items definition
  const tabItems: TabItem[] = [
    { id: "all", label: "Toate Categoriile" },
    { id: "active", label: "Categorii Active" },
    { id: "inactive", label: "Categorii Inactive" },
  ];
  
  // Get parent categories for dropdown
  const parentCategories = categories.filter(category => 
    !category.parentId || category.parentId === null
  );
  
  // Get parent name
  const getParentName = (parentId?: string | null) => {
    if (!parentId) return "-";
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : "-";
  };
  
  // Handle file change in import dialog
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };
  
  // Handle import form submission
  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "Niciun fișier selectat",
        description: "Vă rugăm să selectați un fișier pentru import",
        variant: "destructive",
      });
      return;
    }
    
    // Start the import process
    setIsImporting(true);
    setImportProgress(0);
    
    toast({
      title: "Import în curs de procesare",
      description: `Fișierul ${importFile.name} a fost primit și va fi procesat.`,
    });
    
    try {
      // Simulate parsing and processing with progress
      for (let i = 0; i <= 90; i += 10) {
        setImportProgress(i);
        // Add a delay to simulate processing time
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Prepare form data for the actual API call
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('format', importType);
      formData.append('mode', importMode);
      
      // Adăugăm câmpul de identificare pentru actualizări
      if (importMode === 'update') {
        formData.append('matchField', updateMatchField);
      }
      
      // Final step - make the actual API call
      setImportProgress(95);
      importCategories.mutate(formData, {
        onSuccess: () => {
          setImportProgress(100);
          toast({
            title: "Import finalizat cu succes",
            description: `${importFile.name} a fost importat cu succes.`,
          });
          
          // Close the dialog and reset states
          setIsImportDialogOpen(false);
          setImportFile(null);
          setImportProgress(0);
          setIsImporting(false);
        },
        onError: (error) => {
          toast({
            title: "Eroare la import",
            description: "A apărut o eroare în timpul procesării fișierului.",
            variant: "destructive",
          });
          setImportProgress(0);
          setIsImporting(false);
        }
      });
    } catch (error) {
      // Handle error
      toast({
        title: "Eroare la import",
        description: "A apărut o eroare în timpul procesării fișierului.",
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
        return "template_categorii.xlsx";
      case "csv":
        return "template_categorii.csv";
      case "json":
        return "template_categorii.json";
      default:
        return "template_categorii.xlsx";
    }
  };
  
  // Function for template download
  const handleDownloadTemplate = () => {
    const fileExtension = importType || 'csv';
    let downloadUrl = '';
    
    // Determine the API endpoint based on the selected format
    switch (fileExtension) {
      case 'excel':
        downloadUrl = `/api/inventory/templates/excel/categorii`;
        break;
      case 'csv':
        downloadUrl = `/api/inventory/templates/csv/categorii`;
        break;
      case 'json':
        downloadUrl = `/api/inventory/templates/json/categorii`;
        break;
      default:
        downloadUrl = `/api/inventory/templates/csv/categorii`;
    }
    
    // Redirect browser to download URL
    window.location.href = downloadUrl;
    
    toast({
      title: `Șablon ${fileExtension.toUpperCase()} se descarcă`,
      description: "Descărcarea va începe în câteva momente.",
    });
  };

  // Get hierarchical tree data for tree view
  const treeData = buildCategoryTree();
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Categorii produse" 
        description="Gestionarea categoriilor de produse și servicii"
        onAddNew={handleAddNew}
        addNewLabel="Categorie Nouă"
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
            <div className="border rounded-md flex">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode("list")}
              >
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "tree" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode("tree")}
              >
                <FolderTree className="h-4 w-4" />
              </Button>
            </div>
          </div>
        }
      />
      
      {/* Filters panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="parent-filter">Categorie părinte</Label>
                <Select 
                  value={selectedParentId || "all"} 
                  onValueChange={setSelectedParentId}
                >
                  <SelectTrigger id="parent-filter">
                    <SelectValue placeholder="Toate categoriile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate categoriile</SelectItem>
                    <SelectItem value="root">Doar categorii principale</SelectItem>
                    {parentCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Toate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate</SelectItem>
                    <SelectItem value="active">Doar active</SelectItem>
                    <SelectItem value="inactive">Doar inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end space-x-2">
                <Button className="flex-1" variant="secondary">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aplică filtre
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  setSelectedParentId("all");
                  setActiveTab("all");
                  setSearchQuery("");
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>
                {viewMode === "list" ? "Listă categorii" : "Structură ierarhică categorii"}
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Caută categorie..."
                  className="pl-8 w-[200px] md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <CardDescription>
              {viewMode === "list" 
                ? "Vizualizare și gestionare categorii de produse" 
                : "Structura ierarhică a categoriilor de produse"}
            </CardDescription>
            {viewMode === "list" && (
              <TabsNav 
                tabs={tabItems} 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                className="mt-2"
              />
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                <p className="mt-2 text-gray-600">Se încarcă categoriile...</p>
              </div>
            ) : isError && !useFallbackData ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Eroare la conectarea cu baza de date</AlertTitle>
                <AlertDescription>
                  Nu s-au putut încărca categoriile direct din baza de date. 
                  Echipa tehnică a fost notificată să rezolve această problemă.
                </AlertDescription>
              </Alert>
            ) : categories.length === 0 ? (
              <div className="text-center py-10 space-y-4">
                <FolderPlus className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="text-lg font-medium">Nicio categorie definită</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Nu există încă categorii de produse definite. Creați prima categorie pentru a organiza produsele.
                </p>
                <Button onClick={handleAddNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adaugă categorie
                </Button>
              </div>
            ) : viewMode === "list" ? (
              // Lista de categorii
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nume categorie</TableHead>
                      <TableHead>Descriere</TableHead>
                      <TableHead>Categorie părinte</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                          Nicio categorie găsită care să corespundă criteriilor.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCategories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {category.description || "-"}
                          </TableCell>
                          <TableCell>{getParentName(category.parentId)}</TableCell>
                          <TableCell>
                            <Badge variant={category.isActive ? "outline" : "secondary"}>
                              {category.isActive ? "Activă" : "Inactivă"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(category)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editează
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (window.confirm(`Sigur doriți să ${category.isActive ? 'dezactivați' : 'activați'} categoria "${category.name}"?`)) {
                                      deactivateCategory.mutate(category.id);
                                    }
                                  }}
                                  className={category.isActive ? "text-destructive" : "text-green-600"}
                                >
                                  {category.isActive ? (
                                    <>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Dezactivează
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Activează
                                    </>
                                  )}
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
            ) : (
              // Vizualizare arborescentă
              <div className="border rounded-md p-4">
                {treeData.length === 0 ? (
                  <div className="text-center py-10 space-y-4">
                    <FolderTree className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="text-lg font-medium">Nicio categorie principală definită</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Nu există încă categorii principale. Creați prima categorie pentru a începe structura ierarhică.
                    </p>
                    <Button onClick={handleAddNew}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adaugă categorie
                    </Button>
                  </div>
                ) : (
                  <TreeView 
                    data={treeData} 
                    onEdit={handleEdit} 
                    onDeactivate={(id) => {
                      if (window.confirm("Sigur doriți să modificați statusul categoriei?")) {
                        deactivateCategory.mutate(id);
                      }
                    }}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Dialogs */}
      
      {/* Add/Edit Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentCategory ? "Editează categoria" : "Adaugă categorie nouă"}</DialogTitle>
            <DialogDescription>
              {currentCategory 
                ? "Actualizați detaliile categoriei existente." 
                : "Completați detaliile pentru a crea o nouă categorie de produse."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume categorie *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Electronice, Mobilier..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Numele afișat al categoriei
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descriere</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrierea categoriei..." 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      O scurtă descriere a categoriei (opțional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorie părinte</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""} 
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați o categorie părinte (opțional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Nicio categorie părinte</SelectItem>
                        {categories
                          .filter(c => !currentCategory || c.id !== currentCategory.id)
                          .map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Dacă este subcategorie, selectați categoria părinte
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Categorie activă
                      </FormLabel>
                      <FormDescription>
                        Categoriile inactive nu vor fi afișate în lista de selecție pentru produse
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
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Anulare
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <span className="mr-2">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  )}
                  {currentCategory ? "Salvează modificările" : "Creează categorie"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import categorii</DialogTitle>
            <DialogDescription>
              Importați categorii din fișier CSV, JSON sau Excel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                          Import categorii noi
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="update" id="update-option" />
                        <Label htmlFor="update-option" className="font-medium cursor-pointer">
                          Actualizare categorii existente
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {importMode === "update" && (
                    <div className="pl-6 pt-2">
                      <Label htmlFor="update-field" className="block mb-2">
                        Identifică categoriile după:
                      </Label>
                      <Select
                        value={updateMatchField}
                        onValueChange={(value) => setUpdateMatchField(value as "name" | "code")}
                        disabled={isImporting}
                      >
                        <SelectTrigger id="update-field" className="w-full">
                          <SelectValue placeholder="Selectați câmp de identificare" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="code">Cod categorie</SelectItem>
                          <SelectItem value="name">Denumire categorie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="grid w-full gap-2">
              <Label htmlFor="importType">Format fișier</Label>
              <Select
                value={importType}
                onValueChange={(value: "excel" | "csv" | "json") => setImportType(value)}
                disabled={isImporting}
              >
                <SelectTrigger id="importType">
                  <SelectValue placeholder="Selectați formatul fișierului" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">CSV pentru Excel</SelectItem>
                  <SelectItem value="csv">CSV standard</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Informații format</AlertTitle>
              <AlertDescription>
                {importType === "excel" && "Fișierul CSV pentru Excel trebuie să fie formatat cu separatorul ';' și poate include coloanele: name, description, parentId, isActive."}
                {importType === "csv" && "Fișierul CSV standard trebuie să fie formatat cu separatorul ',' și poate include coloanele: name, description, parentId, isActive."}
                {importType === "json" && "Fișierul JSON trebuie să conțină un array de obiecte cu câmpurile: name, description, parentId, isActive."}
              </AlertDescription>
            </Alert>
            
            <div className="grid w-full gap-2">
              <Label htmlFor="importFile">Fișier</Label>
              <Input
                id="importFile"
                type="file"
                accept={
                  importType === "excel" ? ".csv, application/vnd.ms-excel" :
                  importType === "csv" ? ".csv, text/csv" :
                  ".json, application/json"
                }
                onChange={handleFileChange}
                disabled={isImporting}
              />
            </div>
            
            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Se procesează...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDownloadTemplate}
              disabled={isImporting}
            >
              <Download className="mr-2 h-4 w-4" />
              Descarcă șablon {getTemplateFilename()}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} disabled={isImporting}>
              Anulare
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!importFile || isImporting}
            >
              {isImporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Se procesează... {importProgress}%
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importă categorii
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesPage;