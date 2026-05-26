import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { runMockAction, notify } from "@/lib/mock-actions";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
});

const initialTasks = [
  { title: "Confirm Lab Prep for Retrieval #402", assignee: "Lab Team", due: "Today 08:00", priority: "high", status: "open" },
  { title: "Sign Consent Form — J. Miller", assignee: "Coordinator", due: "Today 12:00", priority: "medium", status: "open" },
  { title: "Verify Stock: Ovidrel 250mcg", assignee: "Pharmacy", due: "Today 14:00", priority: "urgent", status: "open" },
  { title: "Update donor screening results", assignee: "Quality", due: "Tomorrow", priority: "medium", status: "open" },
  { title: "Prepare FET protocol for A. Clarke", assignee: "Nurse", due: "Tomorrow", priority: "normal", status: "completed" },
];

function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks);

  const toggle = (title: string) => {
    setTasks((ts) =>
      ts.map((t) =>
        t.title === title ? { ...t, status: t.status === "completed" ? "open" : "completed" } : t,
      ),
    );
    const t = tasks.find((x) => x.title === title);
    if (t && t.status === "open") notify("Task completed", title);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Tasks & Follow-up</h1>
          <p className="text-sm text-muted-foreground mt-1">Operational coordination and task queue</p>
        </div>
        <button
          onClick={() => {
            const title = `New task · ${new Date().toLocaleTimeString().slice(0, 5)}`;
            setTasks((ts) => [
              { title, assignee: "You", due: "Today", priority: "medium", status: "open" },
              ...ts,
            ]);
            notify("Task created", title);
          }}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg py-2 px-4 hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" /> New Task
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {tasks.map((task) => (
            <div key={task.title} className="group p-4 hover:bg-secondary/30 transition-colors flex items-center gap-4">
              <button
                onClick={() => toggle(task.title)}
                className={cn(
                  "size-5 rounded-md border-2 transition-colors flex items-center justify-center shrink-0",
                  task.status === "completed"
                    ? "bg-success/10 border-success"
                    : "border-border group-hover:border-primary",
                )}
              >
                {task.status === "completed" && <CheckCircle className="size-3.5 text-success" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", task.status === "completed" && "line-through text-muted-foreground")}>
                  {task.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{task.assignee} &bull; Due {task.due}</p>
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded",
                  task.priority === "urgent" && "bg-critical/10 text-critical",
                  task.priority === "high" && "bg-warning/10 text-warning",
                  task.priority === "medium" && "bg-clinical/10 text-clinical",
                  task.priority === "normal" && "bg-muted text-muted-foreground"
                )}
              >
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
