'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { NAV_LINKS } from '@/lib/constants';
import { ArrowRight, Sparkles, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Filter nav links based on role
  const visibleLinks = NAV_LINKS.filter(link => {
    if (link.href === '/admin' && user?.role !== 'ADMIN') return false;
    if (link.href === '/builder' && user?.role !== 'BUILDER' && user?.role !== 'ADMIN') return false;
    return true;
  });

  return (
    <nav className="sticky top-0 z-50 w-full"
         style={{
           background: 'rgba(10, 10, 10, 0.92)',
           backdropFilter: 'blur(24px)',
           WebkitBackdropFilter: 'blur(24px)',
           borderBottom: '1px solid var(--border-card)',
         }}>
      <div className="page-container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline shrink-0">
          <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center"
               style={{ borderColor: 'var(--gold)' }}>
            <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'var(--gold)' }} />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-white">
            OWN<span style={{ color: 'var(--gold)' }}>·</span>LY
          </span>
        </Link>

        {/* Center Nav Links — Desktop */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-full px-2 py-1.5"
             style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-card)' }}>
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href || 
              (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-5 py-2 rounded-full text-[13px] font-medium no-underline transition-all duration-250"
                style={{
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? '#000' : 'rgba(255,255,255,0.7)',
                  letterSpacing: '0.01em',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side — auth buttons */}
        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <>
              <span className="text-xs hidden sm:block font-medium" style={{ color: 'var(--text-secondary)' }}>
                {user.fname} {user.lname}
              </span>
              <button onClick={logout} className="btn-outline text-xs !py-2.5 !px-5">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-outline text-[13px] !py-2.5 !px-6 no-underline hidden sm:inline-flex">
                <ArrowRight size={14} />
                Sign in
              </Link>
              <Link href="/signup" className="btn-gold text-[13px] !py-2.5 !px-6 no-underline">
                Get started
                <Sparkles size={14} />
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded-lg border-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-t" style={{ borderColor: 'var(--border-card)', background: 'var(--bg-card)' }}>
          <div className="page-container py-4 flex flex-col gap-1">
            {visibleLinks.map((link) => {
              const isActive = pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-medium no-underline transition-colors"
                  style={{
                    background: isActive ? 'rgba(245,166,35,0.1)' : 'transparent',
                    color: isActive ? 'var(--gold)' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
