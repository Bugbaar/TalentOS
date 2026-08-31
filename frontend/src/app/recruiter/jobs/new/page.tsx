"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/ui";
import { api } from "@/lib/api";

export default function NewJobPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const split = (value: FormDataEntryValue | null) =>
      String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    try {
      const job = await api<{ id: number }>("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          department: form.get("department"),
          location: form.get("location"),
          seniority: form.get("seniority"),
          description: form.get("description"),
          required_skills: split(form.get("required_skills")),
          optional_skills: split(form.get("optional_skills")),
          min_years_experience: Number(form.get("min_years_experience") || 0),
          education_requirement: form.get("education_requirement"),
          status: "open",
        }),
      });
      router.push(`/recruiter/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create job");
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Post a role</h1>
        <p className="mt-2 text-sm text-slate-400">Required skills drive ranking. Optional skills only add bonus coverage.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input name="title" required placeholder="Role title" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="department" placeholder="Department" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
            <input name="location" defaultValue="Remote" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
            <select name="seniority" defaultValue="mid" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              {["intern", "junior", "mid", "senior", "lead", "staff"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input name="min_years_experience" type="number" min={0} defaultValue={3} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
          </div>
          <textarea name="description" required minLength={20} rows={5} placeholder="What this person will own" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
          <input name="required_skills" required placeholder="Required skills (comma separated)" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
          <input name="optional_skills" placeholder="Optional skills" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
          <select name="education_requirement" defaultValue="Bachelors" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            {["Unknown", "Diploma", "Bachelors", "Masters", "PhD"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button className="rounded-full bg-cyan-400 px-5 py-2.5 font-medium text-slate-950">Publish role</button>
        </form>
      </main>
    </>
  );
}
