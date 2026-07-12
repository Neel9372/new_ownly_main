'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { CHAIN_ID } from '@/lib/constants';
import { useAuth } from './AuthContext';

interface WalletContextType {
  address: string | null;
  signer: JsonRpcSigner | null;
  isConnecting: boolean;
  connect: () => Promise<string>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Helper: get ethereum provider
function getEthereum(): any {
  if (typeof window === 'undefined') return null;
  const anyWindow = window as any;
  if (anyWindow.ethereum) {
    // If multiple providers exist (e.g. Coinbase + MetaMask), find MetaMask
    if (anyWindow.ethereum.providers?.length) {
      return anyWindow.ethereum.providers.find((p: any) => p.isMetaMask) || anyWindow.ethereum;
    }
    return anyWindow.ethereum;
  }
  return null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Disconnect wallet when user logs out or changes
  useEffect(() => {
    if (!user) {
      setAddress(null);
      setSigner(null);
    }
  }, [user]);

  // Auto-connect wallet ONLY if user previously connected one (wallet_status is CONNECTED in DB)
  // New users (wallet_status = 'NOT_CONNECTED') must click "Connect Wallet" manually
  useEffect(() => {
    if (!user) return;
    if (user.wallet_status !== 'CONNECTED') return; // ← Skip for new users

    const autoConnect = async () => {
      const ethereum = getEthereum();
      if (!ethereum) return;

      try {
        // Use eth_accounts (silent) instead of eth_requestAccounts (popup)
        // This only returns accounts if MetaMask already authorized this site
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) return; // Not authorized — don't force popup

        const provider = new BrowserProvider(ethereum);

        // Auto-switch to correct chain
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== CHAIN_ID) {
          try {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
            });
          } catch (switchErr: any) {
            if (switchErr.code === 4902) {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${CHAIN_ID.toString(16)}`,
                  chainName: 'Polygon Amoy Testnet',
                  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                  rpcUrls: ['https://rpc-amoy.polygon.technology'],
                  blockExplorerUrls: ['https://amoy.polygonscan.com'],
                }],
              });
            }
          }
        }

        const updatedProvider = new BrowserProvider(ethereum);
        const s = await updatedProvider.getSigner();
        const addr = await s.getAddress();
        setSigner(s);
        setAddress(addr);
      } catch {
        // User rejected or MetaMask not available — that's fine
      }
    };

    const timer = setTimeout(autoConnect, 500);
    return () => clearTimeout(timer);
  }, [user]);

  const connect = useCallback(async (): Promise<string> => {
    const ethereum = getEthereum();

    if (!ethereum) {
      window.open('https://metamask.io/download/', '_blank');
      alert('MetaMask is not detected. Please install the MetaMask browser extension and refresh this page.');
      return '';
    }

    setIsConnecting(true);
    try {
      // This pops up MetaMask asking user to connect
      await ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new BrowserProvider(ethereum);

      // Check network and try to switch if needed
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID) {
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            try {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${CHAIN_ID.toString(16)}`,
                  chainName: 'Polygon Amoy Testnet',
                  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                  rpcUrls: ['https://rpc-amoy.polygon.technology'],
                  blockExplorerUrls: ['https://amoy.polygonscan.com'],
                }],
              });
            } catch {
              alert('Failed to add Polygon Amoy network. Please add it manually in MetaMask.');
              return '';
            }
          } else {
            alert(`Please switch to Polygon Amoy Testnet (Chain ID: ${CHAIN_ID}) in MetaMask.`);
            return '';
          }
        }
      }

      const updatedProvider = new BrowserProvider(ethereum);
      const s = await updatedProvider.getSigner();
      const addr = await s.getAddress();
      setSigner(s);
      setAddress(addr);
      return addr;
    } catch (err: any) {
      if (err.code === 4001) {
        console.log('User rejected wallet connection');
      } else {
        console.error('Wallet connection error:', err);
        alert(err.message || 'Failed to connect wallet. Please try again.');
      }
      return '';
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setSigner(null);
  }, []);

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
