"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  Edit3,
  Eye,
  Mail,
  Plus,
  Search,
  Trash2,
  X,
  FileText,
  ChevronRight,
  Variable,
  Save,
  Sparkles,
  CheckCircle2,
  Send,
  Briefcase,
  CalendarCheck,
  CalendarX,
  UserCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn, formatDate, timeAgo } from "@/lib/utils";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  variables: string[];
  description: string | null;
  is_active: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { id: "all", label: "All Templates", icon: FileText, color: "bg-slate-500" },
  { id: "outreach", label: "Outreach", icon: Send, color: "bg-brand-500" },
  { id: "interview", label: "Interview", icon: CalendarCheck, color: "bg-blue-500" },
  { id: "offer", label: "Offer", icon: UserCheck, color: "bg-success-500" },
  { id: "rejection", label: "Rejection", icon: CalendarX, color: "bg-danger-500" },
  { id: "general", label: "General", icon: Mail, color: "bg-slate-500" },
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [activeCategory]);

  async function loadTemplates() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getEmailTemplates(activeCategory === "all" ? undefined : activeCategory);
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  const filteredTemplates = templates.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(query) ||
      t.subject.toLowerCase().includes(query) ||
      (t.description?.toLowerCase().includes(query) ?? false)
    );
  });

  const handleCreate = () => {
    setSelectedTemplate({
      id: "",
      name: "",
      subject: "",
      body: "",
      category: "outreach",
      variables: [],
      description: null,
      is_active: true,
      use_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setEditMode(true);
    setShowCreate(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditMode(true);
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await api.deleteEmailTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template");
    }
  };

  const handleSave = async (data: Partial<EmailTemplate>) => {
    try {
      if (showCreate) {
        const created = await api.createEmailTemplate({
          name: data.name!,
          subject: data.subject!,
          body: data.body!,
          category: data.category || "outreach",
          description: data.description || undefined,
        });
        setTemplates((prev) => [created, ...prev]);
        setSelectedTemplate(created);
        setEditMode(false);
        setShowCreate(false);
      } else if (selectedTemplate) {
        const updated = await api.updateEmailTemplate(selectedTemplate.id, data);
        setTemplates((prev) =>
          prev.map((t) => (t.id === selectedTemplate.id ? updated : t))
        );
        setSelectedTemplate(updated);
        setEditMode(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="eyebrow">
            <Mail size={12} />
            Communication
          </div>
          <h1 className="mt-1 text-2xl font-bold text-tx-primary tracking-tight">
            Email Templates
          </h1>
          <p className="mt-1 text-sm text-tx-tertiary">
            Reusable templates with dynamic variables for consistent outreach
          </p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
          <Plus size={14} />
          New Template
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
                isActive
                  ? "bg-brand-50 text-brand-700 border-brand-200"
                  : "bg-white text-tx-tertiary border-sf-tertiary hover:border-brand-200 hover:text-brand-700"
              )}
            >
              <Icon size={12} />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-tertiary" />
        <input
          type="text"
          placeholder="Search templates by name, subject, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="field pl-9"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
          {error}
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-full card p-12 text-center">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-full card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-brand-600" />
            </div>
            <h3 className="text-lg font-semibold text-tx-primary mb-2">
              No templates found
            </h3>
            <p className="text-sm text-tx-tertiary mb-4">
              {activeCategory === "all"
                ? "Create your first template to get started"
                : `No ${activeCategory} templates yet`}
            </p>
            <button onClick={handleCreate} className="btn-primary">
              <Plus size={14} />
              Create Template
            </button>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const category = CATEGORIES.find((c) => c.id === template.category) || CATEGORIES[0];
            const Icon = category.icon;

            return (
              <div
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template);
                  setEditMode(false);
                  setShowCreate(false);
                }}
                className="card p-5 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl text-white", category.color)}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-tx-primary">{template.name}</h3>
                      <p className="text-[10px] text-tx-tertiary uppercase tracking-wider">
                        {template.category}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-tx-muted group-hover:text-brand-600 transition-colors" />
                </div>

                {template.description && (
                  <p className="text-xs text-tx-tertiary mb-3 line-clamp-2">
                    {template.description}
                  </p>
                )}

                <div className="rounded-lg bg-sf-secondary p-3 mb-3">
                  <p className="text-[10px] font-semibold uppercase text-tx-tertiary mb-1">Subject</p>
                  <p className="text-xs text-tx-primary font-medium">{template.subject}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-tx-tertiary">
                    {template.variables.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Variable size={10} />
                        {template.variables.length} variables
                      </span>
                    )}
                    <span>Used {template.use_count}x</span>
                  </div>
                  <span className="text-[10px] text-tx-muted">
                    {timeAgo(template.updated_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail/Edit Modal */}
      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          editMode={editMode || showCreate}
          isNew={showCreate}
          onClose={() => {
            setSelectedTemplate(null);
            setEditMode(false);
            setShowCreate(false);
          }}
          onEdit={() => setEditMode(true)}
          onSave={handleSave}
          onDelete={() => handleDelete(selectedTemplate.id)}
          onCopy={(text) => copyToClipboard(text)}
        />
      )}
    </div>
  );
}

