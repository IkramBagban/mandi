/**
 * SMS/WhatsApp provider adapter.
 *
 * SECURITY: providers need secret API keys, so sending NEVER happens on the
 * device. This module defines the contract + the MSG91 implementations used
 * by the Supabase Send SMS Hook (`supabase/functions/send-sms-hook/`), which
 * runs server-side (Edge Function secrets, not EXPO_PUBLIC_* vars).
 *
 * The code is runtime-agnostic (global `fetch` + env lookup only) so the
 * Deno hook imports it directly — one implementation, no drift.
 *
 * Locked routing: WhatsApp-first, SMS fallback via MSG91.
 */

export interface OtpMessage {
  /** E.164 destination, e.g. "+919812345678". */
  to: string;
  /** The OTP digits Supabase generated. NEVER log this value. */
  otp: string;
}

export interface MessageProvider {
  readonly channel: 'whatsapp' | 'sms';
  sendOtp(message: OtpMessage): Promise<void>;
}

/** Read an env var on Deno (`Deno.env`) or Node/Expo (`process.env`). */
function readEnv(name: string): string | undefined {
  try {
    const deno = (
      globalThis as {
        Deno?: { env?: { get?: (key: string) => string | undefined } };
      }
    ).Deno;
    const fromDeno = deno?.env?.get?.(name);
    if (fromDeno) return fromDeno;
  } catch {
    // Deno without --allow-env: fall through to process.env.
  }
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
    ?.env?.[name];
}

/** POST JSON with a 10s timeout. Rejects with a message that never echoes the OTP. */
async function postJson(url: string, authKey: string, body: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authkey: authKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error(`OTP provider request to ${url} failed (network or timeout).`);
  }
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON error page — fall through to the status check below.
  }
  const ok =
    response.ok &&
    typeof payload === 'object' &&
    payload !== null &&
    (payload as { type?: unknown }).type === 'success';
  if (!ok) {
    const detail =
      typeof payload === 'object' && payload !== null
        ? String((payload as { message?: unknown }).message ?? response.status)
        : String(response.status);
    throw new Error(`OTP provider rejected the request (HTTP ${response.status}: ${detail}).`);
  }
  return payload;
}

/** "+919812345678" → "919812345678" (MSG91 wants digits with country code). */
function toMsg91Mobile(e164: string): string {
  return e164.replace(/[^\d]/g, '');
}

function required(value: string | undefined, envName: string): string {
  if (!value) {
    throw new Error(
      `OTP provider is missing configuration. Set the ${envName} Edge Function secret (see README).`,
    );
  }
  return value;
}

export interface Msg91SmsConfig {
  authKey?: string;
  /** MSG91 Flow ID of the DLT-registered OTP flow. */
  smsFlowId?: string;
  /** DLT-registered sender ID (header). */
  senderId?: string;
  /**
   * Flow variable that carries the OTP (must match the variable defined in
   * the MSG91 flow, e.g. "OTP"). Defaults to "OTP".
   */
  otpVar?: string;
}

/**
 * MSG91 SMS fallback provider (Flow API v5).
 * Secrets come from Edge Function secrets — never from the app bundle.
 */
export class Msg91SmsProvider implements MessageProvider {
  readonly channel = 'sms' as const;
  private readonly config: Msg91SmsConfig;

  constructor(config: Msg91SmsConfig = {}) {
    this.config = config;
  }

  async sendOtp(message: OtpMessage): Promise<void> {
    const authKey = required(this.config.authKey ?? readEnv('MSG91_AUTHKEY'), 'MSG91_AUTHKEY');
    const flowId = required(
      this.config.smsFlowId ?? readEnv('MSG91_SMS_FLOW_ID'),
      'MSG91_SMS_FLOW_ID',
    );
    const sender = required(
      this.config.senderId ?? readEnv('MSG91_SENDER_ID'),
      'MSG91_SENDER_ID',
    );
    const otpVar = this.config.otpVar ?? readEnv('MSG91_SMS_OTP_VAR') ?? 'OTP';
    await postJson('https://control.msg91.com/api/v5/flow', authKey, {
      flow_id: flowId,
      sender,
      mobiles: toMsg91Mobile(message.to),
      [otpVar]: message.otp,
    });
  }
}

export interface WhatsAppConfig {
  authKey?: string;
  /** MSG91-integrated WhatsApp number (sender, with country code, no "+"). */
  integratedNumber?: string;
  /** Approved Meta authentication-template name, e.g. "mandi_otp_hi". */
  templateName?: string;
  /** Template language code, e.g. "hi" or "en". Defaults to "hi". */
  templateLang?: string;
  /** Override for tests / future MSG91 endpoint moves. */
  baseUrl?: string;
}

/**
 * WhatsApp-first provider (MSG91 WhatsApp outbound template API).
 * Sends the OTP inside an approved Meta authentication template.
 * Must throw on failure so the hook can fall back to `Msg91SmsProvider`.
 */
export class WhatsAppOtpProvider implements MessageProvider {
  readonly channel = 'whatsapp' as const;
  private readonly config: WhatsAppConfig;

  constructor(config: WhatsAppConfig = {}) {
    this.config = config;
  }

  async sendOtp(message: OtpMessage): Promise<void> {
    const authKey = required(this.config.authKey ?? readEnv('MSG91_AUTHKEY'), 'MSG91_AUTHKEY');
    const integratedNumber = required(
      this.config.integratedNumber ?? readEnv('MSG91_WHATSAPP_NUMBER'),
      'MSG91_WHATSAPP_NUMBER',
    );
    const templateName = required(
      this.config.templateName ?? readEnv('MSG91_WHATSAPP_TEMPLATE'),
      'MSG91_WHATSAPP_TEMPLATE',
    );
    const lang = this.config.templateLang ?? readEnv('MSG91_WHATSAPP_LANG') ?? 'hi';
    const baseUrl =
      this.config.baseUrl ??
      readEnv('MSG91_WHATSAPP_URL') ??
      'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';
    await postJson(baseUrl, authKey, {
      integrated_number: integratedNumber,
      content_type: 'template',
      payload: {
        to: toMsg91Mobile(message.to),
        type: 'template',
        template: {
          name: templateName,
          language: { code: lang, policy: 'deterministic' },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: message.otp }],
            },
          ],
        },
      },
    });
  }
}

/** Channel order used by the Send SMS Hook: WhatsApp, then MSG91 SMS. */
export function createOtpProviders(config: {
  sms?: Msg91SmsConfig;
  whatsapp?: WhatsAppConfig;
} = {}): MessageProvider[] {
  return [new WhatsAppOtpProvider(config.whatsapp), new Msg91SmsProvider(config.sms)];
}

/**
 * Try each provider in order; resolve with the channel that delivered.
 * Rejects with the last provider's error when every channel fails.
 */
export async function sendViaProviders(
  message: OtpMessage,
  providers: MessageProvider[] = createOtpProviders(),
): Promise<{ channel: MessageProvider['channel'] }> {
  let lastError: unknown = null;
  for (const provider of providers) {
    try {
      await provider.sendOtp(message);
      return { channel: provider.channel };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('All OTP providers failed.');
}
