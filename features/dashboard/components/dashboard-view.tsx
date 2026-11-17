"use client";

import { ArrowRight, MoveRight } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Lead, money } from "@/lib/types";
import { LeadTable } from "@/features/leads/components/lead-table";
import { ChartTooltip, SectionTitle } from "@/components/ui/crm-primitives";

const colors = [
  "#6557e8",
  "#32a892",
  "#e6a63e",
  "#4d79df",
  "#df7891",
  "#97a2b4",
  "#a879db",
];

type OriginMetric = {
  origin: string;
  leads: number;
  enrolled: number;
  conversion: number;
  revenue: number;
};
type FunnelMetric = { name: string; cantidad: number };
type MonthlyMetric = { month: string; leads: number; ingresos: number };

type DashboardViewProps = {
  periodLeads: Lead[];
  leads: Lead[];
  periodLabel: string;
  originData: OriginMetric[];
  sourcePie: { name: string; value: number }[];
  funnelData: FunnelMetric[];
  monthlyData: MonthlyMetric[];
  onNavigate: (view: "reports" | "funnel" | "leads") => void;
  onOpenLead: (lead: Lead) => void;
  onWhatsApp: (lead: Lead) => void;
};

export function DashboardView({
  periodLeads,
  leads,
  periodLabel,
  originData,
  sourcePie,
  funnelData,
  monthlyData,
  onNavigate,
  onOpenLead,
  onWhatsApp,
}: DashboardViewProps) {
  return (
    <>
      <div className="dashboard-grid">
        <section className="panel">
          <SectionTitle
            title="Leads e ingresos"
            subtitle="Actividad de los últimos seis meses"
            action={
              <button className="button small" onClick={() => onNavigate("reports")}>
                Ver reporte <ArrowRight size={12} />
              </button>
            }
          />
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData}
                margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
              >
                <defs>
                  <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6557e8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6557e8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#edf0f5" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9099a9", fontSize: 10 }}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9099a9", fontSize: 9 }}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9099a9", fontSize: 9 }}
                  tickFormatter={(n) => `${n / 1000}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="leads"
                  name="Leads"
                  stroke="#6557e8"
                  strokeWidth={2.5}
                  fill="url(#leadGradient)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="ingresos"
                  name="Ingresos"
                  stroke="#29a583"
                  strokeWidth={2.2}
                  dot={{ r: 3, fill: "#29a583", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-dot" style={{ background: "#6557e8" }} />
              Leads recibidos
            </span>
            <span>
              <i className="legend-dot" style={{ background: "#29a583" }} />
              Ingresos cobrados
            </span>
          </div>
        </section>
        <section className="panel">
          <SectionTitle
            title="Origen de leads"
            subtitle={`Distribución · ${periodLabel.toLowerCase()}`}
            action={
              <button
                className="button ghost small"
                onClick={() => onNavigate("reports")}
              >
                Detalle <ArrowRight size={12} />
              </button>
            }
          />
          <div className="chart-area" style={{ height: 154 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourcePie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={3}
                  stroke="none"
                >
                  {sourcePie.map((row, index) => (
                    <Cell key={row.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} leads`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="origin-list">
            {originData.slice(0, 4).map((row, index) => (
              <div key={row.origin}>
                <div className="origin-row-head">
                  <span>
                    <i
                      className="legend-dot"
                      style={{
                        background: colors[index % colors.length],
                      }}
                    />
                    <span className="origin-name">{row.origin}</span>
                    <span className="origin-sub">{row.leads} leads</span>
                  </span>
                  <span className="origin-val">{row.conversion}%</span>
                </div>
                <div className="progress">
                  <span
                    style={{
                      width: `${Math.min(100, row.conversion)}%`,
                      background: colors[index % colors.length],
                    }}
                  />
                </div>
              </div>
            ))}
            {!originData.length && (
              <div className="empty-state">Aún no hay leads en este periodo.</div>
            )}
          </div>
        </section>
      </div>
      <div className="bottom-grid">
        <section className="panel" style={{ padding: 0 }}>
          <div style={{ padding: "17px 18px 0" }}>
            <SectionTitle
              title="Seguimiento reciente"
              subtitle="Prospectos que requieren atención"
              action={
                <button className="button small" onClick={() => onNavigate("leads")}>
                  Ver todos <ArrowRight size={12} />
                </button>
              }
            />
          </div>
          <LeadTable
            leads={[...leads]
              .filter((l) => !["inscrito", "perdido"].includes(l.stage))
              .sort((a, b) =>
                (a.next_contact_at || "9999").localeCompare(b.next_contact_at || "9999"),
              )
              .slice(0, 5)}
            onOpen={onOpenLead}
            onWhatsApp={onWhatsApp}
          />
        </section>
        <section className="panel">
          <SectionTitle
            title="Resumen del embudo"
            subtitle={`${periodLeads.length} oportunidades en el periodo`}
          />
          <div className="funnel-mini">
            {funnelData
              .filter(
                (row) =>
                  row.cantidad ||
                  [
                    "Nuevo lead",
                    "Interesado",
                    "En seguimiento",
                    "Visita",
                    "Inscrito",
                  ].includes(row.name),
              )
              .map((row, index) => (
                <div className="funnel-row" key={row.name}>
                  <span className="funnel-label">
                    <i
                      style={{
                        background: colors[index % colors.length],
                      }}
                    />
                    {row.name}
                  </span>
                  <span className="funnel-track">
                    <i
                      style={{
                        width: `${periodLeads.length ? Math.max(2, (row.cantidad / periodLeads.length) * 100) : 0}%`,
                        background: colors[index % colors.length],
                      }}
                    />
                  </span>
                  <strong>{row.cantidad}</strong>
                </div>
              ))}
          </div>
          <button
            className="button small funnel-open"
            onClick={() => onNavigate("funnel")}
          >
            Abrir tablero Kanban <MoveRight size={13} />
          </button>
        </section>
      </div>
    </>
  );
}
