'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { WalletProvider } from '@/context/WalletContext';
import Navbar from '@/components/Navbar';
import TickerBar from '@/components/TickerBar';
import Footer from '@/components/Footer';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WalletProvider>
        <TickerBar />
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </WalletProvider>
    </AuthProvider>
  );
}
