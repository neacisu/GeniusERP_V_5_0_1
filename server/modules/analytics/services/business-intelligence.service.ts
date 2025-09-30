/**
 * Business Intelligence Service
 * 
 * This service provides business intelligence capabilities for the Romanian ERP system.
 * It supports advanced analytics, reporting, cost center management, and business performance
 * monitoring to help organizations make data-driven decisions and optimize operations.
 */

import { eq, and, sql, desc, asc, or, like, inArray, isNull, isNotNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { DrizzleService } from '../../../common/drizzle';
import { z } from 'zod';

/**
 * Cost center types
 */
export enum CostCenterType {
  DEPARTMENT = 'department',
  PROJECT = 'project',
  PRODUCT_LINE = 'product_line',
  BRANCH = 'branch',
  MARKET_SEGMENT = 'market_segment',
  GEOGRAPHIC = 'geographic',
  CUSTOM = 'custom'
}

/**
 * Analysis frequency types
 */
export enum AnalysisFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  CUSTOM = 'custom'
}

/**
 * Business unit interface
 */
export interface BusinessUnit {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
  type: string;
  parentId: string | null;
  path: string;
  level: number;
  costCenterIds: string[];
  managerUserId: string | null;
  settings: any | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cost center interface
 */
export interface CostCenter {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
  code: string;
  type: CostCenterType;
  parentId: string | null;
  path: string;
  level: number;
  businessUnitId: string | null;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  budgetPeriod: string | null;
  tags: string[] | null;
  isActive: boolean;
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cost allocation interface
 */
export interface CostAllocation {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
  sourceCostCenterId: string;
  targetCostCenterId: string;
  allocationMethod: string;
  allocationPercentage: number | null;
  allocationAmount: number | null;
  allocationCurrency: string | null;
  allocationPeriod: string;
  status: string;
  isRecurring: boolean;
  startDate: Date;
  endDate: Date | null;
  lastRunDate: Date | null;
  nextRunDate: Date | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Analysis insight interface
 */
export interface AnalysisInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  importance: number;
  impact: string;
  metrics: any[];
  recommendations: string[];
  tags: string[];
  date: string;
}

/**
 * KPI with trends interface
 */
export interface KpiWithTrends {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: number;
  trendPeriod: string;
  trendDirection: 'up' | 'down' | 'neutral';
  target: number | null;
  variance: number | null;
  variancePercentage: number | null;
  status: 'success' | 'warning' | 'danger' | 'neutral';
  historicalData: {
    periods: string[];
    values: number[];
  };
}

/**
 * Cost analysis result interface
 */
export interface CostAnalysisResult {
  totalCosts: number;
  costsByCostCenter: Array<{
    id: string;
    name: string;
    value: number;
    percentage: number;
  }>;
  costsByCategory: Array<{
    category: string;
    value: number;
    percentage: number;
  }>;
  costTrends: {
    periods: string[];
    values: number[];
  };
  topExpenseItems: Array<{
    name: string;
    category: string;
    value: number;
    costCenterId: string;
    costCenterName: string;
  }>;
  variances: Array<{
    costCenterId: string;
    costCenterName: string;
    budgetAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
  }>;
}

/**
 * Profit center analysis result interface
 */
export interface ProfitCenterAnalysisResult {
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  grossProfitMargin: number;
  revenueByProfitCenter: Array<{
    id: string;
    name: string;
    revenue: number;
    percentage: number;
  }>;
  profitByProfitCenter: Array<{
    id: string;
    name: string;
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
  }>;
  trends: {
    periods: string[];
    revenue: number[];
    costs: number[];
    profit: number[];
    margin: number[];
  };
  topPerformers: Array<{
    id: string;
    name: string;
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
    growthRate: number;
  }>;
}

/**
 * Business performance analysis result interface
 */
export interface BusinessPerformanceResult {
  financialKpis: Array<KpiWithTrends>;
  operationalKpis: Array<KpiWithTrends>;
  salesKpis: Array<KpiWithTrends>;
  marketingKpis: Array<KpiWithTrends>;
  insights: Array<AnalysisInsight>;
  performanceTrends: {
    periods: string[];
    metrics: {
      [key: string]: number[];
    };
  };
  recommendations: Array<{
    title: string;
    description: string;
    impact: string;
    effort: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
  }>;
}

/**
 * Business Intelligence Service implementation
 */
export class BusinessIntelligenceService {
  constructor(private readonly drizzleService: DrizzleService) {}

