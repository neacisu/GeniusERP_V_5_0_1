/**
 * External Integrations API Routes
 */

import { Router } from 'express';
import authGuard from '../../auth/guards/auth.guard';
import { UserRole } from '../../auth/types';
import { exchangeRateService } from '../services/exchange-rate.service';
import { anafService } from '../services/anaf.service';
import { bnrExchangeRateService } from '../services/bnr-exchange-rate.service';
import { CurrencyService } from '../services/currency.service';
import { log } from '../../../vite';

const router = Router();

// Protected routes that require authentication
router.use(authGuard.requireAuth());

// Get latest exchange rates - Basic auth required
router.get('/exchange-rates', async (req, res, next) => {
  try {
    const baseCurrency = req.query.base as string || 'RON';
    const rates = await exchangeRateService.getLatestRates(baseCurrency);
    res.json({ 
      base: baseCurrency, 
      date: new Date().toISOString().split('T')[0],
      rates 
    });
  } catch (error) {
    log(`❌ Error in exchange rates API: ${(error as Error).message}`, 'api');
    next(error);
  }
});

// Get Romanian BNR official exchange rates - Basic auth required
router.get('/exchange-rates/bnr', async (req, res, next) => {
  try {
    try {
      const rates = await bnrExchangeRateService.getLatestRates();
      res.json({ 
        base: 'RON',
        date: new Date().toISOString().split('T')[0],
        rates,
        source: 'BNR Official'
      });
    } catch (bnrError) {
      log(`⚠️ BNR service error, falling back to general exchange rate API: ${(bnrError as Error).message}`, 'api');
      const date = req.query.date as string;
      const rates = await exchangeRateService.getBNRReferenceRate(date);
      res.json({ 
        base: 'RON', 
        date: date || new Date().toISOString().split('T')[0],
        rates,
        source: 'BNR Reference (Fallback)'
      });
    }
  } catch (error) {
    log(`❌ Error in BNR exchange rates API: ${(error as Error).message}`, 'api');
    next(error);
  }
});

// Manually trigger BNR exchange rate update - Admin only
router.post('/exchange-rates/bnr/update', 
  authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
  async (req, res, next) => {
    try {
      log('🔄 Manual BNR exchange rate update triggered', 'api');
      const rates = await bnrExchangeRateService.manualFetch();
      res.json({
        success: true,
        message: 'BNR exchange rates updated successfully',
        base: 'RON',
        date: new Date().toISOString().split('T')[0],
        rates,
        source: 'BNR Official',
        currencyCount: Object.keys(rates).length
      });
    } catch (error) {
      log(`❌ Error in manual BNR update API: ${(error as Error).message}`, 'api');
      next(error);
    }
});

// Convert amount between currencies - Basic auth required
router.get('/exchange-rates/convert', async (req, res, next) => {
  try {
    const amount = parseFloat(req.query.amount as string || '0');
    const from = req.query.from as string || 'RON';
    const to = req.query.to as string || 'EUR';

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount. Must be a positive number.' });
    }

    const convertedAmount = await exchangeRateService.convertCurrency(amount, from, to);

    res.json({
      amount,
      from,
      to,
      result: convertedAmount,
      date: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    log(`❌ Error in currency conversion API: ${(error as Error).message}`, 'api');
    next(error);
  }
});

// Validate Romanian VAT number through ANAF - Admin/Company Admin only
router.get('/anaf/validate-vat/:vatNumber',
  authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
  async (req, res, next) => {
    try {
      const vatNumber = req.params.vatNumber;

      if (!vatNumber || vatNumber.length < 2) {
        return res.status(400).json({ error: 'Invalid VAT number format' });
      }

      const validationResult = await anafService.validateVat(vatNumber);
      res.json(validationResult);
    } catch (error) {
      log(`❌ Error in VAT validation API: ${(error as Error).message}`, 'api');
      next(error);
    }
});

// Get company information by fiscal code - Admin/Company Admin only
router.get('/anaf/company/:fiscalCode',
  authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
  async (req, res, next) => {
    try {
      const fiscalCode = req.params.fiscalCode;

      if (!fiscalCode || fiscalCode.length < 2) {
        return res.status(400).json({ error: 'Invalid fiscal code format' });
      }

      const companyInfo = await anafService.getCompanyInfo(fiscalCode);

      if (!companyInfo) {
        return res.status(404).json({ error: 'Company not found' });
      }

      res.json(companyInfo);
    } catch (error) {
      log(`❌ Error in company info API: ${(error as Error).message}`, 'api');
      next(error);
    }
});

// Get all available BNR exchange rates - Basic auth required
router.get('/exchange-rates/bnr/all', async (req, res, next) => {
  try {
    let date: Date | undefined;
    if (req.query.date) {
      date = new Date(req.query.date as string);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
    }

    const rates = await CurrencyService.getRates(date);

    res.json({
      base: 'RON',
      date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      rates,
      count: Object.keys(rates).length,
      source: 'BNR Official'
    });
  } catch (error) {
    log(`❌ Error in BNR rates API: ${(error as Error).message}`, 'api');
    next(error);
  }
});

export default router;