/**
 * Hook pentru API-ul modulului HR
 * 
 * Acest hook oferă acces la toate operațiunile API disponibile pentru modulul HR:
 * - Gestionarea angajaților
 * - Gestionarea departamentelor
 * - Gestionarea contractelor de muncă
 * - Coduri COR pentru clasificarea ocupațiilor
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export function useHrApi() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // API pentru angajați
  const useEmployees = (params?: Record<string, any>) => {
    return useQuery({
      queryKey: ['/api/hr/employees', params],
      queryFn: () => apiRequest('/api/hr/employees', { params }),
    });
  };
  
  const useEmployee = (id: string) => {
    return useQuery({
      queryKey: ['/api/hr/employees', id],
      queryFn: () => apiRequest(`/api/hr/employees/${id}`),
      enabled: !!id,
    });
  };
  
  const useCreateEmployee = () => {
    return useMutation({
      mutationFn: (data: any) => 
        apiRequest('/api/hr/employees', { method: 'POST', data }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/hr/employees'] });
        toast({
          title: 'Succes!',
          description: 'Angajat adăugat cu succes.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: `Nu s-a putut adăuga angajatul: ${error['message'] || 'Eroare necunoscută'}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  const useUpdateEmployee = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string, data: any }) => 
        apiRequest(`/api/hr/employees/${id}`, { method: 'PATCH', data }),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/hr/employees'] });
        queryClient.invalidateQueries({ queryKey: ['/api/hr/employees', variables.id] });
        toast({
          title: 'Succes!',
          description: 'Angajat actualizat cu succes.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: `Nu s-a putut actualiza angajatul: ${error['message'] || 'Eroare necunoscută'}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  const useDeleteEmployee = () => {
    return useMutation({
      mutationFn: (id: string) => 
        apiRequest(`/api/hr/employees/${id}`, { method: 'DELETE' }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/hr/employees'] });
        toast({
          title: 'Succes!',
          description: 'Angajat șters cu succes.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: `Nu s-a putut șterge angajatul: ${error['message'] || 'Eroare necunoscută'}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  // API pentru departamente
  const useDepartments = (params?: Record<string, any>) => {
    return useQuery({
      queryKey: ['/api/hr/departments', params],
      queryFn: () => apiRequest('/api/hr/departments', { params }),
    });
  };
  
  const useDepartment = (id: string) => {
    return useQuery({
      queryKey: ['/api/hr/departments', id],
      queryFn: () => apiRequest(`/api/hr/departments/${id}`),
      enabled: !!id,
    });
  };
  
  // API pentru contracte
  const useContracts = (params?: Record<string, any>) => {
    return useQuery({
      queryKey: ['/api/hr/contracts', params],
      queryFn: () => apiRequest('/api/hr/contracts', { params }),
    });
  };
  
  const useContract = (id: string) => {
    return useQuery({
      queryKey: ['/api/hr/contracts', id],
      queryFn: () => apiRequest(`/api/hr/contracts/${id}`),
      enabled: !!id,
    });
  };
  
  const useCreateContract = () => {
    return useMutation({
      mutationFn: (data: any) => 
        apiRequest('/api/hr/contracts', { method: 'POST', data }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/hr/contracts'] });
        toast({
          title: 'Succes!',
          description: 'Contract adăugat cu succes.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: `Nu s-a putut adăuga contractul: ${error['message'] || 'Eroare necunoscută'}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  const useUpdateContract = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string, data: any }) => 
        apiRequest(`/api/hr/contracts/${id}`, { method: 'PATCH', data }),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/hr/contracts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/hr/contracts', variables.id] });
        toast({
          title: 'Succes!',
          description: 'Contract actualizat cu succes.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: `Nu s-a putut actualiza contractul: ${error['message'] || 'Eroare necunoscută'}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  // API pentru coduri COR
  const useCorOccupations = (params?: Record<string, any>) => {
    return useQuery({
      queryKey: ['/api/hr/cor/occupations', params],
      queryFn: () => apiRequest('/api/hr/cor/occupations', { params }),
    });
  };
  
  const useCorGroups = (params?: Record<string, any>) => {
    return useQuery({
      queryKey: ['/api/hr/cor/groups', params],
      queryFn: () => apiRequest('/api/hr/cor/groups', { params }),
    });
  };
  
  // API pentru setări HR
  const useHrSettings = () => {
    return useQuery({
      queryKey: ['/api/hr/settings'],
      queryFn: () => apiRequest('/api/hr/settings'),
    });
  };
  
  const useUpdateHrSettings = () => {
    return useMutation({
      mutationFn: (data: any) => 
        apiRequest('/api/hr/settings', { method: 'PATCH', data }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/hr/settings'] });
        toast({
          title: 'Succes!',
          description: 'Setările HR au fost actualizate.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: `Nu s-au putut actualiza setările: ${error['message'] || 'Eroare necunoscută'}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  // API pentru export Revisal
  const useRevisalExport = () => {
    return useMutation({
      mutationFn: (data: any) => 
        apiRequest('/api/hr/revisal/export', { method: 'POST', data }),
      onSuccess: () => {
        toast({
          title: 'Succes!',
          description: 'Export Revisal generat cu succes.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: `Nu s-a putut genera exportul Revisal: ${error['message'] || 'Eroare necunoscută'}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  // API pentru absențe
  const queryAbsences = (
    page: number = 1, 
    pageSize: number = 10, 
    search?: string, 
    type?: string, 
    employeeId?: string, 
    status?: string
  ) => {
    const params: Record<string, any> = { 
      page, 
      pageSize
    };
    
    if (search) params['search'] = search;
    if (type) params['type'] = type;
    if (employeeId) params['employeeId'] = employeeId;
    if (status) params['status'] = status;
    
    return apiRequest('/api/hr/absences', { params });
  };
  
  const useAbsences = (
    page: number = 1, 
    pageSize: number = 10, 
    search?: string, 
    type?: string, 
    employeeId?: string, 
    status?: string
  ) => {
    return useQuery({
      queryKey: ['/api/hr/absences', { page, pageSize, search, type, employeeId, status }],
      queryFn: () => queryAbsences(page, pageSize, search, type, employeeId, status),
    });
  };
  
  const useAbsence = (id: string) => {
    return useQuery({
      queryKey: ['/api/hr/absences', id],
      queryFn: () => apiRequest(`/api/hr/absences/${id}`),
      enabled: !!id,
    });
  };
  
  const useCreateAbsence = () => {
    return useMutation({
      mutationFn: (data: any) => 
        apiRequest('/api/hr/absences', { method: 'POST', data }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/hr/absences'] });
        toast({
          title: 'Succes!',
          description: 'Absență adăugată cu succes.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: `Nu s-a putut adăuga absența: ${error['message'] || 'Eroare necunoscută'}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  const useUpdateAbsence = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string, data: any }) => 
        apiRequest(`/api/hr/absences/${id}`, { method: 'PATCH', data }),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/hr/absences'] });
        queryClient.invalidateQueries({ queryKey: ['/api/hr/absences', variables.id] });
        toast({
          title: 'Succes!',
          description: 'Absență actualizată cu succes.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: `Nu s-a putut actualiza absența: ${error['message'] || 'Eroare necunoscută'}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  const useDeleteAbsence = () => {
    return useMutation({
      mutationFn: (id: string) => 
        apiRequest(`/api/hr/absences/${id}`, { method: 'DELETE' }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/hr/absences'] });
        toast({
          title: 'Succes!',
          description: 'Absență ștearsă cu succes.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: `Nu s-a putut șterge absența: ${error['message'] || 'Eroare necunoscută'}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  // API pentru raportare ANAF
  const useAnafExport = () => {
    return useMutation({
      mutationFn: (data: any) => 
        apiRequest('/api/hr/anaf/export', { method: 'POST', data }),
      onSuccess: () => {
        toast({
          title: 'Succes!',
          description: 'Export ANAF generat cu succes.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: `Nu s-a putut genera exportul ANAF: ${error['message'] || 'Eroare necunoscută'}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  // API pentru departamente - extindere pentru Create și Update
  const useCreateDepartment = () => {
    return useMutation({
      mutationFn: (data: any) => 
        apiRequest('/api/hr/departments', { method: 'POST', data }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/hr/departments'] });
        toast({
          title: 'Succes!',
          description: 'Departament adăugat cu succes.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: `Nu s-a putut adăuga departamentul: ${error['message'] || 'Eroare necunoscută'}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  const useUpdateDepartment = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string, data: any }) => 
        apiRequest(`/api/hr/departments/${id}`, { method: 'PATCH', data }),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/hr/departments'] });
        queryClient.invalidateQueries({ queryKey: ['/api/hr/departments', variables.id] });
        toast({
          title: 'Succes!',
          description: 'Departament actualizat cu succes.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: `Nu s-a putut actualiza departamentul: ${error['message'] || 'Eroare necunoscută'}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  const useDeleteDepartment = () => {
    return useMutation({
      mutationFn: (id: string) => 
        apiRequest(`/api/hr/departments/${id}`, { method: 'DELETE' }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/hr/departments'] });
        toast({
          title: 'Succes!',
          description: 'Departament șters cu succes.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: `Nu s-a putut șterge departamentul: ${error['message'] || 'Eroare necunoscută'}`,
          variant: 'destructive',
        });
      },
    });
  };

  return {
    // Angajați
    useEmployees,
    useEmployee,
    useCreateEmployee,
    useUpdateEmployee,
    useDeleteEmployee,
    
    // Departamente
    useDepartments,
    useDepartment,
    useCreateDepartment,
    useUpdateDepartment,
    useDeleteDepartment,
    
    // Contracte
    useContracts,
    useContract,
    useCreateContract,
    useUpdateContract,
    
    // Absențe
    useAbsences,
    useAbsence,
    useCreateAbsence,
    useUpdateAbsence,
    useDeleteAbsence,
    
    // COR
    useCorOccupations,
    useCorGroups,
    
    // Setări
    useHrSettings,
    useUpdateHrSettings,
    
    // Export
    useRevisalExport,
    useAnafExport,
  };
}