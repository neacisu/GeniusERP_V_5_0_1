/**
 * Marketing Module Types
 * 
 * This file contains type definitions for the marketing module.
 */

export enum CampaignType {
  EMAIL = 'email',
  SMS = 'sms',
  SOCIAL = 'social',
  PUSH = 'push',
  WHATSAPP = 'whatsapp',
  MULTI_CHANNEL = 'multi_channel'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum AudienceType {
  SEGMENT = 'segment',
  LIST = 'list',
  CUSTOM = 'custom',
  ALL_CUSTOMERS = 'all_customers',
  FILTERED = 'filtered'
}

export interface Campaign {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  subject?: string;
  content?: string;
  contentHtml?: string;
  templateId?: string;
  channels: string[];
  primaryChannel?: string;
  scheduledAt?: string | Date;
  startedAt?: string | Date;
  completedAt?: string | Date;
  audienceType: AudienceType;
  audienceId?: string;
  audienceFilter?: Record<string, any>;
  estimatedReach?: number;
  sentCount?: number;
  deliveredCount?: number;
  openCount?: number;
  clickCount?: number;
  bounceCount?: number;
  responseCount?: number;
  isAbTest?: boolean;
  abTestVariants?: any[];
  abTestWinnerVariant?: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CampaignMessage {
  id: string;
  campaignId: string;
  messageId: string;
  companyId: string;
  recipientId: string;
  status: string;
  sentAt?: string | Date;
  deliveredAt?: string | Date;
  openedAt?: string | Date;
  clickedAt?: string | Date;
  bouncedAt?: string | Date;
  bounceReason?: string;
  metadata?: Record<string, any>;
  variantId?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CampaignSegment {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  filterCriteria?: Record<string, any>;
  estimatedReach?: number;
  isActive?: boolean;
  lastRefreshedAt?: string | Date;
  metadata?: Record<string, any>;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CampaignTemplate {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  type: CampaignType;
  subject?: string;
  content?: string;
  contentHtml?: string;
  previewImage?: string;
  category?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CampaignFilters {
  status?: CampaignStatus;
  type?: CampaignType;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface SegmentFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface TemplateFilters {
  type?: CampaignType;
  category?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PaginatedCampaigns {
  campaigns: Campaign[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedSegments {
  segments: CampaignSegment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedTemplates {
  templates: CampaignTemplate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CampaignPerformance {
  id: string;
  campaignId: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  sentCount: number;
  deliveredCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  responseCount: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  responseRate: number;
  graphData: {
    labels: string[];
    datasets: {
      sent: number[];
      delivered: number[];
      opened: number[];
      clicked: number[];
    };
  };
  channelBreakdown: {
    channel: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }[];
  metadata?: Record<string, any>;
}

export interface MarketingStatistics {
  totalCampaigns: number;
  activeCampaigns: number;
  scheduledCampaigns: number;
  completedCampaigns: number;
  draftsCount: number;
  totalSegments: number;
  totalTemplates: number;
  totalAudience: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  topPerformingCampaigns: {
    id: string;
    name: string;
    type: string;
    openRate: number;
    clickRate: number;
  }[];
  recentCampaigns: {
    id: string;
    name: string;
    status: string;
    sent: number;
    opened: number;
    createdAt: string;
  }[];
}