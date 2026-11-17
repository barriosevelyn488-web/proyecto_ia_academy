import type { Lead, Stage } from "./types";
import { money } from "./types";

export type ProgramCatalogItem = {
  id: string;
  name: string;
  suggestedPrice: number;
  duration: string;
  modality: string;
  audience: string;
  valueProp: string;
};

export const CAMPUSLANDS_PROGRAMS: ProgramCatalogItem[] = [
  {
    id: "taller-ia",
    name: "Taller de IA",
    suggestedPrice: 2500,
    duration: "4 semanas (práctico)",
    modality: "En vivo / híbrido",
    audience: "Profesionales, emprendedores y equipos que quieren productividad inmediata",
    valueProp: "Casos reales aplicados desde la primera sesión con plantillas listas para trabajar.",
  },
  {
    id: "de-0-a-agentes",
    name: "De 0 a Agentes",
    suggestedPrice: 2800,
    duration: "6 semanas",
    modality: "En vivo + proyecto guiado",
    audience: "Quienes buscan automatizar procesos y crear agentes de IA sin complicarse",
    valueProp: "Construyes tu propio agente funcional conectado a herramientas reales paso a paso.",
  },
  {
    id: "marketing-ia",
    name: "Marketing IA",
    suggestedPrice: 2200,
    duration: "4 semanas",
    modality: "En vivo / práctico",
    audience: "Dueños de negocio, creadores y áreas comerciales",
    valueProp: "Sistema completo de contenido, anuncios, guiones y embudos con voz de marca.",
  },
  {
    id: "code-up",
    name: "Code-Up",
    suggestedPrice: 2500,
    duration: "6 semanas",
    modality: "Mentoría práctica",
    audience: "Estudiantes y profesionales que quieren acelerar desarrollo de software",
    valueProp: "Acompañamiento técnico directo y proyectos reales para portafolio.",
  },
  {
    id: "analitica-datos",
    name: "Analítica de datos",
    suggestedPrice: 3000,
    duration: "6 semanas",
    modality: "En vivo + casos",
    audience: "Analistas, administradores y gerencias que deciden con datos",
    valueProp: "Limpieza, modelado y tableros accionables listos para reportar a dirección.",
  },
  {
    id: "corporativo",
    name: "Capacitación Corporativa",
    suggestedPrice: 6500,
    duration: "A medida (equipo)",
    modality: "In-company / virtual",
    audience: "Empresas y grupos de 3+ personas",
    valueProp: "Temario adaptado a los procesos del equipo con tarifa grupal preferencial.",
  },
];

export type QuickReplyTemplate = {
  id: string;
  shortcut: string;
  stage: Stage | "cobro";
  title: string;
  body: string;
};

export const SALES_QUICK_REPLIES: QuickReplyTemplate[] = [
  {
    id: "primer-contacto",
    shortcut: "/hola",
    stage: "nuevo",
    title: "Primer contacto (humano y directo)",
    body:
      "Hola {{nombre}}, gusto en saludarte. Soy del equipo de Campuslands Guatemala. Vi tu consulta sobre {{producto}} y quería saber si lo buscas para aplicarlo en tu trabajo actual o en un proyecto propio.",
  },
  {
    id: "seguimiento-interes",
    shortcut: "/seguimiento",
    stage: "interesado",
    title: "Seguimiento con valor",
    body:
      "Hola {{nombre}}, te comparto que ya tenemos abiertas las fechas del próximo grupo de {{producto}} ({{precio}}). ¿Prefieres horario entre semana por la noche o fin de semana para ver cuál te queda mejor?",
  },
  {
    id: "confirmar-visita",
    shortcut: "/visita",
    stage: "visita",
    title: "Confirmar visita / sesión demo",
    body:
      "Hola {{nombre}}, confirmando nuestra sesión para revisar {{producto}}. Te toma unos 20 minutos y vemos ejemplos reales de lo que vas a construir. ¿Te queda bien hoy o prefieres mañana?",
  },
  {
    id: "reactivacion",
    shortcut: "/reactivar",
    stage: "contactado",
    title: "Reactivar sin presionar",
    body:
      "Hola {{nombre}}, paso a saludarte sin compromiso. ¿Pudiste revisar tu disponibilidad para {{producto}}? Si en este momento se te complica el horario, cuéntame y te aviso cuando abra la siguiente cohorte.",
  },
  {
    id: "cobro-amable",
    shortcut: "/pago",
    stage: "cobro",
    title: "Recordatorio de pago / reserva",
    body:
      "Hola {{nombre}}, te escribo para confirmar tu cupo en {{producto}}. Puedes realizar tu transferencia o pago en cuotas como acordamos. Cuando tengas el comprobante me lo envías por acá para dejarte inscrito de una vez.",
  },
  {
    id: "bienvenida",
    shortcut: "/bienvenida",
    stage: "inscrito",
    title: "Bienvenida al programa",
    body:
      "¡Bienvenido/a a Campuslands, {{nombre}}! Tu inscripción en {{producto}} quedó confirmada. En breve te compartimos el acceso y la guía previa para que aproveches el programa desde el día uno.",
  },
  {
    id: "cierre-cortes",
    shortcut: "/cierre",
    stage: "perdido",
    title: "Cierre cortés",
    body:
      "Gracias por avisarme, {{nombre}}. Entiendo perfectamente. Dejo tu contacto anotado por si más adelante retomas {{producto}}. ¡Mucho éxito en tus proyectos!",
  },
];

