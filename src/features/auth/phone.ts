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
 * Synthetic-email domain for phone+password auth (see `repository.ts`).
 *
 * `mandi.invalid` uses the RFC 2606 `.invalid` TLD: guaranteed to never
 * resolve or deliver, while remaining format-valid for Supabase Auth's
 * email check. STABLE — changing it orphans every existing account, since
 * Supabase keys users by this email.
 */
export const SYNTHETIC_EMAIL_DOMAIN = 'mandi.invalid';

/**
 * Canonical 10-digit → deterministic hidden email, e.g.
 * "9812345678" → "9812345678@mandi.invalid".
 *
 * Users ONLY ever see phone + password; this address never appears in UI
 * or logs — grep the codebase for `SYNTHETIC_EMAIL_DOMAIN` to audit that.
 */
export function syntheticEmailFor(canonical10: string): string {
  const digits = normalizeDigits(canonical10).replace(/[^\d]/g, '').slice(-10);
  return `${digits}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

/**
 * Reverse of `syntheticEmailFor`: recover the phone behind a session email.
 * Returns null for anything else (real emails, other domains, bad shapes),
 * so callers fall through to `user_metadata.phone` / empty.
 */
export function phoneFromSyntheticEmail(email: string): string | null {
  const match = /^([6-9]\d{9})@mandi\.invalid$/i.exec(email.trim());
  return match?.[1] ?? null;
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
