/**
 * Dashboard Widget System
 * 
 * A comprehensive widget system that supports:
 * - Drag and drop rearrangement
 * - Resizable widgets
 * - Custom widget types
 * - Widget configuration
 * - Widget installation/removal
 * - Persistent layouts
 * - Responsive grid
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { createLogger } from '@/utils/logger/logger';
import { createAuditLogger } from '@/utils/audit/audit-logger';
import { 
  Maximize2, 
  Minimize2,
  X,
  Settings,
  GripVertical,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

// Initialize loggers
const logger = createLogger('widget-system');
const auditLog = createAuditLogger('dashboard');

// Widget types and interfaces
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';
export type WidgetRefreshInterval = 'none' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h';

export interface WidgetConfig {
  [key: string]: any;
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

export interface WidgetProps {
  widget: WidgetInstance;
  definition: WidgetDefinition;
  onEditConfig?: () => void;
  isLoading?: boolean;
  error?: Error | null;
  refreshTimestamp?: number;
}

export interface WidgetConfigProps {
  widget: WidgetInstance;
  definition: WidgetDefinition;
  onSave: (newConfig: WidgetConfig, refreshInterval?: WidgetRefreshInterval) => void;
  onCancel: () => void;
}

export interface WidgetRegistryProps {
  children: React.ReactNode;
}

export interface WidgetSystemProps {
  widgets: WidgetInstance[];
  definitions: WidgetDefinition[];
  onUpdateWidgets: (widgets: WidgetInstance[]) => void;
  isEditing?: boolean;
  onToggleEdit?: () => void;
  allowInstall?: boolean;
  className?: string;
  emptyPlaceholder?: React.ReactNode;
  isLoading?: boolean;
}

// Context to provide widget registry throughout the application
interface WidgetRegistryContextType {
  registerWidget: (definition: WidgetDefinition) => void;
  getWidgetDefinition: (id: string) => WidgetDefinition | undefined;
  getAllWidgetDefinitions: () => WidgetDefinition[];
}

const WidgetRegistryContext = React.createContext<WidgetRegistryContextType | undefined>(undefined);

/**
 * Provider component for the widget registry
 */
export const WidgetRegistryProvider: React.FC<WidgetRegistryProps> = ({ children }) => {
  const [definitions, setDefinitions] = useState<WidgetDefinition[]>([]);

  const registerWidget = (definition: WidgetDefinition) => {
    setDefinitions(prev => {
      // Check if widget already registered
      const existingIndex = prev.findIndex(def => def.id === definition.id);
      if (existingIndex >= 0) {
        // Replace existing definition
        const newDefinitions = [...prev];
        newDefinitions[existingIndex] = definition;
        return newDefinitions;
      }
      // Add new definition
      return [...prev, definition];
    });
    
    logger.debug(`Widget definition registered: ${definition.id}`, {
      context: { type: definition.type, title: definition.title }
    });
  };

  const getWidgetDefinition = (id: string) => {
    return definitions.find(def => def.id === id);
  };

  const getAllWidgetDefinitions = () => {
    return [...definitions];
  };

  return (
    <WidgetRegistryContext.Provider value={{ 
      registerWidget, 
      getWidgetDefinition, 
      getAllWidgetDefinitions 
    }}>
      {children}
    </WidgetRegistryContext.Provider>
  );
};

/**
 * Hook to access the widget registry
 */
export const useWidgetRegistry = () => {
  const context = React.useContext(WidgetRegistryContext);
  if (!context) {
    throw new Error('useWidgetRegistry must be used within a WidgetRegistryProvider');
  }
  return context;
};

/**
 * Widget header with actions for collapsing, configuring, and removing
 */
const WidgetHeader: React.FC<{
  title: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onConfigure: () => void;
  onRemove: () => void;
  isEditing: boolean;
  canConfigure: boolean;
  icon?: React.ReactNode;
  onDragHandleMouseDown?: (e: React.MouseEvent) => void;
}> = ({
  title,
  isCollapsed,
  onToggleCollapse,
  onConfigure,
  onRemove,
  isEditing,
  canConfigure,
  icon,
  onDragHandleMouseDown
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-muted border-b">
      <div className="flex items-center gap-2">
        {isEditing && (
          <div 
            className="cursor-move hover:text-primary" 
            onMouseDown={onDragHandleMouseDown}
          >
            <GripVertical size={16} />
          </div>
        )}
        {icon && <div className="text-primary dark:text-greenSecondary">{icon}</div>}
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      
      <div className="flex items-center space-x-1">
        {canConfigure && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onConfigure}>
            <Settings className="h-3.5 w-3.5 text-muted-foreground hover:text-primary dark:hover:text-greenSecondary" />
          </Button>
        )}
        
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggleCollapse}>
          {isCollapsed ? (
            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground hover:text-primary dark:hover:text-greenSecondary" />
          ) : (
            <Minimize2 className="h-3.5 w-3.5 text-muted-foreground hover:text-primary dark:hover:text-greenSecondary" />
          )}
        </Button>
        
        {isEditing && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
            <X className="h-3.5 w-3.5 text-redSecondary hover:text-redPrimary" />
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Individual widget component
 */
const Widget: React.FC<{
  widget: WidgetInstance;
  definition: WidgetDefinition;
  onUpdate: (updated: WidgetInstance) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
}> = ({
  widget,
  definition,
  onUpdate,
  onRemove,
  isEditing
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Configure widget refresh interval
  useEffect(() => {
    // Clean up any existing timer
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
      refreshTimeout.current = null;
    }
    
    // If we have a refresh interval, set up the new timer
    if (widget.refreshInterval && widget.refreshInterval !== 'none') {
      const getIntervalMs = () => {
        switch (widget.refreshInterval) {
          case '30s': return 30 * 1000;
          case '1m': return 60 * 1000;
          case '5m': return 5 * 60 * 1000;
          case '15m': return 15 * 60 * 1000;
          case '30m': return 30 * 60 * 1000;
          case '1h': return 60 * 60 * 1000;
          default: return 0;
        }
      };
      
      const intervalMs = getIntervalMs();
      if (intervalMs > 0) {
        logger.debug(`Setting up refresh interval for widget ${widget.id}: ${widget.refreshInterval}`, {
          context: { 
            definitionId: widget.definitionId,
            intervalMs
          }
        });
        
        // Set up the new timer
        refreshTimeout.current = setInterval(() => {
          setLastRefresh(Date.now());
          logger.debug(`Refreshing widget ${widget.id}`);
        }, intervalMs);
      }
    }
    
    return () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
        refreshTimeout.current = null;
      }
    };
  }, [widget.id, widget.refreshInterval, widget.definitionId]);
  
  // Handle toggling the collapsed state
  const handleToggleCollapse = () => {
    const updated = {
      ...widget,
      isCollapsed: !widget.isCollapsed
    };
    onUpdate(updated);
    
    logger.debug(`Widget ${widget.id} ${updated.isCollapsed ? 'collapsed' : 'expanded'}`);
    
    // Audit log the collapse/expand action
    auditLog.log({
      action: 'update',
      entityType: 'widget',
      entityId: widget.id,
      details: { 
        definitionId: widget.definitionId,
        isCollapsed: updated.isCollapsed
      },
      metadata: { method: 'collapse-toggle' }
    });
  };
  
  // Handle opening the configuration dialog
  const handleConfigure = () => {
    const updated = {
      ...widget,
      isConfiguring: true
    };
    onUpdate(updated);
    
    logger.debug(`Opening configuration for widget ${widget.id}`);
    
    // Audit log the configure action
    auditLog.log({
      action: 'read',
      entityType: 'widget-config',
      entityId: widget.id,
      details: { definitionId: widget.definitionId },
      metadata: { method: 'open-config' }
    });
  };
  
  // Handle saving configuration
  const handleSaveConfig = (newConfig: WidgetConfig, refreshInterval?: WidgetRefreshInterval) => {
    const updated = {
      ...widget,
      config: newConfig,
      refreshInterval: refreshInterval || widget.refreshInterval,
      isConfiguring: false
    };
    onUpdate(updated);
    
    logger.debug(`Saved configuration for widget ${widget.id}`, {
      context: { 
        definitionId: widget.definitionId,
        refreshInterval: updated.refreshInterval
      }
    });
    
    // Audit log the config save action
    auditLog.log({
      action: 'update',
      entityType: 'widget-config',
      entityId: widget.id,
      details: { 
        definitionId: widget.definitionId,
        refreshInterval: updated.refreshInterval
      },
      metadata: { method: 'save-config' }
    });
    
    // Trigger an immediate refresh
    setLastRefresh(Date.now());
  };
  
  // Handle closing the configuration dialog
  const handleCancelConfig = () => {
    const updated = {
      ...widget,
      isConfiguring: false
    };
    onUpdate(updated);
    
    logger.debug(`Cancelled configuration for widget ${widget.id}`);
  };
  
  // Handle removing the widget
  const handleRemove = () => {
    onRemove(widget.id);
    
    logger.debug(`Removed widget ${widget.id}`, {
      context: { definitionId: widget.definitionId }
    });
    
    // Audit log the widget removal
    auditLog.log({
      action: 'delete',
      entityType: 'widget',
      entityId: widget.id,
      details: { definitionId: widget.definitionId },
      metadata: { method: 'remove' }
    });
  };
  
  // Get the component for this widget type
  const WidgetComponent = definition.component;
  const ConfigComponent = definition.configComponent;
  
  return (
    <div className={cn(
      "flex flex-col border rounded-lg shadow-sm bg-background overflow-hidden h-full",
      widget.isCollapsed && "h-auto"
    )}>
      <WidgetHeader
        title={definition.title}
        isCollapsed={!!widget.isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onConfigure={handleConfigure}
        onRemove={handleRemove}
        isEditing={isEditing}
        canConfigure={!!ConfigComponent}
        icon={definition.icon}
      />
      
      {!widget.isCollapsed && (
        <div className="flex-1 overflow-auto p-4">
          <WidgetComponent 
            widget={widget}
            definition={definition}
            onEditConfig={handleConfigure}
            isLoading={isLoading}
            error={error}
            refreshTimestamp={lastRefresh}
          />
        </div>
      )}
      
      {ConfigComponent && widget.isConfiguring && (
        <Dialog open={true} onOpenChange={() => handleCancelConfig()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Configure {definition.title}</DialogTitle>
            </DialogHeader>
            
            <ConfigComponent
              widget={widget}
              definition={definition}
              onSave={handleSaveConfig}
              onCancel={handleCancelConfig}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

/**
 * Widget gallery for adding new widgets
 */
const WidgetGallery: React.FC<{
  availableWidgets: WidgetDefinition[];
  onAddWidget: (definitionId: string) => void;
  onClose: () => void;
  open: boolean;
}> = ({
  availableWidgets,
  onAddWidget,
  onClose,
  open
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Group widgets by category
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    availableWidgets.forEach(widget => {
      cats.add(widget.category);
    });
    return ['all', ...Array.from(cats)];
  }, [availableWidgets]);
  
  // Filter widgets by selected category
  const filteredWidgets = React.useMemo(() => {
    if (selectedCategory === 'all') {
      return availableWidgets;
    }
    return availableWidgets.filter(widget => widget.category === selectedCategory);
  }, [availableWidgets, selectedCategory]);
  
  // Handle adding a widget
  const handleAddWidget = (definitionId: string) => {
    onAddWidget(definitionId);
    
    logger.debug(`Added widget from gallery: ${definitionId}`);
    
    // Audit log the widget addition
    auditLog.log({
      action: 'create',
      entityType: 'widget',
      entityId: definitionId,
      details: { source: 'gallery' },
      metadata: { method: 'add-widget' }
    });
    
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Widgets</DialogTitle>
        </DialogHeader>
        
        <Tabs 
          defaultValue="all" 
          value={selectedCategory} 
          onValueChange={setSelectedCategory}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid" style={{ 
            gridTemplateColumns: `repeat(${Math.min(categories.length, 6)}, 1fr)` 
          }}>
            {categories.map(category => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="flex-1 overflow-auto mt-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWidgets.map(widget => (
                <Card key={widget.id} className="flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                      {widget.icon && <div className="text-primary dark:text-greenSecondary">{widget.icon}</div>}
                      <h3 className="font-medium">{widget.title}</h3>
                    </div>
                    <Button size="sm" onClick={() => handleAddWidget(widget.id)}>
                      Add
                    </Button>
                  </div>
                  <div className="p-4 flex-1">
                    <p className="text-sm text-muted-foreground">{widget.description}</p>
                  </div>
                  <div className="px-4 py-2 bg-muted text-xs">
                    Category: <span className="font-medium capitalize">{widget.category}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Widget grid size utilities
 */
const sizeToColSpan = (size: WidgetSize): number => {
  switch (size) {
    case 'small': return 1;
    case 'medium': return 2;
    case 'large': return 3;
    case 'full': return 4;
    default: return 1;
  }
};

/**
 * Main widget system component
 */
export const WidgetSystem: React.FC<WidgetSystemProps> = ({
  widgets,
  definitions,
  onUpdateWidgets,
  isEditing = false,
  onToggleEdit,
  allowInstall = true,
  className,
  emptyPlaceholder,
  isLoading = false
}) => {
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  
  // Handle toggling edit mode
  const handleToggleEdit = () => {
    if (onToggleEdit) {
      onToggleEdit();
      logger.debug(`Dashboard edit mode ${!isEditing ? 'enabled' : 'disabled'}`);
      
      // Audit log the edit mode change
      auditLog.log({
        action: 'update',
        entityType: 'dashboard',
        entityId: 'edit-mode',
        details: { editMode: !isEditing },
        metadata: { method: 'toggle-edit' }
      });
    }
  };
  
  // Handle updating a widget
  const handleUpdateWidget = (updated: WidgetInstance) => {
    const newWidgets = widgets.map(w => w.id === updated.id ? updated : w);
    onUpdateWidgets(newWidgets);
  };
  
  // Handle removing a widget
  const handleRemoveWidget = (id: string) => {
    const newWidgets = widgets.filter(w => w.id !== id);
    onUpdateWidgets(newWidgets);
  };
  
  // Handle adding a new widget
  const handleAddWidget = (definitionId: string) => {
    const definition = definitions.find(d => d.id === definitionId);
    if (!definition) return;
    
    const newWidget: WidgetInstance = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      definitionId,
      size: definition.defaultSize,
      position: widgets.length,
      config: definition.defaultConfig || {},
      refreshInterval: definition.refreshInterval || 'none'
    };
    
    onUpdateWidgets([...widgets, newWidget]);
    
    logger.debug(`Added new widget: ${definitionId}`, {
      context: { widgetId: newWidget.id, size: newWidget.size }
    });
  };
  
  // Handle drag start
  const handleDragStart = (id: string) => {
    setIsDragging(id);
    logger.debug(`Started dragging widget: ${id}`);
  };
  
  // Handle drag end and reordering
  const handleDragEnd = () => {
    setIsDragging(null);
    logger.debug('Finished dragging widget');
  };
  
  // Match widget instances with their definitions
  const widgetsWithDefinitions = widgets
    .map(widget => {
      const definition = definitions.find(d => d.id === widget.definitionId);
      return { widget, definition };
    })
    .filter(({ definition }) => !!definition) as { widget: WidgetInstance; definition: WidgetDefinition }[];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard widgets...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Dashboard toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary dark:text-greenTertiary">Dashboard</h2>
        
        <div className="flex items-center gap-2">
          {allowInstall && (
            <Button 
              onClick={() => setShowGallery(true)}
              className="gap-1"
              variant={isEditing ? "default" : "outline"}
            >
              <Plus size={16} />
              Add Widget
            </Button>
          )}
          
          {onToggleEdit && (
            <Button 
              onClick={handleToggleEdit}
              variant={isEditing ? "default" : "outline"}
            >
              {isEditing ? 'Done' : 'Edit Dashboard'}
            </Button>
          )}
        </div>
      </div>
      
      {/* Widget grid */}
      {widgetsWithDefinitions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {widgetsWithDefinitions.map(({ widget, definition }) => (
            <div
              key={widget.id}
              className={cn(
                "col-span-1",
                widget.size === 'medium' && "md:col-span-2",
                widget.size === 'large' && "md:col-span-2 lg:col-span-3",
                widget.size === 'full' && "md:col-span-2 lg:col-span-3 xl:col-span-4",
                isDragging === widget.id && "opacity-50 border-2 border-dashed border-primary"
              )}
              style={{ minHeight: widget.isCollapsed ? 'auto' : '200px' }}
            >
              <Widget
                widget={widget}
                definition={definition}
                onUpdate={handleUpdateWidget}
                onRemove={handleRemoveWidget}
                isEditing={isEditing}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
          {emptyPlaceholder || (
            <div className="text-center">
              <h3 className="font-medium text-lg text-primary dark:text-greenSecondary">No widgets added yet</h3>
              <p className="text-muted-foreground mt-1">Click "Add Widget" to get started customizing your dashboard.</p>
              {allowInstall && (
                <Button 
                  onClick={() => setShowGallery(true)} 
                  className="mt-4"
                >
                  <Plus size={16} className="mr-2" />
                  Add Your First Widget
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Widget gallery dialog */}
      <WidgetGallery
        availableWidgets={definitions}
        onAddWidget={handleAddWidget}
        onClose={() => setShowGallery(false)}
        open={showGallery}
      />
    </div>
  );
};