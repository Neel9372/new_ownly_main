'use client';

import React, { useState, useEffect } from 'react';
import { propertiesAPI } from '@/lib/api';
import { formatINR } from '@/lib/constants';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';
import { Landmark, Plus, ArrowUpRight, Wallet, Coins, Users, X } from 'lucide-react';
import type { PropertyListing } from '@/types';

interface Pool {
  id: number; name: string; type: 'INVESTING' | 'CLAIMABLE';
  property_id: number; property_title: string;
  total_amount: number; utilized: number;
  status: 'ACTIVE' | 'CLOSED'; created_at: string;
}

const MOCK_POOLS: Pool[] = [
  { id: 1, name: 'Skyline Towers Investment Pool', type: 'INVESTING', property_id: 1, property_title: 'Skyline Towers, Bandra', total_amount: 18500000, utilized: 12950000, status: 'ACTIVE', created_at: '2026-01-15' },
  { id: 2, name: 'Skyline Towers Yield Pool', type: 'CLAIMABLE', property_id: 1, property_title: 'Skyline Towers, Bandra', total_amount: 1739000, utilized: 520000, status: 'ACTIVE', created_at: '2026-03-01' },
  { id: 3, name: 'Marina Bay Villas Investment Pool', type: 'INVESTING', property_id: 2, property_title: 'Marina Bay Villas, Goa', total_amount: 8400000, utilized: 4200000, status: 'ACTIVE', created_at: '2026-02-01' },
  { id: 4, name: 'Marina Bay Villas Yield Pool', type: 'CLAIMABLE', property_id: 2, property_title: 'Marina Bay Villas, Goa', total_amount: 840000, utilized: 0, status: 'ACTIVE', created_at: '2026-04-01' },
];

