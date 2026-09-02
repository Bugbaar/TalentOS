"use client";

import { useEffect, useState } from "react";
import {
  Cpu,
  FileText,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Award,
  TrendingUp,
  AlertCircle,
  Settings2,
  Target,
  Brain,
  BarChart3,
  Sliders,
} from "lucide-react";
import InterviewKitModal from "@/components/InterviewKitModal";
import MatchScoreCard from "@/components/MatchScoreCard";
import { api } from "@/lib/api";
import type {
  Candidate,
  InterviewKit,
  JobOpening,
  MatchResult,
} from "@/types";
import { cn, getScoreColor, getScoreBarColor } from "@/lib/utils";

interface AdvancedMatch {
  overall_score: number;
  confidence: number;
  success_probability: number;
  skill_score: number;
  experience_score: number;
  semantic_score: number;
  education_score: number;
  cultural_score: number;
  matched_skills: string[];
  missing_skills: string[];
  weak_skills: string[];
  strong_skills: string[];
  matched_required: string[];
  matched_nice_to_have: string[];
  total_required: number;
  total_nice_to_have: number;
  experience_gap: number;
  ai_critique: string;
  strengths: string[];
  concerns: string[];
  recommendation: string;
  salary_fit: number | null;
  weights_used: Record<string, number>;
}

