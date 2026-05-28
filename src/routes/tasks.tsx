import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, CheckCircle, Loader2, AlertCircle, Search, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/mock-actions";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
});

type FollowUpTaskRow = {
  id: string;
  clinic_id: string | null;
  fertility_case_id: string | null;
  assigned_to: string | null;
  task_type: string | null;
  priority: string | null;
  status: string | null;
  due_at: string | null;
  completed_at: string | null;
  notes: string | null;
  clinic_person_id: string | null;
};

type ClinicPersonRow = {
  id: string;
  person_id: string | null;
  persons:
    | {
        id: string;
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        email: string | null;
        document_number: string | null;
      }
    | {
        id: string;
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        email: string | null;
        document_number: string | null;
      }[]
    | null;
};

type TaskItem = {
  id: string;
  clinicId: string | null;
  fertilityCaseId: string | null;
  clinicPersonId: string | null;
  patientName: string;
  patientPhone: string | null;
  patientDocument: string | null;
  title: string;
  assignee: string;
  due: string;
  dueAt: string | null;
  priority: string;
  status: string;
  taskType: string;
  notes: string | null;
  completedAt: string | null;
};

function formatDueDate(date?: string | null) {
  if (!date) return "Sin fecha";

  try {
    return new Date(date).toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Sin fecha";
  }
}

function getTomorrowAt(hour = 9) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);

  return date.toISOString();
}

function normalizeStatus(status?: string | null) {
  if (!status) return "pending";

  if (status === "open") return "pending";

  return status;
}

function isCompleted(status?: string | null) {
  return normalizeStatus(status) === "completed";
}

function getTaskTitle(task: FollowUpTaskRow, patientName: string) {
  if (task.notes) return task.notes;

  if (task.task_type === "whatsapp_follow_up") {
    return `Seguimiento por WhatsApp — ${patientName}`;
  }

  if (task.task_type) {
    return `${task.task_type.replaceAll("_", " ")} — ${patientName}`;
  }

  return `Seguimiento pendiente — ${patientName}`;
}

function getPriorityClass(priority: string) {
  return cn(
    "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
    priority === "urgent" && "bg-critical/10 text-critical",
    priority === "high" && "bg-warning/10 text-warning",
    priority === "medium" && "bg-clinical/10 text-clinical",
    priority === "normal" && "bg-muted text-muted-foreground",
    !["urgent", "high", "medium", "normal"].includes(priority) && "bg-muted text-muted-foreground",
  );
}

