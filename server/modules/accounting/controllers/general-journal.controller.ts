/**
 * General Journal Controller
 * 
 * Controller pentru Registrul Jurnal cu rapoarte PDF și Excel
 * Implementează endpoint-urile pentru generarea rapoartelor conform OMFP 2634/2015
 */

import { Request, Response } from 'express';
import { GeneralJournalPDFService } from '../services/general-journal-pdf.service';
import { GeneralJournalExcelService } from '../services/general-journal-excel.service';
import { AccountingPeriodsService } from '../services/accounting-periods.service';
import { BaseController } from './base.controller';
import { z } from 'zod';

/**
 * Validare schema pentru cereri
 */
const GeneralJournalReportRequestSchema = z.object({
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  journalTypes: z.array(z.enum(['SALES', 'PURCHASE', 'CASH', 'BANK', 'GENERAL', 'ADJUSTMENT', 'REVERSAL'])).optional(),
  detailLevel: z.enum(['summary', 'detailed']).default('detailed'),
  includeReversals: z.boolean().default(true),
  format: z.enum(['pdf', 'excel']).default('pdf')
});

/**
 * Controller pentru Registrul Jurnal
 */
export class GeneralJournalController extends BaseController {
  private pdfService: GeneralJournalPDFService;
  private excelService: GeneralJournalExcelService;
  private periodsService: AccountingPeriodsService;

  constructor() {
    super();
    this.pdfService = new GeneralJournalPDFService();
    this.excelService = new GeneralJournalExcelService();
    this.periodsService = new AccountingPeriodsService();
  }

