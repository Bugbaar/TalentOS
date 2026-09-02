"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Check,
  DollarSign,
  Download,
  Kanban,
  MapPin,
  Scale,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import type { ApplicantSummary, CompareCandidatesResponse, JobOpening, Scorecard } from "@/types";
import StatusBadge from "@/components/StatusBadge";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<JobOpening | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparison, setComparison] = useState<CompareCandidatesResponse | null>(null);
  const [review, setReview] = useState<ApplicantSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.job(id)
      .then(setJob)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load job"));
  }, [id]);

  const applicants = job?.applicants ?? [];

  function toggle(candidateId: string) {
    setSelected((items) =>
      items.includes(candidateId)
        ? items.filter((item) => item !== candidateId)
        : items.length < 5
        ? [...items, candidateId]
        : items
    );
  }

  async function compare() {
    if (selected.length < 2) return;
    setLoading(true);
    try {
      setComparison(await api.compare(id, selected));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  }

  if (error && !job) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
        {error}
      </div>
    );
  }

  if (!job) {
    return <div className="card h-96 animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-tx-secondary hover:text-sr-indigo-600 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Openings
      </Link>

      {/* Hero Job Requisition Header */}
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2.5">
              <StatusBadge status={job.status} />
              <span className="text-xs text-tx-tertiary font-mono">
                {job.workplace_type.toLowerCase()}
              </span>
            </div>

            <h1 className="mt-2 font-matter text-2xl sm:text-3xl font-bold text-tx">
              {job.title}
            </h1>

            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-tx-secondary">
              <span>{job.department}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-tx-tertiary" /> {job.location}
              </span>
              {job.salary_range && (
                <>
                  <span>·</span>
                  <span className="font-mono font-semibold text-emerald-800">{job.salary_range}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/jobs/${id}/pipeline`}
              className="btn-primary text-xs shrink-0"
            >
              <Kanban size={14} /> Pipeline Board
            </Link>
            <a
              className="btn-secondary text-xs shrink-0"
              href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/jobs/${id}/applicants/export/csv`}
            >
              <Download size={14} /> Export CSV
            </a>
          </div>
        </div>

        <p className="mt-4 max-w-4xl text-xs leading-relaxed text-tx-secondary">
          {job.description}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-st-secondary pt-4">
          <span className="mr-2 text-[10px] font-semibold uppercase text-tx-tertiary">Required Skills:</span>
          {job.required_skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-st bg-sf-secondary px-2.5 py-0.5 text-xs font-medium text-tx-secondary"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Applicant Selection & Compare Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="eyebrow text-sr-indigo-900">
            <Users size={13} className="text-sr-indigo-600" /> Active Pipeline ({applicants.length})
          </div>
          <h2 className="mt-0.5 font-matter text-base font-semibold text-tx">
            Candidate Applications
          </h2>
        </div>

        <button
          className="btn-primary text-xs"
          disabled={loading || selected.length < 2}
          onClick={() => void compare()}
        >
          <Scale size={14} />
          {loading ? "Comparing with Llama 3.3..." : `Compare Selected (${selected.length})`}
        </button>
      </div>

      {/* Applicants Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {applicants.map((applicant) => {
          const isChecked = selected.includes(applicant.candidate_id);
          return (
            <div
              key={applicant.id}
              className={`card p-4 transition-all duration-200 ${
                isChecked
                  ? "border-sr-indigo-500 bg-sr-indigo-50/30 shadow-sm ring-1 ring-sr-indigo-500/20"
                  : "hover:border-slate-300"
              }`}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(applicant.candidate_id)}
                  className="mt-0.5 h-4 w-4 accent-indigo-600 rounded border-st"
                />
                <div className="flex-1">
                  <p className="font-matter text-sm font-semibold text-tx">
                    {applicant.candidate_name || "Candidate"}
                  </p>
                  <p className="mt-0.5 text-xs font-mono font-semibold text-emerald-800 flex items-center gap-1">
                    <Sparkles size={11} className="text-emerald-600" />
                    {applicant.ai_match_score ? `${Math.round(applicant.ai_match_score)}% Fit Score` : "Evaluating"}
                  </p>
                </div>
              </label>

              <div className="mt-3.5 flex items-center justify-between border-t border-st-secondary pt-3">
                <StatusBadge status={applicant.status} />
                <button
                  className="text-xs font-medium text-sr-indigo-700 hover:underline"
                  onClick={() => setReview(applicant)}
                >
                  Scorecard
                </button>
              </div>
            </div>
          );
        })}
        {!applicants.length && (
          <div className="card col-span-full p-10 text-center text-xs text-tx-tertiary">
            No applicants in this requisition yet.
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {comparison && (
        <ComparisonModal comparison={comparison} onClose={() => setComparison(null)} />
      )}

      {/* Scorecard Modal */}
      {review && (
        <ScorecardModal application={review} onClose={() => setReview(null)} />
      )}
    </div>
  );
}

function ComparisonModal({
  comparison,
  onClose,
}: {
  comparison: CompareCandidatesResponse;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-tx/40 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 max-w-4xl rounded-3xl border border-st bg-white p-6 sm:p-8 shadow-2xl">
        <div className="flex justify-between items-start">
          <div>
            <div className="eyebrow text-sr-indigo-900">
              <Scale size={13} className="text-sr-indigo-600" /> Groq Comparative Evaluation
            </div>
            <h2 className="mt-0.5 font-matter text-xl font-bold text-tx">
              {comparison.job_title}
            </h2>
          </div>
          <button className="rounded-full p-1.5 text-tx-tertiary hover:bg-sf-secondary hover:text-tx" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Executive Verdict */}
        <div className="mt-4 rounded-2xl border border-sr-indigo-100 bg-sr-indigo-50/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sr-indigo-900">Executive Verdict</p>
          <p className="mt-1 text-xs leading-relaxed text-tx">{comparison.executive_summary}</p>
        </div>

        {/* Comparison Cards */}
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {comparison.comparisons.map((item) => {
            const isWinner = item.candidate_id === comparison.recommended_candidate_id;
            return (
              <div
                key={item.candidate_id}
                className={`rounded-2xl border p-4 ${
                  isWinner
                    ? "border-emerald-300 bg-emerald-50/40 shadow-sm"
                    : "border-st bg-white"
                }`}
              >
                {isWinner && (
                  <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                    <Check size={11} /> Top AI Pick
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h3 className="font-matter text-sm font-semibold text-tx">{item.candidate_name}</h3>
                  <span className="font-mono text-sm font-bold text-sr-indigo-700">
                    {Math.round(item.fit_score)}%
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-tx-secondary">{item.verdict}</p>

                <div className="mt-3.5 space-y-2.5 border-t border-st-secondary pt-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">Key Strengths</p>
                    <ul className="mt-1 space-y-0.5 text-xs text-tx-secondary">
                      {item.key_strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <Check size={11} className="mt-0.5 shrink-0 text-emerald-600" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-800">Potential Gaps</p>
                    <ul className="mt-1 space-y-0.5 text-xs text-tx-secondary">
                      {item.potential_gaps.map((g, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScorecardModal({
  application,
  onClose,
}: {
  application: ApplicantSummary;
  onClose: () => void;
}) {
  const [cards, setCards] = useState<Scorecard[]>([]);
  const [form, setForm] = useState({
    interviewer_name: "",
    round_name: "Technical Round 1",
    rating: "5",
    recommendation: "YES",
    notes: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    api.scorecards(application.id)
      .then(setCards)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load scorecards"));
  }, [application.id]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const card = await api.createScorecard(application.id, {
        ...form,
        rating: Number(form.rating),
      });
      setCards((items) => [card, ...items]);
      setForm({ ...form, notes: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save scorecard");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-tx/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-st bg-white p-6 shadow-2xl">
        <button className="absolute right-5 top-5 rounded-full p-1 text-tx-tertiary hover:bg-sf-secondary hover:text-tx" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="eyebrow text-sr-indigo-900">
          <Star size={12} className="text-sr-indigo-600" /> Interview Scorecard
        </div>
        <h2 className="mt-0.5 font-matter text-lg font-semibold text-tx">
          {application.candidate_name || "Candidate"}
        </h2>

        {/* Existing scorecards */}
        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
          {cards.map((card) => (
            <div key={card.id} className="rounded-xl border border-st bg-sf-secondary/40 p-3 text-xs">
              <div className="flex justify-between font-medium text-tx">
                <span>{card.round_name} · {card.interviewer_name}</span>
                <span className="font-mono text-emerald-800 font-semibold">{card.rating}/5 · {card.recommendation}</span>
              </div>
              <p className="mt-1 text-tx-secondary">{card.notes}</p>
            </div>
          ))}
          {!cards.length && (
            <p className="text-xs text-tx-tertiary">No scorecards submitted yet.</p>
          )}
        </div>

        {/* Submit new scorecard */}
        <form onSubmit={submit} className="mt-4 space-y-3 border-t border-st pt-3">
          <div className="grid grid-cols-2 gap-2.5">
            <input
              required
              className="field text-xs"
              placeholder="Interviewer name"
              value={form.interviewer_name}
              onChange={(e) => setForm({ ...form, interviewer_name: e.target.value })}
            />
            <input
              required
              className="field text-xs"
              placeholder="Round name"
              value={form.round_name}
              onChange={(e) => setForm({ ...form, round_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-semibold uppercase text-tx-secondary">Rating (1-5)</label>
              <select
                className="field mt-1 text-xs"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    {v} Stars
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase text-tx-secondary">Verdict</label>
              <select
                className="field mt-1 text-xs"
                value={form.recommendation}
                onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
              >
                {["STRONG_YES", "YES", "NEUTRAL", "NO", "STRONG_NO"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            required
            className="field min-h-16 text-xs"
            placeholder="Feedback and interview impression notes..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary text-xs" onClick={onClose}>
              Done
            </button>
            <button className="btn-primary text-xs">Save Scorecard</button>
          </div>
        </form>
      </div>
    </div>
  );
}
