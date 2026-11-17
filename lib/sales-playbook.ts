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
    name: "CODE UP",
    suggestedPrice: 2500,
    duration: "10 meses (intensivo)",
    modality: "Programa integral",
    audience: "Jóvenes y adultos que buscan empleo tech o reconversión profesional completa",
    valueProp:
      "Curso intensivo de 10 meses que combina Programación + Inglés + Habilidades Adaptativas.",
  },
  {
    id: "marketing-ia",
    name: "MARKETING IA",
    suggestedPrice: 2200,
    duration: "Taller práctico (TMCIA)",
    modality: "En vivo + Plataforma de talleres",
    audience: "Equipos comerciales, creadores y dueños de negocio",
    valueProp:
      "Construye un sistema de marketing que investiga, crea, distribuye y aprende con IA (acceso a videos, plantillas y diploma).",
  },
  {
    id: "agentes-ia",
    name: "AGENTES IA",
    suggestedPrice: 2800,
    duration: "Taller práctico (IA.01)",
    modality: "En vivo + Plataforma de talleres",
    audience: "Profesionales y emprendedores que quieren crear agentes y automatizaciones reales",
    valueProp:
      "Aprende IA desde cero hasta crear agentes y subagentes con ChatGPT, Claude y Gemini (acceso a plataforma y diploma).",
  },
  {
    id: "finanzas-ia",
    name: "FINANZAS IA",
    suggestedPrice: 2500,
    duration: "Taller práctico (FIN.03)",
    modality: "En vivo + Plataforma de talleres",
    audience: "Analistas, administradores y gerencias financieras",
    valueProp:
      "Lleva finanzas de la operación transaccional a una función estratégica con IA (acceso a plataforma y diploma).",
  },
  {
    id: "analisis-ia",
    name: "ANALISIS IA",
    suggestedPrice: 2500,
    duration: "Taller práctico (ANL.02)",
    modality: "En vivo + Plataforma de talleres",
    audience: "Profesionales que toman decisiones con datos, dashboards y analítica",
    valueProp:
      "Domina el análisis de datos masivos y tableros inteligentes asistidos por IA.",
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
    id: "en-conversacion",
    shortcut: "/conversacion",
    stage: "en_conversacion",
    title: "En conversación bot/asesor",
    body:
      "Hola {{nombre}}, ¿cómo estás? Te escribo para resolver las dudas que quedaron pendientes sobre {{producto}}. ¿Prefieres que te llame en 5 minutos o te comparto por acá las fechas disponibles?",
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
    id: "ya-se-llamo",
    shortcut: "/llamada",
    stage: "ya_se_llamo",
    title: "Resumen tras llamada telefónica",
    body:
      "Hola {{nombre}}, qué gusto haber conversado contigo sobre {{producto}}. Te comparto por aquí el resumen y los datos para reservar tu cupo en la cohorte.",
  },
  {
    id: "confirmado",
    shortcut: "/confirmado",
    stage: "confirmado",
    title: "Confirmar cupo y datos de facturación",
    body:
      "Hola {{nombre}}, ¡excelente! Tu cupo en {{producto}} ya está apartado. Por favor indícame tu NIT y nombre completo para generar tu factura electrónica.",
  },
  {
    id: "bienvenida",
    shortcut: "/bienvenida",
    stage: "inscrito_forms",
    title: "Bienvenida y acceso a plataforma",
    body:
      "¡Bienvenido/a oficial a Campuslands, {{nombre}}! Tu inscripción en {{producto}} quedó confirmada. Ya puedes ingresar a la plataforma web de talleres y materiales.",
  },
  {
    id: "cierre-cortes",
    shortcut: "/cierre",
    stage: "no_interesado",
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
  avoidSaying?: string;
};

