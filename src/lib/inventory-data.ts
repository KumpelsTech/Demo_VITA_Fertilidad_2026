export type LotStatus =
  | "available"
  | "reserved"
  | "quarantined"
  | "expired"
  | "blocked"
  | "returned"
  | "consumed"
  | "destroyed";

export type MovementType =
  | "received"
  | "technical-reception"
  | "transfer"
  | "reserved"
  | "dispensed"
  | "consumed"
  | "returned"
  | "adjustment"
  | "quarantine"
  | "destruction"
  | "expiration"
  | "blocked";

export interface Lot {
  id: string;
  productId: string;
  product: string;
  category: "Medication" | "Reagent" | "Supply" | "IVF Media" | "Hormone" | "Kit";
  manufacturerLot: string;
  expiry: string;
  daysToExpiry: number;
  manufactured: string;
  supplier: string;
  location: string;
  locationPath: string;
  tempRequirement: string;
  status: LotStatus;
  total: number;
  reserved: number;
  consumed: number;
  available: number;
  unit: string;
  cost: number;
  invimaAlert?: string;
  coldChain?: boolean;
}

export const LOTS: Lot[] = [
  {
    id: "LOT-8921",
    productId: "P-001",
    product: "Gonal-F 900IU",
    category: "Hormone",
    manufacturerLot: "MA-22841",
    expiry: "2025-03-15",
    daysToExpiry: 42,
    manufactured: "2023-06-10",
    supplier: "Merck Serono",
    location: "Pharmacy A",
    locationPath: "VITA Bogotá · Pharmacy A · Cold Shelf 02",
    tempRequirement: "2 – 8 °C",
    status: "available",
    total: 12,
    reserved: 8,
    consumed: 0,
    available: 4,
    unit: "vials",
    cost: 412,
    coldChain: true,
  },
  {
    id: "LOT-9034",
    productId: "P-002",
    product: "Ovidrel 250mcg",
    category: "Hormone",
    manufacturerLot: "OV-99812",
    expiry: "2025-06-20",
    daysToExpiry: 139,
    manufactured: "2023-11-02",
    supplier: "Merck Serono",
    location: "Pharmacy A",
    locationPath: "VITA Bogotá · Pharmacy A · Cold Shelf 01",
    tempRequirement: "2 – 8 °C",
    status: "reserved",
    total: 14,
    reserved: 12,
    consumed: 0,
    available: 2,
    unit: "syringes",
    cost: 198,
    coldChain: true,
  },
  {
    id: "LOT-9102",
    productId: "P-003",
    product: "Cetrotide 0.25mg",
    category: "Medication",
    manufacturerLot: "CT-44012",
    expiry: "2025-08-10",
    daysToExpiry: 190,
    manufactured: "2024-01-18",
    supplier: "Ferring Pharma",
    location: "Pharmacy B",
    locationPath: "VITA Bogotá · Pharmacy B · Shelf A4",
    tempRequirement: "Room temp",
    status: "available",
    total: 24,
    reserved: 6,
    consumed: 4,
    available: 14,
    unit: "vials",
    cost: 312,
  },
  {
    id: "LOT-9200",
    productId: "P-004",
    product: "Progesterone 200mg",
    category: "Hormone",
    manufacturerLot: "PR-77231",
    expiry: "2025-12-01",
    daysToExpiry: 303,
    manufactured: "2024-03-05",
    supplier: "Besins Healthcare",
    location: "Pharmacy A",
    locationPath: "VITA Bogotá · Pharmacy A · Shelf B1",
    tempRequirement: "Room temp",
    status: "available",
    total: 60,
    reserved: 12,
    consumed: 0,
    available: 48,
    unit: "capsules",
    cost: 92,
  },
  {
    id: "LOT-8156",
    productId: "P-005",
    product: "Embryo Culture Medium G-1 PLUS",
    category: "IVF Media",
    manufacturerLot: "VG-55012",
    expiry: "2025-04-30",
    daysToExpiry: 88,
    manufactured: "2024-08-12",
    supplier: "Vitrolife",
    location: "Lab Store",
    locationPath: "VITA Bogotá · Lab · Cold Room 1",
    tempRequirement: "2 – 8 °C",
    status: "quarantined",
    total: 8,
    reserved: 0,
    consumed: 0,
    available: 0,
    unit: "bottles",
    cost: 540,
    coldChain: true,
    invimaAlert: "Cold-chain excursion detected 12 Feb 03:14 — 9.4 °C / 22 min",
  },
  {
    id: "LOT-8223",
    productId: "P-006",
    product: "Vitrification Kit Cryotop",
    category: "Kit",
    manufacturerLot: "VK-10234",
    expiry: "2025-05-15",
    daysToExpiry: 103,
    manufactured: "2024-05-22",
    supplier: "Kitazato",
    location: "Lab Store",
    locationPath: "VITA Bogotá · Lab · Shelf C3",
    tempRequirement: "Room temp",
    status: "available",
    total: 4,
    reserved: 2,
    consumed: 0,
    available: 2,
    unit: "kits",
    cost: 1240,
  },
  {
    id: "LOT-7740",
    productId: "P-007",
    product: "ICSI Pipette Set",
    category: "Supply",
    manufacturerLot: "IC-66001",
    expiry: "2024-12-31",
    daysToExpiry: -42,
    manufactured: "2023-02-14",
    supplier: "Origio",
    location: "Lab Store",
    locationPath: "VITA Bogotá · Lab · Drawer 04",
    tempRequirement: "Room temp",
    status: "expired",
    total: 6,
    reserved: 0,
    consumed: 0,
    available: 0,
    unit: "sets",
    cost: 175,
  },
  {
    id: "LOT-9311",
    productId: "P-008",
    product: "HSA Solution 5%",
    category: "Reagent",
    manufacturerLot: "HS-12009",
    expiry: "2025-09-30",
    daysToExpiry: 241,
    manufactured: "2024-04-04",
    supplier: "Vitrolife",
    location: "Cold Storage",
    locationPath: "VITA Bogotá · Cold Storage · Tank B",
    tempRequirement: "2 – 8 °C",
    status: "blocked",
    total: 10,
    reserved: 0,
    consumed: 0,
    available: 0,
    unit: "bottles",
    cost: 380,
    coldChain: true,
    invimaAlert: "INVIMA alert 2024-118 — manufacturer recall under review",
  },
];

