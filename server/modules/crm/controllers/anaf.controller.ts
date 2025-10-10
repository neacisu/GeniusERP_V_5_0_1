/**
 * ANAF Controller
 * 
 * Controller pentru ruta proxy care interogheaza API-ul ANAF.
 * Acest controller faciliteaza accesul fronted-ului la API-ul ANAF
 * evitand problemele de CORS.
 */

import { Request, Response } from 'express';
import { validateCui } from '../utils';
import AuditService from '../../../modules/audit/services/audit.service';
import { anafService } from '../services/anaf.service';
import { anafQueueService } from '../services/anaf-queue_services';

/**
 * Controller pentru API-ul ANAF
 */
class AnafController {
  
  /**
   * Ruta proxy pentru interogarea API-ului ANAF
   * 
   * @route POST /api/crm/anaf-proxy
   * @param req Request cu array de obiecte {cui, data}
   * @param res Response cu datele firmelor
   */
  async proxyAnafRequest(req: Request, res: Response) {
    try {
      // Verificare autentificare 
      if (!req.user || !req.user.id) {
        console.error(`[AnafController] ❌ Acces neautorizat la ruta /api/crm/anaf-proxy`);
        return res.status(401).json({ 
          error: 'Nu sunteți autentificat. Vă rugăm să vă autentificați și să încercați din nou.' 
        });
      }
      
      // Validare request
      const { body } = req;
      
      if (!Array.isArray(body)) {
        return res.status(400).json({ error: 'Formatul request-ului este invalid. Se asteapta un array de obiecte.' });
      }
      
      // Restricționăm numărul de CUI-uri la 100 conform limitărilor API-ului ANAF
      if (body.length > 100) {
        return res.status(400).json({
          error: 'Prea multe CUI-uri. Maximum 100 sunt permise într-o cerere.',
          requested: body.length
        });
      }
      
      // Interogare API ANAF folosind noul serviciu
      const cuiList = body.map((item: any) => item.cui);
      const response = await anafService.queryAnaf(cuiList);
      
      // Auditare cerere
      AuditService.log({
        userId: req.user?.id || 'anonymous',
        companyId: req.user?.companyId || 'unknown',
        action: 'anaf_proxy_request',
        entity: 'anaf_api',
        details: { 
          request: body,
          found: response.found?.length || 0,
          notFound: response.notFound?.length || 0,
          success: true 
        }
      });
      
      return res.status(200).json(response);
    } catch (error: any) {
      console.error('Eroare la interogarea API-ului ANAF:', error.message);
      
      // Auditare eroare
      AuditService.log({
        userId: req.user?.id || 'anonymous',
        companyId: req.user?.companyId || 'unknown',
        action: 'anaf_proxy_request_error',
        entity: 'anaf_api',
        details: { 
          error: error.message,
          success: false 
        }
      });
      
      if (error.response) {
        return res.status(error.response.status).json({
          error: 'Eroare la interogarea API-ului ANAF',
          details: error.response.data
        });
      }
      
      return res.status(500).json({
        error: 'Eroare la interogarea API-ului ANAF',
        details: error.message
      });
    }
  }
  
  /**
   * Ruta pentru interogarea datelor unei singure companii
   * 
   * @route GET /api/crm/company/:cui
   * @param req Request cu CUI-ul companiei in params
   * @param res Response cu datele companiei
   */
  async getCompanyData(req: Request, res: Response) {
    try {
      // Verificare autentificare 
      if (!req.user || !req.user.id) {
        console.error(`[AnafController] ❌ Acces neautorizat la ruta /api/crm/company/:cui`);
        return res.status(401).json({ 
          error: 'Nu sunteți autentificat. Vă rugăm să vă autentificați și să încercați din nou.' 
        });
      }
      
      // Validare CUI
      const cui = req.params.cui;
      const validCui = validateCui(cui);
      
      if (validCui === null) {
        return res.status(400).json({ error: 'CUI invalid' });
      }
      
      console.log(`[AnafController] 🔍 Interogare ANAF pentru CUI: ${validCui} de către utilizatorul ${req.user.id}`);
      
      // Folosim serviciul de coadă pentru a limita și grupa cererile
      const companyData = await anafQueueService.queueCompanyRequest(
        validCui, 
        req.user.id, 
        req.user.companyId || 'unknown'
      );
      
      if (companyData) {
        // Auditare cerere reușită
        AuditService.log({
          userId: req.user?.id || 'anonymous',
          companyId: req.user?.companyId || 'unknown',
          action: 'anaf_get_company',
          entity: 'anaf_api',
          details: { 
            cui: validCui,
            success: true
          }
        });
        
        return res.status(200).json(companyData);
      } else {
        // Daca nu am gasit compania
        return res.status(404).json({ 
          error: 'Compania nu a fost găsită', 
          cui: validCui
        });
      }
    } catch (error: any) {
      console.error('Eroare la obținerea datelor companiei:', error.message);
      
      // Auditare eroare
      AuditService.log({
        userId: req.user?.id || 'anonymous',
        companyId: req.user?.companyId || 'unknown',
        action: 'anaf_get_company_error',
        entity: 'anaf_api',
        details: { 
          cui: req.params.cui,
          error: error.message,
          success: false 
        }
      });
      
      return res.status(500).json({
        error: 'Eroare la obținerea datelor de la ANAF',
        details: error.message,
      });
    }
  }
  
