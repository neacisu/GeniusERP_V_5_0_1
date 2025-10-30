/**
 * Barcode Generator Utility
 * 
 * Acest utilitar generează coduri de bare EAN13 valide pentru produse.
 * EAN13 constă din 13 cifre:
 *  - Primele 2-3 cifre reprezintă codul țării (pentru România: 594)
 *  - Următoarele 4-5 cifre reprezintă codul producătorului
 *  - Următoarele 4-5 cifre reprezintă codul produsului
 *  - Ultima cifră este cifra de control (checksum)
 */

/**
 * Generează o cifră de control validă pentru un cod EAN13
 * @param digits - Primele 12 cifre ale codului EAN13
 * @returns Cifra de control (checksum)
 */
export function calculateEAN13Checksum(digits: string): number {
  if (digits.length !== 12 || !/^\d+$/.test(digits)) {
    throw new Error('EAN13 trebuie să conțină 12 cifre pentru calculul checksum-ului');
  }

  // Algoritm de calcul EAN13 checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const checksum = (10 - (sum % 10)) % 10;
  return checksum;
}

/**
 * Generează un cod de bare EAN13 valid pentru un produs
 * @param companyId - ID-ul companiei (folosit pentru partea de cod producător)
 * @param productId - ID-ul produsului (folosit pentru partea de cod produs)
 * @param salt - Valoare opțională pentru a genera coduri unice când există conflicte
 * @returns Un cod de bare EAN13 valid
 */
export function generateEAN13(companyId: string, productId: string, salt: number = 0): string {
  // Prefix pentru România
  const countryPrefix = '594';
  
  // Convertește companyId într-un cod numeric de 4 cifre
  const companyHash = Math.abs(hashString(companyId)) % 10000;
  const companyCode = companyHash.toString().padStart(4, '0');
  
  // Convertește productId și salt într-un cod numeric de 5 cifre
  // Adăugarea salt-ului asigură unicitate în caz de coliziuni
  const productHash = (Math.abs(hashString(productId)) + salt) % 100000;
  const productCode = productHash.toString().padStart(5, '0');
  
  // Primele 12 cifre
  const digits = countryPrefix + companyCode + productCode;
  
  // Calculează cifra de control
  const checksum = calculateEAN13Checksum(digits);
  
  // Returnează codul EAN13 complet
  return digits + checksum.toString();
}

/**
 * Generează un cod de bare EAN13 unic, verificând că nu există deja în baza de date
 * @param companyId - ID-ul companiei
 * @param productId - ID-ul produsului
 * @param checkExistingBarcode - Funcție care verifică dacă un cod de bare există deja
 * @returns Un cod de bare EAN13 valid și unic
 */
export async function generateUniqueEAN13(
  companyId: string, 
  productId: string,
  checkExistingBarcode: (barcode: string) => Promise<boolean>
): Promise<string> {
  let salt = 0;
  let barcode = generateEAN13(companyId, productId, salt);
  
  // Verifică dacă există deja un produs cu acest cod de bare
  while (await checkExistingBarcode(barcode)) {
    // Dacă există, incrementează salt-ul și generează un nou cod
    salt++;
    barcode = generateEAN13(companyId, productId, salt);
    
    // Limitează numărul de încercări pentru a evita bucle infinite
    if (salt > 1000) {
      throw new Error('Nu s-a putut genera un cod de bare unic după 1000 de încercări');
    }
  }
  
  return barcode;
}

/**
 * Funcție simplă de hash pentru string-uri
 * @param str - String-ul pentru care se calculează hash-ul
 * @returns Valoarea hash
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertește în 32bit int
  }
  return hash;
}

/**
 * Verifică dacă un cod de bare EAN13 este valid
 * @param barcode - Codul de bare EAN13 de verificat
 * @returns true dacă codul este valid, false în caz contrar
 */
export function validateEAN13(barcode: string): boolean {
  if (barcode.length !== 13 || !/^\d+$/.test(barcode)) {
    return false;
  }
  
  const digits = barcode.slice(0, 12);
  const providedChecksum = parseInt(barcode[12], 10);
  const calculatedChecksum = calculateEAN13Checksum(digits);
  
  return providedChecksum === calculatedChecksum;
}