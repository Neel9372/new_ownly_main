'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  Lock,
  LinkIcon,
  Building2,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Shield,
  Calendar,
} from 'lucide-react';
import GoldButton from '@/components/GoldButton';
import OutlineButton from '@/components/OutlineButton';
import { HERO_BG_IMAGE } from '@/lib/constants';

export default function HomePage() {
  return (
    <div>
      {/* ═══════════ HERO SECTION ═══════════ */}
      <section
        className="relative flex items-center min-h-[90vh]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.4) 100%), url(${HERO_BG_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="page-container w-full flex flex-col lg:flex-row items-center justify-between gap-16 py-24">
          {/* Left content */}
          <div className="max-w-xl animate-fade-in-up">
            {/* Top badge */}
            <div
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-10 text-xs"
              style={{
                background: 'rgba(245, 166, 35, 0.08)',
                border: '1px solid rgba(245, 166, 35, 0.2)',
                color: 'var(--gold)',
              }}
            >
              <Sparkles size={12} />
              Live · 412 properties tokenized · ₹148 Cr deployed
            </div>

            <h1
              className="font-heading font-bold leading-[1.05] mb-8"
              style={{ fontSize: 'clamp(48px, 7vw, 72px)', letterSpacing: '-0.02em' }}
            >
              Own it.
              <br />
              <span style={{ color: 'var(--gold)' }}>Own·ly.</span>
            </h1>

            <p className="text-base leading-relaxed mb-10 max-w-lg" style={{ color: 'var(--text-secondary)' }}>
              Tokenized fractional real estate for India. Pick your property, hold the tokens,
              earn rental yield, exit on your terms — no fund manager, no EMI, no middleman.
            </p>

            <div className="flex items-center gap-5 flex-wrap">
              <Link href="/marketplace">
                <GoldButton>Explore properties</GoldButton>
              </Link>
              <Link href="/#how-it-works">
                <OutlineButton>How it works</OutlineButton>
              </Link>
            </div>
          </div>

          {/* Right — Live NAV Card */}
          <div className="w-full max-w-md animate-fade-in-up stagger-2">
            <div className="glass-card p-8">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="uppercase-label-gold text-[10px]">LIVE NAV · OWN-IDX</span>
                <span
                  className="w-2 h-2 rounded-full animate-pulse-dot"
                  style={{ background: 'var(--green)' }}
                />
              </div>
              <div className="font-heading font-bold text-4xl text-white mb-2">₹1,847.32</div>
              <div className="flex items-center gap-1.5 text-sm mb-8" style={{ color: 'var(--green)' }}>
                <TrendingUp size={14} /> +2.31% this quarter
              </div>
              <div className="grid grid-cols-2 gap-5 pt-5" style={{ borderTop: '1px solid var(--border-card)' }}>
                {[
                  { label: 'YIELD AVG', value: '9.4%' },
                  { label: 'PROPERTIES', value: '412' },
                  { label: 'INVESTORS', value: '28.6K' },
                  { label: 'AUM', value: '₹148 Cr' },
                ].map((s) => (
                  <div key={s.label}>
                    <span className="uppercase-label text-[10px]">{s.label}</span>
                    <div className="font-heading font-semibold text-white mt-1">{s.value}</div>
                  </div>
                ))}
              </div>
              <div
                className="flex items-center justify-between mt-6 pt-5 text-xs"
                style={{ borderTop: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}
              >
                <span className="font-mono">Wallet · 0x4f...8a2c</span>
                <span style={{ color: 'var(--gold)' }}>12 holdings →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TWO MODELS SECTION ═══════════ */}
      <section className="section-gap">
        <div className="page-container">
          <div className="text-center mb-16">
            <span className="uppercase-label-gold">TWO MODELS · ONE PLATFORM</span>
            <h2 className="font-heading font-bold text-4xl mt-4">
              Built to <span style={{ color: 'var(--gold)' }}>replace</span> REITs and NBFCs.
            </h2>
            <p className="mt-4 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              OWNLY gives you direct ownership over the asset — not a pooled fund certificate.
              Two models, one platform, zero middlemen.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {/* Large card — Rental SPV */}
            <div className="ownly-card md:col-span-3 relative">
              <Lock size={20} className="absolute top-6 right-6" style={{ color: 'var(--text-muted)' }} />
              <span className="uppercase-label-gold text-[10px]">MODEL 01 — RENTAL SPV</span>
              <h3 className="font-heading font-semibold text-xl mt-3 mb-3 text-white">
                Own already-built property. Earn rent. Capture appreciation.
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                We acquire the asset on a Special Purpose Vehicle. You buy tokens proportional to
                your investment. Yields hit your wallet. NAV updates quarterly.
              </p>
            </div>

            {/* Tokenization */}
            <div className="ownly-card md:col-span-2 relative">
              <LinkIcon size={20} className="absolute top-6 right-6" style={{ color: 'var(--text-muted)' }} />
              <span className="uppercase-label-gold text-[10px]">TOKENIZATION</span>
              <h3 className="font-heading font-semibold text-lg mt-3 mb-2 text-white">
                Each ₹ = 1 token
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                ERC-style on-chain ledger. Wallet custody. Verifiable on every block.
              </p>
            </div>

            {/* Custody */}
            <div className="ownly-card md:col-span-2 relative">
              <Wallet size={20} className="absolute top-6 right-6" style={{ color: 'var(--text-muted)' }} />
              <span className="uppercase-label-gold text-[10px]">CUSTODY</span>
              <h3 className="font-heading font-semibold text-lg mt-3 mb-2 text-white">Wallet-native</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Public key + seed phrase. Transfer to any address. Exit without us.
              </p>
            </div>

            {/* Builder Raise */}
            <div className="ownly-card md:col-span-2 relative">
              <Building2 size={20} className="absolute top-6 right-6" style={{ color: 'var(--text-muted)' }} />
              <span className="uppercase-label-gold text-[10px]">MODEL 02 — BUILDER RAISE</span>
              <h3 className="font-heading font-semibold text-lg mt-3 mb-2 text-white">
                Pre-construction funding without EMI
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Builders raise the missing 20–50% gap left by banks. Escrow-gated milestones.
              </p>
            </div>

            {/* Exit Windows */}
            <div className="ownly-card md:col-span-1 relative">
              <Calendar size={20} className="absolute top-6 right-6" style={{ color: 'var(--text-muted)' }} />
              <span className="uppercase-label-gold text-[10px]">EXIT WINDOWS</span>
              <h3 className="font-heading font-semibold text-lg mt-3 mb-2 text-white">
                Two open windows&nbsp;/&nbsp;year
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Bid-ask matching. Or transfer wallet-to-wallet anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="section-gap" style={{ background: 'var(--bg-card)' }}>
        <div className="page-container">
          <div className="text-center mb-16">
            <span className="uppercase-label-gold">HOW IT WORKS</span>
            <h2 className="font-heading font-bold text-4xl mt-4">
              Four steps to <span style={{ color: 'var(--gold)' }}>ownership.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Browse',
                desc: 'Explore RERA-verified properties across Indian cities. Filter by yield, location, and entry price.',
                tags: ['Marketplace', 'Filters'],
              },
              {
                step: '02',
                title: 'Invest',
                desc: 'Complete KYC, connect your wallet, and buy tokens directly on-chain. No minimum lock-in.',
                tags: ['KYC', 'MetaMask'],
              },
              {
                step: '03',
                title: 'Earn',
                desc: 'Rental yield is distributed proportional to your token holding. Quarterly NAV updates.',
                tags: ['Quarterly', 'Pro-rata'],
              },
              {
                step: '04',
                title: 'Exit',
                desc: 'Sell during exit windows (April & October) or transfer wallet-to-wallet anytime.',
                tags: ['Every 6 months', 'P2P transfer'],
              },
            ].map((s) => (
              <div key={s.step} className="ownly-card group">
                <span className="font-heading font-bold text-5xl" style={{ color: 'var(--gold)', opacity: 0.3 }}>
                  {s.step}
                </span>
                <h3 className="font-heading font-semibold text-xl text-white mt-5 mb-4">{s.title}</h3>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {s.desc}
                </p>
                <div className="flex gap-2.5 flex-wrap">
                  {s.tags.map((t) => (
                    <span key={t} className="badge badge-muted text-[10px]">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}