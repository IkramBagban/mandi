/**
 * OTP flag tests. The flag reads `process.env` at CALL time so each case
 * sets the env first and requires a fresh module copy.
 */
describe('isOtpEnabled', () => {
  const ORIGINAL = process.env.EXPO_PUBLIC_OTP_ENABLED;

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.EXPO_PUBLIC_OTP_ENABLED;
    else process.env.EXPO_PUBLIC_OTP_ENABLED = ORIGINAL;
    jest.resetModules();
  });

  function flagWith(env: string | undefined): boolean {
    if (env === undefined) delete process.env.EXPO_PUBLIC_OTP_ENABLED;
    else process.env.EXPO_PUBLIC_OTP_ENABLED = env;
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/authFlags') as typeof import('@/lib/authFlags');
    return mod.isOtpEnabled();
  }

  it('is OFF when unset (the default)', () => {
    expect(flagWith(undefined)).toBe(false);
  });

  it('is OFF for anything but the exact string "true"', () => {
    expect(flagWith('false')).toBe(false);
    expect(flagWith('')).toBe(false);
    expect(flagWith('1')).toBe(false);
    expect(flagWith('TRUE')).toBe(false);
  });

  it('is ON only for EXPO_PUBLIC_OTP_ENABLED=true', () => {
    expect(flagWith('true')).toBe(true);
  });
});
