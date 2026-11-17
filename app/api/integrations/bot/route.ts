import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const text = (value: unknown) => String(value ?? "").trim();

const normalizePhone = (value: unknown) => {
  const raw = text(value);
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 8) digits = `502${digits}`;
  if (digits.length === 9 && digits.startsWith("0")) digits = `502${digits.slice(1)}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : "";
};

const normalizeKey = (phone: string, product: string) =>
  `${phone.replace(/\D/g, "")}:${product.toLowerCase().trim() || "general"}`;

function authorized(request: NextRequest, expected: string) {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function getConfig() {
  const secret = process.env.BOT_WEBHOOK_SECRET || process.env.SHEETS_SYNC_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { secret, url, serviceKey };
}

export async function GET(request: NextRequest) {
  const { secret, url, serviceKey } = getConfig();
  if (!secret || !url || !serviceKey) {
    return NextResponse.json({ error: "Bot integration is not configured." }, { status: 503 });
  }
  if (!authorized(request, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const phoneParam = normalizePhone(request.nextUrl.searchParams.get("phone"));
  if (!phoneParam) {
    return NextResponse.json({ error: "Provide a valid phone query param." }, { status: 400 });
  }

  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: leads, error } = await db
    .from("leads")
    .select("id,full_name,phone,email,origin,product,stage,interest,deal_amount,next_contact_at,notes,updated_at")
    .eq("phone", phoneParam)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: "Database lookup failed." }, { status: 500 });
  }

  return NextResponse.json({ found: (leads?.length ?? 0) > 0, leads: leads ?? [] });
}

export async function POST(request: NextRequest) {
  const { secret, url, serviceKey } = getConfig();
  if (!secret || !url || !serviceKey) {
    return NextResponse.json({ error: "Bot integration is not configured." }, { status: 503 });
  }
  if (!authorized(request, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: {
    full_name?: unknown;
    phone?: unknown;
    email?: unknown;
    origin?: unknown;
    product?: unknown;
    interest?: unknown;
    deal_amount?: unknown;
    notes?: unknown;
    activity_note?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const phone = normalizePhone(body.phone);
  if (!phone) {
    return NextResponse.json({ error: "Valid phone number is required." }, { status: 400 });
  }

  const product = text(body.product);
  const sourceKey = normalizeKey(phone, product);

  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing } = await db
    .from("leads")
    .select("id,stage,notes")
    .eq("source_key", sourceKey)
    .maybeSingle();

  let leadId = existing?.id as string | undefined;

  if (!existing) {
    const { data: inserted, error } = await db
      .from("leads")
      .insert({
        full_name: text(body.full_name) || "Lead Bot",
        phone,
        email: text(body.email),
        origin: text(body.origin) || "Bot",
        product,
        stage: "nuevo",
        interest: ["alto", "medio", "bajo"].includes(text(body.interest).toLowerCase())
          ? text(body.interest).toLowerCase()
          : "sin_clasificar",
        deal_amount: Number(body.deal_amount) > 0 ? Number(body.deal_amount) : 0,
        notes: text(body.notes),
        source_key: sourceKey,
        source_tab: "Bot Webhook",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return NextResponse.json({ error: "Could not create lead." }, { status: 500 });
    }
    leadId = inserted.id as string;
  }

  const activityNote = text(body.activity_note);
  if (leadId && activityNote) {
    await db.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: "note",
      description: activityNote,
      metadata: { source: "bot_webhook" },
    });
  }

  return NextResponse.json({
    ok: true,
    action: existing ? "preserved_existing" : "created",
    lead_id: leadId,
    source_key: sourceKey,
  });
}
