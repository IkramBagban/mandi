import { postSaleToKhata } from '@/features/khata/autoPost';
import type { KhataEntry } from '@/features/khata/types';
import { STORAGE_BUCKETS, uploadPhoto } from '@/lib/upload';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

import { calculateSale, type SaleCalcInput } from './calculations';
import { addSale, deleteSale } from './repository';
import type { SaleRecord } from './types';

/**
 * SINGLE-WRITER SAVE FLOW — the only path that creates sales.
 *
 *   form state → `saveSaleWithKhata` → sale_records row + khata mirror row.
 *
 * Steps:
 *   1. Derive money with `calculateSale` (commission % → amount here, so the
 *      saved `expenses.commission` is always consistent with what was shown).
 *   2. Upload the receipt photo if one was picked (compressed on-device via
 *      `uploadPhoto`; skipped gracefully when Supabase is not configured —
 *      the local uri is kept so the demo still shows the photo).
 *   3. Insert the `sale_records` row via `addSale` (source of truth).
 *   4. Auto-post the mirror entry via `postSaleToKhata` (kind `debit` — I owe
 *      the farmer the net; see `khata/autoPost` for the full contract).
 *   5. If step 4 fails, compensate by deleting the row from step 3 and
 *      rethrow, so a sale NEVER exists without its khata mirror.
 *
 * TODO: replace steps 3–5 with a single Postgres RPC (`record_sale`) so the
 * pair commits atomically even if the app is killed mid-save.
 */

export interface SaveSaleInput extends SaleCalcInput {
  person_id: string | null;
  date: string;
  commodity: string;
  variety: string;
  crates: number | null;
  /** Local `file://` uri from the image picker, or null for no photo. */
  photoLocalUri: string | null;
}

export interface SavedSale {
  sale: SaleRecord;
  /** Null for walk-in (no person) or zero-net sales — nothing to post. */
  khata: KhataEntry | null;
}

async function maybeUploadPhoto(localUri: string | null): Promise<string | null> {
  if (!localUri) return null;
  if (!isSupabaseConfigured()) return localUri;
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  const owner = user?.id ?? 'unknown';
  const objectPath = `${owner}/${Date.now()}.jpg`;
  const { path } = await uploadPhoto(localUri, STORAGE_BUCKETS.recordPhotos, objectPath);
  return path;
}

export async function saveSaleWithKhata(input: SaveSaleInput): Promise<SavedSale> {
  const calc = calculateSale(input);

  const photo_url = await maybeUploadPhoto(input.photoLocalUri);

  const sale = await addSale({
    person_id: input.person_id,
    date: input.date,
    commodity: input.commodity,
    variety: input.variety || null,
    qty_kg: input.qtyKg,
    crates: input.crates,
    rate_per_kg: input.ratePerKg,
    expenses: calc.expenses,
    photo_url,
  });

  try {
    const khata = await postSaleToKhata(sale);
    return { sale, khata };
  } catch (err) {
    // Compensate: never leave a sale without its mirror entry.
    try {
      await deleteSale(sale.id);
    } catch {
      // Best effort — the original error is what the UI must show.
    }
    throw err;
  }
}
