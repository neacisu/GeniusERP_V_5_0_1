/**
 * Create Invoice Service
 * 
 * Handles invoice creation with currency conversion capabilities.
 * Uses the exchange rate service for currency conversion
 * via BNR (National Bank of Romania) official rates.
 */

import { DrizzleService } from "@common/drizzle/drizzle.service";
import { invoices } from '@geniuserp/shared';
import { exchangeRateService } from '../../integrations/services/exchange-rate.service';
import { InvoiceStatus } from '../types/invoice-status.enum';
import { AuditService } from '../../audit/services/audit.service';
import { AuditActionType } from "@common/enums/audit-action.enum";
import { log } from '../../../../apps/api/src/vite';
import { InvoiceService } from './invoice.service';
import { ENTITY_NAME } from '../index';

// Input type for the CreateInvoiceService
export interface CreateInvoiceInput {
  companyId: string;
  franchiseId?: string;
  currency?: string;
  convertTo?: string; 
  totalAmount: number;
  series?: string;
  userId?: string;  // For audit logging
}

export class CreateInvoiceService {
  private static drizzle = new DrizzleService();

  /**
   * Execute the invoice creation process with optional currency conversion
   * @param input Invoice creation input data
   * @returns The created invoice
   */
  static async execute(input: CreateInvoiceInput) {
    try {
      const {
        companyId,
        franchiseId,
        currency = 'RON',
        convertTo,
        totalAmount,
        series,
        userId
      } = input;

      log(`📝 Creating invoice with currency ${currency}${convertTo ? ` (convert to ${convertTo})` : ''}`, 'invoice-service');
      
      // Convert currency if needed
      let finalAmount = totalAmount;
      let finalCurrency = currency;
      
      if (convertTo && convertTo !== currency) {
        log(`💱 Converting amount from ${currency} to ${convertTo}`, 'invoice-service');
        finalAmount = await InvoiceService.convertCurrency(totalAmount, currency, convertTo);
        finalCurrency = convertTo;
        log(`💰 Converted amount: ${finalAmount.toFixed(2)} ${finalCurrency}`, 'invoice-service');
      }

      // Insert the invoice using transaction
      const newInvoice = await this.drizzle.transaction(async (tx) => {
        const [invoice] = await tx.insert(invoices).values({
          companyId,
          franchiseId,
          currency: finalCurrency,
          totalAmount: finalAmount.toString(),
          status: InvoiceStatus.DRAFT,
          series,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        
        return invoice;
      });
        
      const result = newInvoice;
      
      // Log the audit record if userId is provided
      if (userId) {
        await AuditService.log({
          userId,
          companyId,
          action: AuditActionType.CREATE,
          entity: ENTITY_NAME,
          entityId: result.id,
          details: {
            status: InvoiceStatus.DRAFT,
            currency: finalCurrency,
            totalAmount: finalAmount,
            originalCurrency: currency !== finalCurrency ? currency : undefined,
            originalAmount: currency !== finalCurrency ? totalAmount : undefined
          }
        });
      }
      
      log(`✅ Invoice created successfully with ID: ${result.id}`, 'invoice-service');
      return result;
    } catch (error) {
      log(`❌ Error creating invoice: ${(error as Error).message}`, 'invoice-service');
      throw new Error(`Failed to create invoice: ${(error as Error).message}`);
    }
  }
}