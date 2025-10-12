/**
 * Nota Contabila Service
 * 
 * Acest serviciu gestionează crearea notelor contabile pentru diferite operațiuni contabile.
 * Este folosit de alte servicii cum ar fi NIR, facturi, etc. pentru a genera înregistrările
 * contabile automate conforme cu standardele contabile românești.
 */

import { randomUUID } from 'crypto';
import { getDrizzle, getClient } from '../../../common/drizzle';
import { storage } from '../../../storage';

// Tipurile de cont (activ, pasiv)
export enum AccountType {
  ACTIVE = 'A',    // Cont de activ (se debitează la creștere, se creditează la scădere)
  PASSIVE = 'P',   // Cont de pasiv (se creditează la creștere, se debitează la scădere)
  EXPENSE = 'E',   // Cont de cheltuieli (se debitează la creștere, se creditează la scădere)
  REVENUE = 'V',   // Cont de venituri (se creditează la creștere, se debitează la scădere)
  BIFUNCTIONAL = 'B', // Cont bifuncțional (poate fi și activ și pasiv)
  OFFBALANCE = 'X'  // Cont în afara bilanțului
}

// Interfața pentru o linie contabilă
export interface AccountingLine {
  accountCode: string;     // Codul contului (ex: 371, 401, 4426, etc.)
  accountSuffix?: string;  // Sufixul contului analitic (ex: 371.1 -> sufixul e "1")
  accountName?: string;    // Numele contului
  debit: number;           // Suma debit
  credit: number;          // Suma credit
  description: string;     // Descrierea operațiunii
}

// Interfața pentru o notă contabilă
export interface NotaContabila {
  documentId: string;        // ID-ul documentului pentru care se face nota contabilă (NIR, factură, etc.)
  documentType: string;      // Tipul documentului (NIR, factură, etc.)
  documentNumber: string;    // Numărul documentului
  companyId: string;         // ID-ul companiei
  franchiseId?: string;      // ID-ul francizei (opțional)
  date: Date;                // Data operațiunii
  description: string;       // Descrierea generală a operațiunii
  lines: AccountingLine[];   // Liniile contabile (debit/credit)
  amount: number;            // Suma totală a operațiunii
  currency: string;          // Moneda (RON, EUR, etc.)
  exchangeRate: number;      // Cursul de schimb (dacă e în altă monedă decât RON)
}

export class NotaContabilaService {
  private drizzle = getDrizzle();
  private storage = storage;

  constructor() {
    console.log('[NotaContabilaService] 🔧 Serviciu inițializat');
  }

  /**
   * Creează o nouă notă contabilă și o înregistrează în jurnal
   * 
   * @param nota Datele notei contabile
   * @returns ID-ul notei contabile create
   */
  async createNotaContabila(nota: NotaContabila): Promise<string> {
    console.log('[NotaContabilaService] 📝 Creare notă contabilă pentru:', nota.documentType, nota.documentNumber);
    
    try {
      // Validare: suma debit = suma credit
      this.validateBalance(nota.lines);
      
      // Creare înregistrare în jurnal (ledger_entries)
      const journalEntryId = randomUUID();
      const now = new Date().toISOString();
      
      const journalSql = `
        INSERT INTO ledger_entries (
          id, company_id, franchise_id, entry_type, reference_number, 
          amount, description, created_at, updated_at
        ) VALUES (
          '${journalEntryId}',
          '${nota.companyId}',
          ${nota.franchiseId ? `'${nota.franchiseId}'` : 'NULL'},
          'PURCHASE',
          '${nota.documentNumber}',
          ${nota.amount},
          '${this.sanitizeString(nota.description)}',
          '${now}',
          '${now}'
        ) RETURNING *`;
      
      console.log('[NotaContabilaService] 📜 Executare SQL pentru înregistrare jurnal...');
      const sql = getClient();
      const journalResult = await sql.unsafe(journalSql);
      console.log('[NotaContabilaService] ✅ Înregistrare jurnal creată cu ID:', journalEntryId);
      
      // Creare linii contabile în jurnal (ledger_lines)
      for (const line of nota.lines) {
        const lineId = randomUUID();
        const accountId = await this.getAccountIdByCode(line.accountCode, line.accountSuffix);
        
        const lineSql = `
          INSERT INTO ledger_lines (
            id, ledger_entry_id, account_id, debit_amount, credit_amount,
            description, created_at, updated_at
          ) VALUES (
            '${lineId}',
            '${journalEntryId}',
            '${accountId}',
            ${line.debit},
            ${line.credit},
            '${this.sanitizeString(line.description)}',
            '${now}',
            '${now}'
          )`;
        
        await sql.unsafe(lineSql);
      }
      
      // Creare link între documentul sursă și înregistrarea contabilă
      const linkId = randomUUID();
      const linkSql = `
        INSERT INTO document_ledger_links (
          id, document_id, document_type, ledger_entry_id, created_at
        ) VALUES (
          '${linkId}',
          '${nota.documentId}',
          '${nota.documentType}',
          '${journalEntryId}',
          '${now}'
        )`;
      
      await sql.unsafe(linkSql);
      
      console.log('[NotaContabilaService] ✅ Notă contabilă creată cu succes pentru:', nota.documentType, nota.documentNumber);
      
      return journalEntryId;
    } catch (error: any) {
      console.error('[NotaContabilaService] ❌ Eroare la crearea notei contabile:', error);
      throw new Error(`Eroare la crearea notei contabile: ${error.message || String(error)}`);
    }
  }
  
