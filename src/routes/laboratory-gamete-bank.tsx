import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Home,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Syringe,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { runMockAction } from "@/lib/mock-actions";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/laboratory-gamete-bank")({
  component: MedicationNursingPage,
});

type NursingPreparation = {
  id: string;
  clinic_id: string | null;
  prescription_id: string | null;
  clinic_patient_id: string | null;
  patient_id: string | null;
  status: string | null;
  prepared_at: string | null;
  sent_to_nursing_at: string | null;
  received_at: string | null;
  notes: string | null;
  pharmacy_preparation_items?: NursingPreparationItem[];
};

type NursingPreparationItem = {
  id: string;
  pharmacy_preparation_id: string;
  prescription_item_id: string | null;
  medication_id: string | null;
  lot_id: string | null;
  quantity_prepared: number | null;
  quantity_received: number | null;
  administration_mode: "ONSITE" | "HOME" | string | null;
  status: string | null;
  pharmacy_notes: string | null;
  nursing_notes: string | null;
  products?: {
    id: string;
    name: string | null;
    generic_name: string | null;
    unit_of_measure: string | null;
    presentation: string | null;
  } | null;
  inventory_lots?: {
    id: string;
    manufacturer_lot: string | null;
    internal_lot_code: string | null;
    expiration_date: string | null;
  } | null;
  administrations?: NursingAdministration[];
};

