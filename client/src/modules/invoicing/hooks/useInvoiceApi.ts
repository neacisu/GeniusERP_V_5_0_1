/**
 * Invoice API Hooks
 * 
 * Custom hooks for interacting with the invoice API endpoints.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Invoice,
  InvoiceItem,
  InvoiceFilters,
  NewInvoiceData,
  PaginatedInvoices,
  InvoiceStatistics,
  AccountingPreview,
  ValidationResult,
} from "../types";

/**
 * Hook for fetching and managing invoices
 */
export function useInvoices(filters: InvoiceFilters = {}) {
  const {
    status = "",
    customerId = "",
    dateFrom = "",
    dateTo = "",
    searchQuery = "",
    page = 1,
    limit = 10,
    sortBy = "issueDate",
    sortDir = "desc"
  } = filters;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Construct query string
  const queryString = new URLSearchParams({
    ...(status && { status }),
    ...(customerId && { customerId }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(searchQuery && { searchQuery }),
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortDir
  }).toString();

  // Query for fetching invoices
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/invoices', queryString],
    queryFn: async () => {
      const response = await apiRequest({ 
        url: `/api/invoices?${queryString}`,
        method: 'GET'
      });
      return response as PaginatedInvoices;
    }
  });

  // Create invoice mutation
  const createInvoice = useMutation({
    mutationFn: async (newInvoice: NewInvoiceData) => {
      console.log("API request data:", JSON.stringify(newInvoice, null, 2));
      
      // Format the data properly according to the expected backend structure
      const formattedData = {
        invoice: {
          customerId: newInvoice.customerId,
          currency: newInvoice.currency,
          exchangeRate: newInvoice.exchangeRate || 1,
        },
        details: {
          issueDate: newInvoice.issueDate,
          dueDate: newInvoice.dueDate,
          paymentMethod: newInvoice.paymentMethod,
          paymentDetails: newInvoice.paymentDetails || "",
          notes: newInvoice.notes || ""
        },
        lines: newInvoice.items.map(item => ({
          productName: item.productName,
          productCode: item.productCode || "",
          description: item.description || "",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          discount: item.discount || 0,
          unit: item.unit || "buc"
        }))
      };
      
      console.log("Formatted request data:", JSON.stringify(formattedData, null, 2));
      
      const response = await apiRequest({
        url: "/api/invoices",
        method: "POST",
        data: formattedData
      });
      return response as Invoice;
    },
    onSuccess: () => {
      toast({
        title: "Factură creată",
        description: "Factura a fost creată cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: (error: any) => {
      console.error("Create invoice error:", error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut crea factura",
        variant: "destructive"
      });
    }
  });

  // Update invoice mutation
  const updateInvoice = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Invoice> }) => {
      const response = await apiRequest({
        url: `/api/invoices/${id}`,
        method: "PUT",
        data
      });
      return response as Invoice;
    },
    onSuccess: () => {
      toast({
        title: "Factură actualizată",
        description: "Factura a fost actualizată cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut actualiza factura",
        variant: "destructive"
      });
    }
  });

  // Delete invoice mutation
  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest({
        url: `/api/invoices/${id}`,
        method: "DELETE"
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Factură ștearsă",
        description: "Factura a fost ștearsă cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut șterge factura",
        variant: "destructive"
      });
    }
  });

  // Validate invoice mutation
  const validateInvoice = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest({
        url: `/api/invoices/${id}/validate`,
        method: "POST"
      });
      return response as ValidationResult;
    },
    onSuccess: (data) => {
      toast({
        title: "Factură validată",
        description: "Factura a fost validată cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut valida factura",
        variant: "destructive"
      });
    }
  });

  // Cancel/devalidate invoice mutation
  const cancelInvoice = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest({
        url: `/api/invoices/${id}/devalidate`,
        method: "POST"
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Factură anulată",
        description: "Factura a fost anulată cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut anula factura",
        variant: "destructive"
      });
    }
  });

  return {
    invoices: data?.invoices || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 10,
    hasMore: data?.hasMore || false,
    isLoading,
    isError,
    error: error as Error | null,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    validateInvoice,
    cancelInvoice
  };
}

/**
 * Hook for fetching and managing a single invoice
 */
export function useInvoice(id: string | null) {
  const queryClient = useQueryClient();
  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/invoices', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest({ 
        url: `/api/invoices/${id}`,
        method: 'GET'
      });
      return response as Invoice & { items: InvoiceItem[] };
    },
    enabled: !!id
  });

  // Preview accounting entries that would be created on validation
  const { data: accountingPreview, refetch: refreshAccountingPreview } = useQuery({
    queryKey: ['/api/invoices', id, 'accounting-preview'],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest({ 
        url: `/api/invoices/${id}/accounting-preview`,
        method: 'GET'
      });
      return response as AccountingPreview;
    },
    enabled: !!id && !!data && !data.isValidated
  });

  return {
    invoice: data,
    accountingPreview,
    refreshAccountingPreview,
    isLoading,
    isError,
    error: error as Error | null
  };
}

/**
 * Hook for fetching invoice statistics
 */
export function useInvoiceStatistics() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/invoices/stats'],
    queryFn: async () => {
      const response = await apiRequest({ 
        url: `/api/invoices/stats`,
        method: 'GET'
      });
      return response as InvoiceStatistics;
    }
  });

  return {
    stats: data || {
      totalInvoices: 0,
      totalPending: 0,
      totalValidated: 0,
      totalPaid: 0,
      totalOverdue: 0,
      totalAmount: 0,
      totalVat: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      avgPaymentDelay: 0
    },
    isLoading,
    isError,
    error: error as Error | null
  };
}

/**
 * Hook for fetching customer invoices
 */
export function useCustomerInvoices(customerId: string | null, filters: Partial<InvoiceFilters> = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = "issueDate",
    sortDir = "desc"
  } = filters;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/invoices/customer', customerId, { page, limit, sortBy, sortDir }],
    queryFn: async () => {
      if (!customerId) return { invoices: [], total: 0, page, limit, hasMore: false };
      
      const queryString = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortDir
      }).toString();
      
      const response = await apiRequest({ 
        url: `/api/invoices/customer/${customerId}?${queryString}`,
        method: 'GET'
      });
      return response as PaginatedInvoices;
    },
    enabled: !!customerId
  });

  return {
    invoices: data?.invoices || [],
    total: data?.total || 0,
    page: data?.page || page,
    limit: data?.limit || limit,
    hasMore: data?.hasMore || false,
    isLoading,
    isError,
    error: error as Error | null
  };
}

/**
 * Hook for exporting an invoice to PDF
 */
export function useInvoiceExport() {
  const { toast } = useToast();

  const exportToPdf = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest({
        url: `/api/invoices/${id}/export`,
        method: "GET",
        responseType: "blob"
      });
      return response as Blob;
    },
    onSuccess: (data, id) => {
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export finalizat",
        description: "Factura a fost exportată cu succes",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare la export",
        description: error.message || "Nu s-a putut exporta factura",
        variant: "destructive"
      });
    }
  });

  return {
    exportToPdf,
    isExporting: exportToPdf.isPending
  };
}