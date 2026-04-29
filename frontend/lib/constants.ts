/* ═══════════════════════════════════════════════════
   OWNLY — Constants
   ═══════════════════════════════════════════════════ */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 80002;

export const CONTRACT_ADDRESSES = {
  OwnlyProperty: process.env.NEXT_PUBLIC_PROPERTY_CONTRACT || '0xdCCbf20B3282D53094dE6b380FD25Ac2002549B7',
  MockINRC: process.env.NEXT_PUBLIC_INRC_CONTRACT || '0x47AC4670C7E7D0FCCC9F96732Ba76Bcee707dD5A',
  OwnlyTreasury: process.env.NEXT_PUBLIC_TREASURY_CONTRACT || '0xa983c1EEA353C7661101749Ade3f7c8F157c121b',
  OwnlyPool: process.env.NEXT_PUBLIC_POOL_CONTRACT || '0x624B72b71B5F7366489739E2a07dc59CF7aE8CbE',
  OwnlyValuation: process.env.NEXT_PUBLIC_VALUATION_CONTRACT || '0x73f32a53942dE5844Df0072898E94a29DAF24eDd',
  OwnlyExitWindow: process.env.NEXT_PUBLIC_EXIT_CONTRACT || '0xC25A25A4AB67c561b89E32Bc1f8754526c0b8eE8',
};

export const TOKEN_KEY = 'ownly_token';
export const USER_KEY = 'ownly_user';

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Properties', href: '/properties' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Builder', href: '/builder' },
  { label: 'Admin', href: '/admin' },
];

export const TICKER_ITEMS = [
  { city: 'HYDERABAD', value: '22% IRR' },
  { city: 'PUNE', value: '7.9% YIELD' },
  { city: 'DELHI NCR', value: '8.1% YIELD' },
  { city: 'CHENNAI', value: '9.0% YIELD' },
  { city: 'MUMBAI', value: '8.4% YIELD' },
  { city: 'BENGALURU', value: '9.6% YIELD' },
  { city: 'GOA', value: '11.2% YIELD' },
];

export const PROPERTY_TYPES = [
  'All',
  'Residential',
  'Commercial',
  'Hospitality',
  'Mixed-Use',
];

export const PROPERTY_MODELS = [
  'All',
  'Rental SPV',
  'Builder Raise',
];

// Image placeholders — high-quality building images
export const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80',
  'https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=800&q=80',
];

export const HERO_BG_IMAGE = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=80';

export const formatINR = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
};

export const formatINRFull = (value: number): string => {
  return `₹${value.toLocaleString('en-IN')}`;
};

export const shortenAddress = (addr: string): string => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};
