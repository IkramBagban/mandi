import {
  getWriteOwnerId,
  isLoginRequiredFailure,
  isRateLimitedFailure,
  mapDbErrorToKey,
} from '@/lib/dbErrors';
import { RepoError } from '@/lib/offline';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// Boundary mock: same pattern as people-repository.test.ts — tests control
// "configured / signed-in / transport failure" here, never the network.
jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(),
  getSupabase: jest.fn(),
}));

const mockIsConfigured = jest.mocked(isSupabaseConfigured);
const mockGetSupabase = jest.mocked(getSupabase);

function stubClient(user: { id: string } | null | 'throw'): void {
  mockIsConfigured.mockReturnValue(true);
  mockGetSupabase.mockReturnValue({
    auth: {
      getUser:
        user === 'throw'
          ? jest.fn().mockRejectedValue(new Error('Network request failed'))
          : jest.fn().mockResolvedValue({ data: { user } }),
    },
  } as any);
}

beforeEach(() => {
  mockIsConfigured.mockReset();
  mockGetSupabase.mockReset();
  mockIsConfigured.mockReturnValue(false);
});

describe('isLoginRequiredFailure', () => {
  it('matches the coded RepoError', () => {
    expect(isLoginRequiredFailure(new RepoError('loginRequired'))).toBe(true);
    expect(isLoginRequiredFailure(new RepoError('offline'))).toBe(false);
    expect(isLoginRequiredFailure(new RepoError('failed'))).toBe(false);
  });

  it.each([
    {
      code: '42501',
      message: 'new row violates row-level security policy for table "sale_records"',
    },
    { message: 'new row violates row-level security policy' },
    { message: 'Auth session missing!' },
    { status: 401, message: 'Unauthorized' },
  ])('treats RLS/session shape %p as login-required', (shape) => {
    expect(isLoginRequiredFailure(shape)).toBe(true);
  });

  it.each([
    new Error('Network request failed'),
    new Error('Something went wrong'),
    { code: '23505', message: 'duplicate key value' },
    { status: 429, message: 'Too Many Requests' },
  ])('does not treat %p as login-required', (error) => {
    expect(isLoginRequiredFailure(error)).toBe(false);
  });
});

describe('isRateLimitedFailure', () => {
  it('matches shaped 429 / over_request_rate_limit objects', () => {
    expect(isRateLimitedFailure({ status: 429, message: 'slow down' })).toBe(true);
    expect(isRateLimitedFailure({ code: 'over_request_rate_limit' })).toBe(true);
  });

  it('matches rate-limit wording even on plain Errors (message sniffing, like offline)', () => {
    expect(isRateLimitedFailure({ message: 'You have sent too many requests' })).toBe(true);
    expect(isRateLimitedFailure(new Error('429 Too Many Requests'))).toBe(true);
  });

  it('rejects network and generic failures', () => {
    expect(isRateLimitedFailure(new Error('Network request failed'))).toBe(false);
    expect(isRateLimitedFailure(new Error('boom'))).toBe(false);
  });
});

describe('mapDbErrorToKey', () => {
  it('maps RLS denials to auth.loginRequired, never raw Postgres English', () => {
    expect(
      mapDbErrorToKey({
        code: '42501',
        message: 'new row violates row-level security policy for table "sale_records"',
      }),
    ).toBe('auth.loginRequired');
    expect(mapDbErrorToKey(new RepoError('loginRequired'))).toBe('auth.loginRequired');
  });

  it('maps network failures to errors.offline', () => {
    expect(mapDbErrorToKey(new Error('Network request failed'))).toBe('errors.offline');
    expect(mapDbErrorToKey(new RepoError('offline'))).toBe('errors.offline');
  });

  it('maps rate limiting to errors.rateLimited', () => {
    expect(mapDbErrorToKey({ status: 429, message: 'Too Many Requests' })).toBe(
      'errors.rateLimited',
    );
  });

  it('maps anything else to errors.failed', () => {
    expect(mapDbErrorToKey(new Error('boom'))).toBe('errors.failed');
    expect(mapDbErrorToKey(new RepoError('failed'))).toBe('errors.failed');
  });

  it('prefers login-required over offline when both shapes overlap', () => {
    expect(mapDbErrorToKey(new RepoError('loginRequired', 'fetch failed'))).toBe(
      'auth.loginRequired',
    );
  });
});

describe('getWriteOwnerId', () => {
  it('returns null in demo/offline mode without touching Supabase', async () => {
    mockIsConfigured.mockReturnValue(false);
    await expect(getWriteOwnerId()).resolves.toBeNull();
    expect(mockGetSupabase).not.toHaveBeenCalled();
  });

  it('returns the session owner id when signed in', async () => {
    stubClient({ id: 'owner_1' });
    await expect(getWriteOwnerId()).resolves.toBe('owner_1');
  });

  it('throws coded loginRequired when configured but signed out', async () => {
    stubClient(null);
    const failure = await getWriteOwnerId().then(
      () => null,
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(RepoError);
    expect((failure as RepoError).code).toBe('loginRequired');
    expect(mapDbErrorToKey(failure)).toBe('auth.loginRequired');
  });

  it('resolves null (local path) when the session check itself cannot reach the server', async () => {
    stubClient('throw');
    await expect(getWriteOwnerId()).resolves.toBeNull();
  });
});
