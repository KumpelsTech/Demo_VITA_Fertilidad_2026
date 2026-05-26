import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  Pill,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  GitBranch,
  Snowflake,
  Activity,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { runMockAction, notify } from "@/lib/mock-actions";

export const Route = createFileRoute("/smart-prescriptions")({
  component: SmartPrescriptionsPage,
  head: () => ({
    meta: [
      { title: "Smart Prescriptions — Kumpels Core" },
      { name: "description", content: "Context-aware prescribing engine connected to inventory, procedures and patient follow-up." },
    ],
  }),
});

function SmartPrescriptionsPage() {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [selectedLot, setSelectedLot] = useState("LT-9120");

  const handleSend = async () => {
    if (sent) return;
    await runMockAction("Sending prescription", {
      detail: "Validating inventory · creating tasks · scheduling WhatsApp",
      success: "Prescription sent · cascade triggered",
    });
    setSent(true);
    setTimeout(() => navigate({ to: "/fertility-cases/$caseId", params: { caseId: "FC-2031" } }), 900);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
            <Send className="size-3" /> Clinical
          </div>
          <h1 className="text-xl font-semibold tracking-tight mt-1">Smart prescriptions</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Prescribe inside a fertility case · the system validates inventory, reserves lots, and orchestrates patient follow-up.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/fertility-cases" className="h-9 px-3 rounded-md bg-secondary hover:bg-accent text-foreground hover:text-primary text-[12px] font-medium inline-flex items-center gap-1.5">
            <GitBranch className="size-3.5" /> Pick a different case
          </Link>
          <button
            disabled={sent}
            onClick={handleSend}
            className={cn(
              "h-9 px-3 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5",
              sent ? "bg-success/10 text-success cursor-default" : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            <Send className="size-3.5" /> {sent ? "Sent · opening case" : "Send prescription"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN: composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case context */}
          <section className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Prescribing for</p>
                <h2 className="text-[15px] font-semibold mt-0.5">Sarah K. Thompson · FC-2031</h2>
                <p className="text-[11px] text-muted-foreground">Long Agonist IVF · Cycle Day 12 · Trigger phase</p>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent text-primary">In stim</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <Stat label="Age" value="34" />
              <Stat label="AMH" value="2.4 ng/mL" />
              <Stat label="Follicles ≥17mm" value="14" tone="success" />
              <Stat label="E2" value="2,840 pg/mL" />
              <Stat label="BMI" value="22.1" />
              <Stat label="Endometrium" value="9.1 mm" tone="success" />
              <Stat label="Allergies" value="None" />
              <Stat label="Last response" value="Normal" />
            </div>
          </section>

          {/* Composer */}
          <section className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold">New prescription</h3>
                <p className="text-[11px] text-muted-foreground">All fields validated against inventory and protocol</p>
              </div>
              <button
                onClick={() => notify("Protocol template applied", "Antagonist · Day 12 trigger")}
                className="text-[11px] text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                <Sparkles className="size-3" /> Use protocol template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Medication" value="Ovidrel (choriogonadotropin alfa) 250mcg" />
              <Field label="Route" value="Subcutaneous" />
              <Field label="Dose" value="1 prefilled syringe" />
              <Field label="Frequency" value="Single administration" />
              <Field label="Duration" value="One-time" />
              <Field label="Admin time" value="21:45 tonight (T-36h before OPU)" highlight />
              <Field label="Treatment stage" value="Trigger" />
              <Field label="Linked procedure" value="OPU · May 23 · 09:00 OR-4" />
            </div>

            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Patient instructions</p>
              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-[12px] text-foreground/85 leading-relaxed">
                Apply Ovidrel <span className="font-semibold text-primary">at exactly 21:45 tonight</span>. Timing is critical — every 30 minutes
                of delay shifts your retrieval window. Confirm administration on WhatsApp once done.
              </div>
            </div>
          </section>

          {/* Inventory validation — the key integration */}
          <section className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-primary" />
                <h3 className="text-[14px] font-semibold">Inventory validation</h3>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/10 text-success inline-flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Available
              </span>
            </div>

            <div className="space-y-2">
              {[
                { lot: "LT-9120", item: "Ovidrel 250mcg PFS", loc: "Cold Storage A · 4°C", exp: "Exp 11/2026", qty: "6 available", suggested: true },
                { lot: "LT-9088", item: "Ovidrel 250mcg PFS", loc: "Pharmacy B", exp: "Exp 04/2026", qty: "2 available" },
                { lot: "LT-9201", item: "Ovidrel 250mcg PFS", loc: "Cold Storage C · 4°C", exp: "Exp 01/2027", qty: "3 available" },
              ].map((l) => (
                <LotRow
                  key={l.lot}
                  {...l}
                  primary={selectedLot === l.lot}
                  onSelect={() => {
                    setSelectedLot(l.lot);
                    notify(`${l.lot} reserved`, `${l.item} · ${l.loc}`);
                  }}
                />
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <CheckLine ok label="FEFO suggestion · LT-9120 (closest expiry first)" />
              <CheckLine ok label="Cold chain verified · last sensor reading 4.1°C @ 14:02" />
              <CheckLine ok label="Stock reservation will be created on send" />
              <CheckLine ok label="Pharmacy prep task auto-created · assigned to A. Ortiz" />
              <CheckLine warn label="Stock falls to 5u after dispense — restock suggested by Friday" />
            </div>
          </section>
        </div>

        {/* SIDE: live preview of orchestration */}
        <div className="space-y-6">
          {/* AI clinical co-pilot */}
          <div className="rounded-xl border border-accent bg-gradient-to-br from-accent/70 to-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
                <Sparkles className="size-3.5" />
              </div>
              <h3 className="text-[13px] font-semibold">Clinical co-pilot</h3>
            </div>
            <ul className="space-y-2.5 text-[12px] text-foreground/85 leading-snug">
              <li className="flex gap-2"><span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> 14 follicles ≥17mm — recommended trigger window 36h before OPU.</li>
              <li className="flex gap-2"><span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Consider adding Cabergoline 0.5mg post-OPU to reduce OHSS risk.</li>
              <li className="flex gap-2"><span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> No interaction with active progesterone support.</li>
            </ul>
          </div>

          {/* What this prescription will trigger */}
          <section className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-[13px] font-semibold mb-3">When you send, this happens</h3>
            <ol className="space-y-3 relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
              <CascadeStep icon={Package} title="Inventory reserved" subtitle="LT-9120 · 1u locked to FC-2031" />
              <CascadeStep icon={Activity} title="Pharmacy task created" subtitle="Dispense by 18:00 · A. Ortiz" />
              <CascadeStep icon={Send} title="WhatsApp scheduled" subtitle="Reminder 21:30 · countdown 21:45" />
              <CascadeStep icon={Clock} title="Countdown started on case" subtitle="Auto-escalate if not confirmed by 22:15" />
              <CascadeStep icon={Snowflake} title="OR-4 readiness sync" subtitle="Lab notified of T-36h trigger" />
            </ol>
          </section>

          {/* Recent rx for this case */}
          <section className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold">Active for this case</h3>
              <Link to="/fertility-cases/$caseId" params={{ caseId: "FC-2031" }} className="text-[11px] text-primary font-medium hover:underline inline-flex items-center gap-0.5">
                Open case <ChevronRight className="size-3" />
              </Link>
            </div>
            <div className="space-y-2 text-[11px]">
              <ActiveRx med="Gonal-F 225 IU" status="ok" meta="08:00 daily · day 10 of stim" />
              <ActiveRx med="Cetrotide 0.25mg" status="ok" meta="Until trigger" />
              <ActiveRx med="Folic acid 5mg" status="ok" meta="Daily · continuous" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="rounded-md bg-secondary/40 border border-border p-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn("text-[12px] font-semibold mt-0.5 tabular-nums", tone === "success" && "text-success")}>{value}</p>
    </div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{label}</p>
      <div className={cn(
        "h-9 px-3 rounded-md border bg-card flex items-center text-[12px] font-medium",
        highlight ? "border-primary/40 bg-accent/40 text-primary" : "border-border text-foreground",
      )}>
        {value}
      </div>
    </div>
  );
}

function LotRow({
  lot, item, loc, exp, qty, primary, suggested, onSelect,
}: {
  lot: string; item: string; loc: string; exp: string; qty: string; primary?: boolean; suggested?: boolean; onSelect?: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border",
      primary ? "border-primary/30 bg-accent/30" : "border-border bg-secondary/30",
    )}>
      <div className="size-8 rounded-md bg-card border border-border flex items-center justify-center shrink-0">
        <Package className="size-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] font-semibold font-mono">{lot}</span>
          <span className="text-[11px] text-muted-foreground">· {item}</span>
          {suggested && <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">FEFO</span>}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{loc} · {exp} · {qty}</p>
      </div>
      <button
        onClick={onSelect}
        className={cn(
        "text-[11px] font-medium h-7 px-2.5 rounded-md shrink-0",
        primary ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-accent",
      )}
      >
        {primary ? "Reserved" : "Use this"}
      </button>
    </div>
  );
}

function CheckLine({ ok, warn, label }: { ok?: boolean; warn?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      {ok && <CheckCircle2 className="size-3.5 text-success shrink-0" />}
      {warn && <AlertTriangle className="size-3.5 text-warning shrink-0" />}
      <span className={cn(ok && "text-foreground/80", warn && "text-warning")}>{label}</span>
    </div>
  );
}

function CascadeStep({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) {
  return (
    <li className="relative flex gap-3 pl-0">
      <div className="size-6 rounded-full bg-card border border-border flex items-center justify-center shrink-0 z-10">
        <Icon className="size-3 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-[12px] font-medium leading-tight">{title}</p>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
    </li>
  );
}

function ActiveRx({ med, status, meta }: { med: string; status: "ok" | "warn"; meta: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Pill className="size-3 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold truncate">{med}</p>
          <p className="text-[10px] text-muted-foreground truncate">{meta}</p>
        </div>
      </div>
      <span className={cn(
        "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
        status === "ok" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
      )}>
        {status === "ok" ? "Active" : "Pending"}
      </span>
    </div>
  );
}