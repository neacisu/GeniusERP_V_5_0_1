/**
 * Test file for Business Intelligence Service
 * 
 * This script demonstrates the business intelligence capabilities
 * with sample data to showcase cost center analysis, profit center analysis,
 * and business performance monitoring.
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { createId } from './server/utils/id';

// Load environment variables
dotenv.config();

/**
 * Helper function to format and print results
 */
function logResult(title: string, data: any) {
  console.log(`\n--- ${title} ---`);
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Initialize services needed for testing
 */
async function initializeServices() {
  // Get database connection string from environment variables
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Create SQL client
  const sql = postgres(connectionString, { max: 1 });
  
  return {
    sql,
    cleanup: async () => {
      await sql.end();
    }
  };
}

/**
 * Test cost center analysis functionality
 */
async function testCostCenterAnalysis(sql: any) {
  console.log('\nTesting Cost Center Analysis...');
  
  const companyId = 'test-company-1';
  const userId = 'test-user-1';
  
  // Create sample cost centers
  const itDeptId = createId();
  const marketingDeptId = createId();
  const salesDeptId = createId();
  
  console.log('Creating sample cost centers...');
  
  // IT Department
  await sql`
    INSERT INTO bi_cost_centers (
      id, company_id, name, code, budget, created_by
    ) VALUES (
      ${itDeptId}, 
      ${companyId}, 
      'IT Department', 
      'IT-001', 
      '150000', 
      ${userId}
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // Marketing Department
  await sql`
    INSERT INTO bi_cost_centers (
      id, company_id, name, code, budget, created_by
    ) VALUES (
      ${marketingDeptId}, 
      ${companyId}, 
      'Marketing Department', 
      'MKT-001', 
      '120000', 
      ${userId}
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // Sales Department
  await sql`
    INSERT INTO bi_cost_centers (
      id, company_id, name, code, budget, created_by
    ) VALUES (
      ${salesDeptId}, 
      ${companyId}, 
      'Sales Department', 
      'SLS-001', 
      '200000', 
      ${userId}
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // Create cost allocations
  const alloc1Id = createId();
  const alloc2Id = createId();
  
  console.log('Creating sample cost allocations...');
  
  // IT to Marketing allocation
  await sql`
    INSERT INTO bi_cost_allocations (
      id, company_id, name, description, 
      source_cost_center_id, target_cost_center_id,
      allocation_method, allocation_value, start_date, created_by
    ) VALUES (
      ${alloc1Id},
      ${companyId},
      'IT Services for Marketing',
      'Monthly IT service allocation for marketing department',
      ${itDeptId},
      ${marketingDeptId},
      'fixed',
      '5000',
      NOW(),
      ${userId}
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // IT to Sales allocation
  await sql`
    INSERT INTO bi_cost_allocations (
      id, company_id, name, description, 
      source_cost_center_id, target_cost_center_id,
      allocation_method, allocation_value, start_date, created_by
    ) VALUES (
      ${alloc2Id},
      ${companyId},
      'IT Services for Sales',
      'Monthly IT service allocation for sales department',
      ${itDeptId},
      ${salesDeptId},
      'fixed',
      '7500',
      NOW(),
      ${userId}
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // Create allocation history
  console.log('Creating sample allocation history...');
  
  // January allocation - Marketing
  await sql`
    INSERT INTO cost_allocation_history (
      id, cost_allocation_id, company_id,
      period_start, period_end, amount, allocated_by
    ) VALUES (
      ${createId()},
      ${alloc1Id},
      ${companyId},
      '2025-01-01'::timestamp,
      '2025-01-31'::timestamp,
      '5000',
      ${userId}
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // January allocation - Sales
  await sql`
    INSERT INTO cost_allocation_history (
      id, cost_allocation_id, company_id,
      period_start, period_end, amount, allocated_by
    ) VALUES (
      ${createId()},
      ${alloc2Id},
      ${companyId},
      '2025-01-01'::timestamp,
      '2025-01-31'::timestamp,
      '7500',
      ${userId}
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // Verify data
  const costCenters = await sql`SELECT * FROM bi_cost_centers WHERE company_id = ${companyId};`;
  logResult('Cost Centers', costCenters);
  
  const allocations = await sql`SELECT * FROM bi_cost_allocations WHERE company_id = ${companyId};`;
  logResult('Cost Allocations', allocations);
  
  const allocationHistory = await sql`SELECT * FROM cost_allocation_history WHERE company_id = ${companyId};`;
  logResult('Allocation History', allocationHistory);
  
  // Analyze IT department's service allocations
  const itServiceAllocations = await sql`
    SELECT 
      cc.name AS source_cost_center,
      target_cc.name AS target_cost_center,
      ca.allocation_method,
      ca.allocation_value,
      cah.period_start,
      cah.period_end,
      cah.amount
    FROM 
      bi_cost_allocations ca
    JOIN 
      bi_cost_centers cc ON ca.source_cost_center_id = cc.id
    JOIN 
      bi_cost_centers target_cc ON ca.target_cost_center_id = target_cc.id
    JOIN 
      cost_allocation_history cah ON ca.id = cah.cost_allocation_id
    WHERE 
      ca.company_id = ${companyId}
      AND ca.source_cost_center_id = ${itDeptId};
  `;
  
  logResult('IT Department Service Allocations', itServiceAllocations);
}

/**
 * Test profit center analysis functionality
 */
async function testProfitCenterAnalysis(sql: any) {
  console.log('\nTesting Profit Center Analysis...');
  
  const companyId = 'test-company-1';
  const userId = 'test-user-1';
  
  // Create sample business units (profit centers)
  const retailBuId = createId();
  const wholesaleBuId = createId();
  
  // Get the sales department ID
  const salesDept = await sql`
    SELECT id FROM bi_cost_centers 
    WHERE company_id = ${companyId} AND name = 'Sales Department' 
    LIMIT 1;
  `;
  
  const salesDeptId = salesDept[0]?.id;
  
  if (!salesDeptId) {
    console.log('Sales department not found, skipping profit center analysis');
    return;
  }
  
  console.log('Creating sample business units...');
  
  // Retail Business Unit
  await sql`
    INSERT INTO bi_business_units (
      id, company_id, name, code, cost_center_id, created_by
    ) VALUES (
      ${retailBuId}, 
      ${companyId}, 
      'Retail Division', 
      'BU-RET', 
      ${salesDeptId}, 
      ${userId}
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // Wholesale Business Unit
  await sql`
    INSERT INTO bi_business_units (
      id, company_id, name, code, cost_center_id, created_by
    ) VALUES (
      ${wholesaleBuId}, 
      ${companyId}, 
      'Wholesale Division', 
      'BU-WHL', 
      ${salesDeptId}, 
      ${userId}
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // Verify data
  const businessUnits = await sql`SELECT * FROM bi_business_units WHERE company_id = ${companyId};`;
  logResult('Business Units', businessUnits);
  
  // Advanced query: Business units with their cost centers
  const buWithCostCenters = await sql`
    SELECT 
      bu.id, 
      bu.name AS business_unit_name, 
      cc.name AS cost_center_name,
      cc.budget AS cost_center_budget
    FROM 
      bi_business_units bu
    JOIN 
      bi_cost_centers cc ON bu.cost_center_id = cc.id
    WHERE 
      bu.company_id = ${companyId};
  `;
  
  logResult('Business Units with Cost Centers', buWithCostCenters);
}

/**
 * Test business performance analysis functionality
 */
async function testBusinessPerformanceAnalysis(sql: any) {
  console.log('\nTesting Business Performance Analysis...');
  
  const companyId = 'test-company-1';
  const userId = 'test-user-1';
  
  // Create sample metrics
  console.log('Creating sample metrics...');
  
  // Sales Revenue Metric
  const salesMetricId = createId();
  await sql`
    INSERT INTO analytics_metrics (
      id, company_id, name, description, type, value, unit, created_by
    ) VALUES (
      ${salesMetricId}, 
      ${companyId}, 
      'Monthly Sales Revenue', 
      'Total monthly sales revenue across all channels', 
      'financial', 
      '450000', 
      'RON',
      ${userId}
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // Marketing ROI Metric
  const marketingMetricId = createId();
  await sql`
    INSERT INTO analytics_metrics (
      id, company_id, name, description, type, value, unit, created_by
    ) VALUES (
      ${marketingMetricId}, 
      ${companyId}, 
      'Marketing Campaign ROI', 
      'Return on investment for marketing campaigns', 
      'marketing', 
      '2.75', 
      'ratio',
      ${userId}
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // Create metric history
  console.log('Creating sample metric history...');
  
  // Sales Revenue History
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  
  await sql`
    INSERT INTO metrics_history (
      id, metric_id, company_id, value, timestamp, period
    ) VALUES (
      ${createId()}, 
      ${salesMetricId}, 
      ${companyId}, 
      '420000', 
      ${twoMonthsAgo.toISOString()}, 
      'monthly'
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  await sql`
    INSERT INTO metrics_history (
      id, metric_id, company_id, value, timestamp, period
    ) VALUES (
      ${createId()}, 
      ${salesMetricId}, 
      ${companyId}, 
      '430000', 
      ${lastMonth.toISOString()}, 
      'monthly'
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // Marketing ROI History
  await sql`
    INSERT INTO metrics_history (
      id, metric_id, company_id, value, timestamp, period
    ) VALUES (
      ${createId()}, 
      ${marketingMetricId}, 
      ${companyId}, 
      '2.5', 
      ${twoMonthsAgo.toISOString()}, 
      'monthly'
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  await sql`
    INSERT INTO metrics_history (
      id, metric_id, company_id, value, timestamp, period
    ) VALUES (
      ${createId()}, 
      ${marketingMetricId}, 
      ${companyId}, 
      '2.65', 
      ${lastMonth.toISOString()}, 
      'monthly'
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // Verify data
  const metrics = await sql`SELECT * FROM analytics_metrics WHERE company_id = ${companyId};`;
  logResult('Business Metrics', metrics);
  
  // Get metrics history with trend analysis
  const salesTrend = await sql`
    WITH monthly_data AS (
      SELECT 
        m.name, 
        mh.timestamp, 
        mh.value::numeric AS value
      FROM 
        analytics_metrics m
      JOIN 
        metrics_history mh ON m.id = mh.metric_id
      WHERE 
        m.company_id = ${companyId}
        AND m.id = ${salesMetricId}
      ORDER BY 
        mh.timestamp
    ),
    trend_data AS (
      SELECT 
        name,
        timestamp,
        value,
        LAG(value) OVER (ORDER BY timestamp) AS previous_value
      FROM 
        monthly_data
    )
    SELECT 
      name,
      timestamp,
      value,
      previous_value,
      CASE 
        WHEN previous_value IS NULL THEN NULL 
        ELSE ROUND((value - previous_value) / previous_value * 100, 2) 
      END AS percentage_change
    FROM 
      trend_data
    ORDER BY 
      timestamp DESC;
  `;
  
  logResult('Sales Revenue Trend Analysis', salesTrend);
}

/**
 * Test cost allocation functionality
 */
async function testCostAllocation(sql: any) {
  console.log('\nTesting Cost Allocation Functionality...');
  
  const companyId = 'test-company-1';
  
  // Get total allocations by cost center
  const costCenterAllocations = await sql`
    SELECT 
      cc.name AS cost_center_name,
      cc.budget::numeric AS total_budget,
      SUM(cah.amount::numeric) AS allocated_amount,
      (cc.budget::numeric - SUM(cah.amount::numeric)) AS remaining_budget
    FROM 
      bi_cost_centers cc
    JOIN 
      bi_cost_allocations ca ON cc.id = ca.source_cost_center_id
    JOIN 
      cost_allocation_history cah ON ca.id = cah.cost_allocation_id
    WHERE 
      cc.company_id = ${companyId}
    GROUP BY 
      cc.id, cc.name, cc.budget
    ORDER BY 
      cc.name;
  `;
  
  logResult('Cost Center Allocation Summary', costCenterAllocations);
}

/**
 * Test BI dashboard data functionality
 */
async function testDashboardData(sql: any) {
  console.log('\nTesting BI Dashboard Data...');
  
  const companyId = 'test-company-1';
  const userId = 'test-user-1';
  
  // Create sample dashboard
  const dashboardId = createId();
  console.log('Creating sample dashboard...');
  
  await sql`
    INSERT INTO analytics_dashboards (
      id, company_id, name, description, created_by
    ) VALUES (
      ${dashboardId}, 
      ${companyId}, 
      'Financial Performance Dashboard', 
      'Overview of key financial metrics', 
      ${userId}
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // Create sample reports for the dashboard
  const reportId = createId();
  console.log('Creating sample reports...');
  
  await sql`
    INSERT INTO analytics_reports (
      id, company_id, name, description, type, dashboard_id, created_by
    ) VALUES (
      ${reportId}, 
      ${companyId}, 
      'Revenue by Department', 
      'Monthly revenue breakdown by department', 
      'financial',
      ${dashboardId}, 
      ${userId}
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // Create report execution history
  console.log('Creating sample report execution history...');
  
  await sql`
    INSERT INTO report_execution_history (
      id, report_id, company_id, executed_by, status, result
    ) VALUES (
      ${createId()}, 
      ${reportId}, 
      ${companyId}, 
      ${userId}, 
      'success',
      '{"data": {"labels": ["Sales", "Marketing", "IT"], "values": [580000, 220000, 75000]}}'
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // Track dashboard view
  console.log('Tracking dashboard view...');
  
  await sql`
    INSERT INTO dashboard_views (
      id, dashboard_id, user_id, company_id, view_duration
    ) VALUES (
      ${createId()}, 
      ${dashboardId}, 
      ${userId}, 
      ${companyId}, 
      360
    ) ON CONFLICT (id) DO NOTHING;
  `;
  
  // Verify data
  const dashboards = await sql`SELECT * FROM analytics_dashboards WHERE company_id = ${companyId};`;
  logResult('Dashboards', dashboards);
  
  const reports = await sql`
    SELECT 
      r.id, 
      r.name, 
      r.type, 
      d.name AS dashboard_name
    FROM 
      analytics_reports r
    JOIN 
      analytics_dashboards d ON r.dashboard_id = d.id
    WHERE 
      r.company_id = ${companyId};
  `;
  
  logResult('Dashboard Reports', reports);
  
  const executions = await sql`
    SELECT 
      reh.id, 
      reh.executed_at, 
      reh.status, 
      r.name AS report_name
    FROM 
      report_execution_history reh
    JOIN 
      analytics_reports r ON reh.report_id = r.id
    WHERE 
      reh.company_id = ${companyId};
  `;
  
  logResult('Report Executions', executions);
  
  const dashboardUsage = await sql`
    SELECT 
      d.name AS dashboard_name,
      COUNT(dv.id) AS view_count,
      ROUND(AVG(dv.view_duration)::numeric, 2) AS avg_view_duration_seconds
    FROM 
      analytics_dashboards d
    JOIN 
      dashboard_views dv ON d.id = dv.dashboard_id
    WHERE 
      d.company_id = ${companyId}
    GROUP BY 
      d.id, d.name;
  `;
  
  logResult('Dashboard Usage Statistics', dashboardUsage);
}

/**
 * Run all tests
 */
async function runAllTests() {
  const { sql, cleanup } = await initializeServices();
  
  try {
    console.log('Testing Business Intelligence Service...');
    
    // Run test functions
    await testCostCenterAnalysis(sql);
    await testProfitCenterAnalysis(sql);
    await testBusinessPerformanceAnalysis(sql);
    await testCostAllocation(sql);
    await testDashboardData(sql);
    
    console.log('\n✅ Business Intelligence testing completed successfully!');
  } catch (error) {
    console.error('Error testing Business Intelligence:', error);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Execute the test function
runAllTests().catch(console.error);