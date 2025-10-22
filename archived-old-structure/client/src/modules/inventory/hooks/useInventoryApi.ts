/**
 * Inventory API Hooks
 * 
 * Custom React Query hooks for interacting with the inventory API endpoints
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Warehouse API Hooks
export const useWarehouses = () => {
  const { toast } = useToast();
  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/inventory/warehouses'],
    queryFn: async () => {
      console.log('Fetching warehouses...');
      try {
        const response = await apiRequest('/api/inventory/warehouses');
        console.log('Warehouses API response:', response);
        
        // Verify the response has the expected structure
        if (!response || !response.warehouses) {
          throw new Error('Invalid warehouse response format');
        }
        
        return response;
      } catch (error) {
        console.error('Error fetching warehouses:', error);
        toast({
          title: "Eroare la încărcarea gestiunilor",
          description: "Nu s-au putut încărca gestiunile. Reîncercați mai târziu sau contactați administratorul.",
          variant: "destructive"
        });
        return { warehouses: [] };
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Create warehouse mutation
  const createWarehouse = useMutation({
    mutationFn: async (warehouseData: any) => {
      const response = await apiRequest('/api/inventory/warehouses', {
        method: 'POST',
        body: JSON.stringify(warehouseData)
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/warehouses'] });
      toast({
        title: "Gestiune creată",
        description: "Gestiunea a fost creată cu succes."
      });
    },
    onError: (error: any) => {
      console.error('Error creating warehouse:', error);
      toast({
        title: "Eroare la crearea gestiunii",
        description: error.message || "Nu s-a putut crea gestiunea. Reîncercați mai târziu.",
        variant: "destructive"
      });
    }
  });

  // Update warehouse mutation
  const updateWarehouse = useMutation({
    mutationFn: async ({ id, ...warehouseData }: { id: string } & any) => {
      const response = await apiRequest(`/api/inventory/warehouses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(warehouseData)
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/warehouses'] });
      toast({
        title: "Gestiune actualizată",
        description: "Gestiunea a fost actualizată cu succes."
      });
    },
    onError: (error: any) => {
      console.error('Error updating warehouse:', error);
      toast({
        title: "Eroare la actualizarea gestiunii",
        description: error.message || "Nu s-a putut actualiza gestiunea. Reîncercați mai târziu.",
        variant: "destructive"
      });
    }
  });

  // Log what we're returning
  console.log('useWarehouses returning:', {
    warehouses: data?.warehouses || [],
    dataExists: !!data,
    warehousesExists: !!(data && data.warehouses),
    warehousesLength: data?.warehouses?.length || 0
  });

  return {
    warehouses: data?.warehouses || [],
    isLoading,
    isError,
    refetch,
    createWarehouse,
    updateWarehouse
  };
};

// Product API Hooks
export const useProducts = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/inventory/products'],
    queryFn: () => apiRequest('/api/inventory/products'),
    retry: false
  });

  return {
    products: data || [], // API returns array directly, not wrapped in object
    isLoading,
    isError
  };
};

// Stock Items API Hooks
export const useStockItems = () => {
  const { toast } = useToast();
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/inventory/stock-items'],
    queryFn: () => apiRequest('/api/inventory/stock-items'),
    retry: false
  });

  // Check stock levels mutation
  const checkStockLevels = useMutation({
    mutationFn: async ({ warehouseId }: { warehouseId?: string } = {}) => {
      const queryParams = warehouseId ? `?warehouseId=${warehouseId}` : '';
      const response = await apiRequest(`/api/inventory/check-stock-levels${queryParams}`, {
        method: 'POST'
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/stock-items'] });
      toast({
        title: "Verificare stocuri",
        description: "Nivelurile stocurilor au fost verificate cu succes."
      });
    },
    onError: (error: any) => {
      console.error('Error checking stock levels:', error);
      toast({
        title: "Eroare la verificarea stocurilor",
        description: error.message || "Nu s-au putut verifica nivelurile stocurilor. Reîncercați mai târziu.",
        variant: "destructive"
      });
    }
  });

  return {
    stockItems: data || [], // API returns array directly, not wrapped in object
    isLoading,
    isError,
    checkStockLevels
  };
};

// NIR Documents API Hooks
export const useNirDocuments = (warehouseId?: string) => {
  const { toast } = useToast();
  
  // Build query key with optional warehouse filter
  const queryKey = warehouseId 
    ? ['/api/inventory/nir', { warehouseId }]
    : ['/api/inventory/nir'];
  
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => {
      const url = warehouseId 
        ? `/api/inventory/nir?warehouseId=${warehouseId}`
        : '/api/inventory/nir';
      return apiRequest(url);
    },
    retry: false
  });

  // Create NIR document mutation
  const createNirDocument = useMutation({
    mutationFn: async (documentData: any) => {
      const response = await apiRequest('/api/inventory/nir', {
        method: 'POST',
        body: JSON.stringify(documentData)
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/nir'] });
      toast({
        title: "NIR creat",
        description: "Documentul NIR a fost creat cu succes."
      });
    },
    onError: (error: any) => {
      console.error('Error creating NIR document:', error);
      toast({
        title: "Eroare la crearea NIR",
        description: error.message || "Nu s-a putut crea documentul NIR. Reîncercați mai târziu.",
        variant: "destructive"
      });
    }
  });

  // Update NIR status mutation
  const updateNirStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const response = await apiRequest(`/api/inventory/nir/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/nir'] });
      toast({
        title: "Status actualizat",
        description: "Statusul documentului NIR a fost actualizat cu succes."
      });
    },
    onError: (error: any) => {
      console.error('Error updating NIR status:', error);
      toast({
        title: "Eroare la actualizarea statusului",
        description: error.message || "Nu s-a putut actualiza statusul documentului NIR. Reîncercați mai târziu.",
        variant: "destructive"
      });
    }
  });

  return {
    nirDocuments: data?.documents || [], // API returns documents array in 'documents' property
    isLoading,
    isError,
    createNirDocument,
    updateNirStatus
  };
};

// Transfers API Hooks
export const useTransfers = () => {
  const { toast } = useToast();
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/inventory/transfers'],
    queryFn: () => apiRequest('/api/inventory/transfers'),
    retry: false
  });

  // Create transfer mutation
  const createTransfer = useMutation({
    mutationFn: async (transferData: any) => {
      const response = await apiRequest('/api/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify(transferData)
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/transfers'] });
      toast({
        title: "Transfer creat",
        description: "Documentul de transfer a fost creat cu succes."
      });
    },
    onError: (error: any) => {
      console.error('Error creating transfer:', error);
      toast({
        title: "Eroare la crearea transferului",
        description: error.message || "Nu s-a putut crea documentul de transfer. Reîncercați mai târziu.",
        variant: "destructive"
      });
    }
  });

  // Update transfer status mutation
  const updateTransferStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const response = await apiRequest(`/api/inventory/transfers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/transfers'] });
      toast({
        title: "Status actualizat",
        description: "Statusul documentului de transfer a fost actualizat cu succes."
      });
    },
    onError: (error: any) => {
      console.error('Error updating transfer status:', error);
      toast({
        title: "Eroare la actualizarea statusului",
        description: error.message || "Nu s-a putut actualiza statusul documentului de transfer. Reîncercați mai târziu.",
        variant: "destructive"
      });
    }
  });

  return {
    transfers: data?.transfers || [],
    isLoading,
    isError,
    createTransfer,
    updateTransferStatus
  };
};

// Inventory Assessment API Hooks
export const useInventoryApi = () => {
  const { toast } = useToast();

  // Get all assessments
  const {
    data: assessments,
    isLoading: isLoadingAssessments,
    error: assessmentsError,
    refetch: refetchAssessments
  } = useQuery({
    queryKey: ['/api/inventory/assessments'],
    queryFn: () => apiRequest('/api/inventory/assessments'),
    retry: false
  });

  // Get assessment details by ID
  const getAssessmentDetails = (assessmentId: string) => {
    return useQuery({
      queryKey: ['/api/inventory/assessments', assessmentId],
      queryFn: () => apiRequest(`/api/inventory/assessments/${assessmentId}`),
      enabled: !!assessmentId,
      retry: false
    });
  };
  
  // Create a new assessment
  const createAssessment = useMutation({
    mutationFn: async (assessmentData: any) => {
      try {
        // Make sure assessmentData contains both name and assessmentNumber fields
        if (!assessmentData.name && !assessmentData.assessmentNumber) {
          const defaultName = `Inventariere ${new Date().toLocaleDateString('ro-RO')}`;
          assessmentData.name = defaultName;
          assessmentData.assessmentNumber = defaultName;
        } else if (!assessmentData.name) {
          assessmentData.name = assessmentData.assessmentNumber;
        } else if (!assessmentData.assessmentNumber) {
          assessmentData.assessmentNumber = assessmentData.name;
        }
        
        // Extract auth token if provided directly in the request data
        const authToken = assessmentData._auth_token;
        // Remove the token from the data we'll send to the server
        if (authToken) {
          delete assessmentData._auth_token;
        }
        
        console.log('Creating assessment with data:', JSON.stringify(assessmentData, null, 2));
        
        // Create headers with standard authentication
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        // Add Authorization header if token was provided
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
          console.log('Using provided auth token for request');
        } else {
          // Try to refresh token as fallback
          const refreshSuccess = await import('@/lib/queryClient').then(
            module => module.refreshToken()
          );
          console.log('Token refresh before creating assessment:', refreshSuccess ? 'successful' : 'failed');
        }
        
        // Make the request with direct fetch to have more control
        const response = await fetch('/api/inventory/assessments', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(assessmentData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server returned ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Error in createAssessment mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Assessment created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/assessments'] });
      toast({
        title: "Inventariere creată",
        description: "Documentul de inventariere a fost creat cu succes."
      });
    },
    onError: (error: any) => {
      console.error('Error creating assessment:', error);
      toast({
        title: "Eroare",
        description: `Nu s-a putut crea documentul de inventariere: ${error?.message || 'Eroare necunoscută'}`,
        variant: "destructive"
      });
    }
  });
  
  // Initialize assessment items from current stock
  const initializeAssessmentItems = useMutation({
    mutationFn: async (assessmentId: string) => {
      try {
        // Get auth token from localStorage
        let authToken = null;
        
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            if (user && user.token) {
              authToken = user.token;
            }
          }
        } catch (e) {
          console.error('Error getting auth token from localStorage:', e);
        }
        
        // Create headers with standard authentication
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add auth token
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
          console.log('Using auth token for initializing items');
        }
        
        console.log(`Initializing assessment items for assessment ID: ${assessmentId}`);
        
        // Make direct fetch request to ensure authentication
        const response = await fetch(`/api/inventory/assessments/${assessmentId}/initialize`, {
          method: 'POST',
          headers: headers
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server returned ${response.status}: ${errorText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error initializing assessment items:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log('Assessment items initialized successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/assessments', variables] });
      toast({
        title: "Articole inițializate",
        description: "Articolele au fost inițializate cu succes din stocul curent."
      });
    },
    onError: (error: any) => {
      console.error('Error initializing assessment items:', error);
      toast({
        title: "Eroare",
        description: `Nu s-au putut inițializa articolele pentru inventariere: ${error?.message || 'Eroare necunoscută'}`,
        variant: "destructive"
      });
    }
  });
  
  // Update assessment status
  const updateAssessmentStatus = useMutation({
    mutationFn: (data: { assessmentId: string, status: string }) => {
      return apiRequest(`/api/inventory/assessments/${data.assessmentId}/status`, {
        method: 'PATCH',
        body: { status: data.status }
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/assessments'] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/inventory/assessments', variables.assessmentId] 
      });
      toast({
        title: "Status actualizat",
        description: "Statusul inventarierii a fost actualizat cu succes."
      });
    },
    onError: (error) => {
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza statusul inventarierii.",
        variant: "destructive"
      });
    }
  });
  
  // Record item count result
  const recordItemCount = useMutation({
    mutationFn: (data: { 
      itemId: string, 
      actualQuantity: number, 
      notes?: string,
      countedBy?: string
    }) => {
      return apiRequest(`/api/inventory/assessments/items/${data.itemId}/count`, {
        method: 'PATCH',
        body: {
          actualQuantity: data.actualQuantity,
          notes: data.notes,
          countedBy: data.countedBy
        }
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/inventory/assessments'] 
      });
      toast({
        title: "Cantitate înregistrată",
        description: "Cantitatea inventariată a fost înregistrată cu succes."
      });
    },
    onError: (error) => {
      toast({
        title: "Eroare",
        description: "Nu s-a putut înregistra cantitatea inventariată.",
        variant: "destructive"
      });
    }
  });
  
  // Process inventory differences (after counting)
  const processInventoryDifferences = useMutation({
    mutationFn: (assessmentId: string) => {
      return apiRequest(`/api/inventory/assessments/${assessmentId}/process`, {
        method: 'POST'
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/assessments'] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/inventory/assessments', variables] 
      });
      toast({
        title: "Diferențe procesate",
        description: "Diferențele de inventar au fost procesate cu succes."
      });
    },
    onError: (error) => {
      toast({
        title: "Eroare",
        description: "Nu s-au putut procesa diferențele de inventar.",
        variant: "destructive"
      });
    }
  });
  
  // Get assessment summary by status
  const assessmentSummary = useQuery({
    queryKey: ['/api/inventory/assessments/summary/status'],
    queryFn: () => apiRequest('/api/inventory/assessments/summary/status'),
    retry: false
  });
  
  // Calculate stock valuation using specified method
  const calculateStockValuation = useMutation({
    mutationFn: (data: { 
      productId: string, 
      warehouseId: string, 
      valuationMethod: string, 
      date?: string 
    }) => {
      return apiRequest('/api/inventory/assessments/valuation/calculate', {
        method: 'POST',
        body: { 
          productId: data.productId, 
          warehouseId: data.warehouseId, 
          valuationMethod: data.valuationMethod, 
          date: data.date 
        }
      });
    }
  });
  
  return {
    assessments: assessments?.assessments || [],
    isLoadingAssessments,
    assessmentsError,
    refetchAssessments,
    getAssessmentDetails,
    createAssessment,
    initializeAssessmentItems,
    updateAssessmentStatus,
    recordItemCount,
    processInventoryDifferences,
    assessmentSummary: assessmentSummary?.data || { total: 0 },
    calculateStockValuation,
    // Raw data for debugging
    rawAssessmentData: assessments
  };
};

// Categories API Hooks
export const useCategories = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/inventory/categories'],
    queryFn: () => apiRequest('/api/inventory/categories'),
    retry: false
  });

  return {
    categories: data?.categories || [],
    isLoading,
    isError
  };
};

// Units API Hooks
export const useUnits = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/inventory/units'],
    queryFn: () => apiRequest('/api/inventory/units'),
    retry: false
  });

  return {
    units: data?.units || [],
    isLoading,
    isError
  };
};