// ============================================================
// PATIENT DETAIL PAGE - MULTI MEDICATION + MANUAL WHATSAPP REMINDER
// clinic_persons + prescriptions.clinic_patient_id
// prescription_items supports multiple medications per prescription
// No Edge Function / No email provider required
// ============================================================

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { runMockAction } from "@/lib/mock-actions";

import {
  ArrowLeft,
  Sparkles,
  Phone,
  MessageCircle,
  Pill,
  FlaskConical,
  CheckCircle2,
  X,
  Plus,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patients_/$patientId")({
  component: PatientDetailPage,
});

const CLINIC_ID = "385f976d-2e25-4af3-91da-5d347acaa54f";

// ============================================================
// TYPES
// ============================================================

interface Patient {
  id: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  biological_sex: string | null;
  document_number: string | null;
  document_type?: string | null;
  gender?: string | null;
  created_at?: string | null;
}

interface ClinicPerson {
  id: string;
  clinic_id: string;
  person_id: string;
  internal_patient_code: string | null;
  status: string | null;
  first_visit_at: string | null;
  last_visit_at: string | null;
  created_at: string | null;
}

interface Product {
  id: string;
  name: string;
  generic_name: string | null;
  category: string | null;
  presentation: string | null;
  unit_of_measure: string | null;
  storage_condition: string | null;
  temperature_min: number | null;
  temperature_max: number | null;
  invima_registration: string | null;
  strength_value: number | null;
  active: boolean | null;
}

interface InventoryLot {
  id: string;
  clinic_id: string;
  product_id: string;
  supplier_id: string | null;
  location_id: string | null;
  internal_lot_code: string | null;
  manufacturer_lot: string | null;
  expiration_date: string | null;
  manufacture_date: string | null;
  status: string | null;
  quantity_initial: number | null;
  quantity_available: number | null;
  quantity_reserved: number | null;
  quantity_consumed: number | null;
  unit_cost: number | null;
  received_at: string | null;
  products?: Product | null;
  locations?: {
    id: string;
    name: string | null;
  } | null;
}

interface PrescriptionHistoryItem {
  id: string;
  prescription_type: string | null;
  status: string | null;
  clinical_reason: string | null;
  created_at: string | null;
  prescription_items?: PrescriptionHistoryMedication[];
}

interface PrescriptionHistoryMedication {
  id: string;
  medication_id: string | null;
  medication_name?: string | null;
  dose: string | null;
  route: string | null;
  frequency: string | null;
  duration_days: number | null;
  start_datetime: string | null;
  quantity_required: number | null;
  quantity_unit: string | null;
  inventory_status: string | null;
  instructions?: string | null;
}

interface MedicationDraft {
  local_id: string;
  product_id: string;
  lot_id: string;
  dose: string;
  route: string;
  start_at: string;
  units_per_dose: string;
  frequency_every_hours: string;
  duration_days: string;
  instructions: string;
}

const stages = [
  { label: "Baseline", short: "BL", status: "done" as const, when: "May 10" },
  { label: "Stimulation", short: "ST", status: "done" as const, when: "May 11–18" },
  { label: "Trigger", short: "TR", status: "active" as const, when: "Tonight 21:45" },
  { label: "Retrieval", short: "RT", status: "next" as const, when: "May 23" },
  { label: "Embryo Dev", short: "ED", status: "pending" as const, when: "May 23–28" },
  { label: "Transfer", short: "TX", status: "pending" as const, when: "May 28" },
  { label: "Follow-up", short: "FU", status: "pending" as const, when: "Jun 11" },
];

const timeline = [
  {
    time: "Today · 15:02",
    icon: MessageCircle,
    title: "Patient asked about prenatal vitamins",
    meta: "WhatsApp · unread",
  },
  {
    time: "Today · 14:12",
    icon: MessageCircle,
    title: "Trigger reminder sent automatically",
    meta: "Template: trigger_t-7h",
  },
];

// ============================================================
// PAGE
// ============================================================

