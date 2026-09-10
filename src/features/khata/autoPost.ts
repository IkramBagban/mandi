import type { SaleRecord } from '@/features/records/types';

import { addEntry } from './repository';
import type { KhataEntry, KhataEntryDraft } from './types';

/**
 * AUTO-POST: sale → khata. THE single-writer rule for sale-linked ledger rows.
 *
 * Full save flow (orchestrated by `saveSaleWithKhata` in `features/records`):
 *
 *   1. `saveSaleWithKhata` inserts the `sale_records` row FIRST. The sale is
 *      the source of truth — money math (total/net) is derived at insert.
 *   2. It then calls `postSaleToKhata(sale)` below, which inserts exactly ONE
 *      `khata_entries` row linked by person + date + note.
 *   3. If step 2 fails, the orchestrator compensates by deleting the sale row
 *      from step 1, so a sale can never exist without its khata mirror
 *      (and vice versa — no double entry, no orphan).
 *
 * Mapping: a mandi sale means *I owe the farmer the net* (dena), so the entry
 * is `kind: 'debit'`, `method: 'udhaar'`, `amount: sale.net`.
 * Walk-in sales (`person_id` null) and zero-net sales post NOTHING.
 *
 * Writes go through the canonical offline-safe `addEntry` in `./repository`
 * (Supabase + local cache, owned by the people-khata lane) — this file only
 * owns the sale→draft mapping, never storage.
 *
 * No other module may insert khata rows for sales. (True atomicity would need
 * a Postgres function/trigger — tracked as a TODO in `saveSale.ts`.)
 */

/** Machine note linking the entry back to its sale. ASCII on purpose: it is a
 *  ledger reference, not UI text, so it is intentionally NOT localized. */
export function saleNoteFor(sale: SaleRecord): string {
  return `sale:${sale.commodity} ${sale.qty_kg}kg @ ${sale.rate_per_kg}/kg`;
}

/** Build the khata draft for a sale, or null when nothing should be posted. */
export function saleToKhataDraft(sale: SaleRecord): KhataEntryDraft | null {
  if (!sale.person_id) return null;
  if (!Number.isFinite(sale.net) || sale.net <= 0) return null;
  return {
    person_id: sale.person_id,
    date: sale.date,
    kind: 'debit',
    amount: sale.net,
    method: 'udhaar',
    note: saleNoteFor(sale),
  };
}

/** Post the sale's mirror entry. Resolves null when no post is needed. */
export async function postSaleToKhata(sale: SaleRecord): Promise<KhataEntry | null> {
  const draft = saleToKhataDraft(sale);
  if (!draft) return null;
  return addEntry(draft);
}
