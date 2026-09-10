import { computeBalance } from '@/features/khata/repository';
import type { KhataEntry } from '@/features/khata/types';
import {
  groupEntriesByDate,
  parseDateKey,
  shiftDateKey,
  todayKey,
  totalsByKind,
} from '@/features/khata/types';
import type { KhataKind } from '@/lib/database.types';

let seq = 0;

/** Minimal valid row; override what the case needs. */
function makeEntry(overrides: Partial<KhataEntry> = {}): KhataEntry {
  seq += 1;
  return {
    id: `entry_${seq}`,
    owner_id: 'local',
    person_id: 'person_1',
    date: '2026-09-10',
    kind: 'credit',
    amount: 100,
    method: 'cash',
    note: null,
    created_at: `2026-09-10T10:00:${String(seq).padStart(2, '0')}.000Z`,
    ...overrides,
  };
}

describe('computeBalance', () => {
  it('is zero for an empty ledger', () => {
    expect(computeBalance([])).toBe(0);
  });

  it('adds credit, subtracts debit, adds payment (locked convention)', () => {
    const entries: Pick<KhataEntry, 'kind' | 'amount'>[] = [
      { kind: 'credit', amount: 100 },
      { kind: 'debit', amount: 40 },
      { kind: 'payment', amount: 10 },
    ];
    expect(computeBalance(entries)).toBe(70);
  });

  it('goes negative when I owe them more', () => {
    expect(computeBalance([{ kind: 'debit', amount: 500 }])).toBe(-500);
  });

  it('a full settlement returns the balance to zero', () => {
    expect(
      computeBalance([
        { kind: 'credit', amount: 250 },
        { kind: 'payment', amount: 250 },
        { kind: 'debit', amount: 500 },
      ]),
    ).toBe(0);
  });
});

describe('groupEntriesByDate', () => {
  it('returns newest day first', () => {
    const groups = groupEntriesByDate([
      makeEntry({ date: '2026-09-08' }),
      makeEntry({ date: '2026-09-10' }),
      makeEntry({ date: '2026-09-09' }),
    ]);
    expect(groups.map((g) => g.date)).toEqual(['2026-09-10', '2026-09-09', '2026-09-08']);
  });

  it('orders items inside a day newest-created first', () => {
    const groups = groupEntriesByDate([
      makeEntry({ created_at: '2026-09-10T09:00:00.000Z', amount: 1 }),
      makeEntry({ created_at: '2026-09-10T12:00:00.000Z', amount: 2 }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((e) => e.amount)).toEqual([2, 1]);
  });

  it('computes the day total as credit+payment minus debit', () => {
    const groups = groupEntriesByDate([
      makeEntry({ kind: 'credit', amount: 100 }),
      makeEntry({ kind: 'debit', amount: 30 }),
      makeEntry({ kind: 'payment', amount: 20 }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].dayTotal).toBe(90);
  });

  it('returns an empty list for an empty ledger', () => {
    expect(groupEntriesByDate([])).toEqual([]);
  });
});

describe('totalsByKind', () => {
  it('sums each kind separately for the share summary', () => {
    const kinds: KhataKind[] = ['credit', 'credit', 'debit', 'payment'];
    const amounts = [100, 50, 30, 20];
    const entries = kinds.map((kind, i) => makeEntry({ kind, amount: amounts[i] }));
    expect(totalsByKind(entries)).toEqual({ credit: 150, debit: 30, payment: 20 });
  });

  it('starts every kind at zero', () => {
    expect(totalsByKind([])).toEqual({ credit: 0, debit: 0, payment: 0 });
  });
});

describe('date-key helpers', () => {
  it('parses a YYYY-MM-DD key as local noon (no TZ day-shift)', () => {
    const date = parseDateKey('2026-09-10');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(10);
    expect(date.getHours()).toBe(12);
  });

  it('shifts keys across month boundaries for the day stepper', () => {
    expect(shiftDateKey('2026-09-01', -1)).toBe('2026-08-31');
    expect(shiftDateKey('2026-09-10', 1)).toBe('2026-09-11');
    expect(shiftDateKey('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('builds today as a local YYYY-MM-DD key', () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    expect(todayKey()).toBe(`${now.getFullYear()}-${month}-${day}`);
  });
});
