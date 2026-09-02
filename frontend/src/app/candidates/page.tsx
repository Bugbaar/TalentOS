"use client";

import Link from "next/link";
import { Download, Filter, MapPin, Search, Sparkles, Upload, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Candidate } from "@/types";
import ResumeUploader from "@/components/ResumeUploader";
import { initials } from "@/lib/utils";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("");
  const [modal, setModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.candidates()
      .then(setCandidates)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load candidates"));
  }, []);

  const allSkills = Array.from(new Set(candidates.flatMap((c) => c.skills))).sort();

  const visible = useMemo(
    () =>
      candidates.filter((candidate) => {
        const textMatch = `${candidate.first_name} ${candidate.last_name} ${candidate.email} ${candidate.headline ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const skillMatch = !skill || candidate.skills.includes(skill);
        return textMatch && skillMatch;
      }),
    [candidates, query, skill]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="eyebrow text-sr-indigo-900">
            <Users size={13} className="text-sr-indigo-600" /> Sourced Intelligence
          </div>
          <h1 className="mt-1 font-matter text-3xl font-bold tracking-tight text-tx">
            Talent Pool Directory
          </h1>
          <p className="mt-1 text-xs text-tx-secondary">
            Explore verified candidate profiles, AI-extracted skill matrices, and resumes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <a
            className="btn-secondary text-xs"
            href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/candidates/export/csv`}
          >
            <Download size={14} /> Export CSV
          </a>
          <button className="btn-primary text-xs" onClick={() => setModal(true)}>
            <Upload size={14} /> Ingest Resume
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="card flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 text-tx-muted" size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="field pl-9 text-xs"
            placeholder="Search candidates by name, email, headline, or keywords..."
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-tx-tertiary" />
          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="field text-xs md:w-56"
          >
            <option value="">All Skills ({allSkills.length})</option>
            {allSkills.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidate Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((candidate) => (
          <Link
            href={`/candidates/${candidate.id}`}
            key={candidate.id}
            className="card p-5 group hover:border-sr-indigo-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sr-indigo-50 font-matter text-xs font-bold text-sr-indigo-700 border border-sr-indigo-100 shadow-sm">
                  {initials(candidate.first_name, candidate.last_name)}
                </div>
                <div>
                  <h2 className="font-matter text-sm font-semibold text-tx group-hover:text-sr-indigo-600 transition-colors">
                    {candidate.first_name} {candidate.last_name}
                  </h2>
                  <p className="flex items-center gap-1 text-[11px] text-tx-tertiary">
                    <MapPin size={11} /> {candidate.location || "Remote / Unspecified"}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-sf-secondary border border-st px-2.5 py-0.5 text-[10px] font-mono font-medium text-tx-secondary">
                {candidate.experience_years}y exp
              </span>
            </div>

            <p className="mt-3.5 line-clamp-2 text-xs leading-relaxed text-tx-secondary">
              {candidate.headline || candidate.bio || "Candidate profile in pipeline."}
            </p>

            <div className="mt-4 flex flex-wrap gap-1 border-t border-st-secondary pt-3">
              {candidate.skills.slice(0, 5).map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-sf-secondary border border-st px-2 py-0.5 text-[10px] font-medium text-tx-secondary"
                >
                  {s}
                </span>
              ))}
              {candidate.skills.length > 5 && (
                <span className="rounded-full bg-sf-secondary px-1.5 py-0.5 text-[10px] text-tx-tertiary font-mono">
                  +{candidate.skills.length - 5}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {!visible.length && (
        <div className="card p-14 text-center">
          <p className="font-matter text-base font-semibold text-tx">No candidates found</p>
          <p className="mt-1 text-xs text-tx-secondary">Try adjusting your search query or skill filter.</p>
        </div>
      )}

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
