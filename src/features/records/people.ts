import { filterPeople } from '@/features/people/types';
import { listPeople } from '@/features/people/repository';
import type { Person } from '@/features/people/types';
import { isSupabaseConfigured } from '@/lib/supabase';

import { seedDemoData } from './demo';

/**
 * Person lookup for the sale form, sales list, and dashboard (read-only use
 * of the people feature — the add-person UI belongs to another worker).
 *
 * Filtering reuses the canonical `filterPeople` (name + phone + village,
 * digit-normalised). On a fresh unconfigured install the list is empty, so
 * we run the at-most-once demo seed first — every screen stays explorable
 * in Expo Go with zero setup. `demo: true` tells callers the rows may be
 * seeded samples rather than the trader's own people.
 */

export interface PeopleResult {
  people: Person[];
  /** True when Supabase is unconfigured (rows may be seeded samples). */
  demo: boolean;
}

export async function searchPeople(query: string): Promise<PeopleResult> {
  const demo = !isSupabaseConfigured();
  if (demo) await seedDemoData();
  const live = await listPeople();
  return { people: filterPeople(live, query), demo };
}
