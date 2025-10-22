/**
 * Transformator pentru date de adresă sediu social ANAF
 * 
 * Acest modul gestionează transformarea datelor referitoare la adresa sediului social
 * obținute de la API-ul ANAF în formatul necesar pentru baza de date.
 */

/**
 * Interfața pentru datele de adresă sediu social
 */
export interface AdresaSediuSocial {
  sdenumire_Strada: string;
  snumar_Strada: string;
  sdenumire_Localitate: string;
  scod_Localitate: string;
  sdenumire_Judet: string;
  scod_Judet: string;
  scod_JudetAuto: string;
  stara: string;
  sdetalii_Adresa: string;
  scod_Postal: string;
}

/**
 * Transformă datele de adresă sediu social într-un format pentru baza de date
 * 
 * @param adresaSediu Datele de adresă sediu social de la ANAF
 * @returns Obiect cu datele transformate pentru baza de date
 */
export function transformAdresaSediu(adresaSediu: AdresaSediuSocial | undefined): Record<string, any> {
  if (!adresaSediu) {
    return {
      sdenumireStrada: null,
      snumarStrada: null,
      sdenumireLocalitate: null,
      scodLocalitate: null,
      sdenumireJudet: null,
      scodJudet: null,
      scodJudetAuto: null,
      stara: null,
      sdetaliiAdresa: null,
      scodPostal: null
    };
  }
  
  return {
    sdenumireStrada: adresaSediu.sdenumire_Strada || null,
    snumarStrada: adresaSediu.snumar_Strada || null,
    sdenumireLocalitate: adresaSediu.sdenumire_Localitate || null,
    scodLocalitate: adresaSediu.scod_Localitate || null,
    sdenumireJudet: adresaSediu.sdenumire_Judet || null,
    scodJudet: adresaSediu.scod_Judet || null,
    scodJudetAuto: adresaSediu.scod_JudetAuto || null,
    stara: adresaSediu.stara || null,
    sdetaliiAdresa: adresaSediu.sdetalii_Adresa || null,
    scodPostal: adresaSediu.scod_Postal || null
  };
}