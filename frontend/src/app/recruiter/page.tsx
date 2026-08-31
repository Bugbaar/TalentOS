"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Chip, Nav } from "@/components/ui";
import { api } from "@/lib/api";

type Overview = {
  open_jobs: number;
  total_jobs: number;
  total_applications: number;
  average_match_score: number;
  strong_matches: number;
  pipeline: Record<string, number>;
  jobs: { id: number; title: string; status: string; applications: number }[];
};

export default function RecruiterHome() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Overview>("/api/analytics/overview")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-cyan-300">Recruiter workspace</p>
            <h1 className="mt-1 text-3xl font-semibold">Hiring pulse</h1>
          </div>
          <Link href="/recruiter/jobs/new" className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950">
            Post a role
          </Link>
        </div>
        {error && <p className="mt-6 text-rose-300">{error}</p>}
        {data && (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Open roles", data.open_jobs],
                ["Applications", data.total_applications],
                ["Avg match", data.average_match_score],
                ["Strong matches", data.strong_matches],
              ].map(([label, value]) => (
                <article key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-2 text-3xl font-semibold">{value}</p>
                </article>
              ))}
            </section>
            <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="font-medium">Pipeline</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {Object.entries(data.pipeline).map(([status, count]) => (
                  <Chip key={status}>
                    {status}: {count}
                  </Chip>
                ))}
                {Object.keys(data.pipeline).length === 0 && <p className="text-sm text-slate-400">No applications yet.</p>}
              </div>
            </section>
            <section className="mt-8">
              <h2 className="font-medium">Roles</h2>
              <div className="mt-4 grid gap-3">
                {data.jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/recruiter/jobs/${job.id}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 hover:bg-white/8"
                  >
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-slate-400">{job.applications} applications</p>
                    </div>
                    <Chip>{job.status}</Chip>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
