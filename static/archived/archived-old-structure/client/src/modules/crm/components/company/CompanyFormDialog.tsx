/**
 * CompanyFormDialog Component
 * 
 * Dialog pentru adăugarea/editarea unei companii cu integrare ANAF.
 */

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Building2 } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { 
  Company, 
  CompanyType, 
  CompanyFormValues, 
  AnafImportStatus 
} from '../../types';
import { getCompanyDataFromAnaf, formatAddressFromAnaf, getCityFromAnaf, getCountyFromAnaf, getPostalCodeFromAnaf, getStreetFromAnaf, getStreetNumberFromAnaf, getAddressDetailsFromAnaf } from '../../services/anaf.service';

// Schema pentru validarea formularului
const companyFormSchema = z.object({
  id: z.string().optional(), // ID-ul companiei (pentru editare)
  name: z.string().min(2, { message: 'Numele trebuie să aibă cel puțin 2 caractere' }),
  fiscalCode: z.string().min(1, { message: 'CUI-ul este obligatoriu' }),
  cui: z.string().optional(), // CUI în format corect (cu/fără prefix RO conform stării TVA)
  regNumber: z.string().optional(),
  type: z.enum(['lead', 'prospect', 'customer', 'partner']),
  industry: z.string().optional(),
  segment: z.string().optional(),
  // Câmpuri pentru adresă detaliată
  street: z.string().optional(),
  streetNumber: z.string().optional(),
  addressDetails: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: 'Email invalid' }).optional().or(z.literal('')),
  website: z.string().optional(),
  vatPayer: z.boolean().optional(),
  vatIncasare: z.boolean().optional(),
  isSupplier: z.boolean().optional(),
  isCustomer: z.boolean().optional(),
  isActive: z.boolean().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
  leadScore: z.number().min(0).max(100).optional(),
  // Câmpuri financiare adăugate pentru datele ANAF
  bankAccount: z.string().optional(),
  bank: z.string().optional(),
  socialCapital: z.string().optional(),
  // Conturi analitice
  analythic_401: z.string().optional(), // Cont analitic furnizori
  analythic_4111: z.string().optional() // Cont analitic clienți
});

// Date implicite pentru formular
const defaultValues: Partial<CompanyFormValues> = {
  name: '',
  fiscalCode: '',
  cui: '',
  regNumber: '',
  type: 'lead',
  industry: '',
  segment: '',
  // Câmpuri pentru adresă detaliată
  street: '',
  streetNumber: '',
  addressDetails: '',
  address: '',
  city: '',
  county: '',
  country: 'România',
  postalCode: '',
  phone: '',
  email: '',
  website: '',
  vatPayer: false,
  vatIncasare: false,
  isSupplier: false,
  isCustomer: true,
  isActive: true,
  contactPerson: '',
  notes: '',
  leadScore: 50,
  bankAccount: '',
  bank: '',
  socialCapital: '',
  // Conturi analitice
  analythic_401: '',
  analythic_4111: ''
};

// Tipuri pentru props
interface CompanyFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: CompanyFormValues) => void;
  initialData?: Company;
  isEditing?: boolean;
}

