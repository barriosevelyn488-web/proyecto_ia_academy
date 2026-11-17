import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { demoLeads, demoPayments } from "@/lib/demo-data";
import { hasCloud, supabase } from "@/lib/supabase/browser";
import { Lead, LeadActivity, Payment, Stage } from "@/lib/types";
import { numberPhone, sourceKeyFor } from "@/lib/formatters";

type Notify = (message: string) => void;
type NewPayment = Omit<Payment, "id" | "created_at">;
type NewActivity = Omit<LeadActivity, "id" | "created_at" | "created_by">;

const STORAGE_KEYS = {
  leads: "campuslands-crm-leads",
  payments: "campuslands-crm-payments",
  activities: "campuslands-crm-activities",
  lightMode: "campuslands-crm-light-mode",
} as const;

const LEADS_SELECT =
  "id,full_name,phone,email,origin,product,stage,interest,deal_amount,payment_method,next_contact_at,notes,source_key,created_at,updated_at";
const PAYMENTS_SELECT =
  "id,lead_id,amount,method,status,due_date,paid_at,reference,created_at";
const ACTIVITIES_SELECT =
  "id,lead_id,activity_type,description,metadata,created_by,created_at";

function readLocal<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function byteSizeOf(value: string | null): number {
  if (!value) return 0;
  return new Blob([value]).size;
}

export type StorageStats = {
  localBytesTotal: number;
  leadsBytes: number;
  paymentsBytes: number;
  activitiesBytes: number;
  leadsCount: number;
  paymentsCount: number;
  activitiesCount: number;
  oldLostCount: number;
  voidPaymentsCount: number;
  duplicatePhoneCount: number;
};

