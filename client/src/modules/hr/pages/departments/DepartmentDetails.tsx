import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import HrLayout from '../../components/layout/HrLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Building, 
  Users, 
  BriefcaseBusiness, 
  FileText, 
  AlertCircle,
  Check
} from 'lucide-react';
import DepartmentForm from '../../components/forms/DepartmentForm';
import { useHrApi } from '../../hooks/useHrApi';

/**
 * Department Details Page Component
 * 
 * Această pagină afișează detaliile unui departament existent sau permite crearea
 * unui departament nou. Include informații complete despre departament, structura
 * organizațională, buget și angajații asociați.
 */
const DepartmentDetailsPage: React.FC = () => {
  const params = useParams();
  const departmentId = params.id;
  const isNewDepartment = !departmentId;
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Folosim API-urile HR
  const { 
    useDepartment, 
    useCreateDepartment, 
    useUpdateDepartment,
    useEmployees 
  } = useHrApi();

  // Obținem datele departamentului dacă nu este nou
  const { 
    data: departmentResponse, 
    isLoading: isLoadingDepartment,
    isError: isErrorDepartment,
    refetch: refetchDepartment 
  } = useDepartment(departmentId || '');

  // Obținem lista angajaților pentru a afișa cei din departament
  const { data: employeesResponse } = useEmployees();
  const employees = employeesResponse?.data?.items || [];

  // Departamentul curent
  const department = departmentResponse?.data;

  // Angajații din departamentul curent
  const departmentEmployees = employees.filter(
    emp => emp.departmentId === departmentId
  );

  // Mutații pentru creare și actualizare
  const { mutate: createDepartment } = useCreateDepartment();
  const { mutate: updateDepartment } = useUpdateDepartment();

  // Handle submit - diferit pentru create vs update
  const handleSubmit = (data: any) => {
    setIsSubmitting(true);
    
    if (isNewDepartment) {
      createDepartment(data, {
        onSuccess: () => {
          setIsSubmitting(false);
          navigate('/hr/departments');
        },
        onError: () => {
          setIsSubmitting(false);
        }
      });
    } else if (departmentId) {
      updateDepartment(
        { id: departmentId, data },
        {
          onSuccess: () => {
            setIsSubmitting(false);
            refetchDepartment();
            setActiveTab('details'); // Schimbăm tab-ul la detalii după update
          },
          onError: () => {
            setIsSubmitting(false);
          }
        }
      );
    }
  };

  return (
    <HrLayout
      activeTab="departments"
      title={isNewDepartment ? "Departament nou" : department?.name || "Detalii departament"}
      subtitle={isNewDepartment 
        ? "Creați un nou departament în structura organizațională" 
        : `Cod departament: ${department?.code || '...'}`}
    >
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/hr/departments')}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Înapoi la departamente
        </Button>
      </div>

      {/* Afișăm alerte în caz de eroare */}
      {isErrorDepartment && !isNewDepartment && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Eroare la încărcarea departamentului</AlertTitle>
          <AlertDescription>
            Nu s-au putut încărca informațiile departamentului. Încercați să reîmprospătați pagina sau contactați administratorul.
          </AlertDescription>
        </Alert>
      )}

      {/* Departament Nou - Arătăm doar formularul */}
      {isNewDepartment && (
        <Card>
          <CardHeader>
            <CardTitle>Departament nou</CardTitle>
            <CardDescription>
              Introduceți informațiile pentru noul departament
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DepartmentForm 
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      )}

      {/* Departament Existent - Arătăm tabs cu detalii și formular de editare */}
      {!isNewDepartment && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Detalii departament
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Editare departament
            </TabsTrigger>
          </TabsList>

          {/* Tab: Vizualizare Detalii */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informații departament</CardTitle>
                <CardDescription>
                  Detaliile complete ale departamentului
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingDepartment ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-[250px]" />
                    <Skeleton className="h-20 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </div>
                ) : department ? (
                  <>
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Building className="h-5 w-5 text-primary" />
                          {department.name}
                          {department.status === 'ACTIVE' && (
                            <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Activ
                            </span>
                          )}
                          {department.status === 'INACTIVE' && (
                            <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactiv
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Cod departament: {department.code}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab('edit')}
                          className="gap-2"
                        >
                          <Building className="h-4 w-4" />
                          Editează departamentul
                        </Button>
                      </div>
                    </div>

                    {department.description && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-1">Descriere:</h4>
                        <p className="text-sm bg-muted p-3 rounded-md">
                          {department.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Angajați
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {departmentEmployees.length}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Angajați în departament
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <BriefcaseBusiness className="h-4 w-4 text-primary" />
                            Buget alocat
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {department.budgetAllocated?.toLocaleString() || 0} RON
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Buget total alocat
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <BriefcaseBusiness className="h-4 w-4 text-orange-500" />
                            Buget utilizat
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {department.budgetUsed?.toLocaleString() || 0} RON
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {department.budgetAllocated ? 
                              `${Math.min(Math.round((department.budgetUsed || 0) / department.budgetAllocated * 100), 100)}% din buget` : 
                              'Nu există buget alocat'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Angajați în departament */}
                    {departmentEmployees.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Angajați în departament</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {departmentEmployees.map(employee => (
                            <Card key={employee.id}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="font-medium">{employee.lastName} {employee.firstName}</h4>
                                    <p className="text-sm text-muted-foreground">{employee.position}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{employee.email}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/hr/employees/${employee.id}`)}
                                  >
                                    Detalii
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Departament inexistent</AlertTitle>
                    <AlertDescription>
                      Nu s-au găsit informații pentru acest departament.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Editare */}
          <TabsContent value="edit">
            <Card>
              <CardHeader>
                <CardTitle>Editare departament</CardTitle>
                <CardDescription>
                  Modificați informațiile departamentului
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDepartment ? (
                  <div className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : department ? (
                  <DepartmentForm 
                    initialData={department}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                  />
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Departament inexistent</AlertTitle>
                    <AlertDescription>
                      Nu s-au găsit informații pentru acest departament.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </HrLayout>
  );
};

export default DepartmentDetailsPage;