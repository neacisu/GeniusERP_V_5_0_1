/**
 * Test Page for Sentry Error Tracking - Frontend
 * 
 * Folosit DOAR pentru testing în development
 * REMOVE în production!
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { captureException, captureMessage, addBreadcrumb } from '@/lib/sentry';

const TestSentryPage: React.FC = () => {
  const testSimpleError = () => {
    try {
      throw new Error('Test error from Sentry - Frontend');
    } catch (error) {
      captureException(error as Error, {
        module: 'test-page',
        operation: 'simple-error',
        testType: 'simple-error',
      });
      
      alert('Error captured and sent to Sentry (check console)');
      console.error('Captured error:', error);
    }
  };

  const testAsyncError = async () => {
    try {
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Async test error from Sentry - Frontend'));
        }, 100);
      });
    } catch (error) {
      captureException(error as Error, {
        module: 'test-page',
        operation: 'async-error',
      });
      
      alert('Async error captured and sent to Sentry');
      console.error('Captured async error:', error);
    }
  };

  const testCustomMessage = () => {
    captureMessage('Custom test message from Frontend', 'info', {
      module: 'test-page',
      testType: 'custom-message',
    });
    
    alert('Custom message sent to Sentry');
  };

  const testBreadcrumbs = () => {
    addBreadcrumb('Step 1: User clicked breadcrumb test', 'test');
    addBreadcrumb('Step 2: Processing data', 'test', { data: 'test-data' });
    addBreadcrumb('Step 3: About to throw error', 'test', {}, 'warning');

    try {
      throw new Error('Error with breadcrumbs - Frontend');
    } catch (error) {
      captureException(error as Error, {
        module: 'test-page',
        operation: 'breadcrumb-test',
      });
      
      alert('Error with breadcrumbs sent to Sentry');
      console.error('Captured error with breadcrumbs:', error);
    }
  };

  const testComponentError = () => {
    // Această eroare va fi capturată de ErrorBoundary
    throw new Error('Unhandled component error - Frontend');
  };

  const testApiError = async () => {
    try {
      const response = await fetch('/api/test-sentry/error');
      const data = await response.json();
      alert('Backend error triggered: ' + data.message);
    } catch (error) {
      captureException(error as Error, {
        module: 'test-page',
        operation: 'api-call',
      });
      
      alert('API call error captured');
      console.error('API error:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Test Sentry Error Tracking</CardTitle>
          <CardDescription>
            Testează capturarea erorilor în Sentry - Frontend & Backend
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Atenție:</strong> Această pagină este doar pentru testing în development.
              Îndepărtați-o în production!
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-lg font-semibold">Frontend Tests</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Button onClick={testSimpleError} variant="destructive">
                  Test Simple Error
                </Button>
                
                <Button onClick={testAsyncError} variant="destructive">
                  Test Async Error
                </Button>
                
                <Button onClick={testCustomMessage} variant="secondary">
                  Test Custom Message
                </Button>
                
                <Button onClick={testBreadcrumbs} variant="destructive">
                  Test Breadcrumbs
                </Button>
                
                <Button onClick={testComponentError} variant="destructive" className="bg-red-700">
                  Test Component Error (ErrorBoundary)
                </Button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="mb-3 text-lg font-semibold">Backend Tests</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Button onClick={testApiError} variant="outline">
                  Test Backend Error (API)
                </Button>
                
                <Button
                  onClick={() => window.open('/api/test-sentry/async-error', '_blank')}
                  variant="outline"
                >
                  Test Backend Async Error
                </Button>
                
                <Button
                  onClick={() => window.open('/api/test-sentry/message', '_blank')}
                  variant="outline"
                >
                  Test Backend Message
                </Button>
                
                <Button
                  onClick={() => window.open('/api/test-sentry/breadcrumbs', '_blank')}
                  variant="outline"
                >
                  Test Backend Breadcrumbs
                </Button>
                
                <Button
                  onClick={() => window.open('/api/test-sentry/logger', '_blank')}
                  variant="outline"
                >
                  Test Logger Integration
                </Button>
                
                <Button
                  onClick={() => window.open('/api/test-sentry/unhandled', '_blank')}
                  variant="destructive"
                  className="bg-red-700"
                >
                  Test Unhandled Error
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 mt-6">
            <h4 className="mb-2 font-semibold text-blue-900">📊 Cum verifici erorile în Sentry:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Accesează <a href="https://sentry.io" target="_blank" rel="noreferrer" className="underline">sentry.io</a></li>
              <li>Login cu contul tău</li>
              <li>Selectează proiectul GeniusERP</li>
              <li>Vezi Issues → Recent issues</li>
              <li>Click pe o eroare pentru detalii complete</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestSentryPage;

