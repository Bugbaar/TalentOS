"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  DollarSign,
  MapPin,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { JobOpening } from "@/types";
import StatusBadge from "@/components/StatusBadge";

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.jobs()
      .then(setJobs)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load jobs"));
  }, []);

  const visible = jobs.filter((job) => !filter || job.status === filter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="eyebrow text-sr-indigo-900">
            <Briefcase size={13} className="text-sr-indigo-600" /> Requisition Pipeline
          </div>
          <h1 className="mt-1 font-matter text-3xl font-bold tracking-tight text-tx">
            Job Openings
          </h1>
          <p className="mt-1 text-xs text-tx-secondary">
            Manage active roles, candidate applications, and side-by-side comparison matrices.
          </p>
        </div>

        <button className="btn-primary text-xs" onClick={() => setOpen(true)}>
          <Plus size={15} /> Create Requisition
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Pill Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", "ACTIVE", "DRAFT", "CLOSED"].map((item) => (
          <button
            key={item || "all"}
            onClick={() => setFilter(item)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              filter === item
                ? "bg-tx text-white shadow-sm font-semibold"
                : "bg-white border border-st text-tx-secondary hover:text-tx hover:bg-sf-secondary"
            }`}
          >
            {item || "All Openings"} ({item ? jobs.filter((j) => j.status === item).length : jobs.length})
          </button>
        ))}
      </div>

      {/* Jobs Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((job) => (
          <Link
            href={`/jobs/${job.id}`}
            key={job.id}
            className="card p-6 group hover:border-sr-indigo-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sr-indigo-50 text-sr-indigo-700 border border-sr-indigo-100 shadow-sm">
                <Briefcase size={18} />
              </div>
              <StatusBadge status={job.status} />
            </div>

            <h2 className="mt-4 font-matter text-base font-semibold text-tx group-hover:text-sr-indigo-600 transition-colors">
              {job.title}
            </h2>

            <div className="mt-1 flex flex-wrap gap-2 text-xs text-tx-secondary">
              <span>{job.department}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin size={11} className="text-tx-tertiary" /> {job.location} ({job.workplace_type.toLowerCase()})
              </span>
            </div>

            <p className="mt-3.5 line-clamp-2 text-xs leading-relaxed text-tx-secondary">
              {job.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-1 border-t border-st-secondary pt-3">
              {job.required_skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-sf-secondary border border-st px-2 py-0.5 text-[10px] font-medium text-tx-secondary"
                >
                  {skill}
                </span>
              ))}
              {job.required_skills.length > 4 && (
                <span className="rounded-full bg-sf-secondary px-1.5 py-0.5 text-[10px] text-tx-tertiary font-mono">
                  +{job.required_skills.length - 4}
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-st-secondary pt-3 text-xs text-tx-secondary">
              <span className="font-mono">{job.min_experience_years}+ yrs exp</span>
              {job.salary_range && (
                <span className="font-mono text-emerald-800 font-semibold flex items-center gap-0.5">
                  <DollarSign size={12} /> {job.salary_range}
                </span>
              )}
              <span className="font-semibold text-sr-indigo-600 group-hover:underline flex items-center gap-0.5">
                Pipeline <ArrowUpRight size={13} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {!visible.length && (
        <div className="card p-14 text-center">
          <p className="font-matter text-base font-semibold text-tx">No openings found</p>
          <p className="mt-1 text-xs text-tx-secondary">Create a new job opening to start receiving candidates.</p>
        </div>
      )}

      {open && (
        <JobModal
          onClose={() => setOpen(false)}
          onCreated={(job) => {
            setJobs((items) => [job, ...items]);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

type FormState = {
  title: string;
  department: string;
  location: string;
  description: string;
  required_skills: string;
  nice_to_have_skills: string;
  min_experience_years: string;
  workplace_type: "REMOTE" | "HYBRID" | "ONSITE";
  seniority_level: string;
  salary_range: string;
};

const initialForm: FormState = {
  title: "",
  department: "",
  location: "",
  description: "",
  required_skills: "",
  nice_to_have_skills: "",
  min_experience_years: "0",
  workplace_type: "REMOTE",
  seniority_level: "",
  salary_range: "",
};

function JobModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (job: JobOpening) => void;
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function polish() {
    if (!form.description.trim()) {
      setError("Please paste a draft description before using AI Polish.");
      return;
    }
    setPolishing(true);
    setError("");
    try {
      const result = await api.enrichJob(form.description, form.seniority_level, form.department);
      setForm((current) => ({
        ...current,
        title: result.title,
        description: result.polished_description,
        required_skills: result.required_skills.join(", "),
        nice_to_have_skills: result.nice_to_have_skills.join(", "),
        min_experience_years: String(result.recommended_min_experience),
        salary_range: result.suggested_salary_range,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to enrich draft");
    } finally {
      setPolishing(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const job = await api.createJob({
        title: form.title,
        department: form.department,
        location: form.location,
        description: form.description,
        workplace_type: form.workplace_type,
        required_skills: form.required_skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        nice_to_have_skills: form.nice_to_have_skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        min_experience_years: Number(form.min_experience_years),
        salary_range: form.salary_range,
        status: "ACTIVE",
      });
      onCreated(job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create job");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-tx/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="relative my-6 w-full max-w-2xl rounded-3xl border border-st bg-white p-6 sm:p-7 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-1 text-tx-tertiary hover:bg-sf-secondary hover:text-tx"
        >
          <X size={18} />
        </button>

        <div className="eyebrow text-sr-indigo-900">
          <Sparkles size={12} className="text-sr-indigo-600" /> Requisition Architect
        </div>
        <h2 className="mt-0.5 font-matter text-xl font-semibold text-tx">Create a Job Opening</h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[10px] font-semibold uppercase text-tx-secondary">Job Title</label>
            <input
              required
              className="field mt-1 text-xs"
              placeholder="e.g. Senior Backend Engineer"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase text-tx-secondary">Department</label>
            <input
              required
              className="field mt-1 text-xs"
              placeholder="e.g. Engineering"
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase text-tx-secondary">Location</label>
            <input
              required
              className="field mt-1 text-xs"
              placeholder="e.g. Bengaluru / Remote"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase text-tx-secondary">Workplace</label>
            <select
              className="field mt-1 text-xs"
              value={form.workplace_type}
              onChange={(e) => update("workplace_type", e.target.value as FormState["workplace_type"])}
            >
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">Onsite</option>
            </select>
          </div>
        </div>

        {/* AI Polish Button */}
        <div className="mt-4 flex items-center justify-between">
          <label className="text-[10px] font-semibold uppercase text-tx-secondary">Role Description</label>
          <button
            type="button"
            onClick={() => void polish()}
            disabled={polishing}
            className="inline-flex items-center gap-1.5 rounded-full border border-sr-indigo-200 bg-sr-indigo-50 px-3 py-1 text-xs font-semibold text-sr-indigo-700 hover:bg-sr-indigo-100 transition-colors"
          >
            <Sparkles size={12} /> {polishing ? "Polishing with Llama 3.3..." : "✨ AI Polish & Extract Skills"}
          </button>
        </div>

        <textarea
          required
          className="field mt-1 min-h-28 text-xs leading-relaxed"
          placeholder="Paste draft requirements or notes and click AI Polish to automatically extract skills, salary band, and experience..."
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[10px] font-semibold uppercase text-tx-secondary">Required Skills (comma-separated)</label>
            <input
              className="field mt-1 text-xs"
              placeholder="Python, FastAPI, PostgreSQL"
              value={form.required_skills}
              onChange={(e) => update("required_skills", e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase text-tx-secondary">Nice to Have</label>
            <input
              className="field mt-1 text-xs"
              placeholder="Docker, Redis, AWS"
              value={form.nice_to_have_skills}
              onChange={(e) => update("nice_to_have_skills", e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase text-tx-secondary">Min. Experience (years)</label>
            <input
              required
              type="number"
              min="0"
              className="field mt-1 text-xs font-mono"
              placeholder="e.g. 4"
              value={form.min_experience_years}
              onChange={(e) => update("min_experience_years", e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase text-tx-secondary">Salary Range</label>
            <input
              className="field mt-1 text-xs font-mono"
              placeholder="e.g. ₹25,00,000 - ₹35,00,000"
              value={form.salary_range}
              onChange={(e) => update("salary_range", e.target.value)}
            />
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2.5 border-t border-st pt-4">
          <button type="button" className="btn-secondary text-xs" onClick={onClose}>
            Cancel
          </button>
          <button disabled={saving || polishing} className="btn-primary text-xs">
            {saving ? "Creating..." : "Publish Requisition"}
          </button>
        </div>
      </form>
    </div>
  );
}
