import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, Info, AlertTriangle } from "lucide-react";
import { IntegrationProvider } from '../../hooks/integrations/useIntegrations';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'password' | 'textarea' | 'url';
  description?: string;
  placeholder?: string;
  required?: boolean;
  pattern?: string;
}

interface ConfigureIntegrationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: Record<string, any>) => void;
  provider: IntegrationProvider;
  title: string;
  description: string;
  currentConfig?: Record<string, any>;
  isLoading?: boolean;
}

export default function ConfigureIntegrationModal({
  open,
  onClose,
  onSave,
  provider,
  title,
  description,
  currentConfig = {},
  isLoading = false
}: ConfigureIntegrationModalProps) {
  // State for form values
  const [formValues, setFormValues] = React.useState<Record<string, any>>(currentConfig);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Define fields based on provider
  const getFieldsForProvider = (): Field[] => {
    switch (provider) {
      case IntegrationProvider.SHOPIFY_ADMIN:
        return [
          { key: 'shopName', label: 'Numele magazinului', type: 'text', placeholder: 'magazine-name', required: true },
          { key: 'apiKey', label: 'API Key', type: 'text', required: true },
          { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
          { key: 'accessToken', label: 'Access Token', type: 'password' },
          { key: 'webhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://...' }
        ];
      case IntegrationProvider.STRIPE:
        return [
          { key: 'publicKey', label: 'Cheie publică', type: 'text', required: true },
          { key: 'secretKey', label: 'Cheie secretă', type: 'password', required: true },
          { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' }
        ];
      case IntegrationProvider.PAYPAL:
        return [
          { key: 'clientId', label: 'Client ID', type: 'text', required: true },
          { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
          { key: 'sandbox', label: 'Mod Sandbox (true/false)', type: 'text', placeholder: 'true' }
        ];
      case IntegrationProvider.EMAIL:
        return [
          { key: 'provider', label: 'Furnizor Email', type: 'text', placeholder: 'smtp, mailchimp, sendgrid', required: true },
          { key: 'apiKey', label: 'API Key', type: 'password' },
          { key: 'smtpHost', label: 'SMTP Host', type: 'text' },
          { key: 'smtpPort', label: 'SMTP Port', type: 'text' },
          { key: 'smtpUser', label: 'SMTP Username', type: 'text' },
          { key: 'smtpPassword', label: 'SMTP Password', type: 'password' }
        ];
      case IntegrationProvider.ANAF:
        return [
          { key: 'certificatePath', label: 'Calea către certificat', type: 'text', description: 'Calea către certificatul p12 pentru autentificare', required: true },
          { key: 'certificatePassword', label: 'Parola certificatului', type: 'password', required: true },
          { key: 'fiscalCode', label: 'Cod fiscal', type: 'text', required: true }
        ];
      case IntegrationProvider.PANDADOC:
        return [
          { key: 'apiKey', label: 'API Key', type: 'password', required: true },
          { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' }
        ];
      case IntegrationProvider.OPENAI:
        return [
          { key: 'apiKey', label: 'API Key', type: 'password', required: true },
          { key: 'organization', label: 'ID Organizație', type: 'text' }
        ];
      case IntegrationProvider.MICROSOFT_GRAPH:
        return [
          { key: 'clientId', label: 'Client ID', type: 'text', required: true },
          { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
          { key: 'tenantId', label: 'Tenant ID', type: 'text', required: true },
          { key: 'redirectUri', label: 'Redirect URI', type: 'url', required: true }
        ];
      default:
        return [
          { key: 'apiKey', label: 'API Key', type: 'password' },
          { key: 'apiSecret', label: 'API Secret', type: 'password' },
          { key: 'webhookUrl', label: 'Webhook URL', type: 'url' },
          { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
          { key: 'notes', label: 'Note', type: 'textarea', placeholder: 'Informații adiționale...' }
        ];
    }
  };

  const fields = getFieldsForProvider();

  // Handle form input changes
  const handleChange = (key: string, value: string) => {
    setFormValues({
      ...formValues,
      [key]: value
    });
    
    // Clear error for this field
    if (errors[key]) {
      setErrors({
        ...errors,
        [key]: ''
      });
    }
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && !formValues[field.key]) {
        newErrors[field.key] = `${field.label} este obligatoriu`;
      } else if (field.pattern && formValues[field.key] && !new RegExp(field.pattern).test(formValues[field.key])) {
        newErrors[field.key] = `${field.label} are un format invalid`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formValues);
    }
  };

  // Reset form when modal is opened/closed or provider changes
  React.useEffect(() => {
    if (open) {
      setFormValues(currentConfig || {});
      setErrors({});
    }
  }, [open, provider, currentConfig]);

  // Copy configuration to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(formValues, null, 2));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        {provider === IntegrationProvider.ANAF && (
          <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Certificate ANAF</AlertTitle>
            <AlertDescription>
              Pentru integrarea cu ANAF este necesar un certificat p12 valid emis de autoritatea de certificare.
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="grid gap-2">
              <Label htmlFor={field.key}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {field.description && (
                <div className="flex items-center text-xs text-muted-foreground mb-1">
                  <Info className="h-3 w-3 mr-1" />
                  {field.description}
                </div>
              )}
              
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.key}
                  placeholder={field.placeholder}
                  value={formValues[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className={errors[field.key] ? 'border-red-500' : ''}
                />
              ) : (
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formValues[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className={errors[field.key] ? 'border-red-500' : ''}
                />
              )}
              
              {errors[field.key] && (
                <p className="text-xs text-red-500 mt-1">{errors[field.key]}</p>
              )}
            </div>
          ))}
          
          <div className="pt-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="flex items-center" 
              onClick={copyToClipboard}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiază configurația
            </Button>
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Anulare
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Se salvează...' : 'Salvează'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}