/**
 * NIR Documents Management Page
 * 
 * Provides an interface for managing NIR (Notă de Intrare Recepție) documents in the inventory system.
 * These are reception notes used when receiving goods into warehouses.
 */

import React, { useState } from "react";
import { useNirDocuments, useWarehouses, useProducts } from "../../hooks/useInventoryApi";
import { NirDocument, NirItem, Warehouse, Product } from "../../types";

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

// Lucide icons
import { 
  FileCheck, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  FileText,
  CalendarIcon,
  CheckCircle2,
  CircleX,
  Clock,
  Package,
  Warehouse as WarehouseIcon,
  User,
  AlertTriangle,
  Printer,
  FileDown,
  Clipboard,
  ChevronDown,
  Loader2,
  Info,
  Copy,
  MoreHorizontal,
  Save,
  X
} from "lucide-react";

// Custom components
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import TabsNav, { TabItem } from "../../components/common/TabsNav";

// Form handling
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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

// NIR Document Form Schema - EXACT matched to NirDocument interface
const nirDocumentSchema = z.object({
  number: z.string().min(3, "Numărul NIR trebuie să aibă cel puțin 3 caractere"),
  warehouseId: z.string().min(1, "Selectați gestiunea"),
  supplierId: z.string().min(1, "Selectați furnizorul"),
  date: z.date(),
  observations: z.string().optional(),
});

// NIR Item Form Schema - EXACT matched to NirItem interface (strings not numbers!)
const nirItemSchema = z.object({
  productId: z.string().min(1, "Selectați produsul"),
  quantity: z.string().min(1, "Cantitatea este obligatorie"),
  unitPrice: z.string().min(1, "Prețul este obligatoriu"),
  batchNo: z.string().optional(),
  expiryDate: z.string().optional(),
  observations: z.string().optional(),
});

// Combined form schema
const nirFormSchema = z.object({
  document: nirDocumentSchema,
  items: z.array(nirItemSchema).min(1, "Adăugați cel puțin un produs"),
});

// Type definition
type NirFormValues = z.infer<typeof nirFormSchema>;

// Mock suppliers for demo (would be fetched from API)
const suppliers = [
  { id: "1", name: "Furnizor SRL", fiscalCode: "RO12345678" },
  { id: "2", name: "Alt Furnizor SA", fiscalCode: "RO87654321" },
  { id: "3", name: "Distribuitor Principal", fiscalCode: "RO55555555" },
];