export const LOCATIONS = [
  { id: "L-PA", name: "Pharmacy A", site: "VITA Bogotá", type: "Pharmacy", lots: 32, capacity: 0.72, temp: "Room / Cold" },
  { id: "L-PB", name: "Pharmacy B", site: "VITA Bogotá", type: "Pharmacy", lots: 18, capacity: 0.41, temp: "Room temp" },
  { id: "L-LAB", name: "Lab Store", site: "VITA Bogotá", type: "Laboratory", lots: 24, capacity: 0.66, temp: "Mixed" },
  { id: "L-CS", name: "Cold Storage", site: "VITA Bogotá", type: "Cold Room", lots: 41, capacity: 0.83, temp: "2 – 8 °C" },
  { id: "L-OR1", name: "Procedure Room 1", site: "VITA Bogotá", type: "Procedure", lots: 6, capacity: 0.28, temp: "Room temp" },
  { id: "L-CART", name: "Emergency Cart", site: "VITA Bogotá", type: "Cart", lots: 9, capacity: 0.55, temp: "Room temp" },
  { id: "L-MED", name: "Pharmacy A · Medellín", site: "VITA Medellín", type: "Pharmacy", lots: 21, capacity: 0.47, temp: "Mixed" },
];

export interface Movement {
  id: string;
  ts: string;
  type: MovementType;
  lotId: string;
  product: string;
  quantity: number;
  unit: string;
  from: string;
  to: string;
  user: string;
  patient?: string;
  procedure?: string;
  reason?: string;
}

