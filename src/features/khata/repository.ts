import type { KhataEntry, KhataEntryDraft } from './types';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

import { addDemoEntry, getDemoEntries, makeDemoEntryId } from './demo';

/**
 * Khata repository (STUB for I/O; pure balance math is implemented).
 *
 * TODO(feature:khata-ledger): implement against Supabase, RLS-scoped to the
 * owner like all other tables. Convention: `credit` = they owe me (lena),
 * `debit` = I owe them (dena), `payment` = settled against the balance.
 */

/** Net balance for a person: positive = they owe me, negative = I owe them. */
export function computeBalance(entries: Pick<KhataEntry, 'kind' | 'amount'>[]): number {
  return entries.reduce((sum, e) => {
    if (e.kind === 'debit') return sum - e.amount;
    return sum + e.amount;
  }, 0);
}

export async function listEntries(personId: string): Promise<KhataEntry[]> {
  if (!isSupabaseConfigured()) {
    return getDemoEntries().filter((e) => e.person_id === personId);
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('khata_entries')
    .select('*')
    .eq('person_id', personId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data;
}

/**
 * Every entry for the signed-in owner, newest first. Powers the Udhaari
 * dashboard (`summarizeUdhaari` in `./udhaari`). Khata screens (owned by
 * another worker) should reuse this — never re-query per person in a loop.
 */
export async function listAllEntries(): Promise<KhataEntry[]> {
  if (!isSupabaseConfigured()) return getDemoEntries();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('khata_entries')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return data;
}

/**
 * Insert one entry. `owner_id` always comes from the live session, never
 * from client state (RLS rule). Amounts must be > 0 (DB check).
 */
export async function addEntry(draft: KhataEntryDraft): Promise<KhataEntry> {
  if (!Number.isFinite(draft.amount) || draft.amount <= 0) {
    throw new Error('Khata amount must be more than zero.');
  }
  if (!isSupabaseConfigured()) {
    return addDemoEntry({
      id: makeDemoEntryId(),
      owner_id: 'demo-owner',
      person_id: draft.person_id,
      date: draft.date,
      kind: draft.kind,
      amount: Math.round(draft.amount * 100) / 100,
      method: draft.method,
      note: draft.note ?? null,
      created_at: new Date().toISOString(),
    });
  }
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const { data, error } = await supabase
    .from('khata_entries')
    .insert({
      owner_id: user.id,
      person_id: draft.person_id,
      date: draft.date,
      kind: draft.kind,
      amount: draft.amount,
      method: draft.method,
      note: draft.note ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEntry(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  const { error } = await supabase.from('khata_entries').delete().eq('id', id);
  if (error) throw error;
}
