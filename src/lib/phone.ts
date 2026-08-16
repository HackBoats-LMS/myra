/**
 * Normalize an Indian phone number to the bare 10-digit form.
 * Handles common stored formats: "+91 63010 67189", "06301067189", "+916301067189".
 * Returns the digits (possibly empty) without mutating the input.
 */
export function normalizeIndianPhone(input: string | null | undefined): string {
  const digits = String(input || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}
