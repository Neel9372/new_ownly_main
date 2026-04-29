'use client';

import React from 'react';

type BadgeVariant = 'live' | 'pending' | 'funding' | 'funded' | 'review' | 'rejected' | 'muted';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}
