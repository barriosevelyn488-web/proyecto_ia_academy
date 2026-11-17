import type { Interest, PaymentMethod, Stage } from "@/lib/types";
import { buildSourceKey, normalizePhoneE164 } from "./phone";

/**
 * Contrato estándar hexagonal para cualquier canal externo de captación
 * (Bot de Iza, Google Sheets, Meta Ads, formularios web, etc.).
 */
export type IncomingLeadDTO = {
  full_name: string;
  phone: string;
  email: string;
  origin: string;
  product: string;
  stage: Stage;
  interest: Interest;
  deal_amount: number;
  payment_method: PaymentMethod | "";
  next_contact_at: string | null;
  notes: string;
  created_at?: string;
  source_key: string;
  source_tab: string;
  source_row: number | null;
  nit?: string;
  activity_note?: string;
};

export function sanitizeIncomingLead(input: {
  full_name?: unknown;
  phone?: unknown;
  email?: unknown;
  origin?: unknown;
  product?: unknown;
  stage: Stage;
  interest: Interest;
  deal_amount?: unknown;
  payment_method: PaymentMethod | "";
  next_contact_at: string | null;
  notes?: unknown;
  created_at?: string;
  source_key?: unknown;
  source_tab?: unknown;
  source_row?: unknown;
  nit?: unknown;
  activity_note?: unknown;
}): IncomingLeadDTO {
  const phone = normalizePhoneE164(input.phone);
  const product = String(input.product ?? "").trim();
  const explicitKey = String(input.source_key ?? "").trim();
  const source_key = explicitKey || (phone ? buildSourceKey(phone, product) : "");

  return {
    full_name: String(input.full_name ?? "").trim() || "Sin nombre",
    phone,
    email: String(input.email ?? "").trim(),
    origin: String(input.origin ?? "").trim() || "Externo",
    product,
    stage: input.stage,
    interest: input.interest,
    deal_amount: Number(input.deal_amount) > 0 ? Number(input.deal_amount) : 0,
    payment_method: input.payment_method,
    next_contact_at: input.next_contact_at,
    notes: String(input.notes ?? "").trim(),
    created_at: input.created_at,
    source_key,
    source_tab: String(input.source_tab ?? "").trim() || "Externo",
    source_row: Number(input.source_row) || null,
    nit: String(input.nit ?? "").trim(),
    activity_note: String(input.activity_note ?? "").trim(),
  };
}