export const OBJECTION_PLAYBOOK: ObjectionPlaybookItem[] = [
  {
    id: "obj-precio",
    objection: "Está muy caro / no tengo ese presupuesto ahora",
    type: "Precio",
    behindIt: "No compara con el costo de no aprender o no vio opciones de cuotas/retorno.",
    unlockQuestion: "¿Es un tema de presupuesto total o te ayudaría pagarlo en 2 o 3 cuotas mensuales sin recargo?",
    callResponse:
      "Te entiendo perfectamente. Más que un gasto, en Campuslands lo diseñamos para que en pocas semanas estés aplicando herramientas reales o capacitándote para un empleo. Además tenemos opción de pagar en cuotas. ¿Te quedaría más cómodo así?",
    whatsappResponse:
      "Te entiendo perfectamente. Para no comprometer tu presupuesto, tenemos opción de cuotas mensuales. Si gustas te calculo la cuota para que veas si te funciona.",
    avoidSaying: "No digas 'es barato comparado con la universidad'; ofrece facilidades y valor concreto.",
  },
  {
    id: "obj-tiempo",
    objection: "No tengo tiempo / los horarios se me complican",
    type: "Tiempo",
    behindIt: "Miedo a no cumplir por trabajo o familia.",
    unlockQuestion: "¿Cuántas horas a la semana tienes libres realmente?",
    callResponse:
      "Entiendo tu horario. Todo el contenido y las sesiones quedan grabadas en nuestra plataforma web para que avances a tu ritmo si un día no te puedes conectar.",
    whatsappResponse:
      "Totalmente comprensible. Justo por eso las clases quedan grabadas en la plataforma con acceso 24/7 y diploma al finalizar. Así avanzas a tu tiempo sin perderte nada.",
    avoidSaying: "No digas 'si quieres puedes hacerte el tiempo'; valida su esfuerzo y destaca la flexibilidad de la plataforma.",
  },
  {
    id: "obj-nivel",
    objection: "No sé de programación / no sé si voy a entender",
    type: "Confianza",
    behindIt: "Inseguridad de quedarse atrás frente a personas más técnicas.",
    unlockQuestion: "¿Has usado antes herramientas como ChatGPT o Excel en tu trabajo?",
    callResponse:
      "Nuestros programas van desde cero paso a paso, con mentores que te guían sin tecnicismos raros. Nadie se queda atrás.",
    whatsappResponse:
      "No te preocupes por el nivel técnico: empezamos 100% desde cero con explicaciones claras y ejemplos prácticos. Cualquier duda la resolvemos paso a paso.",
    avoidSaying: "No minimices su miedo diciendo 'cualquiera puede'; dale seguridad con el acompañamiento personalizado.",
  },
];

