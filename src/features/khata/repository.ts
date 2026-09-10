import { newLocalId, readLocalList, toRepoError, writeLocalList } from '@/lib/offline';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

import type { KhataEntry, KhataEntryDraft, KhataEntryUpdate } from './types';

/**
 * Khata repository — Supabase-first, offline-safe (same pattern as people).
 *
 * Balance convention (kept from the foundation stub — do not flip signs):
 * `credit` = they owe me (lena, +), `debit` = I owe them (dena, −),
 * `payment` = settled against the balance (+). Confirm the payment sign
 * with real traders before any money moves on it (see README TODOs).
 */

/** Net balance for a person: positive = they owe me, negative = I owe them. */
export function computeBalance(entries: Pick<KhataEntry, 'kind' | 'amount'>[]): number {
  return entries.reduce((sum, e) => {
    if (e.kind === 'debit') return sum - Number(e.amount);
    return sum + Number(e.amount);
  }, 0);
}

const ENTRIES_CACHE_KEY = 'mandi-khata-entries-v1';
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

function cleanDraft(draft: KhataEntryDraft) {
  return {
    person_id: draft.person_id,
    date: draft.date,
    kind: draft.kind,
    amount: draft.amount,
    method: draft.method,
    note: draft.note?.trim() ? draft.note.trim() : null,
  };
}

function cleanUpdate(update: KhataEntryUpdate) {
  return {
    ...(update.date !== undefined ? { date: update.date } : {}),
    ...(update.kind !== undefined ? { kind: update.kind } : {}),
    ...(update.amount !== undefined ? { amount: update.amount } : {}),
    ...(update.method !== undefined ? { method: update.method } : {}),
    ...(update.note !== undefined ? { note: update.note?.trim() ? update.note.trim() : null } : {}),
  };
}

function sortNewest(entries: KhataEntry[]): KhataEntry[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.created_at < b.created_at ? 1 : -1;
  });
}

export async function listEntries(personId: string): Promise<KhataEntry[]> {
  const ownerId = await getOwnerId();
  if (ownerId) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('khata_entries')
        .select('*')
        .eq('person_id', personId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as KhataEntry[];
      const cached = await readLocalList<KhataEntry>(ENTRIES_CACHE_KEY);
      const others = cached.filter((e) => e.person_id !== personId);
      await writeLocalList(ENTRIES_CACHE_KEY, [...rows, ...others]);
      return rows;
    } catch (error) {
      const cached = await readLocalList<KhataEntry>(ENTRIES_CACHE_KEY);
      const mine = cached.filter((e) => e.person_id === personId);
      if (mine.length > 0) return sortNewest(mine);
      throw toRepoError(error);
    }
  }
  const cached = await readLocalList<KhataEntry>(ENTRIES_CACHE_KEY);
  return sortNewest(cached.filter((e) => e.person_id === personId));
}

export async function addEntry(draft: KhataEntryDraft): Promise<KhataEntry> {
  const cleaned = cleanDraft(draft);
  const ownerId = await getOwnerId();
  if (ownerId) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('khata_entries')
        .insert({ ...cleaned, owner_id: ownerId })
        .select()
        .single();
      if (error) throw error;
      const row = data as KhataEntry;
      const cached = await readLocalList<KhataEntry>(ENTRIES_CACHE_KEY);
      await writeLocalList(ENTRIES_CACHE_KEY, [row, ...cached.filter((e) => e.id !== row.id)]);
      return row;
    } catch {
      return saveLocalEntry(cleaned);
    }
  }
  return saveLocalEntry(cleaned);
}

async function saveLocalEntry(cleaned: ReturnType<typeof cleanDraft>): Promise<KhataEntry> {
  const row: KhataEntry = {
    id: newLocalId('entry'),
    owner_id: LOCAL_OWNER,
    created_at: nowIso(),
    ...cleaned,
  };
  const cached = await readLocalList<KhataEntry>(ENTRIES_CACHE_KEY);
  await writeLocalList(ENTRIES_CACHE_KEY, [row, ...cached]);
  return row;
}

export async function updateEntry(id: string, update: KhataEntryUpdate): Promise<KhataEntry> {
  const cleaned = cleanUpdate(update);
  const ownerId = await getOwnerId();
  if (ownerId) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('khata_entries')
        .update(cleaned)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const row = data as KhataEntry;
      const cached = await readLocalList<KhataEntry>(ENTRIES_CACHE_KEY);
      await writeLocalList(
        ENTRIES_CACHE_KEY,
        cached.map((e) => (e.id === id ? row : e)),
      );
      return row;
    } catch {
      return updateLocalEntry(id, cleaned);
    }
  }
  return updateLocalEntry(id, cleaned);
}

async function updateLocalEntry(
  id: string,
  cleaned: ReturnType<typeof cleanUpdate>,
): Promise<KhataEntry> {
  const cached = await readLocalList<KhataEntry>(ENTRIES_CACHE_KEY);
  const existing = cached.find((e) => e.id === id);
  if (!existing) throw toRepoError(new Error('entry not found'));
  const updated: KhataEntry = { ...existing, ...cleaned };
  await writeLocalList(
    ENTRIES_CACHE_KEY,
    cached.map((e) => (e.id === id ? updated : e)),
  );
  return updated;
}

export async function deleteEntry(id: string): Promise<void> {
  const ownerId = await getOwnerId();
  if (ownerId) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('khata_entries').delete().eq('id', id);
      if (error) throw error;
    } catch {
      // Offline — still remove locally so the UI stays truthful.
    }
  }
  const cached = await readLocalList<KhataEntry>(ENTRIES_CACHE_KEY);
  await writeLocalList(
    ENTRIES_CACHE_KEY,
    cached.filter((e) => e.id !== id),
  );
}

/** Remove every entry of a person (used after deleting the person). */
export async function deleteEntriesForPerson(personId: string): Promise<void> {
  const cached = await readLocalList<KhataEntry>(ENTRIES_CACHE_KEY);
  await writeLocalList(
    ENTRIES_CACHE_KEY,
    cached.filter((e) => e.person_id !== personId),
  );
}
