import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Send,
  Search,
  Sparkles,
  Paperclip,
  Bell,
  ChevronRight,
  MessageCircle,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Plus,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/mock-actions";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/communications")({
  component: CommunicationsPage,
});

const DEFAULT_CLINIC_ID = "385f976d-2e25-4af3-91da-5d347acaa54f";

type ViewMode = "current" | "future";

type Priority = "normal" | "medium" | "high" | "urgent";

type IntakeStatus =
  | "new_lead"
  | "contacted"
  | "waiting_response"
  | "scheduled_appointment"
  | "documents_pending"
  | "financial_review"
  | "ready_to_open_case"
  | "converted_to_patient"
  | "lost";

type CommunicationPatient = {
  clinicPersonId: string;
  personId: string | null;
  clinicId: string | null;
  fertilityCaseId: string | null;
  patient: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  documentNumber: string | null;
  email: string | null;
  stage: string;
};

type FuturePatient = CommunicationPatient & {
  intakeId: string;
  source: string | null;
  intakeStatus: IntakeStatus;
  interestType: string | null;
  priority: Priority;
  nextAction: string | null;
  notes: string | null;
  createdAt: string | null;
};

type ThreadMessage = {
  who: string;
  t: string;
  self: boolean;
  body: string;
  status?: string;
};

type NewFuturePatientForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  documentNumber: string;
  source: string;
  interestType: string;
  notes: string;
  priority: Priority;
};

const currentPatientReplies = [
  "Hola, te escribimos desde VITA para hacer seguimiento a tu proceso. ¿Cómo te has sentido?",
  "Hola, queremos confirmar si pudiste realizar la indicación pendiente.",
  "Hola, te recordamos que tenemos pendiente hacer seguimiento a tu tratamiento. ¿Nos puedes confirmar por favor?",
];

const futurePatientReplies = [
  "Hola, te escribimos desde VITA para dar seguimiento a tu proceso de ingreso a la clínica.",
  "Hola, queremos confirmar si sigues interesado/a en continuar con tu proceso en VITA.",
  "Hola, te recordamos que estamos pendientes de avanzar con tu proceso de admisión. ¿Podemos ayudarte con algo?",
];

const intakeStatusOptions: { value: IntakeStatus; label: string }[] = [
  { value: "new_lead", label: "Nuevo lead" },
  { value: "contacted", label: "Contactado" },
  { value: "waiting_response", label: "Esperando respuesta" },
  { value: "scheduled_appointment", label: "Cita agendada" },
  { value: "documents_pending", label: "Documentos pendientes" },
  { value: "financial_review", label: "Revisión financiera" },
  { value: "ready_to_open_case", label: "Listo para abrir caso" },
  { value: "converted_to_patient", label: "Convertido" },
  { value: "lost", label: "Perdido" },
];

const priorityOptions: Priority[] = ["normal", "medium", "high", "urgent"];

function normalizePhoneForWhatsApp(phone?: string | null) {
  if (!phone) return null;

  const cleaned = phone.replace(/\D/g, "");

  if (!cleaned) return null;

  if (cleaned.length === 10 && cleaned.startsWith("3")) {
    return `57${cleaned}`;
  }

  return cleaned;
}

