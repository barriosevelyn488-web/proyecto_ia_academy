import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { adaptBotPayload, type RawBotPayload } from "@/lib/adapters/bot-webhook.adapter";
import { normalizePhoneE164 } from "@/lib/domain/phone";
import { verifyBearerSecret } from "@/lib/services/webhook-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  if (!verifyBearerSecret(request, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const phoneParam = normalizePhoneE164(request.nextUrl.searchParams.get("phone"));
  if (!phoneParam) {
    return NextResponse.json({ error: "Provide a valid phone query param." }, { status: 400 });
  }

  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: leads, error } = await db
    .from("leads")
    .select(
      "id,full_name,phone,email,origin,product,stage,interest,deal_amount,next_contact_at,notes,updated_at",
    )
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
  if (!verifyBearerSecret(request, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: RawBotPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const dto = adaptBotPayload(body);
  if (!dto.phone) {
    return NextResponse.json({ error: "Valid phone number is required." }, { status: 400 });
  }

  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing } = await db
    .from("leads")
    .select("id,stage,notes")
    .eq("source_key", dto.source_key)
    .maybeSingle();

  let leadId = existing?.id as string | undefined;

  if (!existing) {
    const { data: inserted, error } = await db
      .from("leads")
      .insert({
        full_name: dto.full_name,
        phone: dto.phone,
        email: dto.email,
        origin: dto.origin,
        product: dto.product,
        stage: dto.stage,
        interest: dto.interest,
        deal_amount: dto.deal_amount,
        payment_method: dto.payment_method,
        notes: dto.notes,
        source_key: dto.source_key,
        source_tab: dto.source_tab,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return NextResponse.json({ error: "Could not create lead." }, { status: 500 });
    }
    leadId = inserted.id as string;
  }

  if (leadId && dto.activity_note) {
    await db.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: "note",
      description: dto.activity_note,
      metadata: { source: "bot_webhook" },
    });
  }

  return NextResponse.json({
    ok: true,
    action: existing ? "preserved_existing" : "created",
    lead_id: leadId,
    source_key: dto.source_key,
  });
}
