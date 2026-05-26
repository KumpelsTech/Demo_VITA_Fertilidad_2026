import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, AlertCircle, Info, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { runMockAction, notify } from "@/lib/mock-actions";

export const Route = createFileRoute("/alerts")({
  component: AlertsPage,
});

const initialAlerts = [
  { severity: "critical" as const, title: "Trigger Missed Confirmation", body: "C. Miller (Cycle #822) has not confirmed trigger injection.", time: "5 min ago" },
  { severity: "warning" as const, title: "Low Stock: Gonal-F", body: "Central Pharmacy stock below threshold (4 units remaining).", time: "12 min ago" },
  { severity: "info" as const, title: "Missing Consent", body: "Patient #FL-3102 lacks signed embryo storage consent for tomorrow.", time: "1 hour ago" },
  { severity: "critical" as const, title: "Lab Temperature Deviation", body: "Incubator T-04 temperature exceeded safe range for 3 minutes.", time: "2 hours ago" },
  { severity: "warning" as const, title: "Delayed Follow-up", body: "Patient #P-2841 follow-up call was scheduled for yesterday.", time: "3 hours ago" },
  { severity: "info" as const, title: "New Donor Application", body: "Donor #D-1156 has submitted pre-screening questionnaire.", time: "5 hours ago" },
];

function AlertsPage() {
  const [alerts, setAlerts] = useState(initialAlerts);

  const dismiss = (title: string) => {
    setAlerts((a) => a.filter((x) => x.title !== title));
    notify("Alert dismissed", title);
  };

  const resolve = async (title: string) => {
    await runMockAction(`Resolving · ${title}`, { success: "Alert resolved" });
    setAlerts((a) => a.filter((x) => x.title !== title));
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Alerts</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Centralized intelligent alerts and escalations</p>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={() => {
              setAlerts([]);
              notify("All alerts acknowledged");
            }}
            className="text-[12px] font-medium px-3 h-8 rounded-md bg-secondary hover:bg-accent hover:text-primary"
          >
            Acknowledge all
          </button>
        )}
      </div>

      <div className="space-y-3">
        {alerts.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="text-sm font-medium">All clear</p>
            <p className="text-[12px] text-muted-foreground mt-1">No active alerts in the queue.</p>
          </div>
        )}
        {alerts.map((alert) => (
          <div
            key={alert.title}
            className={cn(
              "bg-card border rounded-xl p-4 transition-all hover:shadow-sm",
              alert.severity === "critical" && "border-critical/20",
              alert.severity === "warning" && "border-warning/20",
              alert.severity === "info" && "border-border"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "size-8 rounded-lg flex items-center justify-center shrink-0",
                alert.severity === "critical" && "bg-critical/10",
                alert.severity === "warning" && "bg-warning/10",
                alert.severity === "info" && "bg-accent"
              )}>
                {alert.severity === "critical" && <AlertTriangle className="size-4 text-critical" />}
                {alert.severity === "warning" && <AlertCircle className="size-4 text-warning" />}
                {alert.severity === "info" && <Info className="size-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[13px] font-semibold text-foreground">{alert.title}</h3>
                  <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1 shrink-0">
                    <Clock className="size-3" /> {alert.time}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{alert.body}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => resolve(alert.title)}
                    className="text-[11px] font-medium px-2.5 h-7 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => dismiss(alert.title)}
                    className="text-[11px] font-medium px-2.5 h-7 rounded-md bg-secondary hover:bg-accent text-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    <X className="size-3" /> Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
