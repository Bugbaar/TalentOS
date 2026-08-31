"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileUp, Sparkles, UploadCloud, X, Zap } from "lucide-react";
import type { Candidate } from "@/types";
import { api } from "@/lib/api";
import { initials } from "@/lib/utils";

export default function ResumeUploader({
  onUploaded,
  onClose,
}: {
  onUploaded?: (candidate: Candidate) => void;
  onClose?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [error, setError] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    if (!/[.]((pdf)|(docx)|(txt)|(md))$/i.test(file.name)) {
      setError("Please select a PDF, DOCX, or TXT file.");
      return;
    }
    setError("");
    setLoading(true);
    setStage("Extracting document content...");

    try {
      setTimeout(() => setStage("Running Groq Llama 3.3 entity parser..."), 500);
      setTimeout(() => setStage("Structuring skills & career timeline..."), 1100);

      const result = await api.uploadResume(file);
      setCandidate(result);
      onUploaded?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-lg rounded-3xl border border-st bg-white p-6 sm:p-7 shadow-2xl">
      <button
        onClick={onClose}
        className="absolute right-5 top-5 rounded-full p-1 text-tx-tertiary hover:bg-sf-secondary hover:text-tx"
      >
        <X size={18} />
      </button>

      <div className="eyebrow text-sr-indigo-900">
        <Sparkles size={13} className="text-sr-indigo-600" /> Document Intelligence
      </div>
      <h2 className="mt-1 font-matter text-2xl font-semibold text-tx">
        Ingest Candidate Resume
      </h2>
      <p className="mt-0.5 text-xs text-tx-secondary">
        Automatically parse candidate contact information, verified skills, and work history.
      </p>

      {!candidate ? (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void upload(event.dataTransfer.files[0]);
            }}
            className={`mt-6 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
              dragging
                ? "border-sr-indigo-600 bg-sr-indigo-50/50"
                : "border-slate-300 bg-sf-secondary/40 hover:border-sr-indigo-400 hover:bg-white"
            }`}
          >
            <input
              ref={inputRef}
              hidden
              type="file"
              accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={(event) => void upload(event.target.files?.[0])}
            />

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-st shadow-sm text-sr-indigo-600">
              <UploadCloud size={24} />
            </div>

            <p className="mt-3 text-xs font-semibold text-tx">
              Drop resume here, or <span className="text-sr-indigo-600 underline">browse files</span>
            </p>
            <p className="mt-1 text-[11px] text-tx-tertiary">PDF, DOCX or TXT · Max 15MB</p>
          </div>

          {loading && (
            <div className="mt-5 rounded-2xl border border-st bg-sf-secondary/80 p-4">
              <div className="flex items-center gap-2.5">
                <Zap className="animate-pulse text-sr-indigo-600" size={16} />
                <span className="text-xs font-medium text-tx">{stage}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-full animate-pulse bg-sr-indigo-600" />
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </p>
          )}
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xs font-bold text-emerald-800 border border-emerald-200 shadow-sm">
              {initials(candidate.first_name, candidate.last_name)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-matter text-sm font-semibold text-tx">
                  {candidate.first_name} {candidate.last_name}
                </h3>
                <CheckCircle2 size={15} className="text-emerald-600" />
              </div>
              <p className="text-xs text-tx-secondary">{candidate.email}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            {candidate.skills.slice(0, 6).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-white border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2.5 border-t border-st pt-4">
        <button className="btn-secondary text-xs" onClick={onClose}>
          {candidate ? "Done" : "Cancel"}
        </button>
        {!candidate && (
          <button className="btn-primary text-xs" onClick={() => inputRef.current?.click()}>
            <FileUp size={14} /> Select File
          </button>
        )}
      </div>
    </div>
  );
}
