import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  HeartPulse,
  Sparkles,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Calendar,
  Send,
  ChevronRight,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { runMockAction, notify } from "@/lib/mock-actions";

export const Route = createFileRoute("/patient-followup")({
  component: PatientFollowupPage,
  head: () => ({
    meta: [
      { title: "Patient Follow-up — Kumpels Core" },
      { name: "description", content: "WhatsApp-first patient follow-up engine connected to prescriptions, procedures and fertility cases." },
    ],
  }),
});

const COUNTDOWNS = [
  { name: "Sarah K. Thompson", caseId: "FC-2031", med: "Ovidrel trigger", at: "21:45", remaining: "04:32:15", status: "pending" as const },
  { name: "Maria L. Rodriguez", caseId: "FC-2002", med: "Estradiol valerate", at: "08:00", remaining: "13:14:02", status: "scheduled" as const },
  { name: "Carmen Miller", caseId: "FC-1980", med: "Progesterone 200mg", at: "22:00", remaining: "OVERDUE 5m", status: "overdue" as const },
];

const FEED = [
  { who: "Sarah K.", caseId: "FC-2031", time: "15:02", text: "Quick question — ok to take prenatal vitamins together with Ovidrel?", tone: "question" as const, suggested: "Yes — prenatals don't interact with trigger. Take them as usual. The Ovidrel timing is the only one that needs to be exact." },
  { who: "Jennifer C.", caseId: "FC-2018", time: "14:48", text: "Confirmed progesterone ✅", tone: "ack" as const },
  { who: "Sofia P.", caseId: "FC-2018", time: "11:20", text: "Feeling some cramping — should I be worried?", tone: "concern" as const, suggested: "Mild cramping is common after embryo transfer. Rest, hydrate, and reach out if it's sharp, persistent, or with bleeding." },
  { who: "Amanda C.", caseId: "FC-1994", time: "09:00", text: "Storage renewal received, thank you!", tone: "ack" as const },
];

const GUIDANCE = [
  { stage: "Day 3 culture · FC-2018", title: "Your embryos are in Day 3 culture", body: "Next lab update expected tomorrow at 10:00. Rest well — no medication changes needed.", sent: "Sent · auto" },
  { stage: "Trigger · FC-2031", title: "Tonight matters", body: "Tonight at 21:45 you'll apply Ovidrel. We'll send a 15-min reminder. Procedure is on May 23 at 09:00.", sent: "Scheduled · 21:30" },
  { stage: "Post-OPU · FC-2018", title: "What to expect this week", body: "Some bloating and mild cramping is normal for 3–4 days. Drink fluids, avoid heavy lifting.", sent: "Sent · yesterday" },
];

