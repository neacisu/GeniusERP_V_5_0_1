/**
 * ANAF Service
 * 
 * Serviciu pentru interogarea API-ului ANAF pentru a obține informații despre companii
 * folosind CUI-ul (codul fiscal).
 * 
 * API ANAF V9: https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva
 */

import axios from 'axios';

// URL-ul API-ului ANAF
const ANAF_API_URL = 'https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva';

// Tipul de date pentru request-ul către API-ul ANAF
export interface AnafRequest {
  cui: string;
  data: string; // Format: YYYY-MM-DD
}

// Tipul de date pentru răspunsul de la API-ul ANAF
export interface AnafCompanyData {
  date_generale: {
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
  };
  inregistrare_scop_Tva: {
    scpTVA: boolean;
    perioade_TVA: {
      data_inceput_ScpTVA: string;
      data_sfarsit_ScpTVA: string;
      data_anul_imp_ScpTVA: string;
      mesaj_ScpTVA: string;
    };
  };
  inregistrare_RTVAI: {
    dataInceputTvaInc: string;
    dataSfarsitTvaInc: string;
    dataActualizareTvaInc: string;
    dataPublicareTvaInc: string;
    tipActTvaInc: string;
    statusTvaIncasare: boolean;
  };
  stare_inactiv: {
    dataInactivare: string;
    dataReactivare: string;
    dataPublicare: string;
    dataRadiere: string;
    statusInactivi: boolean;
  };
  inregistrare_SplitTVA: {
    dataInceputSplitTVA: string;
    dataAnulareSplitTVA: string;
    statusSplitTVA: boolean;
  };
  adresa_sediu_social: {
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
  };
  adresa_domiciliu_fiscal: {
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
  };
}

export interface AnafResponse {
  cod: number;
  message: string;
  found: AnafCompanyData[];
  notFound: string[];
}

