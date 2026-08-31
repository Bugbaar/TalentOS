"use client";

import Link from "next/link";
import { Briefcase, Cpu, LayoutDashboard, Sparkles, Users, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/candidates", label: "Talent Pool", icon: Users },
  { href: "/jobs", label: "Job Openings", icon: Briefcase },
  { href: "/matching", label: "AI Fit Engine", icon: Cpu },
];

export default function Sidebar({ open = true, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-st bg-sf px-4 py-5 transition-transform duration-200 lg:static lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-2">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sr-indigo-900 text-white shadow-sm">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="font-matter text-base font-semibold tracking-tight text-tx">
              Talent<span className="text-sr-indigo-600">OS</span>
            </span>
            <span className="block text-[9px] font-medium uppercase tracking-[1.5px] text-tx-tertiary">
              Intelligence
            </span>
          </div>
        </Link>
        <button
          className="rounded-lg p-1.5 text-tx-secondary hover:bg-sf-secondary lg:hidden"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="mt-8 px-2">
        <p className="eyebrow text-[10px]">Workspace</p>
      </div>

      <nav className="mt-2 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150",
                isActive
                  ? "bg-white text-tx shadow-app-sm border border-st"
                  : "text-tx-secondary hover:bg-sf-secondary hover:text-tx"
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "transition-colors",
                  isActive ? "text-sr-indigo-600" : "text-tx-tertiary group-hover:text-tx"
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* AI Platform Footer Box */}
      <div className="mt-auto rounded-2xl border border-st bg-white p-4 shadow-app-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sr-indigo-900">
            Sovereign Engine
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-tx-secondary">
          Frontier-class matching powered by Groq Llama 3.3.
        </p>
      </div>
    </aside>
  );
}
