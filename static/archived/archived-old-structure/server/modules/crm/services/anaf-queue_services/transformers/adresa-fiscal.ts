/**
 * Transformator pentru date de adresă domiciliu fiscal ANAF
 * 
 * Acest modul gestionează transformarea datelor referitoare la adresa domiciliului fiscal
 * obținute de la API-ul ANAF în formatul necesar pentru baza de date.
 */

/**
 * Interfața pentru datele de adresă domiciliu fiscal
 */
export interface AdresaDomiciliuFiscal {
  ddenumire_Strada: string;
  dnumar_Strada: string;
  ddenumire_Localitate: string;
  dcod_Localitate: string;
  ddenumire_Judet: string;
  dcod_Judet: string;
  dcod_JudetAuto: string;
  dtara: string;
  ddetalii_Adresa: string;
  dcod_Postal: string;
}

/**
 * Transformă datele de adresă domiciliu fiscal într-un format pentru baza de date
 * 
 * @param adresaFiscal Datele de adresă domiciliu fiscal de la ANAF
 * @returns Obiect cu datele transformate pentru baza de date
 */
export function transformAdresaFiscal(adresaFiscal: AdresaDomiciliuFiscal | undefined): Record<string, any> {
  if (!adresaFiscal) {
    return {
      ddenumireStrada: null,
      dnumarStrada: null,
      ddenumireLocalitate: null,
      dcodLocalitate: null,
      ddenumireJudet: null,
      dcodJudet: null,
      dcodJudetAuto: null,
      dtara: null,
      ddetaliiAdresa: null,
      dcodPostal: null
    };
  }
  
  return {
    ddenumireStrada: adresaFiscal.ddenumire_Strada || null,
    dnumarStrada: adresaFiscal.dnumar_Strada || null,
    ddenumireLocalitate: adresaFiscal.ddenumire_Localitate || null,
    dcodLocalitate: adresaFiscal.dcod_Localitate || null,
    ddenumireJudet: adresaFiscal.ddenumire_Judet || null,
    dcodJudet: adresaFiscal.dcod_Judet || null,
    dcodJudetAuto: adresaFiscal.dcod_JudetAuto || null,
    dtara: adresaFiscal.dtara || null,
    ddetaliiAdresa: adresaFiscal.ddetalii_Adresa || null,
    dcodPostal: adresaFiscal.dcod_Postal || null
  };
}