export class AnafService {
  /**
   * Interoghează API-ul ANAF pentru a obține informații despre companii
   * 
   * @param cuiList Lista de CUI-uri pentru care se doresc informații
   * @returns Răspunsul de la ANAF cu datele companiilor
   */
  async queryAnaf(cuiList: string[]): Promise<AnafResponse> {
    try {
      // Obține data curentă în formatul YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      
      // Construiește request-ul pentru ANAF
      const requestData = cuiList.map(cui => {
        // Curăță CUI-ul (remove RO prefix și spații)
        const cleanCui = cui.replace(/^RO/i, '').trim();
        
        return {
          cui: cleanCui,
          data: today
        };
      });
      
      // Logging pentru debugging
      console.log(`[AnafService] 🔍 Interogare ANAF pentru CUI-uri:`, cuiList);
      
      console.log(`[AnafService] 🔍 Interogare ANAF pentru ${cuiList.length} CUI-uri:`, cuiList);
      console.log(`[AnafService] 📝 Request data trimis către ANAF:`, JSON.stringify(requestData));
      
      // Trimite cererea către API-ul ANAF cu timeout mai mare
      const response = await axios.post(ANAF_API_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000,  // 30 secunde timeout pentru a permite răspunsuri mai lente
        maxContentLength: 10 * 1024 * 1024  // 10 MB maxim pentru răspuns
      });
      
      console.log(`[AnafService] 📥 Răspuns ANAF primit: Status ${response.status}`);
      
      // Parsăm răspunsul care poate fi în diferite formate
      let responseData = response.data;
      
      // Log de debugging pentru a vedea exact ce format de date primim
      console.log(`[AnafService] 🔄 Tip date răspuns: ${typeof responseData}`);
      
      if (typeof responseData === 'object') {
        console.log(`[AnafService] 📋 Structura răspunsului:`, Object.keys(responseData));
      } else if (typeof responseData === 'string') {
        console.log(`[AnafService] 📝 Lungime string răspuns: ${responseData.length} caractere`);
        
        // Verificăm primele 200 de caractere pentru a înțelege formatul
        console.log(`[AnafService] 📝 Exemplu răspuns (primele 200 caractere):`, 
          responseData.substring(0, 200));
          
        try {
          responseData = JSON.parse(responseData);
          console.log('[AnafService] ✅ Răspunsul a fost parsat cu succes din string în JSON');
          console.log('[AnafService] 📋 Structura răspunsului parsat:', Object.keys(responseData));
        } catch (parseError: any) {
          console.error('[AnafService] ❌ Răspunsul nu este un JSON valid:', parseError.message);
          
          // Încercăm să detectăm tipul de conținut pentru debugging
          const contentStart = responseData.substring(0, 20).toLowerCase();
          if (contentStart.includes('<!doctype') || contentStart.includes('<html')) {
            console.error('[AnafService] ⚠️ Răspunsul pare să fie HTML în loc de JSON!');
          }
          
          // În caz de eroare de parsare, returnăm un rezultat gol
          return {
            cod: 500, 
            message: `Eroare la parsarea răspunsului: ${parseError.message}`,
            found: [],
            notFound: cuiList
          };
        }
      }
      
      // Normalizăm structura răspunsului pentru a ne asigura că găsim array-uri valide
      const found = Array.isArray(responseData.found) ? responseData.found : [];
      const notFound = Array.isArray(responseData.notFound) ? responseData.notFound : [];
      
      console.log(`[AnafService] ✅ Răspuns ANAF procesat cu succes: ${found.length} companii găsite, ${notFound.length} negăsite`);
      
      // Verifică dacă toate CUI-urile au fost procesate în răspuns
      const processedCuis = [...found.map(company => company.date_generale?.cui), ...notFound].filter(Boolean);
      const missingCuis = cuiList.filter(cui => {
        const cleanCui = cui.replace(/^RO/i, '').trim();
        return !processedCuis.includes(cleanCui);
      });
      
      if (missingCuis.length > 0) {
        console.log(`[AnafService] ⚠️ Atenție! Următoarele CUI-uri nu apar nici în found, nici în notFound:`, missingCuis);
      }
      
      return {
        cod: responseData.cod || 200,
        message: responseData.message || 'Succes',
        found,
        notFound
      } as AnafResponse;
    } catch (error: any) {
      console.error(`[AnafService] ❌ Eroare la interogarea ANAF:`, error);
      
      // Debugging detaliat pentru erori
      if (error.code) {
        console.error(`[AnafService] Cod eroare: ${error.code}`);
      }
      
      if (error.response) {
        console.error(`[AnafService] Status: ${error.response.status}`);
        console.error(`[AnafService] Headers:`, error.response.headers);
        console.error(`[AnafService] Data:`, error.response.data);
      }
      
      if (error.response) {
        // Eroare de la server ANAF
        const statusCode = error.response.status;
        const responseData = error.response.data;
        
        // Log detaliat pentru debugging
        console.error(`[AnafService] Eroare HTTP ${statusCode} de la ANAF`);
        console.error(`[AnafService] Detalii răspuns:`, responseData);
        
        throw new Error(`Eroare ANAF ${statusCode}: ${responseData?.message || error.message}`);
      } else if (error.request) {
        // Nu s-a primit răspuns
        console.error(`[AnafService] Nu s-a primit răspuns de la ANAF`);
        console.error(`[AnafService] Detalii request:`, error.request);
        
        throw new Error(`Fără răspuns de la ANAF: ${error.message}`);
      } else {
        // Altă eroare
        console.error(`[AnafService] Eroare generală:`, error.message, error.stack);
        
        throw new Error(`Eroare la interogarea ANAF: ${error.message}`);
      }
    }
  }
  
  /**
   * Interoghează API-ul ANAF pentru a obține informații despre o singură companie
   * 
   * @param cui Codul fiscal al companiei (cu sau fără RO)
   * @returns Datele companiei sau null dacă nu a fost găsită
   */
  /**
   * Obține informații despre companie doar de la API-ul V9 (cel mai recent)
   * Această metodă este folosită de endpoint-ul public de verificare
   * 
   * @param cui Codul fiscal al companiei
   * @returns Datele companiei sau null dacă nu a fost găsită
   */
  async getCompanyInfoFromV9(cui: string): Promise<AnafCompanyData | null> {
    try {
      // Curăță CUI-ul pentru a elimina prefix RO și spații
      const cleanCui = cui.replace(/^RO/i, '').trim();
      
      console.log(`[AnafService] 🔍 Verificare companie pentru CUI ${cleanCui} (API V9)`);
      
      // Folosim direct API-ul V9
      const response = await this.queryAnaf([cui]);
      
      if (response.found && response.found.length > 0) {
        console.log(`[AnafService] ✅ Date găsite pentru CUI ${cleanCui} în API V9`);
        return response.found[0];
      }
      
      console.log(`[AnafService] ⚠️ Compania cu CUI ${cleanCui} nu a fost găsită în API V9`);
      return null;
    } catch (error) {
      console.error(`[AnafService] ❌ Eroare la obținerea datelor companiei din V9:`, error);
      // Nu propagăm eroarea pentru a permite endpoint-ului public să funcționeze
      return null;
    }
  }

  /**
   * Interoghează API-ul ANAF pentru a obține informații despre o singură companie
   * Folosește atât V9 cât și V8 cu fallback automat
   * 
   * @param cui Codul fiscal al companiei (cu sau fără RO)
   * @returns Datele companiei sau null dacă nu a fost găsită
   */
  async getCompanyData(cui: string): Promise<AnafCompanyData | null> {
    try {
      // Curăță CUI-ul pentru a elimina prefix RO și spații
      const cleanCui = cui.replace(/^RO/i, '').trim();
      
      console.log(`[AnafService] 🔍 Obținere date pentru CUI ${cleanCui}`);
      
      // Încercăm mai întâi metoda standard (API V9)
      try {
        console.log(`[AnafService] 🔄 Încercare API ANAF V9 pentru CUI ${cleanCui}`);
        
        const response = await this.queryAnaf([cui]);
        
        if (response.found && response.found.length > 0) {
          console.log(`[AnafService] ✅ Date găsite pentru CUI ${cleanCui} în API V9`);
          return response.found[0];
        }
        
        console.log(`[AnafService] ⚠️ Date negăsite în API V9 pentru CUI ${cleanCui}, vom încerca V8`);
      } catch (v9Error) {
        console.error(`[AnafService] ❌ Eroare la API V9 pentru CUI ${cleanCui}:`, v9Error);
        console.log(`[AnafService] Continuăm cu metoda alternativă V8`);
      }
      
      // Dacă V9 eșuează sau nu găsește compania, încercăm V8
      try {
        const today = new Date().toISOString().split('T')[0];
        const ANAF_API_V8_URL = 'https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva';
        
        console.log(`[AnafService] 🔄 Încercare API ANAF V8 pentru CUI ${cleanCui} (fallback)`);
        
        const requestData = [{
          cui: cleanCui,
          data: today
        }];
        
        const response = await axios.post(ANAF_API_V8_URL, requestData, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000
        });
        
        console.log(`[AnafService] ✅ Răspuns V8 primit cu succes: Status ${response.status}`);
        
        let responseData = response.data;
        
        // Verificăm dacă răspunsul este string și îl transformăm în obiect
        if (typeof responseData === 'string') {
          responseData = JSON.parse(responseData);
        }
        
        // Verificăm dacă avem date pentru companie
        if (responseData.found && responseData.found.length > 0) {
          console.log(`[AnafService] ✅ Date găsite pentru CUI ${cleanCui} în API V8 (fallback)`);
          return responseData.found[0];
        }
      } catch (v8Error) {
        console.error(`[AnafService] ❌ Eroare la API V8 pentru CUI ${cleanCui}:`, v8Error);
      }
      
      console.log(`[AnafService] ❌ Nu s-au găsit date pentru CUI ${cleanCui} în niciun API`);
      return null;
    } catch (error) {
      console.error(`[AnafService] ❌ Eroare la obținerea datelor companiei:`, error);
      throw error;
    }
  }
}

// Exportă o instanță singleton
export const anafService = new AnafService();