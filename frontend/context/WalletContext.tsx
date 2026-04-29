'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { CHAIN_ID } from '@/lib/constants';

interface WalletContextType {
  address: string | null;
  signer: JsonRpcSigner | null;
  isConnecting: boolean;
  connect: () => Promise<string>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async (): Promise<string> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(window as any).ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    setIsConnecting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new BrowserProvider((window as any).ethereum);
      
      // Request account access
      await provider.send('eth_requestAccounts', []);
      
      // Check network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
          });
        } catch {
          throw new Error(`Please switch to Polygon Amoy Testnet (Chain ID: ${CHAIN_ID})`);
        }
      }

      const s = await provider.getSigner();
      const addr = await s.getAddress();
      setSigner(s);
      setAddress(addr);
      return addr;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = () => {
    setAddress(null);
    setSigner(null);
  };

  return (
    <WalletContext.Provider value={{ address, signer, isConnecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
