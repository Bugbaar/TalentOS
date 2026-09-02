"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  GripVertical,
  Search,
  User,
  MapPin,
  Calendar,
  Star,
  Mail,
  Sparkles,
  X,
  MessageSquare,
  Edit3,
  Clock,
  TrendingUp,
  BarChart3,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { cn, initials, getScoreColor, timeAgo } from "@/lib/utils";
import type { ApplicationStatus, JobOpening } from "@/types";

interface PipelineApplication {
  id: string;
  candidate_id: string;
  status: string;
  ai_match_score: number | null;
  applied_at: string;
  candidate: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    headline?: string;
    location?: string;
    skills: string[];
    experience_years: number;
  };
}

const STAGES: { id: ApplicationStatus; label: string; color: string; lightColor: string; description: string }[] = [
  { id: "APPLIED", label: "Applied", color: "bg-slate-500", lightColor: "bg-slate-50", description: "New applications" },
  { id: "SCREENING", label: "Screening", color: "bg-blue-500", lightColor: "bg-blue-50", description: "Initial review" },
  { id: "INTERVIEW", label: "Interview", color: "bg-brand-500", lightColor: "bg-brand-50", description: "In interviews" },
  { id: "OFFER", label: "Offer", color: "bg-warning-500", lightColor: "bg-warning-50", description: "Offer extended" },
  { id: "HIRED", label: "Hired", color: "bg-success-500", lightColor: "bg-success-50", description: "Hired!" },
  { id: "REJECTED", label: "Rejected", color: "bg-danger-500", lightColor: "bg-danger-50", description: "Not moving forward" },
];

const BADGE_COLORS: Record<ApplicationStatus, { bg: string; text: string; border: string }> = {
  APPLIED: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  SCREENING: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  INTERVIEW: { bg: "bg-brand-100", text: "text-brand-700", border: "border-brand-200" },
  OFFER: { bg: "bg-warning-100", text: "text-warning-700", border: "border-warning-200" },
  HIRED: { bg: "bg-success-100", text: "text-success-700", border: "border-success-200" },
  REJECTED: { bg: "bg-danger-100", text: "text-danger-700", border: "border-danger-200" },
};

