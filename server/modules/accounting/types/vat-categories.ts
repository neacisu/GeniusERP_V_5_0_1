/**
 * VAT Categories and Tax Codes
 * 
 * Categorii fiscale și coduri de TVA conform legislației române
 * pentru generarea corectă a jurnalului de vânzări (OMFP 2634/2015)
 */

/**
 * Categorii fiscale de TVA pentru jurnalul de vânzări
 */
export enum VATCategory {
  STANDARD_19 = 'STANDARD_19',           // Livrări taxabile cota standard 19%
  REDUCED_9 = 'REDUCED_9',               // Livrări taxabile cota redusă 9%
  REDUCED_5 = 'REDUCED_5',               // Livrări taxabile cota redusă 5%
  EXEMPT_WITH_CREDIT = 'EXEMPT_WITH_CREDIT', // Scutit cu drept de deducere
  EXEMPT_NO_CREDIT = 'EXEMPT_NO_CREDIT',     // Scutit fără drept de deducere
  REVERSE_CHARGE = 'REVERSE_CHARGE',     // Taxare inversă
  NOT_SUBJECT = 'NOT_SUBJECT',           // Neimpozabil
  ZERO_RATE = 'ZERO_RATE'                // Cota zero
}

/**
 * Interfață pentru detalii categorie fiscală
 */
export interface VATCategoryInfo {
  code: VATCategory;
  name: string;
  description: string;
  vatRate: number;
  accountCode?: string;
  isDeductible: boolean;
}

/**
 * Mapare categorii fiscale cu informații detaliate
 */
export const VAT_CATEGORY_INFO: Record<VATCategory, VATCategoryInfo> = {
  [VATCategory.STANDARD_19]: {
    code: VATCategory.STANDARD_19,
    name: 'Livrări taxabile 19%',
    description: 'Livrări de bunuri și prestări de servicii taxabile cu cota standard de 19%',
    vatRate: 19,
    accountCode: '4427',
    isDeductible: true
  },
  [VATCategory.REDUCED_9]: {
    code: VATCategory.REDUCED_9,
    name: 'Livrări taxabile 9%',
    description: 'Livrări de bunuri și prestări de servicii taxabile cu cota redusă de 9%',
    vatRate: 9,
    accountCode: '4427',
    isDeductible: true
  },
  [VATCategory.REDUCED_5]: {
    code: VATCategory.REDUCED_5,
    name: 'Livrări taxabile 5%',
    description: 'Livrări de bunuri și prestări de servicii taxabile cu cota redusă de 5%',
    vatRate: 5,
    accountCode: '4427',
    isDeductible: true
  },
  [VATCategory.EXEMPT_WITH_CREDIT]: {
    code: VATCategory.EXEMPT_WITH_CREDIT,
    name: 'Scutit cu drept de deducere',
    description: 'Operațiuni scutite cu drept de deducere (export, livrări intracomunitare)',
    vatRate: 0,
    accountCode: null,
    isDeductible: true
  },
  [VATCategory.EXEMPT_NO_CREDIT]: {
    code: VATCategory.EXEMPT_NO_CREDIT,
    name: 'Scutit fără drept de deducere',
    description: 'Operațiuni scutite fără drept de deducere (art. 292 Cod Fiscal)',
    vatRate: 0,
    accountCode: null,
    isDeductible: false
  },
  [VATCategory.REVERSE_CHARGE]: {
    code: VATCategory.REVERSE_CHARGE,
    name: 'Taxare inversă',
    description: 'Operațiuni cu taxare inversă (TVA datorată de beneficiar)',
    vatRate: 0,
    accountCode: null,
    isDeductible: false
  },
  [VATCategory.NOT_SUBJECT]: {
    code: VATCategory.NOT_SUBJECT,
    name: 'Neimpozabil',
    description: 'Operațiuni neimpozabile (în afara sferei de aplicare a TVA)',
    vatRate: 0,
    accountCode: null,
    isDeductible: false
  },
  [VATCategory.ZERO_RATE]: {
    code: VATCategory.ZERO_RATE,
    name: 'Cota zero',
    description: 'Operațiuni cu cota zero (cazuri speciale)',
    vatRate: 0,
    accountCode: null,
    isDeductible: true
  }
};

