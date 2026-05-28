import { createFileRoute } from "@tanstack/react-router";
import { Heart, Filter, ChevronRight, CheckCircle, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/donors")({
  component: DonorsPage,
});

const donors = [
  {
    id: "D-1042",
    name: "Donor #1042",
    stage: "Active",
    age: 24,
    type: "Oocyte",
    cycles: 3,
    exams: "Complete",
    applied: "2023-08-12",
  },
  {
    id: "D-1089",
    name: "Donor #1089",
    stage: "Pre-screened",
    age: 26,
    type: "Sperm",
    cycles: 0,
    exams: "Pending",
    applied: "2024-01-15",
  },
  {
    id: "D-1123",
    name: "Donor #1123",
    stage: "Interviewed",
    age: 22,
    type: "Oocyte",
    cycles: 0,
    exams: "Scheduled",
    applied: "2024-03-02",
  },
  {
    id: "D-1056",
    name: "Donor #1056",
    stage: "Approved",
    age: 25,
    type: "Oocyte",
    cycles: 1,
    exams: "Complete",
    applied: "2023-11-20",
  },
];

const stages = [
  "Applied",
  "Pre-screened",
  "Contacted",
  "Interviewed",
  "Exams",
  "Approved",
  "Active",
  "Archived",
];

function DonorsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Donor Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            CRM-style workflow for donor screening and management
          </p>
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Donor Pipeline
        </h3>
        <div className="relative flex items-center justify-between">
          <div className="absolute h-0.5 bg-muted left-0 right-0 top-3" />
          {stages.map((stage) => (
            <div key={stage} className="relative flex flex-col items-center gap-2 z-10">
              <div className="size-6 rounded-full bg-card border border-border flex items-center justify-center text-[8px] text-muted-foreground font-bold">
                {stage.charAt(0)}
              </div>
              <span className="text-[9px] font-bold text-muted-foreground">{stage}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Donor List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="py-3 px-4 font-semibold text-muted-foreground">Donor</th>
                <th className="py-3 px-4 font-semibold text-muted-foreground">Stage</th>
                <th className="py-3 px-4 font-semibold text-muted-foreground">Type</th>
                <th className="py-3 px-4 font-semibold text-muted-foreground">Age</th>
                <th className="py-3 px-4 font-semibold text-muted-foreground">Cycles</th>
                <th className="py-3 px-4 font-semibold text-muted-foreground">Exams</th>
                <th className="py-3 px-4 font-semibold text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {donors.map((donor) => (
                <tr
                  key={donor.id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {donor.id.split("-")[1]}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{donor.name}</p>
                        <p className="text-[10px] text-muted-foreground">Applied {donor.applied}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success">
                      {donor.stage}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{donor.type}</td>
                  <td className="py-3 px-4 text-muted-foreground">{donor.age}</td>
                  <td className="py-3 px-4 text-muted-foreground">{donor.cycles}</td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "text-[10px] font-bold",
                        donor.exams === "Complete" && "text-success",
                        donor.exams === "Pending" && "text-warning",
                        donor.exams === "Scheduled" && "text-clinical",
                      )}
                    >
                      {donor.exams}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
