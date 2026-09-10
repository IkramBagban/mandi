import type { KhataEntryRow, KhataKind, PayMethod } from '@/lib/database.types';

export type KhataEntry = KhataEntryRow;
export type { KhataKind, PayMethod };

/** Fields the new-entry form collects. `owner_id` is attached in the repo. */
export interface KhataEntryDraft {
  person_id: string;
  date: string;
  kind: KhataKind;
  amount: number;
  method: PayMethod;
  note?: string | null;
}
