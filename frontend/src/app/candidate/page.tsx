"use client";

import { useEffect, useState } from "react";
import { Chip, Nav, ScoreBadge } from "@/components/ui";
import { api } from "@/lib/api";

type Job = {
  id: number;
  title: string;
  location: string;
  seniority: string;
  description: string;
  required_skills: string[];
};

type Rec = {
  job_id: number;
  title: string;
  location: string;
  match_score: number;
  match_breakdown: { missing_required: string[]; reasons: string[] };
};

type AppRow = { id: number; job_id: number; job_title: string; status: string; match_score: number };

export default function CandidateHome() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [error, setError] = useState("");
  const applied = new Set(apps.map((a) => a.job_id));

  async function load() {
    const [jobData, recData, appData] = await Promise.all([
      api<Job[]>("/api/jobs"),
      api<Rec[]>("/api/matching/recommendations"),
      api<AppRow[]>("/api/applications/me"),
    ]);
    setJobs(jobData);
    setRecs(recData);
    setApps(appData);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function apply(jobId: number) {
    setError("");
    try {
      await api("/api/applications", {
        method: "POST",
        body: JSON.stringify({ job_id: jobId, cover_note: "Applying through TalentOS." }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apply failed");
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Roles for you</h1>
        <p className="mt-2 text-slate-400">Recommendations use the same explainable engine recruiters see.</p>
        {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        <section className="mt-8">
          <h2 className="font-medium">Your applications</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {apps.map((app) => (
              <Chip key={app.id}>
                {app.job_title}: {app.status} ({app.match_score})
              </Chip>
            ))}
            {apps.length === 0 && <p className="text-sm text-slate-400">None yet — parse your resume, then apply.</p>}
          </div>
        </section>
        <section className="mt-10 grid gap-4">
          {(recs.length ? recs : jobs.map((job) => ({
            job_id: job.id,
            title: job.title,
            location: job.location,
            match_score: 0,
            match_breakdown: { missing_required: [], reasons: [] },
          }))).map((item) => {
            const job = jobs.find((j) => j.id === item.job_id);
            return (
              <article key={item.job_id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="max-w-2xl">
                  <h2 className="text-lg font-medium">{item.title}</h2>
                  <p className="text-sm text-slate-400">{item.location} {job?.seniority ? `· ${job.seniority}` : ""}</p>
                  <p className="mt-2 text-sm text-slate-300">{job?.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job?.required_skills.map((skill) => <Chip key={skill}>{skill}</Chip>)}
                  </div>
                  {item.match_breakdown.missing_required?.length > 0 && (
                    <p className="mt-3 text-sm text-amber-200">Skill gaps: {item.match_breakdown.missing_required.join(", ")}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3">
                  {item.match_score > 0 && <ScoreBadge score={item.match_score} />}
                  {applied.has(item.job_id) ? (
                    <span className="text-sm text-slate-400">Applied</span>
                  ) : (
                    <button onClick={() => apply(item.job_id)} className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950">
                      Apply
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </>
  );
}