export const MOVEMENTS: Movement[] = [
  { id: "MV-7821", ts: "Today · 14:42", type: "dispensed", lotId: "LOT-9034", product: "Ovidrel 250mcg", quantity: 1, unit: "syringe", from: "Pharmacy A", to: "Sarah K. Thompson", user: "N. Ramírez", patient: "Sarah K. Thompson", procedure: "Trigger injection" },
  { id: "MV-7820", ts: "Today · 14:18", type: "reserved", lotId: "LOT-8223", product: "Vitrification Kit Cryotop", quantity: 2, unit: "kits", from: "Lab Store", to: "Retrieval slot 16:00", user: "Dr. E. Vance", procedure: "Egg retrieval" },
  { id: "MV-7819", ts: "Today · 13:02", type: "quarantine", lotId: "LOT-8156", product: "Embryo Culture Medium G-1 PLUS", quantity: 8, unit: "bottles", from: "Lab Cold Room 1", to: "Quarantine area", user: "system", reason: "Cold-chain excursion 9.4 °C" },
  { id: "MV-7818", ts: "Today · 11:36", type: "consumed", lotId: "LOT-9102", product: "Cetrotide 0.25mg", quantity: 2, unit: "vials", from: "Pharmacy B", to: "Maria L. Rodriguez", user: "N. Ramírez", patient: "Maria L. Rodriguez" },
  { id: "MV-7817", ts: "Today · 10:14", type: "transfer", lotId: "LOT-9200", product: "Progesterone 200mg", quantity: 12, unit: "capsules", from: "Pharmacy A", to: "Emergency Cart", user: "J. Pérez" },
  { id: "MV-7816", ts: "Yesterday · 18:50", type: "technical-reception", lotId: "LOT-9311", product: "HSA Solution 5%", quantity: 10, unit: "bottles", from: "Supplier Vitrolife", to: "Cold Storage", user: "Pharmacy QA", reason: "INVIMA registration verified" },
  { id: "MV-7815", ts: "Yesterday · 16:22", type: "blocked", lotId: "LOT-9311", product: "HSA Solution 5%", quantity: 10, unit: "bottles", from: "Cold Storage", to: "—", user: "system", reason: "INVIMA alert 2024-118" },
  { id: "MV-7814", ts: "Yesterday · 09:11", type: "expiration", lotId: "LOT-7740", product: "ICSI Pipette Set", quantity: 6, unit: "sets", from: "Lab Store", to: "—", user: "system", reason: "Auto-expired" },
];

export const KITS = [
  {
    id: "KIT-IVF",
    name: "IVF Standard Kit",
    procedure: "In-Vitro Fertilization",
    used: 18,
    reserved: 4,
    risk: "ok" as const,
    components: [
      { name: "Embryo Culture Medium G-1 PLUS", qty: 1, available: 0, unit: "bottle" },
      { name: "HSA Solution 5%", qty: 1, available: 0, unit: "bottle" },
      { name: "ICSI Pipette Set", qty: 1, available: 0, unit: "set" },
      { name: "Cetrotide 0.25mg", qty: 2, available: 14, unit: "vials" },
    ],
  },
  {
    id: "KIT-RET",
    name: "Egg Retrieval Kit",
    procedure: "Oocyte pickup",
    used: 22,
    reserved: 3,
    risk: "ok" as const,
    components: [
      { name: "Ovidrel 250mcg", qty: 1, available: 2, unit: "syringe" },
      { name: "Vitrification Kit Cryotop", qty: 1, available: 2, unit: "kit" },
      { name: "Progesterone 200mg", qty: 6, available: 48, unit: "capsules" },
    ],
  },
  {
    id: "KIT-TRX",
    name: "Embryo Transfer Kit",
    procedure: "Frozen embryo transfer",
    used: 14,
    reserved: 2,
    risk: "shortage" as const,
    components: [
      { name: "Embryo Culture Medium G-1 PLUS", qty: 1, available: 0, unit: "bottle" },
      { name: "Progesterone 200mg", qty: 8, available: 48, unit: "capsules" },
    ],
  },
  {
    id: "KIT-INS",
    name: "Insemination Kit",
    procedure: "IUI",
    used: 9,
    reserved: 1,
    risk: "ok" as const,
    components: [
      { name: "Ovidrel 250mcg", qty: 1, available: 2, unit: "syringe" },
      { name: "Gonal-F 900IU", qty: 1, available: 4, unit: "vial" },
    ],
  },
];

