/**
 * Marketing Module Utility Functions
 * 
 * Common utility functions for the marketing module including
 * formatting, calculations, and data transformations.
 */

import { CampaignStatus, CampaignType } from "../types";

/**
 * Format date for display in marketing components
 * @param date Date string or Date object
 * @param includeTime Whether to include time in the formatted date
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date | undefined | null, 
  includeTime: boolean = false
): string => {
  if (!date) return '-';
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  };
  
  return dateObj.toLocaleDateString('ro-RO', options);
};

/**
 * Format number for display with thousand separators
 * @param value Number to format
 * @returns Formatted number string
 */
export const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '-';
  
  return new Intl.NumberFormat('ro-RO').format(value);
};

/**
 * Calculate open rate percentage from opens and sends
 * @param opens Number of opens
 * @param sends Number of sends
 * @returns Open rate percentage
 */
export const calculateOpenRate = (
  opens: number | undefined | null,
  sends: number | undefined | null
): number | null => {
  if (!opens || !sends || sends === 0) return null;
  
  return Math.round((opens / sends) * 100);
};

/**
 * Calculate click rate percentage from clicks and opens
 * @param clicks Number of clicks
 * @param opens Number of opens
 * @returns Click rate percentage
 */
export const calculateClickRate = (
  clicks: number | undefined | null,
  opens: number | undefined | null
): number | null => {
  if (!clicks || !opens || opens === 0) return null;
  
  return Math.round((clicks / opens) * 100);
};

/**
 * Get readable campaign status label
 * @param status Campaign status
 * @returns Human-readable status label
 */
export const getCampaignStatusLabel = (status: CampaignStatus | string): string => {
  switch (status) {
    case CampaignStatus.DRAFT:
      return 'Ciornă';
    case CampaignStatus.SCHEDULED:
      return 'Programată';
    case CampaignStatus.ACTIVE:
      return 'Activă';
    case CampaignStatus.PAUSED:
      return 'Pausată';
    case CampaignStatus.COMPLETED:
      return 'Finalizată';
    case CampaignStatus.CANCELLED:
      return 'Anulată';
    case CampaignStatus.FAILED:
      return 'Eșuată';
    default:
      return status;
  }
};

/**
 * Get readable campaign type label
 * @param type Campaign type
 * @returns Human-readable type label
 */
export const getCampaignTypeLabel = (type: CampaignType | string): string => {
  switch (type) {
    case CampaignType.EMAIL:
      return 'Email';
    case CampaignType.SMS:
      return 'SMS';
    case CampaignType.SOCIAL:
      return 'Social Media';
    case CampaignType.PUSH:
      return 'Push Notificare';
    case CampaignType.WHATSAPP:
      return 'WhatsApp';
    case CampaignType.MULTI_CHANNEL:
      return 'Multi-canal';
    default:
      return type;
  }
};

/**
 * Format campaign costs with currency symbol
 * @param cost Cost value
 * @param currency Currency code
 * @returns Formatted cost string
 */
export const formatCost = (
  cost: number | undefined | null,
  currency: string = 'RON'
): string => {
  if (cost === undefined || cost === null) return '-';
  
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cost);
};