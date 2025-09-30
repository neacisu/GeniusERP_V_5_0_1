/**
 * Stock Levels Management Page
 * 
 * Provides a comprehensive view of stock levels across warehouses.
 * Includes stock monitoring, alerts, and management tools.
 */

import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { useStockItems, useWarehouses, useProducts } from "../../hooks/useInventoryApi";
import { StockItem, Warehouse, Product } from "../../types";

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Lucide icons
import { 
  Box, 
  Search, 
  Package, 
  Warehouse as WarehouseIcon, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  FileCheck,
  ArrowDownUp,
  CircleDollarSign,
  Filter,
  LayoutGrid,
  List,
  PackageCheck,
  ArrowRightLeft,
  Plus,
  Copy,
  Printer,
  FileDown,
  Loader2,
  ClipboardList,
  FileText
} from "lucide-react";

// Custom components
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import StatsCard from "../../components/common/StatsCard";
import TabsNav, { TabItem } from "../../components/common/TabsNav";

// Stock level visualization
const getStockLevelStatus = (current: number, min: number = 0): "low" | "normal" | "high" => {
  if (current <= min) return "low";
  if (current >= min * 3) return "high";
  return "normal";
};

const getStockProgress = (current: number, min: number = 0): number => {
  if (min === 0) return 50; // Default progress
  if (current <= 0) return 0;
  
  const ratio = current / (min * 3);
  if (ratio >= 1) return 100;
  return Math.round(ratio * 100);
};

const getProgressColor = (status: "low" | "normal" | "high"): string => {
  switch (status) {
    case "low": return "bg-red-500"; // Stocare minimă - roșu
    case "normal": return "bg-green-500"; // Stoc normal - verde
    case "high": return "bg-blue-500"; // Stoc excedentar - albastru
    default: return "bg-gray-500";
  }
};

const StockLevelsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Dialog state
  const [isLedgerDialogOpen, setIsLedgerDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [stockLedgerEntries, setStockLedgerEntries] = useState<any[]>([]);
  
  // Fetch data
  const { stockItems, isLoading: isLoadingStock, checkStockLevels } = useStockItems();
  const { warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const { products, isLoading: isLoadingProducts } = useProducts();
  
  // Combined loading state
  const isLoading = isLoadingStock || isLoadingWarehouses || isLoadingProducts;
  
  // Check stock levels
  const handleCheckStockLevels = () => {
    // If warehouseFilter is "all", pass undefined to check all warehouses
    const warehouseId = warehouseFilter === "all" ? undefined : warehouseFilter;
    
    checkStockLevels.mutate({ warehouseId }, {
      onSuccess: () => {
        toast({
          title: "Verificare stocuri",
          description: "Nivelurile stocurilor au fost verificate cu succes."
        });
      }
    });
  };
  
  // Show Product Ledger Dialog (Fișă de magazie)
  const showProductLedgerDialog = (stock: any) => {
    setSelectedStock(stock);
    
    // In a real application, we would fetch the stock ledger entries from the server
    // For now, we'll generate some sample data based on FIFO principles
    const today = new Date();
    
    // Sample data for stock ledger entries (simulate FIFO)
    const sampleEntries = [
      {
        date: new Date(today.getFullYear(), today.getMonth() - 2, 15),
        documentNo: "NIR-001-2025",
        documentType: "Intrare NIR",
        quantity: stock.quantity * 0.4, // 40% of total
        unitPrice: stock.purchasePrice * 0.9, // Slightly cheaper
        inQuantity: stock.quantity * 0.4,
        outQuantity: 0,
        balance: stock.quantity * 0.4
      },
      {
        date: new Date(today.getFullYear(), today.getMonth() - 1, 5),
        documentNo: "NIR-015-2025",
        documentType: "Intrare NIR",
        quantity: stock.quantity * 0.3, // 30% of total
        unitPrice: stock.purchasePrice,
        inQuantity: stock.quantity * 0.3,
        outQuantity: 0,
        balance: stock.quantity * 0.7 // Cumulative
      },
      {
        date: new Date(today.getFullYear(), today.getMonth() - 1, 10),
        documentNo: "TRF-008-2025",
        documentType: "Transfer Intrare",
        quantity: stock.quantity * 0.3, // 30% of total
        unitPrice: stock.purchasePrice * 1.1, // Slightly more expensive
        inQuantity: stock.quantity * 0.3,
        outQuantity: 0,
        balance: stock.quantity // Cumulative to final value
      },
      {
        date: new Date(today.getFullYear(), today.getMonth(), 5),
        documentNo: "BON-123-2025",
        documentType: "Ieșire Bon Consum",
        quantity: stock.quantity * 0.15, // 15% of total as outgoing
        unitPrice: stock.purchasePrice * 0.9, // FIFO - first in, first out price
        inQuantity: 0,
        outQuantity: stock.quantity * 0.15,
        balance: stock.quantity * 0.85 // Current balance
      }
    ];
    
    // Sort entries by date (oldest first for FIFO)
    const sortedEntries = [...sampleEntries].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    
    setStockLedgerEntries(sortedEntries);
    setIsLedgerDialogOpen(true);
  };
  
  // Compute enriched stock items
  const enrichedStockItems = useMemo(() => {
    return stockItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      const warehouse = warehouses.find(w => w.id === item.warehouseId);
      const stockAlert = product?.stockAlert || 0;
      const stockStatus = getStockLevelStatus(item.quantity, stockAlert);
      
      return {
        ...item,
        productName: product?.name || "Produs necunoscut",
        productCode: product?.sku || "-", // Folosim SKU în loc de cod
        warehouseName: warehouse?.name || "Gestiune necunoscută",
        stockAlert,
        stockStatus,
        progress: getStockProgress(item.quantity, stockAlert),
        // Calculăm cantitatea rezervată (diferența dintre cantitatea totală și cantitatea disponibilă)
        reservedQuantity: item.reservedQuantity || 0
      };
    });
  }, [stockItems, products, warehouses]);
  
  // Filter stock items
  const filteredStockItems = enrichedStockItems.filter(item => {
    // Apply search filter
    const matchesSearch = 
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.warehouseName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply warehouse filter
    const matchesWarehouse = warehouseFilter === "all" || warehouseFilter === "" || item.warehouseId === warehouseFilter;
    
    // Apply tab filter
    if (activeTab === "all") {
      return matchesSearch && matchesWarehouse;
    } else if (activeTab === "low") {
      return matchesSearch && matchesWarehouse && item.stockStatus === "low";
    } else if (activeTab === "normal") {
      return matchesSearch && matchesWarehouse && item.stockStatus === "normal";
    } else if (activeTab === "high") {
      return matchesSearch && matchesWarehouse && item.stockStatus === "high";
    }
    
    return matchesSearch && matchesWarehouse;
  });
  
  // Tab items definition
  const tabItems: TabItem[] = [
    { id: "all", label: "Toate Stocurile" },
    { id: "low", label: "Stoc Minim" },
    { id: "normal", label: "Stoc Normal" },
    { id: "high", label: "Stoc Excedentar" },
  ];
  
  // Calculate summary metrics
  const totalItems = filteredStockItems.length;
  const totalQuantity = filteredStockItems.reduce((sum, item) => {
    // Asigurăm-ne că folosim cantități numerice
    const itemQty = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity || 0);
    return sum + itemQty;
  }, 0);
  const totalValue = filteredStockItems.reduce((sum, item) => {
    // Asigurăm-ne că folosim cantități și prețuri numerice
    const itemQty = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity || 0);
    const itemPrice = typeof item.purchasePrice === 'number' ? item.purchasePrice : Number(item.purchasePrice || 0);
    return sum + (itemQty * itemPrice);
  }, 0);
  const lowStockCount = filteredStockItems.filter(item => item.stockStatus === "low").length;
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gestiune Stocuri" 
        description="Monitorizare și administrare stocuri în depozite"
        actions={
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="flex items-center" 
              onClick={handleCheckStockLevels}
              disabled={checkStockLevels.isPending}
            >
              {checkStockLevels.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PackageCheck className="mr-2 h-4 w-4" />
              )}
              Verificare Stocuri
            </Button>
            <div className="border rounded-md flex">
              <Button 
                variant={viewMode === "list" ? "secondary" : "ghost"} 
                size="sm" 
                className="rounded-r-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "grid" ? "secondary" : "ghost"} 
                size="sm" 
                className="rounded-l-none"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        }
      />
      
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Produse în Stoc" 
          value={totalItems.toString()}
          icon={<Package className="text-blue-500" />}
        />
        <StatsCard 
          title="Cantitate Totală" 
          value={totalQuantity.toFixed(2)}
          icon={<Box className="text-purple-500" />}
        />
        <StatsCard 
          title="Valoare Totală" 
          value={totalValue.toFixed(2)}
          valuePrefix="RON "
          icon={<CircleDollarSign className="text-green-500" />}
        />
        <StatsCard 
          title="Produse cu Stoc Minim" 
          value={lowStockCount.toString()}
          icon={<AlertTriangle className={lowStockCount > 0 ? "text-red-500" : "text-gray-500"} />}
        />
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Caută produs în stoc..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-shrink-0 w-full md:w-1/4">
              <Select 
                value={warehouseFilter} 
                onValueChange={setWarehouseFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toate gestiunile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate gestiunile</SelectItem>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0">
              <Button variant="outline" asChild>
                <Link href="/inventory/nir">
                  <Plus className="mr-2 h-4 w-4" />
                  NIR Nou
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Situație Stocuri</CardTitle>
          <CardDescription>
            Stocuri disponibile în depozite și gestiuni
          </CardDescription>
          <TabsNav 
            tabs={tabItems} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            className="mt-2"
          />
        </CardHeader>
        <CardContent>
          {viewMode === "list" ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Produs</TableHead>
                    <TableHead>Gestiune</TableHead>
                    <TableHead className="text-right">Cantitate</TableHead>
                    <TableHead className="text-right">Rezervat</TableHead>
                    <TableHead className="text-right">Stoc Minim</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead className="text-right">Valoare</TableHead>
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
                  ) : filteredStockItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        Nu există stocuri care să corespundă criteriilor.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStockItems.map(stock => (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">{stock.productCode}</TableCell>
                        <TableCell>{stock.productName}</TableCell>
                        <TableCell>{stock.warehouseName}</TableCell>
                        <TableCell className="text-right">
                          {typeof stock.quantity === 'number' 
                            ? stock.quantity.toFixed(2) 
                            : Number(stock.quantity || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {typeof stock.reservedQuantity === 'number' 
                            ? stock.reservedQuantity.toFixed(2) 
                            : Number(stock.reservedQuantity || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {typeof stock.stockAlert === 'number' 
                            ? stock.stockAlert.toFixed(2) 
                            : Number(stock.stockAlert || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={stock.progress} 
                              className={`h-2 ${getProgressColor(stock.stockStatus)}`} 
                            />
                            <StatusBadge status={stock.stockStatus} />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {((stock.purchasePrice || 0) * 
                            (typeof stock.quantity === 'number' 
                              ? stock.quantity 
                              : Number(stock.quantity || 0))
                          ).toFixed(2)} RON
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => showProductLedgerDialog(stock)}
                              title="Fișă de magazie produs"
                            >
                              <ClipboardList className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href="/inventory/nir">
                                <FileCheck className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href="/inventory/transfers">
                                <ArrowRightLeft className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredStockItems.length === 0 ? (
                <div className="col-span-full flex justify-center py-12">
                  <p className="text-muted-foreground">Nu există stocuri care să corespundă criteriilor.</p>
                </div>
              ) : (
                filteredStockItems.map(stock => (
                  <Card key={stock.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{stock.productName}</CardTitle>
                          <CardDescription>SKU: {stock.productCode}</CardDescription>
                        </div>
                        <StatusBadge status={stock.stockStatus} />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Gestiune:</span>
                          <span className="font-medium">{stock.warehouseName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Cantitate:</span>
                          <span className="font-medium">
                            {typeof stock.quantity === 'number' 
                              ? stock.quantity.toFixed(2) 
                              : Number(stock.quantity || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Rezervat:</span>
                          <span className="font-medium">
                            {typeof stock.reservedQuantity === 'number' 
                              ? stock.reservedQuantity.toFixed(2) 
                              : Number(stock.reservedQuantity || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Stoc minim:</span>
                          <span className="font-medium">
                            {typeof stock.stockAlert === 'number' 
                              ? stock.stockAlert.toFixed(2) 
                              : Number(stock.stockAlert || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Valoare:</span>
                          <span className="font-medium">
                            {((stock.purchasePrice || 0) * 
                              (typeof stock.quantity === 'number' 
                                ? stock.quantity 
                                : Number(stock.quantity || 0))
                            ).toFixed(2)} RON
                          </span>
                        </div>
                        <div className="pt-1">
                          <Progress 
                            value={stock.progress} 
                            className={`h-2 ${getProgressColor(stock.stockStatus)}`} 
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => showProductLedgerDialog(stock)}
                      >
                        <ClipboardList className="mr-1 h-4 w-4" />
                        Fișă Magazie
                      </Button>
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/inventory/nir">
                            <FileCheck className="mr-1 h-4 w-4" />
                            NIR
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/inventory/transfers">
                            <ArrowRightLeft className="mr-1 h-4 w-4" />
                            Transfer
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          )}
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
      
      {/* Fișă de magazie produs dialog */}
      <Dialog open={isLedgerDialogOpen} onOpenChange={setIsLedgerDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Fișă de Magazie Produs</DialogTitle>
            <DialogDescription>
              Evidența stocurilor pe produs conform OMFP 2634/2015
            </DialogDescription>
          </DialogHeader>
          
          {selectedStock && (
            <div className="space-y-4">
              {/* Antet fișă magazie */}
              <div className="bg-muted rounded-md p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Denumire entitate:</p>
                  <p className="font-semibold">DEMO COMPANY SRL</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CUI:</p>
                  <p className="font-semibold">RO12345678</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gestiune:</p>
                  <p className="font-semibold">{selectedStock.warehouseName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gestionar:</p>
                  <p className="font-semibold">Popescu Ion</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produs:</p>
                  <p className="font-semibold">{selectedStock.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cod produs:</p>
                  <p className="font-semibold">{selectedStock.productCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">UM:</p>
                  <p className="font-semibold">buc</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Metoda de evaluare:</p>
                  <p className="font-semibold">FIFO (First In, First Out)</p>
                </div>
              </div>
              
              {/* Table of stock movements */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Data</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Tip operație</TableHead>
                      <TableHead className="text-right">Preț unitar</TableHead>
                      <TableHead className="text-right">Intrări</TableHead>
                      <TableHead className="text-right">Ieșiri</TableHead>
                      <TableHead className="text-right">Stoc</TableHead>
                      <TableHead className="text-right">Valoare</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockLedgerEntries.map((entry, index) => {
                      const unitPrice = typeof entry.unitPrice === 'number' ? entry.unitPrice : Number(entry.unitPrice);
                      const entryValue = entry.balance * unitPrice;
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            {entry.date.toLocaleDateString('ro-RO')}
                          </TableCell>
                          <TableCell>{entry.documentNo}</TableCell>
                          <TableCell>{entry.documentType}</TableCell>
                          <TableCell className="text-right">
                            {typeof entry.unitPrice === 'number' 
                              ? entry.unitPrice.toFixed(2) 
                              : Number(entry.unitPrice).toFixed(2)} RON
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.inQuantity > 0 
                              ? (typeof entry.inQuantity === 'number' 
                                ? entry.inQuantity.toFixed(2) 
                                : Number(entry.inQuantity).toFixed(2)) 
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.outQuantity > 0 
                              ? (typeof entry.outQuantity === 'number' 
                                ? entry.outQuantity.toFixed(2) 
                                : Number(entry.outQuantity).toFixed(2))
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {typeof entry.balance === 'number' 
                              ? entry.balance.toFixed(2) 
                              : Number(entry.balance).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {entryValue.toFixed(2)} RON
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    {/* Totals row */}
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell colSpan={4} className="text-right">Total:</TableCell>
                      <TableCell className="text-right">
                        {stockLedgerEntries.reduce((sum, entry) => sum + (entry.inQuantity || 0), 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {stockLedgerEntries.reduce((sum, entry) => sum + (entry.outQuantity || 0), 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {typeof selectedStock.quantity === 'number' 
                          ? selectedStock.quantity.toFixed(2) 
                          : Number(selectedStock.quantity || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {((selectedStock.purchasePrice || 0) * 
                          (typeof selectedStock.quantity === 'number' 
                            ? selectedStock.quantity 
                            : Number(selectedStock.quantity || 0))).toFixed(2)} RON
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              {/* Footer with legal notes */}
              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                <p>Fișă de magazie conform OMFP 2634/2015 și Legea Contabilității 82/1991</p>
                <p>Metoda de evaluare a stocurilor: FIFO (First In, First Out)</p>
                <p>Întocmit de: System Administrator - Data: {new Date().toLocaleDateString('ro-RO')}</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsLedgerDialogOpen(false)}
            >
              Închide
            </Button>
            <Button
              onClick={() => {
                // Implementare printare - folosind API-ul browser-ului
                const printContent = document.createElement("div");
                printContent.innerHTML = 
                  `<div style="padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="text-align: center; margin-bottom: 20px;">FIȘĂ DE MAGAZIE PRODUS</h2>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                      <div>
                        <p><strong>Denumire entitate:</strong> DEMO COMPANY SRL</p>
                        <p><strong>CUI:</strong> RO12345678</p>
                        <p><strong>Gestiune:</strong> ${selectedStock.warehouseName}</p>
                      </div>
                      <div>
                        <p><strong>Produs:</strong> ${selectedStock.productName}</p>
                        <p><strong>Cod produs:</strong> ${selectedStock.productCode}</p>
                        <p><strong>UM:</strong> buc</p>
                      </div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                      <thead>
                        <tr style="background-color: #f3f4f6;">
                          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Data</th>
                          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Document</th>
                          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Tip operație</th>
                          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">Preț unitar</th>
                          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">Intrări</th>
                          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">Ieșiri</th>
                          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">Stoc</th>
                          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">Valoare</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${stockLedgerEntries.map(entry => {
                          const unitPrice = typeof entry.unitPrice === 'number' ? entry.unitPrice : Number(entry.unitPrice);
                          const entryValue = entry.balance * unitPrice;
                          return `
                            <tr>
                              <td style="border: 1px solid #e5e7eb; padding: 8px;">${entry.date.toLocaleDateString('ro-RO')}</td>
                              <td style="border: 1px solid #e5e7eb; padding: 8px;">${entry.documentNo}</td>
                              <td style="border: 1px solid #e5e7eb; padding: 8px;">${entry.documentType}</td>
                              <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">${unitPrice.toFixed(2)} RON</td>
                              <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">${entry.inQuantity > 0 ? Number(entry.inQuantity).toFixed(2) : '-'}</td>
                              <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">${entry.outQuantity > 0 ? Number(entry.outQuantity).toFixed(2) : '-'}</td>
                              <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">${Number(entry.balance).toFixed(2)}</td>
                              <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">${entryValue.toFixed(2)} RON</td>
                            </tr>
                          `;
                        }).join('')}
                        <tr style="background-color: #f3f4f6; font-weight: bold;">
                          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;" colspan="4">Total:</td>
                          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">
                            ${stockLedgerEntries.reduce((sum, entry) => sum + (entry.inQuantity || 0), 0).toFixed(2)}
                          </td>
                          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">
                            ${stockLedgerEntries.reduce((sum, entry) => sum + (entry.outQuantity || 0), 0).toFixed(2)}
                          </td>
                          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">
                            ${Number(selectedStock.quantity || 0).toFixed(2)}
                          </td>
                          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">
                            ${((selectedStock.purchasePrice || 0) * Number(selectedStock.quantity || 0)).toFixed(2)} RON
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div style="margin-top: 20px; font-size: 12px; color: #666;">
                      <p>Fișă de magazie conform OMFP 2634/2015 și Legea Contabilității 82/1991</p>
                      <p>Metoda de evaluare a stocurilor: FIFO (First In, First Out)</p>
                      <p>Întocmit de: System Administrator - Data: ${new Date().toLocaleDateString('ro-RO')}</p>
                    </div>
                  </div>`;
                
                // Creare fereastră de printare
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Fișă de Magazie - ${selectedStock.productName}</title>
                      </head>
                      <body>
                        ${printContent.innerHTML}
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.focus();
                  // Așteaptă încărcarea contentului
                  setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                  }, 500);
                }
                
                toast({
                  title: "Printare fișă de magazie",
                  description: "Documentul a fost trimis la imprimantă."
                });
              }}
            >
              <Printer className="mr-2 h-4 w-4" />
              Printează
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Creăm conținutul HTML pentru export
                const contentHTML = `<!DOCTYPE html>
                <html>
                <head>
                  <title>Fișă de Magazie - ${selectedStock.productName}</title>
                  <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h2 { text-align: center; margin-bottom: 20px; }
                    .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #e5e7eb; padding: 8px; }
                    th { background-color: #f3f4f6; text-align: left; }
                    td.number { text-align: right; }
                    tr.total { background-color: #f3f4f6; font-weight: bold; }
                    .footer { margin-top: 20px; font-size: 12px; color: #666; }
                  </style>
                </head>
                <body>
                  <h2>FIȘĂ DE MAGAZIE PRODUS</h2>
                  <div class="header-info">
                    <div>
                      <p><strong>Denumire entitate:</strong> DEMO COMPANY SRL</p>
                      <p><strong>CUI:</strong> RO12345678</p>
                      <p><strong>Gestiune:</strong> ${selectedStock.warehouseName}</p>
                    </div>
                    <div>
                      <p><strong>Produs:</strong> ${selectedStock.productName}</p>
                      <p><strong>Cod produs:</strong> ${selectedStock.productCode}</p>
                      <p><strong>UM:</strong> buc</p>
                    </div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Document</th>
                        <th>Tip operație</th>
                        <th style="text-align: right;">Preț unitar</th>
                        <th style="text-align: right;">Intrări</th>
                        <th style="text-align: right;">Ieșiri</th>
                        <th style="text-align: right;">Stoc</th>
                        <th style="text-align: right;">Valoare</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${stockLedgerEntries.map(entry => {
                        const unitPrice = typeof entry.unitPrice === 'number' ? entry.unitPrice : Number(entry.unitPrice);
                        const entryValue = entry.balance * unitPrice;
                        return `
                          <tr>
                            <td>${entry.date.toLocaleDateString('ro-RO')}</td>
                            <td>${entry.documentNo}</td>
                            <td>${entry.documentType}</td>
                            <td class="number">${unitPrice.toFixed(2)} RON</td>
                            <td class="number">${entry.inQuantity > 0 ? Number(entry.inQuantity).toFixed(2) : '-'}</td>
                            <td class="number">${entry.outQuantity > 0 ? Number(entry.outQuantity).toFixed(2) : '-'}</td>
                            <td class="number">${Number(entry.balance).toFixed(2)}</td>
                            <td class="number">${entryValue.toFixed(2)} RON</td>
                          </tr>
                        `;
                      }).join('')}
                      <tr class="total">
                        <td colspan="4" style="text-align: right;">Total:</td>
                        <td class="number">
                          ${stockLedgerEntries.reduce((sum, entry) => sum + (entry.inQuantity || 0), 0).toFixed(2)}
                        </td>
                        <td class="number">
                          ${stockLedgerEntries.reduce((sum, entry) => sum + (entry.outQuantity || 0), 0).toFixed(2)}
                        </td>
                        <td class="number">
                          ${Number(selectedStock.quantity || 0).toFixed(2)}
                        </td>
                        <td class="number">
                          ${((selectedStock.purchasePrice || 0) * Number(selectedStock.quantity || 0)).toFixed(2)} RON
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="footer">
                    <p>Fișă de magazie conform OMFP 2634/2015 și Legea Contabilității 82/1991</p>
                    <p>Metoda de evaluare a stocurilor: FIFO (First In, First Out)</p>
                    <p>Întocmit de: System Administrator - Data: ${new Date().toLocaleDateString('ro-RO')}</p>
                  </div>
                </body>
                </html>`;
                
                // Crearea unui blob cu HTML
                const blob = new Blob([contentHTML], { type: 'text/html' });
                
                // Crearea unui URL pentru blob
                const blobUrl = URL.createObjectURL(blob);
                
                // Crearea unui element anchor pentru descărcare
                const downloadLink = document.createElement('a');
                const filename = `fisa-magazie-${selectedStock.productCode}-${new Date().toISOString().split('T')[0]}.html`;
                
                // Setarea atributelor pentru link-ul de descărcare
                downloadLink.href = blobUrl;
                downloadLink.download = filename;
                
                // Trigger descărcare
                document.body.appendChild(downloadLink);
                downloadLink.click();
                
                // Curățare
                document.body.removeChild(downloadLink);
                setTimeout(() => {
                  URL.revokeObjectURL(blobUrl);
                }, 100);
                
                // Afișează un mesaj de confirmare
                toast({
                  title: "Export Fișă de Magazie",
                  description: `Documentul a fost exportat ca HTML: ${filename}`
                });
              }}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockLevelsPage;