import type { SupabaseClient } from '@supabase/supabase-js';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { Database } from '@/lib/database.types';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  PHOTO_MAX_WIDTH,
  PHOTO_QUALITY,
  STORAGE_BUCKETS,
  compressPhoto,
  uploadPhoto,
} from '@/lib/upload';

// Boundary mocks: option-building is exercised against these fakes —
// no native code and no network ever run.
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(),
  getSupabase: jest.fn(),
}));

const mockManipulate = ImageManipulator.manipulate as unknown as jest.Mock;
const mockIsConfigured = jest.mocked(isSupabaseConfigured);
const mockGetSupabase = jest.mocked(getSupabase);

const fakeBlob = { size: 42 };
const mockBlob = jest.fn();

const mockSaveAsync = jest.fn();
const mockRenderAsync = jest.fn();
const mockResize = jest.fn();
const mockUpload = jest.fn();
const mockFrom = jest.fn();

const originalFetch = globalThis.fetch;

function stubCompressor(): void {
  mockSaveAsync.mockResolvedValue({ uri: 'file://compressed.jpg', width: 800, height: 600 });
  mockRenderAsync.mockResolvedValue({ saveAsync: mockSaveAsync });
  mockResize.mockReturnValue({ renderAsync: mockRenderAsync });
  mockManipulate.mockReturnValue({ resize: mockResize });
}

function stubStorage(): void {
  mockUpload.mockResolvedValue({ error: null });
  mockFrom.mockReturnValue({ upload: mockUpload });
  mockGetSupabase.mockReturnValue({
    storage: { from: mockFrom },
  } as unknown as SupabaseClient<Database>);
}

beforeEach(() => {
  // Reset ONLY this file's boundary mocks: a global reset would also wipe
  // the AsyncStorage in-memory mock from tests/setup.ts.
  mockManipulate.mockReset();
  mockIsConfigured.mockReset();
  mockGetSupabase.mockReset();
  mockSaveAsync.mockReset();
  mockRenderAsync.mockReset();
  mockResize.mockReset();
  mockUpload.mockReset();
  mockFrom.mockReset();
  mockBlob.mockReset();
  stubCompressor();
  mockIsConfigured.mockReturnValue(true);
  stubStorage();
  mockBlob.mockResolvedValue(fakeBlob);
  globalThis.fetch = jest.fn().mockResolvedValue({ blob: mockBlob }) as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('photo pipeline constants', () => {
  it('caps uploads at 1024px / JPEG 0.7 for mandi networks', () => {
    expect(PHOTO_MAX_WIDTH).toBe(1024);
    expect(PHOTO_QUALITY).toBe(0.7);
  });

  it('names the person + sale-lot buckets', () => {
    expect(STORAGE_BUCKETS).toEqual({
      personPhotos: 'person-photos',
      recordPhotos: 'record-photos',
    });
  });
});

describe('compressPhoto', () => {
  it('builds the resize→render→save chain with the pipeline options', async () => {
    const result = await compressPhoto('file://orig.jpg');

    expect(mockManipulate).toHaveBeenCalledWith('file://orig.jpg');
    expect(mockResize).toHaveBeenCalledWith({ width: PHOTO_MAX_WIDTH });
    expect(mockRenderAsync).toHaveBeenCalledWith();
    expect(mockSaveAsync).toHaveBeenCalledWith({
      compress: PHOTO_QUALITY,
      format: SaveFormat.JPEG,
    });
    expect(result).toEqual({ uri: 'file://compressed.jpg', width: 800, height: 600 });
  });
});

describe('uploadPhoto', () => {
  it('refuses to upload when Supabase is not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    await expect(uploadPhoto('file://orig.jpg', 'person-photos', 'a.jpg')).rejects.toThrow(
      /not configured/i,
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('fetches the compressed file and uploads it as image/jpeg with upsert', async () => {
    const result = await uploadPhoto('file://orig.jpg', 'person-photos', 'owner/1.jpg');

    expect(globalThis.fetch).toHaveBeenCalledWith('file://compressed.jpg');
    expect(mockFrom).toHaveBeenCalledWith('person-photos');
    expect(mockUpload).toHaveBeenCalledWith('owner/1.jpg', fakeBlob, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    expect(result).toEqual({ path: 'person-photos/owner/1.jpg' });
  });

  it('surfaces storage errors to the caller', async () => {
    mockUpload.mockResolvedValue({ error: new Error('no such bucket') });
    await expect(uploadPhoto('file://orig.jpg', 'person-photos', 'owner/1.jpg')).rejects.toThrow(
      'no such bucket',
    );
  });
});
