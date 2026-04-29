'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { propertiesAPI, investmentsAPI } from '@/lib/api';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { investOnChain } from '@/lib/contracts';
import { formatINR, PROPERTY_IMAGES } from '@/lib/constants';
import type { PropertyDetail } from '@/types';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';
import GoldButton from '@/components/GoldButton';
import { ChevronLeft, MapPin, CheckCircle2 } from 'lucide-react';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = Number(params.id);
  
  const { user } = useAuth();
  const { signer, connect } = useWallet();

  const [data, setData] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [investAmount, setInvestAmount] = useState<number>(0);
  const [isInvesting, setIsInvesting] = useState(false);
  const [investError, setInvestError] = useState('');
  const [investSuccess, setInvestSuccess] = useState('');

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const res = await propertiesAPI.getById(propertyId);
      setData(res.data);
      setInvestAmount(Number(res.data.funding.token_price)); // Default to 1 token
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async () => {
    setInvestError('');
    setInvestSuccess('');

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.kyc_status !== 'VERIFIED') {
      router.push('/kyc');
      return;
    }

    if (!signer) {
      try {
        await connect();
      } catch (err: any) {
        setInvestError(err.message || 'Wallet connection failed');
        return;
      }
    }

    if (!signer) return; // Still no signer after connect attempt

    const tokensToBuy = Math.floor(investAmount / Number(data!.funding.token_price));
    if (tokensToBuy <= 0) {
      setInvestError('Investment amount must be at least 1 token price.');
      return;
    }

    setIsInvesting(true);

    try {
      // 1. Call Smart Contract
      // NOTE: In a real environment, you'd calculate exact ETH/MATIC equivalent.
      // Here, we're assuming a 1:1 test token ratio for demo purposes or using MockINRC
      // Since the requirements state `value: parseEther(amount)` for the invest function,
      // we'll pass the amount. However, if using MockINRC (ERC20), it would be an approve + transferFrom.
      // We will stick to the simplified investOnChain provided in contracts.ts.
      
      const receipt = await investOnChain(signer, propertyId, investAmount.toString());
      
      // 2. Report to Backend
      await investmentsAPI.invest({
        property_id: propertyId,
        tokens_to_buy: tokensToBuy,
        transaction_hash: receipt.hash,
      });

      setInvestSuccess(`Successfully invested ${formatINR(investAmount)}! Transaction Hash: ${receipt.hash}`);
      fetchProperty(); // Refresh data
      
    } catch (err: any) {
      console.error(err);
      setInvestError(err.response?.data?.error || err.message || 'Investment failed');
    } finally {
      setIsInvesting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center">Property not found.</div>;
  }

  const { property, financials, funding, leasing } = data;
  const imgUrl = data.media?.image_url || PROPERTY_IMAGES[propertyId % PROPERTY_IMAGES.length];
  const model = property.source === 'BUILDER' ? 'BUILDER RAISE' : 'RENTAL SPV';

  return (
    <div className="pb-28">
      {/* ═══════════ HERO HEADER ═══════════ */}
      <div 
        className="relative w-full h-[60vh] min-h-[400px] flex flex-col justify-end pb-16"
        style={{
          backgroundImage: `linear-gradient(to top, var(--bg-page) 0%, rgba(10,10,10,0.6) 50%, rgba(0,0,0,0.8) 100%), url(${imgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute top-8 left-8 lg:left-12">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-white no-underline hover:text-[var(--gold)] transition-colors">
            <ChevronLeft size={16} /> Back to Marketplace
          </Link>
        </div>

        <div className="page-container relative z-10 flex flex-col md:flex-row justify-between items-end gap-10">
          <div>
            <div className="flex gap-2.5 mb-5 flex-wrap">
              <Badge variant="muted">{model}</Badge>
              <Badge variant={property.status === 'AVAILABLE' ? 'live' : 'muted'}>{property.status}</Badge>
              {property.rera_id && <Badge variant="muted" className="font-mono">RERA · {property.rera_id}</Badge>}
            </div>
            
            <h1 className="font-heading font-bold text-5xl md:text-6xl text-white mb-5">
              {property.title}
            </h1>
            
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <MapPin size={16} /> {property.location}
              </span>
              <Badge variant="muted">{property.property_type}</Badge>
            </div>
          </div>

          {/* Investment Quick Panel */}
          <div className="glass-card p-8 w-full md:w-[340px] border border-[var(--gold)]/20 shadow-2xl">
            <div className="flex justify-between items-start mb-5">
              <span className="uppercase-label text-[10px]">MIN INVESTMENT</span>
              <span className="font-heading font-bold text-3xl" style={{ color: 'var(--gold)' }}>
                {formatINR(Number(funding.token_price))}
              </span>
            </div>
            
            {investError && (
              <div className="text-xs text-[var(--red)] mb-4">{investError}</div>
            )}
            {investSuccess && (
              <div className="text-xs text-[var(--green)] mb-4">{investSuccess}</div>
            )}

            <div className="mb-5">
               <input 
                 type="number" 
                 value={investAmount} 
                 onChange={e => setInvestAmount(Number(e.target.value))}
                 className="ownly-input !py-3 !text-lg"
                 step={funding.token_price}
                 min={funding.token_price}
               />
               <div className="text-[10px] text-[var(--text-secondary)] mt-1 text-right">
                 {Math.floor(investAmount / Number(funding.token_price))} Tokens
               </div>
            </div>

            <GoldButton fullWidth onClick={handleInvest} disabled={isInvesting || property.status !== 'AVAILABLE'}>
              {isInvesting ? 'Processing...' : 'Invest now'}
            </GoldButton>
          </div>
        </div>
      </div>

      <div className="page-container mt-12">
        
        {/* ═══════════ STATS BAR ═══════════ */}
        <div className="ownly-card grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div>
            <span className="uppercase-label text-[10px]">VALUATION</span>
            <div className="font-heading font-semibold text-2xl text-white mt-1">{formatINR(Number(financials.property_price))}</div>
          </div>
          <div>
            <span className="uppercase-label text-[10px]">TOKEN PRICE</span>
            <div className="font-heading font-semibold text-2xl text-white mt-1">{formatINR(Number(funding.token_price))}</div>
          </div>
          <div>
            <span className="uppercase-label text-[10px]">RENTAL YIELD</span>
            <div className="font-heading font-semibold text-2xl mt-1" style={{ color: 'var(--green)' }}>{Number(financials.gross_yield)}%</div>
          </div>
          <div>
            <span className="uppercase-label text-[10px]">APPRECIATION</span>
            <div className="font-heading font-semibold text-2xl text-white mt-1">{Number(financials.annual_appreciation)}%</div>
          </div>
          <div>
            <span className="uppercase-label text-[10px]">FUNDED</span>
            <div className="font-heading font-semibold text-2xl text-white mt-1">{Number(funding.funding_percentage).toFixed(0)}%</div>
          </div>
        </div>

        {/* ═══════════ FUNDING PROGRESS ═══════════ */}
        <div className="ownly-card mb-12">
          <ProgressBar 
            percentage={Number(funding.funding_percentage)} 
            height={8} 
            showLabel 
            labelText="Pool funded" 
          />
          <div className="flex justify-between items-center mt-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span>Total tokens: {Number(funding.total_tokens).toLocaleString()}</span>
            <span className="flex gap-4">
              <span className="text-[var(--green)]">NAV last quarter: +2.3%</span>
              <span>Updates: <strong className="text-white">Quarterly</strong></span>
            </span>
          </div>
        </div>

        {/* ═══════════ CONTENT GRID ═══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          
          {/* LEFT COLUMN (60%) */}
          <div className="lg:col-span-3 space-y-10">
            <div className="ownly-card">
              <h3 className="font-heading font-semibold text-xl text-white mb-5">About this property</h3>
              <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
                {property.title} sits on a residential title held by a dedicated SPV. Tokens are minted 1:1 against valuation. 
                Rental flows (or project profits) accrue to token holders pro-rata. Quarterly NAV updates reflect verified market comps and RERA-recorded transactions.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property.amenities?.split(',').map((amenity, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-card)]" style={{ background: 'var(--bg-input)' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--gold)' }} />
                    <span className="text-sm text-white">{amenity.trim()}</span>
                  </div>
                )) || (
                  // Fallbacks if no amenities
                  <>
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-[var(--border-card)]" style={{ background: 'var(--bg-input)' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--gold)' }} />
                      <span className="text-sm text-white">Prime Location</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-[var(--border-card)]" style={{ background: 'var(--bg-input)' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--gold)' }} />
                      <span className="text-sm text-white">High Demand Area</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (40%) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="ownly-card">
              <span className="uppercase-label-gold">RETURNS BREAKDOWN</span>
              <div className="mt-5 space-y-5">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Rental yield (annual)</span>
                  <span className="text-white font-medium">{Number(financials.gross_yield)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Capital appreciation est.</span>
                  <span className="text-white font-medium">{Number(financials.annual_appreciation)}%</span>
                </div>
                <div className="flex justify-between items-center pt-5 border-t border-[var(--border-card)]">
                  <span style={{ color: 'var(--text-white)' }} className="font-semibold">Total IRR target</span>
                  <span className="font-heading font-bold text-2xl" style={{ color: 'var(--gold)' }}>
                    {(Number(financials.gross_yield) + Number(financials.annual_appreciation)).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="ownly-card border-[var(--amber)]/30 bg-[var(--amber)]/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--amber)]"></div>
              <h4 className="uppercase-label text-[10px] mb-2" style={{ color: 'var(--amber)' }}>EXIT LIQUIDITY</h4>
              <p className="text-sm leading-relaxed text-white/90">
                Window exits open in <strong className="text-white">April & October</strong>. Or transfer tokens wallet-to-wallet anytime (1.5% brokerage + 18% GST).
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