  /**
   * Creează o notă contabilă pentru NIR tip Depozit
   * 
   * Înregistrare contabilă standard pentru NIR de tip Depozit:
   * - Debit: 371.x (Mărfuri) - valoarea fără TVA
   * - Debit: 4426.x (TVA deductibilă) - valoarea TVA
   * - Credit: 401 (Furnizori) - valoarea totală cu TVA
   *
   * @param nirId ID-ul documentului NIR
   * @param nirNumber Numărul documentului NIR
   * @param companyId ID-ul companiei
   * @param supplierId ID-ul furnizorului
   * @param warehouseId ID-ul depozitului
   * @param valueNoVat Valoarea totală fără TVA
   * @param vatValue Valoarea TVA
   * @param totalValue Valoarea totală cu TVA
   * @param date Data NIR-ului
   * @returns ID-ul notei contabile create
   */
  async createNirDepozitNotaContabila(
    nirId: string,
    nirNumber: string,
    companyId: string,
    supplierId: string,
    warehouseId: string,
    valueNoVat: number,
    vatValue: number,
    totalValue: number,
    date: Date,
    currency: string = 'RON',
    exchangeRate: number = 1
  ): Promise<string> {
    console.log('[NotaContabilaService] 📝 Creare notă contabilă pentru NIR Depozit:', nirNumber);
    
    try {
      // Obține sufixul pentru conturile analitice din depozit
      const warehouseSuffix = await this.getWarehouseAccountSuffix(warehouseId);
      console.log('[NotaContabilaService] 🔍 Sufix conturi pentru depozit:', warehouseSuffix);
      
      // Obține numele furnizorului
      const supplierName = await this.getSupplierName(supplierId);
      
      // Pregătește liniile contabile pentru NIR
      const lines: AccountingLine[] = [
        // Linia 1: Debit 371.x (Mărfuri) cu valoarea fără TVA
        {
          accountCode: '371',
          accountSuffix: warehouseSuffix,
          accountName: 'Mărfuri',
          debit: valueNoVat,
          credit: 0,
          description: `Recepție marfă conform NIR ${nirNumber} de la ${supplierName}`
        },
        // Linia 2: Debit 4426.x (TVA deductibilă) cu valoarea TVA
        {
          accountCode: '4426',
          accountSuffix: warehouseSuffix,
          accountName: 'TVA deductibilă',
          debit: vatValue,
          credit: 0,
          description: `TVA aferent NIR ${nirNumber} de la ${supplierName}`
        },
        // Linia 3: Credit 401 (Furnizori) cu valoarea totală cu TVA
        {
          accountCode: '401',
          accountName: 'Furnizori',
          debit: 0,
          credit: totalValue,
          description: `Datorie către furnizor ${supplierName} pentru NIR ${nirNumber}`
        }
      ];
      
      // Creează nota contabilă
      const notaContabila: NotaContabila = {
        documentId: nirId,
        documentType: 'NIR',
        documentNumber: nirNumber,
        companyId,
        date,
        description: `Notă contabilă pentru NIR ${nirNumber} - recepție marfă de la ${supplierName}`,
        lines,
        amount: totalValue,
        currency,
        exchangeRate
      };
      
      return await this.createNotaContabila(notaContabila);
    } catch (error: any) {
      console.error('[NotaContabilaService] ❌ Eroare la crearea notei contabile pentru NIR:', error);
      throw new Error(`Eroare la crearea notei contabile pentru NIR: ${error.message || String(error)}`);
    }
  }
  