  /**
   * Ruta batch pentru interogarea datelor mai multor companii
   * 
   * @route POST /api/crm/companies/batch
   * @param req Request cu array de CUI-uri în body
   * @param res Response cu datele companiilor
   */
  async batchGetCompanies(req: Request, res: Response) {
    try {
      // Verificare autentificare 
      if (!req.user || !req.user.id) {
        console.error(`[AnafController] ❌ Acces neautorizat la ruta /api/crm/companies/batch`);
        return res.status(401).json({ 
          error: 'Nu sunteți autentificat. Vă rugăm să vă autentificați și să încercați din nou.' 
        });
      }
      
      // Verificăm dacă avem un body valid
      if (!req.body || !Array.isArray(req.body.cuiList)) {
        return res.status(400).json({
          error: 'Format invalid al cererii. Furnizați un obiect cu proprietatea cuiList de tip array.'
        });
      }
      
      const cuiList = req.body.cuiList;
      
      // Verificăm dacă avem cel puțin un CUI
      if (cuiList.length === 0) {
        return res.status(400).json({
          error: 'Lista de CUI-uri nu poate fi goală.'
        });
      }
      
      // Limităm numărul de CUI-uri la 100 per cerere
      if (cuiList.length > 100) {
        return res.status(400).json({
          error: 'Prea multe CUI-uri. Maximum 100 sunt permise într-o cerere.',
          requested: cuiList.length
        });
      }
      
      console.log(`Interogare batch pentru ${cuiList.length} CUI-uri`);
      
      // Procesăm fiecare CUI individual pentru o mai bună fiabilitate
      // Vom cere datele pentru fiecare CUI separat și apoi combinăm rezultatele
      console.log(`[AnafController] Procesare individuală pentru ${cuiList.length} CUI-uri`);
      
      const validatedCuis = cuiList
        .map((cui: any) => validateCui(cui))
        .filter((cui: any) => cui !== null) as string[];
      
      // Adăugăm un log detaliat pentru depanare
      console.log(`[AnafController] CUI-uri primite: ${JSON.stringify(cuiList)}`);
      console.log(`[AnafController] CUI-uri validate: ${JSON.stringify(validatedCuis)}`);
      
      console.log(`[AnafController] După validare, au rămas ${validatedCuis.length} CUI-uri valide`);
      
      // Pentru fiecare CUI, facem o cerere către serviciul de coadă
      const results = [];
      
      for (const cui of validatedCuis) {
        try {
          // Procesăm secvențial pentru a evita rate limiting și probleme de parsare
          const data = await anafQueueService.queueCompanyRequest(
            cui,
            req.user?.id || 'anonymous',
            req.user?.companyId || 'unknown'
          );
          
          results.push({ cui, valid: true, data });
        } catch (error: any) {
          console.error(`[AnafController] Eroare la obținerea datelor pentru CUI ${cui}:`, error);
          results.push({ cui, valid: true, error: error.message, data: null });
        }
      }
      
      // Verificăm dacă toate rezultatele au structura corectă și au cui
      const validResults = results.filter(r => r && typeof r === 'object' && 'cui' in r);
      
      // Organizăm rezultatele în found și notFound, similar cu API-ul ANAF
      const found = validResults.filter(r => r.valid && r.data).map(r => r.data);
      const notFound = validResults.filter(r => !r.valid || !r.data).map(r => r.cui);
      const errors = validResults.filter(r => r.error).map(r => ({ cui: r.cui, error: r.error }));
      
      // Auditare cerere batch
      AuditService.log({
        userId: req.user?.id || 'anonymous',
        companyId: req.user?.companyId || 'unknown',
        action: 'anaf_batch_get_companies',
        entity: 'anaf_api',
        details: { 
          requestedCount: cuiList.length,
          foundCount: found.length,
          notFoundCount: notFound.length,
          errorsCount: errors.length,
          success: true
        }
      });
      
      // Asigurăm-ne că valorile sunt definite și valide și stabilim explicit content-type
      return res.status(200)
        .set('Content-Type', 'application/json')
        .json({
          success: true,
          found: Array.isArray(found) ? found : [],
          notFound: Array.isArray(notFound) ? notFound : [],
          errors: errors && errors.length > 0 ? errors : []
        });
    } catch (error: any) {
      console.error('Eroare la interogarea batch ANAF:', error.message);
      
      // Auditare eroare
      AuditService.log({
        userId: req.user?.id || 'anonymous',
        companyId: req.user?.companyId || 'unknown',
        action: 'anaf_batch_get_companies_error',
        entity: 'anaf_api',
        details: { 
          error: error.message,
          success: false
        }
      });
      
      return res.status(500)
        .set('Content-Type', 'application/json')
        .json({
          error: 'Eroare la interogarea batch ANAF',
          details: error.message
        });
    }
  }
}

// Creăm și exportăm o singură instanță a controller-ului
const anafController = new AnafController();
export { anafController };