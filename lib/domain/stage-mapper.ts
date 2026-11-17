import type { Interest, PaymentMethod, Stage } from "@/lib/types";
import { normalizeSlug } from "./phone";

export function mapStage(value: unknown): Stage {
  const raw = normalizeSlug(value);
  if (/no interes|perdid|descart|no califica/.test(raw)) return "perdido";
  if (/inscrit|confirmad|pagad|forms/.test(raw)) return "inscrito";
  if (/visita/.test(raw)) return "visita";
  if (/interesad/.test(raw)) return "interesado";
  if (/llamo|contactad|seguimiento|llamada|conversacion/.test(raw)) return "contactado";
  return "nuevo";
}

export function mapInterest(value: unknown): Interest {
  const raw = normalizeSlug(value);
  if (/no interesado|bajo|no califica|colgo/.test(raw)) return "bajo";
  if (/alto|interesado|urgente/.test(raw)) return "alto";
  if (/medio|seguimiento|indesciso|ocupado|no contesta/.test(raw)) return "medio";
  return "sin_clasificar";
}

export function mapPaymentMethod(value: unknown): PaymentMethod | "" {
  const raw = normalizeSlug(value);
  if (/transfer|trasfer/.test(raw)) return "Transferencia";
  if (raw.includes("tarjeta") || raw.includes("pos")) return "Tarjeta";
  if (raw.includes("efectivo") || raw.includes("cash")) return "Efectivo";
  if (raw.includes("financ") || raw.includes("cuota")) return "Financiamiento";
  if (raw) return "Otro";
  return "";
}

export function parseIsoDate(value: unknown): string | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  return null;
}

export const LOSS_REASONS = [
  "Precio / presupuesto",
  "Horario / disponibilidad",
  "No responde",
  "Eligió otra opción",
  "No califica",
  "Otro",
] as const;
