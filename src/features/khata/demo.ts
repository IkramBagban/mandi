import { addDaysISO, todayISODate } from '@/features/records/dates';
import { demoId } from '@/features/records/demo';

import type { KhataEntry } from './types';

/**
 * Demo ledger used ONLY when Supabase is not configured. Person ids match
 * `DEMO_PEOPLE` in `features/records/demo` so avatars line up. Clearly fake.
 */

const today = todayISODate();

function entry(
  id: string,
  personId: string,
  date: string,
  kind: KhataEntry['kind'],
  amount: number,
  method: KhataEntry['method'],
  note: string | null,
): KhataEntry {
  return {
    id,
    owner_id: 'demo-owner',
    person_id: personId,
    date,
    kind,
    amount,
    method,
    note,
    created_at: `${date}T09:00:00Z`,
  };
}

const SEED_ENTRIES: KhataEntry[] = [
  entry(
    'demo-k1',
    'demo-p1',
    addDaysISO(today, -2),
    'credit',
    5000,
    'udhaar',
    'sale:mosambi 120kg',
  ),
  entry('demo-k2', 'demo-p1', today, 'payment', 2000, 'cash', null),
  entry('demo-k3', 'demo-p2', addDaysISO(today, -1), 'credit', 8500, 'udhaar', 'sale:santra 200kg'),
  entry('demo-k4', 'demo-p3', addDaysISO(today, -1), 'debit', 1200, 'udhaar', 'sale:pyaz advance'),
  entry('demo-k5', 'demo-p4', today, 'credit', 1500, 'udhaar', 'sale:tamatar 40kg'),
];

/** Session-only entries added while unconfigured (lost on reload — by design). */
let sessionEntries: KhataEntry[] = [];

export function getDemoEntries(): KhataEntry[] {
  return [...sessionEntries, ...SEED_ENTRIES];
}

export function addDemoEntry(row: KhataEntry): KhataEntry {
  sessionEntries = [row, ...sessionEntries];
  return row;
}

export function makeDemoEntryId(): string {
  return demoId('demo-k');
}
