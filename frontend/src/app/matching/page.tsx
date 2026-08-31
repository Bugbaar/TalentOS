"use client";

import { useEffect, useState } from "react";
import { Cpu, FileText, Sparkles, Zap } from "lucide-react";
import InterviewKitModal from "@/components/InterviewKitModal";
import MatchScoreCard from "@/components/MatchScoreCard";
import { api } from "@/lib/api";
import type { Candidate, InterviewKit, JobOpening, MatchResult } from "@/types";

export default function MatchingPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [candidateId, setCandidateId] = useState("");
  const [jobId, setJobId] = useState("");
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [kit, setKit] = useState<InterviewKit | null>(null);
  const [kitLoading, setKitLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.candidates(), api.jobs()])
      .then(([people, roles]) => {
        setCandidates(people);
        setJobs(roles);
        if (people.length) setCandidateId(people[0].id);
        if (roles.length) setJobId(roles[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load matching data"));
  }, []);

  async function evaluate() {
    if (!candidateId || !jobId) return;
    setLoadingMatch(true);
    setError("");
    try {
      setMatch(await api.evaluate(candidateId, jobId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setLoadingMatch(false);
    }
  }

  async function generateKit() {
    if (!candidateId || !jobId) return;
    setKit(null);
    setKitLoading(true);
    setError("");
    try {
      setKit(await api.interviewKit(candidateId, jobId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Interview kit generation failed");
    } finally {
      setKitLoading(false);
    }
  }

  const selectedCandidate = candidates.find((c) => c.id === candidateId);
  const selectedJob = jobs.find((j) => j.id === jobId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="eyebrow text-sr-indigo-900">
          <Cpu size={13} className="text-sr-indigo-600" /> Algorithmic Evaluation
        </div>
        <h1 className="mt-1 font-matter text-3xl font-bold tracking-tight text-tx">
          AI Fit & Skill Gap Engine
        </h1>
        <p className="mt-1 text-xs text-tx-secondary">
          Simulate candidate compatibility against any open requisition using Groq hybrid scoring (Skills 50% + Experience 30% + Semantic 20%).
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Simulator Workspace Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Left: Input Selection Card */}
        <div className="card p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sr-indigo-50 text-sr-indigo-700 border border-sr-indigo-100 shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="font-matter text-sm font-semibold text-tx">Simulation Parameters</h2>
              <p className="text-xs text-tx-secondary">Select candidate and target job opening</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-tx-secondary">
                1. Candidate Profile
              </label>
              <select
                className="field mt-1.5 text-xs"
                value={candidateId}
                onChange={(e) => {
                  setCandidateId(e.target.value);
                  setMatch(null);
                }}
              >
                <option value="">Choose candidate...</option>
                {candidates.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.first_name} {c.last_name} ({c.experience_years}y exp)
                  </option>
                ))}
              </select>
              {selectedCandidate && (
                <p className="mt-1 text-[11px] text-sr-indigo-700 font-medium truncate">
                  {selectedCandidate.headline || "Candidate"} · {selectedCandidate.skills.length} skills listed
                </p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-tx-secondary">
                2. Target Requisition
              </label>
              <select
                className="field mt-1.5 text-xs"
                value={jobId}
                onChange={(e) => {
                  setJobId(e.target.value);
                  setMatch(null);
                }}
              >
                <option value="">Choose opening...</option>
                {jobs.map((j) => (
                  <option value={j.id} key={j.id}>
                    {j.title} ({j.department})
                  </option>
                ))}
              </select>
              {selectedJob && (
                <p className="mt-1 text-[11px] text-tx-secondary truncate">
                  {selectedJob.department} · Req: {selectedJob.required_skills.join(", ")}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-st">
            <button
              className="btn-primary w-full text-xs"
              disabled={!candidateId || !jobId || loadingMatch}
              onClick={() => void evaluate()}
            >
              <Zap size={14} />
              {loadingMatch ? "Evaluating with Llama 3.3..." : "Evaluate AI Fit Score"}
            </button>

            {match && (
              <button
                className="btn-secondary w-full text-xs"
                disabled={kitLoading}
                onClick={() => void generateKit()}
              >
                <FileText size={14} className="text-sr-indigo-600" />
                {kitLoading ? "Synthesizing Rubric..." : "Generate AI Interview Kit"}
              </button>
            )}
          </div>
        </div>

        {/* Right: Results Display */}
        <div>
          {match ? (
            <div className="space-y-5">
              <MatchScoreCard match={match} />

              {/* AI Critique Card */}
              <div className="card p-6 border-sr-indigo-100 bg-sr-indigo-50/40">
                <div className="eyebrow text-sr-indigo-900">
                  <Sparkles size={12} className="text-sr-indigo-600" /> Executive AI Critique
                </div>
                <p className="mt-2 text-xs leading-relaxed text-tx">
                  {match.ai_critique}
                </p>
              </div>
            </div>
          ) : (
            <div className="card flex min-h-[420px] flex-col items-center justify-center p-8 text-center border-dashed border-st">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sf-secondary border border-st text-tx-tertiary">
                <Cpu size={24} />
              </div>
              <h3 className="mt-3 font-matter text-sm font-semibold text-tx">No Evaluation Active</h3>
              <p className="mt-1 max-w-xs text-xs text-tx-secondary">
                Select a candidate and target requisition from the left panel, then run the evaluation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Interview Kit Modal */}
      {(kitLoading || kit) && (
        <InterviewKitModal
          kit={kit}
          loading={kitLoading}
          error={error}
          onClose={() => {
            setKit(null);
            setError("");
          }}
        />
      )}
    </div>
  );
}