  /**
   * Generează raportul Registru Jurnal în format PDF
   * 
   * @route GET /api/accounting/general-journal/pdf
   * @permission accountant, admin, manager
   */
  async generatePDF(req: Request, res: Response): Promise<void> {
    try {
      // Validare și autentificare
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      // Validare parametri
      const validatedData = GeneralJournalReportRequestSchema.parse(req.query);
      
      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(validatedData.endDate);
      
      // Validări business
      if (startDate >= endDate) {
        res.status(400).json({ error: 'Data de început trebuie să fie anterioară datei de sfârșit' });
        return;
      }

      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 366) { // Max 1 an + 1 zi
        res.status(400).json({ error: 'Perioada nu poate fi mai mare de 1 an' });
        return;
      }

      // Obține informații companie (ar trebui să vină din serviciu dedicat)
      const companyName = 'Companie GeniusERP'; // Default fallback
      const responsiblePerson = req.user?.fullName || req.user?.email || 'Utilizator necunoscut';

      // Opțiuni pentru generarea raportului
      const options = {
        companyId,
        companyName,
        startDate,
        endDate,
        journalTypes: validatedData.journalTypes,
        detailLevel: validatedData.detailLevel,
        includeReversals: validatedData.includeReversals,
        responsiblePersonName: responsiblePerson,
        responsiblePersonTitle: 'Contabil șef'
      };

      console.log(`📊 Generare Registru Jurnal PDF pentru ${companyName}, perioada ${startDate.toLocaleDateString('ro-RO')} - ${endDate.toLocaleDateString('ro-RO')}`);

      // Generează PDF-ul
      const filePath = await this.pdfService.generateGeneralJournalPDF(options);

      // Log audit pentru generarea raportului
      console.log(`✅ Registru Jurnal PDF generat de ${userId} pentru compania ${companyId}`);

      // Returnează fișierul
      res.download(filePath, `registru-jurnal-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.pdf`, (err) => {
        if (err) {
          console.error('❌ Eroare la download PDF:', err);
          res.status(500).json({ error: 'Eroare la descărcarea fișierului PDF' });
        }
      });

    } catch (error) {
      console.error('❌ Eroare generare Registru Jurnal PDF:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Parametri invalizi',
          details: error.issues
        });
        return;
      }

      res.status(500).json({ 
        error: 'Eroare internă la generarea raportului',
        message: error instanceof Error ? error.message : 'Eroare necunoscută'
      });
    }
  }

  /**
   * Generează raportul Registru Jurnal în format Excel
   * 
   * @route GET /api/accounting/general-journal/excel
   * @permission accountant, admin, manager
   */
  async generateExcel(req: Request, res: Response): Promise<void> {
    try {
      // Validare și autentificare
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      // Validare parametri
      const validatedData = GeneralJournalReportRequestSchema.parse(req.query);
      
      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(validatedData.endDate);
      
      // Validări business
      if (startDate >= endDate) {
        res.status(400).json({ error: 'Data de început trebuie să fie anterioară datei de sfârșit' });
        return;
      }

      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 366) { // Max 1 an + 1 zi
        res.status(400).json({ error: 'Perioada nu poate fi mai mare de 1 an' });
        return;
      }

      // Obține informații companie
      const companyName = 'Companie GeniusERP'; // Default fallback
      const responsiblePerson = req.user?.fullName || req.user?.email || 'Utilizator necunoscut';

      // Opțiuni pentru generarea raportului Excel
      const options = {
        companyId,
        companyName,
        startDate,
        endDate,
        journalTypes: validatedData.journalTypes,
        includeReversals: validatedData.includeReversals,
        responsiblePersonName: responsiblePerson,
        includeMetadata: true // Excel include foi suplimentare cu metadata
      };

      console.log(`📊 Generare Registru Jurnal Excel pentru ${companyName}, perioada ${startDate.toLocaleDateString('ro-RO')} - ${endDate.toLocaleDateString('ro-RO')}`);

      // Generează Excel-ul
      const filePath = await this.excelService.generateGeneralJournalExcel(options);

      // Log audit pentru generarea raportului
      console.log(`✅ Registru Jurnal Excel generat de ${userId} pentru compania ${companyId}`);

      // Returnează fișierul
      res.download(filePath, `registru-jurnal-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.xlsx`, (err) => {
        if (err) {
          console.error('❌ Eroare la download Excel:', err);
          res.status(500).json({ error: 'Eroare la descărcarea fișierului Excel' });
        }
      });

    } catch (error) {
      console.error('❌ Eroare generare Registru Jurnal Excel:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Parametri invalizi',
          details: error.issues
        });
        return;
      }

      res.status(500).json({ 
        error: 'Eroare internă la generarea raportului Excel',
        message: error instanceof Error ? error.message : 'Eroare necunoscută'
      });
    }
  }

  /**
   * Preview al datelor pentru Registru Jurnal (fără generare fișier)
   * 
   * @route GET /api/accounting/general-journal/preview
   * @permission accountant, admin, manager
   */
  async previewData(req: Request, res: Response): Promise<void> {
    try {
      const companyId = this.getCompanyId(req);
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      // Validare parametri (doar pentru preview, limite mai mici)
      const validatedData = GeneralJournalReportRequestSchema.parse(req.query);
      
      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(validatedData.endDate);

      // Pentru preview, limitează la 30 zile
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 30) {
        res.status(400).json({ error: 'Pentru preview, perioada nu poate fi mai mare de 30 zile' });
        return;
      }

      // Obține doar primele 100 înregistrări pentru preview
      const options = {
        companyId,
        companyName: 'Preview',
        startDate,
        endDate,
        journalTypes: validatedData.journalTypes,
        detailLevel: validatedData.detailLevel,
        includeReversals: validatedData.includeReversals
      };

      // Aici ar trebui să chemi o metodă separată pentru preview care limitează rezultatele
      // const previewData = await this.pdfService.getJournalEntriesPreview(options, 100);

      res.json({ 
        message: 'Preview disponibil',
        period: `${startDate.toLocaleDateString('ro-RO')} - ${endDate.toLocaleDateString('ro-RO')}`,
        options,
        // entries: previewData,
        note: 'Funcționalitatea de preview va fi implementată'
      });

    } catch (error) {
      console.error('❌ Eroare preview Registru Jurnal:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Parametri invalizi',
          details: error.issues
        });
        return;
      }

      res.status(500).json({ 
        error: 'Eroare internă la preview',
        message: error instanceof Error ? error.message : 'Eroare necunoscută'
      });
    }
  }

  /**
   * Obține informații despre perioadele disponibile pentru raportare
   * 
   * @route GET /api/accounting/general-journal/periods
   * @permission accountant, admin, manager
   */
  async getAvailablePeriods(req: Request, res: Response): Promise<void> {
    try {
      const companyId = this.getCompanyId(req);
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      // Obține anul curent și anterior
      const currentYear = new Date().getFullYear();
      const periods = await this.periodsService.getPeriodsForCompany(companyId, currentYear);
      const previousYearPeriods = await this.periodsService.getPeriodsForCompany(companyId, currentYear - 1);

      // Informații despre starea perioadelor
      const periodsInfo = [...periods, ...previousYearPeriods].map(period => ({
        year: period.year,
        month: period.month,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
        isClosed: period.isClosed,
        canGenerateReport: true // Rapoartele se pot genera pentru orice perioadă
      }));

      res.json({
        currentYear,
        periods: periodsInfo,
        recommendedPeriods: [
          {
            name: 'Luna curentă',
            startDate: new Date(currentYear, new Date().getMonth(), 1).toISOString().split('T')[0],
            endDate: new Date(currentYear, new Date().getMonth() + 1, 0).toISOString().split('T')[0]
          },
          {
            name: 'Trimestrul curent',
            startDate: new Date(currentYear, Math.floor(new Date().getMonth() / 3) * 3, 1).toISOString().split('T')[0],
            endDate: new Date(currentYear, Math.floor(new Date().getMonth() / 3) * 3 + 3, 0).toISOString().split('T')[0]
          },
          {
            name: 'Anul curent',
            startDate: `${currentYear}-01-01`,
            endDate: `${currentYear}-12-31`
          }
        ]
      });

    } catch (error) {
      console.error('❌ Eroare obținere perioade:', error);
      res.status(500).json({ 
        error: 'Eroare internă',
        message: error instanceof Error ? error.message : 'Eroare necunoscută'
      });
    }
  }
}

export default GeneralJournalController;