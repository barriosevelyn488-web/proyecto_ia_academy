export const today = () => new Date().toISOString().slice(0, 10);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CL";

export const phoneE164 = (phone: string, defaultCountryCode = "502") => {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 8) digits = `${defaultCountryCode}${digits}`;
  if (digits.length === 9 && digits.startsWith("0"))
    digits = `${defaultCountryCode}${digits.slice(1)}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : "";
};

export const numberPhone = (phone: string) => phoneE164(phone).replace("+", "");

export const sourceKeyFor = (phone: string, product: string) =>
  `${numberPhone(phone)}:${product
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")}`;

export const isLate = (value: string) => Boolean(value && value < today());

export const formatDate = (value: string) =>
  value
    ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("es-GT", {
        day: "numeric",
        month: "short",
      })
    : "Sin fecha";
