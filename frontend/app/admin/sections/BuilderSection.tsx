'use client';

import React, { useState, useEffect } from 'react';
import { builderAPI } from '@/lib/api';
import { formatINR } from '@/lib/constants';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';
import { FolderKanban, CheckCircle2, XCircle, Eye, Upload, Clock, FileText, AlertTriangle } from 'lucide-react';
import type { BuilderProject } from '@/types';

export default function BuilderSection() {
  const [projects, setProjects] = useState<BuilderProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Milestone management
  const [milestoneForm, setMilestoneForm] = useState({ project_id: 0, milestone_name: '', description: '', funding_percentage: '', due_date: '' });
  const [showMilestoneForm, setShowMilestoneForm] = useState<number | null>(null);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try { const res = await builderAPI.getPendingProjects(); setProjects(res.data.pending_projects || []); }
    catch { setProjects([]); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try { await builderAPI.reviewProject(id, 'APPROVED'); setProjects(p => p.map(proj => proj.id === id ? { ...proj, status: 'APPROVED' } : proj)); }
    catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) return;
    setActionLoading(id);
    try { await builderAPI.reviewProject(id, 'REJECTED', rejectReason); setProjects(p => p.map(proj => proj.id === id ? { ...proj, status: 'REJECTED', rejection_reason: rejectReason } : proj)); setRejectModal(null); setRejectReason(''); }
    catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await builderAPI.addMilestone(milestoneForm.project_id, {
        milestone_name: milestoneForm.milestone_name,
        description: milestoneForm.description,
        funding_percentage: Number(milestoneForm.funding_percentage),
        due_date: milestoneForm.due_date,
      });
      setShowMilestoneForm(null);
      setMilestoneForm({ project_id: 0, milestone_name: '', description: '', funding_percentage: '', due_date: '' });
    } catch (e) { console.error(e); }
  };

  const getStatusVariant = (s: string) => {
    if (s === 'APPROVED' || s === 'LIVE') return 'live';
    if (s === 'REJECTED') return 'rejected';
    if (s === 'COMPLETED') return 'funded';
    return 'pending';
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-heading font-semibold text-2xl text-white">Builder Project Queue</h2>
        <span className="uppercase-label">{projects.length} projects</span>
      </div>

      {projects.length === 0 ? (
        <div className="ownly-card text-center py-16"><FolderKanban size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} /><p className="text-[var(--text-secondary)]">No builder projects pending.</p></div>
      ) : (
        <div className="space-y-5">
          {projects.map(proj => (
            <div key={proj.id} className="ownly-card">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-2">
                    <Badge variant={getStatusVariant(proj.status) as any}>{proj.status}</Badge>
                    <Badge variant="muted">{proj.property_type}</Badge>
                    <span className="uppercase-label text-[10px]">ID #{proj.id}</span>
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-white">{proj.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)]">
                    <span>📍 {proj.location}</span>
                    {proj.company_name && <span>· {proj.company_name}</span>}
                    {proj.fname && <span>· {proj.fname} {proj.lname}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  <div><span className="uppercase-label text-[10px]">FUNDING GOAL</span><div className="font-heading font-semibold text-white mt-1">{formatINR(proj.total_funding_goal)}</div></div>
                  <div><span className="uppercase-label text-[10px]">TOKEN PRICE</span><div className="font-heading font-semibold mt-1" style={{ color: 'var(--gold)' }}>{formatINR(proj.token_price)}</div></div>
                  <div><span className="uppercase-label text-[10px]">TOKENS</span><div className="font-heading font-semibold text-white mt-1 font-mono">{proj.total_tokens?.toLocaleString()}</div></div>
                </div>

                <div className="flex gap-2">
                  {proj.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleApprove(proj.id)} disabled={actionLoading === proj.id} className="btn-outline !py-2 !px-4 text-xs" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}><CheckCircle2 size={12} /> Approve</button>
                      <button onClick={() => { setRejectModal(proj.id); setRejectReason(''); }} className="btn-danger !py-2 !px-4 text-xs"><XCircle size={12} /> Reject</button>
                    </>
                  )}
                  <button onClick={() => setExpanded(expanded === proj.id ? null : proj.id)} className="btn-outline !py-2 !px-4 text-xs"><Eye size={12} /> {expanded === proj.id ? 'Hide' : 'Details'}</button>
                </div>
              </div>

              {/* Expanded: Milestones & Docs */}
              {expanded === proj.id && (
                <div className="mt-6 pt-6 border-t border-[var(--border-card)]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="uppercase-label-gold text-[10px]">MILESTONES & ESCROW RELEASES</span>
                    <button onClick={() => { setShowMilestoneForm(proj.id); setMilestoneForm({ ...milestoneForm, project_id: proj.id }); }} className="text-xs text-[var(--gold)] font-semibold cursor-pointer bg-transparent border-none">+ Add Milestone</button>
                  </div>

                  {showMilestoneForm === proj.id && (
                    <form onSubmit={handleAddMilestone} className="ownly-card !bg-[var(--bg-input)] mb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div><label className="uppercase-label block mb-2 text-[10px]">Milestone Name</label><input value={milestoneForm.milestone_name} onChange={e => setMilestoneForm({ ...milestoneForm, milestone_name: e.target.value })} className="ownly-input" placeholder="Foundation Complete" required /></div>
                        <div><label className="uppercase-label block mb-2 text-[10px]">Fund Release (%)</label><input value={milestoneForm.funding_percentage} onChange={e => setMilestoneForm({ ...milestoneForm, funding_percentage: e.target.value })} type="number" className="ownly-input" placeholder="20" required /></div>
                        <div><label className="uppercase-label block mb-2 text-[10px]">Due Date</label><input value={milestoneForm.due_date} onChange={e => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })} type="date" className="ownly-input" required /></div>
                        <div><label className="uppercase-label block mb-2 text-[10px]">Description</label><input value={milestoneForm.description} onChange={e => setMilestoneForm({ ...milestoneForm, description: e.target.value })} className="ownly-input" placeholder="All foundation piling done" /></div>
                      </div>
                      <div className="flex gap-3"><button type="submit" className="btn-gold text-xs">Save Milestone</button><button type="button" onClick={() => setShowMilestoneForm(null)} className="btn-outline text-xs">Cancel</button></div>
                    </form>
                  )}

                  {/* Sample milestone rows */}
                  <div className="space-y-3">
                    {[
                      { name: 'Land Acquisition & Title Clear', pct: 15, status: 'COMPLETED', doc: true },
                      { name: 'Foundation & Piling', pct: 20, status: 'PENDING', doc: true },
                      { name: 'Structural (G+10)', pct: 25, status: 'PENDING', doc: false },
                      { name: 'Finishing & Handover', pct: 40, status: 'PENDING', doc: false },
                    ].map((ms, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-card)]" style={{ background: 'var(--bg-input)' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: ms.status === 'COMPLETED' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)' }}>
                          {ms.status === 'COMPLETED' ? <CheckCircle2 size={16} style={{ color: 'var(--green)' }} /> : <Clock size={16} style={{ color: 'var(--amber)' }} />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">{ms.name}</div>
                          <div className="text-[10px] text-[var(--text-secondary)]">Releases {ms.pct}% of escrow</div>
                        </div>
                        <div className="w-24"><ProgressBar percentage={ms.status === 'COMPLETED' ? 100 : 0} height={4} /></div>
                        {ms.doc ? <span className="text-[10px] text-[var(--green)]"><FileText size={12} className="inline" /> Doc ✓</span> : <span className="text-[10px] text-[var(--text-muted)]">No doc</span>}
                        {ms.status === 'PENDING' && <button className="btn-outline !py-1.5 !px-3 text-[10px]" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>Release Fund</button>}
                      </div>
                    ))}
                  </div>

                  {proj.rejection_reason && (
                    <div className="mt-4 p-4 rounded-xl border border-[var(--red)]/30 bg-[var(--red)]/5">
                      <span className="uppercase-label text-[10px]" style={{ color: 'var(--red)' }}>REJECTION REASON</span>
                      <p className="text-sm text-white mt-1">{proj.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setRejectModal(null)}>
          <div className="ownly-card w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6"><AlertTriangle size={24} style={{ color: 'var(--red)' }} /><h3 className="font-heading font-semibold text-xl text-white">Reject Project</h3></div>
            <label className="uppercase-label block mb-2.5">Rejection reason *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. RERA docs incomplete, valuation mismatch..." className="ownly-input min-h-[100px] resize-y" />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setRejectModal(null)} className="btn-outline flex-1 justify-center">Cancel</button>
              <button onClick={() => handleReject(rejectModal)} disabled={!rejectReason.trim()} className="btn-danger flex-1 justify-center !py-3">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
