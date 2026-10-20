// Save next to BankAccounts.tsx. The backend uses IsIBAN, which checks the mod-97 digit.
// A length-only check lets invalid numbers through.

/** Strips spaces, upper-cases, and checks the ISO 13616 mod-97 digit. */
export function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function isValidIban(raw: string): boolean {
  const iban = normalizeIban(raw);
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban)) return false;

  // Move the country code and check digits to the end, then map each letter to 10–35.
  // The result mod 97 must be 1.
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    const digits = code >= 65 && code <= 90 ? String(code - 55) : ch;
    for (const d of digits) remainder = (remainder * 10 + Number(d)) % 97;
  }
  return remainder === 1;
}
