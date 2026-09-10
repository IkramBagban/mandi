import { mapAuthErrorToKey } from '@/features/auth/errors';

describe('mapAuthErrorToKey — password paths', () => {
  it('maps wrong number/password to errorCredentialsInvalid (never which half)', () => {
    expect(mapAuthErrorToKey(new Error('Invalid login credentials'))).toBe(
      'auth.errorCredentialsInvalid',
    );
    expect(mapAuthErrorToKey({ message: 'invalid grant: Invalid login credentials' })).toBe(
      'auth.errorCredentialsInvalid',
    );
  });

  it('maps server-side password rejections to password keys', () => {
    expect(mapAuthErrorToKey(new Error('Password should be at least 6 characters'))).toBe(
      'auth.errorPasswordTooShort',
    );
    expect(mapAuthErrorToKey(new Error('Password is too weak, choose a stronger one'))).toBe(
      'auth.errorPasswordWeak',
    );
    expect(mapAuthErrorToKey(new Error('Password has been leaked in a data breach'))).toBe(
      'auth.errorPasswordWeak',
    );
  });

  it('maps client validation keys back to themselves', () => {
    expect(mapAuthErrorToKey(new Error('auth.errorPasswordTooShort'))).toBe(
      'auth.errorPasswordTooShort',
    );
    expect(mapAuthErrorToKey(new Error('validation.phoneInvalid'))).toBe('validation.phoneInvalid');
    expect(mapAuthErrorToKey(new Error('auth.errorSignupUnavailable'))).toBe(
      'auth.errorSignupUnavailable',
    );
  });

  it('maps already-registered to the login pointer', () => {
    expect(mapAuthErrorToKey(new Error('User already registered'))).toBe(
      'auth.errorAlreadyRegistered',
    );
  });

  it('maps a missing OTP-verify session to loginRequired', () => {
    expect(mapAuthErrorToKey(new Error('Auth session missing!'))).toBe('auth.loginRequired');
  });
});

describe('mapAuthErrorToKey — OTP regression', () => {
  it('keeps the existing mappings intact', () => {
    expect(mapAuthErrorToKey(new TypeError('Network request failed'))).toBe('auth.errorNoNetwork');
    expect(mapAuthErrorToKey(new Error('Supabase is not configured'))).toBe(
      'auth.errorNotConfigured',
    );
    expect(mapAuthErrorToKey({ status: 429, message: 'slow down' })).toBe('auth.errorRateLimited');
    expect(mapAuthErrorToKey(new Error('Token has expired or is invalid'))).toBe(
      'auth.errorCodeInvalid',
    );
    expect(mapAuthErrorToKey(new Error('something mysterious'))).toBe('auth.errorGeneric');
  });
});
