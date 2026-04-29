'use client';

import React from 'react';
import { CheckCircle, Circle, Lock } from 'lucide-react';
import Badge from './Badge';
import DocumentRow from './DocumentRow';
import { formatINR } from '@/lib/constants';

interface MilestoneDoc {
  name: string;
  required: boolean;
  uploaded: boolean;
  uploadDate?: string;
}

interface MilestoneCardProps {
  name: string;
  percentage: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED';
  dateRange?: string;
  trancheAmount?: number;
  documents: MilestoneDoc[];
  releasedDate?: string;
  onDocUpload?: (docName: string) => void;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'COMPLETED') {
    return <CheckCircle size={24} style={{ color: 'var(--gold)' }} />;
  }
  if (status === 'IN_PROGRESS') {
    return (
      <div className="w-6 h-6 rounded-full border-2" style={{ borderColor: 'var(--gold)' }}>
        <div className="w-2 h-2 rounded-full mt-1.5 ml-1.5" style={{ background: 'var(--gold)' }} />
      </div>
    );
  }
  return <Lock size={20} style={{ color: 'var(--text-muted)' }} />;
}

function statusLabel(status: string, releasedDate?: string) {
  if (status === 'COMPLETED') {
    return (
      <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>
        RELEASED {releasedDate ? `— ${releasedDate}` : ''}
      </span>
    );
  }
  if (status === 'IN_PROGRESS') {
    return (
      <span className="text-xs font-semibold" style={{ color: 'var(--amber)' }}>
        IN PROGRESS
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--red)' }}>
      <Lock size={10} /> ESCROW LOCKED
    </span>
  );
}

export default function MilestoneCard({
  name,
  percentage,
  status,
  dateRange,
  trancheAmount,
  documents,
  releasedDate,
  onDocUpload,
}: MilestoneCardProps) {
  return (
    <div className="flex gap-4 mb-6">
      {/* Timeline line + icon */}
      <div className="flex flex-col items-center">
        <StatusIcon status={status} />
        <div className="w-px flex-1 mt-2" style={{ background: 'var(--border-card)' }} />
      </div>

      {/* Card content */}
      <div className="flex-1 ownly-card !p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h4 className="font-heading font-semibold text-white">{name}</h4>
              <Badge variant="muted">{percentage}% OF BUILD</Badge>
            </div>
            {statusLabel(status, releasedDate)}
          </div>
          <div className="text-right">
            {dateRange && (
              <span className="text-xs block" style={{ color: 'var(--text-secondary)' }}>
                {dateRange}
              </span>
            )}
            {trancheAmount && (
              <span className="text-xs block mt-1" style={{ color: 'var(--text-secondary)' }}>
                Tranche {formatINR(trancheAmount)}
              </span>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="mt-3">
          {documents.map((doc, i) => (
            <DocumentRow
              key={i}
              name={doc.name}
              required={doc.required}
              uploaded={doc.uploaded}
              uploadDate={doc.uploadDate}
              onUpload={() => onDocUpload?.(doc.name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
