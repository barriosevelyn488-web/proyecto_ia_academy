"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { hasCloud } from "@/lib/supabase/browser";
import { useCrm } from "@/hooks/use-crm";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarClock,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  Filter,
  Gauge,
  GripVertical,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TableProperties,
  Target,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  Lead,
  Stage,
  STAGES,
  money,
  stageLabel,
} from "@/lib/types";
import { isLate, numberPhone, today } from "@/lib/formatters";
import { DEFAULT_WHATSAPP_TEMPLATE, interpolateWhatsAppTemplate } from "@/lib/whatsapp";
import { AppBrand, LeadAvatar, Login, Metric } from "@/components/ui/crm-primitives";
import { FilterRow, LeadTable } from "@/features/leads/components/lead-table";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

const LeadDetail = dynamic(
  () => import("@/features/leads/components/lead-forms").then((m) => m.LeadDetail),
  { ssr: false },
);
const LeadForm = dynamic(
  () => import("@/features/leads/components/lead-forms").then((m) => m.LeadForm),
  { ssr: false },
);
const KanbanBoard = dynamic(
  () => import("@/features/leads/components/kanban-board").then((m) => m.KanbanBoard),
  { ssr: false },
);
const PaymentsView = dynamic(
  () => import("@/features/payments/components/payments-view").then((m) => m.PaymentsView),
  { ssr: false },
);
const ReportsPanel = dynamic(
  () => import("@/features/dashboard/components/reports-panel").then((m) => m.ReportsPanel),
  { ssr: false },
);
const SalesToolkitModal = dynamic(
  () =>
    import("@/features/sales/components/sales-toolkit-modal").then(
      (m) => m.SalesToolkitModal,
    ),
  { ssr: false },
);
const SheetsSyncModal = dynamic(
  () =>
    import("@/features/sheets/components/sheets-sync-modal").then(
      (m) => m.SheetsSyncModal,
    ),
  { ssr: false },
);
const StorageOptimizerModal = dynamic(
  () =>
    import("@/features/storage/components/storage-optimizer-modal").then(
      (m) => m.StorageOptimizerModal,
    ),
  { ssr: false },
);

type View = "dashboard" | "funnel" | "leads" | "payments" | "reports";
const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Resumen", icon: LayoutDashboard },
  { id: "funnel", label: "Embudo de Admisiones", icon: Target },
  { id: "leads", label: "Vista Hoja de Cálculo", icon: Users },
  { id: "payments", label: "Pagos e ingresos", icon: Wallet },
  { id: "reports", label: "Métricas y reportes", icon: BarChart3 },
];

