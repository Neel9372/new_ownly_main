'use client';

import React, { useState, useEffect } from 'react';
import { adminAPI, investmentsAPI, propertiesAPI } from '@/lib/api';
import { formatINR } from '@/lib/constants';
import Badge from '@/components/Badge';
import { Users, Search, Trash2, Eye, AlertTriangle } from 'lucide-react';

interface AdminUser {
  id: number; fname: string; lname: string; email: string;
  role: string; kyc_status: string; wallet_address?: string;
  wallet_status: string; created_at: string;
}

export default function InvestorsSection() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [investments, setInvestments] = useState<any[]>([]);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try { const res = await adminAPI.getAllUsers(); setUsers(res.data.users || []); }
    catch { setUsers([]); }
    finally { setLoading(false); }
  };

  const handleRemove = async (id: number) => {
    try { await adminAPI.removeUser(id); setUsers(prev => prev.filter(u => u.id !== id)); }
    catch (e) { console.error(e); }
    finally { setDeleteConfirm(null); }
  };

  const viewInvestments = async (userId: number) => {
    if (expanded === userId) { setExpanded(null); return; }
    try {
      const res = await adminAPI.getAllInvestments();
      setInvestments((res.data.investments || []).filter((inv: any) => inv.user_id === userId));
    } catch { setInvestments([]); }
    setExpanded(userId);
  };

  const filtered = users.filter(u => {
    if (roleFilter !== 'All' && u.role !== roleFilter) return false;
    if (search && !`${u.fname} ${u.lname} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} /></div>;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-10">
        <div className="ownly-card !p-5"><span className="uppercase-label text-[10px]">TOTAL USERS</span><div className="font-heading font-bold text-3xl text-white mt-2">{users.length}</div></div>
        <div className="ownly-card !p-5"><span className="uppercase-label text-[10px]">INVESTORS</span><div className="font-heading font-bold text-3xl text-white mt-2">{users.filter(u => u.role === 'INVESTOR').length}</div></div>
        <div className="ownly-card !p-5"><span className="uppercase-label text-[10px]">KYC VERIFIED</span><div className="font-heading font-bold text-3xl mt-2" style={{ color: 'var(--green)' }}>{users.filter(u => u.kyc_status === 'VERIFIED').length}</div></div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="ownly-input !pl-11 !py-2.5 !rounded-full" />
        </div>
        <div className="flex gap-2">
          {['All', 'INVESTOR', 'BUILDER', 'ADMIN'].map(f => (
            <button key={f} onClick={() => setRoleFilter(f)} className="px-4 py-2 rounded-full text-xs font-medium cursor-pointer border-none" style={{ background: roleFilter === f ? 'var(--gold)' : 'var(--bg-input)', color: roleFilter === f ? '#000' : 'var(--text-secondary)' }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="ownly-card text-center py-16"><Users size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} /><p className="text-[var(--text-secondary)]">No users found.</p></div>
      ) : (
        <div className="ownly-card !p-0 overflow-hidden">
          <table className="ownly-table">
            <thead><tr><th>User</th><th>Role</th><th>KYC</th><th>Wallet</th><th>Joined</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <React.Fragment key={u.id}>
                  <tr>
                    <td><div className="font-medium text-white">{u.fname} {u.lname}</div><div className="text-[10px] text-[var(--text-secondary)]">{u.email}</div></td>
                    <td><Badge variant={u.role === 'ADMIN' ? 'funding' : 'muted'}>{u.role}</Badge></td>
                    <td><Badge variant={u.kyc_status === 'VERIFIED' ? 'live' : u.kyc_status === 'REJECTED' ? 'rejected' : 'pending'}>{u.kyc_status}</Badge></td>
                    <td><span className="font-mono text-xs text-[var(--text-secondary)]">{u.wallet_address ? `${u.wallet_address.slice(0,6)}...${u.wallet_address.slice(-4)}` : 'Not connected'}</span></td>
                    <td className="text-xs text-[var(--text-secondary)]">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => viewInvestments(u.id)} className="btn-outline !py-1.5 !px-3 text-xs"><Eye size={12} /> Holdings</button>
                        {u.role !== 'ADMIN' && (deleteConfirm === u.id ? (
                          <><button onClick={() => handleRemove(u.id)} className="btn-danger !py-1.5 !px-3 text-xs">Confirm</button><button onClick={() => setDeleteConfirm(null)} className="btn-outline !py-1.5 !px-3 text-xs">No</button></>
                        ) : (
                          <button onClick={() => setDeleteConfirm(u.id)} className="btn-outline !py-1.5 !px-3 text-xs" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}><Trash2 size={12} /></button>
                        ))}
                      </div>
                    </td>
                  </tr>
                  {expanded === u.id && (
                    <tr><td colSpan={6} style={{ background: 'var(--bg-input)', padding: '16px 24px' }}>
                      {investments.length > 0 ? (
                        <div className="space-y-2">
                          <span className="uppercase-label-gold text-[10px]">HOLDINGS ({investments.length})</span>
                          {investments.map((inv: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-[var(--border-card)]" style={{ background: 'var(--bg-card)' }}>
                              <div><span className="text-sm text-white font-medium">{inv.title || `Property #${inv.property_id}`}</span><span className="text-[10px] text-[var(--text-secondary)] ml-3">{inv.location || ''}</span></div>
                              <div className="flex gap-6 text-xs"><span className="text-white font-semibold">{inv.tokens_owned} tokens</span><span className="text-[var(--gold)]">{formatINR(inv.invested_amount)}</span></div>
                            </div>
                          ))}
                        </div>
                      ) : (<p className="text-sm text-[var(--text-secondary)]">No investments found for this user.</p>)}
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
