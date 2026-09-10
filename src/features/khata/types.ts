import type { KhataEntryRow, KhataKind, PayMethod } from '@/lib/database.types';

export type KhataEntry = KhataEntryRow;
export type { KhataKind, PayMethod };

/** Entry kinds shown as three big icon chips (give / take / settle). */
export const KHATA_KINDS = ['credit', 'debit', 'payment'] as const;

/** Payment methods shown as three big chips. */
export const PAY_METHODS = ['cash', 'upi', 'udhaar'] as const;

/** Fields the new-entry form collects. `owner_id` is attached in the repo. */
export interface KhataEntryDraft {
  person_id: string;
  date: string;
  kind: KhataKind;
  amount: number;
  method: PayMethod;
  note?: string | null;
}

/** Fields the edit-entry form may change. */
export interface KhataEntryUpdate {
  date?: string;
  kind?: KhataKind;
  amount?: number;
  method?: PayMethod;
  note?: string | null;
}

/** One day in the date-wise history: newest day first. */
export interface EntriesDayGroup {
  date: string;
  items: KhataEntry[];
  /** Net movement that day (credit+payment minus debit). */
  dayTotal: number;
}

/** Group entries newest-day-first for the history list. */
export function groupEntriesByDate(entries: KhataEntry[]): EntriesDayGroup[] {
  const byDate = new Map<string, KhataEntry[]>();
  for (const entry of entries) {
    const list = byDate.get(entry.date) ?? [];
    list.push(entry);
    byDate.set(entry.date, list);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, items]) => ({
      date,
      items: [...items].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
      dayTotal: items.reduce((sum, e) => {
        const amount = Number(e.amount);
        return e.kind === 'debit' ? sum - amount : sum + amount;
      }, 0),
    }));
}

/** Totals per kind for the WhatsApp share summary. */
export function totalsByKind(entries: KhataEntry[]): Record<KhataKind, number> {
  const totals: Record<KhataKind, number> = { credit: 0, debit: 0, payment: 0 };
  for (const entry of entries) {
    totals[entry.kind] += Number(entry.amount);
  }
  return totals;
}

/** Local `YYYY-MM-DD` for today (no time-zone surprise from `toISOString`). */
export function todayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Shift a `YYYY-MM-DD` key by whole days (for the −1/+1 day stepper). */
export function shiftDateKey(key: string, deltaDays: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setDate(date.getDate() + deltaDays);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
