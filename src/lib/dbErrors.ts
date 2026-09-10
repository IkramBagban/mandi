import { getSupabase, isSupabaseConfigured } from './supabase';
import { isOfflineFailure, RepoError } from './offline';

/**
 * Supabase failures → i18n keys, app-wide (extends the `auth/errors.ts`
 * pattern beyond OTP: no screen ever renders a raw Supabase/Postgres
 * message — always `t(mapDbErrorToKey(error))`).
 *
 * Mapping (first match wins):
 *   RLS denial / no usable session → `auth.loginRequired`
 *     ("please log in to save" — points at the OTP Login entry, never the
 *     raw `new row violates row-level security policy` English).
 *   network / fetch / timeout      → `errors.offline`
 *   rate limit (429)               → `errors.rateLimited`
 *   anything else                  → `errors.failed`
 */

/** True for RLS denials and other "no usable session" shapes. */
export function isLoginRequiredFailure(error: unknown): boolean {
  if (error instanceof RepoError) return error.code === 'loginRequired';
  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    const code = typeof record.code === 'string' ? record.code : '';
    const message = typeof record.message === 'string' ? record.message : '';
    const status = typeof record.status === 'number' ? record.status : undefined;
    const text = `${code} ${message}`.toLowerCase();
    return (
      code === '42501' ||
      status === 401 ||
      text.includes('row-level security') ||
      text.includes('row_level_security') ||
      text.includes('violates row-level') ||
      text.includes('auth session missing')
    );
  }
  if (typeof error === 'string') {
    const text = error.toLowerCase();
    return (
      text.includes('row-level security') ||
      text.includes('row_level_security') ||
      text.includes('auth session missing')
    );
  }
  return false;
}

/** True for Supabase/Edge rate limiting (HTTP 429 and friends). */
export function isRateLimitedFailure(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    const code = typeof record.code === 'string' ? record.code : '';
    const message = typeof record.message === 'string' ? record.message : '';
    const status = typeof record.status === 'number' ? record.status : undefined;
    const text = `${code} ${message}`.toLowerCase();
    return (
      status === 429 ||
      text.includes('over_request_rate_limit') ||
      text.includes('rate limit') ||
      text.includes('too many requests') ||
      text.includes('after 60 seconds')
    );
  }
  return false;
}

/**
 * Map anything thrown on a data path to a renderable i18n key.
 * Screens render `t(mapDbErrorToKey(error))` — never `error.message`.
 */
export function mapDbErrorToKey(error: unknown): string {
  if (isLoginRequiredFailure(error)) return 'auth.loginRequired';
  if (isOfflineFailure(error)) return 'errors.offline';
  if (isRateLimitedFailure(error)) return 'errors.rateLimited';
  return 'errors.failed';
}

/**
 * Session gate for WRITES (reads keep their local-cache fallback and never
 * call this).
 *
 *   demo/offline mode (Supabase unconfigured) → null: writes stay local,
 *     exactly as today.
 *   configured + signed in                   → the owner id: remote writes.
 *   configured + signed out                  → throws
 *     `RepoError('loginRequired')`: repositories must never attempt the
 *     remote write RLS would reject with raw Postgres English; screens map
 *     the code to `auth.loginRequired` ("please log in to save").
 *
 * A `getUser` transport failure (dead mandi network, not a sign-out)
 * resolves null so offline saves keep working — the write then lands in
 * the local mirror like every other offline write.
 */
export async function getWriteOwnerId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await getSupabase().auth.getUser();
    const userId = data.user?.id ?? null;
    if (!userId) throw new RepoError('loginRequired');
    return userId;
  } catch (error) {
    if (error instanceof RepoError && error.code === 'loginRequired') throw error;
    return null;
  }
}
