/**
 * Company Service
 * 
 * Serviciu pentru gestionarea companiilor din CRM.
 * Furnizează metode pentru operațiuni CRUD pe companii.
 */

import { Company, CompanyFormValues } from '../types';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// URL-ul de bază pentru API
const BASE_URL = '/api/crm/companies';

// Funcție pentru obținerea token-ului de autentificare
function getAuthToken(): string | null {
  // Prioritate 1: Verificăm header-ul auth din sessionStorage
  let token = sessionStorage.getItem('accessToken');
  if (token) {
    console.log('Token găsit în sessionStorage (accessToken)');
    return token;
  }
  
  // Prioritate 2: Verificăm obiectul user din localStorage
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user && user.token) {
        console.log('Token găsit în localStorage (user)');
        return user.token;
      }
    }
  } catch (error) {
    console.error('Eroare la obținerea token-ului din localStorage:', error);
  }
  
  // Prioritate 3: Verificăm și locațiile alternative pentru token (backward compatibility)
  token = localStorage.getItem('auth_token') || 
          localStorage.getItem('authToken') || 
          sessionStorage.getItem('auth_token');
  
  if (token) {
    console.log('Token găsit în locație alternativă');
    return token;
  }
  
  console.error('Nu s-a găsit niciun token de autentificare!');
  return null;
}

/**
 * Creează o nouă companie în CRM
 * @param company Datele companiei de creat
 * @returns Promisiune cu compania creată
 */
export async function createCompany(company: CompanyFormValues): Promise<Company> {
  console.log(`[CompanyService] Începe crearea companiei: ${company.name}`);
  
  try {
    console.log(`[CompanyService] Trimitere date companie către API:`, company);
    
    // Folosim apiRequest în loc de fetch pentru a gestiona automat autentificarea
    // apiRequest returnează datele deja procesate (nu un obiect Response)
    const createdCompany = await apiRequest<Company>({
      method: 'POST',
      url: BASE_URL,
      data: company
    });

    console.log(`[CompanyService] Companie creată cu succes:`, createdCompany);
    return createdCompany;
  } catch (error) {
    console.error(`[CompanyService] Excepție la crearea companiei:`, error);
    toast({
      title: "Eroare la crearea companiei",
      description: error instanceof Error ? error.message : 'A apărut o eroare necunoscută',
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Actualizează o companie existentă
 * @param id ID-ul companiei
 * @param company Datele actualizate ale companiei
 * @returns Promisiune cu compania actualizată
 */
export async function updateCompany(id: string, company: Partial<CompanyFormValues>): Promise<Company> {
  console.log(`[CompanyService] Începe actualizarea companiei cu ID-ul: ${id}`);
  
  try {
    console.log(`[CompanyService] Trimitere date actualizate companie către API:`, company);
    
    // Folosim apiRequest în loc de fetch pentru a gestiona automat autentificarea
    // apiRequest returnează datele deja procesate (nu un obiect Response)
    const updatedCompany = await apiRequest<Company>({
      method: 'PUT',
      url: `${BASE_URL}/${id}`,
      data: company
    });

    console.log(`[CompanyService] Companie actualizată cu succes:`, updatedCompany);
    return updatedCompany;
  } catch (error) {
    console.error(`[CompanyService] Excepție la actualizarea companiei:`, error);
    toast({
      title: "Eroare la actualizarea companiei",
      description: error instanceof Error ? error.message : 'A apărut o eroare necunoscută',
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Salvează o companie (creează sau actualizează, în funcție de existența ID-ului)
 * @param company Datele companiei
 * @returns Promisiune cu compania salvată
 */
export async function saveCompany(company: CompanyFormValues): Promise<Company> {
  if (company.id) {
    return updateCompany(company.id, company);
  } else {
    return createCompany(company);
  }
}

/**
 * Șterge o companie
 * @param id ID-ul companiei
 * @returns Promisiune cu rezultatul ștergerii
 */
export async function deleteCompany(id: string): Promise<void> {
  console.log(`[CompanyService] Începe ștergerea companiei cu ID-ul: ${id}`);
  
  try {
    // Folosim apiRequest în loc de fetch pentru a gestiona automat autentificarea
    // apiRequest returnează datele deja procesate (nu un obiect Response)
    await apiRequest({
      method: 'DELETE',
      url: `${BASE_URL}/${id}`
    });

    console.log(`[CompanyService] Companie ștearsă cu succes cu ID-ul: ${id}`);
  } catch (error) {
    console.error(`[CompanyService] Excepție la ștergerea companiei:`, error);
    toast({
      title: "Eroare la ștergerea companiei",
      description: error instanceof Error ? error.message : 'A apărut o eroare necunoscută',
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Obține o companie după ID
 * @param id ID-ul companiei
 * @returns Promisiune cu compania
 */
export async function getCompanyById(id: string): Promise<Company> {
  console.log(`[CompanyService] Începe obținerea companiei cu ID-ul: ${id}`);
  
  try {
    // Folosim apiRequest în loc de fetch pentru a gestiona automat autentificarea
    // apiRequest returnează datele deja procesate (nu un obiect Response)
    const company = await apiRequest<Company>({
      method: 'GET',
      url: `${BASE_URL}/${id}`
    });

    console.log(`[CompanyService] Companie obținută cu succes:`, company);
    return company;
  } catch (error) {
    console.error(`[CompanyService] Excepție la obținerea companiei:`, error);
    toast({
      title: "Eroare la obținerea companiei",
      description: error instanceof Error ? error.message : 'A apărut o eroare necunoscută',
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Exportă toate funcțiile serviciului
 */
export const CompanyService = {
  createCompany,
  updateCompany,
  saveCompany,
  deleteCompany,
  getCompanyById
};

export default CompanyService;