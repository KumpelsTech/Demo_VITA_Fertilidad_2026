import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, Sparkles, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/treatment-journeys")({
  component: TreatmentJourneysPage,
});

const STAGES = ["Consult", "Stim", "Trigger", "Retrieval", "Embryo", "Transfer", "Follow-up"];

const journeys = [
  {
    id: "P-2903",
    patient: "Sarah K. Thompson",
    protocol: "Long Agonist IVF",
    progress: 2.5,
    risk: "medium" as const,
    next: "Ovidrel trigger · tonight 21:45",
    ai: "On-track. Follicles ≥17mm: 14. Expect retrieval May 23.",
  },
  {
    id: "P-3102",
    patient: "Maria L. Rodriguez",
    protocol: "Antagonist IVF",
    progress: 1.5,
    risk: "low" as const,
    next: "Stim scan · tomorrow 09:00",
    ai: "E2 rising normally. No protocol change suggested.",
  },
  {
    id: "P-2841",
    patient: "Jennifer M. Chen",
    protocol: "Long Agonist IVF",
    progress: 4.5,
    risk: "high" as const,
    next: "PGT-A results · review needed",
    ai: "2 embryos developing slower than baseline. Consider extended culture.",
  },
  {
    id: "P-3045",
    patient: "Amanda Clarke",
    protocol: "FET",
    progress: 6,
    risk: "low" as const,
    next: "βhCG · May 28",
    ai: "Cycle complete. Auto-follow-up scheduled.",
  },
];

function TreatmentJourneysPage() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Treatment journeys</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Pipeline of all active cycles · milestone-driven
          </p>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          {["All", "At risk", "This week", "Long Agonist", "Antagonist", "FET"].map((f, i) => (
            <button
              key={f}
              className={cn(
                "px-2.5 h-7 rounded-md transition-colors",
                i === 0
                  ? "bg-accent text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {journeys.map((j) => (
          <Link
            to="/patients/$patientId"
            params={{ patientId: j.id }}
            key={j.id}
            className="block bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-full bg-accent text-primary flex items-center justify-center text-[12px] font-semibold shrink-0">
                  {j.patient
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold tracking-tight truncate">{j.patient}</h3>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {j.id} · {j.protocol}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <RiskBadge risk={j.risk} />
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </div>

            {/* Stages */}
            <div className="relative">
              <div className="absolute left-0 right-0 top-3 h-px bg-border" />
              <div
                className="absolute left-0 top-[10px] h-[3px] bg-primary rounded-full"
                style={{ width: `${(j.progress / STAGES.length) * 100}%` }}
              />
              <div className="relative grid grid-cols-7 gap-1">
                {STAGES.map((label, i) => {
                  const done = i < Math.floor(j.progress);
                  const active = i === Math.floor(j.progress);
                  return (
                    <div key={label} className="flex flex-col items-center">
                      <div
                        className={cn(
                          "size-6 rounded-full flex items-center justify-center ring-4 ring-card",
                          done && "bg-primary text-primary-foreground",
                          active && "bg-card border-2 border-primary",
                          !done && !active && "bg-card border border-border",
                        )}
                      >
                        {done && <CheckCircle2 className="size-3" />}
                        {active && <span className="size-1.5 rounded-full bg-primary" />}
                      </div>
                      <span
                        className={cn(
                          "mt-1.5 text-[10px] font-medium",
                          active
                            ? "text-primary"
                            : done
                              ? "text-foreground/70"
                              : "text-muted-foreground",
                        )}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-[12px]">
                <Clock className="size-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Next:</span>
                <span className="font-medium text-foreground">{j.next}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-foreground/70">
                <Sparkles className="size-3 text-primary" />
                <span>{j.ai}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: "low" | "medium" | "high" }) {
  if (risk === "low") {
    return (
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
        On track
      </span>
    );
  }
  if (risk === "medium") {
    return (
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent text-primary">
        Monitor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-warning/10 text-warning">
      <AlertTriangle className="size-3" /> Needs review
    </span>
  );
}
