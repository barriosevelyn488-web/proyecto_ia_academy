export type Stage =
  | "nuevo"
  | "en_conversacion"
  | "interesado"
  | "ya_se_llamo"
  | "confirmado"
  | "inscrito_forms"
  | "no_interesado"
  // Retrocompatibilidad con datos históricos
  | "contactado"
  | "visita"
  | "inscrito"
  | "perdido";

export type Priority =
  | "URGENTE"
  | "SEGUIMIENTO"
  | "INDESCISO"
  | "OCUPADO"
  | "NO CONTESTA"
  | "colgo"
  | "No califica";

export type Agreement = "CONCRETADO" | "EN PROCESO" | "INCONCRETO" | "";

export type PaymentStatus =
  | "Pagado"
  | "pendiente de pago"
  | "No pago, no finalizo proceso"
  | "Cupo Gratis"
  | "";

export type Interest = "alto" | "medio" | "bajo" | "sin_clasificar";
export type PaymentMethod =
  | "Transferencia"
  | "Tarjeta"
  | "Efectivo"
  | "Financiamiento"
  | "Otro";

export type Lead = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  origin: string;
  product: string;
  stage: Stage;
  interest: Interest;
  priority?: Priority | string;
  agreement?: Agreement | string;
  payment_status?: PaymentStatus | string;
  deal_amount: number;
  payment_method: PaymentMethod | "";
  next_contact_at: string;
  notes: string;
  source_key?: string;
  assigned_to?: string;
  loss_reason?: string;
  nit?: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  lead_id: string;
  amount: number;
  method: PaymentMethod;
  status: "pendiente" | "pagado" | "anulado";
  due_date: string;
  paid_at: string;
  reference: string;
  created_at: string;
};

export type LeadActivity = {
  id: string;
  lead_id: string;
  activity_type: "whatsapp_opened" | "note" | "task";
  description: string;
  metadata: Record<string, string>;
  created_by: string | null;
  created_at: string;
};

export const STAGES: { id: Stage; label: string; color: string; bg: string }[] = [
  { id: "nuevo", label: "Nuevo lead", color: "#3b82f6", bg: "#eff6ff" },
  { id: "en_conversacion", label: "En conversacion bot/asesor", color: "#d97706", bg: "#fef3c7" },
  { id: "interesado", label: "Interesado", color: "#059669", bg: "#d1fae5" },
  { id: "ya_se_llamo", label: "Ya se llamó", color: "#16a34a", bg: "#dcfce7" },
  { id: "confirmado", label: "confirmado", color: "#0d9488", bg: "#ccfbf1" },
  { id: "inscrito_forms", label: "Inscrito en forms", color: "#7c3aed", bg: "#ede9fe" },
  { id: "no_interesado", label: "no interesado", color: "#4b5563", bg: "#f3f4f6" },
];

export const PRIORITIES: { id: Priority; label: string; color: string; bg: string }[] = [
  { id: "URGENTE", label: "URGENTE", color: "#dc2626", bg: "#fee2e2" },
  { id: "SEGUIMIENTO", label: "SEGUIMIENTO", color: "#16a34a", bg: "#dcfce7" },
  { id: "INDESCISO", label: "INDESCISO", color: "#9333ea", bg: "#f3e8ff" },
  { id: "OCUPADO", label: "OCUPADO", color: "#2563eb", bg: "#dbeafe" },
  { id: "NO CONTESTA", label: "NO CONTESTA", color: "#ef4444", bg: "#fee2e2" },
  { id: "colgo", label: "colgo", color: "#6b7280", bg: "#f3f4f6" },
  { id: "No califica", label: "No califica", color: "#374151", bg: "#e5e7eb" },
];

export const PRODUCTS = [
  "CODE UP",
  "MARKETING IA",
  "AGENTES IA",
  "FINANZAS IA",
  "ANALISIS IA",
] as const;

export const ORIGINS = [
  "BOT",
  "Facebook",
  "Instagram",
  "KHC",
  "OTRO",
] as const;

export const AGREEMENTS = [
  "CONCRETADO",
  "EN PROCESO",
  "INCONCRETO",
] as const;

export const PAYMENT_STATUSES = [
  "Pagado",
  "pendiente de pago",
  "No pago, no finalizo proceso",
  "Cupo Gratis",
] as const;

export const METHODS: PaymentMethod[] = [
  "Transferencia",
  "Tarjeta",
  "Efectivo",
  "Financiamiento",
  "Otro",
];

export const money = (value: number) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const stageLabel = (id: Stage): string => {
  if (id === "contactado") return "En conversacion bot/asesor";
  if (id === "visita") return "Ya se llamó";
  if (id === "inscrito") return "Inscrito en forms";
  if (id === "perdido") return "no interesado";
  const found = STAGES.find((stage) => stage.id === id);
  return found?.label ?? id;
};