/**
 * Determină categoria fiscală automată pe baza datelor clientului și cotei de TVA
 * @param vatRate Cota de TVA
 * @param customerCountry Țara clientului
 * @param customerVATNumber Număr de TVA al clientului
 * @param isReverseCharge Flag pentru taxare inversă
 * @returns Categoria fiscală determinată automat
 */
export function determineVATCategory(
  vatRate: number,
  customerCountry: string = 'Romania',
  customerVATNumber?: string | null,
  isReverseCharge: boolean = false
): VATCategory {
  // Taxare inversă (specificată explicit)
  if (isReverseCharge) {
    return VATCategory.REVERSE_CHARGE;
  }
  
  // Client extern (nu din România)
  if (customerCountry && customerCountry !== 'Romania' && customerCountry !== 'RO') {
    // Verificăm dacă e UE sau non-UE
    const euCountries = [
      'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Czechia',
      'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
      'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
      'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'
    ];
    
    const isEU = euCountries.some(c => 
      c.toLowerCase() === customerCountry.toLowerCase()
    );
    
    // Livrare intracomunitară (UE cu cod de TVA valid) - scutită cu drept
    if (isEU && customerVATNumber) {
      return VATCategory.EXEMPT_WITH_CREDIT;
    }
    
    // Export (non-UE) - scutit cu drept
    if (!isEU) {
      return VATCategory.EXEMPT_WITH_CREDIT;
    }
  }
  
  // Client intern - determinăm categoria pe baza cotei de TVA
  if (vatRate === 19) {
    return VATCategory.STANDARD_19;
  } else if (vatRate === 9) {
    return VATCategory.REDUCED_9;
  } else if (vatRate === 5) {
    return VATCategory.REDUCED_5;
  } else if (vatRate === 0) {
    // TVA 0% intern - de obicei scutit fără drept (art. 292)
    // Ar trebui să fie specificat mai explicit în aplicație
    return VATCategory.EXEMPT_NO_CREDIT;
  }
  
  // Default: standard 19%
  return VATCategory.STANDARD_19;
}

/**
 * Obține informații despre o categorie fiscală
 * @param category Categoria fiscală
 * @returns Informații detaliate despre categorie
 */
export function getVATCategoryInfo(category: VATCategory): VATCategoryInfo {
  return VAT_CATEGORY_INFO[category];
}

/**
 * Verifică dacă o categorie fiscală permite deducerea TVA
 * @param category Categoria fiscală
 * @returns True dacă permite deducere, false altfel
 */
export function isVATDeductible(category: VATCategory): boolean {
  return VAT_CATEGORY_INFO[category].isDeductible;
}

/**
 * Obține cota de TVA pentru o categorie
 * @param category Categoria fiscală
 * @returns Cota de TVA (procent)
 */
export function getVATRate(category: VATCategory): number {
  return VAT_CATEGORY_INFO[category].vatRate;
}

/**
 * Obține toate categoriile fiscale disponibile
 * @returns Array cu toate categoriile fiscale
 */
export function getAllVATCategories(): VATCategoryInfo[] {
  return Object.values(VAT_CATEGORY_INFO);
}

/**
 * Grupează categoriile fiscale pentru jurnalul de vânzări
 */
export const SALES_JOURNAL_GROUPS = {
  TAXABLE: [
    VATCategory.STANDARD_19,
    VATCategory.REDUCED_9,
    VATCategory.REDUCED_5
  ],
  EXEMPT: [
    VATCategory.EXEMPT_WITH_CREDIT,
    VATCategory.EXEMPT_NO_CREDIT,
    VATCategory.ZERO_RATE
  ],
  SPECIAL: [
    VATCategory.REVERSE_CHARGE,
    VATCategory.NOT_SUBJECT
  ]
};

export default {
  VATCategory,
  VAT_CATEGORY_INFO,
  determineVATCategory,
  getVATCategoryInfo,
  isVATDeductible,
  getVATRate,
  getAllVATCategories,
  SALES_JOURNAL_GROUPS
};

