import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  cnp: string;
  department?: string;
  position?: string;
  isActive: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (employee: Employee) => void;
  type?: 'salary' | 'advance' | 'all'; // Tipul de plată
}

export function EmployeeSelectorDialog({ isOpen, onClose, onSelect, type = 'all' }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch employees
  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ['/api/hr/employees', { active: true }],
    enabled: isOpen
  });
  
  const filteredEmployees = employees?.filter((emp) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.fullName?.toLowerCase().includes(searchLower) ||
      emp.cnp?.includes(searchTerm) ||
      emp.department?.toLowerCase().includes(searchLower)
    );
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            👥 Selectează Angajat
          </DialogTitle>
          <DialogDescription>
            {type === 'salary' && 'Selectați angajatul pentru plata salariului'}
            {type === 'advance' && 'Selectați angajatul pentru acordarea avansului'}
            {type === 'all' && 'Selectați angajatul din listă'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Caută după nume, CNP sau departament..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Employees table */}
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2">Se încarcă angajații...</span>
            </div>
          ) : filteredEmployees && filteredEmployees.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Nume Complet</TableHead>
                    <TableHead>CNP</TableHead>
                    <TableHead>Departament</TableHead>
                    <TableHead>Funcție</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Acțiune</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.fullName || `${employee.firstName} ${employee.lastName}`}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {employee.cnp}
                      </TableCell>
                      <TableCell>{employee.department || '-'}</TableCell>
                      <TableCell>{employee.position || '-'}</TableCell>
                      <TableCell>
                        {employee.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Activ
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50">
                            Inactiv
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          size="sm" 
                          onClick={() => {
                            onSelect(employee);
                            onClose();
                          }}
                          disabled={!employee.isActive}
                        >
                          Selectează
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <User className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Nu s-au găsit angajați care să corespundă căutării.' 
                  : 'Nu există angajați activi în sistem.'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
