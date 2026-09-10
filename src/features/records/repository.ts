import type { SaleExpenses, SaleRecord, SaleDraft } from './types';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

import { addDemoSale, deleteDemoSale, demoId, getDemoSales } from './demo';

/**
 * Sale records repository (STUB for I/O; pure money math is implemented).
 *
 * TODO(feature:sale-entry): implement against Supabase, RLS-scoped to the
 * owner. Invariant (also in `supabase/migrations.sql`):
 *   total = qty_kg × rate_per_kg
 *   net   = total − (hamali + tolai + commission + transport + other)
 */

export function totalExpenses(expenses: SaleExpenses): number {
  return (
    (expenses.hamali ?? 0) +
    (expenses.tolai ?? 0) +
    (expenses.commission ?? 0) +
    (expenses.transport ?? 0) +
    (expenses.other ?? 0)
  );
}

export function computeTotal(qtyKg: number, ratePerKg: number): number {
  return Math.round(qtyKg * ratePerKg * 100) / 100;
}

export function computeNet(total: number, expenses: SaleExpenses): number {
  return Math.round((total - totalExpenses(expenses)) * 100) / 100;
}

export async function listSales(): Promise<SaleRecord[]> {
  if (!isSupabaseConfigured()) return getDemoSales();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('sale_records')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

/** One day's sales, newest first — powers the daily list. */
export async function listSalesByDay(dateISO: string): Promise<SaleRecord[]> {
  if (!isSupabaseConfigured()) {
    return getDemoSales().filter((s) => s.date === dateISO);
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('sale_records')
    .select('*')
    .eq('date', dateISO)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

/** Every sale for one person, newest first — powers the per-person list. */
export async function listSalesForPerson(personId: string): Promise<SaleRecord[]> {
  if (!isSupabaseConfigured()) {
    return getDemoSales().filter((s) => s.person_id === personId);
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('sale_records')
    .select('*')
    .eq('person_id', personId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

/**
 * Insert a sale. Totals are DERIVED here (never trusted from the caller):
 * total = qty × rate, net = total − expenses. `owner_id` always comes from
 * the live session, never from client state (RLS rule).
 */
export async function addSale(draft: SaleDraft): Promise<SaleRecord> {
  const total = computeTotal(draft.qty_kg, draft.rate_per_kg);
  const net = computeNet(total, draft.expenses);
  if (!isSupabaseConfigured()) {
    const row: SaleRecord = {
      id: demoId('demo-s'),
      owner_id: 'demo-owner',
      person_id: draft.person_id ?? null,
      date: draft.date,
      commodity: draft.commodity,
      variety: draft.variety ?? null,
      qty_kg: draft.qty_kg,
      crates: draft.crates ?? null,
      rate_per_kg: draft.rate_per_kg,
      total,
      expenses: draft.expenses,
      net,
      photo_url: draft.photo_url ?? null,
      created_at: new Date().toISOString(),
    };
    addDemoSale(row);
    return row;
  }
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const { data, error } = await supabase
    .from('sale_records')
    .insert({
      owner_id: user.id,
      person_id: draft.person_id ?? null,
      date: draft.date,
      commodity: draft.commodity,
      variety: draft.variety ?? null,
      qty_kg: draft.qty_kg,
      crates: draft.crates ?? null,
      rate_per_kg: draft.rate_per_kg,
      total,
      expenses: draft.expenses,
      net,
      photo_url: draft.photo_url ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSale(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    deleteDemoSale(id);
    return;
  }
  const supabase = getSupabase();
  const { error } = await supabase.from('sale_records').delete().eq('id', id);
  if (error) throw error;
}