const emptyLead = (): Lead => ({
  id: "",
  full_name: "",
  phone: "",
  email: "",
  origin: "BOT",
  product: "CODE UP",
  stage: "nuevo",
  interest: "alto",
  priority: "SEGUIMIENTO",
  agreement: "",
  payment_status: "",
  deal_amount: 2500,
  payment_method: "",
  next_contact_at: "",
  notes: "",
  nit: "",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [period, setPeriod] = useState("30");
  const [search, setSearch] = useState("");
  const [displayMode, setDisplayMode] = useState<"kanban" | "table">("kanban");

  // Filtros avanzados
  const [stageFilter, setStageFilter] = useState("todos");
  const [originFilter, setOriginFilter] = useState("todos");
  const [productFilter, setProductFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todos");
  const [agreementFilter, setAgreementFilter] = useState("todos");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("todos");
  const [segmentFilter, setSegmentFilter] = useState<
    "todos" | "recientes" | "vencidos" | "perdidos"
  >("todos");

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newModal, setNewModal] = useState(false);
  const [salesToolkitOpen, setSalesToolkitOpen] = useState(false);
  const [salesToolkitLead, setSalesToolkitLead] = useState<Lead | null>(null);
  const [sheetsSyncOpen, setSheetsSyncOpen] = useState(false);
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const tell = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  }, []);

  const crm = useCrm(tell);
  const {
    leads,
    payments,
    activities,
    sessionReady,
    signedIn,
    loginBusy,
    loginError,
    userEmail,
    busy,
    lowBandwidthMode,
    hasMoreLeads,
    loadCloudData,
    loadMoreLeads,
    login,
    logout,
    addPayment,
    logLeadActivity,
    importLeadsBatch,
  } = crm;

  const saveLead = async (draft: Lead, previous?: Lead) => {
    const saved = await crm.saveLead(draft, previous);
    if (!saved) return;
    if (previous) setSelectedLead(saved);
    setNewModal(false);
  };

  const moveLead = async (lead: Lead, stage: Stage) => {
    const updated = await crm.moveLead(lead, stage);
    if (selectedLead?.id === lead.id) setSelectedLead(updated);
  };

  const withinPeriod = useCallback(
    (date: string) => {
      if (period === "all") return true;
      const days = Number(period);
      const since = new Date();
      since.setDate(since.getDate() - days);
      since.setHours(0, 0, 0, 0);
      return new Date(date) >= since;
    },
    [period],
  );

  const periodLeads = useMemo(
    () => leads.filter((lead) => withinPeriod(lead.created_at)),
    [leads, withinPeriod],
  );

  const periodPayments = useMemo(
    () =>
      payments.filter(
        (payment) =>
          payment.status === "pagado" &&
          withinPeriod(payment.paid_at || payment.created_at),
      ),
    [payments, withinPeriod],
  );

  const revenue = periodPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );
  const enrolled = periodLeads.filter((lead) =>
    ["confirmado", "inscrito_forms", "inscrito"].includes(lead.stage),
  ).length;
  const conversion = periodLeads.length ? (enrolled / periodLeads.length) * 100 : 0;
  const pipeline = leads
    .filter(
      (lead) => !["inscrito_forms", "inscrito", "no_interesado", "perdido"].includes(lead.stage),
    )
    .reduce((sum, lead) => sum + Number(lead.deal_amount || 0), 0);
  const pendingAmount = payments
    .filter((payment) => payment.status === "pendiente")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const overdueCount = leads.filter(
    (lead) =>
      lead.next_contact_at &&
      isLate(lead.next_contact_at) &&
      !["inscrito_forms", "inscrito", "no_interesado", "perdido"].includes(lead.stage),
  ).length;

  const origins = useMemo(
    () => Array.from(new Set(leads.map((lead) => lead.origin).filter(Boolean))).sort(),
    [leads],
  );

  const filteredLeads = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    return leads.filter((lead) => {
      const term = search.trim().toLowerCase();
      const matchesTerm =
        !term ||
        [
          lead.full_name,
          lead.phone,
          lead.email,
          lead.product,
          lead.origin,
          lead.notes,
          lead.nit,
          lead.priority,
          lead.agreement,
          lead.payment_status,
        ].some((part) => part?.toLowerCase().includes(term));

      const matchesSegment =
        segmentFilter === "todos" ||
        (segmentFilter === "recientes" &&
          new Date(lead.created_at).getTime() >= sevenDaysAgo) ||
        (segmentFilter === "vencidos" &&
          Boolean(lead.next_contact_at) &&
          isLate(lead.next_contact_at) &&
          !["inscrito_forms", "inscrito", "no_interesado", "perdido"].includes(lead.stage)) ||
        (segmentFilter === "perdidos" &&
          ["no_interesado", "perdido"].includes(lead.stage));

      const matchesStage = stageFilter === "todos" || lead.stage === stageFilter;
      const matchesOrigin = originFilter === "todos" || lead.origin === originFilter;
      const matchesProduct = productFilter === "todos" || lead.product === productFilter;
      const matchesPriority =
        priorityFilter === "todos" ||
        (lead.priority || "").toLowerCase() === priorityFilter.toLowerCase();
      const matchesAgreement =
        agreementFilter === "todos" || lead.agreement === agreementFilter;
      const matchesPaymentStatus =
        paymentStatusFilter === "todos" || lead.payment_status === paymentStatusFilter;

      return (
        matchesTerm &&
        matchesSegment &&
        matchesStage &&
        matchesOrigin &&
        matchesProduct &&
        matchesPriority &&
        matchesAgreement &&
        matchesPaymentStatus
      );
    });
  }, [
    leads,
    search,
    originFilter,
    stageFilter,
    segmentFilter,
    productFilter,
    priorityFilter,
    agreementFilter,
    paymentStatusFilter,
  ]);

  const originData = useMemo(() => {
    const map = new Map<
      string,
      {
        origin: string;
        leads: number;
        enrolled: number;
        conversion: number;
        revenue: number;
      }
    >();
    periodLeads.forEach((lead) => {
      const key = lead.origin || "Sin origen";
      const row = map.get(key) ?? {
        origin: key,
        leads: 0,
        enrolled: 0,
        conversion: 0,
        revenue: 0,
      };
      row.leads++;
      if (["confirmado", "inscrito_forms", "inscrito"].includes(lead.stage)) {
        row.enrolled++;
        row.revenue += Number(lead.deal_amount || 0);
      }
      map.set(key, row);
    });
    return Array.from(map.values())
      .map((row) => ({
        ...row,
        conversion: row.leads ? Math.round((row.enrolled / row.leads) * 100) : 0,
      }))
      .sort((a, b) => b.leads - a.leads);
  }, [periodLeads]);

  const sourcePie = originData.map((row) => ({
    name: row.origin,
    value: row.leads,
  }));

  const funnelData = STAGES.filter((s) => s.id !== "no_interesado").map((stage) => ({
    name: stage.label,
    cantidad: periodLeads.filter((lead) => lead.stage === stage.id).length,
  }));

  const monthlyData = useMemo(
    () =>
      Array.from({ length: 6 }, (_, offset) => {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() - (5 - offset));
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const label = date
          .toLocaleDateString("es-GT", { month: "short" })
          .replace(".", "");
        const monthLeads = leads.filter(
          (lead) => lead.created_at?.slice(0, 7) === key,
        ).length;
        const monthPayments = payments
          .filter(
            (payment) =>
              payment.status === "pagado" &&
              (payment.paid_at || payment.created_at)?.slice(0, 7) === key,
          )
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        return { month: label, leads: monthLeads, ingresos: monthPayments };
      }),
    [leads, payments],
  );

  const resetAllFilters = () => {
    setStageFilter("todos");
    setOriginFilter("todos");
    setProductFilter("todos");
    setPriorityFilter("todos");
    setAgreementFilter("todos");
    setPaymentStatusFilter("todos");
    setSegmentFilter("todos");
    setSearch("");
  };

  const exportCsv = () => {
    const rows = [
      [
        "FECHA",
        "NUMERO",
        "NOMBRE",
        "ORIGEN",
        "PRODUCTO",
        "ESTADO (FLUJO DE CIERRE)",
        "PRIORIDAD",
        "ACUERDO",
        "GESTION DE PAGO",
        "NIT",
        "MONTO",
        "COMENTARIO",
      ],
      ...filteredLeads.map((lead) => [
        lead.created_at ? lead.created_at.slice(0, 10) : "",
        lead.phone,
        lead.full_name,
        lead.origin,
        lead.product,
        stageLabel(lead.stage),
        lead.priority || "",
        lead.agreement || "",
        lead.payment_status || "",
        lead.nit || "",
        lead.deal_amount,
        (lead.notes || "").replace(/[\r\n]+/g, " "),
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","),
      )
      .join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }),
    );
    link.download = `campuslands-contactos-${today()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    tell("Archivo CSV descargado con éxito.");
  };

  if (!sessionReady)
    return (
      <div className="login-screen">
        <div className="login-card">
          <AppBrand />
          <div className="login-copy">Preparando tu espacio comercial…</div>
        </div>
      </div>
    );

  if (hasCloud && !signedIn)
    return <Login onLogin={login} error={loginError} busy={loginBusy} />;

  const activeTitle = navItems.find((item) => item.id === view)?.label ?? "Resumen";
  const periodLabel = period === "all" ? "Todo el tiempo" : `Últimos ${period} días`;

  const openWhatsApp = (lead: Lead, customMessage?: string) => {
    const phone = numberPhone(lead.phone);
    if (!phone) {
      tell("Agrega un teléfono válido con código de país o número local de Guatemala.");
      return;
    }
    const message =
      customMessage ?? interpolateWhatsAppTemplate(DEFAULT_WHATSAPP_TEMPLATE, lead);
    const chatUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    const chat = window.open(chatUrl, "_blank");
    if (!chat) {
      tell("Permite las ventanas emergentes para abrir WhatsApp.");
      return;
    }
    chat.opener = null;
    void logLeadActivity({
      lead_id: lead.id,
      activity_type: "whatsapp_opened",
      description: "Chat abierto en WhatsApp.",
      metadata: { phone: `+${phone}`, message },
    });
    tell("Se abrió WhatsApp con el contacto.");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <AppBrand />
        <div className="workspace-label">Menú Comercial</div>
        <nav className="nav-list">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? "active" : ""}`}
              onClick={() => {
                setView(id);
                if (id === "leads") setDisplayMode("table");
                if (id === "funnel") setDisplayMode("kanban");
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {(id === "leads" || id === "funnel") && (
                <i className="nav-count">{leads.length}</i>
              )}
            </button>
          ))}

          {/* Sincronización Google Sheets / Excel */}
          <button
            className="nav-item"
            style={{ color: "#86efac" }}
            onClick={() => setSheetsSyncOpen(true)}
          >
            <FileSpreadsheet size={18} />
            <span>Importar / Exportar</span>
          </button>

          {/* Asistente de Venta */}
          <button
            className="nav-item"
            onClick={() => {
              setSalesToolkitLead(null);
              setSalesToolkitOpen(true);
            }}
          >
            <Sparkles size={18} />
            <span>Asistente de Venta</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-title">Seguimientos de hoy</div>
            <div className="help-text">
              Tienes {overdueCount} {overdueCount === 1 ? "contacto" : "contactos"} con
              fecha de atención pendiente.
            </div>
            <button
              className="help-link"
              onClick={() => {
                setView("funnel");
                setSegmentFilter("vencidos");
              }}
            >
              Ver pendientes <ArrowRight size={13} />
            </button>
          </div>

          <div className="profile">
            <LeadAvatar name={userEmail.includes("@") ? userEmail : "Equipo CRM"} />
            <div>
              <div className="profile-name">
                {userEmail.includes("@") ? userEmail.split("@")[0] : "Admisiones"}
              </div>
              <div className="profile-role">Campuslands Admisiones</div>
            </div>
            {hasCloud && (
              <button
                className="icon-button profile-logout"
                title="Cerrar sesión"
                onClick={logout}
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="crumb">
            Campuslands <span style={{ margin: "0 8px", color: "#c5cad3" }}>/</span>{" "}
            <strong>{activeTitle}</strong>
          </div>

          <div className="top-actions">
            <div className="search-wrap">
              <Search size={15} />
              <input
                className="search-input"
                placeholder="Buscar contacto, número o NIT…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              className="icon-button"
              title="Actualizar datos"
              onClick={() =>
                hasCloud
                  ? void loadCloudData()
                  : tell("Datos actualizados.")
              }
            >
              <RefreshCw size={15} className={busy ? "spin" : ""} />
            </button>

            <button
              className="icon-button"
              title={`${overdueCount} seguimientos vencidos`}
              onClick={() => {
                setView("funnel");
                setSegmentFilter("vencidos");
              }}
            >
              <Bell size={15} />
              {overdueCount > 0 && <i className="dot" />}
            </button>

            <div className="top-profile">
              <LeadAvatar name={userEmail.includes("@") ? userEmail : "Equipo CRM"} />
              <span>
                {userEmail.includes("@") ? userEmail.split("@")[0] : "Admisiones"}
              </span>
            </div>
          </div>
        </header>

        <div className="content">
          <div className="page-head">
            <div>
              <div className="eyebrow">
                Panel Comercial Campuslands <span style={{ margin: "0 5px" }}>·</span>
                {new Date().toLocaleDateString("es-GT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
              <h1 className="page-title">
                {view === "dashboard"
                  ? "Control General de Admisiones 🎯"
                  : view === "funnel" || view === "leads"
                    ? "Gestión de Prospectos y Cierres"
                    : activeTitle}
              </h1>
              <p className="page-description">
                {view === "dashboard"
                  ? "Pulso en tiempo real de leads, cierres y programas de Campuslands."
                  : "Mueve y gestiona tus contactos por cada etapa del flujo de cierre."}
              </p>
            </div>

            <div className="head-actions">
              <button
                type="button"
                className="button"
                style={{ background: "#f0fdf4", color: "#166534", borderColor: "#bbf7d0" }}
                onClick={() => setSheetsSyncOpen(true)}
              >
                <FileSpreadsheet size={15} /> Importar / Exportar Sheets
              </button>

              <button className="button primary" onClick={() => setNewModal(true)}>
                <Plus size={15} /> Nuevo lead
              </button>
            </div>
          </div>

          {/* Vistas Dashboard y Reportes */}
          {(view === "dashboard" || view === "reports") && (
            <>
              <div className="metric-grid">
                <Metric
                  label="Contactos totales"
                  value={String(periodLeads.length)}
                  foot={`${periodLabel} · ${leads.length} acumulados`}
                  icon={Users}
                  tint="#2563eb"
                />
                <Metric
                  label="Cierres confirmados"
                  value={String(enrolled)}
                  foot={`Tasa de conversión: ${conversion.toFixed(1)}%`}
                  icon={Target}
                  tint="#16a34a"
                />
                <Metric
                  label="Ingresos cobrados"
                  value={money(revenue)}
                  foot={`Pendiente por cobrar: ${money(pendingAmount)}`}
                  icon={CircleDollarSign}
                  tint="#059669"
                />
                <Metric
                  label="Pipeline activo"
                  value={money(pipeline)}
                  foot="Oportunidades abiertas"
                  icon={TrendingUp}
                  tint="#d97706"
                />
              </div>

              {view === "dashboard" ? (
                <DashboardView
                  periodLeads={periodLeads}
                  leads={leads}
                  periodLabel={periodLabel}
                  originData={originData}
                  sourcePie={sourcePie}
                  funnelData={funnelData}
                  monthlyData={monthlyData}
                  onNavigate={setView}
                  onOpenLead={setSelectedLead}
                  onWhatsApp={openWhatsApp}
                />
              ) : (
                <ReportsPanel
                  originData={originData}
                  sourcePie={sourcePie}
                  funnelData={funnelData}
                  monthlyData={monthlyData}
                  leads={periodLeads}
                  payments={periodPayments}
                  periodLabel={periodLabel}
                  onOrigin={(origin) => {
                    setOriginFilter(origin);
                    setView("leads");
                  }}
                />
              )}
            </>
          )}

          {/* Vistas Funnel / Leads (Conmutables con Tabs por Etapa) */}
          {(view === "funnel" || view === "leads") && (
            <>
              {/* SELECTOR DE PESTAÑAS POR ETAPA (1 Vista por Etapa como solicitó el usuario) */}
              <div className="stage-tabs-container">
                <button
                  type="button"
                  className={`stage-tab ${stageFilter === "todos" ? "active" : ""}`}
                  onClick={() => setStageFilter("todos")}
                >
                  <span>Todos los prospectos</span>
                  <span className="stage-tab-count">{leads.length}</span>
                </button>
                {STAGES.map((s) => {
                  const count = leads.filter((l) => l.stage === s.id).length;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`stage-tab ${stageFilter === s.id ? "active" : ""}`}
                      style={{
                        borderBottom:
                          stageFilter === s.id ? `2px solid ${s.color}` : undefined,
                      }}
                      onClick={() => setStageFilter(s.id)}
                    >
                      <i className="badge-dot" style={{ backgroundColor: s.color }} />
                      <span>{s.label}</span>
                      <span
                        className="stage-tab-count"
                        style={{ background: `${s.color}18`, color: s.color }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Barra de herramientas con Conmutador Kanban / Tabla */}
              <div className="toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
                {/* Switcher de Vista */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button
                    type="button"
                    className={`button small ${displayMode === "kanban" ? "primary" : ""}`}
                    onClick={() => setDisplayMode("kanban")}
                  >
                    <LayoutGrid size={13} /> Vista Kanban
                  </button>
                  <button
                    type="button"
                    className={`button small ${displayMode === "table" ? "primary" : ""}`}
                    onClick={() => setDisplayMode("table")}
                  >
                    <TableProperties size={13} /> Vista Hoja de Cálculo
                  </button>
                </div>

                {/* Filtros rápidos por estado de seguimiento */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {(
                    [
                      { id: "todos", label: "Todos" },
                      { id: "recientes", label: "Recientes (7d)" },
                      { id: "vencidos", label: "Vencidos hoy" },
                      { id: "perdidos", label: "No interesados" },
                    ] as const
                  ).map((seg) => (
                    <button
                      key={seg.id}
                      type="button"
                      className={`button small ${segmentFilter === seg.id ? "primary" : ""}`}
                      onClick={() => setSegmentFilter(seg.id)}
                    >
                      {seg.label}
                    </button>
                  ))}
                </div>

                <div className="toolbar-right" style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  <button
                    className={`button small ${showFilters ? "primary" : ""}`}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter size={13} /> {showFilters ? "Ocultar filtros" : "Filtros detallados"}
                  </button>

                  <button className="button small" onClick={exportCsv}>
                    <Download size={13} /> Exportar CSV
                  </button>
                </div>
              </div>

              {/* Fila de Filtros Avanzados (Origen, Producto, Prioridad, Acuerdo, Pago) */}
              {showFilters && (
                <FilterRow
                  origin={originFilter}
                  product={productFilter}
                  priority={priorityFilter}
                  agreement={agreementFilter}
                  paymentStatus={paymentStatusFilter}
                  onOrigin={setOriginFilter}
                  onProduct={setProductFilter}
                  onPriority={setPriorityFilter}
                  onAgreement={setAgreementFilter}
                  onPaymentStatus={setPaymentStatusFilter}
                  onReset={resetAllFilters}
                />
              )}

              {/* Render según el modo seleccionado */}
              {displayMode === "kanban" ? (
                <KanbanBoard
                  leads={filteredLeads}
                  onMove={moveLead}
                  onOpen={setSelectedLead}
                  focusedStage={stageFilter as any}
                />
              ) : (
                <section className="panel table-panel">
                  <LeadTable
                    leads={filteredLeads}
                    onOpen={setSelectedLead}
                    onWhatsApp={(lead) => openWhatsApp(lead)}
                    showAll
                    pageSize={lowBandwidthMode ? 15 : 30}
                  />
                  {hasMoreLeads && hasCloud && (
                    <div style={{ padding: "12px 16px", textAlign: "center" }}>
                      <button
                        type="button"
                        className="button small"
                        disabled={busy}
                        onClick={loadMoreLeads}
                      >
                        {busy ? "Cargando..." : "Cargar más contactos"}
                      </button>
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          {/* Vista de Pagos */}
          {view === "payments" && (
            <PaymentsView
              payments={payments}
              leads={leads}
              pending={pendingAmount}
              revenue={revenue}
              onAdd={addPayment}
              onOpenLead={(id) => {
                const found = leads.find((l) => l.id === id);
                if (found) setSelectedLead(found);
              }}
              tell={tell}
            />
          )}
        </div>
      </main>

      {/* Modales */}
      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          payments={payments.filter((p) => p.lead_id === selectedLead.id)}
          activities={activities.filter((a) => a.lead_id === selectedLead.id)}
          onClose={() => setSelectedLead(null)}
          onSave={saveLead}
          onMove={(stage) => void moveLead(selectedLead, stage)}
          onWhatsApp={(customMsg) => openWhatsApp(selectedLead, customMsg)}
          onOpenSalesAssistant={() => {
            setSalesToolkitLead(selectedLead);
            setSalesToolkitOpen(true);
          }}
          onLogNote={(notes) =>
            logLeadActivity({
              lead_id: selectedLead.id,
              activity_type: "note",
              description: notes,
              metadata: {},
            })
          }
          onAddPayment={async (p) => {
            await addPayment(p);
          }}
          tell={tell}
        />
      )}

      {newModal && (
        <LeadForm
          lead={emptyLead()}
          onClose={() => setNewModal(false)}
          onSave={saveLead}
        />
      )}

      <SheetsSyncModal
        isOpen={sheetsSyncOpen}
        onClose={() => setSheetsSyncOpen(false)}
        leads={leads}
        onImportBatch={importLeadsBatch}
        onNotify={tell}
      />

      {salesToolkitOpen && (
        <SalesToolkitModal
          lead={salesToolkitLead}
          onClose={() => setSalesToolkitOpen(false)}
          onSendWhatsApp={(lead, msg) => openWhatsApp(lead, msg)}
          onNotify={tell}
        />
      )}

      {storageModalOpen && (
        <StorageOptimizerModal
          stats={crm.storageStats}
          lowBandwidthMode={lowBandwidthMode}
          onToggleLowBandwidth={crm.toggleLowBandwidthMode}
          onPurgeArchived={crm.purgeArchivedRecords}
          onCompactCache={crm.compactLocalCache}
          onExportBackup={crm.exportBackupJson}
          onResetDemo={crm.resetDemoData}
          onClose={() => setStorageModalOpen(false)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