export const TEMP_LOGS = [
  { sensor: "Cold Room 1", location: "Lab · Vitrolife shelf", current: 4.1, min: 2, max: 8, status: "ok" as const, lastIncident: "12 Feb · 03:14 — 9.4 °C / 22 min" },
  { sensor: "Cold Shelf 01", location: "Pharmacy A", current: 5.6, min: 2, max: 8, status: "ok" as const, lastIncident: "—" },
  { sensor: "Cold Shelf 02", location: "Pharmacy A", current: 7.8, min: 2, max: 8, status: "warning" as const, lastIncident: "Today · 09:02 — 8.4 °C / 6 min" },
  { sensor: "Tank B (LN2)", location: "Cold Storage", current: -195.7, min: -200, max: -180, status: "ok" as const, lastIncident: "—" },
  { sensor: "Cart Refrigerator", location: "Emergency Cart", current: 9.2, min: 2, max: 8, status: "critical" as const, lastIncident: "Today · 14:30 — 9.2 °C ongoing" },
];

export const QUALITY_ITEMS = [
  { id: "Q-220", type: "INVIMA alert" as const, severity: "critical" as const, title: "Recall 2024-118 — HSA Solution 5%", lot: "LOT-9311", affectedPatients: 0, status: "Blocked", opened: "Yesterday" },
  { id: "Q-219", type: "Cold-chain incident" as const, severity: "warning" as const, title: "Excursion at Lab Cold Room 1", lot: "LOT-8156", affectedPatients: 0, status: "Quarantined", opened: "Today" },
  { id: "Q-218", type: "Technical reception" as const, severity: "info" as const, title: "Vitrolife shipment verified", lot: "LOT-9311 · LOT-8156", affectedPatients: 0, status: "Awaiting QA release", opened: "Yesterday" },
  { id: "Q-217", type: "Approval" as const, severity: "info" as const, title: "Destruction request — LOT-7740 (expired)", lot: "LOT-7740", affectedPatients: 0, status: "Pending Director", opened: "Today" },
];

// =================================================================
// MASTER CATALOG · Product registry (clinic-wide, not stock)
// =================================================================
export interface MasterProduct {
  code: string;
  name: string;
  generic: string;
  category: "Hormone" | "Medication" | "Reagent" | "Supply" | "IVF Media" | "Kit" | "Anesthesia";
  unit: string;
  presentation: string;
  reference: string;
  storage: string;
  active: boolean;
  invima: string;
  coldChain: boolean;
  controlled: boolean;
  suppliers: string[];
  stock: number;
  reserved: number;
  linkedKits: number;
}

