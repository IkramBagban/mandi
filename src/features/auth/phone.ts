import { normalizeDigits } from '@/lib/validation';

/**
 * Phone helpers for Indian numbers. Canonical form everywhere in auth is the
 * 10-digit string from `validateIndianPhone` (e.g. "9812345678"); E.164
 * ("+919812345678") is derived only at the Supabase boundary.
 */

/** Canonical 10-digit → E.164 for `signInWithOtp` / `verifyOtp`. */
export function toE164Indian(canonical10: string): string {
  return `+91${normalizeDigits(canonical10).replace(/[^\d]/g, '').slice(-10)}`;
}

/**
 * Display form for low-literacy users: full number, grouped, never masked
 * ("+91 98123 45678") so they can match it against their own SIM.
 */
export function formatIndianPhoneDisplay(canonical10: string): string {
  const digits = normalizeDigits(canonical10).replace(/[^\d]/g, '').slice(-10);
  if (digits.length !== 10) return canonical10;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}