const NIRDocumentsPage: React.FC = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewDocument, setViewDocument] = useState<NirDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  
  // Fetch data
  const { nirDocuments, isLoading, createNirDocument, updateNirStatus } = useNirDocuments();
  const { warehouses } = useWarehouses();
  const { products } = useProducts();
  
  // Form setup
  const form = useForm<NirFormValues>({
    resolver: zodResolver(nirFormSchema),
    defaultValues: {
      document: {
        number: "",
        warehouseId: "",
        supplierId: "",
        date: new Date(),
        observations: "",
      },
      items: [
        {
          productId: "",
          quantity: "1",
          unitPrice: "0",
          batchNo: "",
          expiryDate: "",
          observations: "",
        }
      ]
    },
  });
  
  // Field array for items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  // Reset form when dialog is closed
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
    }
  };
  
  // Generate NIR number
  const generateNirNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `NIR-${year}${month}${day}-${random}`;
  };
  
  // Open form dialog for creating
  const handleAddNew = () => {
    form.reset({
      document: {
        number: generateNirNumber(),
        warehouseId: "",
        supplierId: "",
        date: new Date(),
        observations: "",
      },
      items: [
        {
          productId: "",
          quantity: "1",
          unitPrice: "0",
          batchNo: "",
          expiryDate: "",
          observations: "",
        }
      ]
    });
    setIsDialogOpen(true);
  };
  
  // Form submission handler
  const onSubmit = (values: NirFormValues) => {
    // Format for API - in a real implementation we'd need to add more transformations
    const formattedValues = {
      document: {
        ...values.document,
        // Convert date to string for the API
        date: format(values.document.date, 'yyyy-MM-dd'),
      },
      items: values.items
    };
    
    createNirDocument.mutate(formattedValues, {
      onSuccess: () => {
        toast({
          title: "NIR creat",
          description: "Documentul NIR a fost creat cu succes."
        });
        setIsDialogOpen(false);
      }
    });
  };
  
  // View NIR document details
  const handleViewDocument = (document: NirDocument) => {
    setViewDocument(document);
    setIsViewDialogOpen(true);
  };
  
  // Update NIR status - use NirDocument.status union type
  const handleUpdateStatus = (id: string, status: 'draft' | 'received' | 'cancelled') => {
    updateNirStatus.mutate({ id, status }, {
      onSuccess: () => {
        toast({
          title: "Status actualizat",
          description: `Statusul documentului NIR a fost actualizat la ${status}.`
        });
      }
    });
  };
  
  // Filter NIR documents
  const filteredDocuments = nirDocuments.filter((doc: NirDocument) => {
    // Apply search filter
    const matchesSearch = 
      (doc.number || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply warehouse filter
    const matchesWarehouse = selectedWarehouse === "" || doc.warehouseId === selectedWarehouse;
    
    // Apply tab filter
    if (activeTab === "all") {
      return matchesSearch && matchesWarehouse;
    } else if (activeTab === "draft") {
      return matchesSearch && matchesWarehouse && doc.status === "draft";
    } else if (activeTab === "received") {
      return matchesSearch && matchesWarehouse && doc.status === "received";
    } else if (activeTab === "cancelled") {
      return matchesSearch && matchesWarehouse && doc.status === "cancelled";
    }
    
    return matchesSearch && matchesWarehouse;
  });
  
  // Tab items definition - matched to NirDocument.status
  const tabItems: TabItem[] = [
    { id: "all", label: "Toate Documentele" },
    { id: "draft", label: "Ciorne" },
    { id: "received", label: "Recepționate" },
    { id: "cancelled", label: "Anulate" },
  ];
  
  // Helper to get product details
  const getProductById = (productId: string): Product | undefined => {
    return products.find((p: Product) => p.id === productId);
  };
  
  // Helper to get warehouse details
  const getWarehouseById = (warehouseId: string): Warehouse | undefined => {
    return warehouses.find((w: Warehouse) => w.id === warehouseId);
  };
  
  // Helper to get supplier details
  const getSupplierById = (supplierId: string): { name: string; fiscalCode: string } | undefined => {
    return suppliers.find(s => s.id === supplierId);
  };
  
  // Helper to format currency
  const formatCurrency = (value: number | string | null | undefined, currency: string = "RON"): string => {
    // Handle null, undefined, or empty values
    if (value === null || value === undefined || value === '') {
      return `0.00 ${currency}`;
    }
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Handle NaN values
    if (isNaN(numValue)) {
      return `0.00 ${currency}`;
    }
    
    return `${numValue.toFixed(2)} ${currency}`;
  };
  
  // Update product details when product is selected
  const handleProductChange = (index: number, productId: string) => {
    const product = getProductById(productId);
    if (product) {
      form.setValue(`items.${index}.unitPrice`, String((product as any).purchasePrice || 0));
    }
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Recepții (NIR)" 
        description="Documente de recepție pentru primirea mărfurilor în gestiune"
        onAddNew={handleAddNew}
        addNewLabel="NIR Nou"
        actions={
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
        }
      />
      
      {/* Filters panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="warehouse-filter">Gestiune</Label>
                <Select 
                  value={selectedWarehouse} 
                  onValueChange={setSelectedWarehouse}
                >
                  <SelectTrigger id="warehouse-filter">
                    <SelectValue placeholder="Toate gestiunile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toate gestiunile</SelectItem>
                    {warehouses.map((warehouse: any) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date-from">Data de la</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Selectați data
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={new Date()}
                      onSelect={() => {}}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="date-to">Data până la</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Selectați data
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={new Date()}
                      onSelect={() => {}}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-end space-x-2">
                <Button className="flex-1" variant="secondary">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aplică filtre
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  setSelectedWarehouse("");
                  setSearchQuery("");
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Documente NIR</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Caută document..."
                className="pl-8 w-[200px] md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <CardDescription>
            Note de intrare recepție pentru primirea mărfurilor în gestiune
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
                  <TableHead>Nr. NIR</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Gestiune</TableHead>
                  <TableHead>Furnizor</TableHead>
                  <TableHead>Factură</TableHead>
                  <TableHead className="text-right">Valoare</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Nu există documente NIR care să corespundă criteriilor.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc: any) => {
                    const warehouse = getWarehouseById(doc.warehouseId || doc.warehouse_id || '');
                    const supplier = getSupplierById(doc.supplierId || doc.supplier_id || '');
                    
                    return (
                      <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDocument(doc)}>
                        <TableCell className="font-medium">{doc.nirNumber || doc.nir_number}</TableCell>
                        <TableCell>{new Date(doc.receiptDate || doc.receipt_date || '').toLocaleDateString()}</TableCell>
                        <TableCell>{warehouse?.name || "Necunoscut"}</TableCell>
                        <TableCell>{supplier?.name || "Necunoscut"}</TableCell>
                        <TableCell>{doc.supplierInvoiceNumber || doc.supplier_invoice_number || "-"}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(doc.totalValueWithVat || doc.total_value_with_vat, doc.currency)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={doc.status} />
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Vizualizare
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Printer className="mr-2 h-4 w-4" />
                                Tipărire
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicare
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {doc.status === "draft" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(doc.id, "received")}>
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                    Marchează ca recepționat
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(doc.id, "cancelled")}>
                                    <CircleX className="mr-2 h-4 w-4 text-red-500" />
                                    Anulează
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Imprimă raport
          </Button>
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </CardFooter>
      </Card>
      
      {/* New NIR form dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Creare Document NIR Nou</DialogTitle>
            <DialogDescription>
              Completați informațiile pentru noul document de recepție
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="document.number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Număr NIR</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="document.date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data recepție</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value as Date, 'PPP', { locale: ro }) : "Selectați data"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value as Date}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="document.warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gestiune</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați gestiunea" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((warehouse: any) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
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
                  name="document.supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Furnizor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați furnizorul" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name} ({supplier.fiscalCode})
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
                  name="document.observations"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Observații</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Produse recepționate</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produs</TableHead>
                        <TableHead className="w-24">Cantitate</TableHead>
                        <TableHead className="w-28">Preț unitar</TableHead>
                        <TableHead className="w-28">Lot</TableHead>
                        <TableHead className="w-36">Exp.</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.productId`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select 
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      handleProductChange(index, value);
                                    }} 
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selectați produsul" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {products.map((product: any) => (
                                        <SelectItem key={product.id} value={product.id}>
                                          {product.name} ({product.code})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.unitPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input {...field} placeholder="0.00" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.batchNo`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.expiryDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            {index > 0 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => append({
                    productId: "",
                    quantity: "1",
                    unitPrice: "0",
                    batchNo: "",
                    expiryDate: "",
                    observations: "",
                  })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adaugă produs
                </Button>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Anulează
                </Button>
                <Button type="submit" disabled={createNirDocument.isPending}>
                  {createNirDocument.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvează document
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View NIR document dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Detalii Document NIR</DialogTitle>
            <DialogDescription>
              Informații complete despre documentul de recepție
            </DialogDescription>
          </DialogHeader>
          
          {viewDocument && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-medium">{viewDocument.number}</h3>
                  <p className="text-sm text-muted-foreground">
                    Data: {new Date(viewDocument.date).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={viewDocument.status} />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm font-medium">Gestiune</p>
                  <p className="text-sm text-muted-foreground">
                    {getWarehouseById(viewDocument.warehouseId)?.name || "Necunoscut"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Furnizor</p>
                  <p className="text-sm text-muted-foreground">
                    {getSupplierById(viewDocument.supplierId)?.name || "Necunoscut"}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <h4 className="font-medium">Produse recepționate</h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produs</TableHead>
                      <TableHead className="text-right">Cantitate</TableHead>
                      <TableHead className="text-right">Preț</TableHead>
                      <TableHead className="text-right">TVA</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Datele detaliate ale produselor vor fi disponibile în implementarea completă
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium">Observații</p>
                <p className="text-sm text-muted-foreground">{viewDocument.observations || "-"}</p>
              </div>
              
              <DialogFooter className="flex justify-between">
                {viewDocument.status === "draft" && (
                  <div className="space-x-2">
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        handleUpdateStatus(viewDocument.id, "received");
                        setIsViewDialogOpen(false);
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Marchează ca recepționat
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                      onClick={() => {
                        handleUpdateStatus(viewDocument.id, "cancelled");
                        setIsViewDialogOpen(false);
                      }}
                    >
                      <CircleX className="mr-2 h-4 w-4" />
                      Anulează
                    </Button>
                  </div>
                )}
                <Button 
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Tipărire
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NIRDocumentsPage;