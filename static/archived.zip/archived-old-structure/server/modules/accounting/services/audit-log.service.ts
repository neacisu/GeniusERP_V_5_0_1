/**
 * Audit Log Service
 * 
 * RECOMANDARE 4: Sistem de logare pentru acțiuni critice
 * Înregistrează toate operațiunile sensibile pentru audit și conformitate
 */

import { getDrizzle } from '../../../common/drizzle';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tipuri de acțiuni critice care necesită audit
 */
export enum AuditAction {
  // Cash operations
  CASH_REGISTER_CLOSED = 'cash_register_closed',
  CASH_TRANSACTION_CREATED = 'cash_transaction_created',
  CASH_TRANSACTION_CANCELED = 'cash_transaction_canceled',
  CASH_TRANSACTION_POSTED = 'cash_transaction_posted',
  CASH_DEPOSIT_TO_BANK = 'cash_deposit_to_bank',
  CASH_WITHDRAWAL_FROM_BANK = 'cash_withdrawal_from_bank',
  CASH_TRANSFER = 'cash_transfer',
  
  // Bank operations
  BANK_TRANSACTION_CREATED = 'bank_transaction_created',
  BANK_TRANSACTION_RECONCILED = 'bank_transaction_reconciled',
  BANK_TRANSFER = 'bank_transfer',
  
  // Critical operations
  DAILY_CLOSING = 'daily_closing',
  BALANCE_ADJUSTMENT = 'balance_adjustment',
  
  // Report generation
  PDF_GENERATED = 'pdf_generated',
  SAFT_EXPORTED = 'saft_exported'
}

/**
 * Severity levels
 */
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

interface AuditLogEntry {
  id: string;
  companyId: string;
  userId: string;
  action: AuditAction;
  severity: AuditSeverity;
  entityType: string; // 'cash_transaction', 'bank_transaction', 'cash_register', etc.
  entityId: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export class AuditLogService {
  /**
   * RECOMANDARE 4: Înregistrează o acțiune critică în audit log
   */
  public async log(params: {
    companyId: string;
    userId: string;
    action: AuditAction;
    severity: AuditSeverity;
    entityType: string;
    entityId: string;
    description: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string> {
    const db = getDrizzle();
    const logId = uuidv4();
    
    try {
      // Insert audit log - ADAPTAT la structura existentă a tabelului
      await db.$client.unsafe(`
        INSERT INTO audit_logs (
          id, company_id, user_id, action,
          entity, entity_id, details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        logId,
        params.companyId,
        params.userId,
        params.action,
        params.entityType, // "entity" în DB (nu entity_type)
        params.entityId,
        JSON.stringify({
          description: params.description,
          severity: params.severity,
          metadata: params.metadata,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          timestamp: new Date().toISOString()
        }) // "details" în DB (nu metadata)
      ]);
      
      // Log to console pentru monitoring
      console.log(`[AUDIT] ${params.severity.toUpperCase()} - ${params.action}: ${params.description}`, {
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId
      });
      
      return logId;
    } catch (error) {
      // Dacă tabelul nu există, doar log în console
      console.error('❌ Audit log DB error (tabel audit_logs lipsă?)', error);
      console.log(`[AUDIT FALLBACK] ${params.severity.toUpperCase()} - ${params.action}: ${params.description}`);
      return logId;
    }
  }
  
  /**
   * Log pentru închidere zilnică (CRITIC)
   */
  public async logDailyClosing(
    companyId: string,
    userId: string,
    cashRegisterId: string,
    date: Date,
    closingBalance: number,
    transactionCount: number
  ): Promise<void> {
    await this.log({
      companyId,
      userId,
      action: AuditAction.DAILY_CLOSING,
      severity: AuditSeverity.CRITICAL,
      entityType: 'cash_register',
      entityId: cashRegisterId,
      description: `Închidere zilnică registru de casă pentru ${date.toLocaleDateString('ro-RO')}`,
      metadata: {
        date: date.toISOString(),
        closingBalance,
        transactionCount,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  /**
   * Log pentru anulare tranzacție (CRITIC)
   */
  public async logTransactionCancellation(
    companyId: string,
    userId: string,
    transactionId: string,
    reason: string,
    amount: number
  ): Promise<void> {
    await this.log({
      companyId,
      userId,
      action: AuditAction.CASH_TRANSACTION_CANCELED,
      severity: AuditSeverity.WARNING,
      entityType: 'cash_transaction',
      entityId: transactionId,
      description: `Tranzacție anulată: ${reason}`,
      metadata: {
        reason,
        amount,
        canceledAt: new Date().toISOString()
      }
    });
  }
  
  /**
   * Log pentru transfer cash-bancă (INFO)
   */
  public async logCashBankTransfer(
    companyId: string,
    userId: string,
    type: 'deposit' | 'withdrawal',
    cashTransactionId: string,
    bankTransactionId: string,
    amount: number
  ): Promise<void> {
    await this.log({
      companyId,
      userId,
      action: type === 'deposit' ? AuditAction.CASH_DEPOSIT_TO_BANK : AuditAction.CASH_WITHDRAWAL_FROM_BANK,
      severity: AuditSeverity.INFO,
      entityType: 'cash_bank_transfer',
      entityId: cashTransactionId,
      description: `Transfer ${type === 'deposit' ? 'depunere' : 'ridicare'} numerar: ${amount} Lei`,
      metadata: {
        cashTransactionId,
        bankTransactionId,
        amount,
        type
      }
    });
  }
  
  /**
   * Query audit logs
   */
  public async getAuditLogs(
    companyId: string,
    filters?: {
      userId?: string;
      action?: AuditAction;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
      severity?: AuditSeverity;
    }
  ): Promise<any[]> {
    const db = getDrizzle();
    
    try {
      let query = `
        SELECT 
          id, company_id, user_id, action, entity, entity_id,
          details, created_at
        FROM audit_logs 
        WHERE company_id = $1
      `;
      const params: any[] = [companyId];
      let paramIndex = 2;
      
      if (filters?.userId) {
        query += ` AND user_id = $${paramIndex}`;
        params.push(filters.userId);
        paramIndex++;
      }
      
      if (filters?.action) {
        query += ` AND action = $${paramIndex}`;
        params.push(filters.action);
        paramIndex++;
      }
      
      if (filters?.entityType) {
        query += ` AND entity = $${paramIndex}`;
        params.push(filters.entityType);
        paramIndex++;
      }
      
      if (filters?.severity) {
        query += ` AND details->>'severity' = $${paramIndex}`;
        params.push(filters.severity);
        paramIndex++;
      }
      
      if (filters?.startDate) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }
      
      if (filters?.endDate) {
        query += ` AND created_at <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }
      
      query += ` ORDER BY created_at DESC LIMIT 1000`;
      
      const result = await db.$client.unsafe(query, params);
      return result;
    } catch (error) {
      console.error('❌ Error fetching audit logs:', error);
      return [];
    }
  }
}

export default AuditLogService;
