import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useSearch } from 'wouter';
import HrLayout from '../../components/layout/HrLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import AbsenceForm from '../../components/forms/AbsenceForm';
import { useHrApi } from '../../hooks/useHrApi';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

/**
 * Pagina de detalii pentru absențe
 * 
 * Permite vizualizarea, adăugarea și editarea absențelor
 * Gestionează atât crearea de absențe noi, cât și editarea celor existente.
 */
const AbsenceDetailsPage: React.FC = () => {
  const params = useParams();
  const absenceId = params['id'];
  const isNewAbsence = !absenceId;
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearch();
  const queryParams = new URLSearchParams(searchParams);
  
  // Preluăm employee ID din query string dacă există
  const defaultEmployeeId = queryParams.get('employeeId') || undefined;
  
  // Folosim API-urile HR
  const { 
    useAbsence, 
    useCreateAbsence, 
    useUpdateAbsence 
  } = useHrApi();
  
  // Obținem datele absenței dacă este o absență existentă
  const { 
    data: absenceResponse, 
    isLoading: isLoadingAbsence,
    isError: isErrorAbsence,
    refetch: refetchAbsence,
  } = useAbsence(absenceId || '');
  
  // Preluăm absența curentă
  const absence = absenceResponse?.data;
  
  // Mutații pentru creare și actualizare
  const { mutate: createAbsence } = useCreateAbsence();
  const { mutate: updateAbsence } = useUpdateAbsence();
  
  // Gestionăm trimiterea formularului
  const handleSubmit = (data: any) => {
    setIsSubmitting(true);
    
    if (isNewAbsence) {
      createAbsence(data, {
        onSuccess: () => {
          setIsSubmitting(false);
          navigate('/hr/absences');
        },
        onError: () => {
          setIsSubmitting(false);
        }
      });
    } else if (absenceId) {
      updateAbsence(
        { id: absenceId, data },
        {
          onSuccess: () => {
            setIsSubmitting(false);
            refetchAbsence();
          },
          onError: () => {
            setIsSubmitting(false);
          }
        }
      );
    }
  };
  
  // Pregătim datele inițiale pentru formular dacă este o absență existentă
  const getFormInitialData = () => {
    if (!absence) return undefined;
    
    return {
      id: absence.id,
      employeeId: absence.employeeId,
      absenceType: absence.absenceType,
      absenceCode: absence.absenceCode || '',
      medicalLeaveCode: absence.medicalLeaveCode || '',
      startDate: new Date(absence.startDate),
      endDate: new Date(absence.endDate),
      workingDays: typeof absence.workingDays === 'string' 
        ? parseFloat(absence.workingDays) 
        : absence.workingDays,
      status: absence.status,
      notes: absence.notes || '',
      medicalCertificateNumber: absence.medicalCertificateNumber || '',
      medicalCertificateDate: absence.medicalCertificateDate 
        ? new Date(absence.medicalCertificateDate) 
        : undefined,
      medicalCertificateIssuedBy: absence.medicalCertificateIssuedBy || '',
      approvedBy: absence.approvedBy,
      approvedAt: absence.approvedAt,
      rejectionReason: absence.rejectionReason,
      createdAt: absence.createdAt,
      updatedAt: absence.updatedAt
    };
  };

  return (
    <HrLayout
      activeTab="absences"
      title={isNewAbsence ? "Absență nouă" : absence?.employeeName || "Detalii absență"}
      subtitle={isNewAbsence 
        ? "Înregistrați o nouă absență în sistem" 
        : absence ? `${format(new Date(absence.startDate), "dd MMM yyyy", { locale: ro })} - ${format(new Date(absence.endDate), "dd MMM yyyy", { locale: ro })}` : "Se încarcă..."}
    >
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/hr/absences')}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Înapoi la absențe
        </Button>
      </div>
      
      {/* Afișăm alertă în caz de eroare */}
      {isErrorAbsence && !isNewAbsence && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Eroare la încărcarea absenței</AlertTitle>
          <AlertDescription>
            Nu s-au putut încărca informațiile absenței. Încercați să reîmprospătați pagina sau contactați administratorul.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isNewAbsence ? "Absență nouă" : "Detalii absență"}</CardTitle>
          <CardDescription>
            {isNewAbsence 
              ? "Introduceți informațiile pentru absența nouă" 
              : "Vizualizare și editare informații absență"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAbsence && !isNewAbsence ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <AbsenceForm 
              onSubmit={handleSubmit}
              initialData={isNewAbsence ? undefined : getFormInitialData()}
              isSubmitting={isSubmitting}
              defaultEmployeeId={defaultEmployeeId}
            />
          )}
        </CardContent>
      </Card>
    </HrLayout>
  );
};

export default AbsenceDetailsPage;