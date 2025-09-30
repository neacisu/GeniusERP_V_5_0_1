/**
 * Hook pentru operațiunile API din modulul HR
 * 
 * Oferă funcționalități centralizate pentru interacțiunea cu API-urile HR
 * Toate mutațiile și query-urile pentru modulul HR sunt disponibile aici
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../../../lib/queryClient';
import { useToast } from '../../../hooks/use-toast';

// Tipuri pentru răspunsurile de la API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Tipuri pentru date angajați
interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cnp: string;
  department_id?: string;
  position_id?: string;
  manager_id?: string;
  cor_code?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

// Tip pentru departamente
interface Department {
  id: string;
  name: string;
  code: string;
  manager_id?: string;
  description?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

// Tip pentru contracte
interface Contract {
  id: string;
  employeeId: string;
  employeeName?: string;
  contractNumber: string;
  contractType: string;
  startDate: string;
  endDate?: string;
  status: string;
  position: string;
  grossSalary: number;
  workHours: number;
  workingDaysPerWeek: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook pentru utilizarea API-urilor HR
 */
export function useHrApi() {
  const { toast } = useToast();

  // QUERY: Obține toți angajații
  const useEmployees = () => {
    return useQuery<Employee[], Error>({
      queryKey: ['/api/hr/employees']
    });
  };

  // QUERY: Obține un angajat după ID
  const useEmployee = (id: string, options = {}) => {
    return useQuery<Employee, Error>({
      queryKey: ['/api/hr/employees', id],
      enabled: !!id,
      ...options
    });
  };

  // QUERY: Obține departamentele
  const useDepartments = (options = {}) => {
    return useQuery<Department[], Error>({
      queryKey: ['/api/hr/departments'],
      ...options
    });
  };

  // MUTATION: Crează un angajat nou
  const useCreateEmployee = () => {
    return useMutation<ApiResponse<Employee>, Error, any>({
      mutationFn: async (data) => {
        try {
          const response = await apiRequest<ApiResponse<Employee>>('/api/hr/employees', {
            method: 'POST',
            body: data
          });
          
          return response;
        } catch (error) {
          console.error('Error creating employee:', error);
          throw error;
        }
      },
      onSuccess: (response) => {
        if (response.success) {
          toast({
            title: "Angajat adăugat",
            description: "Angajatul a fost adăugat cu succes.",
          });
          
          // Invalidează query-ul pentru lista de angajați
          queryClient.invalidateQueries({ queryKey: ['/api/hr/employees'] });
        } else {
          toast({
            title: "Eroare",
            description: response.message || "A apărut o eroare la adăugarea angajatului.",
            variant: "destructive",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Eroare",
          description: error.message || "A apărut o eroare la adăugarea angajatului.",
          variant: "destructive",
        });
      },
    });
  };

  // MUTATION: Actualizează un angajat
  const useUpdateEmployee = () => {
    return useMutation<ApiResponse<Employee>, Error, { id: string; data: any }>({
      mutationFn: async ({ id, data }) => {
        try {
          const response = await apiRequest<ApiResponse<Employee>>(`/api/hr/employees/${id}`, {
            method: 'PATCH',
            body: data
          });
          
          return response;
        } catch (error) {
          console.error('Error updating employee:', error);
          throw error;
        }
      },
      onSuccess: (response, { id }) => {
        if (response.success) {
          toast({
            title: "Angajat actualizat",
            description: "Angajatul a fost actualizat cu succes.",
          });
          
          // Invalidează query-urile pentru angajați
          queryClient.invalidateQueries({ queryKey: ['/api/hr/employees'] });
          queryClient.invalidateQueries({ queryKey: ['/api/hr/employees', id] });
        } else {
          toast({
            title: "Eroare",
            description: response.message || "A apărut o eroare la actualizarea angajatului.",
            variant: "destructive",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Eroare",
          description: error.message || "A apărut o eroare la actualizarea angajatului.",
          variant: "destructive",
        });
      },
    });
  };

  // QUERY: Obține contractele
  const useContracts = (page = 1, limit = 10, search = '', status?: string, employeeId?: string) => {
    return useQuery<any, Error>({
      queryKey: ['/api/hr/contracts', page, limit, search, status, employeeId],
      queryFn: async () => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (employeeId) params.append('employeeId', employeeId);
        
        const response = await apiRequest(`/api/hr/contracts?${params.toString()}`);
        return response;
      }
    });
  };

  // QUERY: Obține detaliile unui contract după ID
  const useContract = (id: string) => {
    return useQuery<ApiResponse<Contract>, Error>({
      queryKey: ['/api/hr/contracts', id],
      queryFn: async () => {
        const response = await apiRequest(`/api/hr/contracts/${id}`);
        return response;
      },
      enabled: !!id,
    });
  };

  // MUTATION: Creează un contract nou
  const useCreateContract = () => {
    return useMutation<ApiResponse<Contract>, Error, any>({
      mutationFn: async (data) => {
        try {
          const response = await apiRequest<ApiResponse<Contract>>('/api/hr/contracts', {
            method: 'POST',
            body: data,
          });
          
          return response;
        } catch (error) {
          console.error('Error creating contract:', error);
          throw error;
        }
      },
      onSuccess: (response) => {
        if (response.success) {
          toast({
            title: "Contract adăugat",
            description: "Contractul a fost adăugat cu succes.",
          });
          
          // Invalidează query-ul pentru lista de contracte
          queryClient.invalidateQueries({ queryKey: ['/api/hr/contracts'] });
        } else {
          toast({
            title: "Eroare",
            description: response.message || "A apărut o eroare la adăugarea contractului.",
            variant: "destructive",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Eroare",
          description: error.message || "A apărut o eroare la adăugarea contractului.",
          variant: "destructive",
        });
      },
    });
  };

  // MUTATION: Actualizează un contract existent
  const useUpdateContract = () => {
    return useMutation<ApiResponse<Contract>, Error, { id: string; data: any }>({
      mutationFn: async ({ id, data }) => {
        try {
          const response = await apiRequest<ApiResponse<Contract>>(`/api/hr/contracts/${id}`, {
            method: 'PATCH',
            body: data,
          });
          
          return response;
        } catch (error) {
          console.error('Error updating contract:', error);
          throw error;
        }
      },
      onSuccess: (response, { id }) => {
        if (response.success) {
          toast({
            title: "Contract actualizat",
            description: "Contractul a fost actualizat cu succes.",
          });
          
          // Invalidează query-urile pentru contracte
          queryClient.invalidateQueries({ queryKey: ['/api/hr/contracts'] });
          queryClient.invalidateQueries({ queryKey: ['/api/hr/contracts', id] });
        } else {
          toast({
            title: "Eroare",
            description: response.message || "A apărut o eroare la actualizarea contractului.",
            variant: "destructive",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Eroare",
          description: error.message || "A apărut o eroare la actualizarea contractului.",
          variant: "destructive",
        });
      },
    });
  };

  // Function: Șterge un contract - implementat ca funcție normală
  const deleteContract = async (id: string) => {
    try {
      const response = await apiRequest<ApiResponse<any>>(`/api/hr/contracts/${id}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        toast({
          title: "Contract șters",
          description: "Contractul a fost șters cu succes.",
        });
        
        // Invalidează query-ul pentru lista de contracte
        queryClient.invalidateQueries({ queryKey: ['/api/hr/contracts'] });
      } else {
        toast({
          title: "Eroare",
          description: response.message || "A apărut o eroare la ștergerea contractului.",
          variant: "destructive",
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "A apărut o eroare la ștergerea contractului.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // QUERY: Obține codurile COR disponibile
  const useCorOccupations = (search = '') => {
    return useQuery<any, Error>({
      queryKey: ['/api/hr/cor/occupations', search],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        
        const response = await apiRequest(`/api/hr/cor/occupations?${params.toString()}`);
        return response;
      },
      enabled: search.length >= 3, // Doar dacă există minim 3 caractere pentru căutare
    });
  };

  // MUTATION: Șterge un departament
  const useDeleteDepartment = () => {
    return useMutation<ApiResponse<any>, Error, string>({
      mutationFn: async (id) => {
        try {
          const response = await apiRequest<ApiResponse<any>>(`/api/hr/departments/${id}`, {
            method: 'DELETE',
          });
          
          return response;
        } catch (error) {
          console.error('Error deleting department:', error);
          throw error;
        }
      },
      onSuccess: (response) => {
        if (response.success) {
          toast({
            title: "Departament șters",
            description: "Departamentul a fost șters cu succes.",
          });
          
          // Invalidează query-ul pentru lista de departamente
          queryClient.invalidateQueries({ queryKey: ['/api/hr/departments'] });
        } else {
          toast({
            title: "Eroare",
            description: response.message || "A apărut o eroare la ștergerea departamentului.",
            variant: "destructive",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Eroare",
          description: error.message || "A apărut o eroare la ștergerea departamentului.",
          variant: "destructive",
        });
      },
    });
  };

  // MUTATION: Salvează un formular de angajat parțial (salvează fără a finaliza)
  const useSaveEmployeeDraft = () => {
    return useMutation<ApiResponse<Employee>, Error, any>({
      mutationFn: async (data) => {
        try {
          const response = await apiRequest<ApiResponse<Employee>>('/api/hr/employees/draft', {
            method: 'POST',
            body: data
          });
          
          return response;
        } catch (error) {
          console.error('Error saving employee draft:', error);
          throw error;
        }
      },
      onSuccess: (response) => {
        if (response.success) {
          toast({
            title: "Informații salvate",
            description: "Datele angajatului au fost salvate temporar.",
          });
        } else {
          toast({
            title: "Eroare",
            description: response.message || "A apărut o eroare la salvarea temporară.",
            variant: "destructive",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Eroare",
          description: error.message || "A apărut o eroare la salvarea temporară.",
          variant: "destructive",
        });
      }
    });
  };
  
  // MUTATION: Generează documente de conformitate GDPR
  const useGenerateComplianceDocuments = () => {
    return useMutation<ApiResponse<{ documentUrls: string[] }>, Error, any>({
      mutationFn: async (employeeData) => {
        try {
          const response = await apiRequest<ApiResponse<{ documentUrls: string[] }>>('/api/hr/documents/generate-compliance', {
            method: 'POST',
            body: employeeData
          });
          
          return response;
        } catch (error) {
          console.error('Error generating compliance documents:', error);
          throw error;
        }
      },
      onSuccess: (response) => {
        if (response.success) {
          toast({
            title: "Documente generate",
            description: "Documentele de conformitate au fost generate cu succes.",
          });
        } else {
          toast({
            title: "Eroare",
            description: response.message || "A apărut o eroare la generarea documentelor.",
            variant: "destructive",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Eroare",
          description: error.message || "A apărut o eroare la generarea documentelor.",
          variant: "destructive",
        });
      }
    });
  };
  
  // MUTATION: Încarcă un document scanat
  const useUploadDocument = () => {
    return useMutation<ApiResponse<{ documentUrl: string }>, Error, { file: File, employeeId?: string, type: string }>({
      mutationFn: async ({ file, employeeId, type }) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          if (employeeId) formData.append('employeeId', employeeId);
          formData.append('type', type);
          
          const response = await fetch('/api/hr/documents/upload', {
            method: 'POST',
            body: formData
          });
          
          return await response.json();
        } catch (error) {
          console.error('Error uploading document:', error);
          throw error;
        }
      },
      onSuccess: (response) => {
        if (response.success) {
          toast({
            title: "Document încărcat",
            description: "Documentul a fost încărcat cu succes.",
          });
        } else {
          toast({
            title: "Eroare",
            description: response.message || "A apărut o eroare la încărcarea documentului.",
            variant: "destructive",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Eroare",
          description: error.message || "A apărut o eroare la încărcarea documentului.",
          variant: "destructive",
        });
      }
    });
  };

  /**
   * API pentru obținerea zilelor de sărbătoare legală
   * @returns Un query cu lista zilelor de sărbătoare pentru România
   */
  const useHolidays = (options = {}) => {
    return useQuery<any, Error>({
      queryKey: ['/api/hr/holidays'],
      ...options
    });
  };
  
  /**
   * Query pentru obținerea absențelor cu diverse filtre 
   * Nu este folosit direct, implementat în pagina Overview pentru a evita conflictele
   */
  const queryAbsences = (page = 1, limit = 10, employeeId?: string, startDate?: string, endDate?: string, status?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (employeeId) params.append('employeeId', employeeId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (status) params.append('status', status);
    
    return apiRequest(`/api/hr/absences?${params.toString()}`);
  };
  
  /**
   * Query pentru istoricul salarial după an și lună
   * Nu este folosit direct, implementat în pagina Overview pentru a evita conflictele
   */
  /**
   * Funcție pentru obținerea istoricului de plăți
   */
  const queryPayrollHistory = (year: number, month: number) => {
    const params = new URLSearchParams();
    params.append('year', year.toString());
    params.append('month', month.toString());
    
    return apiRequest(`/api/hr/payroll/history?${params.toString()}`);
  };
  
  /**
   * Hook pentru obținerea datelor de payroll cu parametri
   * Folosit în pagina de Payroll pentru a afișa istoricul plăților
   */
  const usePayroll = (
    year: number,
    month: number,
    page: number = 1,
    pageSize: number = 10,
    search: string = '',
    departmentId?: string
  ) => {
    return useQuery<any, Error>({
      queryKey: ['/api/hr/payroll', year, month, page, pageSize, search, departmentId],
      queryFn: async () => {
        const params = new URLSearchParams();
        params.append('year', year.toString());
        params.append('month', month.toString());
        params.append('page', page.toString());
        params.append('pageSize', pageSize.toString());
        if (search) params.append('search', search);
        if (departmentId) params.append('departmentId', departmentId);
        
        const response = await apiRequest(`/api/hr/payroll?${params.toString()}`);
        return response;
      }
    });
  };

  return {
    useEmployees,
    useEmployee,
    useDepartments,
    useDeleteDepartment,
    useCreateEmployee,
    useUpdateEmployee,
    useContract,
    useContracts,
    useCreateContract,
    useUpdateContract,
    deleteContract,
    useCorOccupations,
    useSaveEmployeeDraft,
    useGenerateComplianceDocuments,
    queryAbsences,
    queryPayrollHistory,
    usePayroll, // Add the new usePayroll hook
    useUploadDocument,
    useHolidays
  };
}