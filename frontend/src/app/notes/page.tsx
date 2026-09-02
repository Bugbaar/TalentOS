"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Filter,
  MessageSquare,
  Plus,
  Search,
  Users,
  Pin,
  Clock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { cn, initials, timeAgo, formatDate } from "@/lib/utils";
import type { Candidate } from "@/types";
import CandidateNotes from "@/components/CandidateNotes";

interface NotePreview {
  id: string;
  candidate_id: string;
  candidate_name: string;
  content: string;
  author_name: string;
  created_at: string;
}

export default function NotesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [recentNotes, setRecentNotes] = useState<NotePreview[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"list" | "detail">("list");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [candidatesData] = await Promise.all([api.candidates()]);
      setCandidates(candidatesData);
    } catch (err) {
      console.error("Failed to load notes data", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredCandidates = candidates.filter((c) => {
    if (!searchQuery) return true;
    const name = `${c.first_name} ${c.last_name}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setActiveView("detail");
  };

  const handleBackToList = () => {
    setSelectedCandidate(null);
    setActiveView("list");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="eyebrow">
            <MessageSquare size={12} />
            Team Collaboration
          </div>
          <h1 className="mt-1 text-2xl font-bold text-tx-primary tracking-tight">
            Team Notes
          </h1>
          <p className="mt-1 text-sm text-tx-tertiary">
            Collaborative candidate notes shared across your team
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 animate-pulse">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidate List */}
          <div className={cn(
            "card overflow-hidden transition-all",
            activeView === "detail" ? "hidden lg:block" : ""
          )}>
            <div className="p-4 border-b border-sf-tertiary">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-tertiary" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="field pl-9"
                />
              </div>
            </div>

            <div className="divide-y divide-sf-tertiary max-h-[calc(100vh-320px)] overflow-y-auto">
              {filteredCandidates.length === 0 ? (
                <div className="p-8 text-center">
                  <Users size={24} className="mx-auto text-tx-muted mb-2" />
                  <p className="text-sm text-tx-muted">No candidates found</p>
                </div>
              ) : (
                filteredCandidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => handleSelectCandidate(candidate)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 text-left transition-colors",
                      selectedCandidate?.id === candidate.id
                        ? "bg-brand-50 border-l-2 border-l-brand-600"
                        : "hover:bg-sf-secondary"
                    )}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs font-bold flex-shrink-0">
                      {initials(candidate.first_name, candidate.last_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-tx-primary truncate">
                        {candidate.first_name} {candidate.last_name}
                      </p>
                      <p className="text-[10px] text-tx-tertiary truncate">
                        {candidate.headline || candidate.email}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-brand-500" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Notes Panel */}
          <div className={cn(
            "lg:col-span-2",
            activeView === "list" ? "hidden lg:block" : ""
          )}>
            {selectedCandidate ? (
              <div className="card overflow-hidden">
                {/* Candidate Header */}
                <div className="p-6 border-b border-sf-tertiary bg-gradient-to-br from-brand-50/30 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {activeView === "detail" && (
                        <button
                          onClick={handleBackToList}
                          className="p-2 rounded-lg hover:bg-sf-secondary text-tx-tertiary lg:hidden"
                        >
                          ← Back
                        </button>
                      )}
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white text-lg font-bold">
                        {initials(selectedCandidate.first_name, selectedCandidate.last_name)}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-tx-primary">
                          {selectedCandidate.first_name} {selectedCandidate.last_name}
                        </h2>
                        <p className="text-sm text-tx-tertiary">
                          {selectedCandidate.headline || selectedCandidate.email}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/candidates/${selectedCandidate.id}`}
                      className="btn-secondary text-xs"
                    >
                      View Profile
                    </Link>
                  </div>

                  {/* Quick Info */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-tx-tertiary">
                    {selectedCandidate.location && (
                      <span className="flex items-center gap-1">
                        📍 {selectedCandidate.location}
                      </span>
                    )}
                    {selectedCandidate.experience_years > 0 && (
                      <span className="flex items-center gap-1">
                        💼 {selectedCandidate.experience_years} years exp
                      </span>
                    )}
                    {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Sparkles size={12} className="text-brand-500" />
                        {selectedCandidate.skills.length} skills
                      </span>
                    )}
                  </div>
                </div>

                {/* Notes Component */}
                <CandidateNotes
                  candidateId={selectedCandidate.id}
                  currentUserName="You"
                />
              </div>
            ) : (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={28} className="text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-tx-primary mb-2">
                  Select a Candidate
                </h3>
                <p className="text-sm text-tx-tertiary max-w-md mx-auto">
                  Choose a candidate from the list to view and add collaborative team notes.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
