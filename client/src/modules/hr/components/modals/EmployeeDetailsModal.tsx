import React from 'react';
import { Link } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Building2, 
  FileText,
  Edit
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Employee, Department } from '../../types';
import { useHrApi } from '../../hooks/useHrApi';
import { formatDate, getEmployeeStatusColor, calculateAge } from '../../utils/helpers';

interface EmployeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
}

/**
 * Employee details modal component
 * Shows detailed information about an employee
 */
const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
  isOpen,
  onClose,
  employeeId
}) => {
  // Use HR API to fetch employee data
  const { useEmployee, useDepartment } = useHrApi();
  
  // Fetch employee data
  const { 
    data: employeeResponse, 
    isLoading: isLoadingEmployee,
    isError: isEmployeeError
  } = useEmployee(employeeId);
  
  const employee = employeeResponse?.data;
  
  // Fetch department if available
  const { data: departmentResponse } = useDepartment(employee?.departmentId || '');
  const department = departmentResponse?.data;
  
  // Calculate age if birth date exists
  const age = employee?.birthDate ? calculateAge(employee.birthDate) : null;
  
  // Build employee name for display
  const fullName = employee ? `${employee.firstName} ${employee.lastName}` : '';
  
  // Get avatar initials
  const getInitials = () => {
    return employee ? `${employee.firstName[0]}${employee.lastName[0]}` : '';
  };

  // Handle loading and error states
  if (isLoadingEmployee) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Se încarcă detaliile angajatului</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-muted-foreground">Se încarcă informațiile...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isEmployeeError || !employee) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eroare</DialogTitle>
            <DialogDescription>
              Nu s-au putut încărca detaliile angajatului
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-red-600">Angajatul nu a fost găsit sau a apărut o eroare</p>
          </div>
          <DialogFooter>
            <Button onClick={onClose}>Închide</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalii angajat</DialogTitle>
          <DialogDescription>
            Informații complete despre angajat
          </DialogDescription>
        </DialogHeader>
        
        {/* Employee Basic Info */}
        <div className="flex items-start gap-4 pt-2">
          <Avatar className="h-16 w-16 border">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h3 className="text-lg font-semibold">{fullName}</h3>
              <Badge className={getEmployeeStatusColor(employee.isActive)}>
                {employee.isActive ? 'Activ' : 'Inactiv'}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span>{employee.position}</span>
              </div>
              
              {department && (
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  <span>{department.name}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
                  {employee.email}
                </a>
              </div>
              
              {employee.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <a href={`tel:${employee.phone}`} className="hover:underline">
                    {employee.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Employee Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div>
            <h4 className="text-sm font-medium mb-2">Informații personale</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">CNP:</span>{' '}
                <span>{employee.cnp || 'Nedefinit'}</span>
              </div>
              
              <div>
                <span className="text-muted-foreground">Data nașterii:</span>{' '}
                <span>{employee.birthDate ? formatDate(employee.birthDate) : 'Nedefinit'}</span>
              </div>
              
              {age !== null && (
                <div>
                  <span className="text-muted-foreground">Vârstă:</span>{' '}
                  <span>{age} ani</span>
                </div>
              )}
              
              <div>
                <span className="text-muted-foreground">Naționalitate:</span>{' '}
                <span>{employee.nationality || 'Nedefinit'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Adresă</h4>
            <div className="space-y-2 text-sm">
              {employee.address && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                  <div>
                    <p>{employee.address}</p>
                    {(employee.city || employee.county) && (
                      <p>
                        {employee.city}{employee.city && employee.county ? ', ' : ''}
                        {employee.county}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {!employee.address && (
                <p className="text-muted-foreground">Adresă nedefinită</p>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Informații angajare</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Data angajării:</span>{' '}
                <span>{formatDate(employee.createdAt)}</span>
              </div>
              
              <div>
                <span className="text-muted-foreground">Status angajat:</span>{' '}
                <span>{employee.isActive ? 'Activ' : 'Inactiv'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Contact personal</h4>
            <div className="space-y-2 text-sm">
              {employee.personalEmail && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <a href={`mailto:${employee.personalEmail}`} className="text-blue-600 hover:underline">
                    {employee.personalEmail}
                  </a>
                </div>
              )}
              
              {employee.personalPhone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <a href={`tel:${employee.personalPhone}`} className="hover:underline">
                    {employee.personalPhone}
                  </a>
                </div>
              )}
              
              {!employee.personalEmail && !employee.personalPhone && (
                <p className="text-muted-foreground">Nu există informații de contact personale</p>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:space-x-2">
          <Button 
            variant="outline"
            asChild
          >
            <Link href={`/hr/contracts/new?employeeId=${employee.id}`}>
              <FileText className="mr-2 h-4 w-4" />
              Contract nou
            </Link>
          </Button>
          
          <Button 
            variant="outline"
            asChild
          >
            <Link href={`/hr/employees/${employee.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editează
            </Link>
          </Button>
          
          <Button 
            variant="default"
            asChild
          >
            <Link href={`/hr/employees/${employee.id}`}>
              Detalii complete
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDetailsModal;