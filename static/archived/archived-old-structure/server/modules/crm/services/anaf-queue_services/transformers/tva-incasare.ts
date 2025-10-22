/**
 * Transformator pentru date TVA la încasare ANAF
 * 
 * Acest modul gestionează transformarea datelor referitoare la TVA la încasare
 * obținute de la API-ul ANAF în formatul necesar pentru baza de date.
 */

import { safeIsoString } from '../../../utils/date-utils';

/**
 * Interfața pentru datele de înregistrare în sistem TVA la încasare
 */
export interface InregistrareTVAIncasare {
  dataInceputTvaInc: string;
  dataSfarsitTvaInc: string;
  dataActualizareTvaInc: string;
  dataPublicareTvaInc: string;
  tipActTvaInc: string;
  statusTvaIncasare: boolean;
}

/**
 * Transformă datele de TVA la încasare într-un format pentru baza de date
 * 
 * @param tvaIncasare Datele de TVA la încasare de la ANAF
 * @returns Obiect cu datele transformate pentru baza de date
 */
export function transformTVAIncasare(tvaIncasare: InregistrareTVAIncasare | undefined): Record<string, any> {
  if (!tvaIncasare) {
    return {
      statusTvaIncasare: false,
      dataInceputTvaInc: null,
      dataSfarsitTvaInc: null,
      dataActualizareTvaInc: null,
      dataPublicareTvaInc: null,
      tipActTvaInc: null
    };
  }
  
  return {
    statusTvaIncasare: tvaIncasare.statusTvaIncasare || false,
    dataInceputTvaInc: safeIsoString(tvaIncasare.dataInceputTvaInc),
    dataSfarsitTvaInc: safeIsoString(tvaIncasare.dataSfarsitTvaInc),
    dataActualizareTvaInc: safeIsoString(tvaIncasare.dataActualizareTvaInc),
    dataPublicareTvaInc: safeIsoString(tvaIncasare.dataPublicareTvaInc),
    tipActTvaInc: tvaIncasare.tipActTvaInc || null
  };
}