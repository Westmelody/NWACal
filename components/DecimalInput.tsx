import React, { useState, useEffect, useRef } from 'react';

interface DecimalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  maxDecimals?: number;
}

export const DecimalInput: React.FC<DecimalInputProps> = ({ 
  value, 
  onChange, 
  onBlur,
  onFocus,
  maxDecimals = 2,
  className = '',
  ...props 
}) => {
  // Initialize state. If value is 0, show empty string (to show placeholder),
  // unless we want to allow explicit 0. But standard behavior for dimensions is empty = 0.
  // However, to allow typing "0.5", we rely on the handleChange to update displayValue to "0" or "0."
  const [displayValue, setDisplayValue] = useState<string>(() => {
    return value === 0 ? '' : value.toString();
  });

  const isFocused = useRef(false);

  // Sync with prop changes (e.g. from calculations or resets), but only if not currently typing
  useEffect(() => {
    if (!isFocused.current) {
      const parsedDisplay = displayValue === '' ? 0 : parseFloat(displayValue);
      // Only update if difference is significant to avoid fighting with partial inputs
      if (Math.abs(parsedDisplay - value) > Number.EPSILON) {
        setDisplayValue(value === 0 ? '' : value.toString());
      }
    }
  }, [value, displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Validate: Allow only digits and a single decimal point
    if (!/^\d*\.?\d*$/.test(val)) return;

    setDisplayValue(val);

    // Pass numeric value to parent immediately
    if (val === '' || val === '.') {
      onChange(0);
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) onChange(num);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocused.current = false;
    
    // Format to 2 decimals on blur
    if (displayValue !== '' && displayValue !== '.') {
      const num = parseFloat(displayValue);
      if (!isNaN(num)) {
        const formatted = num.toFixed(maxDecimals);
        setDisplayValue(formatted);
        onChange(parseFloat(formatted));
      } else {
        setDisplayValue('');
        onChange(0);
      }
    } else {
      setDisplayValue('');
      onChange(0);
    }

    if (onBlur) onBlur(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocused.current = true;
    if (onFocus) onFocus(e);
  };

  return (
    <input
      type="text"
      inputMode="decimal" // Ensures numeric keypad on mobile
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={className}
      {...props}
    />
  );
};