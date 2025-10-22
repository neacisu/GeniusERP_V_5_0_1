/**
 * Settings Module Types
 * 
 * Types used throughout the settings module
 */

// Company settings types
export interface Company {
  id: string;
  name: string;
  address: string;
  city: string;
  county: string;
  country: string;
  fiscalCode: string;
  registrationNumber: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  bankAccount: string | null;
  bankName: string | null;
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Feature toggle types
export interface FeatureToggle {
  id: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  category: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// System settings types
export interface GlobalSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  category: string;
  isSystem: boolean;
  companyId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// UI Theme types
export interface UITheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  borderRadius: string;
  isDefault: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// User preferences types
export interface UserPreference {
  id: string;
  userId: string;
  key: string;
  value: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

// Document template types
export interface DocumentTemplate {
  id: string;
  name: string;
  type: string;
  content: string;
  description: string | null;
  isDefault: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Integration types
export interface Integration {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, any>;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Notification types
export interface NotificationSetting {
  id: string;
  userId: string;
  type: string;
  channel: 'email' | 'sms' | 'push' | 'in-app';
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Common types
export type SettingCategory = 
  | 'company'
  | 'user'
  | 'system'
  | 'ui'
  | 'security'
  | 'notification'
  | 'integration'
  | 'document'
  | 'payment'
  | 'feature';

export type FormMode = 'create' | 'edit' | 'view';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export interface Breadcrumb {
  title: string;
  href?: string;
}