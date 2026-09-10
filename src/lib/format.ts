import type { AppLanguage } from '@/i18n';

const NUMBER_LOCALES: Record<AppLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  ur: 'ur-IN',
};

/** Indian digit grouping (lakh/crore) in the user's language. */
export function formatINR(amount: number, language: AppLanguage): string {
  try {
    return new Intl.NumberFormat(NUMBER_LOCALES[language], {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}

/** Weight display: "25 kg" / "1,250 kg" with local digits. */
export function formatKg(qtyKg: number, language: AppLanguage): string {
  try {
    const n = new Intl.NumberFormat(NUMBER_LOCALES[language], {
      maximumFractionDigits: 3,
    }).format(qtyKg);
    return `${n} kg`;
  } catch {
    return `${qtyKg} kg`;
  }
}

/** Short date, e.g. "10 Sep 2026", in the user's language. */
export function formatDate(date: Date | string, language: AppLanguage): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat(NUMBER_LOCALES[language], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
