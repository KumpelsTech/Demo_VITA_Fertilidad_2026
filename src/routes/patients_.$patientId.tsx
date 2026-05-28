// ============================================================
// PATIENT DETAIL PAGE - MULTI MEDICATION + MANUAL WHATSAPP REMINDER
// clinic_persons + prescriptions.clinic_patient_id
// prescription_items supports multiple medications per prescription
// doctors + prescriptions.physician_id
// No Edge Function / No email provider required
//
// UPDATED PRESCRIPTION FLOW
// - Styled dropdowns
// - Route as dropdown
// - Dose unit locked to product unit
// - Units per dose calculated automatically
// - Flexible frequency: minutes / hours / days
// - INVIMA hidden from prescription module
// - Lot selection hidden from physician workflow
// - Physician prescribes the medication, not the lot
// - Physician is assigned through prescriptions.physician_id
// - System validates stock and reserves inventory internally
// - Lot assignment/dispensing detail remains an operational pharmacy workflow
// - If stock is insufficient, an operational alert can be created in alerts
// - Prescription history is the main clinical block
// - Prescription detail supports header editing, medication editing and PDF export
// ============================================================

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";

import { supabase } from "@/lib/supabase";
import { runMockAction } from "@/lib/mock-actions";
import jsPDF from "jspdf";

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
  ChevronDown,
  FileText,
  Download,
  Edit3,
  Save,
} from "lucide-react";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patients_/$patientId")({
  component: PatientDetailPage,
});

const CLINIC_ID = "385f976d-2e25-4af3-91da-5d347acaa54f";

// ============================================================
// OPTIONS
// ============================================================

interface SelectOption {
  value: string;
  label: string;
}

const ROUTE_OPTIONS: SelectOption[] = [
  { value: "Oral", label: "Oral" },
  { value: "Subcutáneo", label: "Subcutáneo" },
  { value: "Intravenoso", label: "Intravenoso" },
  { value: "Intramuscular", label: "Intramuscular" },
  { value: "Vaginal", label: "Vaginal" },
  { value: "Nasal", label: "Nasal" },
  { value: "Tópico", label: "Tópico" },
  { value: "Rectal", label: "Rectal" },
];

