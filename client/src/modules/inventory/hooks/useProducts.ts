/**
 * Products Hook
 * 
 * Custom hook for managing inventory products including CRUD operations
 * and handling uniqueness constraints.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Product, PaginatedProducts } from "../types";

// Define ProductFormValues type
export interface ProductFormValues {
  name: string;
  sku: string;
  description?: string;
  categoryId?: string;
  unitId?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  vatRate?: number;
  stockAlert?: number;
  isActive: boolean;
  priceIncludesVat?: boolean;
}

/**
 * Hook for managing products with CRUD operations and pagination
 */
export function useProducts() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "all",
    status: "all"
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 30,
    totalPages: 1,
    totalItems: 0
  });
  
  // Fetch products with pagination
  const { 
    data: productsData, 
    isLoading, 
    isError,
    error
  } = useQuery({
    queryKey: ['/api/inventory/products', pagination.page, pagination.pageSize, filters],
    queryFn: async () => {
      try {
        // Make request with pagination parameters
        const url = new URL('/api/inventory/products', window.location.origin);
        url.searchParams.append('page', pagination.page.toString());
        url.searchParams.append('pageSize', pagination.pageSize.toString());
        
        // Add filters to URL if present
        if (filters.categoryId !== "all") {
          url.searchParams.append('categoryId', filters.categoryId);
        }
        if (filters.status !== "all") {
          url.searchParams.append('status', filters.status);
        }
        if (filters.search) {
          url.searchParams.append('search', filters.search);
        }
        
        const response = await apiRequest<PaginatedProducts>(url.pathname + url.search);
        
        // Update pagination information based on response
        if (response) {
          setPagination(prev => ({
            ...prev,
            totalPages: Math.ceil(response.total / pagination.pageSize),
            totalItems: response.total
          }));
          return response;
        }
        
        return { 
          items: [], 
          total: 0, 
          page: 1, 
          pageSize: pagination.pageSize 
        };
      } catch (error: any) {
        console.error("Error fetching products:", error);
        if (error.status === 401) {
          // Error de autentificare
          throw new Error("Autentificare necesară pentru accesarea produselor");
        } else {
          throw new Error("Nu s-au putut încărca produsele");
        }
      }
    }
  });
  
  // Create product
  const createProduct = useMutation({
    mutationFn: async (productData: ProductFormValues) => {
      try {
        const response = await apiRequest<Product>(
          '/api/inventory/products',
          {
            method: 'POST',
            body: JSON.stringify(productData),
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        return response;
      } catch (error: any) {
        // Extragem mesajul specific din răspunsul de eroare de la server
        if (error.response) {
          const errorData = await error.response.json();
          if (errorData.details) {
            throw new Error(errorData.details);
          } else if (errorData.error) {
            throw new Error(errorData.error);
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/products'] });
      toast({
        title: "Produs creat",
        description: "Produsul a fost creat cu succes."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut crea produsul.",
        variant: "destructive"
      });
    }
  });
  
  // Update product
  const updateProduct = useMutation({
    mutationFn: async (productData: Product) => {
      try {
        const { id, ...updateData } = productData;
        const response = await apiRequest<Product>(
          `/api/inventory/products/${id}`,
          {
            method: 'PUT',
            body: JSON.stringify(updateData),
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        return response;
      } catch (error: any) {
        // Extragem mesajul specific din răspunsul de eroare de la server
        if (error.response) {
          const errorData = await error.response.json();
          if (errorData.details) {
            throw new Error(errorData.details);
          } else if (errorData.error) {
            throw new Error(errorData.error);
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/products'] });
      toast({
        title: "Produs actualizat",
        description: "Produsul a fost actualizat cu succes."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut actualiza produsul.",
        variant: "destructive"
      });
    }
  });
  
  // Delete product
  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      try {
        const response = await apiRequest<{ success: boolean }>(
          `/api/inventory/products/${productId}`,
          {
            method: 'DELETE'
          }
        );
        return response;
      } catch (error: any) {
        // Extragem mesajul specific din răspunsul de eroare de la server
        if (error.response) {
          const errorData = await error.response.json();
          if (errorData.details) {
            throw new Error(errorData.details);
          } else if (errorData.error) {
            throw new Error(errorData.error);
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/products'] });
      toast({
        title: "Produs șters",
        description: "Produsul a fost șters cu succes."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut șterge produsul.",
        variant: "destructive"
      });
    }
  });
  
  // Deactivate product
  const deactivateProduct = useMutation({
    mutationFn: async (productId: string) => {
      try {
        const response = await apiRequest<Product>(
          `/api/inventory/products/${productId}/deactivate`,
          {
            method: 'PUT'
          }
        );
        return response;
      } catch (error: any) {
        // Extragem mesajul specific din răspunsul de eroare de la server
        if (error.response) {
          const errorData = await error.response.json();
          if (errorData.details) {
            throw new Error(errorData.details);
          } else if (errorData.error) {
            throw new Error(errorData.error);
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/products'] });
      toast({
        title: "Produs dezactivat",
        description: "Produsul a fost dezactivat cu succes."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut dezactiva produsul.",
        variant: "destructive"
      });
    }
  });
  
  // Import products
  const importProducts = useMutation({
    mutationFn: async (formData: FormData) => {
      try {
        const response = await apiRequest(
          '/api/inventory/products/import',
          {
            method: 'POST',
            body: formData,
            // Nu este nevoie să setăm antetul Content-Type pentru FormData,
            // browserul va seta automat cu boundary corect
          }
        );
        return response;
      } catch (error: any) {
        // Extragem mesajul specific din răspunsul de eroare de la server
        if (error.response) {
          const errorData = await error.response.json();
          if (errorData.details) {
            throw new Error(errorData.details);
          } else if (errorData.error) {
            throw new Error(errorData.error);
          } else if (errorData.duplicates) {
            throw new Error(`Import parțial eșuat. Următoarele produse au nume sau coduri duplicate: ${errorData.duplicates.join(', ')}`);
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/products'] });
      toast({
        title: "Import finalizat",
        description: "Produsele au fost importate cu succes."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare la import",
        description: error.message || "Nu s-au putut importa produsele.",
        variant: "destructive"
      });
    }
  });
  
  // Get products by category
  const getProductsByCategory = async (categoryId: string) => {
    if (!categoryId) return products;
    
    try {
      const response = await apiRequest<Product[]>(`/api/inventory/products/category/${categoryId}`);
      return response || [];
    } catch (error: any) {
      console.error("Error fetching products by category:", error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca produsele pentru categoria selectată.",
        variant: "destructive"
      });
      return [];
    }
  };
  
  // Filter products by status
  const getActiveProducts = () => {
    return products.filter((product: any) => product.isActive);
  };
  
  const getInactiveProducts = () => {
    return products.filter((product: any) => !product.isActive);
  };
  
  // Search products by name or SKU
  const searchProducts = (searchTerm: string) => {
    if (!searchTerm) return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(
      (product: any) => 
        product.name.toLowerCase().includes(term) || 
        product.sku.toLowerCase().includes(term) ||
        (product.barcode && product.barcode.toLowerCase().includes(term))
    );
  };
  
  // Extract products from paginated data
  const products = productsData?.items || [];
  
  // Function to change page
  const changePage = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };
  
  // Function to change page size
  const changePageSize = (newPageSize: number) => {
    if (newPageSize > 0 && newPageSize <= 500) {
      setPagination(prev => ({
        ...prev,
        pageSize: newPageSize,
        page: 1, // Reset to first page when changing page size
        totalPages: Math.ceil(prev.totalItems / newPageSize)
      }));
    }
  };
  
  // Bulk update products
  const bulkUpdateProducts = useMutation({
    mutationFn: async (data: { productIds: string[], updateData: Partial<ProductFormValues> }) => {
      try {
        const response = await apiRequest<{ success: boolean, count: number }>(
          '/api/inventory/products/bulk-update',
          {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        return response;
      } catch (error: any) {
        if (error.response) {
          const errorData = await error.response.json();
          if (errorData.details) {
            throw new Error(errorData.details);
          } else if (errorData.error) {
            throw new Error(errorData.error);
          }
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/products'] });
      toast({
        title: "Produse actualizate",
        description: `${data.count} produse au fost actualizate cu succes.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-au putut actualiza produsele.",
        variant: "destructive"
      });
    }
  });

  return { 
    products,
    productsData, 
    isLoading, 
    isError, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    deactivateProduct,
    importProducts,
    getProductsByCategory,
    getActiveProducts,
    getInactiveProducts,
    searchProducts,
    filters,
    setFilters,
    pagination,
    changePage,
    changePageSize,
    bulkUpdateProducts
  };
}