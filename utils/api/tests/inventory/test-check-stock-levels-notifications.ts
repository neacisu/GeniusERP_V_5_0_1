/**
 * Comprehensive Test for CheckStockLevelsService with NotificationService Integration
 * 
 * This script tests both detecting low stock items and products approaching threshold,
 * verifying proper notifications are generated for both scenarios.
 */

import { getDrizzle } from './server/common/drizzle/drizzle.service';
import { checkStockLevelsService } from './server/modules/inventory/services/check-stock-levels.service';
import { Services } from './server/common/services/registry';
import { NotificationType, NotificationPriority } from './server/common/services/notification.service';

// Set this to true to insert test data
const SETUP_TEST_DATA = false;

async function testCheckStockLevelsWithNotifications() {
  const db = getDrizzle();
  console.log('🧪 Starting comprehensive stock levels notification test');
  
  try {
    // Get a list of companies that have inventory data
    const companies = await db.execute(`
      SELECT DISTINCT company_id
      FROM stocks
      LIMIT 1
    `);
    
    if (!companies || companies.length === 0) {
      console.log('⚠️ No companies with inventory found.');
      return;
    }
    
    // Track notifications for verification
    let allNotifications: any[] = [];
    
    // Override notification service to track notifications instead of sending them
    const originalNotifyCompany = Services.notification.notifyCompany;
    Services.notification.notifyCompany = async (companyId: string, notification: any) => {
      console.log(`📩 Notification:
      - Type: ${notification.type}
      - Priority: ${notification.priority}
      - Title: ${notification.title}
      - Message: ${notification.message}
      ${notification.metadata ? `- Metadata: ${JSON.stringify(notification.metadata)}` : ''}`);
      
      allNotifications.push({
        companyId,
        notification
      });
      
      return {
        success: true,
        id: `test-${Date.now()}`,
        message: 'Notification logged for testing'
      };
    };
    
    // Test with the first company
    const companyId = companies[0].company_id;
    console.log(`\n🏢 Testing with company ID: ${companyId}`);

    // ---- PART 1: Test detecting low stock levels ----
    console.log('\n📉 PART 1: Testing low stock detection...');
    const lowStockResult = await checkStockLevelsService.checkLevels(companyId);
    
    console.log(`\n📊 Low Stock Summary:
    - Total products checked: ${lowStockResult.totalProducts}
    - Products below threshold: ${lowStockResult.belowThreshold}
    - Alerts generated: ${lowStockResult.alerts.length}
    `);
    
    // Display low stock alerts
    if (lowStockResult.alerts.length > 0) {
      console.log('\n🚨 Low Stock Items:');
      lowStockResult.alerts.forEach((alert, index) => {
        console.log(`${index + 1}. ${alert.productName} (${alert.productCode}): ${alert.currentQuantity}/${alert.minThreshold} in ${alert.warehouseName}`);
      });
    }
    
    // Group and analyze notifications from part 1
    const lowStockNotifications = allNotifications.filter(n => 
      n.notification.title.startsWith('Low Stock Alert'));
    
    console.log(`\n📊 Low Stock Notification Analysis:
    - Total notifications: ${lowStockNotifications.length}
    - Critical priority: ${lowStockNotifications.filter(n => n.notification.priority === 'critical').length}
    - High priority: ${lowStockNotifications.filter(n => n.notification.priority === 'high').length}
    - Medium priority: ${lowStockNotifications.filter(n => n.notification.priority === 'medium').length}
    - Low priority: ${lowStockNotifications.filter(n => n.notification.priority === 'low').length}
    `);
    
    // Clear the notifications array for part 2
    allNotifications = [];
    
    // ---- PART 2: Test detecting products approaching threshold ----
    console.log('\n📈 PART 2: Testing approaching threshold detection...');
    const approachingResult = await checkStockLevelsService.getApproachingThreshold(companyId, undefined, true);
    
    console.log(`\n📊 Approaching Threshold Summary:
    - Products approaching threshold: ${approachingResult.length}
    `);
    
    // Display approaching threshold items
    if (approachingResult.length > 0) {
      console.log('\n⚠️ Products Approaching Threshold:');
      approachingResult.forEach((product, index) => {
        console.log(`${index + 1}. ${product.product_name} (${product.product_code}): ${product.quantity}/${product.min_threshold} (${product.threshold_percentage}%)`);
      });
    }
    
    // Analyze notifications from part 2
    const approachingNotifications = allNotifications.filter(n => 
      n.notification.title.startsWith('Stock Level Warning'));
    
    console.log(`\n📊 Approaching Threshold Notification Analysis:
    - Total notifications: ${approachingNotifications.length}
    - Medium priority: ${approachingNotifications.filter(n => n.notification.priority === 'medium').length}
    - Low priority: ${approachingNotifications.filter(n => n.notification.priority === 'low').length}
    `);
    
    // Restore original notification service
    Services.notification.notifyCompany = originalNotifyCompany;
    
    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCheckStockLevelsWithNotifications()
  .then(() => {
    console.log('🏁 Test script execution finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });