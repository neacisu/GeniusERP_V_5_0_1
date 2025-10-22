/**
 * Enhanced Form Dialog Component
 * 
 * A reusable dialog component for forms with advanced features:
 * - Form validation integration
 * - Loading states
 * - Confirmation handling
 * - Size variants
 * - Custom actions
 * - Scroll locking
 * - Focus management
 */

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { X, Loader2 } from 'lucide-react';
import { createLogger } from '@/utils/logger/logger';
import { createAuditLogger } from '@/utils/audit/audit-logger';

// Initialize loggers
const logger = createLogger('form-dialog');
const auditLog = createAuditLogger('ui');

// Form dialog size variants
export type FormDialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Form dialog tab configuration
export interface FormDialogTab {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

export interface FormDialogProps {
  // Basic props
  title: string;
  description?: string;
  children?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Form handling
  onSubmit?: (e: React.FormEvent) => void | Promise<void>;
  isSubmitting?: boolean;
  
  // Dialog customization
  size?: FormDialogSize;
  showCloseButton?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  hideFooter?: boolean;
  submitButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  
  // Additional actions
  extraActions?: React.ReactNode;
  
  // Confirmation handling
  requireConfirmation?: boolean;
  confirmationMessage?: string;
  
  // Tab handling
  tabs?: FormDialogTab[];
  defaultTabId?: string;
  
  // Additional customization
  contentClassName?: string;
  footerClassName?: string;
  dialogClassName?: string;
  
  // Entity information for audit logging
  entityType?: string;
  entityId?: string;
  actionType?: 'create' | 'read' | 'update' | 'delete' | 'custom';
}

/**
 * Enhanced form dialog component with advanced features and audit logging
 */
export const FormDialog: React.FC<FormDialogProps> = ({
  // Basic props
  title,
  description,
  children,
  open,
  onOpenChange,
  
  // Form handling
  onSubmit,
  isSubmitting = false,
  
  // Dialog customization
  size = 'md',
  showCloseButton = true,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  hideFooter = false,
  submitButtonVariant = 'default',
  
  // Additional actions
  extraActions,
  
  // Confirmation handling
  requireConfirmation = false,
  confirmationMessage = 'Are you sure you want to discard your changes?',
  
  // Tab handling
  tabs,
  defaultTabId,
  
  // Additional customization
  contentClassName,
  footerClassName,
  dialogClassName,
  
  // Entity information for audit logging
  entityType,
  entityId,
  actionType = 'update'
}) => {
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string | undefined>(defaultTabId);
  
  // Handle dialog open state change
  useEffect(() => {
    // Reset form state when dialog opens
    if (open) {
      setIsDirty(false);
      setShowConfirmation(false);
      
      // Log dialog opening
      logger.debug(`Dialog opened: ${title}`, {
        context: { entityType, entityId, actionType }
      });
      
      // Audit log dialog open
      if (entityType && entityId) {
        auditLog.log({
          action: 'read',
          entityType,
          entityId,
          details: { dialogTitle: title },
          metadata: { method: 'dialog-open' }
        });
      }
    }
  }, [open, title, entityType, entityId, actionType]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onSubmit) {
      logger.debug(`Dialog form submitting: ${title}`, {
        context: { entityType, entityId, actionType }
      });
      
      try {
        await onSubmit(e);
        setIsDirty(false);
        
        // Audit log form submission
        if (entityType && entityId) {
          auditLog.log({
            action: actionType,
            entityType,
            entityId,
            details: { dialogTitle: title, success: true },
            metadata: { method: 'form-submit' }
          });
        }
      } catch (error) {
        logger.error(`Error submitting dialog form: ${title}`, {
          context: { error, entityType, entityId }
        });
        
        // Audit log submission error
        if (entityType && entityId) {
          auditLog.log({
            action: actionType,
            entityType,
            entityId,
            details: { dialogTitle: title, success: false, error: String(error) },
            status: 'failure',
            metadata: { method: 'form-submit-error' }
          });
        }
      }
    }
  };
  
  // Handle dialog close with confirmation if needed
  const handleCloseRequest = () => {
    if (requireConfirmation && isDirty && !showConfirmation) {
      setShowConfirmation(true);
      logger.debug('Showing confirmation dialog before close');
      return;
    }
    
    // Close the dialog
    onOpenChange(false);
    setShowConfirmation(false);
    
    logger.debug(`Dialog closed: ${title}`);
    
    // Audit log dialog close
    if (entityType && entityId) {
      auditLog.log({
        action: 'update',
        entityType: 'ui',
        entityId: `dialog-${entityType}`,
        details: { dialogTitle: title, discarded: isDirty },
        metadata: { method: 'dialog-close' }
      });
    }
  };
  
  // Get content max width based on size
  const getDialogSizeClass = () => {
    switch (size) {
      case 'xs': return 'max-w-xs';
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case 'full': return 'max-w-[95vw] w-full';
      default: return 'max-w-md';
    }
  };

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    
    logger.debug(`Dialog tab changed to: ${tabId}`, {
      context: { dialogTitle: title }
    });
  };
  
  // Dialog content with potential confirmation overlay
  const renderDialogContent = () => {
    if (showConfirmation) {
      return (
        <div className="p-4 text-center space-y-4">
          <p className="text-base">{confirmationMessage}</p>
          <div className="flex justify-center gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowConfirmation(false);
                onOpenChange(false);
              }}
            >
              Discard
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            {showCloseButton && (
              <DialogClose asChild onClick={handleCloseRequest}>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            )}
          </div>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <div className={cn("py-4", contentClassName)}>
          {tabs ? (
            <Tabs 
              defaultValue={defaultTabId || tabs[0].id} 
              value={activeTabId}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid" style={{ 
                gridTemplateColumns: `repeat(${Math.min(tabs.length, 6)}, 1fr)` 
              }}>
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1">
                    {tab.icon && <span>{tab.icon}</span>}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {tabs.map(tab => (
                <TabsContent key={tab.id} value={tab.id} className="pt-4">
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <form id="dialog-form" onSubmit={handleSubmit} onChange={() => setIsDirty(true)}>
              {children}
            </form>
          )}
        </div>
        
        {!hideFooter && (
          <DialogFooter className={cn("flex justify-end gap-2", footerClassName)}>
            {extraActions}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseRequest}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            
            <Button
              type="submit"
              form="dialog-form"
              disabled={isSubmitting}
              variant={submitButtonVariant}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        )}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseRequest}>
      <DialogContent 
        className={cn(
          getDialogSizeClass(),
          dialogClassName
        )}
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside if submitting
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
      >
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
};