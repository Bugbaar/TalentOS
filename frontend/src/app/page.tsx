"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Cpu,
  FileUp,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  Calendar,
  Target,
  CheckCircle2,
  Clock,
  Award,
  Activity,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AnalyticsSummary, Application, Candidate } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import ResumeUploader from "@/components/ResumeUploader";
import { formatNumber, formatDate, initials, timeAgo, getScoreColor } from "@/lib/utils";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.analytics(), api.candidates()])
      .then(([stats, people]) => {
        setAnalytics(stats);
        setCandidates(people);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load dashboard"));
  }, []);

  const applications: (Application & { name: string; headline?: string | null })[] = candidates
    .flatMap((candidate) =>
      (candidate.applications ?? []).map((application) => ({
        ...application,
        name: `${candidate.first_name} ${candidate.last_name}`,
        headline: candidate.headline,
      }))
    )
    .sort((a, b) => b.applied_at.localeCompare(a.applied_at))
    .slice(0, 6);

  const avgMatch = applications.length
    ? Math.round(
        applications.reduce((sum, item) => sum + (item.ai_match_score ?? 0), 0) /
          applications.length
      )
    : 0;

  const stats = [
    {
      label: "Talent Ingested",
      value: formatNumber(analytics?.total_candidates ?? 0),
      icon: Users,
      trend: "Total Verified Candidates",
      change: "+12%",
      changeType: "up" as const,
      iconBg: "bg-brand-50 text-brand-600",
    },
    {
      label: "Active Requisitions",
      value: analytics?.active_jobs ?? 0,
      icon: Briefcase,
      trend: "Live Open Positions",
      change: "+5%",
      changeType: "up" as const,
      iconBg: "bg-success-50 text-success-600",
    },
    {
      label: "Pipeline Volume",
      value: formatNumber(analytics?.total_applications ?? 0),
      icon: TrendingUp,
      trend: "Processed Applications",
      change: "+18%",
      changeType: "up" as const,
      iconBg: "bg-warning-50 text-warning-600",
    },
    {
      label: "Mean Match Score",
      value: `${avgMatch}%`,
      icon: Sparkles,
      trend: "AI Evaluated Fit",
      change: avgMatch >= 70 ? "Strong" : "Moderate",
      changeType: avgMatch >= 70 ? ("up" as const) : ("neutral" as const),
      iconBg: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 p-8 sm:p-10 text-white">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-brand-400/30 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium">
                <Sparkles size={12} />
                <span>AI-Powered Talent Intelligence</span>
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight max-w-2xl">
                Welcome back, build your dream team
              </h1>
              <p className="mt-2 text-sm sm:text-base text-white/80 max-w-xl">
                Ingest resumes, evaluate candidates, and hire top talent 10x faster with our AI-powered recruitment platform.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-brand-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                <FileUp size={16} />
                Ingest Resume
              </button>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-all"
              >
                <Plus size={16} />
                New Requisition
              </Link>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">
          {error}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, trend, change, changeType, iconBg }) => (
          <div key={label} className="card p-6 hover:shadow-lg transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${iconBg}`}>
                <Icon size={20} />
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${
                changeType === "up" ? "bg-success-50 text-success-700" :
                changeType === "down" ? "bg-danger-50 text-danger-700" :
                "bg-sf-secondary text-tx-tertiary"
              }`}>
                {changeType === "up" && <ArrowUpRight size={10} />}
                {changeType === "down" && <ArrowDownRight size={10} />}
                {change}
              </span>
            </div>
            <p className="text-3xl font-bold text-tx-primary">{value}</p>
            <p className="mt-1 text-sm font-medium text-tx-primary">{label}</p>
            <p className="mt-0.5 text-xs text-tx-tertiary">{trend}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Applications */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between border-b border-sf-tertiary px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-tx-primary">Recent Applications</h2>
                <p className="text-xs text-tx-tertiary">Latest candidate submissions</p>
              </div>
            </div>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-sf-tertiary">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center gap-4 px-6 py-4 hover:bg-sf-secondary/50 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs font-bold flex-shrink-0">
                  {initials(app.name.split(" ")[0], app.name.split(" ").slice(1).join(" "))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-tx-primary truncate">{app.name}</p>
                  <p className="text-xs text-tx-tertiary truncate">{app.headline || "Candidate"}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {app.ai_match_score && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreColor(app.ai_match_score)}`}>
                      <Sparkles size={10} />
                      {Math.round(app.ai_match_score)}%
                    </span>
                  )}
                  <StatusBadge status={app.status} />
                </div>
                <div className="hidden sm:block text-right flex-shrink-0">
                  <p className="text-xs text-tx-tertiary">{timeAgo(app.applied_at)}</p>
                </div>
              </div>
            ))}
            {!applications.length && (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Users size={24} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-tx-primary">No applications yet</h3>
                <p className="mt-1 text-xs text-tx-tertiary">Start by ingesting resumes to see candidate applications.</p>
                <button onClick={() => setModal(true)} className="mt-4 btn-primary">
                  <FileUp size={14} />
                  Ingest First Resume
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-tx-primary mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => setModal(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-sf-secondary transition-colors text-left group"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100">
                  <FileUp size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-tx-primary">Ingest Resume</p>
                  <p className="text-xs text-tx-tertiary">Parse a new candidate</p>
                </div>
                <ArrowRight size={14} className="text-tx-muted group-hover:text-brand-600 transition-colors" />
              </button>

              <Link
                href="/jobs"
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-sf-secondary transition-colors text-left group"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-success-50 text-success-600 group-hover:bg-success-100">
                  <Plus size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-tx-primary">Create Job</p>
                  <p className="text-xs text-tx-tertiary">Post a new opening</p>
                </div>
                <ArrowRight size={14} className="text-tx-muted group-hover:text-success-600 transition-colors" />
              </Link>

              <Link
                href="/matching"
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-sf-secondary transition-colors text-left group"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-warning-50 text-warning-600 group-hover:bg-warning-100">
                  <Cpu size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-tx-primary">AI Match</p>
                  <p className="text-xs text-tx-tertiary">Evaluate candidates</p>
                </div>
                <ArrowRight size={14} className="text-tx-muted group-hover:text-warning-600 transition-colors" />
              </Link>
            </div>
          </div>

          {/* Top Skills */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-tx-primary">Top Skills</h2>
              <Award size={16} className="text-tx-muted" />
            </div>
            <div className="space-y-2">
              {(analytics?.top_candidate_skills || []).slice(0, 6).map((item) => (
                <div key={item.skill} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-sf-secondary transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    <span className="text-sm font-medium text-tx-primary">{item.skill}</span>
                  </div>
                  <span className="text-xs font-semibold text-tx-tertiary">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link
          href="/analytics"
          className="group card p-6 hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white">
              <TrendingUp size={20} />
            </div>
            <ArrowUpRight size={16} className="text-tx-muted group-hover:text-brand-600 transition-colors" />
          </div>
          <h3 className="text-sm font-semibold text-tx-primary">Analytics Dashboard</h3>
          <p className="mt-1 text-xs text-tx-tertiary leading-relaxed">
            Deep insights into your hiring funnel, candidate quality, and pipeline health.
          </p>
        </Link>

        <Link
          href="/matching"
          className="group card p-6 hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <Cpu size={20} />
            </div>
            <ArrowUpRight size={16} className="text-tx-muted group-hover:text-purple-600 transition-colors" />
          </div>
          <h3 className="text-sm font-semibold text-tx-primary">AI Fit Simulator</h3>
          <p className="mt-1 text-xs text-tx-tertiary leading-relaxed">
            Run instant multi-factor compatibility evaluation with skill gap analysis.
          </p>
        </Link>

        <Link
          href="/candidates"
          className="group card p-6 hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-success-500 to-success-600 text-white">
              <Users size={20} />
            </div>
            <ArrowUpRight size={16} className="text-tx-muted group-hover:text-success-600 transition-colors" />
          </div>
          <h3 className="text-sm font-semibold text-tx-primary">Talent Pool</h3>
          <p className="mt-1 text-xs text-tx-tertiary leading-relaxed">
            Search and filter your candidate database with skill-based queries.
          </p>
        </Link>
      </div>

      {/* Upload Modal */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <ResumeUploader
              onUploaded={(person) => setCandidates((items) => [person, ...items])}
              onClose={() => setModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
