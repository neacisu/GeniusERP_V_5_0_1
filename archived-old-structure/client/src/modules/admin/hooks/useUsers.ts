import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roles?: Role[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  // Permissions sunt gestionate printr-o relație separată, nu direct pe role
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module?: string;
}

export interface UserFormData {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roles: string[];
}

export interface UserParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  success: boolean;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Hook for getting users with pagination and filters
export function useUsers(params?: UserParams) {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status) queryParams.append("status", params.status);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  
  return useQuery({
    queryKey: ["/api/admin/users", params],
    queryFn: async () => {
      const response = await apiRequest<PaginatedResponse<any>>(`/api/admin/users${queryString}`);
      
      // Mapat rezultatele pentru a se potrivi cu interfața User
      // convertind din snake_case în camelCase
      if (response.data) {
        response.data = response.data.map(user => {
          return {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            // status din API ar putea fi 'active', 'inactive' etc.
            isActive: user.status === 'active',
            roles: user.roles || [], // Păstrat roles ca array, chiar dacă e gol
            createdAt: user.created_at,
            updatedAt: user.updated_at
          };
        });
      }
      
      return response as PaginatedResponse<User>;
    },
    refetchOnWindowFocus: false,
  });
}

// Hook for getting a single user by ID
export function useUser(id: string) {
  return useQuery({
    queryKey: ["/api/admin/users", id],
    queryFn: async () => {
      const response = await apiRequest<{ data: any; success: boolean }>(`/api/admin/users/${id}`);
      
      // Mapat rezultatul pentru a se potrivi cu interfața User
      if (response.data) {
        const user = response.data;
        // Asigură-te că roles este un array valid de obiecte Role
        const roles = Array.isArray(user.roles) 
          ? user.roles.map((role: any) => ({
              id: role.id,
              name: role.name,
              description: role.description
            })) 
          : [];
          
        response.data = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isActive: user.status === 'active',
          roles: roles,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        };
      }
      
      return response as { data: User; success: boolean };
    },
    refetchOnWindowFocus: false,
    enabled: !!id,
  });
}

// Hook for creating a new user
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (user: UserFormData) => {
      // Transformăm datele în formatul așteptat de server (snake_case)
      const transformedData = {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        status: user.isActive ? 'active' : 'inactive',
        role_ids: user.roles,
        ...(user.password ? { password: user.password } : {})
      };
      
      return await apiRequest<any>("/api/admin/users", {
        method: "POST",
        body: transformedData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });
}

// Hook for updating a user
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, user }: { id: string; user: UserFormData }) => {
      // Serverul folosește PATCH, nu PUT pentru acest endpoint
      // și se așteaptă la date în snake_case, nu camelCase
      const transformedData = {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        status: user.isActive ? 'active' : 'inactive',
        role_ids: user.roles,
        ...(user.password ? { password: user.password } : {})
      };
      
      return await apiRequest<any>(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: transformedData,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", variables.id] });
    },
  });
}

// Hook for deleting a user
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest<any>(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });
}

// Hook for toggling user status (active/inactive)
export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest<any>(`/api/admin/users/${id}/status`, {
        method: "PUT",
        body: { isActive },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", variables.id] });
    },
  });
}