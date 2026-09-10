import type { SaleExpenses, SaleRecordRow } from '@/lib/database.types';

export type SaleRecord = SaleRecordRow;
export type { SaleExpenses };

/** Fields the new-sale form collects. Totals are derived, not typed. */
export interface SaleDraft {
  person_id?: string | null;
  date: string;
  commodity: string;
  variety?: string | null;
  qty_kg: number;
  crates?: number | null;
  rate_per_kg: number;
  expenses: SaleExpenses;
  photo_url?: string | null;
}
