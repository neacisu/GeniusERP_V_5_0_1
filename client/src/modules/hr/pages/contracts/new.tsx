import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import HrLayout from '../../components/layout/HrLayout';
import ContractForm from '../../components/forms/ContractForm';
import { useHrApi } from '../../hooks/useHrApi';
import { EmploymentContract } from '../../types';

/**
 * New Contract Page Component
 * 
 * Form page for creating a new employment contract
 */
const NewContractPage: React.FC = () => {
  const [pathname, navigate] = useLocation();
  
  // Extract employee ID from URL if present as a query parameter
  const searchParams = new URLSearchParams(window.location.search);
  const employeeId = searchParams.get('employeeId') || undefined;
  
  // Use API hooks
  const { useCreateContract, useEmployee } = useHrApi();
  
  // Fetch employee data if ID is provided
  const { data: employeeResponse } = useEmployee(employeeId || '');
  const employee = employeeResponse?.data;
  
  // Create mutation for new contract
  const { 
    mutate: createContract, 
    isLoading: isCreatingContract,
    isError,
    error
  } = useCreateContract();
  
  // Handle form submission
  const handleSubmit = (data: Partial<EmploymentContract>) => {
    createContract(data, {
      onSuccess: (response) => {
        if (response.success && response.data) {
          // Navigate to contract details page
          navigate(`/hr/contracts/${response.data.id}`);
        }
      }
    });
  };
  
  // Build subtitle based on employee data
  const subtitle = employee
    ? `Contract nou pentru ${employee.firstName} ${employee.lastName}`
    : 'Completați datele pentru noul contract';
  
  return (
    <HrLayout 
      activeTab="new" 
      title="Adaugă contract nou" 
      subtitle={subtitle}
    >
      <div className="max-w-4xl mx-auto">
        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
            <p className="font-medium">Eroare la adăugarea contractului</p>
            <p className="text-sm">{(error as Error).message}</p>
          </div>
        )}
        
        <ContractForm 
          employeeId={employeeId || undefined}
          onSubmit={handleSubmit}
          isSubmitting={isCreatingContract}
        />
      </div>
    </HrLayout>
  );
};

export default NewContractPage;