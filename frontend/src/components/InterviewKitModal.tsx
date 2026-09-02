"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ClipboardList, Sparkles, X } from "lucide-react";
import type { InterviewKit } from "@/types";
import { cn } from "@/lib/utils";

export default function InterviewKitModal({
  kit,
  loading,
  error,
  onClose,
}: {
  kit: InterviewKit | null;
  loading: boolean;
  error?: string;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-tx/40 p-4 backdrop-blur-sm sm:p-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-st bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-st p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sr-indigo-50 text-sr-indigo-900 border border-sr-indigo-100">
              <ClipboardList size={20} />
            </div>
            <div>
              <div className="eyebrow text-sr-indigo-900">
                <Sparkles size={12} className="text-sr-indigo-600" /> Structured Interview Guide
              </div>
              <h2 className="mt-0.5 font-matter text-xl font-semibold text-tx">
                Tailored Interview Questions & Rubric
              </h2>
              {kit && (
                <p className="text-xs text-tx-secondary">
                  Targeted for <span className="font-semibold text-tx">{kit.candidate_name}</span> · Role:{" "}
                  <span className="font-semibold text-sr-indigo-700">{kit.job_title}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-tx-tertiary hover:bg-sf-secondary hover:text-tx"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sr-indigo-50 text-sr-indigo-600">
                <Sparkles className="animate-spin" size={20} />
              </div>
              <p className="mt-3 font-matter font-medium text-tx">Generating tailored rubric...</p>
              <p className="text-xs text-tx-secondary">Synthesizing candidate gaps with target job requirements.</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          {kit && (
            <div className="space-y-3">
              {kit.questions.map((question, index) => {
                const isOpen = expanded === index;
                return (
                  <div
                    key={`${question.question}-${index}`}
                    className={`overflow-hidden rounded-2xl border transition-all ${
                      isOpen ? "border-sr-indigo-200 bg-sf-secondary/40 shadow-sm" : "border-st bg-white"
                    }`}
                  >
                    <button
                      onClick={() => setExpanded(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 p-4 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sr-indigo-50 font-mono text-xs font-semibold text-sr-indigo-700">
                          {index + 1}
                        </span>
                        <div>
                          <span className="block font-matter text-sm font-semibold text-tx">
                            {question.question}
                          </span>
                          <span className="mt-1 inline-flex items-center gap-2 text-[10px] uppercase tracking-wider text-tx-tertiary font-medium">
                            <span className="text-sr-indigo-700 font-semibold">{question.question_type.replace("_", " ")}</span>
                            <span>·</span>
                            <span>{question.target_skill}</span>
                          </span>
                        </div>
                      </div>
                      <ChevronDown
                        size={16}
                        className={cn("shrink-0 text-tx-tertiary transition-transform duration-200", isOpen && "rotate-180 text-sr-indigo-600")}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-st bg-white p-5 space-y-3.5">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-tx-secondary">
                            Expected Answer Indicators
                          </p>
                          <ul className="mt-2 space-y-1 text-xs text-tx-secondary pl-1">
                            {question.expected_answer_points.map((point, pIdx) => (
                              <li key={pIdx} className="flex items-start gap-2">
                                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-xl border border-st bg-sf-secondary p-3.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-sr-indigo-900">
                            Evaluation Rubric
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-tx-secondary">
                            {question.evaluation_rubric}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-st p-4">
          <button className="btn-secondary text-xs" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
