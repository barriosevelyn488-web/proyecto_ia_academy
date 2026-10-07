"use client";

import { useCallback, useMemo, useState } from "react";
import { hasCloud } from "@/lib/supabase/browser";
import { useCrm } from "@/hooks/use-crm";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CircleDollarSign,
  Download,
  Filter,
  GripVertical,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
  X,
  BarChart3,
} from "lucide-react";
import { Lead, Payment, Stage, STAGES, money, stageLabel } from "@/lib/types";
import { formatDate, isLate, numberPhone, today } from "@/lib/formatters";
import { AppBrand, LeadAvatar, Login, Metric } from "@/components/ui/crm-primitives";
import { FilterRow, LeadTable } from "@/features/leads/components/lead-table";
import { LeadDetail, LeadForm } from "@/features/leads/components/lead-forms";
import { KanbanBoard } from "@/features/leads/components/kanban-board";
import { PaymentsView } from "@/features/payments/components/payments-view";
import { ReportsPanel } from "@/features/dashboard/components/reports-panel";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

type View = "dashboard" | "funnel" | "leads" | "payments" | "reports";
const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Resumen", icon: LayoutDashboard },
  { id: "funnel", label: "Embudo Kanban", icon: Target },
  { id: "leads", label: "Contactos", icon: Users },
  { id: "payments", label: "Pagos e ingresos", icon: Wallet },
  { id: "reports", label: "M?tricas y reportes", icon: BarChart3 },
];
const emptyLead = (): Lead => ({
  id: "",
  full_name: "",
  phone: "",
  email: "",
  origin: "Bot",
  product: "",
  stage: "nuevo",
  interest: "sin_clasificar",
  deal_amount: 0,
  payment_method: "",
  next_contact_at: "",
  notes: "",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [period, setPeriod] = useState("30");
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState("todos");
  const [stageFilter, setStageFilter] = useState("todos");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newModal, setNewModal] = useState(false);
  const [toast, setToast] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const tell = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }, []);
  const crm = useCrm(tell);
  const {
    leads,
    payments,
    sessionReady,
    signedIn,
    loginBusy,
    loginError,
    userEmail,
    busy,
    loadCloudData,
    login,
    logout,
    addPayment,
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
  const enrolled = periodLeads.filter((lead) => lead.stage === "inscrito").length;
  const conversion = periodLeads.length ? (enrolled / periodLeads.length) * 100 : 0;
  const pipeline = leads
    .filter((lead) => !["inscrito", "perdido"].includes(lead.stage))
    .reduce((sum, lead) => sum + Number(lead.deal_amount || 0), 0);
  const pendingAmount = payments
    .filter((payment) => payment.status === "pendiente")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const overdueCount = leads.filter(
    (lead) =>
      lead.next_contact_at &&
      isLate(lead.next_contact_at) &&
      !["inscrito", "perdido"].includes(lead.stage),
  ).length;
  const origins = useMemo(
    () => Array.from(new Set(leads.map((lead) => lead.origin).filter(Boolean))).sort(),
    [leads],
  );
  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const term = search.trim().toLowerCase();
        const matchesTerm =
          !term ||
          [lead.full_name, lead.phone, lead.email, lead.product, lead.origin].some(
            (part) => part?.toLowerCase().includes(term),
          );
        return (
          matchesTerm &&
          (originFilter === "todos" || lead.origin === originFilter) &&
          (stageFilter === "todos" || lead.stage === stageFilter)
        );
      }),
    [leads, search, originFilter, stageFilter],
  );

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
      if (lead.stage === "inscrito") {
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
  const funnelData = STAGES.filter((stage) => stage.id !== "perdido").map((stage) => ({
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

  const exportCsv = () => {
    const rows = [
      [
        "Nombre",
        "Teléfono",
        "Correo",
        "Origen",
        "Producto",
        "Etapa",
        "Interés",
        "Precio del trato",
        "Método de pago",
        "Próximo contacto",
        "Notas",
      ],
      ...filteredLeads.map((lead) => [
        lead.full_name,
        lead.phone,
        lead.email,
        lead.origin,
        lead.product,
        stageLabel(lead.stage),
        lead.interest,
        lead.deal_amount,
        lead.payment_method,
        lead.next_contact_at,
        lead.notes,
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
    link.download = `campuslands-leads-${today()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!sessionReady)
    return (
      <div className="login-screen">
        <div className="login-card">
          <AppBrand />
          <div className="login-copy">Preparando tu espacio…</div>
        </div>
      </div>
    );
  if (hasCloud && !signedIn)
    return <Login onLogin={login} error={loginError} busy={loginBusy} />;

  const activeTitle = navItems.find((item) => item.id === view)?.label ?? "Resumen";
  const periodLabel = period === "all" ? "Todo el tiempo" : `Últimos ${period} días`;
  const openWhatsApp = (lead: Lead) => {
    const phone = numberPhone(lead.phone);
    if (!phone) {
      tell("Agrega un teléfono válido al contacto.");
      return;
    }
    const text = encodeURIComponent(
      `Hola ${lead.full_name.split(" ")[0]}, te contacto de Campuslands Guatemala para dar seguimiento a tu interés en ${lead.product || "nuestros programas"}.`,
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <AppBrand />
        <div className="workspace-label">Espacio de trabajo</div>
        <nav className="nav-list">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? "active" : ""}`}
              onClick={() => setView(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "leads" && <i className="nav-count">{leads.length}</i>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-title">Un seguimiento oportuno cierra más</div>
            <div className="help-text">
              Tienes {overdueCount} {overdueCount === 1 ? "contacto" : "contactos"} que
              necesitan atención hoy.
            </div>
            <button
              className="help-link"
              onClick={() => {
                setView("leads");
                setStageFilter("todos");
              }}
            >
              Ver pendientes <ArrowRight size={13} />
            </button>
          </div>
          <div className="profile">
            <LeadAvatar name={userEmail.includes("@") ? userEmail : "Equipo CRM"} />
            <div>
              <div className="profile-name">
                {userEmail.includes("@")
                  ? userEmail.split("@")[0]
                  : "Equipo de admisiones"}
              </div>
              <div className="profile-role">Administrador</div>
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
                placeholder="Buscar contacto…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className="icon-button"
              title="Actualizar"
              onClick={() =>
                hasCloud
                  ? void loadCloudData()
                  : tell("Datos de demostración actualizados.")
              }
            >
              <RefreshCw size={15} className={busy ? "spin" : ""} />
            </button>
            <button
              className="icon-button"
              title={`${overdueCount} seguimientos vencidos`}
              onClick={() => {
                setView("leads");
                setStageFilter("todos");
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
          {!hasCloud && (
            <div className="banner-demo">
              <Sparkles size={15} />
              <span>
                <strong>Modo de demostración.</strong> Los cambios se guardan en este
                navegador. Conecta Supabase para habilitar cuentas, sincronización entre
                el equipo y los datos reales.
              </span>
            </div>
          )}
          <div className="page-head">
            <div>
              <div className="eyebrow">
                Panel de admisiones <span style={{ margin: "0 5px" }}>·</span>
                {new Date().toLocaleDateString("es-GT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
              <h1 className="page-title">
                {view === "dashboard" ? "Hola, equipo 👋" : activeTitle}
              </h1>
              <p className="page-description">
                {view === "dashboard"
                  ? "Aquí tienes el pulso de tus prospectos, seguimiento e ingresos."
                  : view === "funnel"
                    ? "Mueve cada oportunidad por el proceso de admisión."
                    : view === "leads"
                      ? "Toda la información de tus prospectos en un solo lugar."
                      : view === "payments"
                        ? "Controla tratos, pagos recibidos y saldos pendientes."
                        : "Analiza el origen de tus leads y el resultado del embudo."}
              </p>
            </div>
            <div className="head-actions">
              <select
                className="select filter-select"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 90 días</option>
                <option value="all">Todo el tiempo</option>
              </select>
              <button className="button primary" onClick={() => setNewModal(true)}>
                <Plus size={15} /> Nuevo lead
              </button>
            </div>
          </div>

          {(view === "dashboard" || view === "reports") && (
            <>
              <div className="metric-grid">
                <Metric
                  label="Leads recibidos"
                  value={periodLeads.length.toLocaleString("es-GT")}
                  foot={periodLabel}
                  icon={Users}
                  tint="#6557e8"
                  trend="up"
                />
                <Metric
                  label="Tasa de conversión"
                  value={`${conversion.toFixed(1)}%`}
                  foot={`${enrolled} inscritos de ${periodLeads.length} leads`}
                  icon={Target}
                  tint="#239a78"
                  trend="up"
                />
                <Metric
                  label="Ingresos recibidos"
                  value={money(revenue)}
                  foot={`${periodPayments.length} pagos confirmados · ${periodLabel.toLowerCase()}`}
                  icon={CircleDollarSign}
                  tint="#d99526"
                  trend="up"
                />
                <Metric
                  label="Valor en seguimiento"
                  value={money(pipeline)}
                  foot={`${leads.filter((l) => !["inscrito", "perdido"].includes(l.stage)).length} oportunidades activas`}
                  icon={TrendingUp}
                  tint="#4e78dd"
                />
              </div>
              {view === "dashboard" ? (
                <>
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
                </>
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

          {view === "funnel" && (
            <>
              <div className="toolbar">
                <div className="kanban-hint">
                  <GripVertical size={14} /> Arrastra las tarjetas para cambiar la etapa
                  del lead.
                </div>
                <div className="toolbar-right">
                  <span className="count-label">{filteredLeads.length} prospectos</span>
                  <button
                    className="button small"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter size={13} /> Filtros
                  </button>
                </div>
              </div>
              {showFilters && (
                <FilterRow
                  origins={origins}
                  origin={originFilter}
                  stage={stageFilter}
                  onOrigin={setOriginFilter}
                  onStage={setStageFilter}
                />
              )}
              <KanbanBoard
                leads={filteredLeads}
                onMove={moveLead}
                onOpen={setSelectedLead}
              />
            </>
          )}
          {view === "leads" && (
            <>
              <div className="toolbar">
                <div className="toolbar-left">
                  <span className="count-label">
                    <strong style={{ color: "var(--ink)" }}>
                      {filteredLeads.length}
                    </strong>{" "}
                    contactos
                  </span>
                  {(originFilter !== "todos" || stageFilter !== "todos") && (
                    <button
                      className="button small"
                      onClick={() => {
                        setOriginFilter("todos");
                        setStageFilter("todos");
                      }}
                    >
                      Limpiar filtros <X size={12} />
                    </button>
                  )}
                </div>
                <div className="toolbar-right">
                  <button
                    className="button small"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter size={13} /> Filtros
                  </button>
                  <button className="button small" onClick={exportCsv}>
                    <Download size={13} /> Exportar CSV
                  </button>
                </div>
              </div>
              {showFilters && (
                <FilterRow
                  origins={origins}
                  origin={originFilter}
                  stage={stageFilter}
                  onOrigin={setOriginFilter}
                  onStage={setStageFilter}
                />
              )}
              <section className="panel table-panel">
                <LeadTable
                  leads={filteredLeads}
                  onOpen={setSelectedLead}
                  onWhatsApp={openWhatsApp}
                  showAll
                />
              </section>
            </>
          )}

          {view === "payments" && (
            <PaymentsView
              payments={payments}
              leads={leads}
              pending={pendingAmount}
              revenue={revenue}
              onAdd={addPayment}
              onOpenLead={(id) =>
                setSelectedLead(leads.find((lead) => lead.id === id) ?? null)
              }
              tell={tell}
            />
          )}
        </div>
      </main>
      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          payments={payments.filter((payment) => payment.lead_id === selectedLead.id)}
          onClose={() => setSelectedLead(null)}
          onSave={(next) => void saveLead(next, selectedLead)}
          onMove={(stage) => void moveLead(selectedLead, stage)}
          onWhatsApp={() => openWhatsApp(selectedLead)}
          onAddPayment={addPayment}
          tell={tell}
        />
      )}
      {newModal && (
        <LeadForm
          lead={emptyLead()}
          onClose={() => setNewModal(false)}
          onSave={(lead) => void saveLead(lead)}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
