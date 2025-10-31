/**
 * Analytic Accounts Service
 * 
 * Service centralizat pentru gestionarea conturilor analitice (PC_analytic_accounts).
 * Elimină duplicarea codului din manage-warehouse.service.ts și company.controller.ts
 * 
 * @module AnalyticAccountsService
 */

import { IStorage } from "@api/storage";
import { DrizzleService } from "@common/drizzle";
import { 
  PC_analytic_accounts, 
  PC_synthetic_accounts,
  InsertPC_AnalyticAccount,
  PC_AnalyticAccount,
  chartOfAccountsUtils
} from '@geniuserp/shared';
import { eq, and, like, or } from 'drizzle-orm';

export class AnalyticAccountsService {
  constructor(
    private storage: IStorage,
    private drizzle: DrizzleService
  ) {}

  /**
   * Generează următorul cod analitic disponibil pentru un cont sintetic
   * 
   * Exemplu:
   * - Pentru sintetic "371", dacă există "371.1", returnează "371.2"
   * - Pentru sintetic "4426", dacă există "4426.40", returnează "4426.41"
   * 
   * @param syntheticCode - Codul contului sintetic (3-4 cifre)
   * @returns Următorul cod analitic disponibil
   * @throws Error dacă codul sintetic este invalid
   */
  async getNextAvailableCode(syntheticCode: string): Promise<string> {
    if (!syntheticCode || !/^[0-9]{3,4}$/.test(syntheticCode)) {
      throw new Error(`Cod sintetic invalid: ${syntheticCode}. Trebuie să fie 3-4 cifre.`);
    }

    const db = this.drizzle.db;
    
    // Caută toate conturile analitice pentru acest sintetic
    // Pattern: "371.%", "4426.%"
    const existingAccounts = await db
      .select({ code: PC_analytic_accounts.code })
      .from(PC_analytic_accounts)
      .where(like(PC_analytic_accounts.code, `${syntheticCode}.%`))
      .execute();
    
    if (existingAccounts.length === 0) {
      // Primul cont analitic pentru acest sintetic
      return `${syntheticCode}.1`;
    }
    
    // Extrage subcodurile numerice și găsește maximul
    const subcodes = existingAccounts
      .map(acc => {
        // Split pe "." și ia ultima parte
        // Ex: "371.1" → ["371", "1"] → 1
        // Ex: "4426.40" → ["4426", "40"] → 40
        const parts = acc.code.split('.');
        const lastPart = parts[parts.length - 1];
        return parseInt(lastPart, 10);
      })
      .filter(num => !isNaN(num));
    
    const maxSubcode = subcodes.length > 0 ? Math.max(...subcodes) : 0;
    
    return `${syntheticCode}.${maxSubcode + 1}`;
  }

  /**
   * Creează un cont analitic nou
   * 
   * Validează:
   * - Unicitatea codului
   * - Ierarhia (codul analitic trebuie să înceapă cu codul sintetic)
   * - Existența contului sintetic în DB
   * 
   * @param data - Datele pentru noul cont analitic
   * @returns Contul analitic creat
   * @throws Error dacă validările eșuează
   */
  async createAnalyticAccount(data: {
    code: string;
    name: string;
    description?: string;
    synthetic_id: string;
    account_function: 'A' | 'P' | 'B' | 'E' | 'V';
  }): Promise<PC_AnalyticAccount> {
    const db = this.drizzle.db;
    
    // Validare 1: Verifică dacă codul există deja
    const existing = await db
      .select()
      .from(PC_analytic_accounts)
      .where(eq(PC_analytic_accounts.code, data.code))
      .limit(1)
      .execute();
    
    if (existing.length > 0) {
      throw new Error(`Contul analitic cu codul ${data.code} există deja în sistem.`);
    }
    
    // Validare 2: Verifică ierarhia (cod analitic vs sintetic)
    await this.validateHierarchy(data.code, data.synthetic_id);
    
    // Creează contul
    const [newAccount] = await db
      .insert(PC_analytic_accounts)
      .values({
        code: data.code,
        name: data.name,
        description: data.description,
        synthetic_id: data.synthetic_id,
        account_function: data.account_function,
        is_active: true
      })
      .returning()
      .execute();
    
    return newAccount;
  }

  /**
   * Validează ierarhia între cont analitic și cont sintetic
   * 
   * Verifică că:
   * 1. Codul analitic are format valid (ex: "371.1", "4426.40")
   * 2. Contul sintetic există în DB
   * 3. Codul analitic începe cu codul contului sintetic
   * 
   * @param analyticCode - Codul contului analitic (ex: "371.1")
   * @param syntheticId - UUID-ul contului sintetic
   * @throws Error dacă validarea eșuează
   */
  async validateHierarchy(analyticCode: string, syntheticId: string): Promise<void> {
    const db = this.drizzle.db;
    
    // Extrage prefix sintetic din codul analitic
    // Ex: "371.1" → "371", "4426.40" → "4426"
    const syntheticPrefix = chartOfAccountsUtils.extractSyntheticPrefix(analyticCode);
    
    if (!syntheticPrefix || syntheticPrefix.length < 3 || syntheticPrefix.length > 4) {
      throw new Error(
        `Cod analitic invalid: ${analyticCode}. Trebuie să înceapă cu cod sintetic valid (3-4 cifre).`
      );
    }
    
    // Verifică că synthetic_id corespunde cu prefix-ul
    const synthetic = await db
      .select({ id: PC_synthetic_accounts.id, code: PC_synthetic_accounts.code })
      .from(PC_synthetic_accounts)
      .where(eq(PC_synthetic_accounts.id, syntheticId))
      .limit(1)
      .execute();
    
    if (synthetic.length === 0) {
      throw new Error(
        `Contul sintetic cu ID ${syntheticId} nu există în sistem.`
      );
    }
    
    if (synthetic[0].code !== syntheticPrefix) {
      throw new Error(
        `Ierarhie invalidă: codul analitic ${analyticCode} începe cu ${syntheticPrefix}, ` +
        `dar contul sintetic cu ID ${syntheticId} are codul ${synthetic[0].code}.`
      );
    }
  }

