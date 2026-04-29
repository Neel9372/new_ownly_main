'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { investmentsAPI, rentalAPI, propertiesAPI } from '@/lib/api';
import { formatINR, shortenAddress, formatINRFull } from '@/lib/constants';
import type { Investment, PortfolioSummary, Transaction, PropertyListing } from '@/types';
import {
  TrendingUp,
  Coins,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet as WalletIcon,
  Building2,
  Shield,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Activity,
  PieChart,
  BarChart3,
  Eye,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import GoldButton from '@/components/GoldButton';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { address, connect } = useWallet();

  const [portfolio, setPortfolio] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary>({ total_invested: 0, total_tokens_owned: 0, total_properties: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trendingProperties, setTrendingProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [portfolioRes, txRes, propRes] = await Promise.allSettled([
        investmentsAPI.getPortfolio(),
        investmentsAPI.getTransactions(),
        propertiesAPI.getAll(),
      ]);

      if (portfolioRes.status === 'fulfilled') {
        setPortfolio(portfolioRes.value.data.portfolio);
        setSummary(portfolioRes.value.data.summary);
      }
      if (txRes.status === 'fulfilled') {
        setTransactions(txRes.value.data.transactions?.slice(0, 8) || []);
      }
      if (propRes.status === 'fulfilled') {
        setTrendingProperties(propRes.value.data.properties?.slice(0, 4) || []);
      }
    } catch (err) {
      console.error('Dashboard data fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  // Computed stats
  const totalCurrentValue = portfolio.reduce((acc, inv) => acc + (inv.tokens_owned * (inv.token_price || 0)), 0);
  const totalYieldYr = portfolio.reduce((acc, inv) => acc + (inv.estimated_annual_return || 0), 0);
  const plValue = totalCurrentValue - summary.total_invested;
  const plPercentage = summary.total_invested > 0 ? (plValue / summary.total_invested) * 100 : 0;
  const avgYield = portfolio.length > 0 ? portfolio.reduce((acc, inv) => acc + (inv.gross_yield || 0), 0) / portfolio.length : 0;

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} />
          <span className="uppercase-label text-[10px]">LOADING DASHBOARD</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-12 pb-28">

      {/* ═══════════ HEADER ═══════════ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-14">
        <div>
          <span className="uppercase-label-gold text-[10px] flex items-center gap-2">
            <Sparkles size={12} /> INVESTOR DASHBOARD
          </span>
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-white mt-3">
            {greeting}, <span style={{ color: 'var(--gold)' }}>{user?.fname || 'Investor'}</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            Here's your portfolio snapshot and recent activity.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Wallet status */}
          <div className="glass-card px-5 py-2.5 flex items-center gap-2.5 text-xs">
            <WalletIcon size={14} style={{ color: address ? 'var(--green)' : 'var(--text-muted)' }} />
            {address ? (
              <span className="font-mono text-white">{shortenAddress(address)}</span>
            ) : (
              <button onClick={connect} className="text-[var(--gold)] hover:underline cursor-pointer bg-transparent border-none font-inherit text-xs">
                Connect Wallet
              </button>
            )}
          </div>

          {/* KYC status */}
          <div className="glass-card px-5 py-2.5 flex items-center gap-2.5 text-xs">
            <Shield size={14} style={{ color: user?.kyc_status === 'VERIFIED' ? 'var(--green)' : 'var(--amber)' }} />
            <span className="text-white">
              KYC: {user?.kyc_status === 'VERIFIED' ? 'Verified' : user?.kyc_status === 'SUBMITTED' ? 'Pending' : 'Required'}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════ TOP STATS GRID ═══════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Portfolio Value */}
        <div className="ownly-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" style={{ background: 'var(--gold)', filter: 'blur(40px)' }} />
          <div className="flex justify-between items-start mb-1">
            <span className="uppercase-label text-[9px]">TOTAL VALUE</span>
            <PieChart size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="font-heading font-bold text-3xl text-white mt-2">
            {formatINR(totalCurrentValue > 0 ? totalCurrentValue : summary.total_invested)}
          </div>
          {summary.total_invested > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold" style={{ color: plValue >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {plValue >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {plValue >= 0 ? '+' : ''}{plPercentage.toFixed(1)}% all time
            </div>
          )}
        </div>

        {/* Total Invested */}
        <div className="ownly-card">
          <div className="flex justify-between items-start mb-1">
            <span className="uppercase-label text-[9px]">INVESTED</span>
            <Coins size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="font-heading font-bold text-3xl text-white mt-2">
            {formatINR(summary.total_invested)}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
            across {summary.total_properties} {summary.total_properties === 1 ? 'property' : 'properties'}
          </div>
        </div>

        {/* Average Yield */}
        <div className="ownly-card">
          <div className="flex justify-between items-start mb-1">
            <span className="uppercase-label text-[9px]">AVG YIELD</span>
            <TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="font-heading font-bold text-3xl mt-2" style={{ color: 'var(--gold)' }}>
            {avgYield.toFixed(1)}%
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
            blended annual return
          </div>
        </div>

        {/* Tokens Held */}
        <div className="ownly-card">
          <div className="flex justify-between items-start mb-1">
            <span className="uppercase-label text-[9px]">TOKENS HELD</span>
            <BarChart3 size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="font-heading font-bold text-3xl text-white mt-2">
            {summary.total_tokens_owned.toLocaleString()}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
            $OYD tokens total
          </div>
        </div>
      </div>

      {/* ═══════════ QUICK ACTIONS + ALERTS ═══════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Next Exit Window */}
        <div className="ownly-card border-l-2" style={{ borderLeftColor: 'var(--amber)' }}>
          <div className="flex items-start gap-4">
            <Calendar size={20} style={{ color: 'var(--amber)' }} className="mt-0.5 shrink-0" />
            <div>
              <span className="uppercase-label text-[9px]" style={{ color: 'var(--amber)' }}>NEXT EXIT WINDOW</span>
              <div className="font-heading font-semibold text-xl text-white mt-1">October 2026</div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Sell tokens in the bi-annual window or transfer wallet-to-wallet anytime.
              </p>
            </div>
          </div>
        </div>

        {/* NAV Update */}
        <div className="ownly-card border-l-2" style={{ borderLeftColor: 'var(--green)' }}>
          <div className="flex items-start gap-3">
            <Activity size={20} style={{ color: 'var(--green)' }} className="mt-0.5 shrink-0" />
            <div>
              <span className="uppercase-label text-[9px]" style={{ color: 'var(--green)' }}>QUARTERLY NAV</span>
              <div className="font-heading font-semibold text-xl mt-1" style={{ color: 'var(--green)' }}>+2.31%</div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Last updated: Q1 2026. Next update in Q2 2026.
              </p>
            </div>
          </div>
        </div>

        {/* KYC Prompt / Quick Invest */}
        {user?.kyc_status !== 'VERIFIED' ? (
          <div className="ownly-card border-l-2 cursor-pointer group" style={{ borderLeftColor: 'var(--gold)' }} onClick={() => router.push('/kyc')}>
            <div className="flex items-start gap-3">
              <Shield size={20} style={{ color: 'var(--gold)' }} className="mt-0.5 shrink-0" />
              <div>
                <span className="uppercase-label text-[9px]" style={{ color: 'var(--gold)' }}>ACTION REQUIRED</span>
                <div className="font-heading font-semibold text-lg text-white mt-1">Complete KYC</div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Verify your identity to start investing in properties.
                </p>
              </div>
              <ChevronRight size={16} className="ml-auto shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--gold)' }} />
            </div>
          </div>
        ) : (
          <Link href="/marketplace" className="no-underline">
            <div className="ownly-card border-l-2 cursor-pointer group h-full" style={{ borderLeftColor: 'var(--gold)' }}>
              <div className="flex items-start gap-3">
                <Building2 size={20} style={{ color: 'var(--gold)' }} className="mt-0.5 shrink-0" />
                <div>
                  <span className="uppercase-label text-[9px]" style={{ color: 'var(--gold)' }}>QUICK ACTION</span>
                  <div className="font-heading font-semibold text-lg text-white mt-1">Explore Properties</div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Find your next fractional real estate investment.
                  </p>
                </div>
                <ChevronRight size={16} className="ml-auto shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--gold)' }} />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* ═══════════ MAIN CONTENT: 2-COLUMN ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

        {/* LEFT (60%) — Holdings + Trending */}
        <div className="lg:col-span-3 space-y-8">

          {/* Holdings Quick View */}
          <div className="ownly-card !p-0 overflow-hidden">
            <div className="flex justify-between items-center p-5 pb-3">
              <h3 className="font-heading font-semibold text-lg text-white">Your Holdings</h3>
              <Link href="/portfolio" className="text-xs no-underline flex items-center gap-1" style={{ color: 'var(--gold)' }}>
                View all <ArrowUpRight size={12} />
              </Link>
            </div>

            {portfolio.length === 0 ? (
              <div className="px-5 pb-6">
                <div className="text-center py-8 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px dashed var(--border-input)' }}>
                  <Building2 size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No holdings yet. Start investing today.</p>
                  <Link href="/marketplace">
                    <button className="btn-gold mt-4 text-xs !py-2 !px-5">Browse Properties</button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[var(--bg-input)]">
                {portfolio.slice(0, 5).map((inv) => {
                  const currentValue = inv.tokens_owned * (inv.token_price || 0);
                  const pl = currentValue - inv.invested_amount;
                  return (
                    <Link key={inv.id} href={`/marketplace/${inv.property_id}`} className="no-underline">
                      <div className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg-card-hover)] transition-colors">
                        <div
                          className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0"
                          style={{ backgroundImage: `url(${inv.image_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&q=80'})` }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-heading font-semibold text-sm text-white truncate">{inv.title || `Property #${inv.property_id}`}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {inv.tokens_owned} tokens · {inv.location?.split(',')[0] || 'India'}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-semibold text-white">{formatINR(currentValue > 0 ? currentValue : inv.invested_amount)}</div>
                          <div className="text-xs font-semibold" style={{ color: pl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {pl >= 0 ? '+' : ''}{formatINR(pl)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trending Properties */}
          {trendingProperties.length > 0 && (
            <div>
              <div className="flex justify-between items-end mb-4">
                <h3 className="font-heading font-semibold text-lg text-white">Trending Properties</h3>
                <Link href="/marketplace" className="text-xs no-underline flex items-center gap-1" style={{ color: 'var(--gold)' }}>
                  See all <ArrowUpRight size={12} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trendingProperties.map((prop) => (
                  <Link key={prop.id} href={`/marketplace/${prop.id}`} className="no-underline">
                    <div className="ownly-card group !p-0 overflow-hidden">
                      <div
                        className="w-full h-32 bg-cover bg-center relative"
                        style={{ backgroundImage: `url(${prop.image_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80'})` }}
                      >
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg-card) 0%, transparent 60%)' }} />
                        <div className="absolute top-3 left-3">
                          <Badge variant={prop.status === 'AVAILABLE' ? 'live' : 'muted'}>{prop.status}</Badge>
                        </div>
                      </div>
                      <div className="p-4 pt-0 -mt-4 relative z-10">
                        <div className="font-heading font-semibold text-sm text-white group-hover:text-[var(--gold)] transition-colors truncate">
                          {prop.title}
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {prop.location?.split(',')[0]}
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--border-card)]">
                          <div>
                            <span className="text-[9px] uppercase-label">YIELD</span>
                            <div className="font-heading font-semibold text-sm" style={{ color: 'var(--gold)' }}>{Number(prop.gross_yield).toFixed(1)}%</div>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase-label">ENTRY</span>
                            <div className="font-heading font-semibold text-sm text-white">{formatINR(Number(prop.token_price))}</div>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase-label">FUNDED</span>
                            <div className="font-heading font-semibold text-sm text-white">{Number(prop.funding_percentage).toFixed(0)}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT (40%) — Transactions + Summary */}
        <div className="lg:col-span-2 space-y-6">

          {/* Yield Summary Card */}
          <div className="ownly-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.03]" style={{ background: 'var(--gold)', filter: 'blur(60px)' }} />
            <span className="uppercase-label-gold text-[10px]">ESTIMATED ANNUAL YIELD</span>
            <div className="font-heading font-bold text-4xl mt-3" style={{ color: 'var(--gold)' }}>
              {formatINR(totalYieldYr)}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              ≈ {formatINR(totalYieldYr / 12)}/month projected
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-card)]">
              <div className="flex justify-between text-sm mb-3">
                <span style={{ color: 'var(--text-secondary)' }}>Rental income</span>
                <span className="text-white font-medium">{formatINR(totalYieldYr * 0.7)}</span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span style={{ color: 'var(--text-secondary)' }}>Appreciation est.</span>
                <span className="text-white font-medium">{formatINR(totalYieldYr * 0.3)}</span>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-[var(--border-card)]">
                <span className="text-white font-semibold">Total IRR target</span>
                <span className="font-heading font-bold text-lg" style={{ color: 'var(--gold)' }}>
                  {avgYield > 0 ? (avgYield + 3).toFixed(1) : '0'}%
                </span>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="ownly-card !p-0 overflow-hidden">
            <div className="flex justify-between items-center p-5 pb-3">
              <h3 className="font-heading font-semibold text-base text-white">Recent Activity</h3>
              <span className="uppercase-label text-[9px]">{transactions.length} events</span>
            </div>

            {transactions.length === 0 ? (
              <div className="px-5 pb-5">
                <div className="text-center py-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No transactions yet.
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[var(--bg-input)]">
                {transactions.slice(0, 6).map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: tx.type === 'INVEST'
                          ? 'rgba(245, 166, 35, 0.1)'
                          : tx.type === 'RENTAL'
                          ? 'rgba(34, 197, 94, 0.1)'
                          : 'rgba(239, 68, 68, 0.1)',
                        color: tx.type === 'INVEST'
                          ? 'var(--gold)'
                          : tx.type === 'RENTAL'
                          ? 'var(--green)'
                          : 'var(--red)',
                      }}
                    >
                      {tx.type === 'INVEST' && <ArrowUpRight size={14} />}
                      {tx.type === 'RENTAL' && <ArrowDownRight size={14} />}
                      {tx.type === 'WITHDRAW' && <ArrowDownRight size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {tx.type === 'INVEST' ? 'Investment' : tx.type === 'RENTAL' ? 'Rental Payout' : 'Withdrawal'}
                      </div>
                      <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                        {tx.property_title || `Property #${tx.property_id}`}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold" style={{ color: tx.type === 'RENTAL' ? 'var(--green)' : 'var(--text-white)' }}>
                        {tx.type === 'RENTAL' ? '+' : ''}{formatINR(tx.amount)}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Portfolio Allocation */}
          {portfolio.length > 0 && (
            <div className="ownly-card">
              <span className="uppercase-label text-[10px]">ALLOCATION BREAKDOWN</span>
              <div className="mt-4 space-y-3">
                {portfolio.slice(0, 5).map((inv) => {
                  const pct = summary.total_invested > 0 ? (inv.invested_amount / summary.total_invested) * 100 : 0;
                  return (
                    <div key={inv.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white truncate max-w-[65%]">{inv.title || `Property #${inv.property_id}`}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{pct.toFixed(1)}%</span>
                      </div>
                      <ProgressBar percentage={pct} height={4} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Platform Info */}
          <div className="ownly-card" style={{ background: 'rgba(245, 166, 35, 0.03)', borderColor: 'rgba(245, 166, 35, 0.1)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} style={{ color: 'var(--gold)' }} />
              <span className="uppercase-label text-[9px]" style={{ color: 'var(--gold)' }}>PLATFORM STATS</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="font-heading font-bold text-lg text-white">412</div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Properties</div>
              </div>
              <div>
                <div className="font-heading font-bold text-lg text-white">28.6K</div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Investors</div>
              </div>
              <div>
                <div className="font-heading font-bold text-lg" style={{ color: 'var(--gold)' }}>₹148Cr</div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>AUM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}