export default function PoolsSection() {
  const [pools, setPools] = useState<Pool[]>(MOCK_POOLS);
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All');
  const [form, setForm] = useState({ name: '', type: 'INVESTING' as 'INVESTING' | 'CLAIMABLE', property_id: '', total_amount: '' });

  useEffect(() => {
    propertiesAPI.getAll().then(res => setProperties(res.data.properties || [])).catch(() => {});
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find(p => p.id === Number(form.property_id));
    const newPool: Pool = {
      id: Date.now(), name: form.name, type: form.type,
      property_id: Number(form.property_id), property_title: prop?.title || `Property #${form.property_id}`,
      total_amount: Number(form.total_amount), utilized: 0,
      status: 'ACTIVE', created_at: new Date().toISOString().split('T')[0],
    };
    setPools(prev => [newPool, ...prev]);
    setShowCreate(false);
    setForm({ name: '', type: 'INVESTING', property_id: '', total_amount: '' });
  };

  const togglePool = (id: number) => {
    setPools(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE' } : p));
  };

  const filtered = pools.filter(p => typeFilter === 'All' || p.type === typeFilter);

  const totalInvesting = pools.filter(p => p.type === 'INVESTING').reduce((a, p) => a + p.total_amount, 0);
  const totalClaimable = pools.filter(p => p.type === 'CLAIMABLE').reduce((a, p) => a + p.total_amount, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-heading font-semibold text-2xl text-white">Pool Management</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-gold text-sm">
          {showCreate ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Create Pool</>}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="ownly-card !p-5"><span className="uppercase-label text-[10px]">TOTAL POOLS</span><div className="font-heading font-bold text-3xl text-white mt-2">{pools.length}</div></div>
        <div className="ownly-card !p-5"><span className="uppercase-label text-[10px]">INVESTING POOLS</span><div className="font-heading font-bold text-3xl mt-2" style={{ color: 'var(--gold)' }}>{formatINR(totalInvesting)}</div></div>
        <div className="ownly-card !p-5"><span className="uppercase-label text-[10px]">CLAIMABLE POOLS</span><div className="font-heading font-bold text-3xl mt-2" style={{ color: 'var(--green)' }}>{formatINR(totalClaimable)}</div></div>
        <div className="ownly-card !p-5"><span className="uppercase-label text-[10px]">ACTIVE</span><div className="font-heading font-bold text-3xl text-white mt-2">{pools.filter(p => p.status === 'ACTIVE').length}</div></div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-8">
        {['All', 'INVESTING', 'CLAIMABLE'].map(f => (
          <button key={f} onClick={() => setTypeFilter(f)} className="px-4 py-2 rounded-full text-xs font-medium cursor-pointer border-none" style={{ background: typeFilter === f ? 'var(--gold)' : 'var(--bg-input)', color: typeFilter === f ? '#000' : 'var(--text-secondary)' }}>
            {f === 'INVESTING' ? '💰 Investing' : f === 'CLAIMABLE' ? '🎯 Claimable' : 'All Pools'}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="ownly-card mb-8">
          <span className="uppercase-label-gold text-[10px] block mb-4">CREATE NEW POOL</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <div><label className="uppercase-label block mb-2">Pool Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="ownly-input" placeholder="Skyline Yield Pool" required /></div>
            <div><label className="uppercase-label block mb-2">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'INVESTING' | 'CLAIMABLE' })} className="ownly-input"><option value="INVESTING">Investing Pool</option><option value="CLAIMABLE">Claimable Pool</option></select></div>
            <div><label className="uppercase-label block mb-2">Property</label><select value={form.property_id} onChange={e => setForm({ ...form, property_id: e.target.value })} className="ownly-input" required><option value="">Select...</option>{properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
            <div><label className="uppercase-label block mb-2">Total Amount (₹)</label><input type="number" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} className="ownly-input" placeholder="18500000" required /></div>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            <strong className="text-white">Investing Pool:</strong> Investors deposit tokens to invest in a property. <strong className="text-white">Claimable Pool:</strong> Admin loads rental profits for investors to claim proportionally.
          </p>
          <button type="submit" className="btn-gold text-sm">Create Pool</button>
        </form>
      )}

      {/* Pool Cards */}
      <div className="space-y-4">
        {filtered.map(pool => {
          const pct = pool.total_amount > 0 ? (pool.utilized / pool.total_amount * 100) : 0;
          return (
            <div key={pool.id} className="ownly-card">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: pool.type === 'INVESTING' ? 'rgba(245,166,35,0.12)' : 'rgba(34,197,94,0.12)' }}>
                    {pool.type === 'INVESTING' ? <Wallet size={20} style={{ color: 'var(--gold)' }} /> : <Coins size={20} style={{ color: 'var(--green)' }} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="font-heading font-semibold text-base text-white">{pool.name}</h3>
                      <Badge variant={pool.type === 'INVESTING' ? 'funding' : 'live'}>{pool.type}</Badge>
                      <Badge variant={pool.status === 'ACTIVE' ? 'live' : 'muted'}>{pool.status}</Badge>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">{pool.property_title} · Created {pool.created_at}</span>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div><span className="uppercase-label text-[10px]">POOL SIZE</span><div className="font-heading font-semibold text-white mt-1">{formatINR(pool.total_amount)}</div></div>
                  <div><span className="uppercase-label text-[10px]">{pool.type === 'INVESTING' ? 'INVESTED' : 'CLAIMED'}</span><div className="font-heading font-semibold mt-1" style={{ color: pool.type === 'INVESTING' ? 'var(--gold)' : 'var(--green)' }}>{formatINR(pool.utilized)}</div></div>
                  <button onClick={() => togglePool(pool.id)} className="btn-outline !py-2 !px-4 text-xs" style={{ borderColor: pool.status === 'ACTIVE' ? 'var(--red)' : 'var(--green)', color: pool.status === 'ACTIVE' ? 'var(--red)' : 'var(--green)' }}>
                    {pool.status === 'ACTIVE' ? 'Close' : 'Reopen'}
                  </button>
                </div>
              </div>
              <div className="mt-4"><ProgressBar percentage={pct} height={4} /><div className="text-[10px] text-[var(--text-secondary)] mt-1 text-right">{pct.toFixed(1)}% utilized</div></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
