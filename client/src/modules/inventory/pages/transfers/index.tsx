/**
 * Stock Transfers Management Page
 * 
 * Provides an interface for managing stock transfers between warehouses.
 * Allows creating, tracking, and approving transfer documents.
 */

import React, { useState } from "react";
import { useTransfers, useWarehouses, useProducts, useStockItems } from "../../hooks/useInventoryApi";
import { Warehouse, Product, StockItem } from "../../types";

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
  ArrowRightLeft,
  ArrowLeftRight,
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
  ArrowRight,
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

// Transfer Document Form Schema
const transferDocumentSchema = z.object({
  referenceNumber: z.string().min(3, "Numărul de referință trebuie să aibă cel puțin 3 caractere"),
  sourceWarehouseId: z.string().min(1, "Selectați gestiunea sursă"),
  destinationWarehouseId: z.string().min(1, "Selectați gestiunea destinație"),
  transferDate: z.date(),
  currency: z.string(),
  exchangeRate: z.number().min(0.01),
  notes: z.string().optional(),
}).refine(data => data.sourceWarehouseId !== data.destinationWarehouseId, {
  message: "Gestiunea sursă și destinație nu pot fi identice",
  path: ["destinationWarehouseId"],
});

// Transfer Item Form Schema
const transferItemSchema = z.object({
  productId: z.string().min(1, "Selectați produsul"),
  stockItemId: z.string().min(1, "Selectați stocul"),
  quantity: z.number().min(0.01, "Cantitatea trebuie să fie mai mare de 0"),
  unitPrice: z.number().min(0, "Prețul nu poate fi negativ"),
  vatRate: z.number().min(0, "TVA nu poate fi negativ"),
  batchNo: z.string().optional(),
  expiryDate: z.date().optional().nullable(),
});

// Combined form schema
const transferFormSchema = z.object({
  document: transferDocumentSchema,
  items: z.array(transferItemSchema).min(1, "Adăugați cel puțin un produs"),
});

type TransferFormValues = z.infer<typeof transferFormSchema>;