function PatientDetailPage() {
  const { patientId } = Route.useParams();

  const [rxOpen, setRxOpen] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [clinicPerson, setClinicPerson] = useState<ClinicPerson | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  useEffect(() => {
    if (clinicPerson?.id) {
      loadPrescriptionHistory(clinicPerson.id);
    }
  }, [clinicPerson?.id]);

  async function loadPatient() {
    setLoading(true);

    const { data: patientData, error: patientError } = await supabase
      .from("persons")
      .select("*")
      .eq("id", patientId)
      .single();

    console.log("PATIENT", patientData);
    console.log("PATIENT ERROR", patientError);

    if (patientError || !patientData) {
      setPatient(null);
      setClinicPerson(null);
      setLoading(false);
      return;
    }

    const { data: clinicPersonData, error: clinicPersonError } = await supabase
      .from("clinic_persons")
      .select("*")
      .eq("person_id", patientId)
      .eq("clinic_id", CLINIC_ID)
      .maybeSingle();

    console.log("CLINIC PERSON", clinicPersonData);
    console.log("CLINIC PERSON ERROR", clinicPersonError);

    setPatient(patientData as Patient);
    setClinicPerson((clinicPersonData as ClinicPerson) ?? null);

    setLoading(false);
  }

  async function loadPrescriptionHistory(clinicPersonId: string) {
    const { data, error } = await supabase
      .from("prescriptions")
      .select(`
        id,
        prescription_type,
        status,
        clinical_reason,
        created_at,
        prescription_items (
          id,
          medication_id,
          dose,
          route,
          frequency,
          duration_days,
          start_datetime,
          quantity_required,
          quantity_unit,
          inventory_status,
          instructions
        )
      `)
      .eq("clinic_patient_id", clinicPersonId)
      .order("created_at", { ascending: false });

    console.log("PRESCRIPTION HISTORY", data);
    console.log("PRESCRIPTION HISTORY ERROR", error);

    if (error || !data) {
      setPrescriptions([]);
      return;
    }

    const medicationIds = Array.from(
      new Set(
        data
          .flatMap((prescription: any) => prescription.prescription_items ?? [])
          .map((item: any) => item.medication_id)
          .filter(Boolean)
      )
    );

    let productMap: Record<string, Product> = {};

    if (medicationIds.length > 0) {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .in("id", medicationIds);

      console.log("HISTORY PRODUCTS", productsData);
      console.log("HISTORY PRODUCTS ERROR", productsError);

      if (!productsError && productsData) {
        productMap = Object.fromEntries(
          (productsData as Product[]).map((product) => [product.id, product])
        );
      }
    }

    const enriched = data.map((prescription: any) => ({
      ...prescription,
      prescription_items: (prescription.prescription_items ?? []).map(
        (item: any) => ({
          ...item,
          medication_name:
            item.medication_id && productMap[item.medication_id]
              ? productMap[item.medication_id].name
              : null,
        })
      ),
    }));

    setPrescriptions(enriched as PrescriptionHistoryItem[]);
  }

  const fullName = patient
    ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim()
    : "Loading patient...";

  const initials = patient
    ? `${patient.first_name?.[0] ?? ""}${patient.last_name?.[0] ?? ""}`
    : "--";

  const age = patient?.birth_date
    ? new Date().getFullYear() - new Date(patient.birth_date).getFullYear()
    : "--";

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-[13px] text-muted-foreground">
          Loading patient...
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <div className="text-[13px] text-muted-foreground">
          Patient not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <Link
        to="/patients"
        className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        All patients
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-full bg-accent text-primary flex items-center justify-center text-base font-semibold">
              {initials}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">
                  {fullName}
                </h1>

                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent text-primary">
                  Trigger phase
                </span>

                {!clinicPerson && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-warning/15 text-warning">
                    No clinic person record
                  </span>
                )}
              </div>

              <p className="text-[12px] text-muted-foreground mt-0.5">
                {patient.document_number ?? patient.id}
                {" · "}
                {age} yrs
                {" · "}
                IVF Treatment
              </p>

              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                {patient.phone && <span>📞 {patient.phone}</span>}
                {patient.email && <span>✉️ {patient.email}</span>}

                {patient.biological_sex && (
                  <span>Biological sex: {patient.biological_sex}</span>
                )}

                {clinicPerson?.internal_patient_code && (
                  <span>
                    Internal code: {clinicPerson.internal_patient_code}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="h-9 px-3 rounded-md bg-secondary text-[12px] font-medium inline-flex items-center gap-1.5 hover:bg-accent transition-colors">
              <MessageCircle className="size-3.5" />
              Message
            </button>

            <button className="h-9 px-3 rounded-md bg-secondary text-[12px] font-medium inline-flex items-center gap-1.5 hover:bg-accent transition-colors">
              <Phone className="size-3.5" />
              Call
            </button>

            <button
              onClick={() => setRxOpen(true)}
              disabled={!clinicPerson}
              className={cn(
                "h-9 px-3 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors",
                clinicPerson
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Plus className="size-3.5" />
              Create prescription
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-accent/60 border border-accent p-3.5 flex gap-3">
          <div className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" />
          </div>

          <p className="text-[12px] text-foreground/80 leading-relaxed">
            <span className="font-semibold text-primary">AI summary ·</span>{" "}
            Patient currently in stimulation workflow. Review hormone response,
            medication adherence, and embryo planning before next procedure.
          </p>
        </div>

        <div className="mt-6 relative pt-2 pb-1">
          <div className="absolute left-0 right-0 top-[18px] h-px bg-border" />

          <div
            className="absolute left-0 top-[17px] h-[3px] bg-primary rounded-full"
            style={{
              width: `${(2.5 / stages.length) * 100}%`,
            }}
          />

          <div className="relative grid grid-cols-7 gap-1">
            {stages.map((stage) => (
              <div
                key={stage.label}
                className="flex flex-col items-center text-center"
              >
                <div
                  className={cn(
                    "size-9 rounded-full flex items-center justify-center text-[11px] font-semibold ring-4 ring-card",
                    stage.status === "done" &&
                      "bg-primary text-primary-foreground",
                    stage.status === "active" &&
                      "bg-card border-2 border-primary text-primary",
                    stage.status === "next" &&
                      "bg-accent text-primary border border-accent",
                    stage.status === "pending" &&
                      "bg-card border border-border text-muted-foreground"
                  )}
                >
                  {stage.status === "done" ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    stage.short
                  )}
                </div>

                <p className="mt-2 text-[11px] font-medium">{stage.label}</p>
                <p className="text-[10px] text-muted-foreground">
                  {stage.when}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-semibold">Patient timeline</h2>

              <p className="text-[11px] text-muted-foreground mt-0.5">
                All clinical and operational events
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

            <ul className="space-y-4">
              {timeline.map((event, index) => (
                <li key={index} className="relative flex gap-3">
                  <div className="size-8 rounded-full border flex items-center justify-center shrink-0 bg-card z-10">
                    <event.icon className="size-3.5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-medium">{event.title}</p>

                      <span className="text-[10px] text-muted-foreground">
                        {event.time}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {event.meta}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <SidePanel title="Patient info" icon={Pill}>
            <Row label="Document" value={patient.document_number ?? "-"} />
            <Row label="Age" value={`${age} yrs`} />
            <Row label="Phone" value={patient.phone ?? "-"} />
            <Row label="Email" value={patient.email ?? "-"} />
            <Row
              label="Clinic person"
              value={clinicPerson?.id ? "Linked" : "Missing"}
              tone={clinicPerson?.id ? "success" : "warning"}
            />
          </SidePanel>

          <SidePanel title="Lab & embryos" icon={FlaskConical}>
            <Row label="Follicles ≥17mm" value="14" tone="success" />
            <Row label="Estradiol" value="2,840 pg/mL" />
          </SidePanel>

          <SidePanel title="Prescription history" icon={Pill}>
            {prescriptions.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                No prescriptions yet.
              </p>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((prescription) => {
                  const reminderMessage = buildPrescriptionReminderMessage({
                    patientName: fullName,
                    prescription,
                  });

                  return (
                    <div
                      key={prescription.id}
                      className="rounded-lg border border-border bg-secondary/30 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold">
                          {prescription.prescription_type ?? "Prescription"}
                        </p>

                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-primary font-medium">
                          {prescription.status ?? "—"}
                        </span>
                      </div>

                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatShortDate(prescription.created_at)}
                      </p>

                      {prescription.clinical_reason && (
                        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">
                          {prescription.clinical_reason}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openWhatsAppReminder({
                              phone: patient.phone,
                              message: reminderMessage,
                            })
                          }
                          className="h-8 px-2 rounded-md bg-secondary text-[11px] font-medium inline-flex items-center gap-1.5 hover:bg-accent transition-colors"
                        >
                          <MessageCircle className="size-3.5" />
                          WhatsApp reminder
                        </button>
                      </div>

                      <div className="mt-3 space-y-2">
                        {(prescription.prescription_items ?? []).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-md bg-card border border-border p-2"
                          >
                            <p className="text-[11px] font-medium">
                              {item.medication_name ?? "Medication"}
                            </p>

                            <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                              <span>Dose: {item.dose ?? "-"}</span>
                              <span>Route: {item.route ?? "-"}</span>
                              <span>Freq: {item.frequency ?? "-"}</span>
                              <span>Days: {item.duration_days ?? "-"}</span>
                              <span>
                                Qty: {item.quantity_required ?? "-"}{" "}
                                {item.quantity_unit ?? ""}
                              </span>
                              <span>
                                Inventory: {item.inventory_status ?? "-"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SidePanel>
        </div>
      </div>

      {rxOpen && clinicPerson && (
        <PrescriptionPanel
          patientId={patient.id}
          clinicPersonId={clinicPerson.id}
          patientName={fullName}
          onPrescriptionCreated={() => loadPrescriptionHistory(clinicPerson.id)}
          onClose={() => setRxOpen(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// PRESCRIPTION PANEL
// ============================================================

function PrescriptionPanel({
  patientId,
  clinicPersonId,
  patientName,
  onPrescriptionCreated,
  onClose,
}: {
  patientId: string;
  clinicPersonId: string;
  patientName: string;
  onPrescriptionCreated: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [lots, setLots] = useState<InventoryLot[]>([]);

  const [prescriptionType, setPrescriptionType] = useState("MEDICATION");
  const [linkedProtocol, setLinkedProtocol] = useState("Antagonist IVF");

  const [clinicalReason, setClinicalReason] = useState(
    "Medication plan for current treatment cycle"
  );

  const [medications, setMedications] = useState<MedicationDraft[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [productsRes, lotsRes] = await Promise.all([
      supabase.from("products").select("*").eq("active", true).order("name"),

      supabase
        .from("inventory_lots")
        .select(`
          *,
          products (
            id,
            name,
            generic_name,
            category,
            presentation,
            unit_of_measure,
            storage_condition,
            temperature_min,
            temperature_max,
            invima_registration,
            strength_value,
            active
          ),
          locations (
            id,
            name
          )
        `)
        .eq("clinic_id", CLINIC_ID)
        .gt("quantity_available", 0),
    ]);

    console.log("PRODUCTS", productsRes.data);
    console.log("PRODUCTS ERROR", productsRes.error);

    console.log("LOTS", lotsRes.data);
    console.log("LOTS ERROR", lotsRes.error);

    const productsData = (productsRes.data ?? []) as Product[];
    const lotsData = (lotsRes.data ?? []) as InventoryLot[];

    setProducts(productsData);
    setLots(lotsData);

    if (productsData.length > 0) {
      setMedications([createEmptyMedication(productsData[0], lotsData)]);
    }

    setLoading(false);
  }

  function createEmptyMedication(
    product: Product | undefined,
    availableLots: InventoryLot[]
  ): MedicationDraft {
    const productLots = product ? getProductLots(product.id, availableLots) : [];

    return {
      local_id: crypto.randomUUID(),
      product_id: product?.id ?? "",
      lot_id: productLots[0]?.id ?? "",
      dose: product?.strength_value
        ? `${product.strength_value} ${product.unit_of_measure ?? ""}`.trim()
        : "",
      route: "Subcutaneous",
      start_at: "",
      units_per_dose: "1",
      frequency_every_hours: "24",
      duration_days: "1",
      instructions: "",
    };
  }

  function addMedication() {
    const firstProduct = products[0];

    if (!firstProduct) {
      alert("No products available");
      return;
    }

    setMedications((current) => [
      ...current,
      createEmptyMedication(firstProduct, lots),
    ]);
  }

  function removeMedication(localId: string) {
    setMedications((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((item) => item.local_id !== localId);
    });
  }

  function updateMedication(localId: string, patch: Partial<MedicationDraft>) {
    setMedications((current) =>
      current.map((item) =>
        item.local_id === localId ? { ...item, ...patch } : item
      )
    );
  }

  function handleProductChange(localId: string, productId: string) {
    const product = products.find((item) => item.id === productId);
    const productLots = getProductLots(productId, lots);

    updateMedication(localId, {
      product_id: productId,
      lot_id: productLots[0]?.id ?? "",
      dose: product?.strength_value
        ? `${product.strength_value} ${product.unit_of_measure ?? ""}`.trim()
        : "",
    });
  }

  function getProductById(productId: string) {
    return products.find((product) => product.id === productId);
  }

  function getLotById(lotId: string) {
    return lots.find((lot) => lot.id === lotId);
  }

  function getProductLots(productId: string, sourceLots = lots) {
    return sourceLots
      .filter(
        (lot) =>
          lot.product_id === productId &&
          Number(lot.quantity_available ?? 0) > 0
      )
      .sort((a, b) => {
        const dateA = a.expiration_date
          ? new Date(a.expiration_date).getTime()
          : Number.MAX_SAFE_INTEGER;

        const dateB = b.expiration_date
          ? new Date(b.expiration_date).getTime()
          : Number.MAX_SAFE_INTEGER;

        return dateA - dateB;
      });
  }

  function calculateMedication(item: MedicationDraft) {
    const durationHours = Number(item.duration_days || 0) * 24;

    const dosesCount =
      Number(item.frequency_every_hours || 0) > 0
        ? Math.ceil(durationHours / Number(item.frequency_every_hours))
        : 0;

    const totalUnitsRequired = dosesCount * Number(item.units_per_dose || 0);

    const selectedLot = getLotById(item.lot_id);

    const availableUnits = Number(selectedLot?.quantity_available ?? 0);
    const reservedUnits = Number(selectedLot?.quantity_reserved ?? 0);
    const remainingAfterReservation = availableUnits - totalUnitsRequired;

    const hasEnoughInventory =
      !!selectedLot &&
      totalUnitsRequired > 0 &&
      availableUnits >= totalUnitsRequired;

    return {
      durationHours,
      dosesCount,
      totalUnitsRequired,
      selectedLot,
      availableUnits,
      reservedUnits,
      remainingAfterReservation,
      hasEnoughInventory,
    };
  }

  const prescriptionSummary = useMemo(() => {
    let totalRequired = 0;
    let allValid = medications.length > 0;

    for (const medication of medications) {
      const calc = calculateMedication(medication);

      totalRequired += calc.totalUnitsRequired;

      if (
        !medication.product_id ||
        !medication.lot_id ||
        !medication.start_at ||
        Number(medication.units_per_dose) <= 0 ||
        Number(medication.frequency_every_hours) <= 0 ||
        Number(medication.duration_days) <= 0 ||
        calc.totalUnitsRequired <= 0 ||
        !calc.hasEnoughInventory
      ) {
        allValid = false;
      }
    }

    return {
      totalRequired,
      allValid,
      medicationCount: medications.length,
    };
  }, [medications, lots]);

  async function createPrescription() {
    try {
      setSaving(true);

      if (!clinicPersonId) {
        alert("Patient is not associated with this clinic");
        return;
      }

      if (medications.length === 0) {
        alert("At least one medication is required");
        return;
      }

      for (const medication of medications) {
        const product = getProductById(medication.product_id);
        const calc = calculateMedication(medication);

        if (!product) {
          alert("Medication is required");
          return;
        }

        if (!calc.selectedLot) {
          alert(`No inventory lot selected for ${product.name}`);
          return;
        }

        if (!medication.start_at) {
          alert(`Start date and time is required for ${product.name}`);
          return;
        }

        if (Number(medication.units_per_dose) <= 0) {
          alert(`Units per dose must be greater than zero for ${product.name}`);
          return;
        }

        if (Number(medication.frequency_every_hours) <= 0) {
          alert(`Frequency must be greater than zero for ${product.name}`);
          return;
        }

        if (Number(medication.duration_days) <= 0) {
          alert(`Duration must be greater than zero for ${product.name}`);
          return;
        }

        if (!calc.hasEnoughInventory) {
          alert(
            `Insufficient inventory for ${product.name}. Required: ${calc.totalUnitsRequired}, available: ${calc.availableUnits}`
          );
          return;
        }
      }

      const prescriptionPayload = {
        clinic_id: CLINIC_ID,
        clinic_patient_id: clinicPersonId,
        fertility_case_id: null,
        treatment_cycle_id: null,
        physician_id: null,
        prescription_type: prescriptionType,
        status: "ACTIVE",
        clinical_reason: clinicalReason,
        created_at: new Date().toISOString(),
      };

      const { data: prescription, error: prescriptionError } = await supabase
        .from("prescriptions")
        .insert(prescriptionPayload)
        .select()
        .single();

      console.log("PRESCRIPTION", prescription);
      console.log("PRESCRIPTION ERROR", prescriptionError);

      if (prescriptionError || !prescription) {
        console.error("PRESCRIPTION ERROR", prescriptionError);
        alert("Could not create prescription");
        return;
      }

      for (const medication of medications) {
        const product = getProductById(medication.product_id);
        const calc = calculateMedication(medication);

        if (!product || !calc.selectedLot) {
          alert("Medication or lot not found");
          return;
        }

        const startDate = parseDatetimeLocal(medication.start_at);
        const endDate = addDays(startDate, Number(medication.duration_days));

        const currentAvailable = Number(
          calc.selectedLot.quantity_available ?? 0
        );

        const currentReserved = Number(
          calc.selectedLot.quantity_reserved ?? 0
        );

        const prescriptionItemId = crypto.randomUUID();

        const frequency = `Every ${medication.frequency_every_hours} hours`;

        const instructions = medication.instructions?.trim() || clinicalReason;

        const quantityUnit =
          product.presentation ?? product.unit_of_measure ?? "units";

        const { data: prescriptionItem, error: itemError } = await supabase
          .from("prescription_items")
          .insert({
            id: prescriptionItemId,
            prescription_id: prescription.id,
            medication_id: medication.product_id,
            dose: medication.dose,
            route: medication.route,
            frequency,
            duration_days: Number(medication.duration_days),
            start_datetime: formatTimestampWithoutTimezone(startDate),
            end_datetime: formatTimestampWithoutTimezone(endDate),
            administration_time: getTimeFromDatetimeLocal(medication.start_at),
            instructions,
            quantity_required: calc.totalUnitsRequired,
            quantity_unit: quantityUnit,
            status: "ACTIVE",
            inventory_status: "RESERVED",
          })
          .select()
          .single();

        console.log("PRESCRIPTION ITEM", prescriptionItem);
        console.log("PRESCRIPTION ITEM ERROR", itemError);

        if (itemError || !prescriptionItem) {
          console.error("ITEM ERROR", itemError);
          alert(`Could not create prescription item for ${product.name}`);
          return;
        }

        const { error: movementError } = await supabase
          .from("inventory_movements")
          .insert({
            clinic_id: CLINIC_ID,
            lot_id: calc.selectedLot.id,
            movement_type: "reservation",
            source_location_id: calc.selectedLot.location_id ?? null,
            destination_location_id: null,
            quantity: calc.totalUnitsRequired,
            performed_by: null,
            reason: `Reserved ${calc.totalUnitsRequired} units for prescription ${prescription.id} / item ${prescriptionItem.id}`,
            created_at: new Date().toISOString(),
          });

        if (movementError) {
          console.error("MOVEMENT ERROR", movementError);
          alert(`Could not create inventory movement for ${product.name}`);
          return;
        }

        const newAvailable = currentAvailable - calc.totalUnitsRequired;
        const newReserved = currentReserved + calc.totalUnitsRequired;

        const { error: updateLotError } = await supabase
          .from("inventory_lots")
          .update({
            quantity_available: newAvailable,
            quantity_reserved: newReserved,
          })
          .eq("id", calc.selectedLot.id);

        if (updateLotError) {
          console.error("LOT UPDATE ERROR", updateLotError);
          alert(`Could not reserve inventory for ${product.name}`);
          return;
        }

        setLots((currentLots) =>
          currentLots.map((lot) =>
            lot.id === calc.selectedLot?.id
              ? {
                  ...lot,
                  quantity_available: newAvailable,
                  quantity_reserved: newReserved,
                }
              : lot
          )
        );
      }

      runMockAction("Issuing prescription", {
        detail: `${medications.length} medication(s) reserved successfully`,
        success: "Prescription created",
      });

      onPrescriptionCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <button onClick={onClose} className="flex-1 bg-black/30" />

      <aside className="w-full max-w-5xl bg-card border-l border-border flex flex-col shadow-2xl">
        <header className="px-6 py-5 border-b border-border flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Prescription management
            </p>

            <h2 className="text-[18px] font-semibold mt-1">
              Create prescription
            </h2>

            <p className="text-[11px] text-muted-foreground mt-1">
              Patient: {patientName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="size-8 rounded-md hover:bg-secondary flex items-center justify-center"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="text-[12px] text-muted-foreground">
              Loading products...
            </div>
          )}

          {!loading && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <ControlledSelect
                  label="Linked protocol"
                  value={linkedProtocol}
                  onChange={setLinkedProtocol}
                  options={[
                    "Long Agonist IVF",
                    "Antagonist IVF",
                    "FET — programmed",
                  ]}
                />

                <ControlledSelect
                  label="Prescription type"
                  value={prescriptionType}
                  onChange={setPrescriptionType}
                  options={["MEDICATION", "HORMONAL", "TRIGGER"]}
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Clinical reason / General instructions
                </label>

                <textarea
                  value={clinicalReason}
                  onChange={(event) => setClinicalReason(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-[13px]"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[14px] font-semibold">
                      Medications
                    </h3>

                    <p className="text-[11px] text-muted-foreground">
                      Add all medications in the same prescription before
                      issuing.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addMedication}
                    className="h-9 px-3 rounded-md bg-secondary text-[12px] font-medium inline-flex items-center gap-1.5 hover:bg-accent transition-colors"
                  >
                    <Plus className="size-3.5" />
                    Add medication
                  </button>
                </div>

                {medications.map((medication, index) => {
                  const product = getProductById(medication.product_id);
                  const productLots = getProductLots(medication.product_id);
                  const selectedLot = getLotById(medication.lot_id);
                  const calc = calculateMedication(medication);

                  return (
                    <div
                      key={medication.local_id}
                      className="rounded-xl border border-border bg-secondary/20 p-4 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[12px] font-semibold">
                            Medication #{index + 1}
                          </p>

                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {product?.name ?? "Select medication"}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={medications.length === 1}
                          onClick={() => removeMedication(medication.local_id)}
                          className={cn(
                            "h-8 px-2 rounded-md text-[11px] inline-flex items-center gap-1 border",
                            medications.length === 1
                              ? "text-muted-foreground cursor-not-allowed border-border"
                              : "text-warning border-warning/30 hover:bg-warning/10"
                          )}
                        >
                          <Trash2 className="size-3.5" />
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                          <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                            Medication
                          </span>

                          <select
                            value={medication.product_id}
                            onChange={(event) =>
                              handleProductChange(
                                medication.local_id,
                                event.target.value
                              )
                            }
                            className="mt-1 w-full h-9 px-3 text-[12.5px] rounded-md border border-border bg-card"
                          >
                            {products.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                            Inventory lot
                          </span>

                          <select
                            value={medication.lot_id}
                            onChange={(event) =>
                              updateMedication(medication.local_id, {
                                lot_id: event.target.value,
                              })
                            }
                            className="mt-1 w-full h-9 px-3 text-[12.5px] rounded-md border border-border bg-card"
                          >
                            {productLots.length === 0 && (
                              <option value="">No lots available</option>
                            )}

                            {productLots.map((lot) => (
                              <option key={lot.id} value={lot.id}>
                                {lot.internal_lot_code ?? lot.id.slice(0, 8)} ·{" "}
                                {lot.locations?.name ?? "No location"} · Qty{" "}
                                {lot.quantity_available ?? 0}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      {product && (
                        <div className="rounded-lg border border-border bg-card p-3">
                          <div className="grid grid-cols-3 gap-3 text-[11px]">
                            <Info
                              label="Generic"
                              value={product.generic_name ?? "-"}
                            />

                            <Info
                              label="Presentation"
                              value={product.presentation ?? "-"}
                            />

                            <Info
                              label="Strength"
                              value={`${product.strength_value ?? "-"} ${
                                product.unit_of_measure ?? ""
                              }`}
                            />

                            <Info
                              label="Storage"
                              value={product.storage_condition ?? "-"}
                            />

                            <Info
                              label="INVIMA"
                              value={product.invima_registration ?? "-"}
                            />

                            <Info
                              label="Lot expires"
                              value={selectedLot?.expiration_date ?? "-"}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-4">
                        <ControlledInput
                          label="Dose"
                          value={medication.dose}
                          onChange={(value) =>
                            updateMedication(medication.local_id, {
                              dose: value,
                            })
                          }
                        />

                        <ControlledInput
                          label="Route"
                          value={medication.route}
                          onChange={(value) =>
                            updateMedication(medication.local_id, {
                              route: value,
                            })
                          }
                        />

                        <ControlledInput
                          label="Units per dose"
                          type="number"
                          min="1"
                          value={medication.units_per_dose}
                          onChange={(value) =>
                            updateMedication(medication.local_id, {
                              units_per_dose: value,
                            })
                          }
                        />

                        <ControlledInput
                          label="Frequency every hours"
                          type="number"
                          min="1"
                          value={medication.frequency_every_hours}
                          onChange={(value) =>
                            updateMedication(medication.local_id, {
                              frequency_every_hours: value,
                            })
                          }
                        />

                        <ControlledInput
                          label="Duration days"
                          type="number"
                          min="1"
                          value={medication.duration_days}
                          onChange={(value) =>
                            updateMedication(medication.local_id, {
                              duration_days: value,
                            })
                          }
                        />

                        <ControlledInput
                          label="Start date and time"
                          type="datetime-local"
                          value={medication.start_at}
                          onChange={(value) =>
                            updateMedication(medication.local_id, {
                              start_at: value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                          Medication-specific instructions
                        </label>

                        <textarea
                          value={medication.instructions}
                          onChange={(event) =>
                            updateMedication(medication.local_id, {
                              instructions: event.target.value,
                            })
                          }
                          rows={2}
                          placeholder="Optional. If empty, general instructions will be used."
                          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-[12.5px]"
                        />
                      </div>

                      <div
                        className={cn(
                          "rounded-lg border p-3",
                          calc.hasEnoughInventory
                            ? "border-border bg-card"
                            : "border-warning/40 bg-warning/10"
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[12px] font-semibold">
                            Inventory calculation
                          </p>

                          {calc.totalUnitsRequired > 0 && (
                            <span
                              className={cn(
                                "text-[11px] font-medium",
                                calc.hasEnoughInventory
                                  ? "text-success"
                                  : "text-warning"
                              )}
                            >
                              {calc.hasEnoughInventory
                                ? "Inventory sufficient"
                                : "Insufficient inventory"}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-3 text-[11px]">
                          <Info label="Doses" value={`${calc.dosesCount}`} />

                          <Info
                            label="Required"
                            value={`${calc.totalUnitsRequired}`}
                          />

                          <Info
                            label="Available"
                            value={`${calc.availableUnits}`}
                          />

                          <Info
                            label="Remaining"
                            value={`${calc.remainingAfterReservation}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-border bg-accent/40 p-4">
                <div className="grid grid-cols-3 gap-4 text-[11px]">
                  <Info
                    label="Medications"
                    value={`${prescriptionSummary.medicationCount}`}
                  />

                  <Info
                    label="Total units reserved"
                    value={`${prescriptionSummary.totalRequired}`}
                  />

                  <Info
                    label="Prescription status"
                    value={
                      prescriptionSummary.allValid
                        ? "Ready to issue"
                        : "Incomplete / inventory issue"
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-border text-[12px]"
          >
            Cancel
          </button>

          <button
            disabled={saving || !prescriptionSummary.allValid}
            onClick={createPrescription}
            className={cn(
              "h-9 px-4 rounded-md text-[12px] font-semibold",
              saving || !prescriptionSummary.allValid
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground"
            )}
          >
            {saving ? "Creating..." : "Issue prescription"}
          </button>
        </footer>
      </aside>
    </div>
  );
}

// ============================================================
// UI COMPONENTS
// ============================================================

function ControlledInput({
  label,
  value,
  onChange,
  type = "text",
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </span>

      <input
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full h-9 px-3 text-[12.5px] rounded-md border border-border bg-card"
      />
    </label>
  );
}

function ControlledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full h-9 px-3 text-[12.5px] rounded-md border border-border bg-card"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="text-[12px] font-medium mt-1">{value}</p>
    </div>
  );
}

function SidePanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="size-3.5 text-muted-foreground" />

        <h3 className="text-[12px] font-semibold tracking-tight">
          {title}
        </h3>
      </div>

      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning" | "primary";
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="text-muted-foreground">{label}</span>

      <span
        className={cn(
          "font-medium tabular-nums",
          !tone && "text-foreground",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "primary" && "text-primary"
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function parseDatetimeLocal(value: string) {
  return new Date(value);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatTimestampWithoutTimezone(date: Date) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getTimeFromDatetimeLocal(value: string) {
  return value.slice(11, 16);
}

function formatShortDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildPrescriptionReminderMessage({
  patientName,
  prescription,
}: {
  patientName: string;
  prescription: PrescriptionHistoryItem;
}) {
  const medications = prescription.prescription_items ?? [];

  const medicationText = medications
    .map((item, index) => {
      return `${index + 1}. ${item.medication_name ?? "Medication"}
Dose: ${item.dose ?? "-"}
Route: ${item.route ?? "-"}
Frequency: ${item.frequency ?? "-"}
Duration: ${item.duration_days ?? "-"} day(s)
Start: ${item.start_datetime ? formatShortDate(item.start_datetime) : "-"}
Quantity: ${item.quantity_required ?? "-"} ${item.quantity_unit ?? ""}
Instructions: ${item.instructions ?? "-"}`;
    })
    .join("\n\n");

  return `Hello ${patientName},

This is a medication reminder from your care team.

Prescription:
${prescription.prescription_type ?? "Medication prescription"}

Clinical reason:
${prescription.clinical_reason ?? "-"}

Medications:
${medicationText}

Please follow the instructions provided by your healthcare professional. If you have any questions, contact your clinic before taking the medication.`;
}

function openWhatsAppReminder({
  phone,
  message,
}: {
  phone: string | null;
  message: string;
}) {
  if (!phone) {
    alert("Patient does not have a phone number");
    return;
  }

  const cleanPhone = phone.replace(/[^\d]/g, "");

  if (!cleanPhone) {
    alert("Patient phone number is invalid");
    return;
  }

  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}