  /**
   * Obține sufixul conturilor analitice pentru un depozit (371.x, 4426.x, etc.)
   * 
   * @param warehouseId ID-ul depozitului
   * @returns Sufixul conturilor analitice (ex: "1" pentru 371.1)
   */
  private async getWarehouseAccountSuffix(warehouseId: string): Promise<string> {
    const sql = getClient();
    const result = await sql`SELECT code FROM warehouses WHERE id = ${warehouseId}`;
    
    if (!result || result.length === 0) {
      throw new Error(`Depozitul cu ID ${warehouseId} nu a fost găsit`);
    }
    
    const code = result[0].code;
    
    // Extrage sufixul din cod (ex: din "371.1" -> "1")
    const parts = code.split('.');
    if (parts.length !== 2) {
      throw new Error(`Codul depozitului ${code} nu are formatul așteptat (xxx.y)`);
    }
    
    return parts[1];
  }
  
  /**
   * Obține numele furnizorului
   * 
   * @param supplierId ID-ul furnizorului
   * @returns Numele furnizorului
   */
  private async getSupplierName(supplierId: string): Promise<string> {
    const sql = getClient();
    const result = await sql`SELECT name FROM companies WHERE id = ${supplierId}`;
    
    if (!result || result.length === 0) {
      // Fallback dacă nu găsim furnizorul
      return 'Furnizor necunoscut';
    }
    
    return result[0].name;
  }
  
  /**
   * Obține ID-ul contului contabil din baza de date bazat pe codul și sufixul său
   * 
   * @param accountCode Codul contului (ex: 371, 401, 4426)
   * @param accountSuffix Sufixul contului pentru conturi analitice (ex: "1" pentru 371.1)
   * @returns ID-ul contului din baza de date
   */
  private async getAccountIdByCode(accountCode: string, accountSuffix?: string): Promise<string> {
    let sql;
    
    if (accountSuffix) {
      // Căutare cont analitic (ex: 371.1)
      const analyticCode = `${accountCode}.${accountSuffix}`;
      const sql = getClient();
      
      const analyticResult = await sql`SELECT id FROM analytic_accounts WHERE code = ${analyticCode}`;
      
      if (analyticResult && analyticResult.length > 0) {
        return analyticResult[0].id;
      }
      
      throw new Error(`Contul analitic ${analyticCode} nu a fost găsit`);
    } else {
      // Căutare cont sintetic (ex: 401)
      const sql = getClient();
      
      const syntheticResult = await sql`SELECT id FROM synthetic_accounts WHERE code = ${accountCode}`;
      
      if (syntheticResult && syntheticResult.length > 0) {
        return syntheticResult[0].id;
      }
      
      throw new Error(`Contul sintetic ${accountCode} nu a fost găsit`);
    }
  }
  
  /**
   * Validează că suma debit este egală cu suma credit
   * 
   * @param lines Liniile contabile de validat
   */
  private validateBalance(lines: AccountingLine[]): void {
    const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
    
    // Folosim toFixed(2) pentru a evita probleme de precizie cu numere zecimale
    if (totalDebit.toFixed(2) !== totalCredit.toFixed(2)) {
      throw new Error(`Nota contabilă nu este echilibrată: totalDebit (${totalDebit}) != totalCredit (${totalCredit})`);
    }
  }
  
  /**
   * Sanitizează un șir de caractere pentru a preveni injecțiile SQL
   * 
   * @param value Valoarea de sanitizat
   * @returns Valoarea sanitizată
   */
  private sanitizeString(value: string): string {
    if (!value) return '';
    return value.replace(/'/g, "''");
  }
}

// Exportă o instanță singleton
export const notaContabilaService = new NotaContabilaService();