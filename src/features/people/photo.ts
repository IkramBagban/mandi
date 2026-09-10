import * as ImagePicker from 'expo-image-picker';

import { STORAGE_BUCKETS, uploadPhoto } from '@/lib/upload';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { newLocalId } from '@/lib/offline';

/**
 * Person photo capture: camera or gallery → compressed upload.
 *
 * Returns a displayable `photo_url` in every case — the uploaded public URL
 * when Supabase is configured, otherwise the local file URI — so avatars
 * always render, even fully offline.
 */

export type PhotoOutcome =
  | { ok: true; uri: string }
  | { ok: false; reason: 'cancelled' | 'denied' | 'error' };

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

async function toOutcome(
  result: ImagePicker.ImagePickerResult,
): Promise<PhotoOutcome> {
  if (result.canceled) return { ok: false, reason: 'cancelled' };
  const uri = result.assets?.[0]?.uri;
  if (!uri) return { ok: false, reason: 'error' };
  return { ok: true, uri };
}

/** Open the camera for a square face photo. */
export async function takePersonPhoto(): Promise<PhotoOutcome> {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { ok: false, reason: 'denied' };
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    return toOutcome(result);
  } catch {
    return { ok: false, reason: 'error' };
  }
}

/** Pick a square face photo from the gallery. */
export async function pickPersonPhoto(): Promise<PhotoOutcome> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    return toOutcome(result);
  } catch {
    return { ok: false, reason: 'error' };
  }
}

/**
 * Compress + upload a person photo, returning a displayable URL.
 * Falls back to the local URI when Supabase is unavailable so the avatar
 * still shows. Never throws — photo loss must never block saving a person.
 */
export async function persistPersonPhoto(localUri: string): Promise<string> {
  if (!isSupabaseConfigured()) return localUri;
  try {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getUser();
    const owner = data.user?.id ?? 'local';
    const objectPath = `${owner}/${newLocalId('photo')}.jpg`;
    await uploadPhoto(localUri, STORAGE_BUCKETS.personPhotos, objectPath);
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.personPhotos)
      .getPublicUrl(objectPath);
    return urlData.publicUrl || localUri;
  } catch {
    return localUri;
  }
}
