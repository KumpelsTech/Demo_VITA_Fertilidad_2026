import { createFileRoute } from "@tanstack/react-router";
import { Pill, Clock, AlertTriangle, CheckCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/medication-pharmacy")({
  component: MedicationPharmacyPage,
});

const medications = [
  {
    name: "Ovidrel 250mcg",
    type: "Trigger Injection",
    patient: "Sarah K. Thompson",
    due: "21:45",
    countdown: "04h 32m",
    status: "pending" as const,
    critical: true,
  },
  {
    name: "Gonal-F 900IU",
    type: "Stimulation",
    patient: "Maria L. Rodriguez",
    due: "20:00",
    countdown: "02h 47m",
    status: "pending" as const,
    critical: false,
  },
  {
    name: "Cetrotide 0.25mg",
    type: "Antagonist",
    patient: "Maria L. Rodriguez",
    due: "08:00",
    countdown: "—",
    status: "confirmed" as const,
    critical: false,
  },
  {
    name: "Progesterone 200mg",
    type: "Luteal Support",
    patient: "Jennifer M. Chen",
    due: "22:00",
    countdown: "05h 12m",
    status: "pending" as const,
    critical: false,
  },
];

const inventory = [
  { name: "Gonal-F 900IU", stock: 4, threshold: 10, unit: "vials" },
  { name: "Ovidrel 250mcg", stock: 12, threshold: 5, unit: "syringes" },
  { name: "Cetrotide 0.25mg", stock: 24, threshold: 10, unit: "vials" },
  { name: "Progesterone 200mg", stock: 48, threshold: 20, unit: "capsules" },
];

function MedicationPharmacyPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Medication & Pharmacy</h1>
          <p className="text-sm text-muted-foreground mt-1">Prescription tracking, adherence, and inventory</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medication Schedule */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Clock className="size-3.5" /> Today's Medication Schedule
          </h3>
          <div className="space-y-3">
            {medications.map((med) => (
              <div key={med.name + med.patient} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center gap-3">
                  <div className={cn("size-8 rounded-md flex items-center justify-center", med.critical ? "bg-critical/10" : "bg-primary/10")}>
                    <Pill className={cn("size-4", med.critical ? "text-critical" : "text-primary")} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{med.name}</p>
                    <p className="text-[10px] text-muted-foreground">{med.patient} &bull; {med.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-xs font-mono font-bold", med.critical && "text-critical")}>
                    {med.countdown}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Due {med.due}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Package className="size-3.5" /> Pharmacy Inventory
          </h3>
          <div className="space-y-3">
            {inventory.map((item) => {
              const low = item.stock <= item.threshold;
              return (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                  <div>
                    <p className="text-xs font-semibold">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.unit}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full", low ? "bg-critical" : "bg-success")}
                          style={{ width: `${Math.min((item.stock / item.threshold) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={cn("text-xs font-mono font-bold", low && "text-critical")}>
                        {item.stock}
                      </span>
                    </div>
                    {low && (
                      <p className="text-[10px] text-critical font-bold mt-0.5">Below threshold</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