export default function MatchingPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [candidateId, setCandidateId] = useState("");
  const [jobId, setJobId] = useState("");
  const [match, setMatch] = useState<AdvancedMatch | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [kit, setKit] = useState<InterviewKit | null>(null);
  const [kitLoading, setKitLoading] = useState(false);
  const [error, setError] = useState("");
  const [showWeights, setShowWeights] = useState(false);
  const [useAdvanced, setUseAdvanced] = useState(true);
  const [weights, setWeights] = useState({
    skill: 0.40,
    experience: 0.25,
    semantic: 0.20,
    education: 0.10,
    cultural: 0.05,
  });

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
      if (useAdvanced) {
        const result = await api.evaluateAdvanced(candidateId, jobId, weights);
        setMatch(result as AdvancedMatch);
      } else {
        const result = await api.evaluate(candidateId, jobId);
        setMatch({
          ...result,
          confidence: 0.85,
          success_probability: result.overall_score,
          education_score: 75,
          cultural_score: 75,
          weak_skills: [],
          strong_skills: [],
          matched_required: result.matched_skills,
          matched_nice_to_have: [],
          total_required: result.matched_skills.length + result.missing_skills.length,
          total_nice_to_have: 0,
          experience_gap: 0,
          strengths: [],
          concerns: [],
          recommendation:
            result.overall_score >= 80
              ? "STRONG_MATCH"
              : result.overall_score >= 60
              ? "GOOD_MATCH"
              : "MODERATE_MATCH",
          salary_fit: null,
          weights_used: { skill: 0.5, experience: 0.3, semantic: 0.2 },
        });
      }
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

  const updateWeight = (key: string, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value / 100 }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="eyebrow">
            <Brain size={12} />
            AI Intelligence
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-tx-primary tracking-tight">
            AI Fit & Skill Gap Engine
          </h1>
          <p className="mt-1 text-sm text-tx-tertiary max-w-2xl">
            Multi-factor compatibility evaluation with semantic analysis, success prediction, and bias detection.
          </p>
        </div>
        <div className="flex items-center gap-2 p-1 rounded-xl bg-sf-secondary border border-sf-tertiary">
          <button
            onClick={() => setUseAdvanced(false)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
              !useAdvanced ? "bg-white text-tx-primary shadow-sm" : "text-tx-tertiary"
            )}
          >
            Basic
          </button>
          <button
            onClick={() => setUseAdvanced(true)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5",
              useAdvanced ? "bg-white text-brand-700 shadow-sm" : "text-tx-tertiary"
            )}
          >
            <Sparkles size={12} />
            Advanced
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">
          {error}
        </div>
      )}

      {/* Simulator Workspace Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        {/* Left: Input Selection Card */}
        <div className="space-y-6">
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-tx-primary">Simulation Parameters</h2>
                <p className="text-xs text-tx-tertiary">Configure matching evaluation</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-tx-tertiary">
                  Candidate Profile
                </label>
                <select
                  className="select-field mt-1.5"
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
                  <div className="mt-2 p-3 rounded-lg bg-sf-secondary">
                    <p className="text-xs font-medium text-tx-primary truncate">
                      {selectedCandidate.headline || "Candidate"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {selectedCandidate.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white text-tx-secondary border border-sf-tertiary"
                        >
                          {skill}
                        </span>
                      ))}
                      {selectedCandidate.skills.length > 4 && (
                        <span className="text-[10px] text-tx-tertiary">
                          +{selectedCandidate.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-tx-tertiary">
                  Target Requisition
                </label>
                <select
                  className="select-field mt-1.5"
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
                  <div className="mt-2 p-3 rounded-lg bg-sf-secondary">
                    <p className="text-xs font-medium text-tx-primary">
                      {selectedJob.department} · {selectedJob.location}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {selectedJob.required_skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Weights Configuration */}
            {useAdvanced && (
              <div className="pt-4 border-t border-sf-tertiary">
                <button
                  onClick={() => setShowWeights(!showWeights)}
                  className="flex items-center justify-between w-full text-sm font-medium text-tx-primary"
                >
                  <span className="flex items-center gap-2">
                    <Sliders size={14} />
                    Scoring Weights
                  </span>
                  <span className="text-xs text-tx-tertiary">{showWeights ? "Hide" : "Customize"}</span>
                </button>
                {showWeights && (
                  <div className="mt-3 space-y-3">
                    {Object.entries(weights).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-tx-secondary capitalize">{key}</span>
                          <span className="font-mono text-tx-primary">{Math.round(value * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={value * 100}
                          onChange={(e) => updateWeight(key, parseInt(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none bg-sf-tertiary cursor-pointer accent-brand-600"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2.5 pt-2 border-t border-sf-tertiary">
              <button
                className="btn-primary w-full"
                disabled={!candidateId || !jobId || loadingMatch}
                onClick={() => void evaluate()}
              >
                <Zap size={16} />
                {loadingMatch ? "Analyzing with AI..." : useAdvanced ? "Run Advanced Analysis" : "Run Quick Match"}
              </button>

              {match && (
                <button
                  className="btn-secondary w-full"
                  disabled={kitLoading}
                  onClick={() => void generateKit()}
                >
                  <FileText size={16} className="text-brand-600" />
                  {kitLoading ? "Synthesizing..." : "Generate Interview Kit"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Results Display */}
        <div>
          {match ? (
            <div className="space-y-5">
              {/* Score Card */}
              <div className="card p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="eyebrow">
                      <Sparkles size={12} />
                      Match Score
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-tx-primary">
                      Overall Compatibility
                    </h3>
                  </div>
                  <RecommendationBadge recommendation={match.recommendation} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ScoreCircle
                    label="Overall"
                    value={match.overall_score}
                    color="brand"
                    large
                  />
                  <ScoreCircle
                    label="Success"
                    value={match.success_probability}
                    color="success"
                    subtitle="Predicted"
                  />
                </div>

                {/* Component Scores */}
                <div className="mt-6 space-y-3">
                  <ScoreBar label="Skills" value={match.skill_score} />
                  <ScoreBar label="Experience" value={match.experience_score} />
                  <ScoreBar label="Semantic" value={match.semantic_score} />
                  <ScoreBar label="Education" value={match.education_score} />
                  <ScoreBar label="Cultural" value={match.cultural_score} />
                </div>
              </div>

              {/* AI Critique */}
              <div className="card p-6 border-brand-200 bg-gradient-to-br from-brand-50/30 to-purple-50/20">
                <div className="eyebrow">
                  <Brain size={12} />
                  AI Analysis
                </div>
                <p className="mt-2 text-sm leading-relaxed text-tx-primary">
                  {match.ai_critique}
                </p>
              </div>

              {/* Strengths & Concerns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {match.strengths.length > 0 && (
                  <div className="card p-5 border-success-100 bg-success-50/30">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 size={16} className="text-success-600" />
                      <h4 className="text-sm font-semibold text-success-700">Key Strengths</h4>
                    </div>
                    <ul className="space-y-1.5">
                      {match.strengths.map((strength, i) => (
                        <li key={i} className="text-xs text-tx-primary flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-success-500 mt-1.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {match.concerns.length > 0 && (
                  <div className="card p-5 border-warning-100 bg-warning-50/30">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle size={16} className="text-warning-600" />
                      <h4 className="text-sm font-semibold text-warning-700">Areas of Concern</h4>
                    </div>
                    <ul className="space-y-1.5">
                      {match.concerns.map((concern, i) => (
                        <li key={i} className="text-xs text-tx-primary flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-warning-500 mt-1.5 flex-shrink-0" />
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Skills Breakdown */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-tx-primary">Skill Coverage</h4>
                  <div className="text-xs text-tx-tertiary">
                    {match.matched_required.length}/{match.total_required} required
                    {match.total_nice_to_have > 0 && ` · ${match.matched_nice_to_have.length}/${match.total_nice_to_have} nice-to-have`}
                  </div>
                </div>

                {/* Matched Required */}
                {match.matched_required.length > 0 && (
                  <div className="mb-4">
                    <p className="eyebrow text-success-700 mb-2">
                      <CheckCircle2 size={11} /> Matched Required ({match.matched_required.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.matched_required.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 rounded-full border border-success-200 bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700"
                        >
                          <CheckCircle2 size={10} /> {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matched Nice-to-have */}
                {match.matched_nice_to_have.length > 0 && (
                  <div className="mb-4">
                    <p className="eyebrow text-brand-700 mb-2">
                      <Sparkles size={11} /> Bonus Skills ({match.matched_nice_to_have.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.matched_nice_to_have.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                        >
                          <Sparkles size={10} /> {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {match.missing_skills.length > 0 && (
                  <div>
                    <p className="eyebrow text-danger-700 mb-2">
                      <XCircle size={11} /> Skill Gaps ({match.missing_skills.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.missing_skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 rounded-full border border-danger-200 bg-danger-50 px-2.5 py-1 text-xs font-medium text-danger-700"
                        >
                          <XCircle size={10} /> {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card flex min-h-[500px] flex-col items-center justify-center p-8 text-center border-dashed border-sf-tertiary">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4">
                <Cpu size={28} />
              </div>
              <h3 className="text-base font-semibold text-tx-primary">No Evaluation Active</h3>
              <p className="mt-1 max-w-xs text-sm text-tx-tertiary">
                Select a candidate and target requisition from the left panel, then run the AI evaluation.
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

function ScoreCircle({
  label,
  value,
  color,
  subtitle,
  large = false,
}: {
  label: string;
  value: number;
  color: "brand" | "success";
  subtitle?: string;
  large?: boolean;
}) {
  const score = Math.round(value);
  const size = large ? 120 : 100;
  const strokeWidth = large ? 10 : 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colorClass = color === "brand" ? "text-brand-600" : "text-success-600";
  const strokeClass = color === "brand" ? "stroke-brand-500" : "stroke-success-500";

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-sf-secondary">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeLinecap="round"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${strokeClass} transition-all duration-1000`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold text-tx-primary", large ? "text-2xl" : "text-xl")}>
            {score}
            <span className="text-xs text-tx-tertiary">%</span>
          </span>
          <span className="text-[10px] text-tx-tertiary mt-0.5">{label}</span>
          {subtitle && <span className={cn("text-[9px] font-medium mt-0.5", colorClass)}>{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const score = Math.round(value);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-medium text-tx-secondary">{label}</span>
        <span className="font-mono font-semibold text-tx-primary">{score}%</span>
      </div>
      <div className="progress-bar">
        <div
          className={cn("progress-bar-fill", getScoreBarColor(score))}
          style={{ width: `${Math.max(2, score)}%` }}
        />
      </div>
    </div>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const config: Record<string, { label: string; color: string }> = {
    STRONG_MATCH: { label: "Strong Match", color: "bg-success-50 text-success-700 border-success-200" },
    GOOD_MATCH: { label: "Good Match", color: "bg-brand-50 text-brand-700 border-brand-200" },
    MODERATE_MATCH: { label: "Moderate", color: "bg-warning-50 text-warning-700 border-warning-200" },
    WEAK_MATCH: { label: "Weak Match", color: "bg-orange-50 text-orange-700 border-orange-200" },
    POOR_MATCH: { label: "Poor Match", color: "bg-danger-50 text-danger-700 border-danger-200" },
  };
  const item = config[recommendation] || config.MODERATE_MATCH;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border", item.color)}>
      <Award size={12} />
      {item.label}
    </span>
  );
}
