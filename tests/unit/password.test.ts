import { MIN_PASSWORD_LENGTH, validatePassword } from '@/features/auth/password';

describe('validatePassword', () => {
  it('rejects empty and short passwords with the localized key', () => {
    expect(validatePassword('')).toEqual({ ok: false, errorKey: 'auth.errorPasswordTooShort' });
    expect(validatePassword('12345')).toEqual({
      ok: false,
      errorKey: 'auth.errorPasswordTooShort',
    });
  });

  it('accepts exactly the minimum length', () => {
    expect(validatePassword('123456')).toEqual({ ok: true, value: '123456' });
  });

  it('allows a numeric PIN (explicit product decision)', () => {
    expect(validatePassword('987654')).toEqual({ ok: true, value: '987654' });
  });

  it('allows letters, mixed and longer passwords', () => {
    expect(validatePassword('mandi12').ok).toBe(true);
    expect(validatePassword('my-secret-password-123').ok).toBe(true);
  });

  it('keeps the raw value verbatim (spaces are valid password characters)', () => {
    expect(validatePassword('ab 12 ')).toEqual({ ok: true, value: 'ab 12 ' });
  });

  it('documents the minimum the UI hint promises', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(6);
  });
});
