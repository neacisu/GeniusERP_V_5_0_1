/**
 * Basic Widget Components
 * 
 * This file contains a collection of basic widget components that can be used
 * with the widget system, demonstrating different design patterns and functionality.
 */

import React, { useState } from 'react';
import { WidgetProps, WidgetConfigProps, WidgetDefinition } from './WidgetSystem';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  BarChart3, 
  PieChart, 
  Activity, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Warehouse,
  FileText,
  BarChart,
  LineChart,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { createLogger } from '@/utils/logger/logger';
import { createAuditLogger } from '@/utils/audit/audit-logger';

// Initialize loggers
const logger = createLogger('basic-widgets');
const auditLog = createAuditLogger('widgets');

/**
 * Stats Card Widget
 * 
 * Displays a simple statistic with title, value, and optional trend indicator
 */
export const StatsCardWidget: React.FC<WidgetProps> = ({ 
  widget, 
  definition,
  isLoading,
  refreshTimestamp
}) => {
  const { config } = widget;
  const {
    title = 'Statistic',
    value = '0',
    change = 0,
    changeType = 'percentage',
    prefix = '',
    suffix = '',
    precision = 0,
  } = config;

  // Format the value with prefix, suffix and precision
  const formattedValue = `${prefix}${parseFloat(value).toFixed(precision)}${suffix}`;
  
  // Format the change value
  const formattedChange = change > 0 
    ? `+${change}${changeType === 'percentage' ? '%' : ''}`
    : `${change}${changeType === 'percentage' ? '%' : ''}`;
  
  // Determine if the trend is positive or negative
  const isTrendPositive = change > 0;
  const isTrendNeutral = change === 0;

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-2xl font-bold">{isLoading ? '...' : formattedValue}</div>
        {!isLoading && (
          <div className="flex items-center mt-1">
            {!isTrendNeutral && (
              <div className={`flex items-center text-xs mr-2 ${
                isTrendPositive ? 'text-success' : 'text-redSecondary'
              }`}>
                {isTrendPositive 
                  ? <TrendingUp className="h-3 w-3 mr-1" />
                  : <TrendingDown className="h-3 w-3 mr-1" />
                }
                {formattedChange}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              vs. previous period
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-2 text-xs text-muted-foreground border-t bg-muted/50">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Last updated: {new Date(refreshTimestamp || Date.now()).toLocaleTimeString()}
        </div>
      </CardFooter>
    </Card>
  );
};

/**
 * Configuration component for the Stats Card Widget
 */
export const StatsCardWidgetConfig: React.FC<WidgetConfigProps> = ({
  widget,
  onSave,
  onCancel
}) => {
  const { config, refreshInterval = 'none' } = widget;
  const [formState, setFormState] = useState({
    title: config['title'] || 'Statistic',
    value: config['value'] || '0',
    change: config['change'] || 0,
    changeType: config['changeType'] || 'percentage',
    prefix: config['prefix'] || '',
    suffix: config['suffix'] || '',
    precision: config['precision'] || 0,
  });
  const [selectedRefresh, setSelectedRefresh] = useState(refreshInterval);

  const handleSave = () => {
    onSave(formState, selectedRefresh);
    
    logger.debug('Saved stats card widget configuration', {
      context: { widgetId: widget.id, refreshInterval: selectedRefresh }
    });
  };

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formState.title}
            onChange={(e) => setFormState({...formState, title: e.target.value})}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="value">Value</Label>
          <Input
            id="value"
            value={formState.value}
            onChange={(e) => setFormState({...formState, value: e.target.value})}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="change">Change</Label>
          <Input
            id="change"
            type="number"
            value={formState.change}
            onChange={(e) => setFormState({...formState, change: parseFloat(e.target.value)})}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="changeType">Change Type</Label>
          <Select 
            value={formState.changeType} 
            onValueChange={(value) => setFormState({...formState, changeType: value})}
          >
            <SelectTrigger id="changeType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="value">Value</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prefix">Prefix</Label>
          <Input
            id="prefix"
            value={formState.prefix}
            onChange={(e) => setFormState({...formState, prefix: e.target.value})}
            placeholder="$"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="suffix">Suffix</Label>
          <Input
            id="suffix"
            value={formState.suffix}
            onChange={(e) => setFormState({...formState, suffix: e.target.value})}
            placeholder="%"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="precision">Decimal Places</Label>
          <Input
            id="precision"
            type="number"
            min="0"
            max="5"
            value={formState.precision}
            onChange={(e) => setFormState({...formState, precision: parseInt(e.target.value)})}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="refreshInterval">Refresh Interval</Label>
        <Select 
          value={selectedRefresh} 
          onValueChange={(value) => setSelectedRefresh(value as "none" | "30s" | "1m" | "5m" | "15m" | "30m" | "1h")}
        >
          <SelectTrigger id="refreshInterval">
            <SelectValue placeholder="Select interval" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No automatic refresh</SelectItem>
            <SelectItem value="30s">Every 30 seconds</SelectItem>
            <SelectItem value="1m">Every minute</SelectItem>
            <SelectItem value="5m">Every 5 minutes</SelectItem>
            <SelectItem value="15m">Every 15 minutes</SelectItem>
            <SelectItem value="30m">Every 30 minutes</SelectItem>
            <SelectItem value="1h">Every hour</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

/**
 * Alert Widget
 * 
 * Displays alerts or notifications with different severity levels
 */
export const AlertWidget: React.FC<WidgetProps> = ({
  widget,
  isLoading
}) => {
  const { config } = widget;
  const {
    title = 'Alert',
    message = 'This is an alert message.',
    severity = 'info',
    showIcon = true,
    dismissable = false,
    autoHide = false,
    hideAfter = 10 // seconds
  } = config;
  
  const [visible, setVisible] = useState(true);
  
  // Hide the alert if autoHide is enabled
  React.useEffect(() => {
    if (autoHide && visible) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, hideAfter * 1000);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoHide, hideAfter, visible]);
  
  if (!visible) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>Alert dismissed</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => setVisible(true)}
          >
            Show Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Define styles based on severity
  const getSeverityStyles = () => {
    switch (severity) {
      case 'success':
        return 'bg-success/10 text-success border-success/30';
      case 'warning':
        return 'bg-orangeSecondary/10 text-orangePrimary border-orangeSecondary/30';
      case 'error':
        return 'bg-redSecondary/10 text-redPrimary border-redSecondary/30';
      case 'info':
      default:
        return 'bg-primary/10 text-primary border-primary/30';
    }
  };
  
  // Get the appropriate icon based on severity
  const getIcon = () => {
    switch (severity) {
      case 'success':
        return <div className="text-success"><RefreshCw className="h-5 w-5" /></div>;
      case 'warning':
        return <div className="text-orangePrimary"><AlertCircle className="h-5 w-5" /></div>;
      case 'error':
        return <div className="text-redPrimary"><AlertCircle className="h-5 w-5" /></div>;
      case 'info':
      default:
        return <div className="text-primary"><AlertCircle className="h-5 w-5" /></div>;
    }
  };
  
  return (
    <Card className={`h-full border ${getSeverityStyles()}`}>
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          {showIcon && getIcon()}
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </div>
        {dismissable && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full"
            onClick={() => setVisible(false)}
          >
            <span className="sr-only">Dismiss</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm">{message}</p>
      </CardContent>
    </Card>
  );
};

/**
 * Configuration component for the Alert Widget
 */
export const AlertWidgetConfig: React.FC<WidgetConfigProps> = ({
  widget,
  onSave,
  onCancel
}) => {
  const { config, refreshInterval = 'none' } = widget;
  const [formState, setFormState] = useState({
    title: config['title'] || 'Alert',
    message: config['message'] || 'This is an alert message.',
    severity: config['severity'] || 'info',
    showIcon: config['showIcon'] !== undefined ? config['showIcon'] : true,
    dismissable: config['dismissable'] || false,
    autoHide: config['autoHide'] || false,
    hideAfter: config['hideAfter'] || 10
  });
  
  const [selectedRefresh, setSelectedRefresh] = useState(refreshInterval);

  const handleSave = () => {
    onSave(formState, selectedRefresh);
    logger.debug('Saved alert widget configuration', {
      context: { widgetId: widget.id, severity: formState.severity }
    });
  };

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formState.title}
            onChange={(e) => setFormState({...formState, title: e.target.value})}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="severity">Severity</Label>
          <Select 
            value={formState.severity} 
            onValueChange={(value) => setFormState({...formState, severity: value})}
          >
            <SelectTrigger id="severity">
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Input
          id="message"
          value={formState.message}
          onChange={(e) => setFormState({...formState, message: e.target.value})}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="showIcon"
            checked={formState.showIcon}
            onCheckedChange={(checked) => setFormState({...formState, showIcon: checked})}
          />
          <Label htmlFor="showIcon">Show Icon</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="dismissable"
            checked={formState.dismissable}
            onCheckedChange={(checked) => setFormState({...formState, dismissable: checked})}
          />
          <Label htmlFor="dismissable">Dismissable</Label>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="autoHide"
            checked={formState.autoHide}
            onCheckedChange={(checked) => setFormState({...formState, autoHide: checked})}
          />
          <Label htmlFor="autoHide">Auto Hide</Label>
        </div>
        
        {formState.autoHide && (
          <div className="space-y-2">
            <Label htmlFor="hideAfter">Hide After (seconds)</Label>
            <Input
              id="hideAfter"
              type="number"
              min="1"
              value={formState.hideAfter}
              onChange={(e) => setFormState({...formState, hideAfter: parseInt(e.target.value)})}
            />
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="refreshInterval">Refresh Interval</Label>
        <Select 
          value={selectedRefresh} 
          onValueChange={(value) => setSelectedRefresh(value as "none" | "30s" | "1m" | "5m" | "15m" | "30m" | "1h")}
        >
          <SelectTrigger id="refreshInterval">
            <SelectValue placeholder="Select interval" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No automatic refresh</SelectItem>
            <SelectItem value="30s">Every 30 seconds</SelectItem>
            <SelectItem value="1m">Every minute</SelectItem>
            <SelectItem value="5m">Every 5 minutes</SelectItem>
            <SelectItem value="15m">Every 15 minutes</SelectItem>
            <SelectItem value="30m">Every 30 minutes</SelectItem>
            <SelectItem value="1h">Every hour</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

/**
 * Widget definition registry
 * These definitions can be imported and registered with the WidgetRegistry
 */
export const StatsCardWidgetDefinition: WidgetDefinition = {
  id: 'stats-card',
  type: 'stats',
  title: 'Stats Card',
  description: 'Displays a key statistic with trend indicator',
  component: StatsCardWidget,
  configComponent: StatsCardWidgetConfig,
  defaultSize: 'small',
  defaultConfig: {
    title: 'Total Revenue',
    value: '24500',
    change: 12.5,
    changeType: 'percentage',
    prefix: '$',
    suffix: '',
    precision: 0
  },
  allowedSizes: ['small', 'medium'],
  category: 'statistics',
  icon: <BarChart3 size={18} />,
  refreshInterval: '5m'
};

export const AlertWidgetDefinition: WidgetDefinition = {
  id: 'alert',
  type: 'alert',
  title: 'Alert',
  description: 'Displays important alerts and notifications',
  component: AlertWidget,
  configComponent: AlertWidgetConfig,
  defaultSize: 'medium',
  defaultConfig: {
    title: 'System Alert',
    message: 'This is an important notification for users.',
    severity: 'info',
    showIcon: true,
    dismissable: true,
    autoHide: false,
    hideAfter: 10
  },
  allowedSizes: ['small', 'medium', 'large'],
  category: 'notifications',
  icon: <AlertCircle size={18} />,
  refreshInterval: '15m'
};

// Pre-defined widget definitions for different modules
export const SalesWidgetDefinition: WidgetDefinition = {
  id: 'sales-summary',
  type: 'stats',
  title: 'Sales Summary',
  description: 'Shows total sales with comparison to previous period',
  component: StatsCardWidget,
  configComponent: StatsCardWidgetConfig,
  defaultSize: 'small',
  defaultConfig: {
    title: 'Sales',
    value: '42680',
    change: 8.3,
    changeType: 'percentage',
    prefix: '$',
    suffix: '',
    precision: 0
  },
  allowedSizes: ['small', 'medium'],
  category: 'sales',
  icon: <DollarSign size={18} />,
  refreshInterval: '15m'
};

export const InventoryWidgetDefinition: WidgetDefinition = {
  id: 'inventory-status',
  type: 'stats',
  title: 'Inventory Status',
  description: 'Shows current inventory levels and changes',
  component: StatsCardWidget,
  configComponent: StatsCardWidgetConfig,
  defaultSize: 'small',
  defaultConfig: {
    title: 'Stock Items',
    value: '1250',
    change: -3.2,
    changeType: 'percentage',
    prefix: '',
    suffix: '',
    precision: 0
  },
  allowedSizes: ['small', 'medium'],
  category: 'inventory',
  icon: <Warehouse size={18} />,
  refreshInterval: '30m'
};

export const OrdersWidgetDefinition: WidgetDefinition = {
  id: 'recent-orders',
  type: 'stats',
  title: 'Recent Orders',
  description: 'Displays recent order count and trends',
  component: StatsCardWidget,
  configComponent: StatsCardWidgetConfig,
  defaultSize: 'small',
  defaultConfig: {
    title: 'New Orders',
    value: '128',
    change: 5.7,
    changeType: 'percentage',
    prefix: '',
    suffix: '',
    precision: 0
  },
  allowedSizes: ['small', 'medium'],
  category: 'ecommerce',
  icon: <ShoppingCart size={18} />,
  refreshInterval: '5m'
};

export const CustomersWidgetDefinition: WidgetDefinition = {
  id: 'customer-growth',
  type: 'stats',
  title: 'Customer Growth',
  description: 'Shows customer growth rate',
  component: StatsCardWidget,
  configComponent: StatsCardWidgetConfig,
  defaultSize: 'small',
  defaultConfig: {
    title: 'New Customers',
    value: '342',
    change: 12.3,
    changeType: 'percentage',
    prefix: '',
    suffix: '',
    precision: 0
  },
  allowedSizes: ['small', 'medium'],
  category: 'crm',
  icon: <Users size={18} />,
  refreshInterval: '1h'
};

// Export all widget definitions as an array for easy registration
export const BasicWidgetDefinitions: WidgetDefinition[] = [
  StatsCardWidgetDefinition,
  AlertWidgetDefinition,
  SalesWidgetDefinition,
  InventoryWidgetDefinition,
  OrdersWidgetDefinition,
  CustomersWidgetDefinition
];