import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import HrLayout from '../../components/layout/HrLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ContractForm from '../../components/forms/ContractForm';
import { useHrApi } from '../../hooks/useHrApi';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Contract Details Page Component
 * 
 * Pagină pentru vizualizarea și editarea detaliilor unui contract de muncă
 * existant sau pentru crearea unui contract nou.
 */
const ContractDetailsPage: React.FC = () => {
  const params = useParams();
  const contractId = params['id'];
  const isNewContract = !contractId;
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Folosește hook-urile API pentru HR
  const { 
    useContract,
    useUpdateContract,
    useCreateContract 
  } = useHrApi();
  
  // Obține datele contractului dacă există un ID
  const { 
    data: contractResponse, 
    isLoading: isLoadingContract,
    error: contractError 
  } = useContract(contractId || '');
  
  // Mutații pentru actualizare/creare contract - folosim corect hook-urile
  const { mutate: updateContract } = useUpdateContract?.() || { mutate: async () => {} };
  const { mutate: createContract } = useCreateContract?.() || { mutate: async () => {} };
  
  // Extrage datele contractului
  const contract = contractResponse?.data;
  
  // Handler pentru trimiterea formularului
  const handleSubmit = (data: any) => {
    setIsSubmitting(true);
    setError(null);
    
    if (isNewContract) {
      // Creare contract nou
      createContract(data, {
        onSuccess: (response) => {
          setIsSubmitting(false);
          // Redirecționare către pagina de contracte după creare cu succes
          navigate('/hr/contracts');
        },
        onError: (err: any) => {
          setIsSubmitting(false);
          setError(err.message || 'A apărut o eroare la crearea contractului.');
        }
      });
    } else {
      // Actualizare contract existent
      updateContract({
        id: contractId,
        data
      }, {
        onSuccess: (response: any) => {
          setIsSubmitting(false);
          // Redirecționare către pagina de contracte după actualizare cu succes
          navigate('/hr/contracts');
        },
        onError: (err: any) => {
          setIsSubmitting(false);
          setError(err.message || 'A apărut o eroare la actualizarea contractului.');
        }
      });
    }
  };

  // Build subtitle based on employee data when available
  const subtitle = contract
    ? `Contract pentru ${contract.employeeName || 'angajat'}`
    : isNewContract
      ? "Creați un contract nou"
      : `ID contract: ${contractId}`;

  return (
    <HrLayout
      activeTab="contracts"
      title={isNewContract ? "Contract nou" : "Detalii contract"}
      subtitle={subtitle}
    >
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/hr/contracts')}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Înapoi la contracte
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Eroare</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isNewContract ? "Contract nou" : "Detalii contract"}</CardTitle>
          <CardDescription>
            {isNewContract 
              ? "Introduceți informațiile pentru noul contract" 
              : "Vizualizare și editare informații contract"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingContract ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Se încarcă datele contractului...</span>
            </div>
          ) : contractError ? (
            <Alert variant="destructive">
              <AlertTitle>Nu s-a putut încărca contractul</AlertTitle>
              <AlertDescription>
                {contractError instanceof Error ? contractError.message : 'A apărut o eroare la încărcarea datelor.'}
              </AlertDescription>
            </Alert>
          ) : (
            <ContractForm
              onSubmit={handleSubmit}
              initialData={contract}
              isSubmitting={isSubmitting}
            />
          )}
        </CardContent>
      </Card>
    </HrLayout>
  );
};

export default ContractDetailsPage;