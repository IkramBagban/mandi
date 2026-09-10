import en from '@/i18n/locales/en.json';
import hi from '@/i18n/locales/hi.json';
import mr from '@/i18n/locales/mr.json';
import ur from '@/i18n/locales/ur.json';

type LocaleTree = Record<string, unknown>;

const LOCALES: Record<string, LocaleTree> = { en, hi, mr, ur };
const OTHER_LOCALES = ['hi', 'mr', 'ur'] as const;

/** Flatten `{ a: { b: 'x' } }` → `[['a.b', 'x']]` (dot paths). */
function flattenKeys(tree: LocaleTree, prefix = ''): [string, unknown][] {
  const out: [string, unknown][] = [];
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      out.push(...flattenKeys(value as LocaleTree, path));
    } else {
      out.push([path, value]);
    }
  }
  return out;
}

const FLAT: Record<string, [string, unknown][]> = Object.fromEntries(
  Object.entries(LOCALES).map(([name, tree]) => [name, flattenKeys(tree)]),
);

function lookup(locale: string, key: string): unknown {
  return FLAT[locale].find(([path]) => path === key)?.[1];
}

function placeholderNames(text: string): string[] {
  return [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)]
    .map((m) => m[1])
    .filter((name): name is string => typeof name === 'string')
    .sort();
}

describe('locale key parity (en/hi/mr/ur)', () => {
  it('has IDENTICAL key sets in all four locales', () => {
    const reference = FLAT.en.map(([path]) => path).sort();
    expect(reference.length).toBeGreaterThan(0);
    for (const name of OTHER_LOCALES) {
      const missing = reference.filter((key) => lookup(name, key) === undefined);
      const extra = FLAT[name]
        .map(([path]) => path)
        .filter((key) => lookup('en', key) === undefined);
      expect({ locale: name, missing, extra }).toEqual({ locale: name, missing: [], extra: [] });
    }
  });

  it('has no empty or whitespace-only strings in any locale', () => {
    const bad: string[] = [];
    for (const [name, entries] of Object.entries(FLAT)) {
      for (const [path, value] of entries) {
        if (typeof value !== 'string' || value.trim().length === 0) bad.push(`${name}:${path}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('uses the same {{placeholders}} for each key in every locale', () => {
    const mismatched: string[] = [];
    for (const [key, value] of FLAT.en) {
      const expected = placeholderNames(String(value ?? '')).join('|');
      for (const name of OTHER_LOCALES) {
        const other = lookup(name, key);
        if (other === undefined || placeholderNames(String(other ?? '')).join('|') !== expected) {
          mismatched.push(`${name}:${key}`);
        }
      }
    }
    expect(mismatched).toEqual([]);
  });

  it('covers every validation errorKey the validators can return', () => {
    const keys = new Set(FLAT.en.map(([path]) => path));
    const missing = [
      'validation.amountRequired',
      'validation.amountInvalid',
      'validation.amountNotPositive',
      'validation.amountTooLarge',
      'validation.phoneInvalid',
      'validation.qtyInvalid',
    ].filter((key) => !keys.has(key));
    expect(missing).toEqual([]);
  });
});
