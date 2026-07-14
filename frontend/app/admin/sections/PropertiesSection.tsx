'use client';

import React, { useState, useEffect } from 'react';
import { propertiesAPI, adminAPI, rentalAPI } from '@/lib/api';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';
import { formatINR } from '@/lib/constants';
import { Building2, Plus, Trash2, Eye, Search, X } from 'lucide-react';
import type { PropertyListing } from '@/types';

export default function PropertiesSection() {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: '', property_type: 'Residential', location: '', developer: '',
    size_sqft: '', building_age: '', total_floors: '', amenities: '', rera_id: '',
    property_price: '', transaction_costs: '', gross_yield: '', net_yield: '',
    annual_appreciation: '', predicted_roi: '',
    total_tokens: '', token_price: '', funding_closing_date: '',
    leasing_strategy: 'Long-term', occupancy_rate: '', projected_annual_rent: '',
    image_url: '', investment_tag: 'High Yield',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchProperties(); }, []);

  const fetchProperties = async () => {
    try { const res = await propertiesAPI.getAll(); setProperties(res.data.properties || []); }
    catch { setProperties([]); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await propertiesAPI.add({
        title: form.title, 
        property_type: form.property_type, 
        status: 'AVAILABLE',
        location: form.location, 
        developer: form.developer, 
        size_sqft: Number(form.size_sqft), 
        building_age: Number(form.building_age), 
        total_floors: Number(form.total_floors), 
        amenities: form.amenities, 
        rera_id: form.rera_id,
        property_price: Number(form.property_price), 
        transaction_costs: Number(form.transaction_costs), 
        total_investment_cost: Number(form.property_price) + Number(form.transaction_costs), 
        price_per_sqft: Math.round(Number(form.property_price) / Number(form.size_sqft)), 
        gross_yield: Number(form.gross_yield), 
        net_yield: Number(form.net_yield), 
        annual_appreciation: Number(form.annual_appreciation), 
        total_tokens: Number(form.total_tokens), 
        token_price: Number(form.token_price), 
        funding_closing_date: form.funding_closing_date, 
        current_valuation: Number(form.property_price),
        leasing_strategy: form.leasing_strategy, 
        occupancy_rate: Number(form.occupancy_rate), 
        projected_annual_rent: Number(form.projected_annual_rent),
        image_url: form.image_url, 
        investment_tag: form.investment_tag
      });
      setShowAddForm(false);
      fetchProperties();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    try { await adminAPI.deleteProperty(id); setProperties(prev => prev.filter(p => p.id !== id)); }
    catch (e) { console.error(e); }
    finally { setDeleteConfirm(null); }
  };

  const filtered = properties.filter(p =>
    !search || `${p.title} ${p.location} ${p.developer}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search properties..." className="ownly-input !pl-11 !py-2.5 !rounded-full" />
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-gold text-sm">
          {showAddForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Property</>}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="ownly-card mb-10">
          <h3 className="font-heading font-semibold text-xl text-white mb-6">List New Property</h3>
          <form onSubmit={handleAdd}>
            <div className="space-y-8">
              {/* Property Details */}
              <div>
                <span className="uppercase-label-gold text-[10px] block mb-4">PROPERTY DETAILS</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[
                    { l: 'Title', k: 'title', ph: 'Skyline Towers, Bandra' },
                    { l: 'Location', k: 'location', ph: 'Bandra West, Mumbai' },
                    { l: 'Developer', k: 'developer', ph: 'Oberoi Realty' },
                    { l: 'RERA ID', k: 'rera_id', ph: 'P51800022487' },
                    { l: 'Size (sqft)', k: 'size_sqft', ph: '1200', t: 'number' },
                    { l: 'Building Age', k: 'building_age', ph: '2', t: 'number' },
                    { l: 'Total Floors', k: 'total_floors', ph: '45', t: 'number' },
                  ].map(f => (
                    <div key={f.k}><label className="uppercase-label block mb-2">{f.l}</label><input value={(form as any)[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} placeholder={f.ph} type={f.t || 'text'} className="ownly-input" required /></div>
                  ))}
                  <div><label className="uppercase-label block mb-2">Type</label><select value={form.property_type} onChange={e => setForm({ ...form, property_type: e.target.value })} className="ownly-input"><option>Residential</option><option>Commercial</option><option>Hospitality</option><option>Mixed-Use</option></select></div>
                  <div className="sm:col-span-2 lg:col-span-3"><label className="uppercase-label block mb-2">Amenities (comma-separated)</label><input value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} placeholder="Pool, Gym, 24/7 Security" className="ownly-input" /></div>
                </div>
              </div>

              {/* Financials */}
              <div>
                <span className="uppercase-label-gold text-[10px] block mb-4">FINANCIALS</span>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { l: 'Property Price (₹)', k: 'property_price', ph: '18500000' },
                    { l: 'Transaction Costs (₹)', k: 'transaction_costs', ph: '1295000' },
                    { l: 'Gross Yield (%)', k: 'gross_yield', ph: '9.4' },
                    { l: 'Net Yield (%)', k: 'net_yield', ph: '7.8' },
                    { l: 'Annual Appreciation (%)', k: 'annual_appreciation', ph: '5.2' },
                    { l: 'Predicted ROI (%)', k: 'predicted_roi', ph: '14.6' },
                  ].map(f => (
                    <div key={f.k}><label className="uppercase-label block mb-2">{f.l}</label><input value={(form as any)[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} placeholder={f.ph} type="number" step="any" className="ownly-input" required /></div>
                  ))}
                </div>
              </div>

              {/* Funding + Leasing */}
              <div>
                <span className="uppercase-label-gold text-[10px] block mb-4">FUNDING & LEASING</span>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  <div><label className="uppercase-label block mb-2">Total Tokens</label><input value={form.total_tokens} onChange={e => setForm({ ...form, total_tokens: e.target.value })} placeholder="5000" type="number" className="ownly-input" required /></div>
                  <div><label className="uppercase-label block mb-2">Token Price (₹)</label><input value={form.token_price} onChange={e => setForm({ ...form, token_price: e.target.value })} placeholder="3700" type="number" className="ownly-input" required /></div>
                  <div><label className="uppercase-label block mb-2">Funding Close Date</label><input value={form.funding_closing_date} onChange={e => setForm({ ...form, funding_closing_date: e.target.value })} type="date" className="ownly-input" required /></div>
                  <div><label className="uppercase-label block mb-2">Leasing Strategy</label><select value={form.leasing_strategy} onChange={e => setForm({ ...form, leasing_strategy: e.target.value })} className="ownly-input"><option>Long-term</option><option>Short-term</option><option>Holiday rental</option></select></div>
                  <div><label className="uppercase-label block mb-2">Occupancy (%)</label><input value={form.occupancy_rate} onChange={e => setForm({ ...form, occupancy_rate: e.target.value })} placeholder="95" type="number" className="ownly-input" /></div>
                  <div><label className="uppercase-label block mb-2">Annual Rent (₹)</label><input value={form.projected_annual_rent} onChange={e => setForm({ ...form, projected_annual_rent: e.target.value })} placeholder="1739000" type="number" className="ownly-input" /></div>
                  <div>
                    <label className="uppercase-label block mb-2">Property Image</label>
                    <label 
                      className="border border-dashed border-[var(--border-input)] rounded-xl p-2.5 text-center cursor-pointer transition-colors hover:border-[var(--gold)] block"
                      style={{ background: 'var(--bg-input)' }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setForm({ ...form, image_url: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {form.image_url ? (
                        <span className="text-xs text-[var(--gold)] font-medium truncate block max-w-[200px] mx-auto">
                          ✓ Image Selected (Click to change)
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-secondary)]">
                          📷 Upload Image File
                        </span>
                      )}
                    </label>
                  </div>
                  <div><label className="uppercase-label block mb-2">Investment Tag</label><select value={form.investment_tag} onChange={e => setForm({ ...form, investment_tag: e.target.value })} className="ownly-input"><option>High Yield</option><option>Value Add</option><option>Long Term</option><option>Pre-Construction</option></select></div>
                </div>
              </div>
            </div>
            <div className="mt-8"><button type="submit" disabled={submitting} className="btn-gold w-full justify-center !py-3.5">{submitting ? 'Listing...' : '✦ List Property on Marketplace'}</button></div>
          </form>
        </div>
      )}

      {/* Properties List */}
      {filtered.length === 0 ? (
        <div className="ownly-card text-center py-16"><Building2 size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} /><p className="text-[var(--text-secondary)]">No properties found.</p></div>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => (
            <div key={p.id} className="ownly-card">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-2">
                    <Badge variant={p.status === 'AVAILABLE' ? 'live' : 'muted'}>{p.status}</Badge>
                    <Badge variant="muted">{p.property_type}</Badge>
                    {p.investment_tag && <Badge variant="funding">{p.investment_tag}</Badge>}
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-white">{p.title}</h3>
                  <span className="text-xs text-[var(--text-secondary)]">📍 {p.location} · {p.developer}</span>
                </div>
                <div className="grid grid-cols-3 gap-8">
                  <div><span className="uppercase-label text-[10px]">PRICE</span><div className="font-heading font-semibold text-white mt-1">{formatINR(Number(p.property_price))}</div></div>
                  <div><span className="uppercase-label text-[10px]">YIELD</span><div className="font-heading font-semibold mt-1" style={{ color: 'var(--green)' }}>{Number(p.gross_yield)}%</div></div>
                  <div><span className="uppercase-label text-[10px]">FUNDED</span><div className="font-heading font-semibold text-white mt-1">{Number(p.funding_percentage).toFixed(0)}%</div></div>
                </div>
                <div className="flex gap-2">
                  {deleteConfirm === p.id ? (
                    <><button onClick={() => handleDelete(p.id)} className="btn-danger !py-2 !px-4 text-xs">Confirm</button><button onClick={() => setDeleteConfirm(null)} className="btn-outline !py-2 !px-4 text-xs">Cancel</button></>
                  ) : (
                    <button onClick={() => setDeleteConfirm(p.id)} className="btn-outline !py-2 !px-4 text-xs" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}><Trash2 size={12} /> Remove</button>
                  )}
                </div>
              </div>
              <div className="mt-4"><ProgressBar percentage={Number(p.funding_percentage)} height={4} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
