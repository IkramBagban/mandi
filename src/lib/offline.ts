import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Offline-safe repository helpers.
 *
 * The app must never crash without network (mandi networks drop often), so
 * every repository reads/writes a local AsyncStorage mirror and only talks
 * to Supabase when it is configured AND a session exists. All helpers are
 * pure/small and shared so people + khata stay in sync.
 */

/** Coded repository failure — screens map `code` to `t('errors.<code>')`. */
export class RepoError extends Error {
  code: 'offline' | 'notConfigured' | 'failed';
  constructor(code: RepoError['code'], message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

/** Best-effort local id for offline rows (Supabase ids are uuids). */
export function newLocalId(prefix: string): string {
  const rand = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, '0');
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

/** Read a JSON list from AsyncStorage; corrupt/missing data → empty list. */
export async function readLocalList<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export async function writeLocalList<T>(key: string, list: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Cache write failure must never break the UI — Supabase is the source
    // of truth when configured; the cache is best-effort only.
  }
}

/** True for network/timeout/fetch failures (show the offline message). */
export function isOfflineFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /network|fetch|timeout|abort|offline|not[- ]?configured|failed to fetch/i.test(message) ||
    (typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'offline')
  );
}

export function toRepoError(error: unknown): RepoError {
  if (error instanceof RepoError) return error;
  if (isOfflineFailure(error)) {
    return new RepoError('offline', error instanceof Error ? error.message : undefined);
  }
  return new RepoError('failed', error instanceof Error ? error.message : undefined);
}