function TemplateDetailModal({
  template,
  editMode,
  isNew,
  onClose,
  onEdit,
  onSave,
  onDelete,
  onCopy,
}: {
  template: EmailTemplate;
  editMode: boolean;
  isNew: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSave: (data: Partial<EmailTemplate>) => void;
  onDelete: () => void;
  onCopy: (text: string) => void;
}) {
  const [form, setForm] = useState({
    name: template.name,
    subject: template.subject,
    body: template.body,
    category: template.category,
    description: template.description || "",
  });
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize preview variables
    const initial: Record<string, string> = {};
    template.variables.forEach((v) => {
      initial[v] = `{{${v}}}`;
    });
    setPreviewVars(initial);
  }, [template]);

  // Detect variables in body/subject
  const detectVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    return Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, ""))));
  };

  const allVariables = Array.from(
    new Set([...detectVariables(form.subject), ...detectVariables(form.body)])
  );

  const handleSubmit = async () => {
    if (!form.name || !form.subject || !form.body) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        description: form.description || null,
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // Render template with current variables
    let subject = form.subject;
    let body = form.body;
    Object.entries(previewVars).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
      body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    });
    setPreview({ subject, body });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-white border-l border-sf-tertiary shadow-2xl overflow-hidden flex flex-col animate-slide-in">
        {/* Header */}
        <div className="p-6 border-b border-sf-tertiary bg-gradient-to-br from-brand-50/30 to-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-tx-primary">
              {isNew ? "Create Template" : editMode ? "Edit Template" : template.name}
            </h2>
            <p className="text-xs text-tx-tertiary mt-0.5">
              {isNew ? "Build a new reusable email template" : `Used ${template.use_count} times`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-sf-secondary text-tx-tertiary">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {editMode ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-tx-tertiary">
                    Template Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="field mt-1"
                    placeholder="e.g., Initial Outreach"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-tx-tertiary">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="field mt-1"
                  >
                    {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-tx-tertiary">
                  Description (Optional)
                </label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="field mt-1"
                  placeholder="When to use this template..."
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-tx-tertiary">
                  Subject Line
                </label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="field mt-1"
                  placeholder="Email subject with {{variables}}"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-tx-tertiary">
                  Body
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="field mt-1 min-h-[240px] resize-none font-mono text-sm"
                  placeholder="Hi {{candidate_name}},..."
                />
                <p className="mt-1 text-[10px] text-tx-muted">
                  Use <code className="px-1 py-0.5 rounded bg-sf-secondary text-tx-secondary">{"{{variable_name}}"}</code> for dynamic content
                </p>
              </div>

              {/* Detected Variables */}
              {allVariables.length > 0 && (
                <div className="rounded-xl bg-sf-secondary border border-sf-tertiary p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-tx-tertiary mb-2 flex items-center gap-1">
                    <Variable size={10} />
                    Detected Variables ({allVariables.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {allVariables.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-brand-50 text-brand-700 border border-brand-200"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-tx-tertiary">
                    Subject
                  </label>
                  <button
                    onClick={() => onCopy(template.subject)}
                    className="p-1 rounded hover:bg-sf-secondary text-tx-muted"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                <div className="rounded-lg bg-sf-secondary p-3 text-sm font-medium text-tx-primary">
                  {template.subject}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-tx-tertiary">
                    Body
                  </label>
                  <button
                    onClick={() => onCopy(template.body)}
                    className="p-1 rounded hover:bg-sf-secondary text-tx-muted"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                <div className="rounded-lg bg-sf-secondary p-4 text-sm text-tx-primary whitespace-pre-wrap font-mono">
                  {template.body}
                </div>
              </div>

              {template.variables.length > 0 && (
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-tx-tertiary mb-2 block">
                    Variables Used
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {template.variables.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-brand-50 text-brand-700 border border-brand-200"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview with sample values */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-tx-tertiary">
                  Preview with Sample Values
                </label>
                {template.variables.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {template.variables.map((v) => (
                        <div key={v} className="flex items-center gap-2">
                          <label className="text-[10px] font-mono text-tx-tertiary w-32 flex-shrink-0">
                            {`{{${v}}}`}
                          </label>
                          <input
                            value={previewVars[v] || ""}
                            onChange={(e) =>
                              setPreviewVars({ ...previewVars, [v]: e.target.value })
                            }
                            className="field text-xs flex-1"
                            placeholder={`Value for ${v}`}
                          />
                        </div>
                      ))}
                    </div>
                    <button onClick={handlePreview} className="btn-secondary text-xs">
                      <Eye size={12} />
                      Render Preview
                    </button>

                    {preview && (
                      <div className="mt-3 rounded-xl border border-sf-tertiary overflow-hidden">
                        <div className="bg-sf-secondary px-3 py-2 border-b border-sf-tertiary">
                          <p className="text-[10px] font-semibold uppercase text-tx-tertiary">Subject</p>
                          <p className="text-sm font-medium text-tx-primary mt-0.5">{preview.subject}</p>
                        </div>
                        <div className="bg-white p-4 text-sm text-tx-primary whitespace-pre-wrap">
                          {preview.body}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg bg-sf-secondary p-3 text-xs text-tx-tertiary">
                    This template has no variables — it will render as-is.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sf-tertiary bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!editMode && !isNew && (
              <button onClick={onDelete} className="p-2 rounded-lg text-danger-600 hover:bg-danger-50">
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <button onClick={onClose} className="btn-secondary text-xs" disabled={saving}>
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn-primary text-xs"
                  disabled={saving || !form.name || !form.subject || !form.body}
                >
                  <Save size={12} />
                  {saving ? "Saving..." : isNew ? "Create" : "Save Changes"}
                </button>
              </>
            ) : (
              <>
                <button onClick={onClose} className="btn-secondary text-xs">
                  Close
                </button>
                <button onClick={onEdit} className="btn-primary text-xs">
                  <Edit3 size={12} />
                  Edit Template
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
