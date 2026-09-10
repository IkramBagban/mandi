import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  setPassword as repoSetPassword,
  signInWithPassword as repoSignInWithPassword,
} from '@/features/auth/repository';

// Boundary mock: the repository only talks to Supabase through this wrapper.
jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(),
  getSupabase: jest.fn(),
}));

const mockIsConfigured = jest.mocked(isSupabaseConfigured);
const mockGetSupabase = jest.mocked(getSupabase);

const OWNER_ID = 'owner_1';
const USER = { id: OWNER_ID, phone: '+919812345678' };

function stubAuth(auth: Record<string, jest.Mock>): void {
  mockIsConfigured.mockReturnValue(true);
  mockGetSupabase.mockReturnValue({ auth } as unknown as SupabaseClient<Database>);
}

beforeEach(() => {
  mockIsConfigured.mockReset();
  mockGetSupabase.mockReset();
  mockIsConfigured.mockReturnValue(true);
});

describe('signInWithPassword', () => {
  it('signs in with the E.164 phone and raw password', async () => {
    const signIn = jest.fn().mockResolvedValue({ data: { user: USER }, error: null });
    stubAuth({ signInWithPassword: signIn });

    await expect(
      repoSignInWithPassword({ phone: '9812345678', password: 'mandi12' }),
    ).resolves.toEqual({ id: OWNER_ID, phone: '+919812345678' });
    expect(signIn).toHaveBeenCalledWith({ phone: '+919812345678', password: 'mandi12' });
  });

  it('rejects short passwords client-side without touching Supabase', async () => {
    const signIn = jest.fn();
    stubAuth({ signInWithPassword: signIn });

    const failure = await repoSignInWithPassword({
      phone: '9812345678',
      password: '123',
    }).then(
      () => null,
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(Error);
    expect(signIn).not.toHaveBeenCalled();
  });

  it('propagates wrong-credential errors for the screen mapper', async () => {
    const signIn = jest
      .fn()
      .mockResolvedValue({ data: { user: null }, error: new Error('Invalid login credentials') });
    stubAuth({ signInWithPassword: signIn });

    const failure = await repoSignInWithPassword({
      phone: '9812345678',
      password: 'wrongpw',
    }).then(
      () => null,
      (error: unknown) => error,
    );
    expect((failure as Error).message).toBe('Invalid login credentials');
  });
});

describe('setPassword', () => {
  it('updates the password on the OTP-verify session', async () => {
    const updateUser = jest.fn().mockResolvedValue({ data: { user: USER }, error: null });
    stubAuth({ updateUser });

    await expect(repoSetPassword({ password: 'newpass1' })).resolves.toEqual({
      id: OWNER_ID,
      phone: '+919812345678',
    });
    expect(updateUser).toHaveBeenCalledWith({ password: 'newpass1' });
  });

  it('rejects short passwords before the network call', async () => {
    const updateUser = jest.fn();
    stubAuth({ updateUser });

    const failure = await repoSetPassword({ password: '123' }).then(
      () => null,
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(Error);
    expect(updateUser).not.toHaveBeenCalled();
  });
});
