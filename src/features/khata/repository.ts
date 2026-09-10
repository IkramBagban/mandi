import type { KhataEntry, KhataEntryDraft } from './types';

/**
 * Khata repository (STUB for I/O; pure balance math is implemented).
 *
 * TODO(feature:khata-ledger): implement against Supabase, RLS-scoped to the
 * owner like all other tables. Convention: `credit` = they owe me (lena),
 * `debit` = I owe them (dena), `payment` = settled against the balance.
 */

/** Net balance for a person: positive = they owe me, negative = I owe them. */
export function computeBalance(entries: Pick<KhataEntry, 'kind' | 'amount'>[]): number {
  return entries.reduce((sum, e) => {
    if (e.kind === 'debit') return sum - e.amount;
    return sum + e.amount;
  }, 0);
}

export async function listEntries(_personId: string): Promise<KhataEntry[]> {
  throw new Error('TODO: listEntries is not implemented yet.');
}

export async function addEntry(_draft: KhataEntryDraft): Promise<KhataEntry> {
  throw new Error('TODO: addEntry is not implemented yet.');
}

export async function deleteEntry(_id: string): Promise<void> {
  throw new Error('TODO: deleteEntry is not implemented yet.');
}
