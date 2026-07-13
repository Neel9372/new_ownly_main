'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { builderAPI } from '@/lib/api';
import { formatINR } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import MilestoneCard from '@/components/MilestoneCard';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';
import GoldButton from '@/components/GoldButton';
import { 
  TrendingUp, Wallet, Lock, Calendar, Hammer, 
  Camera, FileText, CheckCircle2, AlertTriangle, Plus, Upload, 
  ExternalLink, ShieldAlert, FolderKanban, Users, Clock, Trash2
} from 'lucide-react';
import type { BuilderProject, ProjectMilestone, ProjectDocument, ProjectUpdate } from '@/types';

export default function BuilderPage() {
  const { user, refreshUser } = useAuth();
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Builder Projects list
  const [projects, setProjects] = useState<BuilderProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  
  // Selected project details
  const [project, setProject] = useState<BuilderProject | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  
  // Forms & Modal State
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    company_name: '',
    rera_number: '',
    gst_number: '',
    website: '',
    portfolio_url: ''
  });
  
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    property_type: 'Residential',
    location: '',
    description: '',
    rera_id: '',
    total_funding_goal: '',
    total_tokens: '',
    token_price: '',
    construction_start: '',
    expected_completion: '',
    funding_deadline: ''
  });

  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    milestone_name: '',
    description: '',
    funding_percentage: '',
    due_date: ''
  });

  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({
    document_type: 'RERA_CERT',
    document_url: ''
  });

  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDesc, setUpdateDesc] = useState('');
  const [photosCount, setPhotosCount] = useState(0);

  // Submissions state
  const [submitting, setSubmitting] = useState(false);

  // Fetch Projects list
  useEffect(() => {
    if (user && user.role === 'BUILDER') {
      fetchMyProjects();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Fetch details when selected project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
    } else {
      setProject(null);
      setMilestones([]);
      setDocuments([]);
      setUpdates([]);
    }
  }, [selectedProjectId]);

  const fetchMyProjects = async () => {
    try {
      const res = await builderAPI.getMyProjects();
      const myProjects = res.data.projects || [];
      setProjects(myProjects);
      if (myProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(myProjects[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch your projects list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (id: number) => {
    try {
      const res = await builderAPI.getProjectDetails(id);
      setProject(res.data.project);
      setMilestones(res.data.milestones || []);
      setDocuments(res.data.documents || []);
      setUpdates(res.data.updates || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load project details.');
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await builderAPI.submitVerification(verifyForm);
      await refreshUser();
      setShowVerifyForm(false);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Verification submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await builderAPI.submitProject({
        ...projectForm,
        total_funding_goal: Number(projectForm.total_funding_goal),
        total_tokens: Number(projectForm.total_tokens),
        token_price: Number(projectForm.token_price),
      });
      await fetchMyProjects();
      setSelectedProjectId(res.data.project.id);
      setShowProjectForm(false);
      setProjectForm({
        title: '',
        property_type: 'Residential',
        location: '',
        description: '',
        rera_id: '',
        total_funding_goal: '',
        total_tokens: '',
        token_price: '',
        construction_start: '',
        expected_completion: '',
        funding_deadline: ''
      });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Project submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setSubmitting(true);
    setError('');
    
    const currentTotal = milestones.reduce((sum, m) => sum + Number(m.funding_percentage), 0);
    const addedPct = Number(milestoneForm.funding_percentage);
    
    if (currentTotal + addedPct > 100) {
      setError(`Total milestone percentage cannot exceed 100%. Currently at ${currentTotal}%, trying to add ${addedPct}%.`);
      setSubmitting(false);
      return;
    }

    try {
      await builderAPI.addMilestone(selectedProjectId, {
        milestone_name: milestoneForm.milestone_name,
        description: milestoneForm.description,
        funding_percentage: addedPct,
        due_date: milestoneForm.due_date,
      });
      await fetchProjectDetails(selectedProjectId);
      setShowMilestoneForm(false);
      setMilestoneForm({
        milestone_name: '',
        description: '',
        funding_percentage: '',
        due_date: ''
      });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to add milestone.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setSubmitting(true);
    setError('');
    try {
      await builderAPI.uploadDocument(selectedProjectId, docForm);
      await fetchProjectDetails(selectedProjectId);
      setShowDocForm(false);
      setDocForm({
        document_type: 'RERA_CERT',
        document_url: ''
      });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload document.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!selectedProjectId) return;
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    setSubmitting(true);
    setError('');
    try {
      await builderAPI.deleteDocument(docId);
      await fetchProjectDetails(selectedProjectId);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to delete document.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    if (!updateTitle.trim() || !updateDesc.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await builderAPI.addProjectUpdate(selectedProjectId, {
        title: updateTitle,
        description: updateDesc,
        photos_count: photosCount
      });
      await fetchProjectDetails(selectedProjectId);
      setUpdateTitle('');
      setUpdateDesc('');
      setPhotosCount(0);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to publish site update.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper values
  const constructionPct = milestones
    .filter(m => m.status === 'COMPLETED')
    .reduce((sum, m) => sum + Number(m.funding_percentage), 0);

  const releasedEscrow = project ? (Number(project.total_funding_goal) * constructionPct) / 100 : 0;
  const lockedEscrow = project ? Number(project.total_funding_goal) - releasedEscrow : 0;

  const nextPendingMilestone = milestones.find(m => m.status === 'PENDING');
  const nextTrancheVal = nextPendingMilestone && project 
    ? (Number(project.total_funding_goal) * Number(nextPendingMilestone.funding_percentage)) / 100 
    : 0;

  // Authorization Check
  if (!user || user.role !== 'BUILDER') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center page-container py-20">
        <div className="ownly-card max-w-md w-full text-center p-8 border border-[var(--red)]/20">
          <ShieldAlert size={48} className="text-[var(--red)] mx-auto mb-4" />
          <h2 className="font-heading font-bold text-2xl text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Only verified builders can access the Builder Console. If you have an account, please make sure you are logged in.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} />
          <span className="uppercase-label text-[10px]">LOADING CONSOLE</span>
        </div>
      </div>
    );
  }

  // 1. UNVERIFIED / NOT REGISTERED BUILDER SCREEN
  if (user.builder_status === 'NOT_APPLICABLE' || user.builder_status === 'REJECTED') {
    return (
      <div className="page-container py-16 max-w-3xl">
        <PageHeader
          breadcrumbIcon={<Hammer size={16} className="text-[var(--gold)]" />}
          breadcrumb="BUILDER CONSOLE · VERIFICATION"
          heading="Partner with"
          goldText="OWNLY"
          subtitle="Unlock fractional escrow-gated construction funding from global real estate token holders."
        />

        <div className="ownly-card mt-8 p-8 border border-[var(--gold)]/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--gold)]/10 text-[var(--gold)]">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl text-white">Verification Required</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">Submit your corporate RERA credentials to start listing projects.</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-[var(--red)]/10 border border-[var(--red)]/20 text-xs text-[var(--red)] flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {!showVerifyForm ? (
            <div className="space-y-6">
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Our compliance team reviews RERA registrations, MCA filings, and track records within 24 hours. Once verified, you will be granted access to project tokenization, milestone planning, and escrows.
              </p>
              {user.builder_status === 'REJECTED' && (
                <div className="p-4 rounded bg-[var(--red)]/5 border border-[var(--red)]/10 text-xs text-[var(--text-secondary)]">
                  <span className="text-[var(--red)] font-semibold uppercase">Previous Application Rejected.</span> Please check your details and re-apply.
                </div>
              )}
              <GoldButton onClick={() => setShowVerifyForm(true)}>Apply for Verification</GoldButton>
            </div>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="uppercase-label text-[10px] block mb-2">Company Name *</label>
                  <input
                    required
                    type="text"
                    value={verifyForm.company_name}
                    onChange={e => setVerifyForm({ ...verifyForm, company_name: e.target.value })}
                    className="ownly-input"
                    placeholder="e.g. Aurelia Developments"
                  />
                </div>
                <div>
                  <label className="uppercase-label text-[10px] block mb-2">RERA Registration No *</label>
                  <input
                    required
                    type="text"
                    value={verifyForm.rera_number}
                    onChange={e => setVerifyForm({ ...verifyForm, rera_number: e.target.value })}
                    className="ownly-input"
                    placeholder="e.g. RAJ/P/2024/2993"
                  />
                </div>
                <div>
                  <label className="uppercase-label text-[10px] block mb-2">GSTIN *</label>
                  <input
                    required
                    type="text"
                    value={verifyForm.gst_number}
                    onChange={e => setVerifyForm({ ...verifyForm, gst_number: e.target.value })}
                    className="ownly-input"
                    placeholder="e.g. 07AAAAA1111A1Z1"
                  />
                </div>
                <div>
                  <label className="uppercase-label text-[10px] block mb-2">Website URL</label>
                  <input
                    type="url"
                    value={verifyForm.website}
                    onChange={e => setVerifyForm({ ...verifyForm, website: e.target.value })}
                    className="ownly-input"
                    placeholder="https://company.com"
                  />
                </div>
              </div>
              <div>
                <label className="uppercase-label text-[10px] block mb-2">Portfolio/Past Projects Link</label>
                <input
                  type="url"
                  value={verifyForm.portfolio_url}
                  onChange={e => setVerifyForm({ ...verifyForm, portfolio_url: e.target.value })}
                  className="ownly-input"
                  placeholder="https://company.com/portfolio"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <GoldButton type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Verification'}
                </GoldButton>
                <button
                  type="button"
                  onClick={() => setShowVerifyForm(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 2. VERIFICATION PENDING SCREEN
  if (user.builder_status === 'PENDING') {
    return (
      <div className="page-container py-20 flex items-center justify-center min-h-[70vh]">
        <div className="ownly-card max-w-md w-full text-center p-8 border border-[var(--gold)]/20 bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-page)]">
          <Clock size={48} className="text-[var(--gold)] mx-auto mb-4 animate-pulse" />
          <h2 className="font-heading font-bold text-2xl text-white mb-2">Verification Pending</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
            Your verification request is currently under review by our compliance team. RERA status and MCA registers are being verified. We will notify you here once approved.
          </p>
          <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] border-t border-[var(--border-card)] pt-4">
            Awaiting Admin Sign-off
          </div>
        </div>
      </div>
    );
  }

  // 3. MAIN VERIFIED CONSOLE
  return (
    <div className="page-container py-16 pb-24">
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--red)]/10 border border-[var(--red)]/25 text-xs text-[var(--red)] flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <PageHeader
          breadcrumbIcon={<Hammer size={16} className="text-[var(--gold)]" />}
          breadcrumb={`BUILDER CONSOLE · ${user.company_name?.toUpperCase() || 'DEVELOPER'}`}
          heading={project?.title || "My Projects"}
          goldText=""
          subtitle="Plan milestones, upload docs, and track escrows. Real-time updates sync to investors instantly."
        />

        <div className="flex gap-3 shrink-0 items-center">
          {projects.length > 0 && (
            <div className="relative">
              <select
                value={selectedProjectId || ''}
                onChange={e => setSelectedProjectId(Number(e.target.value))}
                className="ownly-input text-xs font-semibold !py-2.5 !pr-10 !pl-4 bg-[var(--bg-input)] cursor-pointer text-white appearance-none border border-[var(--border-card)] rounded"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-[var(--bg-card)] text-white">
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button 
            onClick={() => setShowProjectForm(true)} 
            className="btn-outline !py-2.5 !px-4 text-xs font-semibold"
          >
            + New Project
          </button>
        </div>
      </div>

      {/* ═══════════ IF BUILDER HAS NO PROJECTS ═══════════ */}
      {projects.length === 0 ? (
        <div className="ownly-card text-center py-20 border border-[var(--border-card)] bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-page)]">
          <FolderKanban size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="font-heading font-semibold text-xl text-white mb-2">No tokenized projects</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-8 leading-relaxed">
            Submit your first construction project to tokenize and raise capital. Awaiting layout, structural drawings and RERA registration maps.
          </p>
          <GoldButton onClick={() => setShowProjectForm(true)}>Submit Project Proposal</GoldButton>
        </div>
      ) : (
        /* ═══════════ MAIN ACTIVE CONSOLE GRID ═══════════ */
        <div>
          {/* Status Alert for Unapproved Projects */}
          {project && project.status !== 'APPROVED' && project.status !== 'LIVE' && project.status !== 'COMPLETED' && (
            <div className="mb-10 p-4 rounded-xl border border-[var(--amber)]/20 bg-[var(--amber)]/5 flex gap-4 items-start">
              <AlertTriangle size={18} className="text-[var(--amber)] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Project Proposal Awaiting Review</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {project.status === 'REJECTED' 
                    ? `Rejection Reason: ${project.rejection_reason || 'Incomplete details.'}`
                    : 'Our admin team is validating your total funding goal, token price and construction dates. Escrows will activate upon approval.'
                  }
                </p>
              </div>
            </div>
          )}

          {/* ESCROW STATS STRIP */}
          {project && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <div className="ownly-card !p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="uppercase-label text-[10px]">CONSTRUCTION PROGRESS</span>
                  <TrendingUp size={16} className="text-[var(--text-muted)]" />
                </div>
                <div className="font-heading font-bold text-3xl text-white">{constructionPct}%</div>
              </div>
              <div className="ownly-card !p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="uppercase-label text-[10px]">RELEASED FROM ESCROW</span>
                  <Wallet size={16} className="text-[var(--text-muted)]" />
                </div>
                <div className="font-heading font-bold text-3xl text-[var(--green)]">
                  {formatINR(releasedEscrow)}
                </div>
              </div>
              <div className="ownly-card !p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="uppercase-label text-[10px]">ESCROW LOCKED</span>
                  <Lock size={16} className="text-[var(--text-muted)]" />
                </div>
                <div className="font-heading font-bold text-3xl text-white">
                  {formatINR(lockedEscrow)}
                </div>
              </div>
              <div className="ownly-card !p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="uppercase-label text-[10px]">EXPECTED HANDOVER</span>
                  <Calendar size={16} className="text-[var(--text-muted)]" />
                </div>
                <div className="font-heading font-bold text-3xl text-white">
                  {new Date(project.expected_completion).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN (65%) */}
            <div className="lg:col-span-2 space-y-10">
              
              {/* Construction Timeline */}
              <section>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="font-heading font-bold text-2xl text-white mb-1">Construction Timeline</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {milestones.length} milestones · {milestones.reduce((sum, m) => sum + Number(m.funding_percentage), 0)}% allocated · Escrow-gated
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowMilestoneForm(true)} 
                    className="btn-outline !py-2 !px-4 text-xs font-semibold cursor-pointer"
                  >
                    + Add Milestone
                  </button>
                </div>

                <div className="pl-2">
                  {milestones.length === 0 ? (
                    <div className="ownly-card text-center py-10 text-[var(--text-muted)]">
                      No milestones created yet. Add milestones to schedule escrow fund tranches.
                    </div>
                  ) : (
                    milestones.map((m, i) => {
                      // Status: COMPLETED, IN_PROGRESS, or LOCKED
                      let status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED' = 'LOCKED';
                      if (m.status === 'COMPLETED') {
                        status = 'COMPLETED';
                      } else {
                        const isFirstPending = milestones.find(x => x.status === 'PENDING')?.id === m.id;
                        status = isFirstPending ? 'IN_PROGRESS' : 'LOCKED';
                      }
                      
                      const trancheVal = (Number(project!.total_funding_goal) * Number(m.funding_percentage)) / 100;
                      
                      return (
                        <MilestoneCard 
                          key={m.id}
                          name={m.milestone_name}
                          percentage={Number(m.funding_percentage)}
                          status={status}
                          dateRange={new Date(m.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          trancheAmount={trancheVal}
                          documents={[]} // project documents are listed in sidebar
                        />
                      );
                    })
                  )}
                </div>
              </section>

              {/* Post Update */}
              <section className="ownly-card">
                <h3 className="font-heading font-semibold text-lg text-white mb-4">+ Post a site update</h3>
                <form onSubmit={handlePostUpdate}>
                  <input 
                    required
                    className="ownly-input mb-4" 
                    placeholder="Update title — e.g., Raft slab pour completed" 
                    value={updateTitle}
                    onChange={(e) => setUpdateTitle(e.target.value)}
                  />
                  <textarea 
                    required
                    className="ownly-input min-h-[100px] resize-y mb-4" 
                    placeholder="Describe what was completed, materials used, concrete grade, test status..."
                    value={updateDesc}
                    onChange={(e) => setUpdateDesc(e.target.value)}
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-3 items-center">
                      <label className="text-xs text-[var(--text-secondary)] flex items-center gap-2 cursor-pointer bg-[var(--bg-input)] px-3 py-1.5 rounded hover:text-white border border-[var(--border-card)]">
                        <Camera size={14} /> 
                        <span>Photos Count:</span>
                        <input 
                          type="number" 
                          min={0}
                          value={photosCount}
                          onChange={e => setPhotosCount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="bg-transparent text-white border-none w-10 text-center font-bold focus:outline-none"
                        />
                      </label>
                    </div>
                    <GoldButton type="submit" className="!py-2 !px-6 w-full sm:w-auto text-sm" disabled={submitting}>
                      Publish to investors
                    </GoldButton>
                  </div>
                </form>
              </section>

              {/* Activity Feed */}
              <section>
                <h3 className="font-heading font-bold text-2xl text-white mb-6">Activity Feed</h3>
                <div className="space-y-4">
                  {updates.length === 0 ? (
                    <div className="ownly-card text-center py-10 text-[var(--text-muted)]">
                      No site updates posted yet. Publish updates to build investor trust.
                    </div>
                  ) : (
                    updates.map((post) => (
                      <div key={post.id} className="ownly-card !p-5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="uppercase-label text-[10px] text-[var(--gold)]">
                            {new Date(post.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase()}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)]">{post.author}</span>
                        </div>
                        <h4 className="font-heading font-semibold text-lg text-white mb-2">{post.title}</h4>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{post.description}</p>
                        {Number(post.photos_count) > 0 && (
                          <div className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] border border-[var(--border-card)] rounded px-3 py-1">
                            <Camera size={12} /> {post.photos_count} photos attached
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN (35%) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* ESCROW WATERFALL */}
              <div className="ownly-card">
                <span className="uppercase-label-gold block mb-2">ESCROW WATERFALL</span>
                <h3 className="font-heading font-semibold text-lg text-white mb-4">Capital release order</h3>
                <ol className="text-sm space-y-3 pl-4 list-decimal text-[var(--text-secondary)]">
                  <li><strong className="text-white font-medium">Senior bank loan + interest</strong> (70% standard cap)</li>
                  <li><strong className="text-white font-medium">Investor preferred return</strong> (14% IRR to token holders)</li>
                  <li><strong className="text-white font-medium">Builder profit (residual)</strong> (Released last)</li>
                </ol>
                <div className="mt-6 p-3 bg-[var(--amber)]/10 border border-[var(--amber)]/20 rounded-lg text-xs text-[var(--amber)] flex items-start gap-2">
                  <span className="text-lg leading-none">⚠️</span>
                  <span>Escrow accounts release tranches strictly to vendor wallets.</span>
                </div>
              </div>

              {/* NEXT TRANCHE */}
              {project && nextPendingMilestone && (
                <div className="ownly-card">
                  <span className="uppercase-label text-[10px] text-[var(--text-secondary)] block mb-1">NEXT TRANCHE</span>
                  <div className="font-heading font-bold text-4xl text-[var(--gold)] mb-4">
                    {formatINR(nextTrancheVal)}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                    Releases when <strong>'{nextPendingMilestone.milestone_name}'</strong> passes compliance review and audit checks.
                  </p>
                  <div className="text-xs text-[var(--text-muted)]">
                    Target Date: {new Date(nextPendingMilestone.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              )}

              {/* PROJECT DOCUMENTS */}
              <div className="ownly-card">
                <div className="flex justify-between items-center mb-4">
                  <span className="uppercase-label text-[10px] text-[var(--text-secondary)] block">PROJECT DOCUMENTS</span>
                  <button 
                    onClick={() => setShowDocForm(true)} 
                    className="text-xs text-[var(--gold)] font-semibold bg-transparent border-none cursor-pointer hover:underline"
                  >
                    + Add Doc
                  </button>
                </div>

                {showDocForm && (
                  <form onSubmit={handleDocSubmit} className="ownly-card !bg-[var(--bg-input)] !p-4 mb-4 border border-[var(--gold)]/10">
                    <div className="space-y-3">
                      <div>
                        <label className="uppercase-label text-[9px] block mb-1">Type</label>
                        <select 
                          value={docForm.document_type}
                          onChange={e => setDocForm({ ...docForm, document_type: e.target.value })}
                          className="ownly-input text-xs"
                        >
                          <option value="RERA_CERT">RERA Cert</option>
                          <option value="OC">Occupancy Cert (OC)</option>
                          <option value="CC">Completion Cert (CC)</option>
                          <option value="TITLE_DEED">Title Deed</option>
                          <option value="LAYOUT">Layout Plan</option>
                          <option value="GST_CERT">GST Cert</option>
                        </select>
                      </div>
                      <div>
                        <label className="uppercase-label text-[9px] block mb-1">Doc URL</label>
                        <input 
                          required
                          type="url"
                          placeholder="https://ipfs.io/ipfs/..."
                          value={docForm.document_url}
                          onChange={e => setDocForm({ ...docForm, document_url: e.target.value })}
                          className="ownly-input text-xs !py-2"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button type="submit" disabled={submitting} className="btn-gold !py-1.5 !px-3 text-xs">Save</button>
                        <button type="button" onClick={() => setShowDocForm(false)} className="btn-outline !py-1.5 !px-3 text-xs">Cancel</button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {documents.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)]">No documents uploaded yet.</p>
                  ) : (
                    documents.map((doc) => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-2.5 rounded border border-[var(--border-card)] hover:border-[var(--gold)] bg-[var(--bg-input)] text-white transition-colors"
                      >
                        <a 
                          href={doc.document_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-2 min-w-0 no-underline text-white hover:text-[var(--gold)] transition-colors flex-1"
                        >
                          <FileText size={14} className="text-[var(--gold)] shrink-0" />
                          <span className="text-xs font-medium truncate uppercase">{doc.document_type.replace('_', ' ')}</span>
                          <ExternalLink size={10} className="text-[var(--text-muted)] shrink-0 ml-1" />
                        </a>
                        
                        <button 
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-[var(--red)] hover:text-red-400 p-1 rounded hover:bg-red-500/10 cursor-pointer bg-transparent border-none transition-colors ml-2 shrink-0 flex items-center justify-center"
                          title="Delete Document"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* STATS */}
              <div className="ownly-card">
                <span className="uppercase-label text-[10px] text-[var(--text-secondary)] block mb-4">INVESTOR REACH</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1">TOKEN HOLDERS</div>
                    <div className="font-heading font-semibold text-white text-xl">
                      {project ? Math.floor(Number(project.funded_amount) / Number(project.token_price) * 0.12) || 0 : 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1">AVG TICKET</div>
                    <div className="font-heading font-semibold text-white text-xl">₹48.2K</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1 mt-2">UPDATES POSTED</div>
                    <div className="font-heading font-semibold text-white text-xl">
                      {updates.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1 mt-2">OPEN QUERIES</div>
                    <div className="font-heading font-semibold text-white text-xl">0</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL: NEW PROJECT PROPOSAL ═══════════ */}
      {showProjectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowProjectForm(false)}>
          <div className="ownly-card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <FolderKanban size={24} className="text-[var(--gold)]" />
              <h3 className="font-heading font-bold text-xl text-white">New Project Proposal</h3>
            </div>

            <form onSubmit={handleProjectSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="uppercase-label text-[10px] block mb-1.5">Project Title *</label>
                  <input
                    required
                    type="text"
                    value={projectForm.title}
                    onChange={e => setProjectForm({ ...projectForm, title: e.target.value })}
                    className="ownly-input"
                    placeholder="e.g. Aurelia Hyderabad Residency"
                  />
                </div>
                <div>
                  <label className="uppercase-label text-[10px] block mb-1.5">Property Type *</label>
                  <select
                    value={projectForm.property_type}
                    onChange={e => setProjectForm({ ...projectForm, property_type: e.target.value })}
                    className="ownly-input text-white bg-[var(--bg-input)]"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Mixed-Use">Mixed-Use</option>
                  </select>
                </div>
                <div>
                  <label className="uppercase-label text-[10px] block mb-1.5">Location *</label>
                  <input
                    required
                    type="text"
                    value={projectForm.location}
                    onChange={e => setProjectForm({ ...projectForm, location: e.target.value })}
                    className="ownly-input"
                    placeholder="e.g. Gachibowli, Hyderabad"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="uppercase-label text-[10px] block mb-1.5">Description *</label>
                  <textarea
                    required
                    value={projectForm.description}
                    onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                    className="ownly-input min-h-[80px] resize-y"
                    placeholder="Detailed overview of the project structure, land titles, and building plan..."
                  />
                </div>
                <div>
                  <label className="uppercase-label text-[10px] block mb-1.5">RERA Registration ID</label>
                  <input
                    type="text"
                    value={projectForm.rera_id}
                    onChange={e => setProjectForm({ ...projectForm, rera_id: e.target.value })}
                    className="ownly-input"
                    placeholder="e.g. P51800045678"
                  />
                </div>
                <div>
                  <label className="uppercase-label text-[10px] block mb-1.5">Total Funding Goal (INR) *</label>
                  <input
                    required
                    type="number"
                    value={projectForm.total_funding_goal}
                    onChange={e => setProjectForm({ ...projectForm, total_funding_goal: e.target.value })}
                    className="ownly-input"
                    placeholder="e.g. 150000000"
                  />
                </div>
                <div>
                  <label className="uppercase-label text-[10px] block mb-1.5">Total Tokens *</label>
                  <input
                    required
                    type="number"
                    value={projectForm.total_tokens}
                    onChange={e => setProjectForm({ ...projectForm, total_tokens: e.target.value })}
                    className="ownly-input"
                    placeholder="e.g. 10000"
                  />
                </div>
                <div>
                  <label className="uppercase-label text-[10px] block mb-1.5">Token Price (INR) *</label>
                  <input
                    required
                    type="number"
                    value={projectForm.token_price}
                    onChange={e => setProjectForm({ ...projectForm, token_price: e.target.value })}
                    className="ownly-input"
                    placeholder="e.g. 15000"
                  />
                </div>
                <div>
                  <label className="uppercase-label text-[10px] block mb-1.5">Construction Start Date *</label>
                  <input
                    required
                    type="date"
                    value={projectForm.construction_start}
                    onChange={e => setProjectForm({ ...projectForm, construction_start: e.target.value })}
                    className="ownly-input"
                  />
                </div>
                <div>
                  <label className="uppercase-label text-[10px] block mb-1.5">Expected Completion *</label>
                  <input
                    required
                    type="date"
                    value={projectForm.expected_completion}
                    onChange={e => setProjectForm({ ...projectForm, expected_completion: e.target.value })}
                    className="ownly-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="uppercase-label text-[10px] block mb-1.5">Funding Deadline *</label>
                  <input
                    required
                    type="date"
                    value={projectForm.funding_deadline}
                    onChange={e => setProjectForm({ ...projectForm, funding_deadline: e.target.value })}
                    className="ownly-input"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-[var(--border-card)]">
                <GoldButton type="submit" disabled={submitting}>
                  {submitting ? 'Submitting Proposal...' : 'Submit Proposal'}
                </GoldButton>
                <button
                  type="button"
                  onClick={() => setShowProjectForm(false)}
                  className="btn-outline flex-1 justify-center"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL: NEW MILESTONE ═══════════ */}
      {showMilestoneForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowMilestoneForm(false)}>
          <div className="ownly-card w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <Plus size={20} className="text-[var(--gold)]" />
              <h3 className="font-heading font-bold text-lg text-white">Add Escrow Milestone</h3>
            </div>

            <form onSubmit={handleMilestoneSubmit} className="space-y-4">
              <div>
                <label className="uppercase-label text-[10px] block mb-1.5">Milestone Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Foundation & Plinth"
                  value={milestoneForm.milestone_name}
                  onChange={e => setMilestoneForm({ ...milestoneForm, milestone_name: e.target.value })}
                  className="ownly-input"
                />
              </div>
              <div>
                <label className="uppercase-label text-[10px] block mb-1.5">Fund Release Percentage (%) *</label>
                <input
                  required
                  type="number"
                  min={1}
                  max={100}
                  placeholder="e.g. 25"
                  value={milestoneForm.funding_percentage}
                  onChange={e => setMilestoneForm({ ...milestoneForm, funding_percentage: e.target.value })}
                  className="ownly-input"
                />
              </div>
              <div>
                <label className="uppercase-label text-[10px] block mb-1.5">Target Completion Date *</label>
                <input
                  required
                  type="date"
                  value={milestoneForm.due_date}
                  onChange={e => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
                  className="ownly-input"
                />
              </div>
              <div>
                <label className="uppercase-label text-[10px] block mb-1.5">Description</label>
                <textarea
                  placeholder="Describe technical verification requirements for compliance..."
                  value={milestoneForm.description}
                  onChange={e => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  className="ownly-input min-h-[60px] resize-y"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[var(--border-card)]">
                <GoldButton type="submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Milestone'}
                </GoldButton>
                <button
                  type="button"
                  onClick={() => setShowMilestoneForm(false)}
                  className="btn-outline flex-1 justify-center"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}