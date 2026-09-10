import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  RepoError,
  isOfflineFailure,
  newLocalId,
  readLocalList,
  toRepoError,
  writeLocalList,
} from '@/lib/offline';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('newLocalId', () => {
  it('prefixes ids so offline rows are recognizable', () => {
    expect(newLocalId('person').startsWith('person_')).toBe(true);
    expect(newLocalId('entry').startsWith('entry_')).toBe(true);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => newLocalId('person')));
    expect(ids.size).toBe(50);
  });
});

describe('readLocalList / writeLocalList', () => {
  it('returns an empty list when nothing is cached', async () => {
    await expect(readLocalList('missing-key')).resolves.toEqual([]);
  });

  it('round-trips a list through the cache', async () => {
    await writeLocalList('k', [{ id: 'a' }, { id: 'b' }]);
    await expect(readLocalList<{ id: string }>('k')).resolves.toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('returns an empty list for corrupt JSON instead of throwing', async () => {
    await AsyncStorage.setItem('k', 'not-json{{{');
    await expect(readLocalList('k')).resolves.toEqual([]);
  });

  it('returns an empty list for valid JSON that is not an array', async () => {
    await AsyncStorage.setItem('k', JSON.stringify({ id: 'a' }));
    await expect(readLocalList('k')).resolves.toEqual([]);
  });
});

describe('isOfflineFailure', () => {
  it.each([
    'Network request failed',
    'fetch failed',
    'timeout of 0ms exceeded',
    'The user is offline',
    'Supabase is not configured',
    'failed to fetch',
  ])('treats %p as offline', (message) => {
    expect(isOfflineFailure(new Error(message))).toBe(true);
  });

  it('treats coded offline objects as offline', () => {
    expect(isOfflineFailure({ code: 'offline' })).toBe(true);
  });

  it.each(['Something went wrong', 'validation.phoneInvalid', 'entry not found'])(
    'treats %p as a real failure, not offline',
    (message) => {
      expect(isOfflineFailure(new Error(message))).toBe(false);
    },
  );
});

describe('toRepoError', () => {
  it('passes RepoError through untouched', () => {
    const original = new RepoError('offline', 'down');
    expect(toRepoError(original)).toBe(original);
  });

  it('maps network failures to the offline code', () => {
    const mapped = toRepoError(new Error('Network request failed'));
    expect(mapped).toBeInstanceOf(RepoError);
    expect(mapped.code).toBe('offline');
  });

  it('maps anything else to the failed code', () => {
    const mapped = toRepoError(new Error('Something went wrong'));
    expect(mapped).toBeInstanceOf(RepoError);
    expect(mapped.code).toBe('failed');
  });

  it('keeps the RepoError code set screens can translate', () => {
    for (const code of ['offline', 'notConfigured', 'failed'] as const) {
      expect(new RepoError(code).code).toBe(code);
    }
  });
});
