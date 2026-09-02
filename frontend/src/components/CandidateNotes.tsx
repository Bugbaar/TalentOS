"use client";

import { useEffect, useState } from "react";
import {
  Edit3,
  MessageSquare,
  Save,
  Send,
  Trash2,
  User,
  X,
  Pin,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn, initials, timeAgo } from "@/lib/utils";

interface Note {
  id: string;
  candidate_id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface CandidateNotesProps {
  candidateId: string;
  currentUserName?: string;
  compact?: boolean;
}

const AUTHOR_COLORS = [
  "from-brand-500 to-brand-600",
  "from-purple-500 to-purple-600",
  "from-success-500 to-success-600",
  "from-warning-500 to-warning-600",
  "from-danger-500 to-danger-600",
  "from-pink-500 to-pink-600",
];

function getAuthorColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AUTHOR_COLORS[Math.abs(hash) % AUTHOR_COLORS.length];
}

export default function CandidateNotes({
  candidateId,
  currentUserName = "You",
  compact = false,
}: CandidateNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "mine">("all");

  useEffect(() => {
    loadNotes();
  }, [candidateId]);

  async function loadNotes() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getCandidateNotes(candidateId);
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }

  async function addNote() {
    if (!newNote.trim() || submitting) return;
    setSubmitting(true);
    try {
      const note = await api.createNote(candidateId, {
        author_name: currentUserName,
        content: newNote.trim(),
      });
      setNotes((prev) => [note, ...prev]);
      setNewNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateNote(noteId: string) {
    if (!editContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const updated = await api.updateNote(noteId, editContent.trim());
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? updated : n))
      );
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteNote(noteId: string) {
    if (!confirm("Delete this note?")) return;
    try {
      await api.deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    }
  }

  const filteredNotes = notes.filter((n) =>
    filter === "all" ? true : n.author_name === currentUserName
  );

  return (
    <div className={cn("space-y-4", compact ? "" : "p-4 sm:p-6")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-tx-primary">Team Notes</h3>
            <p className="text-[10px] text-tx-tertiary">
              {notes.length} {notes.length === 1 ? "note" : "notes"} shared
            </p>
          </div>
        </div>

        {notes.length > 0 && (
          <div className="flex items-center gap-1 rounded-lg bg-sf-secondary p-0.5">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors",
                filter === "all"
                  ? "bg-white text-tx-primary shadow-sm"
                  : "text-tx-tertiary hover:text-tx-primary"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("mine")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors",
                filter === "mine"
                  ? "bg-white text-tx-primary shadow-sm"
                  : "text-tx-tertiary hover:text-tx-primary"
              )}
            >
              Mine
            </button>
          </div>
        )}
      </div>

      {/* Add Note */}
      <div className="rounded-2xl border border-sf-tertiary bg-white p-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br",
            getAuthorColor(currentUserName)
          )}>
            {initials(currentUserName.split(" ")[0], currentUserName.split(" ").slice(1).join(" "))}
          </div>
          <div className="flex-1 min-w-0">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Share an observation, interview note, or follow-up..."
              className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 resize-none text-sm text-tx-primary placeholder:text-tx-muted min-h-[60px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  addNote();
                }
              }}
            />
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-sf-tertiary">
              <p className="text-[10px] text-tx-muted">
                Press <kbd className="px-1.5 py-0.5 rounded bg-sf-secondary text-tx-secondary font-mono text-[9px]">⌘/Ctrl + ↵</kbd> to send
              </p>
              <button
                onClick={addNote}
                disabled={!newNote.trim() || submitting}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                  newNote.trim() && !submitting
                    ? "bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                    : "bg-sf-secondary text-tx-muted cursor-not-allowed"
                )}
              >
                <Send size={12} />
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">
          {error}
        </div>
      )}

      {/* Notes List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sf-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-sf-secondary rounded w-1/4" />
                  <div className="h-3 bg-sf-secondary rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
            <MessageSquare size={20} className="text-brand-600" />
          </div>
          <p className="text-sm font-semibold text-tx-primary">
            {filter === "mine" ? "You haven't posted any notes yet" : "No notes yet"}
          </p>
          <p className="mt-1 text-xs text-tx-tertiary">
            {filter === "mine" ? "Share your first observation" : "Be the first to add context for the team"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => {
            const isMine = note.author_name === currentUserName;
            const isEditing = editingId === note.id;
            const colorClass = getAuthorColor(note.author_name);

            return (
              <div
                key={note.id}
                className={cn(
                  "rounded-2xl border bg-white p-4 transition-all hover:shadow-md",
                  isMine ? "border-brand-200" : "border-sf-tertiary"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br",
                      colorClass
                    )}
                  >
                    {initials(note.author_name.split(" ")[0], note.author_name.split(" ").slice(1).join(" "))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-tx-primary">
                          {note.author_name}
                        </p>
                        {isMine && (
                          <span className="px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[9px] font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] text-tx-tertiary">
                          {timeAgo(note.created_at)}
                        </p>
                        {isMine && !isEditing && (
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => {
                                setEditingId(note.id);
                                setEditContent(note.content);
                              }}
                              className="p-1 rounded hover:bg-sf-secondary text-tx-muted hover:text-brand-600 transition-colors"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button
                              onClick={() => deleteNote(note.id)}
                              className="p-1 rounded hover:bg-sf-secondary text-tx-muted hover:text-danger-600 transition-colors"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="field min-h-[80px] resize-none text-sm"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditContent("");
                            }}
                            className="px-2.5 py-1 rounded-md text-[10px] font-medium text-tx-tertiary hover:bg-sf-secondary"
                          >
                            <X size={10} className="inline mr-0.5" />
                            Cancel
                          </button>
                          <button
                            onClick={() => updateNote(note.id)}
                            disabled={!editContent.trim() || submitting}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-600 text-white text-[10px] font-semibold hover:bg-brand-700"
                          >
                            <Save size={10} />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-tx-primary leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    )}

                    {note.updated_at !== note.created_at && !isEditing && (
                      <p className="mt-1.5 text-[10px] text-tx-muted italic">
                        edited {timeAgo(note.updated_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
