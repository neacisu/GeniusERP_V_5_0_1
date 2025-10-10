/**
 * NIR Documents Management Page
 * 
 * Provides an interface for managing NIR (Notă de Intrare Recepție) documents in the inventory system.
 * These are reception notes used when receiving goods into warehouses.
 */

import React, { useState } from "react";
import { useNirDocuments, useWarehouses, useProducts } from "../../hooks/useInventoryApi";
import { NirDocument, NirStatus, NirItem, Warehouse, Product } from "../../types";

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

// NIR Document Form Schema
const nirDocumentSchema = z.object({
  nirNumber: z.string().min(3, "Numărul NIR trebuie să aibă cel puțin 3 caractere"),
  warehouseId: z.string().min(1, "Selectați gestiunea"),
  supplierId: z.string().min(1, "Selectați furnizorul"),
  supplierInvoiceNumber: z.string().optional(),
  receiptDate: z.date(),
  currency: z.string().default("RON"),
  exchangeRate: z.preprocess(
    (val) => (val === "" ? 1 : Number(val)),
    z.number().min(0.01)
  ),
  isCustody: z.boolean().default(false),
  notes: z.string().optional(),
});

// NIR Item Form Schema
const nirItemSchema = z.object({
  productId: z.string().min(1, "Selectați produsul"),
  quantity: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().min(0.01, "Cantitatea trebuie să fie mai mare de 0")
  ),
  purchasePrice: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().min(0, "Prețul nu poate fi negativ")
  ),
  vatRate: z.preprocess(
    (val) => (val === "" ? 19 : Number(val)),
    z.number().min(0, "TVA nu poate fi negativ")
  ),
  batchNo: z.string().optional(),
  expiryDate: z.date().optional().nullable(),
});