  /**
   * Get business units for a company
   * 
   * @param companyId Company ID
   * @returns Business units
   */
  async getBusinessUnits(companyId: string): Promise<BusinessUnit[]> {
    // In a real implementation, this would query the business_units table
    // For demonstration, we return sample business units
    return [
      {
        id: 'bu-001',
        name: 'Sales Department',
        description: 'Sales and business development',
        companyId,
        type: 'department',
        parentId: null,
        path: '/sales',
        level: 1,
        costCenterIds: ['cc-001', 'cc-002'],
        managerUserId: 'user-001',
        settings: null,
        createdBy: 'admin',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'bu-002',
        name: 'Marketing Department',
        description: 'Marketing and communications',
        companyId,
        type: 'department',
        parentId: null,
        path: '/marketing',
        level: 1,
        costCenterIds: ['cc-003'],
        managerUserId: 'user-002',
        settings: null,
        createdBy: 'admin',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'bu-003',
        name: 'Operations',
        description: 'Operations and logistics',
        companyId,
        type: 'department',
        parentId: null,
        path: '/operations',
        level: 1,
        costCenterIds: ['cc-004', 'cc-005'],
        managerUserId: 'user-003',
        settings: null,
        createdBy: 'admin',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'bu-004',
        name: 'Finance Department',
        description: 'Finance, accounting and administration',
        companyId,
        type: 'department',
        parentId: null,
        path: '/finance',
        level: 1,
        costCenterIds: ['cc-006'],
        managerUserId: 'user-004',
        settings: null,
        createdBy: 'admin',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Get cost centers for a company
   * 
   * @param companyId Company ID
   * @returns Cost centers
   */
  async getCostCenters(companyId: string): Promise<CostCenter[]> {
    // In a real implementation, this would query the cost_centers table
    // For demonstration, we return sample cost centers
    return [
      {
        id: 'cc-001',
        name: 'Direct Sales',
        description: 'Direct sales team',
        companyId,
        code: 'DS100',
        type: CostCenterType.DEPARTMENT,
        parentId: null,
        path: '/direct-sales',
        level: 1,
        businessUnitId: 'bu-001',
        budgetAmount: 250000,
        budgetCurrency: 'RON',
        budgetPeriod: 'quarterly',
        tags: ['sales', 'direct'],
        isActive: true,
        createdBy: 'admin',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cc-002',
        name: 'Online Sales',
        description: 'E-commerce and online sales',
        companyId,
        code: 'OS200',
        type: CostCenterType.DEPARTMENT,
        parentId: null,
        path: '/online-sales',
        level: 1,
        businessUnitId: 'bu-001',
        budgetAmount: 150000,
        budgetCurrency: 'RON',
        budgetPeriod: 'quarterly',
        tags: ['sales', 'online'],
        isActive: true,
        createdBy: 'admin',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cc-003',
        name: 'Marketing',
        description: 'Marketing department',
        companyId,
        code: 'MK300',
        type: CostCenterType.DEPARTMENT,
        parentId: null,
        path: '/marketing',
        level: 1,
        businessUnitId: 'bu-002',
        budgetAmount: 180000,
        budgetCurrency: 'RON',
        budgetPeriod: 'quarterly',
        tags: ['marketing'],
        isActive: true,
        createdBy: 'admin',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cc-004',
        name: 'Warehouse',
        description: 'Warehouse and logistics',
        companyId,
        code: 'WH400',
        type: CostCenterType.DEPARTMENT,
        parentId: null,
        path: '/warehouse',
        level: 1,
        businessUnitId: 'bu-003',
        budgetAmount: 120000,
        budgetCurrency: 'RON',
        budgetPeriod: 'quarterly',
        tags: ['operations', 'logistics'],
        isActive: true,
        createdBy: 'admin',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cc-005',
        name: 'Production',
        description: 'Production department',
        companyId,
        code: 'PD500',
        type: CostCenterType.DEPARTMENT,
        parentId: null,
        path: '/production',
        level: 1,
        businessUnitId: 'bu-003',
        budgetAmount: 350000,
        budgetCurrency: 'RON',
        budgetPeriod: 'quarterly',
        tags: ['operations', 'production'],
        isActive: true,
        createdBy: 'admin',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cc-006',
        name: 'Finance',
        description: 'Finance department',
        companyId,
        code: 'FN600',
        type: CostCenterType.DEPARTMENT,
        parentId: null,
        path: '/finance',
        level: 1,
        businessUnitId: 'bu-004',
        budgetAmount: 100000,
        budgetCurrency: 'RON',
        budgetPeriod: 'quarterly',
        tags: ['finance', 'administration'],
        isActive: true,
        createdBy: 'admin',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Get cost allocations for a company
   * 
   * @param companyId Company ID
   * @returns Cost allocations
   */
  async getCostAllocations(companyId: string): Promise<CostAllocation[]> {
    // In a real implementation, this would query the cost_allocations table
    // For demonstration, we return sample cost allocations
    return [
      {
        id: 'ca-001',
        name: 'IT Services Allocation',
        description: 'Allocation of IT services costs to departments',
        companyId,
        sourceCostCenterId: 'cc-006', // Finance (includes IT)
        targetCostCenterId: 'cc-001', // Direct Sales
        allocationMethod: 'percentage',
        allocationPercentage: 15,
        allocationAmount: null,
        allocationCurrency: 'RON',
        allocationPeriod: 'monthly',
        status: 'active',
        isRecurring: true,
        startDate: new Date('2024-01-01'),
        endDate: null,
        lastRunDate: new Date('2024-03-01'),
        nextRunDate: new Date('2024-04-01'),
        createdBy: 'admin',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'ca-002',
        name: 'IT Services Allocation',
        description: 'Allocation of IT services costs to departments',
        companyId,
        sourceCostCenterId: 'cc-006', // Finance (includes IT)
        targetCostCenterId: 'cc-002', // Online Sales
        allocationMethod: 'percentage',
        allocationPercentage: 25,
        allocationAmount: null,
        allocationCurrency: 'RON',
        allocationPeriod: 'monthly',
        status: 'active',
        isRecurring: true,
        startDate: new Date('2024-01-01'),
        endDate: null,
        lastRunDate: new Date('2024-03-01'),
        nextRunDate: new Date('2024-04-01'),
        createdBy: 'admin',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'ca-003',
        name: 'IT Services Allocation',
        description: 'Allocation of IT services costs to departments',
        companyId,
        sourceCostCenterId: 'cc-006', // Finance (includes IT)
        targetCostCenterId: 'cc-003', // Marketing
        allocationMethod: 'percentage',
        allocationPercentage: 20,
        allocationAmount: null,
        allocationCurrency: 'RON',
        allocationPeriod: 'monthly',
        status: 'active',
        isRecurring: true,
        startDate: new Date('2024-01-01'),
        endDate: null,
        lastRunDate: new Date('2024-03-01'),
        nextRunDate: new Date('2024-04-01'),
        createdBy: 'admin',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'ca-004',
        name: 'IT Services Allocation',
        description: 'Allocation of IT services costs to departments',
        companyId,
        sourceCostCenterId: 'cc-006', // Finance (includes IT)
        targetCostCenterId: 'cc-004', // Warehouse
        allocationMethod: 'percentage',
        allocationPercentage: 15,
        allocationAmount: null,
        allocationCurrency: 'RON',
        allocationPeriod: 'monthly',
        status: 'active',
        isRecurring: true,
        startDate: new Date('2024-01-01'),
        endDate: null,
        lastRunDate: new Date('2024-03-01'),
        nextRunDate: new Date('2024-04-01'),
        createdBy: 'admin',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'ca-005',
        name: 'IT Services Allocation',
        description: 'Allocation of IT services costs to departments',
        companyId,
        sourceCostCenterId: 'cc-006', // Finance (includes IT)
        targetCostCenterId: 'cc-005', // Production
        allocationMethod: 'percentage',
        allocationPercentage: 25,
        allocationAmount: null,
        allocationCurrency: 'RON',
        allocationPeriod: 'monthly',
        status: 'active',
        isRecurring: true,
        startDate: new Date('2024-01-01'),
        endDate: null,
        lastRunDate: new Date('2024-03-01'),
        nextRunDate: new Date('2024-04-01'),
        createdBy: 'admin',
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Analyze cost centers
   * 
   * @param companyId Company ID
   * @param period Period for analysis (e.g., 'Q1-2024')
   * @param costCenterIds Optional specific cost centers to analyze
   * @returns Cost analysis results
   */
  async analyzeCostCenters(
    companyId: string,
    period: string,
    costCenterIds?: string[]
  ): Promise<CostAnalysisResult> {
    console.log(`Analyzing cost centers for company ${companyId} for period ${period}`);
    
    // In a real implementation, this would query expense data from accounting module
    // and perform complex cost analysis based on accounting entries
    // For demonstration, we return sample results
    
    // Get cost centers first (either filtered or all)
    const allCostCenters = await this.getCostCenters(companyId);
    const costCenters = costCenterIds 
      ? allCostCenters.filter(cc => costCenterIds.includes(cc.id))
      : allCostCenters;
    
    // Build a realistic cost analysis
    const categories = ['Personnel', 'Operations', 'Marketing', 'IT', 'Facilities', 'Other'];
    const periods = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    // Calculate total costs
    const totalCosts = costCenters.reduce((sum, cc) => sum + (cc.budgetAmount || 0) * 0.85, 0);
    
    // Generate costs by cost center
    const costsByCostCenter = costCenters.map(cc => {
      const actualCost = (cc.budgetAmount || 0) * (0.7 + Math.random() * 0.3); // 70%-100% of budget
      return {
        id: cc.id,
        name: cc.name,
        value: Math.round(actualCost),
        percentage: +(actualCost / totalCosts * 100).toFixed(1)
      };
    });
    
    // Generate costs by category
    const costsByCategory = categories.map(category => {
      // Distribute total costs across categories with realistic proportions
      let percentage;
      switch(category) {
        case 'Personnel': percentage = 0.45 + Math.random() * 0.1; break;
        case 'Operations': percentage = 0.2 + Math.random() * 0.1; break;
        case 'Marketing': percentage = 0.1 + Math.random() * 0.05; break;
        case 'IT': percentage = 0.08 + Math.random() * 0.04; break;
        case 'Facilities': percentage = 0.1 + Math.random() * 0.03; break;
        default: percentage = 0.02 + Math.random() * 0.03;
      }
      const value = Math.round(totalCosts * percentage);
      return {
        category,
        value,
        percentage: +(percentage * 100).toFixed(1)
      };
    });
    
    // Generate cost trends (past 6 months)
    const trendValues = [];
    let baseValue = totalCosts / 6 * (0.9 + Math.random() * 0.2);
    for (let i = 0; i < periods.length; i++) {
      // Add realistic month-to-month variations
      const monthVariation = 0.95 + Math.random() * 0.15; // 95%-110% variation
      baseValue = baseValue * monthVariation;
      trendValues.push(Math.round(baseValue));
    }
    
    // Generate top expense items
    const expenseItems = [];
    for (const cc of costCenters) {
      // Create 1-2 top expense items per cost center
      const numItems = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numItems; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const itemValue = Math.round((cc.budgetAmount || 0) * (0.2 + Math.random() * 0.3));
        expenseItems.push({
          name: `${category} Expense ${i+1}`,
          category,
          value: itemValue,
          costCenterId: cc.id,
          costCenterName: cc.name
        });
      }
    }
    // Sort by value and take top 10
    const topExpenseItems = expenseItems
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    // Generate budget variances
    const variances = costCenters.map(cc => {
      const budgetAmount = cc.budgetAmount || 0;
      const actualAmount = Math.round(budgetAmount * (0.7 + Math.random() * 0.5)); // 70%-120% of budget
      const variance = actualAmount - budgetAmount;
      const variancePercentage = +(variance / budgetAmount * 100).toFixed(1);
      return {
        costCenterId: cc.id,
        costCenterName: cc.name,
        budgetAmount,
        actualAmount,
        variance,
        variancePercentage
      };
    });
    
    return {
      totalCosts,
      costsByCostCenter,
      costsByCategory,
      costTrends: {
        periods,
        values: trendValues
      },
      topExpenseItems,
      variances
    };
  }

  /**
   * Analyze profit centers
   * 
   * @param companyId Company ID
   * @param period Period for analysis (e.g., 'Q1-2024')
   * @returns Profit center analysis results
   */
  async analyzeProfitCenters(companyId: string, period: string): Promise<ProfitCenterAnalysisResult> {
    console.log(`Analyzing profit centers for company ${companyId} for period ${period}`);
    
    // In a real implementation, this would query revenue and expense data
    // For demonstration, we return sample results
    
    // Use business units as profit centers
    const profitCenters = await this.getBusinessUnits(companyId);
    
    // Calculate revenue, costs, and profits
    const totalRevenue = 1350000;
    const totalCosts = 950000;
    const grossProfit = totalRevenue - totalCosts;
    const grossProfitMargin = +(grossProfit / totalRevenue * 100).toFixed(1);
    
    // Generate revenue by profit center
    const revenueByProfitCenter = profitCenters.map(pc => {
      const revenue = pc.name.includes('Sales') 
        ? Math.round(totalRevenue * (0.3 + Math.random() * 0.2)) 
        : Math.round(totalRevenue * (0.05 + Math.random() * 0.15));
      return {
        id: pc.id,
        name: pc.name,
        revenue,
        percentage: +(revenue / totalRevenue * 100).toFixed(1)
      };
    });
    
    // Normalize percentages to sum to 100%
    const totalPercentage = revenueByProfitCenter.reduce((sum, item) => sum + item.percentage, 0);
    revenueByProfitCenter.forEach(item => {
      item.percentage = +(item.percentage / totalPercentage * 100).toFixed(1);
    });
    
    // Generate profit by profit center
    const profitByProfitCenter = profitCenters.map(pc => {
      const revenue = revenueByProfitCenter.find(r => r.id === pc.id)?.revenue || 0;
      const costs = Math.round(revenue * (0.6 + Math.random() * 0.2)); // 60%-80% of revenue
      const profit = revenue - costs;
      const margin = +(profit / revenue * 100).toFixed(1);
      return {
        id: pc.id,
        name: pc.name,
        revenue,
        costs,
        profit,
        margin
      };
    });
    
    // Generate trends
    const periods = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const revenueTrend = [];
    const costsTrend = [];
    const profitTrend = [];
    const marginTrend = [];
    
    let baseRevenue = totalRevenue / 6 * (0.8 + Math.random() * 0.2);
    let baseCosts = totalCosts / 6 * (0.85 + Math.random() * 0.15);
    
    for (let i = 0; i < periods.length; i++) {
      // Simulate monthly growth
      baseRevenue = baseRevenue * (1 + (Math.random() * 0.06));
      baseCosts = baseCosts * (1 + (Math.random() * 0.04));
      
      const monthRevenue = Math.round(baseRevenue);
      const monthCosts = Math.round(baseCosts);
      const monthProfit = monthRevenue - monthCosts;
      const monthMargin = +(monthProfit / monthRevenue * 100).toFixed(1);
      
      revenueTrend.push(monthRevenue);
      costsTrend.push(monthCosts);
      profitTrend.push(monthProfit);
      marginTrend.push(monthMargin);
    }
    
    // Generate top performers
    const topPerformers = profitByProfitCenter
      .map(pc => ({
        ...pc,
        growthRate: +(5 + Math.random() * 15).toFixed(1) // 5%-20% growth
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 3);
    
    return {
      totalRevenue,
      totalCosts,
      grossProfit,
      grossProfitMargin,
      revenueByProfitCenter,
      profitByProfitCenter,
      trends: {
        periods,
        revenue: revenueTrend,
        costs: costsTrend,
        profit: profitTrend,
        margin: marginTrend
      },
      topPerformers
    };
  }

  /**
   * Analyze overall business performance
   * 
   * @param companyId Company ID
   * @param period Period for analysis (e.g., 'Q1-2024')
   * @returns Business performance analysis results
   */
  async analyzeBusinessPerformance(companyId: string, period: string): Promise<BusinessPerformanceResult> {
    console.log(`Analyzing business performance for company ${companyId} for period ${period}`);
    
    // In a real implementation, this would perform complex analytics across multiple data sources
    // For demonstration, we return sample results
    
    // Generate financial KPIs
    const financialKpis: KpiWithTrends[] = [
      {
        id: 'kpi-001',
        name: 'Revenue',
        value: 1350000,
        unit: 'RON',
        trend: 12.5,
        trendPeriod: 'YoY',
        trendDirection: 'up',
        target: 1400000,
        variance: -50000,
        variancePercentage: -3.6,
        status: 'warning',
        historicalData: {
          periods: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          values: [200000, 210000, 220000, 230000, 240000, 250000]
        }
      },
      {
        id: 'kpi-002',
        name: 'Profit Margin',
        value: 28.5,
        unit: '%',
        trend: 2.3,
        trendPeriod: 'YoY',
        trendDirection: 'up',
        target: 30,
        variance: -1.5,
        variancePercentage: -5,
        status: 'warning',
        historicalData: {
          periods: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          values: [25.5, 26.2, 27.1, 27.8, 28.3, 28.5]
        }
      },
      {
        id: 'kpi-003',
        name: 'Cost Reduction',
        value: 8.2,
        unit: '%',
        trend: 3.1,
        trendPeriod: 'YoY',
        trendDirection: 'up',
        target: 5,
        variance: 3.2,
        variancePercentage: 64,
        status: 'success',
        historicalData: {
          periods: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          values: [2.1, 3.5, 5.2, 6.8, 7.5, 8.2]
        }
      },
      {
        id: 'kpi-004',
        name: 'Cash Flow',
        value: 420000,
        unit: 'RON',
        trend: 15.3,
        trendPeriod: 'YoY',
        trendDirection: 'up',
        target: 400000,
        variance: 20000,
        variancePercentage: 5,
        status: 'success',
        historicalData: {
          periods: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          values: [320000, 340000, 360000, 380000, 400000, 420000]
        }
      }
    ];
    
    // Generate operational KPIs
    const operationalKpis: KpiWithTrends[] = [
      {
        id: 'kpi-005',
        name: 'Inventory Turnover',
        value: 5.8,
        unit: 'times',
        trend: 0.4,
        trendPeriod: 'YoY',
        trendDirection: 'up',
        target: 6,
        variance: -0.2,
        variancePercentage: -3.3,
        status: 'warning',
        historicalData: {
          periods: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          values: [5.2, 5.3, 5.5, 5.6, 5.7, 5.8]
        }
      },
      {
        id: 'kpi-006',
        name: 'On-time Delivery',
        value: 94.2,
        unit: '%',
        trend: 3.1,
        trendPeriod: 'YoY',
        trendDirection: 'up',
        target: 95,
        variance: -0.8,
        variancePercentage: -0.8,
        status: 'warning',
        historicalData: {
          periods: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          values: [90.1, 91.5, 92.8, 93.2, 93.8, 94.2]
        }
      },
      {
        id: 'kpi-007',
        name: 'Production Efficiency',
        value: 87.5,
        unit: '%',
        trend: 5.2,
        trendPeriod: 'YoY',
        trendDirection: 'up',
        target: 85,
        variance: 2.5,
        variancePercentage: 2.9,
        status: 'success',
        historicalData: {
          periods: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          values: [82.1, 83.5, 84.8, 85.7, 86.9, 87.5]
        }
      }
    ];
    
    // Generate sales KPIs
    const salesKpis: KpiWithTrends[] = [
      {
        id: 'kpi-008',
        name: 'Sales Growth',
        value: 12.5,
        unit: '%',
        trend: 2.3,
        trendPeriod: 'YoY',
        trendDirection: 'up',
        target: 15,
        variance: -2.5,
        variancePercentage: -16.7,
        status: 'warning',
        historicalData: {
          periods: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          values: [8.2, 9.1, 10.3, 11.2, 11.8, 12.5]
        }
      },
      {
        id: 'kpi-009',
        name: 'New Customers',
        value: 45,
        unit: 'count',
        trend: 15,
        trendPeriod: 'YoY',
        trendDirection: 'up',
        target: 40,
        variance: 5,
        variancePercentage: 12.5,
        status: 'success',
        historicalData: {
          periods: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          values: [32, 35, 38, 40, 42, 45]
        }
      },
      {
        id: 'kpi-010',
        name: 'Average Order Value',
        value: 2850,
        unit: 'RON',
        trend: 320,
        trendPeriod: 'YoY',
        trendDirection: 'up',
        target: 2750,
        variance: 100,
        variancePercentage: 3.6,
        status: 'success',
        historicalData: {
          periods: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          values: [2600, 2650, 2700, 2750, 2800, 2850]
        }
      }
    ];
    
    // Generate marketing KPIs
    const marketingKpis: KpiWithTrends[] = [
      {
        id: 'kpi-011',
        name: 'Marketing ROI',
        value: 425,
        unit: '%',
        trend: 75,
        trendPeriod: 'YoY',
        trendDirection: 'up',
        target: 400,
        variance: 25,
        variancePercentage: 6.3,
        status: 'success',
        historicalData: {
          periods: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          values: [380, 390, 400, 410, 415, 425]
        }
      },
      {
        id: 'kpi-012',
        name: 'Conversion Rate',
        value: 3.8,
        unit: '%',
        trend: 0.6,
        trendPeriod: 'YoY',
        trendDirection: 'up',
        target: 4,
        variance: -0.2,
        variancePercentage: -5,
        status: 'warning',
        historicalData: {
          periods: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          values: [3.2, 3.3, 3.5, 3.6, 3.7, 3.8]
        }
      },
      {
        id: 'kpi-013',
        name: 'Customer Acquisition Cost',
        value: 350,
        unit: 'RON',
        trend: -25,
        trendPeriod: 'YoY',
        trendDirection: 'down',
        target: 340,
        variance: 10,
        variancePercentage: 2.9,
        status: 'warning',
        historicalData: {
          periods: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          values: [390, 380, 370, 365, 355, 350]
        }
      }
    ];
    
    // Generate insights
    const insights: AnalysisInsight[] = [
      {
        id: 'ins-001',
        type: 'opportunity',
        title: 'Online Sales Growth Opportunity',
        description: 'Online sales channel is growing 35% faster than traditional channels, presenting an opportunity for additional investment.',
        category: 'sales',
        importance: 80,
        impact: 'high',
        metrics: [
          { name: 'Online Sales Growth', value: '35%', trend: '+8.5%' },
          { name: 'Online Conversion Rate', value: '4.2%', trend: '+0.7%' }
        ],
        recommendations: [
          'Increase online marketing budget by 20%',
          'Enhance product descriptions and imagery',
          'Implement customer reviews functionality'
        ],
        tags: ['sales', 'online', 'growth'],
        date: '2024-03-15'
      },
      {
        id: 'ins-002',
        type: 'risk',
        title: 'Rising Material Costs',
        description: 'Material costs have increased 12% in the last quarter, impacting profit margins for manufacturing.',
        category: 'operations',
        importance: 75,
        impact: 'high',
        metrics: [
          { name: 'Material Cost Increase', value: '12%', trend: '+4.5%' },
          { name: 'Profit Margin Impact', value: '-2.8%', trend: '-1.2%' }
        ],
        recommendations: [
          'Negotiate volume discounts with suppliers',
          'Explore alternative materials',
          'Consider price adjustments for affected products'
        ],
        tags: ['costs', 'materials', 'manufacturing'],
        date: '2024-03-10'
      },
      {
        id: 'ins-003',
        type: 'improvement',
        title: 'Warehouse Efficiency Improvements',
        description: 'Warehouse B shows 15% better efficiency metrics than Warehouse A. Standardizing processes could improve overall performance.',
        category: 'operations',
        importance: 65,
        impact: 'medium',
        metrics: [
          { name: 'Warehouse B Efficiency', value: '92%', trend: '+3.5%' },
          { name: 'Warehouse A Efficiency', value: '77%', trend: '+0.5%' }
        ],
        recommendations: [
          'Document best practices from Warehouse B',
          'Implement standardized processes across all warehouses',
          'Provide additional training for Warehouse A staff'
        ],
        tags: ['warehouse', 'efficiency', 'operations'],
        date: '2024-03-05'
      },
      {
        id: 'ins-004',
        type: 'anomaly',
        title: 'Unusual Expense Pattern Detected',
        description: 'IT expenses in Marketing department increased 45% month-over-month, significantly above historical patterns.',
        category: 'finance',
        importance: 70,
        impact: 'medium',
        metrics: [
          { name: 'IT Expense Increase', value: '45%', trend: '+38%' },
          { name: 'Budget Impact', value: '12,500 RON', trend: 'N/A' }
        ],
        recommendations: [
          'Review recent IT purchases in Marketing',
          'Validate expense categorization',
          'Update approval thresholds for departmental IT purchases'
        ],
        tags: ['expenses', 'IT', 'marketing'],
        date: '2024-03-08'
      }
    ];
    
    // Generate performance trends
    const trendPeriods = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const metrics = {
      revenue: [200000, 210000, 220000, 230000, 240000, 250000],
      profit: [50000, 53000, 57000, 61000, 65000, 70000],
      costs: [150000, 157000, 163000, 169000, 175000, 180000],
      margin: [25, 25.2, 25.9, 26.5, 27.1, 28],
      inventory: [500000, 510000, 495000, 505000, 520000, 515000],
      salesGrowth: [8.2, 9.1, 10.3, 11.2, 11.8, 12.5]
    };
    
    // Generate recommendations
    const recommendations = [
      {
        title: 'Increase online marketing budget',
        description: 'Allocate additional 15% to online marketing channels to capitalize on high growth and conversion rates.',
        impact: 'Potential 8-12% increase in online sales',
        effort: 'Low',
        priority: 'high' as const,
        category: 'marketing'
      },
      {
        title: 'Renegotiate supplier contracts',
        description: 'Initiate negotiations with top 5 suppliers to secure volume discounts and mitigate rising material costs.',
        impact: 'Potential 3-5% reduction in material costs',
        effort: 'Medium',
        priority: 'high' as const,
        category: 'procurement'
      },
      {
        title: 'Standardize warehouse operations',
        description: 'Implement best practices from Warehouse B across all locations to improve efficiency.',
        impact: 'Potential 8-10% improvement in warehouse efficiency',
        effort: 'Medium',
        priority: 'medium' as const,
        category: 'operations'
      },
      {
        title: 'Implement IT spending controls',
        description: 'Establish improved approval workflows and spending thresholds for departmental IT purchases.',
        impact: 'Better cost control and 5-8% reduction in unplanned IT expenses',
        effort: 'Low',
        priority: 'medium' as const,
        category: 'finance'
      },
      {
        title: 'Expand product line in growing categories',
        description: 'Accelerate product development in categories showing >15% growth rates.',
        impact: 'Potential 10-15% revenue increase in target categories',
        effort: 'High',
        priority: 'high' as const,
        category: 'product'
      }
    ];
    
    return {
      financialKpis,
      operationalKpis,
      salesKpis,
      marketingKpis,
      insights,
      performanceTrends: {
        periods: trendPeriods,
        metrics
      },
      recommendations
    };
  }

  /**
   * Get business performance dashboard data
   * 
   * @param companyId Company ID
   * @returns Dashboard data with KPIs and key metrics
   */
  async getBusinessDashboardData(companyId: string): Promise<any> {
    console.log(`Getting business dashboard data for company ${companyId}`);
    
    // In a real implementation, this would aggregate key data from multiple sources
    // For demonstration, we'll create a comprehensive dashboard data object
    
    // Get key analysis results
    const costAnalysis = await this.analyzeCostCenters(companyId, 'Q1-2024');
    const profitAnalysis = await this.analyzeProfitCenters(companyId, 'Q1-2024');
    const performanceAnalysis = await this.analyzeBusinessPerformance(companyId, 'Q1-2024');
    
    // Extract top KPIs for dashboard
    const topKpis = [
      ...performanceAnalysis.financialKpis.slice(0, 2),
      ...performanceAnalysis.salesKpis.slice(0, 1),
      ...performanceAnalysis.operationalKpis.slice(0, 1)
    ];
    
    // Extract key trends
    const keyTrends = {
      revenue: performanceAnalysis.performanceTrends.metrics.revenue,
      profit: performanceAnalysis.performanceTrends.metrics.profit,
      margin: performanceAnalysis.performanceTrends.metrics.margin,
      salesGrowth: performanceAnalysis.performanceTrends.metrics.salesGrowth,
      periods: performanceAnalysis.performanceTrends.periods
    };
    
    // Extract top insights
    const topInsights = performanceAnalysis.insights
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 3);
    
    // Extract top recommendations
    const topRecommendations = performanceAnalysis.recommendations
      .filter(r => r.priority === 'high')
      .slice(0, 3);
    
    // Generate high-level business health score
    const healthScores = {
      overall: 76,
      financial: 78,
      operational: 82,
      sales: 74,
      marketing: 71
    };
    
    // Compile dashboard data
    return {
      companyId,
      asOfDate: new Date().toISOString(),
      healthScores,
      topKpis,
      keyTrends,
      topInsights,
      topRecommendations,
      financialSummary: {
        revenue: profitAnalysis.totalRevenue,
        costs: profitAnalysis.totalCosts,
        profit: profitAnalysis.grossProfit,
        margin: profitAnalysis.grossProfitMargin
      },
      costBreakdown: costAnalysis.costsByCategory,
      profitCenters: profitAnalysis.profitByProfitCenter.slice(0, 3),
      recentAlerts: [
        {
          id: 'alert-001',
          title: 'Budget Variance',
          message: 'Marketing department expenses exceeded budget by 12%',
          severity: 'warning',
          timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
          id: 'alert-002',
          title: 'Profit Margin Decline',
          message: 'Product line A showing 3% decline in profit margin month-over-month',
          severity: 'warning',
          timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        },
        {
          id: 'alert-003',
          title: 'Exceptional Sales Performance',
          message: 'Online sales channel exceeded targets by 18% this month',
          severity: 'info',
          timestamp: new Date(Date.now() - 259200000).toISOString() // 3 days ago
        }
      ]
    };
  }

  /**
   * Create a cost allocation
   * 
   * @param companyId Company ID
   * @param allocation Cost allocation data
   * @returns Created cost allocation
   */
  async createCostAllocation(companyId: string, allocation: Partial<CostAllocation>): Promise<CostAllocation> {
    console.log(`Creating cost allocation for company ${companyId}`);
    
    // In a real implementation, this would insert into the database
    // For demonstration, we return the created allocation
    
    const newAllocation: CostAllocation = {
      id: `ca-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: allocation.name || 'New Cost Allocation',
      description: allocation.description || null,
      companyId,
      sourceCostCenterId: allocation.sourceCostCenterId || '',
      targetCostCenterId: allocation.targetCostCenterId || '',
      allocationMethod: allocation.allocationMethod || 'percentage',
      allocationPercentage: allocation.allocationPercentage || null,
      allocationAmount: allocation.allocationAmount || null,
      allocationCurrency: allocation.allocationCurrency || 'RON',
      allocationPeriod: allocation.allocationPeriod || 'monthly',
      status: allocation.status || 'active',
      isRecurring: allocation.isRecurring !== undefined ? allocation.isRecurring : true,
      startDate: allocation.startDate || new Date(),
      endDate: allocation.endDate || null,
      lastRunDate: allocation.lastRunDate || null,
      nextRunDate: allocation.nextRunDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days in future
      createdBy: allocation.createdBy || 'system',
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return newAllocation;
  }

  /**
   * Create a business unit
   * 
   * @param companyId Company ID
   * @param businessUnit Business unit data
   * @returns Created business unit
   */
  async createBusinessUnit(companyId: string, businessUnit: Partial<BusinessUnit>): Promise<BusinessUnit> {
    console.log(`Creating business unit for company ${companyId}`);
    
    // In a real implementation, this would insert into the database
    // For demonstration, we return the created business unit
    
    const newBusinessUnit: BusinessUnit = {
      id: `bu-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: businessUnit.name || 'New Business Unit',
      description: businessUnit.description || null,
      companyId,
      type: businessUnit.type || 'department',
      parentId: businessUnit.parentId || null,
      path: businessUnit.path || `/${businessUnit.name?.toLowerCase().replace(/\s+/g, '-') || 'new-business-unit'}`,
      level: businessUnit.level || 1,
      costCenterIds: businessUnit.costCenterIds || [],
      managerUserId: businessUnit.managerUserId || null,
      settings: businessUnit.settings || null,
      createdBy: businessUnit.createdBy || 'system',
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return newBusinessUnit;
  }

  /**
   * Create a cost center
   * 
   * @param companyId Company ID
   * @param costCenter Cost center data
   * @returns Created cost center
   */
  async createCostCenter(companyId: string, costCenter: Partial<CostCenter>): Promise<CostCenter> {
    console.log(`Creating cost center for company ${companyId}`);
    
    // In a real implementation, this would insert into the database
    // For demonstration, we return the created cost center
    
    const newCostCenter: CostCenter = {
      id: `cc-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: costCenter.name || 'New Cost Center',
      description: costCenter.description || null,
      companyId,
      code: costCenter.code || `CC${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      type: costCenter.type || CostCenterType.DEPARTMENT,
      parentId: costCenter.parentId || null,
      path: costCenter.path || `/${costCenter.name?.toLowerCase().replace(/\s+/g, '-') || 'new-cost-center'}`,
      level: costCenter.level || 1,
      businessUnitId: costCenter.businessUnitId || null,
      budgetAmount: costCenter.budgetAmount || null,
      budgetCurrency: costCenter.budgetCurrency || 'RON',
      budgetPeriod: costCenter.budgetPeriod || 'quarterly',
      tags: costCenter.tags || [],
      isActive: costCenter.isActive !== undefined ? costCenter.isActive : true,
      createdBy: costCenter.createdBy || 'system',
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return newCostCenter;
  }

  /**
   * Run cost allocation process
   * 
   * @param companyId Company ID
   * @param period Period to run allocation for (e.g., 'March-2024')
   * @returns Allocation results
   */
  async runCostAllocation(companyId: string, period: string): Promise<any> {
    console.log(`Running cost allocation for company ${companyId} for period ${period}`);
    
    // In a real implementation, this would execute the allocation rules
    // For demonstration, we return sample results
    
    // Get allocations
    const allocations = await this.getCostAllocations(companyId);
    
    // Process each allocation
    const allocationResults = [];
    for (const allocation of allocations) {
      // Calculate allocated amount based on method
      let allocatedAmount;
      if (allocation.allocationMethod === 'percentage' && allocation.allocationPercentage) {
        // For demonstration, assume a base amount
        const baseAmount = 50000; // Would be fetched from actual source cost center total in real implementation
        allocatedAmount = Math.round(baseAmount * (allocation.allocationPercentage / 100));
      } else if (allocation.allocationMethod === 'fixed' && allocation.allocationAmount) {
        allocatedAmount = allocation.allocationAmount;
      } else {
        // Fallback
        allocatedAmount = 10000;
      }
      
      // Add to results
      allocationResults.push({
        allocationId: allocation.id,
        name: allocation.name,
        sourceCostCenterId: allocation.sourceCostCenterId,
        targetCostCenterId: allocation.targetCostCenterId,
        period,
        allocatedAmount,
        currency: allocation.allocationCurrency || 'RON',
        executedAt: new Date().toISOString(),
        status: 'completed'
      });
    }
    
    return {
      companyId,
      period,
      executedAt: new Date().toISOString(),
      totalAllocations: allocationResults.length,
      totalAllocatedAmount: allocationResults.reduce((sum, result) => sum + result.allocatedAmount, 0),
      currency: 'RON',
      allocations: allocationResults
    };
  }
}