const TransfersPage: React.FC = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewDocument, setViewDocument] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSourceWarehouse, setSelectedSourceWarehouse] = useState<string>("");
  const [selectedDestinationWarehouse, setSelectedDestinationWarehouse] = useState<string>("");
  const [filteredStockItems, setFilteredStockItems] = useState<StockItem[]>([]);
  
  // Fetch data
  const { transfers, isLoading, createTransfer, updateTransferStatus } = useTransfers();
  const { warehouses } = useWarehouses();
  const { products } = useProducts();
  const { stockItems } = useStockItems();
  
  // Form setup
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      document: {
        referenceNumber: "",
        sourceWarehouseId: "",
        destinationWarehouseId: "",
        transferDate: new Date(),
        currency: "RON",
        exchangeRate: 1,
        notes: "",
      },
      items: [
        {
          productId: "",
          stockItemId: "",
          quantity: 1,
          unitPrice: 0,
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
  
  // Watch values from form
  const sourceWarehouseId = form.watch("document.sourceWarehouseId");
  const selectedProductIds = form.watch("items").map((item: any) => item.productId);
  
  // Update available stock items when source warehouse changes
  React.useEffect(() => {
    if (sourceWarehouseId) {
      const filtered = stockItems.filter(
        (item: any) => item.warehouseId === sourceWarehouseId && item.quantity > 0
      );
      setFilteredStockItems(filtered);
    } else {
      setFilteredStockItems([]);
    }
  }, [sourceWarehouseId, stockItems]);
  
  // Reset form when dialog is closed
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
      setFilteredStockItems([]);
    }
  };
  
  // Generate transfer number
  const generateTransferNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `TRF-${year}${month}${day}-${random}`;
  };
  
  // Open form dialog for creating
  const handleAddNew = () => {
    form.reset({
      document: {
        referenceNumber: generateTransferNumber(),
        sourceWarehouseId: "",
        destinationWarehouseId: "",
        transferDate: new Date(),
        currency: "RON",
        exchangeRate: 1,
        notes: "",
      },
      items: [
        {
          productId: "",
          stockItemId: "",
          quantity: 1,
          unitPrice: 0,
          vatRate: 19,
          batchNo: "",
          expiryDate: null,
        }
      ]
    });
    setIsDialogOpen(true);
  };
  
  // Form submission handler
  const onSubmit = (values: TransferFormValues) => {
    // Format for API - in a real implementation we'd need to add more transformations
    const formattedValues = {
      document: {
        ...values.document,
        // Convert date to string for the API
        transferDate: format(values.document.transferDate, 'yyyy-MM-dd'),
      },
      items: values.items.map(item => ({
        ...item,
        // Convert optional date to string for the API if it exists
        expiryDate: item.expiryDate ? format(item.expiryDate, 'yyyy-MM-dd') : undefined,
      }))
    };
    
    createTransfer.mutate(formattedValues, {
      onSuccess: () => {
        toast({
          title: "Transfer creat",
          description: "Documentul de transfer a fost creat cu succes."
        });
        setIsDialogOpen(false);
      }
    });
  };
  
  // View transfer document details
  const handleViewDocument = (document: any) => {
    setViewDocument(document);
    setIsViewDialogOpen(true);
  };
  
  // Update transfer status
  const handleUpdateStatus = (id: string, status: string) => {
    updateTransferStatus.mutate({ id, status }, {
      onSuccess: () => {
        toast({
          title: "Status actualizat",
          description: `Statusul documentului de transfer a fost actualizat la ${status}.`
        });
      }
    });
  };
  
  // Filter transfer documents
  const filteredTransfers = transfers.filter((doc: any) => {
    // Apply search filter
    const matchesSearch = 
      (doc.referenceNumber || doc.transfer_number || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply warehouse filters
    const matchesSourceWarehouse = selectedSourceWarehouse === "" || (doc.sourceWarehouseId || doc.source_warehouse_id) === selectedSourceWarehouse;
    const matchesDestWarehouse = selectedDestinationWarehouse === "" || (doc.destinationWarehouseId || doc.destination_warehouse_id) === selectedDestinationWarehouse;
    
    // Apply tab filter
    let matchesStatus = true;
    if (activeTab !== "all") {
      matchesStatus = doc.status === activeTab;
    }
    
    return matchesSearch && matchesSourceWarehouse && matchesDestWarehouse && matchesStatus;
  });
  
  // Tab items definition
  const tabItems: TabItem[] = [
    { id: "all", label: "Toate Transferurile" },
    { id: "draft", label: "Ciorne" },
    { id: "issued", label: "Emise" },
    { id: "in_transit", label: "În tranzit" },
    { id: "received", label: "Recepționate" },
    { id: "cancelled", label: "Anulate" },
  ];
  
  // Helper to get product details
  const getProductById = (productId: string): Product | undefined => {
    return products.find((p: any) => p.id === productId);
  };
  
  // Helper to get warehouse details
  const getWarehouseById = (warehouseId: string): Warehouse | undefined => {
    return warehouses.find((w: any) => w.id === warehouseId);
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
  
  // Helper to get available stock quantity for a product
  const getAvailableStockQuantity = (productId: string, stockItemId: string): number => {
    const stockItem = stockItems.find((item: any) => item.id === stockItemId && item.productId === productId);
    return stockItem ? stockItem.quantity : 0;
  };
  
  // Update product details when product is selected
  const handleProductChange = (index: number, productId: string) => {
    const product = getProductById(productId);
    if (product) {
      form.setValue(`items.${index}.unitPrice`, product.purchasePrice ? parseFloat(product.purchasePrice.toString()) : 0);
      form.setValue(`items.${index}.vatRate`, product.vatRate || 19);
      // Clear the stockItemId to force reselection
      form.setValue(`items.${index}.stockItemId`, "");
    }
  };
  
  // Get available stock items for a product
  const getAvailableStockItems = (productId: string): StockItem[] => {
    return filteredStockItems.filter((item: any) => item.productId === productId && item.quantity > 0);
  };
  
  // Set batch and expiry info when stock item is selected
  const handleStockItemChange = (index: number, stockItemId: string) => {
    const stockItem = stockItems.find((item: any) => item.id === stockItemId);
    if (stockItem) {
      form.setValue(`items.${index}.batchNo`, stockItem.batchNo || "");
      if (stockItem.expiryDate) {
        form.setValue(`items.${index}.expiryDate`, new Date(stockItem.expiryDate));
      }
      // Update unit price if it's available
      if (stockItem.purchasePrice) {
        form.setValue(`items.${index}.unitPrice`, stockItem.purchasePrice);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Transferuri de Stoc" 
        description="Gestionare transferuri între depozite și gestiuni"
        onAddNew={handleAddNew}
        addNewLabel="Transfer Nou"
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
                <Label htmlFor="source-warehouse-filter">Gestiune sursă</Label>
                <Select 
                  value={selectedSourceWarehouse} 
                  onValueChange={setSelectedSourceWarehouse}
                >
                  <SelectTrigger id="source-warehouse-filter">
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
                <Label htmlFor="dest-warehouse-filter">Gestiune destinație</Label>
                <Select 
                  value={selectedDestinationWarehouse} 
                  onValueChange={setSelectedDestinationWarehouse}
                >
                  <SelectTrigger id="dest-warehouse-filter">
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
                <Label htmlFor="date-filter">Perioadă</Label>
                <Select defaultValue="all">
                  <SelectTrigger id="date-filter">
                    <SelectValue placeholder="Toate perioadele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate perioadele</SelectItem>
                    <SelectItem value="today">Astăzi</SelectItem>
                    <SelectItem value="week">Săptămâna aceasta</SelectItem>
                    <SelectItem value="month">Luna aceasta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end space-x-2">
                <Button className="flex-1" variant="secondary">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aplică filtre
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  setSelectedSourceWarehouse("");
                  setSelectedDestinationWarehouse("");
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
            <CardTitle>Documente de Transfer</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Caută transfer..."
                className="pl-8 w-[200px] md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <CardDescription>
            Documente de transfer al stocurilor între gestiuni
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
                  <TableHead>Nr. Transfer</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Din Gestiune</TableHead>
                  <TableHead>În Gestiune</TableHead>
                  <TableHead className="text-right">Valoare</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Nu există transferuri care să corespundă criteriilor.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransfers.map((doc: any) => {
                    const sourceWarehouse = getWarehouseById(doc.sourceWarehouseId || doc.source_warehouse_id || '');
                    const destWarehouse = getWarehouseById(doc.destinationWarehouseId || doc.destination_warehouse_id || '');
                    
                    return (
                      <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDocument(doc)}>
                        <TableCell className="font-medium">{doc.referenceNumber || doc.transfer_number}</TableCell>
                        <TableCell>{new Date(doc.transferDate || doc.transfer_date || '').toLocaleDateString()}</TableCell>
                        <TableCell>{sourceWarehouse?.name || "Necunoscut"}</TableCell>
                        <TableCell>{destWarehouse?.name || "Necunoscut"}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(doc.totalValueWithVat || doc.total_value, doc.currency)}
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
                                <DropdownMenuItem onClick={() => handleUpdateStatus(doc.id, "issued")}>
                                  <ArrowRight className="mr-2 h-4 w-4" />
                                  Emitere
                                </DropdownMenuItem>
                              )}
                              {doc.status === "issued" && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(doc.id, "in_transit")}>
                                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                                  Marcare ca În Tranzit
                                </DropdownMenuItem>
                              )}
                              {doc.status === "in_transit" && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(doc.id, "received")}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                  Marcare ca Recepționat
                                </DropdownMenuItem>
                              )}
                              {(doc.status === "draft" || doc.status === "issued") && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(doc.id, "cancelled")}>
                                  <CircleX className="mr-2 h-4 w-4 text-red-500" />
                                  Anulare
                                </DropdownMenuItem>
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
      
      {/* New Transfer form dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Creare Document Transfer Nou</DialogTitle>
            <DialogDescription>
              Completați informațiile pentru noul document de transfer
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="document.referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Număr Transfer</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="document.transferDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data transfer</FormLabel>
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
                  name="document.sourceWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gestiune sursă</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați gestiunea sursă" />
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
                  name="document.destinationWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gestiune destinație</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectați gestiunea destinație" />
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
                <h3 className="text-lg font-medium mb-4">Produse de transferat</h3>
                
                {!sourceWarehouseId && (
                  <div className="rounded-md border p-4 bg-muted/50 text-center mb-4">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Selectați gestiunea sursă pentru a vedea stocurile disponibile
                    </p>
                  </div>
                )}
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produs</TableHead>
                        <TableHead>Stoc</TableHead>
                        <TableHead className="w-24">Cantitate</TableHead>
                        <TableHead className="w-28">Preț</TableHead>
                        <TableHead className="w-20">TVA%</TableHead>
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
                                    disabled={!sourceWarehouseId}
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
                              name={`items.${index}.stockItemId`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select 
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      handleStockItemChange(index, value);
                                    }} 
                                    value={field.value}
                                    disabled={!form.getValues(`items.${index}.productId`)}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selectați stocul" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {getAvailableStockItems(form.getValues(`items.${index}.productId`)).map(stockItem => (
                                        <SelectItem key={stockItem.id} value={stockItem.id}>
                                          {stockItem.quantity} buc
                                          {stockItem.batchNo ? ` - Lot: ${stockItem.batchNo}` : ""}
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
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      {...field} 
                                      disabled={!form.getValues(`items.${index}.stockItemId`)}
                                      max={getAvailableStockQuantity(
                                        form.getValues(`items.${index}.productId`),
                                        form.getValues(`items.${index}.stockItemId`)
                                      )}
                                    />
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
                    stockItemId: "",
                    quantity: 1,
                    unitPrice: 0,
                    vatRate: 19,
                    batchNo: "",
                    expiryDate: null,
                  })}
                  disabled={!sourceWarehouseId}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adaugă produs
                </Button>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Anulează
                </Button>
                <Button type="submit" disabled={createTransfer.isPending}>
                  {createTransfer.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvează transfer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Transfer document dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Detalii Document Transfer</DialogTitle>
            <DialogDescription>
              Informații complete despre documentul de transfer
            </DialogDescription>
          </DialogHeader>
          
          {viewDocument && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-medium">{viewDocument.referenceNumber}</h3>
                  <p className="text-sm text-muted-foreground">
                    Data: {new Date(viewDocument.transferDate).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={viewDocument.status} />
              </div>
              
              <div className="rounded-md border p-4 bg-muted/10">
                <div className="flex items-center justify-center gap-3">
                  <div className="text-center">
                    <p className="text-sm font-semibold">{getWarehouseById(viewDocument.sourceWarehouseId)?.name || "Necunoscut"}</p>
                    <p className="text-xs text-muted-foreground">Gestiune sursă</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-semibold">{getWarehouseById(viewDocument.destinationWarehouseId)?.name || "Necunoscut"}</p>
                    <p className="text-xs text-muted-foreground">Gestiune destinație</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <h4 className="font-medium">Produse transferate</h4>
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
                    <span>{formatCurrency(viewDocument.totalValueNoVat, viewDocument.currency)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">TVA: </span>
                    <span>{formatCurrency(viewDocument.totalVat, viewDocument.currency)}</span>
                  </div>
                  <div className="text-base font-bold">
                    <span>Total: </span>
                    <span>{formatCurrency(viewDocument.totalValueWithVat, viewDocument.currency)}</span>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex justify-between">
                {viewDocument.status === "draft" && (
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      handleUpdateStatus(viewDocument.id, "issued");
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Emitere
                  </Button>
                )}
                {viewDocument.status === "issued" && (
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      handleUpdateStatus(viewDocument.id, "in_transit");
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Marcare ca În Tranzit
                  </Button>
                )}
                {viewDocument.status === "in_transit" && (
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      handleUpdateStatus(viewDocument.id, "received");
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Marcare ca Recepționat
                  </Button>
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

export default TransfersPage;