import {
  buildSourceKey,
  normalizePhoneE164,
  toWhatsAppDigits,
} from "@/lib/domain/phone";

export const today = () => new Date().toISOString().slice(0, 10);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CL";

export const phoneE164 = (phone: string) => normalizePhoneE164(phone);

export const numberPhone = (phone: string) => toWhatsAppDigits(phone);

export const sourceKeyFor = (phone: string, product: string) =>
  buildSourceKey(phone, product);

export const isLate = (value: string) => Boolean(value && value < today());

export const formatDate = (value: string) =>
  value
    ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("es-GT", {
        day: "numeric",
        month: "short",
      })
    : "Sin fecha";
