import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  X,
  Loader2,
  UserPlus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/patients")({
  component: PatientsPage,
});

interface Patient {
  id: string;
  first_name: string | null;
  last_name: string | null;
  document_type: string | null;
  document_number: string | null;
  birth_date: string | null;
  date_of_birth?: string | null;
  biological_sex: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  created_at: string | null;
}

type NewPatientForm = {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  gender: string;
  biologicalSex: string;
  phone: string;
  email: string;
};

const DEFAULT_CLINIC_ID = "385f976d-2e25-4af3-91da-5d347acaa54f";

function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [showNewPatient, setShowNewPatient] = useState(false);
  const [creatingPatient, setCreatingPatient] = useState(false);

  const [newPatient, setNewPatient] = useState<NewPatientForm>({
    firstName: "",
    lastName: "",
    documentType: "CC",
    documentNumber: "",
    birthDate: "",
    gender: "",
    biologicalSex: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    setLoading(true);

    const { data, error } = await supabase
      .from("persons")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("PATIENTS DATA", data);
    console.log("PATIENTS ERROR", error);

    if (error || !data) {
      setPatients([]);
      setLoading(false);
      return;
    }

    setPatients(data as Patient[]);
    setLoading(false);
  }

  function resetNewPatientForm() {
    setNewPatient({
      firstName: "",
      lastName: "",
      documentType: "CC",
      documentNumber: "",
      birthDate: "",
      gender: "",
      biologicalSex: "",
      phone: "",
      email: "",
    });
  }

  async function createPatient() {
    if (!newPatient.firstName.trim()) {
      alert("El nombre del paciente es obligatorio.");
      return;
    }

    if (!newPatient.lastName.trim()) {
      alert("El apellido del paciente es obligatorio.");
      return;
    }

    if (!newPatient.documentType.trim()) {
      alert("El tipo de documento es obligatorio.");
      return;
    }

    if (!newPatient.documentNumber.trim()) {
      alert("El número de documento es obligatorio.");
      return;
    }

    if (!newPatient.birthDate) {
      alert("La fecha de nacimiento es obligatoria.");
      return;
    }

    if (!newPatient.gender) {
      alert("El género del paciente es obligatorio.");
      return;
    }

    setCreatingPatient(true);

    const now = timestampWithoutTimezone(new Date());
    const personId = crypto.randomUUID();
    const clinicPatientId = crypto.randomUUID();

    const personPayload = {
      id: personId,
      first_name: newPatient.firstName.trim(),
      last_name: newPatient.lastName.trim(),
      document_type: newPatient.documentType.trim(),
      document_number: newPatient.documentNumber.trim(),

      /*
        IMPORTANTE:
        Si tu tabla persons usa date_of_birth en vez de birth_date,
        cambia esta línea por:
        date_of_birth: newPatient.birthDate,
      */
      birth_date: newPatient.birthDate,

      biological_sex: newPatient.biologicalSex || null,
      gender: newPatient.gender,
      phone: newPatient.phone.trim() || null,
      email: newPatient.email.trim() || null,
      created_at: now,
    };

    const { error: personError } = await supabase
      .from("persons")
      .insert(personPayload);

    if (personError) {
      console.error("ERROR CREATING PERSON", personError);
      alert(personError.message || "No se pudo crear el paciente.");
      setCreatingPatient(false);
      return;
    }

    const { error: clinicPersonError } = await supabase
      .from("clinic_persons")
      .insert({
        id: clinicPatientId,
        clinic_id: DEFAULT_CLINIC_ID,
        person_id: personId,
        internal_patient_code: generateInternalPatientCode(),
        status: "ACTIVE",
        first_visit_at: null,
        last_visit_at: null,
        created_at: now,
      });

    if (clinicPersonError) {
      console.error("ERROR CREATING CLINIC PERSON LINK", clinicPersonError);

      alert(
        clinicPersonError.message ||
          "El paciente fue creado, pero no se pudo vincular a la clínica.",
      );

      setCreatingPatient(false);
      return;
    }

    resetNewPatientForm();
    setShowNewPatient(false);
    setCreatingPatient(false);

    await loadPatients();
  }

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const fullName = `${patient.first_name ?? ""} ${
        patient.last_name ?? ""
      }`.toLowerCase();

      return (
        fullName.includes(q.toLowerCase()) ||
        (patient.document_number ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (patient.email ?? "").toLowerCase().includes(q.toLowerCase())
      );
    });
  }, [patients, q]);

  function calculateAge(birthDate?: string | null) {
    if (!birthDate) return "-";

    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();

    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Patients</h1>

          <p className="text-[13px] text-muted-foreground mt-1">
            {filteredPatients.length} registered patients
          </p>
        </div>

        <button
          onClick={() => setShowNewPatient(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-[13px] font-medium rounded-md h-9 px-3.5 hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          New Patient
        </button>
      </div>

      {showNewPatient && (
        <NewPatientPanel
          form={newPatient}
          setForm={setNewPatient}
          creating={creatingPatient}
          onCancel={() => {
            resetNewPatientForm();
            setShowNewPatient(false);
          }}
          onCreate={createPatient}
        />
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center h-9 flex-1 max-w-md bg-card border border-border rounded-md px-3 focus-within:border-primary transition-colors">
          <Search className="size-3.5 text-muted-foreground mr-2" />

          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            className="bg-transparent outline-none text-[12px] flex-1 placeholder:text-muted-foreground"
            placeholder="Search by name, document, or email..."
          />
        </div>

        <button className="inline-flex items-center gap-2 h-9 px-3 bg-card border border-border rounded-md text-[12px] font-medium hover:bg-secondary transition-colors">
          <Filter className="size-3.5" />
          Filter
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium text-muted-foreground">
                  Patient
                </th>

                <th className="py-2.5 px-4 font-medium text-muted-foreground">
                  Document
                </th>

                <th className="py-2.5 px-4 font-medium text-muted-foreground">
                  Gender
                </th>

                <th className="py-2.5 px-4 font-medium text-muted-foreground">
                  Phone
                </th>

                <th className="py-2.5 px-4 font-medium text-muted-foreground">
                  Email
                </th>

                <th className="py-3 px-4 font-semibold text-muted-foreground"></th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Loading patients...
                  </td>
                </tr>
              )}

              {!loading && filteredPatients.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No patients found
                  </td>
                </tr>
              )}

              {!loading &&
                filteredPatients.map((patient) => {
                  const fullName = `${patient.first_name ?? ""} ${
                    patient.last_name ?? ""
                  }`.trim();

                  const initials = fullName
                    .split(" ")
                    .filter(Boolean)
                    .map((name) => name[0])
                    .slice(0, 2)
                    .join("");

                  const birthDate =
                    patient.birth_date ?? patient.date_of_birth ?? null;

                  return (
                    <tr
                      key={patient.id}
                      className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors group"
                    >
                      <td className="py-2.5 px-4">
                        <Link
                          to="/patients/$patientId"
                          params={{
                            patientId: patient.id,
                          }}
                          className="flex items-center gap-3"
                        >
                          <div className="size-8 rounded-full bg-accent text-primary flex items-center justify-center text-[10px] font-semibold">
                            {initials || "P"}
                          </div>

                          <div>
                            <p className="font-medium text-foreground">
                              {fullName || "Unnamed patient"}
                            </p>

                            <p className="text-[10px] text-muted-foreground">
                              {calculateAge(birthDate)} yrs
                            </p>
                          </div>
                        </Link>
                      </td>

                      <td className="py-2.5 px-4">
                        <span className="text-muted-foreground">
                          {patient.document_type ?? "-"} ·{" "}
                          {patient.document_number ?? "-"}
                        </span>
                      </td>

                      <td className="py-2.5 px-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                            "bg-accent text-primary",
                          )}
                        >
                          {patient.gender ?? patient.biological_sex ?? "-"}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-muted-foreground">
                        {patient.phone ?? "-"}
                      </td>

                      <td className="py-2.5 px-4 text-muted-foreground">
                        {patient.email ?? "-"}
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors inline-block" />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NewPatientPanel({
  form,
  setForm,
  creating,
  onCancel,
  onCreate,
}: {
  form: NewPatientForm;
  setForm: React.Dispatch<React.SetStateAction<NewPatientForm>>;
  creating: boolean;
  onCancel: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <UserPlus className="size-4 text-primary" />

          <div>
            <h2 className="text-sm font-semibold">New patient</h2>

            <p className="text-[11px] text-muted-foreground mt-0.5">
              Create a patient record that can later be used for prescriptions.
            </p>
          </div>
        </div>

        <button
          onClick={onCancel}
          disabled={creating}
          className="size-8 inline-flex items-center justify-center rounded-md hover:bg-secondary disabled:opacity-50"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            First name
          </span>

          <input
            value={form.firstName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                firstName: event.target.value,
              }))
            }
            placeholder="First name"
            className="mt-1 h-9 w-full rounded-md bg-secondary px-3 text-sm outline-none"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Last name
          </span>

          <input
            value={form.lastName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                lastName: event.target.value,
              }))
            }
            placeholder="Last name"
            className="mt-1 h-9 w-full rounded-md bg-secondary px-3 text-sm outline-none"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Document type
          </span>

          <select
            value={form.documentType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                documentType: event.target.value,
              }))
            }
            className="mt-1 h-9 w-full rounded-md bg-secondary px-3 text-sm outline-none"
          >
            <option value="">Select</option>
            <option value="CC">Cédula de ciudadanía</option>
            <option value="CE">Cédula de extranjería</option>
            <option value="PA">Pasaporte</option>
            <option value="TI">Tarjeta de identidad</option>
            <option value="RC">Registro civil</option>
            <option value="PEP">PEP</option>
            <option value="PPT">PPT</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Document number
          </span>

          <input
            value={form.documentNumber}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                documentNumber: event.target.value,
              }))
            }
            placeholder="Document number"
            className="mt-1 h-9 w-full rounded-md bg-secondary px-3 text-sm outline-none"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Birth date
          </span>

          <input
            type="date"
            value={form.birthDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                birthDate: event.target.value,
              }))
            }
            className="mt-1 h-9 w-full rounded-md bg-secondary px-3 text-sm outline-none"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Gender
          </span>

          <select
            value={form.gender}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                gender: event.target.value,
              }))
            }
            className="mt-1 h-9 w-full rounded-md bg-secondary px-3 text-sm outline-none"
          >
            <option value="">Select</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
            <option value="OTHER">Other</option>
            <option value="UNSPECIFIED">Unspecified</option>
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Biological sex
          </span>

          <select
            value={form.biologicalSex}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                biologicalSex: event.target.value,
              }))
            }
            className="mt-1 h-9 w-full rounded-md bg-secondary px-3 text-sm outline-none"
          >
            <option value="">Select</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
            <option value="INTERSEX">Intersex</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Phone
          </span>

          <input
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
            placeholder="Phone"
            className="mt-1 h-9 w-full rounded-md bg-secondary px-3 text-sm outline-none"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Email
          </span>

          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            placeholder="Email"
            className="mt-1 h-9 w-full rounded-md bg-secondary px-3 text-sm outline-none"
          />
        </label>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onCancel}
          disabled={creating}
          className="text-[12px] px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 disabled:opacity-50"
        >
          Cancel
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
          Create patient
        </button>
      </div>
    </div>
  );
}

function timestampWithoutTimezone(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function generateInternalPatientCode() {
  const date = new Date();

  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const random = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");

  return `PAT-${year}${month}${day}-${random}`;
}