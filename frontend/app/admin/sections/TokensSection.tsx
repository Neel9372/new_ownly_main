'use client';

import React, { useState, useEffect } from 'react';
import { propertiesAPI } from '@/lib/api';
import { formatINR } from '@/lib/constants';
import { Coins, Search, ArrowUpRight, Hammer } from 'lucide-react';
import Badge from '@/components/Badge';
import type { PropertyListing } from '@/types';

export default function TokensSection() {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [mintModal, setMintModal] = useState<PropertyListing | null>(null);
  const [mintAmount, setMintAmount] = useState('');
  const [mintingId, setMintingId] = useState<number | null>(null);

  useEffect(() => {
    propertiesAPI.getAll().then(res => setProperties(res.data.properties || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleMint = async (prop: PropertyListing) => {
    setMintingId(prop.id);
    // Simulated — would call smart contract mint function
    await new Promise(r => setTimeout(r, 1500));
    setMintingId(null);
    setMintModal(null);
    setMintAmount('');
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-heading font-semibold text-2xl text-white">Token Management</h2>
        <span className="uppercase-label">{properties.length} properties tokenized</span>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="ownly-card !p-5"><span className="uppercase-label text-[10px]">TOTAL SUPPLY</span><div className="font-heading font-bold text-3xl text-white mt-2">{properties.reduce((a, p) => a + Number(p.total_tokens || 0), 0).toLocaleString()}</div><div className="text-[10px] text-[var(--text-secondary)] mt-1">$OYD across all</div></div>
        <div className="ownly-card !p-5"><span className="uppercase-label text-[10px]">AVG TOKEN PRICE</span><div className="font-heading font-bold text-3xl mt-2" style={{ color: 'var(--gold)' }}>{formatINR(Math.round(properties.reduce((a, p) => a + Number(p.token_price || 0), 0) / (properties.length || 1)))}</div></div>
        <div className="ownly-card !p-5"><span className="uppercase-label text-[10px]">SOLD</span><div className="font-heading font-bold text-3xl mt-2" style={{ color: 'var(--green)' }}>{Math.round(properties.reduce((a, p) => a + Number(p.funding_percentage || 0), 0) / (properties.length || 1))}%</div><div className="text-[10px] text-[var(--text-secondary)] mt-1">Average funded</div></div>
        <div className="ownly-card !p-5"><span className="uppercase-label text-[10px]">PROPERTIES</span><div className="font-heading font-bold text-3xl text-white mt-2">{properties.length}</div></div>
      </div>

      {/* Token table */}
      <div className="ownly-card !p-0 overflow-hidden">
        <table className="ownly-table">
          <thead><tr><th>Property</th><th>Total Tokens</th><th>Token Price</th><th>Funded</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {properties.map(p => {
              const sold = Math.round(Number(p.total_tokens) * Number(p.funding_percentage) / 100);
              const remaining = Number(p.total_tokens) - sold;
              return (
                <tr key={p.id}>
                  <td><div className="font-medium text-white text-sm">{p.title}</div><div className="text-[10px] text-[var(--text-secondary)]">{p.location}</div></td>
                  <td className="font-mono text-white">{Number(p.total_tokens).toLocaleString()}</td>
                  <td className="font-heading font-semibold" style={{ color: 'var(--gold)' }}>{formatINR(Number(p.token_price))}</td>
                  <td><div className="flex items-center gap-3"><div className="w-16 h-1.5 rounded-full bg-[var(--bg-input)]"><div className="h-full rounded-full" style={{ width: `${p.funding_percentage}%`, background: 'var(--green)' }} /></div><span className="text-xs text-white">{Number(p.funding_percentage).toFixed(0)}%</span></div></td>
                  <td><Badge variant={p.status === 'AVAILABLE' ? 'live' : 'muted'}>{p.status}</Badge></td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { setMintModal(p); setMintAmount(''); }} className="btn-outline !py-1.5 !px-3 text-xs" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}><Hammer size={12} /> Mint</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mint Modal */}
      {mintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setMintModal(null)}>
          <div className="ownly-card w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6"><Coins size={24} style={{ color: 'var(--gold)' }} /><h3 className="font-heading font-semibold text-xl text-white">Mint Tokens</h3></div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Minting additional $OYD tokens for <strong className="text-white">{mintModal.title}</strong></p>
            <label className="uppercase-label block mb-2.5">Number of Tokens</label>
            <input type="number" value={mintAmount} onChange={e => setMintAmount(e.target.value)} placeholder="1000" className="ownly-input" />
            {mintAmount && <p className="text-xs text-[var(--text-secondary)] mt-2">Value: <strong className="text-white">{formatINR(Number(mintAmount) * Number(mintModal.token_price))}</strong></p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMintModal(null)} className="btn-outline flex-1 justify-center">Cancel</button>
              <button onClick={() => handleMint(mintModal)} disabled={!mintAmount || mintingId !== null} className="btn-gold flex-1 justify-center !py-3">{mintingId ? 'Minting...' : `Mint ${mintAmount || 0} Tokens`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
