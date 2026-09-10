import type { Session, User } from '@supabase/supabase-js';

import { getSupabase } from '@/lib/supabase';
import { validateIndianPhone } from '@/lib/validation';

import { validatePassword } from './password';
import { toE164Indian } from './phone';
import { OTP_CHANNEL_ORDER } from './types';
import type {
  AuthUser,
  OtpChannel,
  RequestOtpInput,
  SetPasswordInput,
  SignInWithPasswordInput,
  VerifyOtpInput,
} from './types';

/**
 * Phone+password / phone-OTP auth repository — the ONLY place that talks to
 * Supabase Auth.
 *
 * Screens call these functions plus `mapAuthErrorToKey` (in `./errors`) and
 * never touch `supabase.auth` directly. Delivery routing (WhatsApp-first →
 * MSG91 SMS) is server-side in the Send SMS Hook
 * (`supabase/functions/send-sms-hook/`); the app only declares the channel.
 *
 * Security: passwords and OTP values are never logged here or anywhere else.
 */

function canonicalPhoneOrThrow(raw: string): string {
  const phone = validateIndianPhone(raw);
  if (!phone.ok) throw new Error(phone.errorKey);
  return phone.value;
}

function toAuthUser(user: User): AuthUser {
  return { id: user.id, phone: user.phone ?? '' };
}

/**
 * Send an OTP, WhatsApp-first with SMS fallback.
 * Returns the channel that accepted the request (for the "code sent via …" hint).
 */
export async function requestOtp(input: RequestOtpInput): Promise<{ channel: OtpChannel }> {
  const canonical = canonicalPhoneOrThrow(input.phone);
  const supabase = getSupabase();
  const phone = toE164Indian(canonical);

  const channels: readonly OtpChannel[] = input.channel ? [input.channel] : OTP_CHANNEL_ORDER;
  let lastError: unknown = null;
  for (const channel of channels) {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { channel },
    });
    if (!error) return { channel };
    lastError = error;
  }
  throw lastError instanceof Error ? lastError : new Error('OTP request failed.');
}

/**
 * Verify the 6-digit code; returns the signed-in user.
 * `type: 'sms'` covers both delivery channels (Supabase has no separate
 * WhatsApp verify type — the code is the same phone OTP).
 */
export async function verifyOtp(input: VerifyOtpInput): Promise<AuthUser> {
  const canonical = canonicalPhoneOrThrow(input.phone);
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.verifyOtp({
    phone: toE164Indian(canonical),
    token: input.code.trim(),
    type: 'sms',
  });
  if (error) throw error;
  if (!data.user) throw new Error('OTP verification returned no user.');
  return toAuthUser(data.user);
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

/**
 * Primary login: phone + password, zero SMS.
 * Throws `Error(validation key)` for bad input, Supabase error otherwise.
 */
export async function signInWithPassword(input: SignInWithPasswordInput): Promise<AuthUser> {
  const canonical = canonicalPhoneOrThrow(input.phone);
  const checked = validatePassword(input.password);
  if (!checked.ok) throw new Error(checked.errorKey);
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    phone: toE164Indian(canonical),
    password: checked.value,
  });
  if (error) throw error;
  if (!data.user) throw new Error('Password sign-in returned no user.');
  return toAuthUser(data.user);
}

/**
 * Attach (signup) or replace (recovery) the account password.
 * Requires the session the OTP-verify step just established — both flows
 * verify the number immediately before this, so `updateUser` is authorised.
 */
export async function setPassword(input: SetPasswordInput): Promise<AuthUser> {
  const checked = validatePassword(input.password);
  if (!checked.ok) throw new Error(checked.errorKey);
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.updateUser({ password: checked.value });
  if (error) throw error;
  if (!data.user) throw new Error('Password update returned no user.');
  return toAuthUser(data.user);
}

/**
 * Direct signup: phone + password, NO OTP step.
 *
 * Used only while the OTP flag is OFF (see `lib/authFlags`). Requires phone
 * confirmations to be OFF in the Supabase dashboard — then `signUp` issues
 * a session immediately. If confirmations are ON, no session comes back and
 * this throws `auth.errorSignupUnavailable` (screens show it; the operator
 * fixes the dashboard, never the user). "User already registered" maps to
 * `auth.errorAlreadyRegistered` in `./errors`.
 */
export async function signUpWithPassword(input: SignInWithPasswordInput): Promise<AuthUser> {
  const canonical = canonicalPhoneOrThrow(input.phone);
  const checked = validatePassword(input.password);
  if (!checked.ok) throw new Error(checked.errorKey);
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signUp({
    phone: toE164Indian(canonical),
    password: checked.value,
  });
  if (error) throw error;
  if (!data.user || !data.session) throw new Error('auth.errorSignupUnavailable');
  return toAuthUser(data.user);
}

/** Current persisted session (`null` when logged out). Survives restarts. */
export async function getSessionUser(): Promise<AuthUser | null> {
  const {
    data: { session },
  } = await getSupabase().auth.getSession();
  return session?.user ? toAuthUser(session.user) : null;
}

/** Subscribe to sign-in / sign-out / token-refresh. Returns an unsubscribe. */
export function subscribeToAuthChanges(onChange: (user: AuthUser | null) => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session: Session | null) => {
    onChange(session?.user ? toAuthUser(session.user) : null);
  });
  return () => data.subscription.unsubscribe();
}
