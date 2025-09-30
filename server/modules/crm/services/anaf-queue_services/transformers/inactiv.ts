/**
 * Transformator pentru date de inactivitate ANAF
 * 
 * Acest modul gestionează transformarea datelor referitoare la inactivitate
 * obținute de la API-ul ANAF în formatul necesar pentru baza de date.
 */

import { safeIsoString } from '../../../utils/date-utils';

/**
 * Interfața pentru datele de stare inactivă
 */
export interface StareInactiv {
  dataInactivare: string;
  dataReactivare: string;
  dataPublicare: string;
  dataRadiere: string;
  statusInactivi: boolean;
}

/**
 * Transformă datele de inactivitate într-un format pentru baza de date
 * 
 * @param stareInactiv Datele de inactivitate de la ANAF
 * @returns Obiect cu datele transformate pentru baza de date
 */
export function transformInactiv(stareInactiv: StareInactiv | undefined): Record<string, any> {
  if (!stareInactiv) {
    return {
      statusInactivi: false,
      dataInactivare: null,
      dataReactivare: null,
      dataPublicare: null,
      dataRadiere: null
    };
  }
  
  return {
    statusInactivi: stareInactiv.statusInactivi || false,
    dataInactivare: safeIsoString(stareInactiv.dataInactivare),
    dataReactivare: safeIsoString(stareInactiv.dataReactivare),
    dataPublicare: safeIsoString(stareInactiv.dataPublicare),
    dataRadiere: safeIsoString(stareInactiv.dataRadiere)
  };
}