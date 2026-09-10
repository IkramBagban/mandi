import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createPerson, deletePerson, getPerson, listPeople } from '@/features/people/repository';
import type { Person, PersonDraft } from '@/features/people/types';
import type { Database } from '@/lib/database.types';
import { RepoError } from '@/lib/offline';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// Boundary mock: the repository only talks to Supabase through this wrapper,
// so tests control "configured / signed-in / server rows / network failure"
// here and never touch the network.
jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(),
  getSupabase: jest.fn(),
}));

const mockIsConfigured = jest.mocked(isSupabaseConfigured);
const mockGetSupabase = jest.mocked(getSupabase);

function makePerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'person_1',
    owner_id: 'local',
    name: 'Ramesh Kumar',
    photo_url: null,
    phone: '9876543210',
    type: 'farmer',
    village: 'Lasalgaon',
    notes: null,
    created_at: '2026-09-10T10:00:00.000Z',
    ...overrides,
  };
}

function makeDraft(overrides: Partial<PersonDraft> = {}): PersonDraft {
  return { name: 'Ramesh Kumar', type: 'farmer', ...overrides };
}

/** Signed-in client whose `from()` behaviour is supplied per test. */
function stubSignedInClient(fromImpl: (table: string) => unknown): void {
  mockIsConfigured.mockReturnValue(true);
  mockGetSupabase.mockReturnValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'owner_1' } } }) },
    from: jest.fn().mockImplementation(fromImpl),
  } as unknown as SupabaseClient<Database>);
}

function stubSignedOutClient(): void {
  mockIsConfigured.mockReturnValue(true);
  mockGetSupabase.mockReturnValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
  } as unknown as SupabaseClient<Database>);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  // Reset ONLY the supabase boundary mocks: a global reset would also wipe
  // the AsyncStorage in-memory mock from tests/setup.ts and break the mirror.
  mockIsConfigured.mockReset();
  mockGetSupabase.mockReset();
  // Default world: no Supabase config (Expo Go / dead mandi network).
  mockIsConfigured.mockReturnValue(false);
});

describe('offline mirror (Supabase not configured)', () => {
  it('creates a local person with trimmed fields and blank-to-null cleaning', async () => {
    const row = await createPerson(
      makeDraft({ name: '  Ramesh  ', phone: '  ', village: '', notes: ' onion ' }),
    );
    expect(row.id.startsWith('person_')).toBe(true);
    expect(row.owner_id).toBe('local');
    expect(row.name).toBe('Ramesh');
    expect(row.phone).toBeNull();
    expect(row.village).toBeNull();
    expect(row.notes).toBe('onion');
  });

  it('lists local people sorted by name', async () => {
    await createPerson(makeDraft({ name: 'Suresh' }));
    await createPerson(makeDraft({ name: 'Anil' }));
    const names = (await listPeople()).map((p) => p.name);
    expect(names).toEqual(['Anil', 'Suresh']);
  });

  it('gets a person by id, or null when missing', async () => {
    const created = await createPerson(makeDraft());
    await expect(getPerson(created.id)).resolves.toMatchObject({ id: created.id });
    await expect(getPerson('nope')).resolves.toBeNull();
  });

  it('deletes a person locally', async () => {
    const created = await createPerson(makeDraft());
    await deletePerson(created.id);
    await expect(getPerson(created.id)).resolves.toBeNull();
    await expect(listPeople()).resolves.toEqual([]);
  });

  it('keeps every created id unique', async () => {
    const a = await createPerson(makeDraft({ name: 'A' }));
    const b = await createPerson(makeDraft({ name: 'B' }));
    expect(a.id).not.toBe(b.id);
  });
});

describe('Supabase-first with offline fallback (mocked client)', () => {
  it('returns server rows and mirrors them for offline use', async () => {
    const serverRows = [makePerson({ id: 'uuid_1', owner_id: 'owner_1' })];
    stubSignedInClient(() => ({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: serverRows, error: null }),
      }),
    }));

    await expect(listPeople()).resolves.toEqual(serverRows);

    // Same phone, now offline: the mirror serves the rows, newest logic intact.
    mockIsConfigured.mockReturnValue(false);
    await expect(listPeople()).resolves.toEqual(serverRows);
  });

  it('attaches the session owner_id on create', async () => {
    const created = makePerson({ id: 'uuid_9', owner_id: 'owner_1', name: 'Meena' });
    const insert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: created, error: null }),
      }),
    });
    stubSignedInClient(() => ({ insert }));

    await expect(createPerson(makeDraft({ name: 'Meena' }))).resolves.toEqual(created);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Meena', owner_id: 'owner_1' }),
    );
  });

  it('falls back to a local save when the server write fails', async () => {
    stubSignedInClient(() => ({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue(new Error('Network request failed')),
        }),
      }),
    }));

    const row = await createPerson(makeDraft({ name: 'Offline Ori' }));
    expect(row.id.startsWith('person_')).toBe(true);
    await expect(getPerson(row.id)).resolves.toMatchObject({ name: 'Offline Ori' });
  });

  it('serves the cache when the server list fails but rows are mirrored', async () => {
    const cached = makePerson({ id: 'uuid_2', owner_id: 'owner_1' });
    stubSignedInClient(() => ({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [cached], error: null }),
      }),
    }));
    await listPeople();

    stubSignedInClient(() => ({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockRejectedValue(new Error('Network request failed')),
      }),
    }));
    await expect(listPeople()).resolves.toEqual([cached]);
  });

  it('throws a coded RepoError when the server fails with an empty cache', async () => {
    stubSignedInClient(() => ({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockRejectedValue(new Error('boom')),
      }),
    }));
    const failure = await listPeople().then(
      () => null,
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(RepoError);
    expect((failure as RepoError).code).toBe('failed');
  });

  it('uses the local store when configured but signed out', async () => {
    stubSignedOutClient();
    const row = await createPerson(makeDraft({ name: 'Local Lal' }));
    expect(row.owner_id).toBe('local');
    await expect(listPeople()).resolves.toHaveLength(1);
  });

  it('deletes through the server and clears the mirror', async () => {
    const row = await createPerson(makeDraft({ name: 'Gone' }));
    const eq = jest.fn().mockResolvedValue({ error: null });
    stubSignedInClient(() => ({
      delete: jest.fn().mockReturnValue({ eq }),
    }));

    await deletePerson(row.id);
    expect(eq).toHaveBeenCalledWith('id', row.id);
    // Mirror is cleared regardless of online state.
    mockIsConfigured.mockReturnValue(false);
    await expect(listPeople()).resolves.toEqual([]);
  });
});