export const PRODUCTS: MasterProduct[] = [
  { code: "MED-001", name: "Gonal-F 900IU", generic: "Follitropin alfa", category: "Hormone", unit: "vial", presentation: "Pre-filled pen 900IU", reference: "GNL-900", storage: "2 – 8 °C", active: true, invima: "INVIMA 2019M-0019283", coldChain: true, controlled: false, suppliers: ["SUP-MRK"], stock: 12, reserved: 8, linkedKits: 1 },
  { code: "MED-002", name: "Ovidrel 250mcg", generic: "Choriogonadotropin alfa", category: "Hormone", unit: "syringe", presentation: "Single-dose syringe", reference: "OVD-250", storage: "2 – 8 °C", active: true, invima: "INVIMA 2018M-0017721", coldChain: true, controlled: false, suppliers: ["SUP-MRK"], stock: 14, reserved: 12, linkedKits: 2 },
  { code: "MED-003", name: "Cetrotide 0.25mg", generic: "Cetrorelix", category: "Medication", unit: "vial", presentation: "Powder + solvent vial", reference: "CET-025", storage: "Room temp · ≤25°C", active: true, invima: "INVIMA 2017M-0016654", coldChain: false, controlled: false, suppliers: ["SUP-FRR"], stock: 24, reserved: 6, linkedKits: 1 },
  { code: "MED-004", name: "Progesterone 200mg", generic: "Micronized progesterone", category: "Hormone", unit: "capsule", presentation: "Soft-gel capsule", reference: "PRG-200", storage: "Room temp", active: true, invima: "INVIMA 2015M-0014412", coldChain: false, controlled: false, suppliers: ["SUP-BES"], stock: 60, reserved: 12, linkedKits: 2 },
  { code: "LAB-005", name: "Embryo Culture Medium G-1 PLUS", generic: "Sequential culture medium", category: "IVF Media", unit: "bottle", presentation: "20 ml bottle", reference: "VIT-G1P", storage: "2 – 8 °C", active: true, invima: "INVIMA DM2018-0009921", coldChain: true, controlled: false, suppliers: ["SUP-VIT"], stock: 8, reserved: 0, linkedKits: 2 },
  { code: "LAB-006", name: "Vitrification Kit Cryotop", generic: "Embryo vitrification kit", category: "Kit", unit: "kit", presentation: "Complete kit", reference: "KIT-VIT", storage: "Room temp", active: true, invima: "INVIMA DM2019-0010012", coldChain: false, controlled: false, suppliers: ["SUP-KIT"], stock: 4, reserved: 2, linkedKits: 1 },
  { code: "LAB-007", name: "ICSI Pipette Set", generic: "Microinjection pipettes", category: "Supply", unit: "set", presentation: "Sterile set", reference: "ICS-001", storage: "Room temp", active: false, invima: "INVIMA DM2018-0008812", coldChain: false, controlled: false, suppliers: ["SUP-ORG"], stock: 0, reserved: 0, linkedKits: 1 },
  { code: "LAB-008", name: "HSA Solution 5%", generic: "Human serum albumin", category: "Reagent", unit: "bottle", presentation: "10 ml bottle", reference: "HSA-05", storage: "2 – 8 °C", active: true, invima: "INVIMA 2017BM-0009123 · RECALL", coldChain: true, controlled: false, suppliers: ["SUP-VIT"], stock: 10, reserved: 0, linkedKits: 0 },
  { code: "ANS-009", name: "Propofol 200mg", generic: "Propofol", category: "Anesthesia", unit: "ampoule", presentation: "20 ml ampoule", reference: "PRP-200", storage: "Room temp", active: true, invima: "INVIMA 2014M-0013381", coldChain: false, controlled: true, suppliers: ["SUP-FRR"], stock: 36, reserved: 6, linkedKits: 1 },
  { code: "SUP-010", name: "Embryo Transfer Catheter", generic: "Soft-tip transfer catheter", category: "Supply", unit: "unit", presentation: "Sterile sealed", reference: "ETC-SFT", storage: "Room temp", active: true, invima: "INVIMA DM2020-0011023", coldChain: false, controlled: false, suppliers: ["SUP-COO"], stock: 22, reserved: 4, linkedKits: 1 },
];

// =================================================================
// SUPPLIERS
// =================================================================
export interface Supplier {
  id: string;
  name: string;
  nit: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  active: boolean;
  categories: string[];
  products: number;
  openLots: number;
  lastDelivery: string;
  performance: number;
  notes?: string;
}

