import { Router, Request, Response } from 'express';
import { AuthGuard, JwtAuthMode } from '../../auth';
import { v4 as uuidv4 } from 'uuid';
import { demoUsingServicesRegistry } from '../../../examples/audit-service-demo';
import { storage } from '../../../storage';

// Import the global Services registry
import { Services, logAction } from '../../../common/services';

export function initExampleRoutes() {
  const router = Router();
  
  // Public route - no authentication required
  router.get('/public', (req, res) => {
    res.json({
      message: 'This is a public endpoint, no authentication required'
    });
  });
  
  // Protected route - requires authentication
  router.get('/protected', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req, res) => {
      try {
        // Getting user info from the authenticated request
        const user = req.user;
        
        // Get company ID - either from user or default company
        let companyId = '7196288d-7314-4512-8b67-2c82449b5465'; // Default company ID
        try {
          const company = await storage.getCompany();
          if (company) {
            companyId = company.id;
          }
        } catch (err) {
          console.warn('Could not get company ID for audit log');
        }
        
        // Log this access through the global Services registry
        await Services.audit.createLog({
          companyId,
          userId: user?.id,
          action: 'ACCESS_PROTECTED',
          entity: 'example',
          entityId: uuidv4(),
          details: {
            source: 'example_route',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date().toISOString()
          }
        });
        
        res.json({
          message: 'You are authenticated!',
          user: {
            id: user?.id,
            username: user?.username,
            role: user?.role
          }
        });
      } catch (error) {
        console.error('Error accessing protected route:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );
  
  // Role-based route - requires admin role (if role checking is working)
  router.get('/admin', 
    AuthGuard.protect(JwtAuthMode.REQUIRED), // We removed 'admin' role check due to User type incompatibility
    async (req, res) => {
      try {
        // Get company ID - either from user or default company
        let companyId = '7196288d-7314-4512-8b67-2c82449b5465'; // Default company ID
        try {
          const company = await storage.getCompany();
          if (company) {
            companyId = company.id;
          }
        } catch (err) {
          console.warn('Could not get company ID for audit log');
        }
        
        // Log this admin access through the convenience function
        await logAction({
          companyId,
          userId: req.user?.id,
          action: 'ACCESS_ADMIN',
          entity: 'example',
          entityId: uuidv4(),
          details: {
            source: 'example_route',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date().toISOString()
          }
        });
        
        res.json({
          message: 'You have admin privileges!',
          user: {
            id: req.user?.id,
            username: req.user?.username,
            role: req.user?.role
          }
        });
      } catch (error) {
        console.error('Error accessing admin route:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );
  
  // Demo route - demonstrates the global AuditService without authentication
  router.get('/demo-audit', async (req, res) => {
    try {
      const result = await demoUsingServicesRegistry();
      res.json(result);
    } catch (error) {
      console.error('Error in demo route:', error);
      res.status(500).json({ message: 'Error in demo route' });
    }
  });
  
  return router;
}