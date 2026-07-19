import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Search, ClipboardList, Building2, Shield, Lock, CheckCircle2, Clock, Ban, ScrollText, BookOpen, Terminal, GitBranch } from "lucide-react";

const sections = [
  {
    id: "overview",
    title: "Overview",
    icon: BookOpen,
    content: (
      <>
        <p className="mb-4 text-sm leading-relaxed text-ink/70">
          RealDoor is a privacy-first, no-eligibility web application that helps renters prepare complete, accurate housing applications. Users upload documents, extract and confirm their profile data, understand income and occupancy rules, review a readiness checklist, and export a submission-ready packet — all without any automated eligibility decision.
        </p>

      </>
    ),
  },
  {
    id: "stages",
    title: "Stages",
    icon: GitBranch,
    content: (
      <>
        <p className="mb-4 text-sm leading-relaxed text-ink/70">
          The application is organized into four sequential stages. Each stage builds on the previous one.
        </p>
        <div className="space-y-4">
          {[
            {
              icon: FileText, label: "Profile", number: "01",
              desc: "Upload PDFs, images, or DOCX files. The server extracts fields against an allowlist schema. Review each extracted field, confirm it, or provide a correction before proceeding.",
            },
            {
              icon: Search, label: "Understand", number: "02",
              desc: "Ask natural-language questions about income limits using the MTSP corpus. Use the deterministic calculator with a full formula trace to verify eligibility thresholds.",
            },
            {
              icon: ClipboardList, label: "Prepare", number: "03",
              desc: "Run the 8-item LIHTC gold-standard checklist with per-item status (present, missing, expired). Edit profile fields inline and export a complete PDF packet.",
            },
            {
              icon: Building2, label: "Discover", number: "04",
              desc: "Browse LIHTC properties by metro area. Filter by bedrooms, unit type, and max income. View DDA and QCT designations for each property.",
            },
          ].map((stage) => (
            <div key={stage.label} className="flex gap-3 rounded-lg border border-line bg-paper/30 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brass/10 text-brass">
                <stage.icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xs text-ink/30">{stage.number}</span>
                  <h4 className="text-sm font-semibold text-ink">{stage.label}</h4>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink/60">{stage.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "guardrails",
    title: "Guardrails & Security",
    icon: Shield,
    content: (
      <>
        <p className="mb-4 text-sm leading-relaxed text-ink/70">
          Every feature is designed around six non-negotiable principles:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: Ban, title: "No eligibility decisions", desc: "Refusal middleware returns 400 on decision verbs like approve, eligible, qualify." },
            { icon: FileText, title: "Allowlist schema", desc: "Extraction constrained to RenterProfile fields; everything else rejected." },
            { icon: Shield, title: "Injection defense", desc: "Document text sanitized, never concatenated into prompts." },
            { icon: Lock, title: "Session encryption", desc: "annual_income, full_name, current_address encrypted with AES-256-GCM at rest." },
            { icon: CheckCircle2, title: "Consent logging", desc: "Every action logged with rule_version; raw document content never stored." },
            { icon: Clock, title: "24-hour TTL", desc: "Sessions auto-purge; DELETE /session/{id} hard-deletes all data." },
          ].map((g) => (
            <div key={g.title} className="flex gap-3 rounded-lg border border-line bg-paper/30 p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brass/10 text-brass">
                <g.icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-ink">{g.title}</h4>
                <p className="mt-0.5 text-xs text-ink/50">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "api",
    title: "API Reference",
    icon: Terminal,
    content: (
      <>
        <p className="mb-4 text-sm leading-relaxed text-ink/70">
          All endpoints are served from <code className="rounded bg-ink/5 px-1 py-0.5 font-mono text-xs text-brass">http://localhost:8000</code>. Interactive docs available at <code className="rounded bg-ink/5 px-1 py-0.5 font-mono text-xs text-brass">/docs</code>.
        </p>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-line bg-ink/5">
                <th className="px-3 py-2 font-semibold text-ink">Method</th>
                <th className="px-3 py-2 font-semibold text-ink">Endpoint</th>
                <th className="px-3 py-2 font-semibold text-ink">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                ["POST", "/session", "Create a new session"],
                ["DELETE", "/session/{id}", "Delete session and all data"],
                ["GET", "/session/{id}", "Get session metadata"],
                ["POST", "/session/{id}/extract", "Upload document for extraction"],
                ["POST", "/session/{id}/confirm", "Confirm or correct a field"],
                ["DELETE", "/session/{id}/field/{name}", "Remove a field"],
                ["POST", "/session/{id}/rules", "Ask a question against MTSP"],
                ["POST", "/session/{id}/calculate", "Run income calculator"],
                ["GET", "/session/{id}/checklist", "Get 8-item checklist"],
                ["POST", "/session/{id}/packet", "Generate PDF packet"],
                ["GET", "/session/{id}/profile", "Get confirmed profile"],
                ["PUT", "/session/{id}/profile", "Update profile fields"],
                ["GET", "/discover/properties", "List LIHTC properties"],
                ["GET", "/discover/metros", "List metro areas"],
                ["GET", "/discover/fmr/{metro}", "Fair Market Rent data"],
              ].map(([method, path, purpose]) => (
                <tr key={path} className="hover:bg-ink/[0.02]">
                  <td className="px-3 py-2">
                    <span className={`font-semibold ${
                      method === "GET" ? "text-confirmed" :
                      method === "POST" ? "text-brass" :
                      method === "DELETE" ? "text-expired" :
                      method === "PUT" ? "text-review" :
                      "text-ink"
                    }`}>{method}</span>
                  </td>
                  <td className="px-3 py-2 text-ink/70">{path}</td>
                  <td className="px-3 py-2 text-ink/50">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  
];

export function DocsPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-sm supports-[backdrop-filter]:bg-paper/70">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-ink/50 transition-colors hover:text-ink/70">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-brass" aria-hidden="true" />
            <span className="font-display text-sm font-semibold text-ink">Docs</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Documentation</h1>
          <p className="mt-2 text-sm text-ink/50">Everything you need to understand and run RealDoor.</p>
        </div>

        <nav className="mb-10 flex flex-wrap gap-2" aria-label="Section navigation">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper/50 px-3 py-1.5 text-xs text-ink/60 transition-colors hover:border-brass/30 hover:text-ink"
            >
              <s.icon className="h-3 w-3 text-brass" aria-hidden="true" />
              {s.title}
            </a>
          ))}
        </nav>

        <div className="space-y-12">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-20">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass/10 text-brass">
                  <s.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h2 className="font-display text-xl font-semibold text-ink">{s.title}</h2>
              </div>
              <div className="pl-11">{s.content}</div>
            </section>
          ))}
        </div>


      </div>
    </div>
  );
}
