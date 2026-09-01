/**
 * Normalize an Indian phone number to the bare 10-digit form.
 * Handles common stored formats: "+91 63010 67189", "06301067189", "+916301067189".
 * Returns the digits (possibly empty) without mutating the input.
 * Returns empty string if the result is not exactly 10 digits.
 */
export function normalizeIndianPhone(input: string | null | undefined): string {
  const digits = String(input || "").replace(/\D/g, "");
  let normalized = digits;
  if (normalized.length === 12 && normalized.startsWith("91")) normalized = normalized.slice(2);
  if (normalized.length === 11 && normalized.startsWith("0")) normalized = normalized.slice(1);
  return normalized.length === 10 ? normalized : "";
}
