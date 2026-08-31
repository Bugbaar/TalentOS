import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">BugBaar · TalentOS</p>
      <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight tracking-tight">
        Hiring infrastructure that can explain itself.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-slate-300">
        TalentOS replaces spreadsheet recruiting with candidate profiles, job pipelines, resume
        intelligence, and an auditable matching engine. Recruiters see why someone ranked. Candidates
        see where they stand.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/login" className="rounded-full bg-cyan-400 px-5 py-2.5 font-medium text-slate-950">
          Open the workspace
        </Link>
        <Link href="/register" className="rounded-full border border-white/15 px-5 py-2.5">
          Create an account
        </Link>
      </div>
      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {[
          ["Resume intelligence", "Parse skills, education, and experience from plain text or PDF — no paid API required."],
          ["Explainable matching", "Weighted coverage of required skills, experience, education, and seniority with skill gaps."],
          ["Hiring pipeline", "Applied → screening → interview → offer → hired, with illegal transitions blocked."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-medium">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
          </article>
        ))}
      </section>
      <section className="mt-10 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6 text-sm text-slate-300">
        <p className="font-medium text-cyan-200">Demo accounts (password: TalentOS!2026)</p>
        <p className="mt-2">Recruiter: priya@bugbaar.dev</p>
        <p>Candidate: aisha.rahman@example.com</p>
      </section>
    </main>
  );
}
