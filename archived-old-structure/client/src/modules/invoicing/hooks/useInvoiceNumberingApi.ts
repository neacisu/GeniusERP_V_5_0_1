/**
 * Invoice Numbering API Hook
 * 
 * Provides React Query hooks for interacting with the invoice numbering API.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  InvoiceNumberingSetting,
  InsertInvoiceNumberingSetting,
  UpdateInvoiceNumberingSetting
} from '@shared/schema/invoice-numbering.schema';

/**
 * Hook for invoice numbering API operations
 */
export function useInvoiceNumberingApi() {
  const { toast } = useToast();

  /**
   * Get all invoice numbering settings
   */
  const useInvoiceNumberingSettings = () => {
    return useQuery({
      queryKey: ['/api/invoicing/numbering-settings'],
      queryFn: async () => {
        const response = await apiRequest({
          url: '/api/invoicing/numbering-settings',
          method: 'GET'
        });
        return { data: response };
      }
    });
  };

  /**
   * Get a single invoice numbering setting by ID
   */
  const useInvoiceNumberingSetting = (id: string) => {
    return useQuery({
      queryKey: ['/api/invoicing/numbering-settings', id],
      queryFn: async () => {
        const response = await apiRequest({
          url: `/api/invoicing/numbering-settings/${id}`,
          method: 'GET'
        });
        return response;
      },
      enabled: !!id
    });
  };

  /**
   * Create a new invoice numbering setting
   */
  const useCreateInvoiceNumberingSetting = () => {
    return useMutation({
      mutationFn: async (data: InsertInvoiceNumberingSetting) => {
        const response = await apiRequest({
          url: '/api/invoicing/numbering-settings',
          method: 'POST',
          data
        });
        return response;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/invoicing/numbering-settings'] });
        toast({
          title: 'Serie adăugată',
          description: 'Seria de facturi a fost adăugată cu succes',
          variant: "default"
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: error.message || 'A apărut o eroare la adăugarea seriei',
          variant: 'destructive'
        });
      }
    });
  };

  /**
   * Update an existing invoice numbering setting
   */
  const useUpdateInvoiceNumberingSetting = () => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Partial<UpdateInvoiceNumberingSetting> }) => {
        const response = await apiRequest({
          url: `/api/invoicing/numbering-settings/${id}`,
          method: 'PATCH',
          data
        });
        return response;
      },
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/invoicing/numbering-settings'] });
        
        // If we're setting this as default, we want a specific message
        if (variables.data.isDefault) {
          toast({
            title: 'Serie implicită actualizată',
            description: 'Seria de facturi a fost setată ca implicită',
            variant: "default"
          });
        } else {
          toast({
            title: 'Serie actualizată',
            description: 'Seria de facturi a fost actualizată cu succes',
            variant: "default"
          });
        }
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: error.message || 'A apărut o eroare la actualizarea seriei',
          variant: 'destructive'
        });
      }
    });
  };

  /**
   * Delete an invoice numbering setting
   */
  const useDeleteInvoiceNumberingSetting = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const response = await apiRequest({
          url: `/api/invoicing/numbering-settings/${id}`,
          method: 'DELETE'
        });
        return response;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/invoicing/numbering-settings'] });
        toast({
          title: 'Serie ștearsă',
          description: 'Seria de facturi a fost ștearsă cu succes',
          variant: "default"
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Eroare',
          description: error.message || 'A apărut o eroare la ștergerea seriei',
          variant: 'destructive'
        });
      }
    });
  };

  /**
   * Generate a new invoice number based on a series
   */
  const useGenerateInvoiceNumber = () => {
    return useMutation({
      mutationFn: async (series: string) => {
        const response = await apiRequest({
          url: `/api/invoicing/numbering-settings/generate-number`,
          method: 'POST',
          data: { series }
        });
        return response;
      }
    });
  };

  return {
    useInvoiceNumberingSettings,
    useInvoiceNumberingSetting,
    useCreateInvoiceNumberingSetting,
    useUpdateInvoiceNumberingSetting,
    useDeleteInvoiceNumberingSetting,
    useGenerateInvoiceNumber
  };
}