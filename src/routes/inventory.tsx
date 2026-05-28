import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  Plus,
  Search,
  Boxes,
  Activity,
  Layers,
  Snowflake,
  ShieldAlert,
  ChevronRight,
  Truck,
  Building2,
  Factory,
  Pill as PillIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  X,
  Upload,
  Pencil,
  Copy,
  Trash2,
  Power,
  Eye,
  Sparkles,
  TrendingUp,
  Thermometer,
  History,
  CircleDot,
  ArrowRightLeft,
  ScanLine,
  Send,
  ClipboardList,
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
  // { id: "activity", label: "Live activity", icon: Activity },
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
        {/* {tab === "activity" && <ActivityTab />} */}
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

type InventoryLotStatusLocal =
  | "available"
  | "reserved"
  | "quarantined"
  | "expired"
  | "blocked"
  | "consumed"
  | "returned"
  | "destroyed";

type InventoryLotView = {
  id: string;
  manufacturerLot: string;
  product: string;
  supplier: string;
  location: string;
  locationId: string | null;
  available: number;
  reserved: number;
  total: number;
  consumed: number;
  cost: number;
  expiry: string;
  daysToExpiry: number;
  unit: string;
  tempRequirement: string;
  coldChain: boolean;
  status: InventoryLotStatusLocal;
};

type InventoryAdjustmentType =
  | "ADD_STOCK"
  | "REMOVE_STOCK"
  | "DAMAGE_LOSS"
  | "DESTROY_STOCK"
  | "QUARANTINE"
  | "BLOCK"
  | "RELEASE";