const FREQUENCY_UNIT_OPTIONS: SelectOption[] = [
  { value: "minutes", label: "Minutos" },
  { value: "hours", label: "Horas" },
  { value: "days", label: "Días" },
];

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

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string | null;
  document_type: string | null;
  document_number: string;
  medical_license: string | null;
  specialty: string | null;
  subspecialty: string | null;
  email: string | null;
  phone: string | null;
  mobile_phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  clinic_id: string | null;
  department: string | null;
  position: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
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
  physician_id: string | null;
  physician_name?: string | null;
  physician_license?: string | null;
  physician_specialty?: string | null;
  physician_document_number?: string | null;
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
  dose_value: string;
  route: string;
  start_at: string;
  frequency_interval: string;
  frequency_unit: "minutes" | "hours" | "days";
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
  const [editingPrescription, setEditingPrescription] =
    useState<PrescriptionHistoryItem | null>(null);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [clinicPerson, setClinicPerson] = useState<ClinicPerson | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionHistoryItem[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedPrescription, setSelectedPrescription] =
    useState<PrescriptionHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatient();
    loadDoctors();
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

  async function loadDoctors() {
    const { data, error } = await supabase
      .from("doctors")
      .select(`
        id,
        first_name,
        last_name,
        full_name,
        document_type,
        document_number,
        medical_license,
        specialty,
        subspecialty,
        email,
        phone,
        mobile_phone,
        address,
        city,
        country,
        clinic_id,
        department,
        position,
        is_active,
        created_at,
        updated_at
      `)
      .order("full_name", { ascending: true });

    console.log("PAGE DOCTORS", data);
    console.log("PAGE DOCTORS ERROR", error);

    if (error || !data) {
      setDoctors([]);
      return;
    }

    const doctorsData = (data as Doctor[]).filter(
      (doctor) =>
        doctor.id &&
        (
          doctor.full_name?.trim() ||
          doctor.first_name?.trim() ||
          doctor.last_name?.trim()
        )
    );

    setDoctors(doctorsData);
  }

  async function loadPrescriptionHistory(clinicPersonId: string) {
    const { data, error } = await supabase
      .from("prescriptions")
      .select(`
        id,
        physician_id,
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

    const physicianIds = Array.from(
      new Set(
        data
          .map((prescription: any) => prescription.physician_id)
          .filter(Boolean)
      )
    );

    let productMap: Record<string, Product> = {};
    let doctorMap: Record<string, Doctor> = {};

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

    if (physicianIds.length > 0) {
      const { data: doctorsData, error: doctorsError } = await supabase
        .from("doctors")
        .select("*")
        .in("id", physicianIds);

      console.log("HISTORY DOCTORS", doctorsData);
      console.log("HISTORY DOCTORS ERROR", doctorsError);

      if (!doctorsError && doctorsData) {
        doctorMap = Object.fromEntries(
          (doctorsData as Doctor[]).map((doctor) => [doctor.id, doctor])
        );
      }
    }

    const enriched = data.map((prescription: any) => {
      const doctor = prescription.physician_id
        ? doctorMap[prescription.physician_id]
        : null;

      const physicianName =
        doctor?.full_name ||
        `${doctor?.first_name ?? ""} ${doctor?.last_name ?? ""}`.trim() ||
        null;

      return {
        ...prescription,
        physician_name: physicianName,
        physician_license: doctor?.medical_license ?? null,
        physician_specialty: doctor?.specialty ?? null,
        physician_document_number: doctor?.document_number ?? null,
        prescription_items: (prescription.prescription_items ?? []).map(
          (item: any) => ({
            ...item,
            medication_name:
              item.medication_id && productMap[item.medication_id]
                ? productMap[item.medication_id].name
                : null,
          })
        ),
      };
    });

    setPrescriptions(enriched as PrescriptionHistoryItem[]);
  }

  function getDoctorFullName(doctor: Doctor | null | undefined) {
    if (!doctor) return "-";

    const fallbackName = `${doctor.first_name ?? ""} ${doctor.last_name ?? ""}`.trim();

    return doctor.full_name?.trim() || fallbackName || "Doctor sin nombre";
  }

  function getDoctorById(doctorId: string | null | undefined) {
    if (!doctorId) return null;

    return doctors.find((doctor) => doctor.id === doctorId) ?? null;
  }

  async function updatePrescriptionHeader({
    prescriptionId,
    physicianId,
    prescriptionType,
    status,
    clinicalReason,
    prescriptionItems,
  }: {
    prescriptionId: string;
    physicianId: string | null;
    prescriptionType: string | null;
    status: string | null;
    clinicalReason: string | null;
    prescriptionItems?: Array<{
      id: string;
      dose: string | null;
      route: string | null;
      frequency: string | null;
      duration_days: number | null;
      start_datetime: string | null;
      quantity_required: number | null;
      quantity_unit: string | null;
      instructions: string | null;
    }>;
  }) {
    const { error } = await supabase
      .from("prescriptions")
      .update({
        physician_id: physicianId,
        prescription_type: prescriptionType,
        status,
        clinical_reason: clinicalReason,
      })
      .eq("id", prescriptionId);

    console.log("UPDATE PRESCRIPTION ERROR", error);

    if (error) {
      alert("Could not update prescription");
      return;
    }

    if (prescriptionItems && prescriptionItems.length > 0) {
      const itemUpdates = await Promise.all(
        prescriptionItems.map((item) =>
          supabase
            .from("prescription_items")
            .update({
              dose: item.dose,
              route: item.route,
              frequency: item.frequency,
              duration_days: item.duration_days,
              start_datetime: item.start_datetime,
              quantity_required: item.quantity_required,
              quantity_unit: item.quantity_unit,
              instructions: item.instructions,
            })
            .eq("id", item.id)
        )
      );

      const itemError = itemUpdates.find((result) => result.error)?.error;

      console.log("UPDATE PRESCRIPTION ITEMS", itemUpdates);
      console.log("UPDATE PRESCRIPTION ITEMS ERROR", itemError);

      if (itemError) {
        alert(
          "Prescription header was updated, but medication details could not be updated"
        );
        return;
      }
    }

    const doctor = getDoctorById(physicianId);

    setSelectedPrescription((current) => {
      if (!current) return current;

      const updatedPrescriptionItems = (current.prescription_items ?? []).map(
        (currentItem) => {
          const updatedItem = prescriptionItems?.find(
            (item) => item.id === currentItem.id
          );

          if (!updatedItem) return currentItem;

          return {
            ...currentItem,
            dose: updatedItem.dose,
            route: updatedItem.route,
            frequency: updatedItem.frequency,
            duration_days: updatedItem.duration_days,
            start_datetime: updatedItem.start_datetime,
            quantity_required: updatedItem.quantity_required,
            quantity_unit: updatedItem.quantity_unit,
            instructions: updatedItem.instructions,
          };
        }
      );

      return {
        ...current,
        physician_id: physicianId,
        physician_name: getDoctorFullName(doctor),
        physician_license: doctor?.medical_license ?? null,
        physician_specialty: doctor?.specialty ?? null,
        physician_document_number: doctor?.document_number ?? null,
        prescription_type: prescriptionType,
        status,
        clinical_reason: clinicalReason,
        prescription_items: updatedPrescriptionItems,
      };
    });

    if (clinicPerson?.id) {
      await loadPrescriptionHistory(clinicPerson.id);
    }

    runMockAction("Updating prescription", {
      detail: "Prescription and medication details updated successfully.",
      success: "Prescription updated",
    });
  }

  function downloadPrescriptionPdf(prescription: PrescriptionHistoryItem) {
    const doctor = getDoctorById(prescription.physician_id);

    const safePatientName = fullName
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_")
      .trim();

    const fileName = `Prescription_${safePatientName || "patient"}_${prescription.id.slice(0, 8)}.pdf`;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const marginLeft = 14;
    const marginRight = 14;
    const usableWidth = pageWidth - marginLeft - marginRight;

    let y = 16;

    function checkPageSpace(requiredSpace = 10) {
      if (y + requiredSpace > pageHeight - 16) {
        doc.addPage();
        y = 16;
      }
    }

    function title(text: string) {
      checkPageSpace(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(text, marginLeft, y);
      y += 8;
    }

    function section(text: string) {
      checkPageSpace(12);
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(text, marginLeft, y);
      y += 2;
      doc.setDrawColor(180);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 6;
    }

    function field(label: string, value: string | number | null | undefined) {
      checkPageSpace(7);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, marginLeft, y);

      doc.setFont("helvetica", "normal");
      const cleanValue =
        value !== null && value !== undefined && String(value).trim()
          ? String(value)
          : "-";

      const split = doc.splitTextToSize(cleanValue, usableWidth - 42);
      doc.text(split, marginLeft + 38, y);

      y += Math.max(6, split.length * 5);
    }

    function paragraph(text: string | null | undefined) {
      checkPageSpace(10);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      const cleanText =
        text !== null && text !== undefined && text.trim() ? text : "-";

      const split = doc.splitTextToSize(cleanText, usableWidth);
      doc.text(split, marginLeft, y);
      y += split.length * 5 + 2;
    }

    function tableRow(values: string[], widths: number[], isHeader = false) {
      const lineHeights = values.map((value, index) => {
        const text = doc.splitTextToSize(value || "-", widths[index] - 2);
        return text.length * 4 + 4;
      });

      const rowHeight = Math.max(8, ...lineHeights);

      checkPageSpace(rowHeight + 2);

      let x = marginLeft;

      values.forEach((value, index) => {
        doc.setDrawColor(200);
        doc.rect(x, y, widths[index], rowHeight);

        doc.setFont("helvetica", isHeader ? "bold" : "normal");
        doc.setFontSize(7.5);

        const text = doc.splitTextToSize(value || "-", widths[index] - 2);
        doc.text(text, x + 1, y + 4);

        x += widths[index];
      });

      y += rowHeight;
    }

    title("Medical Prescription");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Prescription ID: ${prescription.id}`, marginLeft, y);
    y += 6;

    section("Patient information");
    field("Patient", fullName);
    field("Document", patient?.document_number ?? "-");
    field("Phone", patient?.phone ?? "-");
    field("Email", patient?.email ?? "-");

    section("Prescription information");
    field("Type", prescription.prescription_type ?? "-");
    field("Status", prescription.status ?? "-");
    field("Created at", formatShortDate(prescription.created_at));

    section("Physician");
    field(
      "Name",
      prescription.physician_name ?? getDoctorFullName(doctor)
    );
    field(
      "Document number",
      prescription.physician_document_number ??
      doctor?.document_number ??
      "-"
    );
    field(
      "Specialty",
      prescription.physician_specialty ?? doctor?.specialty ?? "-"
    );
    field(
      "Medical license",
      prescription.physician_license ?? doctor?.medical_license ?? "-"
    );
    field("Email", doctor?.email ?? "-");

    section("Clinical reason / General instructions");
    paragraph(prescription.clinical_reason ?? "-");

    section("Medications");

    const columnWidths = [8, 34, 22, 22, 30, 13, 34, 18];

    tableRow(
      ["#", "Medication", "Dose", "Route", "Frequency", "Days", "Start", "Qty"],
      columnWidths,
      true
    );

    const medications = prescription.prescription_items ?? [];

    if (medications.length === 0) {
      tableRow(
        ["-", "No medications registered", "-", "-", "-", "-", "-", "-"],
        columnWidths
      );
    } else {
      medications.forEach((item, index) => {
        tableRow(
          [
            String(index + 1),
            item.medication_name ?? "Medication",
            item.dose ?? "-",
            item.route ?? "-",
            item.frequency ?? "-",
            item.duration_days !== null && item.duration_days !== undefined
              ? String(item.duration_days)
              : "-",
            item.start_datetime ? formatShortDate(item.start_datetime) : "-",
            item.quantity_required !== null &&
              item.quantity_required !== undefined
              ? String(item.quantity_required)
              : "-",
          ],
          columnWidths
        );
      });
    }

    section("Medication instructions");

    if (medications.length === 0) {
      paragraph("No medication instructions registered.");
    } else {
      medications.forEach((item, index) => {
        checkPageSpace(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(
          `${index + 1}. ${item.medication_name ?? "Medication"}`,
          marginLeft,
          y
        );
        y += 5;

        doc.setFont("helvetica", "normal");
        paragraph(item.instructions ?? "-");
      });
    }

    doc.save(fileName);
  }

  function escapeHtml(value: string) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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
              <h2 className="text-[14px] font-semibold">Prescription history</h2>

              <p className="text-[11px] text-muted-foreground mt-0.5">
                Prescriptions associated with this patient
              </p>
            </div>

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

          {prescriptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <FileText className="size-8 mx-auto text-muted-foreground mb-2" />

              <p className="text-[13px] font-medium">No prescriptions yet</p>

              <p className="text-[11px] text-muted-foreground mt-1">
                Create the first prescription for this patient.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((prescription) => {
                const medicationCount = prescription.prescription_items?.length ?? 0;

                return (
                  <button
                    key={prescription.id}
                    type="button"
                    onClick={() => setSelectedPrescription(prescription)}
                    className="w-full text-left rounded-xl border border-border bg-secondary/30 p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold">
                            {prescription.prescription_type ?? "Prescription"}
                          </p>

                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-primary font-medium">
                            {prescription.status ?? "—"}
                          </span>
                        </div>

                        <p className="text-[11px] text-muted-foreground mt-1">
                          {formatShortDate(prescription.created_at)}
                        </p>

                        <p className="text-[11px] text-muted-foreground mt-1">
                          Physician: {prescription.physician_name ?? "-"}
                        </p>

                        {prescription.clinical_reason && (
                          <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">
                            {prescription.clinical_reason}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[11px] font-medium">
                          {medicationCount} medication
                          {medicationCount === 1 ? "" : "s"}
                        </p>

                        <p className="text-[10px] text-muted-foreground mt-1">
                          Click to view details
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(prescription.prescription_items ?? [])
                        .slice(0, 4)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="rounded-md bg-card border border-border p-2"
                          >
                            <p className="text-[11px] font-medium">
                              {item.medication_name ?? "Medication"}
                            </p>

                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {item.dose ?? "-"} · {item.route ?? "-"} ·{" "}
                              {item.frequency ?? "-"}
                            </p>
                          </div>
                        ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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

          <SidePanel title="Patient timeline" icon={MessageCircle}>
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

              <ul className="space-y-4">
                {timeline.map((event, index) => (
                  <li key={index} className="relative flex gap-3">
                    <div className="size-8 rounded-full border flex items-center justify-center shrink-0 bg-card z-10">
                      <event.icon className="size-3.5" />
                    </div>

                    <div className="flex-1">
                      <p className="text-[11px] font-medium">{event.title}</p>

                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {event.time}
                      </p>

                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {event.meta}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </SidePanel>
        </div>
      </div>

      {rxOpen && clinicPerson && (
        <PrescriptionPanel
          patientId={patient.id}
          clinicPersonId={clinicPerson.id}
          patientName={fullName}
          editingPrescription={editingPrescription}
          onPrescriptionCreated={() => {
            loadPrescriptionHistory(clinicPerson.id);
            setEditingPrescription(null);
          }}
          onClose={() => {
            setRxOpen(false);
            setEditingPrescription(null);
          }}
        />
      )}

      {selectedPrescription && (
        <PrescriptionDetailPanel
          prescription={selectedPrescription}
          patientName={fullName}
          doctors={doctors}
          onClose={() => setSelectedPrescription(null)}
          onSave={updatePrescriptionHeader}
          onDownloadPdf={downloadPrescriptionPdf}
          onEditFull={(prescription) => {
            setSelectedPrescription(null);
            setEditingPrescription(prescription);
            setRxOpen(true);
          }}
        />
      )}
    </div>
  );
}
// ============================================================
// PRESCRIPTION DETAIL PANEL
// ============================================================

function PrescriptionDetailPanel({
  prescription,
  patientName,
  doctors,
  onClose,
  onSave,
  onDownloadPdf,
  onEditFull,
}: {
  prescription: PrescriptionHistoryItem;
  patientName: string;
  doctors: Doctor[];
  onClose: () => void;
  onEditFull: (prescription: PrescriptionHistoryItem) => void;
  onSave: (values: {
    prescriptionId: string;
    physicianId: string | null;
    prescriptionType: string | null;
    status: string | null;
    clinicalReason: string | null;
    prescriptionItems?: Array<{
      id: string;
      dose: string | null;
      route: string | null;
      frequency: string | null;
      duration_days: number | null;
      start_datetime: string | null;
      quantity_required: number | null;
      quantity_unit: string | null;
      instructions: string | null;
    }>;
  }) => Promise<void>;
  onDownloadPdf: (prescription: PrescriptionHistoryItem) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [physicianId, setPhysicianId] = useState(prescription.physician_id ?? "");
  const [prescriptionType, setPrescriptionType] = useState(
    prescription.prescription_type ?? "MEDICATION"
  );
  const [status, setStatus] = useState(prescription.status ?? "ACTIVE");
  const [clinicalReason, setClinicalReason] = useState(
    prescription.clinical_reason ?? ""
  );

  const [medicationDrafts, setMedicationDrafts] = useState(
    createMedicationDrafts(prescription)
  );

  useEffect(() => {
    setPhysicianId(prescription.physician_id ?? "");
    setPrescriptionType(prescription.prescription_type ?? "MEDICATION");
    setStatus(prescription.status ?? "ACTIVE");
    setClinicalReason(prescription.clinical_reason ?? "");
    setMedicationDrafts(createMedicationDrafts(prescription));
    setEditing(false);
    setSaving(false);
  }, [prescription.id]);

  function createMedicationDrafts(source: PrescriptionHistoryItem) {
    return (source.prescription_items ?? []).map((item) => ({
      id: item.id,
      medication_name: item.medication_name ?? "Medication",
      dose: item.dose ?? "",
      route: item.route ?? "",
      frequency: item.frequency ?? "",
      duration_days:
        item.duration_days !== null && item.duration_days !== undefined
          ? String(item.duration_days)
          : "",
      start_datetime: toDatetimeLocalValue(item.start_datetime),
      quantity_required:
        item.quantity_required !== null && item.quantity_required !== undefined
          ? String(item.quantity_required)
          : "",
      quantity_unit: item.quantity_unit ?? "",
      instructions: item.instructions ?? "",
    }));
  }

  function updateMedicationDraft(
    itemId: string,
    patch: Partial<{
      dose: string;
      route: string;
      frequency: string;
      duration_days: string;
      start_datetime: string;
      quantity_required: string;
      quantity_unit: string;
      instructions: string;
    }>
  ) {
    setMedicationDrafts((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item
      )
    );
  }

  function toDatetimeLocalValue(value: string | null) {
    if (!value) return "";

    const normalized = value.replace(" ", "T");

    return normalized.slice(0, 16);
  }

  function fromDatetimeLocalValue(value: string) {
    if (!value) return null;

    const normalized = value.replace("T", " ");

    return normalized.length === 16 ? `${normalized}:00` : normalized;
  }

  function getDoctorFullName(doctor: Doctor) {
    const fallbackName = `${doctor.first_name ?? ""} ${doctor.last_name ?? ""}`.trim();

    return doctor.full_name?.trim() || fallbackName || "Doctor sin nombre";
  }

  function buildCurrentPrescriptionForPdf(): PrescriptionHistoryItem {
    const selectedDoctor = doctors.find((doctor) => doctor.id === physicianId);

    const physicianName = selectedDoctor
      ? getDoctorFullName(selectedDoctor)
      : prescription.physician_name ?? null;

    const updatedItems = (prescription.prescription_items ?? []).map((item) => {
      const draft = medicationDrafts.find((draftItem) => draftItem.id === item.id);

      if (!draft) return item;

      return {
        ...item,
        dose: draft.dose || null,
        route: draft.route || null,
        frequency: draft.frequency || null,
        duration_days: draft.duration_days ? Number(draft.duration_days) : null,
        start_datetime: fromDatetimeLocalValue(draft.start_datetime),
        quantity_required: draft.quantity_required
          ? Number(draft.quantity_required)
          : null,
        quantity_unit: draft.quantity_unit || null,
        instructions: draft.instructions || null,
      };
    });

    return {
      ...prescription,
      physician_id: physicianId || null,
      physician_name: physicianName,
      physician_license:
        selectedDoctor?.medical_license ?? prescription.physician_license ?? null,
      physician_specialty:
        selectedDoctor?.specialty ?? prescription.physician_specialty ?? null,
      physician_document_number:
        selectedDoctor?.document_number ??
        prescription.physician_document_number ??
        null,
      prescription_type: prescriptionType,
      status,
      clinical_reason: clinicalReason,
      prescription_items: updatedItems,
    };
  }

  async function handleSave() {
    try {
      setSaving(true);

      const prescriptionItems = medicationDrafts.map((item) => ({
        id: item.id,
        dose: item.dose || null,
        route: item.route || null,
        frequency: item.frequency || null,
        duration_days: item.duration_days ? Number(item.duration_days) : null,
        start_datetime: fromDatetimeLocalValue(item.start_datetime),
        quantity_required: item.quantity_required
          ? Number(item.quantity_required)
          : null,
        quantity_unit: item.quantity_unit || null,
        instructions: item.instructions || null,
      }));

      await onSave({
        prescriptionId: prescription.id,
        physicianId: physicianId || null,
        prescriptionType,
        status,
        clinicalReason,
        prescriptionItems,
      });

      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEditing() {
    setPhysicianId(prescription.physician_id ?? "");
    setPrescriptionType(prescription.prescription_type ?? "MEDICATION");
    setStatus(prescription.status ?? "ACTIVE");
    setClinicalReason(prescription.clinical_reason ?? "");
    setMedicationDrafts(createMedicationDrafts(prescription));
    setEditing(false);
  }

  const selectedDoctor = doctors.find((doctor) => doctor.id === physicianId);

  return (
    <div className="fixed inset-0 z-50 flex">
      <button onClick={onClose} className="flex-1 bg-black/30" />

      <aside className="w-full max-w-5xl bg-card border-l border-border flex flex-col shadow-2xl">
        <header className="px-6 py-5 border-b border-border flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Prescription detail
            </p>

            <h2 className="text-[18px] font-semibold mt-1">
              {prescription.prescription_type ?? "Prescription"}
            </h2>

            <p className="text-[11px] text-muted-foreground mt-1">
              Patient: {patientName}
            </p>

            <p className="text-[10.5px] text-muted-foreground mt-1">
              Prescription ID: {prescription.id}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDownloadPdf(buildCurrentPrescriptionForPdf())}
              className="h-9 px-3 rounded-md bg-secondary text-[12px] font-medium inline-flex items-center gap-1.5 hover:bg-accent transition-colors"
            >
              <Download className="size-3.5" />
              Download PDF
            </button>

            {!editing ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="h-9 px-3 rounded-md bg-secondary text-[12px] font-medium inline-flex items-center gap-1.5 hover:bg-accent transition-colors"
                >
                  <Edit3 className="size-3.5" />
                  Quick edit
                </button>

                <button
                  type="button"
                  onClick={() => onEditFull(prescription)}
                  className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-medium inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                >
                  <Edit3 className="size-3.5" />
                  Edit full prescription
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleCancelEditing}
                  className="h-9 px-3 rounded-md border border-border text-[12px] font-medium hover:bg-secondary transition-colors"
                >
                  Cancel edit
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className={cn(
                    "h-9 px-3 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors",
                    saving
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <Save className="size-3.5" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="size-9 rounded-md hover:bg-secondary flex items-center justify-center"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Created at
              </p>

              <p className="text-[12px] font-medium mt-1">
                {formatShortDate(prescription.created_at)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Medications
              </p>

              <p className="text-[12px] font-medium mt-1">
                {medicationDrafts.length}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Current status
              </p>

              <p className="text-[12px] font-medium mt-1">
                {status || "-"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div>
              <h3 className="text-[14px] font-semibold">
                Prescription information
              </h3>

              <p className="text-[11px] text-muted-foreground mt-0.5">
                Click Quick edit to modify header fields, or Edit full prescription to rebuild the prescription.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ControlledSelect
                label="Prescribing physician"
                value={physicianId}
                disabled={!editing}
                onChange={setPhysicianId}
                options={doctors.map((doctor) => ({
                  value: doctor.id,
                  label: getDoctorFullName(doctor),
                }))}
              />

              <ControlledSelect
                label="Prescription type"
                value={prescriptionType}
                disabled={!editing}
                onChange={setPrescriptionType}
                options={["MEDICATION", "HORMONAL", "TRIGGER"]}
              />

              <ControlledSelect
                label="Status"
                value={status}
                disabled={!editing}
                onChange={setStatus}
                options={["ACTIVE", "DRAFT", "COMPLETED", "CANCELLED"]}
              />
            </div>

            <div className="rounded-lg bg-secondary/30 border border-border p-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
                <Info
                  label="Physician"
                  value={
                    selectedDoctor
                      ? getDoctorFullName(selectedDoctor)
                      : prescription.physician_name ?? "-"
                  }
                />

                <Info
                  label="Document"
                  value={
                    selectedDoctor?.document_number ??
                    prescription.physician_document_number ??
                    "-"
                  }
                />

                <Info
                  label="Specialty"
                  value={
                    selectedDoctor?.specialty ??
                    prescription.physician_specialty ??
                    "-"
                  }
                />

                <Info
                  label="License"
                  value={
                    selectedDoctor?.medical_license ??
                    prescription.physician_license ??
                    "-"
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Clinical reason / General instructions
              </label>

              <textarea
                value={clinicalReason}
                disabled={!editing}
                onChange={(event) => setClinicalReason(event.target.value)}
                rows={4}
                className={cn(
                  "mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-[13px] text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15",
                  !editing && "bg-secondary/40 text-muted-foreground cursor-not-allowed"
                )}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div>
              <h3 className="text-[14px] font-semibold">
                Medication details
              </h3>

              <p className="text-[11px] text-muted-foreground mt-0.5">
                Use Edit full prescription if you need to add, remove, or replace medications.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {medicationDrafts.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  No medications registered for this prescription.
                </p>
              ) : (
                medicationDrafts.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border bg-secondary/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[12px] font-semibold">
                          {index + 1}. {item.medication_name}
                        </p>

                        <p className="text-[10px] text-muted-foreground mt-1">
                          Item ID: {item.id}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <ControlledInput
                        label="Dose"
                        value={item.dose}
                        disabled={!editing}
                        onChange={(value) =>
                          updateMedicationDraft(item.id, { dose: value })
                        }
                      />

                      <ControlledSelect
                        label="Route"
                        value={item.route}
                        disabled={!editing}
                        onChange={(value) =>
                          updateMedicationDraft(item.id, { route: value })
                        }
                        options={ROUTE_OPTIONS}
                      />

                      <ControlledInput
                        label="Frequency"
                        value={item.frequency}
                        disabled={!editing}
                        onChange={(value) =>
                          updateMedicationDraft(item.id, { frequency: value })
                        }
                      />

                      <ControlledInput
                        label="Duration days"
                        type="number"
                        min="0"
                        value={item.duration_days}
                        disabled={!editing}
                        onChange={(value) =>
                          updateMedicationDraft(item.id, {
                            duration_days: value,
                          })
                        }
                      />

                      <ControlledInput
                        label="Start date and time"
                        type="datetime-local"
                        value={item.start_datetime}
                        disabled={!editing}
                        onChange={(value) =>
                          updateMedicationDraft(item.id, {
                            start_datetime: value,
                          })
                        }
                      />

                      <ControlledInput
                        label="Quantity required"
                        type="number"
                        min="0"
                        value={item.quantity_required}
                        disabled={!editing}
                        onChange={(value) =>
                          updateMedicationDraft(item.id, {
                            quantity_required: value,
                          })
                        }
                      />

                      <ControlledInput
                        label="Quantity unit"
                        value={item.quantity_unit}
                        disabled={!editing}
                        onChange={(value) =>
                          updateMedicationDraft(item.id, {
                            quantity_unit: value,
                          })
                        }
                      />
                    </div>

                    <div className="mt-4">
                      <label className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                        Instructions
                      </label>

                      <textarea
                        value={item.instructions}
                        disabled={!editing}
                        onChange={(event) =>
                          updateMedicationDraft(item.id, {
                            instructions: event.target.value,
                          })
                        }
                        rows={3}
                        className={cn(
                          "mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-[12.5px] text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15",
                          !editing &&
                            "bg-secondary/40 text-muted-foreground cursor-not-allowed"
                        )}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>
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
  editingPrescription,
  onPrescriptionCreated,
  onClose,
}: {
  patientId: string;
  clinicPersonId: string;
  patientName: string;
  editingPrescription?: PrescriptionHistoryItem | null;
  onPrescriptionCreated: () => void;
  onClose: () => void;
}) {
  const isEditMode = !!editingPrescription;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  const [prescriptionType, setPrescriptionType] = useState("MEDICATION");
  const [linkedProtocol, setLinkedProtocol] = useState("Antagonist IVF");

  const [clinicalReason, setClinicalReason] = useState(
    "Medication plan for current treatment cycle"
  );

  const [medications, setMedications] = useState<MedicationDraft[]>([]);

  useEffect(() => {
    loadData();
  }, [editingPrescription?.id]);

  async function loadData() {
    setLoading(true);

    const [productsRes, lotsRes, doctorsRes] = await Promise.all([
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

      supabase
        .from("doctors")
        .select(`
          id,
          first_name,
          last_name,
          full_name,
          document_type,
          document_number,
          medical_license,
          specialty,
          subspecialty,
          email,
          phone,
          mobile_phone,
          address,
          city,
          country,
          clinic_id,
          department,
          position,
          is_active,
          created_at,
          updated_at
        `)
        .order("full_name", { ascending: true }),
    ]);

    console.log("PRODUCTS", productsRes.data);
    console.log("PRODUCTS ERROR", productsRes.error);

    console.log("LOTS", lotsRes.data);
    console.log("LOTS ERROR", lotsRes.error);

    console.log("DOCTORS", doctorsRes.data);
    console.log("DOCTORS ERROR", doctorsRes.error);

    const productsData = (productsRes.data ?? []) as Product[];
    const lotsData = (lotsRes.data ?? []) as InventoryLot[];

    const doctorsData = ((doctorsRes.data ?? []) as Doctor[]).filter(
      (doctor) =>
        doctor.id &&
        (
          doctor.full_name?.trim() ||
          doctor.first_name?.trim() ||
          doctor.last_name?.trim()
        )
    );

    setProducts(productsData);
    setLots(lotsData);
    setDoctors(doctorsData);

    if (editingPrescription) {
      setSelectedDoctorId(editingPrescription.physician_id ?? doctorsData[0]?.id ?? "");
      setPrescriptionType(editingPrescription.prescription_type ?? "MEDICATION");
      setClinicalReason(
        editingPrescription.clinical_reason ??
          "Medication plan for current treatment cycle"
      );

      const drafts = (editingPrescription.prescription_items ?? []).map((item) => {
        const product = productsData.find((product) => product.id === item.medication_id);

        return {
          local_id: item.id,
          product_id: item.medication_id ?? productsData[0]?.id ?? "",
          dose_value: extractNumericDose(item.dose) || "",
          route: item.route ?? "Subcutáneo",
          start_at: toDatetimeLocalValue(item.start_datetime),
          frequency_interval: extractFrequencyInterval(item.frequency),
          frequency_unit: extractFrequencyUnit(item.frequency),
          duration_days:
            item.duration_days !== null && item.duration_days !== undefined
              ? String(item.duration_days)
              : "1",
          instructions: item.instructions ?? "",
        };
      });

      if (drafts.length > 0) {
        setMedications(drafts);
      } else if (productsData.length > 0) {
        setMedications([createEmptyMedication(productsData[0])]);
      }
    } else {
      if (doctorsData.length > 0) {
        setSelectedDoctorId(doctorsData[0].id);
      } else {
        setSelectedDoctorId("");
      }

      setPrescriptionType("MEDICATION");
      setClinicalReason("Medication plan for current treatment cycle");

      if (productsData.length > 0) {
        setMedications([createEmptyMedication(productsData[0])]);
      }
    }

    setLoading(false);
  }

  function toDatetimeLocalValue(value: string | null) {
    if (!value) return "";

    const normalized = value.replace(" ", "T");

    return normalized.slice(0, 16);
  }

  function createEmptyMedication(product: Product | undefined): MedicationDraft {
    return {
      local_id: crypto.randomUUID(),
      product_id: product?.id ?? "",
      dose_value: product?.strength_value ? String(product.strength_value) : "",
      route: "Subcutáneo",
      start_at: "",
      frequency_interval: "24",
      frequency_unit: "hours",
      duration_days: "1",
      instructions: "",
    };
  }

  function extractNumericDose(value: string | null) {
    if (!value) return "";

    const match = value.match(/[\d.]+/);

    return match ? match[0] : "";
  }

  function extractFrequencyInterval(value: string | null) {
    if (!value) return "24";

    const match = value.match(/[\d.]+/);

    return match ? match[0] : "24";
  }

  function extractFrequencyUnit(value: string | null): "minutes" | "hours" | "days" {
    if (!value) return "hours";

    const lower = value.toLowerCase();

    if (lower.includes("minuto") || lower.includes("minute")) return "minutes";
    if (lower.includes("día") || lower.includes("dia") || lower.includes("day")) {
      return "days";
    }

    return "hours";
  }

  function addMedication() {
    const firstProduct = products[0];

    if (!firstProduct) {
      alert("No products available");
      return;
    }

    setMedications((current) => [
      ...current,
      createEmptyMedication(firstProduct),
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

    updateMedication(localId, {
      product_id: productId,
      dose_value: product?.strength_value ? String(product.strength_value) : "",
    });
  }

  function getProductById(productId: string) {
    return products.find((product) => product.id === productId);
  }

  function getDoctorFullName(doctor: Doctor) {
    const fallbackName = `${doctor.first_name ?? ""} ${doctor.last_name ?? ""}`.trim();

    return doctor.full_name?.trim() || fallbackName || "Doctor sin nombre";
  }

  function getAvailableLotsByProductId(productId: string, sourceLots = lots) {
    return sourceLots
      .filter(
        (lot) =>
          lot.product_id === productId &&
          Number(lot.quantity_available ?? 0) > 0 &&
          (!lot.status || lot.status === "AVAILABLE" || lot.status === "ACTIVE")
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

  function getAvailableInventoryByProductId(productId: string) {
    return getAvailableLotsByProductId(productId).reduce(
      (total, lot) => total + Number(lot.quantity_available ?? 0),
      0
    );
  }

  function calculateMedication(item: MedicationDraft) {
    const product = getProductById(item.product_id);

    const doseValue = Number(item.dose_value || 0);
    const strengthValue = Number(product?.strength_value || 0);

    const unitsPerDose =
      doseValue > 0 && strengthValue > 0
        ? Math.ceil(doseValue / strengthValue)
        : 0;

    const durationMinutes = Number(item.duration_days || 0) * 24 * 60;

    const frequencyMinutes = getFrequencyInMinutes(
      item.frequency_interval,
      item.frequency_unit
    );

    const dosesCount =
      frequencyMinutes > 0
        ? Math.ceil(durationMinutes / frequencyMinutes)
        : 0;

    const totalUnitsRequired = dosesCount * unitsPerDose;

    const availableUnits = product
      ? getAvailableInventoryByProductId(product.id)
      : 0;

    const stockGap = Math.max(totalUnitsRequired - availableUnits, 0);

    const hasEnoughInventory =
      totalUnitsRequired > 0 && availableUnits >= totalUnitsRequired;

    return {
      product,
      doseValue,
      strengthValue,
      unitsPerDose,
      durationMinutes,
      frequencyMinutes,
      dosesCount,
      totalUnitsRequired,
      availableUnits,
      stockGap,
      hasEnoughInventory,
      doseLabel:
        doseValue > 0
          ? `${doseValue} ${product?.unit_of_measure ?? ""}`.trim()
          : "",
      frequencyLabel: buildFrequencyLabel(
        item.frequency_interval,
        item.frequency_unit
      ),
    };
  }

  function buildReservationPlan({
    productId,
    requiredQuantity,
  }: {
    productId: string;
    requiredQuantity: number;
  }) {
    const productLots = getAvailableLotsByProductId(productId);
    let remainingQuantity = requiredQuantity;

    const reservations: Array<{
      lot: InventoryLot;
      quantity: number;
    }> = [];

    for (const lot of productLots) {
      if (remainingQuantity <= 0) break;

      const available = Number(lot.quantity_available ?? 0);

      if (available <= 0) continue;

      const quantityToReserve = Math.min(available, remainingQuantity);

      reservations.push({
        lot,
        quantity: quantityToReserve,
      });

      remainingQuantity -= quantityToReserve;
    }

    return {
      reservations,
      missingQuantity: Math.max(remainingQuantity, 0),
      canFullyReserve: remainingQuantity <= 0,
    };
  }

  const prescriptionSummary = useMemo(() => {
    let totalRequired = 0;
    let stockAlerts = 0;
    let allValid = medications.length > 0 && !!selectedDoctorId;

    for (const medication of medications) {
      const calc = calculateMedication(medication);

      totalRequired += calc.totalUnitsRequired;

      if (!calc.hasEnoughInventory && calc.totalUnitsRequired > 0) {
        stockAlerts += 1;
      }

      if (
        !selectedDoctorId ||
        !medication.product_id ||
        !medication.start_at ||
        Number(medication.dose_value) <= 0 ||
        Number(medication.frequency_interval) <= 0 ||
        Number(medication.duration_days) <= 0 ||
        calc.unitsPerDose <= 0 ||
        calc.totalUnitsRequired <= 0
      ) {
        allValid = false;
      }
    }

    return {
      totalRequired,
      stockAlerts,
      allValid,
      medicationCount: medications.length,
    };
  }, [medications, products, lots, selectedDoctorId]);

  async function createStockAlert({
    prescriptionItemId,
    product,
    calc,
  }: {
    prescriptionItemId: string;
    product: Product;
    calc: ReturnType<typeof calculateMedication>;
  }) {
    const { error } = await supabase.from("alerts").insert({
      id: crypto.randomUUID(),
      clinic_id: CLINIC_ID,
      fertility_case_id: null,
      alert_type: "INVENTORY_SHORTAGE",
      severity: calc.availableUnits <= 0 ? "HIGH" : "MEDIUM",
      title: `Stock insuficiente para ${product.name}`,
      description: `La prescripción fue emitida, pero el inventario disponible no cubre la cantidad requerida. Medicamento: ${product.name}. Requerido: ${calc.totalUnitsRequired}. Disponible: ${calc.availableUnits}. Faltante estimado: ${calc.stockGap}. Se requiere revisión por farmacia/compras para abastecimiento o gestión con proveedores.`,
      status: "OPEN",
      related_entity_type: "prescription_item",
      related_entity_id: prescriptionItemId,
      created_at: new Date().toISOString(),
      resolved_at: null,
    });

    if (error) {
      console.error("STOCK ALERT ERROR", error);
    }
  }

  async function reserveInventoryForPrescriptionItem({
    prescriptionId,
    prescriptionItemId,
    product,
    requiredQuantity,
  }: {
    prescriptionId: string;
    prescriptionItemId: string;
    product: Product;
    requiredQuantity: number;
  }) {
    const reservationPlan = buildReservationPlan({
      productId: product.id,
      requiredQuantity,
    });

    if (!reservationPlan.canFullyReserve) {
      return {
        reserved: false,
        reservedQuantity: requiredQuantity - reservationPlan.missingQuantity,
        missingQuantity: reservationPlan.missingQuantity,
      };
    }

    for (const reservation of reservationPlan.reservations) {
      const currentAvailable = Number(reservation.lot.quantity_available ?? 0);
      const currentReserved = Number(reservation.lot.quantity_reserved ?? 0);

      const newAvailable = currentAvailable - reservation.quantity;
      const newReserved = currentReserved + reservation.quantity;

      const { error: movementError } = await supabase
        .from("inventory_movements")
        .insert({
          clinic_id: CLINIC_ID,
          lot_id: reservation.lot.id,
          movement_type: "reservation",
          source_location_id: reservation.lot.location_id ?? null,
          destination_location_id: null,
          quantity: reservation.quantity,
          performed_by: null,
          reason: `Reserved ${reservation.quantity} units of ${product.name} for prescription ${prescriptionId} / item ${prescriptionItemId}`,
          created_at: new Date().toISOString(),
        });

      if (movementError) {
        console.error("MOVEMENT ERROR", movementError);
        throw new Error(`Could not create inventory movement for ${product.name}`);
      }

      const { error: updateLotError } = await supabase
        .from("inventory_lots")
        .update({
          quantity_available: newAvailable,
          quantity_reserved: newReserved,
        })
        .eq("id", reservation.lot.id);

      if (updateLotError) {
        console.error("LOT UPDATE ERROR", updateLotError);
        throw new Error(`Could not reserve inventory for ${product.name}`);
      }

      setLots((currentLots) =>
        currentLots.map((lot) =>
          lot.id === reservation.lot.id
            ? {
                ...lot,
                quantity_available: newAvailable,
                quantity_reserved: newReserved,
              }
            : lot
        )
      );
    }

    return {
      reserved: true,
      reservedQuantity: requiredQuantity,
      missingQuantity: 0,
    };
  }

  async function savePrescription() {
    if (isEditMode) {
      await updateExistingPrescription();
    } else {
      await createPrescription();
    }
  }

  async function updateExistingPrescription() {
    try {
      setSaving(true);

      if (!editingPrescription) return;

      if (!selectedDoctorId) {
        alert("Prescribing physician is required");
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

        if (!medication.start_at) {
          alert(`Start date and time is required for ${product.name}`);
          return;
        }

        if (Number(medication.dose_value) <= 0) {
          alert(`Dose must be greater than zero for ${product.name}`);
          return;
        }

        if (calc.unitsPerDose <= 0) {
          alert(
            `Could not calculate units per dose for ${product.name}. Please check product strength.`
          );
          return;
        }

        if (Number(medication.frequency_interval) <= 0) {
          alert(`Frequency must be greater than zero for ${product.name}`);
          return;
        }

        if (Number(medication.duration_days) <= 0) {
          alert(`Duration must be greater than zero for ${product.name}`);
          return;
        }
      }

      const { error: prescriptionError } = await supabase
        .from("prescriptions")
        .update({
          physician_id: selectedDoctorId,
          prescription_type: prescriptionType,
          status: "ACTIVE",
          clinical_reason: clinicalReason,
        })
        .eq("id", editingPrescription.id);

      console.log("UPDATE FULL PRESCRIPTION ERROR", prescriptionError);

      if (prescriptionError) {
        alert("Could not update prescription");
        return;
      }

      const { error: deleteItemsError } = await supabase
        .from("prescription_items")
        .delete()
        .eq("prescription_id", editingPrescription.id);

      console.log("DELETE OLD PRESCRIPTION ITEMS ERROR", deleteItemsError);

      if (deleteItemsError) {
        alert("Could not remove previous prescription items");
        return;
      }

      const itemsPayload = medications.map((medication) => {
        const product = getProductById(medication.product_id);
        const calc = calculateMedication(medication);

        const startDate = parseDatetimeLocal(medication.start_at);
        const endDate = addDays(startDate, Number(medication.duration_days));

        return {
          id: crypto.randomUUID(),
          prescription_id: editingPrescription.id,
          medication_id: medication.product_id,
          dose: calc.doseLabel,
          route: medication.route,
          frequency: calc.frequencyLabel,
          duration_days: Number(medication.duration_days),
          start_datetime: formatTimestampWithoutTimezone(startDate),
          end_datetime: formatTimestampWithoutTimezone(endDate),
          administration_time: getTimeFromDatetimeLocal(medication.start_at),
          instructions: medication.instructions?.trim() || clinicalReason,
          quantity_required: calc.totalUnitsRequired,
          quantity_unit:
            product?.presentation ?? product?.unit_of_measure ?? "units",
          status: "ACTIVE",
          inventory_status: "PENDING_REVIEW",
        };
      });

      const { error: insertItemsError } = await supabase
        .from("prescription_items")
        .insert(itemsPayload);

      console.log("INSERT UPDATED PRESCRIPTION ITEMS ERROR", insertItemsError);

      if (insertItemsError) {
        alert("Could not insert updated prescription items");
        return;
      }

      runMockAction("Updating prescription", {
        detail:
          "Prescription rebuilt successfully. Inventory was marked as pending review.",
        success: "Prescription updated",
      });

      onPrescriptionCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function createPrescription() {
    try {
      setSaving(true);

      if (!clinicPersonId) {
        alert("Patient is not associated with this clinic");
        return;
      }

      if (!selectedDoctorId) {
        alert("Prescribing physician is required");
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

        if (!medication.start_at) {
          alert(`Start date and time is required for ${product.name}`);
          return;
        }

        if (Number(medication.dose_value) <= 0) {
          alert(`Dose must be greater than zero for ${product.name}`);
          return;
        }

        if (calc.unitsPerDose <= 0) {
          alert(
            `Could not calculate units per dose for ${product.name}. Please check product strength.`
          );
          return;
        }

        if (Number(medication.frequency_interval) <= 0) {
          alert(`Frequency must be greater than zero for ${product.name}`);
          return;
        }

        if (Number(medication.duration_days) <= 0) {
          alert(`Duration must be greater than zero for ${product.name}`);
          return;
        }
      }

      const prescriptionPayload = {
        clinic_id: CLINIC_ID,
        clinic_patient_id: clinicPersonId,
        fertility_case_id: null,
        treatment_cycle_id: null,
        physician_id: selectedDoctorId,
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
        alert("Could not create prescription. Check the physician foreign key in Supabase.");
        return;
      }

      let generatedStockAlerts = 0;
      let reservedItems = 0;

      for (const medication of medications) {
        const product = getProductById(medication.product_id);
        const calc = calculateMedication(medication);

        if (!product) {
          alert("Medication not found");
          return;
        }

        const startDate = parseDatetimeLocal(medication.start_at);
        const endDate = addDays(startDate, Number(medication.duration_days));

        const prescriptionItemId = crypto.randomUUID();

        const instructions = medication.instructions?.trim() || clinicalReason;

        const quantityUnit = product.presentation ?? product.unit_of_measure ?? "units";

        const initialInventoryStatus = calc.hasEnoughInventory
          ? "PENDING_RESERVATION"
          : "STOCK_ALERT";

        const { data: prescriptionItem, error: itemError } = await supabase
          .from("prescription_items")
          .insert({
            id: prescriptionItemId,
            prescription_id: prescription.id,
            medication_id: medication.product_id,
            dose: calc.doseLabel,
            route: medication.route,
            frequency: calc.frequencyLabel,
            duration_days: Number(medication.duration_days),
            start_datetime: formatTimestampWithoutTimezone(startDate),
            end_datetime: formatTimestampWithoutTimezone(endDate),
            administration_time: getTimeFromDatetimeLocal(medication.start_at),
            instructions,
            quantity_required: calc.totalUnitsRequired,
            quantity_unit: quantityUnit,
            status: "ACTIVE",
            inventory_status: initialInventoryStatus,
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

        if (calc.hasEnoughInventory) {
          try {
            await reserveInventoryForPrescriptionItem({
              prescriptionId: prescription.id,
              prescriptionItemId: prescriptionItem.id,
              product,
              requiredQuantity: calc.totalUnitsRequired,
            });

            const { error: itemUpdateError } = await supabase
              .from("prescription_items")
              .update({
                inventory_status: "RESERVED",
              })
              .eq("id", prescriptionItem.id);

            if (itemUpdateError) {
              console.error("ITEM INVENTORY STATUS UPDATE ERROR", itemUpdateError);
              alert(`Could not update inventory status for ${product.name}`);
              return;
            }

            reservedItems += 1;
          } catch (error) {
            console.error("RESERVATION ERROR", error);

            const { error: itemUpdateError } = await supabase
              .from("prescription_items")
              .update({
                inventory_status: "RESERVATION_ERROR",
              })
              .eq("id", prescriptionItem.id);

            if (itemUpdateError) {
              console.error("ITEM RESERVATION ERROR STATUS UPDATE", itemUpdateError);
            }

            alert(`Could not reserve inventory for ${product.name}`);
            return;
          }
        } else {
          await createStockAlert({
            prescriptionItemId: prescriptionItem.id,
            product,
            calc,
          });

          generatedStockAlerts += 1;
        }
      }

      runMockAction("Issuing prescription", {
        detail:
          generatedStockAlerts > 0
            ? `${medications.length} medication(s) prescribed. ${reservedItems} item(s) reserved and ${generatedStockAlerts} stock alert(s) generated.`
            : `${medications.length} medication(s) prescribed and reserved successfully.`,
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
              {isEditMode ? "Edit prescription" : "Create prescription"}
            </h2>

            <p className="text-[11px] text-muted-foreground mt-1">
              Patient: {patientName}
            </p>

            <p className="text-[10.5px] text-muted-foreground mt-1">
              Patient ID: {patientId}
            </p>

            {isEditMode && (
              <p className="text-[10.5px] text-warning mt-1">
                Editing existing prescription. Inventory will be marked as pending review.
              </p>
            )}
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
              Loading products and physicians...
            </div>
          )}

          {!loading && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <ControlledSelect
                  label="Prescribing physician"
                  value={selectedDoctorId}
                  onChange={setSelectedDoctorId}
                  options={doctors.map((doctor) => ({
                    value: doctor.id,
                    label: getDoctorFullName(doctor),
                  }))}
                />

                <ControlledSelect
                  label="Linked protocol"
                  value={linkedProtocol}
                  onChange={setLinkedProtocol}
                  options={[
                    "Estimulacion Ovarica",
                    "FIV Convencional",
                    "ICSI",
                    "Transferencia Embrionaria",
                  ]}
                />

                <ControlledSelect
                  label="Procedimiento"
                  value={prescriptionType}
                  onChange={setPrescriptionType}
                  options={[
                    "FIV con gametos propios",
                    "FIV con donante de semen y óvulos propios",
                    "FIV con donante de óvulos y semen propio",
                    "Inseminación Heteróloga",
                    "Inseminación Homóloga",
                    "Método ROPA",
                    "Subrogación con gametos propios",
                    "Subrogación con donante de semen y óvulos propios",
                    "Subrogación con donante de óvulos y semen propios",
                    "Preservación de la fertilidad - Mujer",
                  ]}
                />
              </div>

              {doctors.length === 0 && (
                <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                  <p className="text-[11px] text-warning leading-relaxed">
                    No physicians were found in the doctors table. Check if the
                    table has records and if Supabase RLS allows SELECT access.
                  </p>
                </div>
              )}

              <div>
                <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Clinical reason / General instructions
                </label>

                <textarea
                  value={clinicalReason}
                  onChange={(event) => setClinicalReason(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-[13px] text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[14px] font-semibold">
                      Medications
                    </h3>

                    <p className="text-[11px] text-muted-foreground">
                      {isEditMode
                        ? "Rebuild the prescription medication list. Previous medication lines will be replaced."
                        : "Add all medications in the same prescription. The system reserves inventory automatically when stock is available."}
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

                      <div className="grid grid-cols-1 gap-4">
                        <ControlledSelect
                          label="Medication"
                          value={medication.product_id}
                          onChange={(value) =>
                            handleProductChange(medication.local_id, value)
                          }
                          options={products.map((item) => ({
                            value: item.id,
                            label: item.name,
                          }))}
                        />
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
                              label="Dose unit"
                              value={product.unit_of_measure ?? "-"}
                            />

                            <Info
                              label="Available stock"
                              value={`${calc.availableUnits} ${
                                product.presentation ?? "units"
                              }`}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-4">
                        <ControlledInput
                          label="Dose"
                          type="number"
                          min="0"
                          step="0.01"
                          suffix={product?.unit_of_measure ?? ""}
                          value={medication.dose_value}
                          onChange={(value) =>
                            updateMedication(medication.local_id, {
                              dose_value: value,
                            })
                          }
                        />

                        <ControlledSelect
                          label="Route"
                          value={medication.route}
                          onChange={(value) =>
                            updateMedication(medication.local_id, {
                              route: value,
                            })
                          }
                          options={ROUTE_OPTIONS}
                        />

                        <ControlledInput
                          label="Units per dose"
                          value={String(calc.unitsPerDose || "")}
                          onChange={() => undefined}
                          disabled
                        />

                        <ControlledInput
                          label="Frequency every"
                          type="number"
                          min="1"
                          value={medication.frequency_interval}
                          onChange={(value) =>
                            updateMedication(medication.local_id, {
                              frequency_interval: value,
                            })
                          }
                        />

                        <ControlledSelect
                          label="Frequency unit"
                          value={medication.frequency_unit}
                          onChange={(value) =>
                            updateMedication(medication.local_id, {
                              frequency_unit: value as
                                | "minutes"
                                | "hours"
                                | "days",
                            })
                          }
                          options={FREQUENCY_UNIT_OPTIONS}
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
                          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-[12.5px] text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
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
                            Prescription calculation
                          </p>

                          <span
                            className={cn(
                              "text-[11px] font-medium",
                              isEditMode
                                ? "text-warning"
                                : calc.hasEnoughInventory
                                  ? "text-success"
                                  : "text-warning"
                            )}
                          >
                            {isEditMode
                              ? "Inventory pending review"
                              : calc.hasEnoughInventory
                                ? "Will reserve inventory"
                                : "Stock alert will be generated"}
                          </span>
                        </div>

                        <div className="grid grid-cols-5 gap-3 text-[11px]">
                          <Info label="Dose" value={calc.doseLabel || "-"} />

                          <Info
                            label="Units per dose"
                            value={`${calc.unitsPerDose || "-"}`}
                          />

                          <Info
                            label="Doses"
                            value={`${calc.dosesCount || "-"}`}
                          />

                          <Info
                            label="Required"
                            value={`${calc.totalUnitsRequired || "-"}`}
                          />

                          <Info
                            label="Available"
                            value={`${calc.availableUnits}`}
                          />
                        </div>

                        {isEditMode && (
                          <p className="mt-3 text-[10.5px] text-warning leading-relaxed">
                            This edited prescription will be marked as pending
                            inventory review. It will not automatically reserve stock.
                          </p>
                        )}

                        {!isEditMode &&
                          !calc.hasEnoughInventory &&
                          calc.totalUnitsRequired > 0 && (
                            <p className="mt-3 text-[10.5px] text-warning leading-relaxed">
                              The prescription can still be issued, but no
                              inventory reservation will be completed for this
                              medication. A stock alert will be generated.
                            </p>
                          )}
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
                    label="Total units required"
                    value={`${prescriptionSummary.totalRequired}`}
                  />

                  <Info
                    label={isEditMode ? "Inventory mode" : "Stock alerts"}
                    value={isEditMode ? "Pending review" : `${prescriptionSummary.stockAlerts}`}
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
            onClick={savePrescription}
            className={cn(
              "h-9 px-4 rounded-md text-[12px] font-semibold",
              saving || !prescriptionSummary.allValid
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground"
            )}
          >
            {saving
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update prescription"
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

function ControlledInput({
  label,
  value,
  onChange,
  type = "text",
  min,
  step,
  disabled = false,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  step?: string;
  disabled?: boolean;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </span>

      <div className="relative mt-1">
        <input
          type={type}
          min={min}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "w-full h-9 rounded-md border border-border bg-card px-3 text-[12.5px] text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15",
            suffix && "pr-14",
            disabled && "cursor-not-allowed bg-secondary/60 text-muted-foreground"
          )}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function ControlledSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | SelectOption>;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </span>

      <div className="relative mt-1">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "w-full h-9 appearance-none rounded-md border border-border bg-card px-3 pr-9 text-[12.5px] text-foreground shadow-sm outline-none transition-colors hover:bg-secondary/60 focus:border-primary focus:ring-2 focus:ring-primary/15",
            disabled &&
              "cursor-not-allowed bg-secondary/60 text-muted-foreground hover:bg-secondary/60"
          )}
        >
          {options.length === 0 && (
            <option value="">No options available</option>
          )}

          {options.map((option) => {
            const normalized =
              typeof option === "string"
                ? { value: option, label: option }
                : option;

            return (
              <option key={normalized.value} value={normalized.value}>
                {normalized.label}
              </option>
            );
          })}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      </div>
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
  icon: ComponentType<{
    className?: string;
  }>;
  children: ReactNode;
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

function getFrequencyInMinutes(interval: string, unit: string) {
  const value = Number(interval || 0);

  if (value <= 0) return 0;

  if (unit === "minutes") return value;
  if (unit === "hours") return value * 60;
  if (unit === "days") return value * 24 * 60;

  return 0;
}

function buildFrequencyLabel(interval: string, unit: string) {
  const value = Number(interval || 0);

  if (value <= 0) return "";

  if (unit === "minutes") {
    return `Cada ${value} minuto${value === 1 ? "" : "s"}`;
  }

  if (unit === "hours") {
    return `Cada ${value} hora${value === 1 ? "" : "s"}`;
  }

  if (unit === "days") {
    return `Cada ${value} día${value === 1 ? "" : "s"}`;
  }

  return "";
}

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

function formatInventoryStatus(value: string | null) {
  if (!value) return "-";

  if (value === "PENDING_RESERVATION") return "Pending reservation";
  if (value === "RESERVED") return "Reserved";
  if (value === "STOCK_ALERT") return "Stock alert";
  if (value === "RESERVATION_ERROR") return "Reservation error";
  if (value === "DISPENSED") return "Dispensed";
  if (value === "PENDING_REVIEW") return "Pending review";

  return value;
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
Quantity: ${item.quantity_required ?? "-"}
Instructions: ${item.instructions ?? "-"}`;
    })
    .join("\n\n");

  return `Hello ${patientName},

This is a medication reminder from your care team.

Prescription:
${prescription.prescription_type ?? "Medication prescription"}

Physician:
${prescription.physician_name ?? "-"}

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