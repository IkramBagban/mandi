import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';
import { mapDbErrorToKey } from '@/lib/dbErrors';
import { RepoError } from '@/lib/offline';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { listSales } from '@/features/records/repository';
import { saveSaleWithKhata, type SaveSaleInput } from '@/features/records/saveSale';

// Boundary mocks: no native modules, no network — tests control
// "configured / signed-in" at the supabase wrapper.
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(),
  getSupabase: jest.fn(),
}));

const mockIsConfigured = jest.mocked(isSupabaseConfigured);
const mockGetSupabase = jest.mocked(getSupabase);

function stubAuth(user: { id: string } | null): void {
  mockIsConfigured.mockReturnValue(true);
  mockGetSupabase.mockReturnValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
    from: jest.fn(),
    storage: { from: jest.fn() },
  } as any as SupabaseClient<Database>);
}

function makeInput(overrides: Partial<SaveSaleInput> = {}): SaveSaleInput {
  return {
    person_id: null, // walk-in: posts no khata mirror
    date: '2026-09-10',
    commodity: 'mosambi',
    variety: '1no',
    crates: null,
    qtyKg: 100,
    ratePerKg: 20,
    hamali: 0,
    tolai: 0,
    commissionPct: 0,
    transport: 0,
    other: 0,
    photoLocalUri: null,
    ...overrides,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  mockIsConfigured.mockReset();
  mockGetSupabase.mockReset();
  mockIsConfigured.mockReturnValue(false);
});

describe('saveSaleWithKhata session gate (the live RLS bug)', () => {
  it('keeps working fully offline in demo mode (no Supabase config)', async () => {
    const saved = await saveSaleWithKhata(makeInput());
    expect(saved.sale.id.startsWith('sale_')).toBe(true);
    expect(saved.sale.total).toBe(2000);
    expect(saved.sale.net).toBe(2000);
    expect(saved.khata).toBeNull(); // walk-in posts nothing
    await expect(listSales()).resolves.toHaveLength(1);
  });

  it('throws coded loginRequired (never raw RLS English) when configured but signed out', async () => {
    stubAuth(null);
    const failure = await saveSaleWithKhata(makeInput()).then(
      () => null,
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(RepoError);
    expect((failure as RepoError).code).toBe('loginRequired');
    expect(mapDbErrorToKey(failure)).toBe('auth.loginRequired');
    // Fail-fast: nothing was written locally either.
    await expect(listSales()).resolves.toEqual([]);
  });

  it('fails fast before the receipt-photo upload when signed out', async () => {
    stubAuth(null);
    const failure = await saveSaleWithKhata(
      makeInput({ photoLocalUri: 'file://receipt.jpg' }),
    ).then(
      () => null,
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(RepoError);
    expect((failure as RepoError).code).toBe('loginRequired');
    // Fail-fast: neither Storage nor PostgREST was ever touched, so no RLS
    // denial (storage or table) could fire its raw English.
    const client = mockGetSupabase.mock.results[0]?.value as {
      from: jest.Mock;
      storage: { from: jest.Mock };
    };
    expect(client.from).not.toHaveBeenCalled();
    expect(client.storage.from).not.toHaveBeenCalled();
    await expect(listSales()).resolves.toEqual([]);
  });
});
