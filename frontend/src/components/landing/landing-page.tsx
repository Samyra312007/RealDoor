import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Search, ClipboardList, Building2, Shield, Lock, CheckCircle2, Clock, Ban, ArrowRight, Sparkles } from "lucide-react";
import { useSessionContext } from "@/lib/session-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STAGES = [
  {
    icon: FileText,
    title: "Profile",
    number: "01",
    description: "Upload PDFs or images, review extracted fields, confirm or correct — all within an allowlist schema.",
    accent: "from-brass/20 to-brass/5",
    iconBg: "bg-brass/10 text-brass",
    borderHover: "hover:border-brass/40",
  },
  {
    icon: Search,
    title: "Understand",
    number: "02",
    description: "Ask questions about income limits. Use the deterministic calculator with a full formula trace.",
    accent: "from-ink/10 to-ink/5",
    iconBg: "bg-ink/10 text-ink",
    borderHover: "hover:border-ink/30",
  },
  {
    icon: ClipboardList,
    title: "Prepare",
    number: "03",
    description: "Run the 8-item LIHTC checklist, edit fields inline, and export a complete PDF packet.",
    accent: "from-confirmed/10 to-confirmed/5",
    iconBg: "bg-confirmed/10 text-confirmed",
    borderHover: "hover:border-confirmed/40",
  },
  {
    icon: Building2,
    title: "Discover",
    number: "04",
    description: "Browse LIHTC properties by metro area. Filter by bedrooms and unit count to find your match.",
    accent: "from-review/10 to-review/5",
    iconBg: "bg-review/10 text-review",
    borderHover: "hover:border-review/40",
  },
];

const TRUST_ITEMS = [
  { icon: Lock, label: "AES-256-GCM Encrypted", description: "Your data is encrypted at rest and in transit" },
  { icon: Clock, label: "Auto-deletes after 24h", description: "Sessions expire automatically; explicit hard-delete available" },
  { icon: Ban, label: "No eligibility decisions", description: "The AI extracts and explains. A qualified human approves" },
];

const GUARDRAILS = [
  { icon: Ban, title: "No eligibility decisions", desc: "Refusal middleware returns 400 on decision verbs like approve, eligible, qualify." },
  { icon: FileText, title: "Allowlist schema", desc: "Extraction constrained to RenterProfile fields; everything else rejected." },
  { icon: Shield, title: "Injection defense", desc: "Document text sanitized, never concatenated into prompts." },
  { icon: Lock, title: "Session encryption", desc: "annual_income, full_name, current_address encrypted with AES-256-GCM at rest." },
  { icon: CheckCircle2, title: "Consent logging", desc: "Every action logged with rule_version; raw document content never stored." },
  { icon: Clock, title: "24-hour TTL", desc: "Sessions auto-purge; DELETE /session/{id} hard-deletes all data." },
];

function GradientBlob({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute -z-10 rounded-full blur-3xl", className)}
    />
  );
}

function ReceiptDivider() {
  return (
    <div className="receipt-tear mx-auto my-16 max-w-5xl" aria-hidden="true" />
  );
}

function HeroSection({ onCreateSession, loading }: { onCreateSession: () => void; loading: boolean }) {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 text-center sm:pt-24 lg:pt-32">
      <div className="paper-texture pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <GradientBlob className="-left-40 -top-40 h-[500px] w-[500px] bg-brass/15" />
      <GradientBlob className="-right-40 top-20 h-[400px] w-[400px] bg-ink/10" />
      <GradientBlob className="-bottom-40 left-1/3 h-[350px] w-[350px] bg-brass/10" />

      <div className="mx-auto max-w-4xl">
        <Badge variant="info" className="mb-6 animate-fade-in px-4 py-1.5 text-sm [animation-delay:100ms]">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Application-Readiness Copilot
        </Badge>

        <h1 className="animate-fade-in text-balance text-5xl font-extrabold tracking-tight text-ink sm:text-6xl lg:text-7xl [animation-delay:200ms]">
          You bring your documents.
          <br />
          <span className="bg-gradient-to-r from-brass to-brass/70 bg-clip-text text-transparent">We handle the rest.</span>
        </h1>

        <p className="animate-fade-in mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-ink/60 sm:text-xl [animation-delay:300ms]">
          RealDoor helps renters prepare for affordable housing applications — upload documents, understand income rules,
          review a readiness checklist, and export a packet. All without determining eligibility.
        </p>

        <div className="animate-fade-in mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center [animation-delay:400ms]">
          <Button
            size="lg"
            onClick={onCreateSession}
            disabled={loading}
            aria-busy={loading}
            className="group gap-2 shadow-lg shadow-brass/20 transition-all hover:shadow-xl hover:shadow-brass/30 brass-glow"
          >
            {loading ? "Starting..." : "Start Your Journey"}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Button>
          <p className="text-xs text-ink/30 sm:ml-2">
            No sign-up required. Your data is never shared.
          </p>
        </div>
      </div>
    </section>
  );
}