export type ObjectionPlaybookItem = {
  id: string;
  objection: string;
  type: "Precio" | "Tiempo" | "Confianza" | "Competencia" | "Autoridad";
  behindIt: string;
  unlockQuestion: string;
  callResponse: string;
  whatsappResponse: string;
  avoidSaying: string;
};

export const CAMPUSLANDS_OBJECTIONS: ObjectionPlaybookItem[] = [
  {
    id: "caro",
    objection: "«Está caro» / «Se sale de mi presupuesto»",
    type: "Precio",
    behindIt: "No ve aún el retorno práctico o necesita dividir el pago.",
    unlockQuestion: "¿Con qué opción lo estás comparando o qué monto mensual sí te resultaría cómodo?",
    callResponse:
      "Te entiendo. La diferencia aquí es que no ves teoría grabada sino que sales con un proyecto funcionando y acompañamiento en vivo. Si el tema es el desembolso de un solo pago, podemos revisar opción de cuotas o tarifa grupal.",
    whatsappResponse:
      "Entiendo, {{nombre}}. Para ver si te funciona mejor: ¿te complica el monto total de contado o prefieres que veamos una opción en cuotas para {{producto}}?",
    avoidSaying: "«Es el mejor precio del mercado» o inventar descuentos falsos.",
  },
  {
    id: "pensar",
    objection: "«Lo voy a pensar»",
    type: "Confianza",
    behindIt: "Hay una duda no dicha sobre el temario, nivel requerido o retorno.",
    unlockQuestion: "¿Qué parte específica te gustaría revisar con más calma: el temario, el horario o la inversión?",
    callResponse:
      "Claro, es una decisión importante. Para no dejarte con dudas, ¿qué punto específico quieres validar antes de decidir? Así te envío justo esa información.",
    whatsappResponse:
      "Con gusto, {{nombre}}. ¿Qué parte te gustaría revisar con más calma de {{producto}} (temario, horario o forma de pago)? Así te mando justo ese dato.",
    avoidSaying: "Presionar con «último cupo hoy» si no es real.",
  },
  {
    id: "tiempo",
    objection: "«No tengo tiempo / no me cuadra el horario»",
    type: "Tiempo",
    behindIt: "Teme inscribirse y quedarse atrás por su carga laboral.",
    unlockQuestion: "¿Qué días u horarios sí tienes libres a la semana para dedicarle 2 o 3 horas?",
    callResponse:
      "Es súper válido. Las sesiones quedan grabadas para repaso y trabajamos sobre casos de tu propio trabajo, así que el tiempo que inviertes te ahorra horas desde la semana uno.",
    whatsappResponse:
      "Te entiendo, {{nombre}}. ¿Qué horario te queda mejor entre semana o sábado? Además las sesiones quedan grabadas para que no pierdas el hilo si un día te atrasas.",
    avoidSaying: "Minimizar su falta de tiempo.",
  },
  {
    id: "gratis",
    objection: "«Ya hay cursos gratis en YouTube»",
    type: "Competencia",
    behindIt: "No percibe la diferencia entre ver videos sueltos y tener mentoría guiada.",
    unlockQuestion: "¿Has intentado implementarlo con videos y qué fue lo que más te frenó?",
    callResponse:
      "Totalmente, hay mucho contenido gratis. Lo que pagas aquí no es el video, es la ruta ordenada, resolver tus bloqueos en vivo en minutos y salir con algo implementado sin perder semanas probando.",
    whatsappResponse:
      "Es cierto que hay buen material gratis, {{nombre}}. La diferencia en {{producto}} es que vas con guía paso a paso y resuelves tus dudas en vivo sobre tu caso real, sin perder semanas probando solo.",
    avoidSaying: "Hablar mal de otros cursos o creadores.",
  },
  {
    id: "grupo",
    objection: "«Somos varias personas / empresa, ¿hay descuento?»",
    type: "Autoridad",
    behindIt: "Compra grupal B2B; necesita propuesta formal para aprobación.",
    unlockQuestion: "¿Cuántas personas serían y necesitan factura a nombre de la empresa?",
    callResponse:
      "Sí manejamos tarifa corporativa a partir de 3 participantes. Si me confirmas cuántas personas son, te armo hoy mismo la cotización formal con IVA incluido para que la puedas presentar.",
    whatsappResponse:
      "¡Excelente, {{nombre}}! A partir de 3 personas sí aplicamos tarifa grupal. ¿Cuántos participantes serían y a nombre de qué empresa emitimos la cotización?",
    avoidSaying: "Dar porcentajes de descuento sin confirmar número de cupos.",
  },
];