function InventoryTab() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<InventoryLotStatusLocal | "all">("all");

  const [adjLot, setAdjLot] = useState<string | null>(null);
  const [lots, setLots] = useState<InventoryLotView[]>([]);
  const [loadingLots, setLoadingLots] = useState(false);

  useEffect(() => {
    loadLots();
  }, []);

  async function loadLots() {
    setLoadingLots(true);

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
        quantity_consumed,
        unit_cost,
        location_id,

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
      `)
      .order("expiration_date", { ascending: true });

    console.log("LOTS DATA", data);
    console.log("LOTS ERROR", error);

    if (error) {
      console.error(error);
      setLots([]);
      setLoadingLots(false);
      return;
    }

    const mapped = ((data ?? []) as any[]).map((lot): InventoryLotView => {
      const product = normalizeInventoryRelation<any>(lot.products);
      const supplier = normalizeInventoryRelation<any>(lot.suppliers);
      const location = normalizeInventoryRelation<any>(lot.locations);

      const expiryDate = lot.expiration_date
        ? new Date(lot.expiration_date)
        : null;

      const now = new Date();

      const daysToExpiry = expiryDate
        ? Math.ceil(
            (expiryDate.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

      return {
        id: lot.id,
        manufacturerLot: lot.manufacturer_lot ?? "—",
        product: product?.name ?? "Unknown product",
        supplier: supplier?.name ?? "Unknown supplier",
        location: location?.name ?? "Unknown warehouse",
        locationId: lot.location_id ?? null,
        available: Number(lot.quantity_available ?? 0),
        reserved: Number(lot.quantity_reserved ?? 0),
        total: Number(lot.quantity_initial ?? 0),
        consumed: Number(lot.quantity_consumed ?? 0),
        cost: Number(lot.unit_cost ?? 0),
        expiry: lot.expiration_date ?? "—",
        daysToExpiry,
        unit: product?.unit_of_measure ?? "units",
        tempRequirement: product?.storage_condition ?? "N/A",
        coldChain:
          product?.storage_condition?.toLowerCase().includes("cold") ?? false,
        status: normalizeInventoryLotStatus(lot.status),
      };
    });

    setLots(mapped);
    setLoadingLots(false);
  }

  const filtered = lots.filter(
    (lot) =>
      (statusFilter === "all" || lot.status === statusFilter) &&
      (!q ||
        lot.product.toLowerCase().includes(q.toLowerCase()) ||
        lot.id.toLowerCase().includes(q.toLowerCase()) ||
        lot.manufacturerLot.toLowerCase().includes(q.toLowerCase())),
  );

  const totalValue = lots.reduce((sum, lot) => sum + lot.cost * lot.total, 0);

  const reserved = lots.reduce((sum, lot) => sum + lot.reserved, 0);

  const quarantined = lots.filter(
    (lot) => lot.status === "quarantined" || lot.status === "blocked",
  ).length;

  const expiringSoon = lots.filter(
    (lot) => lot.daysToExpiry > 0 && lot.daysToExpiry <= 60,
  ).length;

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
            placeholder="Search lot, product or manufacturer lot…"
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
                "consumed",
                "destroyed",
              ] as const
            ).map((status) => (
              <FilterBtn
                key={status}
                active={statusFilter === status}
                onClick={() =>
                  setStatusFilter(status as InventoryLotStatusLocal | "all")
                }
              >
                {status[0].toUpperCase() + status.slice(1)}
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
              {loadingLots ? (
                <tr>
                  <td colSpan={9}>
                    <div className="py-6 text-center text-muted-foreground">
                      Loading inventory lots...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="py-6 text-center text-muted-foreground">
                      No inventory lots found.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((lot, index) => {
                  const expiringSoon =
                    lot.daysToExpiry > 0 && lot.daysToExpiry <= 60;

                  const expired = lot.daysToExpiry <= 0;

                  return (
                    <tr
                      key={lot.id}
                      className="border-t border-border hover:bg-accent/30 transition-colors"
                    >
                      <Td>
                        <Link
                          to="/inventory/lots/$lotId"
                          params={{ lotId: lot.id }}
                          className="font-mono text-[11px] text-primary hover:underline"
                        >
                          {lot.id}
                        </Link>

                        <p className="text-[10px] text-muted-foreground">
                          {lot.manufacturerLot}
                        </p>
                      </Td>

                      <Td>
                        <p className="font-semibold text-foreground">
                          {lot.product}
                        </p>

                        <p className="text-[10.5px] text-muted-foreground">
                          {lot.supplier}
                        </p>
                      </Td>

                      <Td>
                        <p className="text-foreground">{lot.location}</p>

                        <p className="text-[10.5px] text-muted-foreground inline-flex items-center gap-1">
                          {lot.coldChain && (
                            <Snowflake className="size-2.5 text-primary" />
                          )}

                          {lot.tempRequirement}
                        </p>
                      </Td>

                      <Td className="text-right tabular-nums font-semibold">
                        {lot.available}{" "}
                        <span className="text-muted-foreground font-normal">
                          {lot.unit}
                        </span>
                      </Td>

                      <Td className="text-right tabular-nums text-muted-foreground">
                        {lot.reserved}
                      </Td>

                      <Td>
                        <p
                          className={cn(
                            "font-medium",
                            expired && "text-critical",
                            expiringSoon && "text-warning",
                          )}
                        >
                          {lot.expiry}
                        </p>

                        <p className="text-[10px] text-muted-foreground">
                          {expired
                            ? `${Math.abs(lot.daysToExpiry)}d ago`
                            : `in ${lot.daysToExpiry}d`}
                        </p>
                      </Td>

                      <Td>
                        {index === 0 && <Pill tone="primary">#1 FEFO</Pill>}
                        {index === 1 && <Pill tone="muted">#2</Pill>}
                      </Td>

                      <Td>
                        <InventoryLotStatusBadge status={lot.status} />
                      </Td>

                      <Td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setAdjLot(lot.id)}
                            className="size-7 rounded hover:bg-secondary inline-flex items-center justify-center text-muted-foreground"
                            title="Adjust inventory"
                          >
                            <Pencil className="size-3.5" />
                          </button>

                          <Link
                            to="/inventory/lots/$lotId"
                            params={{ lotId: lot.id }}
                            className="size-7 rounded hover:bg-secondary inline-flex items-center justify-center text-muted-foreground"
                            title="View lot"
                          >
                            <Eye className="size-3.5" />
                          </Link>
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {adjLot && (
        <AdjustmentPanel
          lotId={adjLot}
          onClose={() => setAdjLot(null)}
          onAdjusted={() => {
            setAdjLot(null);
            loadLots();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// ADJUSTMENT PANEL
// ============================================================

function AdjustmentPanel({
  lotId,
  onClose,
  onAdjusted,
}: {
  lotId: string;
  onClose: () => void;
  onAdjusted: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [lot, setLot] = useState<any | null>(null);

  const [adjustmentType, setAdjustmentType] =
    useState<InventoryAdjustmentType>("ADD_STOCK");

  const [quantity, setQuantity] = useState("");

  const [reason, setReason] = useState(
    "Inventory increase due to received stock",
  );

  useEffect(() => {
    loadLot();
  }, [lotId]);

  async function loadLot() {
    setLoading(true);

    const { data, error } = await supabase
      .from("inventory_lots")
      .select(`
        id,
        clinic_id,
        product_id,
        supplier_id,
        location_id,
        internal_lot_code,
        manufacturer_lot,
        expiration_date,
        manufacture_date,
        status,
        quantity_initial,
        quantity_available,
        quantity_reserved,
        quantity_consumed,
        unit_cost,
        received_at,

        products (
          id,
          name,
          unit_of_measure,
          presentation,
          storage_condition
        ),

        suppliers (
          id,
          name
        ),

        locations (
          id,
          name
        )
      `)
      .eq("id", lotId)
      .single();

    console.log("ADJUSTMENT LOT", data);
    console.log("ADJUSTMENT LOT ERROR", error);

    if (error || !data) {
      console.error(error);
      setLot(null);
      setLoading(false);
      return;
    }

    setLot(data);
    setLoading(false);
  }

  function getAdjustmentLabel(type: InventoryAdjustmentType) {
    const labels: Record<InventoryAdjustmentType, string> = {
      ADD_STOCK: "Add inventory",
      REMOVE_STOCK: "Remove inventory",
      DAMAGE_LOSS: "Damage / loss",
      DESTROY_STOCK: "Destroy inventory",
      QUARANTINE: "Move to quarantine",
      BLOCK: "Block lot",
      RELEASE: "Release lot",
    };

    return labels[type];
  }

  function getMovementType(type: InventoryAdjustmentType) {
    const map: Record<InventoryAdjustmentType, string> = {
      ADD_STOCK: "adjustment_in",
      REMOVE_STOCK: "adjustment_out",
      DAMAGE_LOSS: "damage_loss",
      DESTROY_STOCK: "destruction",
      QUARANTINE: "quarantine",
      BLOCK: "block",
      RELEASE: "release",
    };

    return map[type];
  }

  function requiresQuantity(type: InventoryAdjustmentType) {
    return (
      type === "ADD_STOCK" ||
      type === "REMOVE_STOCK" ||
      type === "DAMAGE_LOSS" ||
      type === "DESTROY_STOCK"
    );
  }

  function getDefaultReason(type: InventoryAdjustmentType) {
    const map: Record<InventoryAdjustmentType, string> = {
      ADD_STOCK: "Inventory increase due to received stock",
      REMOVE_STOCK: "Manual inventory decrease",
      DAMAGE_LOSS: "Inventory decrease due to damage or loss",
      DESTROY_STOCK: "Inventory destruction / disposal",
      QUARANTINE: "Lot moved to quarantine for review",
      BLOCK: "Lot blocked from clinical use",
      RELEASE: "Lot released back to available inventory",
    };

    return map[type];
  }

  function calculateNewValues() {
    if (!lot) return null;

    const currentInitial = Number(lot.quantity_initial ?? 0);
    const currentAvailable = Number(lot.quantity_available ?? 0);
    const currentReserved = Number(lot.quantity_reserved ?? 0);
    const currentConsumed = Number(lot.quantity_consumed ?? 0);

    const qty = requiresQuantity(adjustmentType)
      ? Number(quantity || 0)
      : 0;

    let newInitial = currentInitial;
    let newAvailable = currentAvailable;
    const newReserved = currentReserved;
    let newConsumed = currentConsumed;
    let newStatus = String(lot.status ?? "available").toLowerCase();

    if (adjustmentType === "ADD_STOCK") {
      newInitial = currentInitial + qty;
      newAvailable = currentAvailable + qty;

      if (
        newStatus === "consumed" ||
        newStatus === "destroyed" ||
        newStatus === "expired"
      ) {
        newStatus = "available";
      }
    }

    if (adjustmentType === "REMOVE_STOCK") {
      newAvailable = currentAvailable - qty;
      newConsumed = currentConsumed + qty;

      if (newAvailable <= 0 && currentReserved <= 0) {
        newStatus = "consumed";
      }
    }

    if (adjustmentType === "DAMAGE_LOSS") {
      newAvailable = currentAvailable - qty;
      newConsumed = currentConsumed + qty;

      if (newAvailable <= 0 && currentReserved <= 0) {
        newStatus = "blocked";
      }
    }

    if (adjustmentType === "DESTROY_STOCK") {
      newAvailable = currentAvailable - qty;
      newConsumed = currentConsumed + qty;

      if (newAvailable <= 0 && currentReserved <= 0) {
        newStatus = "destroyed";
      }
    }

    if (adjustmentType === "QUARANTINE") {
      newStatus = "quarantined";
    }

    if (adjustmentType === "BLOCK") {
      newStatus = "blocked";
    }

    if (adjustmentType === "RELEASE") {
      newStatus = "available";
    }

    return {
      currentInitial,
      currentAvailable,
      currentReserved,
      currentConsumed,
      qty,
      newInitial,
      newAvailable,
      newReserved,
      newConsumed,
      newStatus,
    };
  }

  async function handleSaveAdjustment() {
    if (!lot) {
      runMockAction("Adjusting inventory", {
        error: "Lot was not found",
      });
      return;
    }

    const values = calculateNewValues();

    if (!values) {
      runMockAction("Adjusting inventory", {
        error: "Could not calculate inventory adjustment",
      });
      return;
    }

    if (requiresQuantity(adjustmentType)) {
      if (!quantity || Number(quantity) <= 0) {
        runMockAction("Adjusting inventory", {
          error: "Quantity must be greater than zero",
        });
        return;
      }
    }

    if (
      adjustmentType !== "ADD_STOCK" &&
      requiresQuantity(adjustmentType) &&
      values.qty > values.currentAvailable
    ) {
      runMockAction("Adjusting inventory", {
        error: "Quantity cannot be greater than available inventory",
      });
      return;
    }

    if (values.newAvailable < 0) {
      runMockAction("Adjusting inventory", {
        error: "Available quantity cannot be negative",
      });
      return;
    }

    if (!reason.trim()) {
      runMockAction("Adjusting inventory", {
        error: "Reason is required",
      });
      return;
    }

    setSaving(true);

    const movementPayload = {
      id: crypto.randomUUID(),

      clinic_id: lot.clinic_id ?? null,
      lot_id: lot.id,
      inventory_reservation_id: null,

      movement_type: getMovementType(adjustmentType),

      source_location_id:
        adjustmentType === "ADD_STOCK" ? null : lot.location_id ?? null,

      destination_location_id:
        adjustmentType === "ADD_STOCK" ||
        adjustmentType === "RELEASE" ||
        adjustmentType === "QUARANTINE"
          ? lot.location_id ?? null
          : null,

      quantity: requiresQuantity(adjustmentType) ? values.qty : 0,

      related_case_id: null,
      related_patient_id: null,
      related_procedure_id: null,
      related_prescription_item_id: null,

      performed_by: null,

      reason: reason.trim(),
      created_at: inventoryTimestampWithoutTimezone(new Date()),
    };

    const { error: movementError } = await supabase
      .from("inventory_movements")
      .insert(movementPayload);

    console.log("INVENTORY MOVEMENT PAYLOAD", movementPayload);
    console.log("INVENTORY MOVEMENT ERROR", movementError);

    if (movementError) {
      console.error(movementError);

      runMockAction("Adjusting inventory", {
        error: movementError.message,
      });

      setSaving(false);
      return;
    }

    const { error: lotUpdateError } = await supabase
      .from("inventory_lots")
      .update({
        quantity_initial: values.newInitial,
        quantity_available: values.newAvailable,
        quantity_reserved: values.newReserved,
        quantity_consumed: values.newConsumed,
        status: values.newStatus,
      })
      .eq("id", lot.id);

    console.log("INVENTORY LOT UPDATE ERROR", lotUpdateError);

    if (lotUpdateError) {
      console.error(lotUpdateError);

      runMockAction("Adjusting inventory", {
        error:
          "Movement was created, but lot quantities could not be updated",
      });

      setSaving(false);
      return;
    }

    runMockAction("Adjusting inventory", {
      success: "Inventory adjusted successfully",
    });

    setSaving(false);
    onAdjusted();
  }

  const values = calculateNewValues();

  const product = normalizeInventoryRelation<any>(lot?.products);
  const supplier = normalizeInventoryRelation<any>(lot?.suppliers);
  const location = normalizeInventoryRelation<any>(lot?.locations);

  const productName = product?.name ?? "Unknown product";
  const supplierName = supplier?.name ?? "Unknown supplier";
  const locationName = location?.name ?? "Unknown warehouse";
  const unit = product?.unit_of_measure ?? "units";

  return (
    <Panel
      title="Adjust inventory"
      subtitle={loading ? "Loading lot..." : `${productName} · ${lotId}`}
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveAdjustment}
            disabled={saving || loading || !lot}
            className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Apply adjustment"}
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="text-[12px] text-muted-foreground">
          Loading lot information...
        </div>
      ) : !lot ? (
        <div className="rounded-md border border-critical/30 bg-critical/5 px-3 py-2.5 text-[12px] text-critical">
          Lot could not be loaded.
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div>
              <h3 className="text-[13px] font-semibold">Lot information</h3>

              <p className="text-[11px] text-muted-foreground mt-0.5">
                Review current inventory before applying an adjustment.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Product">{productName}</Field>

              <Field label="Supplier">{supplierName}</Field>

              <Field label="Warehouse">{locationName}</Field>

              <Field label="Manufacturer lot">
                {lot.manufacturer_lot ?? "—"}
              </Field>

              <Field label="Available">
                {Number(lot.quantity_available ?? 0)} {unit}
              </Field>

              <Field label="Reserved">
                {Number(lot.quantity_reserved ?? 0)} {unit}
              </Field>

              <Field label="Initial quantity">
                {Number(lot.quantity_initial ?? 0)} {unit}
              </Field>

              <Field label="Consumed / removed">
                {Number(lot.quantity_consumed ?? 0)} {unit}
              </Field>

              <Field label="Status">
                <InventoryLotStatusBadge
                  status={String(lot.status ?? "available")}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div>
              <h3 className="text-[13px] font-semibold">
                Adjustment operation
              </h3>

              <p className="text-[11px] text-muted-foreground mt-0.5">
                Add stock when new inventory arrives, or remove stock for damage,
                destruction, manual correction or blocking.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5 block">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Adjustment type
                </span>

                <select
                  value={adjustmentType}
                  onChange={(event) => {
                    const nextType =
                      event.target.value as InventoryAdjustmentType;

                    setAdjustmentType(nextType);
                    setReason(getDefaultReason(nextType));

                    if (!requiresQuantity(nextType)) {
                      setQuantity("");
                    }
                  }}
                  className="h-9 w-full rounded-md border border-border bg-card px-3 text-[12px] outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="ADD_STOCK">Add inventory</option>
                  <option value="REMOVE_STOCK">Remove inventory</option>
                  <option value="DAMAGE_LOSS">Damage / loss</option>
                  <option value="DESTROY_STOCK">Destroy inventory</option>
                  <option value="QUARANTINE">Move to quarantine</option>
                  <option value="BLOCK">Block lot</option>
                  <option value="RELEASE">Release lot</option>
                </select>
              </label>

              {requiresQuantity(adjustmentType) ? (
                <Input
                  label={`Quantity (${unit})`}
                  type="number"
                  placeholder="0"
                  value={quantity}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setQuantity(event.target.value)
                  }
                />
              ) : (
                <Field label="Quantity">No quantity change</Field>
              )}

              <div className="col-span-2">
                <label className="space-y-1.5 block">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Reason
                  </span>

                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={3}
                    placeholder="Explain why this adjustment is being applied..."
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              </div>
            </div>
          </section>

          {values && (
            <section className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
              <div>
                <h3 className="text-[13px] font-semibold">
                  Adjustment preview
                </h3>

                <p className="text-[11px] text-muted-foreground mt-0.5">
                  These values will be written to the selected lot.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <Field label="Operation">
                  {getAdjustmentLabel(adjustmentType)}
                </Field>

                <Field label="Movement type">
                  {getMovementType(adjustmentType)}
                </Field>

                <Field label="Available before">
                  {values.currentAvailable}
                </Field>

                <Field label="Available after">
                  {values.newAvailable}
                </Field>

                <Field label="Initial before">
                  {values.currentInitial}
                </Field>

                <Field label="Initial after">
                  {values.newInitial}
                </Field>

                <Field label="Consumed before">
                  {values.currentConsumed}
                </Field>

                <Field label="Consumed after">
                  {values.newConsumed}
                </Field>

                <Field label="New status">
                  <InventoryLotStatusBadge status={values.newStatus} />
                </Field>
              </div>

              {adjustmentType !== "ADD_STOCK" &&
                requiresQuantity(adjustmentType) &&
                values.qty > values.currentAvailable && (
                  <div className="rounded-md border border-critical/30 bg-critical/5 px-3 py-2.5 text-[11.5px] text-critical">
                    The quantity to remove cannot exceed available inventory.
                  </div>
                )}

              {adjustmentType === "DESTROY_STOCK" && (
                <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5 text-[11.5px] text-warning">
                  This operation records a destruction movement and reduces
                  available inventory. Use it only for documented disposal,
                  expiration, damage or authorized destruction.
                </div>
              )}

              {adjustmentType === "DAMAGE_LOSS" && (
                <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5 text-[11.5px] text-warning">
                  This operation reduces available inventory due to damage or
                  loss. The movement will remain traceable in inventory history.
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </Panel>
  );
}

// ============================================================
// INVENTORY LOCAL BADGE + HELPERS
// ============================================================

function InventoryLotStatusBadge({ status }: { status: string }) {
  const normalized = normalizeInventoryLotStatus(status);

  const map: Record<
    InventoryLotStatusLocal,
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

  const config = map[normalized];

  return <Pill tone={config.tone}>{config.label}</Pill>;
}

function normalizeInventoryLotStatus(
  value: string | null | undefined,
): InventoryLotStatusLocal {
  const normalized = String(value ?? "available").toLowerCase();

  if (normalized === "available") return "available";
  if (normalized === "reserved") return "reserved";
  if (normalized === "quarantined") return "quarantined";
  if (normalized === "quarantine") return "quarantined";
  if (normalized === "expired") return "expired";
  if (normalized === "blocked") return "blocked";
  if (normalized === "consumed") return "consumed";
  if (normalized === "returned") return "returned";
  if (normalized === "destroyed") return "destroyed";

  return "available";
}

function normalizeInventoryRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function inventoryTimestampWithoutTimezone(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
// ============================================================
// 4. TRANSFERS TAB
// ============================================================

type LocationRow = {
  id: string;
  clinic_id: string | null;
  parent_location_id: string | null;
  name: string | null;
  type: string | null;
  active: boolean | null;
};

type ClinicLocationOption = {
  id: string;
  legal_name: string | null;
};

function TransfersTab({
  onOpen,
  onNew,
}: {
  onOpen: (t: Transfer) => void;
  onNew: () => void;
}) {
  const [filter, setFilter] = useState<TransferStatus | "all">("all");

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const [newLocationOpen, setNewLocationOpen] = useState(false);

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

    const mapped: Transfer[] = data.map((m: any) => {
      let status: TransferStatus = "pending";

      let requester = "System";
      let receiver = "System";

      // =====================================================
      // MOVEMENT TYPE LOGIC
      // =====================================================

      if (m.movement_type === "transfer") {
        status = "in-transit";

        requester = m.source_location?.name ?? "Origin";

        receiver = m.destination_location?.name ?? "Destination";
      }

      if (m.movement_type === "reservation") {
        status = "approved";

        requester = "Prescription";

        receiver = m.destination_location?.name ?? "Reserved stock";
      }

      if (m.movement_type === "consumed") {
        status = "received";

        requester = m.source_location?.name ?? "Inventory";

        receiver = "Patient";
      }

      if (m.movement_type === "cancelled") {
        status = "cancelled";
      }

      // =====================================================
      // FROM / TO DISPLAY
      // =====================================================

      let from = m.source_location?.name ?? "Unknown";

      let to = m.destination_location?.name ?? "Unknown";

      if (m.movement_type === "reservation") {
        from = m.source_location?.name ?? "Main Pharmacy";

        to = m.destination_location?.name ?? "Reserved Prescriptions";
      }

      if (m.movement_type === "consumed") {
        to = "Patient administration";
      }

      return {
        id: m.id,

        created: new Date(m.created_at).toLocaleDateString(),

        from,

        to,

        requester,

        receiver,

        status,

        reason: m.reason ?? undefined,

        items: [
          {
            product: m.inventory_lots?.products?.name ?? "Unknown product",

            lot:
              m.inventory_lots?.internal_lot_code ??
              m.inventory_lots?.id ??
              "-",

            qty: Number(m.quantity ?? 0),

            unit: m.inventory_lots?.products?.unit_of_measure ?? "u",
          },
        ],
      };
    });

    console.log("MAPPED TRANSFERS", mapped);

    setTransfers(mapped);

    setLoading(false);
  }

  const filtered = transfers.filter(
    (t) => filter === "all" || t.status === filter,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi
          label="Pending"
          value={transfers.filter((t) => t.status === "pending").length}
          tone="warning"
          icon={Clock}
        />

        <Kpi
          label="Approved"
          value={transfers.filter((t) => t.status === "approved").length}
          icon={CheckCircle2}
        />

        <Kpi
          label="In transit"
          value={transfers.filter((t) => t.status === "in-transit").length}
          tone="default"
          icon={Truck}
        />

        <Kpi
          label="Received"
          value={transfers.filter((t) => t.status === "received").length}
          tone="success"
          icon={CheckCircle2}
        />

        <Kpi
          label="Cancelled"
          value={transfers.filter((t) => t.status === "cancelled").length}
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
                onClick={() => setFilter(s)}
              >
                {s[0].toUpperCase() + s.slice(1)}
              </FilterBtn>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setNewLocationOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-[11.5px] font-medium rounded-md border border-border bg-card hover:bg-secondary"
            >
              <Building2 className="size-3.5" />
              New warehouse
            </button>

            <button
              onClick={onNew}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-[11.5px] font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5" />
              New transfer
            </button>
          </div>
        </div>

        <div className="divide-y divide-border">
          {loading && (
            <div className="p-6 text-[12px] text-muted-foreground">
              Loading movements...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="p-6 text-[12px] text-muted-foreground">
              No inventory movements found
            </div>
          )}

          {!loading &&
            filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => onOpen(t)}
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
                  {t.items.length} item{t.items.length > 1 ? "s" : ""}
                  {" · "}
                  {t.items.map((i) => i.product).join(", ")}
                </div>

                <div className="col-span-2 text-[11.5px] text-muted-foreground truncate">
                  {t.requester}
                </div>

                <div className="col-span-1 text-right">
                  <TransferStatusBadge status={t.status} />
                </div>
              </button>
            ))}
        </div>
      </Card>

      {newLocationOpen && (
        <NewLocationPanel
          onClose={() => setNewLocationOpen(false)}
          onCreated={() => {
            setNewLocationOpen(false);
            loadTransfers();
          }}
        />
      )}
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
      tone: Parameters<typeof Pill>[0]["tone"];
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

  return <Pill tone={map[status].tone}>{map[status].label}</Pill>;
}

function NewLocationPanel({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [clinics, setClinics] = useState<ClinicLocationOption[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [clinicId, setClinicId] = useState("");
  const [parentLocationId, setParentLocationId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("WAREHOUSE");
  const [active, setActive] = useState(true);

  useEffect(() => {
    loadLocationFormData();
  }, []);

  async function loadLocationFormData() {
    setLoading(true);

    const [{ data: clinicRows, error: clinicError }, { data: locationRows, error: locationError }] =
      await Promise.all([
        supabase
          .from("clinics")
          .select("id, legal_name")
          .order("legal_name", { ascending: true }),

        supabase
          .from("locations")
          .select(`
            id,
            clinic_id,
            parent_location_id,
            name,
            type,
            active
          `)
          .eq("active", true)
          .order("name", { ascending: true }),
      ]);

    if (clinicError) {
      console.error("Error loading clinics:", clinicError);
      notify("Error", clinicError.message || "No se pudieron cargar las clínicas.");
    }

    if (locationError) {
      console.error("Error loading locations:", locationError);
      notify("Error", locationError.message || "No se pudieron cargar las bodegas.");
    }

    setClinics(clinicRows ?? []);
    setLocations((locationRows ?? []) as LocationRow[]);

    setLoading(false);
  }

  async function createLocation() {
    if (!clinicId) {
      notify("Clínica requerida", "Selecciona la clínica de la bodega.");
      return;
    }

    if (!name.trim()) {
      notify("Nombre requerido", "El nombre de la bodega es obligatorio.");
      return;
    }

    if (!type.trim()) {
      notify("Tipo requerido", "Selecciona el tipo de ubicación.");
      return;
    }

    setCreating(true);

    const payload = {
      id: crypto.randomUUID(),
      clinic_id: clinicId,
      parent_location_id: parentLocationId || null,
      name: name.trim(),
      type: type.trim(),
      active,
    };

    console.log("NEW LOCATION PAYLOAD", payload);

    const { error } = await supabase.from("locations").insert(payload);

    if (error) {
      console.error("Error creating location:", error);

      notify(
        "Error",
        error.message || "No se pudo crear la bodega.",
      );

      setCreating(false);
      return;
    }

    notify("Bodega creada", "La nueva bodega quedó disponible para transferencias.");

    setCreating(false);
    onCreated();
  }

  const filteredParentLocations = locations.filter((location) => {
    if (!clinicId) return true;
    return location.clinic_id === clinicId;
  });

  return (
    <Panel
      title="New warehouse"
      subtitle="Crear una nueva bodega o ubicación de inventario"
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={creating}
            className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={createLocation}
            disabled={creating || loading}
            className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create warehouse"}
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="p-4 text-[12px] text-muted-foreground">
          Loading form data...
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div>
              <h3 className="text-[13px] font-semibold">
                Warehouse information
              </h3>

              <p className="text-[11px] text-muted-foreground mt-0.5">
                Esta ubicación quedará disponible como origen o destino en las transferencias.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 block">
                <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                  Clinic
                </span>

                <select
                  value={clinicId}
                  onChange={(event) => {
                    setClinicId(event.target.value);
                    setParentLocationId("");
                  }}
                  className="mt-1 w-full h-9 px-3 text-[12.5px] rounded-md border border-border bg-card focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select clinic</option>

                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.legal_name ?? clinic.id}
                    </option>
                  ))}
                </select>
              </label>

              <label className="col-span-2 block">
                <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                  Parent warehouse
                </span>

                <select
                  value={parentLocationId}
                  onChange={(event) => setParentLocationId(event.target.value)}
                  disabled={!clinicId}
                  className="mt-1 w-full h-9 px-3 text-[12.5px] rounded-md border border-border bg-card focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-accent disabled:opacity-50"
                >
                  <option value="">No parent warehouse</option>

                  {filteredParentLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name ?? location.id}
                      {location.type ? ` · ${location.type}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <Input
                label="Warehouse name"
                placeholder="Ej. Farmacia principal"
                value={name}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setName(event.target.value)
                }
              />

              <label className="block">
                <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                  Type
                </span>

                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="mt-1 w-full h-9 px-3 text-[12.5px] rounded-md border border-border bg-card focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-accent"
                >
                  <option value="WAREHOUSE">Warehouse</option>
                  <option value="PHARMACY">Pharmacy</option>
                  <option value="LAB">Lab</option>
                  <option value="PROCEDURE_ROOM">Procedure room</option>
                  <option value="COLD_STORAGE">Cold storage</option>
                  <option value="QUARANTINE">Quarantine</option>
                  <option value="DISPOSAL">Disposal</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>

              <div className="col-span-2 pt-2">
                <Checkbox
                  label="Active"
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                />
              </div>
            </div>
          </section>
        </div>
      )}
    </Panel>
  );
}
// ============================================================
// 5. KITS TAB
// ============================================================

