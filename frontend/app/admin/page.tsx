'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/PageHeader';
import {
  ShieldCheck, Users, Building2, Landmark, Coins,
  CalendarClock, FolderKanban, Clock, CheckCircle2,
  XCircle, Plus,
} from 'lucide-react';

import KYCSection from './sections/KYCSection';
import PropertiesSection from './sections/PropertiesSection';
import BuilderSection from './sections/BuilderSection';
import InvestorsSection from './sections/InvestorsSection';
import TokensSection from './sections/TokensSection';
import ExitWindowsSection from './sections/ExitWindowsSection';
import PoolsSection from './sections/PoolsSection';
import BuilderApprovalsSection from './sections/BuilderApprovalsSection';

const TABS = [
  { id: 'kyc', label: 'KYC', icon: ShieldCheck },
  { id: 'builder-approvals', label: 'Builder Approvals', icon: ShieldCheck },
  { id: 'properties', label: 'Properties', icon: Building2 },
  { id: 'builders', label: 'Builder Projects', icon: FolderKanban },
  { id: 'investors', label: 'Investors', icon: Users },
  { id: 'tokens', label: 'Tokens', icon: Coins },
  { id: 'exits', label: 'Exit Windows', icon: CalendarClock },
  { id: 'pools', label: 'Pools', icon: Landmark },
];

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('kyc');

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.push('/');
  }, [user, router]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} />
          <span className="uppercase-label text-[10px]">VERIFYING ACCESS</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-16 pb-28">
      <PageHeader
        breadcrumbIcon={<ShieldCheck size={16} className="text-[var(--gold)]" />}
        breadcrumb="ADMIN · CONTROL CENTER"
        heading="Operate the"
        goldText="marketplace."
        subtitle="KYC approvals, property management, milestone escrow, token minting, exit windows, and pool management — all from one console."
      />

      {/* ═══════════ TAB BAR ═══════════ */}
      <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-1 -mx-2 px-2" style={{ scrollbarWidth: 'none' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all whitespace-nowrap cursor-pointer border-none"
              style={{
                background: isActive ? 'var(--gold)' : 'var(--bg-card)',
                color: isActive ? '#000' : 'var(--text-secondary)',
                border: isActive ? 'none' : '1px solid var(--border-card)',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════ TAB CONTENT ═══════════ */}
      {activeTab === 'kyc' && <KYCSection />}
      {activeTab === 'builder-approvals' && <BuilderApprovalsSection />}
      {activeTab === 'properties' && <PropertiesSection />}
      {activeTab === 'builders' && <BuilderSection />}
      {activeTab === 'investors' && <InvestorsSection />}
      {activeTab === 'tokens' && <TokensSection />}
      {activeTab === 'exits' && <ExitWindowsSection />}
      {activeTab === 'pools' && <PoolsSection />}
    </div>
  );
}