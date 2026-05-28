import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Package,
  Snowflake,
  MapPin,
  Thermometer,
  AlertTriangle,
  ShieldAlert,
  ScanLine,
  Activity,
  Calendar,
  User,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LOTS, MOVEMENTS, lotStatusColor, movementMeta } from "@/lib/inventory-data";

export const Route = createFileRoute("/inventory/lots/$lotId")({
  loader: ({ params }) => {
    const lot = LOTS.find((l) => l.id === params.lotId);
    if (!lot) throw notFound();
    return { lot };
  },
  component: LotDetailPage,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p className="text-sm text-muted-foreground">Lot not found.</p>
      <Link
        to="/inventory"
        className="text-primary text-sm font-medium hover:underline mt-2 inline-block"
      >
        Back to inventory
      </Link>
    </div>
  ),
});

function LotDetailPage() {
  const { lot } = Route.useLoaderData();
  const movements = MOVEMENTS.filter((m) => m.lotId === lot.id);

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6">
      {/* Header */}
      <Link
        to="/inventory"
        className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-3" /> Inventory
      </Link>
      <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "size-12 rounded-lg flex items-center justify-center shrink-0",
              lot.status === "expired" || lot.status === "blocked"
                ? "bg-critical/10"
                : lot.status === "quarantined"
                  ? "bg-warning/10"
                  : "bg-accent",
            )}
          >
            <Package
              className={cn(
                "size-6",
                lot.status === "expired" || lot.status === "blocked"
                  ? "text-critical"
                  : lot.status === "quarantined"
                    ? "text-warning"
                    : "text-primary",
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-muted-foreground">{lot.id}</span>
              <span
                className={cn(
                  "inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border",
                  lotStatusColor(lot.status),
                )}
              >
                {lot.status}
              </span>
              {lot.coldChain && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-accent px-2 py-0.5 rounded">
                  <Snowflake className="size-3" /> Cold chain
                </span>
              )}
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight">{lot.product}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {lot.category} · MFR lot {lot.manufacturerLot} · {lot.supplier}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-3 text-xs font-medium rounded-md border border-border bg-card hover:bg-secondary inline-flex items-center gap-1.5">
            <ScanLine className="size-3.5" /> Scan label
          </button>
          <button className="h-9 px-3 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
            Register movement
          </button>
        </div>
      </div>

      {/* Alerts */}
      {lot.invimaAlert && (
        <div className="rounded-xl border border-critical/30 bg-critical/5 p-4 mb-6 flex items-start gap-3">
          <ShieldAlert className="size-4 text-critical shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-critical uppercase tracking-wider">
              Regulatory alert
            </p>
            <p className="text-sm text-foreground mt-1">{lot.invimaAlert}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Lot was automatically blocked. 0 patients impacted to date. Quality team review in
              progress.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Stock breakdown */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Stock allocation
            </h3>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <Stat label="Total" value={lot.total} unit={lot.unit} tone="neutral" />
              <Stat label="Available" value={lot.available} unit={lot.unit} tone="success" />
              <Stat label="Reserved" value={lot.reserved} unit={lot.unit} tone="primary" />
              <Stat label="Consumed" value={lot.consumed} unit={lot.unit} tone="neutral" />
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div
                className="bg-success h-full"
                style={{ width: `${(lot.available / lot.total) * 100}%` }}
              />
              <div
                className="bg-primary h-full"
                style={{ width: `${(lot.reserved / lot.total) * 100}%` }}
              />
              <div
                className="bg-muted-foreground/50 h-full"
                style={{ width: `${(lot.consumed / lot.total) * 100}%` }}
              />
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-success" /> Available
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-primary" /> Reserved
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-muted-foreground/50" /> Consumed
              </span>
            </div>
          </div>

          {/* AI insight */}
          <div className="rounded-xl border border-border bg-gradient-to-br from-accent/40 to-card p-5">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="size-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
                  Kumpels AI
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {lot.daysToExpiry < 0
                    ? `This lot expired ${Math.abs(lot.daysToExpiry)} days ago. Pending approval to destroy and update consumption forecast.`
                    : lot.daysToExpiry <= 60
                      ? `Expires in ${lot.daysToExpiry} days. FEFO will route this lot to the next ${lot.reserved || 4} procedures before alternatives.`
                      : `Healthy lot. Projected consumption matches reservation pattern — no action needed.`}
                </p>
              </div>
            </div>
          </div>

          {/* Chain of custody */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity className="size-3.5" /> Chain of custody
              </h3>
              <span className="text-[10px] text-muted-foreground">{movements.length} events</span>
            </div>
            <ol className="relative px-5 py-5 space-y-5">
              {movements.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No movements recorded for this lot yet.
                </p>
              )}
              {movements.map((mv, i) => {
                const meta = movementMeta(mv.type);
                return (
                  <li key={mv.id} className="relative pl-6">
                    <span
                      className={cn(
                        "absolute left-0 top-1.5 size-3 rounded-full border-2 border-card",
                        meta.tone === "success" && "bg-success",
                        meta.tone === "warning" && "bg-warning",
                        meta.tone === "critical" && "bg-critical",
                        meta.tone === "primary" && "bg-primary",
                        meta.tone === "neutral" && "bg-muted-foreground",
                      )}
                    />
                    {i < movements.length - 1 && (
                      <span className="absolute left-[5px] top-5 bottom-[-1.25rem] w-px bg-border" />
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{meta.label}</span>
                      <span>·</span>
                      <span>{mv.ts}</span>
                      <span className="ml-auto font-mono">{mv.id}</span>
                    </div>
                    <p className="text-xs text-foreground mt-1">
                      <span className="font-semibold">
                        {mv.quantity} {mv.unit}
                      </span>{" "}
                      · {mv.from} → {mv.to}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <User className="size-3" /> {mv.user}
                      </span>
                      {mv.patient && <span>· patient {mv.patient}</span>}
                      {mv.procedure && <span>· {mv.procedure}</span>}
                    </p>
                    {mv.reason && (
                      <p className="text-[11px] text-warning mt-1 flex items-center gap-1">
                        <AlertTriangle className="size-3" /> {mv.reason}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Lot identity
            </h3>
            <dl className="space-y-3 text-xs">
              <Row label="Internal ID" value={lot.id} mono />
              <Row label="Manufacturer lot" value={lot.manufacturerLot} mono />
              <Row label="Supplier" value={lot.supplier} />
              <Row label="Manufactured" value={lot.manufactured} mono />
              <Row
                label="Expiry"
                value={lot.expiry}
                mono
                accent={lot.daysToExpiry < 60 ? "warning" : undefined}
              />
              <Row label="Unit cost" value={`$${lot.cost}`} mono />
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Location
            </h3>
            <div className="flex items-start gap-2 mb-3">
              <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{lot.location}</p>
                <p className="text-[11px] text-muted-foreground">{lot.locationPath}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-border">
              <Thermometer className="size-4 text-primary" />
              <span className="text-xs">{lot.tempRequirement}</span>
              {lot.coldChain && <Snowflake className="size-3.5 text-primary ml-auto" />}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Quick actions
            </h3>
            <div className="space-y-1.5">
              {[
                "Reserve for procedure",
                "Transfer to location",
                "Open quality review",
                "Request destruction",
              ].map((a) => (
                <button
                  key={a}
                  className="w-full flex items-center justify-between px-3 h-9 text-xs font-medium rounded-md hover:bg-secondary text-left transition-colors"
                >
                  {a}
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  tone: "neutral" | "primary" | "success";
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-xl font-semibold mt-1 tabular-nums",
          tone === "success" && "text-success",
          tone === "primary" && "text-primary",
        )}
      >
        {value}
        <span className="text-[10px] font-normal text-muted-foreground ml-1">{unit}</span>
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: "warning";
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "font-medium text-right",
          mono && "font-mono",
          accent === "warning" && "text-warning",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
