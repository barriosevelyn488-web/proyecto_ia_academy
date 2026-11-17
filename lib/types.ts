export type Stage =
  "nuevo" | "interesado" | "contactado" | "visita" | "inscrito" | "perdido";
export type Interest = "alto" | "medio" | "bajo" | "sin_clasificar";
export type PaymentMethod =
  "Transferencia" | "Tarjeta" | "Efectivo" | "Financiamiento" | "Otro";

export type Lead = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  origin: string;
  product: string;
  stage: Stage;
  interest: Interest;
  deal_amount: number;
  payment_method: PaymentMethod | "";
  next_contact_at: string;
  notes: string;
  source_key?: string;
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

export const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: "nuevo", label: "Nuevo lead", color: "#4d6cf5" },
  { id: "interesado", label: "Interesado", color: "#9a6cf5" },
  { id: "contactado", label: "En seguimiento", color: "#e6a63e" },
  { id: "visita", label: "Visita", color: "#25a99a" },
  { id: "inscrito", label: "Inscrito", color: "#22a06b" },
  { id: "perdido", label: "No interesado", color: "#9aa3b2" },
];

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
export const stageLabel = (id: Stage) =>
  STAGES.find((stage) => stage.id === id)?.label ?? id;
