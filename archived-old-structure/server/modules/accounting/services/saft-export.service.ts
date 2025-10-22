/**
 * SAF-T (D406) Export Service
 * 
 * RECOMANDARE 3: Implementare export SAF-T conform cerințelor ANAF
 * Standard Audit File for Tax - România
 * 
 * Generează fișier XML cu toate tranzacțiile pentru raportarea către ANAF
 * Enhanced cu Redis caching (TTL: 15min pentru export XML)
 */

import { getDrizzle } from '../../../common/drizzle';
import { and, eq, gte, lte } from 'drizzle-orm';
import { cashTransactions } from '../../../../shared/schema/cash-register.schema';
import { bankTransactions } from '../../../../shared/schema/bank-journal.schema';
import { companies } from '../../../../shared/schema';
import { RedisService } from '../../../services/redis.service';

/**
 * Payment method mapping pentru SAF-T
 */
const PAYMENT_METHOD_SAFT: Record<string, string> = {
  // Cash
  'cash': 'Cash',
  'cash_receipt': 'Cash',
  'cash_payment': 'Cash',
  
  // Bank
  'bank_transfer': 'BankTransfer',
  'direct_debit': 'DirectDebit',
  'card_payment': 'CreditCard',
  'online_banking': 'BankTransfer',
  'mobile_banking': 'BankTransfer',
  'standing_order': 'StandingOrder',
  
  // Other
  'other': 'Other'
};

/**
 * Transaction type mapping
 */
const TRANSACTION_TYPE_SAFT: Record<string, string> = {
  'incoming_payment': 'Receipt',
  'cash_receipt': 'Receipt',
  'outgoing_payment': 'Payment',
  'cash_payment': 'Payment',
  'bank_fee': 'Payment',
  'bank_interest': 'Receipt'
};

export class SAFTExportService {
  private redisService: RedisService;

  constructor() {
    this.redisService = new RedisService();
  }

  private async ensureRedisConnection(): Promise<void> {
    if (!this.redisService.isConnected()) {
      await this.redisService.connect();
    }
  }

