/**
 * Transformator pentru date generale ANAF
 * 
 * Acest modul gestionează transformarea datelor generale ale companiei
 * obținute de la API-ul ANAF în formatul necesar pentru baza de date.
 */

import { safeIsoString } from '../../../utils/date-utils';

/**
 * Interfața pentru datele generale primite de la ANAF
 */
export interface DateGenerale {
  cui: string;
  data: string;
  denumire: string;
  adresa: string;
  nrRegCom: string;
  telefon: string;
  fax: string;
  codPostal: string;
  act: string;
  stare_inregistrare: string;
  data_inregistrare: string;
  cod_CAEN: string;
  iban: string;
  statusRO_e_Factura: boolean;
  organFiscalCompetent: string;
  forma_de_proprietate: string;
  forma_organizare: string;
  forma_juridica: string;
}

/**
 * Transformă datele generale ale unei companii în formatul pentru baza de date
 * 
 * @param dateGenerale Datele generale primite de la ANAF
 * @returns Obiect cu datele transformate pentru baza de date
 */
export function transformDateGenerale(dateGenerale: DateGenerale | undefined): Record<string, any> {
  if (!dateGenerale) {
    return {
      cui: null,
      denumire: null,
      adresa: null,
      nrRegCom: null,
      telefon: null,
      fax: null,
      codPostal: null,
      act: null,
      stareInregistrare: null,
      dataInregistrare: null,
      codCaen: null,
      iban: null,
      statusRoEFactura: false,
      organFiscalCompetent: null,
      formaJuridica: null,
      formaOrganizare: null
    };
  }
  
  return {
    cui: dateGenerale.cui || null,
    denumire: dateGenerale.denumire || null,
    adresa: dateGenerale.adresa || null,
    nrRegCom: dateGenerale.nrRegCom || null,
    telefon: dateGenerale.telefon || null,
    fax: dateGenerale.fax || null,
    codPostal: dateGenerale.codPostal || null,
    act: dateGenerale.act || null,
    stareInregistrare: dateGenerale.stare_inregistrare || null,
    dataInregistrare: safeIsoString(dateGenerale.data_inregistrare),
    codCaen: dateGenerale.cod_CAEN || null,
    iban: dateGenerale.iban || null,
    statusRoEFactura: dateGenerale.statusRO_e_Factura || false,
    organFiscalCompetent: dateGenerale.organFiscalCompetent || null,
    formaJuridica: dateGenerale.forma_juridica || null,
    formaOrganizare: dateGenerale.forma_organizare || null
  };
}