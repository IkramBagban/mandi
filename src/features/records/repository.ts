import type { SaleExpenses, SaleRecord, SaleDraft } from './types';

/**
 * Sale records repository (STUB for I/O; pure money math is implemented).
 *
 * TODO(feature:sale-entry): implement against Supabase, RLS-scoped to the
 * owner. Invariant (also in `supabase/migrations.sql`):
 *   total = qty_kg × rate_per_kg
 *   net   = total − (hamali + tolai + commission + transport)
 */

export function totalExpenses(expenses: SaleExpenses): number {
  return (
    (expenses.hamali ?? 0) +
    (expenses.tolai ?? 0) +
    (expenses.commission ?? 0) +
    (expenses.transport ?? 0)
  );
}

export function computeTotal(qtyKg: number, ratePerKg: number): number {
  return Math.round(qtyKg * ratePerKg * 100) / 100;
}

export function computeNet(total: number, expenses: SaleExpenses): number {
  return Math.round((total - totalExpenses(expenses)) * 100) / 100;
}

export async function listSales(): Promise<SaleRecord[]> {
  throw new Error('TODO: listSales is not implemented yet.');
}

export async function addSale(_draft: SaleDraft): Promise<SaleRecord> {
  throw new Error('TODO: addSale is not implemented yet.');
}

export async function deleteSale(_id: string): Promise<void> {
  throw new Error('TODO: deleteSale is not implemented yet.');
}
