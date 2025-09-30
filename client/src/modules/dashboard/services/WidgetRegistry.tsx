/**
 * Widget Registry Service
 * 
 * This service registers and manages all dashboard widgets available in the system.
 * It provides a central place to define widget metadata, default configurations, and components.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { 
  ClipboardList, 
  Users, 
  Bell, 
  MessageSquare, 
  BarChart, 
  LineChart, 
  Wallet, 
  DollarSign,
  Package,
  ShoppingCart
} from 'lucide-react';

// Import collaboration widgets
import MyTasksWidget from '../components/widgets/MyTasksWidget';
import TeamActivityWidget from '../components/widgets/TeamActivityWidget';
import CommunityUpdatesWidget from '../components/widgets/CommunityUpdatesWidget';
import CollabNotificationsWidget from '../components/widgets/CollabNotificationsWidget';

// Import existing widgets
import ExchangeRateWidget from '../components/widgets/ExchangeRateWidget';

// Define widget types and interfaces
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';
export type WidgetRefreshInterval = 'none' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h';

export interface WidgetConfig {
  [key: string]: any;
}

export interface WidgetProps {
  widget: WidgetInstance;
  definition: WidgetDefinition;
  onEditConfig?: () => void;
  isLoading?: boolean;
  error?: Error | null;
}

export interface WidgetConfigProps {
  widget: WidgetInstance;
  definition: WidgetDefinition;
  onSave: (newConfig: WidgetConfig, refreshInterval?: WidgetRefreshInterval) => void;
  onCancel: () => void;
}

export interface WidgetDefinition {
  id: string;
  type: string;
  title: string;
  description: string;
  component: React.FC<WidgetProps>;
  defaultSize: WidgetSize;
  defaultConfig?: WidgetConfig;
  configComponent?: React.FC<WidgetConfigProps>;
  allowedSizes?: WidgetSize[];
  category: string;
  icon?: React.ReactNode;
  refreshInterval?: WidgetRefreshInterval;
  permissions?: string[];
}

export interface WidgetInstance {
  id: string;
  definitionId: string;
  size: WidgetSize;
  position: number;
  config: WidgetConfig;
  refreshInterval?: WidgetRefreshInterval;
  isCollapsed?: boolean;
  isConfiguring?: boolean;
}

// Create context
interface WidgetRegistryContextValue {
  definitions: WidgetDefinition[];
  getDefinitionById: (id: string) => WidgetDefinition | undefined;
}

const WidgetRegistryContext = createContext<WidgetRegistryContextValue | undefined>(undefined);

// Widget registry provider component
interface WidgetRegistryProviderProps {
  children: ReactNode;
}

export function WidgetRegistryProvider({ children }: WidgetRegistryProviderProps) {
  // Define all widget definitions available in the system
  const widgetDefinitions: WidgetDefinition[] = [
    // Collaboration module widgets
    {
      id: 'my-tasks',
      type: 'collab',
      title: 'Sarcinile Mele',
      description: 'Afișează sarcinile atribuite ție, filtrate după prioritate și status',
      component: (props) => <MyTasksWidget userId={props.widget.config.userId || ''} />,
      defaultSize: 'medium',
      defaultConfig: {
        userId: '' // Will be filled with current user ID
      },
      allowedSizes: ['medium', 'large'],
      category: 'collaboration',
      icon: <ClipboardList className="h-4 w-4" />,
      refreshInterval: '1m',
      permissions: ['collaboration.tasks.view']
    },
    {
      id: 'team-activity',
      type: 'collab',
      title: 'Activitatea Echipei',
      description: 'Afișează activitatea recentă din modulul de colaborare',
      component: (props) => <TeamActivityWidget limit={props.widget.config.limit || 7} />,
      defaultSize: 'medium',
      defaultConfig: {
        limit: 7
      },
      allowedSizes: ['medium', 'large'],
      category: 'collaboration',
      icon: <Users className="h-4 w-4" />,
      refreshInterval: '1m',
      permissions: ['collaboration.activity.view']
    },
    {
      id: 'community-updates',
      type: 'collab',
      title: 'Comunitate',
      description: 'Afișează actualizări recente din comunitatea sistemului',
      component: (props) => <CommunityUpdatesWidget limit={props.widget.config.limit || 5} />,
      defaultSize: 'medium',
      defaultConfig: {
        limit: 5
      },
      allowedSizes: ['medium', 'large'],
      category: 'collaboration',
      icon: <MessageSquare className="h-4 w-4" />,
      refreshInterval: '5m',
      permissions: ['collaboration.community.view']
    },
    {
      id: 'collab-notifications',
      type: 'collab',
      title: 'Notificări',
      description: 'Afișează notificările recente din modulul de colaborare',
      component: (props) => <CollabNotificationsWidget limit={props.widget.config.limit || 6} />,
      defaultSize: 'small',
      defaultConfig: {
        limit: 6
      },
      allowedSizes: ['small', 'medium'],
      category: 'collaboration',
      icon: <Bell className="h-4 w-4" />,
      refreshInterval: '30s',
      permissions: ['collaboration.notifications.view']
    },
    
    // Financial widgets
    {
      id: 'exchange-rates',
      type: 'finance',
      title: 'Cursuri Valutare',
      description: 'Afișează cursurile valutare BNR actualizate zilnic',
      component: ExchangeRateWidget,
      defaultSize: 'medium',
      defaultConfig: {
        currencies: ['EUR', 'USD', 'GBP', 'CHF']
      },
      allowedSizes: ['small', 'medium', 'large'],
      category: 'finance',
      icon: <DollarSign className="h-4 w-4" />,
      refreshInterval: '1h'
    }
    
    // Add more widgets here as needed
  ];
  
  // Function to get a widget definition by ID
  const getDefinitionById = (id: string) => {
    return widgetDefinitions.find(def => def.id === id);
  };
  
  const value: WidgetRegistryContextValue = {
    definitions: widgetDefinitions,
    getDefinitionById
  };
  
  return (
    <WidgetRegistryContext.Provider value={value}>
      {children}
    </WidgetRegistryContext.Provider>
  );
}

// Hook to use the widget registry
export function useWidgetRegistry() {
  const context = useContext(WidgetRegistryContext);
  
  if (context === undefined) {
    throw new Error('useWidgetRegistry must be used within a WidgetRegistryProvider');
  }
  
  return context;
}