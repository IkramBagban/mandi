import { newLocalId, readLocalList, RepoError, toRepoError, writeLocalList } from '@/lib/offline';
import { getWriteOwnerId, isLoginRequiredFailure } from '@/lib/dbErrors';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

import type { SaleExpenses, SaleRecord, SaleDraft } from './types';

/**
 * Sale records repository — Supabase-first, offline-safe (same pattern as
 * people + khata: AsyncStorage mirror, Supabase when configured + signed in).
 *
 * Invariant (also in `supabase/migrations.sql`):
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

const SALES_CACHE_KEY = 'mandi-sales-v1';
const LOCAL_OWNER = 'local';

function nowIso(): string {
  return new Date().toISOString();
}

async function getOwnerId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

function cleanDraft(draft: SaleDraft) {
  return {
    person_id: draft.person_id ?? null,
    date: draft.date,
    commodity: draft.commodity.trim(),
    variety: draft.variety?.trim() ? draft.variety.trim() : null,
    qty_kg: draft.qty_kg,
    crates: draft.crates ?? null,
    rate_per_kg: draft.rate_per_kg,
    photo_url: draft.photo_url ?? null,
  };
}

function sortNewest(sales: SaleRecord[]): SaleRecord[] {
  return [...sales].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.created_at < b.created_at ? 1 : -1;
  });
}

async function fetchAll(ownerId: string | null): Promise<SaleRecord[]> {
  if (ownerId) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('sale_records')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      const rows = (data ?? []) as SaleRecord[];
      await writeLocalList(SALES_CACHE_KEY, rows);
      return rows;
    } catch (error) {
      const cached = await readLocalList<SaleRecord>(SALES_CACHE_KEY);
      if (cached.length > 0) return sortNewest(cached);
      throw toRepoError(error);
    }
  }
  const cached = await readLocalList<SaleRecord>(SALES_CACHE_KEY);
  return sortNewest(cached);
}

export async function listSales(): Promise<SaleRecord[]> {
  return fetchAll(await getOwnerId());
}

/** One day's sales, newest first — powers the daily list. */
export async function listSalesByDay(dateISO: string): Promise<SaleRecord[]> {
  const all = await fetchAll(await getOwnerId());
  return all.filter((s) => s.date === dateISO);
}

/** Every sale for one person, newest first — powers the per-person list. */
export async function listSalesForPerson(personId: string): Promise<SaleRecord[]> {
  const all = await fetchAll(await getOwnerId());
  return all.filter((s) => s.person_id === personId);
}

/**
 * Insert a sale. Totals are DERIVED here (never trusted from the caller):
 * total = qty × rate, net = total − expenses. `owner_id` always comes from
 * the live session, never from client state (RLS rule).
 */
export async function addSale(draft: SaleDraft): Promise<SaleRecord> {
  const cleaned = cleanDraft(draft);
  const total = computeTotal(cleaned.qty_kg, cleaned.rate_per_kg);
  const net = computeNet(total, draft.expenses);
  // Live DB + no session → coded `loginRequired` (screens show
  // `auth.loginRequired`), never a remote attempt RLS would reject.
  const ownerId = await getWriteOwnerId();
  if (ownerId) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('sale_records')
        .insert({ ...cleaned, owner_id: ownerId, total, expenses: draft.expenses, net })
        .select()
        .single();
      if (error) throw error;
      const row = data as SaleRecord;
      const cached = await readLocalList<SaleRecord>(SALES_CACHE_KEY);
      await writeLocalList(SALES_CACHE_KEY, [row, ...cached.filter((s) => s.id !== row.id)]);
      return row;
    } catch (error) {
      // An RLS denial (e.g. the session died mid-write) is a login problem,
      // not an offline one — surface it instead of forking a local-only row.
      if (isLoginRequiredFailure(error)) throw new RepoError('loginRequired');
      // Supabase write failed (usually offline) — keep locally, same as khata.
      return saveLocalSale(cleaned, total, draft.expenses, net);
    }
  }
  return saveLocalSale(cleaned, total, draft.expenses, net);
}

async function saveLocalSale(
  cleaned: ReturnType<typeof cleanDraft>,
  total: number,
  expenses: SaleExpenses,
  net: number,
): Promise<SaleRecord> {
  const row: SaleRecord = {
    id: newLocalId('sale'),
    owner_id: LOCAL_OWNER,
    created_at: nowIso(),
    total,
    expenses,
    net,
    ...cleaned,
  };
  const cached = await readLocalList<SaleRecord>(SALES_CACHE_KEY);
  await writeLocalList(SALES_CACHE_KEY, [row, ...cached]);
  return row;
}

export async function deleteSale(id: string): Promise<void> {
  // Same session gate as addSale.
  const ownerId = await getWriteOwnerId();
  if (ownerId) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('sale_records').delete().eq('id', id);
      if (error) throw error;
    } catch {
      // Offline — still remove locally so the UI stays truthful.
    }
  }
  const cached = await readLocalList<SaleRecord>(SALES_CACHE_KEY);
  await writeLocalList(
    SALES_CACHE_KEY,
    cached.filter((s) => s.id !== id),
  );
}
