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
  return (
    message !== undefined &&
    /network request failed|fetch|failed to fetch|load failed|timeout|abort/i.test(message)
  );
}

/**
 * Map anything thrown by the auth repository to a `auth.error*` i18n key.
 * Screens render `t(mapAuthErrorToKey(error))` — no hardcoded strings.
 */
export function mapAuthErrorToKey(error: unknown): string {
  if (isNetworkError(error)) return 'auth.errorNoNetwork';

  const { status, code, message } = readError(error);
  // Control-flow keys thrown by the repository (input validation, signup
  // guards) already ARE renderable keys — pass them straight through.
  const raw = (message ?? '').trim();
  if (/^(auth|validation|errors|common)\.[A-Za-z]+$/.test(raw)) return raw;

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
  // Password login: Supabase deliberately does not say which half is wrong.
  if (
    text.includes('invalid login credentials') ||
    text.includes('invalid grant') ||
    text.includes('phone not confirmed')
  ) {
    return 'auth.errorCredentialsInvalid';
  }
  // Email confirmations got turned ON in the dashboard while the app signs
  // up confirmation-free: the account exists but can never log in. This is
  // an operator misconfiguration, not a user typo — say so.
  if (text.includes('email not confirmed')) {
    return 'auth.errorSignupUnavailable';
  }
  // Direct (no-OTP) signup hit an existing account — point at Login.
  if (text.includes('already registered') || text.includes('already been registered')) {
    return 'auth.errorAlreadyRegistered';
  }
  // Password rejected server-side (too short, or flagged weak/leaked when
  // the project enables leaked-password protection).
  if (
    text.includes('auth.errorpasswordtooshort') ||
    text.includes('password should be at least') ||
    text.includes('password must be at least')
  ) {
    return 'auth.errorPasswordTooShort';
  }
  if (
    text.includes('weak') ||
    text.includes('pwned') ||
    text.includes('leaked') ||
    text.includes('breach') ||
    text.includes('commonly used') ||
    text.includes('compromised')
  ) {
    return 'auth.errorPasswordWeak';
  }
  // Password screens reached without the OTP-verify session (e.g. deep link
  // or expired session mid-flow) — point at Login, like the data layer does.
  if (text.includes('auth session missing')) return 'auth.loginRequired';
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
