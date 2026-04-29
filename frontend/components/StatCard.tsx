'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  valueColor?: string;
  large?: boolean;
  subStats?: { label: string; value: string; color?: string }[];
  subText?: string;
  subTextColor?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  valueColor = '#fff',
  large = false,
  subStats,
  subText,
  subTextColor,
}: StatCardProps) {
  return (
    <div className="ownly-card relative overflow-hidden" style={large ? { gridColumn: 'span 2' } : {}}>
      <div className="flex items-start justify-between mb-4">
        <span className="uppercase-label">{label}</span>
        {Icon && (
          <Icon size={18} style={{ color: 'var(--text-muted)' }} />
        )}
      </div>
      <div
        className="font-heading font-bold"
        style={{
          fontSize: large ? '42px' : '30px',
          color: valueColor,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {subText && (
        <div className="mt-3 text-sm" style={{ color: subTextColor || 'var(--green)' }}>
          {subText}
        </div>
      )}
      {subStats && (
        <div className="flex gap-8 mt-5 pt-5" style={{ borderTop: '1px solid var(--border-card)' }}>
          {subStats.map((s, i) => (
            <div key={i}>
              <span className="uppercase-label text-[10px]">{s.label}</span>
              <div className="font-heading font-bold text-base mt-1" style={{ color: s.color || '#fff' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
