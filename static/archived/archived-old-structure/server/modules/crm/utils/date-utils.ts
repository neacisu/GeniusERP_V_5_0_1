/**
 * Utilitar pentru gestionarea conversiei datelor în format ISO string
 * Folosit pentru a asigura că toate datele sunt stocate în format consistent în baza de date
 */

/**
 * Funcția robustă pentru conversia datelor în format ISO string sau null
 * Gestionează multiple formate de date inclusiv ISO, românesc, și timestamp
 * Asigură gestionarea robustă a erorilor pentru a preveni crash-urile
 * 
 * @param value Valoarea de convertit (string, Date, timestamp, etc.)
 * @returns String în format ISO 8601 sau null dacă conversia nu este posibilă
 */
export const toIsoString = (value: any): string | null => {
  try {
    if (value === null || value === undefined || value === '') return null;
    
    // Dacă e deja un Date, convertim direct la ISO string
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value.toISOString();
    }
    
    // Dacă e numeric (timestamp), convertim la Date
    if (typeof value === 'number') {
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date.toISOString();
      } catch (e) {
        console.error(`[DateUtils] ❌ Eroare la conversia timestamp [${value}] în ISO string:`, e);
        return null;
      }
    }
    
    // Dacă e string, verificăm diverse formate
    if (typeof value === 'string') {
      // Curățăm stringul
      const cleanValue = value.trim();
      
      // Verificăm dacă e deja în format ISO
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(cleanValue)) {
        return cleanValue; // deja e în format ISO
      }
      
      // Pattern pentru data în format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
        return `${cleanValue}T00:00:00.000Z`;
      }
      
      // Pattern pentru data în format DD.MM.YYYY (românesc cu punct)
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(cleanValue)) {
        const parts = cleanValue.split('.');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Luna 0-11 în JS
        const year = parseInt(parts[2], 10);
        const date = new Date(Date.UTC(year, month, day));
        return isNaN(date.getTime()) ? null : date.toISOString();
      }
      
      // Pattern pentru data în format DD-MM-YYYY (românesc cu liniuță)
      if (/^\d{2}-\d{2}-\d{4}$/.test(cleanValue)) {
        const parts = cleanValue.split('-');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Luna 0-11 în JS
        const year = parseInt(parts[2], 10);
        const date = new Date(Date.UTC(year, month, day));
        return isNaN(date.getTime()) ? null : date.toISOString();
      }
      
      // Încercăm să convertim direct ca ultimă opțiune
      try {
        const date = new Date(cleanValue);
        // Verificăm explicit dacă avem o dată validă
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
        return null;
      } catch (e) {
        console.error(`[DateUtils] ❌ Eroare la conversia datei [${cleanValue}] în ISO string:`, e);
        return null;
      }
    }
    
    // Alte tipuri nu sunt acceptate
    console.warn(`[DateUtils] ⚠️ Tip de dată neacceptat pentru conversie: ${typeof value}`);
    return null;
  } catch (e) {
    // Siguranță suplimentară - prindem orice eroare neașteptată 
    console.error(`[DateUtils] ❌ Eroare neașteptată la conversia în ISO string:`, e);
    return null;
  }
};

/**
 * Garantează că valoarea returnată este un string ISO valid sau null
 * Folosit pentru a preveni eroarea value.toISOString is not a function în Drizzle
 * 
 * @param value Valoarea de convertit
 * @returns String în format ISO sau null
 */
export const safeIsoString = (value: any): string | null => {
  const result = toIsoString(value);
  return result || null; // Garantează că returnăm strict string sau null, niciodată undefined
};

/**
 * Generează un timestamp ISO pentru momentul curent
 * 
 * @returns String ISO cu data și ora curentă
 */
export const nowIsoString = (): string => {
  return new Date().toISOString();
};

/**
 * Convertește datele ANAF în format sigur pentru baza de date
 * Garantează că toate câmpurile de tip dată sunt convertite corect în format ISO
 * 
 * @param data Obiectul cu date de la ANAF
 * @param fieldName Numele câmpului
 * @returns Valoarea convertită în format ISO sau null
 */
export const anafDateToIsoString = (data: any, fieldName: string): string | null => {
  if (!data) return null;
  
  // Găsim valoarea în obiect, acceptând și variante cu underscore
  const underscoreField = fieldName.replace(/([A-Z])/g, "_$1").toLowerCase();
  const value = data[fieldName] || data[underscoreField] || null;
  
  return safeIsoString(value);
};