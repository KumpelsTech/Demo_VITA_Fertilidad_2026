import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  AlertTriangle,
  Clock,
  Pill,
  FileSignature,
  Package,
  FlaskConical,
  MessageCircle,
  ArrowUpRight,
  CheckCircle2,
  Activity,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { runMockAction, notify } from "@/lib/mock-actions";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

const kpis = [
  { label: "Active treatments", value: "142", delta: "+12", trend: "up" as const, foot: "vs. last week" },
  { label: "Procedures today", value: "11", delta: "4 OPU · 5 ET · 2 FET", trend: "flat" as const },
  { label: "Embryo dev (D3+)", value: "86%", delta: "Optimal range", trend: "up" as const },
  { label: "Inventory alerts", value: "3", delta: "Gonal-F low", trend: "warn" as const },
];

const priorityQueue = [
  {
    id: "trigger-miller",
    severity: "critical" as const,
    icon: Pill,
    title: "Trigger missed confirmation",
    meta: "Carmen Miller · FC-1980 · 5m overdue",
    action: "Escalate",
    route: "/patient-followup" as const,
  },
  {
    id: "gonal-f",
    severity: "warning" as const,
    icon: Package,
    title: "Gonal-F 900IU below threshold",
    meta: "Pharmacy A · 4 vials · affects 3 cases",
    action: "Restock",
    route: "/inventory" as const,
  },
  {
    id: "consent-park",
    severity: "warning" as const,
    icon: FileSignature,
    title: "Missing consent before procedure",
    meta: "Sofia Park · FC-2018 · FET tomorrow 09:00",
    action: "Send WhatsApp",
    route: "/consents" as const,
  },
  {
    id: "pgta",
    severity: "info" as const,
    icon: FlaskConical,
    title: "PGT-A results received",
    meta: "8 embryos · FC-2031 · ready for review",
    action: "Review",
    route: "/laboratory-gamete-bank" as const,
  },
  {
    id: "msgs",
    severity: "info" as const,
    icon: MessageCircle,
    title: "3 unread patient messages",
    meta: "Oldest 47m · Sarah K., Elena R., Jennifer C.",
    action: "Open",
    route: "/communications" as const,
  },
];

const stages = [
  { label: "Baseline", short: "BL", status: "done" as const, when: "Day 1" },
  { label: "Stimulation", short: "ST", status: "done" as const, when: "Day 2–9" },
  { label: "Trigger", short: "TR", status: "active" as const, when: "Day 10 · tonight" },
  { label: "Retrieval", short: "RT", status: "next" as const, when: "Day 12" },
  { label: "Embryo Dev", short: "ED", status: "pending" as const, when: "D12–17" },
  { label: "Transfer", short: "TX", status: "pending" as const, when: "Day 17" },
  { label: "Follow-up", short: "FU", status: "pending" as const, when: "+14d" },
];

const procedures = [
  { time: "09:00", title: "OPU · Sarah J.", room: "OR 4", status: "in-progress" as const },
  { time: "10:15", title: "ET · Maria L.", room: "OR 2", status: "scheduled" as const },
  { time: "11:30", title: "OPU · Sofia P.", room: "OR 4", status: "scheduled" as const },
  { time: "14:00", title: "FET · Amanda C.", room: "OR 2", status: "scheduled" as const },
];

