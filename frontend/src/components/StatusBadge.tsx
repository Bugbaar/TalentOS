import type { ApplicationStatus, JobStatus } from "@/types";
import { cn } from "@/lib/utils";

const config: Record<string, { label: string; border: string; bg: string; text: string; dot: string }> = {
  APPLIED: { label: "Applied", border: "border-slate-200", bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-400" },
  SCREENING: { label: "Screening", border: "border-blue-200", bg: "bg-blue-50/80", text: "text-blue-700", dot: "bg-blue-500" },
  INTERVIEW: { label: "Interview", border: "border-indigo-200", bg: "bg-indigo-50/80", text: "text-sr-indigo-700", dot: "bg-sr-indigo-500" },
  OFFER: { label: "Offer", border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500" },
  HIRED: { label: "Hired", border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  REJECTED: { label: "Rejected", border: "border-rose-200", bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-400" },
  ACTIVE: { label: "Active", border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  DRAFT: { label: "Draft", border: "border-slate-200", bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" },
  CLOSED: { label: "Closed", border: "border-zinc-200", bg: "bg-zinc-50", text: "text-zinc-600", dot: "bg-zinc-400" },
};

export default function StatusBadge({ status }: { status: ApplicationStatus | JobStatus }) {
  const item = config[status] ?? config.APPLIED;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        item.border,
        item.bg,
        item.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", item.dot)} />
      {item.label}
    </span>
  );
}