export const SUPPLIERS: Supplier[] = [
  { id: "SUP-MRK", name: "Merck Serono Colombia", nit: "830.014.221-7", contact: "Andrea Gómez", phone: "+57 310 442 1180", email: "a.gomez@merckserono.co", address: "Cra 11 #93-46, Bogotá", active: true, categories: ["Hormone"], products: 2, openLots: 4, lastDelivery: "12 Feb 2025", performance: 0.97 },
  { id: "SUP-FRR", name: "Ferring Pharmaceuticals", nit: "900.118.776-3", contact: "Luis Trujillo", phone: "+57 320 998 1145", email: "l.trujillo@ferring.com", address: "Cl 100 #19-54, Bogotá", active: true, categories: ["Medication", "Anesthesia"], products: 2, openLots: 3, lastDelivery: "08 Feb 2025", performance: 0.93 },
  { id: "SUP-VIT", name: "Vitrolife AB", nit: "830.099.812-1", contact: "Maria Lindqvist", phone: "+46 31 721 8000", email: "orders@vitrolife.com", address: "Göteborg, SE · LATAM hub Bogotá", active: true, categories: ["IVF Media", "Reagent"], products: 2, openLots: 2, lastDelivery: "Yesterday", performance: 0.88, notes: "INVIMA recall 2024-118 under review" },
  { id: "SUP-BES", name: "Besins Healthcare", nit: "900.221.054-8", contact: "Camila Ruiz", phone: "+57 315 778 0091", email: "c.ruiz@besins.co", address: "Cl 72 #10-07, Bogotá", active: true, categories: ["Hormone"], products: 1, openLots: 1, lastDelivery: "02 Feb 2025", performance: 0.99 },
  { id: "SUP-KIT", name: "Kitazato Corporation", nit: "830.554.117-2", contact: "Hiroshi Tanaka", phone: "+81 3 5777 2122", email: "intl@kitazato.com", address: "Tokyo, JP", active: true, categories: ["Kit"], products: 1, openLots: 1, lastDelivery: "21 Jan 2025", performance: 0.95 },
  { id: "SUP-ORG", name: "Origio / CooperSurgical", nit: "900.776.314-0", contact: "Pablo Esquivel", phone: "+57 301 224 7780", email: "p.esquivel@coopersurgical.com", address: "Cl 116 #9-72, Bogotá", active: false, categories: ["Supply"], products: 1, openLots: 0, lastDelivery: "12 Nov 2024", performance: 0.71, notes: "Suspended — ICSI pipette quality complaint Q-209" },
  { id: "SUP-COO", name: "CooperSurgical LATAM", nit: "900.117.882-5", contact: "Daniela Pardo", phone: "+57 318 990 1140", email: "d.pardo@coopersurgical.com", address: "Cl 116 #9-72, Bogotá", active: true, categories: ["Supply"], products: 1, openLots: 2, lastDelivery: "04 Feb 2025", performance: 0.96 },
];

// =================================================================
// WAREHOUSE TRANSFERS
// =================================================================
export type TransferStatus = "pending" | "approved" | "in-transit" | "received" | "cancelled";

export interface Transfer {
  id: string;
  created: string;
  from: string;
  to: string;
  requester: string;
  receiver: string;
  status: TransferStatus;
  items: { product: string; lot: string; qty: number; unit: string }[];
  reason?: string;
}

export const TRANSFERS: Transfer[] = [
  { id: "TRF-1042", created: "Today · 14:18", from: "Pharmacy A", to: "Procedure Room 1", requester: "Dr. E. Vance", receiver: "N. Ramírez", status: "in-transit", items: [
    { product: "Ovidrel 250mcg", lot: "LOT-9034", qty: 1, unit: "syringe" },
    { product: "Vitrification Kit Cryotop", lot: "LOT-8223", qty: 2, unit: "kits" },
  ], reason: "Retrieval 16:00 — FC-2031" },
  { id: "TRF-1041", created: "Today · 10:14", from: "Pharmacy A", to: "Emergency Cart", requester: "J. Pérez", receiver: "Pharmacy QA", status: "received", items: [
    { product: "Progesterone 200mg", lot: "LOT-9200", qty: 12, unit: "capsules" },
  ] },
  { id: "TRF-1040", created: "Today · 09:32", from: "Cold Storage", to: "Lab Store", requester: "Embryology", receiver: "—", status: "approved", items: [
    { product: "Embryo Culture Medium G-1 PLUS", lot: "LOT-8156", qty: 4, unit: "bottles" },
  ], reason: "Replenish lab cold room 1" },
  { id: "TRF-1039", created: "Today · 08:05", from: "Pharmacy A · Medellín", to: "Pharmacy A", requester: "Logistics", receiver: "—", status: "pending", items: [
    { product: "Gonal-F 900IU", lot: "LOT-8921", qty: 4, unit: "vials" },
  ], reason: "Inter-site rebalance — Bogotá shortage" },
  { id: "TRF-1038", created: "Yesterday · 17:40", from: "Cold Storage", to: "Quarantine", requester: "system", receiver: "Pharmacy QA", status: "received", items: [
    { product: "HSA Solution 5%", lot: "LOT-9311", qty: 10, unit: "bottles" },
  ], reason: "INVIMA recall 2024-118 — block" },
  { id: "TRF-1037", created: "Yesterday · 11:02", from: "Lab Store", to: "Cold Storage", requester: "Embryology", receiver: "—", status: "cancelled", items: [
    { product: "ICSI Pipette Set", lot: "LOT-7740", qty: 2, unit: "sets" },
  ], reason: "Lot expired before pickup" },
];

