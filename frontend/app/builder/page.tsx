'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import MilestoneCard from '@/components/MilestoneCard';
import { TrendingUp, Wallet, Lock, Calendar, Hammer, Camera, Video, FileText } from 'lucide-react';
import GoldButton from '@/components/GoldButton';

// Mock data based on user instructions
const MOCK_PROJECT = {
  name: 'Skyline Hyderabad Tower',
  builderName: 'Aurelia Developments',
  stats: {
    constructionPct: 23,
    released: '₹22.20 Cr',
    locked: '₹125.80 Cr',
    handover: '30 Jun 2028',
  },
  milestones: [
    {
      name: 'Land + Approvals',
      percentage: 15,
      status: 'COMPLETED' as const,
      releasedDate: '13 MAR \'24',
      documents: [
        { name: 'Title deed (registered)', required: true, uploaded: true, uploadDate: '10 Mar 24' },
        { name: 'RERA registration', required: true, uploaded: true, uploadDate: '11 Mar 24' },
        { name: 'Encumbrance certificate', required: true, uploaded: true, uploadDate: '11 Mar 24' },
      ],
    },
    {
      name: 'Foundation + Plinth',
      percentage: 26,
      status: 'IN_PROGRESS' as const,
      dateRange: 'Apr 2024 - Dec 2024',
      trancheAmount: 222800000,
      documents: [
        { name: 'Site engineer attestation', required: true, uploaded: true },
        { name: 'QC report', required: true, uploaded: true },
        { name: 'PMC sign-off', required: true, uploaded: true },
        { name: 'Cube test results', required: true, uploaded: true },
      ],
    },
    {
      name: 'Structure (G+30)',
      percentage: 35,
      status: 'LOCKED' as const,
      dateRange: 'Jan 2025 - Dec 2026',
      trancheAmount: 510000000,
      documents: [
        { name: 'Structural completion certificate', required: true, uploaded: false },
        { name: 'Slab-wise QC dossier', required: true, uploaded: false },
      ],
    },
    {
      name: 'Finishing + Handover',
      percentage: 36,
      status: 'LOCKED' as const,
      dateRange: 'Jan 2027 - Jun 2028',
      trancheAmount: 525200000,
      documents: [
        { name: 'Occupancy certificate', required: true, uploaded: false },
        { name: 'Snag-list closure report', required: true, uploaded: false },
      ],
    },
  ],
  feed: [
    {
      date: '22 APR \'26',
      author: 'Site Engineer: B. Mehta',
      title: 'Raft slab pour completed — 3,400 m²',
      desc: 'M40 grade pour finished across full footprint. Cube tests sent to TUV. Next: column starter bars and basement waterproofing membrane.',
      photos: 14,
    },
    {
      date: '05 APR \'26',
      author: 'PM: A. Iyer',
      title: 'Excavation & shoring sign-off',
      desc: '12m basement excavation complete, secant pile wall load-tested by IIT-M. Geo-consultant report uploaded.',
      photos: 22,
    },
  ]
};

