'use client';

import React from 'react';

interface OutlineButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  icon?: React.ReactNode;
  className?: string;
  danger?: boolean;
}

export default function OutlineButton({
  children,
  onClick,
  type = 'button',
  icon,
  className = '',
  danger = false,
}: OutlineButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${danger ? 'btn-danger' : 'btn-outline'} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