export default function PipelinePage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobOpening | null>(null);
  const [pipeline, setPipeline] = useState<Record<string, PipelineApplication[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<PipelineApplication | null>(null);
  const [draggedApp, setDraggedApp] = useState<PipelineApplication | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ApplicationStatus | null>(null);

  useEffect(() => {
    loadData();
  }, [jobId]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [jobData, pipelineData] = await Promise.all([
        api.job(jobId),
        api.getJobPipeline(jobId),
      ]);
      setJob(jobData);
      setPipeline(pipelineData.pipeline as Record<string, PipelineApplication[]>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }

  const updateApplicationStatus = useCallback(async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await api.updateApplication(appId, newStatus);
      setPipeline((prev) => {
        const next: Record<string, PipelineApplication[]> = {};
        for (const [stage, apps] of Object.entries(prev)) {
          next[stage] = apps.filter((a) => a.id !== appId);
        }
        // Add to new stage
        let movedApp: PipelineApplication | null = null;
        for (const stage of Object.keys(prev)) {
          const found = prev[stage].find((a) => a.id === appId);
          if (found) {
            movedApp = { ...found, status: newStatus };
            break;
          }
        }
        if (movedApp && next[newStatus]) {
          next[newStatus] = [movedApp, ...next[newStatus]];
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }, []);

  const handleDragStart = (app: PipelineApplication) => {
    setDraggedApp(app);
  };

  const handleDragOver = (e: React.DragEvent, stage: ApplicationStatus) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stage: ApplicationStatus) => {
    e.preventDefault();
    if (draggedApp && draggedApp.status !== stage) {
      updateApplicationStatus(draggedApp.id, stage);
      if (selectedApp?.id === draggedApp.id) {
        setSelectedApp({ ...selectedApp, status: stage });
      }
    }
    setDraggedApp(null);
    setDragOverStage(null);
  };

  const handleDragEnd = () => {
    setDraggedApp(null);
    setDragOverStage(null);
  };

  const getApplicationsByStage = (stage: ApplicationStatus) => {
    return (pipeline[stage] || []).filter((app) => {
      if (!searchQuery) return true;
      const name = `${app.candidate?.first_name || ""} ${app.candidate?.last_name || ""}`.toLowerCase();
      const email = app.candidate?.email?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  };

  const getStageStats = (stage: ApplicationStatus) => {
    const apps = getApplicationsByStage(stage);
    const avgScore = apps.length > 0
      ? apps.reduce((sum, a) => sum + (a.ai_match_score || 0), 0) / apps.length
      : 0;
    return { count: apps.length, avgScore: Math.round(avgScore) };
  };

  const totalCandidates = Object.values(pipeline).reduce((sum, apps) => sum + apps.length, 0);
  const overallAvgScore = totalCandidates > 0
    ? Math.round(
        Object.values(pipeline)
          .flat()
          .reduce((sum, a) => sum + (a.ai_match_score || 0), 0) / totalCandidates
      )
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-tx-tertiary">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/jobs/${jobId}`}
            className="inline-flex items-center gap-2 text-xs text-tx-tertiary hover:text-brand-600 transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            Back to Job Details
          </Link>
          <div className="eyebrow">
            <Sparkles size={12} />
            Pipeline Management
          </div>
          <h1 className="mt-1 text-2xl font-bold text-tx-primary tracking-tight">
            {job?.title || "Job Pipeline"}
          </h1>
          <p className="mt-1 text-sm text-tx-tertiary">
            {job?.department} · {job?.location}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-tertiary" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600">
              <Users size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-tx-primary">{totalCandidates}</p>
              <p className="text-[10px] text-tx-tertiary uppercase tracking-wider">Total Candidates</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 text-purple-600">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-tx-primary">{overallAvgScore}%</p>
              <p className="text-[10px] text-tx-tertiary uppercase tracking-wider">Avg Match Score</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-success-50 text-success-600">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-tx-primary">{pipeline.HIRED?.length || 0}</p>
              <p className="text-[10px] text-tx-tertiary uppercase tracking-wider">Hired</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warning-50 text-warning-600">
              <BarChart3 size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-tx-primary">
                {totalCandidates > 0 ? Math.round(((pipeline.HIRED?.length || 0) / totalCandidates) * 100) : 0}%
              </p>
              <p className="text-[10px] text-tx-tertiary uppercase tracking-wider">Conversion Rate</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4">
        {STAGES.map((stage) => {
          const stats = getStageStats(stage.id);
          const isDragOver = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              className={cn(
                "flex-shrink-0 w-80 rounded-2xl border-2 transition-all duration-200",
                isDragOver
                  ? "border-brand-400 bg-brand-50/50 shadow-lg"
                  : "border-sf-tertiary bg-sf-secondary/30"
              )}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage Header */}
              <div className="p-4 border-b border-sf-tertiary">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full", stage.color)} />
                    <h3 className="text-sm font-semibold text-tx-primary">{stage.label}</h3>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-bold border",
                    BADGE_COLORS[stage.id].bg,
                    BADGE_COLORS[stage.id].text,
                    BADGE_COLORS[stage.id].border
                  )}>
                    {stats.count}
                  </span>
                </div>
                <p className="text-[10px] text-tx-tertiary mb-2">{stage.description}</p>
                {stats.avgScore > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-tx-tertiary">
                    <Sparkles size={10} />
                    <span>Avg match: <span className="font-semibold text-tx-secondary">{stats.avgScore}%</span></span>
                  </div>
                )}
              </div>

              {/* Cards */}
              <div className="p-3 space-y-2 min-h-[300px] max-h-[calc(100vh-360px)] overflow-y-auto">
                {getApplicationsByStage(stage.id).map((app) => (
                  <CandidateCard
                    key={app.id}
                    app={app}
                    isDragging={draggedApp?.id === app.id}
                    isSelected={selectedApp?.id === app.id}
                    onDragStart={() => handleDragStart(app)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedApp(app)}
                  />
                ))}

                {stats.count === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-sf-tertiary rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-tx-muted mb-2">
                      <User size={18} />
                    </div>
                    <p className="text-xs text-tx-muted font-medium">No candidates</p>
                    <p className="text-[10px] text-tx-muted mt-0.5">Drag cards here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate Detail Panel */}
      {selectedApp && (
        <CandidateDetailPanel
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusChange={(status) => {
            updateApplicationStatus(selectedApp.id, status);
            setSelectedApp({ ...selectedApp, status });
          }}
        />
      )}
    </div>
  );
}

function CandidateCard({
  app,
  isDragging,
  isSelected,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  app: PipelineApplication;
  isDragging: boolean;
  isSelected: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "group bg-white rounded-xl border p-3 cursor-pointer transition-all duration-200",
        isDragging
          ? "opacity-50 scale-95 shadow-xl border-brand-400 rotate-1"
          : isSelected
          ? "border-brand-300 shadow-md ring-2 ring-brand-100"
          : "border-sf-tertiary hover:border-brand-200 hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-sf-secondary text-tx-muted group-hover:text-brand-600 cursor-grab active:cursor-grabbing transition-colors">
          <GripVertical size={12} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-tx-primary truncate">
            {app.candidate?.first_name} {app.candidate?.last_name}
          </p>
          <p className="text-[10px] text-tx-tertiary truncate">
            {app.candidate?.headline || app.candidate?.email}
          </p>
        </div>
        {app.ai_match_score && (
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-bold border flex-shrink-0",
              getScoreColor(app.ai_match_score)
            )}
          >
            {Math.round(app.ai_match_score)}%
          </span>
        )}
      </div>

      {app.candidate?.skills && app.candidate.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {app.candidate.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-sf-secondary text-tx-secondary"
            >
              {skill}
            </span>
          ))}
          {app.candidate.skills.length > 3 && (
            <span className="text-[9px] text-tx-muted font-medium">+{app.candidate.skills.length - 3}</span>
          )}
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-sf-tertiary flex items-center justify-between text-[10px] text-tx-muted">
        <div className="flex items-center gap-1">
          <Calendar size={10} />
          {timeAgo(app.applied_at)}
        </div>
        {app.candidate?.experience_years > 0 && (
          <div className="flex items-center gap-1">
            <Star size={10} />
            {app.candidate.experience_years}y
          </div>
        )}
      </div>
    </div>
  );
}

