import type { Lead } from "@/lib/types";

export const DEFAULT_WHATSAPP_TEMPLATE =
  "Hola {{nombre}}, te contacto de Campuslands Guatemala para dar seguimiento a tu interés en {{producto}}.";

export function interpolateWhatsAppTemplate(template: string, lead: Lead) {
  const variables: Record<string, string> = {
    nombre: lead.full_name.trim().split(/\s+/)[0] || "",
    nombre_completo: lead.full_name || "",
    producto: lead.product || "nuestros programas",
    origen: lead.origin || "nuestro equipo",
    etapa: lead.stage,
  };
  return template.replace(
    /{{\s*([a-z_]+)\s*}}/gi,
    (_, key: string) => variables[key.toLowerCase()] ?? "",
  );
}
