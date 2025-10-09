/**
 * HR Employee Form
 * 
 * Formular complet pentru înregistrarea și editarea angajaților conform:
 * - Legislației muncii din România (Codul Muncii)
 * - Cerințelor ANAF pentru raportare
 * - Standardelor Revisal pentru registrul de evidență a salariaților
 * - GDPR și legislației privind protecția datelor personale
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { debounce } from 'lodash';
import { z } from 'zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Save, Download, CheckCircle, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import DocumentPreview from '../documents/DocumentPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useHrApi } from '../../hooks/useHrApi';
import { useToast } from '@/hooks/use-toast';

// Validare CNP românesc (13 cifre cu algoritm specific)
const validateCNP = (cnp: string): boolean => {
  // Verifică lungimea și dacă sunt doar cifre
  if (!cnp || cnp.length !== 13 || !/^\d+$/.test(cnp)) {
    return false;
  }

  // Constanta pentru validare CNP
  const constanta = '279146358279';

  // Verificare sex și secol
  const sex = parseInt(cnp.charAt(0));
  if (sex === 0) {
    return false;
  }

  // Verificare dată
  const an = parseInt(cnp.substring(1, 3));
  const luna = parseInt(cnp.substring(3, 5));
  const zi = parseInt(cnp.substring(5, 7));

  if (luna < 1 || luna > 12) {
    return false;
  }

  const maxZileLuna = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // Verificare an bisect
  if ((an % 4 === 0 && an % 100 !== 0) || an % 400 === 0) {
    maxZileLuna[2] = 29;
  }

  if (zi < 1 || zi > maxZileLuna[luna]) {
    return false;
  }

  // Verificare județ
  const judet = parseInt(cnp.substring(7, 9));
  if (judet < 1 || judet > 52 || (judet > 46 && judet < 51)) {
    return false;
  }

  // Calcul cifra de control
  let suma = 0;
  for (let i = 0; i < 12; i++) {
    suma += parseInt(cnp.charAt(i)) * parseInt(constanta.charAt(i));
  }

  let rest = suma % 11;
  if (rest === 10) {
    rest = 1;
  }

  return rest === parseInt(cnp.charAt(12));
};

// Schema de validare pentru angajat
const employeeSchema = z.object({
  // Informații personale de bază
  firstName: z.string().min(2, { message: 'Prenumele trebuie să conțină cel puțin 2 caractere' }),
  lastName: z.string().min(2, { message: 'Numele trebuie să conțină cel puțin 2 caractere' }),
  email: z.string().email({ message: 'Email-ul trebuie să fie valid' }),
  phone: z.string().optional(),
  personalEmail: z.string().email({ message: 'Email-ul personal trebuie să fie valid' }).optional().or(z.literal('')),
  personalPhone: z.string().optional().or(z.literal('')),
  
  // Identificare oficială (necesare pentru Revisal/ANAF)
  cnp: z.string().refine(validateCNP, {
    message: 'CNP-ul nu este valid. Trebuie să conțină 13 cifre și să respecte algoritmul de validare.'
  }),
  idSeriesNumber: z.string().min(3, { message: 'Seria și numărul CI/BI sunt obligatorii' }),
  birthDate: z.date({
    required_error: "Data nașterii este obligatorie.",
  }),
  birthPlace: z.string().min(2, { message: 'Locul nașterii este obligatoriu' }),
  nationality: z.string().default('Română'),
  
  // Adresă
  address: z.string().min(5, { message: 'Adresa trebuie să conțină cel puțin 5 caractere' }),
  city: z.string().min(2, { message: 'Orașul este obligatoriu' }),
  county: z.string().min(2, { message: 'Județul este obligatoriu' }),
  postalCode: z.string().optional().or(z.literal('')),
  
  // Informații de angajare (descriptive, necontractuale)
  // Rol intern descriptiv, fără valoare contractuală (titlul oficial fiind definit în contract)
  position: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  departmentId: z.string().optional().or(z.literal('')),
  
  // Status
  isActive: z.boolean().default(true),
  status: z.string().default('active'),
  
  // Drepturi de acces (opțional)
  hasUserAccount: z.boolean().default(false),
  
  // Date privind GDPR și consimțământ
  gdprConsent: z.boolean().default(false),
  dataProcessingConsent: z.boolean().default(false),
  gdprDocumentId: z.string().optional(),
  accountTermsDocumentId: z.string().optional(),
});

// Tipul de date pentru formular
type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeFormValues>;
  onSubmit: (data: Partial<EmployeeFormValues>) => void;
  isSubmitting?: boolean;
  isEditMode?: boolean;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  isEditMode = false
}) => {
  // State pentru tab-ul curent și validarea formularului
  const [currentTab, setCurrentTab] = useState<string>("personal");
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{id: string, name: string, url: string, type: string}>>([]);
  const [isUploading, setIsUploading] = useState<{gdpr: boolean, terms: boolean}>({gdpr: false, terms: false});
  const gdprFileInputRef = useRef<HTMLInputElement>(null);
  const termsFileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch de departamente și alte date necesare
  // Folosim doar API-ul pentru departamente, COR a fost mutat în formular Contract
  const hrApi = useHrApi();
  const { data: departmentsResponse, isLoading: isLoadingDepartments } = hrApi.useDepartments();
  
  // Wrapper-e simple pentru API-uri până la integrarea completă
  const saveDraftMutation = {
    mutateAsync: async (data: any) => {
      try {
        const response = await fetch('/api/hr/employees/draft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        toast({
          title: "Informații salvate",
          description: "Datele angajatului au fost salvate temporar."
        });
        return result;
      } catch (error) {
        console.error('Eroare la salvare draft:', error);
        toast({
          title: "Eroare",
          description: "A apărut o eroare la salvarea temporară.",
          variant: "destructive"
        });
        throw error;
      }
    },
    isPending: false
  };
  
  const generateDocumentsMutation = {
    mutateAsync: async (data: any) => {
      try {
        const response = await fetch('/api/hr/documents/generate-compliance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        toast({
          title: "Documente generate",
          description: "Documentele de conformitate au fost generate cu succes."
        });
        return result;
      } catch (error) {
        console.error('Eroare la generare documente:', error);
        toast({
          title: "Eroare",
          description: "A apărut o eroare la generarea documentelor.",
          variant: "destructive"
        });
        throw error;
      }
    },
    isPending: false
  };
  
  const uploadDocumentMutation = {
    mutateAsync: async ({file, type, employeeId}: {file: File, type: string, employeeId?: string}) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (employeeId) formData.append('employeeId', employeeId);
        formData.append('documentType', type);
        
        const response = await fetch('/api/hr/documents/upload', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        toast({
          title: "Document încărcat",
          description: "Documentul a fost încărcat cu succes."
        });
        return result;
      } catch (error) {
        console.error('Eroare la încărcare document:', error);
        toast({
          title: "Eroare",
          description: "A apărut o eroare la încărcarea documentului.",
          variant: "destructive"
        });
        throw error;
      }
    },
    isPending: false
  };
  
  // Toast notifications
  const { toast } = useToast();
  
  // Funcționalitatea de căutare COR a fost eliminată din acest formular și mutată în formularul de contract

  const departments = departmentsResponse?.data || [];
  
  // State pentru a urmări dacă toate tab-urile au fost validate
  const [tabsValidated, setTabsValidated] = useState({
    personal: false,
    contact: false,
    employment: false,
    documents: false
  });
  
  // State pentru a urmări tab-ul curent
  const [activeTab, setActiveTab] = useState("personal");
  
  // Declarăm formularul înainte de a folosi orice callback care îl referă
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: defaultValues || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      cnp: '',
      idSeriesNumber: '',
      birthDate: new Date(),
      birthPlace: '',
      nationality: 'română',
      address: '',
      city: '',
      county: '',
      postalCode: '',
      internalPosition: '',
      departmentId: '',
      managerId: '',
      status: 'PENDING',
      civilStatus: 'SINGLE',
      gdprConsent: false,
      healthInsurance: true,
      taxExempt: false
    },
    mode: "onChange" // Activăm validarea la schimbare pentru a putea verifica tab-urile în timp real
  });

  // Funcție pentru a verifica validitatea formularului
  const checkFormValidity = useCallback(() => {
    if (!form) return false;
    
    const formValues = form.getValues();
    const errors = form.formState.errors;
    
    // Verificăm dacă există erori în formular
    if (Object.keys(errors).length > 0) {
      setIsFormValid(false);
      return false;
    }
    
    // Verificăm câmpurile obligatorii pentru fiecare tab
    const personalTabValid = 
      formValues.firstName && 
      formValues.lastName && 
      formValues.email;
      
    const identificationTabValid = 
      formValues.cnp && 
      validateCNP(formValues.cnp);
      
    const employmentTabValid = 
      formValues.departmentId;
    
    const settingsTabValid = 
      formValues.gdprConsent === true;
      
    // Setăm starea pentru fiecare tab
    setTabsValidated({
      personal: personalTabValid,
      contact: identificationTabValid,
      employment: employmentTabValid,
      documents: settingsTabValid
    });
      
    const allTabsValid = 
      personalTabValid && 
      identificationTabValid && 
      employmentTabValid && 
      settingsTabValid;
      
    setIsFormValid(allTabsValid);
    return allTabsValid;
  }, [form]);
  
  // Actualizează validitatea tab-urilor când se schimbă datele formularului
  useEffect(() => {
    const subscription = form.watch(() => {
      checkFormValidity();
    });
    
    return () => subscription.unsubscribe();
  }, [form, checkFormValidity]);
  
  // Funcție pentru salvarea temporară a datelor unui tab specific
  const handleSaveTab = async () => {
    const currentData = form.getValues();
    let currentTabValid = false;
    
    // Verifică validitatea datelor din tab-ul curent
    switch (activeTab) {
      case "personal":
        currentTabValid = 
          currentData.firstName && 
          currentData.lastName && 
          currentData.email;
        break;
      case "contact":
        currentTabValid = 
          currentData.cnp && 
          validateCNP(currentData.cnp);
        break;
      case "employment":
        currentTabValid = 
          currentData.departmentId;
        break;
      case "documents":
        currentTabValid = 
          currentData.gdprConsent === true;
        break;
    }
    
    if (!currentTabValid) {
      toast({
        title: "Validare eșuată",
        description: "Completați toate câmpurile obligatorii din acest tab înainte de a salva.",
        variant: "destructive"
      });
      return;
    }
    
    // Actualizează starea pentru validarea tab-urilor
    setTabsValidated(prevState => ({
      ...prevState,
      [activeTab === "contact" ? "contact" : activeTab]: true
    }));
    
    // Verifică dacă toate tab-urile sunt valide
    const allTabsValid = 
      (activeTab === "personal" || tabsValidated.personal) && 
      (activeTab === "contact" || tabsValidated.contact) && 
      (activeTab === "employment" || tabsValidated.employment) && 
      (activeTab === "documents" || tabsValidated.documents);
    
    // Actualizează starea de validare a formularului complet
    setIsFormValid(allTabsValid);
    
    try {
      await saveDraftMutation.mutateAsync(currentData);
      toast({
        title: "Tab salvat cu succes",
        description: `Informațiile din secțiunea "${activeTab === "contact" ? "Identificare oficială" : 
                       activeTab === "personal" ? "Informații personale" : 
                       activeTab === "employment" ? "Informații angajare" : 
                       "Setări și consimțământ"}" au fost salvate.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Eroare la salvarea temporară:", error);
      toast({
        title: "Eroare la salvare",
        description: "Nu s-au putut salva informațiile. Vă rugăm să încercați din nou.",
        variant: "destructive"
      });
    }
  };
  
  // Funcție pentru generarea documentelor de conformitate
  const handleGenerateDocuments = async () => {
    const currentData = form.getValues();
    try {
      await generateDocumentsMutation.mutateAsync(currentData);
    } catch (error) {
      console.error("Eroare la generarea documentelor:", error);
    }
  };
  
  // Funcție pentru încărcarea documentelor
  const handleUploadDocument = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    try {
      await uploadDocumentMutation.mutateAsync({
        file,
        type: 'gdpr_consent'
      });
      
      // Actualizăm lista de documente
      setUploadedDocuments(prev => [
        ...prev, 
        { name: file.name, url: '#', type: 'gdpr_consent' }
      ]);
    } catch (error) {
      console.error("Eroare la încărcarea documentului:", error);
    }
  };

  // Formularul este deja inițializat mai sus, nu repetăm declarația

  // Determinare automată a datei nașterii și gen din CNP
  const handleCnpChange = (cnp: string) => {
    if (cnp.length === 13 && validateCNP(cnp)) {
      // Extrage an, lună, zi din CNP
      const an = parseInt(cnp.substring(1, 3));
      const luna = parseInt(cnp.substring(3, 5));
      const zi = parseInt(cnp.substring(5, 7));
      
      // Determină secolul din prima cifră a CNP-ului
      const sex = parseInt(cnp.charAt(0));
      let anComplet;
      
      if (sex === 1 || sex === 2) {
        anComplet = 1900 + an;
      } else if (sex === 3 || sex === 4) {
        anComplet = 1800 + an;
      } else if (sex === 5 || sex === 6) {
        anComplet = 2000 + an;
      } else if (sex === 7 || sex === 8) {
        anComplet = 1900 + an; // Rezidenți
      } else if (sex === 9) {
        anComplet = 1900 + an; // Străini
      }
      
      if (anComplet) {
        // Setează data nașterii doar dacă nu e deja completată
        if (!form.getValues('birthDate')) {
          form.setValue('birthDate', new Date(anComplet, luna - 1, zi));
        }
      }
    }
  };

  // Ascultare pentru schimbări în câmpul CNP
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'cnp') {
        handleCnpChange(value.cnp as string);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Populare valori implicite când devin disponibile
  useEffect(() => {
    if (defaultValues) {
      Object.entries(defaultValues).forEach(([key, value]) => {
        if (value !== undefined) {
          form.setValue(key as keyof EmployeeFormValues, value as any);
        }
      });
    }
  }, [defaultValues, form]);

  // Handler de trimitere formular
  const handleFormSubmit = form.handleSubmit((data: EmployeeFormValues) => {
    onSubmit(data);
  });

  // Lista județelor din România
  const counties = [
    { value: 'AB', label: 'Alba' },
    { value: 'AR', label: 'Arad' },
    { value: 'AG', label: 'Argeș' },
    { value: 'BC', label: 'Bacău' },
    { value: 'BH', label: 'Bihor' },
    { value: 'BN', label: 'Bistrița-Năsăud' },
    { value: 'BT', label: 'Botoșani' },
    { value: 'BR', label: 'Brăila' },
    { value: 'BV', label: 'Brașov' },
    { value: 'B', label: 'București' },
    { value: 'BZ', label: 'Buzău' },
    { value: 'CL', label: 'Călărași' },
    { value: 'CS', label: 'Caraș-Severin' },
    { value: 'CJ', label: 'Cluj' },
    { value: 'CT', label: 'Constanța' },
    { value: 'CV', label: 'Covasna' },
    { value: 'DB', label: 'Dâmbovița' },
    { value: 'DJ', label: 'Dolj' },
    { value: 'GL', label: 'Galați' },
    { value: 'GR', label: 'Giurgiu' },
    { value: 'GJ', label: 'Gorj' },
    { value: 'HR', label: 'Harghita' },
    { value: 'HD', label: 'Hunedoara' },
    { value: 'IL', label: 'Ialomița' },
    { value: 'IS', label: 'Iași' },
    { value: 'IF', label: 'Ilfov' },
    { value: 'MM', label: 'Maramureș' },
    { value: 'MH', label: 'Mehedinți' },
    { value: 'MS', label: 'Mureș' },
    { value: 'NT', label: 'Neamț' },
    { value: 'OT', label: 'Olt' },
    { value: 'PH', label: 'Prahova' },
    { value: 'SJ', label: 'Sălaj' },
    { value: 'SM', label: 'Satu Mare' },
    { value: 'SB', label: 'Sibiu' },
    { value: 'SV', label: 'Suceava' },
    { value: 'TR', label: 'Teleorman' },
    { value: 'TM', label: 'Timiș' },
    { value: 'TL', label: 'Tulcea' },
    { value: 'VL', label: 'Vâlcea' },
    { value: 'VS', label: 'Vaslui' },
    { value: 'VN', label: 'Vrancea' }
  ];

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-8">
        <Tabs 
          defaultValue="personal" 
          className="w-full"
          value={currentTab}
          onValueChange={(value) => setCurrentTab(value)}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger 
              value="personal" 
              onClick={() => setActiveTab("personal")}
              className={tabsValidated.personal ? "border-green-500 border-b-2" : ""}
            >
              Informații personale {tabsValidated.personal && "✓"}
            </TabsTrigger>
            <TabsTrigger 
              value="identification" 
              onClick={() => setActiveTab("contact")}
              className={tabsValidated.contact ? "border-green-500 border-b-2" : ""}
            >
              Identificare oficială {tabsValidated.contact && "✓"}
            </TabsTrigger>
            <TabsTrigger 
              value="employment" 
              onClick={() => setActiveTab("employment")}
              className={tabsValidated.employment ? "border-green-500 border-b-2" : ""}
            >
              Informații angajare {tabsValidated.employment && "✓"}
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              onClick={() => setActiveTab("documents")}
              className={tabsValidated.documents ? "border-green-500 border-b-2" : ""}
            >
              Setări și consimțământ {tabsValidated.documents && "✓"}
            </TabsTrigger>
          </TabsList>
          
          {/* Tab: Informații personale */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Date personale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nume <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nume de familie" />
                        </FormControl>
                        <FormDescription>
                          Numele de familie din cartea de identitate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prenume <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Prenume" />
                        </FormControl>
                        <FormDescription>
                          Prenumele din cartea de identitate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email profesional <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="nume.prenume@companie.ro" />
                        </FormControl>
                        <FormDescription>
                          Adresa de email utilizată pentru comunicarea profesională
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon profesional</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="07xx xxx xxx" />
                        </FormControl>
                        <FormDescription>
                          Numărul de telefon utilizat pentru comunicarea profesională
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="personalEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email personal</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="nume@email.com" />
                        </FormControl>
                        <FormDescription>
                          Adresa de email personală (opțional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="personalPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon personal</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="07xx xxx xxx" />
                        </FormControl>
                        <FormDescription>
                          Numărul de telefon personal (opțional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adresă</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresa completă <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Strada, număr, bloc, scară, apartament" />
                      </FormControl>
                      <FormDescription>
                        Adresa de domiciliu din cartea de identitate
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localitate <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Oraș/Comună/Sat" />
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
                        <FormLabel>Județ <span className="text-red-500">*</span></FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectați județul" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {counties.map((county) => (
                              <SelectItem key={county.value} value={county.label}>
                                {county.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cod poștal</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="xxxxxx" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab: Identificare oficială */}
          <TabsContent value="identification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Date de identificare oficiale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="cnp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          CNP <span className="text-red-500">*</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Codul Numeric Personal (CNP) constă din 13 cifre și este necesar pentru înregistrarea în Revisal și raportările ANAF.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="1234567890123" 
                            maxLength={13}
                          />
                        </FormControl>
                        <FormDescription>
                          Codul Numeric Personal din cartea de identitate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="idSeriesNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serie și număr CI/BI <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="XX 123456" />
                        </FormControl>
                        <FormDescription>
                          Seria și numărul cărții de identitate (ex: BV 123456)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data nașterii <span className="text-red-500">*</span></FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd.MM.yyyy", { locale: ro })
                                ) : (
                                  <span>Selectați data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                              locale={ro}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Data nașterii conform actului de identitate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birthPlace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Locul nașterii <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Oraș, Județ" />
                        </FormControl>
                        <FormDescription>
                          Locul nașterii conform actului de identitate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cetățenie <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Română" />
                      </FormControl>
                      <FormDescription>
                        Cetățenia conform actului de identitate
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab: Informații angajare */}
          <TabsContent value="employment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informații despre angajare</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rol intern</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Descriere rol intern (fără valoare contractuală)" />
                        </FormControl>
                        <FormDescription>
                          Titlu informal folosit intern. Funcția oficială conform COR se definește în contract.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departament</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value) {
                              const selectedDept = departments.find((d: any) => d.id === value);
                              if (selectedDept) {
                                form.setValue('department', selectedDept.name);
                              }
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectați departamentul" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((department: any) => (
                              <SelectItem key={department.id} value={department.id}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Departamentul din care face parte angajatul
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Codul COR a fost eliminat de aici și mutat exclusiv în formularul de contract conform cerințelor REVISAL */}

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Status activ</FormLabel>
                        <FormDescription>
                          Indică dacă angajatul este activ în cadrul companiei
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
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab: Setări și consimțământ */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Setări cont și acces</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasUserAccount"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Creare cont utilizator</FormLabel>
                        <FormDescription>
                          Creează un cont de utilizator pentru accesul angajatului la platformă
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consimțământ GDPR și procesare date</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="gdprConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Consimțământ GDPR <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormDescription>
                          Angajatul a fost informat și și-a dat consimțământul pentru procesarea datelor personale 
                          conform Regulamentului General privind Protecția Datelor (GDPR).
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-between items-center py-2">
                  <DocumentPreview 
                    type="gdpr"
                    employee={{
                      firstName: form.watch('firstName'),
                      lastName: form.watch('lastName'),
                      cnp: form.watch('cnp'),
                      idSeriesNumber: form.watch('idSeriesNumber'),
                      address: form.watch('address'),
                      city: form.watch('city'),
                      county: form.watch('county'),
                      email: form.watch('email'),
                      phone: form.watch('phone'),
                      position: form.watch('position'),
                    }}
                    companyName="Compania Dumneavoastră SRL"
                    trigger={
                      <Button variant="outline" type="button" className="flex gap-2">
                        <FileText className="h-4 w-4" />
                        Previzualizare Consimțământ GDPR
                      </Button>
                    }
                  />
                  
                  <div className="flex flex-col items-end gap-2">
                    <input
                      type="file"
                      id="gdpr-document-upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsUploading(prev => ({ ...prev, gdpr: true }));
                          
                          const uploadDoc = async () => {
                            try {
                              const formData = new FormData();
                              formData.append('file', file);
                              formData.append('type', 'gdpr_consent');
                              if (form.getValues('id')) {
                                formData.append('employeeId', form.getValues('id'));
                              }
                              
                              const response = await fetch('/api/hr/documents/upload', {
                                method: 'POST',
                                body: formData
                              });
                              
                              const data = await response.json();
                              if (data.success && data.data) {
                                form.setValue('gdprDocumentId', data.data.document.id);
                                setUploadedDocuments(prev => [
                                  ...prev.filter(doc => doc.type !== 'gdpr_consent'),
                                  { 
                                    id: data.data.document.id,
                                    name: file.name, 
                                    url: data.data.documentUrl,
                                    type: 'gdpr_consent'
                                  }
                                ]);
                                toast({
                                  title: "Document încărcat",
                                  description: "Documentul a fost încărcat cu succes.",
                                });
                              } else {
                                toast({
                                  title: "Eroare",
                                  description: data.message || "A apărut o eroare la încărcarea documentului.",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error('Error uploading document:', error);
                              toast({
                                title: "Eroare",
                                description: "A apărut o eroare la încărcarea documentului.",
                                variant: "destructive",
                              });
                            } finally {
                              setIsUploading(prev => ({ ...prev, gdpr: false }));
                            }
                          };
                          
                          uploadDoc();
                        }
                      }}
                      ref={gdprFileInputRef}
                    />
                    
                    {form.watch('gdprDocumentId') ? (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Document încărcat</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            form.setValue('gdprDocumentId', undefined);
                            setUploadedDocuments(prev => prev.filter(doc => doc.type !== 'gdpr_consent'));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={isUploading.gdpr}
                        onClick={() => gdprFileInputRef.current?.click()}
                      >
                        {isUploading.gdpr ? (
                          <>Încărcare...</>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Încarcă document semnat
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="dataProcessingConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Acord pentru procesarea datelor <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormDescription>
                          Angajatul este de acord cu procesarea datelor personale pentru scopuri administrative,
                          salariale, fiscale și de raportare către autorități (ANAF, Revisal, etc).
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between items-center py-2">
                  <DocumentPreview 
                    type="account-terms"
                    employee={{
                      firstName: form.watch('firstName'),
                      lastName: form.watch('lastName'),
                      cnp: form.watch('cnp'),
                      idSeriesNumber: form.watch('idSeriesNumber'),
                      address: form.watch('address'),
                      city: form.watch('city'),
                      county: form.watch('county'),
                      email: form.watch('email'),
                      phone: form.watch('phone'),
                      position: form.watch('position'),
                    }}
                    companyName="Compania Dumneavoastră SRL"
                    trigger={
                      <Button variant="outline" type="button" className="flex gap-2">
                        <FileText className="h-4 w-4" />
                        Previzualizare Acord utilizare cont
                      </Button>
                    }
                  />
                  
                  <div className="flex flex-col items-end gap-2">
                    <input
                      type="file"
                      id="account-terms-document-upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsUploading(prev => ({ ...prev, terms: true }));
                          
                          const uploadDoc = async () => {
                            try {
                              const formData = new FormData();
                              formData.append('file', file);
                              formData.append('type', 'account_terms');
                              if (form.getValues('id')) {
                                formData.append('employeeId', form.getValues('id'));
                              }
                              
                              const response = await fetch('/api/hr/documents/upload', {
                                method: 'POST',
                                body: formData
                              });
                              
                              const data = await response.json();
                              if (data.success && data.data) {
                                form.setValue('accountTermsDocumentId', data.data.document.id);
                                setUploadedDocuments(prev => [
                                  ...prev.filter(doc => doc.type !== 'account_terms'),
                                  { 
                                    id: data.data.document.id,
                                    name: file.name, 
                                    url: data.data.documentUrl,
                                    type: 'account_terms'
                                  }
                                ]);
                                toast({
                                  title: "Document încărcat",
                                  description: "Documentul a fost încărcat cu succes.",
                                });
                              } else {
                                toast({
                                  title: "Eroare",
                                  description: data.message || "A apărut o eroare la încărcarea documentului.",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error('Error uploading document:', error);
                              toast({
                                title: "Eroare",
                                description: "A apărut o eroare la încărcarea documentului.",
                                variant: "destructive",
                              });
                            } finally {
                              setIsUploading(prev => ({ ...prev, terms: false }));
                            }
                          };
                          
                          uploadDoc();
                        }
                      }}
                      ref={termsFileInputRef}
                    />
                    
                    {form.watch('accountTermsDocumentId') ? (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Document încărcat</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            form.setValue('accountTermsDocumentId', undefined);
                            setUploadedDocuments(prev => prev.filter(doc => doc.type !== 'account_terms'));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={isUploading.terms}
                        onClick={() => termsFileInputRef.current?.click()}
                      >
                        {isUploading.terms ? (
                          <>Încărcare...</>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Încarcă document semnat
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4">
              <h4 className="text-sm font-medium mb-1">Notă importantă:</h4>
              <p className="text-sm">
                Înregistrarea unui angajat necesită completarea unui contract de muncă și raportarea în Revisal.
                După înregistrarea angajatului, veți fi redirecționat către pagina de creare contract.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline">
            Anulează
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleSaveTab()}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            Salvează informațiile
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !isFormValid}
            className={!isFormValid ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isSubmitting 
              ? 'Se procesează...' 
              : !isFormValid 
                ? 'Completați toate secțiunile obligatorii' 
                : (isEditMode ? 'Actualizează angajat' : 'Adaugă angajat')}
          </Button>
        </div>
        
        {!isFormValid && (
          <div className="mt-4 p-4 border border-amber-200 bg-amber-50 rounded-md">
            <p className="text-amber-700 text-sm">
              <strong>Notă:</strong> Pentru a activa butonul de adăugare, trebuie să completați și să salvați toate secțiunile formularului.
              {!tabsValidated.personal && <span className="block mt-1">• Secțiunea "Informații personale" nu este completată</span>}
              {!tabsValidated.contact && <span className="block mt-1">• Secțiunea "Identificare oficială" nu este completată</span>}
              {!tabsValidated.employment && <span className="block mt-1">• Secțiunea "Informații angajare" nu este completată</span>}
              {!tabsValidated.documents && <span className="block mt-1">• Secțiunea "Setări și consimțământ" nu este completată</span>}
            </p>
          </div>
        )}
      </form>
    </Form>
  );
};

export default EmployeeForm;