import { Router } from "express";
import { AuthGuard } from "@geniuserp/auth";
import { JwtAuthMode } from "@geniuserp/auth";
import { accountingReadRateLimiter } from "@api/middlewares/rate-limit.middleware";
import { financialReportsService } from "../services/financial-reports.service";

/**
 * Setup routes for Financial Reports
 * REFACTORED: Moved logic to service layer with Redis caching
 * All routes have rate limiting applied
 */
export function setupFinancialReportsRoutes() {
  const router = Router();
  
  // Apply authentication middleware to all routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
  
  /**
   * Get financial reports summary
   * Enhanced with Redis caching (5min TTL)
   */
  router.get("/financial-reports", accountingReadRateLimiter, async (req: any, res) => {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID not found' });
      }
      
      const reports = await financialReportsService.getFinancialReports(companyId);
      res.json(reports);
    } catch (error: any) {
      console.error('Error getting financial reports:', error);
      res.status(500).json({ error: 'Failed to get financial reports' });
    }
  });
  
  /**
   * Get financial indicators (KPIs)
   * Enhanced with Redis caching (5min TTL)
   */
  router.get("/financial-indicators", accountingReadRateLimiter, async (req: any, res) => {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID not found' });
      }
      
      const indicators = await financialReportsService.getFinancialIndicators(companyId);
      res.json(indicators);
    } catch (error: any) {
      console.error('Error getting financial indicators:', error);
      res.status(500).json({ error: 'Failed to get financial indicators' });
    }
  });
  
  return router;
}
