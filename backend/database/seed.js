/* ═══════════════════════════════════════════════════
   OWNLY — Database Seed Script
   Populates sample properties, financials, funding, leasing, and media
   Run: node seed.js
   ═══════════════════════════════════════════════════ */

require('dotenv').config({ path: '../.env' });
const db = require('../db');

const PROPERTIES = [
  {
    title: 'Skyline Towers, Bandra West',
    property_type: 'Residential',
    status: 'AVAILABLE',
    size_sqft: 1200,
    location: 'Bandra West, Mumbai',
    developer: 'Oberoi Realty',
    building_age: 2,
    total_floors: 45,
    amenities: 'Swimming Pool,Gym,Concierge,Rooftop Lounge,24/7 Security,EV Charging',
    rera_id: 'P51800022487',
    property_price: 18500000,
    transaction_costs: 1295000,
    total_investment_cost: 19795000,
    price_per_sqft: 15417,
    gross_yield: 9.4,
    net_yield: 7.8,
    annual_appreciation: 5.2,
    predicted_roi: 14.6,
    total_tokens: 5000,
    token_price: 3700,
    funding_closing_date: '2026-09-30',
    current_valuation: 18500000,
    leasing_strategy: 'Long-term',
    occupancy_rate: 95,
    projected_annual_rent: 1739000,
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    investment_tag: 'High Yield',
    initial_funded_pct: 42,
  },
  {
    title: 'Peninsula Business Park, Lower Parel',
    property_type: 'Commercial',
    status: 'AVAILABLE',
    size_sqft: 2800,
    location: 'Lower Parel, Mumbai',
    developer: 'Peninsula Land',
    building_age: 5,
    total_floors: 32,
    amenities: 'Cafeteria,Meeting Rooms,Fiber Optic,Underground Parking,Power Backup',
    rera_id: 'P51800029934',
    property_price: 42000000,
    transaction_costs: 2940000,
    total_investment_cost: 44940000,
    price_per_sqft: 15000,
    gross_yield: 8.1,
    net_yield: 6.5,
    annual_appreciation: 4.8,
    predicted_roi: 12.9,
    total_tokens: 8000,
    token_price: 5250,
    funding_closing_date: '2026-10-15',
    current_valuation: 42000000,
    leasing_strategy: 'Long-term',
    occupancy_rate: 88,
    projected_annual_rent: 3402000,
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    investment_tag: 'Value Add',
    initial_funded_pct: 67,
  },
  {
    title: 'Whitefield Tech Suites',
    property_type: 'Commercial',
    status: 'AVAILABLE',
    size_sqft: 3500,
    location: 'Whitefield, Bengaluru',
    developer: 'Embassy Group',
    building_age: 1,
    total_floors: 18,
    amenities: 'Smart HVAC,Co-working Spaces,Green Certified,Rooftop Garden,Shuttle Service',
    rera_id: 'PRM/KA/RERA/1251/310/AG/180712/002110',
    property_price: 28000000,
    transaction_costs: 1960000,
    total_investment_cost: 29960000,
    price_per_sqft: 8000,
    gross_yield: 9.6,
    net_yield: 8.0,
    annual_appreciation: 6.1,
    predicted_roi: 15.7,
    total_tokens: 7000,
    token_price: 4000,
    funding_closing_date: '2026-08-31',
    current_valuation: 28000000,
    leasing_strategy: 'Long-term',
    occupancy_rate: 92,
    projected_annual_rent: 2688000,
    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    investment_tag: 'High Yield',
    initial_funded_pct: 28,
  },
  {
    title: 'Goa Beach Villas, Candolim',
    property_type: 'Hospitality',
    status: 'AVAILABLE',
    size_sqft: 4200,
    location: 'Candolim, North Goa',
    developer: 'Sunteck Realty',
    building_age: 0,
    total_floors: 3,
    amenities: 'Private Pool,Beach Access,Spa,Restaurant,Helipad',
    rera_id: 'PRGO02210319',
    property_price: 65000000,
    transaction_costs: 4550000,
    total_investment_cost: 69550000,
    price_per_sqft: 15476,
    gross_yield: 11.2,
    net_yield: 9.1,
    annual_appreciation: 7.5,
    predicted_roi: 18.7,
    total_tokens: 10000,
    token_price: 6500,
    funding_closing_date: '2026-12-31',
    current_valuation: 65000000,
    leasing_strategy: 'Short-term',
    occupancy_rate: 78,
    projected_annual_rent: 7280000,
    image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    investment_tag: 'High Yield',
    initial_funded_pct: 15,
  },
  {
    title: 'Hinjewadi IT Hub Residences',
    property_type: 'Residential',
    status: 'AVAILABLE',
    size_sqft: 950,
    location: 'Hinjewadi, Pune',
    developer: 'Godrej Properties',
    building_age: 3,
    total_floors: 22,
    amenities: 'Jogging Track,Children Play Area,Club House,Indoor Games,CCTV',
    rera_id: 'P52100021345',
    property_price: 8500000,
    transaction_costs: 595000,
    total_investment_cost: 9095000,
    price_per_sqft: 8947,
    gross_yield: 7.9,
    net_yield: 6.3,
    annual_appreciation: 4.5,
    predicted_roi: 12.4,
    total_tokens: 3000,
    token_price: 2833,
    funding_closing_date: '2026-11-30',
    current_valuation: 8500000,
    leasing_strategy: 'Long-term',
    occupancy_rate: 97,
    projected_annual_rent: 671500,
    image_url: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80',
    investment_tag: 'Value Add',
    initial_funded_pct: 55,
  },
  {
    title: 'DLF CyberCity Office Block',
    property_type: 'Commercial',
    status: 'AVAILABLE',
    size_sqft: 5000,
    location: 'Sector 24, Gurugram',
    developer: 'DLF Ltd',
    building_age: 4,
    total_floors: 28,
    amenities: 'Metro Connectivity,Food Court,Conference Center,Green Building,24/7 Ops',
    rera_id: 'RERA-GRG-1019-2022',
    property_price: 55000000,
    transaction_costs: 3850000,
    total_investment_cost: 58850000,
    price_per_sqft: 11000,
    gross_yield: 8.4,
    net_yield: 7.0,
    annual_appreciation: 5.0,
    predicted_roi: 13.4,
    total_tokens: 11000,
    token_price: 5000,
    funding_closing_date: '2026-10-31',
    current_valuation: 55000000,
    leasing_strategy: 'Long-term',
    occupancy_rate: 90,
    projected_annual_rent: 4620000,
    image_url: 'https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=800&q=80',
    investment_tag: 'Long Term',
    initial_funded_pct: 73,
  },
  {
    title: 'Andheri Infinity Hub',
    property_type: 'Mixed-Use',
    status: 'AVAILABLE',
    size_sqft: 6800,
    location: 'Andheri East, Mumbai',
    developer: 'Lodha Group',
    building_age: 1,
    total_floors: 35,
    amenities: 'Retail Arcade,Sky Lounge,Office Floors,Residential Tower,Smart Parking,Amphitheater',
    rera_id: 'P51800031562',
    property_price: 72000000,
    transaction_costs: 5040000,
    total_investment_cost: 77040000,
    price_per_sqft: 10588,
    gross_yield: 10.1,
    net_yield: 8.4,
    annual_appreciation: 6.3,
    predicted_roi: 16.4,
    total_tokens: 12000,
    token_price: 6000,
    funding_closing_date: '2026-11-15',
    current_valuation: 72000000,
    leasing_strategy: 'Long-term',
    occupancy_rate: 82,
    projected_annual_rent: 7272000,
    image_url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80',
    investment_tag: 'High Yield',
    initial_funded_pct: 31,
  },
  {
    title: 'Koregaon Park Nexus',
    property_type: 'Mixed-Use',
    status: 'AVAILABLE',
    size_sqft: 4500,
    location: 'Koregaon Park, Pune',
    developer: 'Panchshil Realty',
    building_age: 0,
    total_floors: 24,
    amenities: 'Co-living Spaces,Retail Mall,Coworking Hub,Rooftop Bar,Infinity Pool,Yoga Deck',
    rera_id: 'P52100045678',
    property_price: 38000000,
    transaction_costs: 2660000,
    total_investment_cost: 40660000,
    price_per_sqft: 8444,
    gross_yield: 9.8,
    net_yield: 8.2,
    annual_appreciation: 5.7,
    predicted_roi: 15.5,
    total_tokens: 8000,
    token_price: 4750,
    funding_closing_date: '2026-12-15',
    current_valuation: 38000000,
    leasing_strategy: 'Short-term',
    occupancy_rate: 86,
    projected_annual_rent: 3724000,
    image_url: 'https://images.unsplash.com/photo-1565402170291-8491f14678db?w=800&q=80',
    investment_tag: 'Value Add',
    initial_funded_pct: 19,
  },
];

