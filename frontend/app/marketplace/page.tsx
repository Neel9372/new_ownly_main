'use client';

import React, { useEffect, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import PropertyCard from '@/components/PropertyCard';
import { propertiesAPI } from '@/lib/api';
import type { PropertyListing } from '@/types';
import { PROPERTY_TYPES, PROPERTY_MODELS } from '@/lib/constants';

export default function MarketplacePage() {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [activeModel, setActiveModel] = useState('All');
  const [maxEntry, setMaxEntry] = useState(500000); // 5L default
  const [sortBy, setSortBy] = useState('Newest');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await propertiesAPI.getAll();
      setProperties(res.data.properties);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredProperties = properties.filter((p) => {
    // Search
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !p.location.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Type
    if (activeType !== 'All' && p.property_type !== activeType) {
      return false;
    }
    // Model
    const pModel = p.source === 'BUILDER' ? 'Builder Raise' : 'Rental SPV';
    if (activeModel !== 'All' && pModel !== activeModel) {
      return false;
    }
    // Max Entry (token price)
    if (Number(p.token_price) > maxEntry) {
      return false;
    }
    return true;
  });

  // Sort logic
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortBy === 'Yield (High to Low)') {
      return Number(b.gross_yield) - Number(a.gross_yield);
    }
    if (sortBy === 'Token Price (Low to High)') {
      return Number(a.token_price) - Number(b.token_price);
    }
    // Newest default
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const liveCount = properties.filter(p => p.status === 'AVAILABLE').length;

  return (
    <div className="page-container py-16 pb-24">
      <PageHeader
        breadcrumb={`MARKETPLACE · ${liveCount} LIVE`}
        heading="Free-will"
        goldText="investing."
        subtitle="Filter, compare, invest. No fund manager deciding for you."
      />

      {/* ═══════════ FILTER BAR ═══════════ */}
      <div className="mb-12 space-y-8">
        {/* Row 1: Search & Pills */}
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
          
          <div className="relative w-full lg:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search city, project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ownly-input !pl-12 !py-3 !rounded-full"
            />
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-5">
            <div className="flex items-center gap-2">
              <span className="uppercase-label text-[10px] mr-2">TYPE:</span>
              {PROPERTY_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    activeType === type 
                      ? 'bg-[var(--gold)] text-black' 
                      : 'bg-transparent text-[var(--text-secondary)] hover:text-white border border-[var(--border-card)]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="uppercase-label text-[10px] mr-2">MODEL:</span>
              {PROPERTY_MODELS.map(model => (
                <button
                  key={model}
                  onClick={() => setActiveModel(model)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    activeModel === model 
                      ? 'bg-[var(--gold)] text-black' 
                      : 'bg-transparent text-[var(--text-secondary)] hover:text-white border border-[var(--border-card)]'
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Slider & Sort */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-[var(--border-card)] gap-8">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <span className="uppercase-label text-[10px] whitespace-nowrap">MAX ENTRY:</span>
            <input
              type="range"
              min="1000"
              max="1000000"
              step="1000"
              value={maxEntry}
              onChange={(e) => setMaxEntry(Number(e.target.value))}
              className="w-48 sm:w-64 accent-[var(--gold)]"
            />
            <span className="text-sm font-semibold text-white min-w-[80px]">
              ₹{(maxEntry / 1000).toFixed(0)}K
            </span>
          </div>

          <div className="relative w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="ownly-input !py-2 !pr-10 !rounded-full appearance-none cursor-pointer text-sm"
              style={{ background: 'var(--bg-input)' }}
            >
              <option value="Newest">Newest ▾</option>
              <option value="Yield (High to Low)">Yield (High to Low) ▾</option>
              <option value="Token Price (Low to High)">Token Price (Low to High) ▾</option>
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ═══════════ PROPERTY GRID ═══════════ */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-[var(--gold)] border-r-[var(--gold)] border-b-transparent border-l-transparent animate-spin"></div>
        </div>
      ) : sortedProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 ownly-card">
          <p className="text-[var(--text-secondary)]">No properties match your filters.</p>
        </div>
      )}
    </div>
  );
}
