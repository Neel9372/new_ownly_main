'use client';

import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { Wallet } from 'lucide-react';
import { shortenAddress } from '@/lib/constants';
import { useState } from 'react';

export default function WalletButton() {
  const { address, isConnecting, connect } = useWallet();
  const { refreshUser } = useAuth();
  const [syncing, setSyncing] = useState(false);

  const handleConnect = async () => {
    try {
      const addr = await connect();
      if (addr) {
        setSyncing(true);
        await authAPI.connectWallet(addr);
        await refreshUser();
      }
    } catch (err: any) {
      console.error("Wallet sync failed:", err);
      alert(err.response?.data?.error || "Failed to link wallet to your account. It might be linked to another user.");
    } finally {
      setSyncing(false);
    }
  };

  if (address) {
    return (
      <button className="btn-outline !py-2 !px-4 text-xs font-mono">
        <Wallet size={14} />
        {shortenAddress(address)}
      </button>
    );
  }

  const isLoading = isConnecting || syncing;

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className="btn-outline !py-2 !px-4 text-xs"
    >
      <Wallet size={14} />
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
