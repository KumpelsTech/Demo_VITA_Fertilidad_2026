import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Sparkles,
  Users,
  Heart,
  Baby,
  Snowflake,
  FlaskConical,
  Pill,
  Package,
  MessageCircle,
  FileSignature,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Send,
  Bell,
  Thermometer,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fertility-cases_/$caseId")({
  component: CaseDetailPage,
});

const STAGES = [
  "Consult",
  "Baseline",
  "Stim",
  "Trigger",
  "Retrieval",
  "Embryo dev",
  "FET prep",
  "Transfer",
  "βhCG",
  "Follow-up",
];

function CaseDetailPage() {
  const { caseId } = Route.useParams();

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto space-y-6">
      <Link
        to="/fertility-cases"
        className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> All cases
      </Link>

      {/* Case header */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight">Chen · Park</h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {caseId}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent text-primary">
                Embryo dev · Day 17
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                <AlertTriangle className="size-3" /> Decision needed
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground mt-1">
              ICSI · donor sperm · Antagonist protocol · Dr. Elena Vance · opened Apr 28
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 px-3 rounded-md bg-secondary hover:bg-accent text-foreground hover:text-primary text-[12px] font-medium inline-flex items-center gap-1.5">
              <MessageCircle className="size-3.5" /> Message patient
            </button>
            <button className="h-9 px-3 rounded-md bg-secondary hover:bg-accent text-foreground hover:text-primary text-[12px] font-medium inline-flex items-center gap-1.5">
              <Send className="size-3.5" /> Prescribe
            </button>
            <button className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90">
              Schedule procedure
            </button>
          </div>
        </div>

        {/* AI summary */}
        <div className="mt-5 rounded-xl bg-accent/60 border border-accent p-3.5 flex gap-3">
          <div className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" />
          </div>
          <p className="text-[12px] text-foreground/85 leading-relaxed">
            <span className="font-semibold text-primary">AI summary · </span>
            11 oocytes retrieved · 9 mature · 4 fertilized via ICSI with donor DS-118 · 2 embryos
            developing slower than baseline. Consider extended culture to day 6. Luteal support
            active. No outstanding consents. Surrogate not assigned.
          </p>
        </div>

        {/* Stage rail */}
        <div className="mt-6 relative pt-2 pb-1">
          <div className="absolute left-0 right-0 top-[18px] h-px bg-border" />
          <div
            className="absolute left-0 top-[17px] h-[3px] bg-primary rounded-full"
            style={{ width: `${(5.5 / STAGES.length) * 100}%` }}
          />
          <div className="relative grid grid-cols-10 gap-1">
            {STAGES.map((label, i) => {
              const done = i < 5;
              const active = i === 5;
              return (
                <div key={label} className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      "size-9 rounded-full flex items-center justify-center text-[10px] font-semibold ring-4 ring-card",
                      done && "bg-primary text-primary-foreground",
                      active && "bg-card border-2 border-primary text-primary",
                      !done && !active && "bg-card border border-border text-muted-foreground",
                    )}
                  >
                    {done ? <CheckCircle2 className="size-3.5" /> : i + 1}
                  </div>
                  <p
                    className={cn(
                      "mt-1.5 text-[10px] font-medium leading-tight",
                      active
                        ? "text-primary"
                        : done
                          ? "text-foreground/70"
                          : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Relationship map */}
      <Section title="Relationship map" kicker="People, gametes and embryos in this case">
        <RelationshipMap />
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active prescriptions linked to inventory */}
          <Section
            title="Active prescriptions"
            kicker="Linked to inventory · live adherence"
            action={
              <Link
                to="/smart-prescriptions"
                className="text-[12px] font-medium text-primary hover:underline inline-flex items-center gap-0.5"
              >
                Prescribe <ChevronRight className="size-3" />
              </Link>
            }
          >
            <div className="space-y-2">
              <RxRow
                med="Progesterone 200mg vag."
                dose="3× daily"
                stage="Luteal"
                status="ok"
                lot="LT-9012 · exp 11/2026"
                adherence={96}
              />
              <RxRow
                med="Estradiol valerate 6mg"
                dose="Daily morning"
                stage="Endometrial prep"
                status="ok"
                lot="LT-8845 · exp 02/2027"
                adherence={100}
              />
              <RxRow
                med="Cabergoline 0.5mg"
                dose="Single"
                stage="Post-OPU"
                status="ok"
                lot="LT-8801 · exp 08/2026"
                adherence={100}
              />
              <RxRow
                med="Aspirin 100mg"
                dose="Daily"
                stage="Support"
                status="warn"
                lot="Pending dispense"
                adherence={0}
              />
            </div>
          </Section>

          {/* Case timeline — everything threaded */}
          <Section title="Case timeline" kicker="Every clinical and operational event">
            <Timeline />
          </Section>

          {/* Gametes & embryos */}
          <Section
            title="Biological inventory"
            kicker="Traceable from source to transfer"
            action={
              <Link
                to="/laboratory-gamete-bank"
                className="text-[12px] font-medium text-primary hover:underline"
              >
                Open lab
              </Link>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <BioCard
                kind="Oocytes"
                id="OC-FC2018-A"
                meta="11 retrieved · 9 MII"
                origin="Intended mother · J. Chen"
                where="Lab · IVF #4"
                status="In use"
                icon={FlaskConical}
              />
              <BioCard
                kind="Sperm"
                id="SP-DS118"
                meta="2 vials thawed"
                origin="Donor DS-118 · screened"
                where="Tank T-02 / CAN-B / A1"
                status="Witnessed"
                icon={ShieldCheck}
              />
              <BioCard
                kind="Embryo"
                id="E-FC2018-01"
                meta="Day 3 · 8-cell · Grade 1"
                origin="OC-FC2018-A · SP-DS118"
                where="Culture · Incubator 2"
                status="On track"
                icon={Snowflake}
              />
              <BioCard
                kind="Embryo"
                id="E-FC2018-02"
                meta="Day 3 · 6-cell · Grade 2"
                origin="OC-FC2018-A · SP-DS118"
                where="Culture · Incubator 2"
                status="Slow"
                icon={Snowflake}
                tone="warning"
              />
            </div>
          </Section>
        </div>

        {/* SIDE COLUMN */}
        <div className="space-y-6">
          <SidePanel title="Inventory reserved" icon={Package} action="View lots">
            <Row label="Ovidrel 250mcg" value="LT-9120 · 1u" tone="primary" />
            <Row label="Progesterone 200mg" value="LT-9012 · 18u" />
            <Row label="Estradiol valerate" value="LT-8845 · 30u" />
            <Row label="Embryo glue" value="LT-7720 · reserved" tone="success" />
          </SidePanel>

          <SidePanel title="Patient follow-up" icon={MessageCircle} action="Open chat">
            <FollowupRow
              time="2h ago"
              who="J. Chen"
              text="Confirmed evening progesterone ✅"
              tone="success"
            />
            <FollowupRow
              time="Today 09:12"
              who="System"
              text="Sent: Day 3 embryo update card"
              tone="muted"
            />
            <FollowupRow
              time="Yest"
              who="S. Park"
              text="Asked: ok to travel next week?"
              tone="warning"
            />
          </SidePanel>

          <SidePanel title="Consents" icon={FileSignature} action="All docs">
            <Row label="ICSI consent" value="Signed Apr 28" tone="success" />
            <Row label="Donor sperm use" value="Signed Apr 28" tone="success" />
            <Row label="Embryo storage" value="Pending signature" tone="warning" />
            <Row label="PGT-A consent" value="Signed May 2" tone="success" />
          </SidePanel>

          <SidePanel title="Alerts" icon={Bell} action="Manage">
            <Row label="Embryo dev slow" value="2 embryos · monitor" tone="warning" />
            <Row label="Cold chain Tank T-02" value="–195.8 °C · ok" tone="success" />
          </SidePanel>
        </div>
      </div>
    </div>
  );
}

function RelationshipMap() {
  return (
    <div className="relative rounded-xl border border-border bg-gradient-to-br from-accent/30 via-card to-card p-6 overflow-hidden">
      {/* SVG connectors */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-border"
              opacity="0.4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="relative grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
        {/* Column 1: People */}
        <div className="space-y-2 md:col-span-1">
          <Node icon={Users} title="J. Chen" subtitle="Intended mother" tone="primary" />
          <Node icon={Users} title="S. Park" subtitle="Intended partner" tone="primary" />
          <Node icon={Heart} title="DS-118" subtitle="Sperm donor" tone="muted" />
        </div>

        <Connector label="contributes" />

        {/* Column 3: Gametes */}
        <div className="space-y-2 md:col-span-1">
          <Node icon={FlaskConical} title="OC-FC2018-A" subtitle="9 MII oocytes" tone="clinical" />
          <Node icon={ShieldCheck} title="SP-DS118" subtitle="2 vials thawed" tone="clinical" />
        </div>

        <Connector label="fertilization · ICSI" />

        {/* Column 5: Embryos */}
        <div className="space-y-2 md:col-span-1">
          <Node icon={Snowflake} title="E-FC2018-01" subtitle="D3 · 8-cell" tone="success" />
          <Node icon={Snowflake} title="E-FC2018-02" subtitle="D3 · 6-cell" tone="warning" />
          <Node icon={Snowflake} title="+2 cleavage" subtitle="developing" tone="muted" />
        </div>
      </div>

      <div className="relative mt-5 pt-4 border-t border-border flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">Next step:</span>
        Embryo transfer planned for May 28 · 2 embryos eligible · 1 needs extended culture decision.
      </div>
    </div>
  );
}

function Node({
  icon: Icon,
  title,
  subtitle,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  tone: "primary" | "muted" | "clinical" | "success" | "warning";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2 shadow-sm",
        tone === "primary" && "border-accent",
        tone === "muted" && "border-border",
        tone === "clinical" && "border-accent",
        tone === "success" && "border-success/30",
        tone === "warning" && "border-warning/30",
      )}
    >
      <div
        className={cn(
          "size-7 rounded-md flex items-center justify-center shrink-0",
          tone === "primary" && "bg-accent text-primary",
          tone === "muted" && "bg-secondary text-muted-foreground",
          tone === "clinical" && "bg-accent text-primary",
          tone === "success" && "bg-success/10 text-success",
          tone === "warning" && "bg-warning/10 text-warning",
        )}
      >
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold truncate leading-tight">{title}</p>
        <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
      </div>
    </div>
  );
}

function Connector({ label }: { label: string }) {
  return (
    <div className="hidden md:flex flex-col items-center justify-center">
      <div className="w-full h-px bg-gradient-to-r from-border via-primary/40 to-border" />
      <span className="mt-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function Section({
  title,
  kicker,
  action,
  children,
}: {
  title: string;
  kicker?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-xl border border-border p-5">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight">{title}</h2>
          {kicker && <p className="text-[11px] text-muted-foreground mt-0.5">{kicker}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function RxRow({
  med,
  dose,
  stage,
  status,
  lot,
  adherence,
}: {
  med: string;
  dose: string;
  stage: string;
  status: "ok" | "warn";
  lot: string;
  adherence: number;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
      <div className="size-8 rounded-md bg-card border border-border flex items-center justify-center shrink-0">
        <Pill className="size-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[12px] font-semibold truncate">{med}</p>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-primary font-medium">
            {stage}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {dose} · {lot}
        </p>
      </div>
      <div className="hidden sm:flex flex-col items-end shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-20 rounded-full bg-border overflow-hidden">
            <div
              className={cn("h-full rounded-full", status === "ok" ? "bg-success" : "bg-warning")}
              style={{ width: `${adherence}%` }}
            />
          </div>
          <span
            className={cn(
              "text-[10px] font-mono tabular-nums font-semibold",
              status === "ok" ? "text-success" : "text-warning",
            )}
          >
            {adherence}%
          </span>
        </div>
        <span className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wider">
          adherence
        </span>
      </div>
    </div>
  );
}

function Timeline() {
  const events = [
    {
      time: "Today · 14:08",
      icon: Sparkles,
      title: "AI flagged 2 embryos as slow-growing",
      meta: "Recommendation: extended culture to D6",
      tone: "warning" as const,
    },
    {
      time: "Today · 09:00",
      icon: FlaskConical,
      title: "Day 3 embryo grading complete",
      meta: "Lab · 4 cleaving · 2 fast / 2 slow",
      tone: "info" as const,
    },
    {
      time: "Yest · 11:30",
      icon: Activity,
      title: "Fertilization check · 4/9 fertilized",
      meta: "ICSI with donor DS-118",
      tone: "success" as const,
    },
    {
      time: "May 19 · 08:45",
      icon: Activity,
      title: "OPU completed · 11 oocytes",
      meta: "OR-4 · Dr. Vance · Embryologist L. Reyes",
      tone: "success" as const,
    },
    {
      time: "May 18 · 21:45",
      icon: Pill,
      title: "Ovidrel trigger confirmed",
      meta: "Administered 21:47 · +2m vs plan",
      tone: "success" as const,
    },
    {
      time: "May 12",
      icon: FileSignature,
      title: "Donor sperm consent signed",
      meta: "Digital signature · vial reserved",
      tone: "muted" as const,
    },
    {
      time: "Apr 28",
      icon: Users,
      title: "Case opened · ICSI / donor sperm",
      meta: "Intended parents enrolled · plan v1",
      tone: "muted" as const,
    },
  ];

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
      <ul className="space-y-4">
        {events.map((e, i) => (
          <li key={i} className="relative flex gap-3">
            <div
              className={cn(
                "size-8 rounded-full border flex items-center justify-center shrink-0 bg-card z-10",
                e.tone === "success" && "border-success/30 text-success",
                e.tone === "info" && "border-accent text-primary bg-accent/40",
                e.tone === "warning" && "border-warning/30 text-warning",
                e.tone === "muted" && "border-border text-muted-foreground",
              )}
            >
              <e.icon className="size-3.5" />
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-medium">{e.title}</p>
                <span className="text-[10px] text-muted-foreground shrink-0">{e.time}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{e.meta}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BioCard({
  kind,
  id,
  meta,
  origin,
  where,
  status,
  icon: Icon,
  tone,
}: {
  kind: string;
  id: string;
  meta: string;
  origin: string;
  where: string;
  status: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "warning";
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-accent text-primary flex items-center justify-center">
            <Icon className="size-3.5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold leading-tight">{kind}</p>
            <p className="text-[10px] font-mono text-muted-foreground">{id}</p>
          </div>
        </div>
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            tone === "warning" ? "bg-warning/10 text-warning" : "bg-success/10 text-success",
          )}
        >
          {status}
        </span>
      </div>
      <p className="text-[11px] font-medium">{meta}</p>
      <p className="text-[10px] text-muted-foreground mt-1">
        <span className="text-foreground/70">From:</span> {origin}
      </p>
      <p className="text-[10px] text-muted-foreground">
        <span className="text-foreground/70">Location:</span> {where}
      </p>
    </div>
  );
}

function SidePanel({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="size-3.5 text-muted-foreground" />
          <h3 className="text-[12px] font-semibold">{title}</h3>
        </div>
        {action && (
          <button className="text-[11px] text-primary font-medium hover:underline inline-flex items-center gap-0.5">
            {action} <ChevronRight className="size-3" />
          </button>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning" | "primary";
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-medium tabular-nums text-right",
          !tone && "text-foreground",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "primary" && "text-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function FollowupRow({
  time,
  who,
  text,
  tone,
}: {
  time: string;
  who: string;
  text: string;
  tone: "success" | "muted" | "warning";
}) {
  return (
    <div className="flex items-start gap-2 text-[11px]">
      <span
        className={cn(
          "size-1.5 rounded-full mt-1.5 shrink-0",
          tone === "success" && "bg-success",
          tone === "muted" && "bg-border",
          tone === "warning" && "bg-warning",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">{who}</span>
          <span className="text-[10px] text-muted-foreground">{time}</span>
        </div>
        <p className="text-muted-foreground leading-snug">{text}</p>
      </div>
    </div>
  );
}
