import { useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  LoaderCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Lead, Stage, money, stageLabel } from "@/lib/types";
import { initials } from "@/lib/formatters";

export function AppBrand() {
  return (
    <div className="brand">
      <div className="brand-mark">C</div>
      <div>
        <div className="brand-name">Campuslands CRM</div>
        <div className="brand-sub">Admisiones · Guatemala</div>
      </div>
    </div>
  );
}

export function Login({
  onLogin,
  error,
  busy,
}: {
  onLogin: (email: string, password: string) => void;
  error: string;
  busy: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="login-screen">
      <form
        className="login-card"
        onSubmit={(event) => {
          event.preventDefault();
          onLogin(email, password);
        }}
      >
        <AppBrand />
        <div className="login-title">Bienvenido de vuelta</div>
        <div className="login-copy">
          Ingresa con tu cuenta del equipo para abrir el CRM y gestionar tus prospectos.
        </div>
        <label className="form-field">
          <span className="form-label">Correo electrónico</span>
          <input
            className="field"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nombre@empresa.com"
          />
        </label>
        <label className="form-field">
          <span className="form-label">Contraseña</span>
          <input
            className="field"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Tu contraseña"
          />
        </label>
        <button className="button primary" disabled={busy}>
          {busy ? <LoaderCircle size={15} className="spin" /> : <ShieldCheck size={15} />}
          Iniciar sesión
        </button>
        {error && <div className="login-error">{error}</div>}
      </form>
    </main>
  );
}

export function Metric({
  label,
  value,
  foot,
  icon: Icon,
  tint,
  trend,
}: {
  label: string;
  value: string;
  foot: string;
  icon: typeof Users;
  tint: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon" style={{ background: `${tint}14`, color: tint }}>
          <Icon size={16} />
        </span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">
        {trend && (
          <span className={trend === "up" ? "trend-up" : "trend-down"}>
            {trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          </span>
        )}
        {foot}
      </div>
    </div>
  );
}

export function LeadAvatar({ name }: { name: string }) {
  return <div className="avatar">{initials(name)}</div>;
}

export function StageBadge({ stage }: { stage: Stage }) {
  const colorByStage: Record<Stage, string> = {
    nuevo: "blue",
    interesado: "purple",
    contactado: "amber",
    visita: "blue",
    inscrito: "green",
    perdido: "gray",
  };

  return (
    <span className={`badge ${colorByStage[stage]}`}>
      <i className="badge-dot" />
      {stageLabel(stage)}
    </span>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel-head">
      <div>
        <div className="panel-title">{title}</div>
        {subtitle && <div className="panel-sub">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: {
    name?: string | number;
    value?: string | number;
    color?: string;
  }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map((item, index) => {
        const name = String(item.name ?? "");
        const value = Number(item.value ?? 0);
        const formattedValue = /ingreso|venta/i.test(name) ? money(value) : value;

        return (
          <div key={`${name}-${index}`} className="tooltip-row">
            <i style={{ background: item.color }} />
            {name}
            <strong>{formattedValue}</strong>
          </div>
        );
      })}
    </div>
  );
}
