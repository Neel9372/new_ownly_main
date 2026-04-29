'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  icon?: LucideIcon;
  rightElement?: React.ReactNode;
  required?: boolean;
  name?: string;
  disabled?: boolean;
  className?: string;
}

export default function InputField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  rightElement,
  required,
  name,
  disabled,
  className = '',
}: InputFieldProps) {
  return (
    <div className={className}>
      <label className="uppercase-label block mb-2.5">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
        )}
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className="ownly-input"
          style={{
            paddingLeft: Icon ? '48px' : '18px',
            paddingRight: rightElement ? '48px' : '18px',
          }}
        />
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}
