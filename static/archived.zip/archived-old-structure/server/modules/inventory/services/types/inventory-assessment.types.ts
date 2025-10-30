/**
 * TypeScript types for Inventory Assessment Service
 * 
 * Defines interfaces for assessment operations and database records
 */

/**
 * Data transfer object for creating a new inventory assessment
 */
export interface CreateAssessmentData {
  name?: string;
  warehouseId: string;
  assessmentType?: 'annual' | 'monthly' | 'unscheduled' | 'special';
  type?: 'annual' | 'monthly' | 'unscheduled' | 'special';
  startDate?: string | Date;
  endDate?: string | Date;
  commissionOrderNumber?: string;
  legalBasis?: string;
  assessmentNumber?: string;
  documentNumber?: string;
  valuationMethod?: string;
  notes?: string;
}

/**
 * Database record for inventory assessment
 */
export interface InventoryAssessment {
  id: string;
  company_id: string;
  franchise_id?: string;
  name?: string;
  assessment_number: string;
  assessment_type: 'annual' | 'monthly' | 'unscheduled' | 'special';
  warehouse_id: string;
  start_date: Date;
  end_date?: Date;
  status: 'draft' | 'in_progress' | 'pending_approval' | 'approved' | 'finalized' | 'cancelled';
  commission_order_number?: string;
  approved_by?: string;
  approved_at?: Date;
  notes?: string;
  legal_basis?: string;
  document_number?: string;
  valuation_method?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Stock item from database query
 */
export interface StockItem {
  product_id: string;
  product_name: string;
  product_code?: string;
  sku?: string;
  unit_of_measure?: string;
  theoretical_quantity: string | number;
  theoretical_value: string | number;
}

/**
 * Database record for inventory assessment item
 */
export interface InventoryAssessmentItem {
  id: string;
  assessment_id: string;
  product_id: string;
  accounting_quantity: number;
  actual_quantity: number;
  batch_no?: string;
  expiry_date?: Date;
  valuation_method: 'FIFO' | 'LIFO' | 'weighted_average' | 'standard_cost';
  accounting_value: number;
  actual_value: number;
  difference_quantity: number;
  difference_value: number;
  result_type: 'match' | 'surplus' | 'deficit';
  is_processed: boolean;
  counted_by?: string;
  notes?: string;
  unit_of_measure?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Result object for assessment with items
 */
export interface AssessmentWithItems {
  assessment: InventoryAssessment;
  items: InventoryAssessmentItem[];
}

/**
 * Result object for processing inventory differences
 */
export interface ProcessDifferencesResult {
  success: boolean;
  message: string;
  assessmentId: string;
}