  /**
   * RECOMANDARE 3: Generează fișier SAF-T D406 complet
   * 
   * @param companyId ID-ul companiei
   * @param startDate Data start perioadă
   * @param endDate Data end perioadă
   * @returns XML SAF-T conform specificațiilor ANAF
   */
  public async generateSAFT(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    await this.ensureRedisConnection();
    
    // Check cache first
    const dateStr = `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`;
    const cacheKey = `acc:saft-export:${companyId}:${dateStr}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<string>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const db = getDrizzle();
    
    // Fetch company data
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);
    
    if (!company) {
      throw new Error('Compania nu a fost găsită');
    }
    
    // Fetch all cash transactions in period
    const cashTxns = await db
      .select()
      .from(cashTransactions)
      .where(and(
        eq(cashTransactions.companyId, companyId),
        gte(cashTransactions.transactionDate, startDate),
        lte(cashTransactions.transactionDate, endDate),
        eq(cashTransactions.isPosted, true), // Doar cele contabilizate
        eq(cashTransactions.isCanceled, false)
      ));
    
    // Fetch all bank transactions in period
    const bankTxns = await db
      .select()
      .from(bankTransactions)
      .where(and(
        eq(bankTransactions.companyId, companyId),
        gte(bankTransactions.transactionDate, startDate),
        lte(bankTransactions.transactionDate, endDate),
        eq(bankTransactions.isPosted, true) // Doar cele contabilizate
      ));
    
    // Build SAF-T XML
    const xml = this.buildSAFTXML(company, cashTxns, bankTxns, startDate, endDate);
    
    // Cache result for 15 minutes
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, xml, 900); // 15 minutes TTL
    }
    
    return xml;
  }
  
  /**
   * Construiește XML-ul SAF-T
   */
  private buildSAFTXML(
    company: any,
    cashTransactions: any[],
    bankTransactions: any[],
    startDate: Date,
    endDate: Date
  ): string {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Taxation:RO_1.00">
  <Header>
    <AuditFileVersion>1.00</AuditFileVersion>
    <AuditFileCountry>RO</AuditFileCountry>
    <AuditFileDateCreated>${formatDate(new Date())}</AuditFileDateCreated>
    <SoftwareCompanyName>GeniusERP</SoftwareCompanyName>
    <SoftwareID>GeniusERP_v5</SoftwareID>
    <SoftwareVersion>5.0.0</SoftwareVersion>
    <Company>
      <RegistrationNumber>${company.cui || company.taxCode || ''}</RegistrationNumber>
      <Name>${this.escapeXML(company.name)}</Name>
      <Address>
        <AddressDetail>${this.escapeXML(company.address || '')}</AddressDetail>
        <City>${this.escapeXML(company.city || '')}</City>
        <PostalCode>${company.postalCode || ''}</PostalCode>
        <Country>RO</Country>
      </Address>
    </Company>
    <SelectionCriteria>
      <PeriodStart>${formatDate(startDate)}</PeriodStart>
      <PeriodEnd>${formatDate(endDate)}</PeriodEnd>
    </SelectionCriteria>
  </Header>
  
  <SourceDocuments>
    <Payments>
      <NumberOfEntries>${cashTransactions.length + bankTransactions.length}</NumberOfEntries>
      <TotalDebit>${this.calculateTotalAmount(cashTransactions, bankTransactions, 'debit')}</TotalDebit>
      <TotalCredit>${this.calculateTotalAmount(cashTransactions, bankTransactions, 'credit')}</TotalCredit>
      
`;
    
    // Add cash transactions as payments
    cashTransactions.forEach((txn: any, index: number) => {
      const isReceipt = txn.transactionType === 'cash_receipt' || txn.transactionType === 'bank_withdrawal';
      const paymentMethod = 'Cash';
      const transactionType = isReceipt ? 'Receipt' : 'Payment';
      
      xml += `      <Payment>
        <PaymentRefNo>${this.escapeXML(txn.documentNumber)}</PaymentRefNo>
        <TransactionID>${txn.id}</TransactionID>
        <Period>${new Date(txn.transactionDate).getMonth() + 1}</Period>
        <TransactionDate>${formatDate(new Date(txn.transactionDate))}</TransactionDate>
        <PaymentMethod>${paymentMethod}</PaymentMethod>
        <Description>${this.escapeXML(txn.description)}</Description>
        <PaymentAmount>${Number(txn.amount).toFixed(2)}</PaymentAmount>
        <Currency>${txn.currency}</Currency>
`;
      
      // Add customer/supplier reference if available
      if (txn.personName) {
        xml += `        <${isReceipt ? 'Customer' : 'Supplier'}Name>${this.escapeXML(txn.personName)}</${isReceipt ? 'Customer' : 'Supplier'}Name>\n`;
      }
      
      // Add invoice reference if available
      if (txn.invoiceNumber) {
        xml += `        <SourceDocumentID>${this.escapeXML(txn.invoiceNumber)}</SourceDocumentID>\n`;
      }
      
      // Add person ID number if available (CNP)
      if (txn.personIdNumber) {
        xml += `        <PersonIDNumber>${txn.personIdNumber}</PersonIDNumber>\n`;
      }
      
      xml += `      </Payment>\n`;
    });
    
    // Add bank transactions as payments
    bankTransactions.forEach((txn: any, index: number) => {
      const isReceipt = txn.transactionType === 'incoming_payment' || 
                       txn.transactionType === 'loan_disbursement' ||
                       (txn.transactionType === 'bank_interest' && Number(txn.amount) > 0);
      
      const paymentMethod = PAYMENT_METHOD_SAFT[txn.paymentMethod] || 'BankTransfer';
      
      xml += `      <Payment>
        <PaymentRefNo>${this.escapeXML(txn.referenceNumber)}</PaymentRefNo>
        <TransactionID>${txn.id}</TransactionID>
        <Period>${new Date(txn.transactionDate).getMonth() + 1}</Period>
        <TransactionDate>${formatDate(new Date(txn.transactionDate))}</TransactionDate>
        <PaymentMethod>${paymentMethod}</PaymentMethod>
        <Description>${this.escapeXML(txn.description)}</Description>
        <PaymentAmount>${Number(txn.amount).toFixed(2)}</PaymentAmount>
        <Currency>${txn.currency}</Currency>
`;
      
      // Add payer/payee
      if (txn.payerName) {
        xml += `        <CustomerName>${this.escapeXML(txn.payerName)}</CustomerName>\n`;
      }
      if (txn.payeeName) {
        xml += `        <SupplierName>${this.escapeXML(txn.payeeName)}</SupplierName>\n`;
      }
      
      // Add invoice reference
      if (txn.invoiceNumber) {
        xml += `        <SourceDocumentID>${this.escapeXML(txn.invoiceNumber)}</SourceDocumentID>\n`;
      }
      
      xml += `      </Payment>\n`;
    });
    
    xml += `    </Payments>
  </SourceDocuments>
</AuditFile>`;
    
    return xml;
  }
  
  /**
   * Calculate total amount for all transactions
   */
  private calculateTotalAmount(
    cashTxns: any[],
    bankTxns: any[],
    type: 'debit' | 'credit'
  ): string {
    let total = 0;
    
    // Cash transactions
    cashTxns.forEach((txn: any) => {
      const isReceipt = txn.transactionType === 'cash_receipt' || txn.transactionType === 'bank_withdrawal';
      if ((type === 'debit' && isReceipt) || (type === 'credit' && !isReceipt)) {
        total += Number(txn.amount);
      }
    });
    
    // Bank transactions
    bankTxns.forEach((txn: any) => {
      const isReceipt = txn.transactionType === 'incoming_payment' ||
                       txn.transactionType === 'loan_disbursement' ||
                       (txn.transactionType === 'bank_interest' && Number(txn.amount) > 0);
      if ((type === 'debit' && isReceipt) || (type === 'credit' && !isReceipt)) {
        total += Number(txn.amount);
      }
    });
    
    return total.toFixed(2);
  }
  
  /**
   * Escape special XML characters
   */
  private escapeXML(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  
  /**
   * Validează fișierul SAF-T generat
   * TODO: Integrare cu validatorul ANAF oficial
   */
  public async validateSAFT(xmlContent: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Basic XML validation
    if (!xmlContent.includes('<?xml')) {
      errors.push('Fișierul nu conține declarația XML');
    }
    
    if (!xmlContent.includes('<AuditFile')) {
      errors.push('Lipsește elementul rădăcină AuditFile');
    }
    
    if (!xmlContent.includes('<Header>')) {
      errors.push('Lipsește secțiunea Header');
    }
    
    if (!xmlContent.includes('<Payments>')) {
      errors.push('Lipsește secțiunea Payments');
    }
    
    // TODO: Validare cu XSD oficial ANAF
    // const validator = new XMLValidator(saftXSD);
    // const result = validator.validate(xmlContent);
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default SAFTExportService;
