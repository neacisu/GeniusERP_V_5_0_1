/**
 * Test the NotificationService
 * 
 * This script demonstrates how to use the NotificationService
 */

// Import NotificationService directly for testing
import { notificationService, NotificationType, NotificationPriority, NotificationTarget } from './server/common/services/notification.service.js';

// Test user notification
async function testUserNotification() {
  console.log('\n--- Test User Notification ---');
  const result = await notificationService.notifyUser('user123', {
    title: 'Welcome to the platform',
    message: 'Thank you for joining our enterprise platform. Get started by exploring the dashboard.',
    type: NotificationType.INFO,
    priority: NotificationPriority.MEDIUM,
    actionUrl: '/dashboard'
  });
  
  console.log('Notification result:', result);
}

// Test role notification
async function testRoleNotification() {
  console.log('\n--- Test Role Notification ---');
  const result = await notificationService.notifyRole('admin', {
    title: 'New User Registration',
    message: 'A new user has registered and needs approval. Please review their account.',
    type: NotificationType.WARNING,
    priority: NotificationPriority.HIGH,
    actionUrl: '/admin/users/pending'
  });
  
  console.log('Notification result:', result);
}

// Test critical system notification
async function testSystemNotification() {
  console.log('\n--- Test System Notification ---');
  const result = await notificationService.notifySystem({
    title: 'Database Backup Failed',
    message: 'The automated database backup failed. Check the backup system and logs immediately.',
    type: NotificationType.ERROR,
    priority: NotificationPriority.CRITICAL,
    metadata: {
      failureTime: new Date().toISOString(),
      backupJob: 'daily-backup-001',
      retryCount: 3
    }
  });
  
  console.log('Notification result:', result);
}

// Test company notification
async function testCompanyNotification() {
  console.log('\n--- Test Company Notification ---');
  const result = await notificationService.notifyCompany('company456', {
    title: 'Subscription Renewal',
    message: 'Your enterprise subscription will renew in 7 days. Please verify your payment information.',
    type: NotificationType.INFO,
    priority: NotificationPriority.MEDIUM,
    actionUrl: '/billing/subscription'
  });
  
  console.log('Notification result:', result);
}

// Run all tests
async function runAllTests() {
  console.log('=== NotificationService Test Suite ===');
  
  try {
    await testUserNotification();
    await testRoleNotification();
    await testSystemNotification();
    await testCompanyNotification();
    
    console.log('\n=== All tests completed successfully ===');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Execute the tests
runAllTests();