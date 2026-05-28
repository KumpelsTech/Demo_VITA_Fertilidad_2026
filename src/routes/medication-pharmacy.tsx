import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Send,
  PackageCheck,
  Truck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { notify } from "@/lib/mock-actions";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/medication-pharmacy")({
  component: MedicationPharmacyPage,
});

type PharmacyPendingItem = {
  id: string;
  mode: "prescription_linked" | "lot_only";
  canSendToNursing: boolean;

  prescriptionItemId: string | null;
  prescriptionId: string | null;
  clinicPatientId: string | null;
  clinicPersonId: string | null;
  patientId: string | null;

  lotId: string | null;
  clinicId: string | null;
  sourceLocationId: string | null;
  medicationId: string | null;

  patientName: string;
  patientDocument: string | null;

  productName: string;
  productUnit: string;
  lotCode: string;
  locationName: string;

  quantity: number;
  dose: string | null;
  route: string | null;
  frequency: string | null;
  instructions: string | null;

  lotAvailable: number;
  lotReserved: number;
  lotConsumed: number;

  diagnostic?: any;
};

type PharmacyKitOrder = {
  id: string;
  clinic_id: string | null;
  kit_id: string | null;
  procedure_id: string | null;
  procedure_type: string | null;
  status: string | null;
  requested_at: string | null;
  sent_to_pharmacy_at: string | null;
  prepared_at: string | null;
  delivered_at: string | null;
  notes: string | null;

  procedure_kits?: {
    id: string;
    name: string | null;
    procedure_type: string | null;
  } | null;

  procedure_kit_order_items?: PharmacyKitOrderItem[];
};

type PharmacyKitOrderItem = {
  id: string;
  kit_order_id: string;
  product_id: string | null;

  quantity_required: number | null;
  quantity_reserved: number | null;
  quantity_prepared: number | null;
  quantity_delivered: number | null;

  unit_of_measure: string | null;
  status: string | null;
  pharmacy_notes: string | null;

  products?: {
    id: string;
    name: string | null;
    unit_of_measure: string | null;
    presentation: string | null;
  } | null;

  procedure_kit_order_item_lots?: PharmacyKitOrderItemLot[];
};

type PharmacyKitOrderItemLot = {
  id: string;
  kit_order_item_id: string;
  product_id: string | null;
  lot_id: string | null;

  quantity_reserved: number | null;
  quantity_prepared: number | null;
  quantity_delivered: number | null;

  status: string | null;

  inventory_lots?: {
    id: string;
    internal_lot_code: string | null;
    manufacturer_lot: string | null;
    expiration_date: string | null;
    quantity_available: number | null;
    quantity_reserved: number | null;
    quantity_consumed: number | null;
  } | null;
};

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-card border border-border rounded-xl", className)}>
      {children}
    </div>
  );
}

