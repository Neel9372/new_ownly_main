'use client';

import React from 'react';

interface PageHeaderProps {
  breadcrumb: string;
  heading: string;
  goldText: string;
  subtitle?: string;
  breadcrumbIcon?: React.ReactNode;
}

export default function PageHeader({
  breadcrumb,
  heading,
  goldText,
  subtitle,
  breadcrumbIcon,
}: PageHeaderProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-2.5 mb-5">
        {breadcrumbIcon}
        <span className="uppercase-label-gold">{breadcrumb}</span>
      </div>
      <h1 className="font-heading font-bold leading-tight" style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
        {heading} <span style={{ color: 'var(--gold)' }}>{goldText}</span>
      </h1>
      {subtitle && (
        <p className="mt-5 max-w-2xl text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
