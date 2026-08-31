"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Chip, Nav, ScoreBadge } from "@/components/ui";
import { api } from "@/lib/api";

type Job = {
  id: number;
  title: string;
  location: string;
  seniority: string;
  description: string;
  required_skills: string[];
  optional_skills: string[];
  min_years_experience: number;
  status: string;
};

type Ranked = {
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  headline: string | null;
  years_experience: number;
  skills: string[];
  status: string;
  match_score: number;
  match_breakdown: {
    band: string;
    missing_required: string[];
    matched_required: string[];
    reasons: string[];
  };
};

const STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"];

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [ranked, setRanked] = useState<Ranked[]>([]);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    const [jobData, rankData] = await Promise.all([
      api<Job>(`/api/jobs/${params.id}`),
      api<Ranked[]>(`/api/applications/job/${params.id}`),
    ]);
    setJob(jobData);
    setRanked(rankData);
  }, [params.id]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  async function move(applicationId: number, status: string) {
    setError("");
    try {
      await api(`/api/applications/${applicationId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason: reason || null }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-10">
        {job && (
          <>
            <p className="text-sm text-cyan-300">{job.status} · {job.location} · {job.seniority}</p>
            <h1 className="mt-1 text-3xl font-semibold">{job.title}</h1>
            <p className="mt-4 max-w-3xl text-slate-300">{job.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {job.required_skills.map((skill) => (
                <Chip key={skill}>{skill}</Chip>
              ))}
            </div>
          </>
        )}
        <label className="mt-8 block text-sm text-slate-400">
          Rejection / transition note (required for reject)
          <input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-100" />
        </label>
        {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        <section className="mt-8 grid gap-4">
          {ranked.map((person) => (
            <article key={person.application_id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium">{person.candidate_name}</h2>
                  <p className="text-sm text-slate-400">{person.headline} · {person.years_experience}y · {person.match_breakdown.band}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {person.skills.slice(0, 8).map((skill) => (
                      <Chip key={skill}>{skill}</Chip>
                    ))}
                  </div>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
                    {person.match_breakdown.reasons.slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <ScoreBadge score={person.match_score} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {STAGES.filter((stage) => stage !== person.status).map((stage) => (
                  <button
                    key={stage}
                    onClick={() => move(person.application_id, stage)}
                    className="rounded-full border border-white/15 px-3 py-1 text-xs capitalize hover:bg-white/10"
                  >
                    {stage}
                  </button>
                ))}
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize">now: {person.status}</span>
              </div>
            </article>
          ))}
          {ranked.length === 0 && <p className="text-slate-400">No applicants yet.</p>}
        </section>
      </main>
    </>
  );
}
