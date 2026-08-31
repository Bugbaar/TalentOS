"use client";

import { FormEvent, useEffect, useState } from "react";
import { Chip, Nav } from "@/components/ui";
import { api } from "@/lib/api";

type Profile = {
  headline: string | null;
  location: string | null;
  years_experience: number;
  education_level: string;
  seniority: string;
  skills: string[];
  summary: string | null;
};

type Parsed = Profile & { skills: string[]; years_experience: number; education_level: string };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resume, setResume] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api<Profile>("/api/candidates/me").then(setProfile).catch((err) => setError(err.message));
  }, []);

  async function parseResume(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const parsed = await api<Parsed>("/api/candidates/me/parse-resume", {
        method: "POST",
        body: JSON.stringify({ resume_text: resume }),
      });
      setProfile({ ...parsed, summary: parsed.summary || null, headline: parsed.headline, location: profile?.location || null });
      setMessage(`Extracted ${parsed.skills.length} skills · ${parsed.years_experience} years · ${parsed.education_level}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parse failed");
    }
  }

  async function upload(file: File) {
    const body = new FormData();
    body.append("file", file);
    try {
      const parsed = await api<Parsed>("/api/candidates/me/upload-resume", { method: "POST", body });
      setProfile({ ...parsed, summary: parsed.summary || null, headline: parsed.headline, location: profile?.location || null });
      setMessage(`Uploaded and parsed ${file.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Talent profile</h1>
        <p className="mt-2 text-slate-400">Paste a resume. Skills aliases like JS → JavaScript are normalized before matching.</p>
        {profile && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="font-medium">{profile.headline || "No headline yet"}</p>
            <p className="text-sm text-slate-400">
              {profile.years_experience}y · {profile.education_level} · {profile.seniority}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Chip key={skill}>{skill}</Chip>
              ))}
            </div>
          </section>
        )}
        <form onSubmit={parseResume} className="mt-8 space-y-4">
          <textarea value={resume} onChange={(e) => setResume(e.target.value)} rows={12} placeholder="Paste resume text" className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3" />
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950">Parse resume</button>
            <label className="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm">
              Upload PDF / TXT
              <input type="file" accept=".pdf,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
          </div>
        </form>
        {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}
        {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
      </main>
    </>
  );
}
