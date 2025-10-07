/**
 * Accounting Periods Service
 * 
 * Manages accounting periods with Romanian compliance
 * Supports Open, Soft-Close, Hard-Close statuses per OMFP requirements
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { fiscalPeriods, FiscalPeriod, InsertFiscalPeriod } from '../schema/accounting.schema';
import { AuditLogService } from './audit-log.service';
import { PeriodLockService } from './period-lock.service';

export type PeriodStatus = 'open' | 'soft_close' | 'hard_close';

export interface CreatePeriodRequest {
  companyId: string;
  year: number;
  month: number;
  startDate: Date;
  endDate: Date;
  status?: PeriodStatus;
}

export interface UpdatePeriodRequest {
  status: PeriodStatus;
  closedBy: string;
  reason?: string;
}

export interface PeriodValidation {
  canPost: boolean;
  canModify: boolean;
  message: string;
  status: PeriodStatus;
}

export class AccountingPeriodsService extends DrizzleService {
  private auditService: AuditLogService;
  private lockService: PeriodLockService;

  constructor() {
    super();
    this.auditService = new AuditLogService();
    this.lockService = new PeriodLockService();
  }

  /**
   * Creează o nouă perioadă contabilă
   */
  async createPeriod(request: CreatePeriodRequest): Promise<FiscalPeriod> {
    // Verifică overlapping
    const existing = await this.getPeriodByDate(request.companyId, request.startDate);
    if (existing) {
      throw new Error(`Perioada ${request.startDate.toLocaleDateString('ro-RO')} se suprapune cu o perioadă existentă`);
    }

    const periodData: InsertFiscalPeriod = {
      id: crypto.randomUUID(),
      companyId: request.companyId,
      year: request.year.toString(),
      month: request.month.toString(),
      startDate: request.startDate,
      endDate: request.endDate,
      status: request.status || 'open',
      isClosed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [period] = await this.query((db) => 
      db.insert(fiscalPeriods).values(periodData).returning()
    );

    await this.auditService.log({
      companyId: request.companyId,
      userId: 'system', // TODO: Pass userId from request
      action: 'PERIOD_CREATED' as any,
      severity: 'INFO' as any,
      entityType: 'fiscal_periods',
      entityId: period.id,
      description: `Perioadă creată: ${request.year}/${request.month}`,
      metadata: { year: request.year, month: request.month, status: request.status }
    });

    return period;
  }

  /**
   * Actualizează statusul unei perioade
   */
  async updatePeriodStatus(
    companyId: string,
    periodId: string,
    request: UpdatePeriodRequest
  ): Promise<FiscalPeriod> {
    const existing = await this.getPeriodById(companyId, periodId);
    if (!existing) {
      throw new Error('Perioada nu a fost găsită');
    }

    // Validări pentru tranziții de status
    await this.validateStatusTransition(existing.status as PeriodStatus, request.status);

    const updateData: Partial<InsertFiscalPeriod> = {
      status: request.status,
      isClosed: request.status !== 'open',
      updatedAt: new Date()
    };

    if (request.status !== 'open') {
      updateData.closedAt = new Date();
      updateData.closedBy = request.closedBy;
    } else if (existing.status !== 'open') {
      // Redeschide perioada
      updateData.reopenedAt = new Date();
      updateData.reopenedBy = request.closedBy;
      updateData.reopeningReason = request.reason;
      updateData.closedAt = null;
      updateData.closedBy = null;
    }

    const [period] = await this.query((db) =>
      db.update(fiscalPeriods)
        .set(updateData)
        .where(and(
          eq(fiscalPeriods.id, periodId),
          eq(fiscalPeriods.companyId, companyId)
        ))
        .returning()
    );

    await this.auditService.log({
      companyId,
      userId: request.closedBy,
      action: 'PERIOD_STATUS_CHANGED' as any,
      severity: 'CRITICAL' as any,
      entityType: 'fiscal_periods',
      entityId: periodId,
      description: `Status perioadă schimbat: ${existing.status} → ${request.status}`,
      metadata: { 
        oldStatus: existing.status, 
        newStatus: request.status,
        closedBy: request.closedBy,
        reason: request.reason
      }
    });

    return period;
  }

  /**
   * Obține perioada pentru o dată specifică
   */
  async getPeriodByDate(companyId: string, date: Date): Promise<FiscalPeriod | null> {
    const periods = await this.query((db) =>
      db.select()
        .from(fiscalPeriods)
        .where(and(
          eq(fiscalPeriods.companyId, companyId),
          lte(fiscalPeriods.startDate, date),
          gte(fiscalPeriods.endDate, date)
        ))
        .limit(1)
    );

    return periods[0] || null;
  }

  /**
   * Obține perioada după ID
   */
  async getPeriodById(companyId: string, periodId: string): Promise<FiscalPeriod | null> {
    const periods = await this.query((db) =>
      db.select()
        .from(fiscalPeriods)
        .where(and(
          eq(fiscalPeriods.id, periodId),
          eq(fiscalPeriods.companyId, companyId)
        ))
        .limit(1)
    );

    return periods[0] || null;
  }

  /**
   * Listează perioade pentru o companie
   */
  async getPeriodsForCompany(
    companyId: string,
    year?: number,
    limit = 12
  ): Promise<FiscalPeriod[]> {
    let whereClause: any = eq(fiscalPeriods.companyId, companyId);
    
    if (year) {
      const yearCondition = and(
        whereClause,
        eq(fiscalPeriods.year, year.toString())
      );
      if (yearCondition) {
        whereClause = yearCondition;
      }
    }

    return this.query((db) =>
      db.select()
        .from(fiscalPeriods)
        .where(whereClause)
        .orderBy(fiscalPeriods.year, fiscalPeriods.month)
        .limit(limit)
    );
  }

  /**
   * Validează dacă o tranziție de status este permisă
   */
  private async validateStatusTransition(from: PeriodStatus, to: PeriodStatus): Promise<void> {
    const allowedTransitions = {
      'open': ['soft_close', 'hard_close'],
      'soft_close': ['open', 'hard_close'],
      'hard_close': ['open'] // Doar admin poate redeschide hard_close
    };

    if (!allowedTransitions[from]?.includes(to)) {
      throw new Error(`Tranziția de la ${from} la ${to} nu este permisă`);
    }
  }

  /**
   * Validează operațiile pentru o perioadă
   */
  async validatePeriodOperation(
    companyId: string,
    date: Date,
    operation: 'post' | 'modify' | 'delete'
  ): Promise<PeriodValidation> {
    const period = await this.getPeriodByDate(companyId, date);
    
    if (!period) {
      return {
        canPost: false,
        canModify: false,
        message: 'Perioada contabilă nu este definită pentru această dată',
        status: 'open' // default
      };
    }

    const status = period.status as PeriodStatus;

    switch (status) {
      case 'open':
        return {
          canPost: true,
          canModify: true,
          message: 'Perioada este deschisă - toate operațiile sunt permise',
          status
        };

      case 'soft_close':
        return {
          canPost: false,
          canModify: true,
          message: 'Perioada este soft-închisă - doar modificări sunt permise',
          status
        };

      case 'hard_close':
        return {
          canPost: false,
          canModify: false,
          message: 'Perioada este hard-închisă - nicio operațiune nu este permisă',
          status
        };

      default:
        throw new Error(`Status necunoscut: ${status}`);
    }
  }

  /**
   * Generează perioade pentru un an complet
   */
  async generateYearlyPeriods(companyId: string, year: number): Promise<FiscalPeriod[]> {
    const periods: FiscalPeriod[] = [];

    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Ultima zi a lunii

      try {
        const period = await this.createPeriod({
          companyId,
          year,
          month,
          startDate,
          endDate,
          status: 'open'
        });
        periods.push(period);
      } catch (error) {
        console.warn(`Nu s-a putut crea perioada ${month}/${year}:`, error);
      }
    }

    return periods;
  }

  /**
   * Verifică inconsistențe în perioade
   */
  async validatePeriodConsistency(companyId: string): Promise<string[]> {
    const issues: string[] = [];
    const periods = await this.getPeriodsForCompany(companyId);

    // Verifică goluri în perioade
    periods.sort((a, b) => {
      const yearDiff = parseInt(a.year) - parseInt(b.year);
      if (yearDiff !== 0) return yearDiff;
      return parseInt(a.month) - parseInt(b.month);
    });

    for (let i = 1; i < periods.length; i++) {
      const prev = periods[i - 1];
      const curr = periods[i];
      
      const prevEnd = new Date(prev.endDate);
      const currStart = new Date(curr.startDate);
      
      // Verifică goluri mai mari de o zi
      const daysBetween = Math.floor((currStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60 * 24));
      if (daysBetween > 1) {
        issues.push(`Gol în perioade între ${prev.endDate.toLocaleDateString('ro-RO')} și ${curr.startDate.toLocaleDateString('ro-RO')}`);
      }
    }

    return issues;
  }
}

export default AccountingPeriodsService;
