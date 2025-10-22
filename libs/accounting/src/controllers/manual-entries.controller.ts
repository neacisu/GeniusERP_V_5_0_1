/**
 * Manual Accounting Entries Controller
 * 
 * Controller pentru note contabile manuale conform OMFP 2634/2015
 * Implementează crearea, validarea și gestiunea notelor contabile
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { JournalService, LedgerEntryType } from '../services/journal.service';
import { AccountingPeriodsService } from '../services/accounting-periods.service';
import { BaseController } from './base.controller';
import { AuthenticatedRequest } from "@common/middleware/auth-types";
import { AuditLogService } from '../services/audit-log.service';

/**
 * Validare schema pentru linia contabilă
 */
const AccountingLineSchema = z.object({
  accountCode: z.string().min(3, 'Codul contului trebuie să aibă minim 3 caractere'),
  description: z.string().min(1, 'Descrierea este obligatorie'),
  debitAmount: z.number().min(0, 'Suma debit nu poate fi negativă'),
  creditAmount: z.number().min(0, 'Suma credit nu poate fi negativă')
}).refine(data => 
  data.debitAmount > 0 || data.creditAmount > 0, 
  'Linia trebuie să aibă fie debit, fie credit'
).refine(data => 
  !(data.debitAmount > 0 && data.creditAmount > 0), 
  'O linie nu poate avea atât debit, cât și credit'
);

/**
 * Validare schema pentru nota contabilă manuală
 */
const ManualEntryRequestSchema = z.object({
  entryDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  documentDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  description: z.string().min(10, 'Descrierea trebuie să aibă minim 10 caractere'),
  isStorno: z.boolean().default(false),
  lines: z.array(AccountingLineSchema).min(2, 'Nota trebuie să aibă minim 2 linii contabile')
});

/**
 * Controller pentru note contabile manuale
 */
export class ManualEntriesController extends BaseController {
  private journalService: JournalService;
  private periodsService: AccountingPeriodsService;
  private auditService: AuditLogService;

  constructor() {
    super();
    this.journalService = new JournalService();
    this.periodsService = new AccountingPeriodsService();
    this.auditService = new AuditLogService();
  }