export function formatSalesTemplate(template: string, lead?: Lead | null): string {
  if (!lead) {
    return template
      .replaceAll("{{nombre}}", "[Nombre]")
      .replaceAll("{{producto}}", "[Programa]")
      .replaceAll("{{precio}}", "Q[Precio]");
  }
  const firstName = lead.full_name.trim().split(/\s+/)[0] || "hola";
  const program = lead.product.trim() || "nuestros programas";
  const amount = lead.deal_amount > 0 ? money(lead.deal_amount) : "inversión accesible";
  return template
    .replaceAll("{{nombre}}", firstName)
    .replaceAll("{{producto}}", program)
    .replaceAll("{{precio}}", amount);
}

export type QuoteCalculation = {
  unitPrice: number;
  quantity: number;
  discountPercent: number;
  subtotal: number;
  discountAmount: number;
  totalWithIva: number;
  baseWithoutIva: number;
  ivaAmount: number;
  installments: number;
  installmentAmount: number;
  whatsappText: string;
};

export function buildQuickQuote(params: {
  clientName: string;
  programName: string;
  unitPrice: number;
  quantity: number;
  discountPercent: number;
  installments: number;
  includesIva: boolean;
  paymentMethod: string;
  validDays: number;
}): QuoteCalculation {
  const qty = Math.max(1, Math.floor(params.quantity || 1));
  const unit = Math.max(0, Number(params.unitPrice || 0));
  const discPct = Math.min(50, Math.max(0, Number(params.discountPercent || 0)));
  const inst = Math.max(1, Math.floor(params.installments || 1));

  const subtotal = unit * qty;
  const discountAmount = Math.round((subtotal * discPct) / 100);
  const net = subtotal - discountAmount;

  const totalWithIva = params.includesIva ? net : Math.round(net * 1.12);
  const baseWithoutIva = Math.round((totalWithIva / 1.12) * 100) / 100;
  const ivaAmount = Math.round((totalWithIva - baseWithoutIva) * 100) / 100;
  const installmentAmount = Math.round((totalWithIva / inst) * 100) / 100;

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + Math.max(1, params.validDays || 7));
  const validStr = validUntil.toLocaleDateString("es-GT");

  const firstName = params.clientName.trim().split(/\s+/)[0] || "[Nombre]";
  const lines = [
    `Buen día, ${firstName}. Te comparto la cotización de *${params.programName || "Campuslands"}*:`,
    `• Participantes / cupos: ${qty}`,
    discPct > 0 ? `• Descuento grupal/especial (${discPct}%): -${money(discountAmount)}` : null,
    `• Total (IVA 12% incluido): *${money(totalWithIva)}*`,
    inst > 1 ? `• Opción en ${inst} cuotas de: ${money(installmentAmount)}` : null,
    `• Forma de pago: ${params.paymentMethod || "Transferencia o tarjeta"}`,
    `• Vigencia: hasta el ${validStr}`,
    `¿Te reservo el cupo o tienes alguna duda sobre el temario?`,
  ].filter(Boolean);

  return {
    unitPrice: unit,
    quantity: qty,
    discountPercent: discPct,
    subtotal,
    discountAmount,
    totalWithIva,
    baseWithoutIva,
    ivaAmount,
    installments: inst,
    installmentAmount,
    whatsappText: lines.join("\n"),
  };
}

export function buildCallScript(lead?: Lead | null): {
  objective: string;
  opening: string;
  questions: string[];
  closing: string;
} {
  const name = lead?.full_name.trim().split(/\s+/)[0] || "[Nombre]";
  const program = lead?.product.trim() || "[Programa de IA Academy]";
  const amount = lead?.deal_amount ? money(lead.deal_amount) : "la inversión del programa";
  const stage = lead?.stage || "nuevo";

  const objective =
    stage === "visita"
      ? "Confirmar asistencia a sesión demo y resolver últimas dudas para inscripción."
      : stage === "interesado"
        ? "Validar horario, forma de pago y cerrar fecha de inscripción."
        : "Identificar necesidad real, nivel actual y agendar siguiente paso concreto.";

  return {
    objective,
    opening: `«Hola ${name}, te saluda [Tu nombre] de Campuslands Guatemala. Te llamo brevemente por tu consulta sobre ${program}. ¿Tienes 3 minutos?»`,
    questions: [
      `¿Qué te motivó a buscar ${program} en este momento?`,
      "¿Lo quieres aplicar en tu trabajo actual, en un negocio propio o para cambiar de rol?",
      "¿Has usado antes herramientas de IA o automatización, o partes desde cero?",
      "¿Qué horario te funciona mejor para sesiones en vivo?",
      `La inversión de ${program} es de ${amount}. ¿Prefieres pago único o revisamos plan en cuotas?`,
    ],
    closing: `«Perfecto, ${name}. Entonces quedamos en [acuerdo / envío de cotización / sesión] para el [día]. Te lo confirmo por WhatsApp ahora mismo.»`,
  };
}