function DashboardPage() {
  const navigate = useNavigate();
  const [triggerConfirmed, setTriggerConfirmed] = useState(false);
  const [taskDone, setTaskDone] = useState<Record<string, boolean>>({});

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Greeting + AI brief */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground font-medium">Thursday, May 21</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-0.5">
            Good morning, Dr. Vance
          </h1>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-accent/70 border border-accent px-4 py-2.5 max-w-xl">
          <div className="size-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" />
          </div>
          <p className="text-[12px] leading-snug text-foreground/80">
            <span className="font-semibold text-primary">Today's brief:</span> 11 procedures scheduled,
            1 trigger needs confirmation in 4h, and Gonal-F stock will block 3 cycles by Friday.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <button
              key={k.label}
              onClick={() => {
                const map: Record<string, string> = {
                  "Active treatments": "/fertility-cases",
                  "Procedures today": "/procedures",
                  "Embryo dev (D3+)": "/laboratory-gamete-bank",
                  "Inventory alerts": "/inventory",
                };
                notify(`Opening ${k.label.toLowerCase()}`);
                navigate({ to: map[k.label] ?? "/" });
              }}
              className="text-left bg-card rounded-xl border border-border p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
            >
            <p className="text-[11px] font-medium text-muted-foreground">{k.label}</p>
            <p className="text-[28px] font-semibold tracking-tight text-foreground mt-1 leading-none">
              {k.value}
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              {k.trend === "up" && <TrendingUp className="size-3 text-success" />}
              {k.trend === "warn" && <AlertTriangle className="size-3 text-warning" />}
              {k.trend === "flat" && <Activity className="size-3 text-muted-foreground" />}
              <span className={cn(
                "text-[11px] font-medium",
                k.trend === "up" && "text-success",
                k.trend === "warn" && "text-warning",
                k.trend === "flat" && "text-muted-foreground",
              )}>
                {k.delta}
              </span>
              {k.foot && <span className="text-[11px] text-muted-foreground">· {k.foot}</span>}
            </div>
            </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priority queue */}
          <Section
            title="Priority queue"
            kicker="What needs you in the next hours"
            action={<Link to="/alerts" className="text-[12px] font-medium text-primary hover:underline inline-flex items-center gap-1">View all <ChevronRight className="size-3" /></Link>}
          >
            <div className="divide-y divide-border">
              {priorityQueue.map((item) => (
                <div
                  key={item.title}
                  onClick={() => navigate({ to: item.route })}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 group cursor-pointer hover:bg-secondary/40 -mx-2 px-2 rounded-md transition-colors"
                >
                  <div className={cn(
                    "size-8 rounded-lg flex items-center justify-center shrink-0",
                    item.severity === "critical" && "bg-critical/10 text-critical",
                    item.severity === "warning" && "bg-warning/10 text-warning",
                    item.severity === "info" && "bg-accent text-primary",
                  )}>
                    <item.icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.meta}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      runMockAction(`${item.action} · ${item.title}`, {
                        detail: item.meta,
                        success: `${item.action} completed`,
                      });
                    }}
                    className={cn(
                    "text-[11px] font-medium px-2.5 h-7 rounded-md transition-colors shrink-0",
                    item.severity === "critical"
                      ? "bg-critical text-white hover:bg-critical/90"
                      : "bg-secondary hover:bg-accent text-foreground hover:text-primary",
                  )}>
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* Featured patient journey */}
          <Section
            title="Sarah K. Thompson"
            kicker="FC-2031 · Long Agonist IVF · Day 12 · Trigger phase"
            action={
              <Link to="/fertility-cases/$caseId" params={{ caseId: "FC-2031" }} className="text-[12px] font-medium text-primary hover:underline inline-flex items-center gap-1">
                Open case <ArrowUpRight className="size-3" />
              </Link>
            }
          >
            {/* Timeline */}
            <div className="relative pt-2 pb-1">
              <div className="absolute left-0 right-0 top-[18px] h-px bg-border" />
              <div
                className="absolute left-0 top-[17px] h-[3px] bg-primary rounded-full"
                style={{ width: `${(2.5 / stages.length) * 100}%` }}
              />
              <div className="relative grid grid-cols-7 gap-1">
                {stages.map((s) => (
                  <div key={s.label} className="flex flex-col items-center text-center">
                    <div className={cn(
                      "size-9 rounded-full flex items-center justify-center text-[11px] font-semibold ring-4 ring-card transition-colors",
                      s.status === "done" && "bg-primary text-primary-foreground",
                      s.status === "active" && "bg-card border-2 border-primary text-primary",
                      s.status === "next" && "bg-accent text-primary border border-accent",
                      s.status === "pending" && "bg-card border border-border text-muted-foreground",
                    )}>
                      {s.status === "done" ? <CheckCircle2 className="size-4" /> : s.short}
                    </div>
                    <p className={cn(
                      "mt-2 text-[11px] font-medium",
                      s.status === "active" ? "text-primary" : "text-foreground/70",
                      s.status === "pending" && "text-muted-foreground",
                    )}>
                      {s.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{s.when}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trigger callout */}
            <div className="mt-5 rounded-xl border border-accent bg-accent/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-card border border-border flex items-center justify-center">
                  <Pill className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Ovidrel 250mcg · Trigger</p>
                  <p className="text-[11px] text-muted-foreground">Administer at exactly 21:45 · auto-reminder sent via WhatsApp</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-mono font-semibold text-primary tracking-tight tabular-nums">04:32:15</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">until trigger</p>
                </div>
                <button
                  disabled={triggerConfirmed}
                  onClick={() => {
                    setTriggerConfirmed(true);
                    runMockAction("Sending WhatsApp confirmation request", {
                      detail: "Sarah K. Thompson · Ovidrel 250mcg @ 21:45",
                      success: "Trigger confirmation requested",
                    });
                  }}
                  className={cn(
                    "h-9 px-3 rounded-md text-[12px] font-medium transition-colors",
                    triggerConfirmed
                      ? "bg-success/10 text-success cursor-default"
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {triggerConfirmed ? "✓ Sent" : "Confirm"}
                </button>
              </div>
            </div>
          </Section>

          {/* Procedures + Lab */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section title="Today's procedures" kicker="OR schedule · 4 of 11">
              <div className="space-y-1">
                {procedures.map((p) => (
                  <div key={p.title} className="flex items-center gap-3 py-1.5">
                    <span className="text-[11px] font-mono text-muted-foreground w-12 tabular-nums">{p.time}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate">{p.title}</p>
                      <p className="text-[10px] text-muted-foreground">{p.room}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full",
                      p.status === "in-progress" ? "bg-accent text-primary" : "bg-secondary text-muted-foreground",
                    )}>
                      {p.status === "in-progress" ? "In progress" : "Scheduled"}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Lab pulse" kicker="Real-time embryology">
              <div className="space-y-3">
                <LabRow tone="success" label="8 embryos ready for PGT-A" />
                <LabRow tone="muted" label="No pending vitrifications" />
                <LabRow tone="warning" label="2 devitrifications scheduled today" />
                <LabRow tone="success" label="Incubator occupancy 84%" />
              </div>
            </Section>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* AI assistant */}
          <div className="rounded-xl border border-border bg-gradient-to-br from-accent/70 via-card to-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
                <Sparkles className="size-3.5" />
              </div>
              <h3 className="text-[13px] font-semibold">Kumpels AI · Suggestions</h3>
            </div>
            <ul className="space-y-2.5">
              {[
                "Reschedule Sofia P. consent reminder to 18:00 — higher response rate",
                "Batch order Gonal-F before Friday to avoid stim disruption",
                "Auto-draft follow-up for J. Chen — embryo D3 update ready",
              ].map((tip) => (
                <li key={tip} className="flex gap-2 text-[12px] text-foreground/80 leading-snug">
                  <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
            <button
              onClick={() => runMockAction("Applying AI suggestions", {
                detail: "3 actions queued · audit trail recorded",
                success: "3 AI suggestions applied",
              })}
              className="mt-4 w-full h-8 rounded-md bg-card border border-border text-[12px] font-medium hover:bg-secondary transition-colors"
            >
              Apply all
            </button>
          </div>

          {/* Communications */}
          <Section
            title="Patient comms"
            kicker="WhatsApp · 3 unread"
            action={<Link to="/communications" className="text-[12px] font-medium text-primary hover:underline">Open</Link>}
          >
            <div className="space-y-3">
              {[
                { name: "Sarah K.", msg: "Can I take prenatal vitamins with Ovidrel?", t: "15:02", unread: true },
                { name: "Maria L.", msg: "Thank you for the reminder!", t: "09:05", unread: false },
                { name: "Jennifer C.", msg: "When can we schedule the transfer?", t: "Yest", unread: false },
              ].map((m) => (
                <div key={m.name} className="flex items-start gap-3">
                  <div className="size-8 rounded-full bg-accent text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">
                    {m.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold">{m.name}</p>
                      <span className="text-[10px] text-muted-foreground">{m.t}</span>
                    </div>
                    <p className={cn("text-[11px] truncate", m.unread ? "text-foreground" : "text-muted-foreground")}>
                      {m.msg}
                    </p>
                  </div>
                  {m.unread && <span className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />}
                </div>
              ))}
            </div>
          </Section>

          {/* Tasks */}
          <Section
            title="Operational queue"
            kicker="4 open"
            action={<Link to="/tasks" className="text-[12px] font-medium text-primary hover:underline">View</Link>}
          >
            <div className="space-y-2">
              {[
                { t: "Confirm lab prep · Retrieval #402", who: "Lab", p: "urgent" },
                { t: "Verify Ovidrel 250mcg stock", who: "Pharmacy", p: "high" },
                { t: "Sign consent — J. Miller", who: "Coordinator", p: "medium" },
                { t: "Update donor screening results", who: "Quality", p: "low" },
              ].map((task) => (
                <div key={task.t} className="flex items-center gap-3 py-1.5">
                  <button
                    onClick={() => {
                      const done = !taskDone[task.t];
                      setTaskDone((s) => ({ ...s, [task.t]: done }));
                      if (done) notify("Task completed", task.t);
                    }}
                    className={cn(
                      "size-4 rounded border-[1.5px] flex items-center justify-center transition-colors shrink-0",
                      taskDone[task.t]
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border hover:border-primary",
                    )}
                  >
                    {taskDone[task.t] && <CheckCircle2 className="size-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[12px] font-medium truncate",
                      taskDone[task.t] && "line-through text-muted-foreground",
                    )}>{task.t}</p>
                    <p className="text-[10px] text-muted-foreground">{task.who}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium",
                    task.p === "urgent" && "text-critical",
                    task.p === "high" && "text-warning",
                    task.p === "medium" && "text-primary",
                    task.p === "low" && "text-muted-foreground",
                  )}>
                    {task.p}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
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
          <h2 className="text-[14px] font-semibold tracking-tight text-foreground">{title}</h2>
          {kicker && <p className="text-[11px] text-muted-foreground mt-0.5">{kicker}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function LabRow({ tone, label }: { tone: "success" | "warning" | "muted"; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn(
        "size-1.5 rounded-full",
        tone === "success" && "bg-success",
        tone === "warning" && "bg-warning",
        tone === "muted" && "bg-border",
      )} />
      <span className={cn("text-[12px]", tone === "muted" ? "text-muted-foreground" : "text-foreground")}>
        {label}
      </span>
    </div>
  );
}