export default function BuilderPage() {
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDesc, setUpdateDesc] = useState('');

  return (
    <div className="page-container py-16 pb-24">
      <PageHeader
        breadcrumbIcon={<Hammer size={16} className="text-[var(--gold)]" />}
        breadcrumb={`BUILDER CONSOLE · ${MOCK_PROJECT.builderName.toUpperCase()}`}
        heading={MOCK_PROJECT.name}
        goldText=""
        subtitle="Plan milestones, attach required documents, and trigger escrow tranche releases. All updates are visible to 56,000 token-holders in real-time."
      />

      {/* ═══════════ TOP STATS ═══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="ownly-card !p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="uppercase-label text-[10px]">CONSTRUCTION</span>
            <TrendingUp size={16} className="text-[var(--text-muted)]" />
          </div>
          <div className="font-heading font-bold text-3xl text-white">{MOCK_PROJECT.stats.constructionPct}%</div>
        </div>
        <div className="ownly-card !p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="uppercase-label text-[10px]">RELEASED FROM ESCROW</span>
            <Wallet size={16} className="text-[var(--text-muted)]" />
          </div>
          <div className="font-heading font-bold text-3xl text-white">{MOCK_PROJECT.stats.released}</div>
        </div>
        <div className="ownly-card !p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="uppercase-label text-[10px]">ESCROW LOCKED</span>
            <Lock size={16} className="text-[var(--text-muted)]" />
          </div>
          <div className="font-heading font-bold text-3xl text-white">{MOCK_PROJECT.stats.locked}</div>
        </div>
        <div className="ownly-card !p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="uppercase-label text-[10px]">HANDOVER</span>
            <Calendar size={16} className="text-[var(--text-muted)]" />
          </div>
          <div className="font-heading font-bold text-3xl text-white">{MOCK_PROJECT.stats.handover}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (65%) */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Construction Timeline */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="font-heading font-bold text-2xl text-white mb-1">Construction timeline</h3>
                <p className="text-sm text-[var(--text-secondary)]">4 milestones · 100% of build allocated · Escrow-gated</p>
              </div>
              <button className="btn-outline !py-2 !px-4 text-xs font-semibold">+ Add milestone</button>
            </div>

            <div className="pl-2">
              {MOCK_PROJECT.milestones.map((m, i) => (
                <MilestoneCard key={i} {...m} />
              ))}
            </div>
          </section>

          {/* Post Update */}
          <section className="ownly-card">
            <h3 className="font-heading font-semibold text-lg text-white mb-4">+ Post a site update</h3>
            <input 
              className="ownly-input mb-4" 
              placeholder="Update title — e.g., Slab L+12 cast" 
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
            />
            <textarea 
              className="ownly-input min-h-[100px] resize-y mb-4" 
              placeholder="Describe what was completed, materials used, next steps..."
              value={updateDesc}
              onChange={(e) => setUpdateDesc(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-3">
                <button className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-white px-3 py-1.5 rounded bg-[var(--bg-input)]">
                  <Camera size={14} /> Photos
                </button>
                <button className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-white px-3 py-1.5 rounded bg-[var(--bg-input)]">
                  <Video size={14} /> Drone footage
                </button>
                <button className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-white px-3 py-1.5 rounded bg-[var(--bg-input)]">
                  <FileText size={14} /> QC report
                </button>
              </div>
              <GoldButton className="!py-2 !px-6 w-full sm:w-auto text-sm">Publish to investors</GoldButton>
            </div>
          </section>

          {/* Activity Feed */}
          <section>
            <h3 className="font-heading font-bold text-2xl text-white mb-6">Activity feed</h3>
            <div className="space-y-4">
              {MOCK_PROJECT.feed.map((post, i) => (
                <div key={i} className="ownly-card !p-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="uppercase-label text-[10px] text-[var(--gold)]">{post.date}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{post.author}</span>
                  </div>
                  <h4 className="font-heading font-semibold text-lg text-white mb-2">{post.title}</h4>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{post.desc}</p>
                  <div className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] border border-[var(--border-card)] rounded px-3 py-1">
                    <Camera size={12} /> {post.photos} photos attached
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (35%) */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="ownly-card">
            <span className="uppercase-label-gold block mb-2">ESCROW WATERFALL</span>
            <h3 className="font-heading font-semibold text-lg text-white mb-4">Capital release order</h3>
            <ol className="text-sm space-y-3 pl-4 list-decimal text-[var(--text-secondary)]">
              <li><strong className="text-white font-medium">Senior bank loan + interest</strong> (HDFC 70% sanctioned)</li>
              <li><strong className="text-white font-medium">Investor preferred return</strong> (14% IRR to token holders)</li>
              <li><strong className="text-white font-medium">Builder profit (residual)</strong> (Released only after #1 + #2)</li>
            </ol>
            <div className="mt-6 p-3 bg-[var(--amber)]/10 border border-[var(--amber)]/20 rounded-lg text-xs text-[var(--amber)] flex items-start gap-2">
              <span className="text-lg leading-none">⚠</span>
              <span>Builder cannot withdraw before investor returns are paid.</span>
            </div>
          </div>

          <div className="ownly-card">
            <span className="uppercase-label text-[10px] text-[var(--text-secondary)] block mb-1">NEXT TRANCHE</span>
            <div className="font-heading font-bold text-4xl text-[var(--gold)] mb-4">₹29.60 Cr</div>
            <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
              Releases when 'Foundation + Plinth' passes all required document checks.
            </p>
            <div className="space-y-2">
              {['Site engineer attestation', '3rd-party QC inspection report', 'PMC sign-off letter'].map((task, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <div className="w-3 h-3 rounded-full border border-[var(--text-muted)]" /> {task}
                </div>
              ))}
            </div>
          </div>

          <div className="ownly-card">
            <span className="uppercase-label text-[10px] text-[var(--text-secondary)] block mb-4">INVESTOR REACH</span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1">TOKEN HOLDERS</div>
                <div className="font-heading font-semibold text-white text-xl">1,842</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1">AVG TICKET</div>
                <div className="font-heading font-semibold text-white text-xl">₹48.2K</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1 mt-2">UPDATES POSTED</div>
                <div className="font-heading font-semibold text-white text-xl">2</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1 mt-2">OPEN QUERIES</div>
                <div className="font-heading font-semibold text-white text-xl">6</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
