import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { getSupabase, isSupabaseConfigured } from './supabase';

/**
 * Photo pipeline: compress on-device BEFORE uploading to Supabase Storage.
 *
 * Photos only need to be *recognizable* (whose face / which lot), so we
 * shrink aggressively: max 1024px wide, JPEG quality 0.7. This keeps uploads
 * fast on 2G/3G mandi networks and storage bills tiny.
 */

export const PHOTO_MAX_WIDTH = 1024;
export const PHOTO_QUALITY = 0.7;

export const STORAGE_BUCKETS = {
  /** Person profile photos. */
  personPhotos: 'person-photos',
  /** Sale lot photos (weigh-slip, heap, truck). */
  recordPhotos: 'record-photos',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export interface CompressedPhoto {
  uri: string;
  width: number;
  height: number;
}

/** Shrink a local photo; returns the compressed file + its dimensions. */
export async function compressPhoto(localUri: string): Promise<CompressedPhoto> {
  const imageRef = await ImageManipulator.manipulate(localUri)
    .resize({ width: PHOTO_MAX_WIDTH })
    .renderAsync();
  const result = await imageRef.saveAsync({
    compress: PHOTO_QUALITY,
    format: SaveFormat.JPEG,
  });
  return { uri: result.uri, width: result.width, height: result.height };
}

export interface UploadResult {
  /** Public/storage path stored in `photo_url` columns. */
  path: string;
}

/**
 * Compress + upload a photo to Supabase Storage.
 *
 * TODO (feature worker): wire to an image picker (expo-image-picker) and to
 * the auth session for `owner_id`-scoped paths like `<owner_id>/<uuid>.jpg`.
 * Requires the private buckets + policies in `supabase/migrations.sql`.
 */
export async function uploadPhoto(
  localUri: string,
  bucket: StorageBucket,
  objectPath: string,
): Promise<UploadResult> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured — cannot upload photos yet.');
  }
  const compressed = await compressPhoto(localUri);
  const supabase = getSupabase();

  const response = await fetch(compressed.uri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(bucket).upload(objectPath, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  return { path: `${bucket}/${objectPath}` };
}