async function seed() {
  const client = await db.connect();
  
  try {
    console.log('🌱 Starting database seed...\n');

    for (const p of PROPERTIES) {
      // Check if property with this rera_id already exists
      const existing = await client.query(
        'SELECT id FROM properties WHERE rera_id = $1', [p.rera_id]
      );
      
      if (existing.rows.length > 0) {
        console.log(`⏭️  Skipping "${p.title}" — already exists (id: ${existing.rows[0].id})`);
        continue;
      }

      await client.query('BEGIN');

      // 1. Insert property
      const propRes = await client.query(
        `INSERT INTO properties (title, property_type, status, size_sqft, location, developer, building_age, total_floors, amenities, rera_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [p.title, p.property_type, p.status, p.size_sqft, p.location, p.developer, p.building_age, p.total_floors, p.amenities, p.rera_id]
      );
      const pid = propRes.rows[0].id;

      // 2. Insert financials
      await client.query(
        `INSERT INTO property_financials (property_id, property_price, transaction_costs, total_investment_cost, price_per_sqft, gross_yield, net_yield, annual_appreciation, predicted_roi)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [pid, p.property_price, p.transaction_costs, p.total_investment_cost, p.price_per_sqft, p.gross_yield, p.net_yield, p.annual_appreciation, p.predicted_roi]
      );

      // 3. Insert funding (with partial funding to look realistic)
      const tokensSold = Math.floor(p.total_tokens * p.initial_funded_pct / 100);
      const tokensRemaining = p.total_tokens - tokensSold;
      const fundedAmount = tokensSold * p.token_price;

      await client.query(
        `INSERT INTO property_funding (property_id, total_tokens, token_price, funded_amount, funding_percentage, investor_count, funding_closing_date, current_valuation, total_tokens_sold, total_tokens_remaining)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [pid, p.total_tokens, p.token_price, fundedAmount, p.initial_funded_pct, Math.floor(p.initial_funded_pct * 1.8), p.funding_closing_date, p.current_valuation, tokensSold, tokensRemaining]
      );

      // 4. Insert leasing
      await client.query(
        `INSERT INTO property_leasing (property_id, leasing_strategy, occupancy_rate, projected_annual_rent)
         VALUES ($1,$2,$3,$4)`,
        [pid, p.leasing_strategy, p.occupancy_rate, p.projected_annual_rent]
      );

      // 5. Insert media
      await client.query(
        `INSERT INTO property_media (property_id, image_url, investment_tag)
         VALUES ($1,$2,$3)`,
        [pid, p.image_url, p.investment_tag]
      );

      await client.query('COMMIT');
      console.log(`✅ Seeded: "${p.title}" (id: ${pid}, ${p.initial_funded_pct}% funded, ₹${(p.property_price/10000000).toFixed(2)}Cr)`);
    }

    console.log('\n🎉 Seed complete!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
  } finally {
    client.release();
    process.exit();
  }
}

seed();
