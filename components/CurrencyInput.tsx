import React from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  className = '',
  ...props
}) => {
  // Format helper: 1000 -> "1.000"
  const format = (val: number) => {
    if (!val) return '';
    return new Intl.NumberFormat('id-ID').format(val);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove dots to get raw number
    const rawValue = e.target.value.replace(/\./g, '');
    
    // Allow empty input to clear the value (set to 0)
    if (rawValue === '') {
      onChange(0);
      return;
    }

    // Only process if it's a valid number
    if (/^\d+$/.test(rawValue)) {
        onChange(parseInt(rawValue, 10));
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value === 0 ? '' : format(value)}
      onChange={handleChange}
      className={className}
      {...props}
    />
  );
};