import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Clock, CheckCircle, Circle, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/procedures")({
  component: ProceduresPage,
});

const today = [
  {
    time: "09:00",
    procedure: "OPU — Sarah J.",
    room: "Room 4",
    status: "in-progress" as const,
    type: "OPU",
  },
  {
    time: "10:15",
    procedure: "ET — Maria L.",
    room: "Room 2",
    status: "scheduled" as const,
    type: "ET",
  },
  {
    time: "11:30",
    procedure: "OPU — Sofia P.",
    room: "Room 4",
    status: "scheduled" as const,
    type: "OPU",
  },
  {
    time: "14:00",
    procedure: "FET — Amanda C.",
    room: "Room 2",
    status: "scheduled" as const,
    type: "FET",
  },
];

const tomorrow = [
  {
    time: "08:30",
    procedure: "OPU — Jennifer C.",
    room: "Room 4",
    status: "scheduled" as const,
    type: "OPU",
  },
  {
    time: "11:00",
    procedure: "ET — Elena R.",
    room: "Room 2",
    status: "scheduled" as const,
    type: "ET",
  },
];

function ProceduresPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Procedures</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Operating room schedule and procedure coordination
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProcedureCard title="Today" date="June 20, 2024" procedures={today} />
        <ProcedureCard title="Tomorrow" date="June 21, 2024" procedures={tomorrow} />
      </div>
    </div>
  );
}

function ProcedureCard({
  title,
  date,
  procedures,
}: {
  title: string;
  date: string;
  procedures: typeof today;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          {title}
        </h3>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
      <div className="space-y-3">
        {procedures.map((proc) => (
          <div
            key={proc.procedure}
            className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
          >
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-muted-foreground w-10">{proc.time}</span>
              <div>
                <span className="text-xs font-medium">{proc.procedure}</span>
                <span className="text-[10px] text-muted-foreground ml-2">{proc.room}</span>
              </div>
            </div>
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded font-bold",
                proc.status === "in-progress" && "bg-clinical/10 text-clinical",
                proc.status === "scheduled" && "bg-muted text-muted-foreground",
              )}
            >
              {proc.status === "in-progress" ? "In Progress" : "Scheduled"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
