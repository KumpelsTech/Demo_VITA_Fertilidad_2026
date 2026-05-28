import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search, Bell, Sparkles, ChevronRight } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Today",
  "/patients": "Patients",
  "/treatment-journeys": "Treatment Journeys",
  "/procedures": "Procedures",
  "/medication-pharmacy": "Medication & Pharmacy",
  "/laboratory-gamete-bank": "Laboratory & Gamete Bank",
  "/donors": "Donor Management",
  "/tasks": "Tasks & Follow-up",
  "/communications": "Communications",
  "/inventory": "Inventory",
  "/consents": "Consents & Documents",
  "/alerts": "Alerts",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title =
    ROUTE_TITLES[pathname] ?? (pathname.startsWith("/patients/") ? "Patient" : "Kumpels Core");

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur flex items-center justify-between px-5 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="-ml-1 size-7" />
        <nav className="flex items-center gap-1.5 text-[13px] min-w-0">
          <span className="text-muted-foreground">VITA Fertility</span>
          <ChevronRight className="size-3 text-muted-foreground/60" />
          <span className="font-semibold text-foreground truncate">{title}</span>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center h-8 w-72 bg-secondary/60 hover:bg-secondary rounded-md px-2.5 transition-colors">
          <Search className="size-3.5 text-muted-foreground mr-2" />
          <span className="text-[12px] text-muted-foreground flex-1">
            Search patients, protocols, lots…
          </span>
          <kbd className="text-[9px] font-mono text-muted-foreground bg-card border border-border rounded px-1">
            ⌘K
          </kbd>
        </div>
        <button className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[12px] font-medium text-primary bg-accent hover:bg-accent/80 transition-colors">
          <Sparkles className="size-3.5" /> Ask Kumpels
        </button>
        <button className="relative size-8 rounded-md hover:bg-secondary flex items-center justify-center transition-colors">
          <Bell className="size-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 size-1.5 bg-critical rounded-full ring-2 ring-card" />
        </button>
      </div>
    </header>
  );
}
