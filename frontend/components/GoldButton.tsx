'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface GoldButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export default function GoldButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false,
  icon,
  className = '',
}: GoldButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-gold ${fullWidth ? 'w-full justify-center' : ''} ${className}`}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {children}
      {icon || <ArrowRight size={16} />}
    </button>
  );
}
