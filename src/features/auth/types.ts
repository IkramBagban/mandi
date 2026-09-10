/**
 * Auth domain — PASSWORD PRIMARY, OTP SECONDARY (locked decision).
 *
 * Phone+password costs zero SMS, so it is the default path:
 *   1. new user enters their 10-digit mobile (`signup` screen)
 *   2. one OTP confirms the number really is theirs (`verify`, once)
 *   3. they set a password (`password` screen) — the account is now a
 *      phone+password account, used for every later login.
 * Returning users type phone + password on the Login screen
 * (`signInWithPassword`) — no SMS at all.
 *
 * OTP fires only as the secondary path: the Login screen's OTP tab
 * (existing `requestOtp`/`verifyOtp` flow), signup number-confirmation,
 * and forgot-password recovery. Delivery stays WhatsApp-first with SMS
 * fallback via MSG91, routed server-side through the Supabase Send SMS Hook
 * (`supabase/functions/send-sms-hook/`); the app only declares the channel.
 */

export type OtpChannel = 'whatsapp' | 'sms';

/** Preferred channel order: WhatsApp first, SMS fallback. */
export const OTP_CHANNEL_ORDER: readonly OtpChannel[] = ['whatsapp', 'sms'];

/** OTP codes are always 6 digits. */
export const OTP_LENGTH = 6;

/** Seconds before the verify screen offers a resend. */
export const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Wrong-code tries before the verify screen pushes the user to request a
 * fresh code instead of guessing further (no lockout — resend resets it).
 */
export const MAX_VERIFY_ATTEMPTS = 5;

export interface RequestOtpInput {
  /** Canonical 10-digit Indian mobile (see `validateIndianPhone`). */
  phone: string;
  /**
   * Pin to one channel (resend on the channel that worked). Omit to try
   * WhatsApp first with SMS fallback (`OTP_CHANNEL_ORDER`).
   */
  channel?: OtpChannel;
}

export interface VerifyOtpInput {
  phone: string;
  /** 6-digit code the user typed. */
  code: string;
}

export interface SignInWithPasswordInput {
  /** Canonical 10-digit Indian mobile (see `validateIndianPhone`). */
  phone: string;
  /** Raw password as typed (never trimmed, never logged). */
  password: string;
}

export interface SetPasswordInput {
  /** New password, already client-validated (`validatePassword`). */
  password: string;
}

/**
 * Why the verify screen was opened — decides where success goes:
 * `login` → tabs; `signup`/`recovery` → the set-password screen.
 */
export type VerifyPurpose = 'login' | 'signup' | 'recovery';

/** Set-password context: first password vs replacement. */
export type SetPasswordMode = 'signup' | 'recovery';

export interface AuthUser {
  id: string;
  phone: string;
}
