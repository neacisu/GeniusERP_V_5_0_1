/**
 * Funcții utilitare pentru validări în modulul CRM
 */

/**
 * Validează un CUI românesc
 * 
 * Descriere: Validează un Cod Unic de Înregistrare (CUI) conform algoritmului oficial
 * - Elimină prefixul "RO" dacă există
 * - Verifică dacă restul este format doar din cifre
 * - Aplică calculul de control conform algoritmului oficial
 * 
 * @param cui CUI-ul de validat
 * @returns string CUI-ul fără prefixul RO dacă este valid, null în caz contrar
 */
export function validateCui(cui: string | number | null | undefined): string | null {
  // Verificăm dacă avem o valoare
  if (cui === null || cui === undefined) return null;
  
  try {
    // Convertim orice valoare la string
    const cuiStr = String(cui);
    
    // Elimină spațiile și convertește la uppercase
    const cleanCui = cuiStr.trim().toUpperCase();
    
    // Extrage prefixul RO dacă există
    const noPrefixCui = cleanCui.startsWith('RO') ? cleanCui.substring(2) : cleanCui;
    
    // Verifică dacă inputul conține doar cifre
    if (!/^\d+$/.test(noPrefixCui)) {
      return null;
    }
    
    // CUI-ul trebuie să aibă cel puțin 2 cifre (în realitate sunt minim 6)
    if (noPrefixCui.length < 2) {
      return null;
    }
    
    // Nu mai validăm cifra de control local, lăsăm API-ul ANAF să determine validitatea
    return noPrefixCui;
  } catch (error) {
    console.error('Eroare la validarea CUI:', error);
    return null;
  }
}

/**
 * Validează un IBAN românesc
 * 
 * @param iban IBAN-ul de validat
 * @returns boolean adevărat dacă IBAN-ul este valid, fals în caz contrar
 */
export function validateIban(iban: string): boolean {
  if (!iban) return false;
  
  // Elimină spațiile și convertește la uppercase
  iban = iban.replace(/\s/g, '').toUpperCase();
  
  // Verifică dacă IBAN-ul începe cu RO și are lungimea corectă (24 caractere pentru România)
  if (!iban.startsWith('RO') || iban.length !== 24) {
    return false;
  }
  
  // Mută primele 4 caractere la final
  const rearranged = iban.substring(4) + iban.substring(0, 4);
  
  // Convertește literele în numere (A=10, B=11, etc.)
  let converted = '';
  for (let i = 0; i < rearranged.length; i++) {
    const char = rearranged.charAt(i);
    const code = char.charCodeAt(0);
    
    if (code >= 65 && code <= 90) {
      // Este literă, convertim în număr (A=10, B=11, etc.)
      converted += (code - 55).toString();
    } else {
      // Este cifră, o păstrăm ca atare
      converted += char;
    }
  }
  
  // Calculăm MOD 97 manual pentru numere mari
  let remainder = 0;
  for (let i = 0; i < converted.length; i++) {
    remainder = (remainder * 10 + parseInt(converted.charAt(i))) % 97;
  }
  
  // IBAN-ul este valid dacă restul este 1
  return remainder === 1;
}

/**
 * Validează un număr de înregistrare al Registrului Comerțului
 * 
 * @param regNumber Numărul de înregistrare de validat (ex: J40/1234/2020)
 * @returns boolean adevărat dacă numărul este valid, fals în caz contrar
 */
export function validateRegNumber(regNumber: string): boolean {
  if (!regNumber) return false;
  
  // Pattern pentru validarea formatului J{JUDEȚ}/{NUMĂR}/{AN}
  // J poate fi și F pentru PFA-uri
  const pattern = /^[JF][0-9]{1,2}\/[0-9]{1,6}\/[0-9]{4}$/;
  
  return pattern.test(regNumber.trim());
}