  /**
   * Creează o notă contabilă manuală
   * 
   * @route POST /api/accounting/manual-entries
   * @permission accountant, admin
   */
  async createManualEntry(req: Request, res: Response): Promise<void> {
    try {
      // Validare și autentificare
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      if (!companyId || !userId) {
        res.status(400).json({ error: 'Company ID și User ID sunt obligatorii' });
        return;
      }

      // Validare date input
      const validatedData = ManualEntryRequestSchema.parse(req.body);
      
      const entryDate = new Date(validatedData.entryDate);
      const documentDate = validatedData.documentDate ? new Date(validatedData.documentDate) : entryDate;

      // Validări business
      
      // 1. Verifică că data înregistrării nu este în viitor
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (entryDate > today) {
        res.status(400).json({ error: 'Data înregistrării nu poate fi în viitor' });
        return;
      }

      // 2. Verifică că perioada este deschisă pentru postare
      const periodValidation = await this.periodsService.validatePeriodOperation(
        companyId,
        entryDate,
        'post'
      );

      if (!periodValidation.canPost) {
        res.status(400).json({ 
          error: 'Nu puteți posta în această perioadă', 
          details: periodValidation.message 
        });
        return;
      }

      // 3. Validează echilibrarea
      const totalDebit = validatedData.lines.reduce((sum, line) => sum + line.debitAmount, 0);
      const totalCredit = validatedData.lines.reduce((sum, line) => sum + line.creditAmount, 0);
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        res.status(400).json({ 
          error: 'Nota contabilă nu este echilibrată', 
          details: `Debit: ${totalDebit}, Credit: ${totalCredit}` 
        });
        return;
      }

      // 4. Verifică că nu există linii duplicat pe același cont cu aceeași natură
      const accountUsage = new Map<string, { hasDebit: boolean, hasCredit: boolean }>();
      
      for (const line of validatedData.lines) {
        const usage = accountUsage.get(line.accountCode) || { hasDebit: false, hasCredit: false };
        
        if (line.debitAmount > 0) {
          if (usage.hasDebit) {
            res.status(400).json({ 
              error: `Contul ${line.accountCode} apare de mai multe ori cu debit. Consolidați liniile.` 
            });
            return;
          }
          usage.hasDebit = true;
        }
        
        if (line.creditAmount > 0) {
          if (usage.hasCredit) {
            res.status(400).json({ 
              error: `Contul ${line.accountCode} apare de mai multe ori cu credit. Consolidați liniile.` 
            });
            return;
          }
          usage.hasCredit = true;
        }
        
        accountUsage.set(line.accountCode, usage);
      }

      // Pregătește liniile pentru JournalService
      const journalLines = validatedData.lines.map(line => ({
        accountId: line.accountCode, // JournalService folosește accountId
        accountNumber: line.accountCode, // Fallback
        debitAmount: validatedData.isStorno ? line.creditAmount : line.debitAmount, // Swap pentru storno
        creditAmount: validatedData.isStorno ? line.debitAmount : line.creditAmount, // Swap pentru storno
        description: line.description
      }));

      // Creează înregistrarea în jurnal
      console.log(`📝 Creare notă contabilă manuală pentru ${companyId} de către ${userId}`);
      
      const ledgerEntry = await this.journalService.createLedgerEntry({
        companyId,
        type: LedgerEntryType.GENERAL, // Note manuale = GENERAL
        referenceNumber: undefined, // Se va genera automat
        amount: totalDebit, // Sau totalCredit, sunt egale
        description: validatedData.isStorno ? `[STORNO] ${validatedData.description}` : validatedData.description,
        userId,
        entryDate,
        documentDate,
        lines: journalLines
      });

      // Log audit pentru operațiunea de creare
      await this.auditService.log({
        companyId,
        userId,
        action: 'MANUAL_ENTRY_CREATED' as any,
        severity: 'INFO' as any,
        entityType: 'ledger_entries',
        entityId: ledgerEntry.id,
        description: `Notă contabilă creată manual: ${validatedData.description}`,
        metadata: {
          isStorno: validatedData.isStorno,
          totalAmount: totalDebit,
          linesCount: journalLines.length,
          entryDate: entryDate.toISOString(),
          documentDate: documentDate.toISOString()
        }
      });

      console.log(`✅ Notă contabilă creată cu succes: ${ledgerEntry.journalNumber}`);

      // Returnează rezultatul
      res.status(201).json({
        success: true,
        message: 'Nota contabilă a fost creată cu succes',
        data: {
          id: ledgerEntry.id,
          journalNumber: ledgerEntry.journalNumber,
          entryDate: ledgerEntry.entryDate,
          documentDate: ledgerEntry.documentDate,
          description: ledgerEntry.description,
          amount: ledgerEntry.amount,
          isStorno: validatedData.isStorno,
          linesCount: journalLines.length
        }
      });

    } catch (error) {
      console.error('❌ Eroare creare notă contabilă manuală:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Date invalide',
          details: error.issues.map((err: any) => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      res.status(500).json({ 
        error: 'Eroare internă la crearea notei contabile',
        message: error instanceof Error ? error.message : 'Eroare necunoscută'
      });
    }
  }

  /**
   * Obține lista notelor contabile manuale
   * 
   * @route GET /api/accounting/manual-entries
   * @permission accountant, admin, manager
   */
  async getManualEntries(req: Request, res: Response): Promise<void> {
    try {
      const companyId = this.getCompanyId(req);
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID este obligatoriu' });
        return;
      }

      // Parametri de filtrare opționali
      const { 
        startDate, 
        endDate, 
        page = '1', 
        limit = '50',
        includeStorno = 'true'
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100); // Max 100 per pagină
      const offset = (pageNum - 1) * limitNum;

      // TODO: Implementare query pentru obținerea notelor contabile
      // Pentru moment returnăm răspuns de structură
      
      res.json({
        success: true,
        data: {
          entries: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            totalPages: 0
          },
          filters: {
            startDate,
            endDate,
            includeStorno: includeStorno === 'true'
          }
        },
        message: 'Query implementat parțial - necesită extindere pentru filtrare completă'
      });

    } catch (error) {
      console.error('❌ Eroare obținere note contabile:', error);
      res.status(500).json({ 
        error: 'Eroare internă',
        message: error instanceof Error ? error.message : 'Eroare necunoscută'
      });
    }
  }

  /**
   * Obține detaliile unei note contabile
   * 
   * @route GET /api/accounting/manual-entries/:id
   * @permission accountant, admin, manager
   */
  async getManualEntry(req: Request, res: Response): Promise<void> {
    try {
      const companyId = this.getCompanyId(req);
      const { id } = req.params;
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID este obligatoriu' });
        return;
      }

      if (!id) {
        res.status(400).json({ error: 'ID-ul notei este obligatoriu' });
        return;
      }

      // TODO: Implementare query pentru obținerea detaliilor notei
      res.status(501).json({ 
        error: 'Funcționalitate în implementare',
        message: 'Obținerea detaliilor notei va fi implementată'
      });

    } catch (error) {
      console.error('❌ Eroare obținere detalii notă:', error);
      res.status(500).json({ 
        error: 'Eroare internă',
        message: error instanceof Error ? error.message : 'Eroare necunoscută'
      });
    }
  }

  /**
   * Validează o notă contabilă înainte de salvare (preview)
   * 
   * @route POST /api/accounting/manual-entries/validate
   * @permission accountant, admin
   */
  async validateManualEntry(req: Request, res: Response): Promise<void> {
    try {
      const companyId = this.getCompanyId(req);
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID este obligatoriu' });
        return;
      }

      // Validare date fără a crea înregistrarea
      const validatedData = ManualEntryRequestSchema.parse(req.body);
      
      const entryDate = new Date(validatedData.entryDate);
      const documentDate = validatedData.documentDate ? new Date(validatedData.documentDate) : entryDate;

      // Validări business (fără a salva)
      const totalDebit = validatedData.lines.reduce((sum, line) => sum + line.debitAmount, 0);
      const totalCredit = validatedData.lines.reduce((sum, line) => sum + line.creditAmount, 0);
      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

      // Verifică perioada
      const periodValidation = await this.periodsService.validatePeriodOperation(
        companyId,
        entryDate,
        'post'
      );

      const validationResult = {
        isValid: isBalanced && periodValidation.canPost,
        isBalanced,
        totalDebit,
        totalCredit,
        difference: Math.abs(totalDebit - totalCredit),
        periodStatus: {
          canPost: periodValidation.canPost,
          message: periodValidation.message,
          status: periodValidation.status
        },
        linesCount: validatedData.lines.length,
        warnings: [] as string[],
        errors: [] as string[]
      };

      // Adaugă warnings și errors
      if (!isBalanced) {
        validationResult.errors.push(`Nota nu este echilibrată. Diferență: ${validationResult.difference.toFixed(2)} lei`);
      }

      if (!periodValidation.canPost) {
        validationResult.errors.push(periodValidation.message);
      }

      const today = new Date();
      if (entryDate > today) {
        validationResult.errors.push('Data înregistrării nu poate fi în viitor');
      }

      if (validatedData.isStorno) {
        validationResult.warnings.push('Această este o înregistrare de stornare - semnele vor fi inversate');
      }

      res.json({
        success: true,
        validation: validationResult
      });

    } catch (error) {
      console.error('❌ Eroare validare notă contabilă:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Date invalide pentru validare',
          details: error.issues
        });
        return;
      }

      res.status(500).json({ 
        error: 'Eroare internă la validare',
        message: error instanceof Error ? error.message : 'Eroare necunoscută'
      });
    }
  }
}

export default ManualEntriesController;
