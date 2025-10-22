/**
 * Index pentru transformatorii ANAF
 * 
 * Acest modul exportă toate funcțiile de transformare a datelor ANAF
 * pentru a fi folosite în aplicație.
 */

export * from './date-generale';
export * from './tva';
export * from './tva-incasare';
export * from './inactiv';
export * from './split-tva';
export * from './adresa-sediu';
export * from './adresa-fiscal';

import { AnafCompanyData } from '../../../services/anaf.service';
import { transformDateGenerale } from './date-generale';
import { transformTVA } from './tva';
import { transformTVAIncasare } from './tva-incasare';
import { transformInactiv } from './inactiv';
import { transformSplitTVA } from './split-tva';
import { transformAdresaSediu } from './adresa-sediu';
import { transformAdresaFiscal } from './adresa-fiscal';
import { nowIsoString } from '../../../utils/date-utils';

/**
 * Transformă datele complete ale unei companii din formatul ANAF în formatul pentru baza de date
 * 
 * @param company Datele companiei de la ANAF
 * @param userId ID-ul utilizatorului care a făcut cererea
 * @param companyId ID-ul companiei utilizatorului
 * @returns Obiect cu datele transformate pentru baza de date
 */
export function transformCompanyData(
  company: AnafCompanyData | null, 
  userId: string, 
  companyId: string
): Record<string, any> {
  if (!company) {
    return {
      cui: null,
      companyId,
      createdBy: userId,
      updatedBy: userId,
      createdAt: nowIsoString(),
      updatedAt: nowIsoString()
    };
  }
  
  // Transformăm fiecare secțiune a datelor
  const dateGenerale = transformDateGenerale(company.date_generale);
  const tva = transformTVA(company.inregistrare_scop_Tva);
  const tvaIncasare = transformTVAIncasare(company.inregistrare_RTVAI);
  const inactiv = transformInactiv(company.stare_inactiv);
  const splitTva = transformSplitTVA(company.inregistrare_SplitTVA);
  const adresaSediu = transformAdresaSediu(company.adresa_sediu_social);
  const adresaFiscal = transformAdresaFiscal(company.adresa_domiciliu_fiscal);
  
  // Combinăm toate secțiunile în obiectul final
  return {
    ...dateGenerale,
    ...tva,
    ...tvaIncasare,
    ...inactiv,
    ...splitTva,
    ...adresaSediu,
    ...adresaFiscal,
    
    // Metadate
    companyId: companyId,
    rawResponse: company,
    lastCheckedAt: nowIsoString(),
    createdBy: userId,
    updatedBy: userId,
    createdAt: nowIsoString(),
    updatedAt: nowIsoString()
  };
}