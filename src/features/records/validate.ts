import type { TFunction } from 'i18next';

import { validateAmount, validateQuantityKg } from '@/lib/validation';

import { parseCommissionPct, parseOptionalCount, parseOptionalMoney } from './calculations';

/**
 * Sale-form validation. Returns i18n KEYS (not translated strings), matching
 * the convention in `lib/validation` — screens translate with `t(key)`.
 * `parsed` is non-null only when every field is usable for saving.
 */

export interface SaleFormValues {
  personId: string | null;
  date: string;
  commodity: string;
  variety: string;
  qty: string;
  crates: string;
  rate: string;
  hamali: string;
  tolai: string;
  commissionPct: string;
  transport: string;
  other: string;
}

export interface SaleFormErrors {
  person?: string;
  qty?: string;
  crates?: string;
  rate?: string;
  hamali?: string;
  tolai?: string;
  commissionPct?: string;
  transport?: string;
  other?: string;
  /** Whole-form problem (e.g. expenses exceed the total). */
  general?: string;
}

export interface ParsedSale {
  qtyKg: number;
  crates: number | null;
  ratePerKg: number;
  hamali: number;
  tolai: number;
  commissionPct: number;
  transport: number;
  other: number;
}

/**
 * Translate a dynamic validation key. i18next's typed `t()` only accepts
 * literal keys, so the (safe) cast lives HERE — the single place that deals
 * in key strings — instead of at every call site. Returns null for no error.
 */
export function tv(t: TFunction, key: string | undefined): string | null {
  if (!key) return null;
  return (t as unknown as (k: string) => string)(key);
}

export function validateSaleForm(values: SaleFormValues): {
  errors: SaleFormErrors;
  parsed: ParsedSale | null;
} {
  const errors: SaleFormErrors = {};

  if (!values.personId) errors.person = 'validation.personRequired';

  const qty = validateQuantityKg(values.qty);
  if (!qty.ok) errors.qty = qty.errorKey;

  const crates = parseOptionalCount(values.crates);
  if (!crates.ok) errors.crates = crates.errorKey;

  const rate = validateAmount(values.rate);
  if (!rate.ok) errors.rate = rate.errorKey;

  const hamali = parseOptionalMoney(values.hamali);
  if (!hamali.ok) errors.hamali = hamali.errorKey;
  const tolai = parseOptionalMoney(values.tolai);
  if (!tolai.ok) errors.tolai = tolai.errorKey;
  const commissionPct = parseCommissionPct(values.commissionPct);
  if (!commissionPct.ok) errors.commissionPct = commissionPct.errorKey;
  const transport = parseOptionalMoney(values.transport);
  if (!transport.ok) errors.transport = transport.errorKey;
  const other = parseOptionalMoney(values.other);
  if (!other.ok) errors.other = other.errorKey;

  if (
    !qty.ok ||
    !crates.ok ||
    !rate.ok ||
    !hamali.ok ||
    !tolai.ok ||
    !commissionPct.ok ||
    !transport.ok ||
    !other.ok ||
    !values.personId
  ) {
    return { errors, parsed: null };
  }

  return {
    errors,
    parsed: {
      qtyKg: qty.value,
      crates: crates.value,
      ratePerKg: rate.value,
      hamali: hamali.value,
      tolai: tolai.value,
      commissionPct: commissionPct.value,
      transport: transport.value,
      other: other.value,
    },
  };
}
