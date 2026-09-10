/**
 * Auth domain — PHONE OTP ONLY (locked decision).
 *
 * There is no password, no email login. Sign-in is:
 *   1. user enters their 10-digit mobile number (`requestOtp`)
 *   2. they receive a 6-digit code and type it (`verifyOtp`)
 *
 * OTP channel is WhatsApp-first with SMS fallback via MSG91, routed through
 * a Supabase Send SMS Hook — see `supabase/functions/send-sms-hook/` and
 * `src/lib/sms.ts`. Channel routing is server-side; the app only ever asks
 * for `whatsapp` first and retries `sms` (see repository).
 */

export type OtpChannel = 'whatsapp' | 'sms';

/** Preferred channel order: WhatsApp first, SMS fallback. */
export const OTP_CHANNEL_ORDER: readonly OtpChannel[] = ['whatsapp', 'sms'];

export interface RequestOtpInput {
  /** Canonical 10-digit Indian mobile (see `validateIndianPhone`). */
  phone: string;
}

export interface VerifyOtpInput {
  phone: string;
  /** 6-digit code the user typed. */
  code: string;
}

export interface AuthUser {
  id: string;
  phone: string;
}
