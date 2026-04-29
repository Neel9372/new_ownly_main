'use client';

import React from 'react';
import Badge from './Badge';
import { formatINR } from '@/lib/constants';
import { Eye, Check, X } from 'lucide-react';
import type { BuilderProject } from '@/types';

interface SubmissionRowProps {
  project: BuilderProject;
  onReview?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'PENDING': return 'pending';
    case 'APPROVED': return 'live';
    case 'REJECTED': return 'rejected';
    default: return 'review';
  }
}

export default function SubmissionRow({ project, onReview, onApprove, onReject }: SubmissionRowProps) {
  const timeDiff = Date.now() - new Date(project.created_at).getTime();
  const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
  const timeLabel = hoursAgo < 24 ? `${hoursAgo}H AGO` : `${Math.floor(hoursAgo / 24)}D AGO`;

  return (
    <div className="ownly-card mb-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left — Property info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={getStatusVariant(project.status) as 'pending' | 'live' | 'rejected' | 'review'}>
              {project.status}
            </Badge>
            <span className="uppercase-label text-[10px]">{timeLabel}</span>
          </div>
          <h3 className="font-heading font-semibold text-lg text-white">{project.title}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              📍 {project.location}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {project.property_type}
            </span>
            {project.company_name && (
              <>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  By {project.company_name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Center — Stats */}
        <div className="grid grid-cols-3 gap-8">
          <div>
            <span className="uppercase-label text-[10px]">VALUATION</span>
            <div className="font-heading font-semibold text-white mt-1">
              {formatINR(Number(project.total_funding_goal))}
            </div>
          </div>
          <div>
            <span className="uppercase-label text-[10px]">TOKEN PRICE</span>
            <div className="font-heading font-semibold mt-1" style={{ color: 'var(--gold)' }}>
              {formatINR(Number(project.token_price))}
            </div>
          </div>
          <div>
            <span className="uppercase-label text-[10px]">TOKENS</span>
            <div className="font-heading font-semibold text-white mt-1 font-mono">
              {project.total_tokens?.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-2">
          {onReview && (
            <button onClick={onReview} className="btn-outline !py-2 !px-4 text-xs">
              <Eye size={14} /> Review
            </button>
          )}
          {onApprove && (
            <button onClick={onApprove} className="btn-outline !py-2 !px-4 text-xs" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>
              <Check size={14} /> Approve
            </button>
          )}
          {onReject && (
            <button onClick={onReject} className="btn-danger !py-2 !px-4 text-xs">
              <X size={14} /> Reject
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
