import { newLocalId, readLocalList, RepoError, toRepoError, writeLocalList } from '@/lib/offline';
import { getWriteOwnerId, isLoginRequiredFailure } from '@/lib/dbErrors';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

import type { Person, PersonDraft } from './types';

/**
 * People repository — Supabase-first, offline-safe.
 *
 * - Supabase configured + signed in → RLS-scoped queries
 *   (`owner_id = auth.uid()`), mirrored to an AsyncStorage cache.
 * - No config / no session / network failure → the local cache is the
 *   store, so the UI keeps working in Expo Go and on dead mandi networks.
 * - Screens must catch and show `t('errors.<code>')` with a retry button;
 *   repositories never crash, they throw a coded `RepoError`.
 */

const PEOPLE_CACHE_KEY = 'mandi-people-v1';
const LOCAL_OWNER = 'local';

function nowIso(): string {
  return new Date().toISOString();
}

/** Signed-in owner id, or null when offline / not configured / logged out. */
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

function cleanDraft(draft: PersonDraft) {
  return {
    name: draft.name.trim(),
    photo_url: draft.photo_url ?? null,
    phone: draft.phone?.trim() ? draft.phone.trim() : null,
    type: draft.type,
    village: draft.village?.trim() ? draft.village.trim() : null,
    notes: draft.notes?.trim() ? draft.notes.trim() : null,
  };
}

export async function listPeople(): Promise<Person[]> {
  const ownerId = await getOwnerId();
  if (ownerId) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as Person[];
      await writeLocalList(PEOPLE_CACHE_KEY, rows);
      return rows;
    } catch (error) {
      const cached = await readLocalList<Person>(PEOPLE_CACHE_KEY);
      if (cached.length > 0) return cached;
      throw toRepoError(error);
    }
  }
  const local = await readLocalList<Person>(PEOPLE_CACHE_KEY);
  return [...local].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPerson(id: string): Promise<Person | null> {
  const ownerId = await getOwnerId();
  if (ownerId) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('people').select('*').eq('id', id).single();
      if (error) throw error;
      return (data ?? null) as Person | null;
    } catch (error) {
      const cached = await readLocalList<Person>(PEOPLE_CACHE_KEY);
      const found = cached.find((p) => p.id === id) ?? null;
      if (found) return found;
      throw toRepoError(error);
    }
  }
  const local = await readLocalList<Person>(PEOPLE_CACHE_KEY);
  return local.find((p) => p.id === id) ?? null;
}

export async function createPerson(draft: PersonDraft): Promise<Person> {
  const cleaned = cleanDraft(draft);
  // Live DB + no session: fail here with a coded error (screens show
  // `auth.loginRequired`) instead of attempting the remote insert RLS
  // would reject with raw Postgres English. Demo/offline stays local.
  const ownerId = await getWriteOwnerId();
  if (ownerId) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('people')
        .insert({ ...cleaned, owner_id: ownerId })
        .select()
        .single();
      if (error) throw error;
      const row = data as Person;
      const cached = await readLocalList<Person>(PEOPLE_CACHE_KEY);
      await writeLocalList(PEOPLE_CACHE_KEY, [row, ...cached.filter((p) => p.id !== row.id)]);
      return row;
    } catch (error) {
      // An RLS denial (e.g. the session died mid-write) is a login problem,
      // not an offline one — surface it instead of forking a local-only row.
      if (isLoginRequiredFailure(error)) throw new RepoError('loginRequired');
      // Supabase write failed (usually offline) — keep the person locally so
      // no data is lost; it syncs on the next configured write path.
      return saveLocalPerson(cleaned);
    }
  }
  return saveLocalPerson(cleaned);
}

async function saveLocalPerson(cleaned: ReturnType<typeof cleanDraft>): Promise<Person> {
  const row: Person = {
    id: newLocalId('person'),
    owner_id: LOCAL_OWNER,
    created_at: nowIso(),
    ...cleaned,
  };
  const cached = await readLocalList<Person>(PEOPLE_CACHE_KEY);
  await writeLocalList(PEOPLE_CACHE_KEY, [row, ...cached]);
  return row;
}

export async function deletePerson(id: string): Promise<void> {
  // Same session gate as createPerson: live DB + no session → coded
  // `loginRequired` instead of a remote delete RLS would reject.
  const ownerId = await getWriteOwnerId();
  if (ownerId) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('people').delete().eq('id', id);
      if (error) throw error;
    } catch {
      // Server delete failed (usually offline) — still remove locally so the
      // UI stays truthful. The server row is dropped on the next online
      // delete; see README TODOs for full sync.
    }
  }
  const cached = await readLocalList<Person>(PEOPLE_CACHE_KEY);
  await writeLocalList(
    PEOPLE_CACHE_KEY,
    cached.filter((p) => p.id !== id),
  );
}
