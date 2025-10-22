/**
 * Marketing Status Badge Component
 * 
 * Displays a status badge for marketing entities (campaigns, templates, segments)
 * with appropriate colors based on status type.
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { CampaignStatus } from "../../types";

interface StatusBadgeProps {
  status: CampaignStatus | string;
  variant?: "default" | "outline";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  variant = "outline",
  className = "" 
}) => {
  // Determine the badge color based on status
  let badgeClasses = "";
  let displayText = status;
  
  switch(status) {
    case CampaignStatus.DRAFT:
      badgeClasses = "bg-gray-100 text-gray-800";
      displayText = "Ciornă";
      break;
    case CampaignStatus.SCHEDULED:
      badgeClasses = "bg-blue-100 text-blue-800";
      displayText = "Programată";
      break;
    case CampaignStatus.ACTIVE:
      badgeClasses = "bg-green-100 text-green-800";
      displayText = "Activă";
      break;
    case CampaignStatus.PAUSED:
      badgeClasses = "bg-yellow-100 text-yellow-800";
      displayText = "Pausată";
      break;
    case CampaignStatus.COMPLETED:
      badgeClasses = "bg-purple-100 text-purple-800";
      displayText = "Finalizată";
      break;
    case CampaignStatus.CANCELLED:
      badgeClasses = "bg-red-100 text-red-800";
      displayText = "Anulată";
      break;
    case CampaignStatus.FAILED:
      badgeClasses = "bg-red-100 text-red-800";
      displayText = "Eșuată";
      break;
    case "active":
    case "activated":
    case "enabled":
      badgeClasses = "bg-green-100 text-green-800";
      displayText = "Activ";
      break;
    case "inactive":
    case "disabled":
      badgeClasses = "bg-gray-100 text-gray-800";
      displayText = "Inactiv";
      break;
    default:
      badgeClasses = "bg-gray-100 text-gray-800";
  }
  
  return (
    <Badge 
      variant={variant} 
      className={`${badgeClasses} ${className}`}
    >
      {displayText}
    </Badge>
  );
};

export default StatusBadge;