import AsyncStorage from '@react-native-async-storage/async-storage';

import { addEntry } from '@/features/khata/repository';
import { shiftDateKey, todayKey } from '@/features/khata/types';
import { createPerson } from '@/features/people/repository';
import type { PersonDraft } from '@/features/people/types';

import { saveSaleWithKhata, type SaveSaleInput } from './saveSale';

/**
 * First-run demo seed — the ONLY demo path (no parallel in-memory stores).
 *
 * When Supabase is not configured AND the trader has no people yet (fresh
 * Expo Go install), `searchPeople` runs this once: four sample people, three
 * sample sales (saved through the real `saveSaleWithKhata`, so khata mirrors
 * are posted exactly like a trader's own sales), plus one cash collection
 * today so the dashboard shows a non-zero "collected today".
 *
 * Everything goes through the canonical repositories, so seeded rows live in
 * the same AsyncStorage caches as real rows: deletable, editable, and
 * replaced by Supabase data the moment env vars exist. Guarded by a flag —
 * deleting demo rows never reseeds them.
 */

const SEED_FLAG = 'mandi-demo-seeded-v1';

const DEMO_PEOPLE: PersonDraft[] = [
  { name: 'Ramesh Patil', phone: '9876543210', type: 'farmer', village: 'Shirpur' },
  { name: 'Sunita Pawar', phone: '9812345678', type: 'farmer', village: 'Lasalgaon' },
  { name: 'Anil Seth', phone: '9898989898', type: 'seller', village: 'Nashik' },
  { name: 'Kishor Jadhav', phone: null, type: 'other', village: 'Shirpur' },
];

interface DemoSaleSeed {
  personIndex: number;
  dayOffset: number;
  commodity: string;
  variety: string;
  qtyKg: number;
  crates: number;
  ratePerKg: number;
  hamali: number;
  tolai: number;
  commissionPct: number;
  transport: number;
  other: number;
}

const DEMO_SALES: DemoSaleSeed[] = [
  {
    personIndex: 0,
    dayOffset: 0,
    commodity: 'mosambi',
    variety: '1no',
    qtyKg: 120,
    crates: 12,
    ratePerKg: 45,
    hamali: 200,
    tolai: 50,
    commissionPct: 5,
    transport: 150,
    other: 0,
  },
  {
    personIndex: 1,
    dayOffset: 0,
    commodity: 'santra',
    variety: '2no',
    qtyKg: 85,
    crates: 9,
    ratePerKg: 32,
    hamali: 150,
    tolai: 40,
    commissionPct: 5,
    transport: 120,
    other: 0,
  },
  {
    personIndex: 1,
    dayOffset: -1,
    commodity: 'pyaz',
    variety: 'mota',
    qtyKg: 400,
    crates: 20,
    ratePerKg: 18,
    hamali: 300,
    tolai: 100,
    commissionPct: 4,
    transport: 400,
    other: 50,
  },
];

/** At-most-once seed. Safe to call from every list screen — flag first. */
export async function seedDemoData(): Promise<void> {
  try {
    if (await AsyncStorage.getItem(SEED_FLAG)) return;
    await AsyncStorage.setItem(SEED_FLAG, '1');
  } catch {
    return;
  }
  try {
    const people = [];
    for (const draft of DEMO_PEOPLE) {
      people.push(await createPerson(draft));
    }
    for (const seed of DEMO_SALES) {
      const person = people[seed.personIndex];
      if (!person) continue;
      const input: SaveSaleInput = {
        person_id: person.id,
        date: shiftDateKey(todayKey(), seed.dayOffset),
        commodity: seed.commodity,
        variety: seed.variety,
        crates: seed.crates,
        qtyKg: seed.qtyKg,
        ratePerKg: seed.ratePerKg,
        hamali: seed.hamali,
        tolai: seed.tolai,
        commissionPct: seed.commissionPct,
        transport: seed.transport,
        other: seed.other,
        photoLocalUri: null,
      };
      await saveSaleWithKhata(input);
    }
    const first = people[0];
    if (first) {
      await addEntry({
        person_id: first.id,
        date: todayKey(),
        kind: 'payment',
        amount: 2000,
        method: 'cash',
        note: null,
      });
    }
    // One credit so the dashboard demo shows BOTH sides (collect + pay).
    const third = people[2];
    if (third) {
      await addEntry({
        person_id: third.id,
        date: shiftDateKey(todayKey(), -1),
        kind: 'credit',
        amount: 4500,
        method: 'udhaar',
        note: 'demo: udhaar given',
      });
    }
  } catch {
    // Demo must never break the app — empty states cover a failed seed.
  }
}
