"use client";

import { Bell, Menu, Search, Sparkles } from "lucide-react";

export default function Navbar({ onMenu }: { onMenu?: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-st bg-white/85 px-6 backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-4">
        <button
          className="rounded-lg p-1.5 text-tx-secondary hover:bg-sf-secondary lg:hidden"
          onClick={onMenu}
        >
          <Menu size={18} />
        </button>

        {/* Global Search Bar */}
        <div className="relative hidden w-72 sm:block">
          <Search className="absolute left-3.5 top-2.5 text-tx-muted" size={15} />
          <input
            className="field h-9 pl-9 pr-10 text-xs placeholder:text-tx-muted"
            placeholder="Search candidates, skills, roles..."
          />
          <span className="absolute right-2.5 top-2 rounded bg-sf-secondary px-1.5 py-0.5 text-[10px] font-mono text-tx-tertiary">
            ⌘K
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Sovereign Compute Status */}
        <div className="hidden items-center gap-2 rounded-full border border-sr-green-100 bg-sr-green-100/50 px-3 py-1 text-xs font-medium text-sr-green-700 md:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Groq Inference Live</span>
        </div>

        {/* Notification */}
        <button className="relative rounded-full p-2 text-tx-secondary hover:bg-sf-secondary hover:text-tx transition-colors">
          <Bell size={17} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-sr-indigo-600" />
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 border-l border-st pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sr-indigo-900 text-xs font-medium text-white shadow-sm">
            AK
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium text-tx">Alex Kumar</p>
            <p className="text-[10px] text-tx-tertiary">Talent Lead</p>
          </div>
        </div>
      </div>
    </header>
  );
}
