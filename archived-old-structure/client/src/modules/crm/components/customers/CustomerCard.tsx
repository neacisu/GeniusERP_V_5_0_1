/**
 * Customer Card Component
 * 
 * Displays a summary card for a customer/company in the CRM module.
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ChevronRight,
  FileText,
  Users
} from 'lucide-react';
import { Link } from 'wouter';

interface CustomerCardProps {
  customer: {
    id: string;
    name: string;
    industry?: string;
    address?: string;
    city?: string;
    county?: string;
    phone?: string;
    email?: string;
    website?: string;
    fiscalCode?: string;
    type?: string;
    segment?: string;
    leadScore?: number;
  };
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ customer }) => {
  // Get badge color based on customer type
  const getBadgeVariant = (type: string = 'lead') => {
    switch (type.toLowerCase()) {
      case 'lead':
        return 'outline';
      case 'prospect':
        return 'secondary';
      case 'customer':
        return 'default';
      case 'partner':
        return 'success';
      default:
        return 'outline';
    }
  };
  
  // Format customer type for display (capitalize first letter)
  const formatType = (type: string = 'lead') => {
    const typeMap: Record<string, string> = {
      'lead': 'Lead',
      'prospect': 'Prospect',
      'customer': 'Client',
      'partner': 'Partener'
    };
    
    return typeMap[type.toLowerCase()] || type;
  };
  
  // Get score color based on lead score
  const getScoreColor = (score: number = 0) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-gray-600';
  };
  
  return (
    <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium">{customer.name}</h3>
            {customer.industry && (
              <p className="text-sm text-gray-600">{customer.industry}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={getBadgeVariant(customer.type)}>
              {formatType(customer.type)}
            </Badge>
            {customer.leadScore !== undefined && (
              <div className={`text-sm font-medium ${getScoreColor(customer.leadScore)}`}>
                {customer.leadScore} / 100
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          {(customer.address || customer.city) && (
            <div className="flex items-start">
              <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
              <div>
                {customer.address && <div>{customer.address}</div>}
                {customer.city && <div>{customer.city}{customer.county ? `, ${customer.county}` : ''}</div>}
              </div>
            </div>
          )}
          
          {customer.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-500" />
              <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                {customer.phone}
              </a>
            </div>
          )}
          
          {customer.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-500" />
              <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                {customer.email}
              </a>
            </div>
          )}
          
          {customer.website && (
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-2 text-gray-500" />
              <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {customer.website.replace(/^https?:\/\/(www\.)?/i, '')}
              </a>
            </div>
          )}
          
          {customer.fiscalCode && (
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              <span>CUI: {customer.fiscalCode}</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-sm text-gray-600">0 contacte</span>
          </div>
          
          <Link to={`/crm/customers/${customer.id}`}>
            <Button variant="outline" size="sm" className="flex items-center">
              <span>Detalii</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;