type ProcedureKitDb = {
  id: string;
  clinic_id: string | null;
  name: string | null;
  procedure_type: string | null;
  active: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  procedure_kit_items?: ProcedureKitItemDb[];
};

type ProcedureKitItemDb = {
  id: string;
  kit_id: string | null;
  product_id: string | null;
  quantity_required: number | null;
  required: boolean | null;
  unit_of_measure?: string | null;
  notes?: string | null;
  products?: {
    id: string;
    name: string | null;
    unit_of_measure: string | null;
    presentation: string | null;
    category: string | null;
  } | null;
};

type ProcedureKitOrderDb = {
  id: string;
  clinic_id: string | null;
  kit_id: string | null;
  procedure_id: string | null;
  procedure_type: string | null;
  clinic_patient_id: string | null;
  patient_id: string | null;
  status: string | null;
  requested_at: string | null;
  validated_at: string | null;
  sent_to_pharmacy_at: string | null;
  prepared_at: string | null;
  delivered_at: string | null;
  received_at: string | null;
  closed_at: string | null;
  notes: string | null;
  procedure_kits?: {
    id: string;
    name: string | null;
    procedure_type: string | null;
  } | null;
  procedure_kit_order_items?: ProcedureKitOrderItemDb[];
};

type ProcedureKitOrderItemDb = {
  id: string;
  kit_order_id: string;
  kit_item_id: string | null;
  product_id: string | null;
  quantity_required: number | null;
  quantity_reserved: number | null;
  quantity_prepared: number | null;
  quantity_delivered: number | null;
  quantity_used: number | null;
  quantity_returned: number | null;
  unit_of_measure: string | null;
  required: boolean | null;
  status: string | null;
  pharmacy_notes: string | null;
  procedure_notes: string | null;
  return_notes: string | null;
  products?: {
    id: string;
    name: string | null;
    unit_of_measure: string | null;
    presentation: string | null;
  } | null;
  procedure_kit_order_item_lots?: ProcedureKitOrderItemLotDb[];
};

type ProcedureKitOrderItemLotDb = {
  id: string;
  kit_order_item_id: string;
  product_id: string | null;
  lot_id: string | null;
  quantity_reserved: number | null;
  quantity_prepared: number | null;
  quantity_delivered: number | null;
  quantity_used: number | null;
  quantity_returned: number | null;
  status: string | null;
  inventory_lots?: {
    id: string;
    clinic_id: string | null;
    product_id: string | null;
    location_id: string | null;
    internal_lot_code: string | null;
    manufacturer_lot: string | null;
    expiration_date: string | null;
    quantity_available: number | null;
    quantity_reserved: number | null;
    quantity_consumed: number | null;
  } | null;
};

type KitStatusTone =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "critical"
  | "muted";

