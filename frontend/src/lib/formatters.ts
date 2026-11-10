export function formatIndianPhone(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  const mobile = digits.startsWith("91") && digits.length === 12
    ? digits.slice(2)
    : digits;
  return mobile.length === 10 ? `+91 ${mobile}` : phone;
}
