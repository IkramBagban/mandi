// @ts-nocheck
// Supabase Send SMS Hook — Deno runtime (type-checked by `supabase functions`,
// NOT by the app tsconfig). Deploy with:
//   supabase functions deploy send-sms-hook
// then enable it in Dashboard → Authentication → Hooks → Send SMS Hook (V2).
//
// Locked routing: WhatsApp-first, SMS fallback via MSG91. Supabase generates
// the OTP and calls this hook with `{ user, sms: { otp, phone } }`; the hook
// delivers it and MUST NOT leak secrets to the client (authkey lives in Edge
// Function secrets: MSG91_AUTHKEY, MSG91_SMS_FLOW_ID, MSG91_SENDER_ID).
//
// TODO(feature:auth-otp): implement delivery below —
//   1. try WhatsApp (MSG91 WhatsApp API or Meta WABA template),
//   2. on failure, POST the MSG91 Flow API for SMS,
//   3. return `new Response(JSON.stringify({}), { status: 200 })` on success
//      (non-2xx tells Supabase the send failed).

Deno.serve(async (req: Request) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _payload = await req.json();
  // const { sms } = _payload as { sms: { otp: string; phone: string } };
  // TODO: WhatsApp attempt → MSG91 SMS fallback (see src/lib/sms.ts contract).
  return new Response(JSON.stringify({ error: 'TODO: send-sms-hook not implemented yet.' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  });
});
