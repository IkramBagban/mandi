/**
 * SMS/WhatsApp provider adapter.
 *
 * SECURITY: providers need secret API keys, so sending NEVER happens on the
 * device. This module defines the contract + the MSG91 implementation used by
 * the Supabase Send SMS Hook (`supabase/functions/send-sms-hook/`), which
 * runs server-side (Edge Function secrets, not EXPO_PUBLIC_* vars).
 *
 * Locked routing: WhatsApp-first, SMS fallback via MSG91.
 */

export interface OtpMessage {
  /** E.164 destination, e.g. "+919812345678". */
  to: string;
  /** The OTP digits Supabase generated. */
  otp: string;
}

export interface MessageProvider {
  readonly channel: 'whatsapp' | 'sms';
  sendOtp(message: OtpMessage): Promise<void>;
}

/**
 * MSG91 SMS fallback provider (STUB).
 *
 * TODO(feature:auth-otp): implement against the MSG91 Flow API
 * (https://docs.msg91.com) using Edge Function secrets:
 *   - MSG91_AUTHKEY   (server secret — never ship in the app)
 *   - MSG91_SMS_FLOW_ID / MSG91_SENDER_ID (DLT-registered template)
 */
export class Msg91SmsProvider implements MessageProvider {
  readonly channel = 'sms' as const;

  async sendOtp(_message: OtpMessage): Promise<void> {
    throw new Error(
      'TODO: Msg91SmsProvider.sendOtp needs MSG91_AUTHKEY + flow IDs in Edge Function secrets.',
    );
  }
}

/**
 * WhatsApp-first provider (STUB).
 *
 * TODO(feature:auth-otp): pick the WhatsApp sender (MSG91 WhatsApp API or
 * Meta WhatsApp Business API via an approved template) and implement here.
 * Must throw on failure so the hook can fall back to `Msg91SmsProvider`.
 */
export class WhatsAppOtpProvider implements MessageProvider {
  readonly channel = 'whatsapp' as const;

  async sendOtp(_message: OtpMessage): Promise<void> {
    throw new Error('TODO: WhatsAppOtpProvider.sendOtp needs a sender decision + template.');
  }
}

/** Channel order used by the Send SMS Hook: WhatsApp, then MSG91 SMS. */
export function createOtpProviders(): MessageProvider[] {
  return [new WhatsAppOtpProvider(), new Msg91SmsProvider()];
}
