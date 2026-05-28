import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  X,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { notify } from "@/lib/mock-actions";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/alerts")({
  component: AlertsPage,
});

type AlertSeverity = "critical" | "warning" | "info" | string;

type AlertStatus =
  | "ACTIVE"
  | "ACKNOWLEDGED"
  | "RESOLVED"
  | "DISMISSED"
  | string
  | null;

type AlertRow = {
  id: string;
  clinic_id: string | null;
  fertility_case_id: string | null;
  alert_type: string | null;
  severity: AlertSeverity | null;
  title: string | null;
  description: string | null;
  status: AlertStatus;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string | null;
  resolved_at: string | null;
};

function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<
    "all" | "critical" | "warning" | "info"
  >("all");

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("alerts")
      .select(`
        id,
        clinic_id,
        fertility_case_id,
        alert_type,
        severity,
        title,
        description,
        status,
        related_entity_type,
        related_entity_id,
        created_at,
        resolved_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading alerts:", error);
      notify("Error", error.message || "No se pudieron cargar las alertas.");
      setAlerts([]);
      setLoading(false);
      return;
    }

    setAlerts((data ?? []) as AlertRow[]);
    setLoading(false);
  }

  async function dismissAlert(alert: AlertRow) {
    setWorkingId(alert.id);

    const { error } = await supabase
      .from("alerts")
      .update({
        status: "DISMISSED",
      })
      .eq("id", alert.id);

    if (error) {
      console.error("Error dismissing alert:", error);
      notify("Error", error.message || "No se pudo descartar la alerta.");
      setWorkingId(null);
      return;
    }

    notify("Alert dismissed", alert.title ?? "Alert");
    setWorkingId(null);
    await loadAlerts();
  }

  async function resolveAlert(alert: AlertRow) {
    setWorkingId(alert.id);

    const now = timestampWithoutTimezone(new Date());

    const { error } = await supabase
      .from("alerts")
      .update({
        status: "RESOLVED",
        resolved_at: now,
      })
      .eq("id", alert.id);

    if (error) {
      console.error("Error resolving alert:", error);
      notify("Error", error.message || "No se pudo resolver la alerta.");
      setWorkingId(null);
      return;
    }

    notify("Alert resolved", alert.title ?? "Alert");
    setWorkingId(null);
    await loadAlerts();
  }

  async function acknowledgeAll() {
    const activeIds = visibleAlerts
      .filter((alert) => !isClosedAlert(alert))
      .map((alert) => alert.id);

    if (activeIds.length === 0) {
      notify("No alerts", "No hay alertas activas para reconocer.");
      return;
    }

    setWorkingId("acknowledge-all");

    const { error } = await supabase
      .from("alerts")
      .update({
        status: "ACKNOWLEDGED",
      })
      .in("id", activeIds);

    if (error) {
      console.error("Error acknowledging alerts:", error);
      notify("Error", error.message || "No se pudieron reconocer las alertas.");
      setWorkingId(null);
      return;
    }

    notify("All alerts acknowledged", `${activeIds.length} alerta(s) actualizadas.`);
    setWorkingId(null);
    await loadAlerts();
  }

  const activeAlerts = useMemo(() => {
    return alerts.filter((alert) => !isClosedAlert(alert));
  }, [alerts]);

  const visibleAlerts = useMemo(() => {
    return activeAlerts.filter((alert) => {
      if (severityFilter === "all") return true;

      return normalizeSeverity(alert.severity) === severityFilter;
    });
  }, [activeAlerts, severityFilter]);

  const counts = useMemo(() => {
    return {
      total: activeAlerts.length,
      critical: activeAlerts.filter(
        (alert) => normalizeSeverity(alert.severity) === "critical",
      ).length,
      warning: activeAlerts.filter(
        (alert) => normalizeSeverity(alert.severity) === "warning",
      ).length,
      info: activeAlerts.filter(
        (alert) => normalizeSeverity(alert.severity) === "info",
      ).length,
    };
  }, [activeAlerts]);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Alerts</h1>

          <p className="text-[13px] text-muted-foreground mt-1">
            Alertas operativas conectadas a la tabla alerts.
          </p>

          <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
            <span>Total: {counts.total}</span>
            <span>·</span>
            <span>Critical: {counts.critical}</span>
            <span>·</span>
            <span>Warning: {counts.warning}</span>
            <span>·</span>
            <span>Info: {counts.info}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAlerts}
            disabled={loading}
            className="text-[12px] font-medium px-3 h-8 rounded-md border border-border bg-card hover:bg-secondary inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Refresh
          </button>

          {activeAlerts.length > 0 && (
            <button
              onClick={acknowledgeAll}
              disabled={workingId === "acknowledge-all"}
              className="text-[12px] font-medium px-3 h-8 rounded-md bg-secondary hover:bg-accent hover:text-primary inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="size-3.5" />
              Acknowledge all
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "critical", "warning", "info"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setSeverityFilter(filter)}
            className={cn(
              "h-8 px-3 rounded-md text-[11.5px] font-medium border transition-colors",
              severityFilter === filter
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:bg-secondary",
            )}
          >
            {filter === "all" ? "All" : filter[0].toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm font-medium">Loading alerts...</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              Consultando la tabla alerts.
            </p>
          </div>
        )}

        {!loading && visibleAlerts.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="text-sm font-medium">All clear</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              No hay alertas activas para este filtro.
            </p>
          </div>
        )}

        {!loading &&
          visibleAlerts.map((alert) => {
            const severity = normalizeSeverity(alert.severity);
            const isWorking = workingId === alert.id;

            return (
              <div
                key={alert.id}
                className={cn(
                  "bg-card border rounded-xl p-4 transition-all hover:shadow-sm",
                  severity === "critical" && "border-critical/20",
                  severity === "warning" && "border-warning/20",
                  severity === "info" && "border-border",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "size-8 rounded-lg flex items-center justify-center shrink-0",
                      severity === "critical" && "bg-critical/10",
                      severity === "warning" && "bg-warning/10",
                      severity === "info" && "bg-accent",
                    )}
                  >
                    {severity === "critical" && (
                      <AlertTriangle className="size-4 text-critical" />
                    )}

                    {severity === "warning" && (
                      <AlertCircle className="size-4 text-warning" />
                    )}

                    {severity === "info" && (
                      <Info className="size-4 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <h3 className="text-[13px] font-semibold text-foreground">
                          {alert.title ?? "Untitled alert"}
                        </h3>

                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <AlertBadge severity={severity} />

                          {alert.alert_type && (
                            <span className="text-[10px] rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                              {alert.alert_type}
                            </span>
                          )}

                          {alert.status && (
                            <span className="text-[10px] rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                              {alert.status}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1 shrink-0">
                        <Clock className="size-3" />
                        {formatRelativeOrDate(alert.created_at)}
                      </span>
                    </div>

                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                      {alert.description ?? "Sin descripción."}
                    </p>

                    {(alert.related_entity_type || alert.related_entity_id) && (
                      <p className="text-[10.5px] text-muted-foreground mt-2">
                        Related: {alert.related_entity_type ?? "-"}{" "}
                        {alert.related_entity_id ? (
                          <span className="font-mono">
                            {alert.related_entity_id}
                          </span>
                        ) : null}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => resolveAlert(alert)}
                        disabled={isWorking}
                        className="text-[11px] font-medium px-2.5 h-7 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="size-3" />
                        Resolve
                      </button>

                      <button
                        onClick={() => dismissAlert(alert)}
                        disabled={isWorking}
                        className="text-[11px] font-medium px-2.5 h-7 rounded-md bg-secondary hover:bg-accent text-foreground hover:text-primary inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <X className="size-3" />
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function normalizeSeverity(severity: string | null | undefined) {
  const normalized = String(severity ?? "info").toLowerCase();

  if (normalized === "critical") return "critical";
  if (normalized === "warning") return "warning";
  return "info";
}

function isClosedAlert(alert: AlertRow) {
  const status = String(alert.status ?? "ACTIVE").toUpperCase();

  return (
    status === "RESOLVED" ||
    status === "DISMISSED" ||
    Boolean(alert.resolved_at)
  );
}

function AlertBadge({ severity }: { severity: "critical" | "warning" | "info" }) {
  return (
    <span
      className={cn(
        "text-[10px] rounded-full px-2 py-0.5 font-medium",
        severity === "critical" && "bg-critical/10 text-critical",
        severity === "warning" && "bg-warning/10 text-warning",
        severity === "info" && "bg-primary/10 text-primary",
      )}
    >
      {severity.toUpperCase()}
    </span>
  );
}

function timestampWithoutTimezone(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatRelativeOrDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} h ago`;
  if (diffDays < 7) return `${diffDays} d ago`;

  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}