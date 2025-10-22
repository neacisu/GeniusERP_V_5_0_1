/**
 * Accounting Templates Service
 * 
 * Serviciu pentru gestionarea șabloanelor de note contabile și reversări automate
 * Implementează template-uri pentru operațiuni recurente conform OMFP 2634/2015
 * Enhanced cu Redis caching (TTL: 24h pentru templates list, 12h pentru individual)
 */

import { DrizzleService } from "@common/drizzle/drizzle.service";
import { eq, and, sql } from 'drizzle-orm';
import { JournalService, LedgerEntryType } from './journal.service';
import { AuditLogService } from './audit-log.service';
import { RedisService } from '../../../services/redis.service';

/**
 * Interface pentru șablonul de notă contabilă
 */
interface AccountingTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  isRecurring: boolean;
  frequency?: RecurrenceFrequency;
  isActive: boolean;
  companyId: string;
  lines: TemplateAccountingLine[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Interface pentru linia șablonului
 */
interface TemplateAccountingLine {
  id: string;
  templateId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debitFormula?: string; // Ex: "amount", "amount * 0.19", "balance('411')"
  creditFormula?: string;
  isVariable: boolean; // Dacă utilizatorul trebuie să introducă suma manual
  orderIndex: number;
}

/**
 * Categorii de șabloane
 */
type TemplateCategory = 
  | 'depreciation'     // Amortizări
  | 'accrual'         // Regularizări
  | 'provision'       // Provizioane
  | 'closing'         // Închideri
  | 'adjustment'      // Ajustări
  | 'payroll'         // Salarizare
  | 'tax'            // Impozite și taxe
  | 'inventory'       // Inventar
  | 'other';          // Altele

/**
 * Frecvența pentru șabloane recurente
 */
type RecurrenceFrequency = 
  | 'monthly'         // Lunar
  | 'quarterly'       // Trimestrial
  | 'yearly'         // Anual
  | 'on_demand';     // La cerere

/**
 * Interface pentru aplicarea șablonului
 */
interface ApplyTemplateRequest {
  templateId: string;
  companyId: string;
  entryDate: Date;
  documentDate?: Date;
  variables?: Record<string, number>; // Valori pentru variabilele din șablon
  description?: string; // Suprascriere descriere
  isStorno?: boolean;
  userId: string;
}

/**
 * Interface pentru reversarea automată
 */
interface AutoReversalRequest {
  originalEntryId: string;
  companyId: string;
  reversalDate: Date;
  reversalReason: string;
  userId: string;
  isFullReversal?: boolean; // True = reversare completă, False = parțială
  partialLines?: Array<{
    accountCode: string;
    debitAmount: number;
    creditAmount: number;
    description: string;
  }>;
}

/**
 * Serviciu pentru șabloane și reversări
 */
export class AccountingTemplatesService extends DrizzleService {
  private journalService: JournalService;
  private auditService: AuditLogService;
  private redisService: RedisService;

  constructor() {
    super();
    this.journalService = new JournalService();
    this.auditService = new AuditLogService();
    this.redisService = new RedisService();
  }

  private async ensureRedisConnection(): Promise<void> {
    if (!this.redisService.isConnected()) {
      await this.redisService.connect();
    }
  }

  /**
   * Obține șabloanele predefinite pentru o companie
   * Redis cache: 24h TTL
   */
  async getTemplatesForCompany(companyId: string, category?: TemplateCategory): Promise<AccountingTemplate[]> {
    await this.ensureRedisConnection();
    
    const cacheKey = `acc:templates:${companyId}:category:${category || 'all'}`;
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<AccountingTemplate[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Pentru început, returnez șabloane hardcode-ate
    // În viitor acestea vor fi stocate în baza de date
    const predefinedTemplates: Partial<AccountingTemplate>[] = [
      {
        id: 'tpl_depreciation_monthly',
        name: 'Amortizare Lunară Imobilizări',
        description: 'Înregistrare amortizare lunară pentru imobilizările corporale',
        category: 'depreciation',
        isRecurring: true,
        frequency: 'monthly',
        isActive: true,
        lines: [
          {
            id: '1',
            templateId: 'tpl_depreciation_monthly',
            accountCode: '6811',
            accountName: 'Cheltuieli cu amortizarea imobilizărilor corporale',
            description: 'Amortizare ${asset_category}',
            debitFormula: 'depreciation_amount',
            isVariable: true,
            orderIndex: 1
          },
          {
            id: '2',
            templateId: 'tpl_depreciation_monthly',
            accountCode: '281',
            accountName: 'Amortizări privind imobilizările corporale',
            description: 'Amortizare cumulată ${asset_category}',
            creditFormula: 'depreciation_amount',
            isVariable: true,
            orderIndex: 2
          }
        ]
      },
      {
        id: 'tpl_vat_accrual',
        name: 'Regularizare TVA Deductibilă',
        description: 'Înregistrare TVA deductibilă pentru perioada curentă',
        category: 'accrual',
        isRecurring: false,
        isActive: true,
        lines: [
          {
            id: '1',
            templateId: 'tpl_vat_accrual',
            accountCode: '4426',
            accountName: 'TVA deductibilă',
            description: 'TVA deductibilă ${period}',
            debitFormula: 'vat_amount',
            isVariable: true,
            orderIndex: 1
          },
          {
            id: '2',
            templateId: 'tpl_vat_accrual',
            accountCode: '4428',
            accountName: 'TVA neexigibilă',
            description: 'TVA neexigibilă ${period}',
            creditFormula: 'vat_amount',
            isVariable: true,
            orderIndex: 2
          }
        ]
      },
      {
        id: 'tpl_prepaid_expenses',
        name: 'Cheltuieli în Avans',
        description: 'Înregistrare cheltuieli plătite în avans',
        category: 'accrual',
        isRecurring: false,
        isActive: true,
        lines: [
          {
            id: '1',
            templateId: 'tpl_prepaid_expenses',
            accountCode: '471',
            accountName: 'Cheltuieli înregistrate în avans',
            description: 'Cheltuieli ${expense_type} pentru ${period}',
            debitFormula: 'prepaid_amount',
            isVariable: true,
            orderIndex: 1
          },
          {
            id: '2',
            templateId: 'tpl_prepaid_expenses',
            accountCode: '5121',
            accountName: 'Conturi la bănci în lei',
            description: 'Plată anticipată ${expense_type}',
            creditFormula: 'prepaid_amount',
            isVariable: true,
            orderIndex: 2
          }
        ]
      },
      {
        id: 'tpl_month_end_closing',
        name: 'Închidere Fin de Lună',
        description: 'Închiderea veniturilor și cheltuielilor la sfârșitul lunii',
        category: 'closing',
        isRecurring: true,
        frequency: 'monthly',
        isActive: true,
        lines: [
          {
            id: '1',
            templateId: 'tpl_month_end_closing',
            accountCode: '7',
            accountName: 'Conturi de venituri (clasa 7)',
            description: 'Închidere venituri ${month}',
            debitFormula: 'revenue_total',
            isVariable: true,
            orderIndex: 1
          },
          {
            id: '2',
            templateId: 'tpl_month_end_closing',
            accountCode: '121',
            accountName: 'Profit sau pierdere',
            description: 'Transfer venituri în rezultat',
            creditFormula: 'revenue_total',
            isVariable: true,
            orderIndex: 2
          }
        ]
      },
      {
        id: 'tpl_provision_bad_debts',
        name: 'Provizioane Creanțe Îndoielnice',
        description: 'Constituire provizioane pentru creanțele îndoielnice',
        category: 'provision',
        isRecurring: false,
        isActive: true,
        lines: [
          {
            id: '1',
            templateId: 'tpl_provision_bad_debts',
            accountCode: '654',
            accountName: 'Cheltuieli privind provizioanele pentru depreciere',
            description: 'Constituire provizioane creanțe ${client_info}',
            debitFormula: 'provision_amount',
            isVariable: true,
            orderIndex: 1
          },
          {
            id: '2',
            templateId: 'tpl_provision_bad_debts',
            accountCode: '491',
            accountName: 'Provizioane pentru depreciera creanțelor',
            description: 'Provizioane creanțe ${client_info}',
            creditFormula: 'provision_amount',
            isVariable: true,
            orderIndex: 2
          }
        ]
      }
    ];

    // Filtrează după categorie dacă este specificată
    let templates = predefinedTemplates;
    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    // Adaugă informații despre companie și date
    const result = templates.map(template => ({
      ...template,
      companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    } as AccountingTemplate));

    // Cache the result
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, result, 86400); // 24 hours
    }

    return result;
  }

  /**
   * Aplică un șablon și creează nota contabilă
   */
  async applyTemplate(request: ApplyTemplateRequest): Promise<string> {
    // Obține șablonul
    const templates = await this.getTemplatesForCompany(request.companyId);
    const template = templates.find(t => t.id === request.templateId);

    if (!template) {
      throw new Error(`Șablonul cu ID-ul ${request.templateId} nu a fost găsit`);
    }

    if (!template.isActive) {
      throw new Error(`Șablonul ${template.name} nu este activ`);
    }

    // Procesează liniile și evaluează formulele
    const processedLines = [];
    
    for (const templateLine of template.lines) {
      let debitAmount = 0;
      let creditAmount = 0;

      // Evaluează formulele
      if (templateLine.debitFormula) {
        debitAmount = this.evaluateFormula(templateLine.debitFormula, request.variables || {});
      }

      if (templateLine.creditFormula) {
        creditAmount = this.evaluateFormula(templateLine.creditFormula, request.variables || {});
      }

      // Verifică dacă linia are valori
      if (debitAmount === 0 && creditAmount === 0) {
        throw new Error(`Linia pentru contul ${templateLine.accountCode} nu are sumă specificată. Verificați variabilele furnizate.`);
      }

      processedLines.push({
        accountId: templateLine.accountCode,
        accountNumber: templateLine.accountCode,
        debitAmount: request.isStorno ? creditAmount : debitAmount,
        creditAmount: request.isStorno ? debitAmount : creditAmount,
        description: this.processDescription(templateLine.description, request.variables || {})
      });
    }

    // Calculează suma totală
    const totalAmount = processedLines.reduce((sum, line) => sum + Math.max(line.debitAmount, line.creditAmount), 0);

    // Creează descrierea finală
    const finalDescription = request.description || template.description;
    const description = request.isStorno ? `[STORNO] ${finalDescription}` : finalDescription;

    // Creează înregistrarea în jurnal
    const ledgerEntry = await this.journalService.createLedgerEntry({
      companyId: request.companyId,
      type: LedgerEntryType.GENERAL,
      amount: totalAmount,
      description,
      userId: request.userId,
      entryDate: request.entryDate,
      documentDate: request.documentDate || request.entryDate,
      lines: processedLines
    });

    // Log audit
    await this.auditService.log({
      companyId: request.companyId,
      userId: request.userId,
      action: 'TEMPLATE_APPLIED' as any,
      severity: 'INFO' as any,
      entityType: 'ledger_entries',
      entityId: ledgerEntry.id,
      description: `Șablon aplicat: ${template.name}`,
      metadata: {
        templateId: request.templateId,
        templateName: template.name,
        isStorno: request.isStorno,
        variables: request.variables
      }
    });

    console.log(`✅ Șablon aplicat cu succes: ${template.name} → ${ledgerEntry.journalNumber}`);

    return ledgerEntry.id;
  }

  /**
   * Creează o reversare automată pentru o înregistrare existentă
   */
  async createAutoReversal(request: AutoReversalRequest): Promise<string> {
    // TODO: Implementează query pentru obținerea înregistrării originale
    // Pentru moment simulez structura
    
    // Obține înregistrarea originală din baza de date
    // const originalEntry = await this.getOriginalEntry(request.originalEntryId, request.companyId);
    
    // Simulare pentru dezvoltare
    const originalLines = [
      { accountCode: '471', debitAmount: 1000, creditAmount: 0, description: 'Cheltuieli în avans' },
      { accountCode: '5121', debitAmount: 0, creditAmount: 1000, description: 'Plată anticipată' }
    ];

    // Creează liniile de reversare
    const reversalLines = originalLines.map(line => ({
      accountId: line.accountCode,
      accountNumber: line.accountCode,
      debitAmount: line.creditAmount, // Swap debit/credit pentru reversare
      creditAmount: line.debitAmount,
      description: `[REVERSARE] ${line.description}`
    }));

    const totalAmount = reversalLines.reduce((sum, line) => sum + Math.max(line.debitAmount, line.creditAmount), 0);

    // Creează înregistrarea de reversare
    const reversalEntry = await this.journalService.createLedgerEntry({
      companyId: request.companyId,
      type: LedgerEntryType.REVERSAL,
      amount: totalAmount,
      description: `[REVERSARE] ${request.reversalReason}`,
      userId: request.userId,
      entryDate: request.reversalDate,
      documentDate: request.reversalDate,
      lines: reversalLines
    });

    // Log audit pentru reversare
    await this.auditService.log({
      companyId: request.companyId,
      userId: request.userId,
      action: 'AUTO_REVERSAL_CREATED' as any,
      severity: 'CRITICAL' as any,
      entityType: 'ledger_entries',
      entityId: reversalEntry.id,
      description: `Reversare automată: ${request.reversalReason}`,
      metadata: {
        originalEntryId: request.originalEntryId,
        reversalReason: request.reversalReason,
        isFullReversal: request.isFullReversal,
        reversalDate: request.reversalDate.toISOString()
      }
    });

    console.log(`✅ Reversare automată creată: ${reversalEntry.journalNumber}`);

    return reversalEntry.id;
  }

  /**
   * Programează reversări automate pentru sfârșitul perioadei (cut-off entries)
   */
  async schedulePeriodicReversals(
    companyId: string,
    currentPeriodEnd: Date,
    nextPeriodStart: Date,
    userId: string
  ): Promise<string[]> {
    // Găsește înregistrările care trebuie reversate automat
    // (de exemplu, toate înregistrările cu cont 471 - cheltuieli în avans)
    
    const reversalEntryIds: string[] = [];

    // TODO: Implementează query pentru găsirea înregistrărilor de tip accrual
    // care trebuie reversate automat la sfârșitul perioadei

    console.log(`📅 Programare reversări pentru perioada ${currentPeriodEnd.toLocaleDateString('ro-RO')}`);

    // Pentru demonstrație, simulez o reversare
    try {
      const reversalId = await this.createAutoReversal({
        originalEntryId: 'simulation_entry',
        companyId,
        reversalDate: nextPeriodStart,
        reversalReason: 'Reversare automată fin de perioadă',
        userId,
        isFullReversal: true
      });

      reversalEntryIds.push(reversalId);
    } catch (error) {
      console.warn('Simulare reversare:', error);
    }

    return reversalEntryIds;
  }

  /**
   * Evaluează o formulă simpla pentru calculul sumelor
   */
  private evaluateFormula(formula: string, variables: Record<string, number>): number {
    // Implementare simplă de evaluare a formulelor
    // În produzione ar trebui să folosiți o librărie mai robustă
    
    let result = 0;
    
    try {
      // Înlocuiește variabilele în formulă
      let processedFormula = formula;
      
      for (const [varName, varValue] of Object.entries(variables)) {
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        processedFormula = processedFormula.replace(regex, varValue.toString());
      }

      // Evaluează expresia matematică simplă
      // ATENȚIE: În produzione folosiți o librărie sigură pentru evaluarea expresiilor
      if (/^[0-9+\-*/(). ]+$/.test(processedFormula)) {
        result = eval(processedFormula);
      } else if (!isNaN(Number(processedFormula))) {
        result = Number(processedFormula);
      } else {
        throw new Error(`Formula nu poate fi evaluată: ${formula}`);
      }
    } catch (error) {
      console.error('Eroare evaluare formulă:', error);
      throw new Error(`Eroare la evaluarea formulei "${formula}": ${error}`);
    }

    return result;
  }

  /**
   * Procesează descrierea înlocuind variabilele
   */
  private processDescription(template: string, variables: Record<string, any>): string {
    let description = template;

    for (const [varName, varValue] of Object.entries(variables)) {
      const regex = new RegExp(`\\$\\{${varName}\\}`, 'g');
      description = description.replace(regex, String(varValue));
    }

    // Elimină variabilele neînlocuite
    description = description.replace(/\$\{[^}]+\}/g, '');

    return description.trim();
  }
}

export default AccountingTemplatesService;
