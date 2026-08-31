"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Cpu,
  FileUp,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AnalyticsSummary, Application, Candidate } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import ResumeUploader from "@/components/ResumeUploader";
import { formatDate, initials } from "@/lib/utils";

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
      value: analytics?.total_candidates ?? 0,
      icon: Users,
      trend: "Total Verified Candidates",
      iconBg: "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      label: "Active Requisitions",
      value: analytics?.active_jobs ?? 0,
      icon: Briefcase,
      trend: "Live Open Positions",
      iconBg: "bg-sr-indigo-50 text-sr-indigo-700 border-indigo-100",
    },
    {
      label: "Pipeline Volume",
      value: analytics?.total_applications ?? 0,
      icon: TrendingUp,
      trend: "Processed Applications",
      iconBg: "bg-amber-50 text-amber-700 border-amber-100",
    },
    {
      label: "Mean Match Score",
      value: `${avgMatch}%`,
      icon: Sparkles,
      trend: "Groq Evaluated Fit",
      iconBg: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center pt-6 pb-4">
        {/* Category Badge */}
        <div className="flex flex-col items-center gap-1.5 w-fit">
          <div
            className="w-full h-px"
            style={{ background: "radial-gradient(circle, #6a88e2 0%, transparent 100%)" }}
          />
          <p className="px-6 font-matter text-sr-indigo-900 text-xs md:text-sm font-medium tracking-wide">
            India&apos;s Sovereign Talent Intelligence Platform
          </p>
          <div
            className="w-full h-px"
            style={{ background: "radial-gradient(circle, #6a88e2 0%, transparent 100%)" }}
          />
        </div>

        {/* Main Headline */}
        <h1 className="mt-4 font-matter text-3xl sm:text-5xl font-bold tracking-tight text-tx max-w-3xl leading-[1.15]">
          AI-Powered Talent Matching for High-Growth Teams
        </h1>

        <p className="mt-3 max-w-2xl text-sm sm:text-base text-tx-secondary leading-relaxed font-matter">
          Built on sovereign compute. Powered by frontier-class Groq Llama 3.3 models.
          Delivering precision candidate ranking and interview intelligence.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap justify-center items-center gap-3">
          <button className="btn-primary" onClick={() => setModal(true)}>
            <FileUp size={15} /> Ingest Resume
          </button>
          <Link className="btn-secondary" href="/jobs">
            <Plus size={15} /> Create Requisition
          </Link>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, trend, iconBg }) => (
          <div key={label} className="card p-5 group hover:border-sr-indigo-200">
            <div className="flex items-center justify-between">
              <span className={`grid h-9 w-9 place-items-center rounded-xl border ${iconBg}`}>
                <Icon size={17} />
              </span>
              <span className="text-[11px] text-tx-tertiary font-medium">{trend}</span>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-tx-secondary">
              {label}
            </p>
            <p className="mt-1 font-matter text-3xl font-bold text-tx">{value}</p>
          </div>
        ))}
      </div>

      {/* Feature Gateways */}
      <div className="grid gap-5 md:grid-cols-3">
        <Link
          href="/matching"
          className="card p-6 hover:border-sr-indigo-300 group transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sr-indigo-50 text-sr-indigo-900 border border-sr-indigo-100">
              <Cpu size={20} />
            </div>
            <ArrowUpRight size={16} className="text-tx-tertiary group-hover:text-sr-indigo-600 transition-colors" />
          </div>
          <h3 className="mt-4 font-matter font-semibold text-base text-tx">AI Fit Simulator</h3>
          <p className="mt-1 text-xs text-tx-secondary leading-relaxed">
            Run instant multi-factor compatibility evaluation and skill gap analysis against open jobs.
          </p>
        </Link>

        <Link
          href="/candidates"
          className="card p-6 hover:border-sr-indigo-300 group transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
              <Users size={20} />
            </div>
            <ArrowUpRight size={16} className="text-tx-tertiary group-hover:text-blue-600 transition-colors" />
          </div>
          <h3 className="mt-4 font-matter font-semibold text-base text-tx">Talent Pool Directory</h3>
          <p className="mt-1 text-xs text-tx-secondary leading-relaxed">
            Search candidates by verified technical skills, career timeline, and generated dossier.
          </p>
        </Link>

        <Link
          href="/jobs"
          className="card p-6 hover:border-sr-indigo-300 group transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-100">
              <Briefcase size={20} />
            </div>
            <ArrowUpRight size={16} className="text-tx-tertiary group-hover:text-amber-600 transition-colors" />
          </div>
          <h3 className="mt-4 font-matter font-semibold text-base text-tx">Active Requisitions</h3>
          <p className="mt-1 text-xs text-tx-secondary leading-relaxed">
            Manage applicant pipelines, side-by-side matrices, and interview scorecards.
          </p>
        </Link>
      </div>

      {/* Recent Applications Pipeline */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-st px-6 py-4">
          <div>
            <div className="eyebrow text-sr-indigo-900">
              <TrendingUp size={13} className="text-sr-indigo-600" /> Pipeline Ingestion
            </div>
            <h2 className="mt-0.5 font-matter text-base font-semibold text-tx">
              Recent Candidate Applications
            </h2>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-xs font-semibold text-sr-indigo-600 hover:underline"
          >
            All Requisitions <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-st bg-sf-secondary font-medium uppercase tracking-wider text-tx-secondary">
              <tr>
                <th className="px-6 py-3">Candidate</th>
                <th className="px-6 py-3">Headline</th>
                <th className="px-6 py-3">Applied</th>
                <th className="px-6 py-3">AI Fit</th>
                <th className="px-6 py-3">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-st">
              {applications.map((app) => (
                <tr key={app.id} className="transition-colors hover:bg-sf-secondary/50">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sr-indigo-50 font-semibold text-sr-indigo-700 border border-sr-indigo-100">
                        {initials(
                          app.name.split(" ")[0],
                          app.name.split(" ").slice(1).join(" ")
                        )}
                      </div>
                      <span className="font-semibold text-tx">{app.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-tx-secondary max-w-xs truncate">
                    {app.headline || "Candidate"}
                  </td>
                  <td className="px-6 py-3.5 text-tx-tertiary">
                    {formatDate(app.applied_at)}
                  </td>
                  <td className="px-6 py-3.5 font-medium">
                    {app.ai_match_score ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <Sparkles size={12} className="text-emerald-500" />
                        {Math.round(app.ai_match_score)}%
                      </span>
                    ) : (
                      <span className="text-tx-tertiary">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={app.status} />
                  </td>
                </tr>
              ))}
              {!applications.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-tx-tertiary">
                    No recent applications recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-tx/40 p-4 backdrop-blur-sm">
          <ResumeUploader
            onUploaded={(person) => setCandidates((items) => [person, ...items])}
            onClose={() => setModal(false)}
          />
        </div>
      )}
    </div>
  );
}
