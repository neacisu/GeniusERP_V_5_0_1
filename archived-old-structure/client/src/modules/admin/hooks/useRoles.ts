import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Role, Permission, PaginatedResponse } from "./useUsers";

// Types
export interface RoleFormData {
  name: string;
  description?: string;
  permissions: string[];
}

export interface RoleParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Hook for getting roles with pagination and filters
export function useRoles(params?: RoleParams) {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  
  return useQuery({
    queryKey: ["/api/admin/roles", params],
    queryFn: async () => {
      try {
        // Obține ID-ul companiei din localStorage
        const user = localStorage.getItem('user');
        let companyId = "";
        
        if (user) {
          const userData = JSON.parse(user);
          companyId = userData.companyId;
        }
        
        // Adaugă companyId la URL pentru a face request-ul corect
        const response = await apiRequest<any>(`/api/admin/roles/${companyId}${queryString}`);
        
        // Transformăm snake_case în camelCase pentru a se potrivi cu interfața
        const transformedRoles = response.data.map((role: any) => ({
          id: role.id,
          name: role.name,
          description: role.description,
          createdAt: role.created_at,
          isSystem: role.is_system
        }));
        
        return {
          success: true,
          data: transformedRoles,
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 10,
            totalItems: transformedRoles.length,
            totalPages: Math.ceil(transformedRoles.length / (params?.limit || 10))
          }
        };
      } catch (error) {
        console.error("Error fetching roles:", error);
        return {
          success: false,
          data: [],
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 10,
            totalItems: 0,
            totalPages: 0
          }
        };
      }
    },
    refetchOnWindowFocus: false,
  });
}

// Functie pentru a obtine token-ul de autentificare
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const user = localStorage.getItem('user');
  if (!user) return null;
  
  try {
    const userData = JSON.parse(user);
    return userData.token || null;
  } catch (e) {
    console.error("Error parsing user data from localStorage", e);
    return null;
  }
}

// Hook for getting a single role by ID
export function useRole(id: string) {
  // Obține ID-ul companiei din localStorage
  const getUserCompanyId = () => {
    const user = localStorage.getItem('user');
    if (!user) return null;
    
    try {
      const userData = JSON.parse(user);
      return userData.companyId;
    } catch (e) {
      console.error("Error parsing user data from localStorage", e);
      return null;
    }
  };

  const companyId = getUserCompanyId();

  return useQuery({
    queryKey: ["/api/admin/roles", id],
    queryFn: async () => {
      // Încercăm să obținem rolul direct din lista de roluri a companiei
      const rolesResponse = await apiRequest<any>(`/api/admin/roles/${companyId}`);
      
      if (rolesResponse.success && Array.isArray(rolesResponse.data)) {
        // Căutăm rolul după ID
        const role = rolesResponse.data.find((r: any) => r.id === id);
        
        if (role) {
          // Transformăm din snake_case în camelCase
          const transformedRole = {
            id: role.id,
            name: role.name,
            description: role.description,
            createdAt: role.created_at,
            updatedAt: role.updated_at,
            isSystem: role.is_system
          };
          
          return {
            success: true,
            data: transformedRole
          };
        }
      }
      
      // Fallback la endpoint-ul original - poate funcționează acum
      try {
        const response = await apiRequest<{ data: any; success: boolean }>(`/api/admin/roles/detail/${id}`);
        
        // Transformăm datele din snake_case în camelCase
        if (response.data) {
          const transformedRole = {
            id: response.data.id,
            name: response.data.name,
            description: response.data.description,
            createdAt: response.data.created_at,
            updatedAt: response.data.updated_at,
            isSystem: response.data.is_system
          };
          
          return {
            success: response.success,
            data: transformedRole
          };
        }
        
        return response;
      } catch (error) {
        console.error(`Error fetching role details for ID ${id}:`, error);
        return {
          success: false,
          message: "Rolul nu a fost găsit sau nu aveți permisiunea de a-l edita"
        };
      }
    },
    refetchOnWindowFocus: false,
    enabled: !!id && !!companyId,
  });
}

// Hook for creating a new role
export function useCreateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (role: RoleFormData) => {
      return await apiRequest<any>("/api/admin/roles", {
        method: "POST",
        body: role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
    },
  });
}

// Hook for updating a role
export function useUpdateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: RoleFormData }) => {
      return await apiRequest<any>(`/api/admin/roles/${id}`, {
        method: "PUT",
        body: role,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles", variables.id] });
    },
  });
}

// Hook for deleting a role
export function useDeleteRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest<any>(`/api/admin/roles/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
    },
  });
}