// =================================================================
// COLD CHAIN UNITS
// =================================================================
export interface ColdUnit {
  id: string;
  name: string;
  type: "Refrigerator" | "Freezer" | "Incubator" | "LN2 Tank";
  site: string;
  range: string;
  current: number;
  unit: "°C";
  status: "ok" | "warning" | "critical" | "offline";
  lastReading: string;
  affectedLots: number;
}

export const COLD_UNITS: ColdUnit[] = [
  { id: "CU-01", name: "Cold Shelf 01", type: "Refrigerator", site: "Pharmacy A · Bogotá", range: "2 – 8 °C", current: 5.6, unit: "°C", status: "ok", lastReading: "2 min ago", affectedLots: 6 },
  { id: "CU-02", name: "Cold Shelf 02", type: "Refrigerator", site: "Pharmacy A · Bogotá", range: "2 – 8 °C", current: 7.8, unit: "°C", status: "warning", lastReading: "1 min ago", affectedLots: 4 },
  { id: "CU-03", name: "Lab Cold Room 1", type: "Refrigerator", site: "Laboratory · Bogotá", range: "2 – 8 °C", current: 4.1, unit: "°C", status: "ok", lastReading: "Just now", affectedLots: 8 },
  { id: "CU-04", name: "Incubator A2", type: "Incubator", site: "Laboratory · Bogotá", range: "36.8 – 37.2 °C", current: 37.0, unit: "°C", status: "ok", lastReading: "Just now", affectedLots: 12 },
  { id: "CU-05", name: "LN2 Tank B", type: "LN2 Tank", site: "Cold Storage · Bogotá", range: "-200 – -180 °C", current: -195.7, unit: "°C", status: "ok", lastReading: "5 min ago", affectedLots: 41 },
  { id: "CU-06", name: "Cart Refrigerator", type: "Refrigerator", site: "Emergency Cart · Bogotá", range: "2 – 8 °C", current: 9.2, unit: "°C", status: "critical", lastReading: "30 sec ago", affectedLots: 3 },
  { id: "CU-07", name: "Freezer -20", type: "Freezer", site: "Pharmacy B · Bogotá", range: "-25 – -15 °C", current: -19.4, unit: "°C", status: "ok", lastReading: "1 min ago", affectedLots: 5 },
  { id: "CU-08", name: "Cold Shelf · Medellín", type: "Refrigerator", site: "Pharmacy A · Medellín", range: "2 – 8 °C", current: 0, unit: "°C", status: "offline", lastReading: "12 min ago", affectedLots: 7 },
];

// =================================================================
// INVIMA & SAFETY ALERTS
// =================================================================
export type InvimaSeverity = "critical" | "warning" | "info";
export type InvimaType = "Recall" | "Pharmacovigilance" | "Technovigilance" | "Falsified" | "Expired";
export type InvimaInternalStatus = "open" | "in-review" | "actioned" | "closed";

export interface InvimaAlert {
  id: string;
  published: string;
  type: InvimaType;
  severity: InvimaSeverity;
  title: string;
  source: string;
  affectedProducts: string[];
  affectedLots: string[];
  clinicImpact: boolean;
  internalStatus: InvimaInternalStatus;
  actionTaken?: string;
  notes?: string;
}

