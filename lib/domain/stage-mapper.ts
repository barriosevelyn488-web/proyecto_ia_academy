import type { Agreement, Interest, PaymentMethod, PaymentStatus, Priority, Stage } from "@/lib/types";
import { normalizeSlug } from "./phone";

export function mapStage(value: unknown): Stage {
  const raw = normalizeSlug(value);
  if (/no interes|descart|perdido/.test(raw)) return "no_interesado";
  if (/forms|formulario|inscrito/.test(raw)) return "inscrito_forms";
  if (/confirmad/.test(raw)) return "confirmado";
  if (/llamo|llamada/.test(raw)) return "ya_se_llamo";
  if (/interesad/.test(raw)) return "interesado";
  if (/conversacion|asesor|bot|contacto|seguimiento/.test(raw)) return "en_conversacion";
  return "nuevo";
}

export function mapPriority(value: unknown): Priority {
  const raw = normalizeSlug(value);
  if (/urgente/.test(raw)) return "URGENTE";
  if (/indesciso|indeciso/.test(raw)) return "INDESCISO";
  if (/no contesta/.test(raw)) return "NO CONTESTA";
  if (/ocupado/.test(raw)) return "OCUPADO";
  if (/colgo/.test(raw)) return "colgo";
  if (/no califica/.test(raw)) return "No califica";
  return "SEGUIMIENTO";
}

export function mapAgreement(value: unknown): Agreement {
  const raw = normalizeSlug(value);
  if (/concretad/.test(raw)) return "CONCRETADO";
  if (/proceso/.test(raw)) return "EN PROCESO";
  if (/inconcret/.test(raw)) return "INCONCRETO";
  return "";
}

export function mapPaymentStatus(value: unknown): PaymentStatus {
  const raw = normalizeSlug(value);
  if (/gratis/.test(raw)) return "Cupo Gratis";
  if (/no pago|no finaliz/.test(raw)) return "No pago, no finalizo proceso";
  if (/pendiente/.test(raw)) return "pendiente de pago";
  if (/pagado|pago/.test(raw)) return "Pagado";
  return "";
}

export function mapInterest(value: unknown): Interest {
  const raw = normalizeSlug(value);
  if (/no interesado|bajo|no califica|colgo/.test(raw)) return "bajo";
  if (/alto|interesado|urgente|confirmad|forms/.test(raw)) return "alto";
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
