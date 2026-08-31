"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api, setSession } from "@/lib/api";

type Token = { access_token: string; role: string; full_name: string; email: string };

export default function RegisterPage() {
  const [role, setRole] = useState<"recruiter" | "candidate">("candidate");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setLoading(true);
    try {
      const data = await api<Token>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: form.get("full_name"),
          email: form.get("email"),
          password: form.get("password"),
          role,
          organization: form.get("organization") || null,
        }),
      });
      setSession(data.access_token, data.role, data.full_name, data.email);
      window.location.href = data.role === "recruiter" ? "/recruiter" : "/candidate";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="text-sm text-cyan-300">← TalentOS</Link>
      <h1 className="mt-4 text-3xl font-semibold">Create account</h1>
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-full bg-white/5 p-1">
        {(["candidate", "recruiter"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setRole(item)}
            className={`rounded-full py-2 text-sm capitalize ${role === item ? "bg-cyan-400 text-slate-950" : ""}`}
          >
            {item}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input name="full_name" required placeholder="Full name" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
        <input name="email" type="email" required placeholder="Email" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
        <input name="password" type="password" minLength={8} required placeholder="Password (8+ characters)" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
        {role === "recruiter" && (
          <input name="organization" required placeholder="Organization" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
        )}
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button disabled={loading} className="w-full rounded-full bg-cyan-400 py-2.5 font-medium text-slate-950">
          {loading ? "Creating…" : "Join TalentOS"}
        </button>
      </form>
    </main>
  );
}
