import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GitBranch,
  Sparkles,
  AlertTriangle,
  Snowflake,
  Heart,
  Users,
  ChevronRight,
  Filter,
  Plus,
  FlaskConical,
  Baby,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fertility-cases")({
  component: FertilityCasesPage,
  head: () => ({
    meta: [
      { title: "Fertility Cases — Kumpels Core" },
      { name: "description", content: "Case-centric workspace orchestrating patients, donors, gametes, prescriptions, and procedures." },
    ],
  }),
});

type CaseRow = {
  id: string;
  title: string;
  type: string;
  stage: string;
  protocol: string;
  day: number;
  parties: { intended: string[]; donors?: string[]; surrogate?: string };
  embryos: number;
  oocytes: number;
  risk: "low" | "medium" | "high";
  next: string;
  ai: string;
};

const cases: CaseRow[] = [
  {
    id: "FC-2031",
    title: "Thompson · Owen",
    type: "IVF · own gametes",
    stage: "Trigger",
    protocol: "Long Agonist",
    day: 12,
    parties: { intended: ["Sarah K. Thompson", "Michael Owen"] },
    embryos: 0,
    oocytes: 0,
    risk: "medium",
    next: "Ovidrel · tonight 21:45",
    ai: "14 follicles ≥17mm. On track for OPU May 23.",
  },
  {
    id: "FC-2018",
    title: "Chen · Park",
    type: "ICSI · donor sperm",
    stage: "Embryo dev",
    protocol: "Antagonist",
    day: 17,
    parties: { intended: ["Jennifer M. Chen", "Sofia Park"], donors: ["DS-118"] },
    embryos: 4,
    oocytes: 11,
    risk: "high",
    next: "PGT-A review · pending biopsy results",
    ai: "2 embryos slower than baseline. Consider extended culture.",
  },
  {
    id: "FC-2002",
    title: "Rodriguez Family",
    type: "Surrogacy · donor eggs",
    stage: "FET prep",
    protocol: "FET (programmed)",
    day: 8,
    parties: { intended: ["Maria L. Rodriguez", "Daniel Rodriguez"], donors: ["DE-204"], surrogate: "G. Alvarez" },
    embryos: 2,
    oocytes: 0,
    risk: "medium",
    next: "Endometrium scan · May 24",
    ai: "Surrogate endometrium 7.4mm. Estradiol optimal.",
  },
  {
    id: "FC-1994",
    title: "Clarke",
    type: "Egg preservation",
    stage: "Follow-up",
    protocol: "Antagonist",
    day: 32,
    parties: { intended: ["Amanda Clarke"] },
    embryos: 0,
    oocytes: 14,
    risk: "low",
    next: "Annual storage renewal · auto",
    ai: "14 oocytes vitrified · tank T-04 / CAN-A.",
  },
  {
    id: "FC-1986",
    title: "Miller · Hayes",
    type: "FET · own embryos",
    stage: "βhCG",
    protocol: "Natural FET",
    day: 28,
    parties: { intended: ["Elena Miller", "Jordan Hayes"] },
    embryos: 1,
    oocytes: 0,
    risk: "low",
    next: "βhCG result · May 28",
    ai: "Single 5AA embryo transferred · luteal support active.",
  },
];

const STAGE_ORDER = ["Consult", "Baseline", "Stim", "Trigger", "Retrieval", "Embryo dev", "FET prep", "Transfer", "βhCG", "Follow-up"];

