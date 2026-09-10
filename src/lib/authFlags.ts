/**
 * OTP feature flag — central switch for every code-sent path.
 *
 * `EXPO_PUBLIC_OTP_ENABLED=true` turns the OTP flows on (Login OTP tab,
 * signup/recovery OTP verify). ANY other value — including unset — means
 * OFF: no screen offers OTP, and no OTP code path may execute, so zero SMS
 * is ever spent while off.
 *
 * Read at call time (not import time) so tests can flip `process.env` and
 * Expo picks up `.env` changes on server restart. Baked in at build time
 * like all `EXPO_PUBLIC_*` vars — flipping it in production needs a
 * rebuild; the no-rebuild upgrade path is a remote `app_config` table
 * (see README "Auth").
 */

/** True only when explicitly enabled — default is OFF. */
export function isOtpEnabled(): boolean {
  return process.env.EXPO_PUBLIC_OTP_ENABLED === 'true';
}
