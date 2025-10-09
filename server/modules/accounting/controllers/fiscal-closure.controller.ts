/**
 * Fiscal Closure Controller
 * 
 * API endpoints pentru închiderea fiscală lunară și anuală
 */

import { Request, Response } from 'express';
import FiscalClosureService from '../services/fiscal-closure.service';
import AccountingPeriodsService from '../services/accounting-periods.service';

// Tip pentru request autenticat
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    companyId: string;
    role: string;
  };
}

export class FiscalClosureController {
  private closureService: FiscalClosureService;
  private periodsService: AccountingPeriodsService;

  constructor() {
    this.closureService = new FiscalClosureService();
    this.periodsService = new AccountingPeriodsService();
  }

  /**
   * POST /api/accounting/fiscal-closure/month
   * Închide luna fiscală
   */
  async closeMonth(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { year, month, skipDepreciation, skipFXRevaluation, skipVAT, dryRun } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!year || !month) {
        res.status(400).json({ error: 'Anul și luna sunt obligatorii' });
        return;
      }

      console.log(`📅 Request închidere lună: ${month}/${year} pentru compania ${companyId}`);

      const result = await this.closureService.closeMonth({
        companyId,
        year: parseInt(year),
        month: parseInt(month),
        userId,
        skipDepreciation: skipDepreciation === true,
        skipFXRevaluation: skipFXRevaluation === true,
        skipVAT: skipVAT === true,
        dryRun: dryRun === true
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          message: `Luna ${month}/${year} închisă cu succes`,
          data: result
        });
      } else {
        res.status(400).json({
          success: false,
          message: `Erori la închiderea lunii ${month}/${year}`,
          errors: result.errors,
          warnings: result.warnings
        });
      }
    } catch (error) {
      console.error('Error closing month:', error);
      res.status(500).json({
        error: 'Eroare la închiderea lunii',
        details: (error as Error).message
      });
    }
  }

  /**
   * POST /api/accounting/fiscal-closure/year
   * Închide anul fiscal
   */
  async closeYear(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fiscalYear, taxAdjustments, profitDistribution, dryRun } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!fiscalYear) {
        res.status(400).json({ error: 'Anul fiscal este obligatoriu' });
        return;
      }

      console.log(`📅 Request închidere an: ${fiscalYear} pentru compania ${companyId}`);

      const result = await this.closureService.closeYear({
        companyId,
        fiscalYear: parseInt(fiscalYear),
        userId,
        taxAdjustments,
        profitDistribution,
        dryRun: dryRun === true
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          message: `Anul fiscal ${fiscalYear} închis cu succes`,
          data: result
        });
      } else {
        res.status(400).json({
          success: false,
          message: `Erori la închiderea anului ${fiscalYear}`,
          errors: result.errors,
          warnings: result.warnings
        });
      }
    } catch (error) {
      console.error('Error closing year:', error);
      res.status(500).json({
        error: 'Eroare la închiderea anului',
        details: (error as Error).message
      });
    }
  }

  /**
   * POST /api/accounting/fiscal-closure/reopen/:periodId
   * Redeschide o perioadă închisă (doar admin)
   */
  async reopenPeriod(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { periodId } = req.params;
      const { reason } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!companyId || !userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Doar admin poate redeschide perioade
      if (userRole !== 'admin' && userRole !== 'administrator') {
        res.status(403).json({ error: 'Doar administratorii pot redeschide perioade închise' });
        return;
      }

      if (!reason || reason.trim().length < 10) {
        res.status(400).json({ 
          error: 'Motivul redeschiderii este obligatoriu (minim 10 caractere)' 
        });
        return;
      }

      console.log(`🔓 Request redeschidere perioadă: ${periodId} de către ${userId}`);

      const result = await this.closureService.reopenPeriod(
        companyId,
        periodId,
        userId,
        reason
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Perioada redeschisă cu succes'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error reopening period:', error);
      res.status(500).json({
        error: 'Eroare la redeschiderea perioadei',
        details: (error as Error).message
      });
    }
  }

  /**
   * GET /api/accounting/fiscal-closure/periods
   * Obține toate perioadele fiscale pentru companie
   */
  async getPeriods(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { year } = req.query;

      if (!companyId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const periods = await this.periodsService.getPeriodsForCompany(
        companyId,
        year ? parseInt(year as string) : undefined,
        24 // Ultimele 2 ani
      );

      res.status(200).json({
        success: true,
        data: periods
      });
    } catch (error) {
      console.error('Error fetching periods:', error);
      res.status(500).json({
        error: 'Eroare la obținerea perioadelor',
        details: (error as Error).message
      });
    }
  }

  /**
   * POST /api/accounting/fiscal-closure/generate-periods
   * Generează perioade pentru un an întreg
   */
  async generateYearlyPeriods(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { year } = req.body;
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!year) {
        res.status(400).json({ error: 'Anul este obligatoriu' });
        return;
      }

      console.log(`📅 Generare perioade pentru anul ${year}, compania ${companyId}`);

      const periods = await this.periodsService.generateYearlyPeriods(
        companyId,
        parseInt(year)
      );

      res.status(200).json({
        success: true,
        message: `${periods.length} perioade generate pentru anul ${year}`,
        data: periods
      });
    } catch (error) {
      console.error('Error generating periods:', error);
      res.status(500).json({
        error: 'Eroare la generarea perioadelor',
        details: (error as Error).message
      });
    }
  }

  /**
   * GET /api/accounting/fiscal-closure/period/:periodId
   * Obține detalii despre o perioadă specifică
   */
  async getPeriod(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { periodId } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const period = await this.periodsService.getPeriodById(companyId, periodId);

      if (!period) {
        res.status(404).json({ error: 'Perioada nu a fost găsită' });
        return;
      }

      res.status(200).json({
        success: true,
        data: period
      });
    } catch (error) {
      console.error('Error fetching period:', error);
      res.status(500).json({
        error: 'Eroare la obținerea perioadei',
        details: (error as Error).message
      });
    }
  }

  /**
   * POST /api/accounting/fiscal-closure/validate-period
   * Validează consistența perioadelor
   */
  async validatePeriodConsistency(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const issues = await this.periodsService.validatePeriodConsistency(companyId);

      res.status(200).json({
        success: true,
        hasIssues: issues.length > 0,
        issues
      });
    } catch (error) {
      console.error('Error validating periods:', error);
      res.status(500).json({
        error: 'Eroare la validarea perioadelor',
        details: (error as Error).message
      });
    }
  }
}

export default new FiscalClosureController();

