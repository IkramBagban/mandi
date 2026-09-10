import { listPeople } from '@/features/people/repository';
import type { Person } from '@/features/people/types';

import { DEMO_PEOPLE } from './demo';

/**
 * Person lookup for the sale form (and anything else that needs "everyone I
 * trade with" without owning the people feature).
 *
 * Tries the real people repository first; when Supabase is not configured yet
 * (the stub throws), falls back to clearly-labeled demo people so the sale
 * form and dashboard stay explorable in Expo Go. `demo: true` tells the UI
 * it is showing fallback data.
 */

export interface PeopleResult {
  people: Person[];
  /** True when these are demo stand-ins, not the trader's real people. */
  demo: boolean;
}

function matchesQuery(person: Person, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return person.name.toLowerCase().includes(q) || (person.village ?? '').toLowerCase().includes(q);
}

export async function searchPeople(query: string): Promise<PeopleResult> {
  try {
    const live = await listPeople();
    return { people: live.filter((p) => matchesQuery(p, query)), demo: false };
  } catch {
    return { people: DEMO_PEOPLE.filter((p) => matchesQuery(p, query)), demo: true };
  }
}