export function interpolateWhatsAppTemplate(template: string, lead?: Lead | null): string {
  if (!lead) return template;
  const name = lead.full_name.trim().split(/\s+/)[0] || "Hola";
  const product = lead.product || "nuestros programas";
  const amount = money(lead.deal_amount);

  return template
    .replaceAll("{{nombre}}", name)
    .replaceAll("{{producto}}", product)
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
  const program = lead?.product.trim() || "[Programa]";

  return {
    objective: "Calificar interés, resolver dudas y acordar siguiente paso (visita, cotización o pago).",
    opening: `Hola ${name}, te saluda el equipo de admisiones de Campuslands. Veo tu interés en ${program}. ¿Tienes 3 minutos para revisar si este grupo es el ideal para ti?`,
    questions: [
      `¿Cuál es tu meta principal al tomar ${program}? (¿empleo tech, mejorar tu trabajo actual o emprender?)`,
      `¿Qué horario te queda mejor: entre semana o fin de semana?`,
      `¿Prefieres pago al contado o facilidad en cuotas mensuales?`,
    ],
    closing: `Excelente, ${name}. Te acabo de apartar el cupo provisionalmente. Te mando la cotización formal por WhatsApp con los datos de pago para que la revises hoy mismo.`,
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
    ? "Code-Up es nuestro intensivo de 10 meses donde combinas programación, inglés y habilidades adaptativas para dar un salto profesional"
    : `${program} incluye sesiones prácticas y acceso a nuestra plataforma de talleres con videos, herramientas y diploma`;

  switch (lead.stage) {
    case "nuevo":
      return {
        title: "Fase 1 · Nuevo lead",
        goal: "Responder en menos de 15 min, calificar interés y confirmar si busca Code-Up o taller de IA.",
        nextStep: "Enviar WhatsApp inicial y agendar llamada o fecha de contacto.",
        getScript: () =>
          `Hola ${firstName}, gusto en saludarte de Campuslands. Vi tu consulta sobre ${program}. ${programPitch}. ¿Te gustaría que te comparta el temario o coordinamos una llamada rápida?`,
      };
    case "en_conversacion":
    case "contactado":
      return {
        title: "Fase 2 · En conversación bot/asesor",
        goal: "Resolver dudas principales, presentar fechas y validar qué horario le conviene.",
        nextStep: "Enviar detalles del programa y opciones de financiamiento o cuotas.",
        getScript: () =>
          `Hola ${firstName}, ¿cómo estás? Quería consultar si tuviste oportunidad de revisar la información de ${program}. ¿Prefieres que te llame en 5 minutos para resolver cualquier duda?`,
      };
    case "interesado":
      return {
        title: "Fase 3 · Interesado",
        goal: "Mostrar qué incluye el programa, enviar cotización formal y pactar acuerdo.",
        nextStep: "Enviar cotización en GTQ con facilidades de pago.",
        getScript: () =>
          `Hola ${firstName}, te comparto que ya tenemos abiertas las inscripciones para ${program}. ${programPitch}. ¿Te gustaría asegurar tu cupo esta semana?`,
      };
    case "ya_se_llamo":
    case "visita":
      return {
        title: "Fase 4 · Ya se llamó",
        goal: "Dar seguimiento al acuerdo tras la llamada y enviar enlace o datos para formalizar.",
        nextStep: "Enviar datos de pago / reserva o enlace de inscripción.",
        getScript: () =>
          `Hola ${firstName}, qué gusto haber conversado contigo sobre ${program}. Te comparto por aquí el resumen y los datos para formalizar tu participación.`,
      };
    case "confirmado":
      return {
        title: "Fase 5 · Confirmado",
        goal: "Validar gestión de pago (pagado, cuotas o cupo) y emisión de factura/NIT.",
        nextStep: "Verificar comprobante y solicitar NIT para factura.",
        getScript: () =>
          `Hola ${firstName}, excelente noticia. Tu cupo en ${program} está apartado. Por favor compárteme tu NIT y nombre completo para la emisión de tu comprobante oficial.`,
      };
    case "inscrito_forms":
    case "inscrito":
      return {
        title: "Fase 6 · Inscrito en forms",
        goal: "Bienvenida oficial, confirmación de accesos a la plataforma y entrega de credenciales.",
        nextStep: "Verificar acceso y entrega de bienvenida.",
        getScript: () =>
          `¡Bienvenido/a oficial a Campuslands, ${firstName}! Tu registro en ${program} ha sido completado con éxito. Ya tienes acceso habilitado a la plataforma.`,
      };
    case "no_interesado":
    case "perdido":
    default:
      return {
        title: "Fase 7 · No interesado",
        goal: "Cierre cortés y mantener puerta abierta para futuras cohortes o talleres.",
        nextStep: "Dejar registrado el motivo y agendar seguimiento a 60-90 días si aplica.",
        getScript: () =>
          `Gracias por tu tiempo, ${firstName}. Dejamos tus datos guardados para notificarte si abrimos nuevos horarios de ${program}. ¡Muchos éxitos en tus metas!`,
      };
  }
}


export const CAMPUSLANDS_OBJECTIONS = OBJECTION_PLAYBOOK;
export const formatSalesTemplate = interpolateWhatsAppTemplate;
