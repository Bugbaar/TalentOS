import type { MatchResult } from "@/types";
import { cn } from "@/lib/utils";
import { Check, Sparkles, X } from "lucide-react";

export default function MatchScoreCard({ match }: { match: MatchResult }) {
  const score = Math.round(match.overall_score);
  const isHigh = score >= 80;
  const isMedium = score >= 60 && score < 80;

  const scoreBadgeBg = isHigh
    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
    : isMedium
    ? "bg-indigo-50 text-sr-indigo-900 border-indigo-200"
    : "bg-rose-50 text-rose-800 border-rose-200";

  const barColor = isHigh
    ? "bg-emerald-500"
    : isMedium
    ? "bg-sr-indigo-600"
    : "bg-rose-500";

  const bars = [
    { label: "Skills Coverage (50%)", value: match.skill_score },
    { label: "Experience Match (30%)", value: match.experience_score },
    { label: "Semantic Alignment (20%)", value: match.semantic_score },
  ] as const;

  return (
    <div className="card p-6">
      {/* Header with Score */}
      <div className="flex items-center gap-5">
        <div className={cn("flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border shadow-sm", scoreBadgeBg)}>
          <span className="font-matter text-2xl font-bold">{score}%</span>
          <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">Match</span>
        </div>

        <div>
          <div className="eyebrow text-sr-indigo-900">
            <Sparkles size={13} className="text-sr-indigo-600" /> Evaluation Verdict
          </div>
          <h3 className="mt-1 font-matter text-lg font-semibold text-tx">
            {isHigh ? "Strong Fit Candidate" : isMedium ? "Qualified Alignment" : "Partial Fit Profile"}
          </h3>
          <p className="mt-0.5 text-xs text-tx-secondary">
            Synthesized across skill taxonomy, seniority, and resume embeddings.
          </p>
        </div>
      </div>

      {/* Progress Breakdown */}
      <div className="mt-6 space-y-3 rounded-xl border border-st bg-sf-secondary/60 p-4">
        {bars.map(({ label, value }) => (
          <div key={label}>
            <div className="mb-1.5 flex justify-between text-xs font-medium text-tx-secondary">
              <span>{label}</span>
              <span className="font-mono text-tx font-semibold">{Math.round(value)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className={cn("h-full rounded-full transition-all duration-500", barColor)}
                style={{ width: `${Math.max(4, value)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Matched & Missing Skills */}
      <div className="mt-6 space-y-4">
        <div>
          <p className="eyebrow text-emerald-800">
            <Check size={13} /> Matched Skills ({match.matched_skills.length})
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {match.matched_skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
              >
                <Check size={11} /> {skill}
              </span>
            ))}
            {!match.matched_skills.length && (
              <span className="text-xs text-tx-tertiary">No exact requirements matched</span>
            )}
          </div>
        </div>

        <div>
          <p className="eyebrow text-rose-800">
            <X size={13} /> Skill Gaps ({match.missing_skills.length})
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {match.missing_skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-800"
              >
                <X size={11} /> {skill}
              </span>
            ))}
            {!match.missing_skills.length && (
              <span className="text-xs font-medium text-emerald-700">100% skill coverage!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
