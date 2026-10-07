import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SheetLead = {
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
};

const text = (value: unknown) => String(value ?? "").trim();
const normalizePhone = (value: unknown) => {
  const raw = text(value);
  const digits = raw.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
};
const stageValue = (value: unknown) => {
  const raw = text(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/no interes|perdid|descart/.test(raw)) return "perdido";
  if (/inscrit|confirmad|pagad/.test(raw)) return "inscrito";
  if (/visita/.test(raw)) return "visita";
  if (/interesad/.test(raw)) return "interesado";
  if (/llamo|contactad|seguimiento|llamada/.test(raw)) return "contactado";
  return "nuevo";
};
const interestValue = (value: unknown) => {
  const raw = text(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (raw.includes("no interesado") || raw.includes("bajo")) return "bajo";
  if (raw.includes("alto") || raw.includes("interesado")) return "alto";
  if (raw.includes("medio")) return "medio";
  return "sin_clasificar";
};
const paymentMethodValue = (value: unknown) => {
  const raw = text(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/transfer|trasfer/.test(raw)) return "Transferencia";
  if (raw.includes("tarjeta") || raw.includes("pos")) return "Tarjeta";
  if (raw.includes("efectivo") || raw.includes("cash")) return "Efectivo";
  if (raw.includes("financ") || raw.includes("cuota")) return "Financiamiento";
  if (raw) return "Otro";
  return "";
};
const isoDate = (value: unknown): string | null => {
  if (!value) return null;
  const raw = text(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match)
    return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return null;
};

function authorized(request: NextRequest, expected: string) {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  const secret = process.env.SHEETS_SYNC_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !url || !serviceKey)
    return NextResponse.json({ error: "Sheet sync is not configured." }, { status: 503 });
  if (!authorized(request, secret))
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let payload: { leads?: SheetLead[] };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!Array.isArray(payload.leads) || payload.leads.length > 250)
    return NextResponse.json(
      { error: "Send between 1 and 250 leads per request." },
      { status: 400 },
    );

  const records = payload.leads
    .map((lead) => ({
      full_name: text(lead.full_name) || "Sin nombre",
      phone: normalizePhone(lead.phone),
      email: text(lead.email),
      origin: text(lead.origin) || "Google Sheets",
      product: text(lead.product),
      stage: stageValue(lead.stage),
      interest: interestValue(lead.interest),
      deal_amount: Number(lead.deal_amount) > 0 ? Number(lead.deal_amount) : 0,
      payment_method: paymentMethodValue(lead.payment_method),
      next_contact_at: isoDate(lead.next_contact_at),
      notes: text(lead.notes),
      created_at: isoDate(lead.created_at)
        ? `${isoDate(lead.created_at)}T12:00:00.000Z`
        : undefined,
      source_key: text(lead.source_key),
    }))
    .filter((lead) => lead.phone && lead.source_key);

  if (records.length === 0)
    return NextResponse.json({ imported: 0, skipped: payload.leads.length });
  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await db.from("leads").upsert(records, { onConflict: "source_key" });
  if (error)
    return NextResponse.json({ error: "Database sync failed." }, { status: 500 });
  return NextResponse.json({
    imported: records.length,
    skipped: payload.leads.length - records.length,
  });
}
