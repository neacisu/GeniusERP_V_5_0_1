import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { 
  UserCog,
  FileText, 
  Calendar, 
  DollarSign, 
  ChevronLeft, 
  Edit,
  Trash2,
  FileUp,
  CalendarPlus,
  Building2,
  FilePlus,
  Mail,
  Phone,
  FileCheck
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import HrLayout from '../../components/layout/HrLayout';
import ContractCard from '../../components/cards/ContractCard';
import { useHrApi } from '../../hooks/useHrApi';
import { formatDate, getEmployeeStatusColor, calculateAge } from '../../utils/helpers';

/**
 * Employee Detail Page Component
 * 
 * Detailed view of an employee with tabs for different data sections
 */
const EmployeeDetailPage: React.FC = () => {
  const [pathname] = useLocation();
  
  // Extract employee ID from URL
  const employeeId = pathname.split('/')[3];
  
  // State for active tab
  const [activeTab, setActiveTab] = useState("overview");
  
  // Use API hooks
  const { 
    useEmployee, 
    useEmployeeContracts, 
    useEmployeePayroll, 
    useDepartment,
    useEmployeeAbsences,
    useUpdateEmployee
  } = useHrApi();
  
  // Fetch employee data
  const { 
    data: employeeResponse, 
    isLoading: isLoadingEmployee,
    isError: isEmployeeError,
    error: employeeError
  } = useEmployee(employeeId);
  
  const employee = employeeResponse?.data;
  
  // Fetch additional data based on employee
  const { data: contractsResponse } = useEmployeeContracts(employeeId);
  const contracts = contractsResponse?.data || [];
  
  const { data: departmentResponse } = useDepartment(employee?.departmentId || '');
  const department = departmentResponse?.data;
  
  const { data: absencesResponse } = useEmployeeAbsences(employeeId);
  const absences = absencesResponse?.data || [];
  
  // Update employee mutation
  const { 
    mutate: updateEmployee, 
    isLoading: isUpdatingEmployee
  } = useUpdateEmployee();
  
  // Handle status toggle
  const handleToggleStatus = () => {
    if (!employee) return;
    
    updateEmployee({
      id: employee.id,
      data: {
        isActive: !employee.isActive
      }
    });
  };
  
  // Loading state
  if (isLoadingEmployee) {
    return (
      <HrLayout 
        activeTab="overview" 
        title="Detalii angajat" 
        subtitle="Se încarcă..."
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Se încarcă detaliile angajatului...</p>
        </div>
      </HrLayout>
    );
  }
  
  // Error state
  if (isEmployeeError || !employee) {
    return (
      <HrLayout 
        activeTab="overview" 
        title="Eroare" 
        subtitle="Nu s-au putut încărca detaliile angajatului"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">
                {(employeeError as Error)?.message || 'Angajatul nu a fost găsit'}
              </p>
              <Button asChild>
                <Link href="/hr/employees">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Înapoi la lista de angajați
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </HrLayout>
    );
  }
  
  // Build employee name
  const fullName = `${employee.firstName} ${employee.lastName}`;
  
  // Calculate age if birth date exists
  const age = employee.birthDate ? calculateAge(employee.birthDate) : null;
  
  return (
    <HrLayout 
      activeTab="details" 
      title={fullName}
      subtitle={`Detalii angajat - ${employee.position}`}
    >
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href="/hr">
              Personal & HR
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href="/hr/employees">
              Angajați
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{fullName}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Employee Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24 border">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`} />
              <AvatarFallback>{employee.firstName[0]}{employee.lastName[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold">{fullName}</h2>
                  <p className="text-muted-foreground">{employee.position}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge className={getEmployeeStatusColor(employee.isActive)}>
                    {employee.isActive ? 'Activ' : 'Inactiv'}
                  </Badge>
                  
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/hr/employees/${employee.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editează
                    </Link>
                  </Button>
                  
                  <Button 
                    variant={employee.isActive ? "destructive" : "outline"} 
                    size="sm"
                    onClick={handleToggleStatus}
                    disabled={isUpdatingEmployee}
                  >
                    {employee.isActive ? (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Dezactivează
                      </>
                    ) : (
                      <>
                        <FileCheck className="mr-2 h-4 w-4" />
                        Activează
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
                    {employee.email}
                  </a>
                </div>
                
                {employee.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a href={`tel:${employee.phone}`} className="hover:underline">
                      {employee.phone}
                    </a>
                  </div>
                )}
                
                {department && (
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{department.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <UserCog className="mr-2 h-4 w-4" />
            Prezentare generală
          </TabsTrigger>
          <TabsTrigger value="contracts">
            <FileText className="mr-2 h-4 w-4" />
            Contracte {contracts.length > 0 && `(${contracts.length})`}
          </TabsTrigger>
          <TabsTrigger value="payroll">
            <DollarSign className="mr-2 h-4 w-4" />
            Salarizare
          </TabsTrigger>
          <TabsTrigger value="absences">
            <Calendar className="mr-2 h-4 w-4" />
            Absențe {absences.length > 0 && `(${absences.length})`}
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informații personale</CardTitle>
                <CardDescription>Detalii generale despre angajat</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CNP</p>
                    <p>{employee.cnp || 'Nedefinit'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Serie și număr CI</p>
                    <p>{employee.idSeriesNumber || 'Nedefinit'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data nașterii</p>
                    <p>{employee.birthDate ? formatDate(employee.birthDate) : 'Nedefinit'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Vârstă</p>
                    <p>{age !== null ? `${age} ani` : 'Nedefinit'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Naționalitate</p>
                    <p>{employee.nationality || 'Nedefinit'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Locul nașterii</p>
                    <p>{employee.birthPlace || 'Nedefinit'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Contact Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informații de contact</CardTitle>
                <CardDescription>Date de contact și adresă</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email personal</p>
                    <p>{employee.personalEmail || 'Nedefinit'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Telefon personal</p>
                    <p>{employee.personalPhone || 'Nedefinit'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Adresă</p>
                    <p>{employee.address || 'Nedefinit'}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Oraș</p>
                      <p>{employee.city || 'Nedefinit'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Județ</p>
                      <p>{employee.county || 'Nedefinit'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cod poștal</p>
                      <p>{employee.postalCode || 'Nedefinit'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Employment Information Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Informații angajare</CardTitle>
                <CardDescription>Detalii despre angajare și departament</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Funcție</p>
                    <p>{employee.position}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Departament</p>
                    <p>{department?.name || 'Nedefinit'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p>{employee.isActive ? 'Activ' : 'Inactiv'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data angajării</p>
                    <p>{formatDate(employee.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Contracte</h3>
            <Button asChild>
              <Link href={`/hr/contracts/new?employeeId=${employee.id}`}>
                <FilePlus className="mr-2 h-4 w-4" />
                Contract nou
              </Link>
            </Button>
          </div>
          
          {contracts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {contracts.map((contract: any) => (
                <ContractCard 
                  key={contract.id} 
                  contract={contract}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
                <p className="text-xl font-medium mb-2">Nu există contracte</p>
                <p className="text-muted-foreground text-center mb-6">
                  Angajatul nu are niciun contract înregistrat
                </p>
                <Button asChild>
                  <Link href={`/hr/contracts/new?employeeId=${employee.id}`}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Adaugă contract
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Istoric salarizare</h3>
            <Button disabled>
              <DollarSign className="mr-2 h-4 w-4" />
              Procesează salariu
            </Button>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
              <p className="text-xl font-medium mb-2">Nu există date de salarizare</p>
              <p className="text-muted-foreground text-center">
                Istoricul de salarizare va fi disponibil după primul proces de salarizare
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Absences Tab */}
        <TabsContent value="absences" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Absențe</h3>
            <Button asChild>
              <Link href={`/hr/absences/new?employeeId=${employee.id}`}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Absență nouă
              </Link>
            </Button>
          </div>
          
          {absences.length > 0 ? (
            <div className="border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Tip</th>
                    <th className="text-left p-3">Perioada</th>
                    <th className="text-left p-3">Zile</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {absences.map((absence: any) => (
                    <tr key={absence.id} className="border-b">
                      <td className="p-3">{absence.absenceType}</td>
                      <td className="p-3">
                        {formatDate(absence.startDate)} - {formatDate(absence.endDate)}
                      </td>
                      <td className="p-3">{absence.workingDays}</td>
                      <td className="p-3">
                        <Badge className={
                          absence.status === 'approved' ? 'bg-green-100 text-green-800' :
                          absence.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {absence.status === 'approved' ? 'Aprobat' :
                           absence.status === 'rejected' ? 'Respins' : 'În așteptare'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/hr/absences/${absence.id}`}>
                            Detalii
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
                <p className="text-xl font-medium mb-2">Nu există absențe</p>
                <p className="text-muted-foreground text-center mb-6">
                  Angajatul nu are nicio absență înregistrată
                </p>
                <Button asChild>
                  <Link href={`/hr/absences/new?employeeId=${employee.id}`}>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Înregistrează absență
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </HrLayout>
  );
};

export default EmployeeDetailPage;