import type { Person } from '@/features/people/types';

import { calculateSale } from './calculations';
import { addDaysISO, todayISODate } from './dates';
import type { SaleRecord } from './types';

/**
 * Demo fallback used ONLY when Supabase is not configured (see `.env.example`).
 * Lets traders explore the sale form, lists, and dashboard in Expo Go with
 * zero setup. As soon as env vars exist, repositories talk to Supabase and
 * this data is never shown. Clearly fake names, clearly fake numbers.
 */

export const DEMO_PEOPLE: Person[] = [
  {
    id: 'demo-p1',
    owner_id: 'demo-owner',
    name: 'Ramesh Patil',
    photo_url: null,
    phone: '9876543210',
    type: 'farmer',
    village: 'Shirpur',
    notes: null,
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'demo-p2',
    owner_id: 'demo-owner',
    name: 'Sunita Pawar',
    photo_url: null,
    phone: '9812345678',
    type: 'farmer',
    village: 'Lasalgaon',
    notes: null,
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'demo-p3',
    owner_id: 'demo-owner',
    name: 'Anil Seth',
    photo_url: null,
    phone: '9898989898',
    type: 'trader',
    village: 'Nashik',
    notes: null,
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'demo-p4',
    owner_id: 'demo-owner',
    name: 'Kishor Jadhav',
    photo_url: null,
    phone: null,
    type: 'labour',
    village: 'Shirpur',
    notes: null,
    created_at: '2026-09-01T00:00:00Z',
  },
];

function demoSale(
  id: string,
  personId: string,
  date: string,
  commodity: string,
  variety: string,
  qtyKg: number,
  crates: number | null,
  ratePerKg: number,
  parts: { hamali: number; tolai: number; commissionPct: number; transport: number; other: number },
): SaleRecord {
  const calc = calculateSale({ qtyKg, ratePerKg, ...parts });
  return {
    id,
    owner_id: 'demo-owner',
    person_id: personId,
    date,
    commodity,
    variety,
    qty_kg: qtyKg,
    crates,
    rate_per_kg: ratePerKg,
    total: calc.total,
    expenses: calc.expenses,
    net: calc.net,
    photo_url: null,
    created_at: `${date}T08:00:00Z`,
  };
}

const today = todayISODate();
const yesterday = addDaysISO(today, -1);

const SEED_SALES: SaleRecord[] = [
  demoSale('demo-s1', 'demo-p1', today, 'mosambi', '1no', 120, 12, 45, {
    hamali: 200,
    tolai: 50,
    commissionPct: 5,
    transport: 150,
    other: 0,
  }),
  demoSale('demo-s2', 'demo-p2', today, 'santra', '2no', 85, 9, 32, {
    hamali: 150,
    tolai: 40,
    commissionPct: 5,
    transport: 120,
    other: 0,
  }),
  demoSale('demo-s3', 'demo-p2', yesterday, 'pyaz', 'mota', 400, 20, 18, {
    hamali: 300,
    tolai: 100,
    commissionPct: 4,
    transport: 400,
    other: 50,
  }),
];

/** Session-only sales added while unconfigured (lost on reload — by design). */
let sessionSales: SaleRecord[] = [];

export function getDemoSales(): SaleRecord[] {
  return [...sessionSales, ...SEED_SALES];
}

export function addDemoSale(row: SaleRecord): void {
  sessionSales = [row, ...sessionSales];
}

export function deleteDemoSale(id: string): void {
  sessionSales = sessionSales.filter((s) => s.id !== id);
}

/** Fake ids for demo rows (never sent to Supabase). */
export function demoId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1_000_000)}`;
}
