import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lead, LeadActivity, Payment, Stage } from "@/lib/types";

export const LEADS_SELECT =
  "id,full_name,phone,email,origin,product,stage,interest,deal_amount,payment_method,next_contact_at,notes,source_key,created_at,updated_at";
export const PAYMENTS_SELECT =
  "id,lead_id,amount,method,status,due_date,paid_at,reference,created_at";
export const ACTIVITIES_SELECT =
  "id,lead_id,activity_type,description,metadata,created_by,created_at";

export type NewPaymentInput = Omit<Payment, "id" | "created_at">;
export type NewActivityInput = Omit<LeadActivity, "id" | "created_at" | "created_by">;

export type CloudSnapshot = {
  leads: Lead[];
  hasMoreLeads: boolean;
  payments: Payment[];
  activities: LeadActivity[];
  hasError: boolean;
};

/**
 * Capa de Repositorio (Supabase / PostgreSQL).
 * Encapsula las consultas para desacoplar la UI del proveedor de base de datos.
 */
export async function fetchCloudSnapshot(
  db: SupabaseClient,
  limit: number,
  lowBandwidthMode: boolean,
): Promise<CloudSnapshot> {
  const [
    { data: leadRows, error: leadError },
    { data: paymentRows, error: paymentError },
    { data: activityRows, error: activityError },
  ] = await Promise.all([
    db
      .from("leads")
      .select(LEADS_SELECT)
      .order("created_at", { ascending: false })
      .limit(limit + 1),
    db
      .from("payments")
      .select(PAYMENTS_SELECT)
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("lead_activities")
      .select(ACTIVITIES_SELECT)
      .order("created_at", { ascending: false })
      .limit(lowBandwidthMode ? 120 : 300),
  ]);

  const hasMoreLeads = Boolean(leadRows && leadRows.length > limit);
  const slicedLeads = leadRows ? (hasMoreLeads ? leadRows.slice(0, limit) : leadRows) : [];

  return {
    leads: slicedLeads.map((row) => ({
      ...row,
      deal_amount: Number(row.deal_amount || 0),
      next_contact_at: row.next_contact_at || "",
    })) as Lead[],
    hasMoreLeads,
    payments: (paymentRows ?? []).map((row) => ({
      ...row,
      amount: Number(row.amount || 0),
      due_date: row.due_date || "",
      paid_at: row.paid_at || "",
    })) as Payment[],
    activities: (activityRows ?? []) as LeadActivity[],
    hasError: Boolean(leadError || paymentError || activityError),
  };
}

export async function persistCloudLead(
  db: SupabaseClient,
  record: Lead,
  existing?: Lead,
): Promise<Lead | null> {
  const payload: Record<string, unknown> = {
    full_name: record.full_name,
    phone: record.phone,
    email: record.email,
    origin: record.origin,
    product: record.product,
    stage: record.stage,
    interest: record.interest,
    deal_amount: record.deal_amount,
    payment_method: record.payment_method,
    next_contact_at: record.next_contact_at || null,
    notes: record.notes,
    source_key: record.source_key,
    updated_at: record.updated_at,
  };

  const query = existing
    ? db.from("leads").update(payload).eq("id", existing.id).select(LEADS_SELECT).single()
    : db.from("leads").insert(payload).select(LEADS_SELECT).single();

  const { data, error } = await query;
  if (error || !data) return null;

  const saved: Lead = {
    ...(data as Lead),
    deal_amount: Number((data as Lead).deal_amount || 0),
    next_contact_at: (data as Lead).next_contact_at || "",
  };

  if (existing && existing.stage !== saved.stage) {
    await db.from("lead_events").insert({
      lead_id: saved.id,
      from_stage: existing.stage,
      to_stage: saved.stage,
    });
  }

  return saved;
}

export async function updateCloudLeadStage(
  db: SupabaseClient,
  lead: Lead,
  stage: Stage,
  updatedAt: string,
): Promise<boolean> {
  const { error } = await db
    .from("leads")
    .update({ stage, updated_at: updatedAt })
    .eq("id", lead.id);

  if (error) return false;

  await db.from("lead_events").insert({
    lead_id: lead.id,
    from_stage: lead.stage,
    to_stage: stage,
  });
  return true;
}

export async function insertCloudPayment(
  db: SupabaseClient,
  payment: NewPaymentInput,
): Promise<Payment | null> {
  const { data, error } = await db
    .from("payments")
    .insert({
      ...payment,
      due_date: payment.due_date || null,
      paid_at: payment.paid_at || null,
    })
    .select(PAYMENTS_SELECT)
    .single();

  if (error || !data) return null;

  return {
    ...(data as Payment),
    amount: Number((data as Payment).amount || 0),
    due_date: (data as Payment).due_date || "",
    paid_at: (data as Payment).paid_at || "",
  };
}

export async function insertCloudActivity(
  db: SupabaseClient,
  activity: NewActivityInput,
): Promise<LeadActivity | null> {
  const { data, error } = await db
    .from("lead_activities")
    .insert(activity)
    .select(ACTIVITIES_SELECT)
    .single();

  if (error || !data) return null;
  return data as LeadActivity;
}

export async function purgeCloudArchived(
  db: SupabaseClient,
  leadIds: string[],
  paymentIds: string[],
): Promise<boolean> {
  if (leadIds.length > 0) {
    const { error } = await db.from("leads").delete().in("id", leadIds);
    if (error) return false;
  }
  if (paymentIds.length > 0) {
    const { error } = await db.from("payments").delete().in("id", paymentIds);
    if (error) return false;
  }
  return true;
}
