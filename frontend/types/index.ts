/* ═══════════════════════════════════════════════════
   OWNLY — TypeScript Type Definitions
   Mapped from database schema.sql
   ═══════════════════════════════════════════════════ */

// ── Users ──────────────────────────────────────────
export interface User {
  id: number;
  fname: string;
  mname?: string;
  lname: string;
  email: string;
  role: 'INVESTOR' | 'BUILDER' | 'ADMIN';

  // Builder info
  company_name?: string;
  company_reg_id?: string;
  builder_status: 'NOT_APPLICABLE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  rera_number?: string;
  gst_number?: string;
  website?: string;
  portfolio_url?: string;

  // Wallet
  wallet_address?: string;
  wallet_status: 'NOT_CONNECTED' | 'CONNECTED';

  // KYC
  id_proof_type?: string;
  id_proof_number?: string;
  id_proof_image?: string;
  selfie_image?: string;
  kyc_status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  kyc_rejection_reason?: string;

  created_at: string;
}

// ── Properties ─────────────────────────────────────
export interface Property {
  id: number;
  title: string;
  property_type: string;
  status: 'AVAILABLE' | 'FUNDED' | 'EXITED' | 'UNDER_MAINTENANCE';
  size_sqft: number;
  location: string;
  developer: string;
  building_age: number;
  total_floors: number;
  amenities: string;
  rera_id: string;
  source: 'ADMIN' | 'BUILDER';
  builder_project_id?: number;
  listed_by?: number;
  created_at: string;
}

// ── Property Financials ────────────────────────────
export interface PropertyFinancials {
  id: number;
  property_id: number;
  property_price: number;
  transaction_costs: number;
  total_investment_cost: number;
  price_per_sqft: number;
  gross_yield: number;
  net_yield: number;
  annual_appreciation: number;
  predicted_roi: number;
}

// ── Property Funding ───────────────────────────────
export interface PropertyFunding {
  id: number;
  property_id: number;
  total_tokens: number;
  token_price: number;
  funded_amount: number;
  funding_percentage: number;
  investor_count: number;
  funding_closing_date: string;
  current_valuation: number;
  total_tokens_sold: number;
  total_tokens_remaining: number;
}

// ── Property Leasing ───────────────────────────────
export interface PropertyLeasing {
  id: number;
  property_id: number;
  leasing_strategy: string;
  occupancy_rate: number;
  projected_annual_rent: number;
  rental_payment_schedule: string;
  total_rent_received: number;
  total_rent_distributed: number;
  property_manager: string;
  property_manager_fee: number;
}

// ── Property Media ─────────────────────────────────
export interface PropertyMedia {
  id: number;
  property_id: number;
  image_url: string;
  document_url: string;
  investment_tag: string;
}

// ── Listing card (combined from GET /properties) ───
export interface PropertyListing {
  id: number;
  title: string;
  property_type: string;
  status: string;
  size_sqft: number;
  location: string;
  developer: string;
  building_age: number;
  total_floors: number;
  amenities: string;
  rera_id: string;
  source: string;
  created_at: string;
  // Joined financials
  property_price: number;
  gross_yield: number;
  net_yield: number;
  // Joined funding
  total_tokens: number;
  token_price: number;
  funding_percentage: number;
  // Joined media
  image_url: string;
  investment_tag: string;
}

// ── Full property detail ───────────────────────────
export interface PropertyDetail {
  property: Property;
  financials: PropertyFinancials;
  funding: PropertyFunding;
  leasing: PropertyLeasing;
  media: PropertyMedia;
}

// ── Builder Projects ───────────────────────────────
export interface BuilderProject {
  id: number;
  builder_id: number;
  title: string;
  property_type: string;
  location: string;
  description: string;
  total_funding_goal: number;
  funded_amount: number;
  funding_deadline: string;
  construction_start: string;
  expected_completion: string;
  total_tokens: number;
  token_price: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'LIVE' | 'COMPLETED';
  rejection_reason?: string;
  created_at: string;
  // Joined
  fname?: string;
  lname?: string;
  email?: string;
  company_name?: string;
  document_count?: number;
  milestone_count?: number;
}

// ── Milestones ─────────────────────────────────────
export interface ProjectMilestone {
  id: number;
  project_id: number;
  milestone_name: string;
  description: string;
  funding_percentage: number;
  due_date: string;
  status: 'PENDING' | 'COMPLETED';
  completed_at?: string;
}

// ── Documents ──────────────────────────────────────
export interface ProjectDocument {
  id: number;
  project_id: number;
  document_type: string;
  document_url: string;
  uploaded_at: string;
}

// ── Investments ────────────────────────────────────
export interface Investment {
  id: number;
  user_id: number;
  property_id: number;
  tokens_owned: number;
  invested_amount: number;
  transaction_hash: string;
  created_at: string;
  // Joined
  title?: string;
  location?: string;
  property_type?: string;
  property_status?: string;
  token_price?: number;
  total_tokens?: number;
  funding_percentage?: number;
  gross_yield?: number;
  net_yield?: number;
  predicted_roi?: number;
  image_url?: string;
  ownership_percentage?: number;
  estimated_annual_return?: number;
}

// ── Transactions ───────────────────────────────────
export interface Transaction {
  id: number;
  user_id: number;
  property_id: number;
  amount: number;
  type: 'INVEST' | 'RENTAL' | 'WITHDRAW';
  transaction_hash: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  created_at: string;
  property_title?: string;
  location?: string;
}

// ── KYC ────────────────────────────────────────────
export interface KYCSubmission {
  id_proof_type: string;
  id_proof_number: string;
  id_proof_image: string;
  selfie_image: string;
}

// ── Builder Verification ───────────────────────────
export interface BuilderVerification {
  id: number;
  builder_id: number;
  gst_certificate_url: string;
  incorporation_cert_url: string;
  company_pan_url: string;
  rera_certificate_url: string;
  director_id_url: string;
  cin_number: string;
  mca_check_status: 'PENDING' | 'PASSED' | 'FAILED';
  mca_company_name: string;
  mca_company_status: string;
  mca_director_name: string;
  mca_checked_at: string;
  rera_reg_number: string;
  rera_check_status: 'PENDING' | 'PASSED' | 'FAILED';
  rera_checked_at: string;
  admin_review_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_notes: string;
  reviewed_by: number;
  reviewed_at: string;
  submitted_at: string;
}

// ── Rental Distributions ───────────────────────────
export interface RentalDistribution {
  id: number;
  property_id: number;
  total_rental_amount: number;
  month: string;
  year: number;
  distributed_at: string;
  title?: string;
}

// ── Portfolio Summary ──────────────────────────────
export interface PortfolioSummary {
  total_invested: number;
  total_tokens_owned: number;
  total_properties: number;
}

// ── Auth ───────────────────────────────────────────
export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    fname: string;
    lname: string;
    email: string;
    role: string;
    wallet_status: string;
    kyc_status: string;
  };
}

export interface SignupPayload {
  fname: string;
  mname?: string;
  lname: string;
  email: string;
  password: string;
  role?: string;
  company_name?: string;
  company_reg_id?: string;
  license_url?: string;
}

export interface ProjectUpdate {
  id: number;
  project_id: number;
  author: string;
  title: string;
  description: string;
  photos_count: number;
  created_at: string;
}

export interface ProjectDetailsResponse {
  project: BuilderProject;
  milestones: ProjectMilestone[];
  documents: ProjectDocument[];
  updates: ProjectUpdate[];
}
