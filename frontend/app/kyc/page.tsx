'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { kycAPI } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import InputField from '@/components/InputField';
import GoldButton from '@/components/GoldButton';
import { Shield, CheckCircle2, UploadCloud, Clock, AlertTriangle } from 'lucide-react';

export default function KYCPage() {
  const { user, refreshUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [status, setStatus] = useState<string>('NOT_SUBMITTED');
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    id_proof_type: 'PAN',
    id_proof_number: '',
    aadhaar_number: '',
    phone: '',
    address: '',
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Always fetch fresh data on mount to see if admin approved/rejected
    refreshUser().then(() => {
      setLoading(false);
    });
  }, [authLoading, router]);

  useEffect(() => {
    if (user) {
      setStatus(user.kyc_status);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.id_proof_number || !formData.phone || !formData.address || !formData.aadhaar_number) {
      setError('Please fill in all required fields (PAN, Aadhaar, Phone, Address).');
      return;
    }

    // PAN validation
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(formData.id_proof_number)) {
      setError('Invalid PAN Card number format. Example: ABCDE1234F');
      return;
    }

    // Aadhaar validation (12 digits, ignoring spaces)
    const aadhaarRegex = /^\d{12}$/;
    if (!aadhaarRegex.test(formData.aadhaar_number.replace(/\s/g, ''))) {
      setError('Invalid Aadhaar Card number. Must be exactly 12 digits.');
      return;
    }

    // Phone validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Invalid phone number format. Must be exactly 10 digits.');
      return;
    }
    
    setSubmitting(true);
    try {
      await kycAPI.submit({
        id_proof_type: formData.id_proof_type,
        id_proof_number: formData.id_proof_number,
        id_proof_image: filePreview || 'uploaded_document',
        selfie_image: 'self_declaration',
      });
      await refreshUser();
      setStatus('SUBMITTED');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit KYC.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  // Render different states based on KYC status
  if (status === 'VERIFIED') {
    return (
      <div className="page-container py-24 flex flex-col items-center text-center">
        <CheckCircle2 size={64} style={{ color: 'var(--green)' }} className="mb-6" />
        <h1 className="font-heading font-bold text-4xl text-white mb-4">KYC Verified</h1>
        <p className="text-[var(--text-secondary)] max-w-md mb-8">
          Your identity has been verified successfully. You have full access to invest in the OWNLY marketplace.
        </p>
        <button onClick={() => router.push('/marketplace')} className="btn-gold">
          Go to Marketplace
        </button>
      </div>
    );
  }

  if (status === 'SUBMITTED') {
    return (
      <div className="page-container py-24 flex flex-col items-center text-center">
        <Clock size={64} style={{ color: 'var(--amber)' }} className="mb-6" />
        <h1 className="font-heading font-bold text-4xl text-white mb-4">Verification Pending</h1>
        <p className="text-[var(--text-secondary)] max-w-md mb-8">
          We have received your KYC documents. Our compliance team is reviewing them. This usually takes less than 24 hours.
        </p>
        <button onClick={() => router.push('/portfolio')} className="btn-outline">
          Return to Portfolio
        </button>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="page-container py-24 flex flex-col items-center text-center">
        <AlertTriangle size={64} style={{ color: 'var(--red)' }} className="mb-6" />
        <h1 className="font-heading font-bold text-4xl text-white mb-4">Verification Failed</h1>
        <p className="text-[var(--text-secondary)] max-w-md mb-4">
          Unfortunately, we could not verify your documents. Please ensure all details match your PAN and Aadhaar and try again.
        </p>
        {(user as any)?.kyc_rejection_reason && (
          <div className="bg-[var(--red)]/10 border border-[var(--red)]/20 text-[var(--red)] p-4 rounded-xl max-w-md mb-8 w-full text-left text-sm">
            <strong>Reason for rejection:</strong><br />
            {(user as any).kyc_rejection_reason}
          </div>
        )}
        <button onClick={() => setStatus('NOT_SUBMITTED')} className="btn-outline border-[var(--red)] text-[var(--red)]">
          Try Again
        </button>
      </div>
    );
  }

  // DEFAULT FORM VIEW (NOT_SUBMITTED)
  return (
    <div className="page-container py-16 pb-24">
      <PageHeader
        breadcrumbIcon={<Shield size={16} className="text-[var(--gold)]" />}
        breadcrumb="KYC · REQUIRED TO INVEST"
        heading="Verify your identity to"
        goldText="unlock investing."
        subtitle="SEBI & PMLA require us to KYC every investor before any token purchase. Submit once — admin reviews within 24h."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        
        {/* LEFT COLUMN (60%) — Form */}
        <div className="lg:col-span-3">
          <div className="ownly-card">
            {error && (
              <div className="mb-6 p-3 rounded text-sm text-[var(--red)] bg-[var(--red)]/10 border border-[var(--red)]/20">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField
                  label="FULL LEGAL NAME (As per PAN)"
                  value={user?.fname + ' ' + user?.lname}
                  onChange={() => {}} // Disabled read-only
                  disabled
                />
                <InputField
                  label="EMAIL"
                  value={user?.email || ''}
                  onChange={() => {}}
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField
                  label="PAN NUMBER"
                  placeholder="ABCDE1234F"
                  value={formData.id_proof_number}
                  onChange={(v) => setFormData({ ...formData, id_proof_number: v.toUpperCase() })}
                  required
                />
                <InputField
                  label="AADHAAR NUMBER"
                  placeholder="1234 5678 9012"
                  value={formData.aadhaar_number}
                  onChange={(v) => setFormData({ ...formData, aadhaar_number: v.replace(/[^0-9 ]/g, '').slice(0, 14) })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField
                  label="PHONE"
                  placeholder="+91"
                  value={formData.phone}
                  onChange={(v) => setFormData({ ...formData, phone: v })}
                  required
                />
                <InputField
                  label="RESIDENTIAL ADDRESS"
                  placeholder="City, State, PIN"
                  value={formData.address}
                  onChange={(v) => setFormData({ ...formData, address: v })}
                  required
                />
              </div>

              <div className="mt-10">
                <label 
                  className="border border-dashed border-[var(--border-input)] rounded-xl p-10 text-center cursor-pointer transition-colors hover:border-[var(--gold)] block"
                  style={{ background: 'var(--bg-input)' }}
                >
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedFile(file);
                        setFilePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  {uploadedFile ? (
                    <div>
                      <CheckCircle2 size={28} className="mx-auto mb-3" style={{ color: 'var(--green)' }} />
                      <p className="text-sm text-white font-medium">{uploadedFile.name}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1">{(uploadedFile.size / 1024).toFixed(0)} KB · Click to replace</p>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud size={28} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm text-[var(--text-secondary)]">📄 Click to upload PAN card / Aadhaar / Address proof</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-2">JPG, PNG, PDF · Max 5MB</p>
                    </div>
                  )}
                </label>
              </div>

              <div className="pt-6">
                <GoldButton type="submit" fullWidth className="!py-3.5" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit for verification →'}
                </GoldButton>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN (40%) — Why KYC */}
        <div className="lg:col-span-2">
          <div className="ownly-card">
            <span className="uppercase-label-gold">WHY KYC?</span>
            <h3 className="font-heading font-semibold text-xl text-white mt-3 mb-8">Mandatory for tokenized RE</h3>
            
            <ul className="space-y-5">
              {[
                'PAN + Aadhaar match (NSDL)',
                'PMLA / FATCA screening',
                'Sanctions & PEP check',
                'Address proof verification',
                'Bank account name match'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={18} style={{ color: 'var(--gold)', marginTop: '2px' }} className="shrink-0" />
                  <span className="text-sm text-white">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 pt-8 text-xs text-[var(--text-muted)] border-t border-[var(--border-card)]">
              Typical SLA: 24 hours. You'll see status update on this page.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
