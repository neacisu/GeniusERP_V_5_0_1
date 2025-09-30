import React from 'react';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from "@/components/ui/card";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Mail, 
  Phone, 
  FileText, 
  Calendar, 
  DollarSign, 
  ExternalLink,
  Briefcase 
} from 'lucide-react';
import { Employee } from '../../types';
import { formatDate, getEmployeeStatusColor } from '../../utils/helpers';

interface EmployeeCardProps {
  employee: Employee;
  compact?: boolean;
  actionButtons?: React.ReactNode;
}

/**
 * Employee Card Component
 * 
 * Displays employee information in a card format with optional action buttons
 */
const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  compact = false,
  actionButtons
}) => {
  // Generate employee avatar fallback from initials
  const getInitials = () => {
    return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`;
  };
  
  // Extract department name if available
  const departmentName = employee.department || 'Nedefinit';
  
  // Get full name
  const fullName = `${employee.firstName} ${employee.lastName}`;
  
  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold leading-none">{fullName}</h3>
              <div className="flex items-center mt-1 text-sm text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5 mr-1" />
                <span>{employee.position}</span>
              </div>
            </div>
          </div>
          <Badge className={getEmployeeStatusColor(employee.isActive)}>
            {employee.isActive ? 'Activ' : 'Inactiv'}
          </Badge>
        </div>
      </CardHeader>
      
      {!compact && (
        <CardContent className="pb-3">
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{departmentName}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
                {employee.email}
              </a>
            </div>
            
            {employee.phone && (
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <a href={`tel:${employee.phone}`} className="hover:underline">
                  {employee.phone}
                </a>
              </div>
            )}

            {employee.cnp && (
              <div className="flex items-center text-sm">
                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>CNP: {employee.cnp}</span>
              </div>
            )}
            
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Angajat din: {formatDate(employee.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      )}
      
      <CardFooter className={`${!compact ? 'pt-0' : ''} flex justify-between`}>
        {actionButtons || (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              asChild
            >
              <Link href={`/hr/employees/${employee.id}`}>
                <span className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Detalii
                </span>
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              asChild
            >
              <Link href={`/hr/contracts?employeeId=${employee.id}`}>
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Contracte
                </span>
              </Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default EmployeeCard;