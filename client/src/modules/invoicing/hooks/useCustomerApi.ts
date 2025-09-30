/**
 * Customer API Hooks for Invoicing
 * 
 * Custom hooks for fetching customers that can be used for invoicing
 */

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Customer } from '../types';
import { useToast } from '@/hooks/use-toast';

// Local implementation of getAuthToken
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  if (!user) return null;
  
  try {
    const userData = JSON.parse(user);
    if (!userData || !userData.token) {
      console.warn('Auth token not found in user data');
      return null;
    }
    return userData.token;
  } catch (e) {
    console.error("Error parsing user data from localStorage", e);
    return null;
  }
};

/**
 * Hook for fetching customers that can be invoiced
 * These are companies marked as 'customers' in the CRM module
 */
export function useInvoiceCustomers() {
  const { toast } = useToast();
  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/crm/companies'],
    queryFn: async () => {
      try {
        const token = getAuthToken();
        
        // Utilizăm endpoint-ul existent din modulul CRM pentru a obține companiile
        const response = await fetch('/api/crm/companies?isCustomer=true', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        
        // Verificăm dacă răspunsul conține array de companii în proprietatea data
        // (așa cum returnează endpoint-ul /api/crm/companies)
        if (responseData && responseData.data && Array.isArray(responseData.data)) {
          console.log('Clienți încărcați cu succes:', responseData.data.length);
          
          // Mapăm din formatul modulului CRM în formatul necesar pentru facturi
          return responseData.data.map((company: any) => ({
            id: company.id,
            name: company.name,
            fiscalCode: company.vatNumber || company.cui, // Preferăm vatNumber dacă există
            registrationNumber: company.registrationNumber,
            address: company.address,
            city: company.city,
            county: company.postalCode,
            country: company.country || 'România',
            email: company.email,
            phone: company.phone
          })) as Customer[];
        } else if (Array.isArray(responseData)) {
          // Endpoint-ul poate returna direct un array
          return responseData as Customer[];
        } else {
          console.error('Răspunsul API nu are formatul așteptat:', responseData);
          return [];
        }
      } catch (err: any) {
        console.error('Eroare la încărcarea clienților:', err);
        toast({
          title: 'Eroare la încărcarea clienților',
          description: err.message || 'Nu s-au putut încărca clienții',
          variant: 'destructive'
        });
        return [];
      }
    },
    // Nu aruncăm erori, ci returnăm array gol pentru a evita întreruperea renderării
    retry: 2,
    staleTime: 30000
  });

  return {
    customers: data || [],
    isLoading,
    isError,
    error: error as Error | null
  };
}