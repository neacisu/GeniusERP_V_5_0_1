/**
 * Test CheckStockLevelsService with Real Database Data
 * 
 * This script runs a test of the CheckStockLevelsService integrated with NotificationService
 * using real data from the database. It will find products that are below their threshold
 * and trigger notifications for them.
 */

import { getDrizzle } from './server/common/drizzle/drizzle.service';
import { checkStockLevelsService } from './server/modules/inventory/services/check-stock-levels.service';
import { Services } from './server/common/services/registry';
import { NotificationType, NotificationPriority } from './server/common/services/notification.service';

async function testWithRealData() {
  const db = getDrizzle();
  console.log('[INFO] DrizzleService - Database connection established');
  
  try {
    console.log('🧪 Testing CheckStockLevelsService with real database data');
    
    // First, find company IDs directly from the stocks table
    console.log('\n📋 Retrieving companies with inventory...');
    const companies = await db.execute(`
      SELECT DISTINCT company_id
      FROM stocks
      LIMIT 5`
    );
    
    if (!companies || companies.length === 0) {
      console.log('❌ No companies with inventory found. Test cannot proceed.');
      return;
    }
    
    // Track sent notifications to verify functionality
    const sentNotifications: any[] = [];
    
    // Replace the notification service's notifyCompany method with a test version
    // that logs the notification but doesn't actually send it
    const originalNotifyCompany = Services.notification.notifyCompany;
    Services.notification.notifyCompany = async (companyId: string, notification: any) => {
      console.log('📩 Notification would be sent:', {
        companyId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority
      });
      
      sentNotifications.push({
        companyId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        timestamp: new Date()
      });
      
      return {
        success: true,
        id: `test-notification-${Date.now()}`,
        message: 'Test notification logged',
        timestamp: new Date()
      };
    };
    
    // Process the company IDs to ensure they're proper strings
    const typedCompanies = companies.map(company => {
      const id = typeof company.company_id === 'string' 
        ? company.company_id 
        : String(company.company_id);
        
      return {
        id,
        name: `Company ${id.substring(0, 6)}` // Use first 6 chars of ID as name
      };
    });
    
    // Test with each company
    for (const company of typedCompanies) {
      const companyId = company.id;
      const companyName = company.name;
      
      console.log(`\n🏢 Testing with company: ${companyName} (${companyId})`);
      
      // Check for low stock items using the service
      console.log('\n📊 Checking for low stock items...');
      const lowStockResult = await checkStockLevelsService.checkLevels(companyId);
      
      console.log(`Found ${lowStockResult.belowThreshold} products below threshold out of ${lowStockResult.totalProducts} total products`);
      
      // If low stock items found, display them
      if (lowStockResult.alerts.length > 0) {
        console.log('\n🚨 Low Stock Alerts:');
        lowStockResult.alerts.forEach((alert, index) => {
          console.log(`${index + 1}. ${alert.productName} (${alert.productCode}): ${alert.currentQuantity}/${alert.minThreshold}`);
        });
      } else {
        console.log('No products below threshold found.');
      }
      
      // Check for products approaching their threshold
      console.log('\n⚠️ Checking for products approaching threshold...');
      const approachingProducts = await checkStockLevelsService.getApproachingThreshold(companyId, undefined, true);
      
      console.log(`Found ${approachingProducts.length} products approaching threshold`);
      
      // If approaching threshold items found, display them
      if (approachingProducts.length > 0) {
        console.log('\n⚠️ Approaching Threshold Products:');
        approachingProducts.forEach((product, index) => {
          console.log(`${index + 1}. ${product.product_name} (${product.product_code}): ${product.quantity}/${product.min_threshold} (${product.threshold_percentage}%)`);
        });
      } else {
        console.log('No products approaching threshold found.');
      }
    }
    
    // Verification summary
    console.log('\n📋 Notification Summary:');
    sentNotifications.forEach((notification, index) => {
      console.log(`${index + 1}. ${notification.title} (${notification.type}, ${notification.priority})`);
    });
    
    console.log(`\n✅ Test completed with ${sentNotifications.length} notifications`);
    
    // Restore original notification service method
    Services.notification.notifyCompany = originalNotifyCompany;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWithRealData()
  .then(() => {
    console.log('🏁 Test script finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });