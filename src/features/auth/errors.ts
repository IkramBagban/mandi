/**
 * Supabase Auth failures → i18n keys (never raw English, never the OTP).
 *
 * Supabase deliberately reuses one message ("Token has expired or is
 * invalid") for both wrong and stale codes, so verify failures share one
 * honest, actionable key instead of guessing which one happened.
 */

interface ReadableAuthError {
  status?: number;
  code?: string;
  message?: string;
}

function readError(error: unknown): ReadableAuthError {
  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      status: typeof record.status === 'number' ? record.status : undefined,
      code: typeof record.code === 'string' ? record.code : undefined,
      message: typeof record.message === 'string' ? record.message : undefined,
    };
  }
  if (typeof error === 'string') return { message: error };
  return {};
}

/** True when the request never reached Supabase (offline / flaky mandi net). */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  const { message } = readError(error);
  return message !== undefined && /network request failed|fetch|failed to fetch|load failed|timeout|abort/i.test(message);
}

/**
 * Map anything thrown by the auth repository to a `auth.error*` i18n key.
 * Screens render `t(mapAuthErrorToKey(error))` — no hardcoded strings.
 */
export function mapAuthErrorToKey(error: unknown): string {
  if (isNetworkError(error)) return 'auth.errorNoNetwork';

  const { status, code, message } = readError(error);
  const text = `${code ?? ''} ${message ?? ''}`.toLowerCase();

  if (text.includes('supabase is not configured')) return 'auth.errorNotConfigured';
  if (
    status === 429 ||
    text.includes('over_request_rate_limit') ||
    text.includes('rate limit') ||
    text.includes('too many') ||
    text.includes('after 60 seconds') ||
    text.includes('60 seconds')
  ) {
    return 'auth.errorRateLimited';
  }
  if (text.includes('validation.phoneinvalid') || text.includes('phoneinvalid')) {
    return 'validation.phoneInvalid';
  }
  if (
    code === 'otp_expired' ||
    text.includes('expired') ||
    text.includes('invalid') ||
    text.includes('incorrect') ||
    text.includes('mismatch') ||
    text.includes('not found') ||
    status === 403
  ) {
    return 'auth.errorCodeInvalid';
  }
  return 'auth.errorGeneric';
}
