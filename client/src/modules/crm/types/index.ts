/**
 * Tipurile de date pentru modulul CRM
 */

// Tipul de companie din CRM
export interface Company {
  id: string;
  name: string;
  fiscalCode?: string;  // CUI/CIF în format fără prefix (pentru compatibilitate anterioară)
  cui?: string;       // CUI în format corect (cu/fără prefix RO conform stării TVA)
  regNumber?: string;  // Număr înregistrare Registrul Comerțului
  type?: CompanyType;   // Tipul de relație
  industry?: string;   // Industria/domeniul de activitate
  segment?: string;    // Segmentul de piață
  
  // Câmpuri adresă detaliată
  street?: string;       // Denumire stradă (ss_denumire_strada)
  streetNumber?: string; // Număr stradă (ss_numar_strada)
  addressDetails?: string; // Detalii adresă (bloc, scară, etc) (ss_detalii_adresa)
  
  address?: string;    // Adresa completă
  city?: string;       // Localitatea
  county?: string;     // Județul
  country?: string;    // Țara
  postalCode?: string; // Cod poștal
  phone?: string;      // Telefon
  email?: string;      // Email
  website?: string;    // Website
  vatPayer?: boolean;  // Plătitor de TVA
  vatIncasare?: boolean; // Aplică sistemul TVA la încasare
  // Aceste câmpuri sunt definite mai jos pentru compatibilitate cu baza de date
  isActive?: boolean;  // Este activ
  contactPerson?: string; // Persoana de contact
  notes?: string;      // Note/observații
  bankAccount?: string; // Cont bancar (IBAN)
  bank?: string;        // Banca
  socialCapital?: string | number; // Capital social
  createdAt?: string | Date;    // Data creării
  updatedAt?: string | Date;    // Data ultimei actualizări
  leadScore?: number;  // Scor lead (0-100)
  
  // Câmpuri pentru relația cu alte entități
  companyId?: string;  // ID-ul companiei părinte
  createdBy?: string;  // ID-ul utilizatorului care a creat compania
  updatedBy?: string;  // ID-ul utilizatorului care a actualizat compania
  parentCompanyId?: string; // ID-ul companiei părinte în ierarhie
  
  // Câmpuri din tabelul crm_companies din baza de date
  status?: string;     // Starea companiei (active, inactive, etc.)
  customFields?: Record<string, any>; // Câmpuri personalizate stocate ca JSON
  logoUrl?: string;    // URL-ul logo-ului companiei
  vatNumber?: string;  // Numărul de TVA (sinonim pentru CUI)
  registrationNumber?: string; // Număr înregistrare (sinonim pentru regNumber)
  description?: string; // Descrierea companiei
  size?: string;       // Dimensiunea companiei (mic, mediu, mare, etc.)
  isCustomer?: boolean; // Indica daca compania este client
  isSupplier?: boolean; // Indica daca compania este furnizor
  analythic_401?: string; // Cont analitic furnizori (401.x)
  analythic_4111?: string; // Cont analitic clienți (4111.x)
  annualRevenue?: number; // Venitul anual
}

// Tipul relației cu o companie
export type CompanyType = 'lead' | 'prospect' | 'customer' | 'partner';

// Tipuri de formulare pentru companii
export interface CompanyFormValues {
  id?: string;          // ID-ul companiei (pentru editare)
  name: string;
  fiscalCode: string;   // CUI/CIF fără prefix (pentru compatibilitate anterioară)
  cui?: string;        // CUI în format corect (cu/fără prefix RO conform stării TVA)
  regNumber?: string;
  type: CompanyType;
  industry?: string;
  segment?: string;
  // Câmpuri adresă detaliată
  street?: string;       // Denumire stradă (ss_denumire_strada)
  streetNumber?: string; // Număr stradă (ss_numar_strada)
  addressDetails?: string; // Detalii adresă (bloc, scară, etc) (ss_detalii_adresa)
  address?: string;     // Adresa completă
  city?: string;        // Localitatea
  county?: string;      // Județul
  country?: string;     // Țara
  postalCode?: string;  // Cod poștal
  phone?: string;
  email?: string;
  website?: string;
  vatPayer?: boolean;
  vatIncasare?: boolean;
  isSupplier?: boolean;
  isCustomer?: boolean;
  isActive?: boolean;
  contactPerson?: string;
  notes?: string;
  bankAccount?: string; // Cont bancar (IBAN)
  bank?: string;        // Banca
  socialCapital?: string | number; // Capital social
  leadScore?: number;
  // Adăugăm câmpurile analitice pentru integrarea cu contabilitatea
  analythic_401?: string; // Cont analitic furnizori (401.x)
  analythic_4111?: string; // Cont analitic clienți (4111.x)
}

// Pentru integrarea cu ANAF
export enum AnafImportStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}