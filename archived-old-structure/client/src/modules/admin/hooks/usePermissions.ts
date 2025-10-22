import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
  module?: string; // Pentru compatibilitate cu interfața anterioară
  createdAt?: string;
  updatedAt?: string;
  created_at?: string; // Pentru compatibilitate cu baza de date
  updated_at?: string; // Pentru compatibilitate cu baza de date
}

export interface PermissionsResponse {
  data: Permission[];
  success: boolean;
  message?: string;
}

export function usePermissions() {
  return useQuery<PermissionsResponse>({
    queryKey: ['/api/admin/permissions'],
    queryFn: async () => {
      try {
        // Obținem permisiunile de la API
        const response = await apiRequest('/api/admin/permissions');
        
        if (response.success && response.data) {
          // Transformăm datele pentru a standardiza formatul
          const transformedData = response.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            resource: p.resource,
            action: p.action,
            module: p.resource, // Folosim resource ca module pentru compatibilitate
            // Suportăm ambele formate de date pentru flexibilitate
            createdAt: p.createdAt || p.created_at,
            updatedAt: p.updatedAt || p.updated_at,
            created_at: p.created_at || p.createdAt,
            updated_at: p.updated_at || p.updatedAt
          }));
          
          return {
            success: true,
            data: transformedData
          };
        }
        
        return response;
      } catch (error) {
        console.error('Error fetching permissions:', error);
        throw error;
      }
    }
  });
}