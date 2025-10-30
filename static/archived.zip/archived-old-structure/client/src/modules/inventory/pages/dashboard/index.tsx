/**
 * Inventory Dashboard Page
 * 
 * Main dashboard for the inventory management module showing key metrics
 * and providing quick access to important functions.
 */

import React, { useMemo } from "react";
import { 
  Package, 
  Warehouse, 
  Truck, 
  ShoppingBag, 
  AlertTriangle, 
  Loader2,
  FileCheck,
  ArrowRightLeft,
  PackageOpen
} from "lucide-react";
import * as inventoryApi from "../../hooks/useInventoryApi";
import PageHeader from "../../components/common/PageHeader";
import StatsCard from "../../components/common/StatsCard";
import StatusBadge from "../../components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";

const InventoryDashboard: React.FC = () => {
  const [, navigate] = useLocation();
  
  // Use real API data from hooks with proper type handling
  const { products = [], isLoading: productsLoading } = inventoryApi.useProducts();
  const { warehouses = [], isLoading: warehousesLoading } = inventoryApi.useWarehouses();
  const { stockItems = [], isLoading: stockLoading } = inventoryApi.useStockItems();
  const { nirDocuments = [], isLoading: nirLoading } = inventoryApi.useNirDocuments();
  const { transfers = [], isLoading: transfersLoading } = inventoryApi.useTransfers();
  
  // Combined loading state
  const isLoading = productsLoading || warehousesLoading || stockLoading || nirLoading || transfersLoading;

  // Calculate metrics with type safety
  const totalProducts = Array.isArray(products) ? products.length : 0;
  const activeProducts = useMemo(() => 
    Array.isArray(products) ? products.filter((p: any) => p.isActive).length : 0,
    [products]
  );
  const totalWarehouses = Array.isArray(warehouses) ? warehouses.length : 0;
  
  // Calculate stock stats with type safety
  const totalStockValue = useMemo(() => {
    if (!Array.isArray(stockItems)) return 0;
    
    return stockItems.reduce((sum, item: any) => {
      // Calculate value based on purchase price or default to 0
      const itemValue = item?.purchasePrice || 0;
      const quantity = item?.quantity || 0;
      return sum + (itemValue * quantity);
    }, 0);
  }, [stockItems]);
  
  // Find low stock products with type safety
  const lowStockProducts = useMemo(() => {
    if (!Array.isArray(products) || !Array.isArray(stockItems)) return [];
    
    return products.filter((product: any) => {
      const stockItem = stockItems.find((item: any) => item.productId === product.id);
      return stockItem && product.stockAlert && stockItem.quantity <= product.stockAlert;
    });
  }, [products, stockItems]);
  
  // Recent activities (NIR + Transfers) with type safety
  const recentActivities = useMemo(() => {
    // Safely check if arrays before processing
    if (!Array.isArray(nirDocuments) && !Array.isArray(transfers)) return [];
    
    const warehousesMap = Array.isArray(warehouses) 
      ? new Map(warehouses.map((w: any) => [w.id, w.name]))
      : new Map();
      
    const nirActivities = Array.isArray(nirDocuments)
      ? nirDocuments.map((nir: any) => ({
          id: nir.id,
          type: 'nir',
          reference: nir.nirNumber || `NIR-${nir.id?.substring(0, 8) || 'new'}`,
          date: nir.receiptDate ? new Date(nir.receiptDate) : new Date(),
          status: nir.status || 'pending',
          description: `Recepție în ${warehousesMap.get(nir.warehouseId) || 'gestiune'}`
        }))
      : [];
      
    const transferActivities = Array.isArray(transfers)
      ? transfers.map((transfer: any) => ({
          id: transfer.id,
          type: 'transfer',
          reference: transfer.referenceNumber || `TR-${transfer.id?.substring(0, 8) || 'new'}`,
          date: transfer.transferDate ? new Date(transfer.transferDate) : new Date(),
          status: transfer.status || 'pending',
          description: `Transfer din ${warehousesMap.get(transfer.sourceWarehouseId) || 'gestiune'} în ${warehousesMap.get(transfer.destinationWarehouseId) || 'gestiune'}`
        }))
      : [];
    
    // Combine activities, sort by date descending and take first 10
    return [...nirActivities, ...transferActivities]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
  }, [nirDocuments, transfers, warehouses]);
  
  // Activity Icon Component
  const ActivityIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'nir':
        return <FileCheck className="h-4 w-4 text-green-600" />;
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard Gestiune" 
        description="Vizualizare generală a modulului de gestiune stocuri" 
      />
      
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg text-muted-foreground">Se încarcă datele...</span>
        </div>
      ) : (
        <>
          {/* Key Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Produse active"
              value={activeProducts}
              description={`Din totalul de ${totalProducts} produse`}
              icon={<Package className="h-4 w-4" />}
              onClick={() => navigate('/inventory/products')}
            />
            <StatsCard
              title="Gestiuni"
              value={totalWarehouses}
              description="Depozite și magazine active"
              icon={<Warehouse className="h-4 w-4" />}
              onClick={() => navigate('/inventory/warehouses')}
            />
            <StatsCard
              title="Valoare stocuri"
              value={`${totalStockValue.toLocaleString('ro-RO')} RON`}
              description="Valoare totală la preț de achiziție"
              icon={<ShoppingBag className="h-4 w-4" />}
              onClick={() => navigate('/inventory/stock-levels')}
            />
            <StatsCard
              title="Alerte stoc"
              value={lowStockProducts.length}
              description="Produse cu stoc sub nivel minim"
              icon={<AlertTriangle className="h-4 w-4" />}
              className={lowStockProducts.length > 0 ? "border-orange-300 bg-orange-50 dark:bg-opacity-10" : ""}
              onClick={() => navigate('/inventory/stock-levels')}
            />
          </div>
          
          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Activitate recentă</CardTitle>
                <CardDescription>Ultimele operațiuni de gestiune</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px] pr-4">
                  <div className="space-y-4">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => (
                        <div key={`${activity.type}-${activity.id}`} className="flex items-start">
                          <div className="mr-2 mt-0.5">
                            <ActivityIcon type={activity.type} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {activity.reference}{' '}
                              <StatusBadge status={activity.status} className="ml-2" />
                            </p>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.date.toLocaleDateString('ro-RO')}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-sm text-muted-foreground">
                        Nu există activitate recentă
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Acțiuni rapide</CardTitle>
                <CardDescription>Comenzi frecvente în modulul de gestiune</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => navigate('/inventory/nir/new')}
                  >
                    <FileCheck className="mr-2 h-4 w-4 text-green-600" />
                    <span>Creare NIR</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => navigate('/inventory/transfers/new')}
                  >
                    <ArrowRightLeft className="mr-2 h-4 w-4 text-blue-600" />
                    <span>Transfer între gestiuni</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => navigate('/inventory/products/new')}
                  >
                    <Package className="mr-2 h-4 w-4 text-indigo-600" />
                    <span>Adăugare produs</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => navigate('/inventory/warehouses/new')}
                  >
                    <Warehouse className="mr-2 h-4 w-4 text-amber-600" />
                    <span>Adăugare gestiune</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="justify-start md:col-span-2"
                    onClick={() => navigate('/inventory/reports')}
                  >
                    <PackageOpen className="mr-2 h-4 w-4 text-purple-600" />
                    <span>Verificare stocuri</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryDashboard;