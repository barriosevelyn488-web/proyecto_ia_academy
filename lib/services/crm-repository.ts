import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lead, LeadActivity, Payment, Stage } from "@/lib/types";

export const LEADS_SELECT =
  "id,full_name,phone,email,origin,product,stage,interest,priority,agreement,payment_status,deal_amount,payment_method,next_contact_at,notes,source_key,nit,created_at,updated_at";
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
      priority: row.priority || "SEGUIMIENTO",
      agreement: row.agreement || "",
      payment_status: row.payment_status || "",
      nit: row.nit || "",
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
    email: record.email || "",
    origin: record.origin || "BOT",
    product: record.product || "",
    stage: record.stage,
    interest: record.interest || "sin_clasificar",
    priority: record.priority || "SEGUIMIENTO",
    agreement: record.agreement || "",
    payment_status: record.payment_status || "",
    deal_amount: record.deal_amount || 0,
    payment_method: record.payment_method || "",
    next_contact_at: record.next_contact_at || null,
    notes: record.notes || "",
    nit: record.nit || "",
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
    priority: (data as Lead).priority || "SEGUIMIENTO",
    agreement: (data as Lead).agreement || "",
    payment_status: (data as Lead).payment_status || "",
    nit: (data as Lead).nit || "",
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

export async function batchUpsertLeads(
  db: SupabaseClient,
  leadsList: Partial<Lead>[],
): Promise<{ inserted: number; updated: number; errors: number }> {
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const raw of leadsList) {
    if (!raw.phone) {
      errors++;
      continue;
    }
    const payload = {
      full_name: raw.full_name || "Sin nombre",
      phone: raw.phone,
      email: raw.email || "",
      origin: raw.origin || "BOT",
      product: raw.product || "CODE UP",
      stage: raw.stage || "nuevo",
      interest: raw.interest || "sin_clasificar",
      priority: raw.priority || "SEGUIMIENTO",
      agreement: raw.agreement || "",
      payment_status: raw.payment_status || "",
      deal_amount: Number(raw.deal_amount) || 0,
      payment_method: raw.payment_method || "",
      next_contact_at: raw.next_contact_at || null,
      notes: raw.notes || "",
      nit: raw.nit || "",
      source_key: raw.source_key || `${raw.phone}:${raw.product || ""}`,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await db
      .from("leads")
      .select("id")
      .eq("source_key", payload.source_key)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await db.from("leads").update(payload).eq("id", existing.id);
      if (error) errors++;
      else updated++;
    } else {
      const { error } = await db.from("leads").insert(payload);
      if (error) errors++;
      else inserted++;
    }
  }

  return { inserted, updated, errors };
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
    ...data,
    amount: Number(data.amount || 0),
    due_date: data.due_date || "",
    paid_at: data.paid_at || "",
  } as Payment;
}

export async function insertCloudActivity(
  db: SupabaseClient,
  activity: NewActivityInput,
): Promise<LeadActivity | null> {
  const { data, error } = await db
    .from("lead_activities")
    .insert({
      lead_id: activity.lead_id,
      activity_type: activity.activity_type,
      description: activity.description,
      metadata: activity.metadata,
    })
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
  let ok = true;
  if (leadIds.length > 0) {
    const { error } = await db.from("leads").delete().in("id", leadIds);
    if (error) ok = false;
  }
  if (paymentIds.length > 0) {
    const { error } = await db.from("payments").delete().in("id", paymentIds);
    if (error) ok = false;
  }
  return ok;
}
