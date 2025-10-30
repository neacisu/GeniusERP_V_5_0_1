/**
 * Pagină pentru adăugarea unui angajat nou
 * 
 * Implementează un flux complet de adăugare angajat conform cerințelor:
 * - Legislației muncii din România
 * - Cerințelor ANAF pentru raportare
 * - Standardelor Revisal pentru registrul de evidență a salariaților
 * - GDPR și legislației privind protecția datelor personale
 */

import React from 'react';
import { useLocation } from 'wouter';
import HrLayout from '../../../components/layout/HrLayout';
import EmployeeForm from '../../../components/forms/EmployeeForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useHrApi } from '../../../hooks/useHrApi';

const NewEmployeePage: React.FC = () => {
  const [_, navigate] = useLocation();
  
  // Hook-uri pentru API-ul HR
  const { useCreateEmployee } = useHrApi();
  
  // Mutație pentru crearea unui angajat nou
  const { 
    mutate: createEmployee, 
    isPending: isCreatingEmployee,
    isError,
    error
  } = useCreateEmployee();
  
  // Handler pentru trimiterea formularului
  const handleSubmit = (data: any) => {
    createEmployee(data, {
      onSuccess: (response) => {
        if (response.success && response.data) {
          // Navighează către pagina de detalii angajat
          navigate(`/hr/employees/${response.data.id}`);
          
          // Alternativ, poate fi direcționat către crearea unui contract nou pentru acest angajat
          // navigate(`/hr/contracts/new?employeeId=${response.data.id}`);
        }
      }
    });
  };
  
  return (
    <HrLayout 
      activeTab="employees" 
      title="Adaugă angajat nou" 
      subtitle="Completați datele pentru noul angajat conform cerințelor ANAF și Revisal"
    >
      <div className="max-w-5xl mx-auto">
        {isError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Eroare la adăugarea angajatului</AlertTitle>
            <AlertDescription>
              {(error as Error)?.message || 'A apărut o eroare neașteptată. Vă rugăm să încercați din nou.'}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-4 mb-6">
          <h4 className="text-sm font-medium">Informații importante:</h4>
          <p className="text-sm mt-1">
            Pentru a înregistra un angajat nou, aveți nevoie de următoarele informații:
          </p>
          <ul className="list-disc list-inside text-sm mt-1">
            <li>Date personale (nume, prenume, CNP, etc.)</li>
            <li>Cod COR valid pentru funcția angajatului</li>
            <li>Departament și poziție în cadrul companiei</li>
          </ul>
          <p className="text-sm mt-1">
            După crearea angajatului, va trebui să adăugați un contract de muncă pentru acesta în secțiunea de contracte.
          </p>
        </div>
        
        <EmployeeForm 
          onSubmit={handleSubmit}
          isSubmitting={isCreatingEmployee}
        />
      </div>
    </HrLayout>
  );
};

export default NewEmployeePage;