-- USERS TABLE
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'INVESTOR',
  wallet_balance NUMERIC DEFAULT 100000, -- it should be fetched from meta masked not
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROPERTIES TABLE
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  property_type VARCHAR(50),
  status VARCHAR(50),
  size_sqft INTEGER,
  location VARCHAR(255),
  developer VARCHAR(255),
  building_age INTEGER,
  total_floors INTEGER,
  amenities TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

-- PROPERTY FINANCIALS
CREATE TABLE property_financials (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  property_price NUMERIC,
  transaction_costs NUMERIC,
  total_investment_cost NUMERIC,
  price_per_sqft NUMERIC,
  gross_yield NUMERIC,
  net_yield NUMERIC,
  annual_appreciation NUMERIC
);

-- PROPERTY FUNDING
CREATE TABLE property_funding (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  total_tokens INTEGER,
  token_price NUMERIC,
  funding_closing_date DATE,
  current_valuation NUMERIC,
  funding_percentage NUMERIC DEFAULT 0
);

-- PROPERTY LEASING
CREATE TABLE property_leasing (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  leasing_strategy VARCHAR(255),
  occupancy_rate NUMERIC,
  projected_annual_rent NUMERIC,
  rental_payment_schedule VARCHAR(50)
);

-- PROPERTY MEDIA
CREATE TABLE property_media (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT,
  document_url TEXT,
  investment_tag VARCHAR(50)
);

-- USER WALLET TRANSACTIONS
CREATE TABLE wallet_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20), -- DEPOSIT, WITHDRAWAL, INVESTMENT, RENT_INCOME
  amount NUMERIC NOT NULL,
  status VARCHAR(20) DEFAULT 'COMPLETED',
  reference_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER PROPERTY INVESTMENTS
CREATE TABLE user_investments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  tokens_purchased INTEGER,
  total_amount_invested NUMERIC,
  investment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RENT INCOME TRACKING
CREATE TABLE rent_income (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC,
  received_date DATE,
  distribution_status VARCHAR(20) DEFAULT 'PENDING'
);
