/**
 * Analytics Service
 * 
 * This service provides core analytics capabilities for the Romanian ERP system.
 * It manages reports, dashboards, metrics, and alerts to help businesses monitor
 * and analyze their operations for better decision-making.
 */

import { eq, and, sql, desc, asc, or, like, inArray, isNull, isNotNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { DrizzleService } from '../../../common/drizzle';
import {
  analyticsReports,
  analyticsDashboards,
  analyticsMetrics,
  analyticsAlerts,
  alertHistory,
  Alert,
  Report,
  Dashboard,
  Metric,
  AlertHistory,
  InsertReport,
  InsertDashboard,
  InsertMetric,
  InsertAlert,
  InsertAlertHistory
} from '../schema/analytics.schema';
import { z } from 'zod';

/**
 * Report filter options
 */
export interface ReportFilter {
  companyId: string;
  type?: string;
  createdBy?: string;
  isPublic?: boolean;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Dashboard filter options
 */
export interface DashboardFilter {
  companyId: string;
  createdBy?: string;
  isPublic?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Metric filter options
 */
export interface MetricFilter {
  companyId: string;
  type?: string;
  createdBy?: string;
  search?: string;
  periodStart?: string;
  periodEnd?: string;
  metricTypes?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Alert filter options
 */
export interface AlertFilter {
  companyId: string;
  severity?: string;
  status?: string;
  createdBy?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Report with query results
 */
export interface ReportWithResults {
  id: string;
  name: string;
  description: string | null;
  type: string;
  parameters: any | null;
  result: any | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

/**
 * Dashboard with components
 */
export interface DashboardWithComponents {
  id: string;
  name: string;
  description: string | null;
  layout: any | null;
  data: any | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  reports: Report[];
}

/**
 * Analytics service implementation
 */
export class AnalyticsService {
  constructor(private readonly drizzleService: DrizzleService) {}

  /**
   * Create a new report
   * 
   * @param report Report data
   * @returns Created report
   */
  async createReport(report: InsertReport): Promise<Report> {
    try {
      console.log(`Creating report: ${report.name} for company ${report.companyId}`);
      
      const [createdReport] = await this.drizzleService.getDbInstance().insert(analyticsReports).values({
        id: uuidv4(),
        name: report.name,
        description: report.description || null,
        companyId: report.companyId,
        type: report.type,
        parameters: report.parameters || null,
        result: report.result || null,
        dashboardId: report.dashboardId || null,
        isPublic: report.isPublic || false,
        schedule: report.schedule || null,
        createdBy: report.createdBy,
        updatedBy: report.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return createdReport;
    } catch (error) {
      console.error('Error creating report:', error);
      throw new Error(`Failed to create report: ${error}`);
    }
  }

  /**
   * Update a report
   * 
   * @param id Report ID
   * @param report Updated report data
   * @returns Updated report
   */
  async updateReport(id: string, report: Partial<Report>): Promise<Report> {
    try {
      console.log(`Updating report: ${id}`);
      
      const [updatedReport] = await this.drizzleService.getDbInstance().update(analyticsReports)
        .set({
          ...report,
          updatedAt: new Date()
        })
        .where(eq(analyticsReports.id, id))
        .returning();
      
      if (!updatedReport) {
        throw new Error(`Report with ID ${id} not found`);
      }
      
      return updatedReport;
    } catch (error) {
      console.error(`Error updating report ${id}:`, error);
      throw new Error(`Failed to update report: ${error}`);
    }
  }

  /**
   * Get a report by ID
   * 
   * @param id Report ID
   * @returns Report
   */
  async getReportById(id: string): Promise<Report> {
    try {
      console.log(`Getting report: ${id}`);
      
      const report = await this.drizzleService.getDbInstance().query.analyticsReports.findFirst({
        where: eq(analyticsReports.id, id)
      });
      
      if (!report) {
        throw new Error(`Report with ID ${id} not found`);
      }
      
      return report;
    } catch (error) {
      console.error(`Error getting report ${id}:`, error);
      throw new Error(`Failed to get report: ${error}`);
    }
  }

  /**
   * Delete a report
   * 
   * @param id Report ID
   * @returns Success flag
   */
  async deleteReport(id: string): Promise<boolean> {
    try {
      console.log(`Deleting report: ${id}`);
      
      // First check if report exists
      const report = await this.getReportById(id);
      
      // Delete the report
      await this.drizzleService.getDbInstance().delete(analyticsReports)
        .where(eq(analyticsReports.id, id));
      
      return true;
    } catch (error) {
      console.error(`Error deleting report ${id}:`, error);
      throw new Error(`Failed to delete report: ${error}`);
    }
  }

  /**
   * Get reports based on filter criteria
   * 
   * @param filter Filter options
   * @returns Filtered reports
   */
  async getReports(filter: ReportFilter): Promise<Report[]> {
    try {
      console.log(`Getting reports for company ${filter.companyId}`);
      
      let query = this.drizzleService.getDbInstance()
        .select()
        .from(analyticsReports)
        .where(eq(analyticsReports.companyId, filter.companyId));
      
      if (filter.type) {
        query = query.where(eq(analyticsReports.type, filter.type as any));
      }
      
      if (filter.createdBy) {
        query = query.where(eq(analyticsReports.createdBy, filter.createdBy));
      }
      
      if (filter.isPublic !== undefined) {
        query = query.where(eq(analyticsReports.isPublic, filter.isPublic));
      }
      
      if (filter.search) {
        query = query.where(
          or(
            like(analyticsReports.name, `%${filter.search}%`),
            like(analyticsReports.description || '', `%${filter.search}%`)
          )
        );
      }
      
      if (filter.dateFrom) {
        query = query.where(
          sql`${analyticsReports.createdAt} >= ${filter.dateFrom}`
        );
      }
      
      if (filter.dateTo) {
        query = query.where(
          sql`${analyticsReports.createdAt} <= ${filter.dateTo}`
        );
      }
      
      // Apply pagination
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      
      if (filter.offset) {
        query = query.offset(filter.offset);
      }
      
      // Sort by creation date descending (newest first)
      query = query.orderBy(desc(analyticsReports.createdAt));
      
      const reports = await query;
      
      return reports;
    } catch (error) {
      console.error('Error getting reports:', error);
      throw new Error(`Failed to get reports: ${error}`);
    }
  }

  /**
   * Execute a report to get results
   * 
   * @param id Report ID
   * @param parameters Optional execution parameters
   * @returns Report with results
   */
  async executeReport(id: string, parameters?: any): Promise<ReportWithResults> {
    try {
      console.log(`Executing report: ${id}`);
      
      // Get the report
      const report = await this.getReportById(id);
      
      // Parse existing parameters
      const existingParams = report.parameters ? JSON.parse(report.parameters) : {};
      
      // Merge with new parameters if provided
      const mergedParams = parameters 
        ? { ...existingParams, ...parameters }
        : existingParams;
      
      // Execute report based on type
      let result: any;
      
      switch (report.type) {
        case 'sales':
          result = await this.executeSalesAnalysis(mergedParams);
          break;
        case 'inventory':
          result = await this.executeInventoryAnalysis(mergedParams);
          break;
        case 'financial':
          result = await this.executeFinancialAnalysis(mergedParams);
          break;
        case 'customer_insights':
          result = await this.executeCustomerAnalysis(mergedParams);
          break;
        default:
          result = await this.executeGenericReport(report.type, mergedParams);
      }
      
      // Update report with new results
      const [updatedReport] = await this.drizzleService.getDbInstance().update(analyticsReports)
        .set({
          result: JSON.stringify(result),
          parameters: JSON.stringify(mergedParams),
          updatedAt: new Date()
        })
        .where(eq(analyticsReports.id, id))
        .returning();
      
      return {
        ...updatedReport,
        parameters: mergedParams,
        result
      };
    } catch (error) {
      console.error(`Error executing report ${id}:`, error);
      throw new Error(`Failed to execute report: ${error}`);
    }
  }

  /**
   * Execute sales analysis
   * 
   * @param parameters Analysis parameters
   * @returns Analysis results
   */
  private async executeSalesAnalysis(parameters: any): Promise<any> {
    // In a real implementation, this would query sales data and perform analysis
    // For demonstration, we return sample results
    return {
      totalSales: 1250000,
      salesByProduct: [
        { name: 'Product A', value: 450000, percentage: 36 },
        { name: 'Product B', value: 320000, percentage: 25.6 },
        { name: 'Product C', value: 280000, percentage: 22.4 },
        { name: 'Other Products', value: 200000, percentage: 16 }
      ],
      salesByChannel: [
        { name: 'Direct', value: 650000, percentage: 52 },
        { name: 'Online', value: 375000, percentage: 30 },
        { name: 'Partners', value: 225000, percentage: 18 }
      ],
      salesByPeriod: [
        { period: 'Jan', value: 95000 },
        { period: 'Feb', value: 88000 },
        { period: 'Mar', value: 102000 },
        { period: 'Apr', value: 110000 },
        { period: 'May', value: 115000 },
        { period: 'Jun', value: 120000 }
      ],
      topCustomers: [
        { name: 'Customer A', value: 185000 },
        { name: 'Customer B', value: 142000 },
        { name: 'Customer C', value: 118000 },
        { name: 'Customer D', value: 95000 },
        { name: 'Customer E', value: 82000 }
      ]
    };
  }

  /**
   * Execute inventory analysis
   * 
   * @param parameters Analysis parameters
   * @returns Analysis results
   */
  private async executeInventoryAnalysis(parameters: any): Promise<any> {
    // In a real implementation, this would query inventory data and perform analysis
    // For demonstration, we return sample results
    return {
      totalValue: 850000,
      stockTurnover: 4.2,
      stockByCategory: [
        { name: 'Raw Materials', value: 320000, percentage: 37.6 },
        { name: 'Work in Progress', value: 180000, percentage: 21.2 },
        { name: 'Finished Products', value: 350000, percentage: 41.2 }
      ],
      stockByWarehouse: [
        { name: 'Main Warehouse', value: 520000, percentage: 61.2 },
        { name: 'Secondary Warehouse', value: 210000, percentage: 24.7 },
        { name: 'Distribution Center', value: 120000, percentage: 14.1 }
      ],
      lowStockItems: [
        { name: 'Item A', currentStock: 12, reorderPoint: 20, daysUntilStockout: 6 },
        { name: 'Item B', currentStock: 8, reorderPoint: 15, daysUntilStockout: 4 },
        { name: 'Item C', currentStock: 25, reorderPoint: 30, daysUntilStockout: 8 }
      ],
      overStockItems: [
        { name: 'Item D', currentStock: 150, optimalStock: 80, excessValue: 28000 },
        { name: 'Item E', currentStock: 85, optimalStock: 50, excessValue: 21000 },
        { name: 'Item F', currentStock: 120, optimalStock: 75, excessValue: 18000 }
      ]
    };
  }

  /**
   * Execute financial analysis
   * 
   * @param parameters Analysis parameters
   * @returns Analysis results
   */
  private async executeFinancialAnalysis(parameters: any): Promise<any> {
    // In a real implementation, this would query financial data and perform analysis
    // For demonstration, we return sample results
    return {
      profitAndLoss: {
        revenue: 2500000,
        costOfSales: 1500000,
        grossProfit: 1000000,
        operatingExpenses: 650000,
        operatingProfit: 350000,
        otherIncome: 25000,
        otherExpenses: 75000,
        netProfit: 300000
      },
      cashFlow: {
        operatingCashFlow: 420000,
        investingCashFlow: -180000,
        financingCashFlow: -50000,
        netCashFlow: 190000
      },
      financialRatios: {
        currentRatio: 2.1,
        quickRatio: 1.5,
        debtToEquity: 0.35,
        returnOnAssets: 0.12,
        returnOnEquity: 0.18,
        grossMargin: 0.4,
        netMargin: 0.12
      },
      keyMetrics: [
        { period: 'Jan', revenue: 400000, expenses: 320000, profit: 80000 },
        { period: 'Feb', revenue: 380000, expenses: 310000, profit: 70000 },
        { period: 'Mar', revenue: 420000, expenses: 325000, profit: 95000 },
        { period: 'Apr', revenue: 410000, expenses: 335000, profit: 75000 },
        { period: 'May', revenue: 435000, expenses: 340000, profit: 95000 },
        { period: 'Jun', revenue: 455000, expenses: 350000, profit: 105000 }
      ]
    };
  }

  /**
   * Execute customer analysis
   * 
   * @param parameters Analysis parameters
   * @returns Analysis results
   */
  private async executeCustomerAnalysis(parameters: any): Promise<any> {
    // In a real implementation, this would query customer data and perform analysis
    // For demonstration, we return sample results
    return {
      customerSegmentation: [
        { segment: 'High-Value', count: 35, percentage: 7, revenue: 820000 },
        { segment: 'Regular', count: 220, percentage: 44, revenue: 980000 },
        { segment: 'Occasional', count: 185, percentage: 37, revenue: 350000 },
        { segment: 'New', count: 60, percentage: 12, revenue: 120000 }
      ],
      customerLifetimeValue: {
        average: 48000,
        bySegment: [
          { segment: 'High-Value', value: 185000 },
          { segment: 'Regular', value: 42000 },
          { segment: 'Occasional', value: 18500 },
          { segment: 'New', value: 8200 }
        ]
      },
      customerRetention: {
        overallRate: 0.78,
        bySegment: [
          { segment: 'High-Value', rate: 0.92 },
          { segment: 'Regular', rate: 0.85 },
          { segment: 'Occasional', rate: 0.65 },
          { segment: 'New', rate: 0.45 }
        ]
      },
      customerAcquisition: {
        newCustomers: 60,
        acquisitionCost: 18000,
        costPerCustomer: 300,
        byChannel: [
          { channel: 'Referral', count: 22, cost: 4400 },
          { channel: 'Marketing', count: 28, cost: 9800 },
          { channel: 'Sales', count: 10, cost: 3800 }
        ]
      }
    };
  }

  /**
   * Execute generic report
   * 
   * @param type Report type
   * @param parameters Report parameters
   * @returns Report results
   */
  private async executeGenericReport(type: string, parameters: any): Promise<any> {
    // In a real implementation, this would handle custom report types
    // For demonstration, we return a simple result
    return {
      reportType: type,
      executedAt: new Date().toISOString(),
      summary: "Generic report execution",
      parameters: parameters,
      metrics: {
        metric1: Math.round(Math.random() * 1000),
        metric2: Math.round(Math.random() * 500),
        metric3: Math.round(Math.random() * 100)
      }
    };
  }

  /**
   * Create a new dashboard
   * 
   * @param dashboard Dashboard data
   * @returns Created dashboard
   */
  async createDashboard(dashboard: InsertDashboard): Promise<Dashboard> {
    try {
      console.log(`Creating dashboard: ${dashboard.name} for company ${dashboard.companyId}`);
      
      const [createdDashboard] = await this.drizzleService.getDbInstance().insert(analyticsDashboards).values({
        id: uuidv4(),
        name: dashboard.name,
        description: dashboard.description || null,
        companyId: dashboard.companyId,
        layout: dashboard.layout || null,
        data: dashboard.data || null,
        isPublic: dashboard.isPublic || false,
        thumbnailUrl: dashboard.thumbnailUrl || null,
        createdBy: dashboard.createdBy,
        updatedBy: dashboard.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return createdDashboard;
    } catch (error) {
      console.error('Error creating dashboard:', error);
      throw new Error(`Failed to create dashboard: ${error}`);
    }
  }

  /**
   * Update a dashboard
   * 
   * @param id Dashboard ID
   * @param dashboard Updated dashboard data
   * @returns Updated dashboard
   */
  async updateDashboard(id: string, dashboard: Partial<Dashboard>): Promise<Dashboard> {
    try {
      console.log(`Updating dashboard: ${id}`);
      
      const [updatedDashboard] = await this.drizzleService.getDbInstance().update(analyticsDashboards)
        .set({
          ...dashboard,
          updatedAt: new Date()
        })
        .where(eq(analyticsDashboards.id, id))
        .returning();
      
      if (!updatedDashboard) {
        throw new Error(`Dashboard with ID ${id} not found`);
      }
      
      return updatedDashboard;
    } catch (error) {
      console.error(`Error updating dashboard ${id}:`, error);
      throw new Error(`Failed to update dashboard: ${error}`);
    }
  }

  /**
   * Get a dashboard by ID
   * 
   * @param id Dashboard ID
   * @returns Dashboard with its reports
   */
  async getDashboardById(id: string): Promise<DashboardWithComponents> {
    try {
      console.log(`Getting dashboard: ${id}`);
      
      const dashboard = await this.drizzleService.getDbInstance().query.analyticsDashboards.findFirst({
        where: eq(analyticsDashboards.id, id),
        with: {
          reports: true
        }
      });
      
      if (!dashboard) {
        throw new Error(`Dashboard with ID ${id} not found`);
      }
      
      return dashboard as DashboardWithComponents;
    } catch (error) {
      console.error(`Error getting dashboard ${id}:`, error);
      throw new Error(`Failed to get dashboard: ${error}`);
    }
  }

  /**
   * Delete a dashboard
   * 
   * @param id Dashboard ID
   * @returns Success flag
   */
  async deleteDashboard(id: string): Promise<boolean> {
    try {
      console.log(`Deleting dashboard: ${id}`);
      
      // First check if dashboard exists
      const dashboard = await this.drizzleService.getDbInstance().query.analyticsDashboards.findFirst({
        where: eq(analyticsDashboards.id, id)
      });
      
      if (!dashboard) {
        throw new Error(`Dashboard with ID ${id} not found`);
      }
      
      // First update any reports linked to this dashboard
      await this.drizzleService.getDbInstance().update(analyticsReports)
        .set({ dashboardId: null })
        .where(eq(analyticsReports.dashboardId, id));
      
      // Then delete the dashboard
      await this.drizzleService.getDbInstance().delete(analyticsDashboards)
        .where(eq(analyticsDashboards.id, id));
      
      return true;
    } catch (error) {
      console.error(`Error deleting dashboard ${id}:`, error);
      throw new Error(`Failed to delete dashboard: ${error}`);
    }
  }

  /**
   * Get dashboards based on filter criteria
   * 
   * @param filter Filter options
   * @returns Filtered dashboards
   */
  async getDashboards(filter: DashboardFilter): Promise<Dashboard[]> {
    try {
      console.log(`Getting dashboards for company ${filter.companyId}`);
      
      let query = this.drizzleService.getDbInstance()
        .select()
        .from(analyticsDashboards)
        .where(eq(analyticsDashboards.companyId, filter.companyId));
      
      if (filter.createdBy) {
        query = query.where(eq(analyticsDashboards.createdBy, filter.createdBy));
      }
      
      if (filter.isPublic !== undefined) {
        query = query.where(eq(analyticsDashboards.isPublic, filter.isPublic));
      }
      
      if (filter.search) {
        query = query.where(
          or(
            like(analyticsDashboards.name, `%${filter.search}%`),
            like(analyticsDashboards.description || '', `%${filter.search}%`)
          )
        );
      }
      
      // Apply pagination
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      
      if (filter.offset) {
        query = query.offset(filter.offset);
      }
      
      // Sort by creation date descending (newest first)
      query = query.orderBy(desc(analyticsDashboards.createdAt));
      
      const dashboards = await query;
      
      return dashboards;
    } catch (error) {
      console.error('Error getting dashboards:', error);
      throw new Error(`Failed to get dashboards: ${error}`);
    }
  }

  /**
   * Add a report to a dashboard
   * 
   * @param dashboardId Dashboard ID
   * @param reportId Report ID
   * @returns Updated report
   */
  async addReportToDashboard(dashboardId: string, reportId: string): Promise<Report> {
    try {
      console.log(`Adding report ${reportId} to dashboard ${dashboardId}`);
      
      // First check if dashboard exists
      const dashboard = await this.drizzleService.getDbInstance().query.analyticsDashboards.findFirst({
        where: eq(analyticsDashboards.id, dashboardId)
      });
      
      if (!dashboard) {
        throw new Error(`Dashboard with ID ${dashboardId} not found`);
      }
      
      // Check if report exists
      const report = await this.drizzleService.getDbInstance().query.analyticsReports.findFirst({
        where: eq(analyticsReports.id, reportId)
      });
      
      if (!report) {
        throw new Error(`Report with ID ${reportId} not found`);
      }
      
      // Update report with dashboard ID
      const [updatedReport] = await this.drizzleService.getDbInstance().update(analyticsReports)
        .set({
          dashboardId,
          updatedAt: new Date()
        })
        .where(eq(analyticsReports.id, reportId))
        .returning();
      
      return updatedReport;
    } catch (error) {
      console.error(`Error adding report ${reportId} to dashboard ${dashboardId}:`, error);
      throw new Error(`Failed to add report to dashboard: ${error}`);
    }
  }

  /**
   * Remove a report from a dashboard
   * 
   * @param reportId Report ID
   * @returns Updated report
   */
  async removeReportFromDashboard(reportId: string): Promise<Report> {
    try {
      console.log(`Removing report ${reportId} from its dashboard`);
      
      // Check if report exists
      const report = await this.drizzleService.getDbInstance().query.analyticsReports.findFirst({
        where: eq(analyticsReports.id, reportId)
      });
      
      if (!report) {
        throw new Error(`Report with ID ${reportId} not found`);
      }
      
      if (!report.dashboardId) {
        // Report is not on a dashboard, nothing to do
        return report;
      }
      
      // Update report to remove dashboard ID
      const [updatedReport] = await this.drizzleService.getDbInstance().update(analyticsReports)
        .set({
          dashboardId: null,
          updatedAt: new Date()
        })
        .where(eq(analyticsReports.id, reportId))
        .returning();
      
      return updatedReport;
    } catch (error) {
      console.error(`Error removing report ${reportId} from dashboard:`, error);
      throw new Error(`Failed to remove report from dashboard: ${error}`);
    }
  }

  /**
   * Create a new metric
   * 
   * @param metric Metric data
   * @returns Created metric
   */
  async createMetric(metric: InsertMetric): Promise<Metric> {
    try {
      console.log(`Creating metric: ${metric.name} for company ${metric.companyId}`);
      
      const [createdMetric] = await this.drizzleService.getDbInstance().insert(analyticsMetrics).values({
        id: uuidv4(),
        name: metric.name,
        description: metric.description || null,
        companyId: metric.companyId,
        type: metric.type,
        unit: metric.unit || null,
        format: metric.format || null,
        aggregationType: metric.aggregationType || null,
        source: metric.source || null,
        query: metric.query || null,
        parameters: metric.parameters || null,
        schedule: metric.schedule || null,
        createdBy: metric.createdBy,
        updatedBy: metric.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return createdMetric;
    } catch (error) {
      console.error('Error creating metric:', error);
      throw new Error(`Failed to create metric: ${error}`);
    }
  }

  /**
   * Update a metric
   * 
   * @param id Metric ID
   * @param metric Updated metric data
   * @returns Updated metric
   */
  async updateMetric(id: string, metric: Partial<Metric>): Promise<Metric> {
    try {
      console.log(`Updating metric: ${id}`);
      
      const [updatedMetric] = await this.drizzleService.getDbInstance().update(analyticsMetrics)
        .set({
          ...metric,
          updatedAt: new Date()
        })
        .where(eq(analyticsMetrics.id, id))
        .returning();
      
      if (!updatedMetric) {
        throw new Error(`Metric with ID ${id} not found`);
      }
      
      return updatedMetric;
    } catch (error) {
      console.error(`Error updating metric ${id}:`, error);
      throw new Error(`Failed to update metric: ${error}`);
    }
  }

  /**
   * Get a metric by ID
   * 
   * @param id Metric ID
   * @returns Metric
   */
  async getMetricById(id: string): Promise<Metric> {
    try {
      console.log(`Getting metric: ${id}`);
      
      const metric = await this.drizzleService.getDbInstance().query.analyticsMetrics.findFirst({
        where: eq(analyticsMetrics.id, id)
      });
      
      if (!metric) {
        throw new Error(`Metric with ID ${id} not found`);
      }
      
      return metric;
    } catch (error) {
      console.error(`Error getting metric ${id}:`, error);
      throw new Error(`Failed to get metric: ${error}`);
    }
  }

  /**
   * Delete a metric
   * 
   * @param id Metric ID
   * @returns Success flag
   */
  async deleteMetric(id: string): Promise<boolean> {
    try {
      console.log(`Deleting metric: ${id}`);
      
      // Check if metric exists
      const metric = await this.drizzleService.getDbInstance().query.analyticsMetrics.findFirst({
        where: eq(analyticsMetrics.id, id)
      });
      
      if (!metric) {
        throw new Error(`Metric with ID ${id} not found`);
      }
      
      // Delete dependent alerts first
      await this.drizzleService.getDbInstance().delete(analyticsAlerts)
        .where(eq(analyticsAlerts.metricId, id));
      
      // Delete the metric
      await this.drizzleService.getDbInstance().delete(analyticsMetrics)
        .where(eq(analyticsMetrics.id, id));
      
      return true;
    } catch (error) {
      console.error(`Error deleting metric ${id}:`, error);
      throw new Error(`Failed to delete metric: ${error}`);
    }
  }

  /**
   * Get metrics based on filter criteria
   * 
   * @param filter Filter options
   * @returns Filtered metrics
   */
  async getMetrics(filter: MetricFilter): Promise<Metric[]> {
    try {
      console.log(`Getting metrics for company ${filter.companyId}`);
      
      let query = this.drizzleService.getDbInstance()
        .select()
        .from(analyticsMetrics)
        .where(eq(analyticsMetrics.companyId, filter.companyId));
      
      if (filter.type) {
        query = query.where(eq(analyticsMetrics.type, filter.type));
      }
      
      // Note: analyticsMetrics table doesn't have createdBy column
      // if (filter.createdBy) {
      //   query = query.where(eq(analyticsMetrics.createdBy, filter.createdBy));
      // }
      
      if (filter.search) {
        query = query.where(
          or(
            like(analyticsMetrics.name, `%${filter.search}%`),
            like(analyticsMetrics.description || '', `%${filter.search}%`)
          )
        );
      }
      
      // Apply pagination
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      
      if (filter.offset) {
        query = query.offset(filter.offset);
      }
      
      // Sort by name ascending
      query = query.orderBy(asc(analyticsMetrics.name));
      
      const metrics = await query;
      
      return metrics;
    } catch (error) {
      console.error('Error getting metrics:', error);
      throw new Error(`Failed to get metrics: ${error}`);
    }
  }

  /**
   * Calculate metric value
   * 
   * @param id Metric ID
   * @param parameters Optional calculation parameters
   * @returns Calculated value
   */
  async calculateMetricValue(id: string, parameters?: any): Promise<any> {
    try {
      console.log(`Calculating value for metric: ${id}`);
      
      // Get the metric
      const metric = await this.getMetricById(id);
      
      // Parse existing parameters from metadata
      const existingParams = metric.metadata ? JSON.parse(metric.metadata) : {};
      
      // Merge with new parameters if provided
      const mergedParams = parameters 
        ? { ...existingParams, ...parameters }
        : existingParams;
      
      // Calculate value based on metric type
      let value: any;
      
      switch (metric.type) {
        case 'sales':
          value = await this.calculateSalesMetric(metric, mergedParams);
          break;
        case 'inventory':
          value = await this.calculateInventoryMetric(metric, mergedParams);
          break;
        case 'financial':
          value = await this.calculateFinancialMetric(metric, mergedParams);
          break;
        case 'operational':
          value = await this.calculateOperationalMetric(metric, mergedParams);
          break;
        default:
          value = await this.calculateGenericMetric(metric, mergedParams);
      }
      
      return {
        metricId: id,
        name: metric.name,
        value,
        unit: metric.unit,
        calculatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error calculating metric value ${id}:`, error);
      throw new Error(`Failed to calculate metric value: ${error}`);
    }
  }

  /**
   * Calculate sales metric
   */
  private async calculateSalesMetric(metric: Metric, parameters: any): Promise<any> {
    // In a real implementation, this would query sales data
    // For demonstration, we return sample values
    const metricName = metric.name.toLowerCase();
    
    if (metricName.includes('revenue') || metricName.includes('sales')) {
      return Math.round(500000 + Math.random() * 100000);
    } else if (metricName.includes('growth')) {
      return parseFloat((0.05 + Math.random() * 0.1).toFixed(3));
    } else if (metricName.includes('conversion')) {
      return parseFloat((0.25 + Math.random() * 0.15).toFixed(3));
    } else if (metricName.includes('order') && metricName.includes('value')) {
      return Math.round(200 + Math.random() * 300);
    } else {
      return Math.round(Math.random() * 1000);
    }
  }

  /**
   * Calculate inventory metric
   */
  private async calculateInventoryMetric(metric: Metric, parameters: any): Promise<any> {
    // In a real implementation, this would query inventory data
    // For demonstration, we return sample values
    const metricName = metric.name.toLowerCase();
    
    if (metricName.includes('value')) {
      return Math.round(800000 + Math.random() * 200000);
    } else if (metricName.includes('turnover') || metricName.includes('rotation')) {
      return parseFloat((4 + Math.random() * 2).toFixed(2));
    } else if (metricName.includes('days') && metricName.includes('inventory')) {
      return Math.round(30 + Math.random() * 20);
    } else if (metricName.includes('stock') && metricName.includes('out')) {
      return Math.round(Math.random() * 5);
    } else {
      return Math.round(Math.random() * 1000);
    }
  }

  /**
   * Calculate financial metric
   */
  private async calculateFinancialMetric(metric: Metric, parameters: any): Promise<any> {
    // In a real implementation, this would query financial data
    // For demonstration, we return sample values
    const metricName = metric.name.toLowerCase();
    
    if (metricName.includes('profit') && metricName.includes('gross')) {
      return parseFloat((0.35 + Math.random() * 0.15).toFixed(3));
    } else if (metricName.includes('profit') && metricName.includes('net')) {
      return parseFloat((0.12 + Math.random() * 0.08).toFixed(3));
    } else if (metricName.includes('cashflow') || metricName.includes('cash flow')) {
      return Math.round(200000 + Math.random() * 100000);
    } else if (metricName.includes('debt') && metricName.includes('equity')) {
      return parseFloat((0.4 + Math.random() * 0.3).toFixed(2));
    } else {
      return Math.round(Math.random() * 1000);
    }
  }

  /**
   * Calculate operational metric
   */
  private async calculateOperationalMetric(metric: Metric, parameters: any): Promise<any> {
    // In a real implementation, this would query operational data
    // For demonstration, we return sample values
    const metricName = metric.name.toLowerCase();
    
    if (metricName.includes('efficiency')) {
      return parseFloat((0.75 + Math.random() * 0.2).toFixed(3));
    } else if (metricName.includes('utilization')) {
      return parseFloat((0.65 + Math.random() * 0.25).toFixed(3));
    } else if (metricName.includes('defect') || metricName.includes('error')) {
      return parseFloat((0.02 + Math.random() * 0.03).toFixed(3));
    } else if (metricName.includes('performance')) {
      return parseFloat((0.8 + Math.random() * 0.15).toFixed(3));
    } else {
      return Math.round(Math.random() * 1000);
    }
  }

  /**
   * Calculate generic metric
   */
  private async calculateGenericMetric(metric: Metric, parameters: any): Promise<any> {
    // In a real implementation, this would handle custom metric calculations
    // For demonstration, we return a random value
    return Math.round(Math.random() * 1000);
  }

  /**
   * Create a new alert
   * 
   * @param alert Alert data
   * @returns Created alert
   */
  async createAlert(alert: InsertAlert): Promise<Alert> {
    try {
      console.log(`Creating alert: ${alert.name} for company ${alert.companyId}`);
      
      // Check if metric exists if a metric ID is provided
      if (alert.metricId) {
        const metric = await this.drizzleService.getDbInstance().query.analyticsMetrics.findFirst({
          where: eq(analyticsMetrics.id, alert.metricId)
        });
        
        if (!metric) {
          throw new Error(`Metric with ID ${alert.metricId} not found`);
        }
      }
      
      // Check if report exists if a report ID is provided
      if (alert.reportId) {
        const report = await this.drizzleService.getDbInstance().query.analyticsReports.findFirst({
          where: eq(analyticsReports.id, alert.reportId)
        });
        
        if (!report) {
          throw new Error(`Report with ID ${alert.reportId} not found`);
        }
      }
      
      const [createdAlert] = await this.drizzleService.getDbInstance().insert(analyticsAlerts).values({
        id: uuidv4(),
        name: alert.name,
        description: alert.description || null,
        companyId: alert.companyId,
        severity: alert.severity || 'medium',
        condition: alert.condition || null,
        threshold: alert.threshold || null,
        source: alert.source || null,
        metricId: alert.metricId || null,
        reportId: alert.reportId || null,
        value: alert.value || null,
        message: alert.message || null,
        notificationChannels: alert.notificationChannels || null,
        createdBy: alert.createdBy,
        updatedBy: alert.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return createdAlert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw new Error(`Failed to create alert: ${error}`);
    }
  }

  /**
   * Update an alert
   * 
   * @param id Alert ID
   * @param alert Updated alert data
   * @returns Updated alert
   */
  async updateAlert(id: string, alert: Partial<Alert>): Promise<Alert> {
    try {
      console.log(`Updating alert: ${id}`);
      
      const [updatedAlert] = await this.drizzleService.getDbInstance().update(analyticsAlerts)
        .set({
          ...alert,
          updatedAt: new Date()
        })
        .where(eq(analyticsAlerts.id, id))
        .returning();
      
      if (!updatedAlert) {
        throw new Error(`Alert with ID ${id} not found`);
      }
      
      return updatedAlert;
    } catch (error) {
      console.error(`Error updating alert ${id}:`, error);
      throw new Error(`Failed to update alert: ${error}`);
    }
  }

  /**
   * Get an alert by ID
   * 
   * @param id Alert ID
   * @returns Alert
   */
  async getAlertById(id: string): Promise<Alert> {
    try {
      console.log(`Getting alert: ${id}`);
      
      const alert = await this.drizzleService.getDbInstance().query.analyticsAlerts.findFirst({
        where: eq(analyticsAlerts.id, id),
        with: {
          metric: true,
          report: true
        }
      });
      
      if (!alert) {
        throw new Error(`Alert with ID ${id} not found`);
      }
      
      return alert;
    } catch (error) {
      console.error(`Error getting alert ${id}:`, error);
      throw new Error(`Failed to get alert: ${error}`);
    }
  }

  /**
   * Delete an alert
   * 
   * @param id Alert ID
   * @returns Success flag
   */
  async deleteAlert(id: string): Promise<boolean> {
    try {
      console.log(`Deleting alert: ${id}`);
      
      // Check if alert exists
      const alert = await this.drizzleService.getDbInstance().query.analyticsAlerts.findFirst({
        where: eq(analyticsAlerts.id, id)
      });
      
      if (!alert) {
        throw new Error(`Alert with ID ${id} not found`);
      }
      
      // Delete alert history records first
      await this.drizzleService.getDbInstance().delete(alertHistory)
        .where(eq(alertHistory.alertId, id));
      
      // Delete the alert
      await this.drizzleService.getDbInstance().delete(analyticsAlerts)
        .where(eq(analyticsAlerts.id, id));
      
      return true;
    } catch (error) {
      console.error(`Error deleting alert ${id}:`, error);
      throw new Error(`Failed to delete alert: ${error}`);
    }
  }

  /**
   * Get alerts based on filter criteria
   * 
   * @param filter Filter options
   * @returns Filtered alerts
   */
  async getAlerts(filter: AlertFilter): Promise<Alert[]> {
    try {
      console.log(`Getting alerts for company ${filter.companyId}`);
      
      let query = this.drizzleService.getDbInstance()
        .select()
        .from(analyticsAlerts)
        .where(eq(analyticsAlerts.companyId, filter.companyId));
      
      if (filter.severity) {
        query = query.where(eq(analyticsAlerts.severity, filter.severity as any));
      }
      
      if (filter.createdBy) {
        query = query.where(eq(analyticsAlerts.createdBy, filter.createdBy));
      }
      
      if (filter.search) {
        query = query.where(
          or(
            like(analyticsAlerts.name, `%${filter.search}%`),
            like(analyticsAlerts.description || '', `%${filter.search}%`)
          )
        );
      }
      
      // Apply pagination
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      
      if (filter.offset) {
        query = query.offset(filter.offset);
      }
      
      // Sort by severity (critical first) and then creation date (newest first)
      const alerts = await query;
      
      // Sort by severity manually since we're using an enum
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      
      return alerts.sort((a: any, b: any) => {
        const severityA = a.severity as keyof typeof severityOrder;
        const severityB = b.severity as keyof typeof severityOrder;
        
        // First by severity
        const severityCompare = severityOrder[severityA] - severityOrder[severityB];
        if (severityCompare !== 0) {
          return severityCompare;
        }
        
        // Then by creation date (newest first)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    } catch (error) {
      console.error('Error getting alerts:', error);
      throw new Error(`Failed to get alerts: ${error}`);
    }
  }

  /**
   * Trigger an alert
   * 
   * @param alertId Alert ID
   * @param value Trigger value
   * @param message Optional message
   * @returns Created alert history record
   */
  async triggerAlert(alertId: string, value: any, message?: string): Promise<AlertHistory> {
    try {
      console.log(`Triggering alert: ${alertId}`);
      
      // Get the alert
      const alert = await this.getAlertById(alertId);
      
      // Create history record
      const [historyRecord] = await this.drizzleService.getDbInstance().insert(alertHistory).values({
        id: uuidv4(),
        alertId,
        companyId: alert.companyId,
        triggeredAt: new Date(),
        value: typeof value === 'string' ? value : JSON.stringify(value),
        message: message || null,
        status: 'triggered',
        notificationSent: false,
        notificationChannels: alert.notificationChannels,
        createdBy: alert.createdBy
      }).returning();
      
      // In a real implementation, you would send notifications here
      // For demonstration, we just update the record
      const [updatedRecord] = await this.drizzleService.getDbInstance().update(alertHistory)
        .set({
          notificationSent: true
        })
        .where(eq(alertHistory.id, historyRecord.id))
        .returning();
      
      return updatedRecord;
    } catch (error) {
      console.error(`Error triggering alert ${alertId}:`, error);
      throw new Error(`Failed to trigger alert: ${error}`);
    }
  }

  /**
   * Get alert history
   * 
   * @param alertId Alert ID
   * @param limit Maximum number of records
   * @returns Alert history records
   */
  async getAlertHistory(alertId: string, limit?: number): Promise<AlertHistory[]> {
    try {
      console.log(`Getting history for alert: ${alertId}`);
      
      let query = this.drizzleService.getDbInstance()
        .select()
        .from(alertHistory)
        .where(eq(alertHistory.alertId, alertId))
        .orderBy(desc(alertHistory.triggeredAt));
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const history = await query;
      
      return history;
    } catch (error) {
      console.error(`Error getting history for alert ${alertId}:`, error);
      throw new Error(`Failed to get alert history: ${error}`);
    }
  }

  /**
   * Acknowledge an alert
   * 
   * @param historyId Alert history record ID
   * @returns Updated alert history record
   */
  async acknowledgeAlert(historyId: string): Promise<AlertHistory> {
    try {
      console.log(`Acknowledging alert history record: ${historyId}`);
      
      const [updatedRecord] = await this.drizzleService.getDbInstance().update(alertHistory)
        .set({
          status: 'acknowledged'
        })
        .where(eq(alertHistory.id, historyId))
        .returning();
      
      if (!updatedRecord) {
        throw new Error(`Alert history record with ID ${historyId} not found`);
      }
      
      return updatedRecord;
    } catch (error) {
      console.error(`Error acknowledging alert history record ${historyId}:`, error);
      throw new Error(`Failed to acknowledge alert: ${error}`);
    }
  }

  /**
   * Resolve an alert
   * 
   * @param historyId Alert history record ID
   * @returns Updated alert history record
   */
  async resolveAlert(historyId: string): Promise<AlertHistory> {
    try {
      console.log(`Resolving alert history record: ${historyId}`);
      
      const [updatedRecord] = await this.drizzleService.getDbInstance().update(alertHistory)
        .set({
          status: 'resolved'
        })
        .where(eq(alertHistory.id, historyId))
        .returning();
      
      if (!updatedRecord) {
        throw new Error(`Alert history record with ID ${historyId} not found`);
      }
      
      return updatedRecord;
    } catch (error) {
      console.error(`Error resolving alert history record ${historyId}:`, error);
      throw new Error(`Failed to resolve alert: ${error}`);
    }
  }
}