type NursingAdministration = {
  id: string;
  pharmacy_preparation_item_id: string | null;
  prescription_item_id: string | null;
  clinic_id: string | null;
  clinic_patient_id: string | null;
  patient_id: string | null;
  medication_id: string | null;
  lot_id: string | null;
  administration_mode: "ONSITE" | "HOME" | string | null;
  status:
    | "PENDING"
    | "ADMINISTERED"
    | "HOME_INSTRUCTIONS_DELIVERED"
    | "CANCELLED"
    | string
    | null;
  scheduled_at: string | null;
  administered_at: string | null;
  administered_by: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type NursingInventoryLotOption = {
  id: string;
  clinic_id: string | null;
  product_id: string | null;
  location_id: string | null;
  internal_lot_code: string | null;
  manufacturer_lot: string | null;
  expiration_date: string | null;
  received_at: string | null;
  quantity_available: number | null;
  quantity_reserved: number | null;
  quantity_consumed: number | null;
  status: string | null;
  locations?: {
    id: string;
    name: string | null;
  } | null;
};

function MedicationNursingPage() {
  const [preparations, setPreparations] = useState<NursingPreparation[]>([]);
  const [selectedPreparation, setSelectedPreparation] =
    useState<NursingPreparation | null>(null);
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const [nursingNotesByItemId, setNursingNotesByItemId] = useState<
    Record<string, string>
  >({});

  const [availableLotsByMedicationId, setAvailableLotsByMedicationId] = useState<
    Record<string, NursingInventoryLotOption[]>
  >({});

  const [selectedLotByItemId, setSelectedLotByItemId] = useState<
    Record<string, string>
  >({});

  const [discountQtyByItemId, setDiscountQtyByItemId] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    loadPreparations();
  }, []);

  async function loadPreparations() {
    setLoading(true);

    const { data, error } = await supabase
      .from("pharmacy_preparations")
      .select(`
        id,
        clinic_id,
        prescription_id,
        clinic_patient_id,
        patient_id,
        status,
        prepared_at,
        sent_to_nursing_at,
        received_at,
        notes,
        pharmacy_preparation_items (
          id,
          pharmacy_preparation_id,
          prescription_item_id,
          medication_id,
          lot_id,
          quantity_prepared,
          quantity_received,
          administration_mode,
          status,
          pharmacy_notes,
          nursing_notes,
          products (
            id,
            name,
            generic_name,
            unit_of_measure,
            presentation
          ),
          inventory_lots (
            id,
            manufacturer_lot,
            internal_lot_code,
            expiration_date
          )
        )
      `)
      .in("status", ["SENT_TO_NURSING", "RECEIVED_BY_NURSING"])
      .order("sent_to_nursing_at", { ascending: false });

    if (error) {
      console.error("Error loading nursing preparations:", error);
      setPreparations([]);
      setSelectedPreparation(null);
      setLoading(false);
      return;
    }

    const normalizedPreparations = ((data ?? []) as any[]).map((preparation) => ({
      ...preparation,
      pharmacy_preparation_items: (
        preparation.pharmacy_preparation_items ?? []
      ).map((item: any) => ({
        ...item,
        products: normalizeRelation(item.products),
        inventory_lots: normalizeRelation(item.inventory_lots),
        administrations: [],
      })),
    }));

    const itemIds = normalizedPreparations.flatMap((preparation: any) =>
      (preparation.pharmacy_preparation_items ?? []).map((item: any) => item.id),
    );

    let administrationsByItemId = new Map<string, NursingAdministration[]>();

    if (itemIds.length > 0) {
      const { data: administrationRows, error: administrationError } =
        await supabase
          .from("nursing_medication_administrations")
          .select(`
            id,
            pharmacy_preparation_item_id,
            prescription_item_id,
            clinic_id,
            clinic_patient_id,
            patient_id,
            medication_id,
            lot_id,
            administration_mode,
            status,
            scheduled_at,
            administered_at,
            administered_by,
            notes,
            created_at,
            updated_at
          `)
          .in("pharmacy_preparation_item_id", itemIds)
          .order("created_at", { ascending: true });

      if (administrationError) {
        console.error(
          "Error loading nursing medication administrations:",
          administrationError,
        );
      }

      administrationsByItemId = (administrationRows ?? []).reduce(
        (
          map: Map<string, NursingAdministration[]>,
          administration: NursingAdministration,
        ) => {
          if (!administration.pharmacy_preparation_item_id) return map;

          const current = map.get(administration.pharmacy_preparation_item_id) ?? [];
          current.push(administration);
          map.set(administration.pharmacy_preparation_item_id, current);

          return map;
        },
        new Map<string, NursingAdministration[]>(),
      );
    }

    const withAdministrations: NursingPreparation[] = normalizedPreparations.map(
      (preparation: any) => ({
        ...preparation,
        pharmacy_preparation_items: (
          preparation.pharmacy_preparation_items ?? []
        ).map((item: any) => ({
          ...item,
          administrations: administrationsByItemId.get(item.id) ?? [],
        })),
      }),
    );

    setPreparations(withAdministrations);

    await loadAvailableLotsForItems(withAdministrations);

    setSelectedPreparation((current) => {
      if (!current) return null;

      return (
        withAdministrations.find((preparation) => preparation.id === current.id) ??
        null
      );
    });

    setLoading(false);
  }

  async function loadAvailableLotsForItems(preparationsToLoad: NursingPreparation[]) {
    const medicationIds = Array.from(
      new Set(
        preparationsToLoad
          .flatMap((preparation) => preparation.pharmacy_preparation_items ?? [])
          .map((item) => item.medication_id)
          .filter((id: string | null): id is string => Boolean(id)),
      ),
    );

    if (medicationIds.length === 0) {
      setAvailableLotsByMedicationId({});
      return;
    }

    const { data, error } = await supabase
      .from("inventory_lots")
      .select(`
        id,
        clinic_id,
        product_id,
        location_id,
        internal_lot_code,
        manufacturer_lot,
        expiration_date,
        received_at,
        quantity_available,
        quantity_reserved,
        quantity_consumed,
        status,
        locations (
          id,
          name
        )
      `)
      .in("product_id", medicationIds)
      .order("expiration_date", { ascending: true });

    if (error) {
      console.error("Error loading nursing inventory lots:", error);
      setAvailableLotsByMedicationId({});
      return;
    }

    const usableLots = ((data ?? []) as any[])
      .map((lot) => ({
        ...lot,
        locations: normalizeRelation(lot.locations),
      }))
      .filter((lot) => {
        const status = String(lot.status ?? "").toLowerCase();

        const blockedStatuses = [
          "expired",
          "blocked",
          "quarantined",
          "destroyed",
          "consumed",
        ];

        const totalUsable =
          Number(lot.quantity_available ?? 0) + Number(lot.quantity_reserved ?? 0);

        return !blockedStatuses.includes(status) && totalUsable > 0;
      }) as NursingInventoryLotOption[];

    const grouped = usableLots.reduce(
      (map: Record<string, NursingInventoryLotOption[]>, lot) => {
        if (!lot.product_id) return map;

        const current = map[lot.product_id] ?? [];
        current.push(lot);

        current.sort((a, b) => {
          const expA = a.expiration_date
            ? new Date(a.expiration_date).getTime()
            : Number.MAX_SAFE_INTEGER;

          const expB = b.expiration_date
            ? new Date(b.expiration_date).getTime()
            : Number.MAX_SAFE_INTEGER;

          return expA - expB;
        });

        map[lot.product_id] = current;
        return map;
      },
      {},
    );

    setAvailableLotsByMedicationId(grouped);

    setSelectedLotByItemId((current) => {
      const next = { ...current };

      for (const preparation of preparationsToLoad) {
        for (const item of preparation.pharmacy_preparation_items ?? []) {
          if (!item.medication_id) continue;
          if (next[item.id]) continue;

          const lots = grouped[item.medication_id] ?? [];
          const currentLotStillValid = lots.find((lot) => lot.id === item.lot_id);

          if (currentLotStillValid) {
            next[item.id] = currentLotStillValid.id;
          } else if (lots[0]) {
            next[item.id] = lots[0].id;
          }
        }
      }

      return next;
    });
  }

  async function confirmReceipt(preparation: NursingPreparation) {
    const items = preparation.pharmacy_preparation_items ?? [];

    if (items.length === 0) {
      runMockAction("Receiving medications", {
        error: "No medication items found",
      });
      return;
    }

    setWorkingId(preparation.id);

    const now = timestampWithoutTimezone(new Date());

    const { error: preparationError } = await supabase
      .from("pharmacy_preparations")
      .update({
        status: "RECEIVED_BY_NURSING",
        received_by: null,
        received_at: now,
        updated_at: now,
      })
      .eq("id", preparation.id);

    if (preparationError) {
      console.error("Error confirming preparation receipt:", preparationError);

      runMockAction("Receiving medications", {
        error: preparationError.message,
      });

      setWorkingId(null);
      return;
    }

    for (const item of items) {
      const { error: itemError } = await supabase
        .from("pharmacy_preparation_items")
        .update({
          quantity_received: item.quantity_prepared ?? 0,
          status: "RECEIVED",
          updated_at: now,
        })
        .eq("id", item.id);

      if (itemError) {
        console.error("Error confirming preparation item receipt:", itemError);

        runMockAction("Receiving medications", {
          error: itemError.message,
        });

        setWorkingId(null);
        return;
      }
    }

    runMockAction("Receiving medications", {
      success: "Medication preparation received by nursing",
    });

    setWorkingId(null);
    await loadPreparations();
  }

  async function discountMedicationFromSelectedLot({
    preparation,
    item,
    fallbackQuantity,
    reason,
  }: {
    preparation: NursingPreparation;
    item: NursingPreparationItem;
    fallbackQuantity: number;
    reason: string;
  }) {
    const selectedLotId = selectedLotByItemId[item.id];

    if (!selectedLotId) {
      runMockAction("Selecting medication lot", {
        error: "Debes seleccionar el lote a descontar.",
      });

      return null;
    }

    const requestedQuantity = Number(
      discountQtyByItemId[item.id] || fallbackQuantity || 0,
    );

    if (!requestedQuantity || requestedQuantity <= 0) {
      runMockAction("Selecting medication quantity", {
        error: "La cantidad a descontar debe ser mayor que cero.",
      });

      return null;
    }

    const { data: lot, error: lotError } = await supabase
      .from("inventory_lots")
      .select(`
        id,
        clinic_id,
        product_id,
        location_id,
        quantity_available,
        quantity_reserved,
        quantity_consumed,
        status
      `)
      .eq("id", selectedLotId)
      .single();

    if (lotError || !lot) {
      console.error("Error loading selected lot:", lotError);

      runMockAction("Loading selected lot", {
        error: lotError?.message ?? "No se pudo cargar el lote seleccionado.",
      });

      return null;
    }

    const currentAvailable = Number(lot.quantity_available ?? 0);
    const currentReserved = Number(lot.quantity_reserved ?? 0);
    const currentConsumed = Number(lot.quantity_consumed ?? 0);

    const totalUsable = currentAvailable + currentReserved;

    if (requestedQuantity > totalUsable) {
      runMockAction("Discounting medication lot", {
        error: "La cantidad supera el inventario disponible/reservado del lote.",
      });

      return null;
    }

    const reservedToDiscount = Math.min(currentReserved, requestedQuantity);
    const availableToDiscount = requestedQuantity - reservedToDiscount;

    const newReserved = Math.max(currentReserved - reservedToDiscount, 0);
    const newAvailable = Math.max(currentAvailable - availableToDiscount, 0);
    const newConsumed = currentConsumed + requestedQuantity;

    const newStatus =
      newAvailable > 0 ? "available" : newReserved > 0 ? "reserved" : "consumed";

    const now = timestampWithoutTimezone(new Date());

    const { error: updateLotError } = await supabase
      .from("inventory_lots")
      .update({
        quantity_available: newAvailable,
        quantity_reserved: newReserved,
        quantity_consumed: newConsumed,
        status: newStatus,
      })
      .eq("id", selectedLotId);

    if (updateLotError) {
      console.error("Error discounting selected lot:", updateLotError);

      runMockAction("Discounting medication lot", {
        error: updateLotError.message,
      });

      return null;
    }

    const { error: movementError } = await supabase
      .from("inventory_movements")
      .insert({
        id: crypto.randomUUID(),
        clinic_id: preparation.clinic_id,
        lot_id: selectedLotId,
        inventory_reservation_id: null,
        movement_type: "consumed",
        source_location_id: lot.location_id ?? null,
        destination_location_id: null,
        quantity: requestedQuantity,
        related_case_id: null,
        related_patient_id: preparation.patient_id,
        related_procedure_id: null,
        related_prescription_item_id: item.prescription_item_id,
        performed_by: null,
        reason,
        created_at: now,
      });

    if (movementError) {
      console.error("Inventory movement was not created:", movementError);
    }

    const { error: itemLotError } = await supabase
      .from("pharmacy_preparation_items")
      .update({
        lot_id: selectedLotId,
        updated_at: now,
      })
      .eq("id", item.id);

    if (itemLotError) {
      console.error("Error updating selected lot in preparation item:", itemLotError);
    }

    return {
      lotId: selectedLotId,
      quantity: requestedQuantity,
    };
  }

  async function planHomeOnly(
    preparation: NursingPreparation,
    item: NursingPreparationItem,
  ) {
    const now = timestampWithoutTimezone(new Date());
    const notes = nursingNotesByItemId[item.id]?.trim() || null;

    setWorkingId(item.id);

    const discount = await discountMedicationFromSelectedLot({
      preparation,
      item,
      fallbackQuantity: Number(item.quantity_received ?? item.quantity_prepared ?? 0),
      reason: "Medicamento entregado al paciente para manejo completo en casa.",
    });

    if (!discount) {
      setWorkingId(null);
      return;
    }

    const existingHome = (item.administrations ?? []).find(
      (administration) =>
        administration.administration_mode === "HOME" &&
        administration.status !== "CANCELLED",
    );

    if (!existingHome) {
      const { error: adminError } = await supabase
        .from("nursing_medication_administrations")
        .insert({
          id: crypto.randomUUID(),
          pharmacy_preparation_item_id: item.id,
          prescription_item_id: item.prescription_item_id,
          clinic_id: preparation.clinic_id,
          clinic_patient_id: preparation.clinic_patient_id,
          patient_id: preparation.patient_id,
          medication_id: item.medication_id,
          lot_id: discount.lotId,
          administration_mode: "HOME",
          status: "HOME_INSTRUCTIONS_DELIVERED",
          scheduled_at: null,
          administered_at: null,
          administered_by: null,
          notes:
            notes ??
            `Manejo completo en casa. Cantidad descontada: ${discount.quantity}.`,
          created_at: now,
          updated_at: now,
        });

      if (adminError) {
        console.error("Error creating home administration:", adminError);

        runMockAction("Home medication delivery", {
          error: adminError.message,
        });

        setWorkingId(null);
        return;
      }
    }

    const { error: itemError } = await supabase
      .from("pharmacy_preparation_items")
      .update({
        administration_mode: "HOME",
        status: "HOME_DELIVERED",
        lot_id: discount.lotId,
        nursing_notes:
          notes ??
          `Todo el manejo queda indicado para casa. Cantidad descontada: ${discount.quantity}.`,
        updated_at: now,
      })
      .eq("id", item.id);

    if (itemError) {
      console.error("Error updating item as home only:", itemError);

      runMockAction("Home medication delivery", {
        error: itemError.message,
      });

      setWorkingId(null);
      return;
    }

    runMockAction("Home medication delivery", {
      success: "Medication marked as home-only treatment",
    });

    setWorkingId(null);
    await loadPreparations();
  }

  async function planFirstDoseOnsite(
    preparation: NursingPreparation,
    item: NursingPreparationItem,
  ) {
    const now = timestampWithoutTimezone(new Date());
    const notes = nursingNotesByItemId[item.id]?.trim() || null;
    const selectedLotId = selectedLotByItemId[item.id];

    if (!selectedLotId) {
      runMockAction("Selecting medication lot", {
        error: "Debes seleccionar el lote para la primera dosis.",
      });

      return;
    }

    setWorkingId(item.id);

    const existingOnsite = (item.administrations ?? []).find(
      (administration) =>
        administration.administration_mode === "ONSITE" &&
        administration.status !== "CANCELLED",
    );

    if (!existingOnsite) {
      const { error: adminError } = await supabase
        .from("nursing_medication_administrations")
        .insert({
          id: crypto.randomUUID(),
          pharmacy_preparation_item_id: item.id,
          prescription_item_id: item.prescription_item_id,
          clinic_id: preparation.clinic_id,
          clinic_patient_id: preparation.clinic_patient_id,
          patient_id: preparation.patient_id,
          medication_id: item.medication_id,
          lot_id: selectedLotId,
          administration_mode: "ONSITE",
          status: "PENDING",
          scheduled_at: null,
          administered_at: null,
          administered_by: null,
          notes:
            notes ??
            "Primera dosis pendiente de administración presencial en Nursing.",
          created_at: now,
          updated_at: now,
        });

      if (adminError) {
        console.error("Error creating onsite administration:", adminError);

        runMockAction("Planning onsite dose", {
          error: adminError.message,
        });

        setWorkingId(null);
        return;
      }
    }

    const { error: itemError } = await supabase
      .from("pharmacy_preparation_items")
      .update({
        administration_mode: "ONSITE",
        status: "RECEIVED",
        lot_id: selectedLotId,
        nursing_notes:
          notes ??
          "Plan definido: primera dosis presencial y restante con instrucciones para casa.",
        updated_at: now,
      })
      .eq("id", item.id);

    if (itemError) {
      console.error("Error updating item as first dose onsite:", itemError);

      runMockAction("Planning onsite dose", {
        error: itemError.message,
      });

      setWorkingId(null);
      return;
    }

    runMockAction("Planning onsite dose", {
      success: "First dose planned for onsite administration",
    });

    setWorkingId(null);
    await loadPreparations();
  }

  async function markFirstDoseAdministered(
    preparation: NursingPreparation,
    item: NursingPreparationItem,
  ) {
    const onsiteAdministration = (item.administrations ?? []).find(
      (administration) =>
        administration.administration_mode === "ONSITE" &&
        administration.status === "PENDING",
    );

    if (!onsiteAdministration) {
      runMockAction("Administering medication", {
        error: "No pending onsite administration found",
      });
      return;
    }

    const now = timestampWithoutTimezone(new Date());

    setWorkingId(item.id);

    const discount = await discountMedicationFromSelectedLot({
      preparation,
      item,
      fallbackQuantity: 1,
      reason: "Primera dosis administrada presencialmente por Nursing.",
    });

    if (!discount) {
      setWorkingId(null);
      return;
    }

    const { error: adminError } = await supabase
      .from("nursing_medication_administrations")
      .update({
        status: "ADMINISTERED",
        lot_id: discount.lotId,
        administered_at: now,
        administered_by: null,
        updated_at: now,
      })
      .eq("id", onsiteAdministration.id);

    if (adminError) {
      console.error("Error administering onsite dose:", adminError);

      runMockAction("Administering medication", {
        error: adminError.message,
      });

      setWorkingId(null);
      return;
    }

    const { error: itemError } = await supabase
      .from("pharmacy_preparation_items")
      .update({
        status: "ADMINISTERED",
        lot_id: discount.lotId,
        updated_at: now,
      })
      .eq("id", item.id);

    if (itemError) {
      console.error("Error updating item as administered:", itemError);

      runMockAction("Administering medication", {
        error: itemError.message,
      });

      setWorkingId(null);
      return;
    }

    runMockAction("Administering medication", {
      success: "First onsite dose marked as administered",
    });

    setWorkingId(null);
    await loadPreparations();
  }

  async function confirmRemainingHomeInstructions(
    preparation: NursingPreparation,
    item: NursingPreparationItem,
  ) {
    const now = timestampWithoutTimezone(new Date());
    const notes = nursingNotesByItemId[item.id]?.trim() || null;

    setWorkingId(item.id);

    const discount = await discountMedicationFromSelectedLot({
      preparation,
      item,
      fallbackQuantity: Number(item.quantity_received ?? item.quantity_prepared ?? 0),
      reason:
        "Medicamento entregado al paciente para continuar tratamiento en casa después de primera dosis presencial.",
    });

    if (!discount) {
      setWorkingId(null);
      return;
    }

    const existingHome = (item.administrations ?? []).find(
      (administration) =>
        administration.administration_mode === "HOME" &&
        administration.status !== "CANCELLED",
    );

    if (!existingHome) {
      const { error: adminError } = await supabase
        .from("nursing_medication_administrations")
        .insert({
          id: crypto.randomUUID(),
          pharmacy_preparation_item_id: item.id,
          prescription_item_id: item.prescription_item_id,
          clinic_id: preparation.clinic_id,
          clinic_patient_id: preparation.clinic_patient_id,
          patient_id: preparation.patient_id,
          medication_id: item.medication_id,
          lot_id: discount.lotId,
          administration_mode: "HOME",
          status: "HOME_INSTRUCTIONS_DELIVERED",
          scheduled_at: null,
          administered_at: null,
          administered_by: null,
          notes:
            notes ??
            `Después de la primera dosis presencial, se entrega continuidad en casa. Cantidad descontada: ${discount.quantity}.`,
          created_at: now,
          updated_at: now,
        });

      if (adminError) {
        console.error("Error confirming remaining home instructions:", adminError);

        runMockAction("Home medication delivery", {
          error: adminError.message,
        });

        setWorkingId(null);
        return;
      }
    }

    const { error: itemError } = await supabase
      .from("pharmacy_preparation_items")
      .update({
        status: "HOME_DELIVERED",
        lot_id: discount.lotId,
        nursing_notes:
          notes ??
          `Primera dosis administrada presencialmente. Resto del tratamiento indicado para casa. Cantidad descontada: ${discount.quantity}.`,
        updated_at: now,
      })
      .eq("id", item.id);

    if (itemError) {
      console.error("Error updating item as home delivered:", itemError);

      runMockAction("Home medication delivery", {
        error: itemError.message,
      });

      setWorkingId(null);
      return;
    }

    runMockAction("Home medication delivery", {
      success: "Remaining home instructions confirmed",
    });

    setWorkingId(null);
    await loadPreparations();
  }

  const selectedItems = selectedPreparation?.pharmacy_preparation_items ?? [];

  const selectedSummary = useMemo(() => {
    const total = selectedItems.length;
    const received = selectedItems.filter((item) =>
      ["RECEIVED", "ADMINISTERED", "HOME_DELIVERED"].includes(
        String(item.status ?? "").toUpperCase(),
      ),
    ).length;
    const closed = selectedItems.filter(
      (item) => String(item.status ?? "").toUpperCase() === "HOME_DELIVERED",
    ).length;

    return { total, received, closed };
  }, [selectedItems]);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Nursing
          </p>

          <h1 className="text-xl font-semibold tracking-tight">
            Medication handoff
          </h1>

          <p className="text-[12px] text-muted-foreground mt-1">
            Recibe medicamentos preparados por Pharmacy, selecciona el lote real
            de salida y define si el manejo es presencial o en casa.
          </p>
        </div>

        <button
          onClick={loadPreparations}
          disabled={loading}
          className="h-9 px-3 rounded-md border border-border bg-card hover:bg-secondary text-[12px] font-medium inline-flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Refresh
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border">
            <h2 className="text-[14px] font-semibold">
              Preparaciones desde Pharmacy
            </h2>
          </div>

          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-4 text-[12px] text-muted-foreground">
                Cargando preparaciones...
              </div>
            ) : preparations.length === 0 ? (
              <div className="p-4 text-[12px] text-muted-foreground">
                No hay preparaciones pendientes.
              </div>
            ) : (
              preparations.map((preparation) => {
                const itemCount =
                  preparation.pharmacy_preparation_items?.length ?? 0;

                return (
                  <button
                    key={preparation.id}
                    onClick={() => setSelectedPreparation(preparation)}
                    className={cn(
                      "w-full text-left p-4 hover:bg-accent/30 transition-colors",
                      selectedPreparation?.id === preparation.id && "bg-accent/50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[12px] font-semibold">
                          Preparation {preparation.id.slice(0, 8)}
                        </p>

                        <p className="text-[10.5px] text-muted-foreground mt-1">
                          {itemCount} medicamento{itemCount === 1 ? "" : "s"}
                        </p>
                      </div>

                      <StatusPill status={preparation.status ?? "PENDING"} />
                    </div>

                    <p className="text-[10.5px] text-muted-foreground mt-2">
                      Enviado:{" "}
                      {preparation.sent_to_nursing_at
                        ? formatDate(preparation.sent_to_nursing_at)
                        : "-"}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          {!selectedPreparation ? (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center text-muted-foreground">
              <ClipboardList className="size-10 mb-3" />

              <p className="text-[13px] font-medium">
                Selecciona una preparación
              </p>

              <p className="text-[11px] mt-1 max-w-sm">
                Escoge una preparación enviada por Pharmacy para confirmar
                recibo, seleccionar lote y definir el plan de administración.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Preparación seleccionada
                  </p>

                  <h2 className="text-[16px] font-semibold mt-1">
                    {selectedPreparation.id}
                  </h2>

                  <p className="text-[11px] text-muted-foreground mt-1">
                    Prescription: {selectedPreparation.prescription_id ?? "-"}
                  </p>

                  <p className="text-[11px] text-muted-foreground mt-1">
                    Medicamentos: {selectedSummary.total} · Recibidos:{" "}
                    {selectedSummary.received} · Cerrados: {selectedSummary.closed}
                  </p>
                </div>

                {selectedPreparation.status === "SENT_TO_NURSING" && (
                  <button
                    onClick={() => confirmReceipt(selectedPreparation)}
                    disabled={workingId === selectedPreparation.id}
                    className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {workingId === selectedPreparation.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )}
                    Confirmar recibo
                  </button>
                )}
              </div>

              {selectedPreparation.notes && (
                <div className="rounded-lg border border-border bg-secondary/30 p-3 text-[12px]">
                  <span className="font-medium">Notas de Pharmacy: </span>
                  {selectedPreparation.notes}
                </div>
              )}

              <div className="space-y-3">
                {selectedItems.map((item) => (
                  <MedicationItemCard
                    key={item.id}
                    preparation={selectedPreparation}
                    item={item}
                    workingId={workingId}
                    nursingNotesByItemId={nursingNotesByItemId}
                    setNursingNotesByItemId={setNursingNotesByItemId}
                    availableLotsByMedicationId={availableLotsByMedicationId}
                    selectedLotByItemId={selectedLotByItemId}
                    setSelectedLotByItemId={setSelectedLotByItemId}
                    discountQtyByItemId={discountQtyByItemId}
                    setDiscountQtyByItemId={setDiscountQtyByItemId}
                    onPlanHomeOnly={planHomeOnly}
                    onPlanFirstDoseOnsite={planFirstDoseOnsite}
                    onMarkFirstDoseAdministered={markFirstDoseAdministered}
                    onConfirmRemainingHomeInstructions={
                      confirmRemainingHomeInstructions
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MedicationItemCard({
  preparation,
  item,
  workingId,
  nursingNotesByItemId,
  setNursingNotesByItemId,
  availableLotsByMedicationId,
  selectedLotByItemId,
  setSelectedLotByItemId,
  discountQtyByItemId,
  setDiscountQtyByItemId,
  onPlanHomeOnly,
  onPlanFirstDoseOnsite,
  onMarkFirstDoseAdministered,
  onConfirmRemainingHomeInstructions,
}: {
  preparation: NursingPreparation;
  item: NursingPreparationItem;
  workingId: string | null;
  nursingNotesByItemId: Record<string, string>;
  setNursingNotesByItemId: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  availableLotsByMedicationId: Record<string, NursingInventoryLotOption[]>;
  selectedLotByItemId: Record<string, string>;
  setSelectedLotByItemId: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  discountQtyByItemId: Record<string, string>;
  setDiscountQtyByItemId: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  onPlanHomeOnly: (
    preparation: NursingPreparation,
    item: NursingPreparationItem,
  ) => Promise<void>;
  onPlanFirstDoseOnsite: (
    preparation: NursingPreparation,
    item: NursingPreparationItem,
  ) => Promise<void>;
  onMarkFirstDoseAdministered: (
    preparation: NursingPreparation,
    item: NursingPreparationItem,
  ) => Promise<void>;
  onConfirmRemainingHomeInstructions: (
    preparation: NursingPreparation,
    item: NursingPreparationItem,
  ) => Promise<void>;
}) {
  const product = normalizeRelation(item.products);
  const lot = normalizeRelation(item.inventory_lots);

  const status = String(item.status ?? "").toUpperCase();

  const isPreparationReceived =
    preparation.status === "RECEIVED_BY_NURSING" ||
    ["RECEIVED", "ADMINISTERED", "HOME_DELIVERED"].includes(status);

  const onsiteAdministration = (item.administrations ?? []).find(
    (administration) =>
      administration.administration_mode === "ONSITE" &&
      administration.status !== "CANCELLED",
  );

  const pendingOnsiteAdministration = (item.administrations ?? []).find(
    (administration) =>
      administration.administration_mode === "ONSITE" &&
      administration.status === "PENDING",
  );

  const administeredOnsiteAdministration = (item.administrations ?? []).find(
    (administration) =>
      administration.administration_mode === "ONSITE" &&
      administration.status === "ADMINISTERED",
  );

  const homeAdministration = (item.administrations ?? []).find(
    (administration) =>
      administration.administration_mode === "HOME" &&
      administration.status === "HOME_INSTRUCTIONS_DELIVERED",
  );

  const isClosedHome = Boolean(homeAdministration);
  const isWorking = workingId === item.id;

  const availableLots = item.medication_id
    ? availableLotsByMedicationId[item.medication_id] ?? []
    : [];

  const selectedLotId = selectedLotByItemId[item.id] ?? "";

  const fefoLot = availableLots[0] ?? null;

  const fifoLot =
    [...availableLots].sort((a, b) => {
      const receivedA = a.received_at
        ? new Date(a.received_at).getTime()
        : Number.MAX_SAFE_INTEGER;

      const receivedB = b.received_at
        ? new Date(b.received_at).getTime()
        : Number.MAX_SAFE_INTEGER;

      return receivedA - receivedB;
    })[0] ?? null;

  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {item.administration_mode === "ONSITE" ? (
              <Syringe className="size-4 text-primary" />
            ) : item.administration_mode === "HOME" ? (
              <Home className="size-4 text-muted-foreground" />
            ) : (
              <ShieldCheck className="size-4 text-muted-foreground" />
            )}

            <p className="text-[13px] font-semibold">
              {product?.name ?? "Medicamento"}
            </p>
          </div>

          <p className="text-[11px] text-muted-foreground mt-1">
            Lote original Pharmacy:{" "}
            {lot?.manufacturer_lot ?? lot?.internal_lot_code ?? "-"}
            {" · "}
            Cantidad recibida: {Number(item.quantity_received ?? 0)}
            {" / "}
            Preparada: {Number(item.quantity_prepared ?? 0)}
          </p>

          {item.pharmacy_notes && (
            <p className="text-[11px] text-muted-foreground mt-2">
              <span className="font-medium">Notas Pharmacy: </span>
              {item.pharmacy_notes}
            </p>
          )}

          {item.nursing_notes && (
            <p className="text-[11px] text-muted-foreground mt-1">
              <span className="font-medium">Notas Nursing: </span>
              {item.nursing_notes}
            </p>
          )}
        </div>

        <StatusPill status={item.status ?? "PREPARED"} />
      </div>

      {isPreparationReceived && !isClosedHome && (
        <div className="mt-4 rounded-lg border border-border bg-card p-3 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-foreground">
                Lote para descontar
              </p>

              <p className="text-[10.5px] text-muted-foreground mt-0.5">
                El sistema recomienda FEFO/FIFO, pero Nursing puede escoger otro lote.
              </p>
            </div>

            {fefoLot && (
              <div className="text-right text-[10.5px] text-muted-foreground">
                <p>
                  FEFO:{" "}
                  <span className="font-mono">
                    {fefoLot.manufacturer_lot ??
                      fefoLot.internal_lot_code ??
                      fefoLot.id.slice(0, 8)}
                  </span>
                </p>

                {fifoLot && (
                  <p>
                    FIFO:{" "}
                    <span className="font-mono">
                      {fifoLot.manufacturer_lot ??
                        fifoLot.internal_lot_code ??
                        fifoLot.id.slice(0, 8)}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="md:col-span-2 block">
              <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                Seleccionar lote
              </span>

              <select
                value={selectedLotId}
                onChange={(event) =>
                  setSelectedLotByItemId((current) => ({
                    ...current,
                    [item.id]: event.target.value,
                  }))
                }
                className="mt-1 w-full h-9 rounded-md border border-border bg-card px-3 text-[11px] outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Seleccionar lote...</option>

                {availableLots.map((lotOption, index) => {
                  const code =
                    lotOption.manufacturer_lot ??
                    lotOption.internal_lot_code ??
                    lotOption.id.slice(0, 8);

                  const available = Number(lotOption.quantity_available ?? 0);
                  const reserved = Number(lotOption.quantity_reserved ?? 0);

                  const tags = [
                    index === 0 ? "FEFO" : null,
                    fifoLot?.id === lotOption.id ? "FIFO" : null,
                  ]
                    .filter(Boolean)
                    .join(" / ");

                  return (
                    <option key={lotOption.id} value={lotOption.id}>
                      {code}
                      {tags ? ` · ${tags}` : ""}
                      {lotOption.expiration_date
                        ? ` · vence ${lotOption.expiration_date}`
                        : ""}
                      {` · disp ${available} · res ${reserved}`}
                      {lotOption.locations?.name
                        ? ` · ${lotOption.locations.name}`
                        : ""}
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="block">
              <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                Cantidad a descontar
              </span>

              <input
                type="number"
                min={0}
                value={discountQtyByItemId[item.id] ?? ""}
                onChange={(event) =>
                  setDiscountQtyByItemId((current) => ({
                    ...current,
                    [item.id]: event.target.value,
                  }))
                }
                placeholder={`${Number(
                  item.quantity_received ?? item.quantity_prepared ?? 0,
                )}`}
                className="mt-1 w-full h-9 rounded-md border border-border bg-card px-3 text-[11px] outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>

          {availableLots.length === 0 && (
            <div className="rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-[11px] text-warning">
              No hay lotes disponibles para este medicamento.
            </div>
          )}
        </div>
      )}

      {isPreparationReceived && !isClosedHome && (
        <div className="mt-4">
          <textarea
            value={nursingNotesByItemId[item.id] ?? ""}
            onChange={(event) =>
              setNursingNotesByItemId((current) => ({
                ...current,
                [item.id]: event.target.value,
              }))
            }
            placeholder="Notas de Nursing..."
            className="w-full min-h-[64px] rounded-md border border-border bg-card px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      {isPreparationReceived && !onsiteAdministration && !isClosedHome && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            onClick={() => onPlanFirstDoseOnsite(preparation, item)}
            disabled={isWorking || availableLots.length === 0}
            className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isWorking ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Syringe className="size-3.5" />
            )}
            Primera dosis presencial + resto en casa
          </button>

          <button
            onClick={() => onPlanHomeOnly(preparation, item)}
            disabled={isWorking || availableLots.length === 0}
            className="h-9 px-3 rounded-md bg-secondary text-[11px] font-semibold border border-border inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isWorking ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Home className="size-3.5" />
            )}
            Todo en casa
          </button>
        </div>
      )}

      {pendingOnsiteAdministration && (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold text-foreground">
              Primera dosis pendiente
            </p>
            <p className="text-[10.5px] text-muted-foreground mt-0.5">
              Administra la primera dosis presencial y luego confirma el manejo en
              casa para el resto del tratamiento.
            </p>
          </div>

          <button
            onClick={() => onMarkFirstDoseAdministered(preparation, item)}
            disabled={isWorking || availableLots.length === 0}
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-semibold inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isWorking ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            Marcar administrada
          </button>
        </div>
      )}

      {administeredOnsiteAdministration && !isClosedHome && (
        <div className="mt-4 rounded-lg border border-success/20 bg-success/5 p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold text-foreground">
              Primera dosis administrada
            </p>
            <p className="text-[10.5px] text-muted-foreground mt-0.5">
              Falta confirmar instrucciones para continuar el resto del tratamiento
              en casa.
            </p>
          </div>

          <button
            onClick={() => onConfirmRemainingHomeInstructions(preparation, item)}
            disabled={isWorking || availableLots.length === 0}
            className="h-8 px-3 rounded-md bg-secondary text-[11px] font-semibold border border-border inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isWorking ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Home className="size-3.5" />
            )}
            Confirmar resto en casa
          </button>
        </div>
      )}

      {isClosedHome && (
        <div className="mt-4 rounded-lg border border-success/20 bg-success/5 p-3">
          <p className="text-[12px] font-semibold text-foreground">
            Manejo en casa confirmado
          </p>

          <p className="text-[10.5px] text-muted-foreground mt-0.5">
            {administeredOnsiteAdministration
              ? "La primera dosis fue administrada presencialmente y el resto quedó indicado para casa."
              : "Todo el tratamiento quedó indicado para casa."}
          </p>
        </div>
      )}

      {(item.administrations ?? []).length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-[10.5px] font-medium text-muted-foreground mb-2">
            Registro Nursing
          </p>

          <div className="space-y-1">
            {(item.administrations ?? []).map((administration) => (
              <div
                key={administration.id}
                className="flex items-center justify-between gap-3 text-[10.5px] bg-card border border-border rounded-md px-2 py-1"
              >
                <span>
                  {administration.administration_mode ?? "-"} ·{" "}
                  {administration.status ?? "-"}
                </span>

                <span className="text-muted-foreground">
                  {administration.administered_at
                    ? formatDate(administration.administered_at)
                    : administration.created_at
                      ? formatDate(administration.created_at)
                      : "-"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
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

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  const tone =
    normalized === "RECEIVED_BY_NURSING" ||
    normalized === "RECEIVED" ||
    normalized === "ADMINISTERED" ||
    normalized === "HOME_DELIVERED" ||
    normalized === "HOME_INSTRUCTIONS_DELIVERED"
      ? "success"
      : normalized === "SENT_TO_NURSING" ||
          normalized === "PREPARED" ||
          normalized === "PENDING"
        ? "primary"
        : normalized === "CANCELLED" || normalized === "REJECTED"
          ? "critical"
          : "muted";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        tone === "success" && "bg-success/10 text-success",
        tone === "primary" && "bg-primary/10 text-primary",
        tone === "critical" && "bg-critical/10 text-critical",
        tone === "muted" && "bg-secondary text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}