function KitsTab({
  onEdit,
  onNew,
}: {
  onEdit: (id: string) => void;
  onNew: () => void;
}) {
  const [kits, setKits] = useState<ProcedureKitDb[]>([]);
  const [orders, setOrders] = useState<ProcedureKitOrderDb[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ProcedureKitOrderDb | null>(
    null,
  );

  const [q, setQ] = useState("");
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const [usageByLotId, setUsageByLotId] = useState<Record<string, string>>({});
  const [returnNotesByItemId, setReturnNotesByItemId] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    loadKitsData();

    const refreshHandler = () => loadKitsData();
    window.addEventListener("procedure-kits-refresh", refreshHandler);

    return () => {
      window.removeEventListener("procedure-kits-refresh", refreshHandler);
    };
  }, []);

  async function loadKitsData() {
    setLoading(true);

    await Promise.all([loadKitTemplates(), loadKitOrders()]);

    setLoading(false);
  }

  async function loadKitTemplates() {
    const { data, error } = await supabase
      .from("procedure_kits")
      .select(`
        id,
        clinic_id,
        name,
        procedure_type,
        active,
        procedure_kit_items (
          id,
          kit_id,
          product_id,
          quantity_required,
          required,
          unit_of_measure,
          notes,
          products (
            id,
            name,
            unit_of_measure,
            presentation,
            category
          )
        )
      `)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading procedure kits:", error);
      notify("Error", error.message || "No se pudieron cargar los kits.");
      setKits([]);
      return;
    }

    const normalized = ((data ?? []) as any[]).map((kit) => ({
      ...kit,
      procedure_kit_items: (kit.procedure_kit_items ?? []).map((item: any) => ({
        ...item,
        products: normalizeKitRelation(item.products),
      })),
    }));

    setKits(normalized as ProcedureKitDb[]);
  }

  async function loadKitOrders() {
    const { data, error } = await supabase
      .from("procedure_kit_orders")
      .select(`
        id,
        clinic_id,
        kit_id,
        procedure_id,
        procedure_type,
        clinic_patient_id,
        patient_id,
        status,
        requested_at,
        validated_at,
        sent_to_pharmacy_at,
        prepared_at,
        delivered_at,
        received_at,
        closed_at,
        notes,
        procedure_kits (
          id,
          name,
          procedure_type
        ),
        procedure_kit_order_items (
          id,
          kit_order_id,
          kit_item_id,
          product_id,
          quantity_required,
          quantity_reserved,
          quantity_prepared,
          quantity_delivered,
          quantity_used,
          quantity_returned,
          unit_of_measure,
          required,
          status,
          pharmacy_notes,
          procedure_notes,
          return_notes,
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
            quantity_used,
            quantity_returned,
            status,
            inventory_lots (
              id,
              clinic_id,
              product_id,
              location_id,
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
      .order("requested_at", { ascending: false });

    if (error) {
      console.error("Error loading procedure kit orders:", error);
      notify("Error", error.message || "No se pudieron cargar las órdenes.");
      setOrders([]);
      return;
    }

    const normalized = ((data ?? []) as any[]).map((order) => ({
      ...order,
      procedure_kits: normalizeKitRelation(order.procedure_kits),
      procedure_kit_order_items: (order.procedure_kit_order_items ?? []).map(
        (item: any) => ({
          ...item,
          products: normalizeKitRelation(item.products),
          procedure_kit_order_item_lots: (
            item.procedure_kit_order_item_lots ?? []
          ).map((lotRow: any) => ({
            ...lotRow,
            inventory_lots: normalizeKitRelation(lotRow.inventory_lots),
          })),
        }),
      ),
    }));

    setOrders(normalized as ProcedureKitOrderDb[]);

    setSelectedOrder((current) => {
      if (!current) return null;

      return (
        (normalized as ProcedureKitOrderDb[]).find(
          (order) => order.id === current.id,
        ) ?? null
      );
    });
  }

  async function createOrderAndReserve(kit: ProcedureKitDb) {
    const kitItems = kit.procedure_kit_items ?? [];

    if (kitItems.length === 0) {
      notify("Kit vacío", "Este kit no tiene insumos configurados.");
      return;
    }

    setWorkingId(kit.id);

    const now = inventoryTimestampWithoutTimezone(new Date());
    const orderId = crypto.randomUUID();

    const { error: orderError } = await supabase
      .from("procedure_kit_orders")
      .insert({
        id: orderId,
        clinic_id: kit.clinic_id,
        kit_id: kit.id,
        procedure_id: null,
        procedure_type: kit.procedure_type,
        clinic_patient_id: null,
        patient_id: null,
        status: "DRAFT",
        requested_by: null,
        requested_at: now,
        notes: "Orden creada desde plantilla de kit.",
        created_at: now,
        updated_at: now,
      });

    if (orderError) {
      console.error("Error creating kit order:", orderError);
      notify("Error", orderError.message || "No se pudo crear la orden.");
      setWorkingId(null);
      return;
    }

    const orderItemsPayload = kitItems.map((item) => {
      const product = normalizeKitRelation(item.products);

      return {
        id: crypto.randomUUID(),
        kit_order_id: orderId,
        kit_item_id: item.id,
        product_id: item.product_id,
        quantity_required: Number(item.quantity_required ?? 0),
        quantity_reserved: 0,
        quantity_prepared: 0,
        quantity_delivered: 0,
        quantity_used: 0,
        quantity_returned: 0,
        unit_of_measure: item.unit_of_measure ?? product?.unit_of_measure ?? null,
        required: item.required ?? true,
        status: "PENDING",
        pharmacy_notes: null,
        procedure_notes: null,
        return_notes: null,
        created_at: now,
        updated_at: now,
      };
    });

    const { error: itemsError } = await supabase
      .from("procedure_kit_order_items")
      .insert(orderItemsPayload);

    if (itemsError) {
      console.error("Error creating kit order items:", itemsError);

      await supabase.from("procedure_kit_orders").delete().eq("id", orderId);

      notify("Error", itemsError.message || "No se pudieron crear los ítems.");
      setWorkingId(null);
      return;
    }

    const createdOrder: ProcedureKitOrderDb = {
      id: orderId,
      clinic_id: kit.clinic_id,
      kit_id: kit.id,
      procedure_id: null,
      procedure_type: kit.procedure_type,
      clinic_patient_id: null,
      patient_id: null,
      status: "DRAFT",
      requested_at: now,
      validated_at: null,
      sent_to_pharmacy_at: null,
      prepared_at: null,
      delivered_at: null,
      received_at: null,
      closed_at: null,
      notes: "Orden creada desde plantilla de kit.",
      procedure_kits: {
        id: kit.id,
        name: kit.name,
        procedure_type: kit.procedure_type,
      },
      procedure_kit_order_items: orderItemsPayload.map((item) => ({
        ...item,
        pharmacy_notes: null,
        procedure_notes: null,
        return_notes: null,
        products: null,
        procedure_kit_order_item_lots: [],
      })),
    };

    await validateAndReserveOrder(createdOrder);

    setWorkingId(null);
    await loadKitsData();
  }

  async function validateAndReserveOrder(order: ProcedureKitOrderDb) {
    const items = order.procedure_kit_order_items ?? [];

    if (items.length === 0) {
      notify("Orden vacía", "La orden no tiene ítems para validar.");
      return;
    }

    const now = inventoryTimestampWithoutTimezone(new Date());

    await supabase
      .from("procedure_kit_orders")
      .update({
        status: "VALIDATING",
        updated_at: now,
      })
      .eq("id", order.id);

    let hasInsufficientStock = false;

    for (const item of items) {
      if (!item.product_id) {
        hasInsufficientStock = true;

        await supabase
          .from("procedure_kit_order_items")
          .update({
            status: "INSUFFICIENT_STOCK",
            updated_at: now,
          })
          .eq("id", item.id);

        continue;
      }

      const requiredQuantity = Number(item.quantity_required ?? 0);

      if (requiredQuantity <= 0) {
        await supabase
          .from("procedure_kit_order_items")
          .update({
            status: "RESERVED",
            quantity_reserved: 0,
            updated_at: now,
          })
          .eq("id", item.id);

        continue;
      }

      const { data: lots, error: lotsError } = await supabase
        .from("inventory_lots")
        .select(`
          id,
          clinic_id,
          product_id,
          location_id,
          internal_lot_code,
          manufacturer_lot,
          expiration_date,
          quantity_available,
          quantity_reserved,
          quantity_consumed,
          status
        `)
        .eq("product_id", item.product_id)
        .gt("quantity_available", 0)
        .not("status", "in", '("expired","blocked","quarantined","destroyed")')
        .order("expiration_date", { ascending: true });

      if (lotsError) {
        console.error("Error loading lots for kit reservation:", lotsError);
        hasInsufficientStock = true;

        await supabase
          .from("procedure_kit_order_items")
          .update({
            status: "INSUFFICIENT_STOCK",
            updated_at: now,
          })
          .eq("id", item.id);

        continue;
      }

      let remaining = requiredQuantity;
      let reservedTotal = 0;

      for (const lot of lots ?? []) {
        if (remaining <= 0) break;

        const available = Number(lot.quantity_available ?? 0);
        if (available <= 0) continue;

        const reserveQty = Math.min(available, remaining);

        const newAvailable = available - reserveQty;
        const newReserved = Number(lot.quantity_reserved ?? 0) + reserveQty;

        const { error: lotUpdateError } = await supabase
          .from("inventory_lots")
          .update({
            quantity_available: newAvailable,
            quantity_reserved: newReserved,
            status: newAvailable <= 0 ? "reserved" : lot.status,
          })
          .eq("id", lot.id);

        if (lotUpdateError) {
          console.error("Error updating lot reservation:", lotUpdateError);
          continue;
        }

        const itemLotId = crypto.randomUUID();

        const { error: itemLotError } = await supabase
          .from("procedure_kit_order_item_lots")
          .insert({
            id: itemLotId,
            kit_order_item_id: item.id,
            product_id: item.product_id,
            lot_id: lot.id,
            quantity_reserved: reserveQty,
            quantity_prepared: 0,
            quantity_delivered: 0,
            quantity_used: 0,
            quantity_returned: 0,
            status: "RESERVED",
            created_at: now,
            updated_at: now,
          });

        if (itemLotError) {
          console.error("Error creating kit order item lot:", itemLotError);

          await supabase
            .from("inventory_lots")
            .update({
              quantity_available: available,
              quantity_reserved: lot.quantity_reserved ?? 0,
              status: lot.status,
            })
            .eq("id", lot.id);

          continue;
        }

        await insertProcedureKitMovement({
          kit_order_id: order.id,
          kit_order_item_id: item.id,
          kit_order_item_lot_id: itemLotId,
          clinic_id: order.clinic_id,
          product_id: item.product_id,
          lot_id: lot.id,
          movement_type: "KIT_RESERVED",
          quantity: reserveQty,
          source_location_id: lot.location_id,
          destination_location_id: null,
          reason: "Reserva FEFO de insumo para kit de procedimiento.",
          created_at: now,
        });

        reservedTotal += reserveQty;
        remaining -= reserveQty;
      }

      if (reservedTotal < requiredQuantity) {
        hasInsufficientStock = true;

        await supabase
          .from("procedure_kit_order_items")
          .update({
            status: "INSUFFICIENT_STOCK",
            quantity_reserved: reservedTotal,
            updated_at: now,
          })
          .eq("id", item.id);
      } else {
        await supabase
          .from("procedure_kit_order_items")
          .update({
            status: "RESERVED",
            quantity_reserved: reservedTotal,
            updated_at: now,
          })
          .eq("id", item.id);
      }
    }

    const finalStatus = hasInsufficientStock
      ? "INSUFFICIENT_STOCK"
      : "VALIDATED";

    await supabase
      .from("procedure_kit_orders")
      .update({
        status: finalStatus,
        validated_by: null,
        validated_at: now,
        updated_at: now,
      })
      .eq("id", order.id);

    notify(
      finalStatus === "VALIDATED" ? "Kit validado" : "Stock insuficiente",
      finalStatus === "VALIDATED"
        ? "Los insumos fueron reservados correctamente."
        : "Uno o varios insumos no tienen inventario suficiente.",
    );
  }

  async function sendOrderToPharmacy(order: ProcedureKitOrderDb) {
    const now = inventoryTimestampWithoutTimezone(new Date());

    setWorkingId(order.id);

    const { error } = await supabase
      .from("procedure_kit_orders")
      .update({
        status: "SENT_TO_PHARMACY",
        sent_to_pharmacy_by: null,
        sent_to_pharmacy_at: now,
        updated_at: now,
      })
      .eq("id", order.id);

    if (error) {
      console.error("Error sending kit order to pharmacy:", error);
      notify("Error", error.message || "No se pudo enviar a farmacia.");
      setWorkingId(null);
      return;
    }

    await insertProcedureKitMovement({
      kit_order_id: order.id,
      kit_order_item_id: null,
      kit_order_item_lot_id: null,
      clinic_id: order.clinic_id,
      product_id: null,
      lot_id: null,
      movement_type: "KIT_SENT_TO_PHARMACY",
      quantity: 0,
      source_location_id: null,
      destination_location_id: null,
      reason: "Orden de kit enviada a farmacia para alistamiento.",
      created_at: now,
    });

    notify("Enviado a farmacia", "La orden del kit fue enviada a farmacia.");

    setWorkingId(null);
    await loadKitsData();
  }

  async function markPreparedByPharmacy(order: ProcedureKitOrderDb) {
    const now = inventoryTimestampWithoutTimezone(new Date());
    const items = order.procedure_kit_order_items ?? [];

    setWorkingId(order.id);

    for (const item of items) {
      const itemLots = item.procedure_kit_order_item_lots ?? [];

      for (const lotRow of itemLots) {
        const preparedQty = Number(lotRow.quantity_reserved ?? 0);

        await supabase
          .from("procedure_kit_order_item_lots")
          .update({
            quantity_prepared: preparedQty,
            status: "PREPARED",
            updated_at: now,
          })
          .eq("id", lotRow.id);

        await insertProcedureKitMovement({
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
          reason: "Insumo alistado por farmacia para kit.",
          created_at: now,
        });
      }

      await supabase
        .from("procedure_kit_order_items")
        .update({
          quantity_prepared: Number(item.quantity_reserved ?? 0),
          status: "PREPARED",
          updated_at: now,
        })
        .eq("id", item.id);
    }

    const { error } = await supabase
      .from("procedure_kit_orders")
      .update({
        status: "PREPARED_BY_PHARMACY",
        prepared_by: null,
        prepared_at: now,
        updated_at: now,
      })
      .eq("id", order.id);

    if (error) {
      console.error("Error marking kit as prepared:", error);
      notify("Error", error.message || "No se pudo marcar como preparado.");
      setWorkingId(null);
      return;
    }

    notify("Kit preparado", "Farmacia alistó el kit correctamente.");

    setWorkingId(null);
    await loadKitsData();
  }

  async function deliverToProcedure(order: ProcedureKitOrderDb) {
    const now = inventoryTimestampWithoutTimezone(new Date());
    const items = order.procedure_kit_order_items ?? [];

    setWorkingId(order.id);

    for (const item of items) {
      const itemLots = item.procedure_kit_order_item_lots ?? [];

      for (const lotRow of itemLots) {
        const deliveredQty = Number(lotRow.quantity_prepared ?? 0);

        await supabase
          .from("procedure_kit_order_item_lots")
          .update({
            quantity_delivered: deliveredQty,
            status: "DELIVERED",
            updated_at: now,
          })
          .eq("id", lotRow.id);

        await insertProcedureKitMovement({
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

      await supabase
        .from("procedure_kit_order_items")
        .update({
          quantity_delivered: Number(item.quantity_prepared ?? 0),
          status: "DELIVERED",
          updated_at: now,
        })
        .eq("id", item.id);
    }

    const { error } = await supabase
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

    if (error) {
      console.error("Error delivering kit:", error);
      notify("Error", error.message || "No se pudo entregar al procedimiento.");
      setWorkingId(null);
      return;
    }

    notify("Kit entregado", "El kit fue entregado al procedimiento.");

    setWorkingId(null);
    await loadKitsData();
  }

  async function closeUsageAndReturns(order: ProcedureKitOrderDb) {
    const now = inventoryTimestampWithoutTimezone(new Date());
    const items = order.procedure_kit_order_items ?? [];

    setWorkingId(order.id);

    let totalUsed = 0;
    let totalReturned = 0;

    for (const item of items) {
      let itemUsed = 0;
      let itemReturned = 0;

      for (const lotRow of item.procedure_kit_order_item_lots ?? []) {
        const lot = normalizeKitRelation(lotRow.inventory_lots);
        if (!lot || !lotRow.lot_id) continue;

        const deliveredQty = Number(lotRow.quantity_delivered ?? 0);
        const usedQty = Math.max(
          0,
          Math.min(Number(usageByLotId[lotRow.id] ?? 0), deliveredQty),
        );
        const returnedQty = Math.max(deliveredQty - usedQty, 0);

        const newReserved = Math.max(
          Number(lot.quantity_reserved ?? 0) - deliveredQty,
          0,
        );
        const newConsumed = Number(lot.quantity_consumed ?? 0) + usedQty;
        const newAvailable = Number(lot.quantity_available ?? 0) + returnedQty;

        const newLotStatus =
          newAvailable > 0
            ? "available"
            : newReserved > 0
              ? "reserved"
              : "consumed";

        const { error: lotError } = await supabase
          .from("inventory_lots")
          .update({
            quantity_reserved: newReserved,
            quantity_consumed: newConsumed,
            quantity_available: newAvailable,
            status: newLotStatus,
          })
          .eq("id", lotRow.lot_id);

        if (lotError) {
          console.error("Error updating inventory after kit usage:", lotError);
          notify("Error", lotError.message || "No se pudo actualizar el lote.");
          setWorkingId(null);
          return;
        }

        const lotStatus =
          usedQty > 0 && returnedQty > 0
            ? "PARTIALLY_RETURNED"
            : usedQty === 0 && returnedQty > 0
              ? "RETURNED"
              : "USED";

        await supabase
          .from("procedure_kit_order_item_lots")
          .update({
            quantity_used: usedQty,
            quantity_returned: returnedQty,
            status: lotStatus,
            updated_at: now,
          })
          .eq("id", lotRow.id);

        if (usedQty > 0) {
          await insertProcedureKitMovement({
            kit_order_id: order.id,
            kit_order_item_id: item.id,
            kit_order_item_lot_id: lotRow.id,
            clinic_id: order.clinic_id,
            product_id: item.product_id,
            lot_id: lotRow.lot_id,
            movement_type: "KIT_USED_IN_PROCEDURE",
            quantity: usedQty,
            source_location_id: null,
            destination_location_id: null,
            reason: "Insumo usado en procedimiento.",
            created_at: now,
          });
        }

        if (returnedQty > 0) {
          await insertProcedureKitMovement({
            kit_order_id: order.id,
            kit_order_item_id: item.id,
            kit_order_item_lot_id: lotRow.id,
            clinic_id: order.clinic_id,
            product_id: item.product_id,
            lot_id: lotRow.lot_id,
            movement_type: "KIT_RETURNED_TO_INVENTORY",
            quantity: returnedQty,
            source_location_id: null,
            destination_location_id: lot.location_id,
            reason:
              returnNotesByItemId[item.id] ||
              "Devolución de insumo no usado en procedimiento.",
            created_at: now,
          });
        }

        itemUsed += usedQty;
        itemReturned += returnedQty;
        totalUsed += usedQty;
        totalReturned += returnedQty;
      }

      const itemStatus =
        itemUsed > 0 && itemReturned > 0
          ? "PARTIALLY_RETURNED"
          : itemUsed === 0 && itemReturned > 0
            ? "RETURNED"
            : "USED";

      await supabase
        .from("procedure_kit_order_items")
        .update({
          quantity_used: itemUsed,
          quantity_returned: itemReturned,
          status: itemStatus,
          return_notes: returnNotesByItemId[item.id] || null,
          updated_at: now,
        })
        .eq("id", item.id);
    }

    const finalOrderStatus =
      totalUsed > 0 && totalReturned > 0
        ? "PARTIALLY_RETURNED"
        : totalUsed === 0 && totalReturned > 0
          ? "RETURNED"
          : "CLOSED";

    const { error: orderError } = await supabase
      .from("procedure_kit_orders")
      .update({
        status: finalOrderStatus,
        closed_by: null,
        closed_at: now,
        updated_at: now,
      })
      .eq("id", order.id);

    if (orderError) {
      console.error("Error closing kit order:", orderError);
      notify("Error", orderError.message || "No se pudo cerrar la orden.");
      setWorkingId(null);
      return;
    }

    notify(
      "Kit cerrado",
      "Se registró el consumo real y la devolución de insumos no usados.",
    );

    setUsageByLotId({});
    setReturnNotesByItemId({});
    setWorkingId(null);
    await loadKitsData();
  }

  async function cancelOrder(order: ProcedureKitOrderDb) {
    const now = inventoryTimestampWithoutTimezone(new Date());

    setWorkingId(order.id);

    for (const item of order.procedure_kit_order_items ?? []) {
      for (const lotRow of item.procedure_kit_order_item_lots ?? []) {
        const lot = normalizeKitRelation(lotRow.inventory_lots);
        if (!lot || !lotRow.lot_id) continue;

        const reservedQty = Number(lotRow.quantity_reserved ?? 0);

        if (reservedQty > 0) {
          const newAvailable = Number(lot.quantity_available ?? 0) + reservedQty;
          const newReserved = Math.max(
            Number(lot.quantity_reserved ?? 0) - reservedQty,
            0,
          );

          await supabase
            .from("inventory_lots")
            .update({
              quantity_available: newAvailable,
              quantity_reserved: newReserved,
              status: newAvailable > 0 ? "available" : lotRow.status,
            })
            .eq("id", lotRow.lot_id);

          await insertProcedureKitMovement({
            kit_order_id: order.id,
            kit_order_item_id: item.id,
            kit_order_item_lot_id: lotRow.id,
            clinic_id: order.clinic_id,
            product_id: item.product_id,
            lot_id: lotRow.lot_id,
            movement_type: "KIT_RESERVATION_CANCELLED",
            quantity: reservedQty,
            source_location_id: null,
            destination_location_id: lot.location_id,
            reason: "Cancelación de orden de kit.",
            created_at: now,
          });
        }

        await supabase
          .from("procedure_kit_order_item_lots")
          .update({
            status: "CANCELLED",
            updated_at: now,
          })
          .eq("id", lotRow.id);
      }

      await supabase
        .from("procedure_kit_order_items")
        .update({
          status: "CANCELLED",
          updated_at: now,
        })
        .eq("id", item.id);
    }

    const { error } = await supabase
      .from("procedure_kit_orders")
      .update({
        status: "CANCELLED",
        updated_at: now,
      })
      .eq("id", order.id);

    if (error) {
      console.error("Error cancelling kit order:", error);
      notify("Error", error.message || "No se pudo cancelar la orden.");
      setWorkingId(null);
      return;
    }

    notify("Orden cancelada", "La reserva fue reversada al inventario.");

    setWorkingId(null);
    await loadKitsData();
  }

  const filteredKits = kits.filter((kit) => {
    const text = `${kit.name ?? ""} ${kit.procedure_type ?? ""}`.toLowerCase();
    return !q || text.includes(q.toLowerCase());
  });

  const filteredOrders = orders.filter((order) => {
    if (orderFilter === "all") return true;
    return String(order.status ?? "").toUpperCase() === orderFilter;
  });

  const activeKits = kits.filter((kit) => kit.active !== false);
  const activeOrders = orders.filter(
    (order) =>
      !["CLOSED", "PARTIALLY_RETURNED", "RETURNED", "CANCELLED"].includes(
        String(order.status ?? "").toUpperCase(),
      ),
  );
  const shortageOrders = orders.filter(
    (order) => String(order.status ?? "").toUpperCase() === "INSUFFICIENT_STOCK",
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Active kits" value={activeKits.length} icon={Boxes} />
        <Kpi
          label="Open orders"
          value={activeOrders.length}
          icon={ClipboardList}
        />
        <Kpi
          label="Sent to pharmacy"
          value={
            orders.filter(
              (order) =>
                String(order.status ?? "").toUpperCase() === "SENT_TO_PHARMACY",
            ).length
          }
          icon={Truck}
        />
        <Kpi
          label="Stock issues"
          value={shortageOrders.length}
          tone={shortageOrders.length > 0 ? "warning" : "default"}
          icon={AlertTriangle}
        />
      </div>

      <Card>
        <div className="p-4 flex flex-wrap items-center justify-between gap-2 border-b border-border">
          <ToolbarSearch
            value={q}
            onChange={setQ}
            placeholder="Search kit or procedure type..."
          />

          <button
            onClick={onNew}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[11.5px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            New kit
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-[12px] text-muted-foreground flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Loading procedure kits...
          </div>
        ) : filteredKits.length === 0 ? (
          <div className="p-6 text-[12px] text-muted-foreground">
            No procedure kits found.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            {filteredKits.map((kit) => {
              const items = kit.procedure_kit_items ?? [];
              const inactive = kit.active === false;

              return (
                <Card key={kit.id} className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[14px] font-semibold tracking-tight">
                          {kit.name ?? "Unnamed kit"}
                        </h3>

                        {inactive ? (
                          <Pill tone="muted">Inactive</Pill>
                        ) : (
                          <Pill tone="success">Active</Pill>
                        )}
                      </div>

                      <p className="text-[11.5px] text-muted-foreground mt-0.5">
                        {kit.procedure_type ?? "No procedure type"} ·{" "}
                        {items.length} component
                        {items.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(kit.id)}
                        className="h-8 px-2.5 rounded-md border border-border bg-card hover:bg-secondary text-[11px] font-medium inline-flex items-center gap-1"
                      >
                        <Pencil className="size-3" />
                        Edit
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {items.length === 0 ? (
                      <div className="text-[11px] text-muted-foreground border border-dashed border-border rounded-md px-3 py-3 text-center">
                        This kit has no configured components.
                      </div>
                    ) : (
                      items.map((item) => {
                        const product = normalizeKitRelation(item.products);

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 text-[12px] py-1.5 px-2.5 rounded-md hover:bg-secondary/50"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <CircleDot className="size-2.5 shrink-0 text-primary" />
                              <span className="truncate">
                                {product?.name ?? "Producto sin nombre"}
                              </span>
                              {item.required === false && (
                                <Pill tone="muted">Optional</Pill>
                              )}
                            </div>

                            <div className="text-[11px] tabular-nums shrink-0">
                              <span className="font-semibold">
                                {Number(item.quantity_required ?? 0)}{" "}
                                {item.unit_of_measure ??
                                  product?.unit_of_measure ??
                                  ""}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Layers className="size-3" />
                      Template only
                    </div>

                    <button
                      onClick={() => createOrderAndReserve(kit)}
                      disabled={inactive || workingId === kit.id || items.length === 0}
                      className="inline-flex items-center gap-1.5 h-8 px-3 text-[11.5px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {workingId === kit.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Package className="size-3.5" />
                      )}
                      Crear orden y reservar
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className="p-4 flex flex-wrap items-center justify-between gap-2 border-b border-border">
          <div>
            <h2 className="text-[14px] font-semibold">Kit orders</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Trazabilidad de reserva, farmacia, entrega, uso y devolución.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              "all",
              "VALIDATED",
              "INSUFFICIENT_STOCK",
              "SENT_TO_PHARMACY",
              "PREPARED_BY_PHARMACY",
              "DELIVERED_TO_PROCEDURE",
              "CLOSED",
              "PARTIALLY_RETURNED",
              "RETURNED",
              "CANCELLED",
            ].map((status) => (
              <FilterBtn
                key={status}
                active={orderFilter === status}
                onClick={() => setOrderFilter(status)}
              >
                {status === "all" ? "All" : status}
              </FilterBtn>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border">
          {filteredOrders.length === 0 ? (
            <div className="p-6 text-[12px] text-muted-foreground">
              No kit orders found.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const kit = normalizeKitRelation(order.procedure_kits);
              const itemCount = order.procedure_kit_order_items?.length ?? 0;

              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={cn(
                    "w-full text-left grid grid-cols-12 gap-3 px-4 py-3.5 hover:bg-accent/30 transition-colors items-center",
                    selectedOrder?.id === order.id && "bg-accent/50",
                  )}
                >
                  <div className="col-span-3">
                    <p className="font-semibold text-[12.5px]">
                      {kit?.name ?? "Kit"} · {order.id.slice(0, 8)}
                    </p>

                    <p className="text-[10.5px] text-muted-foreground">
                      {order.requested_at
                        ? formatInventoryDate(order.requested_at)
                        : "-"}
                    </p>
                  </div>

                  <div className="col-span-3 text-[11.5px] text-muted-foreground">
                    {order.procedure_type ?? "No procedure type"}
                  </div>

                  <div className="col-span-3 text-[11.5px] text-muted-foreground">
                    {itemCount} insumo{itemCount === 1 ? "" : "s"}
                  </div>

                  <div className="col-span-2">
                    <ProcedureKitStatusBadge status={order.status ?? "DRAFT"} />
                  </div>

                  <div className="col-span-1 text-right">
                    <ChevronRight className="size-3.5 text-muted-foreground ml-auto" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </Card>

      {selectedOrder && (
        <ProcedureKitOrderPanel
          order={selectedOrder}
          workingId={workingId}
          usageByLotId={usageByLotId}
          setUsageByLotId={setUsageByLotId}
          returnNotesByItemId={returnNotesByItemId}
          setReturnNotesByItemId={setReturnNotesByItemId}
          onClose={() => setSelectedOrder(null)}
          onSendToPharmacy={sendOrderToPharmacy}
          onPrepared={markPreparedByPharmacy}
          onDelivered={deliverToProcedure}
          onCloseUsage={closeUsageAndReturns}
          onCancel={cancelOrder}
        />
      )}
    </div>
  );
}

function ProcedureKitOrderPanel({
  order,
  workingId,
  usageByLotId,
  setUsageByLotId,
  returnNotesByItemId,
  setReturnNotesByItemId,
  onClose,
  onSendToPharmacy,
  onPrepared,
  onDelivered,
  onCloseUsage,
  onCancel,
}: {
  order: ProcedureKitOrderDb;
  workingId: string | null;
  usageByLotId: Record<string, string>;
  setUsageByLotId: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  returnNotesByItemId: Record<string, string>;
  setReturnNotesByItemId: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  onClose: () => void;
  onSendToPharmacy: (order: ProcedureKitOrderDb) => Promise<void>;
  onPrepared: (order: ProcedureKitOrderDb) => Promise<void>;
  onDelivered: (order: ProcedureKitOrderDb) => Promise<void>;
  onCloseUsage: (order: ProcedureKitOrderDb) => Promise<void>;
  onCancel: (order: ProcedureKitOrderDb) => Promise<void>;
}) {
  const kit = normalizeKitRelation(order.procedure_kits);
  const status = String(order.status ?? "DRAFT").toUpperCase();

  const canSendToPharmacy = status === "VALIDATED";
  const canPrepare = status === "SENT_TO_PHARMACY";
  const canDeliver = status === "PREPARED_BY_PHARMACY";
  const canCloseUsage = status === "DELIVERED_TO_PROCEDURE";
  const canCancel = ![
    "CLOSED",
    "PARTIALLY_RETURNED",
    "RETURNED",
    "CANCELLED",
  ].includes(status);

  return (
    <Panel
      title={`Kit order · ${order.id.slice(0, 8)}`}
      subtitle={`${kit?.name ?? "Kit"} · ${order.procedure_type ?? "No procedure type"}`}
      onClose={onClose}
      width="max-w-5xl"
      footer={
        <div className="flex items-center justify-between gap-2">
          <div>
            {canCancel && (
              <button
                onClick={() => onCancel(order)}
                disabled={workingId === order.id}
                className="h-9 px-3 text-[12px] font-medium rounded-md border border-critical/30 bg-critical/5 text-critical hover:bg-critical/10 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <XCircle className="size-3.5" />
                Cancelar orden
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary"
            >
              Cerrar
            </button>

            {canSendToPharmacy && (
              <button
                onClick={() => onSendToPharmacy(order)}
                disabled={workingId === order.id}
                className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Send className="size-3.5" />
                Enviar a farmacia
              </button>
            )}

            {canPrepare && (
              <button
                onClick={() => onPrepared(order)}
                disabled={workingId === order.id}
                className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Package className="size-3.5" />
                Marcar preparado
              </button>
            )}

            {canDeliver && (
              <button
                onClick={() => onDelivered(order)}
                disabled={workingId === order.id}
                className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Truck className="size-3.5" />
                Entregar al procedimiento
              </button>
            )}

            {canCloseUsage && (
              <button
                onClick={() => onCloseUsage(order)}
                disabled={workingId === order.id}
                className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="size-3.5" />
                Cerrar uso/devolución
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-accent/30 p-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
              Estado de orden
            </p>

            <div className="mt-1">
              <ProcedureKitStatusBadge status={order.status ?? "DRAFT"} />
            </div>

            <p className="text-[11px] text-muted-foreground mt-2">
              La reserva no es consumo. El consumo real se registra al cerrar el
              procedimiento.
            </p>
          </div>

          {workingId === order.id && (
            <div className="text-[11px] text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin" />
              Procesando...
            </div>
          )}
        </div>

        <div className="space-y-3">
          {(order.procedure_kit_order_items ?? []).map((item) => {
            const product = normalizeKitRelation(item.products);

            return (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold">
                      {product?.name ?? "Producto"}
                    </p>

                    <p className="text-[11px] text-muted-foreground mt-1">
                      Requerido: {Number(item.quantity_required ?? 0)}{" "}
                      {item.unit_of_measure ?? product?.unit_of_measure ?? ""}
                      {" · "}
                      Reservado: {Number(item.quantity_reserved ?? 0)}
                      {" · "}
                      Preparado: {Number(item.quantity_prepared ?? 0)}
                      {" · "}
                      Entregado: {Number(item.quantity_delivered ?? 0)}
                      {" · "}
                      Usado: {Number(item.quantity_used ?? 0)}
                      {" · "}
                      Devuelto: {Number(item.quantity_returned ?? 0)}
                    </p>
                  </div>

                  <ProcedureKitStatusBadge status={item.status ?? "PENDING"} />
                </div>

                {(item.procedure_kit_order_item_lots ?? []).length > 0 && (
                  <div className="mt-4 space-y-2">
                    {(item.procedure_kit_order_item_lots ?? []).map((lotRow) => {
                      const lot = normalizeKitRelation(lotRow.inventory_lots);
                      const deliveredQty = Number(
                        lotRow.quantity_delivered ?? 0,
                      );
                      const usedQty = Number(usageByLotId[lotRow.id] ?? 0);
                      const returnedQty = Math.max(deliveredQty - usedQty, 0);

                      return (
                        <div
                          key={lotRow.id}
                          className="rounded-lg border border-border bg-secondary/20 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-medium">
                                Lote:{" "}
                                <span className="font-mono">
                                  {lot?.manufacturer_lot ??
                                    lot?.internal_lot_code ??
                                    lotRow.lot_id ??
                                    "-"}
                                </span>
                              </p>

                              <p className="text-[10.5px] text-muted-foreground mt-1">
                                Reservado:{" "}
                                {Number(lotRow.quantity_reserved ?? 0)}
                                {" · "}
                                Preparado:{" "}
                                {Number(lotRow.quantity_prepared ?? 0)}
                                {" · "}
                                Entregado: {deliveredQty}
                                {" · "}
                                Usado: {Number(lotRow.quantity_used ?? 0)}
                                {" · "}
                                Devuelto:{" "}
                                {Number(lotRow.quantity_returned ?? 0)}
                              </p>

                              {lot?.expiration_date && (
                                <p className="text-[10.5px] text-muted-foreground">
                                  Vence: {formatInventoryDate(lot.expiration_date)}
                                </p>
                              )}
                            </div>

                            <ProcedureKitStatusBadge
                              status={lotRow.status ?? "RESERVED"}
                            />
                          </div>

                          {status === "DELIVERED_TO_PROCEDURE" &&
                            deliveredQty > 0 && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <label className="block">
                                  <span className="text-[10.5px] text-muted-foreground">
                                    Cantidad usada
                                  </span>

                                  <input
                                    type="number"
                                    min={0}
                                    max={deliveredQty}
                                    value={usageByLotId[lotRow.id] ?? ""}
                                    onChange={(event) =>
                                      setUsageByLotId((current) => ({
                                        ...current,
                                        [lotRow.id]: event.target.value,
                                      }))
                                    }
                                    placeholder={`Máximo ${deliveredQty}`}
                                    className="mt-1 w-full h-8 rounded-md border border-border bg-card px-2 text-[11px] outline-none"
                                  />
                                </label>

                                <Field label="Devolución calculada">
                                  {returnedQty}
                                </Field>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {status === "DELIVERED_TO_PROCEDURE" && (
                  <div className="mt-3">
                    <textarea
                      value={returnNotesByItemId[item.id] ?? ""}
                      onChange={(event) =>
                        setReturnNotesByItemId((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder="Notas de uso o devolución del insumo..."
                      className="w-full min-h-[60px] rounded-md border border-border bg-card px-3 py-2 text-[11px] outline-none"
                    />
                  </div>
                )}

                {String(item.status ?? "").toUpperCase() ===
                  "INSUFFICIENT_STOCK" && (
                  <div className="mt-3 rounded-md border border-warning/20 bg-warning/5 text-warning px-3 py-2 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="size-3.5" />
                    Stock insuficiente para este insumo.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function KitEditPanel({
  kitId,
  onClose,
}: {
  kitId: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [kit, setKit] = useState<ProcedureKitDb | null>(null);

  const [name, setName] = useState("");
  const [procedureType, setProcedureType] = useState("");
  const [active, setActive] = useState(true);

  const [items, setItems] = useState<
    {
      id?: string;
      product_id: string;
      quantity_required: string;
      required: boolean;
      unit_of_measure: string;
      notes: string;
      deleted?: boolean;
    }[]
  >([]);

  useEffect(() => {
    loadEditData();
  }, [kitId]);

  async function loadEditData() {
    setLoading(true);

    const [{ data: productRows }, { data: kitData, error: kitError }] =
      await Promise.all([
        supabase
          .from("products")
          .select("id, name, unit_of_measure, presentation, category")
          .eq("active", true)
          .order("name"),
        supabase
          .from("procedure_kits")
          .select(`
            id,
            clinic_id,
            name,
            procedure_type,
            active,
            procedure_kit_items (
              id,
              kit_id,
              product_id,
              quantity_required,
              required,
              unit_of_measure,
              notes,
              products (
                id,
                name,
                unit_of_measure,
                presentation,
                category
              )
            )
          `)
          .eq("id", kitId)
          .single(),
      ]);

    setProducts(productRows ?? []);

    if (kitError || !kitData) {
      console.error("Error loading kit:", kitError);
      notify("Error", kitError?.message || "No se pudo cargar el kit.");
      setLoading(false);
      return;
    }

    const normalized = {
      ...kitData,
      procedure_kit_items: (kitData.procedure_kit_items ?? []).map(
        (item: any) => ({
          ...item,
          products: normalizeKitRelation(item.products),
        }),
      ),
    } as ProcedureKitDb;

    setKit(normalized);
    setName(normalized.name ?? "");
    setProcedureType(normalized.procedure_type ?? "");
    setActive(normalized.active !== false);

    setItems(
      (normalized.procedure_kit_items ?? []).map((item) => ({
        id: item.id,
        product_id: item.product_id ?? "",
        quantity_required: String(Number(item.quantity_required ?? 0)),
        required: item.required !== false,
        unit_of_measure:
          item.unit_of_measure ??
          normalizeKitRelation(item.products)?.unit_of_measure ??
          "",
        notes: item.notes ?? "",
      })),
    );

    setLoading(false);
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        product_id: "",
        quantity_required: "1",
        required: true,
        unit_of_measure: "",
        notes: "",
      },
    ]);
  }

  async function saveKit() {
    if (!kit) return;

    if (!name.trim()) {
      notify("Nombre requerido", "El nombre del kit es obligatorio.");
      return;
    }

    const validItems = items.filter((item) => !item.deleted);

    if (validItems.length === 0) {
      notify("Componentes requeridos", "El kit debe tener al menos un insumo.");
      return;
    }

    if (validItems.some((item) => !item.product_id)) {
      notify("Producto requerido", "Todos los componentes deben tener producto.");
      return;
    }

    setSaving(true);

    const now = inventoryTimestampWithoutTimezone(new Date());

    const { error: kitError } = await supabase
      .from("procedure_kits")
      .update({
        name: name.trim(),
        procedure_type: procedureType.trim() || null,
        active,
        updated_at: now,
      })
      .eq("id", kit.id);

    if (kitError) {
      console.error("Error updating kit:", kitError);
      notify("Error", kitError.message || "No se pudo actualizar el kit.");
      setSaving(false);
      return;
    }

    for (const item of items) {
      if (item.id && item.deleted) {
        await supabase.from("procedure_kit_items").delete().eq("id", item.id);
        continue;
      }

      if (item.deleted) continue;

      const payload = {
        kit_id: kit.id,
        product_id: item.product_id,
        quantity_required: Number(item.quantity_required || 0),
        required: item.required,
        unit_of_measure: item.unit_of_measure || null,
        notes: item.notes.trim() || null,
        updated_at: now,
      };

      if (item.id) {
        await supabase
          .from("procedure_kit_items")
          .update(payload)
          .eq("id", item.id);
      } else {
        await supabase.from("procedure_kit_items").insert({
          id: crypto.randomUUID(),
          ...payload,
          created_at: now,
        });
      }
    }

    notify("Kit actualizado", "Los cambios del kit fueron guardados.");

    window.dispatchEvent(new Event("procedure-kits-refresh"));

    setSaving(false);
    onClose();
  }

  return (
    <Panel
      title="Edit procedure kit"
      subtitle={loading ? "Loading kit..." : name || kitId}
      onClose={onClose}
      width="max-w-3xl"
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setActive((value) => !value)}
            disabled={saving || loading}
            className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Power className="size-3.5" />
            {active ? "Deactivate" : "Activate"}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={saveKit}
              disabled={saving || loading}
              className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save kit"}
            </button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="text-[12px] text-muted-foreground">
          Loading kit information...
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kit name"
              value={name}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setName(event.target.value)
              }
            />

            <Input
              label="Procedure type"
              value={procedureType}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setProcedureType(event.target.value)
              }
            />
          </div>

          <Checkbox
            label="Active"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />

          <div>
            <SectionHeader
              title="Components"
              hint="Productos que componen el kit base"
              action={
                <button
                  onClick={addItem}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 text-[11.5px] font-medium rounded-md border border-border bg-card hover:bg-secondary"
                >
                  <Plus className="size-3" />
                  Add component
                </button>
              }
            />

            <div className="space-y-2">
              {items
                .filter((item) => !item.deleted)
                .map((item, index) => (
                  <KitComponentEditorRow
                    key={item.id ?? index}
                    item={item}
                    products={products}
                    onChange={(next) =>
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? next : row,
                        ),
                      )
                    }
                    onRemove={() =>
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index
                            ? row.id
                              ? { ...row, deleted: true }
                              : { ...row, deleted: true }
                            : row,
                        ),
                      )
                    }
                  />
                ))}
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

function NewKitPanel({ onClose }: { onClose: () => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);

  const [clinicId, setClinicId] = useState("");
  const [name, setName] = useState("");
  const [procedureType, setProcedureType] = useState("");
  const [creating, setCreating] = useState(false);

  const [items, setItems] = useState<
    {
      product_id: string;
      quantity_required: string;
      required: boolean;
      unit_of_measure: string;
      notes: string;
    }[]
  >([]);

  useEffect(() => {
    loadNewKitData();
  }, []);

  async function loadNewKitData() {
    const [{ data: clinicRows }, { data: productRows }] = await Promise.all([
      supabase.from("clinics").select("id, legal_name").order("legal_name"),
      supabase
        .from("products")
        .select("id, name, unit_of_measure, presentation, category")
        .eq("active", true)
        .order("name"),
    ]);

    setClinics(clinicRows ?? []);
    setProducts(productRows ?? []);
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        product_id: "",
        quantity_required: "1",
        required: true,
        unit_of_measure: "",
        notes: "",
      },
    ]);
  }

  async function createKit() {
    if (!clinicId) {
      notify("Clínica requerida", "Selecciona la clínica del kit.");
      return;
    }

    if (!name.trim()) {
      notify("Nombre requerido", "El nombre del kit es obligatorio.");
      return;
    }

    if (!procedureType.trim()) {
      notify(
        "Procedimiento requerido",
        "El tipo de procedimiento es obligatorio.",
      );
      return;
    }

    if (items.length === 0) {
      notify("Componentes requeridos", "Agrega al menos un insumo al kit.");
      return;
    }

    if (items.some((item) => !item.product_id)) {
      notify("Producto requerido", "Todos los componentes deben tener producto.");
      return;
    }

    setCreating(true);

    const now = inventoryTimestampWithoutTimezone(new Date());
    const kitId = crypto.randomUUID();

    const { error: kitError } = await supabase.from("procedure_kits").insert({
      id: kitId,
      clinic_id: clinicId,
      name: name.trim(),
      procedure_type: procedureType.trim(),
      active: true,
      created_at: now,
      updated_at: now,
    });

    if (kitError) {
      console.error("Error creating kit:", kitError);
      notify("Error", kitError.message || "No se pudo crear el kit.");
      setCreating(false);
      return;
    }

    const itemPayload = items.map((item) => ({
      id: crypto.randomUUID(),
      kit_id: kitId,
      product_id: item.product_id,
      quantity_required: Number(item.quantity_required || 0),
      required: item.required,
      unit_of_measure: item.unit_of_measure || null,
      notes: item.notes.trim() || null,
      created_at: now,
      updated_at: now,
    }));

    const { error: itemError } = await supabase
      .from("procedure_kit_items")
      .insert(itemPayload);

    if (itemError) {
      console.error("Error creating kit items:", itemError);

      await supabase.from("procedure_kits").delete().eq("id", kitId);

      notify("Error", itemError.message || "No se pudieron crear los insumos.");
      setCreating(false);
      return;
    }

    notify("Kit creado", "El kit quedó creado como plantilla de procedimiento.");

    window.dispatchEvent(new Event("procedure-kits-refresh"));

    setCreating(false);
    onClose();
  }

  return (
    <Panel
      title="New procedure kit"
      subtitle="Crea una plantilla de insumos para un procedimiento"
      onClose={onClose}
      width="max-w-3xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={creating}
            className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={createKit}
            disabled={creating}
            className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create kit"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div>
            <h3 className="text-[13px] font-semibold">Kit information</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Define la plantilla base del kit. Esto todavía no reserva
              inventario.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block col-span-2">
              <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                Clinic
              </span>

              <select
                value={clinicId}
                onChange={(event) => setClinicId(event.target.value)}
                className="mt-1 w-full h-9 px-3 text-[12.5px] rounded-md border border-border bg-card focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-accent"
              >
                <option value="">Select clinic</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.legal_name}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="Kit name"
              placeholder="Ej. Kit aspiración folicular"
              value={name}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setName(event.target.value)
              }
            />

            <Input
              label="Procedure type"
              placeholder="Ej. Egg retrieval"
              value={procedureType}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setProcedureType(event.target.value)
              }
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <SectionHeader
            title="Components"
            hint="Agrega los insumos requeridos para este procedimiento"
            action={
              <button
                onClick={addItem}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 text-[11.5px] font-medium rounded-md border border-border bg-card hover:bg-secondary"
              >
                <Plus className="size-3" />
                Add component
              </button>
            }
          />

          {items.length === 0 ? (
            <p className="text-[12px] text-muted-foreground text-center py-6 border border-dashed border-border rounded-md">
              No components yet.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <KitComponentEditorRow
                  key={index}
                  item={item}
                  products={products}
                  onChange={(next) =>
                    setItems((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? next : row,
                      ),
                    )
                  }
                  onRemove={() =>
                    setItems((current) =>
                      current.filter((_, rowIndex) => rowIndex !== index),
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </Panel>
  );
}

function KitComponentEditorRow({
  item,
  products,
  onChange,
  onRemove,
}: {
  item: {
    id?: string;
    product_id: string;
    quantity_required: string;
    required: boolean;
    unit_of_measure: string;
    notes: string;
    deleted?: boolean;
  };
  products: any[];
  onChange: (next: typeof item) => void;
  onRemove: () => void;
}) {
  const selectedProduct = products.find((product) => product.id === item.product_id);

  return (
    <div className="grid grid-cols-12 gap-2 items-end rounded-md border border-border bg-secondary/20 p-3">
      <label className="col-span-5 block">
        <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
          Product
        </span>

        <select
          value={item.product_id}
          onChange={(event) => {
            const product = products.find((p) => p.id === event.target.value);

            onChange({
              ...item,
              product_id: event.target.value,
              unit_of_measure: product?.unit_of_measure ?? item.unit_of_measure,
            });
          }}
          className="mt-1 w-full h-9 px-2 text-[12px] rounded-md border border-border bg-card"
        >
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
              {product.presentation ? ` · ${product.presentation}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="col-span-2 block">
        <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
          Qty
        </span>

        <input
          type="number"
          min={0}
          value={item.quantity_required}
          onChange={(event) =>
            onChange({
              ...item,
              quantity_required: event.target.value,
            })
          }
          className="mt-1 w-full h-9 px-2 text-[12px] rounded-md border border-border bg-card text-right tabular-nums"
        />
      </label>

      <label className="col-span-2 block">
        <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
          Unit
        </span>

        <input
          value={item.unit_of_measure}
          onChange={(event) =>
            onChange({
              ...item,
              unit_of_measure: event.target.value,
            })
          }
          placeholder={selectedProduct?.unit_of_measure ?? "unit"}
          className="mt-1 w-full h-9 px-2 text-[12px] rounded-md border border-border bg-card"
        />
      </label>

      <div className="col-span-2">
        <Checkbox
          label="Required"
          checked={item.required}
          onChange={(event) =>
            onChange({
              ...item,
              required: event.target.checked,
            })
          }
        />
      </div>

      <button
        onClick={onRemove}
        className="col-span-1 size-9 rounded-md hover:bg-critical/10 hover:text-critical inline-flex items-center justify-center text-muted-foreground"
      >
        <Trash2 className="size-3.5" />
      </button>

      <label className="col-span-12 block">
        <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
          Notes
        </span>

        <input
          value={item.notes}
          onChange={(event) =>
            onChange({
              ...item,
              notes: event.target.value,
            })
          }
          placeholder="Notas del insumo..."
          className="mt-1 w-full h-9 px-2 text-[12px] rounded-md border border-border bg-card"
        />
      </label>
    </div>
  );
}

