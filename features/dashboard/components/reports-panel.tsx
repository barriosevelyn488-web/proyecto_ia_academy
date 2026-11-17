import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Lead, Payment, money } from "@/lib/types";
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

export function ReportsPanel({
  originData,
  sourcePie,
  funnelData,
  monthlyData,
  leads,
  payments,
  periodLabel,
  onOrigin,
}: {
  originData: {
    origin: string;
    leads: number;
    enrolled: number;
    conversion: number;
    revenue: number;
  }[];
  sourcePie: { name: string; value: number }[];
  funnelData: { name: string; cantidad: number }[];
  monthlyData: { month: string; leads: number; ingresos: number }[];
  leads: Lead[];
  payments: Payment[];
  periodLabel: string;
  onOrigin: (origin: string) => void;
}) {
  const paid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  return (
    <>
      <div className="report-grid">
        <section className="panel report-card">
          <SectionTitle
            title="Conversión por origen"
            subtitle={`Leads recibidos vs. inscripciones · ${periodLabel.toLowerCase()}`}
          />
          <div className="chart-area tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={originData}
                margin={{ top: 12, right: 7, bottom: 4, left: -18 }}
              >
                <CartesianGrid stroke="#edf0f5" vertical={false} />
                <XAxis
                  dataKey="origin"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#7c8698", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9099a9", fontSize: 9 }}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="leads" name="Leads" fill="#c7c1ff" radius={[5, 5, 0, 0]} />
                <Bar
                  dataKey="enrolled"
                  name="Inscritos"
                  fill="#6557e8"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel report-card">
          <SectionTitle
            title="Participación por origen"
            subtitle="Distribución de los prospectos recibidos"
          />
          <div className="chart-area tall">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourcePie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  outerRadius={91}
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {sourcePie.map((row, index) => (
                    <Cell key={row.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} leads`, "Total"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel report-card">
          <SectionTitle
            title="Tendencia de ingresos y leads"
            subtitle="Evolución de los últimos seis meses"
          />
          <div className="chart-area tall">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData}
                margin={{ top: 14, right: 5, bottom: 4, left: -12 }}
              >
                <CartesianGrid stroke="#edf0f5" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#7c8698", fontSize: 10 }}
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
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="leads"
                  name="Leads"
                  stroke="#6557e8"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="ingresos"
                  name="Ingresos"
                  stroke="#28a17f"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel report-card">
          <SectionTitle
            title="Avance del embudo"
            subtitle="Estado actual de los leads del periodo"
          />
          <div className="chart-area tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ top: 5, right: 15, bottom: 3, left: 28 }}
              >
                <CartesianGrid stroke="#edf0f5" horizontal={false} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9099a9", fontSize: 9 }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#697386", fontSize: 10 }}
                  width={100}
                />
                <Tooltip />
                <Bar
                  dataKey="cantidad"
                  name="Leads"
                  fill="#6557e8"
                  radius={[0, 5, 5, 0]}
                  barSize={17}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <section className="panel report-table">
        <SectionTitle
          title="Detalle por origen"
          subtitle={`${leads.length} leads · ${money(paid)} cobrados en el periodo`}
        />
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Origen</th>
                <th>Leads</th>
                <th>Inscritos</th>
                <th>Conversión</th>
                <th>Valor de tratos inscritos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {originData.map((row, index) => (
                <tr key={row.origin}>
                  <td>
                    <i
                      className="legend-dot"
                      style={{ background: colors[index % colors.length] }}
                    />
                    <strong style={{ color: "var(--ink)" }}>{row.origin}</strong>
                  </td>
                  <td>{row.leads}</td>
                  <td>{row.enrolled}</td>
                  <td>
                    <span
                      className={`badge ${row.conversion >= 25 ? "green" : row.conversion ? "amber" : "gray"}`}
                    >
                      {row.conversion}%
                    </span>
                  </td>
                  <td className="deal-total">{money(row.revenue)}</td>
                  <td>
                    <button className="button small" onClick={() => onOrigin(row.origin)}>
                      Ver leads
                    </button>
                  </td>
                </tr>
              ))}
              {!originData.length && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    Sin datos para el periodo seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
