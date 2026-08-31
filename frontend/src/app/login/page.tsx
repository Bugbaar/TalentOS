"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api, setSession } from "@/lib/api";

type Token = { access_token: string; role: string; full_name: string; email: string };

export default function LoginPage() {
  const [email, setEmail] = useState("priya@bugbaar.dev");
  const [password, setPassword] = useState("TalentOS!2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api<Token>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSession(data.access_token, data.role, data.full_name, data.email);
      window.location.href = data.role === "recruiter" ? "/recruiter" : "/candidate";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link href="/" className="text-sm text-cyan-300">
        ← TalentOS
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          Email
          <input className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm">
          Password
          <input type="password" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button disabled={loading} className="w-full rounded-full bg-cyan-400 py-2.5 font-medium text-slate-950">
          {loading ? "Signing in…" : "Continue"}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-400">
        New here? <Link href="/register" className="text-cyan-300">Create an account</Link>
      </p>
    </main>
  );
}
