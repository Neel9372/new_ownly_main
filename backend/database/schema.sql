-- =====================
-- USERS TABLE
-- =====================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    fname VARCHAR(100) NOT NULL,
    mname VARCHAR(100),
    lname VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'INVESTOR',
    -- INVESTOR / BUILDER / ADMIN

    -- Builder basic info
    company_name VARCHAR(255),
    company_reg_id VARCHAR(100) UNIQUE,
    builder_status VARCHAR(20) DEFAULT 'NOT_APPLICABLE',
    -- NOT_APPLICABLE / PENDING / VERIFIED / REJECTED

    -- Wallet
    wallet_address VARCHAR(255) UNIQUE,
    wallet_status VARCHAR(20) DEFAULT 'NOT_CONNECTED',

    -- KYC
    id_proof_type VARCHAR(20),
    id_proof_number VARCHAR(20),
    id_proof_image TEXT,
    selfie_image TEXT,
    kyc_status VARCHAR(20) DEFAULT 'NOT_SUBMITTED',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================
-- PROPERTIES TABLE
-- =====================
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    property_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Available', --meaning available, funded, exited
    size_sqft NUMERIC,
    location VARCHAR(255),
    developer VARCHAR(255),
    building_age INT,
    total_floors INT,
    amenities TEXT,
    
    Rera_id VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- PROPERTY FINANCIALS
-- =====================
CREATE TABLE property_financials (
    id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(id) ON DELETE CASCADE,
    property_price NUMERIC,
    transaction_costs NUMERIC,-- Stamp duty + registration + legal fees + platform fee 
    total_investment_cost NUMERIC, --property price + Transaction cost
    price_per_sqft NUMERIC,
    gross_yield NUMERIC, -- annual rent/total investment cost x 100
    net_yield NUMERIC, --gross yield - expenses
    annual_appreciation NUMERIC,
    predicted_roi NUMERIC --ML GA ALgo (%)
);

-- =====================
-- PROPERTY FUNDING
-- =====================
CREATE TABLE property_funding (
    id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(id) ON DELETE CASCADE,
    total_tokens INT,
    token_price NUMERIC, --price per token NAV based
    funded_amount NUMERIC DEFAULT 0, --total_tokens * token_price
    funding_percentage NUMERIC DEFAULT 0, --funded_amount/total_tokens * 100
    investor_count INT DEFAULT 0,
    funding_closing_date DATE,
    current_valuation NUMERIC, --total_tokens * token_price
    total_tokens_sold NUMERIC DEFAULT 0,
    total_tokens_remaining NUMERIC DEFAULT 0
);

-- =====================
-- PROPERTY LEASING
-- =====================
CREATE TABLE property_leasing (
    id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(id) ON DELETE CASCADE,
    leasing_strategy VARCHAR(100),
    occupancy_rate NUMERIC,
    projected_annual_rent NUMERIC,
    rental_payment_schedule DATE,
    total_rent_received NUMERIC DEFAULT 0,
    total_rent_distributed NUMERIC DEFAULT 0,
    property_manager VARCHAR(255),-- who manages property third party
    property_manager_fee NUMERIC
);

-- =====================
-- PROPERTY MEDIA
-- =====================
CREATE TABLE property_media (
    id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT,
    document_url TEXT,
    investment_tag VARCHAR(100) -- for marketing purpose (high yield, vlaue, long term) 
    -- to ask claude how this works?? 
);

-- =====================
-- BUILDER PROJECTS
-- =====================
CREATE TABLE builder_projects (
    id SERIAL PRIMARY KEY,
    builder_id INT REFERENCES users(id),
    title VARCHAR(255),
    property_type VARCHAR(100),
    location VARCHAR(255),
    description TEXT,
    total_funding_goal NUMERIC,
    funded_amount NUMERIC DEFAULT 0,
    funding_deadline DATE,
    construction_start DATE,
    expected_completion DATE,
    total_tokens INT,
    token_price NUMERIC,
    status VARCHAR(50) DEFAULT 'PENDING', --pending, approved, rejected
    rejection_reason TEXT, --admin reason to reject
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP--when project is created
);

-- =====================
-- PROJECT MILESTONES
-- =====================
CREATE TABLE project_milestones (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES builder_projects(id),
    milestone_name VARCHAR(255),
    description TEXT,
    funding_percentage NUMERIC, --percentage of total funding goal which is been released till date 
    due_date DATE, --when milestone is due
    status VARCHAR(50) DEFAULT 'PENDING', --pending, approved, rejected
    completed_at TIMESTAMP --to ask claude how funding timeline logic work like will it be pre defined or what??
);

-- =====================
-- PROJECT DOCUMENTS
-- =====================
CREATE TABLE project_documents (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES builder_projects(id),
    document_type VARCHAR(100), -- rera certificate, oc, cc, title deed, architecture layout, GST cert.
    document_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- INVESTMENTS
-- =====================
CREATE TABLE investments (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    property_id INT REFERENCES properties(id),
    tokens_owned INT,
    invested_amount NUMERIC,
    transaction_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- TRANSACTIONS
-- =====================
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    property_id INT REFERENCES properties(id),
    amount NUMERIC,
    type VARCHAR(20),
    transaction_hash VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING', --pending, approved, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- BUILDER VERIFICATIONS
-- =====================
CREATE TABLE builder_verifications (
    id SERIAL PRIMARY KEY,
    builder_id INT REFERENCES users(id) ON DELETE CASCADE,

    -- Layer 1: Documents
    gst_certificate_url TEXT,
    incorporation_cert_url TEXT,
    company_pan_url TEXT,
    rera_certificate_url TEXT,
    director_id_url TEXT,

    -- Layer 2: MCA21 Auto Check
    cin_number VARCHAR(50) UNIQUE,
    mca_check_status VARCHAR(20) DEFAULT 'PENDING',
    -- PENDING / PASSED / FAILED
    mca_company_name VARCHAR(255),
    mca_company_status VARCHAR(50),
    mca_director_name VARCHAR(255),
    mca_checked_at TIMESTAMP,

    -- RERA Check
    rera_reg_number VARCHAR(100),
    rera_check_status VARCHAR(20) DEFAULT 'PENDING',
    rera_checked_at TIMESTAMP,

    -- Layer 3: Admin Review
    admin_review_status VARCHAR(20) DEFAULT 'PENDING',
    -- PENDING / APPROVED / REJECTED
    admin_notes TEXT,
    reviewed_by INT REFERENCES users(id),
    reviewed_at TIMESTAMP,

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rental_distributions (
    id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(id),
    total_rental_amount NUMERIC,
    distributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    month VARCHAR(20),
    year INT
);




