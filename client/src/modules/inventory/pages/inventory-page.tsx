import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InventoryProduct, InventoryCategory, InventoryUnit } from "@shared/schema";
import { Loader2, Search, Plus, Edit, Trash2 } from "lucide-react";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products, categories, and units
  const { data: products, isLoading: isLoadingProducts } = useQuery<InventoryProduct[]>({
    queryKey: ['/api/inventory/products'],
  });

  const { data: categories } = useQuery<InventoryCategory[]>({
    queryKey: ['/api/inventory/categories'],
  });

  const { data: units } = useQuery<InventoryUnit[]>({
    queryKey: ['/api/inventory/units'],
  });

  // Product form
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      categoryId: "",
      unitId: "",
      purchasePrice: "0",
      sellingPrice: "0",
      vatRate: "19",
      stockAlert: "0",
    }
  });

  // Set up form when editing a product
  const setupEditForm = (product: InventoryProduct) => {
    reset({
      code: product.code,
      name: product.name,
      description: product.description || "",
      categoryId: product.categoryId || "",
      unitId: product.unitId || "",
      purchasePrice: product.purchasePrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      vatRate: product.vatRate.toString(),
      stockAlert: product.stockAlert?.toString() || "0",
    });
    setIsProductDialogOpen(true);
  };

  // Handle product creation/update
  const productMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = selectedProduct 
        ? `/api/inventory/products/${selectedProduct.id}` 
        : '/api/inventory/products';
      const method = selectedProduct ? "PATCH" : "POST";
      const response = await apiRequest(method, endpoint, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/products'] });
      toast({
        title: selectedProduct ? "Produs actualizat" : "Produs creat",
        description: `Produsul a fost ${selectedProduct ? 'actualizat' : 'creat'} cu succes.`,
      });
      setIsProductDialogOpen(false);
      setSelectedProduct(null);
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: `Nu s-a putut ${selectedProduct ? 'actualiza' : 'crea'} produsul: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const onSubmitProduct = (data: any) => {
    productMutation.mutate(data);
  };

  // Open dialog for new product
  const handleAddProduct = () => {
    setSelectedProduct(null);
    reset({
      code: "",
      name: "",
      description: "",
      categoryId: "",
      unitId: "",
      purchasePrice: "0",
      sellingPrice: "0",
      vatRate: "19",
      stockAlert: "0",
    });
    setIsProductDialogOpen(true);
  };

  // Open dialog for editing product
  const handleEditProduct = (product: InventoryProduct) => {
    setSelectedProduct(product);
    setupEditForm(product);
  };

  // Filter products based on search term
  const filteredProducts = products?.filter(product => 
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <AppLayout>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
          <CardTitle>Gestiune Stocuri</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Caută produs..."
                className="pl-8 w-[200px] md:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleAddProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Produs Nou
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="products">Produse</TabsTrigger>
              <TabsTrigger value="stock">Stocuri</TabsTrigger>
              <TabsTrigger value="movements">Mișcări Stoc</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Cod</TableHead>
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
                    {isLoadingProducts ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredProducts.length > 0 ? (
                      filteredProducts.map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.code}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>
                            {categories?.find(c => c.id === product.categoryId)?.name || "-"}
                          </TableCell>
                          <TableCell>
                            {units?.find(u => u.id === product.unitId)?.abbreviation || "-"}
                          </TableCell>
                          <TableCell className="text-right">{parseFloat(product.purchasePrice.toString()).toFixed(2)} RON</TableCell>
                          <TableCell className="text-right">{parseFloat(product.sellingPrice.toString()).toFixed(2)} RON</TableCell>
                          <TableCell className="text-center">{product.vatRate}%</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                          Nu există produse care să corespundă căutării.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="stock">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Cod</TableHead>
                      <TableHead>Denumire</TableHead>
                      <TableHead className="text-right">Stoc Disponibil</TableHead>
                      <TableHead className="text-right">Valoare Stoc</TableHead>
                      <TableHead className="text-right">Preț Mediu</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                        Datele de stoc se vor încărca aici.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="movements">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Produs</TableHead>
                      <TableHead>Tip Mișcare</TableHead>
                      <TableHead className="text-right">Cantitate</TableHead>
                      <TableHead className="text-right">Preț Unitar</TableHead>
                      <TableHead className="text-right">Valoare Totală</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                        Datele despre mișcări de stoc se vor încărca aici.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Product dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? "Editare Produs" : "Produs Nou"}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmitProduct)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">Cod</Label>
                <Input 
                  id="code" 
                  placeholder="Cod produs" 
                  className="col-span-3"
                  {...register("code", { required: "Codul este obligatoriu" })}
                  disabled={!!selectedProduct}
                />
                {errors.code && <p className="text-red-500 text-xs col-span-3 col-start-2">{errors.code.message}</p>}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Denumire</Label>
                <Input 
                  id="name" 
                  placeholder="Denumire produs" 
                  className="col-span-3"
                  {...register("name", { required: "Denumirea este obligatorie" })}
                />
                {errors.name && <p className="text-red-500 text-xs col-span-3 col-start-2">{errors.name.message}</p>}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Descriere</Label>
                <Input 
                  id="description" 
                  placeholder="Descriere produs" 
                  className="col-span-3"
                  {...register("description")}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Categorie</Label>
                <Select 
                  defaultValue={selectedProduct?.categoryId || "none"}
                  onValueChange={(value) => register("categoryId").onChange({ target: { value } })}
                >
                  <SelectTrigger className="col-span-3" id="category">
                    <SelectValue placeholder="Selectați categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nicio categorie</SelectItem>
                    {categories?.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">Unitate Măsură</Label>
                <Select 
                  defaultValue={selectedProduct?.unitId || "none"}
                  onValueChange={(value) => register("unitId").onChange({ target: { value } })}
                >
                  <SelectTrigger className="col-span-3" id="unit">
                    <SelectValue placeholder="Selectați unitatea de măsură" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nicio unitate</SelectItem>
                    {units?.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="purchasePrice" className="text-right">Preț Achiziție</Label>
                <div className="col-span-3 flex items-center">
                  <Input 
                    id="purchasePrice" 
                    type="number" 
                    step="0.01" 
                    min="0"
                    className="flex-1"
                    {...register("purchasePrice", { required: "Prețul de achiziție este obligatoriu" })}
                  />
                  <span className="ml-2">RON</span>
                </div>
                {errors.purchasePrice && <p className="text-red-500 text-xs col-span-3 col-start-2">{errors.purchasePrice.message}</p>}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sellingPrice" className="text-right">Preț Vânzare</Label>
                <div className="col-span-3 flex items-center">
                  <Input 
                    id="sellingPrice" 
                    type="number" 
                    step="0.01" 
                    min="0"
                    className="flex-1"
                    {...register("sellingPrice", { required: "Prețul de vânzare este obligatoriu" })}
                  />
                  <span className="ml-2">RON</span>
                </div>
                {errors.sellingPrice && <p className="text-red-500 text-xs col-span-3 col-start-2">{errors.sellingPrice.message}</p>}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vatRate" className="text-right">Rată TVA</Label>
                <div className="col-span-3 flex items-center">
                  <Input 
                    id="vatRate" 
                    type="number" 
                    min="0" 
                    max="100"
                    className="flex-1"
                    {...register("vatRate", { required: "Rata TVA este obligatorie" })}
                  />
                  <span className="ml-2">%</span>
                </div>
                {errors.vatRate && <p className="text-red-500 text-xs col-span-3 col-start-2">{errors.vatRate.message}</p>}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stockAlert" className="text-right">Alertă Stoc</Label>
                <Input 
                  id="stockAlert" 
                  type="number" 
                  min="0" 
                  step="1"
                  className="col-span-3"
                  {...register("stockAlert")}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsProductDialogOpen(false);
                setSelectedProduct(null);
                reset();
              }}>
                Anulează
              </Button>
              <Button type="submit" disabled={productMutation.isPending}>
                {productMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se procesează...
                  </>
                ) : (
                  "Salvează"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