function ProcedureKitStatusBadge({ status }: { status: string }) {
  const normalized = String(status ?? "DRAFT").toUpperCase();

  const tone: KitStatusTone =
    normalized === "VALIDATED" ||
    normalized === "RESERVED" ||
    normalized === "PREPARED_BY_PHARMACY" ||
    normalized === "PREPARED" ||
    normalized === "DELIVERED_TO_PROCEDURE" ||
    normalized === "DELIVERED" ||
    normalized === "CLOSED" ||
    normalized === "USED"
      ? "success"
      : normalized === "DRAFT" ||
          normalized === "VALIDATING" ||
          normalized === "SENT_TO_PHARMACY"
        ? "primary"
        : normalized === "INSUFFICIENT_STOCK"
          ? "warning"
          : normalized === "CANCELLED" || normalized === "REJECTED"
            ? "critical"
            : "muted";

  return <Pill tone={tone}>{normalized}</Pill>;
}

async function insertProcedureKitMovement(payload: {
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
    console.error("Error inserting procedure kit movement:", error);
  }
}

function normalizeKitRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function formatInventoryDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

function Input({ label, className = "", ...props }: InputProps) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </span>

      <input
        {...props}
        className={cn(
          "mt-1 w-full h-9 px-3 text-[12.5px] rounded-md border border-border bg-card focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-accent",
          className
        )}
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
type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: string[];
};

