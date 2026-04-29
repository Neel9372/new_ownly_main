'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { investmentsAPI } from '@/lib/api';
import { formatINR, shortenAddress } from '@/lib/constants';
import type { Investment, PortfolioSummary } from '@/types';
import { TrendingUp, Coins, Calendar, ArrowDownRight, Wallet as WalletIcon, ArrowUpRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function PortfolioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { address } = useWallet();
  
  const [portfolio, setPortfolio] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary>({ total_invested: 0, total_tokens_owned: 0, total_properties: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchPortfolio();
  }, [user]);

  const fetchPortfolio = async () => {
    try {
      const res = await investmentsAPI.getPortfolio();
      setPortfolio(res.data.portfolio);
      setSummary(res.data.summary);
    } catch (err) {
      console.error('Failed to fetch portfolio', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading portfolio...</div>;
  }

  // Calculate total current value (mocked as invested amount + some yield for demo purposes if needed, here we use precise data if available)
  const totalCurrentValue = portfolio.reduce((acc, inv) => {
    // Current value = tokens * token_price
    return acc + (inv.tokens_owned * (inv.token_price || 0));
  }, 0);

  const totalYieldYr = portfolio.reduce((acc, inv) => {
    return acc + (inv.estimated_annual_return || 0);
  }, 0);

  const plValue = totalCurrentValue - summary.total_invested;
  const plPercentage = summary.total_invested > 0 ? (plValue / summary.total_invested) * 100 : 0;

  return (
    <div className="page-container py-16 pb-24">
      <PageHeader
        breadcrumb={`WALLET · ${address ? shortenAddress(address).toUpperCase() : 'NOT CONNECTED'}`}
        heading="Your"
        goldText="portfolio"
      />

      {/* ═══════════ STATS GRID ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        {/* Large Card (Left 50%) */}
        <div className="ownly-card flex flex-col justify-between">
          <div>
            <span className="uppercase-label text-[10px]">TOTAL PORTFOLIO VALUE</span>
            <div className="font-heading font-bold text-5xl text-white mt-2">
              {formatINR(totalCurrentValue > 0 ? totalCurrentValue : summary.total_invested)}
            </div>
            {summary.total_invested > 0 && (
              <div className="flex items-center gap-1 mt-2 text-sm font-semibold" style={{ color: plValue >= 0 ? 'var(--green)' : 'var(--red)' }}>
                <TrendingUp size={16} className={plValue < 0 ? 'rotate-180' : ''} />
                {plValue >= 0 ? '+' : ''}{formatINR(plValue)} ({plValue >= 0 ? '+' : ''}{plPercentage.toFixed(1)}%)
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-[var(--border-card)]">
            <div>
              <span className="uppercase-label text-[10px]">INVESTED</span>
              <div className="font-heading font-semibold text-white mt-1 text-lg">
                {formatINR(summary.total_invested)}
              </div>
            </div>
            <div>
              <span className="uppercase-label text-[10px]">YIELD (YR)</span>
              <div className="font-heading font-semibold mt-1 text-lg" style={{ color: 'var(--gold)' }}>
                {formatINR(totalYieldYr)}
              </div>
            </div>
            <div>
              <span className="uppercase-label text-[10px]">HOLDINGS</span>
              <div className="font-heading font-semibold text-white mt-1 text-lg">
                {summary.total_properties}
              </div>
            </div>
          </div>
        </div>

        {/* 6 Smaller Stat Cards in 2x3 grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="ownly-card !p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="uppercase-label text-[9px]">TOKENS HELD</span>
              <Coins size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="font-heading font-bold text-2xl text-white mt-2">{summary.total_tokens_owned}</div>
          </div>

          <div className="ownly-card !p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="uppercase-label text-[9px]">AVG YIELD</span>
              <TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="font-heading font-bold text-2xl mt-2" style={{ color: 'var(--gold)' }}>
              {portfolio.length > 0 ? (portfolio.reduce((acc, inv) => acc + (inv.gross_yield || 0), 0) / portfolio.length).toFixed(1) : '0'}%
            </div>
          </div>

          <div className="ownly-card !p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="uppercase-label text-[9px]">NEXT EXIT WINDOW</span>
              <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="font-heading font-bold text-xl text-white mt-2">Apr 14</div>
          </div>

          <div className="ownly-card !p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="uppercase-label text-[9px]">QUARTER NAV</span>
              <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="font-heading font-bold text-2xl mt-2" style={{ color: 'var(--green)' }}>+2.31%</div>
          </div>

          <div className="ownly-card !p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="uppercase-label text-[9px]">PENDING PAYOUTS</span>
              <ArrowDownRight size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="font-heading font-bold text-xl text-white mt-2">₹4.8K</div>
          </div>

          <div className="ownly-card !p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="uppercase-label text-[9px]">WALLET LIQUID</span>
              <WalletIcon size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="font-heading font-bold text-xl text-white mt-2">₹15.4K</div>
          </div>
        </div>
      </div>

      {/* ═══════════ HOLDINGS TABLE ═══════════ */}
      <div className="mb-6 flex justify-between items-end">
        <h2 className="font-heading font-bold text-2xl text-white">Holdings</h2>
        <Link href="/marketplace" className="text-xs font-semibold no-underline flex items-center gap-1" style={{ color: 'var(--gold)' }}>
          Add more <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="ownly-card !p-0 overflow-hidden overflow-x-auto">
        <table className="ownly-table min-w-[800px]">
          <thead>
            <tr>
              <th className="pl-6">PROPERTY</th>
              <th>TOKENS</th>
              <th>INVESTED</th>
              <th>CURRENT VALUE</th>
              <th className="pr-6">P/L</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[var(--text-secondary)]">
                  You don't have any investments yet.
                </td>
              </tr>
            ) : (
              portfolio.map((inv) => {
                const cv = inv.tokens_owned * (inv.token_price || 0);
                const pl = cv - inv.invested_amount;
                return (
                  <tr key={inv.id} className="transition-colors hover:bg-[var(--bg-card-hover)]">
                    <td className="pl-6">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${inv.image_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&q=80'})` }}
                        />
                        <div>
                          <Link href={`/marketplace/${inv.property_id}`} className="font-heading font-semibold text-white no-underline hover:text-[var(--gold)] transition-colors">
                            {inv.title}
                          </Link>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {inv.location?.split(',')[0]} · {inv.property_type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{inv.tokens_owned}</td>
                    <td className="text-sm">{formatINR(inv.invested_amount)}</td>
                    <td className="text-sm">{formatINR(cv)}</td>
                    <td className="pr-6">
                      <span className="text-sm font-semibold" style={{ color: pl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {pl > 0 ? '+' : ''}{formatINR(pl)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
