/**
 * Account Mapping Service
 * 
 * RECOMANDARE 5: Serviciu pentru gestionarea conturilor configurabile
 * Înlocuiește hardcodarea conturilor din CASH_ACCOUNTS și BANK_ACCOUNTS
 * Enhanced cu Redis caching (TTL: 24h)
 */

import { getDrizzle } from '../../../common/drizzle';
import { eq, and } from 'drizzle-orm';
import { accountMappings } from '../../../../shared/schema/account-mappings.schema';
import { RedisService } from '../../../services/redis.service';

export class AccountMappingService {
  private redisService: RedisService;

  constructor() {
    this.redisService = new RedisService();
  }

  /**
   * Ensure Redis connection
   */
  private async ensureRedisConnection(): Promise<void> {
    if (!this.redisService.isConnected()) {
      await this.redisService.connect();
    }
  }
  /**
   * Obține contul contabil pentru un tip de operațiune
   * Enhanced cu Redis caching (TTL: 24h)
   */
  public async getAccount(companyId: string, mappingType: string): Promise<string> {
    await this.ensureRedisConnection();
    
    // Check Redis cache first
    const cacheKey = `acc:mapping:${companyId}:${mappingType}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<string>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const db = getDrizzle();
    
    try {
      const [mapping] = await db
        .select()
        .from(accountMappings)
        .where(and(
          eq(accountMappings.companyId, companyId),
          eq(accountMappings.mappingType, mappingType as any),
          eq(accountMappings.isActive, true)
        ))
        .limit(1);
      
      if (mapping) {
        // Cache result in Redis for 24 hours
        if (this.redisService.isConnected()) {
          await this.redisService.setCached(cacheKey, mapping.accountCode, 86400);
        }
        
        return mapping.accountCode;
      }
      
      // Fallback la conturi default RO dacă nu e configurat
      const defaultAccount = this.getDefaultAccount(mappingType);
      
      // Cache default account too (shorter TTL: 1h)
      if (this.redisService.isConnected()) {
        await this.redisService.setCached(cacheKey, defaultAccount, 3600);
      }
      
      return defaultAccount;
    } catch (error) {
      console.error(`Error getting account mapping for ${mappingType}:`, error);
      return this.getDefaultAccount(mappingType);
    }
  }
  
  /**
   * Conturi default RO (fallback)
   */
  private getDefaultAccount(mappingType: string): string {
    const defaults: Record<string, string> = {
      // Cash
      'CASH_RON': '5311',
      'CASH_CURRENCY': '5314',
      'PETTY_CASH': '5321',
      
      // Bank
      'BANK_PRIMARY': '5121',
      'BANK_CURRENCY': '5124',
      
      // Third party
      'CUSTOMERS': '4111',
      'SUPPLIERS': '401',
      'EMPLOYEE_ADVANCES': '425',
      'EMPLOYEE_PAYROLL': '421',
      'VAT_COLLECTED': '4427',
      'VAT_DEDUCTIBLE': '4426',
      
      // Expenses
      'UTILITIES': '605',
      'SUPPLIES': '6022',
      'TRANSPORT': '624',
      'OTHER_SERVICES': '628',
      'BANK_FEES': '627',
      'INTEREST_EXPENSE': '666',
      
      // Income
      'MERCHANDISE_SALES': '707',
      'SERVICE_REVENUE': '704',
      'INTEREST_INCOME': '766',
      
      // Other
      'INTERNAL_TRANSFERS': '581',
      'CASH_SHORTAGES': '6581',
      'CASH_OVERAGES': '7588',
      'EXCHANGE_DIFF_INCOME': '765',
      'EXCHANGE_DIFF_EXPENSE': '665',
      'SHORT_TERM_LOANS': '519',
      'LONG_TERM_LOANS': '162'
    };
    
    return defaults[mappingType] || '473'; // 473 = Settlements from operations
  }
  
  /**
   * Invalidează cache-ul pentru o companie (după modificări)
   * Enhanced cu Redis invalidation
   */
  public async clearCache(companyId?: string): Promise<void> {
    await this.ensureRedisConnection();
    
    if (!this.redisService.isConnected()) {
      return;
    }
    
    if (companyId) {
      // Invalidate only for specific company
      await this.redisService.invalidatePattern(`acc:mapping:${companyId}:*`);
    } else {
      // Invalidate all account mappings
      await this.redisService.invalidatePattern(`acc:mapping:*`);
    }
  }
  
  /**
   * Creează mapări default pentru o companie nouă
   */
  public async initializeDefaultMappings(companyId: string, userId: string): Promise<void> {
    const db = getDrizzle();
    const defaults = this.getAllDefaultMappings();
    
    const values = defaults.map(({ type, code, name }) => ({
      companyId,
      mappingType: type,
      accountCode: code,
      accountName: name,
      isDefault: true,
      isActive: true,
      createdBy: userId
    }));
    
    try {
      await db.insert(accountMappings).values(values as any);
      console.log(`✅ Mapări conturi default create pentru compania ${companyId}`);
    } catch (error) {
      console.error('❌ Error initializing account mappings:', error);
    }
  }
  
  /**
   * Obține toate mapările default
   */
  private getAllDefaultMappings(): Array<{ type: string; code: string; name: string }> {
    return [
      { type: 'CASH_RON', code: '5311', name: 'Casa în lei' },
      { type: 'CASH_CURRENCY', code: '5314', name: 'Casa în valută' },
      { type: 'PETTY_CASH', code: '5321', name: 'Casa de avansuri' },
      { type: 'BANK_PRIMARY', code: '5121', name: 'Conturi la bănci în lei' },
      { type: 'BANK_CURRENCY', code: '5124', name: 'Conturi la bănci în valută' },
      { type: 'CUSTOMERS', code: '4111', name: 'Clienți' },
      { type: 'SUPPLIERS', code: '401', name: 'Furnizori' },
      { type: 'EMPLOYEE_ADVANCES', code: '425', name: 'Avansuri de trezorerie' },
      { type: 'EMPLOYEE_PAYROLL', code: '421', name: 'Personal - salarii datorate' },
      { type: 'VAT_COLLECTED', code: '4427', name: 'TVA colectată' },
      { type: 'VAT_DEDUCTIBLE', code: '4426', name: 'TVA deductibilă' },
      { type: 'BANK_FEES', code: '627', name: 'Comisioane bancare' },
      { type: 'INTEREST_INCOME', code: '766', name: 'Venituri din dobânzi' },
      { type: 'INTEREST_EXPENSE', code: '666', name: 'Cheltuieli cu dobânzi' },
      { type: 'INTERNAL_TRANSFERS', code: '581', name: 'Viramente interne' },
      { type: 'CASH_SHORTAGES', code: '6581', name: 'Lipsuri de casa' },
      { type: 'CASH_OVERAGES', code: '7588', name: 'Plusuri de casa' },
      { type: 'EXCHANGE_DIFF_INCOME', code: '765', name: 'Venituri din diferențe de curs' },
      { type: 'EXCHANGE_DIFF_EXPENSE', code: '665', name: 'Cheltuieli din diferențe de curs' },
    ];
  }
}

export default AccountMappingService;
