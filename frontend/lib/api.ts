/* ═══════════════════════════════════════════════════
   OWNLY — API Client (Axios)
   Maps to all backend routes
   ═══════════════════════════════════════════════════ */
import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY } from './constants';
import type {
  LoginResponse,
  SignupPayload,
  PropertyListing,
  PropertyDetail,
  Investment,
  PortfolioSummary,
  Transaction,
  BuilderProject,
  RentalDistribution,
  ProjectDetailsResponse,
} from '@/types';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Auth ───────────────────────────────────────────
export const authAPI = {
  signup: (data: SignupPayload) =>
    api.post<{ message: string; user: LoginResponse['user'] }>('/auth/signup', data),

  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),

  connectWallet: (wallet_address: string) =>
    api.patch('/auth/wallet', { wallet_address }),

  getMe: () =>
    api.get<{ user: LoginResponse['user'] }>('/auth/me'),
};

// ── Properties ─────────────────────────────────────
export const propertiesAPI = {
  getAll: () =>
    api.get<{ properties: PropertyListing[] }>('/properties'),

  getById: (id: number) =>
    api.get<PropertyDetail>(`/properties/${id}`),

  add: (data: Record<string, unknown>) =>
    api.post<{ message: string; property_id: number }>('/properties/add', data),
};

// ── Investments ────────────────────────────────────
export const investmentsAPI = {
  invest: (data: { property_id: number; tokens_to_buy: number; transaction_hash: string }) =>
    api.post('/investments/invest', data),

  getPortfolio: () =>
    api.get<{ portfolio: Investment[]; summary: PortfolioSummary }>('/investments/portfolio'),

  getTransactions: () =>
    api.get<{ transactions: Transaction[] }>('/investments/transactions'),

  getPropertyInvestments: (property_id: number) =>
    api.get('/investments/property/' + property_id),
};

// ── KYC ────────────────────────────────────────────
export const kycAPI = {
  submit: (data: { id_proof_type: string; id_proof_number: string; id_proof_image: string; selfie_image: string }) =>
    api.post('/kyc/submit', data),

  getStatus: () =>
    api.get('/kyc/status'),

  getPending: () =>
    api.get('/kyc/pending'),

  verify: (id: number, status: 'VERIFIED' | 'REJECTED', rejection_reason?: string) =>
    api.patch(`/kyc/verify/${id}`, { status, rejection_reason }),
};

// ── Admin ──────────────────────────────────────────
export const adminAPI = {
  getAllUsers: () =>
    api.get('/auth/users'),

  removeUser: (id: number) =>
    api.delete(`/auth/users/${id}`),

  getAllInvestments: () =>
    api.get('/investments/all'),

  getPropertyInvestors: (property_id: number) =>
    api.get(`/investments/property/${property_id}`),

  deleteProperty: (id: number) =>
    api.delete(`/properties/${id}`),
};

// ── Builder ────────────────────────────────────────
export const builderAPI = {
  submitVerification: (data: Record<string, string>) =>
    api.post('/builder/verify', data),

  submitProject: (data: Record<string, unknown>) =>
    api.post('/builder/project/submit', data),

  uploadDocument: (project_id: number, data: { document_type: string; document_url: string }) =>
    api.post(`/builder/project/${project_id}/documents`, data),

  addMilestone: (project_id: number, data: Record<string, unknown>) =>
    api.post(`/builder/project/${project_id}/milestone`, data),

  getMyProjects: () =>
    api.get<{ projects: BuilderProject[] }>('/builder/project/my'),

  getPendingBuilders: () =>
    api.get('/builder/pending/builders'),

  reviewBuilder: (id: number, status: 'VERIFIED' | 'REJECTED') =>
    api.patch(`/builder/review/builder/${id}`, { status }),

  getPendingProjects: () =>
    api.get<{ pending_projects: BuilderProject[] }>('/builder/pending/projects'),

  reviewProject: (project_id: number, status: 'APPROVED' | 'REJECTED', rejection_reason?: string) =>
    api.patch(`/builder/review/project/${project_id}`, { status, rejection_reason }),

  getProjectDetails: (project_id: number) =>
    api.get<ProjectDetailsResponse>(`/builder/project/${project_id}`),

  completeMilestone: (milestone_id: number) =>
    api.patch<{ message: string; milestone: any }>(`/builder/milestone/${milestone_id}/complete`),

  addProjectUpdate: (project_id: number, data: { title: string; description: string; photos_count?: number }) =>
    api.post(`/builder/project/${project_id}/update`, data),
};

// ── Rental ─────────────────────────────────────────
export const rentalAPI = {
  distribute: (data: { property_id: number; total_rental_amount: number; month: string; year: number }) =>
    api.post('/rental/distribute', data),

  getHistory: (property_id: number) =>
    api.get<{ rental_history: RentalDistribution[] }>(`/rental/history/${property_id}`),

  getMyIncome: () =>
    api.get('/rental/my-income'),
};

export default api;
