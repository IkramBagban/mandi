/**
 * Password rules for phone+password auth (primary login path).
 *
 * Minimal on purpose for low-literacy users: at least 6 characters, and a
 * numeric PIN is explicitly allowed. No complexity rules, no expiry.
 * Returns an i18n *key* (not a translated string) so validation stays pure
 * and screens translate with `t(result.errorKey)` — same pattern as
 * `lib/validation.ts`.
 */

/** Minimum password length (also Supabase Auth's own minimum). */
export const MIN_PASSWORD_LENGTH = 6;

export type PasswordResult = { ok: true; value: string } | { ok: false; errorKey: string };

/**
 * At least `MIN_PASSWORD_LENGTH` characters. Spaces count — they are valid
 * password characters, so the raw value is kept (never trimmed) and used
 * verbatim at sign-in.
 */
export function validatePassword(raw: string): PasswordResult {
  if (raw.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, errorKey: 'auth.errorPasswordTooShort' };
  }
  return { ok: true, value: raw };
}
