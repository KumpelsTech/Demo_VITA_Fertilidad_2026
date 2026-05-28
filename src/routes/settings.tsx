import { createFileRoute } from "@tanstack/react-router";
import {
  Settings,
  Users,
  Shield,
  Bell,
  Database,
  Workflow,
  FileText,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const groups = [
  {
    label: "Workspace",
    items: [
      { label: "General", icon: Settings, desc: "Clinic profile, time zone, locale" },
      {
        label: "Users & roles",
        icon: Users,
        desc: "Physicians, nurses, embryologists, coordinators",
      },
      { label: "Permissions", icon: Shield, desc: "Role-based access, audit logs, MFA" },
    ],
  },
  {
    label: "Clinical operations",
    items: [
      {
        label: "Protocol templates",
        icon: FileText,
        desc: "Long Agonist, Antagonist, FET, Mini-IVF",
      },
      { label: "Workflow automation", icon: Workflow, desc: "Reminders, escalations, hand-offs" },
      { label: "Notifications", icon: Bell, desc: "WhatsApp, email, in-app channels" },
    ],
  },
  {
    label: "Integrations & AI",
    items: [
      {
        label: "Integrations",
        icon: Database,
        desc: "Lab systems, EMR, WhatsApp Business, billing",
      },
      {
        label: "Kumpels AI",
        icon: Sparkles,
        desc: "Smart summaries, suggestions, escalation models",
      },
    ],
  },
];

function SettingsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Administration, automation, and integrations
        </p>
      </div>

      {groups.map((g) => (
        <section key={g.label} className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground px-1">
            {g.label}
          </p>
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            {g.items.map((item) => (
              <button
                key={item.label}
                className="w-full text-left flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors group"
              >
                <div className="size-9 rounded-lg bg-accent text-primary flex items-center justify-center shrink-0">
                  <item.icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
