/**
 * HR Employee Dialog
 * 
 * Dialog modal pentru adăugarea sau editarea unui angajat.
 * Utilizează EmployeeForm pentru a prelua și valida datele angajatului.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import EmployeeForm from '../forms/EmployeeForm';
import { useLocation } from 'wouter';
import { useHrApi } from '../../hooks/useHrApi';

interface EmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: string; // Dacă este furnizat, dialogul este pentru editare
}

const EmployeeDialog: React.FC<EmployeeDialogProps> = ({ 
  isOpen, 
  onClose,
  employeeId 
}) => {
  const [_, navigate] = useLocation();
  const isEditMode = !!employeeId;
  
  // Hook-uri pentru API
  const { 
    useEmployee, 
    useCreateEmployee,
    useUpdateEmployee 
  } = useHrApi();
  
  // Obținere date angajat pentru editare
  const { 
    data: employeeResponse, 
    isLoading: isLoadingEmployee 
  } = useEmployee(employeeId || '');
  
  // Mutații pentru creare și actualizare
  const { 
    mutate: createEmployee, 
    isPending: isCreatingEmployee 
  } = useCreateEmployee();
  
  const { 
    mutate: updateEmployee, 
    isPending: isUpdatingEmployee 
  } = useUpdateEmployee();
  
  // Obținere date angajat pentru editare
  const employeeData = employeeResponse?.data;
  
  // Handler pentru trimiterea formularului
  const handleSubmit = (data: any) => {
    if (isEditMode && employeeId) {
      // Actualizare angajat existent
      updateEmployee(
        { id: employeeId, data },
        {
          onSuccess: (response) => {
            onClose();
            if (response.success && response.data) {
              // Navighează către pagina de detalii angajat după salvare
              navigate(`/hr/employees/${response.data.id}`);
            }
          }
        }
      );
    } else {
      // Creare angajat nou
      createEmployee(data, {
        onSuccess: (response) => {
          onClose();
          if (response.success && response.data) {
            // Navighează către pagina de detalii angajat
            navigate(`/hr/employees/${response.data.id}`);
          }
        }
      });
    }
  };
  
  // Determinare titlu și descriere dialog
  const dialogTitle = isEditMode ? 'Editare angajat' : 'Adăugare angajat nou';
  const dialogDescription = isEditMode 
    ? 'Modificați informațiile angajatului' 
    : 'Completați informațiile pentru noul angajat';
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingEmployee && isEditMode ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Se încarcă datele angajatului...</p>
          </div>
        ) : (
          <EmployeeForm
            defaultValues={employeeData}
            onSubmit={handleSubmit}
            isSubmitting={isCreatingEmployee || isUpdatingEmployee}
            isEditMode={isEditMode}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

// Componentă pentru deschiderea dialogului
export const AddEmployeeButton: React.FC<{
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}> = ({ 
  variant = "default", 
  size = "default",
  className = ""
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <>
      <Button 
        variant={variant} 
        size={size}
        className={className}
        onClick={() => setIsOpen(true)}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Angajat nou
      </Button>
      
      {isOpen && (
        <EmployeeDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default EmployeeDialog;