export function useCrm(notify: Notify) {
  const [leads, setLeads] = useState<Lead[]>(demoLeads);
  const [payments, setPayments] = useState<Payment[]>(demoPayments);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [sessionReady, setSessionReady] = useState(!hasCloud);
  const [signedIn, setSignedIn] = useState(!hasCloud);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [userEmail, setUserEmail] = useState("Vista de demostración");
  const [busy, setBusy] = useState(false);
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);
  const [rowLimit, setRowLimit] = useState(500);
  const [hasMoreLeads, setHasMoreLeads] = useState(false);
  const realtimeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedLight = readLocal<boolean>(STORAGE_KEYS.lightMode, false);
    setLowBandwidthMode(savedLight);
    setRowLimit(savedLight ? 150 : 500);
  }, []);

  const toggleLowBandwidthMode = useCallback(
    (enabled: boolean) => {
      setLowBandwidthMode(enabled);
      setRowLimit(enabled ? 150 : 500);
      try {
        localStorage.setItem(STORAGE_KEYS.lightMode, JSON.stringify(enabled));
      } catch {
        // Ignore storage quota errors
      }
      notify(
        enabled
          ? "Modo ligero activado: menos RAM, sin Realtime automático y paginación compacta."
          : "Modo estándar activado: sincronización Realtime y vista ampliada.",
      );
    },
    [notify],
  );

  const loadCloudData = useCallback(
    async (customLimit?: number) => {
      if (!supabase || !signedIn) return;
      const limit = customLimit ?? rowLimit;

      setBusy(true);
      const [
        { data: leadRows, error: leadError },
        { data: paymentRows, error: paymentError },
        { data: activityRows, error: activityError },
      ] = await Promise.all([
        supabase
          .from("leads")
          .select(LEADS_SELECT)
          .order("created_at", { ascending: false })
          .limit(limit + 1),
        supabase
          .from("payments")
          .select(PAYMENTS_SELECT)
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("lead_activities")
          .select(ACTIVITIES_SELECT)
          .order("created_at", { ascending: false })
          .limit(lowBandwidthMode ? 120 : 300),
      ]);

      if (leadError || paymentError || activityError) {
        notify("No se pudieron cargar los datos. Revisa la configuración de Supabase.");
      }
      if (leadRows) {
        const more = leadRows.length > limit;
        setHasMoreLeads(more);
        const sliced = more ? leadRows.slice(0, limit) : leadRows;
        setLeads(
          sliced.map((row) => ({
            ...row,
            deal_amount: Number(row.deal_amount || 0),
            next_contact_at: row.next_contact_at || "",
          })) as Lead[],
        );
      }
      if (paymentRows) {
        setPayments(
          paymentRows.map((row) => ({
            ...row,
            amount: Number(row.amount || 0),
            due_date: row.due_date || "",
            paid_at: row.paid_at || "",
          })) as Payment[],
        );
      }
      if (activityRows) setActivities(activityRows as LeadActivity[]);

      setLoaded(true);
      setBusy(false);
    },
    [lowBandwidthMode, notify, rowLimit, signedIn],
  );

  const loadMoreLeads = useCallback(() => {
    const nextLimit = rowLimit + 250;
    setRowLimit(nextLimit);
    void loadCloudData(nextLimit);
  }, [loadCloudData, rowLimit]);

  useEffect(() => {
    if (!hasCloud) {
      setLeads(readLocal(STORAGE_KEYS.leads, demoLeads));
      setPayments(readLocal(STORAGE_KEYS.payments, demoPayments));
      setActivities(readLocal(STORAGE_KEYS.activities, []));
      setLoaded(true);
      return;
    }

    let active = true;
    supabase!.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSignedIn(Boolean(data.session));
      setUserEmail(data.session?.user.email ?? "");
      setSessionReady(true);
    });

    const { data: auth } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      setUserEmail(session?.user.email ?? "");
      setSessionReady(true);
    });

    return () => {
      active = false;
      auth.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (hasCloud && signedIn) void loadCloudData();
  }, [loadCloudData, signedIn]);

  useEffect(() => {
    if (!hasCloud || !signedIn || !supabase || lowBandwidthMode) return;

    const scheduleReload = () => {
      if (realtimeTimerRef.current) {
        window.clearTimeout(realtimeTimerRef.current);
      }
      realtimeTimerRef.current = window.setTimeout(() => {
        void loadCloudData();
      }, 1500);
    };

    const channel = supabase
      .channel("crm-live-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        scheduleReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        scheduleReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lead_activities" },
        scheduleReload,
      )
      .subscribe();

    return () => {
      if (realtimeTimerRef.current) {
        window.clearTimeout(realtimeTimerRef.current);
      }
      void supabase?.removeChannel(channel);
    };
  }, [loadCloudData, lowBandwidthMode, signedIn]);

  useEffect(() => {
    if (!loaded || hasCloud) return;
    try {
      localStorage.setItem(STORAGE_KEYS.leads, JSON.stringify(leads));
      localStorage.setItem(STORAGE_KEYS.payments, JSON.stringify(payments));
      localStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(activities));
    } catch {
      notify("Espacio local lleno. Usa Optimización de Espacio para liberar memoria.");
    }
  }, [activities, leads, loaded, notify, payments]);

  const login = async (email: string, password: string) => {
    if (!supabase) return;
    setLoginBusy(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setLoginError("No se pudo iniciar sesión. Revisa tu correo y contraseña.");
    setLoginBusy(false);
  };

  const logout = async () => {
    await supabase?.auth.signOut();
    setSignedIn(false);
  };

  const saveLead = async (draft: Lead, previous?: Lead): Promise<Lead | null> => {
    const record = {
      ...draft,
      phone: draft.phone.trim(),
      source_key: draft.source_key || sourceKeyFor(draft.phone, draft.product),
      updated_at: new Date().toISOString(),
    };
    if (!record.full_name.trim() || !record.phone) {
      notify("Nombre y teléfono son obligatorios.");
      return null;
    }

    const existing =
      previous ??
      leads.find((lead) => sourceKeyFor(lead.phone, lead.product) === record.source_key);
    let saved: Lead;

    if (supabase) {
      const payload = {
        ...record,
        next_contact_at: record.next_contact_at || null,
      };
      delete (payload as Partial<Lead>).id;
      const query = existing
        ? supabase
            .from("leads")
            .update(payload)
            .eq("id", existing.id)
            .select(LEADS_SELECT)
            .single()
        : supabase.from("leads").insert(payload).select(LEADS_SELECT).single();
      const { data, error } = await query;

      if (error) {
        notify("No se pudo guardar. Revisa la conexión y los campos.");
        return null;
      }
      saved = {
        ...(data as Lead),
        deal_amount: Number((data as Lead).deal_amount || 0),
        next_contact_at: (data as Lead).next_contact_at || "",
      };

      if (existing && existing.stage !== saved.stage) {
        await supabase.from("lead_events").insert({
          lead_id: saved.id,
          from_stage: existing.stage,
          to_stage: saved.stage,
        });
      }
      setLeads((current) =>
        existing
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current],
      );
    } else {
      saved = {
        ...record,
        id: record.id || existing?.id || crypto.randomUUID(),
      };
      setLeads((current) =>
        existing
          ? current.map((lead) => (lead.id === existing.id ? saved : lead))
          : [saved, ...current],
      );
    }

    notify(existing ? "Ficha actualizada." : "Lead agregado al embudo.");
    return saved;
  };

  const moveLead = async (lead: Lead, stage: Stage): Promise<Lead> => {
    const updated = { ...lead, stage, updated_at: new Date().toISOString() };
    if (lead.stage === stage) return lead;

    setLeads((current) => current.map((item) => (item.id === lead.id ? updated : item)));
    if (supabase) {
      const { error } = await supabase
        .from("leads")
        .update({ stage, updated_at: updated.updated_at })
        .eq("id", lead.id);
      if (error) {
        notify("No se pudo mover el lead.");
        await loadCloudData();
        return lead;
      }
      await supabase.from("lead_events").insert({
        lead_id: lead.id,
        from_stage: lead.stage,
        to_stage: stage,
      });
    }
    return updated;
  };

  const addPayment = async (payment: NewPayment) => {
    if (supabase) {
      const { data, error } = await supabase
        .from("payments")
        .insert({
          ...payment,
          due_date: payment.due_date || null,
          paid_at: payment.paid_at || null,
        })
        .select(PAYMENTS_SELECT)
        .single();
      if (error) {
        notify("No se pudo guardar el pago.");
        return;
      }
      if (data) {
        const inserted: Payment = {
          ...(data as Payment),
          amount: Number((data as Payment).amount || 0),
          due_date: (data as Payment).due_date || "",
          paid_at: (data as Payment).paid_at || "",
        };
        setPayments((current) => [inserted, ...current]);
      }
    } else {
      const record: Payment = {
        ...payment,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      setPayments((current) => [record, ...current]);
    }
    notify("Pago registrado.");
  };

  const logLeadActivity = async (activity: NewActivity) => {
    if (supabase) {
      const { data, error } = await supabase
        .from("lead_activities")
        .insert(activity)
        .select(ACTIVITIES_SELECT)
        .single();
      if (error) {
        notify("No se pudo guardar la actividad del contacto.");
        return false;
      }
      if (data) {
        setActivities((current) => [data as LeadActivity, ...current]);
      }
      return true;
    }
    setActivities((current) => [
      {
        ...activity,
        id: crypto.randomUUID(),
        created_by: null,
        created_at: new Date().toISOString(),
      },
      ...current,
    ]);
    return true;
  };

  const storageStats: StorageStats = useMemo(() => {
    let leadsBytes = 0;
    let paymentsBytes = 0;
    let activitiesBytes = 0;
    if (typeof window !== "undefined") {
      leadsBytes = byteSizeOf(localStorage.getItem(STORAGE_KEYS.leads));
      paymentsBytes = byteSizeOf(localStorage.getItem(STORAGE_KEYS.payments));
      activitiesBytes = byteSizeOf(localStorage.getItem(STORAGE_KEYS.activities));
    }
    const cutoff = Date.now() - 90 * 86400000;
    const oldLostCount = leads.filter(
      (lead) => lead.stage === "perdido" && new Date(lead.updated_at).getTime() < cutoff,
    ).length;
    const voidPaymentsCount = payments.filter((p) => p.status === "anulado").length;

    const seenPhones = new Set<string>();
    let duplicatePhoneCount = 0;
    for (const lead of leads) {
      const normalized = numberPhone(lead.phone);
      if (!normalized) continue;
      if (seenPhones.has(normalized)) duplicatePhoneCount += 1;
      else seenPhones.add(normalized);
    }

    return {
      localBytesTotal: leadsBytes + paymentsBytes + activitiesBytes,
      leadsBytes,
      paymentsBytes,
      activitiesBytes,
      leadsCount: leads.length,
      paymentsCount: payments.length,
      activitiesCount: activities.length,
      oldLostCount,
      voidPaymentsCount,
      duplicatePhoneCount,
    };
  }, [activities.length, leads, payments]);

  const purgeArchivedRecords = useCallback(
    async (daysOld = 90) => {
      const cutoffIso = new Date(Date.now() - daysOld * 86400000).toISOString();
      const targetLeadIds = leads
        .filter((l) => l.stage === "perdido" && l.updated_at < cutoffIso)
        .map((l) => l.id);
      const targetPaymentIds = payments
        .filter((p) => p.status === "anulado")
        .map((p) => p.id);

      if (targetLeadIds.length === 0 && targetPaymentIds.length === 0) {
        notify("No hay registros antiguos o anulados para limpiar.");
        return 0;
      }

      if (supabase) {
        if (targetLeadIds.length > 0) {
          const { error } = await supabase.from("leads").delete().in("id", targetLeadIds);
          if (error) {
            notify("Error al purgar leads antiguos en la nube.");
            return 0;
          }
        }
        if (targetPaymentIds.length > 0) {
          const { error } = await supabase
            .from("payments")
            .delete()
            .in("id", targetPaymentIds);
          if (error) {
            notify("Error al purgar pagos anulados en la nube.");
            return 0;
          }
        }
      }

      const removedLeadSet = new Set(targetLeadIds);
      const removedPaymentSet = new Set(targetPaymentIds);
      setLeads((prev) => prev.filter((l) => !removedLeadSet.has(l.id)));
      setPayments((prev) =>
        prev.filter((p) => !removedPaymentSet.has(p.id) && !removedLeadSet.has(p.lead_id)),
      );
      setActivities((prev) => prev.filter((a) => !removedLeadSet.has(a.lead_id)));

      const total = targetLeadIds.length + targetPaymentIds.length;
      notify(`Espacio optimizado: ${total} registros archivados eliminados.`);
      return total;
    },
    [leads, notify, payments],
  );

  const compactLocalCache = useCallback(() => {
    if (typeof window === "undefined") return;
    // Trim activities in memory/local cache to last 200 entries and clean old notes whitespace
    setActivities((prev) => prev.slice(0, 200));
    setLeads((prev) =>
      prev.map((l) => ({
        ...l,
        notes: l.notes.trim(),
        email: l.email.trim(),
      })),
    );
    if (hasCloud) {
      localStorage.removeItem(STORAGE_KEYS.leads);
      localStorage.removeItem(STORAGE_KEYS.payments);
      localStorage.removeItem(STORAGE_KEYS.activities);
    }
    notify("Caché local compactada y memoria liberada.");
  }, [notify]);

  const exportBackupJson = useCallback(() => {
    const payload = {
      exported_at: new Date().toISOString(),
      leads,
      payments,
      activities,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `campuslands-crm-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    notify("Respaldo JSON descargado.");
  }, [activities, leads, notify, payments]);

  const resetDemoData = useCallback(() => {
    if (hasCloud) {
      notify("En modo nube no se reinician datos de demostración.");
      return;
    }
    setLeads(demoLeads);
    setPayments(demoPayments);
    setActivities([]);
    notify("Datos de demostración restaurados.");
  }, [notify]);

  return {
    leads,
    payments,
    activities,
    loaded,
    sessionReady,
    signedIn,
    loginBusy,
    loginError,
    userEmail,
    busy,
    lowBandwidthMode,
    hasMoreLeads,
    storageStats,
    toggleLowBandwidthMode,
    loadCloudData,
    loadMoreLeads,
    login,
    logout,
    saveLead,
    moveLead,
    addPayment,
    logLeadActivity,
    purgeArchivedRecords,
    compactLocalCache,
    exportBackupJson,
    resetDemoData,
  };
}
