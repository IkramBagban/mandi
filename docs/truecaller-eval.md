# Truecaller 1-tap verification — spike evaluation

Date: 2026-09-10 · Time-boxed spike, no code integrated.
Question: should the mandi app offer Truecaller 1-tap login alongside (or
instead of) Supabase phone OTP?

## Verdict: do NOT integrate. Supabase OTP stays the primary (only) path.

Three independent blockers, any one of which is enough:

1. **It is paid, with no usable free tier.** Since 1 April 2026 Truecaller
   Number Verification is a commercial product, metered per successful
   verification in production (pricing only via their sales team —
   developersupport@truecaller.com). Mandi traders log in rarely but there
   are many of them; a per-verification meter on a free khata app is the
   wrong cost shape versus MSG91 SMS/WhatsApp pay-per-message.
2. **No viable React Native / Expo path.** The official
   `truecaller/react-native-sdk` docs repo is stale (Android SDK 2.x era);
   the community `react-native-truecaller-sdk` on npm is deprecated,
   6+ years unmaintained, Android-only. Any integration needs native
   modules → `expo prebuild` + dev client, which breaks our Expo Go
   workflow, plus a Truecaller partner key, AndroidManifest wiring, and on
   iOS AppKey + AppLinks/associated-domains setup.
3. **It doesn't plug into Supabase Auth.** Truecaller verifies the number
   on-device and hands back a profile payload; Supabase phone login still
   needs its _own_ OTP exchange to mint the session that backs every RLS
   policy (`owner_id = auth.uid()`). Bridging the two means custom token
   minting in an Edge Function (Supabase ID-token login supports
   Apple/Google-style providers, not Truecaller) — a parallel auth system
   with real security surface, just to skip typing 6 digits.

## What Truecaller offers (for the record)

- **1-tap verification** for active Truecaller app users (500M+ users
  globally): consent dialog → verified number + profile, no OTP.
- **Missed-call fallback** for non-Truecaller users — but India market
  only, and native Android / React Native only (no iOS, no Expo Go).
- So on iOS, every non-Truecaller user still needs an OTP fallback — we'd
  build and maintain both paths anyway.
- Sources: developer.truecaller.com (commercial notice),
  docs.truecaller.com/truecaller-sdk + `/faqs/general` (metered billing,
  platform matrix), github.com/truecaller/react-native-sdk,
  npm `react-native-truecaller-sdk` (deprecated).

## Integration effort if ever revisited

Roughly: partner key procurement → pricing negotiation → native module
(prebuild, dev client, EAS builds) → Android + iOS SDK wiring →
server-side Truecaller payload verification in an Edge Function → custom
Supabase session minting → OTP fallback for everyone uncovered. Estimate:
1–2 weeks plus ongoing per-verification cost. Only worth it with measured
data showing OTP entry is a top drop-off cause.

## Recommendation

Ship Supabase phone OTP (WhatsApp-first, SMS fallback). Revisit Truecaller
only if login-funnel analytics show OTP typing — not OTP _delivery_ — is
losing us traders.
