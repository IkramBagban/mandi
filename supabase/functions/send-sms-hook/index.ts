// @ts-nocheck
// Supabase Send SMS Hook — Deno runtime (type-checked by `supabase functions`,
// NOT by the app tsconfig). Deploy with:
//   supabase functions deploy send-sms-hook
// then enable it in Dashboard → Authentication → Hooks → Send SMS Hook (V2).
//
// Locked routing: WhatsApp-first, SMS fallback via MSG91. Supabase generates
// the OTP and calls this hook with `{ user, sms: { otp, phone } }`; the hook
// delivers it and MUST NOT leak secrets to the client (authkey lives in Edge
// Function secrets: MSG91_AUTHKEY, MSG91_SMS_FLOW_ID, MSG91_SENDER_ID,
// MSG91_WHATSAPP_NUMBER, MSG91_WHATSAPP_TEMPLATE — see README).
//
// SECURITY: the OTP value is never logged and never echoed in responses.

import { sendViaProviders } from '../../../src/lib/sms.ts';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const sms = (payload as { sms?: { otp?: unknown; phone?: unknown } })?.sms;
  if (typeof sms?.otp !== 'string' || typeof sms?.phone !== 'string' || !sms.otp || !sms.phone) {
    return json({ error: 'Missing sms.otp or sms.phone.' }, 400);
  }

  try {
    // Provider internals throw sanitized errors (no OTP inside).
    const { channel } = await sendViaProviders({ to: sms.phone, otp: sms.otp });
    console.log(`[send-sms-hook] delivered via=${channel}`);
    // 2xx tells Supabase the send succeeded.
    return json({}, 200);
  } catch (error) {
    console.error(`[send-sms-hook] all channels failed: ${error instanceof Error ? error.message : 'unknown'}`);
    // Non-2xx tells Supabase the send failed (it surfaces a rate-limit-safe
    // error to the client; the app maps it to a localized message).
    return json({ error: 'Failed to deliver OTP. Please try again.' }, 502);
  }
});
