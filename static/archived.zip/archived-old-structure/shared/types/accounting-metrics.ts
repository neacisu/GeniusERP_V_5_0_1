/**
 * Accounting Metrics Types
 * Shared between frontend and backend for accounting dashboard metrics
 */

export interface AccountingMetrics {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  currentRatio: number;
  quickRatio: number;
  debtToEquityRatio: number;
  profitMargin: number;
  currentAssets?: number;
  currentLiabilities?: number;
  inventory?: number;
}

export interface RecentTransaction {
  id: string;
  date: Date | string;
  description: string;
  amount: number;
  type: string;
  documentNumber?: string | null;
}
