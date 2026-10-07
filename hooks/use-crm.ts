import { useCallback, useEffect, useState } from "react";
import { demoLeads, demoPayments } from "@/lib/demo-data";
import { hasCloud, supabase } from "@/lib/supabase/browser";
import { Lead, LeadActivity, Payment, Stage } from "@/lib/types";
import { sourceKeyFor } from "@/lib/formatters";

type Notify = (message: string) => void;
type NewPayment = Omit<Payment, "id" | "created_at">;
type NewActivity = Omit<LeadActivity, "id" | "created_at" | "created_by">;

function readLocal<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

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

  const loadCloudData = useCallback(async () => {
    if (!supabase || !signedIn) return;

    setBusy(true);
    const [
      { data: leadRows, error: leadError },
      { data: paymentRows, error: paymentError },
      { data: activityRows, error: activityError },
    ] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase
        .from("lead_activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    if (leadError || paymentError || activityError) {
      notify("No se pudieron cargar los datos. Revisa la configuración de Supabase.");
    }
    if (leadRows) {
      setLeads(
        leadRows.map((row) => ({
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
  }, [notify, signedIn]);

  useEffect(() => {
    if (!hasCloud) {
      setLeads(readLocal("campuslands-crm-leads", demoLeads));
      setPayments(readLocal("campuslands-crm-payments", demoPayments));
      setActivities(readLocal("campuslands-crm-activities", []));
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
    if (!hasCloud || !signedIn || !supabase) return;

    const channel = supabase
      .channel("crm-live-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => void loadCloudData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => void loadCloudData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lead_activities" },
        () => void loadCloudData(),
      )
      .subscribe();

    return () => void supabase?.removeChannel(channel);
  }, [loadCloudData, signedIn]);

  useEffect(() => {
    if (!loaded || hasCloud) return;
    localStorage.setItem("campuslands-crm-leads", JSON.stringify(leads));
    localStorage.setItem("campuslands-crm-payments", JSON.stringify(payments));
    localStorage.setItem("campuslands-crm-activities", JSON.stringify(activities));
  }, [activities, leads, loaded, payments]);

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
        ? supabase.from("leads").update(payload).eq("id", existing.id).select().single()
        : supabase.from("leads").insert(payload).select().single();
      const { data, error } = await query;

      if (error) {
        notify("No se pudo guardar. Revisa la conexión y los campos.");
        return null;
      }
      saved = data as Lead;

      if (existing && existing.stage !== saved.stage) {
        await supabase.from("lead_events").insert({
          lead_id: saved.id,
          from_stage: existing.stage,
          to_stage: saved.stage,
        });
      }
      await loadCloudData();
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
      const { error } = await supabase.from("payments").insert({
        ...payment,
        due_date: payment.due_date || null,
        paid_at: payment.paid_at || null,
      });
      if (error) {
        notify("No se pudo guardar el pago.");
        return;
      }
      await loadCloudData();
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
      const { error } = await supabase.from("lead_activities").insert(activity);
      if (error) {
        notify("No se pudo guardar la actividad del contacto.");
        return false;
      }
      await loadCloudData();
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
    loadCloudData,
    login,
    logout,
    saveLead,
    moveLead,
    addPayment,
    logLeadActivity,
  };
}
