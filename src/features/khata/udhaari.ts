import type { Person } from '@/features/people/types';

import { computeBalance } from './repository';
import type { KhataEntry } from './types';

/**
 * Udhaari dashboard math — 100% pure, computed ONLY from `khata_entries`.
 * Convention (see `khata/repository`): positive balance = they owe me
 * (lena/collect), negative = I owe them (dena/pay).
 */

export interface DebtorRow {
  person: Person;
  /** Positive = they owe me. Only positive balances appear here. */
  balance: number;
}

export interface UdhaariSummary {
  /** Total others owe me (sum of positive balances). */
  toCollect: number;
  /** Total I owe others (sum of |negative| balances). */
  toPay: number;
  /** Payments received today (`kind === 'payment'` dated today). */
  todayCollection: number;
  /** Biggest debtors first, capped at `topN`. */
  debtors: DebtorRow[];
  /** People with a non-zero balance (for "all clear" empty state). */
  peopleWithBalance: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Summarize the whole ledger for the dashboard. People with no entries (or a
 * zero balance) are skipped; unknown person_ids (deleted people) are skipped.
 */
export function summarizeUdhaari(
  entries: KhataEntry[],
  people: Person[],
  todayISO: string,
  topN = 5,
): UdhaariSummary {
  const byPerson = new Map<string, Person>();
  for (const p of people) byPerson.set(p.id, p);

  const grouped = new Map<string, Pick<KhataEntry, 'kind' | 'amount'>[]>();
  for (const e of entries) {
    const list = grouped.get(e.person_id) ?? [];
    list.push(e);
    grouped.set(e.person_id, list);
  }

  let toCollect = 0;
  let toPay = 0;
  let peopleWithBalance = 0;
  const debtors: DebtorRow[] = [];

  for (const [personId, list] of grouped) {
    const balance = round2(computeBalance(list));
    if (balance === 0) continue;
    peopleWithBalance += 1;
    if (balance > 0) {
      toCollect = round2(toCollect + balance);
      const person = byPerson.get(personId);
      if (person) debtors.push({ person, balance });
    } else {
      toPay = round2(toPay + Math.abs(balance));
    }
  }
  debtors.sort((a, b) => b.balance - a.balance);

  let todayCollection = 0;
  for (const e of entries) {
    if (e.kind === 'payment' && e.date === todayISO) {
      todayCollection = round2(todayCollection + e.amount);
    }
  }

  return {
    toCollect,
    toPay,
    todayCollection,
    debtors: debtors.slice(0, topN),
    peopleWithBalance,
  };
}
