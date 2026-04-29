'use client';

import React, { useState } from 'react';
import { CalendarClock, Lock, Unlock, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import Badge from '@/components/Badge';

interface ExitWindow {
  id: number; label: string; period: string;
  startDate: string; endDate: string;
  status: 'OPEN' | 'CLOSED' | 'UPCOMING';
  totalExits: number; totalValue: string;
}

const MOCK_WINDOWS: ExitWindow[] = [
  { id: 1, label: 'April 2025', period: 'Apr 1 – Apr 30', startDate: '2025-04-01', endDate: '2025-04-30', status: 'CLOSED', totalExits: 142, totalValue: '₹2.8 Cr' },
  { id: 2, label: 'October 2025', period: 'Oct 1 – Oct 31', startDate: '2025-10-01', endDate: '2025-10-31', status: 'CLOSED', totalExits: 89, totalValue: '₹1.6 Cr' },
  { id: 3, label: 'April 2026', period: 'Apr 1 – Apr 30', startDate: '2026-04-01', endDate: '2026-04-30', status: 'OPEN', totalExits: 34, totalValue: '₹0.7 Cr' },
  { id: 4, label: 'October 2026', period: 'Oct 1 – Oct 31', startDate: '2026-10-01', endDate: '2026-10-31', status: 'UPCOMING', totalExits: 0, totalValue: '—' },
];

export default function ExitWindowsSection() {
  const [windows, setWindows] = useState<ExitWindow[]>(MOCK_WINDOWS);
  const [showCreate, setShowCreate] = useState(false);
  const [newWindow, setNewWindow] = useState({ label: '', startDate: '', endDate: '' });

  const toggleWindow = (id: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, status: w.status === 'OPEN' ? 'CLOSED' : 'OPEN' } : w));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const nw: ExitWindow = {
      id: Date.now(), label: newWindow.label,
      period: `${new Date(newWindow.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${new Date(newWindow.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
      startDate: newWindow.startDate, endDate: newWindow.endDate,
      status: 'UPCOMING', totalExits: 0, totalValue: '—',
    };
    setWindows(prev => [...prev, nw]);
    setShowCreate(false);
    setNewWindow({ label: '', startDate: '', endDate: '' });
  };

  const openCount = windows.filter(w => w.status === 'OPEN').length;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-heading font-semibold text-2xl text-white">Exit Windows</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-gold text-sm">
          {showCreate ? 'Cancel' : '+ New Window'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-10">
        <div className="ownly-card !p-5"><span className="uppercase-label text-[10px]">CURRENTLY OPEN</span><div className="font-heading font-bold text-3xl mt-2" style={{ color: openCount > 0 ? 'var(--green)' : 'var(--text-muted)' }}>{openCount}</div></div>
        <div className="ownly-card !p-5"><span className="uppercase-label text-[10px]">TOTAL EXITS</span><div className="font-heading font-bold text-3xl text-white mt-2">{windows.reduce((a, w) => a + w.totalExits, 0)}</div></div>
        <div className="ownly-card !p-5"><span className="uppercase-label text-[10px]">BIANNUAL SCHEDULE</span><div className="font-heading font-bold text-xl text-white mt-2">April & October</div></div>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="ownly-card mb-8">
          <span className="uppercase-label-gold text-[10px] block mb-4">CREATE EXIT WINDOW</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <div><label className="uppercase-label block mb-2">Label</label><input value={newWindow.label} onChange={e => setNewWindow({ ...newWindow, label: e.target.value })} className="ownly-input" placeholder="October 2026" required /></div>
            <div><label className="uppercase-label block mb-2">Start Date</label><input type="date" value={newWindow.startDate} onChange={e => setNewWindow({ ...newWindow, startDate: e.target.value })} className="ownly-input" required /></div>
            <div><label className="uppercase-label block mb-2">End Date</label><input type="date" value={newWindow.endDate} onChange={e => setNewWindow({ ...newWindow, endDate: e.target.value })} className="ownly-input" required /></div>
          </div>
          <button type="submit" className="btn-gold text-sm">Create Window</button>
        </form>
      )}

      {/* Windows list */}
      <div className="space-y-4">
        {windows.map(w => (
          <div key={w.id} className="ownly-card flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: w.status === 'OPEN' ? 'rgba(34,197,94,0.12)' : w.status === 'UPCOMING' ? 'rgba(245,166,35,0.12)' : 'rgba(255,255,255,0.05)' }}>
                {w.status === 'OPEN' ? <Unlock size={20} style={{ color: 'var(--green)' }} /> : w.status === 'UPCOMING' ? <Clock size={20} style={{ color: 'var(--amber)' }} /> : <Lock size={20} style={{ color: 'var(--text-muted)' }} />}
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-white">{w.label}</h3>
                <span className="text-xs text-[var(--text-secondary)]">{w.period}</span>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div><span className="uppercase-label text-[10px]">EXITS</span><div className="font-heading font-semibold text-white mt-1">{w.totalExits}</div></div>
              <div><span className="uppercase-label text-[10px]">VALUE</span><div className="font-heading font-semibold text-white mt-1">{w.totalValue}</div></div>
              <Badge variant={w.status === 'OPEN' ? 'live' : w.status === 'UPCOMING' ? 'pending' : 'muted'}>{w.status}</Badge>
              {w.status !== 'CLOSED' && (
                <button onClick={() => toggleWindow(w.id)} className={`btn-outline !py-2 !px-4 text-xs`} style={{ borderColor: w.status === 'OPEN' ? 'var(--red)' : 'var(--green)', color: w.status === 'OPEN' ? 'var(--red)' : 'var(--green)' }}>
                  {w.status === 'OPEN' ? <><Lock size={12} /> Close</> : <><Unlock size={12} /> Open</>}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
