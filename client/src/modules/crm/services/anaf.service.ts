/**
 * ANAF Service
 * 
 * Servicii pentru integrarea cu API-ul ANAF
 * Actualizat pentru a susține extragerea în componente separate a adresei (stradă, număr, etc)
 */

/**
 * Obține date despre o companie de la ANAF folosind CUI-ul
 * 
 * @param cui CUI-ul companiei
 * @returns Datele companiei de la ANAF
 */
export async function getCompanyDataFromAnaf(cui: string): Promise<any> {
  // Obținem token-ul din obiectul user stocat în localStorage
  let token = null;
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user && user.token) {
        token = user.token;
        console.log('Token găsit în localStorage (user)');
      }
    }
  } catch (error) {
    console.error('Eroare la obținerea token-ului din localStorage:', error);
  }
  
  // Verificăm și locațiile alternative pentru token (backward compatibility)
  if (!token) {
    token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    if (token) {
      console.log('Token găsit în localStorage (auth_token/authToken)');
    }
  }
  
  if (!token) {
    throw new Error(`Nu sunteți autentificat. Vă rugăm să vă autentificați și să încercați din nou.`);
  }

  const response = await fetch(`/api/crm/company/${cui}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Eroare ANAF: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Formatează adresa completă din datele ANAF
 * 
 * @param anafData Datele companiei de la ANAF
 * @returns Adresa completă formatată
 */
export function formatAddressFromAnaf(anafData: any): string {
  if (!anafData) {
    return '';
  }
  
  // Dacă avem date direct din ANAF API
  if (anafData.date_generale && anafData.date_generale.adresa) {
    return anafData.date_generale.adresa;
  }
  
  // Dacă avem detalii despre adresa sediului social
  if (anafData.adresa_sediu_social) {
    let formattedAddress = '';
    
    if (anafData.adresa_sediu_social.sdenumire_Strada) {
      formattedAddress += anafData.adresa_sediu_social.sdenumire_Strada;
    }
    
    if (anafData.adresa_sediu_social.snumar_Strada) {
      formattedAddress += ` nr. ${anafData.adresa_sediu_social.snumar_Strada}`;
    }
    
    if (anafData.adresa_sediu_social.sdetalii_Adresa) {
      formattedAddress += `, ${anafData.adresa_sediu_social.sdetalii_Adresa}`;
    }
    
    return formattedAddress;
  }
  
  // Format legacy - pentru compatibilitate cu date vechi
  if (anafData.adresa) {
    const adresa = anafData.adresa;
    let formattedAddress = '';
    
    if (typeof adresa === 'string') {
      return adresa; // Dacă adresa este deja un string formatat
    }
    
    // Construiește adresa în format: "Strada, Nr, Bloc, Scara, Etaj, Apartament"
    if (adresa.strada) {
      formattedAddress += adresa.strada;
    }
    
    if (adresa.nrStrada) {
      formattedAddress += ` nr. ${adresa.nrStrada}`;
    }
    
    if (adresa.bloc) {
      formattedAddress += `, bl. ${adresa.bloc}`;
    }
    
    if (adresa.scara) {
      formattedAddress += `, sc. ${adresa.scara}`;
    }
    
    if (adresa.etaj) {
      formattedAddress += `, et. ${adresa.etaj}`;
    }
    
    if (adresa.apartament) {
      formattedAddress += `, ap. ${adresa.apartament}`;
    }
    
    return formattedAddress;
  }
  
  return '';  
}

/**
 * Extrage orașul din datele ANAF
 * 
 * @param anafData Datele companiei de la ANAF
 * @returns Orașul companiei
 */
export function getCityFromAnaf(anafData: any): string {
  if (!anafData) {
    return '';
  }
  
  // Dacă avem detalii despre adresa sediului social
  if (anafData.adresa_sediu_social && anafData.adresa_sediu_social.sdenumire_Localitate) {
    return anafData.adresa_sediu_social.sdenumire_Localitate;
  }
  
  // Dacă avem detalii despre domiciliul fiscal
  if (anafData.adresa_domiciliu_fiscal && anafData.adresa_domiciliu_fiscal.ddenumire_Localitate) {
    return anafData.adresa_domiciliu_fiscal.ddenumire_Localitate;
  }
  
  // Format legacy - pentru compatibilitate cu date vechi
  if (anafData.adresa && anafData.adresa.localitate) {
    return anafData.adresa.localitate;
  }
  
  return '';
}

/**
 * Extrage județul din datele ANAF
 * 
 * @param anafData Datele companiei de la ANAF
 * @returns Județul companiei
 */
export function getCountyFromAnaf(anafData: any): string {
  if (!anafData) {
    return '';
  }
  
  // Dacă avem detalii despre adresa sediului social
  if (anafData.adresa_sediu_social && anafData.adresa_sediu_social.sdenumire_Judet) {
    return anafData.adresa_sediu_social.sdenumire_Judet;
  }
  
  // Dacă avem detalii despre domiciliul fiscal
  if (anafData.adresa_domiciliu_fiscal && anafData.adresa_domiciliu_fiscal.ddenumire_Judet) {
    return anafData.adresa_domiciliu_fiscal.ddenumire_Judet;
  }
  
  // Format legacy - pentru compatibilitate cu date vechi
  if (anafData.adresa && anafData.adresa.judet) {
    return anafData.adresa.judet;
  }
  
  return '';
}

/**
 * Extrage codul poștal din datele ANAF
 * 
 * @param anafData Datele companiei de la ANAF
 * @returns Codul poștal al companiei
 */
export function getPostalCodeFromAnaf(anafData: any): string {
  if (!anafData) {
    return '';
  }
  
  // Dacă avem date direct din ANAF API
  if (anafData.date_generale && anafData.date_generale.codPostal) {
    return anafData.date_generale.codPostal;
  }
  
  // Dacă avem detalii despre adresa sediului social
  if (anafData.adresa_sediu_social && anafData.adresa_sediu_social.scod_Postal) {
    return anafData.adresa_sediu_social.scod_Postal;
  }
  
  // Dacă avem detalii despre domiciliul fiscal
  if (anafData.adresa_domiciliu_fiscal && anafData.adresa_domiciliu_fiscal.dcod_Postal) {
    return anafData.adresa_domiciliu_fiscal.dcod_Postal;
  }
  
  // Format legacy - pentru compatibilitate cu date vechi
  if (anafData.adresa && anafData.adresa.codPostal) {
    return anafData.adresa.codPostal;
  }
  
  return '';
}

/**
 * Extrage strada (numele străzii) din datele ANAF
 * 
 * @param anafData Datele companiei de la ANAF
 * @returns Numele străzii
 */
export function getStreetFromAnaf(anafData: any): string {
  if (!anafData) {
    return '';
  }
  
  // Dacă avem detalii despre adresa sediului social
  if (anafData.adresa_sediu_social && anafData.adresa_sediu_social.sdenumire_Strada) {
    return anafData.adresa_sediu_social.sdenumire_Strada;
  }
  
  // Dacă avem detalii despre domiciliul fiscal
  if (anafData.adresa_domiciliu_fiscal && anafData.adresa_domiciliu_fiscal.ddenumire_Strada) {
    return anafData.adresa_domiciliu_fiscal.ddenumire_Strada;
  }
  
  // Format legacy - pentru compatibilitate cu date vechi
  if (anafData.adresa && anafData.adresa.strada) {
    return anafData.adresa.strada;
  }
  
  // Încercăm să extragem strada din adresa completă
  if (anafData.date_generale && anafData.date_generale.adresa) {
    const fullAddress = anafData.date_generale.adresa;
    // Pattern simplu pentru a extrage partea de stradă din adresa completă
    // Presupunem că strada este înainte de "nr." sau înainte de prima virgulă sau primul număr
    const streetMatch = fullAddress.match(/^([^,\d]+)(?:,|\s+nr\.|\s+\d+|$)/i);
    if (streetMatch && streetMatch[1]) {
      return streetMatch[1].trim();
    }
  }
  
  return '';
}

/**
 * Extrage numărul străzii din datele ANAF
 * 
 * @param anafData Datele companiei de la ANAF
 * @returns Numărul străzii
 */
export function getStreetNumberFromAnaf(anafData: any): string {
  if (!anafData) {
    return '';
  }
  
  // Dacă avem detalii despre adresa sediului social
  if (anafData.adresa_sediu_social && anafData.adresa_sediu_social.snumar_Strada) {
    return anafData.adresa_sediu_social.snumar_Strada;
  }
  
  // Dacă avem detalii despre domiciliul fiscal
  if (anafData.adresa_domiciliu_fiscal && anafData.adresa_domiciliu_fiscal.dnumar_Strada) {
    return anafData.adresa_domiciliu_fiscal.dnumar_Strada;
  }
  
  // Format legacy - pentru compatibilitate cu date vechi
  if (anafData.adresa && anafData.adresa.nrStrada) {
    return anafData.adresa.nrStrada;
  }
  
  // Încercăm să extragem numărul din adresa completă
  if (anafData.date_generale && anafData.date_generale.adresa) {
    const fullAddress = anafData.date_generale.adresa;
    // Pattern pentru a extrage numărul străzii (după "nr." sau după numele străzii)
    const numberMatch = fullAddress.match(/(?:nr\.\s*|[^,]+\s+)(\d+[A-Za-z]?(?:-\d+[A-Za-z]?)?)/i);
    if (numberMatch && numberMatch[1]) {
      return numberMatch[1].trim();
    }
  }
  
  return '';
}

/**
 * Extrage detaliile adresei (bloc, scară, etc.) din datele ANAF
 * 
 * @param anafData Datele companiei de la ANAF
 * @returns Detaliile adresei (bloc, scară, etc.)
 */
export function getAddressDetailsFromAnaf(anafData: any): string {
  if (!anafData) {
    return '';
  }
  
  // Dacă avem detalii despre adresa sediului social
  if (anafData.adresa_sediu_social && anafData.adresa_sediu_social.sdetalii_Adresa) {
    return anafData.adresa_sediu_social.sdetalii_Adresa;
  }
  
  // Dacă avem detalii despre domiciliul fiscal
  if (anafData.adresa_domiciliu_fiscal && anafData.adresa_domiciliu_fiscal.ddetalii_Adresa) {
    return anafData.adresa_domiciliu_fiscal.ddetalii_Adresa;
  }
  
  // Construim detaliile din format legacy (bloc, scară, etaj, apartament)
  if (anafData.adresa) {
    const adresa = anafData.adresa;
    let details = '';
    
    if (adresa.bloc) {
      details += `Bl. ${adresa.bloc}`;
    }
    
    if (adresa.scara) {
      details += details ? `, Sc. ${adresa.scara}` : `Sc. ${adresa.scara}`;
    }
    
    if (adresa.etaj) {
      details += details ? `, Et. ${adresa.etaj}` : `Et. ${adresa.etaj}`;
    }
    
    if (adresa.apartament) {
      details += details ? `, Ap. ${adresa.apartament}` : `Ap. ${adresa.apartament}`;
    }
    
    return details;
  }
  
  // Încercăm să extragem detaliile din adresa completă
  if (anafData.date_generale && anafData.date_generale.adresa) {
    const fullAddress = anafData.date_generale.adresa;
    // Pattern pentru a extrage detaliile după numărul străzii și virgulă
    const detailsMatch = fullAddress.match(/(?:nr\.\s*\d+[^,]*,\s*|[^,]+\s+\d+[^,]*,\s*)(.*)/i);
    if (detailsMatch && detailsMatch[1]) {
      return detailsMatch[1].trim();
    }
  }
  
  return '';
}