function TrustRow() {
  return (
    <section className="relative px-4 pb-16" aria-label="Trust and security highlights">
      <div className="paper-texture pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
        {TRUST_ITEMS.map((item, i) => (
          <div
            key={item.label}
            className="group fade-slide-in rounded-xl border border-line bg-paper/70 p-5 text-center backdrop-blur transition-all hover:border-brass/30 hover:shadow-md hover:shadow-brass/10 card-lift"
            style={{ animationDelay: `${500 + i * 100}ms` }}
          >
            <item.icon className="mx-auto h-6 w-6 text-brass transition-colors group-hover:text-brass/80" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-ink">{item.label}</p>
            <p className="mt-0.5 text-xs text-ink/50">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StageCard({ stage, index }: { stage: typeof STAGES[0]; index: number }) {
  const Icon = stage.icon;
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-line bg-paper p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl sm:p-8 card-lift corner-fold",
        stage.borderHover
      )}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="paper-texture pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative">
        <span className="mb-3 block font-mono text-2xs text-ink/20">{stage.number}</span>
        <div className={cn("mb-4 inline-flex rounded-xl p-3 shadow-sm", stage.iconBg)}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="font-display text-lg font-semibold text-ink">{stage.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">{stage.description}</p>
        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-brass opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1">
          Learn more <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="relative px-4 pb-20" aria-label="How it works">
      <div className="paper-texture pointer-events-none absolute inset-0 -z-10 opacity-30" aria-hidden="true" />
      <GradientBlob className="absolute -left-60 top-1/2 h-[400px] w-[400px] -translate-y-1/2 bg-brass/10" />
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="fade-slide-in mb-2 font-mono text-xs text-brass" style={{ animationDelay: "0ms" }}>
            02 — STAGES
          </p>
          <h2 className="fade-slide-in font-display text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl" style={{ animationDelay: "100ms" }}>
            Four stages to <span className="text-brass">readiness</span>
          </h2>
          <p className="fade-slide-in mx-auto mt-4 max-w-xl font-sans text-sm text-ink/60" style={{ animationDelay: "200ms" }}>
            A guided workflow from document upload to packet export. Each stage builds on the last.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage, i) => (
            <StageCard key={stage.title} stage={stage} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function GuardrailsPanel() {
  return (
    <section className="relative bg-ink px-4 py-20" aria-label="Guardrails and security">
      <div className="paper-texture pointer-events-none absolute inset-0 opacity-[0.02]" aria-hidden="true" />
      <GradientBlob className="absolute -right-40 -top-40 h-[500px] w-[500px] bg-brass/10" />
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-2 font-mono text-xs text-brass/70">03 — GUARDRAILS</p>
          <div className="mb-4 inline-flex rounded-2xl bg-paper/10 p-3">
            <Shield className="h-8 w-8 text-brass" aria-hidden="true" />
          </div>
          <h2 className="font-display text-balance text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
            Built on <span className="text-brass">non-negotiable</span> guardrails
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-sans text-sm text-paper/50">
            Every feature is designed around these six principles. No exceptions.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUARDRAILS.map((g, i) => (
            <div
              key={g.title}
              className="group fade-slide-in rounded-xl border border-paper/10 bg-paper/[0.04] p-5 transition-all hover:border-brass/30 hover:bg-paper/[0.07] hover:shadow-lg hover:shadow-brass/5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mb-3 inline-flex rounded-lg bg-brass/10 p-2.5 text-brass">
                <g.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-sm font-semibold text-paper">{g.title}</h3>
              <p className="mt-1 font-sans text-xs leading-relaxed text-paper/50">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeletedBanner() {
  const [visible, setVisible] = useState(
    () => sessionStorage.getItem("real_door_deleted") === "true"
  );
  if (!visible) return null;
  return (
    <div role="alert" className="border-b border-confirmed/30 bg-confirmed/5 px-4 py-3 text-center fade-slide-in">
      <p className="font-sans text-sm text-confirmed">
        Your data has been permanently deleted. You can start a fresh session anytime.
      </p>
      <button
        onClick={() => {
          sessionStorage.removeItem("real_door_deleted");
          setVisible(false);
        }}
        className="ml-2 font-mono text-2xs text-confirmed/60 underline underline-offset-2 hover:text-confirmed"
      >
        Dismiss
      </button>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const { createSession, sessionLoading } = useSessionContext();

  const handleStart = async () => {
    await createSession();
    navigate("/profile");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-paper">
      <div className="paper-texture pointer-events-none fixed inset-0 z-[-1] opacity-30" aria-hidden="true" />

      <DeletedBanner />

      <header className="border-b border-line bg-paper/90 backdrop-blur-sm supports-[backdrop-filter]:bg-paper/70">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brass text-sm font-bold text-paper shadow-sm">
              RD
            </div>
            <span className="font-display text-lg font-semibold text-ink">RealDoor</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/docs" className="font-sans text-sm text-ink/50 transition-colors hover:text-ink/70 brass-glow rounded-sm px-1.5 py-1">
              Docs
            </Link>
            <a href="https://github.com/Samyra312007/RealDoor" target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-ink/50 transition-colors hover:text-ink/70 brass-glow rounded-sm px-1.5 py-1">
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main>
        <HeroSection onCreateSession={handleStart} loading={sessionLoading} />
        <TrustRow />
        <ReceiptDivider />
        <HowItWorks />
        <GuardrailsPanel />
      </main>
    </div>
  );
}
