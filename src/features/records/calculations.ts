import { normalizeDigits } from '@/lib/validation';

import { computeNet, computeTotal, totalExpenses } from './repository';
import type { SaleExpenses } from './types';

export const MAX_COMMISSION_PCT = 100;

/**
 * Single source of truth for sale math. The form, the live preview, and
 * `saveSaleWithKhata` all go through `calculateSale`, so the number the
 * trader sees is always the number that gets saved.
 */
export interface SaleCalcInput {
  qtyKg: number;
  ratePerKg: number;
  hamali: number;
  tolai: number;
  /** Commission as a percent of total (what the trader types). */
  commissionPct: number;
  transport: number;
  other: number;
}

export interface SaleCalc {
  total: number;
  /** Commission amount derived from `commissionPct`. */
  commission: number;
  expenses: SaleExpenses;
  expensesTotal: number;
  net: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Commission amount = total × pct / 100 (pct clamped to 0–100). */
export function commissionFromPercent(total: number, pct: number): number {
  const safe = Number.isFinite(pct) ? Math.min(Math.max(pct, 0), MAX_COMMISSION_PCT) : 0;
  return round2((total * safe) / 100);
}

export function calculateSale(input: SaleCalcInput): SaleCalc {
  const total = computeTotal(input.qtyKg, input.ratePerKg);
  const commission = commissionFromPercent(total, input.commissionPct);
  const expenses: SaleExpenses = {
    hamali: input.hamali,
    tolai: input.tolai,
    commission,
    transport: input.transport,
    other: input.other,
  };
  const expensesTotal = round2(totalExpenses(expenses));
  const net = computeNet(total, expenses);
  return { total, commission, expenses, expensesTotal, net };
}

export const ZERO_CALC_INPUT: SaleCalcInput = {
  qtyKg: 0,
  ratePerKg: 0,
  hamali: 0,
  tolai: 0,
  commissionPct: 0,
  transport: 0,
  other: 0,
};

// ---------------------------------------------------------------------------
// Lenient parsers for OPTIONAL numeric fields (expenses, crates, %).
//
// Required fields (qty, rate) use the strict `validateAmount` /
// `validateQuantityKg` validators. Optional fields treat "empty" as zero and
// only complain about genuinely malformed input, so traders are never
// blocked by a blank expense row.
// ---------------------------------------------------------------------------

export type OptionalNumber = { ok: true; value: number } | { ok: false; errorKey: string };

function parseOptionalDecimal(
  raw: string,
  opts: { maxDecimals: number; max: number },
): OptionalNumber {
  const text = normalizeDigits(raw)
    .trim()
    .replace(/[,，\s]/g, '');
  if (!text) return { ok: true, value: 0 };
  if (!/^\d+(\.\d+)?$/.test(text)) return { ok: false, errorKey: 'validation.amountInvalid' };
  const decimals = text.includes('.') ? (text.split('.')[1]?.length ?? 0) : 0;
  if (decimals > opts.maxDecimals) return { ok: false, errorKey: 'validation.amountInvalid' };
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0 || value > opts.max) {
    return { ok: false, errorKey: 'validation.amountTooLarge' };
  }
  return { ok: true, value };
}

/** Optional money field: blank → 0, else up to 2 decimals (paise). */
export function parseOptionalMoney(raw: string): OptionalNumber {
  return parseOptionalDecimal(raw, { maxDecimals: 2, max: 100_000_000 });
}

/** Commission percent: blank → 0, else 0–100 with up to 2 decimals. */
export function parseCommissionPct(raw: string): OptionalNumber {
  const parsed = parseOptionalDecimal(raw, { maxDecimals: 2, max: MAX_COMMISSION_PCT });
  if (!parsed.ok) {
    return parsed.errorKey === 'validation.amountTooLarge'
      ? { ok: false, errorKey: 'validation.percentInvalid' }
      : parsed;
  }
  return parsed;
}

/** Optional whole count (crates/bags): blank → null, else a positive integer. */
export function parseOptionalCount(
  raw: string,
): { ok: true; value: number | null } | { ok: false; errorKey: string } {
  const text = normalizeDigits(raw)
    .trim()
    .replace(/[,，\s]/g, '');
  if (!text) return { ok: true, value: null };
  if (!/^\d+$/.test(text)) return { ok: false, errorKey: 'validation.amountInvalid' };
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0 || value > 100000) {
    return { ok: false, errorKey: 'validation.amountInvalid' };
  }
  return { ok: true, value };
}
