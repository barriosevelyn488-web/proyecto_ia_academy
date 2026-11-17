import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adaptSheetLead, type RawSheetLead } from "@/lib/adapters/google-sheets.adapter";
import { verifyBearerSecret } from "@/lib/services/webhook-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.SHEETS_SYNC_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !url || !serviceKey) {
    return NextResponse.json({ error: "Sheet sync is not configured." }, { status: 503 });
  }
  if (!verifyBearerSecret(request, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: { leads?: RawSheetLead[] };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!Array.isArray(payload.leads) || payload.leads.length > 250) {
    return NextResponse.json(
      { error: "Send between 1 and 250 leads per request." },
      { status: 400 },
    );
  }

  const syncId = randomUUID();
  const rawRecords = payload.leads.map(adaptSheetLead);
  const records = rawRecords.filter((lead) => lead.phone && lead.source_key);
  const skippedRows = rawRecords.filter((lead) => !lead.phone || !lead.source_key);

  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const normalized = Array.from(
    new Map(
      records.map((record) => {
        const source_hash = createHash("sha256")
          .update(
            JSON.stringify({
              full_name: record.full_name,
              phone: record.phone,
              email: record.email,
              origin: record.origin,
              product: record.product,
              stage: record.stage,
              interest: record.interest,
              deal_amount: record.deal_amount,
              payment_method: record.payment_method,
              next_contact_at: record.next_contact_at,
              notes: record.notes,
              created_at: record.created_at,
            }),
          )
          .digest("hex");
        return [record.source_key, { ...record, source_hash }] as const;
      }),
    ).values(),
  );

  const keys = normalized.map((record) => record.source_key);
  const { data: existingRows, error: lookupError } = keys.length
    ? await db.from("leads").select("source_key,source_hash").in("source_key", keys)
    : { data: [], error: null };

  if (lookupError) {
    return NextResponse.json(
      { error: "Could not inspect existing leads." },
      { status: 500 },
    );
  }

  const existing = new Map(
    (existingRows ?? []).map((row) => [
      row.source_key as string,
      row.source_hash as string,
    ]),
  );

  const newRecords = normalized
    .filter((record) => !existing.has(record.source_key))
    .map((record) => ({
      full_name: record.full_name,
      phone: record.phone,
      email: record.email,
      origin: record.origin,
      product: record.product,
      stage: record.stage,
      interest: record.interest,
      deal_amount: record.deal_amount,
      payment_method: record.payment_method,
      next_contact_at: record.next_contact_at,
      notes: record.notes,
      created_at: record.created_at,
      source_key: record.source_key,
      source_hash: record.source_hash,
      source_tab: record.source_tab || "Google Sheets",
    }));

  let insertedKeys = new Set<string>();
  if (newRecords.length) {
    const { data, error } = await db
      .from("leads")
      .upsert(newRecords, { onConflict: "source_key", ignoreDuplicates: true })
      .select("source_key");
    if (error) {
      return NextResponse.json({ error: "Database sync failed." }, { status: 500 });
    }
    insertedKeys = new Set((data ?? []).map((row) => row.source_key as string));
  }

  const outcomes = [
    ...normalized.map((record) => {
      if (!existing.has(record.source_key) && insertedKeys.has(record.source_key)) {
        return {
          ...record,
          status: "imported" as const,
          message: "Lead importado desde Sheets.",
        };
      }
      if (
        existing.has(record.source_key) &&
        existing.get(record.source_key) === record.source_hash
      ) {
        return {
          ...record,
          status: "unchanged" as const,
          message: "Sin cambios desde la última sincronización.",
        };
      }
      return {
        ...record,
        status: "conflict" as const,
        message:
          "El lead ya existe; se conservó la versión del CRM. Revisa el cambio de Sheets.",
      };
    }),
    ...skippedRows.map((record) => ({
      ...record,
      source_hash: "",
      status: "skipped" as const,
      message: !record.phone
        ? "Fila omitida: no tiene un teléfono válido."
        : "Fila omitida: no se pudo generar source_key.",
    })),
  ];

  const changedConflicts = outcomes.filter((row) => row.status === "conflict");
  for (const record of changedConflicts) {
    await db
      .from("leads")
      .update({
        source_hash: record.source_hash,
        source_tab: record.source_tab || "Google Sheets",
      })
      .eq("source_key", record.source_key);
  }

  const { error: logError } = await db.from("sync_logs").insert(
    outcomes.map((row) => ({
      sync_id: syncId,
      source_key: row.source_key,
      source_tab: row.source_tab || "Google Sheets",
      source_row: row.source_row,
      status: row.status,
      message: row.message,
    })),
  );

  if (logError) {
    return NextResponse.json(
      { error: "Leads processed, but sync audit could not be saved." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    sync_id: syncId,
    imported: outcomes.filter((row) => row.status === "imported").length,
    unchanged: outcomes.filter((row) => row.status === "unchanged").length,
    conflicts: outcomes.filter((row) => row.status === "conflict").length,
    skipped: skippedRows.length,
    results: outcomes.map(({ source_key, source_row, status, message }) => ({
      source_key,
      source_row,
      status,
      message,
    })),
  });
}