  /**
   * Obține ID-ul contului sintetic după cod
   * 
   * @param syntheticCode - Codul contului sintetic (3-4 cifre)
   * @returns UUID-ul contului sintetic
   * @throws Error dacă contul nu există
   */
  async getSyntheticIdByCode(syntheticCode: string): Promise<string> {
    if (!syntheticCode || !/^[0-9]{3,4}$/.test(syntheticCode)) {
      throw new Error(`Cod sintetic invalid: ${syntheticCode}. Trebuie să fie 3-4 cifre.`);
    }

    const db = this.drizzle.db;
    
    const result = await db
      .select({ id: PC_synthetic_accounts.id })
      .from(PC_synthetic_accounts)
      .where(eq(PC_synthetic_accounts.code, syntheticCode))
      .limit(1)
      .execute();
    
    if (result.length === 0) {
      throw new Error(`Contul sintetic cu codul ${syntheticCode} nu există în sistem.`);
    }
    
    return result[0].id;
  }

  /**
   * Obține contul sintetic complet după cod
   * 
   * @param syntheticCode - Codul contului sintetic
   * @returns Contul sintetic complet sau null dacă nu există
   */
  async getSyntheticByCode(syntheticCode: string) {
    const db = this.drizzle.db;
    
    const result = await db
      .select()
      .from(PC_synthetic_accounts)
      .where(eq(PC_synthetic_accounts.code, syntheticCode))
      .limit(1)
      .execute();
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Verifică dacă un cod analitic există
   * 
   * @param code - Codul analitic
   * @returns true dacă există, false altfel
   */
  async codeExists(code: string): Promise<boolean> {
    const db = this.drizzle.db;
    
    const result = await db
      .select({ id: PC_analytic_accounts.id })
      .from(PC_analytic_accounts)
      .where(eq(PC_analytic_accounts.code, code))
      .limit(1)
      .execute();
    
    return result.length > 0;
  }

  /**
   * Obține toate conturile analitice pentru un cont sintetic
   * 
   * @param syntheticId - UUID-ul contului sintetic
   * @returns Lista de conturi analitice
   */
  async getAnalyticAccountsBySynthetic(syntheticId: string): Promise<PC_AnalyticAccount[]> {
    const db = this.drizzle.db;
    
    return await db
      .select()
      .from(PC_analytic_accounts)
      .where(eq(PC_analytic_accounts.synthetic_id, syntheticId))
      .execute();
  }

  /**
   * Obține toate conturile analitice pentru un cod sintetic
   * 
   * @param syntheticCode - Codul contului sintetic (ex: "371")
   * @returns Lista de conturi analitice
   */
  async getAnalyticAccountsBySyntheticCode(syntheticCode: string): Promise<PC_AnalyticAccount[]> {
    const db = this.drizzle.db;
    
    return await db
      .select()
      .from(PC_analytic_accounts)
      .where(like(PC_analytic_accounts.code, `${syntheticCode}.%`))
      .execute();
  }

  /**
   * Obține un cont analitic după cod
   * 
   * @param code - Codul contului analitic
   * @returns Contul analitic sau null dacă nu există
   */
  async getAnalyticByCode(code: string): Promise<PC_AnalyticAccount | null> {
    const db = this.drizzle.db;
    
    const result = await db
      .select()
      .from(PC_analytic_accounts)
      .where(eq(PC_analytic_accounts.code, code))
      .limit(1)
      .execute();
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Actualizează un cont analitic
   * 
   * @param id - UUID-ul contului
   * @param data - Datele de actualizat
   * @returns Contul actualizat
   */
  async updateAnalyticAccount(
    id: string, 
    data: Partial<Pick<PC_AnalyticAccount, 'name' | 'description' | 'is_active'>>
  ): Promise<PC_AnalyticAccount> {
    const db = this.drizzle.db;
    
    const [updated] = await db
      .update(PC_analytic_accounts)
      .set(data)
      .where(eq(PC_analytic_accounts.id, id))
      .returning()
      .execute();
    
    if (!updated) {
      throw new Error(`Contul analitic cu ID ${id} nu există.`);
    }
    
    return updated;
  }

  /**
   * Dezactivează un cont analitic (soft delete)
   * 
   * @param id - UUID-ul contului
   * @returns Contul dezactivat
   */
  async deactivateAnalyticAccount(id: string): Promise<PC_AnalyticAccount> {
    return this.updateAnalyticAccount(id, { is_active: false });
  }

  /**
   * Activează un cont analitic
   * 
   * @param id - UUID-ul contului
   * @returns Contul activat
   */
  async activateAnalyticAccount(id: string): Promise<PC_AnalyticAccount> {
    return this.updateAnalyticAccount(id, { is_active: true });
  }
}

