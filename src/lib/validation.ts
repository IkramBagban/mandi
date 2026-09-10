/**
 * Input validation for money / phone / quantity fields.
 *
 * Rules return i18n *keys* (not translated strings) so validation stays pure
 * and screens translate the result with `t(result.errorKey)`.
 * All keys live under `validation.*` in every locale file.
 */

export type ValidationResult = { ok: true; value: number } | { ok: false; errorKey: string };

/** Absolute ceiling for any money field (₹10 crore — beyond this is a typo). */
export const MAX_AMOUNT = 100_000_000;
/** Absolute ceiling for a weight field (1 lakh kg — beyond this is a typo). */
export const MAX_QTY_KG = 100_000;

/**
 * Convert Devanagari (०-९) and Arabic-Indic (٠-٩) digits to ASCII 0-9.
 * Users with Hindi/Marathi/Urdu keyboards type these naturally.
 */
export function normalizeDigits(raw: string): string {
  return raw
    .replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** Shared core for decimal fields: trims, normalises digits, checks shape. */
function parseDecimal(
  raw: string,
  opts: { maxDecimals: number; max: number; emptyKey: string; invalidKey: string },
): ValidationResult {
  const text = normalizeDigits(raw)
    .trim()
    .replace(/[,，\s]/g, '');
  if (!text) return { ok: false, errorKey: opts.emptyKey };
  if (!/^\d+(\.\d+)?$/.test(text)) return { ok: false, errorKey: opts.invalidKey };
  const decimals = text.includes('.') ? text.split('.')[1].length : 0;
  if (decimals > opts.maxDecimals) return { ok: false, errorKey: opts.invalidKey };
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, errorKey: 'validation.amountNotPositive' };
  }
  if (value > opts.max) return { ok: false, errorKey: 'validation.amountTooLarge' };
  return { ok: true, value };
}

/** Money entry: up to 2 decimals (paise), must be > 0 and sane. */
export function validateAmount(raw: string): ValidationResult {
  return parseDecimal(raw, {
    maxDecimals: 2,
    max: MAX_AMOUNT,
    emptyKey: 'validation.amountRequired',
    invalidKey: 'validation.amountInvalid',
  });
}

/** Weight entry in kg: up to 3 decimals, must be > 0 and sane. */
export function validateQuantityKg(raw: string): ValidationResult {
  const result = parseDecimal(raw, {
    maxDecimals: 3,
    max: MAX_QTY_KG,
    emptyKey: 'validation.qtyInvalid',
    invalidKey: 'validation.qtyInvalid',
  });
  if (!result.ok && result.errorKey === 'validation.amountNotPositive') {
    return { ok: false, errorKey: 'validation.qtyInvalid' };
  }
  return result;
}

export type PhoneResult = { ok: true; value: string } | { ok: false; errorKey: string };

/**
 * Indian mobile numbers: strips spaces/dashes/+91/leading 0, accepts
 * 10 digits starting 6-9. Returns the canonical 10-digit string.
 */
export function validateIndianPhone(raw: string): PhoneResult {
  let digits = normalizeDigits(raw).replace(/[^\d]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return { ok: false, errorKey: 'validation.phoneInvalid' };
  }
  return { ok: true, value: digits };
}

/** Names: anything non-blank counts (transliteration varies too much to check). */
export function validateName(raw: string): boolean {
  return raw.trim().length > 0;
}
