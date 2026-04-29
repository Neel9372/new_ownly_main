'use client';

import React from 'react';
import { FileText, Upload, CheckCircle } from 'lucide-react';

interface DocumentRowProps {
  name: string;
  required?: boolean;
  uploaded?: boolean;
  uploadDate?: string;
  onUpload?: () => void;
}

export default function DocumentRow({
  name,
  required = false,
  uploaded = false,
  uploadDate,
  onUpload,
}: DocumentRowProps) {
  return (
    <div
      className="flex items-center justify-between py-3 px-4 rounded-lg mb-2"
      style={{ background: 'var(--bg-input)' }}
    >
      <div className="flex items-center gap-3">
        <FileText size={16} style={{ color: 'var(--text-muted)' }} />
        <span className="text-sm text-white">{name}</span>
        {required && (
          <span className="badge badge-muted text-[9px]">REQUIRED</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {uploadDate && (
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {uploadDate}
          </span>
        )}
        {uploaded ? (
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--green)' }}>
            <CheckCircle size={14} /> UPLOADED
          </span>
        ) : (
          <button
            onClick={onUpload}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              color: 'var(--gold)',
              border: '1px solid var(--gold)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <Upload size={12} /> UPLOAD
          </button>
        )}
      </div>
    </div>
  );
}