function MedicationPharmacyPage() {
  const [pendingItems, setPendingItems] = useState<PharmacyPendingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [notesByItemId, setNotesByItemId] = useState<Record<string, string>>({});

  const [kitOrders, setKitOrders] = useState<PharmacyKitOrder[]>([]);
  const [loadingKits, setLoadingKits] = useState(false);
  const [kitActionId, setKitActionId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingForNursing();
    loadKitOrdersForPharmacy();
  }, []);

  async function loadPendingForNursing() {
    setLoading(true);

    const { data: lotRows, error: lotError } = await supabase
      .from("inventory_lots")
      .select(`
        id,
        clinic_id,
        product_id,
        location_id,
        internal_lot_code,
        manufacturer_lot,
        expiration_date,
        status,
        quantity_initial,
        quantity_available,
        quantity_reserved,
        quantity_consumed,
        products (
          id,
          name,
          unit_of_measure,
          storage_condition
        ),
        locations (
          id,
          name
        )
      `)
      .gt("quantity_reserved", 0)
      .order("expiration_date", { ascending: true });

    if (lotError) {
      console.error("Error loading reserved lots:", lotError);
      notify(
        "Error",
        lotError.message || "No se pudieron cargar los lotes reservados.",
      );
      setLoading(false);
      return;
    }

    const reservedLots = lotRows ?? [];

    const productIds = Array.from(
      new Set(
        reservedLots
          .map((lot: any) => lot.product_id)
          .filter((id: string | null): id is string => Boolean(id)),
      ),
    );

    let prescriptionItemsByProductId = new Map<string, any[]>();

    if (productIds.length > 0) {
      const { data: prescriptionItemRows, error: prescriptionItemError } =
        await supabase
          .from("prescription_items")
          .select(`
            id,
            prescription_id,
            medication_id,
            dose,
            route,
            frequency,
            duration_days,
            start_datetime,
            end_datetime,
            administration_time,
            instructions,
            quantity_required,
            quantity_unit,
            status,
            inventory_status
          `)
          .in("medication_id", productIds);

      if (prescriptionItemError) {
        console.error("Error loading prescription items:", prescriptionItemError);
        notify(
          "Error",
          prescriptionItemError.message ||
            "No se pudieron cargar los ítems de prescripción.",
        );
      }

      const validPrescriptionItems = (prescriptionItemRows ?? []).filter(
        (item: any) => {
          const status = String(item.status ?? "").toUpperCase();
          const inventoryStatus = String(item.inventory_status ?? "").toUpperCase();

          return (
            status !== "DISPENSED" &&
            status !== "CANCELLED" &&
            status !== "CANCELED" &&
            inventoryStatus !== "DISPENSED" &&
            inventoryStatus !== "CANCELLED" &&
            inventoryStatus !== "CANCELED" &&
            inventoryStatus !== "SENT_TO_NURSING" &&
            inventoryStatus !== "RECEIVED_BY_NURSING"
          );
        },
      );

      prescriptionItemsByProductId = validPrescriptionItems.reduce(
        (map: Map<string, any[]>, item: any) => {
          if (!item.medication_id) return map;

          const current = map.get(item.medication_id) ?? [];
          current.push(item);
          map.set(item.medication_id, current);

          return map;
        },
        new Map<string, any[]>(),
      );
    }

    const allPrescriptionItems = Array.from(
      prescriptionItemsByProductId.values(),
    ).flat();

    const prescriptionIds = Array.from(
      new Set(
        allPrescriptionItems
          .map((item: any) => item.prescription_id)
          .filter((id: string | null): id is string => Boolean(id)),
      ),
    );

    let prescriptionsById = new Map<string, any>();

    if (prescriptionIds.length > 0) {
      const { data: prescriptionRows, error: prescriptionError } = await supabase
        .from("prescriptions")
        .select(`
          id,
          clinic_patient_id
        `)
        .in("id", prescriptionIds);

      if (prescriptionError) {
        console.error("Error loading prescriptions:", prescriptionError);
        notify(
          "Error",
          prescriptionError.message || "No se pudieron cargar las prescripciones.",
        );
      }

      prescriptionsById = new Map(
        (prescriptionRows ?? []).map((prescription: any) => [
          prescription.id,
          prescription,
        ]),
      );
    }

    const clinicPersonIds = Array.from(
      new Set(
        Array.from(prescriptionsById.values())
          .map((prescription: any) => prescription.clinic_patient_id)
          .filter((id: string | null): id is string => Boolean(id)),
      ),
    );

    let clinicPersonsById = new Map<string, any>();

    if (clinicPersonIds.length > 0) {
      const { data: clinicPersonRows, error: clinicPersonError } =
        await supabase
          .from("clinic_persons")
          .select(`
            id,
            person_id
          `)
          .in("id", clinicPersonIds);

      if (clinicPersonError) {
        console.error("Error loading clinic persons:", clinicPersonError);
        notify(
          "Error",
          clinicPersonError.message ||
            "No se pudieron cargar los pacientes clínicos.",
        );
      }

      clinicPersonsById = new Map(
        (clinicPersonRows ?? []).map((clinicPerson: any) => [
          clinicPerson.id,
          clinicPerson,
        ]),
      );
    }

    const personIds = Array.from(
      new Set(
        Array.from(clinicPersonsById.values())
          .map((clinicPerson: any) => clinicPerson.person_id)
          .filter((id: string | null): id is string => Boolean(id)),
      ),
    );

    let personsById = new Map<string, any>();

    if (personIds.length > 0) {
      const { data: personRows, error: personError } = await supabase
        .from("persons")
        .select(`
          id,
          first_name,
          last_name,
          document_number,
          phone,
          email
        `)
        .in("id", personIds);

      if (personError) {
        console.error("Error loading persons:", personError);
        notify(
          "Error",
          personError.message || "No se pudieron cargar las personas.",
        );
      }

      personsById = new Map(
        (personRows ?? []).map((person: any) => [person.id, person]),
      );
    }

    const prescriptionItemIds = Array.from(
      new Set(
        allPrescriptionItems
          .map((item: any) => item.id)
          .filter((id: string | null): id is string => Boolean(id)),
      ),
    );

    let alreadyPreparedKeys = new Set<string>();

    if (prescriptionItemIds.length > 0) {
      const { data: preparedRows, error: preparedError } = await supabase
        .from("pharmacy_preparation_items")
        .select(`
          id,
          prescription_item_id,
          lot_id,
          status,
          pharmacy_preparation_id,
          pharmacy_preparations (
            id,
            status
          )
        `)
        .in("prescription_item_id", prescriptionItemIds);

      if (preparedError) {
        console.error(
          "Error loading existing pharmacy preparations:",
          preparedError,
        );
      }

      alreadyPreparedKeys = new Set(
        (preparedRows ?? [])
          .filter((row: any) => {
            const itemStatus = String(row.status ?? "").toUpperCase();
            const preparation = normalizeRelation(row.pharmacy_preparations);
            const preparationStatus = String(
              preparation?.status ?? "",
            ).toUpperCase();

            return (
              itemStatus !== "CANCELLED" &&
              itemStatus !== "REJECTED" &&
              preparationStatus !== "CANCELLED"
            );
          })
          .map((row: any) => `${row.prescription_item_id}-${row.lot_id}`),
      );
    }

    const mappedItems: PharmacyPendingItem[] = reservedLots.flatMap(
      (lot: any): PharmacyPendingItem[] => {
        const product = normalizeRelation(lot.products);
        const location = normalizeRelation(lot.locations);

        const prescriptionItems =
          prescriptionItemsByProductId.get(lot.product_id) ?? [];

        const notPreparedItems = prescriptionItems.filter((item: any) => {
          const key = `${item.id}-${lot.id}`;
          return !alreadyPreparedKeys.has(key);
        });

        if (notPreparedItems.length === 0) {
          return [
            {
              id: `lot-only-${lot.id}`,
              mode: "lot_only",
              canSendToNursing: false,

              prescriptionItemId: null,
              prescriptionId: null,
              clinicPatientId: null,
              clinicPersonId: null,
              patientId: null,

              lotId: lot.id,
              clinicId: lot.clinic_id,
              sourceLocationId: lot.location_id,
              medicationId: lot.product_id,

              patientName: "Sin paciente vinculado",
              patientDocument: null,

              productName: product?.name ?? "Producto sin nombre",
              productUnit: product?.unit_of_measure ?? "unit",

              lotCode:
                lot.manufacturer_lot ??
                lot.internal_lot_code ??
                lot.id ??
                "Sin lote",

              locationName: location?.name ?? "Ubicación no definida",

              quantity: Number(lot.quantity_reserved ?? 0),
              dose: null,
              route: null,
              frequency: null,
              instructions:
                "No se encontró una prescripción pendiente asociada a este producto, o ya fue enviada a Nursing.",

              lotAvailable: Number(lot.quantity_available ?? 0),
              lotReserved: Number(lot.quantity_reserved ?? 0),
              lotConsumed: Number(lot.quantity_consumed ?? 0),

              diagnostic: {
                type: "lot_without_pending_prescription_item",
                lotProductId: lot.product_id,
                prescriptionItemsFound: prescriptionItems.length,
                notPreparedItemsFound: notPreparedItems.length,
              },
            },
          ];
        }

        return notPreparedItems.map((prescriptionItem: any): PharmacyPendingItem => {
          const prescription = prescriptionsById.get(
            prescriptionItem.prescription_id,
          );

          const clinicPatientId = prescription?.clinic_patient_id ?? null;

          const clinicPerson = clinicPatientId
            ? clinicPersonsById.get(clinicPatientId)
            : null;

          const clinicPersonId = clinicPerson?.id ?? clinicPatientId ?? null;
          const patientId = clinicPerson?.person_id ?? null;
          const person = patientId ? personsById.get(patientId) : null;

          const firstName = person?.first_name ?? "";
          const lastName = person?.last_name ?? "";

          const patientName =
            `${firstName} ${lastName}`.trim() || "Paciente sin nombre";

          const hasFullPatientLink = Boolean(
            prescriptionItem.prescription_id &&
              clinicPatientId &&
              clinicPerson?.person_id &&
              person,
          );

          const quantityToPrepare = Number(
            prescriptionItem.quantity_required ?? lot.quantity_reserved ?? 0,
          );

          return {
            id: `prescription-${prescriptionItem.id}-${lot.id}`,
            mode: "prescription_linked",
            canSendToNursing: hasFullPatientLink,

            prescriptionItemId: prescriptionItem.id,
            prescriptionId: prescriptionItem.prescription_id,
            clinicPatientId,
            clinicPersonId,
            patientId,

            lotId: lot.id,
            clinicId: lot.clinic_id,
            sourceLocationId: lot.location_id,
            medicationId: prescriptionItem.medication_id ?? lot.product_id,

            patientName: hasFullPatientLink ? patientName : "Paciente no vinculado",
            patientDocument: person?.document_number ?? null,

            productName: product?.name ?? "Producto sin nombre",
            productUnit:
              prescriptionItem.quantity_unit ?? product?.unit_of_measure ?? "unit",

            lotCode:
              lot.manufacturer_lot ??
              lot.internal_lot_code ??
              lot.id ??
              "Sin lote",

            locationName: location?.name ?? "Ubicación no definida",

            quantity: quantityToPrepare,
            dose: prescriptionItem.dose ?? null,
            route: prescriptionItem.route ?? null,
            frequency: prescriptionItem.frequency ?? null,
            instructions: prescriptionItem.instructions ?? null,

            lotAvailable: Number(lot.quantity_available ?? 0),
            lotReserved: Number(lot.quantity_reserved ?? 0),
            lotConsumed: Number(lot.quantity_consumed ?? 0),

            diagnostic: {
              type: "prescription_patient_link",
              prescriptionItemId: prescriptionItem.id,
              prescriptionId: prescriptionItem.prescription_id,
              clinicPatientId,
              clinicPersonId,
              clinicPersonFound: Boolean(clinicPerson),
              patientId,
              personFound: Boolean(person),
            },
          };
        });
      },
    );

    setPendingItems(mappedItems);
    setLoading(false);
  }

  async function sendPreparationToNursing(item: PharmacyPendingItem) {
    if (!item.canSendToNursing) {
      notify(
        "No se puede enviar a Nursing",
        "Este medicamento todavía no tiene prescripción y paciente completamente vinculados.",
      );
      return;
    }

    if (!item.prescriptionItemId) {
      notify("Error", "No se encontró el prescription_item_id.");
      return;
    }

    if (!item.prescriptionId) {
      notify("Error", "No se encontró el prescription_id.");
      return;
    }

    if (!item.lotId) {
      notify("Error", "No se encontró el lote reservado.");
      return;
    }

    if (!item.medicationId) {
      notify("Error", "No se encontró el medicamento asociado.");
      return;
    }

    const quantityToPrepare = Number(item.quantity ?? 0);

    if (!quantityToPrepare || quantityToPrepare <= 0) {
      notify("Cantidad inválida", "La cantidad preparada no es válida.");
      return;
    }

    if (Number(item.lotReserved ?? 0) < quantityToPrepare) {
      notify(
        "Reserva insuficiente",
        "La cantidad reservada del lote es menor que la cantidad a preparar.",
      );
      return;
    }

    const rowKey = item.id;
    const notes = notesByItemId[rowKey]?.trim() || null;

    setSendingId(rowKey);

    const now = timestampWithoutTimezone(new Date());
    const preparationId = crypto.randomUUID();

    const preparationPayload = {
      id: preparationId,
      clinic_id: item.clinicId,
      prescription_id: item.prescriptionId,
      clinic_patient_id: item.clinicPatientId,
      patient_id: item.patientId,
      status: "SENT_TO_NURSING",
      prepared_by: null,
      prepared_at: now,
      sent_to_nursing_by: null,
      sent_to_nursing_at: now,
      received_by: null,
      received_at: null,
      notes,
      created_at: now,
      updated_at: now,
    };

    const { error: preparationError } = await supabase
      .from("pharmacy_preparations")
      .insert(preparationPayload);

    if (preparationError) {
      console.error("Preparation payload:", preparationPayload);
      console.error("Error creating pharmacy preparation:", preparationError);

      notify(
        "Error",
        preparationError.message || "No se pudo crear la preparación de farmacia.",
      );

      setSendingId(null);
      return;
    }

    const preparationItemPayload = {
      id: crypto.randomUUID(),
      pharmacy_preparation_id: preparationId,
      prescription_item_id: item.prescriptionItemId,
      medication_id: item.medicationId,
      lot_id: item.lotId,
      quantity_prepared: quantityToPrepare,
      quantity_received: 0,
      administration_mode: null,
      status: "PREPARED",
      pharmacy_notes: notes,
      nursing_notes: null,
      created_at: now,
      updated_at: now,
    };

    const { error: preparationItemError } = await supabase
      .from("pharmacy_preparation_items")
      .insert(preparationItemPayload);

    if (preparationItemError) {
      console.error("Preparation item payload:", preparationItemPayload);
      console.error(
        "Error creating pharmacy preparation item:",
        preparationItemError,
      );

      await supabase
        .from("pharmacy_preparations")
        .delete()
        .eq("id", preparationId);

      notify(
        "Error",
        preparationItemError.message || "No se pudo crear el ítem de preparación.",
      );

      setSendingId(null);
      return;
    }

    const { error: prescriptionItemError } = await supabase
      .from("prescription_items")
      .update({
        inventory_status: "SENT_TO_NURSING",
      })
      .eq("id", item.prescriptionItemId);

    if (prescriptionItemError) {
      console.error(
        "Error updating prescription item inventory_status:",
        prescriptionItemError,
      );

      notify(
        "Advertencia",
        "La preparación fue enviada a Nursing, pero no se pudo actualizar el estado de inventario de la prescripción.",
      );
    } else {
      notify(
        "Enviado a Nursing",
        `${item.productName} fue preparado y enviado a Nursing para ${item.patientName}.`,
      );
    }

    setSendingId(null);
    await loadPendingForNursing();
  }

  async function loadKitOrdersForPharmacy() {
    setLoadingKits(true);

    const { data, error } = await supabase
      .from("procedure_kit_orders")
      .select(`
        id,
        clinic_id,
        kit_id,
        procedure_id,
        procedure_type,
        status,
        requested_at,
        sent_to_pharmacy_at,
        prepared_at,
        delivered_at,
        notes,
        procedure_kits (
          id,
          name,
          procedure_type
        ),
        procedure_kit_order_items (
          id,
          kit_order_id,
          product_id,
          quantity_required,
          quantity_reserved,
          quantity_prepared,
          quantity_delivered,
          unit_of_measure,
          status,
          pharmacy_notes,
          products (
            id,
            name,
            unit_of_measure,
            presentation
          ),
          procedure_kit_order_item_lots (
            id,
            kit_order_item_id,
            product_id,
            lot_id,
            quantity_reserved,
            quantity_prepared,
            quantity_delivered,
            status,
            inventory_lots (
              id,
              internal_lot_code,
              manufacturer_lot,
              expiration_date,
              quantity_available,
              quantity_reserved,
              quantity_consumed
            )
          )
        )
      `)
      .in("status", ["SENT_TO_PHARMACY", "PREPARED_BY_PHARMACY"])
      .order("sent_to_pharmacy_at", { ascending: false });

    if (error) {
      console.error("Error loading kit orders for pharmacy:", error);
      notify(
        "Error",
        error.message || "No se pudieron cargar los kits enviados a farmacia.",
      );
      setKitOrders([]);
      setLoadingKits(false);
      return;
    }

    const normalized = ((data ?? []) as any[]).map((order) => ({
      ...order,
      procedure_kits: normalizeRelation(order.procedure_kits),
      procedure_kit_order_items: (order.procedure_kit_order_items ?? []).map(
        (item: any) => ({
          ...item,
          products: normalizeRelation(item.products),
          procedure_kit_order_item_lots: (
            item.procedure_kit_order_item_lots ?? []
          ).map((lotRow: any) => ({
            ...lotRow,
            inventory_lots: normalizeRelation(lotRow.inventory_lots),
          })),
        }),
      ),
    }));

    setKitOrders(normalized as PharmacyKitOrder[]);
    setLoadingKits(false);
  }

  async function markKitPreparedByPharmacy(order: PharmacyKitOrder) {
    const items = order.procedure_kit_order_items ?? [];

    if (items.length === 0) {
      notify("Orden vacía", "Esta orden de kit no tiene insumos.");
      return;
    }

    setKitActionId(order.id);

    const now = timestampWithoutTimezone(new Date());

    for (const item of items) {
      const itemLots = item.procedure_kit_order_item_lots ?? [];

      for (const lotRow of itemLots) {
        const preparedQty = Number(lotRow.quantity_reserved ?? 0);

        const { error: lotRowError } = await supabase
          .from("procedure_kit_order_item_lots")
          .update({
            quantity_prepared: preparedQty,
            status: "PREPARED",
            updated_at: now,
          })
          .eq("id", lotRow.id);

        if (lotRowError) {
          console.error("Error preparing kit lot:", lotRowError);
          notify(
            "Error",
            lotRowError.message || "No se pudo preparar un lote del kit.",
          );
          setKitActionId(null);
          return;
        }

        await insertPharmacyKitMovement({
          kit_order_id: order.id,
          kit_order_item_id: item.id,
          kit_order_item_lot_id: lotRow.id,
          clinic_id: order.clinic_id,
          product_id: item.product_id,
          lot_id: lotRow.lot_id,
          movement_type: "KIT_PREPARED_BY_PHARMACY",
          quantity: preparedQty,
          source_location_id: null,
          destination_location_id: null,
          reason: "Kit alistado por farmacia.",
          created_at: now,
        });
      }

      const { error: itemError } = await supabase
        .from("procedure_kit_order_items")
        .update({
          quantity_prepared: Number(item.quantity_reserved ?? 0),
          status: "PREPARED",
          updated_at: now,
        })
        .eq("id", item.id);

      if (itemError) {
        console.error("Error preparing kit item:", itemError);
        notify("Error", itemError.message || "No se pudo preparar un insumo.");
        setKitActionId(null);
        return;
      }
    }

    const { error: orderError } = await supabase
      .from("procedure_kit_orders")
      .update({
        status: "PREPARED_BY_PHARMACY",
        prepared_by: null,
        prepared_at: now,
        updated_at: now,
      })
      .eq("id", order.id);

    if (orderError) {
      console.error("Error marking kit order as prepared:", orderError);
      notify(
        "Error",
        orderError.message || "No se pudo marcar el kit como preparado.",
      );
      setKitActionId(null);
      return;
    }

    notify("Kit preparado", "Farmacia alistó el kit para el procedimiento.");

    setKitActionId(null);
    await loadKitOrdersForPharmacy();
  }

  async function deliverKitToProcedure(order: PharmacyKitOrder) {
    const items = order.procedure_kit_order_items ?? [];

    if (items.length === 0) {
      notify("Orden vacía", "Esta orden de kit no tiene insumos.");
      return;
    }

    setKitActionId(order.id);

    const now = timestampWithoutTimezone(new Date());

    for (const item of items) {
      const itemLots = item.procedure_kit_order_item_lots ?? [];

      for (const lotRow of itemLots) {
        const deliveredQty = Number(lotRow.quantity_prepared ?? 0);

        const { error: lotRowError } = await supabase
          .from("procedure_kit_order_item_lots")
          .update({
            quantity_delivered: deliveredQty,
            status: "DELIVERED",
            updated_at: now,
          })
          .eq("id", lotRow.id);

        if (lotRowError) {
          console.error("Error delivering kit lot:", lotRowError);
          notify(
            "Error",
            lotRowError.message || "No se pudo entregar un lote del kit.",
          );
          setKitActionId(null);
          return;
        }

        await insertPharmacyKitMovement({
          kit_order_id: order.id,
          kit_order_item_id: item.id,
          kit_order_item_lot_id: lotRow.id,
          clinic_id: order.clinic_id,
          product_id: item.product_id,
          lot_id: lotRow.lot_id,
          movement_type: "KIT_DELIVERED_TO_PROCEDURE",
          quantity: deliveredQty,
          source_location_id: null,
          destination_location_id: null,
          reason: "Kit entregado al procedimiento.",
          created_at: now,
        });
      }

      const { error: itemError } = await supabase
        .from("procedure_kit_order_items")
        .update({
          quantity_delivered: Number(item.quantity_prepared ?? 0),
          status: "DELIVERED",
          updated_at: now,
        })
        .eq("id", item.id);

      if (itemError) {
        console.error("Error delivering kit item:", itemError);
        notify("Error", itemError.message || "No se pudo entregar un insumo.");
        setKitActionId(null);
        return;
      }
    }

    const { error: orderError } = await supabase
      .from("procedure_kit_orders")
      .update({
        status: "DELIVERED_TO_PROCEDURE",
        delivered_by: null,
        delivered_at: now,
        received_by: null,
        received_at: now,
        updated_at: now,
      })
      .eq("id", order.id);

    if (orderError) {
      console.error("Error delivering kit order:", orderError);
      notify(
        "Error",
        orderError.message || "No se pudo entregar el kit al procedimiento.",
      );
      setKitActionId(null);
      return;
    }

    notify(
      "Kit entregado",
      "El kit fue entregado al procedimiento. El consumo se registra después con uso/devolución.",
    );

    setKitActionId(null);
    await loadKitOrdersForPharmacy();
  }

  const summary = useMemo(() => {
    const validItems = pendingItems.filter((item) => item.canSendToNursing);
    const invalidItems = pendingItems.filter((item) => !item.canSendToNursing);

    return {
      total: pendingItems.length,
      valid: validItems.length,
      invalid: invalidItems.length,
    };
  }, [pendingItems]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4 border-b border-border flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Preparación de medicamentos para Nursing
            </h3>

            <p className="text-[11px] text-muted-foreground mt-0.5">
              Pharmacy solo prepara y envía medicamentos a Nursing. La decisión
              de primera dosis presencial o manejo en casa se realiza en Nursing.
            </p>

            <div className="flex items-center gap-2 mt-2 text-[10.5px] text-muted-foreground">
              <span>Total: {summary.total}</span>
              <span>·</span>
              <span>Listos: {summary.valid}</span>
              <span>·</span>
              <span>Con vínculo incompleto: {summary.invalid}</span>
            </div>
          </div>

          <button
            onClick={loadPendingForNursing}
            disabled={loading}
            className="text-[11px] px-3 py-1.5 rounded-md bg-secondary hover:bg-accent transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Refresh
          </button>
        </div>

        {loading && (
          <div className="p-5 text-[12px] text-muted-foreground flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Cargando medicamentos pendientes por preparar...
          </div>
        )}

        {!loading && pendingItems.length === 0 && (
          <div className="p-6 text-[12px] text-muted-foreground">
            No hay medicamentos reservados pendientes por enviar a Nursing.
          </div>
        )}

        {!loading && pendingItems.length > 0 && (
          <div className="divide-y divide-border">
            {pendingItems.map((item) => {
              const rowKey = item.id;

              return (
                <div
                  key={rowKey}
                  className="p-5 hover:bg-accent/30 transition-colors grid grid-cols-12 gap-4 items-start"
                >
                  <div className="col-span-3">
                    <p className="text-[12px] font-semibold text-foreground">
                      {item.patientName}
                    </p>

                    {item.patientDocument && (
                      <p className="text-[10.5px] text-muted-foreground">
                        Doc. {item.patientDocument}
                      </p>
                    )}

                    <p className="text-[10.5px] text-muted-foreground mt-0.5">
                      {item.canSendToNursing
                        ? "Prescripción y paciente vinculados"
                        : "Vínculo incompleto"}
                    </p>

                    {item.prescriptionItemId && (
                      <p className="font-mono text-[10px] text-muted-foreground truncate mt-1">
                        {item.prescriptionItemId}
                      </p>
                    )}
                  </div>

                  <div className="col-span-4">
                    <p className="text-[12px] font-semibold text-foreground">
                      {item.productName}
                    </p>

                    <p className="text-[10.5px] text-muted-foreground mt-0.5">
                      Lote: <span className="font-mono">{item.lotCode}</span>
                    </p>

                    <p className="text-[10.5px] text-muted-foreground">
                      Ubicación: {item.locationName}
                    </p>

                    {(item.dose || item.route || item.frequency) && (
                      <p className="text-[10.5px] text-muted-foreground mt-1">
                        {item.dose && `${item.dose}`}
                        {item.route && ` · ${item.route}`}
                        {item.frequency && ` · ${item.frequency}`}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground">
                      Cantidad preparada
                    </p>

                    <p className="text-sm font-semibold text-foreground">
                      {item.quantity} {item.productUnit}
                    </p>

                    <p className="text-[10px] text-muted-foreground mt-2">
                      Reservado en lote
                    </p>

                    <p className="text-[11px] text-muted-foreground">
                      {item.lotReserved} {item.productUnit}
                    </p>
                  </div>

                  <div className="col-span-3 flex justify-end">
                    <button
                      onClick={() => sendPreparationToNursing(item)}
                      disabled={!item.canSendToNursing || sendingId === rowKey}
                      className="text-[12px] px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {sendingId === rowKey ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      Alistar y enviar a Nursing
                    </button>
                  </div>

                  <div className="col-start-4 col-span-9">
                    <textarea
                      value={notesByItemId[rowKey] ?? ""}
                      disabled={!item.canSendToNursing}
                      onChange={(event) =>
                        setNotesByItemId((current) => ({
                          ...current,
                          [rowKey]: event.target.value,
                        }))
                      }
                      placeholder="Notas de farmacia para Nursing..."
                      className="w-full min-h-[64px] rounded-md border border-border bg-card px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />
                  </div>

                  {item.instructions && (
                    <div
                      className={cn(
                        "col-start-4 col-span-9 text-[10.5px] border rounded-md px-2 py-1",
                        item.canSendToNursing
                          ? "text-muted-foreground bg-secondary/60 border-border"
                          : "text-warning bg-warning/5 border-warning/20",
                      )}
                    >
                      {item.instructions}
                    </div>
                  )}

                  {!item.canSendToNursing && item.diagnostic && (
                    <div className="col-start-4 col-span-9 text-[10px] bg-critical/5 border border-critical/15 text-critical rounded-md px-2 py-1 flex items-start gap-2">
                      <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                      <span>
                        Diagnóstico vínculo:{" "}
                        <span className="font-mono">
                          {JSON.stringify(item.diagnostic)}
                        </span>
                      </span>
                    </div>
                  )}

                  {item.canSendToNursing && (
                    <div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className="p-4 border-b border-border flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Kits enviados a farmacia
            </h3>

            <p className="text-[11px] text-muted-foreground mt-0.5">
              Órdenes de kits validadas y reservadas desde inventario para
              alistamiento y entrega al procedimiento.
            </p>
          </div>

          <button
            onClick={loadKitOrdersForPharmacy}
            disabled={loadingKits}
            className="text-[11px] px-3 py-1.5 rounded-md bg-secondary hover:bg-accent transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {loadingKits ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Refresh
          </button>
        </div>

        {loadingKits && (
          <div className="p-5 text-[12px] text-muted-foreground flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Cargando kits enviados a farmacia...
          </div>
        )}

        {!loadingKits && kitOrders.length === 0 && (
          <div className="p-6 text-[12px] text-muted-foreground">
            No hay kits pendientes por alistar en farmacia.
          </div>
        )}

        {!loadingKits && kitOrders.length > 0 && (
          <div className="divide-y divide-border">
            {kitOrders.map((order) => {
              const kit = normalizeRelation(order.procedure_kits);
              const items = order.procedure_kit_order_items ?? [];
              const status = String(order.status ?? "").toUpperCase();
              const isWorking = kitActionId === order.id;

              return (
                <div key={order.id} className="p-5 space-y-4">
                  <div className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-4">
                      <p className="text-[12px] font-semibold text-foreground">
                        {kit?.name ?? "Kit sin nombre"}
                      </p>

                      <p className="text-[10.5px] text-muted-foreground mt-0.5">
                        Procedimiento:{" "}
                        {order.procedure_type ?? kit?.procedure_type ?? "-"}
                      </p>

                      <p className="text-[10.5px] text-muted-foreground">
                        Orden: <span className="font-mono">{order.id}</span>
                      </p>
                    </div>

                    <div className="col-span-3">
                      <p className="text-[10px] text-muted-foreground">
                        Enviado a farmacia
                      </p>

                      <p className="text-[11px] text-foreground">
                        {formatDate(order.sent_to_pharmacy_at)}
                      </p>

                      <div className="mt-2">
                        <StatusPill status={order.status ?? "PENDING"} />
                      </div>
                    </div>

                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-foreground">
                        Insumos
                      </p>

                      <p className="text-sm font-semibold text-foreground">
                        {items.length}
                      </p>
                    </div>

                    <div className="col-span-3 flex justify-end gap-2">
                      {status === "SENT_TO_PHARMACY" && (
                        <button
                          onClick={() => markKitPreparedByPharmacy(order)}
                          disabled={isWorking}
                          className="text-[12px] px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          {isWorking ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <PackageCheck className="size-4" />
                          )}
                          Marcar preparado
                        </button>
                      )}

                      {status === "PREPARED_BY_PHARMACY" && (
                        <button
                          onClick={() => deliverKitToProcedure(order)}
                          disabled={isWorking}
                          className="text-[12px] px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          {isWorking ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Truck className="size-4" />
                          )}
                          Entregar al procedimiento
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-secondary/20 divide-y divide-border">
                    {items.map((item) => {
                      const product = normalizeRelation(item.products);
                      const lots = item.procedure_kit_order_item_lots ?? [];

                      return (
                        <div key={item.id} className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[12px] font-semibold">
                                {product?.name ?? "Producto sin nombre"}
                              </p>

                              <p className="text-[10.5px] text-muted-foreground mt-0.5">
                                Requerido: {Number(item.quantity_required ?? 0)}{" "}
                                {item.unit_of_measure ??
                                  product?.unit_of_measure ??
                                  ""}
                                {" · "}
                                Reservado: {Number(item.quantity_reserved ?? 0)}
                                {" · "}
                                Preparado: {Number(item.quantity_prepared ?? 0)}
                                {" · "}
                                Entregado: {Number(item.quantity_delivered ?? 0)}
                              </p>
                            </div>

                            <StatusPill status={item.status ?? "PENDING"} />
                          </div>

                          {lots.length > 0 && (
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                              {lots.map((lotRow) => {
                                const lot = normalizeRelation(lotRow.inventory_lots);

                                return (
                                  <div
                                    key={lotRow.id}
                                    className="rounded-md border border-border bg-card px-3 py-2"
                                  >
                                    <p className="text-[10.5px] font-medium">
                                      Lote:{" "}
                                      <span className="font-mono">
                                        {lot?.manufacturer_lot ??
                                          lot?.internal_lot_code ??
                                          lotRow.lot_id ??
                                          "-"}
                                      </span>
                                    </p>

                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      Reservado:{" "}
                                      {Number(lotRow.quantity_reserved ?? 0)}
                                      {" · "}
                                      Preparado:{" "}
                                      {Number(lotRow.quantity_prepared ?? 0)}
                                      {" · "}
                                      Entregado:{" "}
                                      {Number(lotRow.quantity_delivered ?? 0)}
                                    </p>

                                    {lot?.expiration_date && (
                                      <p className="text-[10px] text-muted-foreground">
                                        Vence: {formatDate(lot.expiration_date)}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {order.notes && (
                    <div className="text-[10.5px] border border-border rounded-md px-2 py-1 bg-secondary/40 text-muted-foreground">
                      {order.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
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
  const normalized = String(status ?? "").toUpperCase();

  const tone =
    normalized === "RECEIVED_BY_NURSING" ||
    normalized === "RECEIVED" ||
    normalized === "ADMINISTERED" ||
    normalized === "HOME_DELIVERED" ||
    normalized === "PREPARED_BY_PHARMACY" ||
    normalized === "PREPARED" ||
    normalized === "DELIVERED_TO_PROCEDURE" ||
    normalized === "DELIVERED"
      ? "success"
      : normalized === "SENT_TO_NURSING" ||
          normalized === "SENT_TO_PHARMACY" ||
          normalized === "RESERVED" ||
          normalized === "PENDING"
        ? "primary"
        : normalized === "INSUFFICIENT_STOCK"
          ? "warning"
          : normalized === "CANCELLED" || normalized === "REJECTED"
            ? "critical"
            : "muted";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        tone === "success" && "bg-success/10 text-success",
        tone === "primary" && "bg-primary/10 text-primary",
        tone === "warning" && "bg-warning/10 text-warning",
        tone === "critical" && "bg-critical/10 text-critical",
        tone === "muted" && "bg-secondary text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

async function insertPharmacyKitMovement(payload: {
  kit_order_id: string | null;
  kit_order_item_id: string | null;
  kit_order_item_lot_id: string | null;
  clinic_id: string | null;
  product_id: string | null;
  lot_id: string | null;
  movement_type: string;
  quantity: number;
  source_location_id: string | null;
  destination_location_id: string | null;
  reason: string | null;
  created_at: string;
}) {
  const { error } = await supabase.from("procedure_kit_movements").insert({
    id: crypto.randomUUID(),
    kit_order_id: payload.kit_order_id,
    kit_order_item_id: payload.kit_order_item_id,
    kit_order_item_lot_id: payload.kit_order_item_lot_id,
    clinic_id: payload.clinic_id,
    product_id: payload.product_id,
    lot_id: payload.lot_id,
    movement_type: payload.movement_type,
    quantity: payload.quantity,
    source_location_id: payload.source_location_id,
    destination_location_id: payload.destination_location_id,
    performed_by: null,
    reason: payload.reason,
    created_at: payload.created_at,
  });

  if (error) {
    console.error("Error inserting kit movement:", error);
  }
}