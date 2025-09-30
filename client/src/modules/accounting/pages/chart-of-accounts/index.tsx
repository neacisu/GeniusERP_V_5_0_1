import React, { useState, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Account as BaseAccount, AccountClass, SyntheticAccount as BaseSyntheticAccount } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DatabaseZap, Pencil, Trash2 } from "lucide-react";

// Formatare numere pentru afișarea în tabel
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('ro-RO', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(num || 0);
};

// Extindem interfața Account pentru a include câmpurile specifice românești
interface Account extends BaseAccount {
  debitBalance?: number;
  creditBalance?: number;
  balance?: number;
  groupName?: string;
  isActive: boolean;
  accountFunction: string; // A, P sau B (Activ, Pasiv, Bifuncțional)
}

// Extindem interfața SyntheticAccount pentru a include câmpurile din schema
interface SyntheticAccount extends BaseSyntheticAccount {
  debitBalance?: number;
  creditBalance?: number;
  balance?: number;
  groupName?: string;
  isActive: boolean;
  accountFunction: string; // A, P sau B (Activ, Pasiv, Bifuncțional)
}

import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  PlusCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Download,
  Upload,
  FilePlus2,
  BookOpen
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Interfață pentru grupa de conturi
interface AccountGroup {
  id: string;
  code: string;
  name: string;
  description?: string;
  classId: string;
}

