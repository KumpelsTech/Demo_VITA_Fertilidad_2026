import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Thermometer, CheckCircle, AlertCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/laboratory-gamete-bank")({
  component: LaboratoryGameteBankPage,
});

const embryos = [
  { id: "E-A12", patient: "Sarah K. Thompson", grade: "4AA", day: 5, status: "vitrified", tank: "T-04", canister: "CAN-A", straw: "C2" },
  { id: "E-B03", patient: "Jennifer M. Chen", grade: "4AB", day: 5, status: "vitrified", tank: "T-02", canister: "CAN-B", straw: "A1" },
  { id: "E-C07", patient: "Maria L. Rodriguez", grade: "3BB", day: 3, status: "culture", tank: "—", canister: "—", straw: "—" },
  { id: "E-D15", patient: "Sofia Park", grade: "5AA", day: 5, status: "vitrified", tank: "T-01", canister: "CAN-C", straw: "B3" },
];

const oocytes = [
  { id: "O-204", patient: "Sarah K. Thompson", count: 8, status: "vitrified", tank: "T-04", canister: "CAN-A", straw: "C2", witness: true },
  { id: "O-198", patient: "Jennifer M. Chen", count: 12, status: "vitrified", tank: "T-02", canister: "CAN-B", straw: "A1", witness: true },
];

function LaboratoryGameteBankPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Laboratory & Gamete Bank</h1>
          <p className="text-sm text-muted-foreground mt-1">Biological sample traceability and storage management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Embryo Tracking */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <FlaskConical className="size-3.5" /> Embryo Tracking
          </h3>
          <div className="space-y-3">
            {embryos.map((embryo) => (
              <div key={embryo.id} className="p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-clinical/10 text-clinical text-[10px] font-bold uppercase rounded">{embryo.id}</span>
                    <span className="text-[10px] text-muted-foreground">Day {embryo.day}</span>
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase", embryo.status === "vitrified" ? "text-success" : "text-warning")}>
                    {embryo.status}
                  </span>
                </div>
                <p className="text-xs font-medium mb-2">{embryo.patient}</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Grade</span>
                    <span className="font-mono font-bold text-foreground">{embryo.grade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location</span>
                    <span className="font-mono">{embryo.tank !== "—" ? `${embryo.tank} / ${embryo.canister}` : "—"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Oocyte Bank */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Thermometer className="size-3.5" /> Oocyte Bank
          </h3>
          <div className="space-y-3">
            {oocytes.map((oocyte) => (
              <div key={oocyte.id} className="p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 bg-clinical/10 text-clinical text-[10px] font-bold uppercase rounded">{oocyte.id}</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="size-3 text-success" />
                    <span className="text-[10px] text-success font-bold">Witnessed</span>
                  </div>
                </div>
                <p className="text-xs font-medium mb-2">{oocyte.patient}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 bg-card rounded border-l-4 border-clinical">
                    <span className="text-[10px] font-medium">Straw ID</span>
                    <span className="text-[10px] font-mono">#{oocyte.straw}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-card rounded border-l-4 border-clinical">
                    <span className="text-[10px] font-medium">Tank Location</span>
                    <span className="text-[10px] font-mono">{oocyte.tank} / {oocyte.canister} / {oocyte.straw}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-card rounded border-l-4 border-success">
                    <span className="text-[10px] font-medium">Oocyte Count</span>
                    <span className="text-[10px] font-mono font-bold">{oocyte.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