function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </span>

      <select
        {...props}
        className={cn(
          "mt-1 w-full h-9 px-3 text-[12.5px] rounded-md border border-border bg-card focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-accent",
          className
        )}
      >
        <option value="">Select option</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: string;
};

function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className="inline-flex items-center gap-2 text-[12.5px] cursor-pointer">
      <input
        type="checkbox"
        {...props}
        className={cn("size-4 rounded border-border accent-primary", className)}
      />

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
                  <InventoryLotStatusBadge status={l.status} />
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

type SupplierProduct = {
  id: string;
  name: string | null;
  generic_name: string | null;
  product_type: string | null;
  category: string | null;
  presentation: string | null;
  unit_of_measure: string | null;
  brand: string | null;
  manufacturer: string | null;
  reference_code: string | null;
  active: boolean | null;
};

type SupplierProductRow = {
  id: string;
  product_id: string;
  supplier_id: string;
  clinic_id: string | null;
  is_primary: boolean | null;
  products: SupplierProduct | null;
};

type SupplierLotProduct = {
  id: string;
  name: string | null;
};

type SupplierLotRow = {
  id: string;
  product_id: string | null;
  internal_lot_code: string | null;
  manufacturer_lot: string | null;
  expiration_date: string | null;
  status: string | null;
  quantity_initial: number | null;
  quantity_available: number | null;
  quantity_reserved: number | null;
  products: SupplierLotProduct | null;
};

type RawSupplierProductRow = Omit<SupplierProductRow, "products"> & {
  products: SupplierProduct | SupplierProduct[] | null;
};

