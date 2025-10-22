/**
 * Transformator pentru date Split TVA ANAF
 * 
 * Acest modul gestionează transformarea datelor referitoare la Split TVA
 * obținute de la API-ul ANAF în formatul necesar pentru baza de date.
 */

import { safeIsoString } from '../../../utils/date-utils';

/**
 * Interfața pentru datele de înregistrare în sistem Split TVA
 */
export interface InregistrareSplitTVA {
  dataInceputSplitTVA: string;
  dataAnulareSplitTVA: string;
  statusSplitTVA: boolean;
}

/**
 * Transformă datele de Split TVA într-un format pentru baza de date
 * 
 * @param splitTVA Datele de Split TVA de la ANAF
 * @returns Obiect cu datele transformate pentru baza de date
 */
export function transformSplitTVA(splitTVA: InregistrareSplitTVA | undefined): Record<string, any> {
  if (!splitTVA) {
    return {
      statusSplitTVA: false,
      dataInceputSplitTVA: null,
      dataAnulareSplitTVA: null
    };
  }
  
  return {
    statusSplitTVA: splitTVA.statusSplitTVA || false,
    dataInceputSplitTVA: safeIsoString(splitTVA.dataInceputSplitTVA),
    dataAnulareSplitTVA: safeIsoString(splitTVA.dataAnulareSplitTVA)
  };
}