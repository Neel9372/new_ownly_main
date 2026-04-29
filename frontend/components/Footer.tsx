'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-20" style={{ borderTop: '1px solid var(--border-card)' }}>
      <div className="page-container">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: 'var(--gold)' }}
              >
                <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'var(--gold)' }} />
              </div>
              <span className="font-heading text-lg font-bold text-white">
                OWN<span style={{ color: 'var(--gold)' }}>·</span>LY
              </span>
            </div>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Fractional real estate on blockchain. Built for India.
            </p>
          </div>
          <div className="flex gap-16 flex-wrap">
            {[
              { title: 'Platform', links: [
                { label: 'Marketplace', href: '/marketplace' },
                { label: 'Properties', href: '/properties' },
                { label: 'Portfolio', href: '/portfolio' },
                { label: 'KYC', href: '/kyc' },
              ]},
              { title: 'Company', links: [
                { label: 'About', href: '#' },
                { label: 'Blog', href: '#' },
                { label: 'Careers', href: '#' },
              ]},
              { title: 'Legal', links: [
                { label: 'Terms', href: '#' },
                { label: 'Privacy', href: '#' },
                { label: 'Disclosures', href: '#' },
              ]},
            ].map((col) => (
              <div key={col.title}>
                <h4 className="uppercase-label mb-4">{col.title}</h4>
                {col.links.map((l) => (
                  <div key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm block mb-3 no-underline hover:text-[var(--gold)] transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {l.label}
                    </Link>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div
          className="pt-8 text-xs leading-relaxed"
          style={{ borderTop: '1px solid var(--border-card)', color: 'var(--text-muted)' }}
        >
          All investments carry risk. Past performance is not indicative of future returns.
          OWNLY is a technology platform and does not offer financial advice. Read all scheme
          documents carefully before investing. © 2026 OWNLY Technologies Pvt. Ltd.
        </div>
      </div>
    </footer>
  );
}
