/**
 * Warehouses Management Page
 * 
 * Provides interface for managing warehouses (gestiuni) in the inventory system.
 * Allows creating, editing, and viewing warehouse information.
 */

import React, { useState } from "react";
import { useWarehouses } from "../../hooks/useInventoryApi";
import { GestiuneType, StockTrackingType, Warehouse } from "../../types";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Lucide icons
import { 
  Warehouse as WarehouseIcon, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin, 
  User, 
  Store, 
  PackageCheck,
  Package,
  ArrowUpDown,
  Loader2
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

// Form validation schema
const warehouseFormSchema = z.object({
  name: z.string().min(3, {
    message: "Numele gestiunii trebuie să aibă cel puțin 3 caractere.",
  }),
  code: z.string().optional(),
  type: z.enum(["depozit", "magazin", "custodie", "transfer"]),
  location: z.string().optional(),
  responsible: z.string().optional(),
  isActive: z.boolean(),
});

type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;

const WarehousesPage: React.FC = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseDetailId, setWarehouseDetailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  const { 
    warehouses, 
    isLoading, 
    isError, 
    refetch,
    createWarehouse, 
    updateWarehouse 
  } = useWarehouses();
  
  // Form setup
  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "depozit",
      location: "",
      responsible: "",
      isActive: true,
    },
  });
  
  // Reset form when dialog is closed
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setCurrentWarehouse(null);
      form.reset();
    }
  };
  
  // Open form dialog for creating
  const handleAddNew = () => {
    setCurrentWarehouse(null);
    form.reset({
      name: "",
      code: "",
      type: "depozit",
      location: "",
      responsible: "",
      isActive: true,
    });
    setIsDialogOpen(true);
  };
  
  // Open form dialog for editing
  const handleEdit = (warehouse: Warehouse) => {
    setCurrentWarehouse(warehouse);
    form.reset({
      name: warehouse.name,
      code: warehouse.code,
      type: warehouse.type,
      location: warehouse.location || "",
      responsible: warehouse.responsible || "",
      isActive: warehouse.isActive,
    });
    setIsDialogOpen(true);
  };
  
  // Form submission handler
  const onSubmit = (values: WarehouseFormValues) => {
    if (currentWarehouse) {
      // Update existing warehouse
      updateWarehouse.mutate({
        id: currentWarehouse.id,
        ...values,
      });
    } else {
      // Create new warehouse
      createWarehouse.mutate(values);
    }
    
    setIsDialogOpen(false);
  };
  
  // Filter warehouses based on search and active tab
  const filteredWarehouses = warehouses.filter((warehouse: any) => {
    // Apply search filter
    const matchesSearch = 
      warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (warehouse.location && warehouse.location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply tab filter
    if (activeTab === "all") {
      return matchesSearch;
    } else if (activeTab === "active") {
      return matchesSearch && warehouse.isActive;
    } else if (activeTab === "inactive") {
      return matchesSearch && !warehouse.isActive;
    } else if (activeTab === "depozit") {
      return matchesSearch && warehouse.type === "depozit";
    } else if (activeTab === "magazin") {
      return matchesSearch && warehouse.type === "magazin";
    } else if (activeTab === "custodie") {
      return matchesSearch && warehouse.type === "custodie";
    }
    
    return matchesSearch;
  });
  
  // Tab items definition
  const tabItems: TabItem[] = [
    { id: "all", label: "Toate Gestiunile" },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
    { id: "depozit", label: "Depozite" },
    { id: "magazin", label: "Magazine" },
    { id: "custodie", label: "Custodie" },
  ];
  
  // Get type label for display
  const getTypeLabel = (type: GestiuneType) => {
    switch (type) {
      case "depozit":
        return "Depozit";
      case "magazin":
        return "Magazin";
      case "custodie":
        return "Custodie";
      case "transfer":
        return "Gestiune Transfer";
      default:
        return type;
    }
  };
  
  
  // Get the selected warehouse for detail view
  const selectedWarehouse = warehouseDetailId 
    ? warehouses.find((w: any) => w.id === warehouseDetailId) 
    : null;
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gestiuni" 
        description="Administrare depozite, magazine și alte gestiuni"
        onAddNew={handleAddNew}
        addNewLabel="Gestiune Nouă"
      />
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Lista Gestiunilor</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Caută gestiune..."
                    className="pl-8 w-[200px] md:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <CardDescription>
                Toate gestiunile companiei pentru stocuri de produse
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
                      <TableHead>Cod</TableHead>
                      <TableHead>Denumire</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredWarehouses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          Nu există gestiuni care să corespundă criteriilor.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWarehouses.map((warehouse: any) => (
                        <TableRow key={warehouse.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setWarehouseDetailId(warehouse.id)}>
                          <TableCell className="font-medium">{warehouse.code}</TableCell>
                          <TableCell>{warehouse.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              warehouse.type === 'depozit' ? 'bg-blue-50 text-blue-700' : 
                              warehouse.type === 'magazin' ? 'bg-green-50 text-green-700' : 
                              warehouse.type === 'custodie' ? 'bg-amber-50 text-amber-700' : 
                              'bg-purple-50 text-purple-700'
                            }>
                              {getTypeLabel(warehouse.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={warehouse.isActive ? 'active' : 'inactive'} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(warehouse);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Sigur doriți să ${warehouse.isActive ? 'dezactivați' : 'activați'} gestiunea ${warehouse.name}?`)) {
                                    updateWarehouse.mutate({ id: warehouse.id, isActive: !warehouse.isActive });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
              <CardTitle>Detalii Gestiune</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedWarehouse ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {selectedWarehouse.type === 'depozit' && <WarehouseIcon className="h-6 w-6 text-primary" />}
                      {selectedWarehouse.type === 'magazin' && <Store className="h-6 w-6 text-primary" />}
                      {selectedWarehouse.type === 'custodie' && <Package className="h-6 w-6 text-primary" />}
                      {selectedWarehouse.type === 'transfer' && <ArrowUpDown className="h-6 w-6 text-primary" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{selectedWarehouse.name}</h3>
                      <p className="text-sm text-muted-foreground">Cod: {selectedWarehouse.code}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium">Tip Gestiune</p>
                      <p className="text-sm text-muted-foreground">{getTypeLabel(selectedWarehouse.type)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <StatusBadge status={selectedWarehouse.isActive ? 'active' : 'inactive'} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Creat la</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedWarehouse.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    {selectedWarehouse.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{selectedWarehouse.location}</span>
                      </div>
                    )}
                    
                    {selectedWarehouse.responsible && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">Responsabil: {selectedWarehouse.responsible}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 flex space-x-3">
                    <Button 
                      className="flex-1" 
                      variant="outline"
                      onClick={() => handleEdit(selectedWarehouse)}
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
                  <WarehouseIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium text-lg">Nicio gestiune selectată</h3>
                  <p className="text-sm text-muted-foreground">
                    Selectați o gestiune din listă pentru a vedea detaliile
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Warehouse form dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{currentWarehouse ? "Editare Gestiune" : "Adăugare Gestiune Nouă"}</DialogTitle>
            <DialogDescription>
              {currentWarehouse 
                ? "Modificați detaliile gestiunii existente" 
                : "Creați o gestiune nouă în sistem"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {currentWarehouse ? (
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cod Gestiune</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="371.x" 
                            {...field} 
                            disabled={true}
                          />
                        </FormControl>
                        <FormDescription>
                          Cont analitic autogenerat pentru marfuri
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cod Gestiune</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="371.x" 
                            value="Se generează automat"
                            disabled={true}
                          />
                        </FormControl>
                        <FormDescription>
                          Cod generat automat ca cont analitic 371.x
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tip Gestiune</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează tipul" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="depozit">Depozit</SelectItem>
                          <SelectItem value="magazin">Magazin</SelectItem>
                          <SelectItem value="custodie">Custodie</SelectItem>
                          <SelectItem value="transfer">Gestiune Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Denumire</FormLabel>
                      <FormControl>
                        <Input placeholder="Depozit Central" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Status Activ</FormLabel>
                        <FormDescription>
                          Activează sau dezactivează gestiunea
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Locație</FormLabel>
                      <FormControl>
                        <Input placeholder="București, Sector 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="responsible"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Persoană Responsabilă</FormLabel>
                      <FormControl>
                        <Input placeholder="Ion Popescu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={createWarehouse.isPending || updateWarehouse.isPending}>
                  {(createWarehouse.isPending || updateWarehouse.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {currentWarehouse ? "Salvează Modificările" : "Crează Gestiune"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarehousesPage;