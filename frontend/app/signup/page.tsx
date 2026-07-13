'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SplitLayout from '@/components/SplitLayout';
import InputField from '@/components/InputField';
import GoldButton from '@/components/GoldButton';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, Shield, Building2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const calculateStrength = (pass: string) => {
    if (pass.length === 0) return { score: 0, label: '', color: '' };
    let s = 0;
    if (pass.length >= 8) s += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) s += 1;
    if (/[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) s += 1;

    if (s <= 1) return { score: 1, label: 'WEAK', color: 'var(--red)' };
    if (s === 2) return { score: 2, label: 'DECENT', color: 'var(--amber)' };
    return { score: 3, label: 'STRONG', color: 'var(--green)' };
  };

  const strength = calculateStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!agree) {
      setError('You must agree to the Terms and Privacy Policy');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email address format.');
      return;
    }

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passRegex.test(password)) {
      setError('Password must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
      return;
    }

    setIsLoading(true);
    try {
      await signup({ fname, lname, email, password, role: 'INVESTOR' });
      router.push('/login'); // Redirect to login on success
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const leftContent = (
    <div>
      <span className="uppercase-label-gold">/ 01 — MINT ACCOUNT</span>
      <h2 className="font-heading font-bold text-4xl mt-3 mb-2 text-white">Become an owner.</h2>
      <p className="text-sm mb-10" style={{ color: 'var(--text-secondary)' }}>
        Already on OWNLY? <Link href="/login" className="no-underline" style={{ color: 'var(--gold)' }}>Sign in →</Link>
      </p>

      {error && (
        <div className="mb-6 p-3 rounded text-sm text-center" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-6">
        <div className="grid grid-cols-2 gap-5">
          <InputField
            label="First Name"
            value={fname}
            onChange={setFname}
            required
          />
          <InputField
            label="Last Name"
            value={lname}
            onChange={setLname}
            required
          />
        </div>
        
        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
        />
        
        <div>
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
          />
          {password.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1 flex-1 max-w-[120px]">
                <div className="h-1 flex-1 rounded-full" style={{ background: strength.score >= 1 ? strength.color : 'var(--bg-input)' }} />
                <div className="h-1 flex-1 rounded-full" style={{ background: strength.score >= 2 ? strength.color : 'var(--bg-input)' }} />
                <div className="h-1 flex-1 rounded-full" style={{ background: strength.score >= 3 ? strength.color : 'var(--bg-input)' }} />
              </div>
              <span className="text-[10px] font-bold tracking-wider" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          )}
        </div>

        <div className="pt-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 rounded" 
              style={{ accentColor: 'var(--gold)', background: 'var(--bg-input)', border: '1px solid var(--border-input)' }} 
            />
            <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              I'm 18+ and agree to the Terms, Privacy Policy, and the SEBI-sandbox investor disclosures. KYC required before first investment.
            </span>
          </label>
        </div>

        <GoldButton type="submit" fullWidth className="mt-8 !py-3.5" disabled={isLoading}>
          {isLoading ? 'Minting...' : '✦ Mint my account →'}
        </GoldButton>
      </form>
    </div>
  );

  const rightContent = (
    <div>
      <span className="uppercase-label-gold">/ THE NEW RAIL</span>
      <h1 className="font-heading font-bold text-4xl leading-tight mt-5 mb-6 text-white">
        Real estate,
        <br />
        <span style={{ color: 'var(--gold)' }}>fractioned & free-will.</span>
      </h1>
      <p className="text-sm leading-relaxed mb-12" style={{ color: 'var(--text-secondary)' }}>
        Three reasons people are leaving REITs and traditional NBFC deals for OWNLY:
      </p>

      <div className="space-y-5">
        {[
          {
            title: 'Start from ₹3,200',
            desc: 'Buy a single $OYD token. No EMI. No lock-in beyond exit windows.',
            icon: <div className="w-6 h-6 rounded-full border border-yellow-500 flex items-center justify-center text-yellow-500 font-bold text-[10px]">₹</div>
          },
          {
            title: 'Free-will allocation',
            desc: 'Pick the exact tower, floor, and city — never a blind REIT basket.',
            icon: <Building2 size={20} style={{ color: 'var(--gold)' }} />
          },
          {
            title: 'Escrow-protected',
            desc: 'Builder funds release on RERA-verified milestones. Bank gets paid first.',
            icon: <Shield size={20} style={{ color: 'var(--gold)' }} />
          }
        ].map((feature, i) => (
          <div key={i} className="ownly-card !p-5 flex gap-4 items-start">
            <div className="mt-1">{feature.icon}</div>
            <div className="flex-1">
              <h4 className="font-heading font-semibold text-white mb-1.5">{feature.title}</h4>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
            </div>
            <CheckCircle2 size={18} style={{ color: 'var(--gold)', marginTop: '4px' }} />
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <span className="uppercase-label text-[10px]">12,408 OWNERS · ₹847CR AUM · 9.2% BLENDED YIELD</span>
      </div>
    </div>
  );

  return <SplitLayout left={leftContent} right={rightContent} leftBg="#080808" rightBg="#0D0D0D" />;
}