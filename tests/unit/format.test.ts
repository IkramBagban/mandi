import type { AppLanguage } from '@/i18n';
import { formatDate, formatINR, formatKg } from '@/lib/format';

const LANGUAGES: AppLanguage[] = ['en', 'hi', 'mr', 'ur'];

describe('formatINR', () => {
  it('groups English digits the Indian way (lakh/crore)', () => {
    expect(formatINR(100000, 'en')).toBe('₹1,00,000');
    expect(formatINR(10000000, 'en')).toBe('₹1,00,00,000');
  });

  it('shows paise only when present', () => {
    expect(formatINR(10.5, 'en')).toBe('₹10.5');
    expect(formatINR(0, 'en')).toBe('₹0');
  });

  it('returns a non-empty rupee string in every language (never throws)', () => {
    for (const language of LANGUAGES) {
      const text = formatINR(100000, language);
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
      expect(text).toContain('₹');
    }
  });
});

describe('formatKg', () => {
  it('formats English weights with grouping + kg suffix', () => {
    expect(formatKg(25, 'en')).toBe('25 kg');
    expect(formatKg(1250, 'en')).toBe('1,250 kg');
  });

  it('keeps up to 3 decimals', () => {
    expect(formatKg(1.234, 'en')).toBe('1.234 kg');
  });

  it('returns a kg-suffixed string in every language (never throws)', () => {
    for (const language of LANGUAGES) {
      const text = formatKg(25, language);
      expect(typeof text).toBe('string');
      expect(text.endsWith(' kg')).toBe(true);
    }
  });
});

describe('formatDate', () => {
  // Local noon: immune to UTC-offset day shifts on any CI machine.
  const noon = new Date(2026, 8, 10, 12, 0, 0);

  it('shows a short day-month-year date in English', () => {
    const text = formatDate(noon, 'en');
    expect(text).toContain('2026');
    expect(text).toContain('10');
  });

  it('accepts ISO strings as well as Dates', () => {
    const text = formatDate('2026-09-10T12:00:00', 'en');
    expect(text).toContain('2026');
    expect(text).toContain('10');
  });

  it('returns a non-empty date string in every language (never throws)', () => {
    for (const language of LANGUAGES) {
      const text = formatDate(noon, language);
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    }
  });
});
