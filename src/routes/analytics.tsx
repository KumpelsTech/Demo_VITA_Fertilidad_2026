import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, Sparkles, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

const metrics = [
  {
    label: "Clinical pregnancy rate",
    value: "61.4%",
    delta: "+3.2",
    up: true,
    foot: "Last 12 cycles",
  },
  { label: "Cycle cancellation", value: "4.1%", delta: "−1.0", up: true, foot: "Goal < 5%" },
  {
    label: "Avg. days to retrieval",
    value: "11.2",
    delta: "−0.8",
    up: true,
    foot: "Stim efficiency",
  },
  {
    label: "Medication adherence",
    value: "98.4%",
    delta: "+1.1",
    up: true,
    foot: "WhatsApp reminders",
  },
  { label: "Donor → matched", value: "42%", delta: "+5", up: true, foot: "Funnel conversion" },
  { label: "OR utilization", value: "84%", delta: "stable", up: false, foot: "Target 80–90%" },
];

const outcomes = [45, 52, 48, 55, 60, 58, 62, 59, 64, 61, 63, 61];

function AnalyticsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Operational intelligence</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Clinical outcomes, workflow efficiency, and adherence
          </p>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          {["7d", "30d", "90d", "12m", "YTD"].map((p, i) => (
            <button
              key={p}
              className={cn(
                "px-2.5 h-7 rounded-md transition-colors",
                i === 3
                  ? "bg-accent text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* AI insights */}
      <div className="rounded-xl border border-accent bg-gradient-to-br from-accent/60 to-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
            <Sparkles className="size-3.5" />
          </div>
          <h2 className="text-[13px] font-semibold">Kumpels insights · this period</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            "Long Agonist protocol shows 4.8pt higher CPR vs. Antagonist this quarter.",
            "Adherence drops 12% when reminders are sent before 09:00 — auto-shift?",
            "OR 4 is underused on Fridays — capacity for 3 additional OPUs.",
          ].map((t) => (
            <p key={t} className="text-[12px] text-foreground/80 leading-snug">
              {t}
            </p>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-[11px] font-medium text-muted-foreground">{m.label}</p>
            <div className="flex items-end gap-2 mt-2">
              <p className="text-[26px] font-semibold tracking-tight leading-none">{m.value}</p>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-[11px] font-medium pb-1",
                  m.up ? "text-success" : "text-muted-foreground",
                )}
              >
                {m.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {m.delta}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{m.foot}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-semibold">Clinical pregnancy rate</h3>
              <p className="text-[11px] text-muted-foreground">Trailing 12 months</p>
            </div>
            <button className="text-[11px] text-primary font-medium hover:underline inline-flex items-center gap-0.5">
              Drill in <ArrowUpRight className="size-3" />
            </button>
          </div>
          <div className="h-48 flex items-end gap-1.5">
            {outcomes.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end h-full group">
                <div
                  className="w-full bg-primary/15 rounded-t-sm relative"
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute inset-0 bg-primary rounded-t-sm opacity-90" />
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {h}%
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground tabular-nums">
            {[
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
            ].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-semibold">Pipeline distribution</h3>
              <p className="text-[11px] text-muted-foreground">200 patients across stages</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Consultation", count: 24, pct: 12 },
              { label: "Stimulation", count: 68, pct: 34 },
              { label: "Trigger / Retrieval", count: 32, pct: 16 },
              { label: "Embryo development", count: 28, pct: 14 },
              { label: "Transfer", count: 18, pct: 9 },
              { label: "Follow-up", count: 30, pct: 15 },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="font-medium">{s.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {s.count} · {s.pct}%
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${s.pct * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
