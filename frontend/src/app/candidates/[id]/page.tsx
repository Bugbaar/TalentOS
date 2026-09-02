"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Copy,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Candidate, JobOpening, OutreachEmail } from "@/types";
import { formatDate, initials } from "@/lib/utils";

export default function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [outreach, setOutreach] = useState<OutreachEmail | null>(null);
  const [tone, setTone] = useState("PROFESSIONAL");
  const [company, setCompany] = useState("TalentOS");
  const [jobId, setJobId] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.candidate(id), api.jobs()])
      .then(([person, roles]) => {
        setCandidate(person);
        setJobs(roles);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load candidate"));
  }, [id]);

  async function draftEmail() {
    setLoading(true);
    setError("");
    try {
      const result = await api.outreachEmail(id, {
        candidate_id: id,
        job_id: jobId || null,
        tone,
        company_name: company,
      });
      setOutreach(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to draft email");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!outreach) return;
    void navigator.clipboard.writeText(`${outreach.subject_line}\n\n${outreach.email_body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error && !candidate) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
        {error}
      </div>
    );
  }

  if (!candidate) {
    return <div className="card h-96 animate-pulse" />;
  }

  const work = candidate.resumes?.flatMap((resume) => resume.work_history) ?? [];
  const education = candidate.resumes?.flatMap((resume) => resume.education) ?? [];

  return (
    <div className="space-y-6">
      <Link
        href="/candidates"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-tx-secondary hover:text-sr-indigo-600 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Talent Pool
      </Link>

      {/* Hero Dossier Card */}
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sr-indigo-50 font-matter text-xl font-bold text-sr-indigo-700 border border-sr-indigo-100 shadow-sm">
              {initials(candidate.first_name, candidate.last_name)}
            </div>
            <div>
              <div className="eyebrow text-sr-indigo-900">
                <Sparkles size={12} className="text-sr-indigo-600" /> Sourced Dossier
              </div>
              <h1 className="mt-0.5 font-matter text-2xl font-bold text-tx">
                {candidate.first_name} {candidate.last_name}
              </h1>
              <p className="text-xs text-tx-secondary">
                {candidate.headline || "Candidate Profile"}
              </p>

              <div className="mt-2.5 flex flex-wrap gap-4 text-xs text-tx-secondary">
                <span className="flex items-center gap-1">
                  <Mail size={13} className="text-sr-indigo-600" /> {candidate.email}
                </span>
                {candidate.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={13} className="text-tx-tertiary" /> {candidate.phone}
                  </span>
                )}
                {candidate.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-tx-tertiary" /> {candidate.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            className="btn-primary text-xs shrink-0"
            onClick={() => setOutreach({ subject_line: "", email_body: "", key_highlights: [] })}
          >
            <Send size={14} /> Draft Outreach Email
          </button>
        </div>
      </div>

      {/* Grid: Details & Sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Biography */}
          <section className="card p-6">
            <p className="eyebrow text-sr-indigo-900">Professional Summary</p>
            <p className="mt-3 text-xs leading-relaxed text-tx-secondary">
              {candidate.bio || "No summary statement provided for this candidate."}
            </p>
          </section>

          {/* Experience Timeline */}
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-sr-indigo-900">
                <Briefcase size={13} className="text-sr-indigo-600" /> Career Timeline
              </p>
              <span className="text-[11px] font-mono text-tx-tertiary">{work.length} roles</span>
            </div>

            <div className="mt-6 space-y-6">
              {work.map((item, index) => (
                <div className="relative border-l-2 border-slate-200 pl-5" key={`${item.company}-${index}`}>
                  <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-sr-indigo-600" />
                  <h3 className="font-matter text-sm font-semibold text-tx">{item.role}</h3>
                  <p className="text-xs font-medium text-sr-indigo-700">{item.company}</p>
                  <p className="mt-0.5 text-[11px] text-tx-tertiary">
                    {item.start_date || ""} — {item.end_date || "Present"}
                  </p>
                  {item.summary && (
                    <p className="mt-2 text-xs leading-relaxed text-tx-secondary">{item.summary}</p>
                  )}
                </div>
              ))}
              {!work.length && (
                <p className="text-xs text-tx-tertiary">No career timeline items recorded.</p>
              )}
            </div>
          </section>

          {/* Education */}
          {education.length > 0 && (
            <section className="card p-6">
              <p className="eyebrow text-sr-indigo-900">
                <GraduationCap size={13} className="text-sr-indigo-600" /> Education & Credentials
              </p>
              <div className="mt-4 space-y-3">
                {education.map((edu, idx) => (
                  <div key={idx} className="rounded-xl border border-st bg-sf-secondary/40 p-4">
                    <h4 className="font-matter text-sm font-semibold text-tx">
                      {edu.degree} in {edu.field}
                    </h4>
                    <p className="text-xs text-tx-secondary">{edu.institution}</p>
                    {edu.graduation_year && (
                      <p className="mt-1 text-[11px] text-tx-tertiary">Class of {edu.graduation_year}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Info */}
        <aside className="space-y-6">
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-sr-indigo-900">Verified Skills</p>
              <span className="text-[11px] font-mono text-tx-tertiary">{candidate.skills.length} skills</span>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-st bg-sf-secondary px-2.5 py-0.5 text-xs font-medium text-tx-secondary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <p className="eyebrow text-sr-indigo-900">Metadata</p>
            <div className="mt-3 space-y-3 text-xs">
              <div className="flex justify-between border-b border-st pb-2">
                <span className="text-tx-secondary">Experience</span>
                <strong className="font-mono text-tx">{candidate.experience_years} years</strong>
              </div>
              <div className="flex justify-between border-b border-st pb-2">
                <span className="text-tx-secondary">Resumes</span>
                <strong className="font-mono text-tx">{candidate.resumes?.length ?? 0}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-tx-secondary">Added</span>
                <strong className="font-mono text-tx">{formatDate(candidate.created_at)}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* AI Outreach Email Modal */}
      {outreach && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-tx/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-3xl border border-st bg-white p-6 shadow-2xl">
            <button
              className="absolute right-5 top-5 rounded-full p-1 text-tx-tertiary hover:bg-sf-secondary hover:text-tx"
              onClick={() => setOutreach(null)}
            >
              <X size={18} />
            </button>

            <div className="eyebrow text-sr-indigo-900">
              <Sparkles size={12} className="text-sr-indigo-600" /> AI Outreach Generator
            </div>
            <h2 className="mt-0.5 font-matter text-xl font-semibold text-tx">
              Draft Email for {candidate.first_name}
            </h2>

            {!outreach.email_body ? (
              <div className="mt-5 space-y-3.5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-tx-secondary">Company Name</label>
                    <input
                      className="field mt-1 text-xs"
                      placeholder="Company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-tx-secondary">Tone</label>
                    <select
                      className="field mt-1 text-xs"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                    >
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="FRIENDLY">Friendly</option>
                      <option value="EXECUTIVE">Executive</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-tx-secondary">Target Role</label>
                    <select
                      className="field mt-1 text-xs"
                      value={jobId}
                      onChange={(e) => setJobId(e.target.value)}
                    >
                      <option value="">General Network</option>
                      {jobs.map((job) => (
                        <option value={job.id} key={job.id}>
                          {job.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  className="btn-primary w-full text-xs"
                  disabled={loading}
                  onClick={() => void draftEmail()}
                >
                  {loading ? "Drafting with Llama 3.3..." : "Generate AI Outreach Draft"}
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase text-tx-secondary">Subject Line</label>
                  <input
                    className="field mt-1 text-xs font-medium text-tx"
                    value={outreach.subject_line}
                    onChange={(e) => setOutreach({ ...outreach, subject_line: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase text-tx-secondary">Email Message</label>
                  <textarea
                    className="field mt-1 min-h-56 text-xs leading-relaxed text-tx"
                    value={outreach.email_body}
                    onChange={(e) => setOutreach({ ...outreach, email_body: e.target.value })}
                  />
                </div>

                {outreach.key_highlights && (
                  <div className="flex flex-wrap gap-1">
                    {outreach.key_highlights.map((h, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-sr-indigo-100 bg-sr-indigo-50 px-2 py-0.5 text-[10px] font-medium text-sr-indigo-700"
                      >
                        ✓ {h}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-3">
                  <button
                    className="btn-secondary text-xs"
                    onClick={() => setOutreach({ subject_line: "", email_body: "", key_highlights: [] })}
                  >
                    Regenerate
                  </button>
                  <button className="btn-primary text-xs" onClick={handleCopy}>
                    {copied ? (
                      <>
                        <CheckCircle2 size={13} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Copy to Clipboard
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