export const INVIMA_ALERTS: InvimaAlert[] = [
  { id: "INV-2024-118", published: "21 Feb 2025", type: "Recall", severity: "critical", title: "HSA Solution 5% — manufacturing deviation", source: "INVIMA · Resolución 2024-118", affectedProducts: ["HSA Solution 5%"], affectedLots: ["LOT-9311"], clinicImpact: true, internalStatus: "actioned", actionTaken: "10 bottles quarantined · supplier notified · awaiting QA release", notes: "0 patients exposed" },
  { id: "INV-2025-014", published: "18 Feb 2025", type: "Technovigilance", severity: "warning", title: "Cryotop devices — risk of micro-crack on rapid thaw", source: "INVIMA · Aviso 2025-014", affectedProducts: ["Vitrification Kit Cryotop"], affectedLots: ["LOT-8223"], clinicImpact: true, internalStatus: "in-review", actionTaken: "Embryology reviewing affected procedures" },
  { id: "INV-2025-009", published: "12 Feb 2025", type: "Pharmacovigilance", severity: "info", title: "Cetrorelix — updated injection-site reaction profile", source: "INVIMA · Boletín FV 12", affectedProducts: ["Cetrotide 0.25mg"], affectedLots: [], clinicImpact: false, internalStatus: "closed", actionTaken: "Patient leaflet updated in WhatsApp templates" },
  { id: "INV-2025-022", published: "Today", type: "Falsified", severity: "critical", title: "Counterfeit Gonal-F detected in informal market", source: "INVIMA · Alerta sanitaria 2025-022", affectedProducts: ["Gonal-F 900IU"], affectedLots: [], clinicImpact: false, internalStatus: "open", notes: "Verify supplier chain — Merck Serono confirmed legitimacy" },
  { id: "INV-2025-005", published: "04 Feb 2025", type: "Expired", severity: "warning", title: "Auto-expired lot in Lab Store", source: "Internal · system", affectedProducts: ["ICSI Pipette Set"], affectedLots: ["LOT-7740"], clinicImpact: false, internalStatus: "actioned", actionTaken: "Destruction request raised · pending Director" },
];

export function lotStatusColor(status: LotStatus): string {
  switch (status) {
    case "available": return "text-success bg-success/10 border-success/30";
    case "reserved": return "text-primary bg-accent border-primary/20";
    case "quarantined": return "text-warning bg-warning/10 border-warning/30";
    case "expired": return "text-critical bg-critical/10 border-critical/30";
    case "blocked": return "text-critical bg-critical/10 border-critical/30";
    case "consumed": return "text-muted-foreground bg-secondary border-border";
    case "returned": return "text-muted-foreground bg-secondary border-border";
    case "destroyed": return "text-muted-foreground bg-secondary border-border";
  }
}

export function movementMeta(
  type?: MovementType | "pending_dispense" | string | null,
): {
  label: string;
  tone: "neutral" | "success" | "warning" | "critical" | "primary";
} {
  switch (type) {
    case "pending_dispense":
      return { label: "Pending dispense", tone: "primary" };

    case "received":
      return { label: "Received", tone: "success" };

    case "technical-reception":
      return { label: "Technical reception", tone: "primary" };

    case "transfer":
      return { label: "Transfer", tone: "neutral" };

    case "reserved":
      return { label: "Reserved", tone: "primary" };

    case "dispensed":
      return { label: "Dispensed", tone: "primary" };

    case "consumed":
      return { label: "Consumed", tone: "neutral" };

    case "returned":
      return { label: "Returned", tone: "neutral" };

    case "adjustment":
      return { label: "Adjustment", tone: "warning" };

    case "quarantine":
      return { label: "Quarantined", tone: "warning" };

    case "destruction":
      return { label: "Destroyed", tone: "critical" };

    case "expiration":
      return { label: "Expired", tone: "critical" };

    case "blocked":
      return { label: "Blocked", tone: "critical" };

    default:
      return {
        label: type ? String(type).replaceAll("_", " ") : "Unknown",
        tone: "neutral",
      };
  }
}