/**
 * Transformator pentru date TVA ANAF
 * 
 * Acest modul gestionează transformarea datelor referitoare la TVA
 * obținute de la API-ul ANAF în formatul necesar pentru baza de date.
 */

import { safeIsoString } from '../../../utils/date-utils';

/**
 * Interfața pentru o perioadă de TVA
 */
export interface Perioada_TVA {
  data_inceput_ScpTVA: string;
  data_sfarsit_ScpTVA: string;
  data_anul_imp_ScpTVA: string;
  mesaj_ScpTVA: string;
}

/**
 * Interfața pentru datele de înregistrare în scop de TVA
 */
export interface InregistrareScopTva {
  scpTVA: boolean;
  perioade_TVA: Perioada_TVA | Perioada_TVA[];
}

/**
 * Normalizează perioade_TVA asigurând că este întotdeauna un array
 * 
 * @param perioade Perioade TVA din răspunsul ANAF
 * @returns Array de perioade TVA
 */
export function normalizePerioade(perioade: Perioada_TVA | Perioada_TVA[] | undefined): Perioada_TVA[] {
  if (!perioade) {
    return [];
  }
  
  if (Array.isArray(perioade)) {
    return perioade;
  }
  
  return [perioade];
}

/**
 * Transformă datele de înregistrare în scop de TVA într-un format pentru baza de date
 * 
 * @param inregistrareTva Datele de înregistrare TVA de la ANAF
 * @returns Obiect cu datele transformate pentru baza de date
 */
export function transformTVA(inregistrareTva: InregistrareScopTva | undefined): Record<string, any> {
  if (!inregistrareTva) {
    return {
      scpTVA: false,
      dataInceputScpTVA: null,
      dataSfarsitScpTVA: null,
      dataAnulImpScpTVA: null,
      mesajScpTVA: null,
      perioadeTVA: []
    };
  }
  
  const perioade = normalizePerioade(inregistrareTva.perioade_TVA);
  const ultimaPerioada = perioade.length > 0 ? perioade[0] : null;
  
  return {
    scpTVA: inregistrareTva.scpTVA || false,
    dataInceputScpTVA: ultimaPerioada ? safeIsoString(ultimaPerioada.data_inceput_ScpTVA) : null,
    dataSfarsitScpTVA: ultimaPerioada ? safeIsoString(ultimaPerioada.data_sfarsit_ScpTVA) : null,
    dataAnulImpScpTVA: ultimaPerioada ? safeIsoString(ultimaPerioada.data_anul_imp_ScpTVA) : null,
    mesajScpTVA: ultimaPerioada ? ultimaPerioada.mesaj_ScpTVA : null,
    perioadeTVA: perioade // Stocăm toate perioadele pentru istoric
  };
}