function FertilityCasesPage() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
            <GitBranch className="size-3" /> Operations
          </div>
          <h1 className="text-xl font-semibold tracking-tight mt-1">Fertility cases</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            The central workspace · every patient, donor, gamete, embryo and procedure orchestrated as one journey.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-3 rounded-md bg-secondary text-foreground text-[12px] font-medium inline-flex items-center gap-1.5 hover:bg-accent hover:text-primary">
            <Filter className="size-3.5" /> Filters
          </button>
          <button className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-medium inline-flex items-center gap-1.5 hover:bg-primary/90">
            <Plus className="size-3.5" /> New case
          </button>
        </div>
      </header>

      {/* AI brief */}
      <div className="rounded-xl border border-accent bg-accent/50 p-4 flex gap-3">
        <div className="size-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Sparkles className="size-3.5" />
        </div>
        <div className="flex-1">
          <p className="text-[12px] text-foreground/85 leading-relaxed">
            <span className="font-semibold text-primary">5 active cases · 2 need decisions today.</span> FC-2018 has slower D3 embryos — extended culture suggested.
            FC-2031 trigger countdown started · WhatsApp reminder dispatched. FC-2002 surrogate ready for transfer window in 4 days.
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Active cases" value="42" foot="+3 this week" />
        <KpiCard label="In stim" value="11" foot="6 antagonist · 5 long" />
        <KpiCard label="Embryos in culture" value="28" foot="D3+ optimal 86%" />
        <KpiCard label="Pending consents" value="4" foot="2 before tomorrow's OR" tone="warn" />
      </div>

      <div className="space-y-3">
        {cases.map((c) => (
          <CaseCard key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}

function CaseCard({ c }: { c: CaseRow }) {
  const stageIdx = STAGE_ORDER.indexOf(c.stage);
  return (
    <Link
      to="/fertility-cases/$caseId"
      params={{ caseId: c.id }}
      className="block bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="size-10 rounded-lg bg-accent text-primary flex items-center justify-center shrink-0">
            <GitBranch className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[14px] font-semibold tracking-tight">{c.title}</h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{c.id}</span>
              <RiskBadge risk={c.risk} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {c.type} · {c.protocol} · Day {c.day}
            </p>

            {/* Parties chips */}
            <div className="flex items-center flex-wrap gap-1.5 mt-2.5">
              {c.parties.intended.map((n) => (
                <Chip key={n} icon={Users} label={n} tone="primary" />
              ))}
              {c.parties.donors?.map((d) => (
                <Chip key={d} icon={Heart} label={`Donor ${d}`} tone="muted" />
              ))}
              {c.parties.surrogate && <Chip icon={Baby} label={`Surrogate · ${c.parties.surrogate}`} tone="muted" />}
              {c.embryos > 0 && <Chip icon={Snowflake} label={`${c.embryos} embryo${c.embryos > 1 ? "s" : ""}`} tone="muted" />}
              {c.oocytes > 0 && <Chip icon={FlaskConical} label={`${c.oocytes} oocytes`} tone="muted" />}
            </div>
          </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground mt-1 shrink-0" />
      </div>

      {/* Stage rail */}
      <div className="mt-5 relative">
        <div className="absolute left-0 right-0 top-[5px] h-px bg-border" />
        <div
          className="absolute left-0 top-[3px] h-[3px] bg-primary rounded-full"
          style={{ width: `${((stageIdx + 0.5) / STAGE_ORDER.length) * 100}%` }}
        />
        <div className="relative grid grid-cols-10 gap-1">
          {STAGE_ORDER.map((label, i) => {
            const done = i < stageIdx;
            const active = i === stageIdx;
            return (
              <div key={label} className="flex flex-col items-center">
                <div className={cn(
                  "size-2.5 rounded-full ring-2 ring-card",
                  done && "bg-primary",
                  active && "bg-primary",
                  !done && !active && "bg-border",
                )} />
                <span className={cn(
                  "mt-1.5 text-[9px] truncate",
                  active ? "text-primary font-semibold" : "text-muted-foreground",
                )}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="text-[12px]">
          <span className="text-muted-foreground">Next: </span>
          <span className="font-medium">{c.next}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-foreground/70">
          <Sparkles className="size-3 text-primary" />
          <span>{c.ai}</span>
        </div>
      </div>
    </Link>
  );
}

function KpiCard({ label, value, foot, tone }: { label: string; value: string; foot: string; tone?: "warn" }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="text-[24px] font-semibold tracking-tight mt-1 leading-none">{value}</p>
      <p className={cn("text-[11px] mt-2", tone === "warn" ? "text-warning" : "text-muted-foreground")}>{foot}</p>
    </div>
  );
}

function Chip({ icon: Icon, label, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; tone: "primary" | "muted" }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
      tone === "primary" ? "bg-accent text-primary border-accent" : "bg-secondary text-foreground/70 border-transparent",
    )}>
      <Icon className="size-2.5" />
      {label}
    </span>
  );
}

function RiskBadge({ risk }: { risk: "low" | "medium" | "high" }) {
  if (risk === "low") return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-success/10 text-success">On track</span>;
  if (risk === "medium") return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent text-primary">Monitor</span>;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-warning/10 text-warning">
      <AlertTriangle className="size-2.5" /> Action
    </span>
  );
}