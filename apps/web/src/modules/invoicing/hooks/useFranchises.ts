/**
 * Hook for fetching and managing franchise data
 */
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';

export interface Franchise {
  id: string;
  name: string;
  type?: string;
  parentId?: string | null;
  fiscalCode?: string;
  // Adăugați alte proprietăți ale francizei după necesitate
}

/**
 * Hook pentru a obține lista francizelor
 * @param companyId Opțional, ID-ul companiei pentru a filtra francizele
 * @returns Object conținând francizele și starea query-ului
 */
export function useFranchises(companyId?: string) {
  // Filter state for franchises
  const [filter, setFilter] = useState({
    companyId,
  });

  // Query for franchises
  const franchisesQuery = useQuery({
    queryKey: ['franchises', filter],
    queryFn: async () => {
      let url = '/api/companies/franchises';
      
      // Add filter params if needed
      if (filter.companyId) {
        url += `?companyId=${filter.companyId}`;
      }
      
      // API response-ul vine în formatul { success: boolean; data: Franchise[] }
      const response = await apiRequest<{ success: boolean; data: Franchise[] }>({
        url,
        method: 'GET',
      });
      
      // Se returnează direct datele de la server pentru a fi mai simplu în manipulare
      return response;
    },
  });

  // Gestionează răspunsul API cu structura { success: boolean, data: Franchise[] }
  const franchises = franchisesQuery.data && franchisesQuery.data.success && franchisesQuery.data.data 
    ? franchisesQuery.data.data 
    : [];
  
  // Formatează franchises pentru a fi compatibile cu componenta Select din ShadCN
  const franchiseOptions = Array.isArray(franchises) ? franchises.map((franchise: Franchise) => ({
    id: franchise.id,
    name: franchise.name
  })) : [];
  
  // Debug log pentru a vedea ce date primim
  if (franchisesQuery.data) {
    console.log("Franchise data from API:", franchisesQuery.data);
    console.log("Processed franchise options:", franchiseOptions);
  }
  
  return {
    franchises: franchiseOptions,
    isLoading: franchisesQuery.isLoading,
    isError: franchisesQuery.isError,
    error: franchisesQuery.error,
    refetch: franchisesQuery.refetch,
    setFilter,
  };
}