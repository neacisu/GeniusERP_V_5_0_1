/**
 * Test the NotificationService
 * 
 * This script demonstrates how to use the NotificationService
 */

import axios from 'axios';
import { config } from 'dotenv';
import { Services } from './server/common/services/registry';
import { NotificationType, NotificationPriority } from './server/common/services/notification.service';

// Load environment variables
config();

const API_BASE_URL = 'http://localhost:5000/api';

// Function to test user notification
async function testUserNotification() {
  try {
    console.log('Testing user notification...');
    
    const result = await Services.notification.notifyUser('test-user-id', {
      title: 'User Notification Test',
      message: 'This is a test notification for a specific user',
      type: NotificationType.INFO,
      priority: NotificationPriority.MEDIUM,
      metadata: {
        source: 'test-script',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('User notification result:', result);
    return result;
  } catch (error) {
    console.error('Failed to send user notification:', error);
    return null;
  }
}

// Function to test role notification
async function testRoleNotification() {
  try {
    console.log('Testing role notification...');
    
    const result = await Services.notification.notifyRole('admin', {
      title: 'Role Notification Test',
      message: 'This is a test notification for users with the admin role',
      type: NotificationType.WARNING,
      priority: NotificationPriority.HIGH,
      metadata: {
        source: 'test-script',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('Role notification result:', result);
    return result;
  } catch (error) {
    console.error('Failed to send role notification:', error);
    return null;
  }
}

// Function to test system notification
async function testSystemNotification() {
  try {
    console.log('Testing system notification...');
    
    const result = await Services.notification.notifySystem({
      title: 'System Notification Test',
      message: 'This is a test system-wide notification',
      type: NotificationType.ERROR,
      priority: NotificationPriority.CRITICAL,
      metadata: {
        source: 'test-script',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('System notification result:', result);
    return result;
  } catch (error) {
    console.error('Failed to send system notification:', error);
    return null;
  }
}

// Function to test company notification
async function testCompanyNotification() {
  try {
    console.log('Testing company notification...');
    
    const result = await Services.notification.notifyCompany('test-company-id', {
      title: 'Company Notification Test',
      message: 'This is a test notification for all users in a company',
      type: NotificationType.SUCCESS,
      priority: NotificationPriority.MEDIUM,
      metadata: {
        source: 'test-script',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('Company notification result:', result);
    return result;
  } catch (error) {
    console.error('Failed to send company notification:', error);
    return null;
  }
}

// Function to test the public API endpoint
async function testPublicNotificationEndpoint() {
  try {
    console.log('Testing public notification API endpoint...');
    
    const response = await axios.get(`${API_BASE_URL}/examples/public-notifications/test`);
    console.log('Public API endpoint response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to test public API endpoint:', error);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting notification service tests...');
  
  await testUserNotification();
  await testRoleNotification();
  await testSystemNotification();
  await testCompanyNotification();
  await testPublicNotificationEndpoint();
  
  console.log('All notification tests completed');
}

// Run tests
runAllTests().catch(console.error);