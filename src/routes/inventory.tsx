import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package, Plus, Search, Boxes, Activity, Layers,
  Snowflake, ShieldAlert, ChevronRight, Truck, Building2, Factory, Pill as PillIcon,
  CheckCircle2, AlertTriangle, XCircle, Clock, ArrowRight, X, Upload,
  Pencil, Copy, Trash2, Power, Eye, Sparkles, TrendingUp, Thermometer, History,
  CircleDot, ArrowRightLeft, ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { runMockAction, notify } from "@/lib/mock-actions";
import {
  LOTS, LOCATIONS, MOVEMENTS, KITS, PRODUCTS, SUPPLIERS, TRANSFERS,
  COLD_UNITS, INVIMA_ALERTS, lotStatusColor, movementMeta,
  type MasterProduct, type Supplier, type Transfer, type TransferStatus,
  type ColdUnit, type InvimaAlert, type LotStatus,
} from "@/lib/inventory-data";

import { useEffect } from "react";

import {
  Loader2,
  RefreshCw,
} from "lucide-react";

import { useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";


export const Route = createFileRoute("/inventory")({
  component: InventoryPage,
});

type Tab =
  | "master"
  | "suppliers"
  | "inventory"
  | "transfers"
  | "kits"
  | "activity"
  | "cold-chain"
  | "invima";

const TABS: { id: Tab; label: string; icon: typeof Boxes; hint?: string }[] = [
  { id: "master", label: "Master", icon: Package, hint: "Catalog" },
  { id: "suppliers", label: "Suppliers", icon: Factory },
  { id: "inventory", label: "Inventory", icon: Layers, hint: "Stock" },
  { id: "transfers", label: "Transfers", icon: ArrowRightLeft },
  { id: "kits", label: "Kits & Trays", icon: Boxes },
  { id: "activity", label: "Live activity", icon: Activity },
  { id: "cold-chain", label: "Cold chain", icon: Snowflake },
  { id: "invima", label: "INVIMA & safety", icon: ShieldAlert },
];

interface InventoryLot {
  id: string;

  product_name: string;
  supplier_name: string;
  location_name: string;

  manufacturer_lot: string | null;

  quantity_available: number;
  quantity_reserved: number;

  expiration_date: string | null;

  unit_of_measure: string | null;

  storage_condition: string | null;

  cold_chain: boolean;

  status: LotStatus;

  unit_cost: number;

  daysToExpiry: number;
}


function InventoryPage() {
  const [tab, setTab] = useState<Tab>("master");
  const [productOpen, setProductOpen] = useState<MasterProduct | null>(null);
  const [supplierOpen, setSupplierOpen] = useState<Supplier | null>(null);
  const [transferOpen, setTransferOpen] = useState<Transfer | null>(null);
  const [kitEditOpen, setKitEditOpen] = useState<string | null>(null);
  const [unitOpen, setUnitOpen] = useState<ColdUnit | null>(null);
  const [alertOpen, setAlertOpen] = useState<InvimaAlert | null>(null);
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [newSupplierOpen, setNewSupplierOpen] = useState(false);
  const [newTransferOpen, setNewTransferOpen] = useState(false);
  const [newKitOpen, setNewKitOpen] = useState(false);

  return (
    <div className="flex flex-col bg-secondary/40 min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 pt-5 pb-0">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
                <span>Operations</span>
                <ChevronRight className="size-3" />
                <span className="text-foreground font-medium">Inventory</span>
              </div>
              <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
                Inventory & traceability
              </h1>
              <p className="text-[13px] text-muted-foreground mt-1">
                Master catalog, stock, kits and cold chain across VITA Bogotá & Medellín.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => runMockAction("Activating barcode scanner", { success: "Scanner ready · point at lot QR" })}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary transition-colors"
              >
                <ScanLine className="size-3.5" /> Scan
              </button>
              <PrimaryAction
                tab={tab}
                onNewProduct={() => setNewProductOpen(true)}
                onNewSupplier={() => setNewSupplierOpen(true)}
                onNewTransfer={() => setNewTransferOpen(true)}
                onNewKit={() => setNewKitOpen(true)}
              />
            </div>
          </div>

          <nav className="flex items-center gap-0.5 mt-6 -mb-px overflow-x-auto">
            {TABS.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 h-10 text-[12.5px] font-medium border-b-2 transition-colors whitespace-nowrap",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <t.icon className="size-3.5" />
                  {t.label}
                  {t.hint && (
                    <span className="text-[10px] text-muted-foreground/70 font-normal hidden lg:inline">· {t.hint}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6 w-full">
        {tab === "master" && <MasterTab onOpen={setProductOpen} />}
        {tab === "suppliers" && <SuppliersTab onOpen={setSupplierOpen} />}
        {tab === "inventory" && <InventoryTab />}
        {tab === "transfers" && <TransfersTab onOpen={setTransferOpen} onNew={() => setNewTransferOpen(true)} />}
        {tab === "kits" && <KitsTab onEdit={setKitEditOpen} onNew={() => setNewKitOpen(true)} />}
        {tab === "activity" && <ActivityTab />}
        {tab === "cold-chain" && <ColdChainTab onOpen={setUnitOpen} />}
        {tab === "invima" && <InvimaTab onOpen={setAlertOpen} />}
      </main>

      {productOpen && <ProductPanel product={productOpen} onClose={() => setProductOpen(null)} />}
      {supplierOpen && <SupplierPanel supplier={supplierOpen} onClose={() => setSupplierOpen(null)} />}
      {transferOpen && <TransferPanel transfer={transferOpen} onClose={() => setTransferOpen(null)} />}
      {kitEditOpen && <KitEditPanel kitId={kitEditOpen} onClose={() => setKitEditOpen(null)} />}
      {unitOpen && <ColdUnitPanel unit={unitOpen} onClose={() => setUnitOpen(null)} />}
      {alertOpen && <InvimaPanel alert={alertOpen} onClose={() => setAlertOpen(null)} />}
      {newProductOpen && <NewProductPanel onClose={() => setNewProductOpen(false)} />}
      {newSupplierOpen && <NewSupplierPanel onClose={() => setNewSupplierOpen(false)} />}
      {newTransferOpen && <NewTransferPanel onClose={() => setNewTransferOpen(false)} />}
      {newKitOpen && <NewKitPanel onClose={() => setNewKitOpen(false)} />}
    </div>
  );
}

// ============================================================
// PRIMARY ACTION (context-aware per tab)
// ============================================================
function PrimaryAction({
  tab, onNewProduct, onNewSupplier, onNewTransfer, onNewKit,
}: {
  tab: Tab;
  onNewProduct: () => void;
  onNewSupplier: () => void;
  onNewTransfer: () => void;
  onNewKit: () => void;
}) {
  const map: Partial<Record<Tab, { label: string; onClick: () => void }>> = {
    master: { label: "New product", onClick: onNewProduct },
    suppliers: { label: "New supplier", onClick: onNewSupplier },
    transfers: { label: "New transfer", onClick: onNewTransfer },
    kits: { label: "New kit", onClick: onNewKit },
    inventory: { label: "Adjust stock", onClick: () => runMockAction("Opening adjustment", { success: "Adjustment form ready" }) },
    activity: { label: "Export feed", onClick: () => runMockAction("Exporting activity", { success: "CSV ready · 248 events" }) },
    "cold-chain": { label: "Calibrate sensor", onClick: () => runMockAction("Opening sensor calibration", { success: "Sensor list loaded" }) },
    invima: { label: "Log alert", onClick: () => runMockAction("Logging INVIMA alert", { success: "Draft alert created" }) },
  };
  const cur = map[tab] ?? { label: "New", onClick: () => { } };
  return (
    <button
      onClick={cur.onClick}
      className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      <Plus className="size-3.5" /> {cur.label}
    </button>
  );
}

// ============================================================
// SHARED PRIMITIVES
// ============================================================
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-xl", className)}>{children}</div>
  );
}

function Kpi({ label, value, hint, tone = "default", icon: Icon }: {
  label: string; value: string | number; hint?: string;
  tone?: "default" | "warning" | "critical" | "success";
  icon?: typeof Boxes;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
          <p className={cn(
            "text-[22px] font-semibold tracking-tight mt-1 tabular-nums",
            tone === "warning" && "text-warning",
            tone === "critical" && "text-critical",
            tone === "success" && "text-success",
          )}>{value}</p>
          {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
        </div>
        {Icon && (
          <div className="size-8 rounded-lg bg-accent text-primary flex items-center justify-center shrink-0">
            <Icon className="size-4" />
          </div>
        )}
      </div>
    </Card>
  );
}

function SectionHeader({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        <h2 className="text-[14px] font-semibold tracking-tight">{title}</h2>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "primary" | "success" | "warning" | "critical" | "muted" }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap",
      tone === "default" && "bg-secondary text-foreground/80 border-border",
      tone === "primary" && "bg-accent text-primary border-accent",
      tone === "success" && "bg-success/10 text-success border-success/20",
      tone === "warning" && "bg-warning/10 text-warning border-warning/20",
      tone === "critical" && "bg-critical/10 text-critical border-critical/20",
      tone === "muted" && "bg-secondary text-muted-foreground border-border",
    )}>
      {children}
    </span>
  );
}

function ToolbarSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-8 pr-3 text-[12px] rounded-md border border-border bg-card focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}

function FilterBtn({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "inline-flex items-center gap-1 h-8 px-2.5 text-[11.5px] font-medium rounded-md border transition-colors",
      active ? "bg-accent text-primary border-accent" : "bg-card text-foreground/70 border-border hover:bg-secondary",
    )}>{children}</button>
  );
}

// ============================================================
// 1. MASTER TAB
// ============================================================
function MasterTab({ onOpen }: { onOpen: (p: MasterProduct) => void }) {

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error loading products:", error);
      return;
    }

    const mappedProducts: MasterProduct[] = (data || []).map((p: any) => ({
      code: p.id,
      name: p.name,
      generic: p.generic_name ?? "",
      category: p.category ?? "Medication",
      unit: p.unit_of_measure ?? "",
      presentation: p.presentation ?? "",
      reference: "",
      storage: p.storage_condition ?? "",
      active: p.active ?? true,
      invima: p.invima_registration ?? "",
      coldChain:
        p.temperature_min !== null ||
        p.temperature_max !== null,
      controlled: false,
      suppliers: [],
      stock: 0,
      reserved: 0,
      linkedKits: 0,
    }));

    setProducts(mappedProducts);
    setLoading(false);
  }

  const categories = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(products.map((p) => p.category))
      ),
    ],
    [products]
  );

  const filtered = products.filter(
    (p) =>
      (cat === "all" || p.category === cat) &&
      (!q ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.code.toLowerCase().includes(q.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading products...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          label="Registered products"
          value={products.length}
          hint="Across categories"
          icon={Package}
        />

        <Kpi
          label="Active"
          value={products.filter((p) => p.active).length}
          hint="Available to prescribe"
          icon={CheckCircle2}
          tone="success"
        />

        <Kpi
          label="Cold-chain items"
          value={products.filter((p) => p.coldChain).length}
          icon={Snowflake}
        />

        <Kpi
          label="Controlled drugs"
          value={products.filter((p) => p.controlled).length}
          hint="Require sign-out"
          icon={ShieldAlert}
          tone="warning"
        />
      </div>

      <Card>

        <div className="p-4 flex flex-wrap items-center gap-2 border-b border-border">

          <ToolbarSearch
            value={q}
            onChange={setQ}
            placeholder="Search by name, code or reference…"
          />

          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((c) => (
              <FilterBtn
                key={c}
                active={cat === c}
                onClick={() => setCat(c)}
              >
                {c === "all" ? "All categories" : c}
              </FilterBtn>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-[12px]">

            <thead className="bg-secondary/60 text-muted-foreground">
              <tr className="text-left">
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>Presentation</Th>
                <Th>Storage</Th>
                <Th>INVIMA</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>

            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.code}
                  onClick={() => onOpen(p)}
                  className="border-t border-border hover:bg-accent/30 cursor-pointer transition-colors"
                >
                  <Td>
                    <div className="flex items-center gap-2.5">

                      <div className="size-8 rounded-md bg-accent text-primary flex items-center justify-center shrink-0">
                        <PillIcon className="size-3.5" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {p.name}
                        </p>

                      </div>
                    </div>
                  </Td>

                  <Td>
                    <Pill tone="muted">
                      {p.category}
                    </Pill>
                  </Td>

                  <Td className="text-muted-foreground">
                    {p.presentation}
                  </Td>

                  <Td>
                    <span className="inline-flex items-center gap-1">
                      {p.coldChain && (
                        <Snowflake className="size-3 text-primary" />
                      )}

                      {p.storage}
                    </span>
                  </Td>

                  <Td className="text-[10.5px] font-mono text-muted-foreground truncate max-w-[160px]">
                    {p.invima}
                  </Td>

                  <Td>
                    {p.active ? (
                      <Pill tone="success">
                        Active
                      </Pill>
                    ) : (
                      <Pill tone="muted">
                        Inactive
                      </Pill>
                    )}

                    {p.controlled && (
                      <span className="ml-1">
                        <Pill tone="warning">
                          Controlled
                        </Pill>
                      </span>
                    )}
                  </Td>

                  <Td>
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  </Td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </Card>
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider", className)}>{children}</th>;
}
function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}

// ============================================================
// 2. SUPPLIERS TAB
// ============================================================

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "warning" | "success" | "critical";
}) {
  return (
    <div className="rounded-md bg-secondary/60 px-2.5 py-1.5">
      <p className="text-[9.5px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </p>

      <p
        className={cn(
          "text-[13px] font-semibold tabular-nums",
          tone === "warning" && "text-warning",
          tone === "success" && "text-success",
          tone === "critical" && "text-critical"
        )}
      >
        {value}
      </p>
    </div>
  );
}
function SuppliersTab({ onOpen }: { onOpen: (s: Supplier) => void }) {
  const [q, setQ] = useState("");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSuppliers = async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");

      console.log("SUPPLIERS DATA", data);
      console.log("SUPPLIERS ERROR", error);

      if (data) {
        const mapped: Supplier[] = data.map((s: any) => ({
          id: s.id,
          name: s.name ?? "Unknown supplier",
          nit: s.nit ?? "-",
          contact: s.contact_name ?? "-",
          phone: s.phone ?? "-",
          email: s.email ?? "-",
          address: s.address ?? "-",
          active: s.active ?? true,

          // mock placeholders mientras no existan relaciones reales
          products: 0,
          openLots: 0,
          performance: 1,
          lastDelivery: "—",
          notes: "",
          categories: [],
        }));

        setSuppliers(mapped);
      }

      setLoading(false);
    };

    loadSuppliers();
  }, []);

  const filtered = suppliers.filter(
    (s) =>
      !q ||
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.nit.includes(q)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          label="Active suppliers"
          value={suppliers.filter((s) => s.active).length}
          icon={Factory}
        />

        <Kpi
          label="Open lots"
          value={suppliers.reduce((s, x) => s + x.openLots, 0)}
          icon={Layers}
        />

        <Kpi
          label="Suspended"
          value={suppliers.filter((s) => !s.active).length}
          hint="Compliance hold"
          tone="warning"
          icon={AlertTriangle}
        />

        <Kpi
          label="Avg performance"
          value={`${suppliers.length
              ? Math.round(
                (suppliers.reduce((s, x) => s + x.performance, 0) /
                  suppliers.length) *
                100
              )
              : 0
            }%`}
          hint="On-time & quality"
          icon={TrendingUp}
          tone="success"
        />
      </div>

      <Card>
        <div className="p-4 border-b border-border">
          <ToolbarSearch
            value={q}
            onChange={setQ}
            placeholder="Search supplier or NIT…"
          />
        </div>

        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">
            Loading suppliers...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => onOpen(s)}
                className="text-left bg-card border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="size-9 rounded-md bg-accent text-primary flex items-center justify-center shrink-0">
                      <Building2 className="size-4" />
                    </div>

                    <div>
                      <p className="text-[13px] font-semibold tracking-tight">
                        {s.name}
                      </p>

                      <p className="text-[10.5px] font-mono text-muted-foreground">
                        {s.nit}
                      </p>
                    </div>
                  </div>

                  {s.active ? (
                    <Pill tone="success">Active</Pill>
                  ) : (
                    <Pill tone="warning">Suspended</Pill>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                  <Stat label="Products" value={s.products} />

                  <Stat label="Open lots" value={s.openLots} />

                  <Stat
                    label="Performance"
                    value={`${Math.round(s.performance * 100)}%`}
                    tone={
                      s.performance < 0.85 ? "warning" : "success"
                    }
                  />
                </div>

                <p className="text-[11px] text-muted-foreground mt-3 truncate">
                  Last delivery · {s.lastDelivery}
                </p>

                {s.notes && (
                  <p className="text-[11px] text-warning mt-2 line-clamp-2">
                    ⚠ {s.notes}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================
// 3. INVENTORY TAB
// ============================================================

function InventoryTab() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<LotStatus | "all">("all");
  const [adjLot, setAdjLot] = useState<string | null>(null);

  // ============================================================
  // REAL DATA FROM SUPABASE
  // ============================================================

  const [lots, setLots] = useState<any[]>([]);

  useEffect(() => {
    const loadLots = async () => {
      const { data, error } = await supabase
        .from("inventory_lots")
        .select(`
          id,
          manufacturer_lot,
          expiration_date,
          status,
          quantity_initial,
          quantity_available,
          quantity_reserved,
          unit_cost,

          products (
            name,
            unit_of_measure,
            storage_condition
          ),

          suppliers (
            name
          ),

          locations (
            name
          )
        `);
      console.log("LOTS DATA", data);
      console.log("LOTS ERROR", error);

      if (error) {
        console.error(error);
        return;
      }

      const mapped = (data ?? []).map((l: any) => {
        const expiryDate = l.expiration_date
          ? new Date(l.expiration_date)
          : null;

        const now = new Date();

        const daysToExpiry = expiryDate
          ? Math.ceil(
            (expiryDate.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
          )
          : 0;

        return {
          id: l.id,

          manufacturerLot: l.manufacturer_lot ?? "—",

          product: l.products?.name ?? "Unknown product",

          supplier: l.suppliers?.name ?? "Unknown supplier",

          location: l.locations?.name ?? "Unknown warehouse",

          available: Number(l.quantity_available ?? 0),

          reserved: Number(l.quantity_reserved ?? 0),

          total: Number(l.quantity_initial ?? 0),

          cost: Number(l.unit_cost ?? 0),

          expiry: l.expiration_date ?? "—",

          daysToExpiry,

          unit: l.products?.unit_of_measure ?? "units",

          tempRequirement:
            l.products?.storage_condition ?? "N/A",

          coldChain:
            l.products?.storage_condition
              ?.toLowerCase()
              .includes("cold") ?? false,

          status: (l.status ?? "available") as LotStatus,
        };
      });

      setLots(mapped);
    };

    loadLots();
  }, []);

  // ============================================================
  // FILTERS
  // ============================================================

  const filtered = lots.filter(
    (l) =>
      (statusFilter === "all" || l.status === statusFilter) &&
      (!q ||
        l.product.toLowerCase().includes(q.toLowerCase()) ||
        l.id.toLowerCase().includes(q.toLowerCase()))
  );

  // ============================================================
  // KPIs
  // ============================================================

  const totalValue = lots.reduce(
    (s, l) => s + l.cost * l.total,
    0
  );

  const reserved = lots.reduce(
    (s, l) => s + l.reserved,
    0
  );

  const quarantined = lots.filter(
    (l) =>
      l.status === "quarantined" ||
      l.status === "blocked"
  ).length;

  const expiringSoon = lots.filter(
    (l) =>
      l.daysToExpiry > 0 &&
      l.daysToExpiry <= 60
  ).length;

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          label="Inventory value"
          value={`$${(totalValue / 1000).toFixed(1)}k`}
          icon={Layers}
        />

        <Kpi
          label="Units reserved"
          value={reserved}
          hint="Across active cases"
          icon={CircleDot}
          tone="default"
        />

        <Kpi
          label="Quarantined / blocked"
          value={quarantined}
          tone={quarantined > 0 ? "warning" : "default"}
          icon={ShieldAlert}
        />

        <Kpi
          label="Expiring ≤ 60 days"
          value={expiringSoon}
          tone={expiringSoon > 0 ? "warning" : "default"}
          icon={Clock}
        />
      </div>

      <Card>
        <div className="p-4 flex flex-wrap items-center gap-2 border-b border-border">
          <ToolbarSearch
            value={q}
            onChange={setQ}
            placeholder="Search lot or product…"
          />

          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                "all",
                "available",
                "reserved",
                "quarantined",
                "blocked",
                "expired",
              ] as const
            ).map((s) => (
              <FilterBtn
                key={s}
                active={statusFilter === s}
                onClick={() =>
                  setStatusFilter(
                    s as LotStatus | "all"
                  )
                }
              >
                {s[0].toUpperCase() + s.slice(1)}
              </FilterBtn>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-secondary/60 text-muted-foreground">
              <tr className="text-left">
                <Th>Lot</Th>
                <Th>Product</Th>
                <Th>Warehouse</Th>
                <Th className="text-right">Available</Th>
                <Th className="text-right">Reserved</Th>
                <Th>Expires</Th>
                <Th>FEFO</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>

            <tbody>
              {filtered.map((l, idx) => {
                const expSoon =
                  l.daysToExpiry > 0 &&
                  l.daysToExpiry <= 60;

                const expired =
                  l.daysToExpiry <= 0;

                return (
                  <tr
                    key={l.id}
                    className="border-t border-border hover:bg-accent/30 transition-colors"
                  >
                    <Td>
                      <Link
                        to="/inventory/lots/$lotId"
                        params={{ lotId: l.id }}
                        className="font-mono text-[11px] text-primary hover:underline"
                      >
                        {l.id}
                      </Link>

                      <p className="text-[10px] text-muted-foreground">
                        {l.manufacturerLot}
                      </p>
                    </Td>

                    <Td>
                      <p className="font-semibold text-foreground">
                        {l.product}
                      </p>

                      <p className="text-[10.5px] text-muted-foreground">
                        {l.supplier}
                      </p>
                    </Td>

                    <Td>
                      <p className="text-foreground">
                        {l.location}
                      </p>

                      <p className="text-[10.5px] text-muted-foreground inline-flex items-center gap-1">
                        {l.coldChain && (
                          <Snowflake className="size-2.5 text-primary" />
                        )}

                        {l.tempRequirement}
                      </p>
                    </Td>

                    <Td className="text-right tabular-nums font-semibold">
                      {l.available}

                      <span className="text-muted-foreground font-normal">
                        {" "}
                      </span>
                    </Td>

                    <Td className="text-right tabular-nums text-muted-foreground">
                      {l.reserved}
                    </Td>

                    <Td>
                      <p
                        className={cn(
                          "font-medium",
                          expired && "text-critical",
                          expSoon && "text-warning"
                        )}
                      >
                        {l.expiry}
                      </p>

                      <p className="text-[10px] text-muted-foreground">
                        {expired
                          ? `${Math.abs(
                            l.daysToExpiry
                          )}d ago`
                          : `in ${l.daysToExpiry}d`}
                      </p>
                    </Td>

                    <Td>
                      {idx === 0 && (
                        <Pill tone="primary">
                          #1 FEFO
                        </Pill>
                      )}

                      {idx === 1 && (
                        <Pill tone="muted">
                          #2
                        </Pill>
                      )}
                    </Td>
                    <Td><LotStatusBadge status={String(l.status)} /></Td>

                    <Td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setAdjLot(l.id)}
                          className="size-7 rounded hover:bg-secondary inline-flex items-center justify-center text-muted-foreground"
                          title="Adjust"
                        >
                          <Pencil className="size-3.5" />
                        </button>

                        <Link
                          to="/inventory/lots/$lotId"
                          params={{ lotId: l.id }}
                          className="size-7 rounded hover:bg-secondary inline-flex items-center justify-center text-muted-foreground"
                        >
                          <Eye className="size-3.5" />
                        </Link>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {adjLot && (
        <AdjustmentPanel
          lotId={adjLot}
          onClose={() => setAdjLot(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// LOT STATUS BADGE
// ============================================================

function LotStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase() as LotStatus;

  const map: Record<
    LotStatus,
    { label: string; tone: Parameters<typeof Pill>[0]["tone"] }
  > = {
    available: { label: "Available", tone: "success" },
    reserved: { label: "Reserved", tone: "primary" },
    quarantined: { label: "Quarantined", tone: "warning" },
    expired: { label: "Expired", tone: "critical" },
    blocked: { label: "Blocked", tone: "critical" },
    consumed: { label: "Consumed", tone: "muted" },
    returned: { label: "Returned", tone: "muted" },
    destroyed: { label: "Destroyed", tone: "muted" },
  };

  const m = map[normalized];

  if (!m) {
    return <Pill tone="muted">{status}</Pill>;
  }

  return <Pill tone={m.tone}>{m.label}</Pill>;
}
// ============================================================
// 4. TRANSFERS TAB
// ============================================================

function TransfersTab({
  onOpen,
  onNew,
}: {
  onOpen: (t: Transfer) => void;
  onNew: () => void;
}) {
  const [filter, setFilter] =
    useState<TransferStatus | "all">("all");

  const [transfers, setTransfers] =
    useState<Transfer[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadTransfers();
  }, []);

  async function loadTransfers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("inventory_movements")
      .select(`
        id,
        created_at,
        movement_type,
        quantity,
        reason,

        inventory_lots!inventory_movements_lot_id_fkey (
          id,
          internal_lot_code,

          products (
            id,
            name,
            unit_of_measure
          )
        ),

        source_location:locations!inventory_movements_source_location_id_fkey (
          id,
          name
        ),

        destination_location:locations!inventory_movements_destination_location_id_fkey (
          id,
          name
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    console.log("MOVEMENTS DATA", data);
    console.log("MOVEMENTS ERROR", error);

    if (error || !data) {
      setTransfers([]);
      setLoading(false);
      return;
    }

    const mapped: Transfer[] = data.map(
      (m: any) => {
        let status: TransferStatus =
          "pending";

        let requester = "System";
        let receiver = "System";

        // =====================================================
        // MOVEMENT TYPE LOGIC
        // =====================================================

        if (
          m.movement_type ===
          "transfer"
        ) {
          status = "in-transit";

          requester =
            m.source_location?.name ??
            "Origin";

          receiver =
            m.destination_location
              ?.name ?? "Destination";
        }

        if (
          m.movement_type ===
          "reservation"
        ) {
          status = "approved";

          requester = "Prescription";

          receiver =
            m.destination_location
              ?.name ??
            "Reserved stock";
        }

        if (
          m.movement_type ===
          "consumed"
        ) {
          status = "received";

          requester =
            m.source_location?.name ??
            "Inventory";

          receiver = "Patient";
        }

        if (
          m.movement_type ===
          "cancelled"
        ) {
          status = "cancelled";
        }

        // =====================================================
        // FROM / TO DISPLAY
        // =====================================================

        let from =
          m.source_location?.name ??
          "Unknown";

        let to =
          m.destination_location?.name ??
          "Unknown";

        // RESERVATIONS

        if (
          m.movement_type ===
          "reservation"
        ) {
          from =
            m.source_location?.name ??
            "Main Pharmacy";

          to =
            m.destination_location
              ?.name ??
            "Reserved Prescriptions";
        }

        // CONSUMED

        if (
          m.movement_type ===
          "consumed"
        ) {
          to = "Patient administration";
        }

        return {
          id: m.id,

          created: new Date(
            m.created_at
          ).toLocaleDateString(),

          from,

          to,

          requester,

          receiver,

          status,

          reason:
            m.reason ?? undefined,

          items: [
            {
              product:
                m.inventory_lots
                  ?.products?.name ??
                "Unknown product",

              lot:
                m.inventory_lots
                  ?.internal_lot_code ??
                m.inventory_lots?.id ??
                "-",

              qty: Number(
                m.quantity ?? 0
              ),

              unit:
                m.inventory_lots
                  ?.products
                  ?.unit_of_measure ??
                "u",
            },
          ],
        };
      }
    );

    console.log(
      "MAPPED TRANSFERS",
      mapped
    );

    setTransfers(mapped);

    setLoading(false);
  }

  const filtered = transfers.filter(
    (t) =>
      filter === "all" ||
      t.status === filter
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi
          label="Pending"
          value={
            transfers.filter(
              (t) =>
                t.status === "pending"
            ).length
          }
          tone="warning"
          icon={Clock}
        />

        <Kpi
          label="Approved"
          value={
            transfers.filter(
              (t) =>
                t.status ===
                "approved"
            ).length
          }
          icon={CheckCircle2}
        />

        <Kpi
          label="In transit"
          value={
            transfers.filter(
              (t) =>
                t.status ===
                "in-transit"
            ).length
          }
          tone="default"
          icon={Truck}
        />

        <Kpi
          label="Received"
          value={
            transfers.filter(
              (t) =>
                t.status ===
                "received"
            ).length
          }
          tone="success"
          icon={CheckCircle2}
        />

        <Kpi
          label="Cancelled"
          value={
            transfers.filter(
              (t) =>
                t.status ===
                "cancelled"
            ).length
          }
          icon={XCircle}
        />
      </div>

      <Card>
        <div className="p-4 flex flex-wrap items-center justify-between gap-2 border-b border-border">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                "all",
                "pending",
                "approved",
                "in-transit",
                "received",
                "cancelled",
              ] as const
            ).map((s) => (
              <FilterBtn
                key={s}
                active={filter === s}
                onClick={() =>
                  setFilter(s)
                }
              >
                {s[0].toUpperCase() +
                  s.slice(1)}
              </FilterBtn>
            ))}
          </div>

          <button
            onClick={onNew}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[11.5px] font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            New transfer
          </button>
        </div>

        <div className="divide-y divide-border">
          {loading && (
            <div className="p-6 text-[12px] text-muted-foreground">
              Loading movements...
            </div>
          )}

          {!loading &&
            filtered.length ===
            0 && (
              <div className="p-6 text-[12px] text-muted-foreground">
                No inventory
                movements found
              </div>
            )}

          {!loading &&
            filtered.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  onOpen(t)
                }
                className="w-full text-left grid grid-cols-12 gap-3 px-4 py-3.5 hover:bg-accent/30 transition-colors items-center"
              >
                <div className="col-span-2">
                  <p className="font-mono text-[11.5px] text-primary font-semibold">
                    {t.id.slice(0, 8)}
                  </p>

                  <p className="text-[10.5px] text-muted-foreground">
                    {t.created}
                  </p>
                </div>

                <div className="col-span-4 flex items-center gap-2 text-[12px]">
                  <span className="font-medium text-foreground truncate">
                    {t.from}
                  </span>

                  <ArrowRight className="size-3 text-muted-foreground shrink-0" />

                  <span className="font-medium text-foreground truncate">
                    {t.to}
                  </span>
                </div>

                <div className="col-span-3 text-[11.5px] text-muted-foreground truncate">
                  {t.items.length} item
                  {t.items.length > 1
                    ? "s"
                    : ""}
                  {" · "}
                  {t.items
                    .map(
                      (i) => i.product
                    )
                    .join(", ")}
                </div>

                <div className="col-span-2 text-[11.5px] text-muted-foreground truncate">
                  {t.requester}
                </div>

                <div className="col-span-1 text-right">
                  <TransferStatusBadge
                    status={t.status}
                  />
                </div>
              </button>
            ))}
        </div>
      </Card>
    </div>
  );
}

function TransferStatusBadge({
  status,
}: {
  status: TransferStatus;
}) {
  const map: Record<
    TransferStatus,
    {
      label: string;
      tone:
      Parameters<
        typeof Pill
      >[0]["tone"];
    }
  > = {
    pending: {
      label: "Pending",
      tone: "warning",
    },

    approved: {
      label: "Approved",
      tone: "primary",
    },

    "in-transit": {
      label: "In transit",
      tone: "default",
    },

    received: {
      label: "Received",
      tone: "success",
    },

    cancelled: {
      label: "Cancelled",
      tone: "muted",
    },
  };

  return (
    <Pill tone={map[status].tone}>
      {map[status].label}
    </Pill>
  );
}
// ============================================================
// 5. KITS TAB
// ============================================================
function KitsTab({ onEdit, onNew }: { onEdit: (id: string) => void; onNew: () => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Active kits" value={KITS.length} icon={Boxes} />
        <Kpi label="Used (30d)" value={KITS.reduce((s, k) => s + k.used, 0)} icon={TrendingUp} tone="success" />
        <Kpi label="Reserved" value={KITS.reduce((s, k) => s + k.reserved, 0)} icon={CircleDot} />
        <Kpi label="Kits at risk" value={KITS.filter(k => k.risk === "shortage").length} tone="warning" icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {KITS.map(k => {
          const shortage = k.components.filter(c => c.available < c.qty * 3);
          return (
            <Card key={k.id} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold tracking-tight">{k.name}</h3>
                    {k.risk === "shortage" && <Pill tone="warning">Shortage risk</Pill>}
                  </div>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5">{k.procedure} · v1.2 · {k.used} uses (30d)</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onEdit(k.id)} className="h-8 px-2.5 rounded-md border border-border bg-card hover:bg-secondary text-[11px] font-medium inline-flex items-center gap-1">
                    <Pencil className="size-3" /> Edit
                  </button>
                  <button
                    onClick={() => runMockAction(`Duplicating ${k.name}`, { success: `Created ${k.name} (copy)` })}
                    className="size-8 rounded-md border border-border bg-card hover:bg-secondary inline-flex items-center justify-center"
                    title="Duplicate"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {k.components.map(c => {
                  const ok = c.available >= c.qty * 3;
                  return (
                    <div key={c.name} className="flex items-center justify-between gap-3 text-[12px] py-1.5 px-2.5 rounded-md hover:bg-secondary/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <CircleDot className={cn("size-2.5 shrink-0", ok ? "text-success" : "text-warning")} />
                        <span className="truncate">{c.name}</span>
                      </div>
                      <div className="text-[11px] tabular-nums shrink-0">
                        <span className="font-semibold">{c.qty} {c.unit}</span>
                        <span className={cn("text-muted-foreground ml-2", !ok && "text-warning")}>
                          · {c.available} avail
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Layers className="size-3" /> {k.components.length} components
                </div>
                <button
                  onClick={() => runMockAction(`Preparing ${k.name}`, { detail: "Reserving lots · FEFO", success: "Tray ready for delivery" })}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-[11.5px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Prepare tray <ArrowRight className="size-3" />
                </button>
              </div>

              {shortage.length > 0 && (
                <div className="mt-3 rounded-md bg-warning/10 border border-warning/20 px-3 py-2 text-[11px] text-warning">
                  ⚠ {shortage.length} component{shortage.length > 1 ? "s" : ""} below safe threshold
                </div>
              )}
            </Card>
          );
        })}

        <button
          onClick={onNew}
          className="rounded-xl border-2 border-dashed border-border bg-card/50 hover:bg-accent/30 hover:border-primary/30 transition-colors p-6 flex flex-col items-center justify-center text-center text-muted-foreground min-h-[200px]"
        >
          <div className="size-10 rounded-full bg-accent text-primary flex items-center justify-center mb-2">
            <Plus className="size-5" />
          </div>
          <p className="text-[13px] font-semibold text-foreground">Create new kit</p>
          <p className="text-[11px] mt-0.5">Build a procedure tray from the catalog</p>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 6. ACTIVITY TAB
// ============================================================
function ActivityTab() {
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dispensingId, setDispensingId] = useState<string | null>(null);

  const loadPendingDispense = async () => {
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
      console.error("Error loading reserved lots:", JSON.stringify(lotError, null, 2));
      notify("Error", lotError.message || "No se pudieron cargar los lotes reservados.");
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
        console.error(
          "Error loading prescription items:",
          JSON.stringify(prescriptionItemError, null, 2),
        );
        notify(
          "Error",
          prescriptionItemError.message || "No se pudieron cargar los ítems de prescripción.",
        );
      }

      const validPrescriptionItems = (prescriptionItemRows ?? []).filter((item: any) => {
        const status = String(item.status ?? "").toLowerCase();
        const inventoryStatus = String(item.inventory_status ?? "").toLowerCase();

        return (
          status !== "dispensed" &&
          status !== "cancelled" &&
          status !== "canceled" &&
          inventoryStatus !== "dispensed" &&
          inventoryStatus !== "cancelled" &&
          inventoryStatus !== "canceled"
        );
      });

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

      console.log("RESERVED LOT PRODUCT IDS", productIds);
      console.log("PRESCRIPTION ITEMS FOUND", validPrescriptionItems);
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
        console.error(
          "Error loading prescriptions:",
          JSON.stringify(prescriptionError, null, 2),
        );
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

      console.log("PRESCRIPTIONS FOUND", prescriptionRows);
    }

    /**
     * prescriptions.clinic_patient_id apunta al id de clinic_persons.
     */
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
        console.error(
          "Error loading clinic persons:",
          JSON.stringify(clinicPersonError, null, 2),
        );
        notify(
          "Error",
          clinicPersonError.message || "No se pudieron cargar los pacientes clínicos.",
        );
      }

      clinicPersonsById = new Map(
        (clinicPersonRows ?? []).map((clinicPerson: any) => [
          clinicPerson.id,
          clinicPerson,
        ]),
      );

      console.log("CLINIC PERSONS FOUND", clinicPersonRows);
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
        console.error("Error loading persons:", JSON.stringify(personError, null, 2));
        notify("Error", personError.message || "No se pudieron cargar las personas.");
      }

      personsById = new Map(
        (personRows ?? []).map((person: any) => [person.id, person]),
      );

      console.log("PERSONS FOUND", personRows);
    }

    const prescriptionItemIds = Array.from(
      new Set(
        allPrescriptionItems
          .map((item: any) => item.id)
          .filter((id: string | null): id is string => Boolean(id)),
      ),
    );

    let dispensedPrescriptionItemIds = new Set<string>();

    if (prescriptionItemIds.length > 0) {
      const { data: dispensedRows, error: dispensedError } = await supabase
        .from("inventory_movements")
        .select(`
          id,
          related_prescription_item_id
        `)
        .eq("movement_type", "dispensed")
        .in("related_prescription_item_id", prescriptionItemIds);

      if (dispensedError) {
        console.error(
          "Error loading dispensed movements:",
          JSON.stringify(dispensedError, null, 2),
        );
      }

      dispensedPrescriptionItemIds = new Set(
        (dispensedRows ?? [])
          .map((row: any) => row.related_prescription_item_id)
          .filter(Boolean),
      );
    }

    const mappedItems: any[] = reservedLots.flatMap((lot: any): any[] => {
      const product = Array.isArray(lot.products) ? lot.products[0] : lot.products;
      const location = Array.isArray(lot.locations) ? lot.locations[0] : lot.locations;

      const prescriptionItems = prescriptionItemsByProductId.get(lot.product_id) ?? [];

      const notDispensedItems = prescriptionItems.filter(
        (item: any) => !dispensedPrescriptionItemIds.has(item.id),
      );

      if (notDispensedItems.length === 0) {
        return [
          {
            id: `lot-only-${lot.id}`,
            mode: "lot_only",
            canDispense: false,

            prescriptionItemId: null,
            prescriptionId: null,
            clinicPatientId: null,
            clinicPersonId: null,
            personId: null,

            lotId: lot.id,
            clinicId: lot.clinic_id,
            sourceLocationId: lot.location_id,

            relatedCaseId: null,
            relatedPatientId: null,
            relatedProcedureId: null,

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
              "No se encontró prescription_items.medication_id que coincida con inventory_lots.product_id, o la prescripción ya fue dispensada.",

            diagnostic: {
              type: "lot_without_prescription_item",
              lotProductId: lot.product_id,
              prescriptionItemsFound: prescriptionItems.length,
              notDispensedItemsFound: notDispensedItems.length,
            },

            lotAvailable: Number(lot.quantity_available ?? 0),
            lotReserved: Number(lot.quantity_reserved ?? 0),
            lotConsumed: Number(lot.quantity_consumed ?? 0),
          },
        ];
      }

      return notDispensedItems.map((prescriptionItem: any): any => {
        const prescription = prescriptionsById.get(prescriptionItem.prescription_id);

        const clinicPatientId = prescription?.clinic_patient_id ?? null;

        const clinicPerson = clinicPatientId
          ? clinicPersonsById.get(clinicPatientId)
          : null;

        const clinicPersonId = clinicPerson?.id ?? clinicPatientId ?? null;

        const personId = clinicPerson?.person_id ?? null;

        const person = personId ? personsById.get(personId) : null;

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

        const quantityToDeliver = Number(
          prescriptionItem.quantity_required ?? lot.quantity_reserved ?? 0,
        );

        return {
          id: `prescription-${prescriptionItem.id}-${lot.id}`,
          mode: "prescription_linked",
          canDispense: hasFullPatientLink,

          prescriptionItemId: prescriptionItem.id,
          prescriptionId: prescriptionItem.prescription_id,
          clinicPatientId,
          clinicPersonId,
          personId,

          lotId: lot.id,
          clinicId: lot.clinic_id,
          sourceLocationId: lot.location_id,

          relatedCaseId: null,
          relatedPatientId: personId,
          relatedProcedureId: null,

          patientName: hasFullPatientLink ? patientName : "Paciente no vinculado",
          patientDocument: person?.document_number ?? null,

          productName: product?.name ?? "Producto sin nombre",
          productUnit:
            prescriptionItem.quantity_unit ??
            product?.unit_of_measure ??
            "unit",

          lotCode:
            lot.manufacturer_lot ??
            lot.internal_lot_code ??
            lot.id ??
            "Sin lote",

          locationName: location?.name ?? "Ubicación no definida",

          quantity: quantityToDeliver,
          dose: prescriptionItem.dose ?? null,
          route: prescriptionItem.route ?? null,
          frequency: prescriptionItem.frequency ?? null,
          instructions: prescriptionItem.instructions ?? null,

          diagnostic: {
            type: "prescription_without_full_patient_link",
            prescriptionItemId: prescriptionItem.id,
            prescriptionId: prescriptionItem.prescription_id,
            clinicPatientId,
            clinicPersonId,
            clinicPersonFound: Boolean(clinicPerson),
            personId,
            personFound: Boolean(person),
          },

          lotAvailable: Number(lot.quantity_available ?? 0),
          lotReserved: Number(lot.quantity_reserved ?? 0),
          lotConsumed: Number(lot.quantity_consumed ?? 0),
        };
      });
    });

    setPendingItems(mappedItems);
    setLoading(false);
  };

  useEffect(() => {
    loadPendingDispense();
  }, []);

  const dispenseMedication = async (item: any) => {
    if (!item.canDispense) {
      notify(
        "No se puede entregar",
        "Este medicamento reservado todavía no tiene prescripción y paciente completamente vinculados.",
      );
      return;
    }

    if (!item.prescriptionItemId) {
      notify("Error", "No se encontró el prescription_item_id.");
      return;
    }

    if (!item.lotId) {
      notify("Error", "No se encontró el lote reservado.");
      return;
    }

    const quantityToDispense = Number(item.quantity ?? 0);

    if (!quantityToDispense || quantityToDispense <= 0) {
      notify("Cantidad inválida", "La cantidad a entregar no es válida.");
      return;
    }

    if (Number(item.lotReserved ?? 0) < quantityToDispense) {
      notify(
        "Reserva insuficiente",
        "La cantidad reservada del lote es menor a la cantidad a entregar.",
      );
      return;
    }

    setDispensingId(item.prescriptionItemId);

    const newReserved = Math.max(
      Number(item.lotReserved ?? 0) - quantityToDispense,
      0,
    );

    const newConsumed = Number(item.lotConsumed ?? 0) + quantityToDispense;

    const { error: lotError } = await supabase
      .from("inventory_lots")
      .update({
        quantity_reserved: newReserved,
        quantity_consumed: newConsumed,
      })
      .eq("id", item.lotId);

    if (lotError) {
      console.error("Error updating lot:", JSON.stringify(lotError, null, 2));
      notify("Error", lotError.message || "No se pudo actualizar el lote.");
      setDispensingId(null);
      return;
    }

    const movementPayload = {
      id: crypto.randomUUID(),
      clinic_id: item.clinicId,
      lot_id: item.lotId,
      inventory_reservation_id: null,
      movement_type: "dispensed",
      source_location_id: item.sourceLocationId,
      destination_location_id: null,
      quantity: quantityToDispense,
      related_case_id: item.relatedCaseId,
      related_patient_id: item.relatedPatientId,
      related_procedure_id: item.relatedProcedureId,
      related_prescription_item_id: item.prescriptionItemId,
      performed_by: null,
      reason: "Entrega de medicamento reservado al paciente",
      created_at: new Date().toISOString(),
    };

    const { error: movementError } = await supabase
      .from("inventory_movements")
      .insert(movementPayload);

    if (movementError) {
      console.error("Dispensed movement payload:", movementPayload);
      console.error(
        "Error inserting dispensed movement:",
        JSON.stringify(movementError, null, 2),
      );

      await supabase
        .from("inventory_lots")
        .update({
          quantity_reserved: item.lotReserved,
          quantity_consumed: item.lotConsumed,
        })
        .eq("id", item.lotId);

      notify(
        "Error",
        movementError.message || "No se pudo registrar la salida del inventario.",
      );

      setDispensingId(null);
      return;
    }

    const { error: prescriptionItemError } = await supabase
      .from("prescription_items")
      .update({
        status: "dispensed",
        inventory_status: "dispensed",
      })
      .eq("id", item.prescriptionItemId);

    if (prescriptionItemError) {
      console.error(
        "Error updating prescription item:",
        JSON.stringify(prescriptionItemError, null, 2),
      );

      notify(
        "Advertencia",
        "El inventario salió correctamente, pero no se pudo actualizar la prescripción.",
      );

      setDispensingId(null);
      await loadPendingDispense();
      return;
    }

    notify(
      "Medicamento entregado",
      `${item.productName} fue entregado a ${item.patientName}.`,
    );

    setDispensingId(null);
    await loadPendingDispense();
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4 border-b border-border flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Entrega de medicamentos al paciente
            </h3>

            <p className="text-[11px] text-muted-foreground mt-0.5">
              Lotes reservados vinculados a prescripciones y pacientes.
            </p>
          </div>

          <button
            onClick={loadPendingDispense}
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
            Cargando medicamentos pendientes por entregar...
          </div>
        )}

        {!loading && pendingItems.length === 0 && (
          <div className="p-6 text-[12px] text-muted-foreground">
            No hay medicamentos reservados pendientes por entregar.
          </div>
        )}

        {!loading && pendingItems.length > 0 && (
          <div className="divide-y divide-border">
            {pendingItems.map((item) => (
              <div
                key={item.id}
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
                    {item.canDispense
                      ? "Prescripción y paciente vinculados"
                      : "Vínculo incompleto"}
                  </p>

                  {item.prescriptionItemId && (
                    <p className="font-mono text-[10px] text-muted-foreground truncate">
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
                    Cantidad a entregar
                  </p>

                  <p className="text-sm font-semibold text-foreground">
                    {item.quantity} {item.productUnit}
                  </p>

                  <p className="text-[10px] text-muted-foreground mt-2">
                    Reservado lote
                  </p>

                  <p className="text-[11px] text-muted-foreground">
                    {item.lotReserved} {item.productUnit}
                  </p>
                </div>

                <div className="col-span-3 flex justify-end">
                  <button
                    onClick={() => dispenseMedication(item)}
                    disabled={
                      !item.canDispense ||
                      dispensingId === item.prescriptionItemId
                    }
                    className="text-[12px] px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {dispensingId === item.prescriptionItemId ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    Entregar al paciente
                  </button>
                </div>

                {item.instructions && (
                  <div
                    className={cn(
                      "col-start-4 col-span-9 text-[10.5px] border rounded-md px-2 py-1",
                      item.canDispense
                        ? "text-muted-foreground bg-secondary/60 border-border"
                        : "text-warning bg-warning/5 border-warning/20",
                    )}
                  >
                    {item.instructions}
                  </div>
                )}

                {!item.canDispense && item.diagnostic && (
                  <div className="col-start-4 col-span-9 text-[10px] bg-critical/5 border border-critical/15 text-critical rounded-md px-2 py-1">
                    Diagnóstico vínculo:{" "}
                    <span className="font-mono">
                      {JSON.stringify(item.diagnostic)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================
// 7. COLD CHAIN TAB
// ============================================================
function ColdChainTab({ onOpen }: { onOpen: (u: ColdUnit) => void }) {
  const ok = COLD_UNITS.filter(u => u.status === "ok").length;
  const incidents = COLD_UNITS.filter(u => u.status !== "ok").length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Storage units" value={COLD_UNITS.length} icon={Snowflake} />
        <Kpi label="Within range" value={ok} tone="success" icon={CheckCircle2} />
        <Kpi label="Active incidents" value={incidents} tone={incidents > 0 ? "warning" : "default"} icon={AlertTriangle} />
        <Kpi label="Affected lots" value={COLD_UNITS.filter(u => u.status !== "ok").reduce((s, u) => s + u.affectedLots, 0)} icon={Layers} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {COLD_UNITS.map(u => (
          <button
            key={u.id}
            onClick={() => onOpen(u)}
            className={cn(
              "text-left bg-card border rounded-xl p-4 hover:shadow-sm transition-all group",
              u.status === "critical" && "border-critical/30 bg-critical/5",
              u.status === "warning" && "border-warning/30 bg-warning/5",
              u.status === "offline" && "border-muted-foreground/20",
              u.status === "ok" && "border-border hover:border-primary/30",
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "size-9 rounded-md flex items-center justify-center shrink-0",
                  u.status === "ok" && "bg-accent text-primary",
                  u.status === "warning" && "bg-warning/15 text-warning",
                  u.status === "critical" && "bg-critical/15 text-critical",
                  u.status === "offline" && "bg-secondary text-muted-foreground",
                )}>
                  <Thermometer className="size-4" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold tracking-tight">{u.name}</p>
                  <p className="text-[10.5px] text-muted-foreground">{u.type} · {u.site}</p>
                </div>
              </div>
              <ColdStatusBadge status={u.status} />
            </div>

            <div className="flex items-baseline gap-2">
              <p className={cn(
                "text-[28px] font-semibold tabular-nums tracking-tight leading-none",
                u.status === "critical" && "text-critical",
                u.status === "warning" && "text-warning",
                u.status === "offline" && "text-muted-foreground",
              )}>
                {u.status === "offline" ? "—" : u.current}
              </p>
              <p className="text-[12px] text-muted-foreground">{u.unit}</p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Target {u.range}</p>

            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10.5px] text-muted-foreground">
              <span>{u.affectedLots} lots monitored</span>
              <span>{u.lastReading}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ColdStatusBadge({ status }: { status: ColdUnit["status"] }) {
  const map = {
    ok: { label: "OK", tone: "success" as const },
    warning: { label: "Warning", tone: "warning" as const },
    critical: { label: "Critical", tone: "critical" as const },
    offline: { label: "Offline", tone: "muted" as const },
  };
  return <Pill tone={map[status].tone}>{map[status].label}</Pill>;
}

// ============================================================
// 8. INVIMA TAB
// ============================================================
function InvimaTab({ onOpen }: { onOpen: (a: InvimaAlert) => void }) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? INVIMA_ALERTS : INVIMA_ALERTS.filter(a => a.type === filter);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Open alerts" value={INVIMA_ALERTS.filter(a => a.internalStatus !== "closed").length} tone="warning" icon={ShieldAlert} />
        <Kpi label="Critical" value={INVIMA_ALERTS.filter(a => a.severity === "critical").length} tone="critical" icon={AlertTriangle} />
        <Kpi label="Clinic impact" value={INVIMA_ALERTS.filter(a => a.clinicImpact).length} icon={Activity} />
        <Kpi label="Actioned (30d)" value={INVIMA_ALERTS.filter(a => a.internalStatus === "actioned" || a.internalStatus === "closed").length} tone="success" icon={CheckCircle2} />
      </div>

      <Card>
        <div className="p-4 flex flex-wrap items-center gap-2 border-b border-border">
          <div className="flex items-center gap-1.5 flex-wrap">
            {["all", "Recall", "Pharmacovigilance", "Technovigilance", "Falsified", "Expired"].map(f => (
              <FilterBtn key={f} active={filter === f} onClick={() => setFilter(f)}>{f === "all" ? "All" : f}</FilterBtn>
            ))}
          </div>
        </div>
        <ul className="divide-y divide-border">
          {filtered.map(a => (
            <button key={a.id} onClick={() => onOpen(a)} className="w-full text-left grid grid-cols-12 gap-3 px-5 py-4 hover:bg-accent/30 transition-colors items-start">
              <div className="col-span-2 text-[11px]">
                <p className="font-mono font-semibold text-primary">{a.id}</p>
                <p className="text-muted-foreground mt-0.5">{a.published}</p>
              </div>
              <div className="col-span-2"><Pill tone={a.severity === "critical" ? "critical" : a.severity === "warning" ? "warning" : "muted"}>{a.type}</Pill></div>
              <div className="col-span-5">
                <p className="text-[13px] font-semibold text-foreground">{a.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{a.source}</p>
                {a.actionTaken && (
                  <p className="text-[11px] text-muted-foreground mt-1.5 inline-flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-success" /> {a.actionTaken}
                  </p>
                )}
              </div>
              <div className="col-span-2 text-[11px] text-muted-foreground">
                {a.affectedProducts.length > 0 && <p className="text-foreground">{a.affectedProducts.join(", ")}</p>}
                {a.affectedLots.length > 0 && <p className="font-mono text-[10px]">{a.affectedLots.join(" · ")}</p>}
              </div>
              <div className="col-span-1 text-right">
                <Pill tone={a.internalStatus === "closed" ? "success" : a.internalStatus === "actioned" ? "primary" : a.internalStatus === "in-review" ? "warning" : "critical"}>
                  {a.internalStatus}
                </Pill>
              </div>
            </button>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// ============================================================
// SHARED PANEL SHELL
// ============================================================
function Panel({ title, subtitle, onClose, width = "max-w-2xl", children, footer }: {
  title: string; subtitle?: string; onClose: () => void; width?: string;
  children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <button onClick={onClose} aria-label="Close" className="flex-1 bg-foreground/30 backdrop-blur-[2px]" />
      <aside className={cn("w-full bg-card border-l border-border flex flex-col shadow-2xl", width)}>
        <header className="flex items-start justify-between gap-3 px-6 py-5 border-b border-border">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="size-8 rounded-md hover:bg-secondary inline-flex items-center justify-center text-muted-foreground">
            <X className="size-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="px-6 py-4 border-t border-border bg-secondary/40">{footer}</footer>}
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium mb-1">{label}</p>
      <div className="text-[12.5px] text-foreground">{children}</div>
    </div>
  );
}

function Input({ label, defaultValue, placeholder, type = "text" }: { label: string; defaultValue?: string; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">{label}</span>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1 w-full h-9 px-3 text-[12.5px] rounded-md border border-border bg-card focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-accent"
      />
    </label>
  );
}
function Textarea({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">{label}</span>
      <textarea
        placeholder={placeholder}
        rows={3}
        className="mt-1 w-full px-3 py-2 text-[12.5px] rounded-md border border-border bg-card focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-accent resize-none"
      />
    </label>
  );
}
function Select({ label, options, defaultValue }: { label: string; options: string[]; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">{label}</span>
      <select defaultValue={defaultValue} className="mt-1 w-full h-9 px-3 text-[12.5px] rounded-md border border-border bg-card focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-accent">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}
function Checkbox({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="inline-flex items-center gap-2 text-[12.5px] cursor-pointer">
      <input type="checkbox" defaultChecked={defaultChecked} className="size-4 rounded border-border accent-primary" />
      {label}
    </label>
  );
}

// ============================================================
// PRODUCT DETAIL PANEL
// ============================================================
function ProductPanel({ product, onClose }: { product: MasterProduct; onClose: () => void }) {
  const lots = LOTS.filter(l => l.product === product.name);
  const movements = MOVEMENTS.filter(m => m.product === product.name).slice(0, 5);
  return (
    <Panel
      title={product.name}
      subtitle={`${product.code} · ${product.generic}`}
      onClose={onClose}
      width="max-w-3xl"
      footer={
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => runMockAction(product.active ? "Deactivating product" : "Activating product", { success: "Status updated" })} className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary inline-flex items-center gap-1.5">
            <Power className="size-3.5" /> {product.active ? "Deactivate" : "Activate"}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary">Close</button>
            <button onClick={() => runMockAction("Saving product", { success: "Product updated" })} className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Save changes</button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-start gap-4 p-4 rounded-xl bg-accent/40 border border-accent">
          <div className="size-16 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
            <PillIcon className="size-6 text-primary" />
          </div>
          <div className="flex-1 grid grid-cols-3 gap-3 text-[12px]">
            <Stat label="In stock" value={product.stock} />
            <Stat label="Reserved" value={product.reserved} />
            <Stat label="Linked kits" value={product.linkedKits} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Generic name">{product.generic}</Field>
          <Field label="Category">{product.category}</Field>
          <Field label="Presentation">{product.presentation}</Field>
          <Field label="Reference">{product.reference}</Field>
          <Field label="Unit of measure">{product.unit}</Field>
          <Field label="Storage condition">
            <span className="inline-flex items-center gap-1.5">
              {product.coldChain && <Snowflake className="size-3.5 text-primary" />}
              {product.storage}
            </span>
          </Field>
          <Field label="INVIMA registration"><span className="font-mono text-[11px]">{product.invima}</span></Field>
          <Field label="Status">
            <div className="flex items-center gap-2">
              {product.active ? <Pill tone="success">Active</Pill> : <Pill tone="muted">Inactive</Pill>}
              {product.controlled && <Pill tone="warning">Controlled</Pill>}
            </div>
          </Field>
        </div>

        <div>
          <SectionHeader title="Suppliers" hint="Approved sources for this product" />
          <div className="space-y-2">
            {product.suppliers.map(sid => {
              const s = SUPPLIERS.find(x => x.id === sid);
              if (!s) return null;
              return (
                <div key={sid} className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-[12px]">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-3.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-[10.5px] text-muted-foreground font-mono">{s.nit}</p>
                    </div>
                  </div>
                  <Pill tone={s.active ? "success" : "warning"}>{s.active ? "Active" : "Suspended"}</Pill>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <SectionHeader title="Lots in stock" hint={`${lots.length} lots tracked`} />
          <div className="border border-border rounded-md overflow-hidden">
            {lots.length === 0 && <p className="p-4 text-[12px] text-muted-foreground text-center">No lots in inventory</p>}
            {lots.map(l => (
              <div key={l.id} className="flex items-center justify-between gap-3 px-3 py-2.5 border-b border-border last:border-0 text-[11.5px]">
                <div>
                  <p className="font-mono font-semibold text-primary">{l.id}</p>
                  <p className="text-muted-foreground">{l.location} · exp {l.expiry}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{l.available}/{l.total} {l.unit}</p>
                  <LotStatusBadge status={l.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="Recent movements" hint="Last 5 events" />
          <ol className="space-y-2">
            {movements.map(m => {
              const meta = movementMeta(m.type);
              return (
                <li key={m.id} className="flex items-center justify-between gap-3 text-[11.5px] border border-border rounded-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Pill tone={meta.tone === "neutral" ? "muted" : meta.tone}>{meta.label}</Pill>
                    <span className="text-foreground">{m.quantity} {m.unit}</span>
                    <span className="text-muted-foreground">· {m.user}</span>
                  </div>
                  <span className="text-muted-foreground">{m.ts}</span>
                </li>
              );
            })}
            {movements.length === 0 && <p className="text-[12px] text-muted-foreground text-center py-3">No recent activity</p>}
          </ol>
        </div>
      </div>
    </Panel>
  );
}

// ============================================================
// SUPPLIER PANEL
// ============================================================
function SupplierPanel({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
  const products = PRODUCTS.filter(p => p.suppliers.includes(supplier.id));
  const lots = LOTS.filter(l => products.some(p => p.name === l.product));
  return (
    <Panel
      title={supplier.name}
      subtitle={`${supplier.nit} · ${supplier.categories.join(", ")}`}
      onClose={onClose}
      width="max-w-3xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary">Close</button>
          <button onClick={() => runMockAction("Saving supplier", { success: "Supplier updated" })} className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Products" value={supplier.products} />
          <Stat label="Open lots" value={supplier.openLots} />
          <Stat label="Performance" value={`${Math.round(supplier.performance * 100)}%`} tone={supplier.performance < 0.85 ? "warning" : "success"} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Contact name">{supplier.contact}</Field>
          <Field label="Phone">{supplier.phone}</Field>
          <Field label="Email">{supplier.email}</Field>
          <Field label="Status">{supplier.active ? <Pill tone="success">Active</Pill> : <Pill tone="warning">Suspended</Pill>}</Field>
          <div className="col-span-2"><Field label="Address">{supplier.address}</Field></div>
        </div>

        {supplier.notes && (
          <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5 text-[11.5px] text-warning">
            ⚠ {supplier.notes}
          </div>
        )}

        <div>
          <SectionHeader title="Products supplied" />
          <div className="space-y-2">
            {products.map(p => (
              <div key={p.code} className="flex items-center justify-between border border-border rounded-md px-3 py-2 text-[12px]">
                <div className="flex items-center gap-2">
                  <PillIcon className="size-3 text-muted-foreground" />
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[10.5px] text-muted-foreground font-mono">{p.code}</span>
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums">{p.stock} in stock</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="Recent lots" />
          <div className="space-y-1.5">
            {lots.slice(0, 5).map(l => (
              <div key={l.id} className="flex items-center justify-between border border-border rounded-md px-3 py-2 text-[11.5px]">
                <div>
                  <span className="font-mono text-primary font-semibold">{l.id}</span>
                  <span className="text-muted-foreground"> · {l.product}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">exp {l.expiry}</span>
                  <LotStatusBadge status={l.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ============================================================
// TRANSFER PANEL
// ============================================================
function TransferPanel({ transfer, onClose }: { transfer: Transfer; onClose: () => void }) {
  const [status, setStatus] = useState(transfer.status);
  const flow: TransferStatus[] = ["pending", "approved", "in-transit", "received"];
  const next = flow[flow.indexOf(status) + 1];

  return (
    <Panel
      title={`Transfer ${transfer.id}`}
      subtitle={`${transfer.from} → ${transfer.to}`}
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => { setStatus("cancelled"); runMockAction("Cancelling transfer", { success: "Transfer cancelled" }); }}
            className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-critical/10 hover:text-critical hover:border-critical/30 inline-flex items-center gap-1.5"
          >
            <XCircle className="size-3.5" /> Cancel
          </button>
          {next && status !== "cancelled" && (
            <button
              onClick={() => { setStatus(next); runMockAction(`Marking ${next}`, { success: `Transfer ${next}` }); }}
              className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5"
            >
              Mark as {next} <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-xl bg-accent/40 border border-accent p-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Status</p>
            <div className="mt-1"><TransferStatusBadge status={status} /></div>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Created</p>
            <p className="text-[12.5px] font-medium mt-1">{transfer.created}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="From">{transfer.from}</Field>
          <Field label="To">{transfer.to}</Field>
          <Field label="Requested by">{transfer.requester}</Field>
          <Field label="Receiver">{transfer.receiver || <span className="text-muted-foreground">—</span>}</Field>
          {transfer.reason && <div className="col-span-2"><Field label="Reason">{transfer.reason}</Field></div>}
        </div>

        <div>
          <SectionHeader title="Items" />
          <div className="border border-border rounded-md divide-y divide-border">
            {transfer.items.map((i, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2.5 text-[12px]">
                <div>
                  <p className="font-medium">{i.product}</p>
                  <p className="text-[10.5px] text-muted-foreground font-mono">{i.lot}</p>
                </div>
                <p className="font-semibold tabular-nums">{i.qty}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="Audit trail" />
          <ol className="space-y-2 text-[11.5px]">
            <li className="flex items-center justify-between border border-border rounded-md px-3 py-2">
              <span><CheckCircle2 className="size-3 inline text-success mr-1.5" /> Requested by {transfer.requester}</span>
              <span className="text-muted-foreground">{transfer.created}</span>
            </li>
            {status !== "pending" && (
              <li className="flex items-center justify-between border border-border rounded-md px-3 py-2">
                <span><CheckCircle2 className="size-3 inline text-success mr-1.5" /> Approved by Pharmacy lead</span>
                <span className="text-muted-foreground">Today</span>
              </li>
            )}
            {(status === "in-transit" || status === "received") && (
              <li className="flex items-center justify-between border border-border rounded-md px-3 py-2">
                <span><Truck className="size-3 inline text-primary mr-1.5" /> Dispatched · in transit</span>
                <span className="text-muted-foreground">Today</span>
              </li>
            )}
            {status === "received" && (
              <li className="flex items-center justify-between border border-border rounded-md px-3 py-2">
                <span><CheckCircle2 className="size-3 inline text-success mr-1.5" /> Received by {transfer.receiver || "—"}</span>
                <span className="text-muted-foreground">Today</span>
              </li>
            )}
          </ol>
        </div>
      </div>
    </Panel>
  );
}

// ============================================================
// KIT EDIT PANEL
// ============================================================
function KitEditPanel({ kitId, onClose }: { kitId: string; onClose: () => void }) {
  const kit = KITS.find(k => k.id === kitId)!;
  const [items, setItems] = useState(kit.components.map(c => ({ ...c })));

  return (
    <Panel
      title={`Edit · ${kit.name}`}
      subtitle={`${kit.procedure} · ${items.length} components`}
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => runMockAction("Deactivating kit", { success: "Kit deactivated" })} className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary inline-flex items-center gap-1.5">
            <Power className="size-3.5" /> Deactivate
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary">Cancel</button>
            <button onClick={() => runMockAction("Saving kit v1.3", { success: "Kit updated · new version v1.3" })} className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Save as v1.3</button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Kit name" defaultValue={kit.name} />
          <Input label="Procedure" defaultValue={kit.procedure} />
        </div>
        <Textarea label="Description" placeholder="Notes for embryologist or surgeon" />

        <div>
          <SectionHeader title="Components" hint="Add, remove or adjust quantities" action={
            <button
              onClick={() => setItems([...items, { name: "Select product…", qty: 1, available: 0, unit: "unit" }])}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-[11.5px] font-medium rounded-md border border-border bg-card hover:bg-secondary"
            >
              <Plus className="size-3" /> Add component
            </button>
          } />
          <div className="border border-border rounded-md divide-y divide-border">
            {items.map((c, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center px-3 py-2.5">
                <select defaultValue={c.name} className="col-span-7 h-8 px-2 text-[12px] rounded-md border border-border bg-card">
                  <option>{c.name}</option>
                  {PRODUCTS.filter(p => p.name !== c.name).map(p => <option key={p.code}>{p.name}</option>)}
                </select>
                <input
                  type="number"
                  defaultValue={c.qty}
                  className="col-span-2 h-8 px-2 text-[12px] rounded-md border border-border bg-card text-right tabular-nums"
                />
                <span className="col-span-2 text-[11px] text-muted-foreground">{c.unit}</span>
                <button
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  className="col-span-1 size-7 rounded hover:bg-critical/10 hover:text-critical inline-flex items-center justify-center text-muted-foreground"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md bg-accent/40 border border-accent px-3 py-2.5 text-[11.5px] text-foreground/80 flex items-start gap-2">
          <Sparkles className="size-3.5 text-primary mt-0.5 shrink-0" />
          <span>
            <span className="font-semibold text-primary">AI suggestion · </span>
            Add HSA Solution 5% — used in 92% of similar trays at VITA Bogotá.
          </span>
        </div>
      </div>
    </Panel>
  );
}

// ============================================================
// COLD UNIT PANEL
// ============================================================
function ColdUnitPanel({ unit, onClose }: { unit: ColdUnit; onClose: () => void }) {
  return (
    <Panel
      title={unit.name}
      subtitle={`${unit.type} · ${unit.site}`}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => runMockAction("Acknowledging incident", { success: "Incident acknowledged" })} className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary">Acknowledge</button>
          <button onClick={() => runMockAction("Calibrating sensor", { detail: "Sending command to gateway", success: "Calibration complete" })} className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Calibrate sensor</button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-border p-5 text-center bg-accent/30">
          <p className={cn(
            "text-[48px] font-semibold tabular-nums leading-none",
            unit.status === "critical" && "text-critical",
            unit.status === "warning" && "text-warning",
            unit.status === "offline" && "text-muted-foreground",
          )}>
            {unit.status === "offline" ? "—" : `${unit.current}`}
            <span className="text-[20px] text-muted-foreground ml-1">{unit.unit}</span>
          </p>
          <p className="text-[11.5px] text-muted-foreground mt-2">Target {unit.range} · {unit.lastReading}</p>
          <div className="mt-3"><ColdStatusBadge status={unit.status} /></div>
        </div>

        <div>
          <SectionHeader title="Temperature log (24h)" />
          <div className="h-32 rounded-md border border-border bg-secondary/30 flex items-end gap-0.5 p-2">
            {Array.from({ length: 48 }).map((_, i) => {
              const noise = Math.sin(i / 3) * 1.2 + Math.cos(i / 5) * 0.6;
              const v = unit.status === "offline" ? 0 : Math.max(0.1, (unit.current + noise + 200) / 220);
              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-sm",
                    unit.status === "critical" ? "bg-critical/60" : unit.status === "warning" ? "bg-warning/60" : "bg-primary/40",
                  )}
                  style={{ height: `${Math.min(100, v * 100)}%` }}
                />
              );
            })}
          </div>
        </div>

        <div>
          <SectionHeader title="Affected lots" hint={`${unit.affectedLots} lots monitored`} />
          <div className="space-y-1.5">
            {LOTS.filter(l => l.coldChain).slice(0, 4).map(l => (
              <div key={l.id} className="flex items-center justify-between border border-border rounded-md px-3 py-2 text-[11.5px]">
                <div>
                  <span className="font-mono text-primary font-semibold">{l.id}</span>
                  <span className="text-muted-foreground"> · {l.product}</span>
                </div>
                <LotStatusBadge status={l.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ============================================================
// INVIMA PANEL
// ============================================================
function InvimaPanel({ alert, onClose }: { alert: InvimaAlert; onClose: () => void }) {
  return (
    <Panel
      title={alert.title}
      subtitle={`${alert.id} · ${alert.source}`}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => runMockAction("Marking as closed", { success: "Alert closed" })} className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary">Close alert</button>
          <button onClick={() => runMockAction("Logging action taken", { success: "Action recorded" })} className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Log action</button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Pill tone={alert.severity === "critical" ? "critical" : alert.severity === "warning" ? "warning" : "muted"}>{alert.severity}</Pill>
          <Pill tone="default">{alert.type}</Pill>
          {alert.clinicImpact && <Pill tone="critical">Clinic impact</Pill>}
          <Pill tone={alert.internalStatus === "closed" ? "success" : "primary"}>{alert.internalStatus}</Pill>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Published">{alert.published}</Field>
          <Field label="Source">{alert.source}</Field>
        </div>

        {alert.affectedProducts.length > 0 && (
          <div>
            <SectionHeader title="Affected products & lots" />
            <div className="space-y-1.5">
              {alert.affectedProducts.map(p => (
                <div key={p} className="flex items-center justify-between border border-border rounded-md px-3 py-2 text-[12px]">
                  <span className="font-medium">{p}</span>
                  <span className="font-mono text-[10.5px] text-muted-foreground">{alert.affectedLots.join(" · ") || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {alert.actionTaken && (
          <div>
            <SectionHeader title="Action taken" />
            <div className="rounded-md bg-success/5 border border-success/20 p-3 text-[12px] text-foreground">
              <CheckCircle2 className="size-3.5 text-success inline mr-1.5" />
              {alert.actionTaken}
            </div>
          </div>
        )}

        {alert.notes && (
          <div>
            <SectionHeader title="Notes" />
            <p className="text-[12px] text-muted-foreground">{alert.notes}</p>
          </div>
        )}

        <Textarea label="Add observation" placeholder="Document follow-up, patient impact, regulatory contact…" />
      </div>
    </Panel>
  );
}

// ============================================================
// CREATE FORMS
// ============================================================
function NewProductPanel({ onClose }: { onClose: () => void }) {
  return (
    <Panel title="New product" subtitle="Add to master catalog" onClose={onClose} width="max-w-2xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary">Cancel</button>
          <button onClick={() => { runMockAction("Creating product", { success: "Product added to catalog" }); onClose(); }} className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Create product</button>
        </div>
      }
    >
      <div className="space-y-4">
        <button className="w-full flex items-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/30 p-4 hover:border-primary/30 hover:bg-accent/30 transition-colors">
          <div className="size-12 rounded-md bg-card border border-border flex items-center justify-center">
            <Upload className="size-4 text-muted-foreground" />
          </div>
          <div className="text-left">
            <p className="text-[12.5px] font-medium">Upload product image</p>
            <p className="text-[11px] text-muted-foreground">PNG, JPG up to 5 MB</p>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Product code" placeholder="MED-XXX" />
          <Input label="Reference" placeholder="Manufacturer ref." />
          <Input label="Name" placeholder="Commercial name" />
          <Input label="Generic name" placeholder="INN" />
          <Select label="Category" options={["Hormone", "Medication", "Reagent", "Supply", "IVF Media", "Kit", "Anesthesia"]} />
          <Input label="Unit of measure" placeholder="vial, ampoule, capsule…" />
          <Input label="Presentation" placeholder="20ml bottle" />
          <Select label="Storage condition" options={["Room temp", "2 – 8 °C", "-20 °C", "-80 °C", "LN2"]} />
          <Input label="INVIMA registration" placeholder="INVIMA 20XXM-XXXXXX" />
          <Input label="Cold chain range" placeholder="2 – 8 °C" />
        </div>

        <div className="flex items-center gap-5 pt-2">
          <Checkbox label="Active" defaultChecked />
          <Checkbox label="Cold chain required" />
          <Checkbox label="Controlled medication" />
        </div>
      </div>
    </Panel>
  );
}

function NewSupplierPanel({ onClose }: { onClose: () => void }) {
  return (
    <Panel title="New supplier" onClose={onClose} width="max-w-2xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary">Cancel</button>
          <button onClick={() => { runMockAction("Creating supplier", { success: "Supplier added" }); onClose(); }} className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Create supplier</button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Name" />
          <Input label="NIT / Tax ID" />
          <Input label="Contact name" />
          <Input label="Phone" />
          <Input label="Email" />
          <Input label="Categories" placeholder="Hormone, Reagent…" />
          <div className="col-span-2"><Input label="Address" /></div>
        </div>
        <Textarea label="Notes" placeholder="Compliance, delivery preferences…" />
        <div className="pt-1"><Checkbox label="Active" defaultChecked /></div>
      </div>
    </Panel>
  );
}

function NewTransferPanel({ onClose }: { onClose: () => void }) {
  const [locations, setLocations] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);

  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [reason, setReason] = useState("");

  const [lines, setLines] = useState([
    {
      product: "",
      lot: "",
      qty: 1,
    },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // =========================
    // LOAD LOCATIONS
    // =========================
    const { data: locationsData } = await supabase
      .from("locations")
      .select(`
        id,
        name,
        type
      `)
      .eq("active", true)
      .order("name");

    // =========================
    // LOAD INVENTORY LOTS
    // =========================
    const { data: lotsData } = await supabase
      .from("inventory_lots")
      .select(`
        id,
        quantity_available,
        status,

        products (
          id,
          name,
          unit_of_measure
        ),

        locations (
          id,
          name
        )
      `)
      .gt("quantity_available", 0)
      .neq("status", "expired")
      .order("received_at", { ascending: true });

    console.log("LOCATIONS", locationsData);
    console.log("LOTS", lotsData);

    setLocations(locationsData ?? []);
    setLots(lotsData ?? []);
  }

  async function submitTransfer() {
    try {
      console.log("LINES", lines);

      for (const line of lines) {
        if (!line.lot || !line.qty) continue;

        const insertPayload = {
          clinic_id: "385f976d-2e25-4af3-91da-5d347acaa54f",

          lot_id: line.lot,

          movement_type: "transfer",

          source_location_id: fromWarehouse || null,

          destination_location_id: toWarehouse || null,

          quantity: Number(line.qty),

          reason: reason || null,

          created_at: new Date().toISOString(),
        };

        console.log("INSERT PAYLOAD", insertPayload);

        // ====================================================
        // INSERT MOVEMENT
        // ====================================================

        const { data, error } = await supabase
          .from("inventory_movements")
          .insert(insertPayload)
          .select();

        console.log("INSERT RESPONSE", data);
        console.log("INSERT ERROR", error);

        if (error) {
          alert(error.message);
          return;
        }

        // ====================================================
        // UPDATE LOT LOCATION
        // ====================================================

        const { error: updateError } = await supabase
          .from("inventory_lots")
          .update({
            location_id: toWarehouse,
          })
          .eq("id", line.lot);

        console.log("UPDATE ERROR", updateError);

        if (updateError) {
          alert(updateError.message);
          return;
        }
      }

      runMockAction("Submitting transfer", {
        detail: "Inventory movement registered",
        success: "Transfer created successfully",
      });

      onClose();

    } catch (err) {
      console.error("TRANSFER ERROR", err);
    }
  }

  return (
    <Panel
      title="New transfer"
      subtitle="Move stock between warehouses"
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary"
          >
            Cancel
          </button>

          <button
            onClick={submitTransfer}
            className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Submit transfer
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* ========================= */}
        {/* LOCATIONS */}
        {/* ========================= */}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
              From warehouse
            </span>

            <select
              value={fromWarehouse}
              onChange={(e) => setFromWarehouse(e.target.value)}
              className="mt-1 w-full h-9 px-3 rounded-md border border-border bg-card text-[12px]"
            >
              <option value="">Select warehouse</option>

              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
              To warehouse
            </span>

            <select
              value={toWarehouse}
              onChange={(e) => setToWarehouse(e.target.value)}
              className="mt-1 w-full h-9 px-3 rounded-md border border-border bg-card text-[12px]"
            >
              <option value="">Select warehouse</option>

              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* ========================= */}
        {/* REASON */}
        {/* ========================= */}

        <label className="block">
          <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
            Reason
          </span>

          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. IVF retrieval procedure"
            className="mt-1 w-full h-9 px-3 rounded-md border border-border bg-card text-[12px]"
          />
        </label>

        {/* ========================= */}
        {/* ITEMS */}
        {/* ========================= */}

        <div>
          <SectionHeader
            title="Items"
            action={
              <button
                onClick={() =>
                  setLines([
                    ...lines,
                    {
                      product: "",
                      lot: "",
                      qty: 1,
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 h-8 px-2.5 text-[11.5px] font-medium rounded-md border border-border bg-card hover:bg-secondary"
              >
                <Plus className="size-3" />
                Add line
              </button>
            }
          />

          <div className="space-y-2">
            {lines.map((line, i) => {
              const selectedLot = lots.find(
                (l) => l.id === line.lot
              );

              return (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 items-end"
                >
                  {/* PRODUCT */}
                  <div className="col-span-5">
                    <label className="block">
                      {i === 0 && (
                        <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                          Product
                        </span>
                      )}

                      <select
                        value={line.product}
                        onChange={(e) => {
                          const product = e.target.value;

                          setLines((prev) =>
                            prev.map((x, idx) =>
                              idx === i
                                ? {
                                  ...x,
                                  product,
                                  lot: "",
                                }
                                : x
                            )
                          );
                        }}
                        className="mt-1 w-full h-9 px-3 rounded-md border border-border bg-card text-[12px]"
                      >
                        <option value="">
                          Select product
                        </option>

                        {Array.from(
                          new Set(
                            lots.map(
                              (l) => l.products?.name
                            )
                          )
                        ).map((name) => (
                          <option
                            key={String(name)}
                            value={String(name)}
                          >
                            {String(name)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* LOT */}
                  <div className="col-span-4">
                    <label className="block">
                      {i === 0 && (
                        <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                          Lot
                        </span>
                      )}

                      <select
                        value={line.lot}
                        onChange={(e) => {
                          const lot = e.target.value;

                          setLines((prev) =>
                            prev.map((x, idx) =>
                              idx === i
                                ? {
                                  ...x,
                                  lot,
                                }
                                : x
                            )
                          );
                        }}
                        className="mt-1 w-full h-9 px-3 rounded-md border border-border bg-card text-[12px]"
                      >
                        <option value="">
                          Select lot
                        </option>

                        {lots
                          .filter(
                            (l) =>
                              l.products?.name ===
                              line.product
                          )
                          .map((l) => (
                            <option
                              key={l.id}
                              value={l.id}
                            >
                              {l.id.slice(0, 8)} ·{" "}
                              {l.quantity_available}{" "}
                              {l.products?.unit_of_measure}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>

                  {/* QTY */}
                  <div className="col-span-2">
                    <label className="block">
                      {i === 0 && (
                        <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                          Qty
                        </span>
                      )}

                      <input
                        type="number"
                        min={1}
                        max={
                          selectedLot?.quantity_available ?? 1
                        }
                        value={line.qty}
                        onChange={(e) => {
                          const qty = Number(
                            e.target.value
                          );

                          setLines((prev) =>
                            prev.map((x, idx) =>
                              idx === i
                                ? {
                                  ...x,
                                  qty,
                                }
                                : x
                            )
                          );
                        }}
                        className="mt-1 w-full h-9 px-3 rounded-md border border-border bg-card text-[12px]"
                      />
                    </label>
                  </div>

                  {/* DELETE */}
                  <button
                    onClick={() =>
                      setLines(
                        lines.filter((_, x) => x !== i)
                      )
                    }
                    className="col-span-1 size-9 rounded-md border border-border bg-card hover:bg-secondary inline-flex items-center justify-center text-muted-foreground"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function NewKitPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<{ name: string; qty: number; unit: string }[]>([]);
  return (
    <Panel title="New kit / procedure tray" onClose={onClose} width="max-w-2xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary">Cancel</button>
          <button onClick={() => { runMockAction("Creating kit v1.0", { success: "Kit created" }); onClose(); }} className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Create kit</button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Kit name" placeholder="e.g. Embryo transfer tray" />
          <Select label="Procedure" options={["IVF", "Egg retrieval", "Embryo transfer", "IUI", "Anesthesia", "Lab vitrification"]} />
        </div>
        <Textarea label="Notes" placeholder="Instructions for preparation" />
        <div>
          <SectionHeader title="Components" action={
            <button onClick={() => setItems([...items, { name: PRODUCTS[0].name, qty: 1, unit: PRODUCTS[0].unit }])} className="inline-flex items-center gap-1.5 h-8 px-2.5 text-[11.5px] font-medium rounded-md border border-border bg-card hover:bg-secondary">
              <Plus className="size-3" /> Add component
            </button>
          } />
          {items.length === 0 && (
            <p className="text-[12px] text-muted-foreground text-center py-6 border border-dashed border-border rounded-md">No components yet — add products from catalog</p>
          )}
          <div className="space-y-2">
            {items.map((c, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <select defaultValue={c.name} className="col-span-8 h-9 px-2 text-[12px] rounded-md border border-border bg-card">
                  {PRODUCTS.map(p => <option key={p.code}>{p.name}</option>)}
                </select>
                <input type="number" defaultValue={c.qty} className="col-span-3 h-9 px-2 text-[12px] rounded-md border border-border bg-card text-right tabular-nums" />
                <button onClick={() => setItems(items.filter((_, x) => x !== i))} className="col-span-1 size-9 rounded-md hover:bg-critical/10 hover:text-critical inline-flex items-center justify-center text-muted-foreground">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function AdjustmentPanel({ lotId, onClose }: { lotId: string; onClose: () => void }) {
  const lot = LOTS.find(l => l.id === lotId)!;
  return (
    <Panel title="Stock adjustment" subtitle={`${lot.id} · ${lot.product}`} onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary">Cancel</button>
          <button onClick={() => { runMockAction("Posting adjustment", { detail: "Audit log created", success: "Stock adjusted · movement logged" }); onClose(); }} className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Post adjustment</button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select label="Adjustment type" options={["Add stock", "Remove stock", "Manual correction", "Loss", "Expiration", "Damage", "Return", "Procedure consumption"]} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Quantity" defaultValue="1" type="number" />
          <Input label="Linked procedure / case" placeholder="FC-XXXX (optional)" />
        </div>
        <Textarea label="Reason (required)" placeholder="Documented reason for audit trail" />
        <div className="rounded-md bg-accent/30 border border-accent p-3 text-[11.5px] text-foreground/80">
          <History className="size-3.5 text-primary inline mr-1.5" />
          This adjustment will be permanent and recorded against your user, with timestamp and lot.
        </div>
      </div>
    </Panel>
  );
}