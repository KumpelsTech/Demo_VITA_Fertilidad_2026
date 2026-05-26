import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle, Clock, AlertCircle, Sparkles, MessageCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { runMockAction, notify } from "@/lib/mock-actions";

export const Route = createFileRoute("/consents")({
  component: ConsentsPage,
});

const initialDocs = [
  { patient: "Sarah K. Thompson", id: "P-2903", doc: "Embryo Storage Consent", status: "signed", date: "2024-06-01" },
  { patient: "Maria L. Rodriguez", id: "P-3102", doc: "IVF Treatment Consent", status: "signed", date: "2024-06-05" },
  { patient: "Jennifer M. Chen", id: "P-2841", doc: "PGT-A Consent", status: "pending", date: "—" },
  { patient: "Sofia Park", id: "P-2987", doc: "Embryo Storage Consent", status: "missing", date: "—" },
  { patient: "Amanda Clarke", id: "P-3045", doc: "FET Consent", status: "signed", date: "2024-05-20" },
];

function ConsentsPage() {
  const [documents, setDocuments] = useState(initialDocs);

  const handleSend = async (key: string) => {
    await runMockAction("Sending consent via WhatsApp", {
      detail: "Patient will receive a signed link",
      success: "Consent sent · awaiting signature",
    });
    setDocuments((docs) =>
      docs.map((d) =>
        d.doc + d.id === key ? { ...d, status: "pending", date: new Date().toISOString().slice(0, 10) } : d,
      ),
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Consents & documents</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Digital signatures, multilingual templates, WhatsApp delivery</p>
        </div>
        <button
          onClick={() => notify("New document composer coming soon", "Use a template or create from scratch")}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-[12px] font-medium rounded-md h-9 px-3 hover:bg-primary/90"
        >
          <Plus className="size-3.5" /> New document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: "Signed (30d)", v: "184", tone: "success" as const },
          { label: "Pending action", v: "12", tone: "warning" as const },
          { label: "Missing · blocking", v: "3", tone: "critical" as const },
          { label: "Auto-delivered via WhatsApp", v: "92%", tone: "primary" as const },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
            <p className={cn(
              "text-[24px] font-semibold tracking-tight mt-1",
              s.tone === "success" && "text-foreground",
              s.tone === "warning" && "text-warning",
              s.tone === "critical" && "text-critical",
              s.tone === "primary" && "text-primary",
            )}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-accent bg-accent/40 p-3.5 flex items-start gap-2.5">
        <Sparkles className="size-3.5 text-primary mt-0.5 shrink-0" />
        <p className="text-[12px] text-foreground/80">
          <span className="font-semibold text-primary">AI · </span>
          Sofia Park has an FET scheduled tomorrow without an embryo storage consent. Auto-reminder queued for 18:00 (highest response window).
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium text-muted-foreground">Patient</th>
                <th className="py-2.5 px-4 font-medium text-muted-foreground">Document</th>
                <th className="py-2.5 px-4 font-medium text-muted-foreground">Status</th>
                <th className="py-2.5 px-4 font-medium text-muted-foreground">Date</th>
                <th className="py-2.5 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.doc + doc.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-accent text-primary flex items-center justify-center text-[10px] font-semibold">
                        {doc.patient.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{doc.patient}</p>
                        <p className="text-[10px] text-muted-foreground">{doc.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-foreground">{doc.doc}</td>
                  <td className="py-2.5 px-4">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full",
                      doc.status === "signed" && "bg-success/10 text-success",
                      doc.status === "pending" && "bg-warning/10 text-warning",
                      doc.status === "missing" && "bg-critical/10 text-critical"
                    )}>
                      {doc.status === "signed" && <CheckCircle className="size-3" />}
                      {doc.status === "pending" && <Clock className="size-3" />}
                      {doc.status === "missing" && <AlertCircle className="size-3" />}
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground font-mono tabular-nums">{doc.date}</td>
                  <td className="py-2.5 px-4 text-right">
                    {doc.status !== "signed" && (
                      <button
                        onClick={() => handleSend(doc.doc + doc.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                      >
                        <MessageCircle className="size-3" /> {doc.status === "pending" ? "Resend" : "Send"}
                      </button>
                    )}
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
