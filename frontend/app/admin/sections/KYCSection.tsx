'use client';

import React, { useState, useEffect } from 'react';
import { kycAPI } from '@/lib/api';
import Badge from '@/components/Badge';
import { CheckCircle2, XCircle, Clock, User, Search, AlertTriangle } from 'lucide-react';

interface KYCUser {
  id: number; fname: string; lname: string; email: string;
  kyc_status: string; id_proof_type?: string; id_proof_number?: string;
  id_proof_image?: string; created_at: string;
}

export default function KYCSection() {
  const [users, setUsers] = useState<KYCUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [rejectModal, setRejectModal] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => { fetchKYC(); }, []);

  const fetchKYC = async () => {
    try {
      const res = await kycAPI.getPending();
      setUsers(res.data.pending_kyc || res.data.users || res.data.pending || []);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await kycAPI.verify(id, 'VERIFIED');
      setUsers(prev => prev.map(u => u.id === id ? { ...u, kyc_status: 'VERIFIED' } : u));
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) return;
    setActionLoading(id);
    try {
      await kycAPI.verify(id, 'REJECTED', rejectReason);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, kyc_status: 'REJECTED' } : u));
      setRejectModal(null);
      setRejectReason('');
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const filtered = users.filter(u => {
    if (filter !== 'All' && u.kyc_status !== filter) return false;
    if (search && !`${u.fname} ${u.lname} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    submitted: users.filter(u => u.kyc_status === 'SUBMITTED').length,
    verified: users.filter(u => u.kyc_status === 'VERIFIED').length,
    rejected: users.filter(u => u.kyc_status === 'REJECTED').length,
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} /></div>;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-10">
        <div className="ownly-card !p-5"><div className="flex justify-between mb-2"><span className="uppercase-label text-[10px]">PENDING</span><Clock size={16} className="text-[var(--amber)]" /></div><div className="font-heading font-bold text-3xl text-white">{counts.submitted}</div></div>
        <div className="ownly-card !p-5"><div className="flex justify-between mb-2"><span className="uppercase-label text-[10px]">VERIFIED</span><CheckCircle2 size={16} className="text-[var(--green)]" /></div><div className="font-heading font-bold text-3xl text-white">{counts.verified}</div></div>
        <div className="ownly-card !p-5"><div className="flex justify-between mb-2"><span className="uppercase-label text-[10px]">REJECTED</span><XCircle size={16} className="text-[var(--red)]" /></div><div className="font-heading font-bold text-3xl text-white">{counts.rejected}</div></div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="ownly-input !pl-11 !py-2.5 !rounded-full" />
        </div>
        <div className="flex gap-2">
          {['All', 'SUBMITTED', 'VERIFIED', 'REJECTED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer border-none" style={{ background: filter === f ? 'var(--gold)' : 'var(--bg-input)', color: filter === f ? '#000' : 'var(--text-secondary)' }}>
              {f === 'All' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="ownly-card text-center py-16"><User size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} /><p className="text-[var(--text-secondary)]">No KYC submissions found.</p></div>
      ) : (
        <div className="ownly-card !p-0 overflow-hidden">
          <table className="ownly-table">
            <thead><tr><th>User</th><th>Email</th><th>ID Proof</th><th>Status</th><th>Date</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td className="font-medium text-white">{u.fname} {u.lname}</td>
                  <td className="text-[var(--text-secondary)]">{u.email}</td>
                  <td>
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-mono text-xs text-white">{u.id_proof_type} · {u.id_proof_number || '—'}</span>
                      {u.id_proof_image && (
                        <a href={u.id_proof_image} target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] text-xs hover:underline">
                          View Document
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge variant={u.kyc_status === 'VERIFIED' ? 'live' : u.kyc_status === 'REJECTED' ? 'rejected' : 'pending'}>
                      {u.kyc_status}
                    </Badge>
                  </td>
                  <td className="text-xs text-[var(--text-secondary)]">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      {u.kyc_status === 'SUBMITTED' && (
                        <>
                          <button onClick={() => handleApprove(u.id)} disabled={actionLoading === u.id} className="btn-outline !py-1.5 !px-3 text-xs" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>
                            <CheckCircle2 size={12} /> Approve
                          </button>
                          <button onClick={() => { setRejectModal(u.id); setRejectReason(''); }} className="btn-danger !py-1.5 !px-3 text-xs">
                            <XCircle size={12} /> Decline
                          </button>
                        </>
                      )}
                      {u.kyc_status !== 'SUBMITTED' && <span className="text-xs text-[var(--text-muted)]">Done</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setRejectModal(null)}>
          <div className="ownly-card w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle size={24} style={{ color: 'var(--red)' }} />
              <h3 className="font-heading font-semibold text-xl text-white">Decline KYC</h3>
            </div>
            <label className="uppercase-label block mb-2.5">Reason for decline *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. PAN number mismatch, blurry document..." className="ownly-input min-h-[100px] resize-y" />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setRejectModal(null)} className="btn-outline flex-1 justify-center">Cancel</button>
              <button onClick={() => handleReject(rejectModal)} disabled={!rejectReason.trim() || actionLoading === rejectModal} className="btn-danger flex-1 justify-center !py-3">
                {actionLoading === rejectModal ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
