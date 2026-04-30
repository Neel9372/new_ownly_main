'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, TrendingUp } from 'lucide-react';
import SplitLayout from '@/components/SplitLayout';
import InputField from '@/components/InputField';
import GoldButton from '@/components/GoldButton';
import OutlineButton from '@/components/OutlineButton';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await login(email, password);
      
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'BUILDER') {
        router.push('/builder');
      } else {
        router.push('/portfolio');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const leftContent = (
    <div>
      <span className="uppercase-label-gold">/ WELCOME BACK</span>
      <h1 className="font-heading font-bold text-5xl leading-tight mt-5 mb-8 text-white">
        Own a piece.
        <br />
        <span style={{ color: 'var(--gold)' }}>Own·ly with us.</span>
      </h1>
      <p className="text-sm leading-relaxed mb-12" style={{ color: 'var(--text-secondary)' }}>
        Sign in to track your fractional positions, claim rental yield, and queue your next exit window — all from one obsidian dash.
      </p>

      {/* Mini NAV Card */}
      <div className="ownly-card !p-6 relative overflow-hidden" style={{ background: '#0D0D0D' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <span className="uppercase-label text-[10px]">OWN-IDX · LIVE NAV</span>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: 'var(--green)' }} />
        </div>
        <div className="flex items-baseline gap-3 mb-8">
          <span className="font-heading font-bold text-3xl text-white">{formatINR(108420)}</span>
          <span className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--green)' }}>
            <TrendingUp size={14} /> +2.14%
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-5 pt-5" style={{ borderTop: '1px solid var(--border-card)' }}>
          <div>
            <span className="uppercase-label text-[9px]">AUM</span>
            <div className="font-heading font-semibold text-white mt-1 text-sm">₹847 Cr</div>
          </div>
          <div>
            <span className="uppercase-label text-[9px]">HOLDERS</span>
            <div className="font-heading font-semibold text-white mt-1 text-sm">12,408</div>
          </div>
          <div>
            <span className="uppercase-label text-[9px]">YIELD</span>
            <div className="font-heading font-semibold mt-1 text-sm" style={{ color: 'var(--gold)' }}>9.2%</div>
          </div>
        </div>
      </div>
    </div>
  );

  const rightContent = (
    <div>
      <span className="uppercase-label-gold">/ 01 — SIGN IN</span>
      <h2 className="font-heading font-bold text-3xl mt-3 mb-2 text-white">Open your vault</h2>
      <p className="text-sm mb-10" style={{ color: 'var(--text-secondary)' }}>
        New to OWNLY? <Link href="/signup" className="no-underline" style={{ color: 'var(--gold)' }}>Mint your account →</Link>
      </p>

      {error && (
        <div className="mb-6 p-3 rounded text-sm text-center" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <InputField
          label="Email"
          type="email"
          placeholder="you@ownly.in"
          value={email}
          onChange={setEmail}
          icon={Mail}
          required
        />
        
        <InputField
          label="Password"
          type="password"
          placeholder="••••••••••"
          value={password}
          onChange={setPassword}
          icon={Lock}
          required
        />

        <div className="flex items-center justify-between mt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" style={{ accentColor: 'var(--gold)', background: 'var(--bg-input)', border: '1px solid var(--border-input)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Remember this device</span>
          </label>
          <a href="#" className="text-xs no-underline" style={{ color: 'var(--text-secondary)' }}>Forgot password?</a>
        </div>

        <GoldButton type="submit" fullWidth className="mt-8 !text-base !py-3.5" disabled={isLoading}>
          {isLoading ? 'Authenticating...' : 'Enter vault →'}
        </GoldButton>
      </form>

      <div className="flex items-center gap-4 my-10">
        <div className="flex-1 h-px" style={{ background: 'var(--border-card)' }}></div>
        <span className="uppercase-label text-[10px]">OR</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border-card)' }}></div>
      </div>

      <div className="flex gap-5">
        <OutlineButton className="flex-1 justify-center">
          ⊙ Wallet
        </OutlineButton>
        <OutlineButton className="flex-1 justify-center">
          ⬡ Passkey
        </OutlineButton>
      </div>

      <p className="text-[10px] text-center mt-10 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        By continuing you agree to OWNLY's Terms & Privacy Policy. KYC required before first investment.
      </p>
    </div>
  );

  return <SplitLayout left={leftContent} right={rightContent} />;
}