import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Route,
  Stethoscope,
  Pill,
  FlaskConical,
  Heart,
  ListChecks,
  MessageCircle,
  Package,
  FileText,
  Bell,
  BarChart3,
  Settings,
  Sparkles,
  Search,
  GitBranch,
  HeartPulse,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Operations",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Fertility Cases", url: "/fertility-cases", icon: GitBranch },
      { title: "Patients", url: "/patients", icon: Users },
      { title: "Treatment Journeys", url: "/treatment-journeys", icon: Route },
      { title: "Procedures", url: "/procedures", icon: Stethoscope },
    ],
  },
  {
    label: "Clinical",
    items: [
      { title: "Pharmacy", url: "/medication-pharmacy", icon: Pill },
      { title: "Nursing", url: "/laboratory-gamete-bank", icon: FlaskConical },
      { title: "Patient Follow-up", url: "/patient-followup", icon: HeartPulse },
      { title: "Donor Management", url: "/donors", icon: Heart },
    ],
  },
  {
    label: "Coordination",
    items: [
      { title: "Tasks & Follow-up", url: "/tasks", icon: ListChecks },
      { title: "Communications", url: "/communications", icon: MessageCircle },
      { title: "Inventory", url: "/inventory", icon: Package },
    ],
  },
  {
    label: "Governance",
    items: [
      { title: "Consents & Documents", url: "/consents", icon: FileText },
      { title: "Alerts", url: "/alerts", icon: Bell },
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({
    select: (router) => router.location.pathname,
  });

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="px-4 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-primary-foreground font-bold text-[13px] tracking-tight">K</span>
          </div>
          <div className={cn("flex flex-col leading-none", collapsed && "sr-only")}>
            <span className="font-semibold text-[13px] tracking-tight text-foreground">Kumpels</span>
            <span className="text-[10px] text-muted-foreground tracking-wide">Core · VITA Fertility</span>
          </div>
        </Link>
        {!collapsed && (
          <div className="mt-4 flex items-center h-8 px-2.5 bg-secondary/70 rounded-md border border-transparent hover:border-border transition-colors">
            <Search className="size-3.5 text-muted-foreground mr-2" />
            <span className="text-[11px] text-muted-foreground flex-1">Quick find</span>
            <kbd className="text-[9px] font-mono text-muted-foreground bg-card border border-border rounded px-1">⌘K</kbd>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 gap-1">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 px-3",
              collapsed && "sr-only"
            )}>
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title} className="h-8">
                        <Link
                          to={item.url}
                          className={cn(
                            "flex items-center gap-2.5 px-2.5 text-[13px] font-medium transition-all rounded-md",
                            active
                              ? "bg-accent text-primary"
                              : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                          )}
                        >
                          <item.icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("truncate", collapsed && "sr-only")}>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 gap-2">
        {!collapsed && (
          <div className="rounded-lg border border-border bg-gradient-to-br from-accent/60 to-card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="size-3 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Kumpels AI</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              3 patients need attention today. Review suggestions.
            </p>
          </div>
        )}
        <div className="flex items-center gap-2.5 px-1.5 py-1.5 rounded-md hover:bg-secondary transition-colors cursor-pointer">
          <div className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-semibold shrink-0">
            EV
          </div>
          <div className={cn("min-w-0 flex-1", collapsed && "sr-only")}>
            <p className="text-[12px] font-semibold truncate leading-tight">Dr. Elena Vance</p>
            <p className="text-[10px] text-muted-foreground truncate">Clinical Director</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
