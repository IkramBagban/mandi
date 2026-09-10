import {
  SYNTHETIC_EMAIL_DOMAIN,
  phoneFromSyntheticEmail,
  syntheticEmailFor,
} from '@/features/auth/phone';

describe('synthetic email mapping', () => {
  it('uses a reserved non-deliverable domain', () => {
    expect(SYNTHETIC_EMAIL_DOMAIN).toBe('mandi.invalid');
  });

  it('maps canonical digits to a stable hidden email', () => {
    expect(syntheticEmailFor('9812345678')).toBe('9812345678@mandi.invalid');
    expect(syntheticEmailFor('9812345678')).toBe(syntheticEmailFor('9812345678'));
  });

  it('round-trips back to the phone', () => {
    expect(phoneFromSyntheticEmail(syntheticEmailFor('7012345678'))).toBe('7012345678');
  });

  it.each([
    'ramesh@example.com',
    '9812345678@gmail.com',
    '9812345678@mandi.com',
    '9812345678@mandi.invalid.evil.com',
    'not-an-email',
    '',
    '12345@mandi.invalid',
  ])('returns null for non-synthetic %p', (email) => {
    expect(phoneFromSyntheticEmail(email)).toBeNull();
  });
});
