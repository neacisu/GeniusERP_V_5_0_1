/**
 * Test Stock Level Notifications Integration
 * 
 * This script tests the integration between CheckStockLevelsService and NotificationService
 * by checking real stock levels and sending notifications for items below threshold.
 */

import { getDrizzle } from './server/common/drizzle/drizzle.service';
import { checkStockLevelsService } from './server/modules/inventory/services/check-stock-levels.service';
import { Services } from './server/common/services/registry';
import { NotificationType, NotificationPriority } from './server/common/services/notification.service';

async function testStockNotifications() {
  const db = getDrizzle();
  console.log('[INFO] Starting stock notifications test');
  
  try {
    // Get a list of companies that have inventory data
    const companies = await db.execute(`
      SELECT DISTINCT company_id
      FROM stocks
      LIMIT 5
    `);
    
    if (!companies || companies.length === 0) {
      console.log('No companies with inventory found.');
      return;
    }
    
    // Track notifications for verification
    const sentNotifications: any[] = [];
    
    // Override notification service to track notifications instead of sending them
    const originalNotifyCompany = Services.notification.notifyCompany;
    Services.notification.notifyCompany = async (companyId: string, notification: any) => {
      console.log(`📩 Notification would be sent: 
      - To: ${companyId}
      - Title: ${notification.title}
      - Message: ${notification.message}
      - Type: ${notification.type}
      - Priority: ${notification.priority}`);
      
      sentNotifications.push({
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
    
    // Check for low stock items
    console.log('\n📊 Checking for low stock items...');
    const result = await checkStockLevelsService.checkLevels(companyId);
    
    console.log(`\n📋 Summary:
    - Total products checked: ${result.totalProducts}
    - Products below threshold: ${result.belowThreshold}
    - Notifications sent: ${sentNotifications.length}
    `);
    
    // Display alerts
    if (result.alerts.length > 0) {
      console.log('\n🚨 Low Stock Alerts:');
      result.alerts.forEach((alert, index) => {
        console.log(`${index + 1}. ${alert.productName} (${alert.productCode}): ${alert.currentQuantity}/${alert.minThreshold} in ${alert.warehouseName}`);
      });
    }
    
    // Check for products approaching threshold
    console.log('\n⚠️ Checking for products approaching threshold...');
    const approachingProducts = await checkStockLevelsService.getApproachingThreshold(companyId, undefined, true);
    
    if (approachingProducts.length > 0) {
      console.log('\n⚠️ Products Approaching Threshold:');
      approachingProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.product_name} (${product.product_code}): ${product.quantity}/${product.min_threshold} (${product.threshold_percentage}%)`);
      });
    } else {
      console.log('No products approaching threshold found.');
    }
    
    // Restore original notification service behavior
    Services.notification.notifyCompany = originalNotifyCompany;
    
    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testStockNotifications()
  .then(() => {
    console.log('🏁 Test script execution finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });