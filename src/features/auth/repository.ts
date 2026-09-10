import { getSupabase } from '@/lib/supabase';
import { validateIndianPhone } from '@/lib/validation';

import { OTP_CHANNEL_ORDER } from './types';
import type { AuthUser, OtpChannel, RequestOtpInput, VerifyOtpInput } from './types';

/**
 * Phone-OTP auth repository (STUB — needs a live Supabase project with phone
 * auth + the Send SMS Hook in `supabase/functions/send-sms-hook/` enabled).
 *
 * TODO(feature:auth-otp): build the login screens (phone → code) on top of
 * these functions. On success, `owner_id` for every repository comes from the
 * session user — never from client input.
 */

/**
 * Send an OTP, WhatsApp-first with SMS fallback.
 * Returns the channel that accepted the request (for the "code sent via …" hint).
 */
export async function requestOtp(input: RequestOtpInput): Promise<{ channel: OtpChannel }> {
  const phone = validateIndianPhone(input.phone);
  if (!phone.ok) throw new Error(phone.errorKey);
  const supabase = getSupabase();

  let lastError: unknown = null;
  for (const channel of OTP_CHANNEL_ORDER) {
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+91${phone.value}`,
      options: { channel },
    });
    if (!error) return { channel };
    lastError = error;
  }
  throw lastError instanceof Error ? lastError : new Error('OTP request failed.');
}

/** Verify the 6-digit code; returns the signed-in user. */
export async function verifyOtp(input: VerifyOtpInput): Promise<AuthUser> {
  const phone = validateIndianPhone(input.phone);
  if (!phone.ok) throw new Error(phone.errorKey);
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.verifyOtp({
    phone: `+91${phone.value}`,
    token: input.code.trim(),
    type: 'sms',
  });
  if (error) throw error;
  if (!data.user) throw new Error('OTP verification returned no user.');
  return { id: data.user.id, phone: data.user.phone ?? `+91${phone.value}` };
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}
