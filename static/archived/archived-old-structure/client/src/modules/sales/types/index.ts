/**
 * Sales Module Type Definitions
 * 
 * Contains types for all sales-related entities such as customers,
 * deals, opportunities, quotes, and sales analytics.
 */

// Enums for status and priority values
export enum SalesStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  INVOICED = 'INVOICED',
  PAID = 'PAID',
  CANCELED = 'CANCELED'
}

export enum DealStatus {
  NEW = 'NEW',
  NEGOTIATION = 'NEGOTIATION',
  PROPOSAL = 'PROPOSAL',
  WON = 'WON',
  LOST = 'LOST',
  CANCELED = 'CANCELED'
}

export enum DealPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum OpportunityStage {
  PROSPECTING = 'PROSPECTING',
  QUALIFICATION = 'QUALIFICATION',
  NEEDS_ANALYSIS = 'NEEDS_ANALYSIS',
  VALUE_PROPOSITION = 'VALUE_PROPOSITION',
  DECISION_MAKERS = 'DECISION_MAKERS',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST'
}

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PROSPECT = 'PROSPECT',
  LEAD = 'LEAD'
}

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

// Customer entity
export interface Customer {
  id: string;
  name: string;
  fiscalCode?: string; // CUI - Romanian fiscal code
  vatNumber?: string; // VAT code
  regNumber?: string; // Registration number
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  county?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  status: CustomerStatus;
  type?: string; // lead, prospect, customer, partner, company, individual, etc.
  category?: string; // Customer category/segment (standard, premium, vip, etc.)
  totalSpent?: number; // Total amount spent by customer
  currency?: string; // Default currency for customer transactions
  active?: boolean; // Whether customer is active
  lastPurchaseDate?: string; // Date of last purchase
  notes?: string;
  createdAt: string;
  updatedAt: string;
  contacts?: Contact[];
  deals?: Deal[];
  customFields?: Record<string, any>;
}

// Contact entity
export interface Contact {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Deal entity
export interface Deal {
  id: string;
  title: string;
  customerId: string;
  customerName?: string;
  value: number;
  currency: string;
  status: DealStatus;
  priority: DealPriority;
  startDate?: string;
  endDate?: string;
  closedDate?: string;
  probability?: number;
  description?: string;
  notes?: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  products?: DealProduct[];
  activities?: Activity[];
  tags?: string[];
  customFields?: Record<string, any>;
}

// Deal product line item
export interface DealProduct {
  id: string;
  dealId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  total: number;
  notes?: string;
}

// Opportunity entity
export interface Opportunity {
  id: string;
  title: string;
  customerId: string;
  customerName?: string;
  potentialValue: number;
  currency: string;
  stage: OpportunityStage;
  priority: DealPriority;
  probability: number;
  expectedCloseDate?: string;
  description?: string;
  source?: string;
  nextAction?: string; // Next action to be taken for this opportunity
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  activities?: Activity[];
  tags?: string[];
  customFields?: Record<string, any>;
}

// Quote entity
export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName?: string;
  title: string;
  status: QuoteStatus;
  issueDate: string;
  validUntil: string;
  value: number;
  currency: string;
  description?: string; // Quote description
  terms?: string; // Terms and conditions
  termsAndConditions?: string; // Alias for terms
  notes?: string; // Internal notes
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items?: QuoteItem[];
  customFields?: Record<string, any>;
}

// Quote item
export interface QuoteItem {
  id?: string;
  quoteId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number; // VAT rate percentage
  discount?: number;
  tax?: number;
  total?: number;
}

// Activity entity
export interface Activity {
  id: string;
  type: 'CALL' | 'MEETING' | 'EMAIL' | 'TASK' | 'NOTE';
  title: string;
  description?: string;
  entityType: 'CUSTOMER' | 'DEAL' | 'OPPORTUNITY' | 'CONTACT';
  entityId: string;
  scheduledAt?: string;
  completedAt?: string;
  duration?: number;
  outcome?: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Pipeline stage
export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color?: string;
  description?: string;
}

// Pipeline entity
export interface Pipeline {
  id: string;
  name: string;
  stages: any; // Can be array of stages or object with stage keys
  deals: Deal[];
  totalValue: number;
  currency: string;
  stats?: {
    totalDeals?: number;
    totalValue?: number;
    wonDeals?: number;
    lostDeals?: number;
    conversionRate?: number;
    totalOpportunities?: number;
    stageCount?: Record<string, number>;
  };
}

// Sales analytics data interfaces
export interface SalesPerformance {
  period: string;
  revenue: number;
  deals: number;
  conversion: number;
}

export interface CustomerSegment {
  segment: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface SalesForecast {
  period: string;
  projected: number;
  actual?: number;
}

// Query options interfaces
export interface CustomerQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  filter?: string;
  type?: string; // Filter by customer type
  category?: string; // Filter by customer category
  active?: boolean; // Filter by active status
  count?: boolean;
}

export interface DealQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  status?: DealStatus | DealStatus[];
  priority?: DealPriority;
  sortBy?: string;
  sortOrder?: string;
  startDate?: string;
  endDate?: string;
  minValue?: number;
  maxValue?: number;
  count?: boolean;
}

export interface OpportunityQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  stage?: OpportunityStage | OpportunityStage[];
  priority?: DealPriority;
  sortBy?: string;
  sortOrder?: string;
  minProbability?: number;
  maxProbability?: number;
  count?: boolean;
}

export interface QuoteQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  status?: QuoteStatus | QuoteStatus[];
  sortBy?: string;
  sortOrder?: string;
  issueDate?: string;
  validUntil?: string;
  count?: boolean;
}

// Response interfaces
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CountResponse {
  count: number;
}

export interface SalesOverviewData {
  totalSales: number;
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  conversionRate: number;
  averageValue: number;
  newOpportunities: number;
  closingRatio: number;
  topProducts: {
    id: string;
    name: string;
    revenue: number;
    quantity: number;
  }[];
}

// Export all types for usage throughout the sales module