function PatientFollowupPage() {
  const navigate = useNavigate();
  const [sentReplies, setSentReplies] = useState<Record<number, boolean>>({});

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
            <HeartPulse className="size-3" /> Clinical · Coordination
          </div>
          <h1 className="text-xl font-semibold tracking-tight mt-1">Patient follow-up</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            WhatsApp-first care coordination · medication timing, procedure prep, embryo updates and anxiety-reducing guidance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/communications" className="h-9 px-3 rounded-md bg-secondary text-foreground text-[12px] font-medium inline-flex items-center gap-1.5 hover:bg-accent hover:text-primary">
            <MessageCircle className="size-3.5" /> Open inbox
          </Link>
          <button
            onClick={() => runMockAction("Composer", { success: "Draft WhatsApp ready" })}
            className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-medium inline-flex items-center gap-1.5 hover:bg-primary/90"
          >
            <Send className="size-3.5" /> Compose
          </button>
        </div>
      </header>

      {/* AI brief */}
      <div className="rounded-xl border border-accent bg-accent/50 p-4 flex gap-3">
        <div className="size-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Sparkles className="size-3.5" />
        </div>
        <p className="text-[12px] text-foreground/85 leading-relaxed">
          <span className="font-semibold text-primary">3 patient questions, 1 overdue medication.</span> Carmen Miller's progesterone confirmation is 5 minutes overdue — auto-escalation to nurse triggered.
          2 AI-drafted replies ready for review · 8 follow-up cards scheduled for the next 24h.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Medication adherence" value="94%" foot="last 7 days" />
        <Kpi label="Open patient questions" value="3" foot="2 AI-drafted" />
        <Kpi label="Reminders scheduled (24h)" value="38" foot="9 critical" />
        <Kpi label="Overdue confirmations" value="1" foot="Carmen Miller" tone="warn" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN: countdowns + feed */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Critical medication countdowns" kicker="Time-sensitive doses · auto-escalate if missed">
            <div className="space-y-2">
              {COUNTDOWNS.map((c) => (
                <div key={c.name + c.at} className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  c.status === "overdue" ? "border-critical/30 bg-critical/5" : "border-border bg-secondary/30",
                )}>
                  <div className={cn(
                    "size-9 rounded-lg flex items-center justify-center shrink-0",
                    c.status === "overdue" ? "bg-critical/10 text-critical" : "bg-accent text-primary",
                  )}>
                    <Pill className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-semibold truncate">{c.med}</p>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{c.caseId}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {c.name} · scheduled {c.at}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "text-[13px] font-mono font-semibold tabular-nums",
                      c.status === "overdue" ? "text-critical" : "text-primary",
                    )}>
                      {c.remaining}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      {c.status === "overdue" ? "escalated" : "until dose"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (c.status === "overdue") {
                        runMockAction(`Calling ${c.name}`, { detail: "Auto-escalation to nurse", success: "Call connected" });
                      } else {
                        navigate({ to: "/fertility-cases/$caseId", params: { caseId: c.caseId } });
                      }
                    }}
                    className={cn(
                    "text-[11px] font-medium h-7 px-2.5 rounded-md shrink-0",
                    c.status === "overdue" ? "bg-critical text-white" : "bg-secondary hover:bg-accent hover:text-primary",
                  )}>
                    {c.status === "overdue" ? "Call" : "Open"}
                  </button>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Patient feed" kicker="WhatsApp · AI-drafted replies marked with ✨" action={<Link to="/communications" className="text-[12px] text-primary font-medium hover:underline">Open inbox</Link>}>
            <div className="space-y-3">
              {FEED.map((m, i) => (
                <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-full bg-accent text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">
                      {m.who.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[12px] font-semibold">{m.who}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{m.caseId}</span>
                        <span className="text-[10px] text-muted-foreground">· {m.time}</span>
                        {m.tone === "concern" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-warning/10 text-warning">
                            <AlertTriangle className="size-3" /> Needs attention
                          </span>
                        )}
                        {m.tone === "ack" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-success/10 text-success">
                            <CheckCircle2 className="size-3" /> Confirmed
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] mt-1.5">{m.text}</p>
                      {m.suggested && (
                        <div className="mt-2 rounded-md bg-accent/40 border border-accent p-2.5">
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">
                            <Sparkles className="size-3" /> AI-drafted reply
                          </div>
                          <p className="text-[11px] text-foreground/85 leading-relaxed">{m.suggested}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              disabled={sentReplies[i]}
                              onClick={async () => {
                                await runMockAction("Sending reply", { success: `Reply sent to ${m.who}` });
                                setSentReplies((s) => ({ ...s, [i]: true }));
                              }}
                              className={cn(
                                "h-6 px-2 rounded text-[10px] font-medium",
                                sentReplies[i] ? "bg-success/10 text-success" : "bg-primary text-primary-foreground hover:bg-primary/90",
                              )}
                            >
                              {sentReplies[i] ? "✓ Sent" : "Send"}
                            </button>
                            <button
                              onClick={() => navigate({ to: "/communications" })}
                              className="h-6 px-2 rounded text-[10px] font-medium bg-card border border-border hover:bg-secondary"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* SIDE: guidance + automation */}
        <div className="space-y-6">
          <Section title="Anxiety-reducing guidance" kicker="Auto-cards by stage">
            <div className="space-y-2">
              {GUIDANCE.map((g) => (
                <div key={g.title} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                    <Calendar className="size-2.5" /> {g.stage}
                  </div>
                  <p className="text-[12px] font-semibold mt-1">{g.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-1">{g.body}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{g.sent}</span>
                    <button
                      onClick={() => notify("Preview", g.title)}
                      className="text-[10px] font-medium text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      Preview <ChevronRight className="size-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Automation rules" kicker="Active triggers · case-aware">
            <RuleRow icon={Clock} title="Trigger reminder T-15m" subtitle="All cases in trigger phase" />
            <RuleRow icon={Bell} title="Escalate overdue dose" subtitle="After 10 min → nurse · 30 min → MD" />
            <RuleRow icon={Sparkles} title="Day 3 / Day 5 update card" subtitle="Auto-generated after lab grading" />
            <RuleRow icon={HeartPulse} title="βhCG result narrative" subtitle="Friendly, clinically accurate" />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title, kicker, action, children,
}: { title: string; kicker?: string; action?: React.ReactNode; children: React.ReactNode }) {
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

function Kpi({ label, value, foot, tone }: { label: string; value: string; foot: string; tone?: "warn" }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="text-[24px] font-semibold tracking-tight mt-1 leading-none">{value}</p>
      <p className={cn("text-[11px] mt-2", tone === "warn" ? "text-warning" : "text-muted-foreground")}>{foot}</p>
    </div>
  );
}

function RuleRow({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="size-7 rounded-md bg-accent text-primary flex items-center justify-center shrink-0">
        <Icon className="size-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold truncate">{title}</p>
        <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
      </div>
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-success/10 text-success shrink-0">On</span>
    </div>
  );
}