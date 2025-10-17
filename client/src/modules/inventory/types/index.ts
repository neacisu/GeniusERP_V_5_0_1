/**
 * Inventory Module Types
 * 
 * Type definitions for the inventory module frontend components.
 * These types are based on the corresponding backend schemas.
 */

// Enum types from backend schema
export type GestiuneType = 'depozit' | 'magazin' | 'custodie' | 'transfer';
export type StockTrackingType = 'QUANTITATIVE' | 'QUANTITATIVE_VALUE' | 'VALUE_ONLY';
export type NirStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'received' | 'cancelled';
export type TransferStatus = 'draft' | 'issued' | 'in_transit' | 'received' | 'cancelled';
export type PurchaseOrderStatus = 'draft' | 'sent' | 'partial' | 'complete' | 'cancelled';

// Base types for UI components
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  type: GestiuneType;
  trackingType: StockTrackingType;
  location?: string | null;
  responsible?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockItem {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  totalValue?: number;
  batchNo?: string | null;
  expiryDate?: string | null;
  lastUpdatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  // For UI display
  productName?: string;
  productCode?: string;
  warehouseName?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string; // SKU este obligatoriu în DB
  barcode?: string | null;
  description?: string | null;
  categoryId?: string | null;
  isActive: boolean | null;
  createdAt: string;
  updatedAt: string;
  // Pricing and stock information
  purchasePrice?: number;
  sellingPrice?: number;
  vatRate?: number | null;
  stockAlert?: number;
  priceIncludesVat?: boolean;
  // Extended properties for UI
  categoryName?: string;
  stockQuantity?: number;
  unitPrice?: number;
  unitId?: string;
  unitName?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductUnit {
  id: string;
  name: string;
  abbreviation: string;
  description?: string | null;
}

export interface NirDocument {
  id: string;
  nirNumber?: string;
  nir_number?: string; // API returns snake_case
  warehouseId?: string;
  warehouse_id?: string; // API returns snake_case
  warehouseName?: string;
  warehouseType?: string;
  warehouse_type?: string; // API returns snake_case
  isCustody?: boolean;
  is_custody?: boolean; // API returns snake_case
  supplierId?: string;
  supplier_id?: string; // API returns snake_case
  supplierName?: string;
  supplierInvoiceNumber?: string | null;
  supplier_invoice_number?: string | null; // API returns snake_case
  receiptDate?: string;
  receipt_date?: string; // API returns snake_case
  status: NirStatus;
  approvedBy?: string | null;
  approved_by?: string | null; // API returns snake_case
  approvedAt?: string | null;
  approved_at?: string | null; // API returns snake_case
  totalValueNoVat?: number | string;
  total_value_no_vat?: number | string; // API returns snake_case as string
  totalVat?: number | string;
  total_vat?: number | string; // API returns snake_case as string
  totalValueWithVat?: number | string;
  total_value_with_vat?: number | string; // API returns snake_case as string
  currency?: string;
  exchangeRate?: number | string;
  exchange_rate?: number | string; // API returns snake_case
  createdAt?: string;
  created_at?: string; // API returns snake_case
  updatedAt?: string;
  updated_at?: string; // API returns snake_case
  notes?: string; // Add missing notes field
}

export interface NirItem {
  id: string;
  nirId: string;
  productId: string;
  productName?: string;
  productCode?: string;
  quantity: number;
  batchNo?: string | null;
  expiryDate?: string | null;
  purchasePrice: number;
  purchasePriceWithVat?: number;
  sellingPrice?: number;
  sellingPriceWithVat?: number;
  vatRate: number;
  vatValue: number;
  totalValueNoVat: number;
  totalValueWithVat: number;
  createdAt: string;
}

export interface TransferDocument {
  id: string;
  referenceNumber?: string;
  transfer_number?: string; // API returns snake_case
  sourceWarehouseId?: string;
  source_warehouse_id?: string; // API returns snake_case
  sourceWarehouseName?: string;
  source_warehouse_name?: string; // API returns snake_case
  destinationWarehouseId?: string;
  destination_warehouse_id?: string; // API returns snake_case
  destinationWarehouseName?: string;
  destination_warehouse_name?: string; // API returns snake_case
  transferDate?: string;
  transfer_date?: string; // API returns snake_case
  status: TransferStatus;
  issuedBy?: string | null;
  issued_by?: string | null; // API returns snake_case
  issuedAt?: string | null;
  issued_at?: string | null; // API returns snake_case
  receivedBy?: string | null;
  received_by?: string | null; // API returns snake_case
  receivedAt?: string | null;
  received_at?: string | null; // API returns snake_case
  totalValueNoVat?: number | string;
  total_value_no_vat?: number | string; // API returns snake_case
  totalVat?: number | string;
  total_vat?: number | string; // API returns snake_case
  totalValueWithVat?: number | string;
  total_value_with_vat?: number | string; // API returns snake_case
  total_value?: number | string; // API returns this field
  currency?: string;
  exchangeRate?: number | string;
  exchange_rate?: number | string; // API returns snake_case
  notes?: string | null;
  createdAt?: string;
  created_at?: string; // API returns snake_case
  updatedAt?: string;
  updated_at?: string; // API returns snake_case
}

export interface TransferItem {
  id: string;
  transferId: string;
  productId: string;
  productName?: string;
  productCode?: string;
  quantity: number;
  batchNo?: string | null;
  expiryDate?: string | null;
  unitPrice: number;
  unitPriceWithVat?: number;
  vatRate: number;
  vatValue: number;
  totalValueNoVat: number;
  totalValueWithVat: number;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  warehouseId: string;
  warehouseName?: string;
  supplierId: string;
  supplierName?: string;
  orderDate: string;
  expectedDeliveryDate?: string | null;
  status: PurchaseOrderStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  totalValueNoVat: number;
  totalVat: number;
  totalValueWithVat: number;
  currency?: string;
  exchangeRate?: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  poId: string;
  productId: string;
  productName?: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  unitPriceWithVat?: number;
  vatRate: number;
  vatValue: number;
  totalValueNoVat: number;
  totalValueWithVat: number;
  createdAt: string;
}

// For chart data in dashboard
export interface StockValueChartData {
  warehouse: string;
  value: number;
}

export interface ProductMovementChartData {
  date: string;
  receipts: number;
  transfers: number;
  sales: number;
}

// Form types for creating/editing entities
export interface WarehouseFormValues {
  name: string;
  code: string;
  type: GestiuneType;
  trackingType: StockTrackingType;
  location?: string;
  responsible?: string;
  isActive: boolean;
}

export interface ProductFormValues {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryId?: string;
  unitId?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  vatRate?: number;
  stockAlert?: number;
  isActive: boolean;
  priceIncludesVat?: boolean;
}

export interface NirDocumentFormValues {
  nirNumber: string;
  warehouseId: string;
  supplierId: string;
  supplierInvoiceNumber?: string;
  receiptDate: string;
  currency: string;
  exchangeRate: number;
  isCustody: boolean;
  notes?: string;
}

export interface NirItemFormValues {
  productId: string;
  quantity: number;
  batchNo?: string;
  expiryDate?: string;
  purchasePrice: number;
  sellingPrice?: number;
  vatRate: number;
}

export interface TransferDocumentFormValues {
  referenceNumber: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  transferDate: string;
  currency: string;
  exchangeRate: number;
  notes?: string;
}

export interface TransferItemFormValues {
  productId: string;
  quantity: number;
  batchNo?: string;
  expiryDate?: string;
  unitPrice: number;
  vatRate: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Interfață pentru datele paginate returnate de API
 */
export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Interfață pentru selecția multiplă de produse
 */
export interface SelectedProducts {
  [id: string]: boolean;
}

/**
 * Interfață pentru datele de editare în masă
 */
export interface BulkEditFormValues {
  categoryId?: string;
  unitId?: string;
  vatRate?: number;
  isActive?: boolean;
  priceIncludesVat?: boolean;
  sellingPrice?: number;
  purchasePrice?: number;
  stockAlert?: number;
}