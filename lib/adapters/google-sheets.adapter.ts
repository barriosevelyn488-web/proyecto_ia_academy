import { sanitizeIncomingLead, type IncomingLeadDTO } from "@/lib/domain/lead-ingress";
import {
  mapInterest,
  mapPaymentMethod,
  mapStage,
  parseIsoDate,
} from "@/lib/domain/stage-mapper";

export type RawSheetLead = {
  full_name?: unknown;
  phone?: unknown;
  email?: unknown;
  origin?: unknown;
  product?: unknown;
  stage?: unknown;
  interest?: unknown;
  deal_amount?: unknown;
  payment_method?: unknown;
  next_contact_at?: unknown;
  notes?: unknown;
  created_at?: unknown;
  source_key?: unknown;
  source_tab?: unknown;
  source_row?: unknown;
  nit?: unknown;
};

/**
 * Adaptador Hexagonal: traduce una fila de Google Sheets al contrato del dominio.
 */
export function adaptSheetLead(row: RawSheetLead): IncomingLeadDTO {
  const createdIso = parseIsoDate(row.created_at);
  return sanitizeIncomingLead({
    full_name: row.full_name,
    phone: row.phone,
    email: row.email,
    origin: row.origin || "Google Sheets",
    product: row.product,
    stage: mapStage(row.stage),
    interest: mapInterest(row.interest),
    deal_amount: row.deal_amount,
    payment_method: mapPaymentMethod(row.payment_method),
    next_contact_at: parseIsoDate(row.next_contact_at),
    notes: row.notes,
    created_at: createdIso ? `${createdIso}T12:00:00.000Z` : undefined,
    source_key: row.source_key,
    source_tab: row.source_tab || "Google Sheets",
    source_row: row.source_row,
    nit: row.nit,
  });
}
