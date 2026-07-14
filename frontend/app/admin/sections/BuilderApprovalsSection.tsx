'use client';

import React, { useState, useEffect } from 'react';
import { builderAPI } from '@/lib/api';
import Badge from '@/components/Badge';
import { CheckCircle2, XCircle, Clock, ShieldCheck, Search, Eye, AlertTriangle, FileText } from 'lucide-react';

interface PendingBuilder {
  id: number;
  fname: string;
  lname: string;
  email: string;
  company_name: string;
  builder_status: string;
  license_url?: string;
  created_at: string;
}

export default function BuilderApprovalsSection() {
  const [builders, setBuilders] = useState<PendingBuilder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [viewLicense, setViewLicense] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingBuilders();
  }, []);

  const fetchPendingBuilders = async () => {
    setLoading(true);
    try {
      const res = await builderAPI.getPendingBuilders();
      setBuilders(res.data.pending_builders || []);
    } catch (err) {
      console.error('Failed to fetch pending builders:', err);
      setBuilders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await builderAPI.reviewBuilder(id, 'VERIFIED');
      setBuilders((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Failed to approve builder:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await builderAPI.reviewBuilder(id, 'REJECTED');
      setBuilders((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Failed to reject builder:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const openBase64InNewTab = (base64Data: string) => {
    try {
      const arr = base64Data.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (e) {
      // Fallback: direct download
      const link = document.createElement('a');
      link.href = base64Data;
      link.download = 'builder_license';
      link.click();
    }
  };

  const filtered = builders.filter((b) => {
    const searchString = `${b.fname} ${b.lname} ${b.email} ${b.company_name}`.toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, email..."
            className="ownly-input !pl-11 !py-2.5 !rounded-full"
          />
        </div>
        <div className="uppercase-label text-xs">
          {filtered.length} Pending Request{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Requests Table */}
      {filtered.length === 0 ? (
        <div className="ownly-card text-center py-16">
          <ShieldCheck size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="text-[var(--text-secondary)]">No pending builder verifications found.</p>
        </div>
      ) : (
        <div className="ownly-card !p-0 overflow-hidden">
          <table className="ownly-table">
            <thead>
              <tr>
                <th>Builder Name</th>
                <th>Company Name</th>
                <th>Email</th>
                <th>License / Credentials</th>
                <th>Status</th>
                <th>Date Submitted</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td className="font-medium text-white">{b.fname} {b.lname}</td>
                  <td className="text-white">{b.company_name}</td>
                  <td className="text-[var(--text-secondary)]">{b.email}</td>
                  <td>
                    {b.license_url ? (
                      <button
                        onClick={() => setViewLicense(b.license_url || null)}
                        className="text-[var(--gold)] text-xs hover:underline flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
                      >
                        <Eye size={12} /> View License Document
                      </button>
                    ) : (
                      <span className="text-[var(--text-muted)] text-xs">No document</span>
                    )}
                  </td>
                  <td>
                    <Badge variant="pending">
                      {b.builder_status}
                    </Badge>
                  </td>
                  <td className="text-xs text-[var(--text-secondary)]">
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleApprove(b.id)}
                        disabled={actionLoading === b.id}
                        className="btn-outline !py-1.5 !px-3 text-xs"
                        style={{ borderColor: 'var(--green)', color: 'var(--green)' }}
                      >
                        <CheckCircle2 size={12} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(b.id)}
                        disabled={actionLoading === b.id}
                        className="btn-danger !py-1.5 !px-3 text-xs"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* License Preview Modal */}
      {viewLicense !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setViewLicense(null)}
        >
          <div
            className="ownly-card w-full max-w-2xl relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '85vh' }}
          >
            <div className="w-full flex justify-between items-center mb-4">
              <span className="uppercase-label-gold">Builder License Document Preview</span>
              <button
                onClick={() => setViewLicense(null)}
                className="text-xs text-[var(--text-secondary)] hover:text-white bg-transparent border-none cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
            
            <div className="w-full overflow-auto bg-black rounded-lg flex items-center justify-center p-6 border border-[var(--border-card)]" style={{ minHeight: '350px' }}>
              {viewLicense.startsWith('data:') ? (
                viewLicense.includes('pdf') ? (
                  <div className="text-center p-6 flex flex-col items-center">
                    <FileText size={64} style={{ color: 'var(--gold)' }} className="mb-4" />
                    <h4 className="text-white font-semibold mb-2">Builder License (PDF)</h4>
                    <p className="text-xs text-[var(--text-secondary)] mb-6 max-w-md">
                      For security and compatibility reasons, PDF documents are opened in a secure browser tab.
                    </p>
                    <button
                      onClick={() => openBase64InNewTab(viewLicense)}
                      className="btn-gold !py-2.5 !px-5 text-xs font-semibold cursor-pointer"
                    >
                      Open Document in New Tab ↗
                    </button>
                  </div>
                ) : (
                  <img src={viewLicense} alt="Builder License" className="max-w-full max-h-[50vh] object-contain rounded" />
                )
              ) : (
                <div className="text-center p-6 text-sm text-[var(--text-muted)] flex flex-col items-center">
                  <FileText size={48} className="mb-4 text-gray-600" />
                  <p className="mb-2">Document URL / string:</p>
                  <code className="text-xs break-all block max-w-lg mb-4 text-white p-2.5 rounded bg-zinc-900 border border-zinc-800">{viewLicense}</code>
                  <a href={viewLicense} target="_blank" rel="noopener noreferrer" className="btn-gold !py-2 !px-4 text-xs font-semibold">
                    Open in New Tab ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
