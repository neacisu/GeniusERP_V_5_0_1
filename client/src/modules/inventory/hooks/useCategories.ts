/**
 * Categories Hook
 * 
 * Custom hook for managing inventory product categories including CRUD operations
 * and hierarchy management.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { ProductCategory, Product } from "../types";

// Define CategoryFormValues type
export interface CategoryFormValues {
  name: string;
  description?: string;
  parentId?: string | null;
  isActive: boolean;
}

// Define CategoryTreeItem type for hierarchical display
export interface CategoryTreeItem extends ProductCategory {
  children: CategoryTreeItem[];
}

/**
 * Hook for managing product categories with CRUD operations
 */
export function useCategories() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    parentId: "all",
    status: "all"
  });
  
  // Product query for extracting category info as fallback
  const {
    data: productsData = [],
    isLoading: isLoadingProducts,
  } = useQuery({
    queryKey: ['/api/inventory/products'],
    enabled: true, // Always run to have product data available
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Flag to track if we need to use the fallback category extraction
  const [useFallbackCategories, setUseFallbackCategories] = useState(false);
  
  // State to store extracted categories from products
  const [extractedCategories, setExtractedCategories] = useState<ProductCategory[]>([]);
  
  // Fetch categories with proper error handling
  const { 
    data: categoriesData = [], 
    isLoading: isLoadingPrimaryCategories, 
    isError: isErrorCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['/api/inventory/categories'],
    queryFn: async () => {
      try {
        console.log("Attempting to fetch categories from primary API");
        const response = await apiRequest<ProductCategory[]>('/api/inventory/categories');
        
        // If we get a successful response, we don't need the fallback anymore
        if (response && Array.isArray(response)) {
          setUseFallbackCategories(false);
          return response;
        }
        
        // If response is empty or invalid, try to use the fallback
        setUseFallbackCategories(true);
        throw new Error("Empty or invalid response from categories API");
      } catch (error: any) {
        console.error("Error fetching categories from primary API:", error);
        setUseFallbackCategories(true);
        
        if (error.status === 401) {
          throw new Error("Autentificare necesară pentru accesarea categoriilor");
        } else {
          throw new Error("Nu s-au putut încărca categoriile din API principal");
        }
      }
    },
    retry: 1,
    retryDelay: 3000
  });
  
  // Extract categories from products when needed
  useEffect(() => {
    if (useFallbackCategories && productsData && Array.isArray(productsData) && productsData.length > 0) {
      console.log("Attempting to extract categories from products as fallback");
      
      // Extract unique categories from products
      const uniqueCategories = new Map<string, ProductCategory>();
      
      productsData.forEach((product: Product) => {
        if (product.category && product.category.id && !uniqueCategories.has(product.category.id)) {
          uniqueCategories.set(product.category.id, product.category);
        }
      });
      
      const extractedCats = Array.from(uniqueCategories.values());
      console.log(`Extracted ${extractedCats.length} unique categories from products`);
      setExtractedCategories(extractedCats);
    }
  }, [useFallbackCategories, productsData]);
  
  // Auto retry primary categories API once
  useEffect(() => {
    if (isErrorCategories && !isLoadingPrimaryCategories) {
      const retryTimer = setTimeout(() => {
        console.log("Auto-retrying primary category fetch after error");
        refetchCategories();
      }, 5000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [isErrorCategories, isLoadingPrimaryCategories, refetchCategories]);
  
  // No need for a service fallback anymore - using direct API calls instead
  useEffect(() => {
    if (useFallbackCategories && extractedCategories.length === 0 && !isLoadingProducts) {
      console.log("Using product data to extract categories as fallback");
      // We're already extracting categories from products in a different effect
    }
  }, [useFallbackCategories, extractedCategories, isLoadingProducts]);
  
  // Combine all sources of categories based on priority
  const categories = useFallbackCategories ? extractedCategories : categoriesData;
  
  // Loading state combines loading of primary and fallback sources
  const isLoadingCategories = isLoadingPrimaryCategories || (useFallbackCategories && isLoadingProducts && extractedCategories.length === 0);
  
  // Create category
  const createCategory = useMutation({
    mutationFn: async (categoryData: CategoryFormValues) => {
      try {
        console.log("Creating new category:", categoryData);
        const response = await apiRequest<ProductCategory>(
          '/api/inventory/categories',
          {
            method: 'POST',
            body: JSON.stringify(categoryData),
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        return response;
      } catch (error: any) {
        console.error("Error creating category:", error);
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
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/categories'] });
      toast({
        title: "Categorie creată",
        description: "Categoria a fost creată cu succes."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut crea categoria.",
        variant: "destructive"
      });
    }
  });
  
  // Update category
  const updateCategory = useMutation({
    mutationFn: async (categoryData: ProductCategory) => {
      try {
        console.log("Updating category:", categoryData);
        const { id, ...updateData } = categoryData;
        const response = await apiRequest<ProductCategory>(
          `/api/inventory/categories/${id}`,
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
        console.error("Error updating category:", error);
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
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/categories'] });
      toast({
        title: "Categorie actualizată",
        description: "Categoria a fost actualizată cu succes."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut actualiza categoria.",
        variant: "destructive"
      });
    }
  });
  
  // Deactivate category
  const deactivateCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      console.log("Deactivating category:", categoryId);
      const response = await apiRequest<{ success: boolean }>(
        `/api/inventory/categories/${categoryId}/deactivate`,
        {
          method: 'PUT'
        }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/categories'] });
      toast({
        title: "Categorie actualizată",
        description: "Statusul categoriei a fost actualizat cu succes."
      });
    },
    onError: (error) => {
      console.error("Error deactivating category:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza statusul categoriei.",
        variant: "destructive"
      });
    }
  });

  // Import categories
  const importCategories = useMutation({
    mutationFn: async (formData: FormData) => {
      try {
        console.log("Importing categories from file");
        const response = await apiRequest(
          '/api/inventory/categories/import',
          {
            method: 'POST',
            body: formData,
            // Nu este nevoie să setăm antetul Content-Type pentru FormData,
            // browserul va seta automat cu boundary corect
          }
        );
        return response;
      } catch (error: any) {
        console.error("Error importing categories:", error);
        // Extragem mesajul specific din răspunsul de eroare de la server
        if (error.response) {
          const errorData = await error.response.json();
          if (errorData.details) {
            throw new Error(errorData.details);
          } else if (errorData.error) {
            throw new Error(errorData.error);
          } else if (errorData.duplicates) {
            throw new Error(`Import parțial eșuat. Următoarele categorii au nume duplicate: ${errorData.duplicates.join(', ')}`);
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/categories'] });
      toast({
        title: "Import finalizat",
        description: "Categoriile au fost importate cu succes."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare la import",
        description: error.message || "Nu s-au putut importa categoriile.",
        variant: "destructive"
      });
    }
  });
  
  // Get child categories
  const getChildCategories = (parentId: string | null) => {
    return categories.filter(category => category.parentId === parentId);
  };
  
  // Get parent category name
  const getParentCategoryName = (parentId: string | null) => {
    if (!parentId) return null;
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : null;
  };

  // Build category tree - useful for hierarchical displays
  const buildCategoryTree = (): CategoryTreeItem[] => {
    const rootCategories = categories.filter(c => !c.parentId);
    
    const buildTree = (parentId: string | null): CategoryTreeItem[] => {
      const children = categories.filter(c => c.parentId === parentId);
      if (children.length === 0) return [];
      
      return children.map(child => ({
        ...child,
        children: buildTree(child.id)
      }));
    };
    
    return rootCategories.map(root => ({
      ...root,
      children: buildTree(root.id)
    }));
  };

  // Get category path - useful for breadcrumbs (e.g. "Electronics > Computers > Laptops")
  const getCategoryPath = (categoryId: string | null): ProductCategory[] => {
    if (!categoryId) return [];
    
    const path: ProductCategory[] = [];
    let currentId: string | null = categoryId;
    
    while (currentId) {
      const category = categories.find(c => c.id === currentId);
      if (!category) break;
      
      path.unshift(category);
      currentId = category.parentId || null;
    }
    
    return path;
  };
  
  const result = { 
    categories, 
    isLoading: isLoadingCategories, 
    isError: isErrorCategories && !useFallbackCategories, // Only report error if we're not using fallback data
    error: categoriesError,
    useFallbackData: useFallbackCategories && extractedCategories.length > 0,
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
    refetchCategories
  };
  
  console.log("Categories hook returning", {
    categoryCount: categories.length,
    isLoading: isLoadingCategories,
    isError: result.isError,
    useFallbackData: result.useFallbackData
  });
  
  return result;
}