export default function ChartOfAccountsPage() {
  const [activeClass, setActiveClass] = useState<string>("1");
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Parent account picker state
  const [isParentPickerOpen, setIsParentPickerOpen] = useState(false);
  const [parentSearchTerm, setParentSearchTerm] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("none");
  const [selectedParentName, setSelectedParentName] = useState("Fără cont părinte");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch account classes to get the actual UUID based on the code
  const { data: accountClasses, isLoading: isLoadingClasses } = useQuery<AccountClass[]>({
    queryKey: ['/api/accounting/account-classes']
  });

  // Get the UUID of the active class from the code
  const activeClassUuid = accountClasses?.find(c => c.code === activeClass)?.id;
  
  // Fetch account groups for the active class by UUID
  const { data: accountGroups, isLoading: isLoadingGroups } = useQuery<AccountGroup[]>({
    queryKey: [`/api/accounting/account-groups/by-class/${activeClassUuid || activeClass}`],
    enabled: activeClass !== "" && !!activeClassUuid,
  });
  
  // Fetch synthetic accounts grade 1 for the active class
  const { data: syntheticAccountsGrade1, isLoading: isLoadingGrade1 } = useQuery<Account[]>({
    queryKey: [`/api/accounting/synthetic-accounts/by-grade/1`],
    enabled: activeClass !== "",
  });
  
  // Fetch synthetic accounts grade 2 for the active class
  const { data: syntheticAccountsGrade2, isLoading: isLoadingGrade2 } = useQuery<Account[]>({
    queryKey: [`/api/accounting/synthetic-accounts/by-grade/2`],
    enabled: activeClass !== "",
  });
  
  // Fetch all synthetic accounts for the parent account picker
  const { data: syntheticAccounts, isLoading: isLoadingSyntheticAccounts } = useQuery<SyntheticAccount[]>({
    queryKey: ['/api/accounting/synthetic-accounts'],
  });
  
  // Fetch all analytic accounts
  const { data: analyticAccounts, isLoading: isLoadingAnalyticAccounts } = useQuery<Account[]>({
    queryKey: ['/api/accounting/analytic-accounts'],
  });
  
  // Combine synthetic and analytic accounts for the parent picker
  const allAccounts = [...(syntheticAccounts || []), ...(analyticAccounts || [])];
  const isLoadingAllAccounts = isLoadingSyntheticAccounts || isLoadingAnalyticAccounts;

  // Form for adding/editing accounts
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      accountFunction: "P", // Default to Passive
      classId: activeClass,
      parentId: "none",
      isActive: true
    }
  });

  // Set up form when editing an account
  const setupEditForm = (account: Account) => {
    // Find parent account info if exists
    if (account.parentId) {
      const parentAccount = allAccounts?.find(a => a.id === account.parentId);
      if (parentAccount) {
        setSelectedParentId(account.parentId);
        setSelectedParentName(`${parentAccount.code} - ${parentAccount.name}`);
      } else {
        setSelectedParentId("none");
        setSelectedParentName("Fără cont părinte");
      }
    } else {
      setSelectedParentId("none");
      setSelectedParentName("Fără cont părinte");
    }
    
    reset({
      code: account.code,
      name: account.name,
      description: account.description || "",
      accountFunction: account.accountFunction,
      classId: account.classId,
      parentId: account.parentId || "none",
      isActive: account.isActive
    });
    setIsAccountDialogOpen(true);
  };

  // Handle account creation/update
  const accountMutation = useMutation({
    mutationFn: async (data: any) => {
      // Use the correct endpoint based on account type (synthetic vs analytic)
      let endpoint;
      if (selectedAccount) {
        // Update existing account - determine if it's synthetic or analytic
        if (selectedAccount.syntheticId) {
          // It's an analytic account
          endpoint = `/api/accounting/analytic-accounts/${selectedAccount.id}`;
        } else {
          // It's a synthetic account
          endpoint = `/api/accounting/synthetic-accounts/${selectedAccount.id}`;
        }
      } else {
        // În sistemul contabil românesc, din UI creăm doar conturi analitice
        // Conturile sintetice sunt predefinite și nu pot fi create de utilizatori în mod normal
        endpoint = '/api/accounting/analytic-accounts';
      }
      
      const method = selectedAccount ? "PATCH" : "POST";
      return await apiRequest(endpoint, {
        method,
        body: data
      });
    },
    onSuccess: () => {
      // Invalidate both synthetic and analytic account queries
      queryClient.invalidateQueries({ queryKey: [`/api/accounting/synthetic-accounts/by-grade/${activeClass}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/synthetic-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/analytic-accounts'] });
      toast({
        title: selectedAccount ? "Cont actualizat" : "Cont creat",
        description: `Contul a fost ${selectedAccount ? 'actualizat' : 'creat'} cu succes.`,
      });
      setIsAccountDialogOpen(false);
      setSelectedAccount(null);
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: `Nu s-a putut ${selectedAccount ? 'actualiza' : 'crea'} contul: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const onSubmitAccount = (data: any) => {
    // Pentru conturi analitice noi, verificăm dacă un cont părinte a fost selectat
    if (!selectedAccount && (!data.parentId || data.parentId === 'none' || data.parentId === '')) {
      console.log("Eroare validare parent ID:", data.parentId);
      toast({
        title: "Eroare",
        description: "Trebuie să selectați un cont părinte sintetic pentru contul analitic nou.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificăm existența contului părinte și preluăm informațiile despre el
    const parentAccount = syntheticAccounts?.find(acc => acc.id === data.parentId);
    console.log("Cont părinte găsit:", parentAccount);
    
    if (!parentAccount) {
      toast({
        title: "Eroare",
        description: "Contul părinte selectat nu a fost găsit. Vă rugăm să selectați un alt cont părinte.",
        variant: "destructive",
      });
      return;
    }

    // Moștenim tipul contului (accountFunction) de la contul părinte
    data.accountFunction = parentAccount.accountFunction;
    
    // Verifică dacă există deja un cont cu același cod în sistem
    const fullCode = `${parentAccount.code}.${data.code}`;
    const allAccountsInSystem = [...(syntheticAccountsGrade1 || []), ...(syntheticAccountsGrade2 || []), ...(analyticAccounts || [])];
    
    const isDuplicate = allAccountsInSystem.some(acc => 
      acc.id !== selectedAccount?.id && acc.code === fullCode
    );
    
    if (isDuplicate) {
      toast({
        title: "Eroare",
        description: `Există deja un cont cu codul ${fullCode} în sistem. Vă rugăm să folosiți un alt subcod.`,
        variant: "destructive",
      });
      return;
    }
    
    // Formatăm codul contului pentru a include codul părinte
    data.code = fullCode;
    
    console.log("Date trimise la server:", data);
    
    // Trimitem datele la server
    accountMutation.mutate(data);
  };

  // Open dialog for new account
  const handleAddAccount = () => {
    setSelectedAccount(null);
    // Conturile analitice trebuie să aibă întotdeauna un cont părinte
    // Pentru a forța utilizatorul să aleagă un cont părinte, noi resetăm
    // câmpul dar nu-l preselectăm, așa că utilizatorul trebuie să aleagă
    setSelectedParentId("");
    setSelectedParentName("Selectați un cont părinte sintetic");
    
    // În sistemul contabil românesc, vom crea doar conturi analitice pentru conturile sintetice
    // Folosim setări inițiale care reflectă acest lucru
    reset({
      code: "", // Va fi doar subcodul, codul complet va fi format din codul părinte + subcod
      name: "",
      description: "",
      accountFunction: "", // Tipul va fi moștenit de la contul părinte
      classId: activeClass,
      parentId: "", // Trebuie să fie selectat un părinte pentru conturile analitice
      isActive: true
    });
    
    // Deschidem dialogul pentru cont nou
    setIsAccountDialogOpen(true);
    
    // Afișăm un mesaj de informare pentru utilizator
    toast({
      title: "Creați un cont analitic",
      description: "În sistemul contabil românesc, puteți crea doar conturi analitice aferente unui cont sintetic existent. Selectați un cont părinte și adăugați un subcod pentru a crea contul analitic.",
    });
  };

  // Open dialog for editing account
  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setupEditForm(account);
  };

  // Handle deleting an account
  const deleteAccountMutation = useMutation({
    mutationFn: async (accountInfo: { id: string, isSynthetic: boolean }) => {
      // Determine the endpoint based on account type
      const endpoint = accountInfo.isSynthetic
        ? `/api/accounting/synthetic-accounts/${accountInfo.id}`
        : `/api/accounting/analytic-accounts/${accountInfo.id}`;
      
      return await apiRequest(endpoint, { 
        method: "DELETE" 
      });
    },
    onSuccess: () => {
      // Invalidate both synthetic and analytic account queries
      queryClient.invalidateQueries({ queryKey: [`/api/accounting/synthetic-accounts/by-grade/${activeClass}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/synthetic-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/analytic-accounts'] });
      toast({
        title: "Cont șters",
        description: "Contul a fost șters cu succes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: `Nu s-a putut șterge contul: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleDeleteAccount = (account: Account) => {
    if (confirm("Sunteți sigur că doriți să ștergeți acest cont? Această acțiune nu poate fi anulată.")) {
      // Determine if it's a synthetic or analytic account
      const isSynthetic = !account.syntheticId;
      deleteAccountMutation.mutate({ 
        id: account.id, 
        isSynthetic 
      });
    }
  };

  // Merge accounts from grade 1 and grade 2
  const allSyntheticAccounts = [...(syntheticAccountsGrade1 || []), ...(syntheticAccountsGrade2 || [])];
  const isLoadingAccounts = isLoadingGrade1 || isLoadingGrade2;
  
  // Filter accounts based on search term
  const filteredAccounts = allSyntheticAccounts?.filter((account: Account) => 
    account.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    account.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Group accounts by first digit of code (for class) and then by first two digits (for group)
  const groupedAccounts: Record<string, Account[]> = {};
  
  if (filteredAccounts.length > 0) {
    filteredAccounts.forEach((account: Account) => {
      // Get the first two digits for grouping
      const groupCode = account.code.substring(0, 2);
      if (!groupedAccounts[groupCode]) {
        groupedAccounts[groupCode] = [];
      }
      groupedAccounts[groupCode].push(account);
    });
  }

  // Toggle group expansion
  const toggleGroupExpansion = (groupCode: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupCode]: !prev[groupCode]
    }));
  };
  
  // Function to select parent account in the picker
  const selectParentAccount = (id: string, name: string) => {
    setSelectedParentId(id);
    setSelectedParentName(name);
    
    // Actualizăm valoarea parentId în formular
    setValue("parentId", id);
    
    // Găsim contul sintetic părinte pentru a obține clasa din care face parte
    const parentAccount = syntheticAccounts?.find(acc => acc.id === id);
    console.log("Cont părinte găsit:", parentAccount);
    
    if (parentAccount) {
      // Pentru debugging
      console.log("Cont părinte propietăți:", JSON.stringify(parentAccount, null, 2));
      
      // Două metode de a determina clasa contabilă:
      
      // Metoda 1: Prin relația cont -> grupă -> clasă
      let foundClassCode = null;
      
      if (parentAccount.groupId) {
        const accountGroup = accountGroups?.find(g => g.id === parentAccount.groupId);
        console.log("Grupa contabilă găsită:", accountGroup);
        
        if (accountGroup && accountGroup.classId) {
          const accountClass = accountClasses?.find(c => c.id === accountGroup.classId);
          console.log("Clasa contabilă găsită:", accountClass);
          
          if (accountClass) {
            foundClassCode = accountClass.code;
            console.log("Clasa determinată prin relația grupă-clasă:", foundClassCode);
          }
        }
      }
      
      // Metoda 2: Extragere din codul contului (prima cifră)
      if (!foundClassCode && parentAccount.code) {
        foundClassCode = parentAccount.code.charAt(0);
        console.log("Clasa determinată din codul contului:", foundClassCode);
      }
      
      // Actualizăm clasa în formular, doar dacă am găsit o clasă validă
      if (foundClassCode) {
        console.log("Actualizăm clasa la:", foundClassCode);
        
        // Actualizăm starea UI pentru tab-uri
        setActiveClass(foundClassCode);
        
        // Actualizăm valoarea în formular - esențial pentru funcționarea selectului
        setValue("classId", foundClassCode);
      }
      
      // Căutăm conturile analitice existente pentru acest cont sintetic
      // pentru a determina următorul subcod disponibil
      const analyticAccountsForParent = analyticAccounts?.filter(
        acc => acc.syntheticId === parentAccount.id
      ) || [];
      
      if (analyticAccountsForParent.length > 0) {
        console.log("Conturi analitice existente pentru părintele selectat:", analyticAccountsForParent);
        
        // Extragem subcodurile existente - elimăm codul părinte din codul complet
        const existingSubcodes = analyticAccountsForParent.map(acc => {
          // Presupunem că subcodul e tot ce urmează după ultima cifră din codul părinte
          const parentCodeLength = parentAccount.code.length;
          if (acc.code.length > parentCodeLength && acc.code.startsWith(parentAccount.code + ".")) {
            return acc.code.substring(parentCodeLength + 1); // +1 pentru punctul separator
          }
          return "";
        }).filter(subcode => subcode !== "");
        
        console.log("Subcoduri existente:", existingSubcodes);
        
        // Găsim cel mai mare subcod numeric și adăugăm 1
        let maxSubcode = 0;
        existingSubcodes.forEach(subcode => {
          // Verificăm dacă subcodul e numeric
          if (/^\d+$/.test(subcode)) {
            const subcodeNum = parseInt(subcode, 10);
            if (subcodeNum > maxSubcode) {
              maxSubcode = subcodeNum;
            }
          }
        });
        
        // Următorul subcod disponibil
        const nextSubcode = (maxSubcode + 1).toString();
        console.log("Următorul subcod disponibil:", nextSubcode);
        
        // Actualizăm codul în formular
        setValue("code", nextSubcode);
      } else {
        console.log("Nu există conturi analitice pentru acest părinte - se va folosi subcodul 1");
        setValue("code", "1");
      }
      
      // Setăm și tipul contului moștenit de la părinte
      if (parentAccount.accountFunction) {
        setValue("accountFunction", parentAccount.accountFunction);
      }
    }
    
    // Închide dialogul de selectare a contului părinte
    setIsParentPickerOpen(false);
  };

  // Get account type label and style based on account_function from database
  const getAccountTypeInfo = (type: string) => {
    switch (type?.toUpperCase()) {
      // Conturi de Activ
      case 'A': 
        return { label: 'Activ', className: 'bg-green-100 text-green-800' };
      
      // Conturi de Pasiv
      case 'P': 
        return { label: 'Pasiv', className: 'bg-blue-100 text-blue-800' };
      
      // Conturi Bifuncționale
      case 'B': 
        return { label: 'Bifuncțional', className: 'bg-amber-100 text-amber-800' };
      
      // Conturi Extrabilanțiere (în afara bilanțului)
      case 'X': 
        return { label: 'Extrabilanțier', className: 'bg-purple-100 text-purple-800' };
      
      default: 
        // Pentru debugging, afișăm valoarea necunoscută în consolă
        console.log('Tip de cont necunoscut:', type);
        return { label: type || 'Necunoscut', className: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <AppLayout>
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/accounting">Contabilitate</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Plan de Conturi</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plan de Conturi</h1>
          <p className="text-sm text-gray-500">Gestionați și organizați conturile contabile conform standardelor românești</p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <FilePlus2 className="h-4 w-4 mr-2" />
                <span>Acțiuni</span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Opțiuni Plan de Conturi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAddAccount}>
                <PlusCircle className="h-4 w-4 mr-2" />
                <span>Adaugă Cont Nou</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                <span>Importă Plan de Conturi</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                <span>Exportă Plan de Conturi</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={handleAddAccount}>
            <PlusCircle className="h-4 w-4 mr-2" />
            <span>Cont Nou</span>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Caută cont după cod sau denumire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Tabs value={activeClass} onValueChange={setActiveClass} className="w-full sm:w-auto">
              <TabsList>
                {isLoadingClasses ? (
                  <div className="flex items-center justify-center p-2">
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                ) : (
                  accountClasses?.map(accountClass => (
                    <TabsTrigger 
                      key={accountClass.id} 
                      value={accountClass.code}
                    >
                      Clasa {accountClass.code}
                    </TabsTrigger>
                  ))
                )}
              </TabsList>
            </Tabs>
          </div>
          
          {/* Active class description */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <BookOpen className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">
                  {isLoadingClasses ? (
                    <div className="h-5 w-48 bg-blue-200 animate-pulse rounded"></div>
                  ) : (
                    accountClasses?.find(cls => cls.code === activeClass)?.name
                  )}
                </h3>
                <div className="text-sm text-blue-700">
                  {isLoadingClasses ? (
                    <div className="h-4 w-72 bg-blue-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    accountClasses?.find(cls => cls.code === activeClass)?.description
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Accounts table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-32">Cod</TableHead>
                  <TableHead>Denumire</TableHead>
                  <TableHead className="w-24 text-center">Tip</TableHead>
                  <TableHead className="text-right w-32">Debit</TableHead>
                  <TableHead className="text-right w-32">Credit</TableHead>
                  <TableHead className="text-right w-32">Sold</TableHead>
                  <TableHead className="w-32 text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAccounts || isLoadingGroups ? (
                  Array(5).fill(null).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7} className="h-12">
                        <div className="w-full h-8 bg-gray-100 animate-pulse rounded"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : accountGroups && accountGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                      <DatabaseZap className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      Nu există grupe de conturi definite pentru această clasă.
                    </TableCell>
                  </TableRow>
                ) : (
                  // Display accounts grouped hierarchically by class > group > grade 1 > grade 2
                  accountGroups?.map(group => {
                    // Filter synthetic accounts grade 1 by group - find accounts that have same 2 initial digits as group code
                    const grade1Accounts = syntheticAccountsGrade1?.filter(acc => 
                      acc.code.substring(0, 2) === group.code
                    ) || [];
                    
                    const isGroupExpanded = expandedGroups[`group-${group.id}`] || false;
                    
                    return (
                      <Fragment key={`group-${group.id}`}>
                        {/* Group header row */}
                        <TableRow 
                          className={`bg-gray-50 ${grade1Accounts.length > 0 ? 'cursor-pointer hover:bg-gray-100' : 'cursor-not-allowed opacity-60'}`}
                          onClick={() => grade1Accounts.length > 0 && toggleGroupExpansion(`group-${group.id}`)}
                        >
                          <TableCell colSpan={2} className="py-2">
                            <div className="flex items-center">
                              {grade1Accounts.length > 0 ? (
                                isGroupExpanded ? (
                                  <ChevronDown className="h-4 w-4 mr-2 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 mr-2 text-gray-500" />
                                )
                              ) : (
                                <div className="h-4 w-4 mr-2 text-gray-400">•</div>
                              )}
                              <span className="font-medium">
                                {group.code}
                                <span className="text-gray-500 ml-2">
                                  {group.name}
                                </span>
                                {grade1Accounts.length === 0 && (
                                  <span className="text-xs text-gray-400 ml-2">(fără conturi)</span>
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-right">
                            {formatNumber(
                              grade1Accounts.reduce((sum, acc) => sum + (acc.debitBalance || 0), 0)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(
                              grade1Accounts.reduce((sum, acc) => sum + (acc.creditBalance || 0), 0)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(
                              grade1Accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {/* No actions for group header */}
                          </TableCell>
                        </TableRow>
                        
                        {/* Grade 1 account rows (only visible when group is expanded) */}
                        {isGroupExpanded && grade1Accounts.map((account) => {
                          // Filter synthetic accounts grade 2 that belong to this grade 1 account
                          // In sistemul românesc, conturile sintetice de gradul 2 au codul format din codul contului părinte + o extensie
                          // Ex: Cont grad 1: "401", cont grad 2: "4011"
                          const grade2Accounts = syntheticAccountsGrade2?.filter(acc => {
                            // Verificăm dacă codul contului de grad 2 începe cu codul contului de grad 1
                            return acc.code.startsWith(account.code) && acc.code !== account.code;
                          }) || [];
                          
                          const isAccountExpanded = expandedGroups[`account-${account.id}`] || false;
                          
                          return (
                            <Fragment key={`account-${account.id}`}>
                              {/* Grade 1 account row */}
                              <TableRow 
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => toggleGroupExpansion(`account-${account.id}`)}
                              >
                                <TableCell className="font-medium pl-8">
                                  <div className="flex items-center">
                                    {grade2Accounts.length > 0 ? (
                                      isAccountExpanded ? (
                                        <ChevronDown className="h-4 w-4 mr-2 text-gray-500" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 mr-2 text-gray-500" />
                                      )
                                    ) : (
                                      <span className="w-6"></span>
                                    )}
                                    {account.code}
                                  </div>
                                </TableCell>
                                <TableCell>{account.name}</TableCell>
                                <TableCell className="text-center">
                                  <Badge className={getAccountTypeInfo(account.accountFunction).className}>
                                    {getAccountTypeInfo(account.accountFunction).label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">{formatNumber(account.debitBalance || 0)}</TableCell>
                                <TableCell className="text-right">{formatNumber(account.creditBalance || 0)}</TableCell>
                                <TableCell className="text-right">{formatNumber(account.balance || 0)}</TableCell>
                                <TableCell>
                                  <div className="flex justify-end space-x-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEditAccount(account);
                                            }}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Editează cont</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteAccount(account);
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Șterge cont</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                              </TableRow>
                              
                              {/* Grade 2 account rows (only visible when grade 1 account is expanded) */}
                              {isAccountExpanded && grade2Accounts.map((grade2Account) => (
                                <TableRow key={`grade2-${grade2Account.id}`} className="hover:bg-gray-50">
                                  <TableCell className="font-medium pl-16">{grade2Account.code}</TableCell>
                                  <TableCell>{grade2Account.name}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge className={getAccountTypeInfo(grade2Account.accountFunction).className}>
                                      {getAccountTypeInfo(grade2Account.accountFunction).label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">{formatNumber(grade2Account.debitBalance || 0)}</TableCell>
                                  <TableCell className="text-right">{formatNumber(grade2Account.creditBalance || 0)}</TableCell>
                                  <TableCell className="text-right">{formatNumber(grade2Account.balance || 0)}</TableCell>
                                  <TableCell>
                                    <div className="flex justify-end space-x-2">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="icon"
                                              onClick={() => handleEditAccount(grade2Account)}
                                            >
                                              <Pencil className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Editează cont</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="icon"
                                              onClick={() => handleDeleteAccount(grade2Account)}
                                            >
                                              <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Șterge cont</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                              
                            </Fragment>
                          );
                        })}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Account form dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedAccount ? "Editează cont" : "Adaugă cont nou"}
            </DialogTitle>
            <DialogDescription>
              {selectedAccount 
                ? "Modifică informațiile contului existent în planul de conturi" 
                : "Creează un cont analitic nou în planul de conturi"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmitAccount)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              {/* Cont părinte sintetic mutat în partea de sus */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="parentAccount">Cont părinte sintetic <span className="text-red-500">*</span></Label>
                <div className="flex items-center space-x-2">
                  <div className="flex-grow">
                    <Input 
                      type="hidden" 
                      {...register("parentId", { 
                        required: "Selectarea unui cont părinte sintetic este obligatorie"
                      })}
                      value={selectedParentId}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setIsParentPickerOpen(true)}
                    >
                      {selectedParentName}
                    </Button>
                  </div>
                </div>
                {errors.parentId && (
                  <p className="text-sm text-red-500">{errors.parentId.message?.toString()}</p>
                )}
                <p className="text-xs text-gray-500">
                  În sistemul contabil românesc, un cont analitic trebuie să fie asociat unui cont sintetic părinte
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code">Cod cont <span className="text-red-500">*</span></Label>
                <Input 
                  id="code" 
                  key={`code-input-${selectedParentId}`}
                  placeholder="Subcod (ex. 1, 2, 3)" 
                  {...register("code", { 
                    required: "Codul contului este obligatoriu",
                    validate: {
                      validFormat: (value) => {
                        // Verificăm dacă e un subcod valid (doar cifre sau cifre cu punct)
                        return /^[0-9]+(\.[0-9]+)*$/.test(value) || "Codul trebuie să conțină doar cifre și puncte";
                      }
                    }
                  })}
                />
                {errors.code && (
                  <p className="text-sm text-red-500">
                    {typeof errors.code.message === 'string' ? errors.code.message : "Codul contului este obligatoriu"}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {selectedParentName ? (
                    <>
                      Codul complet va fi: <span className="font-medium">
                        {syntheticAccounts?.find(acc => acc.id === selectedParentId)?.code}.{watch("code") || '...'}
                      </span>
                    </>
                  ) : (
                    "Introdu doar subcodul (ex: 1, 2, etc). Codul complet va fi format automat din codul părinte.subcod (ex: 401.1)"
                  )}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Denumire <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  placeholder="Denumire cont" 
                  {...register("name", { required: "Denumirea contului este obligatorie" })}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">
                    {typeof errors.name.message === 'string' ? errors.name.message : "Denumirea contului este obligatorie"}
                  </p>
                )}
              </div>
              
              {/* Înlocuim selectul de tip cont cu un câmp read-only - tipul se moștenește de la părinte */}
              <div className="space-y-2">
                <Label htmlFor="accountFunction">Tip cont</Label>
                <div className="border rounded-md px-3 py-2 text-sm bg-gray-50">
                  {/* Afișăm tipul contului părinte - acesta va fi moștenit automat */}
                  {selectedParentId && selectedParentId !== "none" && syntheticAccounts ? (
                    getAccountTypeInfo(
                      syntheticAccounts.find(acc => acc.id === selectedParentId)?.accountFunction || "P"
                    ).label
                  ) : (
                    "Se va moșteni de la contul părinte"
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Tipul contului este moștenit de la contul părinte și nu poate fi modificat
                </p>
                <input 
                  type="hidden" 
                  {...register("accountFunction")} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="classId">Clasa</Label>
                <input type="hidden" {...register("classId")} />
                <Select 
                  key={`class-selector-${selectedParentId}`}
                  defaultValue={selectedAccount?.classId || activeClass} 
                  onValueChange={(value) => {
                    setValue("classId", value);
                    setActiveClass(value);
                  }}
                >
                  <SelectTrigger id="classId">
                    <SelectValue placeholder="Selectează clasa contului" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountClasses?.map(accountClass => (
                      <SelectItem key={accountClass.id} value={accountClass.code}>
                        Clasa {accountClass.code} - {accountClass.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Descriere (opțional)</Label>
                <Input 
                  id="description" 
                  placeholder="Descriere cont"
                  {...register("description")}
                />
              </div>
              
              <div className="flex items-center space-x-2 col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register("isActive")}
                    defaultChecked={selectedAccount?.isActive !== false}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isActive">Cont activ</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAccountDialogOpen(false)}
              >
                Anulează
              </Button>
              <Button type="submit">
                {selectedAccount ? "Salvează modificări" : "Creează cont"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Parent account selection dialog */}
      <Dialog open={isParentPickerOpen} onOpenChange={setIsParentPickerOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Selectează cont părinte</DialogTitle>
            <DialogDescription>
              Selectează contul sintetic părinte pentru contul analitic
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Caută cont părinte după cod sau denumire..."
                value={parentSearchTerm}
                onChange={(e) => setParentSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="h-[300px] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Cod</TableHead>
                    <TableHead>Denumire</TableHead>
                    <TableHead className="w-16 text-center">Tip</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Eliminăm opțiunea "Fără cont părinte" conform standardelor românești */}
                  {/* Conturile analitice trebuie mereu să aibă un părinte */}
                  
                  {/* Available parent accounts */}
                  {isLoadingAllAccounts ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-gray-500 rounded-full"></div>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">Se încarcă conturi...</div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Filter synthetic accounts by search term
                    syntheticAccounts
                      ?.filter(account => 
                        account.code.toLowerCase().includes(parentSearchTerm.toLowerCase()) || 
                        account.name.toLowerCase().includes(parentSearchTerm.toLowerCase())
                      )
                      .map(account => (
                        <TableRow 
                          key={account.id} 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => selectParentAccount(account.id, `${account.code} - ${account.name}`)}
                        >
                          <TableCell>{account.code}</TableCell>
                          <TableCell>{account.name}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={getAccountTypeInfo(account.accountFunction).className}>
                              {getAccountTypeInfo(account.accountFunction).label.charAt(0)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => selectParentAccount(account.id, `${account.code} - ${account.name}`)}
                            >
                              Selectează
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsParentPickerOpen(false)}
            >
              Anulează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}