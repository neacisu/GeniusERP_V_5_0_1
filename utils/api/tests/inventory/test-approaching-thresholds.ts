/**
 * Test for Products Approaching Threshold
 * 
 * This script specifically tests the ability to detect products that are
 * approaching their minimum threshold but haven't reached it yet.
 */

import { getDrizzle } from './server/common/drizzle/drizzle.service';
import { checkStockLevelsService } from './server/modules/inventory/services/check-stock-levels.service';
import { Services } from './server/common/services/registry';
import { NotificationType, NotificationPriority } from './server/common/services/notification.service';

async function testApproachingThresholds() {
  const db = getDrizzle();
  console.log('[INFO] Starting approaching threshold test');
  
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

    // Test get approaching threshold products - the true flag will send notifications 
    console.log('\n⚠️ Testing detection of products approaching threshold...');
    const approachingProducts = await checkStockLevelsService.getApproachingThreshold(companyId, undefined, true);
    
    console.log(`\n📋 Found ${approachingProducts.length} products approaching threshold`);
    
    if (approachingProducts.length > 0) {
      console.log('\n⚠️ Products Approaching Threshold:');
      approachingProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.product_name} (${product.product_code}): ${product.quantity}/${product.min_threshold} (${product.threshold_percentage}%)`);
      });
      
      // Check the specific threshold percentage for each product
      console.log('\n📊 Threshold analysis:');
      approachingProducts.forEach((product, index) => {
        console.log(`${product.product_name}: ${product.quantity} / ${product.min_threshold} = ${(product.quantity / product.min_threshold * 100).toFixed(1)}%`);
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
testApproachingThresholds()
  .then(() => {
    console.log('🏁 Test script execution finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });