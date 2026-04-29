'use client';

import { useWallet } from '@/context/WalletContext';
import { Wallet } from 'lucide-react';
import { shortenAddress } from '@/lib/constants';

export default function WalletButton() {
  const { address, isConnecting, connect } = useWallet();

  if (address) {
    return (
      <button className="btn-outline !py-2 !px-4 text-xs font-mono">
        <Wallet size={14} />
        {shortenAddress(address)}
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="btn-outline !py-2 !px-4 text-xs"
    >
      <Wallet size={14} />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
