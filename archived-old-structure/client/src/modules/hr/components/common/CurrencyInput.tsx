import React, { forwardRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

export const formatCurrency = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return '';
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN
  if (isNaN(numValue)) return '';
  
  // Format with Romanian locale (RON)
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

// Parse formatted currency string to number
export const parseCurrency = (value: string): number => {
  // Remove currency symbol, thousand separators, and convert comma to dot for decimal
  const cleaned = value
    .replace(/[^\d,.-]/g, '') // Remove non-numeric chars except comma, dot, and minus
    .replace(/\./g, '')       // Remove dots (thousand separators)
    .replace(/,/g, '.');      // Replace comma with dot for decimal
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number | string;
  onValueChange: (value: number) => void;
  symbol?: string;
  locale?: string;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, symbol = 'RON', locale = 'ro-RO', ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>('');
    
    // Update display value when the actual value changes
    useEffect(() => {
      if (value || value === 0) {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        const formatted = new Intl.NumberFormat(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numValue);
        setDisplayValue(formatted);
      } else {
        setDisplayValue('');
      }
    }, [value, locale]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Handle empty input
      if (!inputValue.trim()) {
        setDisplayValue('');
        onValueChange(0);
        return;
      }
      
      // Remove currency symbol and non-numeric characters except comma and dot
      const cleaned = inputValue.replace(/[^\d,.-]/g, '');
      
      // Update display value to what the user typed
      setDisplayValue(cleaned);
      
      // Convert to number format and call the callback
      const parsedValue = parseCurrency(cleaned);
      onValueChange(parsedValue);
    };
    
    const handleBlur = () => {
      // Format the value properly on blur
      if (value) {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        const formatted = new Intl.NumberFormat(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numValue);
        setDisplayValue(formatted);
      }
    };
    
    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`${props.className || ''} pl-10`}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          {symbol}
        </div>
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;