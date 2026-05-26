import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  AlertCircle,
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
  biological_sex: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  created_at: string | null;
}

const stageColors: Record<string, string> = {
  Consultation: "bg-secondary text-muted-foreground",
  Stimulation: "bg-accent text-primary",
  "Trigger Phase": "bg-warning/10 text-warning",
  Retrieval: "bg-success/10 text-success",
  "Embryo Development": "bg-accent text-primary",
  "Follow-up": "bg-secondary text-muted-foreground",
};

function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

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

    setPatients(data);
    setLoading(false);
  }

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const fullName =
        `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();

      return (
        fullName.includes(q.toLowerCase()) ||
        (p.document_number ?? "")
          .toLowerCase()
          .includes(q.toLowerCase()) ||
        (p.email ?? "").toLowerCase().includes(q.toLowerCase())
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
      (monthDiff === 0 &&
        today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Patients
          </h1>

          <p className="text-[13px] text-muted-foreground mt-1">
            {filteredPatients.length} registered patients
          </p>
        </div>

        <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-[13px] font-medium rounded-md h-9 px-3.5 hover:bg-primary/90 transition-colors">
          <Plus className="size-4" />
          New Patient
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center h-9 flex-1 max-w-md bg-card border border-border rounded-md px-3 focus-within:border-primary transition-colors">
          <Search className="size-3.5 text-muted-foreground mr-2" />

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
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
                  const fullName =
                    `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim();

                  const initials = fullName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("");

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
                            {initials}
                          </div>

                          <div>
                            <p className="font-medium text-foreground">
                              {fullName}
                            </p>

                            <p className="text-[10px] text-muted-foreground">
                              {calculateAge(patient.birth_date)} yrs
                            </p>
                          </div>
                        </Link>
                      </td>

                      <td className="py-2.5 px-4">
                        <span className="text-muted-foreground">
                          {patient.document_type} ·{" "}
                          {patient.document_number}
                        </span>
                      </td>

                      <td className="py-2.5 px-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                            "bg-accent text-primary"
                          )}
                        >
                          {patient.gender ??
                            patient.biological_sex ??
                            "-"}
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