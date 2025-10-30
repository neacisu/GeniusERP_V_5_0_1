/**
 * Status Colors Utility
 * 
 * Provides consistent color styling for status badges and indicators
 * throughout the sales module.
 */
import { DealStatus, DealPriority, OpportunityStage, QuoteStatus } from '../types';

/**
 * Get CSS class names for deal status badges
 * @param status Deal status
 * @returns CSS class name string
 */
export const getDealStatusColor = (status: DealStatus): string => {
  switch (status) {
    case DealStatus.NEW:
      return 'bg-blue-100 text-blue-800';
    case DealStatus.NEGOTIATION:
      return 'bg-yellow-100 text-yellow-800';
    case DealStatus.PROPOSAL:
      return 'bg-purple-100 text-purple-800';
    case DealStatus.WON:
      return 'bg-green-100 text-green-800';
    case DealStatus.LOST:
      return 'bg-red-100 text-red-800';
    case DealStatus.CANCELED:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get CSS class names for opportunity stage badges
 * @param stage Opportunity stage
 * @returns CSS class name string
 */
export const getOpportunityStageColor = (stage: OpportunityStage): string => {
  switch (stage) {
    case OpportunityStage.PROSPECTING:
      return 'bg-blue-100 text-blue-800';
    case OpportunityStage.QUALIFICATION:
      return 'bg-indigo-100 text-indigo-800';
    case OpportunityStage.NEEDS_ANALYSIS:
      return 'bg-purple-100 text-purple-800';
    case OpportunityStage.VALUE_PROPOSITION:
      return 'bg-pink-100 text-pink-800';
    case OpportunityStage.DECISION_MAKERS:
      return 'bg-orange-100 text-orange-800';
    case OpportunityStage.PROPOSAL:
      return 'bg-yellow-100 text-yellow-800';
    case OpportunityStage.NEGOTIATION:
      return 'bg-amber-100 text-amber-800';
    case OpportunityStage.CLOSED_WON:
      return 'bg-green-100 text-green-800';
    case OpportunityStage.CLOSED_LOST:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get CSS class names for quote status badges
 * @param status Quote status
 * @returns CSS class name string
 */
export const getQuoteStatusColor = (status: QuoteStatus): string => {
  switch (status) {
    case QuoteStatus.DRAFT:
      return 'bg-gray-100 text-gray-800';
    case QuoteStatus.SENT:
      return 'bg-blue-100 text-blue-800';
    case QuoteStatus.VIEWED:
      return 'bg-purple-100 text-purple-800';
    case QuoteStatus.ACCEPTED:
      return 'bg-green-100 text-green-800';
    case QuoteStatus.REJECTED:
      return 'bg-red-100 text-red-800';
    case QuoteStatus.EXPIRED:
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get CSS class names for priority badges
 * @param priority Deal or opportunity priority
 * @returns CSS class name string
 */
export const getPriorityColor = (priority: DealPriority): string => {
  switch (priority) {
    case DealPriority.LOW:
      return 'bg-blue-100 text-blue-800';
    case DealPriority.MEDIUM:
      return 'bg-yellow-100 text-yellow-800';
    case DealPriority.HIGH:
      return 'bg-orange-100 text-orange-800';
    case DealPriority.URGENT:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get CSS class names for probability indicators
 * @param probability Probability percentage (0-100)
 * @returns CSS class name string
 */
export const getProbabilityColor = (probability: number): string => {
  if (probability >= 80) return 'bg-green-100 text-green-800';
  if (probability >= 60) return 'bg-lime-100 text-lime-800';
  if (probability >= 40) return 'bg-yellow-100 text-yellow-800';
  if (probability >= 20) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};