function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return tasks;

    return tasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(query) ||
        task.patientName.toLowerCase().includes(query) ||
        task.patientPhone?.toLowerCase().includes(query) ||
        task.patientDocument?.toLowerCase().includes(query) ||
        task.priority.toLowerCase().includes(query) ||
        task.status.toLowerCase().includes(query) ||
        task.taskType.toLowerCase().includes(query)
      );
    });
  }, [tasks, search]);

  const openTasks = tasks.filter((task) => !isCompleted(task.status)).length;
  const completedTasks = tasks.filter((task) => isCompleted(task.status)).length;

  const loadTasks = async () => {
    setLoading(true);

    const { data: taskRows, error: taskError } = await supabase
      .from("follow_up_tasks")
      .select(
        `
        id,
        clinic_id,
        fertility_case_id,
        assigned_to,
        task_type,
        priority,
        status,
        due_at,
        completed_at,
        notes,
        clinic_person_id
      `,
      )
      .order("due_at", { ascending: true, nullsFirst: false });

    if (taskError) {
      console.error("Error loading follow-up tasks:", JSON.stringify(taskError, null, 2));
      notify("Error", taskError.message || "No se pudieron cargar las tareas.");
      setLoading(false);
      return;
    }

    const clinicPersonIds = Array.from(
      new Set((taskRows ?? []).map((task) => task.clinic_person_id).filter(Boolean) as string[]),
    );

    let clinicPersonsById = new Map<string, ClinicPersonRow>();

    if (clinicPersonIds.length > 0) {
      const { data: clinicPersonRows, error: clinicPersonError } = await supabase
        .from("clinic_persons")
        .select(
          `
          id,
          person_id,
          persons (
            id,
            first_name,
            last_name,
            phone,
            email,
            document_number
          )
        `,
        )
        .in("id", clinicPersonIds);

      if (clinicPersonError) {
        console.error("Error loading clinic persons:", JSON.stringify(clinicPersonError, null, 2));
        notify("Error", clinicPersonError.message || "No se pudieron cargar los pacientes.");
      }

      clinicPersonsById = new Map(
        (clinicPersonRows ?? []).map((clinicPerson: ClinicPersonRow) => [
          clinicPerson.id,
          clinicPerson,
        ]),
      );
    }

    const mappedTasks: TaskItem[] = (taskRows ?? []).map((task: FollowUpTaskRow) => {
      const clinicPerson = task.clinic_person_id
        ? clinicPersonsById.get(task.clinic_person_id)
        : null;

      const person = Array.isArray(clinicPerson?.persons)
        ? clinicPerson?.persons[0]
        : clinicPerson?.persons;

      const firstName = person?.first_name ?? "";
      const lastName = person?.last_name ?? "";
      const patientName = `${firstName} ${lastName}`.trim() || "Paciente sin nombre";

      return {
        id: task.id,
        clinicId: task.clinic_id,
        fertilityCaseId: task.fertility_case_id,
        clinicPersonId: task.clinic_person_id,
        patientName,
        patientPhone: person?.phone ?? null,
        patientDocument: person?.document_number ?? null,
        title: getTaskTitle(task, patientName),
        assignee: task.assigned_to ? "Asignado" : "Sin asignar",
        due: formatDueDate(task.due_at),
        dueAt: task.due_at,
        priority: task.priority ?? "normal",
        status: normalizeStatus(task.status),
        taskType: task.task_type ?? "follow_up",
        notes: task.notes,
        completedAt: task.completed_at,
      };
    });

    setTasks(mappedTasks);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const toggleTask = async (task: TaskItem) => {
    const currentCompleted = isCompleted(task.status);

    const nextStatus = currentCompleted ? "pending" : "completed";
    const nextCompletedAt = currentCompleted ? null : new Date().toISOString();

    setUpdatingTaskId(task.id);

    const { error } = await supabase
      .from("follow_up_tasks")
      .update({
        status: nextStatus,
        completed_at: nextCompletedAt,
      })
      .eq("id", task.id);

    if (error) {
      console.error("Error updating task:", JSON.stringify(error, null, 2));
      notify("Error", error.message || "No se pudo actualizar la tarea.");
      setUpdatingTaskId(null);
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
              ...currentTask,
              status: nextStatus,
              completedAt: nextCompletedAt,
            }
          : currentTask,
      ),
    );

    setUpdatingTaskId(null);

    if (nextStatus === "completed") {
      notify("Tarea completada", task.title);
    } else {
      notify("Tarea reabierta", task.title);
    }
  };

  const createGenericTask = async () => {
    setCreating(true);

    const title = `Nueva tarea de seguimiento · ${new Date()
      .toLocaleTimeString("es-CO")
      .slice(0, 5)}`;

    const payload = {
      id: crypto.randomUUID(),
      clinic_id: null,
      fertility_case_id: null,
      assigned_to: null,
      task_type: "manual_follow_up",
      priority: "medium",
      status: "pending",
      due_at: getTomorrowAt(9),
      completed_at: null,
      notes: title,
      clinic_person_id: null,
    };

    const { error } = await supabase.from("follow_up_tasks").insert(payload);

    if (error) {
      console.error("Error creating task:", JSON.stringify(error, null, 2));
      notify("Error", error.message || "No se pudo crear la tarea.");
      setCreating(false);
      return;
    }

    notify("Tarea creada", title);

    setCreating(false);
    await loadTasks();
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Tasks & Follow-up</h1>

          <p className="text-sm text-muted-foreground mt-1">
            Seguimiento operativo de tareas creadas en follow_up_tasks
          </p>

          <div className="flex items-center gap-2 mt-3">
            <span className="text-[11px] px-2 py-1 rounded-full bg-secondary text-muted-foreground">
              {openTasks} abiertas
            </span>

            <span className="text-[11px] px-2 py-1 rounded-full bg-secondary text-muted-foreground">
              {completedTasks} completadas
            </span>

            <span className="text-[11px] px-2 py-1 rounded-full bg-secondary text-muted-foreground">
              {tasks.length} totales
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTasks}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-card border border-border text-sm font-medium rounded-lg py-2 px-4 hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh
          </button>

          <button
            onClick={createGenericTask}
            disabled={creating}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg py-2 px-4 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            New Task
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
        <div className="flex items-center h-9 bg-secondary rounded-md px-3">
          <Search className="size-4 text-muted-foreground mr-2" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
            placeholder="Buscar por paciente, documento, prioridad, estado o tipo de tarea…"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading && (
          <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Cargando tareas...
          </div>
        )}

        {!loading && filteredTasks.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="size-4" />
            No hay tareas de seguimiento para mostrar.
          </div>
        )}

        {!loading && filteredTasks.length > 0 && (
          <div className="divide-y divide-border">
            {filteredTasks.map((task) => {
              const completed = isCompleted(task.status);
              const updating = updatingTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className="group p-4 hover:bg-secondary/30 transition-colors flex items-center gap-4"
                >
                  <button
                    onClick={() => toggleTask(task)}
                    disabled={updating}
                    className={cn(
                      "size-5 rounded-md border-2 transition-colors flex items-center justify-center shrink-0 disabled:opacity-50",
                      completed
                        ? "bg-success/10 border-success"
                        : "border-border group-hover:border-primary",
                    )}
                  >
                    {updating ? (
                      <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                    ) : (
                      completed && <CheckCircle className="size-3.5 text-success" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        completed && "line-through text-muted-foreground",
                      )}
                    >
                      {task.title}
                    </p>

                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {task.patientName} &bull; {task.assignee} &bull; Due {task.due}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      {task.patientPhone && (
                        <span className="text-[10px] text-muted-foreground">
                          WhatsApp: {task.patientPhone}
                        </span>
                      )}

                      {task.patientDocument && (
                        <span className="text-[10px] text-muted-foreground">
                          Doc. {task.patientDocument}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={getPriorityClass(task.priority)}>{task.priority}</span>

                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                        completed
                          ? "bg-success/10 text-success"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {completed ? "completed" : task.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
