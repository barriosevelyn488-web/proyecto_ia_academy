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
    id: "code-up",
    name: "Code-Up",
    suggestedPrice: 2500,
    duration: "10 meses (intensivo)",
    modality: "Programa integral",
    audience: "Jóvenes y adultos que buscan empleo tech o reconversión profesional completa",
    valueProp:
      "Curso intensivo de 10 meses que combina Programación + Inglés + Habilidades Adaptativas.",
  },
  {
    id: "ia-01",
    name: "Taller Práctico: IA de cero a Agentes",
    suggestedPrice: 2800,
    duration: "Taller práctico (IA.01)",
    modality: "En vivo + Plataforma de talleres",
    audience: "Profesionales y emprendedores que quieren crear agentes y subagentes reales",
    valueProp:
      "Aprende IA desde cero hasta crear agentes y subagentes con ChatGPT, Claude y Gemini, con acceso a plataforma (videos y diploma).",
  },
  {
    id: "tmcia",
    name: "Taller Marketing con IA",
    suggestedPrice: 2200,
    duration: "Taller práctico (TMCIA)",
    modality: "En vivo + Plataforma de talleres",
    audience: "Equipos comerciales, creadores y dueños de negocio",
    valueProp:
      "Construye un sistema de marketing que investiga, crea, distribuye y aprende con mayor velocidad (incluye herramientas, videos y diploma en plataforma).",
  },
  {
    id: "fin-03",
    name: "Finanzas IA",
    suggestedPrice: 2500,
    duration: "Taller práctico (FIN.03)",
    modality: "En vivo + Plataforma de talleres",
    audience: "Analistas, administradores y gerencias financieras",
    valueProp:
      "Lleva finanzas de la operación transaccional a una función estratégica que recomienda y decide (acceso a plataforma y diploma).",
  },
  {
    id: "corporativo",
    name: "Capacitación Corporativa",
    suggestedPrice: 6500,
    duration: "A medida (equipo)",
    modality: "In-company / virtual + Plataforma",
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
      "¿Has usado antes herramientas de IA o programación, o partes desde cero?",
      "¿Qué horario te funciona mejor para sesiones en vivo?",
      `La inversión de ${program} es de ${amount}. ¿Prefieres pago único o revisamos plan en cuotas?`,
    ],
    closing: `«Perfecto, ${name}. Entonces quedamos en [acuerdo / envío de cotización / sesión] para el [día]. Te lo confirmo por WhatsApp ahora mismo.»`,
  };
}

export type StageSalesGuide = {
  title: string;
  goal: string;
  nextStep: string;
  getScript: (lead: Lead) => string;
};

export function getStageSalesGuide(lead: Lead): StageSalesGuide {
  const firstName = lead.full_name.trim().split(/\s+/)[0] || "hola";
  const isCodeUp = /code[-\s]?up/i.test(lead.product);
  const program = lead.product.trim() || "nuestros programas";

  const programPitch = isCodeUp
    ? "Code-Up es nuestro intensivo de 10 meses donde combinas programación, inglés y habilidades adaptativas para dar un salto real en tu carrera"
    : `${program} incluye sesiones prácticas y acceso a nuestra plataforma de talleres con videos, herramientas listas y diploma`;

  switch (lead.stage) {
    case "nuevo":
      return {
        title: "Fase 1 · Primer contacto rápido",
        goal: "Responder en menos de 15 min, calificar interés y confirmar si busca Code-Up (10 meses) o taller de IA.",
        nextStep: "Enviar WhatsApp inicial y agendar fecha de próximo contacto.",
        getScript: () =>
          `Hola ${firstName}, gusto en saludarte de Campuslands. Vi tu interés en ${program}. ${programPitch}. ¿Lo buscas para tu trabajo actual o para dar un cambio profesional?`,
      };
    case "interesado":
      return {
        title: "Fase 2 · Presentar valor y opciones",
        goal: "Mostrar qué incluye el programa (plataforma/diploma o ruta de 10 meses) y proponer horario o visita.",
        nextStep: "Enviar cotización o invitar a sesión informativa / visita.",
        getScript: () =>
          `Hola ${firstName}, te cuento rápido: ${programPitch}. ¿Te gustaría que te comparta el temario y opciones de pago/cuotas, o agendamos una llamada de 10 min?`,
      };
    case "contactado":
      return {
        title: "Fase 3 · Seguimiento activo (destrabar dudas)",
        goal: "Detectar qué le frena (precio, horario, nivel) y dar una respuesta honesta con siguiente paso.",
        nextStep: "Preguntar qué necesita validar y fijar fecha límite suave.",
        getScript: () =>
          `Hola ${firstName}, paso a saludarte por tu consulta de ${program}. ¿Pudiste revisar los detalles o quedó alguna duda sobre horarios, plataforma o forma de pago?`,
      };
    case "visita":
      return {
        title: "Fase 4 · Cierre tras visita / demo",
        goal: "Confirmar cupo, definir método de pago y registrar el primer abono o reserva.",
        nextStep: "Enviar datos de pago o cotización formal y pasar a Inscrito al confirmar.",
        getScript: () =>
          `Hola ${firstName}, qué gusto haber conversado contigo sobre ${program}. ¿Confirmamos tu cupo para iniciar con el grupo? Si gustas te paso los datos para transferencia o tarjeta.`,
      };
    case "inscrito":
      return {
        title: "Fase 5 · Bienvenida y acceso a plataforma",
        goal: "Asegurar acceso a plataforma de estudiantes/talleres y confirmar pagos pendientes.",
        nextStep: "Verificar pago completo o programar recordatorio de cuota.",
        getScript: () =>
          `¡Bienvenido/a a Campuslands, ${firstName}! Tu lugar en ${program} está confirmado. Cualquier duda con tu acceso a la plataforma de talleres y materiales me escribes por acá.`,
      };
    case "perdido":
      return {
        title: "Recuperación de cliente perdido",
        goal: "Retomar contacto sin presión cuando abre nueva cohorte o hay un taller más corto.",
        nextStep: "Ofrecer alternativa (ej. taller corto en plataforma si no pudo Code-Up de 10 meses).",
        getScript: () =>
          `Hola ${firstName}, te saluda el equipo de Campuslands. Estamos abriendo nuevo grupo y me acordé de ti. ¿Te gustaría que te avise fechas o prefieres ver un taller corto en nuestra plataforma?`,
      };
  }
}