// Combined form schema
const nirFormSchema = z.object({
  document: nirDocumentSchema,
  items: z.array(nirItemSchema).min(1, "Adăugați cel puțin un produs"),
});

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
  const form = useForm<z.infer<typeof nirFormSchema>>({
    resolver: zodResolver(nirFormSchema),
    defaultValues: {
      document: {
        nirNumber: "",
        warehouseId: "",
        supplierId: "",
        supplierInvoiceNumber: "",
        receiptDate: new Date(),
        currency: "RON",
        exchangeRate: 1,
        isCustody: false,
        notes: "",
      },
      items: [
        {
          productId: "",
          quantity: 1,
          purchasePrice: 0,
          vatRate: 19,
          batchNo: "",
          expiryDate: null,
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
        nirNumber: generateNirNumber(),
        warehouseId: "",
        supplierId: "",
        supplierInvoiceNumber: "",
        receiptDate: new Date(),
        currency: "RON",
        exchangeRate: 1,
        isCustody: false,
        notes: "",
      },
      items: [
        {
          productId: "",
          quantity: 1,
          purchasePrice: 0,
          vatRate: 19,
          batchNo: "",
          expiryDate: null,
        }
      ]
    });
    setIsDialogOpen(true);
  };
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof nirFormSchema>) => {
    // Format for API - in a real implementation we'd need to add more transformations
    const formattedValues = {
      document: {
        ...values.document,
        // Convert date to string for the API
        receiptDate: format(values.document.receiptDate, 'yyyy-MM-dd'),
      },
      items: values.items.map(item => ({
        ...item,
        // Convert optional date to string for the API if it exists
        expiryDate: item.expiryDate ? format(item.expiryDate, 'yyyy-MM-dd') : undefined,
      }))
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
  
  // Update NIR status
  const handleUpdateStatus = (id: string, status: NirStatus) => {
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
      (doc.nirNumber || doc.nir_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.supplierInvoiceNumber && doc.supplierInvoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply warehouse filter
    const matchesWarehouse = selectedWarehouse === "" || doc.warehouseId === selectedWarehouse;
    
    // Apply tab filter
    if (activeTab === "all") {
      return matchesSearch && matchesWarehouse;
    } else if (activeTab === "draft") {
      return matchesSearch && matchesWarehouse && doc.status === "draft";
    } else if (activeTab === "pending") {
      return matchesSearch && matchesWarehouse && doc.status === "pending";
    } else if (activeTab === "approved") {
      return matchesSearch && matchesWarehouse && doc.status === "approved";
    } else if (activeTab === "rejected") {
      return matchesSearch && matchesWarehouse && doc.status === "rejected";
    }
    
    return matchesSearch && matchesWarehouse;
  });
  
  // Tab items definition
  const tabItems: TabItem[] = [
    { id: "all", label: "Toate Documentele" },
    { id: "draft", label: "Ciorne" },
    { id: "pending", label: "În așteptare" },
    { id: "approved", label: "Aprobate" },
    { id: "rejected", label: "Respinse" },
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
      form.setValue(`items.${index}.purchasePrice`, Number(product.purchasePrice) || 0);
      form.setValue(`items.${index}.vatRate`, Number(product.vatRate) || 19);
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
                                <DropdownMenuItem onClick={() => handleUpdateStatus(doc.id, "pending")}>
                                  <Clock className="mr-2 h-4 w-4" />
                                  Trimite spre aprobare
                                </DropdownMenuItem>
                              )}
                              {doc.status === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(doc.id, "approved")}>
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                    Aprobă
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(doc.id, "rejected")}>
                                    <CircleX className="mr-2 h-4 w-4 text-red-500" />
                                    Respinge
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
                  name="document.nirNumber"
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
                  name="document.receiptDate"
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
                              {field.value ? format(field.value, 'PPP', { locale: ro }) : "Selectați data"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
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
                  name="document.supplierInvoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nr. factură furnizor</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="document.currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monedă</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați moneda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="RON">RON</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="document.exchangeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curs valutar</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="document.isCustody"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>În custodie</FormLabel>
                        <FormDescription>
                          Marfă primită în custodie
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
                  name="document.notes"
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
                        <TableHead className="w-28">Preț</TableHead>
                        <TableHead className="w-20">TVA%</TableHead>
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
                              name={`items.${index}.purchasePrice`}
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
                              name={`items.${index}.vatRate`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value.toString()}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
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
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          className="w-full justify-start text-left font-normal"
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {field.value ? format(field.value, 'PPP', { locale: ro }) : "Selectați"}
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                      <Calendar
                                        mode="single"
                                        selected={field.value || undefined}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < new Date()}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
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
                    quantity: 1,
                    purchasePrice: 0,
                    vatRate: 19,
                    batchNo: "",
                    expiryDate: null,
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
                  <h3 className="text-lg font-medium">{viewDocument.nirNumber || viewDocument.nir_number}</h3>
                  <p className="text-sm text-muted-foreground">
                    Data: {new Date(viewDocument.receiptDate || viewDocument.receipt_date || '').toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={viewDocument.status} />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm font-medium">Gestiune</p>
                  <p className="text-sm text-muted-foreground">
                    {getWarehouseById(viewDocument.warehouseId || viewDocument.warehouse_id || '')?.name || "Necunoscut"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Furnizor</p>
                  <p className="text-sm text-muted-foreground">
                    {getSupplierById(viewDocument.supplierId || viewDocument.supplier_id || '')?.name || "Necunoscut"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Nr. factură furnizor</p>
                  <p className="text-sm text-muted-foreground">
                    {viewDocument.supplierInvoiceNumber || viewDocument.supplier_invoice_number || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Custodie</p>
                  <p className="text-sm text-muted-foreground">
                    {(viewDocument.isCustody || viewDocument.is_custody) ? "Da" : "Nu"}
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
              
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium">Observații</p>
                  <p className="text-sm text-muted-foreground">{viewDocument.notes || "-"}</p>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-sm">
                    <span className="font-medium">Valoare netă: </span>
                    <span>{formatCurrency(viewDocument.totalValueNoVat || viewDocument.total_value_no_vat, viewDocument.currency)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">TVA: </span>
                    <span>{formatCurrency(viewDocument.totalVat || viewDocument.total_vat, viewDocument.currency)}</span>
                  </div>
                  <div className="text-base font-bold">
                    <span>Total: </span>
                    <span>{formatCurrency(viewDocument.totalValueWithVat || viewDocument.total_value_with_vat, viewDocument.currency)}</span>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex justify-between">
                {viewDocument.status === "draft" && (
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      handleUpdateStatus(viewDocument.id, "pending");
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Trimite spre aprobare
                  </Button>
                )}
                {viewDocument.status === "pending" && (
                  <div className="space-x-2">
                    <Button 
                      variant="outline" 
                      className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                      onClick={() => {
                        handleUpdateStatus(viewDocument.id, "rejected");
                        setIsViewDialogOpen(false);
                      }}
                    >
                      <CircleX className="mr-2 h-4 w-4" />
                      Respinge
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                      onClick={() => {
                        handleUpdateStatus(viewDocument.id, "approved");
                        setIsViewDialogOpen(false);
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Aprobă
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