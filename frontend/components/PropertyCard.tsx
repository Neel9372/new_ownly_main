'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Badge from './Badge';
import ProgressBar from './ProgressBar';
import { formatINR } from '@/lib/constants';
import type { PropertyListing } from '@/types';

interface PropertyCardProps {
  property: PropertyListing;
}

// Deterministic image based on property id
const IMAGES = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=600&q=80',
  'https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=600&q=80',
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'AVAILABLE': return <Badge variant="live">LIVE</Badge>;
    case 'FUNDED': return <Badge variant="funded">FUNDED</Badge>;
    case 'EXITED': return <Badge variant="muted">EXITED</Badge>;
    default: return <Badge variant="pending">PENDING</Badge>;
  }
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const imgUrl = property.image_url || IMAGES[property.id % IMAGES.length];
  const yieldVal = Number(property.gross_yield) || 0;
  const tokenPrice = Number(property.token_price) || 0;
  const fundingPct = Number(property.funding_percentage) || 0;
  const model = property.source === 'BUILDER' ? 'BUILDER RAISE' : 'RENTAL SPV';
  const location = property.location || 'India';
  const city = location.split(',')[0];

  return (
    <Link
      href={`/marketplace/${property.id}`}
      className="block no-underline group"
    >
      <div
        className="relative overflow-hidden transition-all duration-300 group-hover:scale-[1.01] group-hover:shadow-lg"
        style={{
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-xl)',
          height: '440px',
        }}
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${imgUrl})` }}
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 35%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.45) 100%)',
          }}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-7">
          {/* Top row — badges */}
          <div className="flex items-start justify-between">
            <div className="flex gap-2.5 flex-wrap">
              <Badge variant="muted">{model}</Badge>
              {getStatusBadge(property.status)}
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all group-hover:bg-white/20"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <ArrowUpRight size={15} className="text-white" />
            </div>
          </div>

          {/* Bottom content */}
          <div>
            {/* Location + type */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                📍 {city}
              </span>
              <Badge variant="muted">{property.property_type || 'Residential'}</Badge>
            </div>

            {/* Title */}
            <h3 className="font-heading font-semibold text-lg text-white mb-4 leading-snug">
              {property.title}
            </h3>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <span className="uppercase-label text-[10px]">TOKEN</span>
                <div className="text-sm font-semibold text-white mt-1">
                  {formatINR(tokenPrice)}
                </div>
              </div>
              <div>
                <span className="uppercase-label text-[10px]">YIELD</span>
                <div className="text-sm font-semibold mt-1" style={{ color: 'var(--green)' }}>
                  ↑ {yieldVal}%
                </div>
              </div>
              <div>
                <span className="uppercase-label text-[10px]">FUNDED</span>
                <div className="text-sm font-semibold text-white mt-1">
                  {fundingPct.toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <ProgressBar percentage={fundingPct} height={5} />
          </div>
        </div>
      </div>
    </Link>
  );
}
