'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, SlidersHorizontal, Grid3x3, LayoutList, MapPin, TrendingUp, Building2, ArrowUpRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import PropertyCard from '@/components/PropertyCard';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';
import { propertiesAPI } from '@/lib/api';
import { formatINR, PROPERTY_TYPES, PROPERTY_MODELS, PROPERTY_IMAGES } from '@/lib/constants';
import type { PropertyListing } from '@/types';

type SortOption = 'newest' | 'yield_high' | 'yield_low' | 'price_low' | 'price_high' | 'funded';
type ViewMode = 'grid' | 'list';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedModel, setSelectedModel] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await propertiesAPI.getAll();
      setProperties(res.data.properties || []);
    } catch (err) {
      console.error('Failed to fetch properties', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = useMemo(() => {
    let result = [...properties];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.developer?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (selectedType !== 'All') {
      result = result.filter(p => p.property_type === selectedType);
    }

    // Model filter
    if (selectedModel !== 'All') {
      const sourceMap: Record<string, string> = { 'Rental SPV': 'ADMIN', 'Builder Raise': 'BUILDER' };
      result = result.filter(p => p.source === sourceMap[selectedModel]);
    }

    // Sort
    switch (sortBy) {
      case 'yield_high':
        result.sort((a, b) => Number(b.gross_yield) - Number(a.gross_yield));
        break;
      case 'yield_low':
        result.sort((a, b) => Number(a.gross_yield) - Number(b.gross_yield));
        break;
      case 'price_low':
        result.sort((a, b) => Number(a.token_price) - Number(b.token_price));
        break;
      case 'price_high':
        result.sort((a, b) => Number(b.token_price) - Number(a.token_price));
        break;
      case 'funded':
        result.sort((a, b) => Number(b.funding_percentage) - Number(a.funding_percentage));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [properties, search, selectedType, selectedModel, sortBy]);

  const sortLabels: Record<SortOption, string> = {
    newest: 'Newest',
    yield_high: 'Highest Yield',
    yield_low: 'Lowest Yield',
    price_low: 'Lowest Price',
    price_high: 'Highest Price',
    funded: 'Most Funded',
  };

  // Stats
  const totalProperties = properties.length;
  const avgYield = properties.length > 0 ? properties.reduce((a, p) => a + Number(p.gross_yield || 0), 0) / properties.length : 0;
  const liveCount = properties.filter(p => p.status === 'AVAILABLE').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} />
          <span className="uppercase-label text-[10px]">LOADING PROPERTIES</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-16 pb-24">
      <PageHeader
        breadcrumb="PROPERTIES · EXPLORE"
        heading="Discover"
        goldText="investment opportunities"
        subtitle="Browse RERA-verified properties across Indian cities. Filter by yield, location, and entry price."
      />

      {/* ═══════════ STATS STRIP ═══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
        <div className="ownly-card !p-5">
          <span className="uppercase-label text-[9px]">TOTAL LISTED</span>
          <div className="font-heading font-bold text-2xl text-white mt-1">{totalProperties}</div>
        </div>
        <div className="ownly-card !p-5">
          <span className="uppercase-label text-[9px]">LIVE NOW</span>
          <div className="font-heading font-bold text-2xl mt-1" style={{ color: 'var(--green)' }}>{liveCount}</div>
        </div>
        <div className="ownly-card !p-5">
          <span className="uppercase-label text-[9px]">AVG YIELD</span>
          <div className="font-heading font-bold text-2xl mt-1" style={{ color: 'var(--gold)' }}>{avgYield.toFixed(1)}%</div>
        </div>
        <div className="ownly-card !p-5">
          <span className="uppercase-label text-[9px]">CITIES</span>
          <div className="font-heading font-bold text-2xl text-white mt-1">
            {new Set(properties.map(p => p.location?.split(',').pop()?.trim()).filter(Boolean)).size || 0}
          </div>
        </div>
      </div>

      {/* ═══════════ FILTERS BAR ═══════════ */}
      <div className="ownly-card !p-6 mb-10">
        <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search properties, locations, developers..."
              className="ownly-input !pl-10 !py-3"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex gap-2.5 flex-wrap">
            {PROPERTY_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className="text-xs px-4 py-2 rounded-full border transition-all cursor-pointer"
                style={{
                  background: selectedType === type ? 'var(--gold)' : 'transparent',
                  color: selectedType === type ? '#000' : 'var(--text-secondary)',
                  borderColor: selectedType === type ? 'var(--gold)' : 'var(--border-input)',
                  fontWeight: selectedType === type ? 600 : 400,
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Model Filter */}
          <div className="flex gap-2.5">
            {PROPERTY_MODELS.map(model => (
              <button
                key={model}
                onClick={() => setSelectedModel(model)}
                className="text-xs px-4 py-2 rounded-full border transition-all cursor-pointer"
                style={{
                  background: selectedModel === model ? 'rgba(245, 166, 35, 0.15)' : 'transparent',
                  color: selectedModel === model ? 'var(--gold)' : 'var(--text-secondary)',
                  borderColor: selectedModel === model ? 'rgba(245, 166, 35, 0.3)' : 'var(--border-input)',
                  fontWeight: selectedModel === model ? 600 : 400,
                }}
              >
                {model}
              </button>
            ))}
          </div>

          {/* Sort + View */}
          <div className="flex gap-2 items-center">
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="text-xs px-3 py-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-input)', color: 'var(--text-secondary)' }}
              >
                <SlidersHorizontal size={12} />
                {sortLabels[sortBy]}
                <ChevronDown size={10} />
              </button>
              {showSortDropdown && (
                <div
                  className="absolute right-0 mt-1 w-44 rounded-lg shadow-xl z-50 overflow-hidden"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}
                >
                  {(Object.entries(sortLabels) as [SortOption, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setSortBy(key); setShowSortDropdown(false); }}
                      className="w-full text-left text-xs px-4 py-2.5 transition-colors cursor-pointer border-none"
                      style={{
                        background: sortBy === key ? 'rgba(245, 166, 35, 0.08)' : 'transparent',
                        color: sortBy === key ? 'var(--gold)' : 'var(--text-secondary)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-input)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className="p-2 cursor-pointer border-none transition-colors"
                style={{ background: viewMode === 'grid' ? 'var(--gold)' : 'var(--bg-input)', color: viewMode === 'grid' ? '#000' : 'var(--text-muted)' }}
              >
                <Grid3x3 size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="p-2 cursor-pointer border-none transition-colors"
                style={{ background: viewMode === 'list' ? 'var(--gold)' : 'var(--bg-input)', color: viewMode === 'list' ? '#000' : 'var(--text-muted)' }}
              >
                <LayoutList size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ RESULTS COUNT ═══════════ */}
      <div className="flex justify-between items-center mb-8">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Showing <strong className="text-white">{filteredProperties.length}</strong> {filteredProperties.length === 1 ? 'property' : 'properties'}
          {search && <> matching "<span style={{ color: 'var(--gold)' }}>{search}</span>"</>}
        </p>
      </div>

      {/* ═══════════ PROPERTY GRID/LIST ═══════════ */}
      {filteredProperties.length === 0 ? (
        <div className="ownly-card text-center py-16">
          <Building2 size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-heading font-semibold text-xl text-white mb-2">No properties found</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Try adjusting your filters or search query.
          </p>
          <button onClick={() => { setSearch(''); setSelectedType('All'); setSelectedModel('All'); }} className="btn-outline mt-6 text-xs">
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-4">
          {filteredProperties.map((prop) => {
            const imgUrl = prop.image_url || PROPERTY_IMAGES[prop.id % PROPERTY_IMAGES.length];
            return (
              <Link key={prop.id} href={`/marketplace/${prop.id}`} className="no-underline">
                <div className="ownly-card group !p-0 flex flex-col sm:flex-row overflow-hidden">
                  {/* Image */}
                  <div
                    className="w-full sm:w-48 h-36 sm:h-auto bg-cover bg-center shrink-0 relative"
                    style={{ backgroundImage: `url(${imgUrl})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--bg-card)] sm:block hidden" />
                    <div className="absolute top-3 left-3">
                      <Badge variant={prop.status === 'AVAILABLE' ? 'live' : 'muted'}>{prop.status}</Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-heading font-semibold text-lg text-white group-hover:text-[var(--gold)] transition-colors truncate">
                        {prop.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin size={12} style={{ color: 'var(--text-secondary)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{prop.location}</span>
                        <Badge variant="muted">{prop.property_type}</Badge>
                        <Badge variant="muted">{prop.source === 'BUILDER' ? 'BUILDER' : 'SPV'}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-center">
                        <span className="text-[9px] uppercase-label">YIELD</span>
                        <div className="font-heading font-semibold text-lg" style={{ color: 'var(--gold)' }}>{Number(prop.gross_yield).toFixed(1)}%</div>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] uppercase-label">ENTRY</span>
                        <div className="font-heading font-semibold text-lg text-white">{formatINR(Number(prop.token_price))}</div>
                      </div>
                      <div className="text-center min-w-[60px]">
                        <span className="text-[9px] uppercase-label">FUNDED</span>
                        <div className="mt-1">
                          <ProgressBar percentage={Number(prop.funding_percentage)} height={4} />
                          <div className="text-[10px] mt-0.5 text-white">{Number(prop.funding_percentage).toFixed(0)}%</div>
                        </div>
                      </div>
                      <ArrowUpRight size={16} style={{ color: 'var(--text-muted)' }} className="group-hover:text-[var(--gold)] transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}