function buildWhatsAppUrl(phone: string, message: string) {
  const normalizedPhone = normalizePhoneForWhatsApp(phone);

  if (!normalizedPhone) return null;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTimeNow() {
  const now = new Date();

  return `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function getTomorrowAt(hour = 9) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);

  return date.toISOString();
}

function getStatusLabel(status: IntakeStatus) {
  return intakeStatusOptions.find((item) => item.value === status)?.label ?? status;
}

function getPriorityClass(priority: Priority) {
  return cn(
    "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
    priority === "urgent" && "bg-critical/10 text-critical",
    priority === "high" && "bg-warning/10 text-warning",
    priority === "medium" && "bg-clinical/10 text-clinical",
    priority === "normal" && "bg-muted text-muted-foreground",
  );
}

function getStatusClass(status: IntakeStatus) {
  return cn(
    "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
    status === "new_lead" && "bg-secondary text-muted-foreground",
    status === "contacted" && "bg-clinical/10 text-clinical",
    status === "waiting_response" && "bg-warning/10 text-warning",
    status === "scheduled_appointment" && "bg-primary/10 text-primary",
    status === "documents_pending" && "bg-warning/10 text-warning",
    status === "financial_review" && "bg-clinical/10 text-clinical",
    status === "ready_to_open_case" && "bg-success/10 text-success",
    status === "converted_to_patient" && "bg-success/10 text-success",
    status === "lost" && "bg-critical/10 text-critical",
  );
}

function getPersonData(row: any) {
  const person = Array.isArray(row?.persons) ? row.persons[0] : row?.persons;

  const firstName = person?.first_name ?? "";
  const lastName = person?.last_name ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    person,
    firstName,
    lastName,
    fullName: fullName || "Paciente sin nombre",
  };
}

function CommunicationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("current");

  const [patients, setPatients] = useState<CommunicationPatient[]>([]);
  const [futurePatients, setFuturePatients] = useState<FuturePatient[]>([]);

  const [activeClinicPersonId, setActiveClinicPersonId] = useState<string | null>(
    null,
  );
  const [activeFutureIntakeId, setActiveFutureIntakeId] = useState<string | null>(
    null,
  );

  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");

  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingFuturePatients, setLoadingFuturePatients] = useState(true);

  const [creatingCommunication, setCreatingCommunication] = useState(false);
  const [creatingFollowUp, setCreatingFollowUp] = useState(false);
  const [creatingFuturePatient, setCreatingFuturePatient] = useState(false);
  const [updatingIntakeStatus, setUpdatingIntakeStatus] = useState(false);

  const [showNewFuturePatientForm, setShowNewFuturePatientForm] = useState(false);

  const [newFuturePatient, setNewFuturePatient] =
    useState<NewFuturePatientForm>({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      documentNumber: "",
      source: "",
      interestType: "",
      notes: "",
      priority: "normal",
    });

  const activeCurrent =
    patients.find((patient) => patient.clinicPersonId === activeClinicPersonId) ??
    null;

  const activeFuture =
    futurePatients.find((patient) => patient.intakeId === activeFutureIntakeId) ??
    null;

  const active = viewMode === "current" ? activeCurrent : activeFuture;

  const loading = viewMode === "current" ? loadingPatients : loadingFuturePatients;

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return patients;

    return patients.filter((patient) => {
      return (
        patient.patient.toLowerCase().includes(query) ||
        patient.phone?.toLowerCase().includes(query) ||
        patient.documentNumber?.toLowerCase().includes(query) ||
        patient.email?.toLowerCase().includes(query) ||
        patient.stage?.toLowerCase().includes(query)
      );
    });
  }, [patients, search]);

  const filteredFuturePatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return futurePatients;

    return futurePatients.filter((patient) => {
      return (
        patient.patient.toLowerCase().includes(query) ||
        patient.phone?.toLowerCase().includes(query) ||
        patient.documentNumber?.toLowerCase().includes(query) ||
        patient.email?.toLowerCase().includes(query) ||
        patient.source?.toLowerCase().includes(query) ||
        patient.interestType?.toLowerCase().includes(query) ||
        patient.intakeStatus.toLowerCase().includes(query)
      );
    });
  }, [futurePatients, search]);

  const defaultWhatsAppMessage =
    viewMode === "current"
      ? active
        ? `Hola ${active.firstName || active.patient.split(" ")[0]}, te escribimos desde VITA para hacer seguimiento a tu proceso.`
        : ""
      : active
        ? `Hola ${active.firstName || active.patient.split(" ")[0]}, te escribimos desde VITA para dar seguimiento a tu proceso de ingreso a la clínica.`
        : "";

  const whatsappUrl =
    active?.phone && buildWhatsAppUrl(active.phone, draft || defaultWhatsAppMessage);

  const activeFutureCount = futurePatients.filter(
    (patient) =>
      patient.intakeStatus !== "converted_to_patient" &&
      patient.intakeStatus !== "lost",
  ).length;

  const convertedFutureCount = futurePatients.filter(
    (patient) => patient.intakeStatus === "converted_to_patient",
  ).length;

  const lostFutureCount = futurePatients.filter(
    (patient) => patient.intakeStatus === "lost",
  ).length;

  const aiReplies =
    viewMode === "current" ? currentPatientReplies : futurePatientReplies;

  const loadPatients = async () => {
    setLoadingPatients(true);

    const { data, error } = await supabase
      .from("clinic_persons")
      .select(`
        id,
        clinic_id,
        person_id,
        persons (
          id,
          first_name,
          last_name,
          phone,
          email,
          document_number
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "Error loading patients for communications:",
        JSON.stringify(error, null, 2),
      );
      notify("Error", error.message || "No se pudieron cargar los pacientes.");
      setLoadingPatients(false);
      return;
    }

    const mapped: CommunicationPatient[] = (data ?? []).map((row: any) => {
      const { person, firstName, lastName, fullName } = getPersonData(row);

      return {
        clinicPersonId: row.id,
        personId: person?.id ?? row.person_id ?? null,
        clinicId: row.clinic_id ?? DEFAULT_CLINIC_ID,
        fertilityCaseId: null,
        patient: fullName,
        firstName,
        lastName,
        phone: person?.phone ?? null,
        documentNumber: person?.document_number ?? null,
        email: person?.email ?? null,
        stage: "Paciente activo",
      };
    });

    setPatients(mapped);

    if (!activeClinicPersonId && mapped.length > 0) {
      setActiveClinicPersonId(mapped[0].clinicPersonId);
    }

    setLoadingPatients(false);
  };

  const loadFuturePatients = async () => {
    setLoadingFuturePatients(true);

    const { data: intakeRows, error: intakeError } = await supabase
      .from("patient_intake_pipeline")
      .select(`
        id,
        clinic_id,
        clinic_person_id,
        source,
        intake_status,
        interest_type,
        priority,
        next_action,
        notes,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (intakeError) {
      console.error(
        "Error loading future patients:",
        JSON.stringify(intakeError, null, 2),
      );
      notify(
        "Error",
        intakeError.message || "No se pudieron cargar los candidatos.",
      );
      setLoadingFuturePatients(false);
      return;
    }

    const clinicPersonIds = Array.from(
      new Set(
        (intakeRows ?? [])
          .map((row: any) => row.clinic_person_id)
          .filter((id: string | null): id is string => Boolean(id)),
      ),
    );

    let clinicPersonsById = new Map<string, any>();

    if (clinicPersonIds.length > 0) {
      const { data: clinicPersonRows, error: clinicPersonError } = await supabase
        .from("clinic_persons")
        .select(`
          id,
          clinic_id,
          person_id,
          persons (
            id,
            first_name,
            last_name,
            phone,
            email,
            document_number
          )
        `)
        .in("id", clinicPersonIds);

      if (clinicPersonError) {
        console.error(
          "Error loading clinic persons for future patients:",
          JSON.stringify(clinicPersonError, null, 2),
        );
        notify(
          "Error",
          clinicPersonError.message || "No se pudieron cargar los datos personales.",
        );
      }

      clinicPersonsById = new Map(
        (clinicPersonRows ?? []).map((row: any) => [row.id, row]),
      );
    }

    const mapped: FuturePatient[] = (intakeRows ?? []).map((row: any) => {
      const clinicPerson = clinicPersonsById.get(row.clinic_person_id);
      const { person, firstName, lastName, fullName } = getPersonData(clinicPerson);

      return {
        intakeId: row.id,
        clinicPersonId: row.clinic_person_id,
        personId: person?.id ?? clinicPerson?.person_id ?? null,
        clinicId: row.clinic_id ?? clinicPerson?.clinic_id ?? DEFAULT_CLINIC_ID,
        fertilityCaseId: null,
        patient: fullName,
        firstName,
        lastName,
        phone: person?.phone ?? null,
        documentNumber: person?.document_number ?? null,
        email: person?.email ?? null,
        stage: "Paciente futuro",
        source: row.source ?? null,
        intakeStatus: (row.intake_status ?? "new_lead") as IntakeStatus,
        interestType: row.interest_type ?? null,
        priority: (row.priority ?? "normal") as Priority,
        nextAction: row.next_action ?? null,
        notes: row.notes ?? null,
        createdAt: row.created_at ?? null,
      };
    });

    setFuturePatients(mapped);

    if (!activeFutureIntakeId && mapped.length > 0) {
      setActiveFutureIntakeId(mapped[0].intakeId);
    }

    setLoadingFuturePatients(false);
  };

  const refreshAll = async () => {
    await Promise.all([loadPatients(), loadFuturePatients()]);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (!active) {
      setThread([]);
      setDraft("");
      return;
    }

    const message =
      viewMode === "current"
        ? active.phone
          ? `Paciente disponible para comunicación por WhatsApp. Número registrado: ${active.phone}.`
          : "Este paciente no tiene número registrado en persons.phone."
        : active.phone
          ? `Paciente futuro disponible para seguimiento por WhatsApp. Número registrado: ${active.phone}.`
          : "Este paciente futuro no tiene número registrado en persons.phone.";

    setThread([
      {
        who: "Sistema",
        t: formatTimeNow(),
        self: false,
        body: message,
      },
    ]);

    setDraft(defaultWhatsAppMessage);
  }, [viewMode, activeClinicPersonId, activeFutureIntakeId]);

  const createCommunicationAndOpenWhatsApp = async (body?: string) => {
    if (!active) {
      notify("Selecciona un paciente", "Debes seleccionar un paciente primero.");
      return;
    }

    if (!active.phone) {
      notify("Sin número de teléfono", "Este paciente no tiene teléfono registrado.");
      return;
    }

    const text = (body ?? draft).trim();

    if (!text) return;

    const url = buildWhatsAppUrl(active.phone, text);

    if (!url) {
      notify("Número inválido", "No se pudo abrir WhatsApp con este número.");
      return;
    }

    setCreatingCommunication(true);

    const payload = {
      id: crypto.randomUUID(),
      clinic_id: active.clinicId ?? DEFAULT_CLINIC_ID,
      fertility_case_id: active.fertilityCaseId,
      clinic_person_id: active.clinicPersonId,
      channel: "whatsapp",
      direction: "outbound",
      message: text,
      status: "sent_to_whatsapp",
      related_prescription_item_id: null,
      related_medication_schedule_id: null,
      related_procedure_id: null,
      related_document_instance_id: null,
    };

    const { error } = await supabase.from("communications").insert(payload);

    if (error) {
      console.error("Communication payload:", payload);
      console.error("Error creating communication:", JSON.stringify(error, null, 2));
      notify("Error", error.message || "No se pudo guardar la comunicación.");
      setCreatingCommunication(false);
      return;
    }

    if (viewMode === "future" && activeFuture) {
      const nextStatus =
        activeFuture.intakeStatus === "new_lead"
          ? "contacted"
          : activeFuture.intakeStatus;

      await supabase
        .from("patient_intake_pipeline")
        .update({
          intake_status: nextStatus,
          next_action: "Esperar respuesta del paciente",
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeFuture.intakeId);

      setFuturePatients((currentPatients) =>
        currentPatients.map((patient) =>
          patient.intakeId === activeFuture.intakeId
            ? {
              ...patient,
              intakeStatus: nextStatus,
              nextAction: "Esperar respuesta del paciente",
            }
            : patient,
        ),
      );
    }

    const time = formatTimeNow();

    setThread((currentThread) => [
      ...currentThread,
      {
        who: "You",
        t: time,
        self: true,
        body: text,
        status: "Guardado en communications",
      },
    ]);

    setDraft("");
    setCreatingCommunication(false);

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const createFollowUpTask = async () => {
    if (!active) {
      notify("Selecciona un paciente", "Debes seleccionar un paciente primero.");
      return;
    }

    setCreatingFollowUp(true);

    const isFuture = viewMode === "future";

    const payload = {
      id: crypto.randomUUID(),
      clinic_id: active.clinicId ?? DEFAULT_CLINIC_ID,
      fertility_case_id: active.fertilityCaseId,
      clinic_person_id: active.clinicPersonId,
      assigned_to: null,
      task_type: isFuture ? "intake_follow_up" : "whatsapp_follow_up",
      priority: isFuture && activeFuture ? activeFuture.priority : "normal",
      status: "pending",
      due_at: getTomorrowAt(9),
      completed_at: null,
      notes: isFuture
        ? `Realizar seguimiento de ingreso por WhatsApp a ${active.patient}.`
        : `Realizar seguimiento por WhatsApp a ${active.patient}.`,
    };

    const { error } = await supabase.from("follow_up_tasks").insert(payload);

    if (error) {
      console.error("Follow-up payload:", payload);
      console.error("Error creating follow-up task:", JSON.stringify(error, null, 2));
      notify("Error", error.message || "No se pudo crear la tarea de seguimiento.");
      setCreatingFollowUp(false);
      return;
    }

    if (isFuture && activeFuture) {
      await supabase
        .from("patient_intake_pipeline")
        .update({
          next_action: "Follow-up programado",
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeFuture.intakeId);

      setFuturePatients((currentPatients) =>
        currentPatients.map((patient) =>
          patient.intakeId === activeFuture.intakeId
            ? {
              ...patient,
              nextAction: "Follow-up programado",
            }
            : patient,
        ),
      );
    }

    setCreatingFollowUp(false);

    notify(
      "Seguimiento creado",
      `Se creó una tarea de seguimiento para ${active.patient}.`,
    );
  };

  const createFuturePatient = async () => {
    const firstName = newFuturePatient.firstName.trim();
    const lastName = newFuturePatient.lastName.trim();
    const phone = newFuturePatient.phone.trim();

    if (!firstName || !lastName) {
      notify("Datos incompletos", "Nombre y apellido son obligatorios.");
      return;
    }

    if (!phone) {
      notify("Datos incompletos", "El teléfono es necesario para WhatsApp.");
      return;
    }

    setCreatingFuturePatient(true);

    const personId = crypto.randomUUID();
    const clinicPersonId = crypto.randomUUID();
    const intakeId = crypto.randomUUID();

    const { error: personError } = await supabase.from("persons").insert({
      id: personId,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      email: newFuturePatient.email.trim() || null,
      document_number: newFuturePatient.documentNumber.trim() || null,
    });

    if (personError) {
      console.error("Error creating person:", JSON.stringify(personError, null, 2));
      notify("Error", personError.message || "No se pudo crear la persona.");
      setCreatingFuturePatient(false);
      return;
    }

    const { error: clinicPersonError } = await supabase
      .from("clinic_persons")
      .insert({
        id: clinicPersonId,
        clinic_id: DEFAULT_CLINIC_ID,
        person_id: personId,
      });

    if (clinicPersonError) {
      console.error(
        "Error creating clinic person:",
        JSON.stringify(clinicPersonError, null, 2),
      );
      notify(
        "Error",
        clinicPersonError.message || "No se pudo crear la relación con la clínica.",
      );
      setCreatingFuturePatient(false);
      return;
    }

    const { error: intakeError } = await supabase
      .from("patient_intake_pipeline")
      .insert({
        id: intakeId,
        clinic_id: DEFAULT_CLINIC_ID,
        clinic_person_id: clinicPersonId,
        source: newFuturePatient.source.trim() || null,
        intake_status: "new_lead",
        interest_type: newFuturePatient.interestType.trim() || null,
        priority: newFuturePatient.priority,
        next_action: "Primer contacto por WhatsApp",
        notes: newFuturePatient.notes.trim() || null,
      });

    if (intakeError) {
      console.error("Error creating intake:", JSON.stringify(intakeError, null, 2));
      notify("Error", intakeError.message || "No se pudo crear el paciente futuro.");
      setCreatingFuturePatient(false);
      return;
    }

    setNewFuturePatient({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      documentNumber: "",
      source: "",
      interestType: "",
      notes: "",
      priority: "normal",
    });

    setShowNewFuturePatientForm(false);
    setCreatingFuturePatient(false);
    setViewMode("future");

    notify("Paciente futuro creado", `${firstName} ${lastName}`);

    await Promise.all([loadPatients(), loadFuturePatients()]);

    setActiveFutureIntakeId(intakeId);
  };

  const updateFutureStatus = async (status: IntakeStatus) => {
    if (!activeFuture) return;

    setUpdatingIntakeStatus(true);

    const { error } = await supabase
      .from("patient_intake_pipeline")
      .update({
        intake_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeFuture.intakeId);

    if (error) {
      console.error("Error updating intake status:", JSON.stringify(error, null, 2));
      notify("Error", error.message || "No se pudo actualizar el estado.");
      setUpdatingIntakeStatus(false);
      return;
    }

    setFuturePatients((currentPatients) =>
      currentPatients.map((patient) =>
        patient.intakeId === activeFuture.intakeId
          ? {
            ...patient,
            intakeStatus: status,
          }
          : patient,
      ),
    );

    setUpdatingIntakeStatus(false);
    notify("Estado actualizado", getStatusLabel(status));
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="w-80 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[14px] font-semibold tracking-tight">
                Comunicaciones
              </h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                WhatsApp & follow-up
              </p>
            </div>

            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-primary font-medium">
              {viewMode === "current"
                ? `${patients.length} pacientes`
                : `${activeFutureCount} candidatos`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => {
                setViewMode("current");
                setSearch("");
              }}
              className={cn(
                "h-8 rounded-md text-[11px] font-medium border transition-colors",
                viewMode === "current"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-secondary",
              )}
            >
              Pacientes
            </button>

            <button
              onClick={() => {
                setViewMode("future");
                setSearch("");
              }}
              className={cn(
                "h-8 rounded-md text-[11px] font-medium border transition-colors",
                viewMode === "future"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-secondary",
              )}
            >
              Candidatos
            </button>
          </div>

          <div className="flex items-center h-8 bg-secondary rounded-md px-2.5">
            <Search className="size-3.5 text-muted-foreground mr-2" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="bg-transparent outline-none text-[12px] flex-1 placeholder:text-muted-foreground"
              placeholder={
                viewMode === "current"
                  ? "Buscar paciente…"
                  : "Buscar paciente futuro…"
              }
            />
          </div>

          {viewMode === "future" && (
            <button
              onClick={() =>
                setShowNewFuturePatientForm((currentValue) => !currentValue)
              }
              className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-[12px] font-medium rounded-md h-8 hover:bg-primary/90"
            >
              <Plus className="size-3.5" />
              Nuevo candidato
            </button>
          )}

          {viewMode === "future" && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="rounded-lg bg-secondary/70 p-2">
                <p className="text-[10px] text-muted-foreground">Activos</p>
                <p className="text-sm font-semibold">{activeFutureCount}</p>
              </div>

              <div className="rounded-lg bg-secondary/70 p-2">
                <p className="text-[10px] text-muted-foreground">Conv.</p>
                <p className="text-sm font-semibold">{convertedFutureCount}</p>
              </div>

              <div className="rounded-lg bg-secondary/70 p-2">
                <p className="text-[10px] text-muted-foreground">Perd.</p>
                <p className="text-sm font-semibold">{lostFutureCount}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-4 text-[12px] text-muted-foreground flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin" />
              Cargando...
            </div>
          )}

          {!loading && viewMode === "current" && filteredPatients.length === 0 && (
            <div className="p-4 text-[12px] text-muted-foreground">
              No hay pacientes disponibles para comunicación.
            </div>
          )}

          {!loading &&
            viewMode === "future" &&
            filteredFuturePatients.length === 0 && (
              <div className="p-4 text-[12px] text-muted-foreground">
                No hay candidatos registrados.
              </div>
            )}

          {viewMode === "current" &&
            filteredPatients.map((patient) => (
              <button
                key={patient.clinicPersonId}
                onClick={() => setActiveClinicPersonId(patient.clinicPersonId)}
                className={cn(
                  "w-full text-left p-3.5 border-b border-border/50 hover:bg-secondary/60 transition-colors",
                  patient.clinicPersonId === activeClinicPersonId &&
                  "bg-accent/40",
                )}
              >
                <PatientCard patient={patient} />
              </button>
            ))}

          {viewMode === "future" &&
            filteredFuturePatients.map((patient) => (
              <button
                key={patient.intakeId}
                onClick={() => setActiveFutureIntakeId(patient.intakeId)}
                className={cn(
                  "w-full text-left p-3.5 border-b border-border/50 hover:bg-secondary/60 transition-colors",
                  patient.intakeId === activeFutureIntakeId && "bg-accent/40",
                )}
              >
                <FuturePatientCard patient={patient} />
              </button>
            ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-background min-w-0">
        <div className="h-14 border-b border-border bg-card flex items-center justify-between px-5">
          <div>
            <h1 className="text-[14px] font-semibold">
              {viewMode === "current" ? "Pacientes actuales" : "Candidatos"}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {viewMode === "current"
                ? "Comunicación y seguimiento de pacientes registrados"
                : "Intake, admisión y seguimiento previo al proceso clínico"}
            </p>
          </div>

          <button
            onClick={refreshAll}
            disabled={loadingPatients || loadingFuturePatients}
            className="inline-flex items-center gap-2 bg-card border border-border text-[12px] font-medium rounded-md py-1.5 px-3 hover:bg-secondary disabled:opacity-50"
          >
            {loadingPatients || loadingFuturePatients ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Refresh
          </button>
        </div>

        {showNewFuturePatientForm && viewMode === "future" && (
          <NewFuturePatientForm
            form={newFuturePatient}
            setForm={setNewFuturePatient}
            creating={creatingFuturePatient}
            onCancel={() => setShowNewFuturePatientForm(false)}
            onCreate={createFuturePatient}
          />
        )}

        {active && (
          <div className="h-14 border-b border-border bg-card flex items-center justify-between px-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 rounded-full bg-accent text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
                {getInitials(active.patient)}
              </div>

              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate">
                  {active.patient}
                </p>

                <p className="text-[10px] text-muted-foreground truncate">
                  {active.clinicPersonId} · WhatsApp
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {active.phone && whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] bg-secondary text-foreground px-3 py-1.5 rounded-md font-medium inline-flex items-center gap-1.5 hover:bg-accent"
                >
                  <MessageCircle className="size-3.5" />
                  Vista WhatsApp
                </a>
              )}

              <button
                onClick={createFollowUpTask}
                disabled={creatingFollowUp}
                className="text-[12px] bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium inline-flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-50"
              >
                {creatingFollowUp ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Bell className="size-3.5" />
                )}
                Crear follow-up
              </button>

              {viewMode === "current" && active?.personId && (
                <Link
                  to="/patients/$patientId"
                  params={{ patientId: active.personId }}
                  className="text-[12px] text-primary font-medium hover:underline inline-flex items-center gap-1"
                >
                  Open patient <ChevronRight className="size-3" />
                </Link>
              )}
            </div>
          </div>
        )}

        {!active && !showNewFuturePatientForm && (
          <div className="flex-1 flex items-center justify-center text-[13px] text-muted-foreground">
            Selecciona un paciente para iniciar comunicación.
          </div>
        )}

        {active && (
          <>
            <div className="mx-5 mt-4 rounded-lg border border-accent bg-accent/40 px-3.5 py-2.5 flex items-start gap-2.5">
              <Sparkles className="size-3.5 text-primary mt-0.5 shrink-0" />

              <div className="text-[11px] text-foreground/80 leading-snug">
                <span className="font-semibold text-primary">Contexto · </span>
                Esta comunicación se guardará en la tabla{" "}
                <span className="font-semibold">communications</span> con canal{" "}
                <span className="font-semibold">whatsapp</span> y dirección{" "}
                <span className="font-semibold">outbound</span>.
                {viewMode === "future" && (
                  <>
                    {" "}
                    El seguimiento se registrará como{" "}
                    <span className="font-semibold">intake_follow_up</span>.
                  </>
                )}
                {active.phone ? (
                  <span className="text-muted-foreground">
                    {" "}
                    Número registrado: {active.phone}.
                  </span>
                ) : (
                  <span className="text-destructive">
                    {" "}
                    Este paciente no tiene número registrado en persons.phone.
                  </span>
                )}
              </div>
            </div>

            {viewMode === "future" && activeFuture && (
              <div className="mx-5 mt-4 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold">Estado de admisión</h3>
                    <p className="text-xs text-muted-foreground">
                      Actualiza la etapa del paciente futuro.
                    </p>
                  </div>

                  {updatingIntakeStatus && (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {intakeStatusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateFutureStatus(option.value)}
                      disabled={updatingIntakeStatus}
                      className={cn(
                        "text-[11px] px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50",
                        activeFuture.intakeStatus === option.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-secondary",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {thread.map((message, index) => (
                <div
                  key={`${message.t}-${index}`}
                  className={cn(
                    "flex flex-col gap-1",
                    message.self ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed max-w-[70%]",
                      message.self
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border text-foreground rounded-tl-sm",
                    )}
                  >
                    {message.body}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span>
                      {message.who} · {message.t}
                    </span>

                    {message.status && (
                      <>
                        <span>·</span>
                        <CheckCircle2 className="size-3" />
                        <span>{message.status}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 pb-2 flex flex-wrap gap-2">
              {aiReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => setDraft(reply)}
                  className="text-[11px] px-2.5 h-7 rounded-full bg-card border border-accent text-foreground hover:bg-accent transition-colors inline-flex items-center gap-1.5"
                >
                  <Sparkles className="size-3 text-primary" />
                  {reply}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-2 bg-secondary/70 px-3 py-2 rounded-xl">
            <button
              onClick={() => notify("Attachment", "PDF / lab report picker")}
              className="size-7 rounded-md hover:bg-card flex items-center justify-center"
              disabled={!active}
            >
              <Paperclip className="size-3.5 text-muted-foreground" />
            </button>

            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  createCommunicationAndOpenWhatsApp();
                }
              }}
              disabled={!active}
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
              placeholder={
                active
                  ? `Escribir a ${active.patient.split(" ")[0]} por WhatsApp…`
                  : "Selecciona un paciente..."
              }
            />

            <button
              onClick={createFollowUpTask}
              className="size-7 rounded-md hover:bg-card flex items-center justify-center"
              disabled={!active || creatingFollowUp}
              title="Crear tarea de seguimiento"
            >
              {creatingFollowUp ? (
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              ) : (
                <Bell className="size-3.5 text-muted-foreground" />
              )}
            </button>

            <button
              onClick={() => createCommunicationAndOpenWhatsApp()}
              disabled={!active || !draft.trim() || creatingCommunication}
              className="size-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Guardar comunicación y abrir WhatsApp"
            >
              {creatingCommunication ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function PatientCard({ patient }: { patient: CommunicationPatient }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-9 rounded-full bg-accent text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
        {getInitials(patient.patient)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-semibold truncate">{patient.patient}</p>
        </div>

        <p className="text-[10px] text-muted-foreground truncate">
          {patient.stage}
        </p>

        {patient.documentNumber && (
          <p className="text-[10px] truncate mt-0.5 text-muted-foreground">
            Doc. {patient.documentNumber}
          </p>
        )}

        <div className="flex items-center gap-1 mt-1">
          {patient.phone ? (
            <>
              <MessageCircle className="size-3 text-muted-foreground" />
              <p className="text-[10px] truncate text-muted-foreground">
                {patient.phone}
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="size-3 text-destructive" />
              <p className="text-[10px] truncate text-destructive">
                Sin teléfono
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FuturePatientCard({ patient }: { patient: FuturePatient }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-9 rounded-full bg-accent text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
        {getInitials(patient.patient)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-semibold truncate">{patient.patient}</p>
        </div>

        <p className="text-[10px] text-muted-foreground truncate">
          {patient.interestType || "Interés no definido"}
        </p>

        <div className="flex items-center gap-1 mt-1">
          <span className={getStatusClass(patient.intakeStatus)}>
            {getStatusLabel(patient.intakeStatus)}
          </span>

          <span className={getPriorityClass(patient.priority)}>
            {patient.priority}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-1">
          {patient.phone ? (
            <>
              <MessageCircle className="size-3 text-muted-foreground" />
              <p className="text-[10px] truncate text-muted-foreground">
                {patient.phone}
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="size-3 text-destructive" />
              <p className="text-[10px] truncate text-destructive">
                Sin teléfono
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NewFuturePatientForm({
  form,
  setForm,
  creating,
  onCancel,
  onCreate,
}: {
  form: NewFuturePatientForm;
  setForm: React.Dispatch<React.SetStateAction<NewFuturePatientForm>>;
  creating: boolean;
  onCancel: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="m-5 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Nuevo candidato</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={form.firstName}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              firstName: event.target.value,
            }))
          }
          placeholder="Nombre"
          className="h-9 rounded-md bg-secondary px-3 text-sm outline-none"
        />

        <input
          value={form.lastName}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              lastName: event.target.value,
            }))
          }
          placeholder="Apellido"
          className="h-9 rounded-md bg-secondary px-3 text-sm outline-none"
        />

        <input
          value={form.phone}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              phone: event.target.value,
            }))
          }
          placeholder="Teléfono / WhatsApp"
          className="h-9 rounded-md bg-secondary px-3 text-sm outline-none"
        />

        <input
          value={form.email}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              email: event.target.value,
            }))
          }
          placeholder="Email"
          className="h-9 rounded-md bg-secondary px-3 text-sm outline-none"
        />

        <input
          value={form.documentNumber}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              documentNumber: event.target.value,
            }))
          }
          placeholder="Documento"
          className="h-9 rounded-md bg-secondary px-3 text-sm outline-none"
        />

        <input
          value={form.source}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              source: event.target.value,
            }))
          }
          placeholder="Fuente: Instagram, referido, web..."
          className="h-9 rounded-md bg-secondary px-3 text-sm outline-none"
        />

        <input
          value={form.interestType}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              interestType: event.target.value,
            }))
          }
          placeholder="Interés: fertilidad, FIV, consulta..."
          className="h-9 rounded-md bg-secondary px-3 text-sm outline-none"
        />

        <select
          value={form.priority}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              priority: event.target.value as Priority,
            }))
          }
          className="h-9 rounded-md bg-secondary px-3 text-sm outline-none"
        >
          {priorityOptions.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>

        <input
          value={form.notes}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              notes: event.target.value,
            }))
          }
          placeholder="Notas"
          className="h-9 rounded-md bg-secondary px-3 text-sm outline-none"
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onCancel}
          className="text-[12px] px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80"
        >
          Cancelar
        </button>

        <button
          onClick={onCreate}
          disabled={creating}
          className="text-[12px] px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {creating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          Crear paciente futuro
        </button>
      </div>
    </div>
  );
}