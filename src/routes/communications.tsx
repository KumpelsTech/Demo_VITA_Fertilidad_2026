import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Search, Sparkles, Paperclip, Bell, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/mock-actions";

export const Route = createFileRoute("/communications")({
  component: CommunicationsPage,
});

const conversations = [
  { patient: "Sarah K. Thompson", id: "P-2903", stage: "Trigger phase", last: "Can I take prenatal vitamins with Ovidrel?", time: "15:02", unread: 2, urgent: true },
  { patient: "Elena Rossi", id: "P-3156", stage: "Stimulation", last: "Reminder confirmation received", time: "13:40", unread: 0 },
  { patient: "Maria L. Rodriguez", id: "P-3102", stage: "Stimulation", last: "Thank you for the reminder!", time: "09:05", unread: 0 },
  { patient: "Jennifer M. Chen", id: "P-2841", stage: "Embryo dev", last: "When can we schedule the transfer?", time: "Yest", unread: 0 },
  { patient: "Sofia Park", id: "P-2987", stage: "Pre-FET", last: "Auto reminder · consent pending", time: "Yest", unread: 0 },
];

const initialThread = [
  { who: "You", t: "14:12", self: true, body: "Hello Sarah! Your Ovidrel trigger is scheduled for 21:45 tonight. Please confirm once administered." },
  { who: "Sarah K.", t: "14:15", self: false, body: "Received, thank you. I've set an alarm." },
  { who: "Sarah K.", t: "15:02", self: false, body: "Quick question: can I take my prenatal vitamins at the same time?" },
];

const aiReplies = [
  "Yes — prenatal vitamins are fine with Ovidrel. No interaction.",
  "Hold prenatals tonight and resume tomorrow morning.",
  "Let me check with Dr. Vance and get back to you.",
];

function CommunicationsPage() {
  const [activeId, setActiveId] = useState(conversations[0].id);
  const [thread, setThread] = useState(initialThread);
  const [draft, setDraft] = useState("");
  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];

  const sendMessage = (body?: string) => {
    const text = (body ?? draft).trim();
    if (!text) return;
    const now = new Date();
    const t = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setThread((th) => [...th, { who: "You", t, self: true, body: text }]);
    setDraft("");
    notify("Message sent via WhatsApp", active.patient);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="w-80 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold tracking-tight">Inbox</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-primary font-medium">2 unread</span>
          </div>
          <div className="flex items-center h-8 bg-secondary rounded-md px-2.5">
            <Search className="size-3.5 text-muted-foreground mr-2" />
            <input className="bg-transparent outline-none text-[12px] flex-1 placeholder:text-muted-foreground" placeholder="Search conversations…" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "w-full text-left p-3.5 border-b border-border/50 hover:bg-secondary/60 transition-colors",
                c.id === activeId && "bg-accent/40",
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-full bg-accent text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
                  {c.patient.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold truncate">{c.patient}</p>
                    <span className="text-[10px] text-muted-foreground">{c.time}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{c.stage}</p>
                  <p className={cn("text-[11px] truncate mt-1", c.unread ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {c.last}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-bold shrink-0">
                    {c.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Thread */}
      <main className="flex-1 flex flex-col bg-background min-w-0">
        <div className="h-14 border-b border-border bg-card flex items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-accent text-primary flex items-center justify-center text-[11px] font-semibold">
              {active.patient.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <p className="text-[13px] font-semibold">{active.patient}</p>
              <p className="text-[10px] text-muted-foreground">{active.id} · {active.stage} · WhatsApp</p>
            </div>
          </div>
          <Link to="/patients/$patientId" params={{ patientId: active.id }} className="text-[12px] text-primary font-medium hover:underline inline-flex items-center gap-1">
            Open patient <ChevronRight className="size-3" />
          </Link>
        </div>

        {/* AI context strip */}
        <div className="mx-5 mt-4 rounded-lg border border-accent bg-accent/40 px-3.5 py-2.5 flex items-start gap-2.5">
          <Sparkles className="size-3.5 text-primary mt-0.5 shrink-0" />
          <div className="text-[11px] text-foreground/80 leading-snug">
            <span className="font-semibold text-primary">Context · </span>
            Patient is in trigger phase. No drug interactions between prenatal vitamins and Ovidrel. Last vitals normal.
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {thread.map((m, i) => (
            <div key={i} className={cn("flex flex-col gap-1", m.self ? "items-end" : "items-start")}>
              <div className={cn(
                "px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed max-w-[70%]",
                m.self ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border text-foreground rounded-tl-sm",
              )}>
                {m.body}
              </div>
              <span className="text-[10px] text-muted-foreground">{m.who} · {m.t}</span>
            </div>
          ))}
        </div>

        {/* AI suggested replies */}
        <div className="px-5 pb-2 flex flex-wrap gap-2">
          {aiReplies.map((r) => (
            <button
              key={r}
              onClick={() => setDraft(r)}
              className="text-[11px] px-2.5 h-7 rounded-full bg-card border border-accent text-foreground hover:bg-accent transition-colors inline-flex items-center gap-1.5"
            >
              <Sparkles className="size-3 text-primary" /> {r}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-2 bg-secondary/70 px-3 py-2 rounded-xl">
            <button
              onClick={() => notify("Attachment", "PDF / lab report picker")}
              className="size-7 rounded-md hover:bg-card flex items-center justify-center"
            ><Paperclip className="size-3.5 text-muted-foreground" /></button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              placeholder={`Reply to ${active.patient.split(" ")[0]}…`}
            />
            <button
              onClick={() => notify("Reminder scheduled", `${active.patient} · 18:00`)}
              className="size-7 rounded-md hover:bg-card flex items-center justify-center"
            ><Bell className="size-3.5 text-muted-foreground" /></button>
            <button
              onClick={() => sendMessage()}
              className="size-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
            >
              <Send className="size-3.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}