/**
 * Normalización única de teléfonos en formato E.164 (Guatemala +502 por defecto).
 * Compartida por UI, adaptador de Google Sheets y webhook del Bot.
 */
export function normalizePhoneE164(value: unknown): string {
  const raw = String(value ?? "").trim();
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 8) digits = `502${digits}`;
  if (digits.length === 9 && digits.startsWith("0")) digits = `502${digits.slice(1)}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : "";
}

/**
 * Devuelve solo los dígitos del teléfono normalizado para enlaces wa.me/<digits>.
 */
export function toWhatsAppDigits(value: unknown): string {
  return normalizePhoneE164(value).replace(/\D/g, "");
}

/**
 * Normaliza un texto para comparaciones y generación de claves idempotentes.
 */
export function normalizeSlug(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Clave idempotente de un prospecto por teléfono y producto.
 */
export function buildSourceKey(phone: unknown, product: unknown): string {
  const digits = toWhatsAppDigits(phone) || String(phone ?? "").replace(/\D/g, "");
  const prod = normalizeSlug(product) || "general";
  return `${digits}:${prod}`;
}
