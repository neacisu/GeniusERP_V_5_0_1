import React from 'react';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  FileText, 
  Download, 
  ExternalLink,
  Briefcase
} from 'lucide-react';
import { EmploymentContract, EmploymentContractStatus } from '../../types';
import { 
  formatDate, 
  formatCurrency, 
  getContractStatusColor,
  formatContractType
} from '../../utils/helpers';

interface ContractCardProps {
  contract: EmploymentContract;
  employeeName?: string;
  compact?: boolean;
  actionButtons?: React.ReactNode;
}

/**
 * Contract Card Component
 * 
 * Displays contract information in a card format with optional action buttons
 */
const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  employeeName,
  compact = false,
  actionButtons
}) => {
  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Contract #{contract.contractNumber}</CardTitle>
            {employeeName && (
              <p className="text-sm text-muted-foreground mt-1">{employeeName}</p>
            )}
          </div>
          <Badge className={getContractStatusColor(contract.status)}>
            {contract.status === EmploymentContractStatus.ACTIVE && 'Activ'}
            {contract.status === EmploymentContractStatus.DRAFT && 'Ciornă'}
            {contract.status === EmploymentContractStatus.SUSPENDED && 'Suspendat'}
            {contract.status === EmploymentContractStatus.TERMINATED && 'Încheiat'}
            {contract.status === EmploymentContractStatus.TRANSFERRED && 'Transferat'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{formatContractType(contract.contractType)}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Început: {formatDate(contract.startDate)}</span>
            {contract.endDate && !compact && (
              <span className="ml-2">| Termen: {formatDate(contract.endDate)}</span>
            )}
          </div>
          
          {!compact && (
            <>
              <div className="flex items-center text-sm">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Salariu: {formatCurrency(typeof contract.baseSalaryGross === 'number' ? contract.baseSalaryGross : parseFloat(contract.baseSalaryGross.toString()))}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Program: {contract.workingHoursPerDay} ore/zi ({contract.workingHoursPerWeek} ore/săptămână)</span>
              </div>
              
              <div className="flex items-center text-sm">
                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>COR: {contract.corCode}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-between">
        {actionButtons || (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              asChild
            >
              <Link href={`/hr/contracts/${contract.id}`}>
                <span className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Detalii
                </span>
              </Link>
            </Button>
            
            {contract.contractFilePath && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(contract.contractFilePath, '_blank')}
              >
                <span className="flex items-center">
                  <Download className="h-4 w-4 mr-1" />
                  Document
                </span>
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default ContractCard;