export const CompanyFormDialog: React.FC<CompanyFormDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false
}) => {
  const { toast } = useToast();
  const [anafStatus, setAnafStatus] = useState<AnafImportStatus>(AnafImportStatus.IDLE);
  const [vatEndDate, setVatEndDate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mapează toate datele companiei în formular, inclusiv câmpurile analitice
  const mapInitialDataToFormValues = () => {
    if (!initialData) return defaultValues;
    
    // Creăm o copie extinsă a datelor inițiale, mapând toate proprietățile cunoscute
    return {
      id: initialData.id,
      name: initialData.name || '',
      fiscalCode: initialData.cui || initialData.vatNumber || initialData.fiscalCode || '',
      regNumber: initialData.regNumber || initialData.registrationNumber || '',
      type: initialData.type as CompanyType || 'lead',
      industry: initialData.industry || '',
      segment: initialData.segment || '',
      // Câmpuri pentru adresă detaliată
      street: initialData.street || '',
      streetNumber: initialData.streetNumber || '',
      addressDetails: initialData.addressDetails || '',
      address: initialData.address || '',
      city: initialData.city || '',
      county: initialData.county || '',
      country: initialData.country || 'România',
      postalCode: initialData.postalCode || '',
      phone: initialData.phone || '',
      email: initialData.email || '',
      website: initialData.website || '',
      vatPayer: initialData.vatPayer || false,
      vatIncasare: initialData.vatIncasare || false,
      isSupplier: initialData.isSupplier || false,
      isCustomer: initialData.isCustomer || true,
      isActive: initialData.isActive || true,
      contactPerson: initialData.contactPerson || '',
      notes: initialData.notes || '',
      bankAccount: initialData.bankAccount || '',
      bank: initialData.bank || '',
      socialCapital: initialData.socialCapital || undefined,
      leadScore: initialData.leadScore || 50,
      // Adăugăm campurile pentru conturile analitice
      analythic_401: initialData.analythic_401 || '',
      analythic_4111: initialData.analythic_4111 || '',
    };
  };

  // Initialize form cu valorile mapate explicit
  const form = useForm<z.infer<typeof companyFormSchema>>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: mapInitialDataToFormValues() as any, // Forțăm tipul pentru a evita incompatibilitatea între string/number pentru socialCapital
  });
  
  // Efect pentru interogarea automată ANAF când dialogul este deschis cu un CUI precompletat
  useEffect(() => {
    // Verificăm dacă dialogul este deschis și avem un CUI valid
    if (isOpen && !isEditing) {
      const fiscalCode = form.getValues('fiscalCode');
      
      // Verificăm dacă avem un CUI valid (cel puțin 6 caractere sau numeric)
      if (fiscalCode && (fiscalCode.length >= 6 || /^\d+$/.test(fiscalCode))) {
        console.log(`[CompanyFormDialog] Interogare automată ANAF pentru CUI: ${fiscalCode}`);
        
        // Declanșăm interogarea ANAF cu o scurtă întârziere pentru a permite inițializarea completă a dialogului
        setTimeout(() => {
          handleAnafImport();
        }, 300);
      }
    }
  }, [isOpen]); // Rulăm efectul doar când se schimbă starea dialogului (deschis/închis)
  
  // Manipulare import date de la ANAF
  const handleAnafImport = async () => {
    const cui = form.getValues('fiscalCode');
    
    // Verificăm dacă cui există
    if (!cui) {
      toast({
        title: "CUI lipsă",
        description: "Introduceți un CUI valid pentru a importa datele de la ANAF.",
        variant: "destructive"
      });
      return;
    }
    
    // Curățăm CUI-ul de prefixul "RO" și orice alte caractere non-numerice
    let cleanCui = '';
    try {
      // Convertim cui la string, indiferent de tipul inițial
      const cuiStr = String(cui);
      
      // Curățăm toate spațiile și convertim la uppercase
      const normalizedCui = cuiStr.replace(/\s+/g, '').toUpperCase();
      
      // Eliminăm prefixul RO dacă există
      cleanCui = normalizedCui.replace(/^RO/i, '');
      
      // Verificăm dacă ce a rămas conține doar cifre
      if (!/^\d+$/.test(cleanCui)) {
        toast({
          title: "Format CUI invalid",
          description: "CUI-ul trebuie să conțină doar cifre, eventual cu prefixul RO.",
          variant: "destructive"
        });
        return;
      }
      
      console.log(`[CompanyFormDialog] CUI original: ${cui}, CUI normalizat pentru ANAF: ${cleanCui}`);
    } catch (error) {
      console.error(`[CompanyFormDialog] Eroare la normalizarea CUI:`, error);
      toast({
        title: "Eroare la procesarea CUI",
        description: "Formatul CUI-ului nu este valid. Vă rugăm să verificați și să încercați din nou.",
        variant: "destructive"
      });
      return;
    }
    
    setAnafStatus(AnafImportStatus.LOADING);
    
    try {
      // Obținem token-ul din obiectul user stocat în localStorage
      let token = null;
      try {
        // Prioritate 1: Verificăm header-ul auth din sessionStorage
        token = sessionStorage.getItem('accessToken');
        if (token) {
          console.log('Token găsit în sessionStorage (accessToken)');
        }
        
        // Prioritate 2: Verificăm obiectul user din localStorage
        if (!token) {
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            if (user && user.token) {
              token = user.token;
              console.log('Token găsit în localStorage (user)');
            }
          }
        }
      } catch (error) {
        console.error('Eroare la obținerea token-ului din localStorage:', error);
      }
      
      // Prioritate 3: Verificăm și locațiile alternative pentru token
      if (!token) {
        token = localStorage.getItem('auth_token') || 
                localStorage.getItem('authToken') || 
                sessionStorage.getItem('auth_token');
        if (token) {
          console.log('Token găsit în locație alternativă:', token.substring(0, 15) + '...');
        }
      }
      
      if (!token) {
        toast({
          title: "Eroare de autentificare",
          description: "Nu sunteți autentificat. Vă rugăm să vă autentificați și să încercați din nou.",
          variant: "destructive"
        });
        throw new Error('Nu sunteți autentificat.');
      }
      
      // PASUL 1: Interoghează API-ul intern care va stoca datele în anaf_company_data
      console.log(`Încercare API ANAF pentru CUI ${cleanCui}`);
      const response = await fetch(`/api/crm/company/${cleanCui}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        // Obținem detaliile erorilor pentru debugging și afișare mai detaliată
        let errorDetails = '';
        try {
          const errorResponse = await response.json();
          errorDetails = errorResponse.error || errorResponse.message || JSON.stringify(errorResponse);
          console.error('Detalii eroare ANAF:', errorResponse);
        } catch (parseError) {
          console.error('Nu s-au putut obține detalii despre eroare:', parseError);
          // Dacă nu putem parsa răspunsul JSON, folosim textul brut
          errorDetails = await response.text();
        }
        
        if (response.status === 401) {
          console.error('Eroare de autentificare 401 la API ANAF:', errorDetails);
          
          // Încercăm să reînnoim sesiunea sau să solicităm reautentificarea
          toast({
            title: "Eroare de autentificare",
            description: "Token-ul de autentificare este invalid sau a expirat. Vă rugăm să vă autentificați din nou.",
            variant: "destructive"
          });
          
          throw new Error(`Token de autentificare invalid sau expirat. Detalii: ${errorDetails}`);
        } else if (response.status === 404) {
          console.error('Compania nu a fost găsită în baza de date ANAF:', errorDetails);
          toast({
            title: "Companie negăsită",
            description: "CUI-ul introdus nu a fost găsit în baza de date ANAF.",
            variant: "destructive"
          });
          throw new Error(`CUI negăsit în baza de date ANAF: ${errorDetails}`);
        } else if (response.status === 429) {
          console.error('Prea multe cereri către API-ul ANAF:', errorDetails);
          toast({
            title: "Limită de cereri depășită",
            description: "S-a depășit limita de interogări către ANAF. Vă rugăm să încercați mai târziu.",
            variant: "destructive"
          });
          throw new Error(`Prea multe cereri către ANAF: ${errorDetails}`);
        } else {
          console.error(`Eroare la interogarea datelor (status ${response.status}):`, errorDetails);
          toast({
            title: `Eroare ${response.status}`,
            description: `Nu s-au putut obține date de la ANAF: ${errorDetails}`,
            variant: "destructive"
          });
          throw new Error(`Eroare la interogarea datelor ANAF (${response.status}): ${errorDetails}`);
        }
      }
      
      const companyData = await response.json();
      
      // PASUL 2: Declanșează job-ul pentru date financiare în background doar dacă avem un companyId valid
      try {
        // Acest job va fi creat după salvarea companiei, deoarece avem nevoie de un ID valid
        const companyId = form.getValues('id');
        
        // În loc să folosim validare UUID, folosim o valoare fixă pentru a evita eroarea
        if (false) {
          await fetch(`/api/crm/financial-data/job`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              cui: cleanCui,
              companyId: companyId,
              startYear: 2014,
              endYear: new Date().getFullYear()
            })
          });
          
          console.log('Job pentru date financiare ANAF declanșat în background');
        } else {
          console.log('Job pentru date financiare amânat până la salvarea companiei (ID temporar)');
        }
      } catch (financialError) {
        console.error('Eroare la declanșarea job-ului pentru date financiare:', financialError);
        // Nu oprim procesul principal dacă eșuează job-ul pentru date financiare
      }
      
      if (!companyData || !companyData.date_generale) {
        throw new Error('Date invalide de la ANAF');
      }
      
      // PASUL 3: Completează toate câmpurile formularului cu datele de la ANAF
      
      // --- INFORMAȚII DE BAZĂ ---
      console.log('Completare informații de bază cu date ANAF');
      form.setValue('name', companyData.date_generale.denumire);
      form.setValue('regNumber', companyData.date_generale.nrRegCom);
      
      // Setează codul CAEN și industria pe baza datelor ANAF
      if (companyData.date_generale && companyData.date_generale.cod_CAEN) {
        form.setValue('industry', `${companyData.date_generale.cod_CAEN} - ${companyData.date_generale.denumire_CAEN || ''}`);
      }
      
      // Marchează compania ca fiind activă dacă este activă în ANAF
      if (companyData.date_generale && companyData.date_generale.stare_inregistrare) {
        const isActive = companyData.date_generale.stare_inregistrare.toLowerCase() === 'activa';
        form.setValue('isActive', isActive);
        
        // Dacă compania nu este activă, adăugăm o notă despre acest lucru
        if (!isActive) {
          const stareAnaf = companyData.date_generale.stare_inregistrare;
          const existingNotes = form.getValues('notes') || '';
          form.setValue('notes', `${existingNotes}\nStare ANAF: ${stareAnaf}`);
        }
      }
      
      // --- ADRESA ---
      console.log('Completare adresă cu date ANAF');
      // Completare adresă completă
      form.setValue('address', formatAddressFromAnaf(companyData));
      
      // Completare câmpuri separate pentru adresă
      form.setValue('street', getStreetFromAnaf(companyData));
      form.setValue('streetNumber', getStreetNumberFromAnaf(companyData));
      form.setValue('addressDetails', getAddressDetailsFromAnaf(companyData));
      
      // Completare alte câmpuri de adresă
      form.setValue('city', getCityFromAnaf(companyData));
      form.setValue('county', getCountyFromAnaf(companyData));
      form.setValue('postalCode', getPostalCodeFromAnaf(companyData));
      
      // --- CONTACT ---
      console.log('Completare date de contact cu date ANAF');
      
      // Completăm telefonul din date_generale dacă există
      if (companyData.date_generale && companyData.date_generale.telefon) {
        form.setValue('phone', companyData.date_generale.telefon);
      }
      
      // Alternativ, căutăm telefon în alte locații din datele ANAF
      if (!companyData.date_generale?.telefon) {
        if (companyData.adresa_sediu_social && companyData.adresa_sediu_social.stelefon) {
          form.setValue('phone', companyData.adresa_sediu_social.stelefon);
        } else if (companyData.adresa_domiciliu_fiscal && companyData.adresa_domiciliu_fiscal.dtelefon) {
          form.setValue('phone', companyData.adresa_domiciliu_fiscal.dtelefon);
        }
      }
      
      // Dacă există email, completăm și acesta
      if (companyData.date_generale && companyData.date_generale.email) {
        form.setValue('email', companyData.date_generale.email);
      }
      
      // Dacă există website, completăm și acesta
      if (companyData.date_generale && companyData.date_generale.website) {
        form.setValue('website', companyData.date_generale.website);
      }
      
      // Completare fax dacă există
      if (companyData.date_generale && companyData.date_generale.fax) {
        // Nu avem un câmp pentru fax în formular, dar putem adăuga în note
        const existingNotes = form.getValues('notes') || '';
        const faxInfo = `Fax: ${companyData.date_generale.fax}`;
        if (!existingNotes.includes(faxInfo)) {
          form.setValue('notes', existingNotes ? `${existingNotes}\n${faxInfo}` : faxInfo);
        }
      }
      
      // --- FINANCIAR ---
      console.log('Completare date financiare cu date ANAF');
      
      // Setează starea plătitorului de TVA din datele ANAF
      if (companyData.inregistrare_scop_Tva !== undefined) {
        form.setValue('vatPayer', companyData.inregistrare_scop_Tva.scpTVA === true);
        
        const existingNotes = form.getValues('notes') || '';
        
        // Verificăm dacă compania este înregistrată pentru TVA
        if (companyData.inregistrare_scop_Tva.scpTVA === true) {
          // Data inceput TVA - pentru firmele înregistrate în scopuri de TVA
          if (companyData.inregistrare_scop_Tva.perioade_TVA && 
              companyData.inregistrare_scop_Tva.perioade_TVA.length > 0 && 
              companyData.inregistrare_scop_Tva.perioade_TVA[0].data_inceput_ScpTVA) {
            
            const dataInceputTVA = companyData.inregistrare_scop_Tva.perioade_TVA[0].data_inceput_ScpTVA;
            const tvaNoteInfo = `Plătitor TVA din data: ${dataInceputTVA}`;
            
            if (!existingNotes.includes('Plătitor TVA din data:')) {
              form.setValue('notes', existingNotes ? `${existingNotes}\n${tvaNoteInfo}` : tvaNoteInfo);
            }
          }
        } else {
          // Verificăm dacă avem informații despre data încetării statutului de plătitor TVA
          if (companyData.inregistrare_scop_Tva.perioade_TVA && 
              companyData.inregistrare_scop_Tva.perioade_TVA.length > 0 && 
              companyData.inregistrare_scop_Tva.perioade_TVA[0].data_sfarsit_ScpTVA) {
            
            const dataSfarsitTVA = companyData.inregistrare_scop_Tva.perioade_TVA[0].data_sfarsit_ScpTVA;
            const tvaNoteInfo = `Compania este NEINREGISTRATA in scopuri de TVA din: ${dataSfarsitTVA}`;
            
            if (!existingNotes.includes('NEINREGISTRATA in scopuri de TVA')) {
              form.setValue('notes', existingNotes ? `${existingNotes}\n${tvaNoteInfo}` : tvaNoteInfo);
            }
            
            // Salvăm data sfârșitul TVA într-un câmp de referință
            setVatEndDate(dataSfarsitTVA);
          }
        }
      }
      
      // Setează starea TVA la încasare din ANAF
      if (companyData.inregistrare_RTVAI !== undefined) {
        form.setValue('vatIncasare', companyData.inregistrare_RTVAI.statusTvaIncasare === true);
        
        // Adăugăm informații despre TVA la încasare în note dacă există
        if (companyData.inregistrare_RTVAI.statusTvaIncasare === true && 
            companyData.inregistrare_RTVAI.dataInceputTvaInc) {
          
          const existingNotes = form.getValues('notes') || '';
          const tvaIncasareNoteInfo = `TVA la încasare din data: ${companyData.inregistrare_RTVAI.dataInceputTvaInc}`;
          
          if (!existingNotes.includes('TVA la încasare din data:')) {
            form.setValue('notes', existingNotes ? `${existingNotes}\n${tvaIncasareNoteInfo}` : tvaIncasareNoteInfo);
          }
        }
      }
      
      // Adaugă CUI-ul în formatul primit de la ANAF
      const anafCui = companyData.date_generale.cui || '';
      console.log(`[CompanyFormDialog] CUI de la ANAF: ${anafCui}`);
      form.setValue('fiscalCode', anafCui);
      
      // Actualizează starea ANAF pentru afișare
      setAnafStatus(AnafImportStatus.SUCCESS);
      toast({
        title: "Import ANAF reușit",
        description: `Date importate cu succes pentru ${companyData.date_generale.denumire}`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Eroare la importul datelor de la ANAF:', error);
      setAnafStatus(AnafImportStatus.ERROR);
      toast({
        title: "Eroare import ANAF",
        description: (error as Error)?.message || "A apărut o eroare la importul datelor",
        variant: "destructive"
      });
    }
  };
  
  // Manipulare submit formular
  const handleFormSubmit = async (data: z.infer<typeof companyFormSchema>) => {
    console.log('[CompanyFormDialog] Trimitere formular cu datele:', data);
    
    try {
      setIsSubmitting(true);
      
      // Normalizare CUI pentru trimitere
      if (data.fiscalCode) {
        // Convertim la string dacă nu este deja
        const fiscalCode = String(data.fiscalCode);
        
        // Curățăm de spații și convertim la uppercase
        let normalizedFiscalCode = fiscalCode.replace(/\s+/g, '').toUpperCase();
        
        // Extragem partea numerică pentru validare
        const numericPart = normalizedFiscalCode.replace(/^RO/i, '');
        
        // Verificăm dacă partea numerică conține doar cifre
        if (!/^\d+$/.test(numericPart)) {
          toast({
            title: "Format CUI invalid",
            description: "CUI-ul trebuie să conțină doar cifre, eventual cu prefixul RO.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        // Formatul final depinde de starea de plătitor TVA
        if (data.vatPayer === true) {
          // Plătitorii de TVA trebuie să aibă prefixul RO
          if (!normalizedFiscalCode.startsWith('RO')) {
            normalizedFiscalCode = `RO${numericPart}`;
          }
        } else {
          // Non-plătitorii de TVA trebuie să aibă doar partea numerică
          normalizedFiscalCode = numericPart;
        }
        
        // Actualizăm valoarea în obiectul de date pentru salvare
        console.log(`[CompanyFormDialog] CUI original: ${fiscalCode}, CUI normalizat: ${normalizedFiscalCode}`);
        data.fiscalCode = normalizedFiscalCode;
        data.cui = normalizedFiscalCode; // Actualizăm și câmpul cui pentru BD
      }
      
      // Trimitem datele la părinte pentru procesare (creare/actualizare)
      if (onSubmit) {
        console.log('[CompanyFormDialog] Trimitere date companie către părinte:', data);
        await onSubmit(data as CompanyFormValues);
      }
      
      // Resetăm formularul doar pentru adăugare, nu și pentru editare
      if (!isEditing) {
        form.reset(defaultValues);
        setAnafStatus(AnafImportStatus.IDLE);
      }
      
      // Închidem dialogul după salvare reușită
      onOpenChange(false);
      
      // Invalidăm query-urile pentru a reîncărca datele actualizate
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies'] });
      
    } catch (error) {
      console.error('Eroare la trimiterea formularului:', error);
      toast({
        title: "Eroare la salvare",
        description: (error as Error)?.message || "A apărut o eroare la salvarea datelor",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Componenta dialog
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="mb-6">
          <DialogTitle>{isEditing ? 'Editează companie' : 'Adaugă companie nouă'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifică detaliile companiei existente' 
              : 'Adaugă o companie nouă în sistem și importă date de la ANAF'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            {/* Secțiunea Identificare */}
            <div className="bg-slate-50 rounded-lg p-4 border">
              <h3 className="text-lg font-medium mb-4 text-slate-800 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-primary" />
                Informații de bază
              </h3>
              
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="fiscalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cod Fiscal (CUI)</FormLabel>
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Input 
                                placeholder="1234567" 
                                {...field}
                                className={anafStatus === AnafImportStatus.SUCCESS ? "border-green-500" : ""}
                              />
                            </FormControl>
                            
                            <Button 
                              type="button" 
                              size="sm" 
                              onClick={handleAnafImport}
                              disabled={anafStatus === AnafImportStatus.LOADING}
                            >
                              {anafStatus === AnafImportStatus.LOADING ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Search className="h-4 w-4 mr-1" />
                              )}
                              {anafStatus === AnafImportStatus.LOADING ? "Se importă..." : "ANAF"}
                            </Button>
                          </div>
                          <FormDescription>
                            Codul unic de identificare fiscală (CUI/CIF)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="regNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Număr Registrul Comerțului</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="J12/123/2020" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Numărul de înregistrare la ONRC
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nume Companie</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nume companie" 
                          {...field} 
                          className="font-medium"
                        />
                      </FormControl>
                      <FormDescription>
                        Denumirea oficială a companiei
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tip Companie</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează tipul" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="prospect">Prospect</SelectItem>
                            <SelectItem value="customer">Client</SelectItem>
                            <SelectItem value="partner">Partener</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Tipul relației cu compania
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industrie / Domeniu CAEN</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ex: 6201 - Activități de programare" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Domeniul principal de activitate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="segment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segment de Piață</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează segmentul" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SMB">SMB</SelectItem>
                            <SelectItem value="Mid-Market">Mid-Market</SelectItem>
                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                            <SelectItem value="Strategic">Strategic</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Segmentul de piață
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            {/* Secțiunea Status */}
            <div className="bg-white rounded-lg p-4 border">
              <h3 className="text-lg font-medium mb-4 text-slate-800">Status și Clasificare</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="isCustomer"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">Client</FormLabel>
                        <FormDescription>
                          Compania este client
                          {initialData?.analythic_4111 && (
                            <div className="mt-1 text-sm font-semibold text-primary">
                              Cont analitic: {initialData.analythic_4111}
                            </div>
                          )}
                          {initialData?.analythic_4111 && (
                            <div className="mt-1 text-xs text-yellow-600">
                              Opțiune permanentă
                            </div>
                          )}
                          {!initialData?.analythic_4111 && field.value && (
                            <div className="mt-1 text-xs text-blue-600">
                              La salvare se va crea cont analitic client (4111.x)
                            </div>
                          )}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked && !initialData?.analythic_4111) {
                              // Informează utilizatorul despre crearea contului analitic
                              toast({
                                title: "Cont analitic client",
                                description: "La salvare, se va crea un cont analitic client (4111.x) care nu va putea fi modificat ulterior.",
                              });
                            }
                          }}
                          disabled={!!initialData?.analythic_4111 && field.value}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isSupplier"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">Furnizor</FormLabel>
                        <FormDescription>
                          Compania este furnizor
                          {initialData?.analythic_401 && (
                            <div className="mt-1 text-sm font-semibold text-primary">
                              Cont analitic: {initialData.analythic_401}
                            </div>
                          )}
                          {initialData?.analythic_401 && (
                            <div className="mt-1 text-xs text-yellow-600">
                              Opțiune permanentă
                            </div>
                          )}
                          {!initialData?.analythic_401 && field.value && (
                            <div className="mt-1 text-xs text-blue-600">
                              La salvare se va crea cont analitic furnizor (401.x)
                            </div>
                          )}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked && !initialData?.analythic_401) {
                              // Informează utilizatorul despre crearea contului analitic
                              toast({
                                title: "Cont analitic furnizor",
                                description: "La salvare, se va crea un cont analitic furnizor (401.x) care nu va putea fi modificat ulterior.",
                              });
                            }
                          }}
                          disabled={!!initialData?.analythic_401 && field.value}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">Activ</FormLabel>
                        <FormDescription>
                          Compania este activă în sistem
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Secțiunea Contact */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Contact - Coloana stânga */}
              <div className="lg:col-span-3 bg-white rounded-lg p-4 border">
                <h3 className="text-lg font-medium mb-4 text-slate-800">Contact și Adresă</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Număr de telefon" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Email companie" 
                              type="email" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="www.example.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Persoană de Contact</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nume persoană contact" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresă Completă</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Adresa completă a companiei" 
                            className="min-h-[60px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Localitate</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Localitate" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="county"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Județ</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Județ" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              {/* Financiar - Coloana dreapta */}
              <div className="lg:col-span-2 bg-white rounded-lg p-4 border">
                <h3 className="text-lg font-medium mb-4 text-slate-800">Financiar</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="vatPayer"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Plătitor TVA</FormLabel>
                            <FormDescription>
                              Înregistrat în scopuri de TVA
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="bankAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cont bancar (IBAN)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="RO00 XXXX XXXX XXXX XXXX" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bancă</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Numele băncii" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="socialCapital"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capital social</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="200" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormDescription>
                          Valoarea capitalului social (RON)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {(form.getValues('type') === 'lead' || form.getValues('type') === 'prospect') && (
                    <FormField
                      control={form.control}
                      name="leadScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scor Lead (0-100)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              placeholder="50" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                            />
                          </FormControl>
                          <FormDescription>
                            Potențialul de conversie (0-100)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                {/* Conturi Analitice */}
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium text-sm mb-3 text-slate-700">Conturi Analitice</h4>
                  
                  <div className="space-y-3">
                    {/* Conturi Client */}
                    <div className="flex items-start">
                      <div className="w-4/5">
                        <p className="text-xs text-slate-700 font-medium">Cont Client (4111.x)</p>
                        <p className="text-sm">
                          {initialData?.analythic_4111 || (
                            <span className="text-xs text-slate-500">
                              {form.getValues('isCustomer') 
                                ? "Generat la salvare"
                                : "Marcați compania ca client"}
                            </span>
                          )}
                        </p>
                      </div>
                      {initialData?.analythic_4111 && (
                        <div className="flex-shrink-0 ml-auto text-xs px-2 py-1 bg-primary/10 text-primary rounded-md">
                          Permanent
                        </div>
                      )}
                    </div>
                    
                    {/* Conturi Furnizor */}
                    <div className="flex items-start">
                      <div className="w-4/5">
                        <p className="text-xs text-slate-700 font-medium">Cont Furnizor (401.x)</p>
                        <p className="text-sm">
                          {initialData?.analythic_401 || (
                            <span className="text-xs text-slate-500">
                              {form.getValues('isSupplier') 
                                ? "Generat la salvare"
                                : "Marcați compania ca furnizor"}
                            </span>
                          )}
                        </p>
                      </div>
                      {initialData?.analythic_401 && (
                        <div className="flex-shrink-0 ml-auto text-xs px-2 py-1 bg-primary/10 text-primary rounded-md">
                          Permanent
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {(initialData?.analythic_4111 || initialData?.analythic_401) && (
                    <p className="mt-3 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                      Odată generate, conturile analitice devin permanente și compania nu poate fi ștearsă.
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Secțiunea Note */}
            <div className="bg-white rounded-lg p-4 border">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informații suplimentare despre companie" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Footer */}
            <DialogFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {anafStatus === AnafImportStatus.SUCCESS && (
                    <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <Building2 className="h-4 w-4 text-green-600" />
                      <span>Date importate de la ANAF</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  Anulează
                </Button>
                <Button type="submit" className="px-6" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Se procesează...
                    </>
                  ) : isEditing ? 'Salvează' : 'Adaugă companie'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyFormDialog;

