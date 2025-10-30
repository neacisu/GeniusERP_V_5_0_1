/**
 * Test Route for Sentry Error Tracking
 * 
 * Folosit DOAR pentru testing în development
 * REMOVE în production!
 */

import { Router, Request, Response } from 'express';
import { captureException, captureMessage, addBreadcrumb } from '../common/sentry';
import { createModuleLogger } from '../common/logger/loki-logger';

const router = Router();
const logger = createModuleLogger('test-sentry');

/**
 * Test 1: Simulează o eroare simplă
 * GET /api/test-sentry/error
 */
router.get('/error', (req: Request, res: Response) => {
  try {
    throw new Error('Test error from Sentry - Backend');
  } catch (error) {
    captureException(error as Error, {
      module: 'test',
      operation: 'simulate-error',
      extra: {
        testType: 'simple-error',
      },
    });

    res.status(500).json({
      message: 'Error captured and sent to Sentry',
      error: (error as Error).message,
    });
  }
});

/**
 * Test 2: Simulează o eroare asynchronă
 * GET /api/test-sentry/async-error
 */
router.get('/async-error', async (req: Request, res: Response) => {
  try {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Async test error from Sentry - Backend'));
      }, 100);
    });
  } catch (error) {
    captureException(error as Error, {
      module: 'test',
      operation: 'simulate-async-error',
    });

    res.status(500).json({
      message: 'Async error captured and sent to Sentry',
      error: (error as Error).message,
    });
  }
});

/**
 * Test 3: Trimite mesaj custom
 * GET /api/test-sentry/message
 */
router.get('/message', (req: Request, res: Response) => {
  captureMessage('Test message from Sentry - Backend', 'info', {
    module: 'test',
    testType: 'custom-message',
  });

  res.json({
    message: 'Custom message sent to Sentry',
  });
});

/**
 * Test 4: Test cu breadcrumbs
 * GET /api/test-sentry/breadcrumbs
 */
router.get('/breadcrumbs', (req: Request, res: Response) => {
  addBreadcrumb('Step 1: User accessed test route', 'test');
  addBreadcrumb('Step 2: Processing data', 'test', { data: 'test-data' });
  addBreadcrumb('Step 3: About to throw error', 'test', {}, 'warning');

  try {
    throw new Error('Error with breadcrumbs - Backend');
  } catch (error) {
    captureException(error as Error, {
      module: 'test',
      operation: 'breadcrumb-test',
    });

    res.status(500).json({
      message: 'Error with breadcrumbs sent to Sentry',
      error: (error as Error).message,
    });
  }
});

/**
 * Test 5: Test logger integration
 * GET /api/test-sentry/logger
 */
router.get('/logger', (req: Request, res: Response) => {
  logger.info('Test info log');
  logger.warn('Test warning log');
  
  try {
    throw new Error('Error via logger - Backend');
  } catch (error) {
    // Logger.error trimite automat la Sentry
    logger.error('Test error via logger', error as Error);

    res.status(500).json({
      message: 'Error logged via winston-loki-sentry integration',
      error: (error as Error).message,
    });
  }
});

/**
 * Test 6: Simulează eroare critică (unhandled)
 * GET /api/test-sentry/unhandled
 * 
 * ATENȚIE: Aceasta va crasha requestul!
 */
router.get('/unhandled', (req: Request, res: Response) => {
  // Această eroare va fi capturată de Sentry middleware
  throw new Error('Unhandled error test - Backend');
});

export default router;

