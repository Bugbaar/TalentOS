"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { clearSession } from "@/lib/api";

export function Nav() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    setName(localStorage.getItem("talentos_name") || "");
    setRole(localStorage.getItem("talentos_role") || "");
  }, []);

  const home = role === "recruiter" ? "/recruiter" : role === "candidate" ? "/candidate" : "/";

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07111f]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={home} className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400 text-sm text-slate-950">T</span>
          TalentOS
        </Link>
        <nav className="flex items-center gap-5 text-sm text-slate-300">
          {role === "recruiter" && (
            <>
              <Link href="/recruiter">Dashboard</Link>
              <Link href="/recruiter/jobs/new">New job</Link>
            </>
          )}
          {role === "candidate" && (
            <>
              <Link href="/candidate">Roles</Link>
              <Link href="/candidate/profile">Profile</Link>
            </>
          )}
          {name ? (
            <>
              <span className="hidden sm:inline text-slate-400">{name}</span>
              <button
                className="rounded-full border border-white/15 px-3 py-1 hover:bg-white/10"
                onClick={() => {
                  clearSession();
                  window.location.href = "/";
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="rounded-full bg-cyan-400 px-3 py-1 font-medium text-slate-950">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-300" : score >= 60 ? "text-cyan-300" : score >= 40 ? "text-amber-300" : "text-rose-300";
  return (
    <div className={`grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-white/5 text-lg font-semibold ${color}`}>
      {score}
    </div>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-slate-200 ring-1 ring-white/10">{children}</span>;
}