function CandidateDetailPanel({
  app,
  onClose,
  onStatusChange,
}: {
  app: PipelineApplication;
  onClose: () => void;
  onStatusChange: (status: ApplicationStatus) => void;
}) {
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "activity">("details");
  const [notes, setNotes] = useState<{ id: string; text: string; created_at: string }[]>([]);
  const [activities, setActivities] = useState<{ id: string; description: string; created_at: string }[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "activity") {
      loadActivities();
    }
  }, [activeTab]);

  async function loadActivities() {
    setTabLoading(true);
    try {
      const data = await api.getApplicationActivities(app.id);
      setActivities(data);
    } catch {
      setActivities([]);
    } finally {
      setTabLoading(false);
    }
  }

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes((prev) => [
      { id: Date.now().toString(), text: newNote, created_at: new Date().toISOString() },
      ...prev,
    ]);
    setNewNote("");
    setAddingNote(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-sf-tertiary shadow-2xl overflow-hidden flex flex-col animate-slide-in">
        {/* Header */}
        <div className="p-6 border-b border-sf-tertiary bg-gradient-to-br from-brand-50/30 to-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-lg font-bold">
                {initials(app.candidate?.first_name, app.candidate?.last_name)}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-tx-primary truncate">
                  {app.candidate?.first_name} {app.candidate?.last_name}
                </h2>
                <p className="text-xs text-tx-tertiary truncate">{app.candidate?.headline}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white transition-colors flex-shrink-0">
              <X size={18} className="text-tx-tertiary" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={app.status}
              onChange={(e) => onStatusChange(e.target.value as ApplicationStatus)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer",
                BADGE_COLORS[app.status as ApplicationStatus].bg,
                BADGE_COLORS[app.status as ApplicationStatus].text,
                BADGE_COLORS[app.status as ApplicationStatus].border
              )}
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  Move to {s.label}
                </option>
              ))}
            </select>
            {app.ai_match_score && (
              <span
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1",
                  getScoreColor(app.ai_match_score)
                )}
              >
                <Sparkles size={10} />
                {Math.round(app.ai_match_score)}% Match
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-sf-tertiary bg-white">
          {[
            { id: "details", label: "Details", icon: User },
            { id: "notes", label: "Notes", icon: MessageSquare, count: notes.length },
            { id: "activity", label: "Activity", icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "text-brand-700 border-b-2 border-brand-600 bg-brand-50/30"
                  : "text-tx-tertiary hover:text-tx-primary hover:bg-sf-secondary"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 rounded-full bg-brand-100 text-brand-700 text-[9px] font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-tx-tertiary">
                  Contact
                </h4>
                <div className="space-y-1">
                  <a
                    href={`mailto:${app.candidate?.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-sf-secondary transition-colors"
                  >
                    <Mail size={16} className="text-tx-muted flex-shrink-0" />
                    <span className="text-sm text-tx-primary truncate">{app.candidate?.email}</span>
                  </a>
                  {app.candidate?.location && (
                    <div className="flex items-center gap-3 p-3 rounded-lg">
                      <MapPin size={16} className="text-tx-muted flex-shrink-0" />
                      <span className="text-sm text-tx-primary">{app.candidate.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {app.candidate?.skills && app.candidate.skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-tx-tertiary">
                    Skills ({app.candidate.skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {app.candidate.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-tx-tertiary">
                  Experience
                </h4>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-sf-secondary">
                  <Star size={16} className="text-warning-500" />
                  <span className="text-sm font-medium text-tx-primary">
                    {app.candidate?.experience_years || 0} years
                  </span>
                </div>
              </div>

              {/* Application Info */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-tx-tertiary">
                  Application
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-sf-secondary">
                    <span className="text-tx-tertiary">Applied</span>
                    <span className="text-tx-primary font-medium">{timeAgo(app.applied_at)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-sf-secondary">
                    <span className="text-tx-tertiary">Status</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold",
                      BADGE_COLORS[app.status as ApplicationStatus].bg,
                      BADGE_COLORS[app.status as ApplicationStatus].text
                    )}>
                      {app.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              {/* Add Note */}
              {addingNote ? (
                <div className="space-y-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note about this candidate..."
                    className="field min-h-[100px] resize-none"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setAddingNote(false)} className="btn-ghost text-xs">
                      Cancel
                    </button>
                    <button onClick={addNote} className="btn-primary text-xs" disabled={!newNote.trim()}>
                      Save Note
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingNote(true)}
                  className="w-full p-3 rounded-xl border-2 border-dashed border-sf-tertiary text-sm text-tx-tertiary hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50 transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 size={14} />
                  Add Note
                </button>
              )}

              {/* Notes List */}
              {notes.map((note) => (
                <div key={note.id} className="p-4 rounded-xl bg-sf-secondary border border-sf-tertiary">
                  <p className="text-sm text-tx-primary leading-relaxed">{note.text}</p>
                  <p className="mt-2 text-[10px] text-tx-muted">{timeAgo(note.created_at)}</p>
                </div>
              ))}

              {notes.length === 0 && !addingNote && (
                <div className="text-center py-8">
                  <MessageSquare size={24} className="mx-auto text-tx-muted mb-2" />
                  <p className="text-xs text-tx-muted">No notes yet</p>
                  <p className="text-[10px] text-tx-muted">Add the first note</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              {tabLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8">
                  <Clock size={24} className="mx-auto text-tx-muted mb-2" />
                  <p className="text-xs text-tx-muted">No activity yet</p>
                </div>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-brand-200 via-sf-tertiary to-transparent" />
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative pb-4">
                      <div className="absolute left-0 -translate-x-1/2 w-3 h-3 rounded-full bg-brand-500 border-2 border-white" />
                      <div className="ml-4">
                        <p className="text-sm text-tx-primary font-medium">{activity.description}</p>
                        <p className="text-[10px] text-tx-muted mt-0.5">{timeAgo(activity.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-sf-tertiary bg-white">
          <div className="flex gap-2">
            <Link
              href={`/candidates/${app.candidate?.id}`}
              className="btn-secondary flex-1 text-xs"
            >
              View Profile
            </Link>
            <Link
              href={`/matching?candidate=${app.candidate?.id}&job=${app.id}`}
              className="btn-primary flex-1 text-xs"
            >
              <Sparkles size={14} />
              AI Match
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
