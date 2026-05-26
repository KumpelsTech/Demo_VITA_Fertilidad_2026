// ============================================================
// PATIENT DETAIL PAGE - REAL DATABASE CONNECTED VERSION
// ============================================================

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  async function loadPatient() {
    setLoading(true);

    const { data, error } = await supabase
      .from("persons")
      .select("*")
      .eq("id", patientId)
      .single();

    console.log("PATIENT", data);
    console.log("PATIENT ERROR", error);

    if (error || !data) {
      setPatient(null);
      setLoading(false);
      return;
    }

    setPatient(data);

    setLoading(false);
  }

  const fullName = patient
    ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim()
    : "Loading patient...";

  const initials = patient
    ? `${patient.first_name?.[0] ?? ""}${patient.last_name?.[0] ?? ""}`
    : "--";

  const age = patient?.birth_date
    ? new Date().getFullYear() -
      new Date(patient.birth_date).getFullYear()
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

      {/* HEADER */}

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
              </div>

              <p className="text-[12px] text-muted-foreground mt-0.5">
                {patient.document_number ?? patient.id}
                {" · "}
                {age} yrs
                {" · "}
                IVF Treatment
              </p>

              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                {patient.phone && (
                  <span>📞 {patient.phone}</span>
                )}

                {patient.email && (
                  <span>✉️ {patient.email}</span>
                )}

                {patient.biological_sex && (
                  <span>
                    Biological sex: {patient.biological_sex}
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
              className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-medium inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
            >
              <Plus className="size-3.5" />
              Create prescription
            </button>
          </div>
        </div>

        {/* AI SUMMARY */}

        <div className="mt-5 rounded-xl bg-accent/60 border border-accent p-3.5 flex gap-3">
          <div className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" />
          </div>

          <p className="text-[12px] text-foreground/80 leading-relaxed">
            <span className="font-semibold text-primary">
              AI summary ·
            </span>{" "}
            Patient currently in stimulation workflow. Review hormone response,
            medication adherence, and embryo planning before next procedure.
          </p>
        </div>

        {/* STAGES */}

        <div className="mt-6 relative pt-2 pb-1">
          <div className="absolute left-0 right-0 top-[18px] h-px bg-border" />

          <div
            className="absolute left-0 top-[17px] h-[3px] bg-primary rounded-full"
            style={{
              width: `${(2.5 / stages.length) * 100}%`,
            }}
          />

          <div className="relative grid grid-cols-7 gap-1">
            {stages.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center text-center"
              >
                <div
                  className={cn(
                    "size-9 rounded-full flex items-center justify-center text-[11px] font-semibold ring-4 ring-card",

                    s.status === "done" &&
                      "bg-primary text-primary-foreground",

                    s.status === "active" &&
                      "bg-card border-2 border-primary text-primary",

                    s.status === "next" &&
                      "bg-accent text-primary border border-accent",

                    s.status === "pending" &&
                      "bg-card border border-border text-muted-foreground"
                  )}
                >
                  {s.status === "done" ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    s.short
                  )}
                </div>

                <p className="mt-2 text-[11px] font-medium">
                  {s.label}
                </p>

                <p className="text-[10px] text-muted-foreground">
                  {s.when}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TIMELINE */}

        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-semibold">
                Patient timeline
              </h2>

              <p className="text-[11px] text-muted-foreground mt-0.5">
                All clinical and operational events
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

            <ul className="space-y-4">
              {timeline.map((e, i) => (
                <li key={i} className="relative flex gap-3">
                  <div className="size-8 rounded-full border flex items-center justify-center shrink-0 bg-card z-10">
                    <e.icon className="size-3.5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-medium">
                        {e.title}
                      </p>

                      <span className="text-[10px] text-muted-foreground">
                        {e.time}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {e.meta}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* SIDE */}

        <div className="space-y-6">
          <SidePanel title="Patient info" icon={Pill}>
            <Row
              label="Document"
              value={patient.document_number ?? "-"}
            />

            <Row
              label="Age"
              value={`${age} yrs`}
            />

            <Row
              label="Phone"
              value={patient.phone ?? "-"}
            />

            <Row
              label="Email"
              value={patient.email ?? "-"}
            />
          </SidePanel>

          <SidePanel
            title="Lab & embryos"
            icon={FlaskConical}
          >
            <Row
              label="Follicles ≥17mm"
              value="14"
              tone="success"
            />

            <Row
              label="Estradiol"
              value="2,840 pg/mL"
            />
          </SidePanel>
        </div>
      </div>

      {/* PRESCRIPTION PANEL */}

      {rxOpen && (
        <PrescriptionPanel
          patientId={patient.id}
          patientName={fullName}
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
  patientName,
  onClose,
}: {
  patientId: string;
  patientName: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);

  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [selectedLotId, setSelectedLotId] =
    useState("");

  const [dose, setDose] = useState("");

  const [frequency, setFrequency] =
    useState("Single dose");

  const [route, setRoute] =
    useState("Subcutaneous");

  const [duration, setDuration] =
    useState("1 day");

  const [clinicalReason, setClinicalReason] =
    useState(
      "Administer 36h before retrieval"
    );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [productsRes, lotsRes] =
      await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("active", true)
          .order("name"),

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
              strength_value
            ),
            locations (
              id,
              name
            )
          `)
          .gt("quantity_available", 0),
      ]);

    setProducts(productsRes.data ?? []);
    setLots(lotsRes.data ?? []);

    if (productsRes.data?.length) {
      const first = productsRes.data[0];

      setSelectedProductId(first.id);

      if (first.strength_value) {
        setDose(
          `${first.strength_value} ${first.unit_of_measure ?? ""}`
        );
      }
    }

    setLoading(false);
  }

  const selectedProduct = products.find(
    (p) => p.id === selectedProductId
  );

  const productLots = lots
    .filter(
      (l) =>
        l.products?.id === selectedProductId &&
        l.quantity_available > 0
    )
    .sort((a, b) => {
      return (
        new Date(a.expiration_date).getTime() -
        new Date(b.expiration_date).getTime()
      );
    });

  const selectedLot =
    productLots.find(
      (l) => l.id === selectedLotId
    ) ?? productLots[0];

  async function createPrescription() {
    try {
      setSaving(true);

      const prescriptionPayload = {
        clinic_id: CLINIC_ID,

        fertility_case_id: null,

        treatment_cycle_id: null,

        physician_id: null,

        prescription_type: "MEDICATION",

        status: "ACTIVE",

        clinical_reason: clinicalReason,

        clinic_patient_id: null,

        created_at: new Date().toISOString(),
      };

      const {
        data: prescription,
        error: prescriptionError,
      } = await supabase
        .from("prescriptions")
        .insert(prescriptionPayload)
        .select()
        .single();

      console.log(
        "PRESCRIPTION",
        prescription
      );

      console.log(
        "PRESCRIPTION ERROR",
        prescriptionError
      );

      if (
        prescriptionError ||
        !prescription
      ) {
        alert(
          "Could not create prescription"
        );

        return;
      }
// ======================================================
// RESERVE INVENTORY
// ======================================================

if (selectedLot) {
  const reserveQty = 1;

  // ---------------------------------------------
  // CURRENT VALUES
  // ---------------------------------------------

  const currentAvailable =
    Number(
      selectedLot.quantity_available ?? 0
    );

  const currentReserved =
    Number(
      selectedLot.quantity_reserved ?? 0
    );

  // ---------------------------------------------
  // VALIDATION
  // ---------------------------------------------

  if (currentAvailable < reserveQty) {
    alert("Insufficient inventory");

    return;
  }

  // ---------------------------------------------
  // NEW VALUES
  // ---------------------------------------------

  const newAvailable =
    currentAvailable - reserveQty;

  const newReserved =
    currentReserved + reserveQty;

  // ---------------------------------------------
  // INVENTORY MOVEMENT
  // ---------------------------------------------

  const { error: movementError } =
    await supabase
      .from("inventory_movements")
      .insert({
        clinic_id: CLINIC_ID,

        lot_id: selectedLot.id,

        movement_type: "reservation",

        source_location_id:
          selectedLot.location_id ?? null,

        destination_location_id:
          null,

        quantity: reserveQty,

        performed_by: null,

        reason: `Reserved from prescription ${prescription.id}`,

        created_at:
          new Date().toISOString(),
      });

  if (movementError) {
    console.error(
      "MOVEMENT ERROR",
      movementError
    );

    alert(
      "Could not create inventory movement"
    );

    return;
  }

  // ---------------------------------------------
  // UPDATE INVENTORY LOT
  // ---------------------------------------------

  const { error: updateLotError } =
    await supabase
      .from("inventory_lots")
      .update({
        quantity_available:
          newAvailable,

        quantity_reserved:
          newReserved,
      })
      .eq("id", selectedLot.id);

  if (updateLotError) {
    console.error(
      "LOT UPDATE ERROR",
      updateLotError
    );

    alert(
      "Could not reserve inventory"
    );

    return;
  }

  console.log("Inventory reserved", {
    lotId: selectedLot.id,

    previousAvailable:
      currentAvailable,

    newAvailable,

    previousReserved:
      currentReserved,

    newReserved,
  });
}

      runMockAction(
        "Issuing prescription",
        {
          detail:
            "Inventory reserved successfully",

          success:
            "Prescription created",
        }
      );

      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        onClick={onClose}
        className="flex-1 bg-black/30"
      />

      <aside className="w-full max-w-3xl bg-card border-l border-border flex flex-col shadow-2xl">
        {/* HEADER */}

        <header className="px-6 py-5 border-b border-border flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Prescription management
            </p>

            <h2 className="text-[18px] font-semibold mt-1">
              Create prescription
            </h2>
          </div>

          <button
            onClick={onClose}
            className="size-8 rounded-md hover:bg-secondary flex items-center justify-center"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* CONTENT */}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="text-[12px] text-muted-foreground">
              Loading products...
            </div>
          )}

          {!loading && (
            <>
              {/* MEDICATION */}

              <div>
                <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Medication
                </label>

                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    const id = e.target.value;

                    setSelectedProductId(id);

                    const product =
                      products.find(
                        (p) => p.id === id
                      );

                    if (
                      product?.strength_value
                    ) {
                      setDose(
                        `${product.strength_value} ${product.unit_of_measure}`
                      );
                    }
                  }}
                  className="mt-1 w-full h-10 rounded-md border border-border bg-card px-3 text-[13px]"
                >
                  {products.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                    >
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* PRODUCT INFO */}

              {selectedProduct && (
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="grid grid-cols-2 gap-4 text-[11px]">
                    <Info
                      label="Generic name"
                      value={
                        selectedProduct.generic_name ??
                        "-"
                      }
                    />

                    <Info
                      label="Category"
                      value={
                        selectedProduct.category ??
                        "-"
                      }
                    />

                    <Info
                      label="Presentation"
                      value={
                        selectedProduct.presentation ??
                        "-"
                      }
                    />

                    <Info
                      label="Storage"
                      value={
                        selectedProduct.storage_condition ??
                        "-"
                      }
                    />

                    <Info
                      label="INVIMA"
                      value={
                        selectedProduct.invima_registration ??
                        "-"
                      }
                    />

                    <Info
                      label="Strength"
                      value={`${selectedProduct.strength_value ?? "-"} ${selectedProduct.unit_of_measure ?? ""}`}
                    />
                  </div>
                </div>
              )}

              {/* STOCK */}

              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-semibold">
                    Inventory validation
                  </p>

                  {productLots.length > 0 ? (
                    <span className="text-success text-[11px] font-medium">
                      In stock
                    </span>
                  ) : (
                    <span className="text-warning text-[11px] font-medium">
                      No stock
                    </span>
                  )}
                </div>

                {productLots.length > 0 ? (
                  <div className="space-y-3">
                    <select
                      value={selectedLotId}
                      onChange={(e) =>
                        setSelectedLotId(
                          e.target.value
                        )
                      }
                      className="w-full h-10 rounded-md border border-border bg-card px-3 text-[13px]"
                    >
                      {productLots.map((lot) => (
                        <option
                          key={lot.id}
                          value={lot.id}
                        >
                          {lot.id.slice(0, 8)} ·{" "}
                          {
                            lot.locations?.name
                          } · Qty{" "}
                          {
                            lot.quantity_available
                          }
                        </option>
                      ))}
                    </select>

                    {selectedLot && (
                      <div className="text-[11px] text-muted-foreground">
                        Expires{" "}
                        {
                          selectedLot.expiration_date
                        }
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-warning">
                    No lots available
                  </div>
                )}
              </div>

              {/* RX DETAILS */}

              <div className="grid grid-cols-2 gap-4">
                <RxInput
                  label="Dose"
                  defaultValue={dose}
                />

                <RxInput
                  label="Frequency"
                  defaultValue={frequency}
                />

                <RxInput
                  label="Route"
                  defaultValue={route}
                />

                <RxInput
                  label="Duration"
                  defaultValue={duration}
                />
              </div>

              {/* CLINICAL REASON */}

              <div>
                <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Clinical reason
                </label>

                <textarea
                  value={clinicalReason}
                  onChange={(e) =>
                    setClinicalReason(
                      e.target.value
                    )
                  }
                  rows={4}
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-[13px]"
                />
              </div>

              {/* PROTOCOL */}

              <div className="grid grid-cols-2 gap-4">
                <RxSelect
                  label="Linked protocol"
                  options={[
                    "Long Agonist IVF",
                    "Antagonist IVF",
                    "FET — programmed",
                  ]}
                />

                <RxSelect
                  label="Prescription type"
                  options={[
                    "MEDICATION",
                    "HORMONAL",
                    "TRIGGER",
                  ]}
                />
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}

        <footer className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-border text-[12px]"
          >
            Cancel
          </button>

          <button
            disabled={saving}
            onClick={createPrescription}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold"
          >
            {saving
              ? "Creating..."
              : "Issue prescription"}
          </button>
        </footer>
      </aside>
    </div>
  );
}

// ============================================================
// UI COMPONENTS
// ============================================================

function RxInput({
  label,
  defaultValue,
}: {
  label: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </span>

      <input
        defaultValue={defaultValue}
        className="mt-1 w-full h-9 px-3 text-[12.5px] rounded-md border border-border bg-card"
      />
    </label>
  );
}

function RxSelect({
  label,
  options,
}: {
  label: string;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </span>

      <select className="mt-1 w-full h-9 px-3 text-[12.5px] rounded-md border border-border bg-card">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="text-[12px] font-medium mt-1">
        {value}
      </p>
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

      <div className="space-y-2">
        {children}
      </div>
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
      <span className="text-muted-foreground">
        {label}
      </span>

      <span
        className={cn(
          "font-medium tabular-nums",

          !tone && "text-foreground",

          tone === "success" &&
            "text-success",

          tone === "warning" &&
            "text-warning",

          tone === "primary" &&
            "text-primary"
        )}
      >
        {value}
      </span>
    </div>
  );
}