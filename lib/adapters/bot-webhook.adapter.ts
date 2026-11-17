import { sanitizeIncomingLead, type IncomingLeadDTO } from "@/lib/domain/lead-ingress";
import { mapInterest, mapPaymentMethod, mapStage } from "@/lib/domain/stage-mapper";

export type RawBotPayload = {
  full_name?: unknown;
  phone?: unknown;
  email?: unknown;
  origin?: unknown;
  product?: unknown;
  stage?: unknown;
  interest?: unknown;
  deal_amount?: unknown;
  payment_method?: unknown;
  notes?: unknown;
  nit?: unknown;
  activity_note?: unknown;
};

/**
 * Adaptador Hexagonal: traduce el payload del Bot de Iza / n8n / WhatsApp al dominio.
 */
export function adaptBotPayload(payload: RawBotPayload): IncomingLeadDTO {
  return sanitizeIncomingLead({
    full_name: payload.full_name || "Lead Bot",
    phone: payload.phone,
    email: payload.email,
    origin: payload.origin || "Bot",
    product: payload.product,
    stage: payload.stage ? mapStage(payload.stage) : "nuevo",
    interest: mapInterest(payload.interest),
    deal_amount: payload.deal_amount,
    payment_method: mapPaymentMethod(payload.payment_method),
    next_contact_at: null,
    notes: payload.notes,
    source_tab: "Bot Webhook",
    nit: payload.nit,
    activity_note: payload.activity_note,
  });
}