type RawSupplierLotRow = Omit<SupplierLotRow, "products"> & {
  products: SupplierLotProduct | SupplierLotProduct[] | null;
};

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function formatDateShort(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function SupplierPanel({
  supplier,
  onClose,
}: {
  supplier: Supplier;
  onClose: () => void;
}) {
  const [linkedProducts, setLinkedProducts] = useState<SupplierProductRow[]>([]);
  const [recentLots, setRecentLots] = useState<SupplierLotRow[]>([]);
  const [loadingRelations, setLoadingRelations] = useState(false);

  const supplierData = supplier as Supplier & {
    id: string;
    name?: string | null;
    nit?: string | null;
    contact_name?: string | null;
    contact?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    active?: boolean | null;
    categories?: string[];
    notes?: string | null;
  };

  useEffect(() => {
    loadSupplierRelations();
  }, [supplierData.id]);

  async function loadSupplierRelations() {
    setLoadingRelations(true);

    const { data: productLinksData, error: productLinksError } = await supabase
      .from("product_suppliers")
      .select(`
        id,
        product_id,
        supplier_id,
        clinic_id,
        is_primary,
        products (
          id,
          name,
          generic_name,
          product_type,
          category,
          presentation,
          unit_of_measure,
          brand,
          manufacturer,
          reference_code,
          active
        )
      `)
      .eq("supplier_id", supplierData.id)
      .order("is_primary", { ascending: false });

    console.log("SUPPLIER PRODUCT LINKS", productLinksData);
    console.log("SUPPLIER PRODUCT LINKS ERROR", productLinksError);

    if (productLinksError || !productLinksData) {
      setLinkedProducts([]);
      setRecentLots([]);
      setLoadingRelations(false);
      return;
    }

    const normalizedProductLinks = (
      productLinksData as unknown as RawSupplierProductRow[]
    ).map((row) => ({
      ...row,
      products: normalizeRelation(row.products),
    }));

    setLinkedProducts(normalizedProductLinks);

    const productIds = normalizedProductLinks
      .map((row) => row.product_id)
      .filter(Boolean);

    if (productIds.length === 0) {
      setRecentLots([]);
      setLoadingRelations(false);
      return;
    }

    const { data: lotsData, error: lotsError } = await supabase
      .from("inventory_lots")
      .select(`
        id,
        product_id,
        internal_lot_code,
        manufacturer_lot,
        expiration_date,
        status,
        quantity_initial,
        quantity_available,
        quantity_reserved,
        products (
          id,
          name
        )
      `)
      .in("product_id", productIds)
      .order("expiration_date", { ascending: true })
      .limit(10);

    console.log("SUPPLIER LOTS", lotsData);
    console.log("SUPPLIER LOTS ERROR", lotsError);

    if (lotsError || !lotsData) {
      setRecentLots([]);
      setLoadingRelations(false);
      return;
    }

    const normalizedLots = (lotsData as unknown as RawSupplierLotRow[]).map(
      (row) => ({
        ...row,
        products: normalizeRelation(row.products),
      }),
    );

    setRecentLots(normalizedLots);
    setLoadingRelations(false);
  }

  const activeProducts = linkedProducts.filter(
    (item) => item.products?.active !== false,
  );

  const openLots = recentLots.filter(
    (lot) =>
      !lot.status ||
      lot.status === "AVAILABLE" ||
      lot.status === "ACTIVE" ||
      lot.status === "QUARANTINE",
  );

  const categories = Array.from(
    new Set(
      linkedProducts
        .map((item) => item.products?.category)
        .filter(Boolean) as string[],
    ),
  );

  const supplierSubtitle = [
    supplierData.nit ? `NIT ${supplierData.nit}` : null,
    categories.length > 0 ? categories.join(", ") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Panel
      title={supplierData.name ?? "Supplier"}
      subtitle={supplierSubtitle || "Supplier detail"}
      onClose={onClose}
      width="max-w-3xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary"
          >
            Close
          </button>

          <button
            onClick={() =>
              runMockAction("Saving supplier", {
                success: "Supplier updated",
              })
            }
            className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Products" value={activeProducts.length} />

          <Stat label="Open lots" value={openLots.length} />

          <Stat
            label="Supplier relation"
            value={linkedProducts.length > 0 ? "Linked" : "No products"}
            tone={linkedProducts.length > 0 ? "success" : "warning"}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Contact name">
            {supplierData.contact_name ?? supplierData.contact ?? "-"}
          </Field>

          <Field label="Phone">{supplierData.phone ?? "-"}</Field>

          <Field label="Email">{supplierData.email ?? "-"}</Field>

          <Field label="Status">
            {supplierData.active !== false ? (
              <Pill tone="success">Active</Pill>
            ) : (
              <Pill tone="warning">Suspended</Pill>
            )}
          </Field>

          <div className="col-span-2">
            <Field label="Address">{supplierData.address ?? "-"}</Field>
          </div>
        </div>

        {supplierData.notes && (
          <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5 text-[11.5px] text-warning">
            ⚠ {supplierData.notes}
          </div>
        )}

        <div>
          <SectionHeader title="Products supplied" />

          {loadingRelations ? (
            <div className="rounded-md border border-border px-3 py-4 text-[12px] text-muted-foreground">
              Loading supplier products...
            </div>
          ) : linkedProducts.length === 0 ? (
            <div className="rounded-md border border-border px-3 py-4 text-[12px] text-muted-foreground">
              No products are linked to this supplier yet.
            </div>
          ) : (
            <div className="space-y-2">
              {linkedProducts.map((link) => {
                const product = link.products;

                return (
                  <div
                    key={link.id}
                    className="flex items-center justify-between border border-border rounded-md px-3 py-2 text-[12px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PillIcon className="size-3 text-muted-foreground shrink-0" />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {product?.name ?? "Unnamed product"}
                          </span>

                          {link.is_primary && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-primary font-medium">
                              Primary
                            </span>
                          )}

                          {product?.active === false && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-medium">
                              Inactive
                            </span>
                          )}
                        </div>

                        <div className="text-[10.5px] text-muted-foreground mt-0.5">
                          {product?.product_type ?? "Product"}
                          {product?.category ? ` · ${product.category}` : ""}
                          {product?.reference_code
                            ? ` · Ref ${product.reference_code}`
                            : ""}
                        </div>

                        {(product?.brand || product?.manufacturer) && (
                          <div className="text-[10.5px] text-muted-foreground mt-0.5">
                            {product.brand ?? ""}
                            {product.brand && product.manufacturer ? " · " : ""}
                            {product.manufacturer ?? ""}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-muted-foreground">
                        {product?.presentation ?? "-"}
                      </span>

                      <div className="text-[10.5px] text-muted-foreground">
                        {product?.unit_of_measure ?? ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <SectionHeader title="Recent lots" />

          {loadingRelations ? (
            <div className="rounded-md border border-border px-3 py-4 text-[12px] text-muted-foreground">
              Loading supplier lots...
            </div>
          ) : recentLots.length === 0 ? (
            <div className="rounded-md border border-border px-3 py-4 text-[12px] text-muted-foreground">
              No lots found for this supplier’s linked products.
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentLots.slice(0, 5).map((lot) => {
                const lotCode =
                  lot.internal_lot_code ??
                  lot.manufacturer_lot ??
                  lot.id.slice(0, 8);

                return (
                  <div
                    key={lot.id}
                    className="flex items-center justify-between border border-border rounded-md px-3 py-2 text-[11.5px]"
                  >
                    <div>
                      <span className="font-mono text-primary font-semibold">
                        {lotCode}
                      </span>

                      <span className="text-muted-foreground">
                        {" "}
                        · {lot.products?.name ?? "Product"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground tabular-nums">
                        {Number(lot.quantity_available ?? 0)} available
                      </span>

                      <span className="text-muted-foreground">
                        exp{" "}
                        {lot.expiration_date
                          ? formatDateShort(lot.expiration_date)
                          : "-"}
                      </span>

                      <InventoryLotStatusBadge status={lot.status ?? "AVAILABLE"} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                <InventoryLotStatusBadge status={l.status} />
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

type ClinicOption = {
  id: string;
  legal_name: string;
};
type ProductType =
  | "MEDICATION"
  | "HORMONE"
  | "MEDICAL_DEVICE"
  | "MEDICAL_EQUIPMENT"
  | "REAGENT"
  | "SUPPLY";


type SupplierOption = {
  id: string;
  clinic_id: string | null;
  name: string | null;
  nit: string | null;
};

type NewProductForm = {
  id: string;
  clinic_id: string;
  supplier_id: string;

  product_type: ProductType;

  name: string;
  generic_name: string;
  category: string;
  presentation: string;
  unit_of_measure: string;
  storage_condition: string;
  temperature_min: string;
  temperature_max: string;
  invima_registration: string;
  active: boolean;
  strength_value: string;

  brand: string;
  manufacturer: string;
  model: string;
  reference_code: string;
  risk_class: string;

  requires_prescription: boolean;
  requires_calibration: boolean;
  requires_maintenance: boolean;
  is_reusable: boolean;
  is_sterile: boolean;
};

const PRODUCT_TYPE_OPTIONS: Array<{
  value: ProductType;
  label: string;
}> = [
    { value: "MEDICATION", label: "Medicamento" },
    { value: "HORMONE", label: "Hormona" },
    { value: "MEDICAL_DEVICE", label: "Dispositivo médico" },
    { value: "MEDICAL_EQUIPMENT", label: "Equipo médico" },
    { value: "REAGENT", label: "Reactivo" },
    { value: "SUPPLY", label: "Insumo" },
  ];

function NewProductPanel({ onClose }: { onClose: () => void }) {
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);

  const [loadingClinics, setLoadingClinics] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState<NewProductForm>({
    id: crypto.randomUUID(),
    clinic_id: "",
    supplier_id: "",

    product_type: "MEDICATION",

    name: "",
    generic_name: "",
    category: "",
    presentation: "",
    unit_of_measure: "",
    storage_condition: "",
    temperature_min: "",
    temperature_max: "",
    invima_registration: "",
    active: true,
    strength_value: "",

    brand: "",
    manufacturer: "",
    model: "",
    reference_code: "",
    risk_class: "",

    requires_prescription: false,
    requires_calibration: false,
    requires_maintenance: false,
    is_reusable: false,
    is_sterile: false,
  });

  useEffect(() => {
    async function fetchClinics() {
      setLoadingClinics(true);

      const { data, error } = await supabase
        .from("clinics")
        .select("id, legal_name")
        .order("legal_name", { ascending: true });

      if (error) {
        console.error("Error loading clinics:", error);

        runMockAction("Loading clinics", {
          error: "Could not load clinics",
        });
      } else {
        setClinics(data ?? []);
      }

      setLoadingClinics(false);
    }

    async function fetchSuppliers() {
      setLoadingSuppliers(true);

      const { data, error } = await supabase
        .from("suppliers")
        .select("id, clinic_id, name, nit")
        .eq("active", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error loading suppliers:", error);

        runMockAction("Loading suppliers", {
          error: "Could not load suppliers",
        });
      } else {
        setSuppliers(data ?? []);
      }

      setLoadingSuppliers(false);
    }

    fetchClinics();
    fetchSuppliers();
  }, []);

  const updateField = <K extends keyof NewProductForm>(
    field: K,
    value: NewProductForm[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const parseNumericOrNull = (value: string) => {
    if (value === "" || value === null || value === undefined) return null;

    const parsed = Number(value);

    return Number.isNaN(parsed) ? null : parsed;
  };

  const availableSuppliers = suppliers.filter((supplier) => {
    if (!form.clinic_id) return true;

    return !supplier.clinic_id || supplier.clinic_id === form.clinic_id;
  });

  const resetTypeSpecificFields = (productType: ProductType) => {
    setForm((prev) => ({
      ...prev,
      product_type: productType,

      generic_name:
        productType === "MEDICATION" || productType === "HORMONE"
          ? prev.generic_name
          : "",

      strength_value:
        productType === "MEDICATION" || productType === "HORMONE"
          ? prev.strength_value
          : "",

      model:
        productType === "MEDICAL_DEVICE" ||
          productType === "MEDICAL_EQUIPMENT"
          ? prev.model
          : "",

      risk_class:
        productType === "MEDICAL_DEVICE" ||
          productType === "MEDICAL_EQUIPMENT"
          ? prev.risk_class
          : "",

      requires_prescription:
        productType === "MEDICATION" || productType === "HORMONE"
          ? prev.requires_prescription
          : false,

      requires_calibration:
        productType === "MEDICAL_EQUIPMENT"
          ? prev.requires_calibration
          : false,

      requires_maintenance:
        productType === "MEDICAL_EQUIPMENT"
          ? prev.requires_maintenance
          : false,

      is_reusable:
        productType === "MEDICAL_DEVICE" ||
          productType === "MEDICAL_EQUIPMENT"
          ? prev.is_reusable
          : false,

      is_sterile:
        productType === "MEDICAL_DEVICE" || productType === "SUPPLY"
          ? prev.is_sterile
          : false,
    }));
  };

  const getSelectedProductTypeLabel = () => {
    return (
      PRODUCT_TYPE_OPTIONS.find((item) => item.value === form.product_type)
        ?.label ?? "Producto"
    );
  };

  const buildProductAttributes = () => {
    if (form.product_type === "MEDICATION") {
      return {
        type_label: "Medicamento",
        requires_prescription: form.requires_prescription,
        strength_value: parseNumericOrNull(form.strength_value),
        unit_of_measure: form.unit_of_measure || null,
      };
    }

    if (form.product_type === "HORMONE") {
      return {
        type_label: "Hormona",
        requires_prescription: form.requires_prescription,
        strength_value: parseNumericOrNull(form.strength_value),
        unit_of_measure: form.unit_of_measure || null,
        category: form.category || null,
      };
    }

    if (form.product_type === "MEDICAL_DEVICE") {
      return {
        type_label: "Dispositivo médico",
        brand: form.brand || null,
        manufacturer: form.manufacturer || null,
        model: form.model || null,
        reference_code: form.reference_code || null,
        risk_class: form.risk_class || null,
        is_sterile: form.is_sterile,
        is_reusable: form.is_reusable,
      };
    }

    if (form.product_type === "MEDICAL_EQUIPMENT") {
      return {
        type_label: "Equipo médico",
        brand: form.brand || null,
        manufacturer: form.manufacturer || null,
        model: form.model || null,
        reference_code: form.reference_code || null,
        risk_class: form.risk_class || null,
        requires_calibration: form.requires_calibration,
        requires_maintenance: form.requires_maintenance,
        is_reusable: form.is_reusable,
      };
    }

    if (form.product_type === "REAGENT") {
      return {
        type_label: "Reactivo",
        brand: form.brand || null,
        manufacturer: form.manufacturer || null,
        reference_code: form.reference_code || null,
        storage_condition: form.storage_condition || null,
        temperature_min: parseNumericOrNull(form.temperature_min),
        temperature_max: parseNumericOrNull(form.temperature_max),
      };
    }

    if (form.product_type === "SUPPLY") {
      return {
        type_label: "Insumo",
        brand: form.brand || null,
        manufacturer: form.manufacturer || null,
        reference_code: form.reference_code || null,
        is_sterile: form.is_sterile,
      };
    }

    return {};
  };

  const handleCreateProduct = async () => {
    if (!form.clinic_id) {
      runMockAction("Creating product", {
        error: "Please select a clinic",
      });
      return;
    }

    if (!form.supplier_id) {
      runMockAction("Creating product", {
        error: "Please select a supplier",
      });
      return;
    }

    if (!form.name.trim()) {
      runMockAction("Creating product", {
        error: "Product name is required",
      });
      return;
    }

    if (!form.product_type) {
      runMockAction("Creating product", {
        error: "Product type is required",
      });
      return;
    }

    if (
      (form.product_type === "MEDICATION" || form.product_type === "HORMONE") &&
      !form.strength_value.trim()
    ) {
      runMockAction("Creating product", {
        error: "Strength value is required for medications and hormones",
      });
      return;
    }

    if (
      (form.product_type === "MEDICAL_DEVICE" ||
        form.product_type === "MEDICAL_EQUIPMENT") &&
      !form.risk_class.trim()
    ) {
      runMockAction("Creating product", {
        error: "Risk class is required for medical devices and equipment",
      });
      return;
    }

    setCreating(true);

    const productPayload = {
      id: form.id,
      clinic_id: form.clinic_id,

      product_type: form.product_type,

      name: form.name.trim() || null,

      generic_name:
        form.product_type === "MEDICATION" || form.product_type === "HORMONE"
          ? form.generic_name.trim() || null
          : null,

      category: form.category.trim() || null,
      presentation: form.presentation.trim() || null,
      unit_of_measure: form.unit_of_measure.trim() || null,

      storage_condition:
        form.product_type === "MEDICATION" ||
          form.product_type === "HORMONE" ||
          form.product_type === "REAGENT"
          ? form.storage_condition.trim() || null
          : null,

      temperature_min:
        form.product_type === "MEDICATION" ||
          form.product_type === "HORMONE" ||
          form.product_type === "REAGENT"
          ? parseNumericOrNull(form.temperature_min)
          : null,

      temperature_max:
        form.product_type === "MEDICATION" ||
          form.product_type === "HORMONE" ||
          form.product_type === "REAGENT"
          ? parseNumericOrNull(form.temperature_max)
          : null,

      invima_registration:
        form.product_type === "MEDICATION" ||
          form.product_type === "HORMONE" ||
          form.product_type === "MEDICAL_DEVICE" ||
          form.product_type === "MEDICAL_EQUIPMENT"
          ? form.invima_registration.trim() || null
          : null,

      active: form.active,

      strength_value:
        form.product_type === "MEDICATION" || form.product_type === "HORMONE"
          ? parseNumericOrNull(form.strength_value)
          : null,

      brand:
        form.product_type === "MEDICAL_DEVICE" ||
          form.product_type === "MEDICAL_EQUIPMENT" ||
          form.product_type === "REAGENT" ||
          form.product_type === "SUPPLY"
          ? form.brand.trim() || null
          : null,

      manufacturer:
        form.product_type === "MEDICAL_DEVICE" ||
          form.product_type === "MEDICAL_EQUIPMENT" ||
          form.product_type === "REAGENT" ||
          form.product_type === "SUPPLY"
          ? form.manufacturer.trim() || null
          : null,

      model:
        form.product_type === "MEDICAL_DEVICE" ||
          form.product_type === "MEDICAL_EQUIPMENT"
          ? form.model.trim() || null
          : null,

      reference_code:
        form.product_type === "MEDICAL_DEVICE" ||
          form.product_type === "MEDICAL_EQUIPMENT" ||
          form.product_type === "REAGENT" ||
          form.product_type === "SUPPLY"
          ? form.reference_code.trim() || null
          : null,

      risk_class:
        form.product_type === "MEDICAL_DEVICE" ||
          form.product_type === "MEDICAL_EQUIPMENT"
          ? form.risk_class.trim() || null
          : null,

      requires_prescription:
        form.product_type === "MEDICATION" || form.product_type === "HORMONE"
          ? form.requires_prescription
          : false,

      requires_calibration:
        form.product_type === "MEDICAL_EQUIPMENT"
          ? form.requires_calibration
          : false,

      requires_maintenance:
        form.product_type === "MEDICAL_EQUIPMENT"
          ? form.requires_maintenance
          : false,

      is_reusable:
        form.product_type === "MEDICAL_DEVICE" ||
          form.product_type === "MEDICAL_EQUIPMENT"
          ? form.is_reusable
          : false,

      is_sterile:
        form.product_type === "MEDICAL_DEVICE" || form.product_type === "SUPPLY"
          ? form.is_sterile
          : false,

      product_attributes: {
        ...buildProductAttributes(),
        supplier_id: form.supplier_id,
      },
    };

    console.log("New product payload:", productPayload);

    const { error: productError } = await supabase
      .from("products")
      .insert(productPayload);

    if (productError) {
      console.error("Error creating product:", productError);

      runMockAction("Creating product", {
        error: productError.message,
      });

      setCreating(false);
      return;
    }

    const { error: supplierLinkError } = await supabase
      .from("product_suppliers")
      .insert({
        product_id: form.id,
        supplier_id: form.supplier_id,
        clinic_id: form.clinic_id || null,
        is_primary: true,
      });

    if (supplierLinkError) {
      console.error("Error linking supplier:", supplierLinkError);

      runMockAction("Creating product", {
        error: "Product was created, but supplier could not be linked",
      });

      setCreating(false);
      return;
    }

    runMockAction("Creating product", {
      success: "Product added and linked to supplier",
    });

    setCreating(false);
    onClose();
  };

  return (
    <Panel
      title="New product"
      subtitle={`Register ${getSelectedProductTypeLabel().toLowerCase()} in master catalog`}
      onClose={onClose}
      width="max-w-3xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={creating}
            className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleCreateProduct}
            disabled={creating}
            className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create product"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <button
          type="button"
          className="w-full flex items-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/30 p-4 hover:border-primary/30 hover:bg-accent/30 transition-colors"
        >
          <div className="size-12 rounded-md bg-card border border-border flex items-center justify-center">
            <Upload className="size-4 text-muted-foreground" />
          </div>

          <div className="text-left">
            <p className="text-[12.5px] font-medium">Upload product image</p>
            <p className="text-[11px] text-muted-foreground">
              PNG, JPG up to 5 MB
            </p>
          </div>
        </button>

        <section className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div>
            <h3 className="text-[13px] font-semibold">General information</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Select the product type and supplier. The required information
              changes according to what you are registering.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="space-y-1.5 block">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Clinic
                </span>

                <select
                  value={form.clinic_id}
                  onChange={(e) => {
                    updateField("clinic_id", e.target.value);
                    updateField("supplier_id", "");
                  }}
                  disabled={loadingClinics}
                  className="h-9 w-full rounded-md border border-border bg-card px-3 text-[12px] outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">
                    {loadingClinics ? "Loading clinics..." : "Select clinic"}
                  </option>

                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.legal_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="col-span-2">
              <label className="space-y-1.5 block">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Supplier
                </span>

                <select
                  value={form.supplier_id}
                  onChange={(e) => updateField("supplier_id", e.target.value)}
                  disabled={loadingSuppliers || !form.clinic_id}
                  className="h-9 w-full rounded-md border border-border bg-card px-3 text-[12px] outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">
                    {loadingSuppliers
                      ? "Loading suppliers..."
                      : !form.clinic_id
                        ? "Select clinic first"
                        : "Select supplier"}
                  </option>

                  {availableSuppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name ?? "Unnamed supplier"}
                      {supplier.nit ? ` · NIT ${supplier.nit}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="space-y-1.5 block">
              <span className="text-[11px] font-medium text-muted-foreground">
                Product type
              </span>

              <select
                value={form.product_type}
                onChange={(e) =>
                  resetTypeSpecificFields(e.target.value as ProductType)
                }
                className="h-9 w-full rounded-md border border-border bg-card px-3 text-[12px] outline-none focus:ring-2 focus:ring-primary/20"
              >
                {PRODUCT_TYPE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="Name"
              placeholder={
                form.product_type === "MEDICATION"
                  ? "Commercial name"
                  : form.product_type === "HORMONE"
                    ? "Hormone name"
                    : form.product_type === "MEDICAL_DEVICE"
                      ? "Device name"
                      : form.product_type === "MEDICAL_EQUIPMENT"
                        ? "Equipment name"
                        : form.product_type === "REAGENT"
                          ? "Reagent name"
                          : "Supply name"
              }
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateField("name", e.target.value)
              }
            />

            {(form.product_type === "MEDICATION" ||
              form.product_type === "HORMONE") && (
                <>
                  <Input
                    label="Generic name"
                    placeholder="Generic name / active ingredient"
                    value={form.generic_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateField("generic_name", e.target.value)
                    }
                  />

                  <Input
                    label="Strength value"
                    placeholder="Example: 500"
                    type="number"
                    value={form.strength_value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateField("strength_value", e.target.value)
                    }
                  />

                  <Input
                    label="Unit of measure"
                    placeholder="mg, IU, mcg, ml, tablet, capsule..."
                    value={form.unit_of_measure}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateField("unit_of_measure", e.target.value)
                    }
                  />

                  <Select
                    label="Category"
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    options={
                      form.product_type === "HORMONE"
                        ? [
                          "FSH",
                          "LH",
                          "hCG",
                          "GnRH antagonist",
                          "GnRH agonist",
                          "Progesterone",
                          "Estradiol",
                          "Other hormone",
                        ]
                        : [
                          "Medication",
                          "Antibiotic",
                          "Analgesic",
                          "Anesthesia",
                          "Supplement",
                          "Other medication",
                        ]
                    }
                  />

                  <Input
                    label="Presentation"
                    placeholder="Box x 10, vial, ampoule, pre-filled syringe..."
                    value={form.presentation}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateField("presentation", e.target.value)
                    }
                  />

                  <Select
                    label="Storage condition"
                    value={form.storage_condition}
                    onChange={(e) =>
                      updateField("storage_condition", e.target.value)
                    }
                    options={[
                      "Room temperature",
                      "2 – 8 °C",
                      "-20 °C",
                      "-80 °C",
                      "LN2",
                    ]}
                  />

                  <Input
                    label="INVIMA registration"
                    placeholder="INVIMA 20XXM-XXXXXX"
                    value={form.invima_registration}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateField("invima_registration", e.target.value)
                    }
                  />

                  <Checkbox
                    label="Requires prescription"
                    checked={form.requires_prescription}
                    onChange={(e) =>
                      updateField("requires_prescription", e.target.checked)
                    }
                  />
                </>
              )}

            {form.product_type === "MEDICAL_DEVICE" && (
              <>

                <Input
                  label="Manufacturer"
                  placeholder="Manufacturer"
                  value={form.manufacturer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("manufacturer", e.target.value)
                  }
                />

                <Input
                  label="Model"
                  placeholder="Model"
                  value={form.model}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("model", e.target.value)
                  }
                />

                <Input
                  label="Reference code"
                  placeholder="Catalog code / SKU"
                  value={form.reference_code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("reference_code", e.target.value)
                  }
                />

                <Select
                  label="Risk class"
                  value={form.risk_class}
                  onChange={(e) => updateField("risk_class", e.target.value)}
                  options={["Class I", "Class IIa", "Class IIb", "Class III"]}
                />

                <Select
                  label="Category"
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  options={[
                    "Catheter",
                    "Needle",
                    "Syringe",
                    "Culture dish",
                    "Transfer catheter",
                    "Disposable device",
                    "Reusable device",
                    "Other device",
                  ]}
                />

                <Input
                  label="Presentation"
                  placeholder="Unit, box x 10, kit..."
                  value={form.presentation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("presentation", e.target.value)
                  }
                />

                <Input
                  label="Unit of measure"
                  placeholder="unit, box, kit..."
                  value={form.unit_of_measure}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("unit_of_measure", e.target.value)
                  }
                />

                <Input
                  label="INVIMA registration"
                  placeholder="Sanitary registration"
                  value={form.invima_registration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("invima_registration", e.target.value)
                  }
                />

                <Checkbox
                  label="Sterile"
                  checked={form.is_sterile}
                  onChange={(e) => updateField("is_sterile", e.target.checked)}
                />

                <Checkbox
                  label="Reusable"
                  checked={form.is_reusable}
                  onChange={(e) => updateField("is_reusable", e.target.checked)}
                />
              </>
            )}

            {form.product_type === "MEDICAL_EQUIPMENT" && (
              <>

                <Input
                  label="Manufacturer"
                  placeholder="Manufacturer"
                  value={form.manufacturer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("manufacturer", e.target.value)
                  }
                />

                <Input
                  label="Model"
                  placeholder="Equipment model"
                  value={form.model}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("model", e.target.value)
                  }
                />

                <Input
                  label="Reference code"
                  placeholder="Serial, SKU or catalog code"
                  value={form.reference_code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("reference_code", e.target.value)
                  }
                />

                <Select
                  label="Risk class"
                  value={form.risk_class}
                  onChange={(e) => updateField("risk_class", e.target.value)}
                  options={["Class I", "Class IIa", "Class IIb", "Class III"]}
                />

                <Select
                  label="Category"
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  options={[
                    "Incubator",
                    "Centrifuge",
                    "Microscope",
                    "Ultrasound",
                    "Cryo equipment",
                    "Lab equipment",
                    "Surgical equipment",
                    "Other equipment",
                  ]}
                />

                <Input
                  label="Unit of measure"
                  placeholder="unit"
                  value={form.unit_of_measure}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("unit_of_measure", e.target.value)
                  }
                />

                <Input
                  label="INVIMA registration"
                  placeholder="Sanitary registration, if applies"
                  value={form.invima_registration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("invima_registration", e.target.value)
                  }
                />

                <Checkbox
                  label="Requires calibration"
                  checked={form.requires_calibration}
                  onChange={(e) =>
                    updateField("requires_calibration", e.target.checked)
                  }
                />

                <Checkbox
                  label="Requires maintenance"
                  checked={form.requires_maintenance}
                  onChange={(e) =>
                    updateField("requires_maintenance", e.target.checked)
                  }
                />

                <Checkbox
                  label="Reusable"
                  checked={form.is_reusable}
                  onChange={(e) => updateField("is_reusable", e.target.checked)}
                />
              </>
            )}

            {form.product_type === "REAGENT" && (
              <>

                <Input
                  label="Manufacturer"
                  placeholder="Manufacturer"
                  value={form.manufacturer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("manufacturer", e.target.value)
                  }
                />

                <Input
                  label="Reference code"
                  placeholder="Catalog code / SKU"
                  value={form.reference_code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("reference_code", e.target.value)
                  }
                />

                <Select
                  label="Category"
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  options={[
                    "IVF Media",
                    "Culture media",
                    "Buffer",
                    "Enzyme",
                    "Stain",
                    "Cryoprotectant",
                    "Lab reagent",
                  ]}
                />

                <Input
                  label="Presentation"
                  placeholder="Bottle, vial, kit..."
                  value={form.presentation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("presentation", e.target.value)
                  }
                />

                <Input
                  label="Unit of measure"
                  placeholder="ml, vial, bottle, kit..."
                  value={form.unit_of_measure}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("unit_of_measure", e.target.value)
                  }
                />

                <Select
                  label="Storage condition"
                  value={form.storage_condition}
                  onChange={(e) =>
                    updateField("storage_condition", e.target.value)
                  }
                  options={[
                    "Room temperature",
                    "2 – 8 °C",
                    "-20 °C",
                    "-80 °C",
                    "LN2",
                  ]}
                />
              </>
            )}

            {form.product_type === "SUPPLY" && (
              <>

                <Input
                  label="Manufacturer"
                  placeholder="Manufacturer"
                  value={form.manufacturer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("manufacturer", e.target.value)
                  }
                />

                <Input
                  label="Reference code"
                  placeholder="Catalog code / SKU"
                  value={form.reference_code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("reference_code", e.target.value)
                  }
                />

                <Select
                  label="Category"
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  options={[
                    "PPE",
                    "Cleaning supply",
                    "Office supply",
                    "Surgical supply",
                    "Packaging",
                    "General supply",
                  ]}
                />

                <Input
                  label="Presentation"
                  placeholder="Box, pack, unit..."
                  value={form.presentation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("presentation", e.target.value)
                  }
                />

                <Input
                  label="Unit of measure"
                  placeholder="unit, box, pack..."
                  value={form.unit_of_measure}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("unit_of_measure", e.target.value)
                  }
                />

                <Checkbox
                  label="Sterile"
                  checked={form.is_sterile}
                  onChange={(e) => updateField("is_sterile", e.target.checked)}
                />
              </>
            )}

            <div className="col-span-2 pt-2">
              <Checkbox
                label="Active"
                checked={form.active}
                onChange={(e) => updateField("active", e.target.checked)}
              />
            </div>
          </div>
        </section>
      </div>
    </Panel>
  );
}

function NewSupplierPanel({ onClose }: { onClose: () => void }) {
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    id: crypto.randomUUID(),
    clinic_id: "",
    name: "",
    nit: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    active: true,
  });

  useEffect(() => {
    async function fetchClinics() {
      setLoadingClinics(true);

      const { data, error } = await supabase
        .from("clinics")
        .select("id, legal_name")
        .order("legal_name", { ascending: true });

      if (error) {
        console.error("Error loading clinics:", error);

        runMockAction("Loading clinics", {
          error: "Could not load clinics",
        });
      } else {
        setClinics(data ?? []);
      }

      setLoadingClinics(false);
    }

    fetchClinics();
  }, []);

  const updateField = <K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateSupplier = async () => {
    if (!form.clinic_id) {
      runMockAction("Creating supplier", {
        error: "Please select a clinic",
      });
      return;
    }

    if (!form.name.trim()) {
      runMockAction("Creating supplier", {
        error: "Supplier name is required",
      });
      return;
    }

    setCreating(true);

    const payload = {
      id: form.id,
      clinic_id: form.clinic_id,
      name: form.name.trim() || null,
      nit: form.nit.trim() || null,
      contact_name: form.contact_name.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      active: form.active,
    };

    console.log("New supplier payload:", payload);

    const { error } = await supabase.from("suppliers").insert(payload);

    if (error) {
      console.error("Error creating supplier:", error);

      runMockAction("Creating supplier", {
        error: error.message,
      });

      setCreating(false);
      return;
    }

    runMockAction("Creating supplier", {
      success: "Supplier added successfully",
    });

    setCreating(false);
    onClose();
  };

  return (
    <Panel
      title="New supplier"
      subtitle="Register supplier information"
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={creating}
            className="h-9 px-3 text-[12px] font-medium rounded-md border border-border bg-card hover:bg-secondary disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleCreateSupplier}
            disabled={creating}
            className="h-9 px-4 text-[12px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create supplier"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div>
            <h3 className="text-[13px] font-semibold">
              Supplier information
            </h3>

            <p className="text-[11px] text-muted-foreground mt-0.5">
              Basic supplier information for purchases and inventory lots.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="space-y-1.5 block">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Clinic
                </span>

                <select
                  value={form.clinic_id}
                  onChange={(e) => updateField("clinic_id", e.target.value)}
                  disabled={loadingClinics}
                  className="h-9 w-full rounded-md border border-border bg-card px-3 text-[12px] outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">
                    {loadingClinics ? "Loading clinics..." : "Select clinic"}
                  </option>

                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.legal_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <Input
              label="Supplier name"
              placeholder="Supplier name"
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateField("name", e.target.value)
              }
            />

            <Input
              label="NIT"
              placeholder="Supplier tax ID / NIT"
              value={form.nit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateField("nit", e.target.value)
              }
            />

            <Input
              label="Contact name"
              placeholder="Contact person"
              value={form.contact_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateField("contact_name", e.target.value)
              }
            />

            <Input
              label="Phone"
              placeholder="+57..."
              value={form.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateField("phone", e.target.value)
              }
            />

            <Input
              label="Email"
              placeholder="supplier@email.com"
              type="email"
              value={form.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateField("email", e.target.value)
              }
            />

            <Input
              label="Address"
              placeholder="Supplier address"
              value={form.address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateField("address", e.target.value)
              }
            />

            <div className="col-span-2 pt-2">
              <Checkbox
                label="Active"
                checked={form.active}
                onChange={(e) => updateField("active", e.target.checked)}
              />
            </div>
          </div>
        </section>
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
